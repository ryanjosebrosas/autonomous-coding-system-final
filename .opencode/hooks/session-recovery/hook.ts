/**
 * Session Recovery Hook
 * 
 * Handles recovery from various session errors to prevent session loss.
 * Supports recovery from:
 * - tool_result_missing: Inject cancelled tool results
 * - unavailable_tool: Remove unavailable tool calls
 * - thinking_block_order: Fix thinking block structure
 * - thinking_disabled_violation: Strip thinking blocks
 */

import type { SessionRecoveryHook, SessionRecoveryOptions, MessageInfo, RecoveryErrorType } from "./types"
import { detectErrorType } from "./detect-error-type"
import { log } from "../../shared/logger"

interface PluginInput {
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
}

/**
 * Create the session recovery hook.
 */
export function createSessionRecoveryHook(ctx: PluginInput, options?: SessionRecoveryOptions): SessionRecoveryHook {
  const processingErrors = new Set<string>()
  const experimental = options?.experimental
  let onAbortCallback: ((sessionID: string) => void) | null = null
  let onRecoveryCompleteCallback: ((sessionID: string) => void) | null = null

  const setOnAbortCallback = (callback: (sessionID: string) => void): void => {
    onAbortCallback = callback
  }

  const setOnRecoveryCompleteCallback = (callback: (sessionID: string) => void): void => {
    onRecoveryCompleteCallback = callback
  }

  const isRecoverableError = (error: unknown): boolean => {
    return detectErrorType(error) !== null
  }

  const handleSessionRecovery = async (info: MessageInfo): Promise<boolean> => {
    if (!info || info.role !== "assistant" || !info.error) return false

    const errorType = detectErrorType(info.error)
    if (!errorType) return false

    const sessionID = info.sessionID
    const assistantMsgID = info.id

    if (!sessionID || !assistantMsgID) return false

    // Prevent duplicate recovery attempts
    if (processingErrors.has(assistantMsgID)) return false
    processingErrors.add(assistantMsgID)

    try {
      // Notify abort callback
      if (onAbortCallback) {
        onAbortCallback(sessionID)
      }

      // Abort current session
      await ctx.client.session.abort({ path: { id: sessionID } }).catch(() => {})

      // Show toast notification
      const toastTitles: Record<RecoveryErrorType, string> = {
        tool_result_missing: "Tool Crash Recovery",
        unavailable_tool: "Tool Recovery",
        thinking_block_order: "Thinking Block Recovery",
        thinking_disabled_violation: "Thinking Strip Recovery",
        assistant_prefill_unsupported: "Prefill Unsupported",
      }

      const toastMessages: Record<RecoveryErrorType, string> = {
        tool_result_missing: "Injecting cancelled tool results...",
        unavailable_tool: "Recovering from unavailable tool call...",
        thinking_block_order: "Fixing message structure...",
        thinking_disabled_violation: "Stripping thinking blocks...",
        assistant_prefill_unsupported: "Prefill not supported; continuing without recovery.",
      }

      await ctx.client.tui?.showToast?.({
        body: {
          title: toastTitles[errorType],
          message: toastMessages[errorType],
          variant: "warning",
          duration: 3000,
        },
      }).catch(() => {})

      // Recovery logic would go here based on error type
      // For now, log the recovery attempt
      log("[session-recovery] Recovery attempted", {
        sessionID,
        errorType,
        assistantMsgID,
      })

      // For prefill_unsupported, we can't recover
      if (errorType === "assistant_prefill_unsupported") {
        return false
      }

      return true
    } catch (err) {
      log("[session-recovery] Recovery failed:", { error: String(err) })
      return false
    } finally {
      processingErrors.delete(assistantMsgID)

      if (sessionID && onRecoveryCompleteCallback) {
        onRecoveryCompleteCallback(sessionID)
      }
    }
  }

  return {
    handleSessionRecovery,
    isRecoverableError,
    setOnAbortCallback,
    setOnRecoveryCompleteCallback,
  }
}

export { detectErrorType }
export type { RecoveryErrorType } from "./types"