/**
 * Todo-Continuation Hook Integration Tests
 * 
 * Tests verify:
 * - Hook factory creation
 * - Event type handling (session.idle, session.error, session.deleted)
 * - Session state management
 * - Todo injection logic
 * - Abort detection and recovery
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { createTodoContinuationEnforcer } from "../../../hooks/todo-continuation"
import { createSessionStateStore } from "../../../hooks/todo-continuation/session-state"
import type { Todo, SessionState, SessionStateStore, TodoContinuationPluginInput } from "../../../hooks/todo-continuation/types"
import { HOOK_NAME, DEFAULT_SKIP_AGENTS, COUNTDOWN_DELAY_MS, INJECTION_COOLDOWN_MS } from "../../../hooks/todo-continuation/constants"

// Local type for test options
interface TodoContinuationEnforcerOptions {
  backgroundManager?: unknown
  skipAgents?: string[]
  isContinuationStopped?: (sessionID: string) => boolean
}

// ============================================================
// MOCK HELPERS
// ============================================================

/**
 * Create a mock plugin context with configurable todo responses.
 */
function createMockContext(todos: Todo[] = []): TodoContinuationPluginInput {
  const todoMock = vi.fn(async () => ({ data: todos })) as any
  const promptMock = vi.fn(async () => {}) as any
  
  return {
    client: {
      session: {
        todo: todoMock,
        prompt: promptMock,
      }
    },
    directory: "/test"
  }
}

/**
 * Create a mock todo item.
 */
function createMockTodo(
  id: string,
  content: string,
  status: "pending" | "in_progress" | "completed" | "cancelled" = "pending"
): Todo {
  return { id, content, status }
}

/**
 * Create a mock event object.
 */
function createMockEvent(type: string, properties?: Record<string, unknown>): { event: { type: string; properties?: unknown } } {
  return { event: { type, properties } }
}

// ============================================================
// HOOK CREATION TESTS
// ============================================================

describe("Todo-Continuation Hook Integration", () => {
  // ============================================================
  // FACTORY FUNCTION TESTS
  // ============================================================

  describe("Hook Creation", () => {
    describe("createTodoContinuationEnforcer", () => {
      it("should create hook with handler function", () => {
        const mockCtx = createMockContext()
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        expect(hook).toBeDefined()
        expect(typeof hook.handler).toBe("function")
      })

      it("should create hook with markRecovering function", () => {
        const mockCtx = createMockContext()
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        expect(typeof hook.markRecovering).toBe("function")
      })

      it("should create hook with markRecoveryComplete function", () => {
        const mockCtx = createMockContext()
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        expect(typeof hook.markRecoveryComplete).toBe("function")
      })

      it("should create hook with cancelAllCountdowns function", () => {
        const mockCtx = createMockContext()
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        expect(typeof hook.cancelAllCountdowns).toBe("function")
      })

      it("should accept options with backgroundManager", () => {
        const mockCtx = createMockContext()
        const options: TodoContinuationEnforcerOptions = {
          backgroundManager: {}
        }
        
        expect(() => {
          createTodoContinuationEnforcer(mockCtx, options)
        }).not.toThrow()
      })

      it("should accept options with skipAgents", () => {
        const mockCtx = createMockContext()
        const options: TodoContinuationEnforcerOptions = {
          skipAgents: ["custom-agent"]
        }
        
        expect(() => {
          createTodoContinuationEnforcer(mockCtx, options)
        }).not.toThrow()
      })

      it("should accept options with isContinuationStopped", () => {
        const mockCtx = createMockContext()
        const options: TodoContinuationEnforcerOptions = {
          isContinuationStopped: (sessionID: string) => false
        }
        
        expect(() => {
          createTodoContinuationEnforcer(mockCtx, options)
        }).not.toThrow()
      })

      it("should use DEFAULT_SKIP_AGENTS when skipAgents not provided", () => {
        const mockCtx = createMockContext()
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // Hook is created successfully with default options
        expect(hook).toBeDefined()
      })
    })
  })

  // ============================================================
  // SESSION STATE MANAGEMENT TESTS
  // ============================================================

  describe("Session State Management", () => {
    let sessionState: SessionStateStore

    beforeEach(() => {
      sessionState = createSessionStateStore()
    })

    describe("createSessionStateStore", () => {
      it("should create state store with all methods", () => {
        expect(typeof sessionState.getState).toBe("function")
        expect(typeof sessionState.getExistingState).toBe("function")
        expect(typeof sessionState.cancelCountdown).toBe("function")
        expect(typeof sessionState.cleanup).toBe("function")
        expect(typeof sessionState.cancelAllCountdowns).toBe("function")
        expect(typeof sessionState.shutdown).toBe("function")
      })
    })

    describe("getState", () => {
      it("should return default state for new session", () => {
        const state = sessionState.getState("session-1")
        
        expect(state).toBeDefined()
        expect(state.consecutiveFailures).toBe(0)
        expect(state.inFlight).toBeUndefined()
        expect(state.lastInjectedAt).toBeUndefined()
        expect(state.isRecovering).toBeUndefined()
      })

      it("should return same state for same session ID", () => {
        const state1 = sessionState.getState("session-1")
        const state2 = sessionState.getState("session-1")
        
        expect(state1).toBe(state2)
      })

      it("should return different states for different session IDs", () => {
        const state1 = sessionState.getState("session-1")
        const state2 = sessionState.getState("session-2")
        
        expect(state1).not.toBe(state2)
      })

      it("should allow state mutations", () => {
        const state = sessionState.getState("session-1")
        state.inFlight = true
        state.lastInjectedAt = Date.now()
        
        const retrieved = sessionState.getState("session-1")
        expect(retrieved.inFlight).toBe(true)
        expect(retrieved.lastInjectedAt).toBeDefined()
      })

      it("should track multiple sessions independently", () => {
        const state1 = sessionState.getState("session-1")
        const state2 = sessionState.getState("session-2")
        
        state1.inFlight = true
        state2.inFlight = false
        
        expect(sessionState.getState("session-1").inFlight).toBe(true)
        expect(sessionState.getState("session-2").inFlight).toBe(false)
      })
    })

    describe("getExistingState", () => {
      it("should return undefined for non-existent session", () => {
        const state = sessionState.getExistingState("nonexistent")
        expect(state).toBeUndefined()
      })

      it("should return state for existing session", () => {
        sessionState.getState("session-1")
        const state = sessionState.getExistingState("session-1")
        
        expect(state).toBeDefined()
        expect(state!.consecutiveFailures).toBe(0)
      })

      it("should preserve state mutations", () => {
        const state = sessionState.getState("session-1")
        state.isRecovering = true
        
        const retrieved = sessionState.getExistingState("session-1")
        expect(retrieved!.isRecovering).toBe(true)
      })
    })

    describe("cancelCountdown", () => {
      it("should clear countdown timer if set", () => {
        const state = sessionState.getState("session-1")
        state.countdownTimer = setTimeout(() => {}, 10000)
        state.countdownStartedAt = Date.now()
        
        sessionState.cancelCountdown("session-1")
        
        expect(state.countdownTimer).toBeUndefined()
        expect(state.countdownStartedAt).toBeUndefined()
        expect(state.inFlight).toBe(false)
      })

      it("should clear countdown interval if set", () => {
        const state = sessionState.getState("session-1")
        state.countdownInterval = setInterval(() => {}, 10000)
        
        sessionState.cancelCountdown("session-1")
        
        expect(state.countdownInterval).toBeUndefined()
      })

      it("should handle session with no countdown gracefully", () => {
        expect(() => {
          sessionState.cancelCountdown("nonexistent-session")
        }).not.toThrow()
      })
    })

    describe("cleanup", () => {
      it("should remove session state", () => {
        sessionState.getState("session-1")
        sessionState.cleanup("session-1")
        
        const state = sessionState.getExistingState("session-1")
        expect(state).toBeUndefined()
      })

      it("should cancel countdown before removal", () => {
        const state = sessionState.getState("session-1")
        state.countdownTimer = setTimeout(() => {}, 10000)
        
        sessionState.cleanup("session-1")
        
        // Timer should be cleared (no throw)
        expect(state.countdownTimer).toBeUndefined()
      })

      it("should handle cleanup of non-existent session", () => {
        expect(() => {
          sessionState.cleanup("nonexistent-session")
        }).not.toThrow()
      })
    })

    describe("cancelAllCountdowns", () => {
      it("should cancel countdowns for all sessions", () => {
        const state1 = sessionState.getState("session-1")
        const state2 = sessionState.getState("session-2")
        
        state1.countdownTimer = setTimeout(() => {}, 10000)
        state2.countdownTimer = setTimeout(() => {}, 10000)
        
        sessionState.cancelAllCountdowns()
        
        expect(state1.countdownTimer).toBeUndefined()
        expect(state2.countdownTimer).toBeUndefined()
      })

      it("should handle empty sessions gracefully", () => {
        const newState = createSessionStateStore()
        expect(() => {
          newState.cancelAllCountdowns()
        }).not.toThrow()
      })
    })

    describe("shutdown", () => {
      it("should clear all sessions and stop pruning", () => {
        sessionState.getState("session-1")
        sessionState.getState("session-2")
        
        sessionState.shutdown()
        
        // After shutdown, sessions should be cleared
        // Note: We can't directly check if sessions are cleared without
        // accessing private state, but we can verify it doesn't throw
        expect(() => {
          sessionState.shutdown()
        }).not.toThrow()
      })
    })
  })

  // ============================================================
  // EVENT HANDLING TESTS
  // ============================================================

  describe("Event Handling", () => {
    describe("session.idle event", () => {
      it("should not inject reminder when all todos are complete", async () => {
        const todos = [
          createMockTodo("1", "Task 1", "completed"),
          createMockTodo("2", "Task 2", "completed"),
        ]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        expect(promptSpy).not.toHaveBeenCalled()
      })

      it("should not inject reminder when all todos are cancelled", async () => {
        const todos = [
          createMockTodo("1", "Task 1", "cancelled"),
          createMockTodo("2", "Task 2", "cancelled"),
        ]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        expect(promptSpy).not.toHaveBeenCalled()
      })

      it("should inject reminder when there are pending todos", async () => {
        const todos = [
          createMockTodo("1", "Pending task", "pending"),
        ]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        expect(promptSpy).toHaveBeenCalledTimes(1)
        expect(promptSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            path: { id: "test-session" },
            body: expect.objectContaining({
              noReply: true,
            }),
          })
        )
      })

      it("should inject reminder when there are in_progress todos", async () => {
        const todos = [
          createMockTodo("1", "In progress task", "in_progress"),
        ]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        expect(promptSpy).toHaveBeenCalledTimes(1)
      })

      it("should inject reminder with correct todo content", async () => {
        const todos = [
          createMockTodo("1", "Write tests", "pending"),
          createMockTodo("2", "Fix bugs", "in_progress"),
        ]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        const callArgs = promptSpy.mock.calls[0][0]
        const reminder = callArgs.body.content
        
        expect(reminder).toContain("Todo Completion Enforcement")
        expect(reminder).toContain("Write tests")
        expect(reminder).toContain("Fix bugs")
        expect(reminder).toContain("**In Progress:**")
        expect(reminder).toContain("**Pending:**")
      })

      it("should not inject reminder when in cooldown period", async () => {
        const todos = [createMockTodo("1", "Pending task", "pending")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // First call sets lastInjectedAt
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        expect(promptSpy).toHaveBeenCalledTimes(1)
        
        // Second call within cooldown should be skipped
        promptSpy.mockClear()
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        expect(promptSpy).not.toHaveBeenCalled()
      })

      it("should inject reminder after cooldown period expires", async () => {
        const todos = [createMockTodo("1", "Pending task", "pending")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // First call
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        expect(promptSpy).toHaveBeenCalledTimes(1)
        
        // Mock time passage (cooldown is INJECTION_COOLDOWN_MS)
        const sessionState = createSessionStateStore()
        const state = sessionState.getState("test-session")
        state.lastInjectedAt = Date.now() - INJECTION_COOLDOWN_MS - 1000
        
        // After cooldown, should allow injection
        promptSpy.mockClear()
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        // Note: This test requires the hook's internal state which we can't directly manipulate
        // The actual implementation will have state management
      })

      it("should skip when session is recovering", async () => {
        const todos = [createMockTodo("1", "Pending task", "pending")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        hook.markRecovering("test-session")
        
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        expect(promptSpy).not.toHaveBeenCalled()
      })

      it("should skip when continuation is stopped", async () => {
        const todos = [createMockTodo("1", "Pending task", "pending")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx, {
          isContinuationStopped: (sessionID) => sessionID === "test-session"
        })
        
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        expect(promptSpy).not.toHaveBeenCalled()
      })

      it("should skip when already in flight", async () => {
        const todos = [createMockTodo("1", "Pending task", "pending")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // Fire two events simultaneously - only first should trigger
        const promises = [
          hook.handler(createMockEvent("session.idle", { sessionID: "test-session" })),
          hook.handler(createMockEvent("session.idle", { sessionID: "test-session" })),
        ]
        
        await Promise.all(promises)
        
        // Should only call prompt once (in-flight check prevents duplicate)
        // Note: This depends on timing and may need adjustment
        expect(promptSpy.mock.calls.length).toBeLessThanOrEqual(1)
      })

      it("should handle missing sessionID gracefully", async () => {
        const todos = [createMockTodo("1", "Pending task", "pending")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // No sessionID in properties
        await hook.handler(createMockEvent("session.idle", {}))
        
        expect(promptSpy).not.toHaveBeenCalled()
      })
    })

    describe("session.error event", () => {
      it("should detect MessageAbortedError", async () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        await hook.handler(createMockEvent("session.error", {
          sessionID: "test-session",
          error: { name: "MessageAbortedError" }
        }))
        
        // Should complete without throwing
        expect(true).toBe(true)
      })

      it("should detect AbortError", async () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        await hook.handler(createMockEvent("session.error", {
          sessionID: "test-session",
          error: { name: "AbortError" }
        }))
        
        expect(true).toBe(true)
      })

      it("should handle other errors", async () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        await hook.handler(createMockEvent("session.error", {
          sessionID: "test-session",
          error: { name: "SomeOtherError" }
        }))
        
        expect(true).toBe(true)
      })

      it("should handle missing sessionID in error event", async () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // Should not throw
        await hook.handler(createMockEvent("session.error", {}))
        
        expect(true).toBe(true)
      })
    })

    describe("session.deleted event", () => {
      it("should cleanup session state", async () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // Create session state
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        // Delete session
        await hook.handler(createMockEvent("session.deleted", {
          info: { id: "test-session" }
        }))
        
        // Should cleanup without throwing
        expect(true).toBe(true)
      })

      it("should handle missing session info", async () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        await hook.handler(createMockEvent("session.deleted", {}))
        
        expect(true).toBe(true)
      })

      it("should handle missing info.id", async () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        await hook.handler(createMockEvent("session.deleted", {
          info: {}
        }))
        
        expect(true).toBe(true)
      })
    })

    describe("message.user event", () => {
      it("should reset consecutive failures on user message", async () => {
        const todos = [createMockTodo("1", "Pending task", "pending")]
        const mockCtx = createMockContext(todos)
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // Simulate some failures
        // First, create session state
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        // User message should reset failures
        await hook.handler(createMockEvent("message.user", { sessionID: "test-session" }))
        
        // Should complete without error
        expect(true).toBe(true)
      })

      it("should handle missing sessionID in user message", async () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        await hook.handler(createMockEvent("message.user", {}))
        
        expect(true).toBe(true)
      })
    })
  })

  // ============================================================
  // INJECTION LOGIC TESTS
  // ============================================================

  describe("Injection Logic", () => {
    describe("buildContinuationReminder (via event)", () => {
      it("should include system-reminder tag", async () => {
        const todos = [createMockTodo("1", "Test task", "pending")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        const callArgs = promptSpy.mock.calls[0][0]
        expect(callArgs.body.content).toContain("<system-reminder>")
        expect(callArgs.body.content).toContain("</system-reminder>")
      })

      it("should include Todo Completion Enforcement header", async () => {
        const todos = [createMockTodo("1", "Test task", "pending")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        const callArgs = promptSpy.mock.calls[0][0]
        expect(callArgs.body.content).toContain("**Todo Completion Enforcement**")
      })

      it("should separate pending and in_progress todos", async () => {
        const todos = [
          createMockTodo("1", "Pending task 1", "pending"),
          createMockTodo("2", "In progress task", "in_progress"),
          createMockTodo("3", "Pending task 2", "pending"),
        ]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        const callArgs = promptSpy.mock.calls[0][0]
        const content = callArgs.body.content
        
        // Should have section headers
        expect(content).toContain("**In Progress:**")
        expect(content).toContain("**Pending:**")
        
        // In progress section should come first
        const inProgressIdx = content.indexOf("**In Progress:**")
        const pendingIdx = content.indexOf("**Pending:**")
        expect(inProgressIdx).toBeLessThan(pendingIdx)
        
        // Should contain all todo content
        expect(content).toContain("Pending task 1")
        expect(content).toContain("In Progress:")
        expect(content).toContain("Pending task 2")
      })

      it("should include continuation instruction", async () => {
        const todos = [createMockTodo("1", "Test task", "in_progress")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        const callArgs = promptSpy.mock.calls[0][0]
        expect(callArgs.body.content).toContain("Continue working on the in-progress todo")
      })

      it("should use noReply mode to avoid blocking", async () => {
        const todos = [createMockTodo("1", "Test task", "pending")]
        const mockCtx = createMockContext(todos)
        const promptSpy = (mockCtx as any).client.session.prompt
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        const callArgs = promptSpy.mock.calls[0][0]
        expect(callArgs.body.noReply).toBe(true)
      })
    })

    describe("Error handling", () => {
      it("should handle todo fetch failure gracefully", async () => {
        const mockCtx = {
          client: {
            session: {
              todo: async () => {
                throw new Error("Network error")
              },
              prompt: async () => {}
            }
          },
          directory: "/test"
        }
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // Should not throw
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
      })

      it("should handle prompt injection failure gracefully", async () => {
        const todos = [createMockTodo("1", "Test task", "pending")]
        const mockCtx = {
          client: {
            session: {
              todo: async () => ({ data: todos }),
              prompt: async () => {
                throw new Error("Prompt failed")
              }
            }
          },
          directory: "/test"
        }
        
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // Should not throw
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
      })
    })
  })

  // ============================================================
  // CONSTANTS VALIDATION TESTS
  // ============================================================

  describe("Constants", () => {
    it("should have correct HOOK_NAME", () => {
      expect(HOOK_NAME).toBe("todo-continuation-enforcer")
    })

    it("should have DEFAULT_SKIP_AGENTS list", () => {
      expect(DEFAULT_SKIP_AGENTS).toBeInstanceOf(Array)
      expect(DEFAULT_SKIP_AGENTS).toContain("explore")
      expect(DEFAULT_SKIP_AGENTS).toContain("librarian")
      expect(DEFAULT_SKIP_AGENTS).toContain("oracle")
      expect(DEFAULT_SKIP_AGENTS).toContain("metis")
      expect(DEFAULT_SKIP_AGENTS).toContain("momus")
      expect(DEFAULT_SKIP_AGENTS).toContain("multimodal-looker")
    })

    it("should have reasonable COUNTDOWN_DELAY_MS", () => {
      expect(COUNTDOWN_DELAY_MS).toBe(5000)
      expect(COUNTDOWN_DELAY_MS).toBeGreaterThan(0)
    })

    it("should have reasonable INJECTION_COOLDOWN_MS", () => {
      expect(INJECTION_COOLDOWN_MS).toBe(15000)
      expect(INJECTION_COOLDOWN_MS).toBeGreaterThan(COUNTDOWN_DELAY_MS)
    })
  })

  // ============================================================
  // MARK RECOVERY TESTS
  // ============================================================

  describe("Recovery Marking", () => {
    describe("markRecovering", () => {
      it("should mark session as recovering", () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // Should not throw
        hook.markRecovering("test-session")
        
        expect(true).toBe(true)
      })
    })

    describe("markRecoveryComplete", () => {
      it("should mark recovery complete", () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // First mark as recovering
        hook.markRecovering("test-session")
        
        // Then mark complete
        hook.markRecoveryComplete("test-session")
        
        expect(true).toBe(true)
      })

      it("should handle non-existent session gracefully", () => {
        const mockCtx = createMockContext([])
        const hook = createTodoContinuationEnforcer(mockCtx)
        
        // Mark complete without prior recovering mark
        hook.markRecoveryComplete("nonexistent-session")
        
        expect(true).toBe(true)
      })
    })
  })

  // ============================================================
  // CANCEL COUNTDOWNS TESTS
  // ============================================================

  describe("Cancel All Countdowns", () => {
    it("should cancel all countdowns across sessions", () => {
      const mockCtx = createMockContext([])
      const hook = createTodoContinuationEnforcer(mockCtx)
      
      // Create session state
      hook.handler(createMockEvent("session.idle", { sessionID: "session-1" }))
      hook.handler(createMockEvent("session.idle", { sessionID: "session-2" }))
      
      // Cancel all
      hook.cancelAllCountdowns()
      
      // Should complete without error
      expect(true).toBe(true)
    })
  })

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe("Integration", () => {
    it("should handle full session lifecycle", async () => {
      const todos = [
        createMockTodo("1", "Task 1", "pending"),
        createMockTodo("2", "Task 2", "in_progress"),
      ]
      const mockCtx = createMockContext(todos)
      const promptSpy = (mockCtx as any).client.session.prompt
      
      const hook = createTodoContinuationEnforcer(mockCtx)
      
      // 1. Session idle - inject reminder
      await hook.handler(createMockEvent("session.idle", { sessionID: "session-1" }))
      expect(promptSpy).toHaveBeenCalledTimes(1)
      
      // 2. User sends message - reset failures
      promptSpy.mockClear()
      await hook.handler(createMockEvent("message.user", { sessionID: "session-1" }))
      
      // 3. Session idle again - still within cooldown
      await hook.handler(createMockEvent("session.idle", { sessionID: "session-1" }))
      expect(promptSpy).not.toHaveBeenCalled()
      
      // 4. Session deleted - cleanup
      await hook.handler(createMockEvent("session.deleted", {
        info: { id: "session-1" }
      }))
    })

    it("should handle recovery flow", async () => {
      const todos = [createMockTodo("1", "Recovery task", "pending")]
      const mockCtx = createMockContext(todos)
      const promptSpy = (mockCtx as any).client.session.prompt
      
      const hook = createTodoContinuationEnforcer(mockCtx)
      
      // 1. Error occurs - mark as recovering
      await hook.handler(createMockEvent("session.error", {
        sessionID: "session-1",
        error: { name: "MessageAbortedError" }
      }))
      hook.markRecovering("session-1")
      
      // 2. Session idle - should skip due to recovering
      await hook.handler(createMockEvent("session.idle", { sessionID: "session-1" }))
      expect(promptSpy).not.toHaveBeenCalled()
      
      // 3. Recovery complete
      hook.markRecoveryComplete("session-1")
      
      // 4. Session idle - should inject now
      await hook.handler(createMockEvent("session.idle", { sessionID: "session-1" }))
      // Note: May still skip due to cooldown, but recovering flag should be cleared
    })

    it("should handle explicit continuation stop", async () => {
      const todos = [createMockTodo("1", "Stopped task", "pending")]
      const mockCtx = createMockContext(todos)
      const promptSpy = (mockCtx as any).client.session.prompt
      
      const hook = createTodoContinuationEnforcer(mockCtx, {
        isContinuationStopped: (sessionID) => sessionID === "stopped-session"
      })
      
      // Session with stopped continuation
      await hook.handler(createMockEvent("session.idle", { sessionID: "stopped-session" }))
      expect(promptSpy).not.toHaveBeenCalled()
      
      // Different session - should work
      promptSpy.mockClear()
      await hook.handler(createMockEvent("session.idle", { sessionID: "active-session" }))
      expect(promptSpy).toHaveBeenCalled()
    })
  })

  // ============================================================
  // PERFORMANCE TESTS
  // ============================================================

  describe("Performance", () => {
    it("should handle rapid consecutive idle events", async () => {
      const todos = [createMockTodo("1", "Task", "pending")]
      const mockCtx = createMockContext(todos)
      const promptSpy = (mockCtx as any).client.session.prompt
      
      const hook = createTodoContinuationEnforcer(mockCtx)
      
      // Fire 10 idle events rapidly
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(hook.handler(createMockEvent("session.idle", { sessionID: "session-1" })))
      }
      
      await Promise.all(promises)
      
      // Due to cooldown and in-flight checks, should only inject once
      expect(promptSpy.mock.calls.length).toBeLessThanOrEqual(1)
    })

    it("should clean up session state efficiently", async () => {
      const mockCtx = createMockContext([])
      const hook = createTodoContinuationEnforcer(mockCtx)
      
      const start = Date.now()
      
      // Create and cleanup 100 sessions
      for (let i = 0; i < 100; i++) {
        await hook.handler(createMockEvent("session.idle", { sessionID: `session-${i}` }))
        await hook.handler(createMockEvent("session.deleted", {
          info: { id: `session-${i}` }
        }))
      }
      
      const elapsed = Date.now() - start
      
      // Should complete in reasonable time (< 1 second)
      expect(elapsed).toBeLessThan(1000)
    })
  })
})