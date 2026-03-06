/**
 * Session Recovery Hook Types
 * 
 * Handles recovery from session errors like tool_result_missing,
 * unavailable_tool, and thinking_block_order issues.
 */

/**
 * Session recovery plugin input with required client methods.
 */
export interface SessionRecoveryPluginInput {
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
 * Types of recoverable errors.
 */
export type RecoveryErrorType =
  | "tool_result_missing"
  | "unavailable_tool"
  | "thinking_block_order"
  | "thinking_disabled_violation"
  | "assistant_prefill_unsupported"

/**
 * Message data from session messages response.
 */
export interface MessageData {
  info?: {
    id?: string
    role?: string
    parentID?: string
    error?: unknown
  }
  type?: string
  content?: unknown
}

/**
 * Resume configuration for session continuation.
 */
export interface ResumeConfig {
  sessionID: string
  lastUserMessage?: string
  resumePoint?: string
}

/**
 * Options for creating the session recovery hook.
 */
export interface SessionRecoveryOptions {
  experimental?: {
    auto_resume?: boolean
    [key: string]: unknown
  }
}

/**
 * Session recovery hook interface.
 */
export interface SessionRecoveryHook {
  handleSessionRecovery: (info: MessageInfo) => Promise<boolean>
  isRecoverableError: (error: unknown) => boolean
  setOnAbortCallback: (callback: (sessionID: string) => void) => void
  setOnRecoveryCompleteCallback: (callback: (sessionID: string) => void) => void
}

/**
 * Message info from session events.
 */
export interface MessageInfo {
  id?: string
  role?: string
  sessionID?: string
  parentID?: string
  error?: unknown
}