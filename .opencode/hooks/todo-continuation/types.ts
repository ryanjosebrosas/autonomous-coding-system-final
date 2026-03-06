/**
 * Todo continuation hook types.
 * 
 * This hook enforces that all todos are completed before the agent can finish.
 * It injects system reminders when incomplete todos are detected.
 */

/**
 * A todo item in the session.
 */
export interface Todo {
  id: string
  content: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority?: "low" | "medium" | "high"
}

/**
 * Todo continuation plugin input with required client methods.
 */
export interface TodoContinuationPluginInput {
  client: {
    session: {
      todo: (args: { path: { id: string } }) => Promise<{ data?: Todo[] }>
      prompt: (args: { path: { id: string }; body: unknown }) => Promise<void>
    }
  }
  directory: string
}

/**
 * Session state for tracking countdown and continuation status.
 */
export interface SessionState {
  countdownTimer?: ReturnType<typeof setTimeout>
  countdownInterval?: ReturnType<typeof setInterval>
  isRecovering?: boolean
  countdownStartedAt?: number
  abortDetectedAt?: number
  lastInjectedAt?: number
  inFlight?: boolean
  consecutiveFailures: number
}

/**
 * Todo Continuation Enforcer Options
 */
export interface TodoContinuationEnforcerOptions {
  backgroundManager?: unknown
  skipAgents?: string[]
  isContinuationStopped?: (sessionID: string) => boolean
}

/**
 * The todo continuation enforcer returned by the factory.
 */
export interface TodoContinuationEnforcer {
  handler: (input: { event: { type: string; properties?: unknown } }) => Promise<void>
  markRecovering: (sessionID: string) => void
  markRecoveryComplete: (sessionID: string) => void
  cancelAllCountdowns: () => void
}

/**
 * Message info extracted from session events.
 */
export interface MessageInfo {
  id?: string
  role?: string
  error?: { name?: string; data?: unknown }
  agent?: string
  model?: { providerID: string; modelID: string }
  providerID?: string
  modelID?: string
  tools?: Record<string, unknown>
}

/**
 * Tracked session state with last access time for TTL management.
 */
export interface TrackedSessionState {
  state: SessionState
  lastAccessedAt: number
}

/**
 * Session state store interface.
 */
export interface SessionStateStore {
  getState: (sessionID: string) => SessionState
  getExistingState: (sessionID: string) => SessionState | undefined
  cancelCountdown: (sessionID: string) => void
  cleanup: (sessionID: string) => void
  cancelAllCountdowns: () => void
  shutdown: () => void
}