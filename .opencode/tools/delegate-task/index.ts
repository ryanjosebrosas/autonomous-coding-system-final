// ============================================================================
// DELEGATE-TASK MODULE EXPORTS
// ============================================================================

export {
  CATEGORY_PROMPT_APPENDS,
  CATEGORY_MODEL_ROUTES,
  quickCategoryGate,
  ultrabrainCategoryGate,
  artistryCategoryGate,
  deepCategoryGate,
  validateCategorySelection,
  type CategoryPromptAppendKey,
  type SelectionGateResult
} from "./constants"

export {
  resolveCategory,
  isValidCategory,
  getAvailableCategories,
  getCategoryMetadata,
  type CategoryRouteResult,
  type CategorySelectionOptions
} from "./category-selector"