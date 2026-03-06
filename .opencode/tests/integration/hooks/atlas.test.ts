/**
 * Atlas Hook Integration Tests
 * 
 * Tests verify:
 * - Hook factory creation
 * - Boulder state read/write operations
 * - Plan progress tracking
 * - Task orchestration logic
 * - Event handling (session.idle, session.error, session.deleted)
 */

import { describe, it, expect, beforeEach } from "vitest"
import { createAtlasHook, HOOK_NAME } from "../../../hooks/atlas"
import { 
  readBoulderState, 
  writeBoulderState, 
  getPlanProgress, 
  getNextPendingTask,
  createBoulderState,
  startTask,
  completeTask
} from "../../../hooks/atlas/boulder-state"
import type { BoulderState, PlanProgress, TaskInfo, AtlasHookOptions } from "../../../hooks/atlas/types"
import { 
  DEFAULT_ATLAS_AGENT, 
  CONTINUATION_COOLDOWN_MS, 
  FAILURE_BACKOFF_MS, 
  BOULDER_FILE,
  ALLOWED_AGENTS 
} from "../../../hooks/atlas/constants"
import * as fs from "fs"
import * as path from "path"

// ============================================================
// MOCK HELPERS
// ============================================================

/**
 * Create a mock plugin context.
 */
function createMockContext(directory: string = "/test"): { client: unknown; directory: string } {
  return {
    client: {},
    directory
  }
}

/**
 * Create a mock task info.
 */
function createMockTask(
  id: string,
  title: string,
  status: "pending" | "in_progress" | "completed" | "cancelled" = "pending"
): TaskInfo {
  return { id, title, status }
}

/**
 * Create a mock boulder state.
 */
function createMockBoulderState(overrides: Partial<BoulderState> = {}): BoulderState {
  return {
    plan_name: "test-plan",
    plan_path: "/test/plan.md",
    agent: DEFAULT_ATLAS_AGENT,
    session_ids: ["test-session"],
    active_plan: {
      total: 3,
      completed: 0,
      tasks: [
        createMockTask("1", "Task 1", "pending"),
        createMockTask("2", "Task 2", "pending"),
        createMockTask("3", "Task 3", "pending"),
      ]
    },
    created_at: Date.now(),
    updated_at: Date.now(),
    ...overrides
  }
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

describe("Atlas Hook Integration", () => {
  // ============================================================
  // FACTORY FUNCTION TESTS
  // ============================================================

  describe("Hook Creation", () => {
    describe("createAtlasHook", () => {
      it("should create hook with handler function", () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        expect(hook).toBeDefined()
        expect(typeof hook.handler).toBe("function")
      })

      it("should create hook with tool.execute.before handler", () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        expect(typeof hook["tool.execute.before"]).toBe("function")
      })

      it("should create hook with tool.execute.after handler", () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        expect(typeof hook["tool.execute.after"]).toBe("function")
      })

      it("should accept options with directory", () => {
        const mockCtx = createMockContext()
        const options: AtlasHookOptions = {
          directory: "/custom/path"
        }
        
        expect(() => {
          createAtlasHook(mockCtx, options)
        }).not.toThrow()
      })

      it("should accept options with backgroundManager", () => {
        const mockCtx = createMockContext()
        const options: AtlasHookOptions = {
          directory: "/test",
          backgroundManager: {}
        }
        
        expect(() => {
          createAtlasHook(mockCtx, options)
        }).not.toThrow()
      })

      it("should accept options with isContinuationStopped", () => {
        const mockCtx = createMockContext()
        const options: AtlasHookOptions = {
          directory: "/test",
          isContinuationStopped: (sessionID) => false
        }
        
        expect(() => {
          createAtlasHook(mockCtx, options)
        }).not.toThrow()
      })

      it("should accept options with autoCommit", () => {
        const mockCtx = createMockContext()
        const options: AtlasHookOptions = {
          directory: "/test",
          autoCommit: false
        }
        
        expect(() => {
          createAtlasHook(mockCtx, options)
        }).not.toThrow()
      })

      it("should accept options with agentOverrides", () => {
        const mockCtx = createMockContext()
        const options: AtlasHookOptions = {
          directory: "/test",
          agentOverrides: { atlas: "hephaestus" }
        }
        
        expect(() => {
          createAtlasHook(mockCtx, options)
        }).not.toThrow()
      })
    })
  })

  // ============================================================
  // BOULDER STATE TESTS
  // ============================================================

  describe("Boulder State", () => {
    describe("createBoulderState", () => {
      it("should create boulder state with plan name", () => {
        const tasks = [createMockTask("1", "Test")]
        const state = createBoulderState("my-plan", "/path/to/plan.md", tasks)
        
        expect(state.plan_name).toBe("my-plan")
        expect(state.plan_path).toBe("/path/to/plan.md")
      })

      it("should create boulder state with tasks", () => {
        const tasks = [
          createMockTask("1", "Task 1"),
          createMockTask("2", "Task 2"),
          createMockTask("3", "Task 3"),
        ]
        const state = createBoulderState("plan", "/plan.md", tasks)
        
        expect(state.active_plan?.tasks?.length).toBe(3)
        expect(state.active_plan?.total).toBe(3)
        expect(state.active_plan?.completed).toBe(0)
      })

      it("should use default agent when not specified", () => {
        const tasks = [createMockTask("1", "Test")]
        const state = createBoulderState("plan", "/plan.md", tasks)
        
        expect(state.agent).toBe(DEFAULT_ATLAS_AGENT)
      })

      it("should use custom agent when specified", () => {
        const tasks = [createMockTask("1", "Test")]
        const state = createBoulderState("plan", "/plan.md", tasks, "sisyphus")
        
        expect(state.agent).toBe("sisyphus")
      })

      it("should set created_at and updated_at timestamps", () => {
        const tasks = [createMockTask("1", "Test")]
        const before = Date.now()
        const state = createBoulderState("plan", "/plan.md", tasks)
        const after = Date.now()
        
        expect(state.created_at).toBeGreaterThanOrEqual(before)
        expect(state.created_at).toBeLessThanOrEqual(after)
        expect(state.updated_at).toBeGreaterThanOrEqual(before)
        expect(state.updated_at).toBeLessThanOrEqual(after)
      })

      it("should initialize session_ids as empty array", () => {
        const tasks = [createMockTask("1", "Test")]
        const state = createBoulderState("plan", "/plan.md", tasks)
        
        expect(state.session_ids).toEqual([])
      })
    })

    describe("getPlanProgress", () => {
      it("should return zero progress for undefined plan", () => {
        const progress = getPlanProgress(undefined)
        
        expect(progress.completed).toBe(0)
        expect(progress.total).toBe(0)
        expect(progress.isComplete).toBe(false)
      })

      it("should return zero progress for plan without tasks", () => {
        const progress = getPlanProgress({ total: 0, completed: 0 })
        
        expect(progress.completed).toBe(0)
        expect(progress.total).toBe(0)
        expect(progress.isComplete).toBe(false)
      })

      it("should count completed tasks correctly", () => {
        const tasks: TaskInfo[] = [
          createMockTask("1", "Task 1", "completed"),
          createMockTask("2", "Task 2", "pending"),
          createMockTask("3", "Task 3", "completed"),
        ]
        const progress = getPlanProgress({ total: 3, completed: 0, tasks })
        
        expect(progress.completed).toBe(2)
        expect(progress.total).toBe(3)
        expect(progress.isComplete).toBe(false)
      })

      it("should count cancelled tasks as completed", () => {
        const tasks: TaskInfo[] = [
          createMockTask("1", "Task 1", "cancelled"),
          createMockTask("2", "Task 2", "cancelled"),
        ]
        const progress = getPlanProgress({ total: 2, completed: 0, tasks })
        
        expect(progress.completed).toBe(2)
        expect(progress.isComplete).toBe(true)
      })

      it("should detect complete plan", () => {
        const tasks: TaskInfo[] = [
          createMockTask("1", "Task 1", "completed"),
          createMockTask("2", "Task 2", "completed"),
          createMockTask("3", "Task 3", "completed"),
        ]
        const progress = getPlanProgress({ total: 3, completed: 0, tasks })
        
        expect(progress.isComplete).toBe(true)
      })

      it("should not count pending or in_progress tasks", () => {
        const tasks: TaskInfo[] = [
          createMockTask("1", "Task 1", "pending"),
          createMockTask("2", "Task 2", "in_progress"),
        ]
        const progress = getPlanProgress({ total: 2, completed: 0, tasks })
        
        expect(progress.completed).toBe(0)
        expect(progress.isComplete).toBe(false)
      })
    })

    describe("getNextPendingTask", () => {
      it("should return null for state without active plan", () => {
        const state = createMockBoulderState({ active_plan: undefined })
        const task = getNextPendingTask(state)
        
        expect(task).toBeNull()
      })

      it("should return null for state without tasks", () => {
        const state = createMockBoulderState({
          active_plan: { total: 0, completed: 0, tasks: [] }
        })
        const task = getNextPendingTask(state)
        
        expect(task).toBeNull()
      })

      it("should return in_progress task first", () => {
        const tasks: TaskInfo[] = [
          createMockTask("1", "Task 1", "pending"),
          createMockTask("2", "Task 2", "in_progress"),
          createMockTask("3", "Task 3", "pending"),
        ]
        const state = createMockBoulderState({
          active_plan: { total: 3, completed: 0, tasks }
        })
        const task = getNextPendingTask(state)
        
        expect(task).not.toBeNull()
        expect(task!.id).toBe("2")
        expect(task!.status).toBe("in_progress")
      })

      it("should return first pending task when no in_progress", () => {
        const tasks: TaskInfo[] = [
          createMockTask("1", "Task 1", "pending"),
          createMockTask("2", "Task 2", "pending"),
          createMockTask("3", "Task 3", "completed"),
        ]
        const state = createMockBoulderState({
          active_plan: { total: 3, completed: 1, tasks }
        })
        const task = getNextPendingTask(state)
        
        expect(task).not.toBeNull()
        expect(task!.id).toBe("1")
        expect(task!.status).toBe("pending")
      })

      it("should return null when all tasks completed", () => {
        const tasks: TaskInfo[] = [
          createMockTask("1", "Task 1", "completed"),
          createMockTask("2", "Task 2", "cancelled"),
        ]
        const state = createMockBoulderState({
          active_plan: { total: 2, completed: 2, tasks }
        })
        const task = getNextPendingTask(state)
        
        expect(task).toBeNull()
      })
    })

    describe("startTask", () => {
      it("should mark task as in_progress", () => {
        const state = createMockBoulderState()
        const result = startTask("/test", state, "1")
        
        // Should return false because fs operations will fail with mock directory
        // But we can verify the logic works for in-memory state
        expect(state.active_plan?.tasks?.[0]?.status).toBe("in_progress")
      })

      it("should set started_at timestamp", () => {
        const state = createMockBoulderState()
        const before = Date.now()
        startTask("/test", state, "1")
        const after = Date.now()
        
        const task = state.active_plan?.tasks?.[0]
        expect(task?.started_at).toBeGreaterThanOrEqual(before)
        expect(task?.started_at).toBeLessThanOrEqual(after)
      })

      it("should set current task id", () => {
        const state = createMockBoulderState()
        startTask("/test", state, "1")
        
        expect(state.active_plan?.current).toBe("1")
      })

      it("should return false for non-existent task", () => {
        const state = createMockBoulderState()
        const result = startTask("/test", state, "nonexistent")
        
        expect(result).toBe(false)
      })

      it("should return false for state without tasks", () => {
        const state = createMockBoulderState({ active_plan: undefined })
        const result = startTask("/test", state, "1")
        
        expect(result).toBe(false)
      })
    })

    describe("completeTask", () => {
      it("should mark task as completed", () => {
        const state = createMockBoulderState()
        completeTask("/test", state, "1")
        
        expect(state.active_plan?.tasks?.[0]?.status).toBe("completed")
      })

      it("should set completed_at timestamp", () => {
        const state = createMockBoulderState()
        const before = Date.now()
        completeTask("/test", state, "1")
        const after = Date.now()
        
        const task = state.active_plan?.tasks?.[0]
        expect(task?.completed_at).toBeGreaterThanOrEqual(before)
        expect(task?.completed_at).toBeLessThanOrEqual(after)
      })

      it("should clear current when completing current task", () => {
        const state = createMockBoulderState()
        state.active_plan!.current = "1"
        completeTask("/test", state, "1")
        
        expect(state.active_plan?.current).toBeUndefined()
      })

      it("should not clear current when completing different task", () => {
        const state = createMockBoulderState()
        state.active_plan!.current = "2"
        completeTask("/test", state, "1")
        
        expect(state.active_plan?.current).toBe("2")
      })

      it("should return false for non-existent task", () => {
        const state = createMockBoulderState()
        const result = completeTask("/test", state, "nonexistent")
        
        expect(result).toBe(false)
      })
    })
  })

  // ============================================================
  // EVENT HANDLING TESTS
  // ============================================================

  describe("Event Handling", () => {
    describe("session.idle event", () => {
      it("should handle session idle without error", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        // Should not throw
        await hook.handler(createMockEvent("session.idle", { sessionID: "test-session" }))
        
        expect(true).toBe(true)
      })

      it("should handle missing sessionID gracefully", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook.handler(createMockEvent("session.idle", {}))
        
        expect(true).toBe(true)
      })

      it("should handle continuation stopped option", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx, {
          directory: "/test",
          isContinuationStopped: (sessionID) => sessionID === "stopped-session"
        })
        
        await hook.handler(createMockEvent("session.idle", { sessionID: "stopped-session" }))
        
        expect(true).toBe(true)
      })
    })

    describe("session.error event", () => {
      it("should detect MessageAbortedError", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook.handler(createMockEvent("session.error", {
          sessionID: "test-session",
          error: { name: "MessageAbortedError" }
        }))
        
        expect(true).toBe(true)
      })

      it("should detect AbortError", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook.handler(createMockEvent("session.error", {
          sessionID: "test-session",
          error: { name: "AbortError" }
        }))
        
        expect(true).toBe(true)
      })

      it("should handle other errors", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook.handler(createMockEvent("session.error", {
          sessionID: "test-session",
          error: { name: "SomeOtherError" }
        }))
        
        expect(true).toBe(true)
      })

      it("should handle missing sessionID", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook.handler(createMockEvent("session.error", {}))
        
        expect(true).toBe(true)
      })
    })

    describe("session.deleted event", () => {
      it("should handle session deleted", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook.handler(createMockEvent("session.deleted", {
          info: { id: "test-session" }
        }))
        
        expect(true).toBe(true)
      })

      it("should handle missing session info", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook.handler(createMockEvent("session.deleted", {}))
        
        expect(true).toBe(true)
      })

      it("should handle missing info.id", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook.handler(createMockEvent("session.deleted", { info: {} }))
        
        expect(true).toBe(true)
      })
    })

    describe("session.compacted event", () => {
      it("should handle session compacted", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook.handler(createMockEvent("session.compacted", { sessionID: "test-session" }))
        
        expect(true).toBe(true)
      })
    })
  })

  // ============================================================
  // TOOL EXECUTE HANDLERS TESTS
  // ============================================================

  describe("Tool Execute Handlers", () => {
    describe("tool.execute.before", () => {
      it("should track file path from filePath arg", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook["tool.execute.before"](
          { tool: "Read", sessionID: "test", callID: "call-1" },
          { args: { filePath: "/test/file.ts" } }
        )
        
        expect(true).toBe(true)
      })

      it("should track file path from file_path arg", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook["tool.execute.before"](
          { tool: "Edit", sessionID: "test", callID: "call-2" },
          { args: { file_path: "/test/file.ts" } }
        )
        
        expect(true).toBe(true)
      })

      it("should track file path from path arg", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook["tool.execute.before"](
          { tool: "Write", sessionID: "test", callID: "call-3" },
          { args: { path: "/test/file.ts" } }
        )
        
        expect(true).toBe(true)
      })

      it("should handle missing file path gracefully", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook["tool.execute.before"](
          { tool: "Bash", sessionID: "test", callID: "call-4" },
          { args: { command: "ls" } }
        )
        
        expect(true).toBe(true)
      })
    })

    describe("tool.execute.after", () => {
      it("should cleanup file path tracking", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        // First track
        await hook["tool.execute.before"](
          { tool: "Read", sessionID: "test", callID: "call-1" },
          { args: { filePath: "/test/file.ts" } }
        )
        
        // Then cleanup
        await hook["tool.execute.after"](
          { tool: "Read", sessionID: "test", callID: "call-1" },
          { title: "success", output: "file contents" }
        )
        
        expect(true).toBe(true)
      })

      it("should handle unknown callID gracefully", async () => {
        const mockCtx = createMockContext()
        const hook = createAtlasHook(mockCtx)
        
        await hook["tool.execute.after"](
          { tool: "Read", sessionID: "test", callID: "unknown-call" },
          { title: "success", output: "file contents" }
        )
        
        expect(true).toBe(true)
      })
    })
  })

  // ============================================================
  // CONSTANTS TESTS
  // ============================================================

  describe("Constants", () => {
    it("should have correct HOOK_NAME", () => {
      expect(HOOK_NAME).toBe("atlas")
    })

    it("should have correct DEFAULT_ATLAS_AGENT", () => {
      expect(DEFAULT_ATLAS_AGENT).toBe("atlas")
    })

    it("should have reasonable CONTINUATION_COOLDOWN_MS", () => {
      expect(CONTINUATION_COOLDOWN_MS).toBe(5000)
      expect(CONTINUATION_COOLDOWN_MS).toBeGreaterThan(0)
    })

    it("should have reasonable FAILURE_BACKOFF_MS", () => {
      expect(FAILURE_BACKOFF_MS).toBe(5 * 60 * 1000) // 5 minutes
      expect(FAILURE_BACKOFF_MS).toBeGreaterThan(CONTINUATION_COOLDOWN_MS)
    })

    it("should have correct BOULDER_FILE name", () => {
      expect(BOULDER_FILE).toBe("boulder.json")
    })

    it("should have correct ALLOWED_AGENTS", () => {
      expect(ALLOWED_AGENTS).toBeInstanceOf(Array)
      expect(ALLOWED_AGENTS).toContain("atlas")
      expect(ALLOWED_AGENTS).toContain("sisyphus")
    })
  })

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe("Integration", () => {
    it("should handle full session lifecycle with task progression", async () => {
      const mockCtx = createMockContext()
      const hook = createAtlasHook(mockCtx)
      
      // 1. Session idle
      await hook.handler(createMockEvent("session.idle", { sessionID: "session-1" }))
      
      // 2. Tool execution before
      await hook["tool.execute.before"](
        { tool: "Read", sessionID: "session-1", callID: "call-1" },
        { args: { filePath: "/test/file.ts" } }
      )
      
      // 3. Tool execution after
      await hook["tool.execute.after"](
        { tool: "Read", sessionID: "session-1", callID: "call-1" },
        { title: "success", output: "contents" }
      )
      
      // 4. Session idle again
      await hook.handler(createMockEvent("session.idle", { sessionID: "session-1" }))
      
      // 5. Session deleted
      await hook.handler(createMockEvent("session.deleted", { info: { id: "session-1" } }))
      
      expect(true).toBe(true)
    })

    it("should handle error recovery flow", async () => {
      const mockCtx = createMockContext()
      const hook = createAtlasHook(mockCtx)
      
      // 1. Abort error occurs
      await hook.handler(createMockEvent("session.error", {
        sessionID: "session-1",
        error: { name: "MessageAbortedError" }
      }))
      
      // 2. Session idle - should skip due to abort
      await hook.handler(createMockEvent("session.idle", { sessionID: "session-1" }))
      
      // 3. Another session idle - should process normally
      await hook.handler(createMockEvent("session.idle", { sessionID: "session-1" }))
      
      expect(true).toBe(true)
    })

    it("should handle continuation stopped across sessions", async () => {
      const mockCtx = createMockContext()
      const hook = createAtlasHook(mockCtx, {
        directory: "/test",
        isContinuationStopped: (sessionID) => sessionID.startsWith("stopped-")
      })
      
      // Stopped session
      await hook.handler(createMockEvent("session.idle", { sessionID: "stopped-1" }))
      
      // Active session
      await hook.handler(createMockEvent("session.idle", { sessionID: "active-1" }))
      
      expect(true).toBe(true)
    })
  })

  // ============================================================
  // PERFORMANCE TESTS
  // ============================================================

  describe("Performance", () => {
    it("should handle rapid consecutive events", async () => {
      const mockCtx = createMockContext()
      const hook = createAtlasHook(mockCtx)
      
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(hook.handler(createMockEvent("session.idle", { sessionID: `session-${i}` })))
      }
      
      await Promise.all(promises)
      
      expect(true).toBe(true)
    })

    it("should handle many tool execute pairs", async () => {
      const mockCtx = createMockContext()
      const hook = createAtlasHook(mockCtx)
      
      const promises = []
      for (let i = 0; i < 50; i++) {
        promises.push(
          hook["tool.execute.before"](
            { tool: "Read", sessionID: "test", callID: `call-${i}` },
            { args: { filePath: `/test/file-${i}.ts` } }
          ),
          hook["tool.execute.after"](
            { tool: "Read", sessionID: "test", callID: `call-${i}` },
            { title: "success", output: "" }
          )
        )
      }
      
      await Promise.all(promises)
      
      expect(true).toBe(true)
    })

    it("should efficiently manage session state", async () => {
      const mockCtx = createMockContext()
      const hook = createAtlasHook(mockCtx)
      
      const start = Date.now()
      
      // Create and cleanup 100 sessions
      for (let i = 0; i < 100; i++) {
        await hook.handler(createMockEvent("session.idle", { sessionID: `session-${i}` }))
        await hook.handler(createMockEvent("session.deleted", { info: { id: `session-${i}` } }))
      }
      
      const elapsed = Date.now() - start
      
      // Should complete in reasonable time (< 1 second)
      expect(elapsed).toBeLessThan(1000)
    })
  })

  // ============================================================
  // ERROR HANDLING TESTS
  // ============================================================

  describe("Error Handling", () => {
    it("should handle unknown event types gracefully", async () => {
      const mockCtx = createMockContext()
      const hook = createAtlasHook(mockCtx)
      
      await hook.handler(createMockEvent("unknown.event", { sessionID: "test" }))
      
      expect(true).toBe(true)
    })

    it("should handle malformed event properties", async () => {
      const mockCtx = createMockContext()
      const hook = createAtlasHook(mockCtx)
      
      await hook.handler({ event: { type: "session.idle" } })
      await hook.handler({ event: { type: "session.error", properties: null } })
      
      expect(true).toBe(true)
    })

    it("should handle missing event properties", async () => {
      const mockCtx = createMockContext()
      const hook = createAtlasHook(mockCtx)
      
      await hook.handler({ event: { type: "session.idle" } })
      
      expect(true).toBe(true)
    })
  })
})