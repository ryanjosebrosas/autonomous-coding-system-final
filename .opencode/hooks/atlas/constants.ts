/**
 * Atlas Hook Constants
 */

/**
 * Hook name for logging.
 */
export const HOOK_NAME = "atlas"

/**
 * Default agent for boulder pushing.
 */
export const DEFAULT_ATLAS_AGENT = "atlas"

/**
 * Continuation cooldown in milliseconds.
 */
export const CONTINUATION_COOLDOWN_MS = 5000

/**
 * Failure backoff period in milliseconds (5 minutes).
 */
export const FAILURE_BACKOFF_MS = 5 * 60 * 1000

/**
 * Boulder state file name.
 */
export const BOULDER_FILE = "boulder.json"

/**
 * Default agents allowed for Atlas boulder.
 */
export const ALLOWED_AGENTS = ["atlas", "sisyphus"]