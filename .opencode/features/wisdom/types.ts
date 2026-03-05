/**
 * Wisdom Types
 *
 * Type definitions for the wisdom accumulation system.
 */

export type WisdomCategory = 'Convention' | 'Success' | 'Failure' | 'Gotcha'

export type WisdomSeverity = 'critical' | 'major' | 'minor'

export interface WisdomItem {
  /** Category of wisdom */
  category: WisdomCategory
  
  /** Pattern name or type */
  pattern: string
  
  /** Problem or issue description */
  problem: string
  
  /** Solution or best practice */
  solution: string
  
  /** Where this wisdom applies */
  location?: string
  
  /** Additional context */
  context?: string
  
  /** Severity level */
  severity: WisdomSeverity
  
  /** When this wisdom was captured */
  timestamp: string
  
  /** Confidence level (0-100) */
  confidence: number
}

export interface WisdomFile {
  /** Feature name */
  feature: string
  
  /** Convention wisdom items */
  conventions: WisdomItem[]
  
  /** Success wisdom items */
  successes: WisdomItem[]
  
  /** Failure wisdom items */
  failures: WisdomItem[]
  
  /** Gotcha wisdom items */
  gotchas: WisdomItem[]
  
  /** Session metadata */
  sessions: Array<{
    date: string
    taskCount: number
    itemsAdded: number
  }>
}

export interface Decision {
  /** Decision title */
  title: string
  
  /** What was decided */
  decision: string
  
  /** Why this choice */
  rationale: string
  
  /** Alternatives considered */
  alternatives: Array<{
    option: string
    rejected: boolean
    reason: string
  }>
  
  /** Impact */
  impact: {
    affects: string[]
    dependencies: string[]
  }
  
  /** Timestamp */
  timestamp: string
  
  /** References */
  references?: {
    discussion?: string
    commit?: string
  }
}

export interface Issue {
  /** Issue ID */
  id: string
  
  /** Title */
  title: string
  
  /** Status */
  status: 'open' | 'resolved'
  
  /** Severity */
  severity: 'critical' | 'major' | 'minor'
  
  /** Context */
  context: string
  
  /** Description */
  description: string
  
  /** Workaround (if open) */
  workaround?: string
  
  /** Solution (if resolved) */
  solution?: string
  
  /** Resolution date */
  resolvedAt?: string
}

export interface WisdomQuery {
  /** Filter by category */
  category?: WisdomCategory
  
  /** Filter by feature */
  feature?: string
  
  /** Search pattern */
  pattern?: string
  
  /** Include recent only */
  recent?: number // days
  
  /** Minimum confidence */
  minConfidence?: number
}

export default {
  WisdomCategory: ['Convention', 'Success', 'Failure', 'Gotcha'] as const,
  WisdomSeverity: ['critical', 'major', 'minor'] as const
}