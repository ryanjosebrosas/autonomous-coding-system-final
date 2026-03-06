/**
 * Atlas Hook Types
 * 
 * Atlas is the "boulder pusher" - it reads boulder.json and orchestrates
 * the todo list to ensure work continues until all tasks are complete.
 */

/**
 * Plugin input for hook initialization.
 */
export interface PluginInput {
  client?: unknown
  directory: string
}

/**
 * Model information for session tracking.
 */
export type ModelInfo = { providerID: string; modelID: string }

/**
 * Options for creating the Atlas hook.
 */
export interface AtlasHookOptions {
  directory: string
  backgroundManager?: unknown
  isContinuationStopped?: (sessionID: string) => boolean
  agentOverrides?: Record<string, unknown>
  /** Enable auto-commit after each atomic task completion (default: true) */
  autoCommit?: boolean
}

/**
 * Session state for Atlas hook.
 */
export interface SessionState {
  lastEventWasAbortError?: boolean
  lastContinuationInjectedAt?: number
  promptFailureCount: number
  lastFailureAt?: number
}

/**
 * Boulder state file schema.
 */
export interface BoulderState {
  /** Name of the boulder (feature name) */
  plan_name: string
  /** Path to the plan file */
  plan_path: string
  /** Agent assigned to push the boulder */
  agent?: string
  /** Session IDs involved in this boulder */
  session_ids?: string[]
  /** Worktree path if using git worktree */
  worktree_path?: string
  /** Active plan state */
  active_plan?: PlanProgress
  /** Created timestamp */
  created_at?: number
  /** Updated timestamp */
  updated_at?: number
}

/**
 * Plan progress tracking.
 */
export interface PlanProgress {
  /** Total tasks in the plan */
  total: number
  /** Completed tasks */
  completed: number
  /** Current task being worked on */
  current?: string
  /** Whether the plan is complete */
  isComplete?: boolean
  /** Task list */
  tasks?: TaskInfo[]
}

/**
 * Task information.
 */
export interface TaskInfo {
  id: string
  title: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  started_at?: number
  completed_at?: number
}