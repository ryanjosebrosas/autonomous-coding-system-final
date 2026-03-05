// ============================================================================
// ENVIRONMENT CONTEXT
// ============================================================================

import { AGENT_REGISTRY } from "./registry"

// ============================================================================
// ENVIRONMENT CONTEXT TYPES
// ============================================================================

export interface EnvironmentContext {
  // Project information
  projectName?: string
  projectType?: "frontend" | "backend" | "fullstack" | "library" | "cli" | "other"
  
  // Tech stack detection
  language?: "typescript" | "javascript" | "python" | "rust" | "go" | "other"
  framework?: string
  packageManager?: "npm" | "yarn" | "pnpm" | "pip" | "cargo" | "go"
  
  // Validation commands (from config.md)
  validationCommands?: {
    lint?: string
    format?: string
    types?: string
    test?: string
    integration?: string
  }
  
  // Source directories
  sourceDirectories?: {
    source?: string
    tests?: string
    config?: string
  }
  
  // Git information
  git?: {
    remote?: string
    mainBranch?: string
    currentBranch?: string
  }
  
  // Agent context
  availableAgents?: string[]
  availableSkills?: string[]
  availableCategories?: string[]
}

// ============================================================================
// CONTEXT COLLECTION
// ============================================================================

/**
 * Collect environment context for dynamic prompt building.
 * This information is used to inform agents about the environment they're working in.
 */
export function collectEnvironmentContext(): EnvironmentContext {
  const context: EnvironmentContext = {}
  
  // Collect available agents
  context.availableAgents = Object.keys(AGENT_REGISTRY)
  
  // Collect available categories
  context.availableCategories = [
    "visual-engineering",
    "ultrabrain",
    "artistry",
    "quick",
    "deep",
    "unspecified-low",
    "unspecified-high",
    "writing",
  ]
  
  // Try to detect project type
  try {
    // These would be detected at runtime
    // For now, return what we know from registry
    context.projectType = "library" // This is a framework/CLI
    context.language = "typescript"
    context.packageManager = "npm"
  } catch {
    // Context collection is best-effort
  }
  
  return context
}

/**
 * Format environment context for inclusion in a prompt.
 */
export function formatEnvironmentContext(context: EnvironmentContext): string {
  const parts: string[] = []
  
  if (context.projectType) {
    parts.push(`Project type: ${context.projectType}`)
  }
  
  if (context.language) {
    parts.push(`Language: ${context.language}`)
  }
  
  if (context.framework) {
    parts.push(`Framework: ${context.framework}`)
  }
  
  if (context.availableAgents && context.availableAgents.length > 0) {
    parts.push(`Available agents: ${context.availableAgents.join(", ")}`)
  }
  
  if (context.availableCategories && context.availableCategories.length > 0) {
    parts.push(`Available categories: ${context.availableCategories.join(", ")}`)
  }
  
  return parts.join("\n")
}

/**
 * Build context section for agent prompts.
 */
export function buildContextSection(context: EnvironmentContext): string {
  let section = "## Environment Context\n\n"
  
  if (context.projectType || context.language) {
    section += "### Project\n"
    if (context.projectType) section += `- Type: ${context.projectType}\n`
    if (context.language) section += `- Language: ${context.language}\n`
    if (context.framework) section += `- Framework: ${context.framework}\n`
    section += "\n"
  }
  
  if (context.availableAgents) {
    section += "### Available Agents\n"
    section += "Use task() to delegate to specialized agents:\n"
    
    const agentGroups = {
      "Planning": ["prometheus", "metis", "momus"],
      "Execution": ["hephaestus", "sisyphus-junior"],
      "Consultation": ["oracle"],
      "Research": ["librarian", "explore"],
      "Coordination": ["sisyphus", "atlas"],
    }
    
    for (const [group, agents] of Object.entries(agentGroups)) {
      const available = agents.filter(a => context.availableAgents!.includes(a))
      if (available.length > 0) {
        section += `- ${group}: ${available.join(", ")}\n`
      }
    }
    section += "\n"
  }
  
  if (context.availableCategories) {
    section += "### Categories\n"
    section += "Use category for semantic routing:\n"
    section += "- `visual-engineering` — UI/UX work\n"
    section += "- `ultrabrain` — Hard logic problems\n"
    section += "- `artistry` — Creative solutions\n"
    section += "- `quick` — Trivial fixes\n"
    section += "- `deep` — Investigation\n"
    section += "- `writing` — Documentation\n"
    section += "\n"
  }
  
  return section
}