/**
 * Session Recovery Hook
 * 
 * Handles recovery from session errors to prevent work loss.
 */

export { createSessionRecoveryHook } from "./hook"
export type { SessionRecoveryHook, SessionRecoveryOptions } from "./types"
export { detectErrorType } from "./detect-error-type"
export type { RecoveryErrorType } from "./types"