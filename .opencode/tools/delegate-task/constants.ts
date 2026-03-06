// ============================================================================
// CATEGORY PROMPT APPENDS
// ============================================================================

/**
 * Category-specific prompt appends that get prepended to subagent prompts
 * when dispatching by category. These provide domain-specific context and
 * guidance based on the task category.
 * 
 * Source: OhMyOpenCode task delegation system
 */

export const CATEGORY_PROMPT_APPENDS = {
  "visual-engineering": `You are a frontend specialist focused on visual excellence. Prioritize:
- Pixel-perfect implementation
- Responsive design patterns
- Accessibility (WCAG standards)
- Performance optimization
- Modern CSS/animation techniques

Deliver clean, maintainable UI code.`,

  "ultrabrain": `You are solving a genuinely difficult problem that requires exceptional reasoning capability.

Approach:
1. Break down the problem systematically
2. Identify all edge cases and constraints
3. Consider multiple solution approaches
4. Evaluate tradeoffs explicitly
5. Implement the optimal solution

Think step by step. Quality over speed.`,

  "artistry": `You are a creative problem-solver approaching challenges with unconventional thinking.

Permission to:
- Challenge assumptions
- Explore non-obvious solutions
- Combine ideas from different domains
- Propose novel approaches

Creativity welcome. Standard solutions discouraged.`,

  "quick": `Quick task mode. Focus on:
- Speed
- Accuracy
- Minimal changes
- No over-engineering

Get in, make the change, get out.`,

  "deep": `You are on a deep investigation mission.

Protocol:
1. Research thoroughly before acting
2. Use all available tools (grep, read, search)
3. Consider multiple hypotheses
4. Verify findings with evidence
5. Document your reasoning

Take the time needed to be thorough.`,

  "unspecified-low": `General-purpose execution. Focus on:
- Clear implementation
- Following existing patterns
- Clean code
- Proper error handling

Straightforward, reliable execution.`,

  "unspecified-high": `High-stakes general task requiring careful execution.

Prioritize:
- Thoroughness
- Correctness
- Edge case handling
- Clear documentation
- Maintainability

Take time to get it right.`,

  "writing": `You are a technical writer.

Focus on:
- Clarity and readability
- Proper structure and organization
- Accurate technical content
- Audience-appropriate language
- Complete coverage

Write documentation that developers actually want to read.`,
} as const

export type CategoryPromptAppendKey = keyof typeof CATEGORY_PROMPT_APPENDS

// ============================================================================
// CATEGORY SELECTION GATES
// ============================================================================

/**
 * Selection gates prevent misuse of categories by validating that the
 * requested category is appropriate for the task at hand.
 * 
 * Each gate function returns:
 * - { valid: true } if category is appropriate
 * - { valid: false, reason: string } if category should not be used
 */

export interface SelectionGateResult {
  valid: boolean
  reason?: string
  suggestion?: string
}

/**
 * Gate for 'quick' category - warns against using for complex tasks.
 */
export function quickCategoryGate(taskDescription: string): SelectionGateResult {
  const complexKeywords = [
    "architecture", "design", "refactor", "multiple files",
    "complex", "security", "encryption", "authentication",
    "database", "migration", "performance", "optimize",
    "algorithm", "implement feature", "integrate"
  ]
  
  const hasComplexKeywords = complexKeywords.some(kw => 
    taskDescription.toLowerCase().includes(kw)
  )
  
  if (hasComplexKeywords) {
    return {
      valid: false,
      reason: "Task appears too complex for 'quick' category",
      suggestion: "Consider using 'deep' or 'unspecified-high' category instead"
    }
  }
  
  return { valid: true }
}

/**
 * Gate for 'ultrabrain' category - ensures it's used for genuinely hard tasks.
 */
export function ultrabrainCategoryGate(taskDescription: string): SelectionGateResult {
  const hardKeywords = [
    "algorithm", "architecture", "compiler", "distributed",
    "optimization", "security", "encryption", "design system",
    "complex", "reasoning", "analysis", "pattern"
  ]
  
  const hasHardKeywords = hardKeywords.some(kw => 
    taskDescription.toLowerCase().includes(kw)
  )
  
  if (!hasHardKeywords) {
    return {
      valid: false,
      reason: "Task does not appear to require 'ultrabrain' level reasoning",
      suggestion: "Consider using 'deep' or 'unspecified-high' category instead"
    }
  }
  
  return { valid: true }
}

/**
 * Gate for 'artistry' category - suggests it when creativity is needed.
 */
export function artistryCategoryGate(taskDescription: string): SelectionGateResult {
  const creativeKeywords = [
    "creative", "innovative", "unconventional", "novel",
    "outside the box", "unique", "original", "alternative"
  ]
  
  // Artistry is valid for any task, but we warn if it seems conventional
  const hasCreativeKeywords = creativeKeywords.some(kw => 
    taskDescription.toLowerCase().includes(kw)
  )
  
  if (!hasCreativeKeywords) {
    // This is a soft warning - artistry can still be used, but standard categories might be better
    return {
      valid: true, // Still valid, just informational
      reason: "Task appears conventional - 'artistry' may produce unexpected approaches"
    }
  }
  
  return { valid: true }
}

/**
 * Gate for 'deep' category - validates research-intensive tasks.
 */
export function deepCategoryGate(taskDescription: string): SelectionGateResult {
  const researchKeywords = [
    "investigate", "research", "explore", "analyze", "find",
    "debug", "trace", "understand", "figure out", "why"
  ]
  
  const hasResearchKeywords = researchKeywords.some(kw => 
    taskDescription.toLowerCase().includes(kw)
  )
  
  if (!hasResearchKeywords) {
    return {
      valid: true, // Deep can still be used for complex tasks
      reason: "Consider if this task really needs 'deep' investigation vs simpler category"
    }
  }
  
  return { valid: true }
}

/**
 * Main function to validate category selection.
 */
export function validateCategorySelection(
  category: string,
  taskDescription: string
): SelectionGateResult {
  switch (category) {
    case "quick":
      return quickCategoryGate(taskDescription)
    case "ultrabrain":
      return ultrabrainCategoryGate(taskDescription)
    case "artistry":
      return artistryCategoryGate(taskDescription)
    case "deep":
      return deepCategoryGate(taskDescription)
    default:
      return { valid: true }
  }
}

// ============================================================================
// CATEGORY MODEL MAPPINGS (from categories.json)
// ============================================================================

/**
 * Hardcoded model mappings for categories.
 * These are extracted from categories.json for fast lookup.
 * The JSON file remains the source of truth for customization.
 */
export const CATEGORY_MODEL_ROUTES: Record<string, {
  provider: string
  model: string
  label: string
}> = {
  "visual-engineering": {
    provider: "ollama",
    model: "gemini-3-flash-preview-cloud",
    label: "GEMINI-3-FLASH"
  },
  "ultrabrain": {
    provider: "openai",
    model: "gpt-5.3-codex",
    label: "GPT-5.3-CODEX"
  },
  "artistry": {
    provider: "ollama",
    model: "gemini-3-flash-preview-cloud",
    label: "GEMINI-3-FLASH"
  },
  "quick": {
    provider: "ollama",
    model: "glm-4.7:cloud",
    label: "GLM-4.7"
  },
  "deep": {
    provider: "ollama",
    model: "qwen3-coder-next:cloud",
    label: "QWEN3-CODER-NEXT"
  },
  "unspecified-low": {
    provider: "ollama",
    model: "qwen3-coder-next:cloud",
    label: "QWEN3-CODER-NEXT"
  },
  "unspecified-high": {
    provider: "ollama",
    model: "deepseek-v3.1:671b-cloud",
    label: "DEEPSEEK-V3.1"
  },
  "writing": {
    provider: "ollama",
    model: "kimi-k2.5:cloud",
    label: "KIMI-K2.5"
  }
}