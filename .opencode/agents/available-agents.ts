// ============================================================================
// AVAILABLE AGENT SUMMARIES
// ============================================================================

import { AGENT_REGISTRY, type AgentMetadata } from "./registry"

// ============================================================================
// AGENT SUMMARY INTERFACE
// ============================================================================

export interface AgentSummary {
  name: string
  category: string
  oneLiner: string
  useWhen: string[]
  avoidWhen: string[]
  model: string
  readOnly: boolean
  canDelegate: boolean
}

// ============================================================================
// PRE-COMPUTED SUMMARIES
// ============================================================================

const SUMMARIES: Record<string, AgentSummary> = {
  sisyphus: {
    name: "Sisyphus",
    category: "unspecified-high",
    oneLiner: "Main orchestrator that plans, delegates, and maintains session continuity",
    useWhen: [
      "Complex tasks requiring multiple agents",
      "User provides vague requests",
      "Need to coordinate multiple specialists",
      "Session continuity matters",
    ],
    avoidWhen: [
      "Simple single-file changes",
      "Clear implementation path exists",
      "Category dispatch is sufficient",
    ],
    model: "Claude Opus 4.6",
    readOnly: false,
    canDelegate: true,
  },
  
  hephaestus: {
    name: "Hephaestus",
    category: "ultrabrain",
    oneLiner: "Deep autonomous worker for genuinely difficult tasks",
    useWhen: [
      "Complex algorithm implementation",
      "Architecture refactoring",
      "Hard debugging",
      "Multi-file coordinated changes",
    ],
    avoidWhen: [
      "Trivial single-file changes",
      "UI/styling work",
      "Documentation",
    ],
    model: "GPT-5.3 Codex",
    readOnly: false,
    canDelegate: true,
  },
  
  atlas: {
    name: "Atlas",
    category: "writing",
    oneLiner: "Todo list conductor that tracks progress and accumulates wisdom",
    useWhen: [
      "Managing complex multi-task projects",
      "Tracking progress across sessions",
      "Resuming interrupted work",
    ],
    avoidWhen: [
      "Simple single-task work",
      "Deep implementation",
    ],
    model: "Kimi K2.5",
    readOnly: false,
    canDelegate: false,
  },
  
  prometheus: {
    name: "Prometheus",
    category: "unspecified-high",
    oneLiner: "Interview planner that discovers requirements through questions",
    useWhen: [
      "Starting a new feature",
      "Requirements are unclear",
      "Need to understand priorities",
    ],
    avoidWhen: [
      "Clear explicit requirements",
      "Bug fixes with known cause",
    ],
    model: "Claude Opus 4.6",
    readOnly: true,
    canDelegate: false,
  },
  
  oracle: {
    name: "Oracle",
    category: "ultrabrain",
    oneLiner: "Read-only consultant for architecture and debugging",
    useWhen: [
      "Architecture decisions",
      "Complex debugging strategies",
      "Performance analysis",
      "Security review",
    ],
    avoidWhen: [
      "Simple debugging",
      "Code implementation",
    ],
    model: "GPT-5.2",
    readOnly: true,
    canDelegate: false,
  },
  
  metis: {
    name: "Metis",
    category: "artistry",
    oneLiner: "Gap analyzer that finds hidden assumptions before planning",
    useWhen: [
      "Before major planning",
      "Request seems too simple",
      "Scope feels vague",
    ],
    avoidWhen: [
      "Trivial tasks",
      "Bug fixes",
    ],
    model: "Claude Opus 4.6",
    readOnly: true,
    canDelegate: false,
  },
  
  momus: {
    name: "Momus",
    category: "ultrabrain",
    oneLiner: "Ruthless plan reviewer that rejects vague plans",
    useWhen: [
      "Before approving plans",
      "After planning session",
      "Plan quality is questionable",
    ],
    avoidWhen: [
      "Trivial tasks",
      "Already-approved plans",
    ],
    model: "GPT-5.2",
    readOnly: true,
    canDelegate: false,
  },
  
  "sisyphus-junior": {
    name: "Sisyphus-Junior",
    category: "inherited",
    oneLiner: "Constrained executor for category-spawned tasks",
    useWhen: [
      "Category dispatch",
      "Tasks with MUST DO / MUST NOT DO constraints",
      "Focused implementation work",
    ],
    avoidWhen: [
      "Complex multi-agent coordination",
      "Architecture decisions",
    ],
    model: "Claude Sonnet 4.6",
    readOnly: false,
    canDelegate: false,
  },
  
  librarian: {
    name: "Librarian",
    category: "writing",
    oneLiner: "External documentation and implementation examples search",
    useWhen: [
      "Looking up library APIs",
      "Finding implementation examples",
      "Version compatibility questions",
    ],
    avoidWhen: [
      "Codebase exploration",
      "Architecture decisions",
    ],
    model: "Kimi K2.5",
    readOnly: true,
    canDelegate: false,
  },
  
  explore: {
    name: "Explore",
    category: "deep",
    oneLiner: "Internal codebase grep and pattern discovery",
    useWhen: [
      "Finding implementations",
      "Discovering patterns",
      "Integration points",
    ],
    avoidWhen: [
      "External documentation",
      "Implementation work",
    ],
    model: "Grok Code Fast 1",
    readOnly: true,
    canDelegate: false,
  },
  
  "multimodal-looker": {
    name: "Multimodal-Looker",
    category: "unspecified-low",
    oneLiner: "PDF and image analysis",
    useWhen: [
      "Analyzing PDFs",
      "Reading screenshots",
      "Understanding diagrams",
    ],
    avoidWhen: [
      "Text file reading",
      "Code analysis",
    ],
    model: "Gemini 3 Flash",
    readOnly: true,
    canDelegate: false,
  },
}

// ============================================================================
// SUMMARY FUNCTIONS
// ============================================================================

/**
 * Get summary for a specific agent.
 */
export function getAgentSummary(agentName: string): AgentSummary | null {
  return SUMMARIES[agentName] || null
}

/**
 * Get all agent summaries.
 */
export function getAllAgentSummaries(): AgentSummary[] {
  return Object.values(SUMMARIES)
}

/**
 * Get summaries for agents that can modify files.
 */
export function getExecutionAgentSummaries(): AgentSummary[] {
  return Object.values(SUMMARIES).filter(s => !s.readOnly)
}

/**
 * Get summaries for read-only consultation agents.
 */
export function getConsultationAgentSummaries(): AgentSummary[] {
  return Object.values(SUMMARIES).filter(s => s.readOnly)
}

/**
 * Format summaries for prompt inclusion.
 */
export function formatAgentSummariesForPrompt(agents: AgentSummary[]): string {
  let output = "## Available Agents\n\n"
  
  for (const agent of agents) {
    output += `### ${agent.name}\n`
    output += `${agent.oneLiner}\n\n`
    output += `Category: ${agent.category}\n`
    output += `Model: ${agent.model}\n`
    output += `Permissions: ${agent.readOnly ? "Read-only" : "Full"}\n`
    output += `Can delegate: ${agent.canDelegate ? "Yes" : "No"}\n\n`
    output += `Use when:\n`
    for (const use of agent.useWhen) {
      output += `- ${use}\n`
    }
    output += "\n"
  }
  
  return output
}

/**
 * Get one-liner descriptions for all agents.
 */
export function getAgentOneLiners(): Record<string, string> {
  const oneLiners: Record<string, string> = {}
  
  for (const [name, summary] of Object.entries(SUMMARIES)) {
    oneLiners[name] = summary.oneLiner
  }
  
  return oneLiners
}

/**
 * Build delegation context for prompts.
 */
export function buildDelegationContext(): string {
  let context = "## Agent Delegation\n\n"
  context += "Use `task()` to delegate to specialists:\n\n"
  
  const execAgents = getExecutionAgentSummaries()
  context += "### Execution Agents\n"
  for (const agent of execAgents) {
    context += `- \`${agent.name}\`: ${agent.oneLiner}\n`
  }
  
  context += "\n### Consultation Agents (Read-Only)\n"
  const consultAgents = getConsultationAgentSummaries()
  for (const agent of consultAgents) {
    context += `- \`${agent.name}\`: ${agent.oneLiner}\n`
  }
  
  context += "\n### Category Dispatch\n"
  context += "For execution work, use categories:\n"
  context += "```typescript\n"
  context += "task(\n"
  context += "  category: 'visual-engineering',\n"
  context += "  prompt: 'Create navigation component'\n"
  context += ")\n"
  context += "```\n"
  
  return context
}