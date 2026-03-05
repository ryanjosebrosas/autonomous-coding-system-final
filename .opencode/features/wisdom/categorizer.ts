/**
 * Wisdom Categorizer
 *
 * Categorizes wisdom items and determines their relevance
 * to specific contexts and tasks.
 */

import { WisdomItem, WisdomCategory } from './types'

/**
 * Categorize a wisdom item based on its content.
 */
export function categorize(item: Omit<WisdomItem, 'category'>): WisdomCategory {
  const { problem, solution, pattern } = item
  
  // Check for gotcha indicators
  if (isGotcha(problem) || isGotcha(solution) || isGotcha(pattern)) {
    return 'Gotcha'
  }
  
  // Check for success indicators
  if (isSuccess(problem) || isSuccess(solution) || isSuccess(pattern)) {
    return 'Success'
  }
  
  // Check for convention indicators
  if (isConvention(problem) || isConvention(solution) || isConvention(pattern)) {
    return 'Convention'
  }
  
  // Default to failure for issues
  return 'Failure'
}

/**
 * Gotcha indicators - anti-patterns and warnings.
 */
function isGotcha(text: string): boolean {
  const gotchaKeywords = [
    'anti-pattern', 'avoid', 'don\'t', 'never', 'warning',
    'caution', 'beware', 'pitfall', 'trap', 'gotcha',
    'common mistake', 'problematic', 'danger', 'edge case'
  ]
  
  const lower = text.toLowerCase()
  return gotchaKeywords.some(kw => lower.includes(kw))
}

/**
 * Success indicators - what worked well.
 */
function isSuccess(text: string): boolean {
  const successKeywords = [
    'work', 'success', 'best practice', 'recommend', 'prefer',
    'effective', 'performed well', 'optimal', 'efficient',
    'proved', 'established', 'validated'
  ]
  
  const lower = text.toLowerCase()
  return successKeywords.some(kw => lower.includes(kw))
}

/**
 * Convention indicators - patterns to follow.
 */
function isConvention(text: string): boolean {
  const conventionKeywords = [
    'pattern', 'convention', 'style', 'standard', 'practice',
    'follow', 'use', 'should', 'always', 'must',
    'required', 'mandatory', 'consistent'
  ]
  
  const lower = text.toLowerCase()
  return conventionKeywords.some(kw => lower.includes(kw))
}

/**
 * Score the relevance of a wisdom item to a context.
 * 
 * This is the canonical relevance scoring function used by both
 * categorizer.ts and injector.ts. Keep in sync.
 */
export function scoreRelevance(
  item: WisdomItem,
  context: {
    files?: string[]
    keywords?: string[]
    taskType?: string
    patterns?: string[]
  }
): number {
  let score = 0
  
  // Location match (highest weight)
  if (context.files && item.location) {
    for (const file of context.files) {
      if (item.location.includes(file)) {
        score += 30
        break
      }
    }
  }
  
  // Keyword match
  if (context.keywords) {
    const itemText = `${item.problem} ${item.solution} ${item.pattern}`.toLowerCase()
    for (const keyword of context.keywords) {
      if (itemText.includes(keyword.toLowerCase())) {
        score += 20
      }
    }
  }
  
  // Pattern match
  if (context.patterns && item.pattern) {
    for (const pattern of context.patterns) {
      if (item.pattern.toLowerCase().includes(pattern.toLowerCase())) {
        score += 25
        break
      }
    }
  }
  
  // Confidence contribution (0-25 points from confidence 0-100)
  score += item.confidence * 0.25
  
  // Severity adjustment (critical issues are more relevant)
  if (item.severity === 'critical') score += 15
  else if (item.severity === 'major') score += 10
  else if (item.severity === 'minor') score += 5
  
  // Recency boost (more recent is more relevant)
  const ageDays = getAgeInDays(item.timestamp)
  if (ageDays < 7) score += 10
  else if (ageDays < 30) score += 5
  else if (ageDays > 90) score -= 5
  
  return Math.min(100, Math.max(0, score))
}

/**
 * Get the age of a wisdom item in days.
 */
function getAgeInDays(timestamp: string): number {
  const itemDate = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - itemDate.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Group wisdom items by category.
 */
export function groupByCategory(items: WisdomItem[]): Record<WisdomCategory, WisdomItem[]> {
  return {
    Convention: items.filter(i => i.category === 'Convention'),
    Success: items.filter(i => i.category === 'Success'),
    Failure: items.filter(i => i.category === 'Failure'),
    Gotcha: items.filter(i => i.category === 'Gotcha')
  }
}

/**
 * Find duplicate wisdom items.
 */
export function findDuplicates(items: WisdomItem[]): WisdomItem[][] {
  const groups: Map<string, WisdomItem[]> = new Map()
  
  for (const item of items) {
    // Create a fingerprint from pattern + problem
    const fingerprint = `${item.pattern}|${item.problem}`.toLowerCase().slice(0, 100)
    
    if (!groups.has(fingerprint)) {
      groups.set(fingerprint, [])
    }
    groups.get(fingerprint)!.push(item)
  }
  
  // Return groups with more than one item
  return Array.from(groups.values()).filter(g => g.length > 1)
}

/**
 * Merge duplicate wisdom items.
 */
export function mergeDuplicates(items: WisdomItem[]): WisdomItem[] {
  const groups = findDuplicates(items)
  const seenPatterns = new Set<string>()
  const merged: WisdomItem[] = []
  
  for (const item of items) {
    const fingerprint = `${item.pattern}|${item.problem}`.toLowerCase().slice(0, 100)
    
    if (!seenPatterns.has(fingerprint)) {
      seenPatterns.add(fingerprint)
      
      // Find all duplicates of this item
      const dupGroup = groups.find(g => 
        g.some(d => `${d.pattern}|${d.problem}`.toLowerCase().slice(0, 100) === fingerprint)
      )
      
      if (dupGroup && dupGroup.length > 1) {
        // Merge: take highest confidence, sum evidence
        const sorted = dupGroup.sort((a, b) => b.confidence - a.confidence)
        merged.push({
          ...sorted[0],
          confidence: Math.min(100, sorted[0].confidence + dupGroup.length * 5)
        })
      } else {
        merged.push(item)
      }
    }
  }
  
  return merged
}

/**
 * Categorize items from a raw extraction.
 */
export function categorizeItems(
  items: Array<Omit<WisdomItem, 'category'>>
): WisdomItem[] {
  return items.map(item => ({
    ...item,
    category: categorize(item)
  }))
}

export default {
  categorize,
  scoreRelevance,
  groupByCategory,
  findDuplicates,
  mergeDuplicates,
  categorizeItems
}