/**
 * Wisdom Extractor Integration Tests
 * 
 * Tests verify:
 * - extractFromReviewFinding: Code review finding extraction
 * - extractFromTestFailure: Test failure pattern extraction
 * - extractFromSuccess: Successful approach extraction
 * - extractFromReport: Multi-item report extraction
 * - Pattern categorization
 * - Confidence calculation
 */

import { describe, it, expect } from "vitest"
import {
  extractFromReviewFinding,
  extractFromTestFailure,
  extractFromSuccess,
  extractFromReport,
} from "../../../features/wisdom/extractor"
import type { WisdomItem } from "../../../features/wisdom/types"

// ============================================================
// MOCK HELPERS
// ============================================================

function createMockFinding(overrides: Partial<{
  severity: 'critical' | 'major' | 'minor'
  type: string
  message: string
  location: string
  suggestion: string
}> = {}): {
  severity: 'critical' | 'major' | 'minor'
  type: string
  message: string
  location: string
  suggestion: string
} {
  return {
    severity: 'major',
    type: 'pattern',
    message: 'Test finding message',
    location: 'src/test.ts:10',
    suggestion: 'Test suggestion',
    ...overrides,
  }
}

function createMockFailure(overrides: Partial<{
  testName: string
  error: string
  expected: string
  actual: string
  stackTrace: string
}> = {}): {
  testName: string
  error: string
  expected: string
  actual: string
  stackTrace: string
} {
  return {
    testName: 'should pass test',
    error: 'Test assertion failed',
    expected: 'true',
    actual: 'false',
    stackTrace: 'at test (src/test.ts:10:5)',
    ...overrides,
  }
}

function createMockSuccess(overrides: Partial<{
  approach: string
  result: string
  context: string
  files: string[]
}> = {}): {
  approach: string
  result: string
  context: string
  files: string[]
} {
  return {
    approach: 'Connection pooling',
    result: 'Reduced latency by 50%',
    context: 'Database optimization',
    files: ['src/db/connection.ts'],
    ...overrides,
  }
}

function createMockReport(overrides: Partial<{
  divergences: Array<{ what: string; reason: string; classification: string }>
  issues: Array<{ severity: string; description: string }>
  successes: string[]
}> = {}): {
  divergences: Array<{ what: string; reason: string; classification: string }>
  issues: Array<{ severity: string; description: string }>
  successes: string[]
} {
  return {
    divergences: [],
    issues: [],
    successes: [],
    ...overrides,
  }
}

// ============================================================
// EXTRACT FROM REVIEW FINDING TESTS
// ============================================================

describe("Wisdom Extractor Integration", () => {
  describe("extractFromReviewFinding", () => {
    describe("basic extraction", () => {
      it("should extract wisdom from critical finding", () => {
        const finding = createMockFinding({
          severity: 'critical',
          type: 'security',
          message: 'SQL injection vulnerability in user input',
          location: 'src/api/routes.ts:45',
          suggestion: 'Use parameterized queries',
        })

        const wisdom = extractFromReviewFinding(finding)

        expect(wisdom).toBeDefined()
        expect(wisdom.category).toBeDefined()
        expect(wisdom.pattern).toBe('security')
        expect(wisdom.problem).toBe('SQL injection vulnerability in user input')
        expect(wisdom.solution).toBe('Use parameterized queries')
        expect(wisdom.location).toBe('src/api/routes.ts:45')
        expect(wisdom.severity).toBe('critical')
        expect(wisdom.confidence).toBe(95)
      })

      it("should extract wisdom from major finding", () => {
        const finding = createMockFinding({
          severity: 'major',
          type: 'anti-pattern',
          message: 'Mutable state in immutable component',
          location: 'src/components/Button.tsx:15',
          suggestion: 'Use useState instead of modifying props',
        })

        const wisdom = extractFromReviewFinding(finding)

        expect(wisdom).toBeDefined()
        expect(wisdom.severity).toBe('major')
        expect(wisdom.confidence).toBe(85)
      })

      it("should extract wisdom from minor finding", () => {
        const finding = createMockFinding({
          severity: 'minor',
          type: 'convention',
          message: 'Consider using const instead of let',
          location: 'src/utils.ts:5',
          suggestion: 'Use const for immutable bindings',
        })

        const wisdom = extractFromReviewFinding(finding)

        expect(wisdom).toBeDefined()
        expect(wisdom.severity).toBe('minor')
        expect(wisdom.confidence).toBe(70)
      })

      it("should include ISO timestamp", () => {
        const finding = createMockFinding()
        const before = new Date().toISOString()

        const wisdom = extractFromReviewFinding(finding)
        const after = new Date().toISOString()

        expect(wisdom.timestamp).toBeDefined()
        expect(wisdom.timestamp >= before).toBe(true)
        expect(wisdom.timestamp <= after).toBe(true)
      })
    })

    describe("category classification", () => {
      it("should classify pattern type as Convention", () => {
        const finding = createMockFinding({ type: 'pattern' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.category).toBe('Convention')
      })

      it("should classify convention type as Convention", () => {
        const finding = createMockFinding({ type: 'convention' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.category).toBe('Convention')
      })

      it("should classify anti-pattern based on substring match", () => {
        // Note: 'anti-pattern' contains 'pattern', so it matches Convention first
        const finding = createMockFinding({ type: 'anti-pattern' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.category).toBe('Convention')
      })

      it("should classify gotcha type as Gotcha", () => {
        const finding = createMockFinding({ type: 'gotcha' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.category).toBe('Gotcha')
      })

      it("should classify error type as Failure", () => {
        const finding = createMockFinding({ type: 'error' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.category).toBe('Failure')
      })

      it("should classify failure type as Failure", () => {
        const finding = createMockFinding({ type: 'failure' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.category).toBe('Failure')
      })

      it("should classify minor severity as Convention", () => {
        const finding = createMockFinding({ type: 'unknown', severity: 'minor' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.category).toBe('Convention')
      })

      it("should classify unknown type with major severity as Failure", () => {
        const finding = createMockFinding({ type: 'unknown', severity: 'major' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.category).toBe('Failure')
      })

      it("should handle case-insensitive type matching", () => {
        const finding = createMockFinding({ type: 'PATTERN' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.category).toBe('Convention')
      })
    })

    describe("confidence calculation", () => {
      it("should return 95 for critical severity", () => {
        const finding = createMockFinding({ severity: 'critical' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.confidence).toBe(95)
      })

      it("should return 85 for major severity", () => {
        const finding = createMockFinding({ severity: 'major' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.confidence).toBe(85)
      })

      it("should return 70 for minor severity", () => {
        const finding = createMockFinding({ severity: 'minor' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.confidence).toBe(70)
      })

      it("should return high confidence for pattern type", () => {
        const finding = createMockFinding({ type: 'pattern', severity: 'critical' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.confidence).toBeGreaterThanOrEqual(80)
      })

      it("should return default for unknown type and severity", () => {
        const finding = createMockFinding({ type: 'unknown', severity: 'major' })
        const wisdom = extractFromReviewFinding(finding)
        
        expect(wisdom.confidence).toBeGreaterThanOrEqual(60)
      })
    })
  })

  // ============================================================
  // EXTRACT FROM TEST FAILURE TESTS
  // ============================================================

  describe("extractFromTestFailure", () => {
    describe("basic extraction", () => {
      it("should extract wisdom from test failure", () => {
        const failure = createMockFailure({
          testName: 'should validate email',
          error: 'Expected true, received false',
          expected: 'true',
          actual: 'false',
          stackTrace: 'at test (tests/validation.test.ts:25:5)',
        })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom).toBeDefined()
        expect(wisdom.category).toBe('Failure')
        expect(wisdom.problem).toContain('should validate email')
        expect(wisdom.problem).toContain('Expected true, received false')
        expect(wisdom.severity).toBe('major')
        expect(wisdom.confidence).toBe(70)
        expect(wisdom.timestamp).toBeDefined()
      })

      it("should include expected/actual in solution", () => {
        const failure = createMockFailure({
          expected: 'true',
          actual: 'false',
        })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.solution).toContain('Expected')
        expect(wisdom.solution).toContain('true')
        expect(wisdom.solution).toContain('false')
      })

      it("should extract location from stack trace", () => {
        const failure = createMockFailure({
          stackTrace: 'Error: Test failed\n    at test (src/utils.test.ts:10:5)',
        })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.location).toBeDefined()
        expect(wisdom.location).not.toBe('Unknown location')
      })

      it("should handle empty stack trace", () => {
        const failure = createMockFailure({ stackTrace: '' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.location).toBe('Unknown location')
      })

      it("should handle malformed stack trace", () => {
        const failure = createMockFailure({ stackTrace: 'no file reference here' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.location).toBe('Unknown location')
      })
    })

    describe("pattern extraction", () => {
      it("should detect undefined pattern", () => {
        const failure = createMockFailure({ error: 'Cannot read property of undefined' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.pattern).toBe('Undefined variable access')
      })

      it("should detect null pattern", () => {
        const failure = createMockFailure({ error: 'Cannot read property of null' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.pattern).toBe('Null reference')
      })

      it("should detect type mismatch pattern", () => {
        const failure = createMockFailure({ error: 'Type mismatch: expected string' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.pattern).toBe('Type mismatch')
      })

      it("should detect async handling issue pattern", () => {
        const failure = createMockFailure({ error: 'Unhandled promise rejection' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.pattern).toBe('Async handling issue')
      })

      it("should detect module resolution issue pattern", () => {
        const failure = createMockFailure({ error: 'Cannot find module exports' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.pattern).toBe('Module resolution issue')
      })

      it("should detect property access issue pattern", () => {
        const failure = createMockFailure({ error: 'Property does not exist on object' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.pattern).toBe('Property access issue')
      })

      it("should return Unknown pattern for unrecognized errors", () => {
        const failure = createMockFailure({ error: 'Something unexpected happened' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.pattern).toBe('Unknown pattern')
      })

      it("should be case-insensitive for pattern detection", () => {
        const failure = createMockFailure({ error: 'UNDEFINED reference' })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.pattern).toBe('Undefined variable access')
      })
    })

    describe("solution inference", () => {
      it("should infer solution from expected/actual mismatch", () => {
        const failure = createMockFailure({
          expected: 'value1',
          actual: 'value2',
        })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.solution).toContain('Expected')
        expect(wisdom.solution).toContain('Check the assertion logic')
      })

      it("should infer solution for undefined error", () => {
        const failure = createMockFailure({
          error: 'variable is undefined',
          expected: 'same',
          actual: 'same',
        })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.solution).toContain('initialized')
      })

      it("should provide generic solution for unknown errors", () => {
        const failure = createMockFailure({
          error: 'Unknown error',
          expected: 'same',
          actual: 'same',
        })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.solution).toContain('Investigate')
      })
    })
  })

  // ============================================================
  // EXTRACT FROM SUCCESS TESTS
  // ============================================================

  describe("extractFromSuccess", () => {
    describe("basic extraction", () => {
      it("should extract wisdom from successful approach", () => {
        const success = createMockSuccess({
          approach: 'Used connection pooling',
          result: 'Reduced latency by 50%',
          context: 'Database optimization',
          files: ['src/db/connection.ts'],
        })

        const wisdom = extractFromSuccess(success)

        expect(wisdom).toBeDefined()
        expect(wisdom.category).toBe('Success')
        expect(wisdom.pattern).toBe('Used connection pooling')
        expect(wisdom.problem).toBe('Best practice discovered')
        expect(wisdom.solution).toBe('Reduced latency by 50%')
        expect(wisdom.location).toBe('src/db/connection.ts')
        expect(wisdom.context).toBe('Database optimization')
        expect(wisdom.severity).toBe('minor')
        expect(wisdom.confidence).toBe(90)
        expect(wisdom.timestamp).toBeDefined()
      })

      it("should join multiple files in location", () => {
        const success = createMockSuccess({
          files: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
        })

        const wisdom = extractFromSuccess(success)

        expect(wisdom.location).toBe('src/a.ts, src/b.ts, src/c.ts')
      })

      it("should include context field", () => {
        const success = createMockSuccess({
          context: 'Performance optimization in hot path',
        })

        const wisdom = extractFromSuccess(success)

        expect(wisdom.context).toBe('Performance optimization in hot path')
      })

      it("should always return Success category", () => {
        const success = createMockSuccess()
        const wisdom = extractFromSuccess(success)

        expect(wisdom.category).toBe('Success')
      })

      it("should always return minor severity", () => {
        const success = createMockSuccess()
        const wisdom = extractFromSuccess(success)

        expect(wisdom.severity).toBe('minor')
      })

      it("should always return 90 confidence", () => {
        const success = createMockSuccess()
        const wisdom = extractFromSuccess(success)

        expect(wisdom.confidence).toBe(90)
      })

      it("should handle empty files array", () => {
        const success = createMockSuccess({ files: [] })

        const wisdom = extractFromSuccess(success)

        expect(wisdom.location).toBe('')
      })

      it("should include ISO timestamp", () => {
        const success = createMockSuccess()
        const before = new Date().toISOString()

        const wisdom = extractFromSuccess(success)
        const after = new Date().toISOString()

        expect(wisdom.timestamp >= before).toBe(true)
        expect(wisdom.timestamp <= after).toBe(true)
      })
    })
  })

  // ============================================================
  // EXTRACT FROM REPORT TESTS
  // ============================================================

  describe("extractFromReport", () => {
    describe("basic extraction", () => {
      it("should return empty array for empty report", () => {
        const report = createMockReport()

        const items = extractFromReport(report)

        expect(items).toEqual([])
      })

      it("should extract from divergences", () => {
        const report = createMockReport({
          divergences: [
            { what: 'Changed API', reason: 'Better performance', classification: 'Good' },
            { what: 'Skipped test', reason: 'Time constraint', classification: 'Bad' },
          ],
        })

        const items = extractFromReport(report)

        expect(items.length).toBe(2)
        expect(items[0].category).toBe('Success')
        expect(items[0].pattern).toBe('Implementation divergence')
        expect(items[0].problem).toBe('Changed API')
        expect(items[0].solution).toBe('Better performance')
        expect(items[1].category).toBe('Failure')
      })

      it("should extract from issues", () => {
        const report = createMockReport({
          issues: [
            { severity: 'critical', description: 'Memory leak detected' },
            { severity: 'major', description: 'Performance degradation' },
          ],
        })

        const items = extractFromReport(report)

        expect(items.length).toBe(2)
        expect(items[0].category).toBe('Failure')
        expect(items[0].pattern).toBe('Issue encountered')
        expect(items[0].problem).toBe('Memory leak detected')
        expect(items[0].severity).toBe('critical')
        expect(items[1].problem).toBe('Performance degradation')
        expect(items[1].severity).toBe('major')
      })

      it("should extract from successes", () => {
        const report = createMockReport({
          successes: [
            'Used memoization to improve performance',
            'Implemented caching layer',
          ],
        })

        const items = extractFromReport(report)

        expect(items.length).toBe(2)
        expect(items[0].category).toBe('Success')
        expect(items[0].pattern).toBe('Successful approach')
        expect(items[0].solution).toBe('Used memoization to improve performance')
        expect(items[1].solution).toBe('Implemented caching layer')
      })

      it("should combine all sources", () => {
        const report = createMockReport({
          divergences: [{ what: 'Div A', reason: 'Reason A', classification: 'Good' }],
          issues: [{ severity: 'major', description: 'Issue B' }],
          successes: ['Success C'],
        })

        const items = extractFromReport(report)

        expect(items.length).toBe(3)
      })
    })

    describe("timestamps", () => {
      it("should include ISO timestamps for all items", () => {
        const report = createMockReport({
          divergences: [{ what: 'D', reason: 'R', classification: 'Good' }],
          issues: [{ severity: 'major', description: 'Issue' }],
          successes: ['Success'],
        })

        const items = extractFromReport(report)

        for (const item of items) {
          expect(item.timestamp).toBeDefined()
          expect(typeof item.timestamp).toBe('string')
          expect(() => new Date(item.timestamp)).not.toThrow()
        }
      })

      it("should have close timestamps for all items", () => {
        const report = createMockReport({
          divergences: [{ what: 'D', reason: 'R', classification: 'Good' }],
          issues: [{ severity: 'major', description: 'Issue' }],
          successes: ['Success'],
        })

        const before = new Date().toISOString()
        const items = extractFromReport(report)
        const after = new Date().toISOString()

        for (const item of items) {
          expect(item.timestamp >= before).toBe(true)
          expect(item.timestamp <= after).toBe(true)
        }
      })
    })
  })

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe("Integration", () => {
    it("should handle complete wisdom extraction flow", () => {
      const findingWisdom = extractFromReviewFinding(createMockFinding({
        severity: 'critical',
        type: 'security',
        message: 'XSS vulnerability',
        location: 'src/input.ts:10',
        suggestion: 'Sanitize input',
      }))

      const failureWisdom = extractFromTestFailure(createMockFailure({
        testName: 'validate input',
        error: 'undefined reference',
        expected: 'valid',
        actual: 'undefined',
        stackTrace: 'at test (test.ts:5)',
      }))

      const successWisdom = extractFromSuccess(createMockSuccess({
        approach: 'Input validation',
        result: '100% test coverage',
        context: 'Security improvement',
        files: ['src/input.ts'],
      }))

      const reportWisdom = extractFromReport(createMockReport({
        divergences: [{ what: 'Added validation', reason: 'Security', classification: 'Good' }],
        issues: [{ severity: 'minor', description: 'Missing docs' }],
        successes: ['Added input sanitization'],
      }))

      const allWisdom = [findingWisdom, failureWisdom, successWisdom, ...reportWisdom]

      expect(allWisdom.length).toBe(6)
      
      for (const wisdom of allWisdom) {
        expect(wisdom.category).toBeDefined()
        expect(wisdom.pattern).toBeDefined()
        expect(wisdom.problem).toBeDefined()
        expect(wisdom.solution).toBeDefined()
        expect(wisdom.severity).toBeDefined()
        expect(wisdom.confidence).toBeGreaterThan(0)
        expect(wisdom.confidence).toBeLessThanOrEqual(100)
        expect(wisdom.timestamp).toBeDefined()
      }
    })

    it("should maintain confidence hierarchy", () => {
      const criticalWisdom = extractFromReviewFinding(createMockFinding({ severity: 'critical', type: 'test' }))
      const majorWisdom = extractFromReviewFinding(createMockFinding({ severity: 'major', type: 'test' }))
      const minorWisdom = extractFromReviewFinding(createMockFinding({ severity: 'minor', type: 'test' }))
      const successWisdom = extractFromSuccess(createMockSuccess())

      expect(criticalWisdom.confidence).toBeGreaterThan(majorWisdom.confidence)
      expect(majorWisdom.confidence).toBeGreaterThan(minorWisdom.confidence)
      expect(successWisdom.confidence).toBe(90)
    })
  })

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe("Edge Cases", () => {
    describe("extractFromReviewFinding edge cases", () => {
      it("should handle empty strings", () => {
        const finding = createMockFinding({
          type: '',
          message: '',
          location: '',
          suggestion: '',
        })

        const wisdom = extractFromReviewFinding(finding)

        expect(wisdom).toBeDefined()
        expect(wisdom.pattern).toBe('')
        expect(wisdom.problem).toBe('')
      })

      it("should handle very long messages", () => {
        const longMessage = 'A'.repeat(10000)
        const finding = createMockFinding({ message: longMessage })

        const wisdom = extractFromReviewFinding(finding)

        expect(wisdom.problem).toBe(longMessage)
      })

      it("should handle special characters", () => {
        const finding = createMockFinding({
          type: 'pattern',
          message: 'Error: ${variable} at `location`',
          location: 'path/to/file.ts:10',
          suggestion: 'Escape special chars: \\n \\t \\r',
        })

        const wisdom = extractFromReviewFinding(finding)

        expect(wisdom.problem).toContain('${variable}')
        expect(wisdom.solution).toContain('\\n')
      })

      it("should handle unicode characters", () => {
        const finding = createMockFinding({
          type: 'pattern',
          message: '错误：无效的输入',
          location: 'src/文件.ts:10',
          suggestion: '使用验证',
        })

        const wisdom = extractFromReviewFinding(finding)

        expect(wisdom.problem).toBe('错误：无效的输入')
        expect(wisdom.solution).toBe('使用验证')
      })
    })

    describe("extractFromTestFailure edge cases", () => {
      it("should handle missing expected/actual", () => {
        const failure = createMockFailure({
          expected: '',
          actual: '',
        })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom).toBeDefined()
        expect(wisdom.solution).toBeDefined()
      })

      it("should handle multiline stack traces", () => {
        const failure = createMockFailure({
          stackTrace: 'Error at line 1\n    at Object.test (file.ts:10:5)\n    at Object.run (app.ts:20:10)\n',
        })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.location).toBeDefined()
      })

      it("should handle stack trace with file paths", () => {
        const failure = createMockFailure({
          stackTrace: '    at Object.<anonymous> (C:\\Projects\\app\\src\\file.ts:15:10)',
        })

        const wisdom = extractFromTestFailure(failure)

        expect(wisdom.location).toBeDefined()
      })
    })

    describe("extractFromSuccess edge cases", () => {
      it("should handle single file", () => {
        const success = createMockSuccess({ files: ['single.ts'] })

        const wisdom = extractFromSuccess(success)

        expect(wisdom.location).toBe('single.ts')
      })

      it("should handle empty approach string", () => {
        const success = createMockSuccess({ approach: '' })

        const wisdom = extractFromSuccess(success)

        expect(wisdom.pattern).toBe('')
        expect(wisdom.category).toBe('Success')
      })

      it("should handle empty context", () => {
        const success = createMockSuccess({ context: '' })

        const wisdom = extractFromSuccess(success)

        expect(wisdom.context).toBe('')
      })
    })

    describe("extractFromReport edge cases", () => {
      it("should handle divergences without classification", () => {
        const report = createMockReport({
          divergences: [{ what: 'Test', reason: 'Reason', classification: '' }],
        })

        const items = extractFromReport(report)

        expect(items[0].category).toBeDefined()
      })

      it("should handle issues without severity", () => {
        const report = createMockReport({
          issues: [{ severity: 'unknown' as any, description: 'Issue' }],
        })

        const items = extractFromReport(report)

        expect(String(items[0].severity)).toBe('unknown')
      })

      it("should handle large reports efficiently", () => {
        const report = createMockReport({
          divergences: Array(100).fill({ what: 'D', reason: 'R', classification: 'Good' }),
          issues: Array(100).fill({ severity: 'major', description: 'Issue' }),
          successes: Array(100).fill('Success'),
        })

        const start = Date.now()
        const items = extractFromReport(report)
        const elapsed = Date.now() - start

        expect(items.length).toBe(300)
        expect(elapsed).toBeLessThan(50)
      })
    })
  })
})