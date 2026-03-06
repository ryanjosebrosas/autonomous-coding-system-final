/**
 * Todo Continuation Enforcer Hook
 * 
 * This hook enforces that all todos are completed before the agent can finish.
 * When a session goes idle with incomplete todos, it injects a system reminder
 * to force continuation until all todos are marked complete or cancelled.
 * 
 * Priority: CRITICAL - Part of continuation tier, runs first.
 */

import type { TodoContinuationEnforcer, TodoContinuationEnforcerOptions, SessionStateStore, TodoContinuationPluginInput } from "./types"
import { HOOK_NAME, DEFAULT_SKIP_AGENTS } from "./constants"
import { createTodoContinuationHandler } from "./handler"
import { createSessionStateStore } from "./session-state"
import { log } from "../../shared/logger"

export type { TodoContinuationEnforcer, TodoContinuationEnforcerOptions, SessionStateStore, TodoContinuationPluginInput }

/**
 * Create the todo continuation enforcer hook.
 * 
 * @param ctx - Plugin context with client and directory
 * @param options - Hook options including background manager and skip agents
 * @returns Hook interface with handler and control methods
 */
export function createTodoContinuationEnforcer(
  ctx: TodoContinuationPluginInput,
  options: TodoContinuationEnforcerOptions = {}
): TodoContinuationEnforcer {
  const {
    backgroundManager,
    skipAgents = DEFAULT_SKIP_AGENTS,
    isContinuationStopped,
  } = options

  const sessionStateStore = createSessionStateStore()

  /**
   * Mark a session as recovering from an error.
   */
  const markRecovering = (sessionID: string): void => {
    const state = sessionStateStore.getState(sessionID)
    state.isRecovering = true
    sessionStateStore.cancelCountdown(sessionID)
    log(`[${HOOK_NAME}] Session marked as recovering`, { sessionID })
  }

  /**
   * Mark a session as having completed recovery.
   */
  const markRecoveryComplete = (sessionID: string): void => {
    const state = sessionStateStore.getExistingState(sessionID)
    if (state) {
      state.isRecovering = false
      log(`[${HOOK_NAME}] Session recovery complete`, { sessionID })
    }
  }

  const handler = createTodoContinuationHandler({
    ctx,
    sessionStateStore,
    backgroundManager,
    skipAgents,
    isContinuationStopped,
  })

  /**
   * Cancel all countdowns across all sessions.
   */
  const cancelAllCountdowns = (): void => {
    sessionStateStore.cancelAllCountdowns()
    log(`[${HOOK_NAME}] All countdowns cancelled`)
  }

  return {
    handler,
    markRecovering,
    markRecoveryComplete,
    cancelAllCountdowns,
  }
}