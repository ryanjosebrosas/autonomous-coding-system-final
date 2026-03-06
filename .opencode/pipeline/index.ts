// ============================================================================
// PIPELINE MODULE INDEX
// ============================================================================

// Types
export type {
  PipelineStatus,
  PipelineHandoff,
  TaskIndexEntry,
  TransitionResult,
  ArtifactInfo,
  ArtifactType,
  ArtifactStatus,
  CommandInfo,
  ArtifactDiscoveryResult,
  AdvanceOptions,
  RunOptions,
} from "./types"

// State machine
export {
  canTransition,
  validateTransition,
  getValidNextStates,
  isTerminalState,
  isBlockedState,
  isExecutionState,
  isReviewState,
  isCommitReady,
  getCommandTargetState,
  inferNextState,
  getStatusDescription,
} from "./state-machine"

// Handoff management
export {
  readHandoff,
  writeHandoff,
  createHandoff,
  updateHandoff,
  hasPendingWork,
} from "./handoff"

// Artifact discovery
export {
  discoverArtifacts,
  getPendingArtifacts,
  getDoneArtifacts,
  markArtifactDone,
  markArtifactPending,
  getNextPendingTask,
  getArtifactDiscoveryResult,
  isPhaseComplete,
  getHighestTaskNumber,
  getNextPhaseNumber,
  findFirstIncompleteArtifact,
} from "./artifacts"

// Command registry
export {
  loadCommand,
  listCommands,
  isValidCommand,
  getCommandStatus,
  getCommandsForStatus,
  getCommandDescription,
  suggestNextCommand,
} from "./commands"