// ============================================================================
// CATEGORY SELECTOR
// ============================================================================

import { CATEGORY_MODEL_ROUTES, CATEGORY_PROMPT_APPENDS, validateCategorySelection, type SelectionGateResult } from "./constants"

/**
 * Category routing result from resolution.
 */
export interface CategoryRouteResult {
  category: string
  provider: string
  model: string
  label: string
  promptAppend?: string
  gateWarning?: string
  source: "category" | "fallback"
}

/**
 * Options for category selection.
 */
export interface CategorySelectionOptions {
  /** Warn on invalid category selection */
  warnOnInvalid?: boolean
  /** Return fallback on invalid instead of error */
  useFallbackOnInvalid?: boolean
  /** Task description for gate validation */
  taskDescription?: string
}

/**
 * Resolve a category name to its model route.
 * 
 * Priority:
 * 1. Category lookup in CATEGORY_MODEL_ROUTES
 * 2. Fallback to TASK_ROUTES default
 * 3. Hardcoded fallback model
 */
export function resolveCategory(
  category: string,
  options: CategorySelectionOptions = {}
): CategoryRouteResult | null {
  const { warnOnInvalid = true, useFallbackOnInvalid = true, taskDescription } = options
  
  // Check if category exists
  const route = CATEGORY_MODEL_ROUTES[category]
  
  if (!route) {
    // Unknown category - use fallback
    if (warnOnInvalid) {
      console.warn(`Unknown category: ${category}. Using fallback.`)
    }
    return {
      category: "fallback",
      provider: "ollama",
      model: "glm-4.7",
      label: "GLM-4.7 (fallback)",
      source: "fallback"
    }
  }
  
  // Validate category selection with gates
  if (taskDescription) {
    const gateResult = validateCategorySelection(category, taskDescription)
    
    if (!gateResult.valid) {
      if (useFallbackOnInvalid) {
        if (warnOnInvalid) {
          console.warn(`Category gate warning: ${gateResult.reason}`)
          if (gateResult.suggestion) {
            console.warn(`Suggestion: ${gateResult.suggestion}`)
          }
        }
        // Still return the route but with warning
        return {
          category,
          provider: route.provider,
          model: route.model,
          label: route.label,
          gateWarning: gateResult.reason,
          source: "category"
        }
      }
      // Return null to indicate invalid selection
      return null
    }
    
    // Valid with optional soft warning
    return {
      category,
      provider: route.provider,
      model: route.model,
      label: route.label,
      gateWarning: gateResult.reason,
      source: "category"
    }
  }
  
  // No task description - skip gate validation
  return {
    category,
    provider: route.provider,
    model: route.model,
    label: route.label,
    source: "category"
  }
}

/**
 * Check if a string is a valid category name.
 */
export function isValidCategory(category: string): boolean {
  return category in CATEGORY_MODEL_ROUTES
}

/**
 * Get all available category names.
 */
export function getAvailableCategories(): string[] {
  return Object.keys(CATEGORY_MODEL_ROUTES)
}

/**
 * Get category metadata without routing.
 */
export function getCategoryMetadata(category: string): {
  provider: string
  model: string
  label: string
} | null {
  return CATEGORY_MODEL_ROUTES[category] || null
}

/**
 * Get the prompt append for a category.
 * Returns an empty string for unknown categories.
 */
export function getCategoryPromptAppend(category: string): string {
  return CATEGORY_PROMPT_APPENDS[category as keyof typeof CATEGORY_PROMPT_APPENDS] || ""
}