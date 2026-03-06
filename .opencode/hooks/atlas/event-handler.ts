/**
 * Atlas Event Handler
 * 
 * Handles session.idle events to inject boulder continuation reminders.
 */

import type { PluginInput, AtlasHookOptions, SessionState } from "./types"
import { readBoulderState, getPlanProgress, getNextPendingTask } from "./boulder-state"
import { HOOK_NAME, CONTINUATION_COOLDOWN_MS, FAILURE_BACKOFF_MS } from "./constants"
import { log } from "../../shared/logger"

/**
 * Create the Atlas event handler.
 */
export function createAtlasEventHandler(input: {
  ctx: PluginInput
  options?: AtlasHookOptions
  sessions: Map<string, SessionState>
  getState: (sessionID: string) => SessionState
}): (arg: { event: { type: string; properties?: unknown } }) => Promise<void> {
  const { ctx, options, sessions, getState } = input

  return async ({ event }): Promise<void> => {
    const props = event.properties as Record<string, unknown> | undefined

    // Handle session error (abort detection)
    if (event.type === "session.error") {
      const sessionID = props?.sessionID as string | undefined
      if (!sessionID) return

      const state = getState(sessionID)
      const isAbort = isAbortError(props?.error)
      state.lastEventWasAbortError = isAbort

      log(`[${HOOK_NAME}] session.error`, { sessionID, isAbort })
      return
    }

    // Handle session idle - main continuation logic
    if (event.type === "session.idle") {
      const sessionID = props?.sessionID as string | undefined
      if (!sessionID) return

      log(`[${HOOK_NAME}] session.idle`, { sessionID })

      // Read boulder state
      const boulderState = readBoulderState(ctx.directory)
      const isBoulderSession = boulderState?.session_ids?.includes(sessionID) ?? false

      if (!isBoulderSession) {
        log(`[${HOOK_NAME}] Skipped: not a boulder session`, { sessionID })
        return
      }

      const state = getState(sessionID)
      const now = Date.now()

      // Check abort error
      if (state.lastEventWasAbortError) {
        state.lastEventWasAbortError = false
        log(`[${HOOK_NAME}] Skipped: abort error immediately before idle`, { sessionID })
        return
      }

      // Check failure backoff
      if (state.promptFailureCount >= 2) {
        const timeSinceLastFailure = state.lastFailureAt !== undefined
          ? now - state.lastFailureAt
          : Number.POSITIVE_INFINITY

        if (timeSinceLastFailure < FAILURE_BACKOFF_MS) {
          log(`[${HOOK_NAME}] Skipped: continuation in backoff after repeated failures`, {
            sessionID,
            promptFailureCount: state.promptFailureCount,
            backoffRemaining: FAILURE_BACKOFF_MS - timeSinceLastFailure,
          })
          return
        }

        // Reset failure count after backoff
        state.promptFailureCount = 0
        state.lastFailureAt = undefined
      }

      // Check if continuation is stopped
      if (options?.isContinuationStopped?.(sessionID)) {
        log(`[${HOOK_NAME}] Skipped: continuation stopped for session`, { sessionID })
        return
      }

      // Check boulder state exists
      if (!boulderState) {
        log(`[${HOOK_NAME}] No active boulder`, { sessionID })
        return
      }

      // Check progress
      const progress = getPlanProgress(boulderState.active_plan)
      if (progress.isComplete) {
        log(`[${HOOK_NAME}] Boulder complete`, { sessionID, plan: boulderState.plan_name })
        return
      }

      // Check cooldown
      if (state.lastContinuationInjectedAt && now - state.lastContinuationInjectedAt < CONTINUATION_COOLDOWN_MS) {
        log(`[${HOOK_NAME}] Skipped: continuation cooldown active`, {
          sessionID,
          cooldownRemaining: CONTINUATION_COOLDOWN_MS - (now - state.lastContinuationInjectedAt),
        })
        return
      }

      // Get next task
      const nextTask = getNextPendingTask(boulderState)
      if (!nextTask) {
        log(`[${HOOK_NAME}] No pending tasks`, { sessionID })
        return
      }

      // Inject continuation prompt
      state.lastContinuationInjectedAt = now
      const remaining = progress.total - progress.completed

      try {
        await injectBoulderContinuation({
          ctx,
          sessionID,
          planName: boulderState.plan_name,
          remaining,
          total: progress.total,
          nextTask,
          agent: boulderState.agent,
        })
        log(`[${HOOK_NAME}] Injected boulder continuation`, { sessionID, taskId: nextTask.id })
      } catch (err) {
        log(`[${HOOK_NAME}] Failed to inject boulder continuation`, { sessionID, error: String(err) })
        state.promptFailureCount++
        state.lastFailureAt = now
      }
      return
    }

    // Handle session deleted
    if (event.type === "session.deleted") {
      const sessionInfo = props?.info as { id?: string } | undefined
      if (sessionInfo?.id) {
        sessions.delete(sessionInfo.id)
        log(`[${HOOK_NAME}] Session deleted: cleaned up`, { sessionID: sessionInfo.id })
      }
      return
    }

    // Handle session compacted
    if (event.type === "session.compacted") {
      const sessionID = (props?.sessionID ?? (props?.info as { id?: string } | undefined)?.id) as string | undefined
      if (sessionID) {
        sessions.delete(sessionID)
        log(`[${HOOK_NAME}] Session compacted: cleaned up`, { sessionID })
      }
    }
  }
}

/**
 * Check if error is an abort error.
 */
function isAbortError(error: unknown): boolean {
  if (!error) return false
  const err = error as { name?: string }
  return err.name === "MessageAbortedError" || err.name === "AbortError"
}

/**
 * Inject boulder continuation prompt.
 */
async function injectBoulderContinuation(args: {
  ctx: PluginInput
  sessionID: string
  planName: string
  remaining: number
  total: number
  nextTask: { id: string; title: string; status: string }
  agent?: string
}): Promise<void> {
  const { planName, remaining, total, nextTask } = args

  // Build continuation message
  let message = `## <system-reminder>\n`
  message += `**Boulder Push Continuation**\n\n`
  message += `Continuing work on **${planName}**.\n\n`
  message += `**Progress:** ${total - remaining}/${total} tasks complete (${remaining} remaining)\n\n`
  message += `**Next Task:** ${nextTask.title}\n\n`
  message += `The session went idle. Continue pushing the boulder.\n`
  message += `</system-reminder>`

  // This would call ctx.client.session.prompt in real implementation
  // await ctx.client.session.prompt({
  //   path: { id: sessionID },
  //   body: { content: message, noReply: true },
  // })
  
  log(`[${HOOK_NAME}] Would inject continuation prompt`, { message: message.substring(0, 100) })
}