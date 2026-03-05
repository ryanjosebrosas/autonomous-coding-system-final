// ============================================================================
// AGENT TYPES
// ============================================================================

export type AgentMode = "primary" | "subagent" | "all"

export type AgentRole = 
  | "orchestrator"    // Sisyphus
  | "executor"        // Hephaestus, Junior
  | "consultant"      // Oracle, Metis, Momus
  | "researcher"       // Librarian, Explore
  | "coordinator"     // Atlas
  | "planner"         // Prometheus
  | "analyzer"        // Multimodal-Looker

export interface AgentConfig {
  name: string
  instructions: string
  model: string
  temperature: number
  mode: AgentMode
  permissions: AgentPermissions
  fallbackChain?: string[]
}

export interface AgentPermissions {
  readFile: boolean
  writeFile: boolean
  editFile: boolean
  bash: boolean
  grep: boolean
  task: boolean
}

export interface AgentFactory {
  (model: string): AgentConfig
  mode: AgentMode
}

// ============================================================================
// MODEL REQUIREMENTS TYPE
// ============================================================================

export interface ModelRequirement {
  provider: string
  model: string
  temperature: number
  reasoningBudget?: number
  creativity?: number
}

export interface AgentModelRequirements {
  agentName: string
  primary: ModelRequirement
  fallbacks: ModelRequirement[]
}

// ============================================================================
// AGENT CAPABILITY FLAGS
// ============================================================================

export interface AgentCapabilities {
  canReadFiles: boolean
  canWriteFiles: boolean
  canEditFiles: boolean
  canRunCommands: boolean
  canSearchCode: boolean
  canDelegate: boolean
  canAnalyzeVisuals: boolean
  canUseExternalSearch: boolean
}

export function getCapabilities(permissions: AgentPermissions): AgentCapabilities {
  return {
    canReadFiles: permissions.readFile,
    canWriteFiles: permissions.writeFile,
    canEditFiles: permissions.editFile,
    canRunCommands: permissions.bash,
    canSearchCode: permissions.grep,
    canDelegate: permissions.task,
    canAnalyzeVisuals: false, // Only multimodal-looker
    canUseExternalSearch: !permissions.task, // Read-only agents can search external
  }
}

// ============================================================================
// AGENT MODE EXPLANATIONS
// ============================================================================

/**
 * Agent Mode determines how the agent is invoked:
 * 
 * "primary" - Respects the user-selected model from the UI. Uses fallback chain
 *             when the primary model fails. Suitable for main orchestrator.
 * 
 * "subagent" - Uses its own fallback chain regardless of UI selection. Suitable
 *               for specialized agents that should have consistent model behavior.
 * 
 * "all" - Available in both primary and subagent contexts. The agent's mode
 *          property is checked at dispatch time to determine behavior.
 * 
 * Examples:
 * - Sisyphus (primary/all) - Main orchestrator, respects user choice
 * - Oracle (subagent) - Always uses its fallback chain for consistent advice
 * - Sisyphus-Junior (all) - Can be spawned by primary or as subagent
 */