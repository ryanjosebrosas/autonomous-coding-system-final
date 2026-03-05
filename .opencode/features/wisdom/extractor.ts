/**
 * Wisdom Extractor
 *
 * Extracts learnings from completed task executions.
 * Analyzes code review findings, test failures, error messages,
 * and successful patterns to identify wisdom.
 */

import { WisdomItem, WisdomCategory } from './types'

/**
 * Extract wisdom from a code review finding.
 */
export function extractFromReviewFinding(
  finding: {
    severity: 'critical' | 'major' | 'minor'
    type: string
    message: string
    location: string
    suggestion: string
  }
): WisdomItem {
  const category = categorizeFinding(finding)
  
  return {
    category,
    pattern: finding.type,
    problem: finding.message,
    solution: finding.suggestion,
    location: finding.location,
    severity: finding.severity,
    timestamp: new Date().toISOString(),
    confidence: calculateConfidence(finding)
  }
}

/**
 * Extract wisdom from a test failure.
 */
export function extractFromTestFailure(
  failure: {
    testName: string
    error: string
    expected: string
    actual: string
    stackTrace: string
  }
): WisdomItem {
  const category: WisdomCategory = 'Failure'
  
  return {
    category,
    pattern: extractPattern(failure.error),
    problem: `Test '${failure.testName}' failed: ${failure.error}`,
    solution: inferSolution(failure),
    location: extractLocationFromStack(failure.stackTrace),
    severity: 'major',
    timestamp: new Date().toISOString(),
    confidence: 70 // Test failures need investigation
  }
}

/**
 * Extract wisdom from a successful pattern.
 */
export function extractFromSuccess(
  success: {
    approach: string
    result: string
    context: string
    files: string[]
  }
): WisdomItem {
  return {
    category: 'Success',
    pattern: success.approach,
    problem: `Best practice discovered`,
    solution: success.result,
    location: success.files.join(', '),
    context: success.context,
    severity: 'minor',
    timestamp: new Date().toISOString(),
    confidence: 90 // Successful patterns are high confidence
  }
}

/**
 * Categorize a finding into the appropriate wisdom category.
 */
function categorizeFinding(finding: { type: string; severity: string }): WisdomCategory {
  const type = finding.type.toLowerCase()
  
  if (type.includes('pattern') || type.includes('convention')) {
    return 'Convention'
  }
  
  if (type.includes('anti-pattern') || type.includes('gotcha')) {
    return 'Gotcha'
  }
  
  if (type.includes('error') || type.includes('failure')) {
    return 'Failure'
  }
  
  if (finding.severity === 'minor') {
    return 'Convention'
  }
  
  return 'Failure'
}

/**
 * Extract actionable pattern from an error message.
 */
function extractPattern(error: string): string {
  // Look for common patterns in error messages
  const patterns = [
    { regex: /undefined/i, pattern: 'Undefined variable access' },
    { regex: /null/i, pattern: 'Null reference' },
    { regex: /type/i, pattern: 'Type mismatch' },
    { regex: /async|await|promise/i, pattern: 'Async handling issue' },
    { regex: /import|export|module/i, pattern: 'Module resolution issue' },
    { regex: /\bkey\b|\bprop\b|\bproperty\b/i, pattern: 'Property access issue' }
  ]
  
  for (const { regex, pattern } of patterns) {
    if (regex.test(error)) {
      return pattern
    }
  }
  
  return 'Unknown pattern'
}

/**
 * Infer a solution from a test failure.
 */
function inferSolution(failure: { error: string; expected: string; actual: string }): string {
  if (failure.expected !== failure.actual) {
    return `Expected '${failure.expected}' but got '${failure.actual}'. Check the assertion logic.`
  }
  
  if (failure.error.includes('undefined')) {
    return 'Ensure the variable is initialized before use.'
  }
  
  return 'Investigate the test failure and fix the underlying issue.'
}

/**
 * Extract file location from a stack trace.
 */
function extractLocationFromStack(stack: string): string {
  const lines = stack.split('\n')
  for (const line of lines) {
    // Match file:line:column pattern
    const match = line.match(/at\s+.*\(?(.+):(\d+):(\d+)\)?/)
    if (match) {
      return `${match[1]}:${match[2]}`
    }
  }
  return 'Unknown location'
}

/**
 * Calculate confidence level for a wisdom item.
 */
function calculateConfidence(finding: { severity: string; type: string }): number {
  // Critical issues are high confidence (definitely a problem)
  if (finding.severity === 'critical') return 95
  if (finding.severity === 'major') return 85
  if (finding.severity === 'minor') return 70
  
  // Pattern types have higher confidence
  if (finding.type.includes('pattern')) return 80
  
  return 60
}

/**
 * Extract all wisdom from a task execution report.
 */
export function extractFromReport(report: {
  divergences: Array<{ what: string; reason: string; classification: string }>
  issues: Array<{ severity: string; description: string }>
  successes: string[]
}): WisdomItem[] {
  const items: WisdomItem[] = []
  
  // Extract from divergences
  for (const div of report.divergences) {
    items.push({
      category: div.classification === 'Good' ? 'Success' : 'Failure',
      pattern: 'Implementation divergence',
      problem: div.what,
      solution: div.reason,
      severity: 'minor',
      timestamp: new Date().toISOString(),
      confidence: 75
    })
  }
  
  // Extract from issues
  for (const issue of report.issues) {
    items.push({
      category: 'Failure',
      pattern: 'Issue encountered',
      problem: issue.description,
      solution: 'Investigate and resolve',
      severity: issue.severity as 'critical' | 'major' | 'minor',
      timestamp: new Date().toISOString(),
      confidence: 80
    })
  }
  
  // Extract from successes
  for (const success of report.successes) {
    items.push({
      category: 'Success',
      pattern: 'Successful approach',
      problem: 'Best practice',
      solution: success,
      severity: 'minor',
      timestamp: new Date().toISOString(),
      confidence: 90
    })
  }
  
  return items
}

export default {
  extractFromReviewFinding,
  extractFromTestFailure,
  extractFromSuccess,
  extractFromReport
}