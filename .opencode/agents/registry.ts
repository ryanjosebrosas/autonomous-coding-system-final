// ============================================================================
// AGENT REGISTRY
// ============================================================================
// 
// Central registry of all built-in agents with their configurations.
// Each agent follows the AgentFactory pattern: createXXXAgent(model) → AgentConfig
//

import type { AgentMode } from "./types"

// ============================================================================
// AGENT METADATA TYPES
// ============================================================================

export interface AgentMetadata {
  name: string
  displayName: string
  description: string
  category: string
  model: string
  temperature: number
  mode: AgentMode
  permissions: AgentPermissions
  fallbackChain: readonly string[]
  deniedTools: string[]
  archonEnabled?: boolean // Optional: enables Archon RAG search capabilities
}

export interface AgentPermissions {
  readFile: boolean
  writeFile: boolean
  editFile: boolean
  bash: boolean
  grep: boolean
  task: boolean // Can delegate to other agents
}

// ============================================================================
// PERMISSION PRESETS
// ============================================================================

export const PERMISSIONS = {
  full: {
    readFile: true,
    writeFile: true,
    editFile: true,
    bash: true,
    grep: true,
    task: true,
  },
  readOnly: {
    readFile: true,
    writeFile: false,
    editFile: false,
    bash: false,
    grep: true,
    task: false,
  },
  fullNoTask: {
    readFile: true,
    writeFile: true,
    editFile: true,
    bash: true,
    grep: true,
    task: false, // Cannot delegate
  },
  visionOnly: {
    readFile: false,
    writeFile: false,
    editFile: false,
    bash: false,
    grep: false,
    task: false,
  },
  orchestratorOnly: {
    readFile: true,
    writeFile: false,
    editFile: false,
    bash: false,
    grep: true,
    task: true, // Can ONLY delegate
  },
} as const

// ============================================================================
// FALLBACK CHAINS
// ============================================================================

export const FALLBACK_CHAINS = {
  // Orchestrator
  sisyphus: ["ollama/glm-5:cloud"],

  // Execution/Analysis agents
  hephaestus: ["ollama/glm-5:cloud"],
  oracle: ["ollama/glm-5:cloud"],
  momus: ["ollama/glm-5:cloud"],
  metis: ["ollama/glm-5:cloud"],
  atlas: ["ollama/glm-5:cloud"],
  librarian: ["ollama/glm-5:cloud"],
  explore: ["ollama/glm-5:cloud"],
  prometheus: ["ollama/glm-5:cloud"],
  multimodalLooker: ["ollama/glm-5:cloud"],
  tmuxMaster: ["ollama/glm-5:cloud"],
  primeAgent: ["ollama/glm-5:cloud"],

  // Inherited from category dispatch
  sisyphusJunior: [],
} as const

// ============================================================================
// AGENT REGISTRY
// ============================================================================

export const AGENT_REGISTRY: Record<string, AgentMetadata> = {
  sisyphus: {
    name: "sisyphus",
    displayName: "Sisyphus — Main Orchestrator",
    description: "Primary orchestrator that manages workflow, plans, delegates, and maintains session continuity. Named after the figure who rolls the boulder each day — representing daily engineering work.",
    category: "unspecified-high",
    model: "anthropic/claude-sonnet-4-6",
    temperature: 0.1,
    mode: "all",
    permissions: PERMISSIONS.orchestratorOnly,
    fallbackChain: FALLBACK_CHAINS.sisyphus,
    deniedTools: [],
  },

  hephaestus: {
    name: "hephaestus",
    displayName: "Hephaestus — Deep Autonomous Worker",
    description: "Autonomous problem-solver for genuinely difficult, logic-heavy tasks. Takes clear goals and works autonomously without hand-holding.",
    category: "ultrabrain",
    model: "openai/gpt-5.3-codex",
    temperature: 0.1,
    mode: "all",
    permissions: PERMISSIONS.full,
    fallbackChain: FALLBACK_CHAINS.hephaestus,
    deniedTools: [],
  },

  atlas: {
    name: "atlas",
    displayName: "Atlas — Todo List Conductor",
    description: "Manages todo list and tracks progress. Ensures tasks don't fall through cracks and accumulates wisdom across sessions.",
    category: "writing",
    model: "ollama/glm-5:cloud",
    temperature: 0.1,
    mode: "primary",
    permissions: PERMISSIONS.full,
    fallbackChain: FALLBACK_CHAINS.atlas,
    deniedTools: ["task", "call_omo_agent"],
  },

  oracle: {
    name: "oracle",
    displayName: "Oracle — Architecture Consultant",
    description: "Read-only consultant for architecture decisions, debugging help, and multi-system tradeoffs. Provides consultation, never implementation.",
    category: "ultrabrain",
    model: "anthropic/claude-opus-4-6",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.oracle,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
  },

  prometheus: {
    name: "prometheus",
    displayName: "Prometheus — Strategic Planner",
    description: "Strategic planner with interview mode. Runs the full /planning process: intent classification, discovery interview, codebase research, design reasoning, task decomposition, and gap analysis. Produces plan.md + task-N.md artifacts.",
    category: "unspecified-high",
    model: "anthropic/claude-sonnet-4-6",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.full,
    fallbackChain: FALLBACK_CHAINS.prometheus,
    deniedTools: [],
  },

  metis: {
    name: "metis",
    displayName: "Metis — Pre-Planning Gap Analyzer",
    description: "Identifies hidden intentions, ambiguities, and AI failure points before planning. Uses higher temperature (0.3) for creative gap detection.",
    category: "artistry",
    model: "anthropic/claude-sonnet-4-6",
    temperature: 0.3, // Higher for creative gap detection
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.metis,
    deniedTools: ["write", "edit", "task"],
  },

  momus: {
    name: "momus",
    displayName: "Momus — Plan Reviewer",
    description: "Ruthless plan reviewer that ensures plans are complete, verifiable, and actionable. Rejects vague plans.",
    category: "ultrabrain",
    model: "anthropic/claude-opus-4-6",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.momus,
    deniedTools: ["write", "edit", "task"],
  },

  "sisyphus-junior": {
    name: "sisyphus-junior",
    displayName: "Sisyphus-Junior — Category Executor",
    description: "Focused executor spawned by category dispatch. Works autonomously within MUST DO / MUST NOT DO constraints. Cannot delegate further.",
    category: "unspecified-high", // Inherited from dispatch
    model: "openai/gpt-5.3-codex",
    temperature: 0.1,
    mode: "all",
    permissions: PERMISSIONS.fullNoTask,
    fallbackChain: [], // User-configurable via category
    deniedTools: ["task"],
  },

  librarian: {
    name: "librarian",
    displayName: "Librarian — External Documentation",
    description: "Searches external documentation and finds implementation examples from real repositories.",
    category: "writing",
    model: "ollama/glm-5:cloud",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.librarian,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
    archonEnabled: true,
  },

  explore: {
    name: "explore",
    displayName: "Explore — Internal Codebase Grep",
    description: "Fast contextual grep for the internal codebase. Find files, extract patterns, discover implementations.",
    category: "deep",
    model: "ollama/glm-5:cloud",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.explore,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
    archonEnabled: true,
  },

  "tmux-master": {
    name: "tmux-master",
    displayName: "Tmux-Master — Terminal Multiplexer",
    description: "Manages tmux sessions, windows, and panes. Use for interactive processes, REPLs, debuggers, TUI apps, long-running commands, and parallel terminal workflows.",
    category: "unspecified-low",
    model: "ollama/glm-5:cloud",
    temperature: 0.1,
    mode: "subagent",
    permissions: {
      readFile: false,
      writeFile: false,
      editFile: false,
      bash: true,
      grep: false,
      task: false,
    },
    fallbackChain: FALLBACK_CHAINS.tmuxMaster,
    deniedTools: ["write", "edit", "read", "grep", "task", "call_omo_agent"],
  },

  "prime-agent": {
    name: "prime-agent",
    displayName: "Prime Agent — Context Loader",
    description: "Lightweight context loading agent for /prime command. Gathers git state, stack detection, pipeline status, memory context.",
    category: "unspecified-low",
    model: "ollama/glm-5:cloud",
    temperature: 0.1,
    mode: "subagent",
    permissions: {
      readFile: true,
      writeFile: false,
      editFile: false,
      bash: true,
      grep: true,
      task: false,
    },
    fallbackChain: FALLBACK_CHAINS.primeAgent,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
  },

  "multimodal-looker": {
    name: "multimodal-looker",
    displayName: "Multimodal-Looker — PDF/Image Analysis",
    description: "Analyzes PDFs, images, diagrams, and visual content requiring interpretation beyond text extraction.",
    category: "unspecified-low",
    model: "ollama-cloud/gemini-3-flash-preview",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.visionOnly,
    fallbackChain: FALLBACK_CHAINS.multimodalLooker,
    deniedTools: ["write", "edit", "bash", "grep", "task", "call_omo_agent"],
  },
} as const

// ============================================================================
// AGENT LOOKUP FUNCTIONS
// ============================================================================

export function getAgentByName(name: string): AgentMetadata | null {
  return AGENT_REGISTRY[name] || null
}

export function getAllAgentNames(): string[] {
  return Object.keys(AGENT_REGISTRY)
}

export function getAgentsByMode(mode: AgentMode): AgentMetadata[] {
  return Object.values(AGENT_REGISTRY).filter(agent => agent.mode === mode || agent.mode === "all")
}

export function getAgentsByCategory(category: string): AgentMetadata[] {
  return Object.values(AGENT_REGISTRY).filter(agent => agent.category === category)
}

export function getReadOnlyAgents(): AgentMetadata[] {
  return Object.values(AGENT_REGISTRY).filter(agent => 
    !agent.permissions.writeFile && !agent.permissions.editFile
  )
}

export function getDelegatingAgents(): AgentMetadata[] {
  return Object.values(AGENT_REGISTRY).filter(agent => 
    agent.permissions.task === true
  )
}

// ============================================================================
// AGENT TYPE EXPORTS
// ============================================================================

export type AgentName = keyof typeof AGENT_REGISTRY

export const AGENT_NAMES: AgentName[] = [
  "sisyphus",
  "hephaestus",
  "atlas",
  "prometheus",
  "oracle",
  "metis",
  "momus",
  "sisyphus-junior",
  "librarian",
  "explore",
  "tmux-master",
  "prime-agent",
  "multimodal-looker",
] as const
