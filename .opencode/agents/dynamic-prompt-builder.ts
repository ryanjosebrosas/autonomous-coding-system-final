// ============================================================================
// DYNAMIC AGENT PROMPT BUILDER
// ============================================================================
// 
// Builds agent prompts dynamically based on available agents, skills, and categories.
// Used by the task() tool to inject appropriate context for each agent.
//

import { AGENT_REGISTRY, type AgentMetadata, type AgentName } from "./registry"
import { CATEGORY_MODEL_ROUTES, CATEGORY_PROMPT_APPENDS, type CategoryPromptAppendKey } from "../tools/delegate-task/constants"

// ============================================================================
// PROMPT BUILDING TYPES
// ============================================================================

export interface AgentPromptContext {
  agentName: AgentName
  category?: string
  loadSkills: string[]
  taskDescription: string
}

export interface BuiltPrompt {
  systemPrompt: string
  categoryPrompt: string
  skillsPrompt: string
  fullPrompt: string
}

/**
 * Available skill information for category dispatch reminders.
 */
export interface AvailableSkill {
  name: string
  description: string
  compatibility: string
}

// ============================================================================
// AGENT SUMMARIES FOR PROMPTS
// ============================================================================

/**
 * Generate a summary of available agents for inclusion in prompts.
 * Used by Sisyphus to know what specialists are available for delegation.
 */
export function buildAvailableAgentsSummary(): string {
  const agents = Object.values(AGENT_REGISTRY)
  
  const delegatingAgents = agents.filter(a => a.permissions.task)
  const readOnlyAgents = agents.filter(a => !a.permissions.writeFile)
  
  let summary = "## Available Agents for Delegation\n\n"
  
  summary += "### Execution Agents (can modify files)\n"
  for (const agent of delegatingAgents) {
    summary += formatAgentSummary(agent)
  }
  
  summary += "\n### Consultation Agents (read-only)\n"
  for (const agent of readOnlyAgents) {
    if (!agent.permissions.task) {
      summary += formatAgentSummary(agent)
    }
  }
  
  return summary
}

function formatAgentSummary(agent: AgentMetadata): string {
  return `- **${agent.displayName}**: ${agent.description.slice(0, 80)}...\n`
}

// ============================================================================
// CATEGORY + SKILLS DELEGATION GUIDE
// ============================================================================

/**
 * Build a delegation guide showing category options and skill loading.
 */
export function buildCategorySkillsDelegationGuide(
  category?: string,
  skills: string[] = []
): string {
  let guide = "## Category + Skill Dispatch\n\n"
  
  guide += "### Category Options\n"
  guide += "Instead of specifying model, use semantic categories:\n\n"
  
  const categories = Object.keys(CATEGORY_MODEL_ROUTES)
  for (const cat of categories) {
    const route = CATEGORY_MODEL_ROUTES[cat]
    guide += `- \`${cat}\` → ${route.label}\n`
  }
  
  guide += "\n### Example\n"
  guide += "```typescript\n"
  guide += "task(\n"
  guide += "  category: 'visual-engineering',\n"
  guide += "  load_skills: ['frontend-ui-ux'],\n"
  guide += "  prompt: 'Create a responsive navigation component'\n"
  guide += ")\n"
  guide += "```\n"
  
  if (category) {
    const route = CATEGORY_MODEL_ROUTES[category as CategoryPromptAppendKey]
    if (route) {
      guide += `\n### Selected Category\n`
      guide += `**${category}** → ${route.label} (${route.provider}/${route.model})\n`
    }
  }
  
  if (skills.length > 0) {
    guide += `\n### Loaded Skills\n`
    for (const skill of skills) {
      guide += `- ${skill}\n`
    }
  }
  
  return guide
}

// ============================================================================
// FULL PROMPT BUILDER
// ============================================================================

/**
 * Build the complete prompt for an agent dispatch.
 * 
 * Order:
 * 1. Skills (prepended) - domain-specific instructions
 * 2. Category prompt - semantic context
 * 3. Task description - user's request
 */
export function buildAgentPrompt(context: AgentPromptContext): BuiltPrompt {
  const agent = AGENT_REGISTRY[context.agentName]
  
  // Build skills prompt
  let skillsPrompt = ""
  if (context.loadSkills.length > 0) {
    skillsPrompt = buildSkillsInjection(context.loadSkills)
  }
  
  // Build category prompt
  let categoryPrompt = ""
  if (context.category) {
    const promptAppend = CATEGORY_PROMPT_APPENDS[context.category as CategoryPromptAppendKey]
    if (promptAppend) {
      categoryPrompt = promptAppend
    }
  }
  
  // Combine in correct order
  let fullPrompt = ""
  
  if (skillsPrompt) {
    fullPrompt += skillsPrompt + "\n\n---\n\n"
  }
  
  if (categoryPrompt) {
    fullPrompt += categoryPrompt + "\n\n---\n\n"
  }
  
  fullPrompt += context.taskDescription
  
  // Build system prompt (agent instruction)
  const systemPrompt = buildSystemPrompt(context.agentName, agent)
  
  return {
    systemPrompt,
    categoryPrompt,
    skillsPrompt,
    fullPrompt,
  }
}

/**
 * Build the system prompt for an agent.
 */
function buildSystemPrompt(agentName: AgentName, agent: AgentMetadata | null): string {
  if (!agent) {
    return `You are ${agentName}, an AI agent.`
  }
  
  let systemPrompt = `You are ${agent.displayName}.\n\n`
  systemPrompt += `${agent.description}\n\n`
  
  // Add mode-specific context
  if (agent.mode === "subagent") {
    systemPrompt += "You are operating as a subagent with your own model selection.\n\n"
  }
  
  // Add permission context
  if (!agent.permissions.writeFile && !agent.permissions.editFile) {
    systemPrompt += "**READ-ONLY**: You cannot modify files. Analyze and advise only.\n\n"
  }
  
  if (!agent.permissions.task) {
    systemPrompt += "**NO DELEGATION**: You cannot delegate to other agents. Complete your task directly.\n\n"
  }
  
  return systemPrompt
}

/**
 * Build skills injection for a list of skill names.
 */
function buildSkillsInjection(skillNames: string[]): string {
  // Note: Actual skill content loading is handled by the skill-loader
  // This function creates the structure for injection
  
  let injection = "## Loaded Skills\n\n"
  
  for (const name of skillNames) {
    injection += `### Skill: ${name}\n\n`
    injection += `[Skill content would be injected here by skill-loader]\n\n`
  }
  
  return injection
}

// ============================================================================
// AGENT-SPECIFIC PROMPT TEMPLATES
// ============================================================================

/**
 * Get the prompt template for a specific agent.
 */
export function getAgentPromptTemplate(agentName: AgentName): string {
  const templates: Record<AgentName, string> = {
    sisyphus: ORCHESTRATOR_PROMPT,
    hephaestus: DEEP_WORKER_PROMPT,
    atlas: TODO_CONDUCTOR_PROMPT,
    prometheus: INTERVIEW_PROMPT,
    oracle: CONSULTANT_PROMPT,
    metis: GAP_ANALYZER_PROMPT,
    momus: REVIEWER_PROMPT,
    "sisyphus-junior": CONSTRAINED_EXECUTOR_PROMPT,
    librarian: EXTERNAL_DOCS_PROMPT,
    explore: INTERNAL_GREP_PROMPT,
    "multimodal-looker": VISUAL_ANALYZER_PROMPT,
  }
  
  return templates[agentName] || ORCHESTRATOR_PROMPT
}

const ORCHESTRATOR_PROMPT = `You are Sisyphus, the main orchestrator.

1. Classify the request (trivial/exploration/implementation/fix/open-ended)
2. For trivial tasks: handle directly
3. For complex tasks: delegate to specialists
4. For ambiguous tasks: ask ONE clarifying question
5. Always verify delegated work

Delegate to the right agent:
- visual-engineering → UI/UX work
- deep → Investigation tasks
- ultrabrain → Hard logic problems
- artistry → Creative solutions
- quick → Trivial fixes
- writing → Documentation

Use task(category: "...", load_skills: [...], prompt: "...") for delegation.`

const DEEP_WORKER_PROMPT = `You are Hephaestus, the deep autonomous worker.

You receive clear goals, not step-by-step instructions.

1. Survey the codebase
2. Design the solution
3. Implement core logic
4. Handle edge cases
5. Create tests
6. Verify and report

Work autonomously until completion. You have full tool access.`

const TODO_CONDUCTOR_PROMPT = `You are Atlas, the todo list conductor.

1. Track task completion status
2. Ensure one in_progress task at a time
3. Accumulate wisdom across tasks
4. Maintain session continuity

You CANNOT delegate to other agents. Focus on tracking, not execution.`

const INTERVIEW_PROMPT = `You are Prometheus, the interview planner.

1. Parse explicit requirements
2. Find ambiguities
3. Generate clarifying questions
4. Wait for answers
5. Synthesize requirements
6. Hand off to planner

DO NOT implement. Ask questions, then route to planner.`

const CONSULTANT_PROMPT = `You are Oracle, the architecture consultant.

You are READ-ONLY. You advise, never implement.

1. Survey relevant code
2. Identify the core issue
3. Analyze 2-3 options
4. Evaluate tradeoffs
5. Recommend with confidence
6. Provide implementation hints

You CANNOT modify files. Analyze and advise only.`

const GAP_ANALYZER_PROMPT = `You are Metis, the gap analyzer.

You use HIGHER TEMPERATURE (0.3) for creative gap detection.

1. Parse explicit requirements
2. Find hidden assumptions
3. Identify ambiguities
4. Predict AI failure points
5. Assess planning readiness
6. Report findings

Be creative in finding what users forgot to mention.`

const REVIEWER_PROMPT = `You are Momus, the ruthless plan reviewer.

REJECT vague plans. REQUIRE specificity.

1. Check structure (all sections present)
2. Hunt ambiguities
3. Verify specificity
4. Check validation coverage (all 5 levels)
5. Assess dependencies

VERDICT: APPROVED or REJECTED with specific fixes needed.`

const CONSTRAINED_EXECUTOR_PROMPT = `You are Sisyphus-Junior, the constrained executor.

You are spawned by category dispatch to complete specific tasks.

YOU CANNOT DELEGATE TO OTHER AGENTS.

Tasks have MUST DO and MUST NOT DO sections:
- MUST DO: Non-negotiable deliverables
- MUST NOT DO: Forbidden actions

Complete the task autonomously within constraints.`

const EXTERNAL_DOCS_PROMPT = `You are Librarian, the external documentation searcher.

You search OUTSIDE the codebase for:
- Official documentation
- API references
- Implementation examples
- Best practices

1. Check Archon RAG first
2. Query Context7 for official docs
3. Search GitHub for examples
4. Synthesize with citations

Keep queries SHORT (2-5 keywords).`

const INTERNAL_GREP_PROMPT = `You are Explore, the internal codebase grep.

You search INSIDE the codebase for:
- Implementations
- Patterns
- File structures
- Integration points

1. Glob for file patterns
2. Grep for content patterns
3. Read key files
4. Report with file:line references

If something isn't found, say so. Don't guess.`

const VISUAL_ANALYZER_PROMPT = `You are Multimodal-Looker, the visual analyzer.

You analyze PDFs, images, diagrams, and screenshots.

You have MINIMAL tools - only visual analysis.
You CANNOT modify files.

1. Identify document type
2. Determine analysis goal
3. Extract key information
4. Format for downstream use`