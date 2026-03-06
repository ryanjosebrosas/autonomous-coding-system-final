// ============================================================================
// PIPELINE STATE TYPES
// ============================================================================

/**
 * All valid pipeline statuses.
 * 
 * These states represent the lifecycle of a feature from planning through PR.
 * State transitions are enforced by the state machine.
 */
export type PipelineStatus =
  | "awaiting-execution"
  | "executing-tasks"
  | "executing-series"
  | "awaiting-review"
  | "awaiting-fixes"
  | "awaiting-re-review"
  | "ready-to-commit"
  | "ready-for-pr"
  | "pr-open"
  | "blocked"

/**
 * Handoff file structure.
 * 
 * Mirrors the structure of `.agents/context/next-command.md` which tracks
 * pipeline state between sessions.
 */
export interface PipelineHandoff {
  /** Last command that ran (e.g., "/execute", "/code-loop") */
  lastCommand: string
  
  /** Feature being worked on */
  feature: string
  
  /** Command to run next (auto-detected by /prime) */
  nextCommand: string
  
  /** Path to master plan (if using master plan mode) */
  masterPlan?: string
  
  /** Phase progress for master plans */
  phaseProgress?: {
    current: number
    total: number
  }
  
  /** Task progress for task brief mode */
  taskProgress?: {
    completed: number
    total: number
  }
  
  /** ISO timestamp when handoff was last updated */
  timestamp: string
  
  /** Current pipeline status */
  status: PipelineStatus
  
  /** Human-readable notes about the current state */
  notes?: string
  
  /** Task index for tracking progress */
  taskIndex?: TaskIndexEntry[]
}

/**
 * Task index entry for tracking individual task progress.
 */
export interface TaskIndexEntry {
  /** Task number (1, 2, 3...) */
  task: number
  
  /** Path to task brief */
  briefPath: string
  
  /** Scope description */
  scope: string
  
  /** Task status */
  status: "pending" | "in_progress" | "done" | "blocked"
  
  /** Files affected by this task */
  files?: string[]
}

/**
 * Result of a state transition attempt.
 */
export interface TransitionResult {
  /** Whether the transition succeeded */
  success: boolean
  
  /** Source status */
  from: PipelineStatus
  
  /** Target status */
  to: PipelineStatus
  
  /** Error message if transition failed */
  error?: string
  
  /** Updated handoff if transition succeeded */
  handoff?: PipelineHandoff
}

/**
 * Information about a pipeline artifact.
 */
export interface ArtifactInfo {
  /** Full path to artifact file */
  path: string
  
  /** Artifact name (e.g., "task-1", "plan") */
  name: string
  
  /** Artifact type */
  type: ArtifactType
  
  /** Completion status */
  status: ArtifactStatus
  
  /** Feature this artifact belongs to */
  feature: string
}

/**
 * Types of pipeline artifacts.
 */
export type ArtifactType = 
  | "plan"
  | "plan-master"
  | "task"
  | "plan-phase"
  | "report"
  | "review"
  | "loop-report"
  | "fixes"
  | "checkpoint"

/**
 * Artifact completion status.
 */
export type ArtifactStatus = "pending" | "done" | "blocked"

/**
 * Command metadata loaded from a command method file.
 */
export interface CommandInfo {
  /** Command name (e.g., "planning", "execute") */
  name: string
  
  /** Human-readable description */
  description: string
  
  /** Model tier for this command */
  model: string
  
  /** Target status after command completes */
  targetStatus?: PipelineStatus
  
  /** Path to the command method file */
  methodPath: string
}

/**
 * Result of discovering artifacts for a feature.
 */
export interface ArtifactDiscoveryResult {
  /** Feature name */
  feature: string
  
  /** All discovered artifacts */
  artifacts: ArtifactInfo[]
  
  /** Pending artifacts */
  pending: ArtifactInfo[]
  
  /** Completed artifacts */
  done: ArtifactInfo[]
  
  /** Next pending task (if any) */
  nextTask?: ArtifactInfo
}

/**
 * Options for advancing pipeline state.
 */
export interface AdvanceOptions {
  /** Target status (optional - auto-detected if not provided) */
  status?: PipelineStatus
  
  /** Update notes field */
  notes?: string
  
  /** Update task progress */
  taskProgress?: { completed: number; total: number }
  
  /** Update phase progress */
  phaseProgress?: { current: number; total: number }
}

/**
 * Options for running a command sequence.
 */
export interface RunOptions {
  /** Commands to run in sequence */
  commands: string[]
  
  /** Feature to operate on */
  feature: string
  
  /** Stop on first error */
  stopOnError?: boolean
  
  /** Dry run (don't actually execute) */
  dryRun?: boolean
}