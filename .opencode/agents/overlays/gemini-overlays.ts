// ============================================================================
// GEMINI MODEL OVERLAYS FOR AGENTS
// ============================================================================
// 
// Gemini models have different behavior patterns than Claude/GPT models.
// These overlays adjust instructions to work better with Gemini's tendencies.
//

import type { AgentConfig } from "./types"

// ============================================================================
// GEMINI ADJUSTMENTS
// ============================================================================

/**
 * Gemini tends to be more verbose. This overlay encourages concisen.
 */
const CONCISE_OUTPUT_OVERLAY = `
## Output Style

Be CONCISE. Gemini tends to over-explain. Instead:
- Direct answers first, explanations after
- Use bullet points for lists
- Skip redundant context
- One word answers acceptable when appropriate
`

/**
 * Gemini can struggle with very long contexts. This overlay encourages focus.
 */
const FOCUS_OVERLAY = `
## Context Management

Focus on the relevant context. Gemini's long context can lead to information overload:
- Identify the key question/request
- Filter context to what's relevant
- Don't process everything if only a subset matters
`

/**
 * Gemini sometimes produces generic responses. This overlay encourages specificity.
 */
const SPECIFICITY_OVERLAY = `
## Be Specific

Avoid generic responses. Instead:
- Give specific examples
- Name exact files/functions when relevant
- Provide concrete values, not ranges
- Cite sources when making claims
`

/**
 * Gemini's thinking can be hard to follow. This overlay structures output.
 */
const STRUCTURE_OVERLAY = `
## Structure Your Output

Use clear sections:
1. Answer/Result first
2. Explanation second
3. Details/code last

This helps users find the key information quickly.
`

// ============================================================================
// AGENT-SPECIFIC OVERLAYS
// ============================================================================

/**
 * Sisyphus overlay for Gemini.
 * Focus on: clear delegation, concise summaries, structured decisions.
 */
export function applyGeminiOverlayToSisyphus(config: AgentConfig): AgentConfig {
  return {
    ...config,
    instructions: config.instructions + `

${CONCISE_OUTPUT_OVERLAY}

## Delegation Style

When delegating to specialists:
- State the task clearly in ONE sentence
- List constraints as bullet points
- Specify success criteria
- Don't over-explain

${STRUCTURE_OVERLAY}
`,
  }
}

/**
 * Hephaestus overlay for Gemini.
 * Focus on: autonomous focus, avoiding over-engineering.
 */
export function applyGeminiOverlayToHephaestus(config: AgentConfig): AgentConfig {
  return {
    ...config,
    instructions: config.instructions + `

${FOCUS_OVERLAY}

## Deep Work Style

You're autonomous but avoid:
- Over-engineering when simple works
- Excessive abstraction
- Unused flexibility
- Premature optimization

Build what's needed. Ship it. Move on.

${CONCISE_OUTPUT_OVERLAY}
`,
  }
}

/**
 * Oracle overlay for Gemini.
 * Focus on: structured recommendations, avoid waffle.
 */
export function applyGeminiOverlayToOracle(config: AgentConfig): AgentConfig {
  return {
    ...config,
    instructions: config.instructions + `

${STRUCTURE_OVERLAY}

## Recommendation Format

Always structure as:
1. **Recommendation**: Single best option
2. **Reasoning**: Why this option
3. **Tradeoffs**: What you give up
4. **Implementation hints**: How to proceed

${CONCISE_OUTPUT_OVERLAY}

${SPECIFICITY_OVERLAY}
`,
  }
}

/**
 * Momus overlay for Gemini.
 * Focus on: concise rejections, actionable fixes.
 */
export function applyGeminiOverlayToMomus(config: AgentConfig): AgentConfig {
  return {
    ...config,
    instructions: config.instructions + `

${CONCISE_OUTPUT_OVERLAY}

## Rejection Style

When rejecting:
- State the issue clearly in ONE line
- List missing items as bullets
- Don't over-explain

Example:
"Issue: Missing acceptance criteria"
Missing:
- Unit tests
- Edge case handling
- Error scenarios

Fix: Add these sections and re-submit.
`,
  }
}

// ============================================================================
// OVERLAY APPLICATION FUNCTION
// ============================================================================

/**
 * Apply Gemini-specific overlays to an agent config.
 */
export function applyGeminiOverlay(agentName: string, config: AgentConfig): AgentConfig {
  const overlayFunctions: Record<string, (c: AgentConfig) => AgentConfig> = {
    sisyphus: applyGeminiOverlayToSisyphus,
    hephaestus: applyGeminiOverlayToHephaestus,
    oracle: applyGeminiOverlayToOracle,
    momus: applyGeminiOverlayToMomus,
  }
  
  const applyOverlay = overlayFunctions[agentName]
  if (!applyOverlay) {
    // Default overlay for other agents
    return {
      ...config,
      instructions: config.instructions + `

${CONCISE_OUTPUT_OVERLAY}

${STRUCTURE_OVERLAY}
`,
    }
  }
  
  return applyOverlay(config)
}

// ============================================================================
// GPT MODEL OVERLAYS FOR AGENTS
// ============================================================================

/**
 * GPT models tend to be good at reasoning but can be verbose.
 */
const GPT_REASONING_OVERLAY = `
## Reasoning Style

Show your reasoning, but keep it focused:
- State key assumptions
- Walk through logic
- Highlight decision points
- Be explicit about trade-offs
`

/**
 * GPT can sometimes be overconfident. This overlay encourages uncertainty.
 */
const UNCERTAINTY_OVERLAY = `
## Confidence Levels

When uncertain:
- State confidence level (high/medium/low)
- Explain what would increase confidence
- Note edge cases
- Highlight areas needing verification
`

/**
 * Apply GPT-specific overlays to an agent config.
 */
export function applyGPTOverlay(agentName: string, config: AgentConfig): AgentConfig {
  // GPT models use reasoningOverlay for most agents
  return {
    ...config,
    instructions: config.instructions + `

${GPT_REASONING_OVERLAY}

${UNCERTAINTY_OVERLAY}
`,
  }
}