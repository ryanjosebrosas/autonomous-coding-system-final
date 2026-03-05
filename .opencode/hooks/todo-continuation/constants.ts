/**
 * Constants for the todo continuation enforcer hook.
 */

/**
 * Hook name for logging and identification.
 */
export const HOOK_NAME = "todo-continuation-enforcer"

/**
 * Default agents to skip for todo continuation.
 * Subagents should not be forced to complete todos - they're delegated work.
 */
export const DEFAULT_SKIP_AGENTS = [
  "explore",
  "librarian",
  "oracle",
  "metis",
  "momus",
  "multimodal-looker",
]

/**
 * Countdown delay before injecting continuation reminder (ms).
 */
export const COUNTDOWN_DELAY_MS = 5000

/**
 * Interval between continuation reminders (ms).
 */
export const CONTINUATION_INTERVAL_MS = 10000

/**
 * Maximum consecutive failures before giving up.
 */
export const MAX_CONSECUTIVE_FAILURES = 3

/**
 * Cooldown period after last injection (ms).
 */
export const INJECTION_COOLDOWN_MS = 15000

/**
 * TTL for idle session state entries (10 minutes).
 */
export const SESSION_STATE_TTL_MS = 10 * 60 * 1000

/**
 * Prune interval for cleanup (2 minutes).
 */
export const SESSION_STATE_PRUNE_INTERVAL_MS = 2 * 60 * 1000