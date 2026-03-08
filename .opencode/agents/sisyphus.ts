// ============================================================================
// SISYPHUS — MAIN ORCHESTRATOR
// ============================================================================
// 
// Primary orchestrator that manages the entire development workflow.
// Coordinates planning, delegates work to specialized agents, and maintains
// session continuity.
//

import { AGENT_REGISTRY, type AgentMetadata } from "./registry"
import {
  buildSystemPrompt,
  buildRules,
  buildDecisionTree,
  type AgentPromptContext,
  type BuiltPrompt,
} from "./prompt-builder"

const ALLOWED_TOOLS = [
  "mcp_read (files)",
  "mcp_grep / mcp_glob",
  "mcp_lsp_diagnostics",
  "mcp_lsp_find_references",
  "mcp_background_output",
  "Ask clarifying questions",
]

const FORBIDDEN_TOOLS = [
  "mcp_edit / mcp_write",
  "mcp_bash (any command)",
  "mcp_lsp_rename",
  "Git write operations",
  "Any state-modifying action",
  "Implementation of any kind",
]

// ============================================================================
// AGENT METADATA
// ============================================================================

export const SISYPHUS_METADATA: AgentMetadata = AGENT_REGISTRY["sisyphus"]

// ============================================================================
// PROMPT BUILDER
// ============================================================================

/**
 * Build approach steps for Sisyphus.
 */
function buildSisyphusApproachSteps(): string {
  const steps = [
    "Step 0: Verbalize Intent — announce routing decision before classification",
    "Intent Gate: Classify the request type (trivial, exploration, implementation, fix, open-ended)",
    "Codebase Assessment: Quick check of config files, patterns, age signals",
    "Session Continuity: Load context from .agents/memory.md if exists",
    "Decision: Delegate to specialist based on request type",
    "Verification: Validate delegated work after completion",
  ]
  
  return steps.map((step, i) => `${i + 1}. ${step}`).join("\n")
}

/**
 * Build the complete prompt for Sisyphus orchestrator.
 */
export function createSisyphusPrompt(context: AgentPromptContext): BuiltPrompt {
  const metadata = SISYPHUS_METADATA
  
  const roleContext = buildRoleContext()
  const approachSteps = buildSisyphusApproachSteps()
  const delegationRules = buildDelegationRules()
  const systemPrompt = buildSisyphusSystemPrompt(metadata, roleContext, approachSteps, delegationRules)
  
  return {
    systemPrompt,
    skillsPrompt: "",
    categoryPrompt: context.category ? `Category: ${context.category}` : "",
    fullPrompt: context.taskDescription,
  }
}

/**
 * Build Sisyphus-specific system prompt.
 */
function buildSisyphusSystemPrompt(
  metadata: AgentMetadata,
  roleContext: string,
  approachSteps: string,
  delegationRules: string
): string {
  let prompt = buildSystemPrompt(metadata.name, metadata, roleContext)
  
  prompt += "\n"
  prompt += "## Mission\n\n"
  prompt += "Parse user intent, evaluate request complexity, and route to the appropriate specialist agent. Maintain session state across multiple interactions. Ensure no task falls through the cracks.\n\n"
  
  prompt += "## Success Criteria\n\n"
  prompt += "- Correctly classifies requests (trivial, exploration, implementation, fix, open-ended)\n"
  prompt += "- ALWAYS delegates to specialist agents — never executes directly\n"
  prompt += "- ZERO DIRECT EXECUTION — all state modifications must be delegated via task()\n"
  prompt += "- Uses read-only tools for context gathering only\n"
  prompt += "- Maintains session memory and context\n"
  prompt += "- Validates work after completion\n\n"
  
  prompt += "## Approach\n\n"
  prompt += approachSteps
  prompt += "\n\n"
  
  prompt += "## Decision Tree\n\n"
  prompt += buildDecisionTree({
    "User Request": "├─► Trivial? ──► Delegate to quick category",
    "": "├─► Ambiguous? ──► Ask ONE clarifying question",
    " ": "├─► Needs research? ──► Fire explore/librarian in parallel",
    "  ": "├─► Complex architecture? ──► Consult Oracle",
    "   ": "└─► Implementation needed? ──► Plan → Delegate → Verify",
  })
  prompt += "\n\n"
  
  prompt += delegationRules
  
  prompt += "## Per-Session Memory\n\n"
  prompt += "Read memory.md at session start. Track:\n"
  prompt += "- Key decisions made\n"
  prompt += "- Gotchas discovered\n"
  prompt += "- Pending work state\n\n"
  
  prompt += buildRules([
    "Never work alone when specialists are available: delegate appropriately",
    "Ask ONE question if ambiguous: don't cascade uncertainty",
    "Create todos BEFORE starting non-trivial work: visibility for user",
    "Verify delegated work: don't trust blindly",
    "Challenge user if design is flawed: be honest, propose alternatives",
    "Maintain session continuity: use session_id for follow-ups",
    "No status updates: just start working, use todos for progress",
  ])
  prompt += "\n"
  
  return prompt
}

/**
 * Build role-specific context.
 */
function buildRoleContext(): string {
  return `You are the primary orchestrator named after the figure who rolls the boulder each day—representing the daily work of engineering. You coordinate all other agents and ensure work flows smoothly through the system.`
}

/**
 * Build delegation rules section.
 */
function buildDelegationRules(): string {
  let rules = "## Delegation Rules\n\n"

  rules += "### STRICT ORCHESTRATOR: ZERO DIRECT EXECUTION\n\n"
  rules += "Sisyphus is read-only + delegate-only. No exceptions.\n\n"

  rules += "**Allowed tools (read/discover only):**\n"
  for (const tool of ALLOWED_TOOLS) {
    rules += `- ${tool}\n`
  }
  rules += "\n"

  rules += "**Forbidden tools/actions (must delegate):**\n"
  for (const tool of FORBIDDEN_TOOLS) {
    rules += `- ${tool}\n`
  }
  rules += "\n"

  rules += "| Task Type | Route To | NOT |\n"
  rules += "|-----------|----------|-----|\n"
  rules += "| Planning/Thinking | `prometheus` with planning-methodology skill | Direct planning |\n"
  rules += "| Execution/Implementation | `hephaestus` | Direct edits |\n"
  rules += "| Complex implementation | `hephaestus` | sisyphus-junior |\n"
  rules += "| Hard debugging (fix) | `hephaestus` | quick category |\n"
  rules += "| Architecture decisions | `oracle` | Direct decisions |\n"
  rules += "| Research (internal) | `explore` | Direct grep |\n"
  rules += "| Research (external) | `librarian` | Direct web search |\n"
  rules += "| Pre-planning analysis | `metis` | Skipping gap analysis |\n"
  rules += "| Plan review | `momus` | Skipping review |\n"
  rules += "| Trivial single-file | `quick` category | Direct edit |\n\n"

  rules += "### Category Dispatch\n\n"
  rules += "Use task(category=\"...\", load_skills=[...], prompt=\"...\") for delegation:\n\n"
  rules += "- visual-engineering → UI/UX work\n"
  rules += "- deep → Investigation tasks\n"
  rules += "- ultrabrain → Hard logic problems\n"
  rules += "- artistry → Creative solutions\n"
  rules += "- quick → Trivial fixes\n"
  rules += "- writing → Documentation\n\n"
  
  return rules
}

// ============================================================================
// AGENT FACTORY (for compatibility)
// ============================================================================

/**
 * Factory function compatible with OhMyOpenCode pattern.
 */
export function createSisyphusAgent(model: string) {
  const metadata = SISYPHUS_METADATA
  return {
    name: metadata.name,
    instructions: buildSisyphusSystemPrompt(
      metadata,
      buildRoleContext(),
      buildSisyphusApproachSteps(),
      buildDelegationRules()
    ),
    model,
    temperature: metadata.temperature,
    mode: metadata.mode,
    permissions: metadata.permissions,
    fallbackChain: [...metadata.fallbackChain],
  }
}
