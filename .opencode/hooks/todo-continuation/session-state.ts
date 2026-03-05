/**
 * Session state store for managing todo continuation state per session.
 */

import type { SessionState, SessionStateStore, TrackedSessionState } from "./types"
import { SESSION_STATE_TTL_MS, SESSION_STATE_PRUNE_INTERVAL_MS } from "./constants"

/**
 * Create a session state store for tracking continuation state.
 */
export function createSessionStateStore(): SessionStateStore {
  const sessions = new Map<string, TrackedSessionState>()

  // Periodic pruning of stale session states to prevent unbounded Map growth
  let pruneInterval: ReturnType<typeof setInterval> | undefined
  pruneInterval = setInterval(() => {
    const now = Date.now()
    for (const [sessionID, tracked] of sessions.entries()) {
      if (now - tracked.lastAccessedAt > SESSION_STATE_TTL_MS) {
        cancelCountdown(sessionID)
        sessions.delete(sessionID)
      }
    }
  }, SESSION_STATE_PRUNE_INTERVAL_MS)

  // Allow process to exit naturally even if interval is running
  if (typeof pruneInterval === "object" && "unref" in pruneInterval) {
    pruneInterval.unref()
  }

  function getState(sessionID: string): SessionState {
    const existing = sessions.get(sessionID)
    if (existing) {
      existing.lastAccessedAt = Date.now()
      return existing.state
    }

    const state: SessionState = {
      consecutiveFailures: 0,
    }
    sessions.set(sessionID, { state, lastAccessedAt: Date.now() })
    return state
  }

  function getExistingState(sessionID: string): SessionState | undefined {
    const existing = sessions.get(sessionID)
    if (existing) {
      existing.lastAccessedAt = Date.now()
      return existing.state
    }
    return undefined
  }

  function cancelCountdown(sessionID: string): void {
    const tracked = sessions.get(sessionID)
    if (!tracked) return

    const state = tracked.state
    if (state.countdownTimer) {
      clearTimeout(state.countdownTimer)
      state.countdownTimer = undefined
    }

    if (state.countdownInterval) {
      clearInterval(state.countdownInterval)
      state.countdownInterval = undefined
    }

    state.inFlight = false
    state.countdownStartedAt = undefined
  }

  function cleanup(sessionID: string): void {
    cancelCountdown(sessionID)
    sessions.delete(sessionID)
  }

  function cancelAllCountdowns(): void {
    for (const sessionID of sessions.keys()) {
      cancelCountdown(sessionID)
    }
  }

  function shutdown(): void {
    if (pruneInterval) clearInterval(pruneInterval)
    cancelAllCountdowns()
    sessions.clear()
  }

  return {
    getState,
    getExistingState,
    cancelCountdown,
    cleanup,
    cancelAllCountdowns,
    shutdown,
  }
}