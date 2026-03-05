/**
 * Wisdom Storage
 *
 * Reads and writes wisdom files from .agents/wisdom/{feature}/
 */

import { WisdomItem, WisdomFile, Decision, Issue, WisdomQuery } from './types'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Base directory for wisdom files.
 * Can be overridden via WISDOM_DIR environment variable.
 */
const WISDOM_DIR = process.env.WISDOM_DIR || '.agents/wisdom'

/**
 * Ensure the wisdom directory exists for a feature.
 */
export function ensureWisdomDir(feature: string): string {
  const dir = join(WISDOM_DIR, feature)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

/**
 * Load wisdom for a feature.
 */
export function loadWisdom(feature: string): WisdomFile {
  const dir = join(WISDOM_DIR, feature)
  const learningsPath = join(dir, 'learnings.md')
  
  if (!existsSync(learningsPath)) {
    return {
      feature,
      conventions: [],
      successes: [],
      failures: [],
      gotchas: [],
      sessions: []
    }
  }
  
  const content = readFileSync(learningsPath, 'utf-8')
  return parseWisdomFile(content, feature)
}

/**
 * Save wisdom for a feature.
 */
export function saveWisdom(wisdom: WisdomFile): void {
  const dir = ensureWisdomDir(wisdom.feature)
  const content = serializeWisdomFile(wisdom)
  writeFileSync(join(dir, 'learnings.md'), content)
}

/**
 * Add a wisdom item.
 */
export function addWisdomItem(
  feature: string,
  item: WisdomItem
): void {
  const wisdom = loadWisdom(feature)
  
  switch (item.category) {
    case 'Convention':
      wisdom.conventions.push(item)
      break
    case 'Success':
      wisdom.successes.push(item)
      break
    case 'Failure':
      wisdom.failures.push(item)
      break
    case 'Gotcha':
      wisdom.gotchas.push(item)
      break
  }
  
  saveWisdom(wisdom)
}

/**
 * Add multiple wisdom items.
 */
export function addWisdomItems(
  feature: string,
  items: WisdomItem[]
): void {
  const wisdom = loadWisdom(feature)
  
  for (const item of items) {
    switch (item.category) {
      case 'Convention':
        wisdom.conventions.push(item)
        break
      case 'Success':
        wisdom.successes.push(item)
        break
      case 'Failure':
        wisdom.failures.push(item)
        break
      case 'Gotcha':
        wisdom.gotchas.push(item)
        break
    }
  }
  
  saveWisdom(wisdom)
}

/**
 * Search wisdom with query.
 */
export function searchWisdom(
  wisdom: WisdomFile,
  query: WisdomQuery
): WisdomItem[] {
  let items: WisdomItem[] = []
  
  // Filter by category
  if (query.category) {
    switch (query.category) {
      case 'Convention':
        items = wisdom.conventions
        break
      case 'Success':
        items = wisdom.successes
        break
      case 'Failure':
        items = wisdom.failures
        break
      case 'Gotcha':
        items = wisdom.gotchas
        break
    }
  } else {
    items = [
      ...wisdom.conventions,
      ...wisdom.successes,
      ...wisdom.failures,
      ...wisdom.gotchas
    ]
  }
  
  // Filter by pattern search
  if (query.pattern) {
    const lower = query.pattern.toLowerCase()
    items = items.filter(i => 
      i.pattern.toLowerCase().includes(lower) ||
      i.problem.toLowerCase().includes(lower) ||
      i.solution.toLowerCase().includes(lower)
    )
  }
  
  // Filter by recency
  if (query.recent) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - query.recent)
    items = items.filter(i => new Date(i.timestamp) >= cutoff)
  }
  
  // Filter by minimum confidence
  if (query.minConfidence !== undefined) {
    const minConf = query.minConfidence
    items = items.filter(i => i.confidence >= minConf)
  }
  
  return items
}

/**
 * Load decisions for a feature.
 */
export function loadDecisions(feature: string): Decision[] {
  const path = join(WISDOM_DIR, feature, 'decisions.md')
  
  if (!existsSync(path)) {
    return []
  }
  
  const content = readFileSync(path, 'utf-8')
  return parseDecisions(content)
}

/**
 * Save a decision.
 */
export function saveDecision(feature: string, decision: Decision): void {
  const decisions = loadDecisions(feature)
  decisions.push(decision)
  
  const dir = ensureWisdomDir(feature)
  const content = serializeDecisions(decisions)
  writeFileSync(join(dir, 'decisions.md'), content)
}

/**
 * Load issues for a feature.
 */
export function loadIssues(feature: string): Issue[] {
  const path = join(WISDOM_DIR, feature, 'issues.md')
  
  if (!existsSync(path)) {
    return []
  }
  
  const content = readFileSync(path, 'utf-8')
  return parseIssues(content)
}

/**
 * Save an issue.
 */
export function saveIssue(feature: string, issue: Issue): void {
  const issues = loadIssues(feature)
  
  // Update existing issue or add new
  const existingIdx = issues.findIndex(i => i.id === issue.id)
  if (existingIdx >= 0) {
    issues[existingIdx] = issue
  } else {
    issues.push(issue)
  }
  
  const dir = ensureWisdomDir(feature)
  const content = serializeIssues(issues)
  writeFileSync(join(dir, 'issues.md'), content)
}

/**
 * Parse a wisdom file from markdown.
 */
function parseWisdomFile(content: string, feature: string): WisdomFile {
  const wisdom: WisdomFile = {
    feature,
    conventions: [],
    successes: [],
    failures: [],
    gotchas: [],
    sessions: []
  }
  
  // Parse conventions
  const conventionsMatch = content.match(/## Conventions\n([\s\S]*?)(?=##|$)/)
  if (conventionsMatch) {
    wisdom.conventions = parseItems(conventionsMatch[1], 'Convention')
  }
  
  // Parse successes
  const successesMatch = content.match(/## Successes\n([\s\S]*?)(?=##|$)/)
  if (successesMatch) {
    wisdom.successes = parseItems(successesMatch[1], 'Success')
  }
  
  // Parse failures
  const failuresMatch = content.match(/## Failures\n([\s\S]*?)(?=##|$)/)
  if (failuresMatch) {
    wisdom.failures = parseItems(failuresMatch[1], 'Failure')
  }
  
  // Parse gotchas
  const gotchasMatch = content.match(/## Gotchas\n([\s\S]*?)(?=##|$)/)
  if (gotchasMatch) {
    wisdom.gotchas = parseItems(gotchasMatch[1], 'Gotcha')
  }
  
  return wisdom
}

/**
 * Parse items from a section.
 */
function parseItems(text: string, category: 'Convention' | 'Success' | 'Failure' | 'Gotcha'): WisdomItem[] {
  const items: WisdomItem[] = []
  const lines = text.split('\n')
  
  let currentItem: Partial<WisdomItem> | null = null
  
  for (const line of lines) {
    if (line.startsWith('### ')) {
      // New item
      if (currentItem && currentItem.pattern) {
        items.push({
          category,
          pattern: currentItem.pattern || '',
          problem: currentItem.problem || '',
          solution: currentItem.solution || '',
          location: currentItem.location,
          severity: currentItem.severity || 'minor',
          timestamp: currentItem.timestamp || new Date().toISOString(),
          confidence: currentItem.confidence || 70
        })
      }
      currentItem = {
        pattern: line.slice(4).trim()
      }
    } else if (currentItem) {
      if (line.startsWith('- **Pattern**:')) {
        currentItem.pattern = line.split(':')[1]?.trim() || currentItem.pattern
      } else if (line.startsWith('- **Location**:')) {
        currentItem.location = line.split(':')[1]?.trim()
      } else if (line.startsWith('- **Solution**:')) {
        currentItem.solution = line.split(':').slice(1).join(':').trim()
      } else if (line.startsWith('- **Problem**:')) {
        currentItem.problem = line.split(':').slice(1).join(':').trim()
      }
    }
  }
  
  // Push last item
  if (currentItem && currentItem.pattern) {
    items.push({
      category,
      pattern: currentItem.pattern,
      problem: currentItem.problem || '',
      solution: currentItem.solution || '',
      location: currentItem.location,
      severity: currentItem.severity || 'minor',
      timestamp: currentItem.timestamp || new Date().toISOString(),
      confidence: currentItem.confidence || 70
    })
  }
  
  return items
}

/**
 * Serialize a wisdom file to markdown.
 */
function serializeWisdomFile(wisdom: WisdomFile): string {
  const lines: string[] = []
  
  lines.push(`# Wisdom: ${wisdom.feature}`)
  lines.push('')
  lines.push(`_Generated: ${new Date().toISOString()}_`)
  lines.push('')
  
  // Conventions
  if (wisdom.conventions.length > 0) {
    lines.push('## Conventions')
    lines.push('')
    for (const item of wisdom.conventions) {
      lines.push(`### ${item.pattern}`)
      lines.push(`- **Pattern**: ${item.pattern}`)
      lines.push(`- **Location**: ${item.location || 'general'}`)
      lines.push(`- **Solution**: ${item.solution}`)
      lines.push('')
    }
  }
  
  // Successes
  if (wisdom.successes.length > 0) {
    lines.push('## Successes')
    lines.push('')
    for (const item of wisdom.successes) {
      lines.push(`### ${item.pattern}`)
      lines.push(`- **Approach**: ${item.pattern}`)
      lines.push(`- **Result**: ${item.solution}`)
      lines.push(`- **Context**: ${item.context || 'general'}`)
      lines.push('')
    }
  }
  
  // Failures
  if (wisdom.failures.length > 0) {
    lines.push('## Failures')
    lines.push('')
    for (const item of wisdom.failures) {
      lines.push(`### ${item.pattern}`)
      lines.push(`- **Problem**: ${item.problem}`)
      lines.push(`- **Resolution**: ${item.solution}`)
      lines.push(`- **Severity**: ${item.severity}`)
      lines.push('')
    }
  }
  
  // Gotchas
  if (wisdom.gotchas.length > 0) {
    lines.push('## Gotchas')
    lines.push('')
    for (const item of wisdom.gotchas) {
      lines.push(`### ${item.pattern}`)
      lines.push(`- **Issue**: ${item.problem}`)
      lines.push(`- **Fix**: ${item.solution}`)
      lines.push(`- **Location**: ${item.location || 'general'}`)
      lines.push('')
    }
  }
  
  return lines.join('\n')
}

/**
 * Parse decisions from markdown.
 * 
 * Expects format:
 * ## {timestamp}: {title}
 * **Decision**: {decision}
 * **Rationale**: {rationale}
 */
function parseDecisions(content: string): Decision[] {
  const decisions: Decision[] = []
  
  if (!content || content.trim() === '') {
    return decisions
  }
  
  const sections = content.split(/^## /gm).filter(Boolean)
  
  for (const section of sections) {
    const lines = section.trim().split('\n')
    if (lines.length < 2) continue
    
    // Parse header: "2025-01-15T10:00:00Z: Use TypeScript strict mode"
    const headerMatch = lines[0].match(/^(\d{4}-\d{2}-\d{2}T[^:]+):\s*(.+)$/)
    if (!headerMatch) continue
    
    const timestamp = headerMatch[1]
    const title = headerMatch[2].trim()
    
    let decision = ''
    let rationale = ''
    const alternatives: Decision['alternatives'] = []
    const impact: Decision['impact'] = { affects: [], dependencies: [] }
    
    for (const line of lines.slice(1)) {
      if (line.startsWith('**Decision**:')) {
        decision = line.split(':').slice(1).join(':').trim()
      } else if (line.startsWith('**Rationale**:')) {
        rationale = line.split(':').slice(1).join(':').trim()
      } else if (line.startsWith('**Alternatives**:')) {
        // Parse alternatives if present
        const altText = line.split(':').slice(1).join(':').trim()
        alternatives.push({ option: altText, rejected: false, reason: '' })
      } else if (line.startsWith('**Affects**:')) {
        impact.affects = line.split(':').slice(1).join(':').trim().split(',').map(s => s.trim())
      } else if (line.startsWith('**Dependencies**:')) {
        impact.dependencies = line.split(':').slice(1).join(':').trim().split(',').map(s => s.trim())
      }
    }
    
    decisions.push({
      title,
      decision,
      rationale,
      alternatives,
      impact,
      timestamp,
      references: undefined
    })
  }
  
  return decisions
}

/**
 * Serialize decisions to markdown.
 */
function serializeDecisions(decisions: Decision[]): string {
  const lines: string[] = []
  
  lines.push(`# Decisions`)
  lines.push('')
  
  for (const decision of decisions) {
    lines.push(`## ${decision.timestamp}: ${decision.title}`)
    lines.push('')
    lines.push(`**Decision**: ${decision.decision}`)
    lines.push('')
    lines.push(`**Rationale**: ${decision.rationale}`)
    lines.push('')
    lines.push('---')
    lines.push('')
  }
  
  return lines.join('\n')
}

/**
 * Parse issues from markdown.
 * 
 * Expects format:
 * ### {id}: {title}
 * - **Severity**: {severity}
 * - **Context**: {context}
 * - **Description**: {description}
 * - **Workaround**: {workaround} (if open)
 * - **Resolution**: {solution} (if resolved)
 */
function parseIssues(content: string): Issue[] {
  const issues: Issue[] = []
  
  if (!content || content.trim() === '') {
    return issues
  }
  
  const sections = content.split(/^### /gm).filter(Boolean)
  
  for (const section of sections) {
    const lines = section.trim().split('\n')
    if (lines.length < 2) continue
    
    // Parse header: "ISS-001: Database connection timeout"
    const headerMatch = lines[0].match(/^([^:]+):\s*(.+)$/)
    if (!headerMatch) continue
    
    const id = headerMatch[1].trim()
    const title = headerMatch[2].trim()
    
    let status: Issue['status'] = 'open'
    let severity: Issue['severity'] = 'minor'
    let context = ''
    let description = ''
    let workaround: string | undefined
    let solution: string | undefined
    let resolvedAt: string | undefined
    
    for (const line of lines.slice(1)) {
      if (line.startsWith('- **Severity**:')) {
        const sev = line.split(':').slice(1).join(':').trim().toLowerCase()
        if (sev === 'critical' || sev === 'major' || sev === 'minor') {
          severity = sev
        }
      } else if (line.startsWith('- **Context**:')) {
        context = line.split(':').slice(1).join(':').trim()
      } else if (line.startsWith('- **Description**:')) {
        description = line.split(':').slice(1).join(':').trim()
      } else if (line.startsWith('- **Workaround**:')) {
        workaround = line.split(':').slice(1).join(':').trim()
      } else if (line.startsWith('- **Resolution**:')) {
        solution = line.split(':').slice(1).join(':').trim()
        status = 'resolved'
      } else if (line.startsWith('- **Resolved**:')) {
        resolvedAt = line.split(':').slice(1).join(':').trim()
      }
    }
    
    issues.push({
      id,
      title,
      status,
      severity,
      context,
      description,
      workaround,
      solution,
      resolvedAt
    })
  }
  
  return issues
}

/**
 * Serialize issues to markdown.
 */
function serializeIssues(issues: Issue[]): string {
  const lines: string[] = []
  
  lines.push(`# Issues`)
  lines.push('')
  lines.push(`## Active Issues`)
  lines.push('')
  
  const activeIssues = issues.filter(i => i.status === 'open')
  for (const issue of activeIssues) {
    lines.push(`### ${issue.id}: ${issue.title}`)
    lines.push(`- **Severity**: ${issue.severity}`)
    lines.push(`- **Context**: ${issue.context}`)
    lines.push(`- **Description**: ${issue.description}`)
    if (issue.workaround) {
      lines.push(`- **Workaround**: ${issue.workaround}`)
    }
    lines.push('')
  }
  
  lines.push(`## Resolved Issues`)
  lines.push('')
  
  const resolvedIssues = issues.filter(i => i.status === 'resolved')
  for (const issue of resolvedIssues) {
    lines.push(`### ${issue.id}: ${issue.title}`)
    lines.push(`- **Resolution**: ${issue.solution}`)
    lines.push(`- **Resolved**: ${issue.resolvedAt}`)
    lines.push('')
  }
  
  return lines.join('\n')
}

export default {
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
}