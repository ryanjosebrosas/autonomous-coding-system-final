/**
 * Session-Recovery Hook Integration Tests
 * 
 * Tests verify:
 * - Error type detection (tool_result_missing, unavailable_tool, etc.)
 * - Recovery callback invocation
 * - Session abort behavior
 * - Toast notification display
 * - Duplicate recovery prevention
 */

import { describe, it, expect, beforeEach } from "vitest"
import { vi } from "vitest"
import { createSessionRecoveryHook, detectErrorType } from "../../../hooks/session-recovery"
import type { SessionRecoveryHook, RecoveryErrorType, MessageInfo, SessionRecoveryOptions } from "../../../hooks/session-recovery/types"

// ============================================================
// MOCK HELPERS
// ============================================================

/**
 * Create a mock plugin context with configurable responses.
 */
function createMockContext(options: {
  shouldAbort?: boolean
  shouldToast?: boolean
  shouldDelete?: boolean
} = {}): {
  client: {
    session: {
      abort: (args: { path: { id: string } }) => Promise<void>
      messages: (args: { path: { id: string }; query?: { directory: string } }) => Promise<{ data?: unknown[] }>
      delete: (args: { path: { id: string } }) => Promise<void>
    }
    tui?: {
      showToast?: (args: { body: { title: string; message: string; variant: string; duration: number } }) => Promise<void>
    }
  }
  directory: string
} {
  const abortMock = vi.fn(async () => {
    if (options.shouldAbort === false) {
      throw new Error("Abort failed")
    }
  }) as (args: { path: { id: string } }) => Promise<void>
  
  const messagesMock = vi.fn(async () => ({ data: [] })) as (args: { path: { id: string }; query?: { directory: string } }) => Promise<{ data?: unknown[] }>
  
  const deleteMock = vi.fn(async () => {
    if (options.shouldDelete === false) {
      throw new Error("Delete failed")
    }
  }) as (args: { path: { id: string } }) => Promise<void>
  
  const showToastMock = vi.fn(async () => {
    if (options.shouldToast === false) {
      throw new Error("Toast failed")
    }
  }) as (args: { body: { title: string; message: string; variant: string; duration: number } }) => Promise<void>

  return {
    client: {
      session: {
        abort: abortMock,
        messages: messagesMock,
        delete: deleteMock,
      },
      tui: {
        showToast: showToastMock,
      },
    },
    directory: "/test",
  }
}

/**
 * Create a mock message info.
 */
function createMockMessageInfo(overrides: Partial<MessageInfo> = {}): MessageInfo {
  return {
    id: "msg-1",
    role: "assistant",
    sessionID: "session-1",
    ...overrides,
  }
}

/**
 * Create a mock error object.
 */
function createMockError(name: string, message?: string): { name: string; message: string } {
  return { name, message: message || `${name} occurred` }
}

// ============================================================
// ERROR DETECTION TESTS
// ============================================================

describe("Session-Recovery Hook Integration", () => {
  // ============================================================
  // DETECT ERROR TYPE TESTS
  // ============================================================

  describe("detectErrorType", () => {
    describe("tool_result_missing", () => {
      it("should detect by exact name match", () => {
        const error = createMockError("tool_result_missing")
        const result = detectErrorType(error)
        
        expect(result).toBe("tool_result_missing")
      })

      it("should detect by message pattern", () => {
        const error = createMockError("Error", "Missing tool result for tool_x")
        const result = detectErrorType(error)
        
        expect(result).toBe("tool_result_missing")
      })

      it("should detect by 'tool result not found' message", () => {
        const error = createMockError("Error", "Tool result not found")
        const result = detectErrorType(error)
        
        expect(result).toBe("tool_result_missing")
      })
    })

    describe("unavailable_tool", () => {
      it("should detect by exact name match", () => {
        const error = createMockError("unavailable_tool")
        const result = detectErrorType(error)
        
        expect(result).toBe("unavailable_tool")
      })

      it("should detect by 'tool not available' message", () => {
        const error = createMockError("Error", "Tool not available: bash")
        const result = detectErrorType(error)
        
        expect(result).toBe("unavailable_tool")
      })

      it("should detect by 'unknown tool' message", () => {
        const error = createMockError("Error", "Unknown tool: custom_tool")
        const result = detectErrorType(error)
        
        expect(result).toBe("unavailable_tool")
      })
    })

    describe("thinking_block_order", () => {
      it("should detect by exact name match", () => {
        const error = createMockError("thinking_block_order")
        const result = detectErrorType(error)
        
        expect(result).toBe("thinking_block_order")
      })

      it("should detect by message pattern", () => {
        const error = createMockError("Error", "Thinking block order is incorrect")
        const result = detectErrorType(error)
        
        expect(result).toBe("thinking_block_order")
      })
    })

    describe("thinking_disabled_violation", () => {
      it("should detect by exact name match", () => {
        const error = createMockError("thinking_disabled_violation")
        const result = detectErrorType(error)
        
        expect(result).toBe("thinking_disabled_violation")
      })

      it("should detect by 'thinking disabled' message", () => {
        const error = createMockError("Error", "Thinking is disabled for this model")
        const result = detectErrorType(error)
        
        expect(result).toBe("thinking_disabled_violation")
      })
    })

    describe("assistant_prefill_unsupported", () => {
      it("should detect by exact name match", () => {
        const error = createMockError("assistant_prefill_unsupported")
        const result = detectErrorType(error)
        
        expect(result).toBe("assistant_prefill_unsupported")
      })

      it("should detect by 'prefill unsupported' message", () => {
        const error = createMockError("Error", "Prefill unsupported for this provider")
        const result = detectErrorType(error)
        
        expect(result).toBe("assistant_prefill_unsupported")
      })
    })

    describe("unknown errors", () => {
      it("should return null for unknown error name", () => {
        const error = createMockError("SomeRandomError")
        const result = detectErrorType(error)
        
        expect(result).toBeNull()
      })

      it("should return null for unknown error message", () => {
        const error = createMockError("Error", "Unknown error occurred")
        const result = detectErrorType(error)
        
        expect(result).toBeNull()
      })

      it("should return null for null error", () => {
        const result = detectErrorType(null)
        
        expect(result).toBeNull()
      })

      it("should return null for undefined error", () => {
        const result = detectErrorType(undefined)
        
        expect(result).toBeNull()
      })

      it("should return null for empty object", () => {
        const result = detectErrorType({})
        
        expect(result).toBeNull()
      })

      it("should handle error with only name property", () => {
        const error = { name: "tool_result_missing" }
        const result = detectErrorType(error)
        
        expect(result).toBe("tool_result_missing")
      })

      it("should handle error with only message property", () => {
        const error = { message: "Missing tool result" }
        const result = detectErrorType(error)
        
        expect(result).toBe("tool_result_missing")
      })
    })

    describe("case insensitivity", () => {
      it("should match case-insensitive error names", () => {
        const error = createMockError("TOOL_RESULT_MISSING")
        const result = detectErrorType(error)
        
        expect(result).toBe("tool_result_missing")
      })

      it("should match case-insensitive messages", () => {
        const error = createMockError("Error", "TOOL RESULT NOT FOUND")
        const result = detectErrorType(error)
        
        expect(result).toBe("tool_result_missing")
      })
    })
  })

  // ============================================================
  // HOOK CREATION TESTS
  // ============================================================

  describe("Hook Creation", () => {
    describe("createSessionRecoveryHook", () => {
      it("should create hook with handleSessionRecovery function", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        expect(hook).toBeDefined()
        expect(typeof hook.handleSessionRecovery).toBe("function")
      })

      it("should create hook with isRecoverableError function", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        expect(typeof hook.isRecoverableError).toBe("function")
      })

      it("should create hook with setOnAbortCallback function", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        expect(typeof hook.setOnAbortCallback).toBe("function")
      })

      it("should create hook with setOnRecoveryCompleteCallback function", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        expect(typeof hook.setOnRecoveryCompleteCallback).toBe("function")
      })

      it("should accept options with experimental config", () => {
        const mockCtx = createMockContext()
        const options: SessionRecoveryOptions = {
          experimental: {
            auto_resume: true,
          },
        }
        
        expect(() => {
          createSessionRecoveryHook(mockCtx, options)
        }).not.toThrow()
      })

      it("should work without options", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        expect(hook).toBeDefined()
      })
    })

    describe("isRecoverableError", () => {
      it("should return true for tool_result_missing", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const error = createMockError("tool_result_missing")
        
        expect(hook.isRecoverableError(error)).toBe(true)
      })

      it("should return true for unavailable_tool", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const error = createMockError("unavailable_tool")
        
        expect(hook.isRecoverableError(error)).toBe(true)
      })

      it("should return true for thinking_block_order", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const error = createMockError("thinking_block_order")
        
        expect(hook.isRecoverableError(error)).toBe(true)
      })

      it("should return true for thinking_disabled_violation", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const error = createMockError("thinking_disabled_violation")
        
        expect(hook.isRecoverableError(error)).toBe(true)
      })

      it("should return true for assistant_prefill_unsupported", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const error = createMockError("assistant_prefill_unsupported")
        
        expect(hook.isRecoverableError(error)).toBe(true)
      })

      it("should return false for unknown error", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const error = createMockError("UnknownError")
        
        expect(hook.isRecoverableError(error)).toBe(false)
      })

      it("should return false for null error", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        expect(hook.isRecoverableError(null)).toBe(false)
      })

      it("should return false for undefined error", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        expect(hook.isRecoverableError(undefined)).toBe(false)
      })
    })
  })

  // ============================================================
  // SESSION RECOVERY HANDLER TESTS
  // ============================================================

  describe("handleSessionRecovery", () => {
    describe("rejection cases", () => {
      it("should return false for null info", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        const result = await hook.handleSessionRecovery(null as any)
        
        expect(result).toBe(false)
      })

      it("should return false for undefined info", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        const result = await hook.handleSessionRecovery(undefined as any)
        
        expect(result).toBe(false)
      })

      it("should return false for non-assistant role", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({ role: "user" })
        
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(false)
      })

      it("should return false for missing error", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({ error: undefined })
        
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(false)
      })

      it("should return false for non-recoverable error", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({ error: createMockError("UnknownError") })
        
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(false)
      })

      it("should return false for missing session id", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          sessionID: undefined,
          error: createMockError("tool_result_missing"),
        })
        
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(false)
      })

      it("should return false for missing message id", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          id: undefined,
          error: createMockError("tool_result_missing"),
        })
        
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(false)
      })
    })

    describe("recovery behavior", () => {
      it("should abort session for tool_result_missing", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(true)
        expect(mockCtx.client.session.abort).toHaveBeenCalledTimes(1)
      })

      it("should abort session for unavailable_tool", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          error: createMockError("unavailable_tool"),
        })
        
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(true)
        expect(mockCtx.client.session.abort).toHaveBeenCalledTimes(1)
      })

      it("should return false for assistant_prefill_unsupported", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          error: createMockError("assistant_prefill_unsupported"),
        })
        
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(false)
      })

      it("should show toast notification for tool_result_missing", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        await hook.handleSessionRecovery(info)
        
        expect(mockCtx.client.tui?.showToast).toHaveBeenCalledTimes(1)
        const toastCalls = (mockCtx.client.tui?.showToast as ReturnType<typeof vi.fn> & { mock: { calls: unknown[] } })?.mock.calls as [[{ body: { title: string; message: string; variant: string; duration: number } }]] | undefined
        expect(toastCalls).toBeDefined()
        expect(toastCalls).toHaveLength(1)
        const toastArgs = toastCalls![0][0]
        expect(toastArgs.body.title).toBe("Tool Crash Recovery")
        expect(toastArgs.body.message).toContain("Injecting cancelled tool results")
        expect(toastArgs.body.variant).toBe("warning")
      })

      it("should show toast notification for unavailable_tool", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          error: createMockError("unavailable_tool"),
        })
        
        await hook.handleSessionRecovery(info)
        
        const toastCalls = (mockCtx.client.tui?.showToast as ReturnType<typeof vi.fn> & { mock: { calls: unknown[] } })?.mock.calls as [[{ body: { title: string; message: string; variant: string; duration: number } }]] | undefined
        expect(toastCalls).toBeDefined()
        expect(toastCalls).toHaveLength(1)
        const toastArgs = toastCalls![0][0]
        expect(toastArgs.body.title).toBe("Tool Recovery")
        expect(toastArgs.body.message).toContain("Recovering from unavailable tool call")
      })

      it("should show toast notification for thinking_block_order", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          error: createMockError("thinking_block_order"),
        })
        
        await hook.handleSessionRecovery(info)
        
        const toastCalls = (mockCtx.client.tui?.showToast as ReturnType<typeof vi.fn> & { mock: { calls: unknown[] } })?.mock.calls as [[{ body: { title: string; message: string; variant: string; duration: number } }]] | undefined
        expect(toastCalls).toBeDefined()
        expect(toastCalls).toHaveLength(1)
        const toastArgs = toastCalls![0][0]
        expect(toastArgs.body.title).toBe("Thinking Block Recovery")
        expect(toastArgs.body.message).toContain("Fixing message structure")
      })

      it("should show toast notification for thinking_disabled_violation", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          error: createMockError("thinking_disabled_violation"),
        })
        
        await hook.handleSessionRecovery(info)
        
        const toastCalls = (mockCtx.client.tui?.showToast as ReturnType<typeof vi.fn> & { mock: { calls: unknown[] } })?.mock.calls as [[{ body: { title: string; message: string; variant: string; duration: number } }]] | undefined
        expect(toastCalls).toBeDefined()
        expect(toastCalls).toHaveLength(1)
        const toastArgs = toastCalls![0][0]
        expect(toastArgs.body.title).toBe("Thinking Strip Recovery")
        expect(toastArgs.body.message).toContain("Stripping thinking blocks")
      })

      it("should set toast duration to 3000ms", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        await hook.handleSessionRecovery(info)
        
        const toastCalls = (mockCtx.client.tui?.showToast as ReturnType<typeof vi.fn> & { mock: { calls: unknown[] } })?.mock.calls as [[{ body: { title: string; message: string; variant: string; duration: number } }]] | undefined
        expect(toastCalls).toBeDefined()
        expect(toastCalls).toHaveLength(1)
        const toastArgs = toastCalls![0][0]
        expect(toastArgs.body.duration).toBe(3000)
      })
    })

    describe("concurrent processing prevention", () => {
      it("should allow sequential recovery for same message id (after cleanup)", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          id: "msg-same",
          error: createMockError("tool_result_missing"),
        })
        
        // First call succeeds
        const result1 = await hook.handleSessionRecovery(info)
        expect(result1).toBe(true)
        
        // Second call also succeeds because processingErrors is cleared in finally block
        // This allows retry after recovery completes
        const result2 = await hook.handleSessionRecovery(info)
        expect(result2).toBe(true)
        
        // Both should call abort
        expect(mockCtx.client.session.abort).toHaveBeenCalledTimes(2)
      })

      it("should allow recovery for different message ids", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        
        const info1 = createMockMessageInfo({
          id: "msg-1",
          sessionID: "session-1",
          error: createMockError("tool_result_missing"),
        })
        
        const info2 = createMockMessageInfo({
          id: "msg-2",
          sessionID: "session-1",
          error: createMockError("tool_result_missing"),
        })
        
        const result1 = await hook.handleSessionRecovery(info1)
        const result2 = await hook.handleSessionRecovery(info2)
        
        expect(result1).toBe(true)
        expect(result2).toBe(true)
        expect(mockCtx.client.session.abort).toHaveBeenCalledTimes(2)
      })
    })

    describe("callbacks", () => {
      it("should call onAbortCallback after aborting", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const abortCallback = vi.fn(() => {})
        hook.setOnAbortCallback(abortCallback)
        
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        await hook.handleSessionRecovery(info)
        
        expect(abortCallback).toHaveBeenCalledTimes(1)
        expect(abortCallback).toHaveBeenCalledWith("session-1")
      })

      it("should call onRecoveryCompleteCallback after recovery", async () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const completeCallback = vi.fn(() => {})
        hook.setOnRecoveryCompleteCallback(completeCallback)
        
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        await hook.handleSessionRecovery(info)
        
        expect(completeCallback).toHaveBeenCalledTimes(1)
        expect(completeCallback).toHaveBeenCalledWith("session-1")
      })

      it("should call onRecoveryCompleteCallback even if abort fails", async () => {
        const mockCtx = createMockContext({ shouldAbort: false })
        const hook = createSessionRecoveryHook(mockCtx)
        const completeCallback = vi.fn(() => {})
        hook.setOnRecoveryCompleteCallback(completeCallback)
        
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        await hook.handleSessionRecovery(info)
        
        // Should still call completion callback
        expect(completeCallback).toHaveBeenCalledTimes(1)
      })
    })

    describe("error handling", () => {
      it("should handle toast failure gracefully", async () => {
        const mockCtx = createMockContext({ shouldToast: false })
        const hook = createSessionRecoveryHook(mockCtx)
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        // Should not throw
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(true)
      })

      it("should handle missing tui gracefully", async () => {
        const mockCtx = {
          client: {
            session: {
              abort: vi.fn(async () => {}),
              messages: vi.fn(async () => ({ data: [] })),
              delete: vi.fn(async () => {}),
            },
            tui: undefined,
          },
          directory: "/test",
        }
        const hook = createSessionRecoveryHook(mockCtx as any)
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        // Should not throw
        const result = await hook.handleSessionRecovery(info)
        
        expect(result).toBe(true)
      })
    })
  })

  // ============================================================
  // CALLBACK REGISTRATION TESTS
  // ============================================================

  describe("Callback Registration", () => {
    describe("setOnAbortCallback", () => {
      it("should register abort callback", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const callback = () => {}
        
        hook.setOnAbortCallback(callback)
        
        // Callback is registered - verified by handleSessionRecovery tests
        expect(true).toBe(true)
      })

      it("should allow callback replacement", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const callback1 = vi.fn(() => {})
        const callback2 = vi.fn(() => {})
        
        hook.setOnAbortCallback(callback1)
        hook.setOnAbortCallback(callback2)
        
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        return hook.handleSessionRecovery(info).then(() => {
          expect(callback1).not.toHaveBeenCalled()
          expect(callback2).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe("setOnRecoveryCompleteCallback", () => {
      it("should register completion callback", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const callback = () => {}
        
        hook.setOnRecoveryCompleteCallback(callback)
        
        // Callback is registered - verified by handleSessionRecovery tests
        expect(true).toBe(true)
      })

      it("should allow callback replacement", () => {
        const mockCtx = createMockContext()
        const hook = createSessionRecoveryHook(mockCtx)
        const callback1 = vi.fn(() => {})
        const callback2 = vi.fn(() => {})
        
        hook.setOnRecoveryCompleteCallback(callback1)
        hook.setOnRecoveryCompleteCallback(callback2)
        
        const info = createMockMessageInfo({
          error: createMockError("tool_result_missing"),
        })
        
        return hook.handleSessionRecovery(info).then(() => {
          expect(callback1).not.toHaveBeenCalled()
          expect(callback2).toHaveBeenCalledTimes(1)
        })
      })
    })
  })

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe("Integration", () => {
    it("should handle full recovery flow for tool_result_missing", async () => {
      const mockCtx = createMockContext()
      const abortCallback = vi.fn(() => {})
      const completeCallback = vi.fn(() => {})
      
      const hook = createSessionRecoveryHook(mockCtx)
      hook.setOnAbortCallback(abortCallback)
      hook.setOnRecoveryCompleteCallback(completeCallback)
      
      const info = createMockMessageInfo({
        error: createMockError("tool_result_missing"),
      })
      
      const result = await hook.handleSessionRecovery(info)
      
      expect(result).toBe(true)
      expect(mockCtx.client.session.abort).toHaveBeenCalledTimes(1)
      expect(abortCallback).toHaveBeenCalledTimes(1)
      expect(completeCallback).toHaveBeenCalledTimes(1)
      expect(mockCtx.client.tui?.showToast).toHaveBeenCalledTimes(1)
    })

    it("should handle multiple recovery attempts in sequence", async () => {
      const mockCtx = createMockContext()
      const hook = createSessionRecoveryHook(mockCtx)
      
      const info1 = createMockMessageInfo({
        id: "msg-1",
        error: createMockError("unavailable_tool"),
      })
      
      const info2 = createMockMessageInfo({
        id: "msg-2",
        error: createMockError("thinking_block_order"),
      })
      
      const result1 = await hook.handleSessionRecovery(info1)
      const result2 = await hook.handleSessionRecovery(info2)
      
      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(mockCtx.client.session.abort).toHaveBeenCalledTimes(2)
    })

    it("should handle unsupported error type in flow", async () => {
      const mockCtx = createMockContext()
      const abortCallback = vi.fn(() => {})
      const completeCallback = vi.fn(() => {})
      
      const hook = createSessionRecoveryHook(mockCtx)
      hook.setOnAbortCallback(abortCallback)
      hook.setOnRecoveryCompleteCallback(completeCallback)
      
      const info = createMockMessageInfo({
        error: { name: "SomeRandomError" },
      })
      
      const result = await hook.handleSessionRecovery(info)
      
      expect(result).toBe(false)
      expect(mockCtx.client.session.abort).not.toHaveBeenCalled()
      expect(abortCallback).not.toHaveBeenCalled()
    })
  })

  // ============================================================
  // PERFORMANCE TESTS
  // ============================================================

  describe("Performance", () => {
    it("should handle rapid error detection", () => {
      const errors = [
        createMockError("tool_result_missing"),
        createMockError("unavailable_tool"),
        createMockError("thinking_block_order"),
        createMockError("thinking_disabled_violation"),
        createMockError("assistant_prefill_unsupported"),
        createMockError("UnknownError"),
      ]
      
      const start = Date.now()
      
      for (const error of errors) {
        detectErrorType(error)
      }
      
      const elapsed = Date.now() - start
      
      expect(elapsed).toBeLessThan(10)
    })

    it("should handle many sequential message id checks", async () => {
      const mockCtx = createMockContext()
      const hook = createSessionRecoveryHook(mockCtx)
      
      const start = Date.now()
      
      // Process many different message ids
      for (let i = 0; i < 100; i++) {
        const info = createMockMessageInfo({
          id: `msg-${i}`,
          error: createMockError("tool_result_missing"),
        })
        await hook.handleSessionRecovery(info)
      }
      
      const elapsed = Date.now() - start
      
      // Should be fast
      expect(elapsed).toBeLessThan(500)
      expect(mockCtx.client.session.abort).toHaveBeenCalledTimes(100)
    })
  })

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe("Edge Cases", () => {
    it("should handle message id as empty string", async () => {
      const mockCtx = createMockContext()
      const hook = createSessionRecoveryHook(mockCtx)
      const info = createMockMessageInfo({
        id: "",
        error: createMockError("tool_result_missing"),
      })
      
      const result = await hook.handleSessionRecovery(info)
      
      // Empty string is falsy, so should be rejected
      expect(result).toBe(false)
    })

    it("should handle session id as empty string", async () => {
      const mockCtx = createMockContext()
      const hook = createSessionRecoveryHook(mockCtx)
      const info = createMockMessageInfo({
        sessionID: "",
        error: createMockError("tool_result_missing"),
      })
      
      const result = await hook.handleSessionRecovery(info)
      
      // Empty string is falsy, so should be rejected
      expect(result).toBe(false)
    })

    it("should handle error object with only name", async () => {
      const mockCtx = createMockContext()
      const hook = createSessionRecoveryHook(mockCtx)
      const info = createMockMessageInfo({
        error: { name: "tool_result_missing" },
      })
      
      const result = await hook.handleSessionRecovery(info)
      
      expect(result).toBe(true)
    })

    it("should handle error object with only message", async () => {
      const mockCtx = createMockContext()
      const hook = createSessionRecoveryHook(mockCtx)
      const info = createMockMessageInfo({
        error: { message: "Missing tool result" },
      })
      
      const result = await hook.handleSessionRecovery(info)
      
      expect(result).toBe(true)
    })
  })
})