// ============================================================================
// AGENT RESOLUTION LOGIC
// ============================================================================

import { AGENT_REGISTRY, type AgentMetadata, type AgentName } from "./registry"
import { CATEGORY_MODEL_ROUTES } from "../tools/delegate-task/constants"

// ============================================================================
// RESOLUTION TYPES
// ============================================================================

export interface ResolvedAgent {
  agent: AgentMetadata
  model: string
  provider: string
  source: "agent-default" | "category-default" | "user-override" | "fallback"
}

export interface ResolutionOptions {
  agentName?: AgentName
  category?: string
  provider?: string
  model?: string
}

// ============================================================================
// MODEL RESOLUTION
// ============================================================================

/**
 * Resolve the model for an agent, considering:
 * 1. User override (explicit provider/model)
 * 2. Agent default model
 * 3. Category default model (if agent spawned via category)
 * 4. System fallback
 */
export function resolveAgentModel(options: ResolutionOptions): ResolvedAgent | null {
  const { agentName, category, provider, model } = options
  
  // 1. User override - explicit provider/model specified
  if (provider && model) {
    const agent = agentName ? AGENT_REGISTRY[agentName] : null
    return {
      agent: agent!,
      model,
      provider,
      source: "user-override",
    }
  }
  
  // 2. Agent name specified - use agent's default
  if (agentName) {
    const agent = AGENT_REGISTRY[agentName]
    if (!agent) {
      console.warn(`Unknown agent: ${agentName}`)
      return null
    }
    
    // Parse model format: "provider/model"
    const [defaultProvider, defaultModel] = parseModelString(agent.model)
    
    return {
      agent,
      model: defaultModel,
      provider: defaultProvider,
      source: "agent-default",
    }
  }
  
  // 3. Category specified - resolve from category
  if (category) {
    const categoryRoute = CATEGORY_MODEL_ROUTES[category]
    if (categoryRoute) {
      // Find an agent matching the category
      const categoryAgents = Object.values(AGENT_REGISTRY).filter(
        a => a.category === category
      )
      
      if (categoryAgents.length > 0) {
        return {
          agent: categoryAgents[0],
          model: categoryRoute.model,
          provider: categoryRoute.provider,
          source: "category-default",
        }
      }
    }
  }
  
  // 4. Fallback - use GLM-4.7 as system default
  return {
    agent: AGENT_REGISTRY["sisyphus-junior"],
    model: "glm-4.7",
    provider: "zai-coding-plan",
    source: "fallback",
  }
}

/**
 * Parse model string in format "provider/model" or just "model".
 */
function parseModelString(modelString: string): [string, string] {
  if (modelString.includes("/")) {
    const [provider, model] = modelString.split("/")
    return [provider, model]
  }
  // Model only - need to infer provider
  return [inferProvider(modelString), modelString]
}

/**
 * Infer provider from model name.
 */
function inferProvider(model: string): string {
  if (model.includes("claude")) return "anthropic"
  if (model.includes("gpt") || model.includes("codex")) return "openai"
  if (model.includes("gemini")) return "ollama-cloud"
  if (model.includes("qwen")) return "bailian-coding-plan-test"
  if (model.includes("glm")) return "zai-coding-plan"
  if (model.includes("kimi")) return "bailian-coding-plan-test"
  if (model.includes("deepseek")) return "ollama-cloud"
  if (model.includes("kimi")) return "bailian-coding-plan-test"
  if (model.includes("grok")) return "xai"
  
  // Default fallback
  return "zai-coding-plan"
}

// ============================================================================
// AGENT AVAILABILITY
// ============================================================================

/**
 * Check if an agent is available (has valid model configuration).
 */
export function isAgentAvailable(agentName: AgentName): boolean {
  const agent = AGENT_REGISTRY[agentName]
  if (!agent) return false
  
  // Check if model exists
  return !!agent.model && agent.model.length > 0
}

/**
 * Get all available agents.
 */
export function getAvailableAgents(): AgentMetadata[] {
  return Object.values(AGENT_REGISTRY).filter(isAgentAvailable)
}

/**
 * Get agents suitable for a given task type.
 */
export function getAgentsForTask(taskType: string): AgentMetadata[] {
  // Map task types to suitable agents
  const taskAgentMap: Record<string, AgentName[]> = {
    "architecture": ["oracle", "metis"],
    "planning": ["prometheus", "momus"],
    "code-review": ["momus"],
    "research": ["librarian", "explore"],
    "execution": ["hephaestus", "sisyphus-junior"],
    "debug": ["oracle"],
    "writing": ["sisyphus"], // use writing category
    "visual": ["sisyphus-junior"], // use visual-engineering category
  }
  
  const agentNames = taskAgentMap[taskType] || []
  return agentNames.map(name => AGENT_REGISTRY[name]).filter(Boolean)
}

// ============================================================================
// PERMISSION CHECKING
// ============================================================================

/**
 * Check if an agent has permission to use a specific tool.
 */
export function hasPermission(agentName: AgentName, tool: string): boolean {
  const agent = AGENT_REGISTRY[agentName]
  if (!agent) return false
  
  // Check denied tools first
  if (agent.deniedTools.includes(tool)) return false
  
  // Map tool to permission
  const toolPermissionMap: Record<string, keyof typeof agent.permissions> = {
    "read": "readFile",
    "write": "writeFile",
    "edit": "editFile",
    "bash": "bash",
    "grep": "grep",
    "glob": "grep",
    "task": "task",
  }
  
  const permission = toolPermissionMap[tool]
  if (!permission) return true // Unknown tools default to allowed
  
  return agent.permissions[permission]
}

/**
 * Get denied tools for an agent.
 */
export function getDeniedTools(agentName: AgentName): string[] {
  const agent = AGENT_REGISTRY[agentName]
  if (!agent) return []
  
  const denied: string[] = [...agent.deniedTools]
  
  // Add tools based on permissions
  if (!agent.permissions.writeFile) denied.push("write")
  if (!agent.permissions.editFile) denied.push("edit")
  if (!agent.permissions.bash) denied.push("bash")
  if (!agent.permissions.task) denied.push("task")
  
  return [...new Set(denied)] // Remove duplicates
}