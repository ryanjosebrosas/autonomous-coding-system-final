/**
 * Wisdom Injector
 *
 * Injects relevant wisdom into subagent prompts at task start.
 */

import { WisdomItem, WisdomQuery } from './types'
import { loadWisdom, searchWisdom } from './storage'
import { scoreRelevance } from './categorizer'

/**
 * Context for wisdom injection.
 */
export interface InjectionContext {
  /** Feature being worked on */
  feature: string
  
  /** Files being modified */
  files?: string[]
  
  /** Task type/subagent category */
  taskType?: string
  
  /** Keywords from the task description */
  keywords?: string[]
  
  /** Patterns expected or mentioned */
  patterns?: string[]
}

/**
 * Injected wisdom for a prompt.
 */
export interface InjectedWisdom {
  /** Raw wisdom items */
  items: WisdomItem[]
  
  /** Formatted injection text */
  formatted: string
  
  /** Stats */
  stats: {
    total: number
    byCategory: Record<string, number>
    avgConfidence: number
  }
}

/**
 * Inject relevant wisdom into a prompt.
 */
export function inject(context: InjectionContext): InjectedWisdom {
  // Build query
  const query: WisdomQuery = {
    feature: context.feature,
    recent: 90, // Last 90 days
    minConfidence: 50
  }
  
  // Load wisdom for this feature
  const allWisdom = loadWisdom(context.feature)
  
  // Search for relevant items
  let items = searchWisdom(allWisdom, query)
  
  // Score relevance and filter
  const scored = items.map(item => ({
    ...item,
    relevanceScore: calculateRelevance(item, context)
  })).filter(item => item.relevanceScore >= 40)
  
  // Sort by relevance
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore)
  
  // Limit to top items
  const topItems = scored.slice(0, 10)
  
  // Format for injection
  const formatted = formatForInjection(topItems)
  
  // Calculate stats
  const stats = {
    total: topItems.length,
    byCategory: countByCategory(topItems),
    avgConfidence: averageConfidence(topItems)
  }
  
  return {
    items: topItems,
    formatted,
    stats
  }
}

/**
 * Calculate relevance score for injection.
 * Uses the canonical scoreRelevance from categorizer.ts.
 */
function calculateRelevance(item: WisdomItem, context: InjectionContext): number {
  // Delegate to canonical scoring function
  return scoreRelevance(item, context)
}

/**
 * Format wisdom items for prompt injection.
 */
function formatForInjection(items: WisdomItem[]): string {
  if (items.length === 0) {
    return ''
  }
  
  const sections: string[] = []
  
  // Group by category
  const conventions = items.filter(i => i.category === 'Convention')
  const gotchas = items.filter(i => i.category === 'Gotcha')
  const failures = items.filter(i => i.category === 'Failure')
  const successes = items.filter(i => i.category === 'Success')
  
  if (gotchas.length > 0) {
    sections.push(`
## ⚠️ GOTCHAS TO AVOID

${gotchas.map(g => `- **${g.pattern}**: ${g.problem}
  - Fix: ${g.solution}
  - Location: ${g.location || 'general'}`).join('\n')}
`)
  }
  
  if (failures.length > 0) {
    sections.push(`
## ❌ FAILURES AVOIDED

${failures.map(f => `- **${f.pattern}**: ${f.problem}
  - Resolution: ${f.solution}
  - Severity: ${f.severity}`).join('\n')}
`)
  }
  
  if (conventions.length > 0) {
    sections.push(`
## 📋 CONVENTIONS TO FOLLOW

${conventions.map(c => `- **${c.pattern}**: ${c.solution}
  - Location: ${c.location || 'general'}`).join('\n')}
`)
  }
  
  if (successes.length > 0) {
    sections.push(`
## ✅ SUCCESSFUL PATTERNS

${successes.map(s => `- **${s.pattern}**: ${s.solution}
  - Context: ${s.context || 'general'}`).join('\n')}
`)
  }
  
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WISDOM FROM PREVIOUS SESSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${sections.join('\n')}

Apply this wisdom to avoid common pitfalls and follow established patterns.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}

/**
 * Count items by category.
 */
function countByCategory(items: WisdomItem[]): Record<string, number> {
  return items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}

/**
 * Calculate average confidence.
 */
function averageConfidence(items: WisdomItem[]): number {
  if (items.length === 0) return 0
  return Math.round(items.reduce((sum, i) => sum + i.confidence, 0) / items.length)
}

/**
 * Build an injection block for prepending to prompts.
 */
export function buildInjectionBlock(context: InjectionContext): string {
  const wisdom = inject(context)
  
  if (wisdom.items.length === 0) {
    return ''
  }
  
  return `
[WISDOM CONTEXT - Learn from previous sessions]
${wisdom.formatted}
[END WISDOM CONTEXT]

`
}

export default {
  inject,
  buildInjectionBlock
}