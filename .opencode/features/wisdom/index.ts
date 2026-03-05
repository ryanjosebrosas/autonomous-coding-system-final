/**
 * Wisdom Index
 *
 * Public API for the wisdom system.
 */

export { extractFromReviewFinding, extractFromTestFailure, extractFromSuccess, extractFromReport } from './extractor'
export { categorize, scoreRelevance, groupByCategory, mergeDuplicates, categorizeItems } from './categorizer'
export { inject, buildInjectionBlock } from './injector'
export { 
  loadWisdom, 
  saveWisdom, 
  addWisdomItem, 
  addWisdomItems, 
  searchWisdom,
  loadDecisions,
  saveDecision,
  loadIssues,
  saveIssue,
  ensureWisdomDir 
} from './storage'
export type { 
  WisdomItem, 
  WisdomCategory, 
  WisdomFile, 
  Decision, 
  Issue, 
  WisdomQuery 
} from './types'
// Re-export the constant values for runtime use
export { WisdomCategory as WisdomCategoryConst, WisdomSeverity as WisdomSeverityConst } from './types'