// ============================================================================
// AGENT OVERLAYS INDEX
// ============================================================================
// 
// Model-specific overlays that adjust agent behavior for Gemini and GPT models.
// These are applied when building agent configs for non-Claude models.
//

import type { AgentConfig } from "../types"

// Re-export overlay functions
export {
  applyGeminiOverlay,
  applyGPTOverlay,
} from "./gemini-overlays"

/**
 * Apply appropriate overlay based on model family.
 */
export function applyOverlayForModel(
  agentName: string,
  config: AgentConfig,
  modelHint?: string
): AgentConfig {
  const model = modelHint || config.model
  
  // Detect model family
  if (model.includes("gemini")) {
    const { applyGeminiOverlay } = require("./gemini-overlays")
    return applyGeminiOverlay(agentName, config)
  }
  
  if (model.includes("gpt") || model.includes("codex")) {
    const { applyGPTOverlay } = require("./gemini-overlays")
    return applyGPTOverlay(agentName, config)
  }
  
  // Claude and other models: no overlay needed
  return config
}