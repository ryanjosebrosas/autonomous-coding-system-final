// ============================================================================
// AGENT BUILDER FACTORY
// ============================================================================

import type { AgentConfig, AgentMode, AgentPermissions } from "./types"
import { AGENT_REGISTRY, type AgentMetadata, type AgentName, PERMISSIONS } from "./registry"

// ============================================================================
// FACTORY TYPE
// ============================================================================

export type AgentFactory = (model: string) => AgentConfig
export type AgentFactoryWithMode = AgentFactory & { mode: AgentMode }

// ============================================================================
// MODEL REQUIREMENTS
// ============================================================================

export interface ModelRequirement {
  provider: string
  model: string
  temperature: number
}

export interface AgentModelRequirements {
  primary: ModelRequirement
  fallbacks: ModelRequirement[]
}

// ============================================================================
// AGENT BUILDER
// ============================================================================

/**
 * Build an agent configuration from its metadata.
 * 
 * The builder pattern allows for:
 * - Model override
 * - Permission customization
 * - Temperature adjustment
 */
export function buildAgent(
  agentName: AgentName,
  options?: {
    model?: string
    provider?: string
    temperature?: number
    permissions?: AgentPermissions
    instructions?: string
  }
): AgentConfig | null {
  const metadata = AGENT_REGISTRY[agentName]
  if (!metadata) {
    console.warn(`Unknown agent: ${agentName}`)
    return null
  }
  
  // Determine model and provider
  const model = options?.model || metadata.model
  // Provider inferred by resolveAgentModel when needed
  const temperature = options?.temperature ?? metadata.temperature
  const permissions = options?.permissions || getPermissionsForAgent(agentName)
  const instructions = options?.instructions || buildDefaultInstructions(agentName, metadata)
  
  return {
    name: agentName,
    instructions,
    model,
    temperature,
    mode: metadata.mode,
    permissions,
    fallbackChain: [...metadata.fallbackChain],
  }
}

/**
 * Create a factory function for an agent.
 * This follows the OhMyOpenCode pattern: createXXXAgent(model) → AgentConfig
 */
export function createAgentFactory(agentName: AgentName): AgentFactoryWithMode {
  const metadata = AGENT_REGISTRY[agentName]
  if (!metadata) {
    throw new Error(`Unknown agent: ${agentName}`)
  }
  
  const factory = (model: string): AgentConfig => {
    return {
      name: agentName,
      instructions: buildDefaultInstructions(agentName, metadata),
      model,
      temperature: metadata.temperature,
      mode: metadata.mode,
      permissions: getPermissionsForAgent(agentName),
      fallbackChain: [...metadata.fallbackChain],
    }
  }
  
  factory.mode = metadata.mode
  
  return factory
}

// ============================================================================
// BULK FACTORY CREATION
// ============================================================================

/**
 * Create all agent factories at once.
 */
export function createAllAgentFactories(): Record<AgentName, AgentFactoryWithMode> {
  const factories: Record<string, AgentFactoryWithMode> = {}
  
  for (const name of Object.keys(AGENT_REGISTRY) as AgentName[]) {
    factories[name] = createAgentFactory(name)
  }
  
  return factories as Record<AgentName, AgentFactoryWithMode>
}

// Pre-create all factories
export const AGENT_FACTORIES = createAllAgentFactories()

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const createSisyphusAgent = AGENT_FACTORIES["sisyphus"]
export const createHephaestusAgent = AGENT_FACTORIES["hephaestus"]
export const createAtlasAgent = AGENT_FACTORIES["atlas"]
export const createPrometheusAgent = AGENT_FACTORIES["prometheus"]
export const createOracleAgent = AGENT_FACTORIES["oracle"]
export const createMetisAgent = AGENT_FACTORIES["metis"]
export const createMomusAgent = AGENT_FACTORIES["momus"]
export const createSisyphusJuniorAgent = AGENT_FACTORIES["sisyphus-junior"]
export const createLibrarianAgent = AGENT_FACTORIES["librarian"]
export const createExploreAgent = AGENT_FACTORIES["explore"]
export const createMultimodalLookerAgent = AGENT_FACTORIES["multimodal-looker"]

// ============================================================================
// DEFAULT INSTRUCTIONS BUILDER
// ============================================================================

function buildDefaultInstructions(agentName: AgentName, metadata: AgentMetadata): string {
  let instructions = `You are ${metadata.displayName}.\n\n`
  instructions += `${metadata.description}\n\n`
  
  // Add mode-specific content
  if (metadata.mode === "subagent") {
    instructions += `You are operating as a subagent with your own model selection.\n`
    instructions += `You have your own fallback chain and do not inherit the parent model.\n\n`
  }
  
  // Add permission context
  if (!metadata.permissions.task) {
    instructions += `## Restrictions\n\n`
    instructions += `You CANNOT delegate to other agents. Complete the task directly.\n\n`
  }
  
  if (!metadata.permissions.writeFile && !metadata.permissions.editFile) {
    instructions += `**READ-ONLY**: You cannot modify files. Analyze and advise only.\n\n`
  }
  
  // Add fallback information
  if (metadata.fallbackChain.length > 0) {
    instructions += `## Fallback Chain\n\n`
    instructions += `If your primary model fails, try: ${metadata.fallbackChain.join(" → ")}\n\n`
  }
  
  return instructions
}

function getPermissionsForAgent(agentName: AgentName): AgentPermissions {
  const metadata = AGENT_REGISTRY[agentName]
  if (!metadata) return PERMISSIONS.full
  
  const denied = metadata.deniedTools
  
  return {
    readFile: true,
    writeFile: !denied.includes("write") && !denied.includes("Write"),
    editFile: !denied.includes("edit") && !denied.includes("Edit"),
    bash: !denied.includes("bash"),
    grep: !denied.includes("grep"),
    task: !denied.includes("task"),
  }
}

// ============================================================================
// AGENT INDEX EXPORT
// ============================================================================

export { type AgentName } from "./registry"