// ============================================================================
// PIPELINE STATE MACHINE
// ============================================================================

import type { PipelineStatus, TransitionResult } from "./types"

/**
 * Valid state transitions for the pipeline.
 * 
 * Each status maps to an array of valid next statuses.
 * Transitions not in this map are invalid.
 * 
 * Key rules:
 * - "blocked" can resume to any previous state
 * - "pr-open" is terminal (no transitions out)
 * - Tasks execute in sequence within executing-tasks
 */
const VALID_TRANSITIONS: Record<PipelineStatus, PipelineStatus[]> = {
  "awaiting-execution": ["executing-tasks", "executing-series", "blocked"],
  
  "executing-tasks": [
    "awaiting-review",     // All tasks complete
    "executing-tasks",     // Next task in sequence
    "blocked",             // Error during execution
  ],
  
  "executing-series": [
    "awaiting-review",     // All phases complete
    "executing-series",    // Next phase in sequence
    "blocked",             // Error during execution
  ],
  
  "awaiting-review": [
    "awaiting-fixes",      // Issues found
    "ready-to-commit",     // Clean review
    "blocked",             // Review error
  ],
  
  "awaiting-fixes": [
    "awaiting-re-review",  // Fixes applied
    "awaiting-fixes",      // More fixes needed
    "blocked",             // Fix error
  ],
  
  "awaiting-re-review": [
    "ready-to-commit",     // Clean re-review
    "awaiting-fixes",      // More issues found
    "blocked",             // Review error
  ],
  
  "ready-to-commit": [
    "ready-for-pr",        // Commit successful
    "blocked",             // Commit failed
  ],
  
  "ready-for-pr": [
    "pr-open",             // PR created
    "blocked",             // PR creation failed
  ],
  
  "pr-open": [],          // Terminal state - no transitions
  
  "blocked": [
    "awaiting-execution",  // Restart from beginning
    "executing-tasks",     // Resume execution
    "executing-series",    // Resume series
    "awaiting-review",     // Resume after review
    "awaiting-fixes",      // Resume after fixes
    "awaiting-re-review",  // Resume after re-review
    "ready-to-commit",     // Resume after commit
    "ready-for-pr",        // Resume after PR
  ],
}

/**
 * Check if a transition from one status to another is valid.
 */
export function canTransition(from: PipelineStatus, to: PipelineStatus): boolean {
  const validTargets = VALID_TRANSITIONS[from]
  return validTargets?.includes(to) ?? false
}

/**
 * Validate a state transition and return the result.
 */
export function validateTransition(
  from: PipelineStatus, 
  to: PipelineStatus
): TransitionResult {
  if (canTransition(from, to)) {
    return {
      success: true,
      from,
      to,
    }
  }
  
  const validTargets = VALID_TRANSITIONS[from] ?? []
  return {
    success: false,
    from,
    to,
    error: `Invalid transition: ${from} → ${to}. Valid transitions from ${from}: ${validTargets.length > 0 ? validTargets.join(", ") : "none (terminal state)"}`,
  }
}

/**
 * Get all valid next states for a given status.
 */
export function getValidNextStates(current: PipelineStatus): PipelineStatus[] {
  return VALID_TRANSITIONS[current] ?? []
}

/**
 * Check if a status is a terminal state (no transitions out).
 */
export function isTerminalState(status: PipelineStatus): boolean {
  const transitions = VALID_TRANSITIONS[status]
  return transitions?.length === 0
}

/**
 * Check if a status is the "blocked" state.
 * Blocked allows resuming from any previous state.
 */
export function isBlockedState(status: PipelineStatus): boolean {
  return status === "blocked"
}

/**
 * Check if a status indicates execution is in progress.
 */
export function isExecutionState(status: PipelineStatus): boolean {
  return status === "executing-tasks" || status === "executing-series"
}

/**
 * Check if a status is in the review phase.
 */
export function isReviewState(status: PipelineStatus): boolean {
  return (
    status === "awaiting-review" || 
    status === "awaiting-fixes" || 
    status === "awaiting-re-review"
  )
}

/**
 * Check if a status is ready for commit.
 */
export function isCommitReady(status: PipelineStatus): boolean {
  return status === "ready-to-commit" || status === "ready-for-pr"
}

/**
 * Command to target state mapping.
 * Maps command names to the pipeline status they produce.
 */
export const COMMAND_TARGET_STATES: Record<string, PipelineStatus> = {
  // Planning commands
  "/planning": "awaiting-execution",
  "/mvp": "awaiting-execution",
  "/prd": "awaiting-execution",
  "/pillars": "awaiting-execution",
  "/decompose": "awaiting-execution",
  
  // Execution commands
  "/execute": "executing-tasks",
  
  // Review commands
  "/code-review": "awaiting-fixes",
  "/code-review-fix": "awaiting-re-review",
  "/code-loop": "ready-to-commit",
  "/final-review": "ready-to-commit",
  
  // Commit commands
  "/commit": "ready-for-pr",
  "/pr": "pr-open",
  "/system-review": "awaiting-fixes",
}

/**
 * Get the target state for a command.
 */
export function getCommandTargetState(command: string): PipelineStatus | undefined {
  // Normalize command (remove leading slash if needed)
  const normalizedCommand = command.startsWith("/") ? command : `/${command}`
  return COMMAND_TARGET_STATES[normalizedCommand]
}

/**
 * Infer the next state based on command completion and current state.
 */
export function inferNextState(
  currentStatus: PipelineStatus,
  completedCommand: string,
  success: boolean
): PipelineStatus | null {
  // If failed, go to blocked
  if (!success) {
    return "blocked"
  }
  
  // Get target state for command
  const targetState = getCommandTargetState(completedCommand)
  
  // Special handling for /execute (depends on plan type)
  if (completedCommand === "/execute" || completedCommand === "execute") {
    // Task brief mode: stay in executing-tasks, or move to awaiting-review when done
    // This is determined by artifact state, not command completion
    // Return null to indicate we need artifact discovery to determine next state
    return null
  }
  
  // For other commands, use the target state if valid
  if (targetState && canTransition(currentStatus, targetState)) {
    return targetState
  }
  
  // If we can't determine the next state, return null
  return null
}

/**
 * Get human-readable description for a status.
 */
export function getStatusDescription(status: PipelineStatus): string {
  const descriptions: Record<PipelineStatus, string> = {
    "awaiting-execution": "Plan created, waiting for /execute",
    "executing-tasks": "Executing task briefs (one per session)",
    "executing-series": "Executing phase series (one per session)",
    "awaiting-review": "Execution complete, awaiting code review",
    "awaiting-fixes": "Code review found issues, awaiting fixes",
    "awaiting-re-review": "Fixes applied, awaiting re-review",
    "ready-to-commit": "Clean review, ready for /commit",
    "ready-for-pr": "Committed, ready for /pr",
    "pr-open": "PR created (terminal state)",
    "blocked": "Pipeline blocked, needs manual intervention",
  }
  
  return descriptions[status] ?? "Unknown status"
}