/**
 * Wisdom Storage Integration Tests
 * 
 * Tests verify:
 * - ensureWisdomDir: Directory creation
 * - loadWisdom: Load wisdom from files
 * - saveWisdom: Persist wisdom to files
 * - addWisdomItem: Add single wisdom item
 * - addWisdomItems: Add multiple wisdom items
 * - searchWisdom: Search with filters
 * - Persistence across sessions
 */

import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import {
  loadWisdom,
  saveWisdom,
  addWisdomItem,
  addWisdomItems,
  searchWisdom,
  ensureWisdomDir,
} from "../../../features/wisdom/storage"
import type { WisdomFile, WisdomItem } from "../../../features/wisdom/types"

// ============================================================
// TEST HELPERS
// ============================================================

// Use unique test feature names to avoid conflicts
function getUniqueFeature(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function createTestWisdomItem(overrides: Partial<WisdomItem> = {}): WisdomItem {
  return {
    category: "Convention",
    pattern: "Test pattern",
    problem: "Test problem",
    solution: "Test solution",
    severity: "minor",
    timestamp: new Date().toISOString(),
    confidence: 80,
    ...overrides,
  }
}

function cleanupFeature(feature: string): void {
  // Best effort cleanup
  try {
    const wisdomDir = ".agents/wisdom"
    const dir = join(wisdomDir, feature)
    if (existsSync(dir)) {
      rmSync(dir, { recursive: true, force: true })
    }
  } catch {
    // Ignore cleanup errors
  }
}

// ============================================================
// ENSURE WISDOM DIR TESTS
// ============================================================

describe("Wisdom Storage Integration", () => {
  let testFeature: string
  let testFeature2: string

  beforeEach(() => {
    testFeature = getUniqueFeature()
    testFeature2 = getUniqueFeature()
  })

  afterEach(() => {
    cleanupFeature(testFeature)
    cleanupFeature(testFeature2)
  })

  describe("ensureWisdomDir", () => {
    it("should create wisdom directory", () => {
      const dir = ensureWisdomDir(testFeature)
      expect(dir).toBeTruthy()
      expect(typeof dir).toBe("string")
    })

    it("should return a directory path containing the feature name", () => {
      const dir = ensureWisdomDir(testFeature)
      expect(dir).toContain(testFeature)
    })

    it("should not fail if directory already exists", () => {
      ensureWisdomDir(testFeature)
      ensureWisdomDir(testFeature) // Should not throw
    })

    it("should create nested directories for sub-features", () => {
      const nestedFeature = `${testFeature}/nested/deep`
      const dir = ensureWisdomDir(nestedFeature)
      expect(dir).toBeTruthy()
      expect(dir).toContain("nested")
      expect(dir).toContain("deep")

      // Cleanup nested
      cleanupFeature(testFeature)
    })
  })

  // ============================================================
  // LOAD WISDOM TESTS
  // ============================================================

  describe("loadWisdom", () => {
    it("should return empty wisdom for a fresh feature", () => {
      const freshFeature = getUniqueFeature()
      const wisdom = loadWisdom(freshFeature)

      expect(wisdom.feature).toBe(freshFeature)
      expect(wisdom.conventions.length).toBe(0)
      expect(wisdom.successes.length).toBe(0)
      expect(wisdom.failures.length).toBe(0)
      expect(wisdom.gotchas.length).toBe(0)
      expect(wisdom.sessions.length).toBe(0)

      cleanupFeature(freshFeature)
    })

    it("should load wisdom with items after adding", () => {
      const item = createTestWisdomItem({ category: "Convention", pattern: "Use async/await" })
      addWisdomItem(testFeature, item)

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.conventions.length).toBeGreaterThan(0)
      expect(wisdom.conventions.some(c => c.pattern === "Use async/await")).toBe(true)
    })

    it("should parse all categories correctly", () => {
      addWisdomItem(testFeature, { category: "Convention", pattern: "Convention pattern", problem: "P", solution: "S", severity: "minor", timestamp: new Date().toISOString(), confidence: 70 })
      addWisdomItem(testFeature, { category: "Success", pattern: "Success pattern", problem: "P", solution: "S", severity: "minor", timestamp: new Date().toISOString(), confidence: 80 })
      addWisdomItem(testFeature, { category: "Failure", pattern: "Failure pattern", problem: "P", solution: "S", severity: "major", timestamp: new Date().toISOString(), confidence: 85 })
      addWisdomItem(testFeature, { category: "Gotcha", pattern: "Gotcha pattern", problem: "P", solution: "S", severity: "critical", timestamp: new Date().toISOString(), confidence: 95 })

      const wisdom = loadWisdom(testFeature)

      expect(wisdom.conventions.length).toBe(1)
      expect(wisdom.successes.length).toBe(1)
      expect(wisdom.failures.length).toBe(1)
      expect(wisdom.gotchas.length).toBe(1)
    })
  })

  // ============================================================
  // SAVE WISDOM TESTS
  // ============================================================

  describe("saveWisdom", () => {
    it("should persist wisdom to file", () => {
      const wisdom: WisdomFile = {
        feature: testFeature,
        conventions: [createTestWisdomItem({ category: "Convention", pattern: "Test convention" })],
        successes: [],
        failures: [],
        gotchas: [],
        sessions: [],
      }

      saveWisdom(wisdom)

      // Verify we can load it back
      const loaded = loadWisdom(testFeature)
      expect(loaded.conventions.length).toBe(1)
      expect(loaded.conventions[0].pattern).toBe("Test convention")
    })

    it("should overwrite existing wisdom", () => {
      const wisdom1: WisdomFile = {
        feature: testFeature,
        conventions: [createTestWisdomItem({ pattern: "First pattern" })],
        successes: [],
        failures: [],
        gotchas: [],
        sessions: [],
      }

      saveWisdom(wisdom1)

      const wisdom2: WisdomFile = {
        feature: testFeature,
        conventions: [createTestWisdomItem({ pattern: "Second pattern" })],
        successes: [],
        failures: [],
        gotchas: [],
        sessions: [],
      }

      saveWisdom(wisdom2)

      const loaded = loadWisdom(testFeature)
      expect(loaded.conventions.length).toBe(1)
      expect(loaded.conventions[0].pattern).toBe("Second pattern")
    })

    it("should preserve all categories when saving", () => {
      const wisdom: WisdomFile = {
        feature: testFeature,
        conventions: [createTestWisdomItem({ category: "Convention", pattern: "C1" })],
        successes: [createTestWisdomItem({ category: "Success", pattern: "S1" })],
        failures: [createTestWisdomItem({ category: "Failure", pattern: "F1" })],
        gotchas: [createTestWisdomItem({ category: "Gotcha", pattern: "G1" })],
        sessions: [],
      }

      saveWisdom(wisdom)
      const loaded = loadWisdom(testFeature)

      expect(loaded.conventions.length).toBe(1)
      expect(loaded.successes.length).toBe(1)
      expect(loaded.failures.length).toBe(1)
      expect(loaded.gotchas.length).toBe(1)
    })
  })

  // ============================================================
  // ADD WISDOM ITEM TESTS
  // ============================================================

  describe("addWisdomItem", () => {
    it("should add wisdom item to appropriate category", () => {
      const item = createTestWisdomItem({
        category: "Convention",
        pattern: "Use TypeScript strict mode",
        problem: "Loose typing causes bugs",
        solution: "Enable strict mode in tsconfig",
        severity: "minor",
        confidence: 85,
      })

      addWisdomItem(testFeature, item)

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.conventions.length).toBe(1)
      expect(wisdom.conventions[0].pattern).toBe("Use TypeScript strict mode")
    })

    it("should add success items to successes array", () => {
      const item = createTestWisdomItem({ category: "Success", pattern: "Used connection pooling" })
      addWisdomItem(testFeature, item)

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.successes.length).toBe(1)
    })

    it("should add failure items to failures array", () => {
      const item = createTestWisdomItem({ category: "Failure", pattern: "Direct DB calls" })
      addWisdomItem(testFeature, item)

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.failures.length).toBe(1)
    })

    it("should add gotcha items to gotchas array", () => {
      const item = createTestWisdomItem({ category: "Gotcha", pattern: "SQL injection risk" })
      addWisdomItem(testFeature, item)

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.gotchas.length).toBe(1)
    })

    it("should append to existing items", () => {
      addWisdomItem(testFeature, { category: "Convention", pattern: "First", problem: "P", solution: "S", severity: "minor", timestamp: new Date().toISOString(), confidence: 70 })
      addWisdomItem(testFeature, { category: "Convention", pattern: "Second", problem: "P", solution: "S", severity: "minor", timestamp: new Date().toISOString(), confidence: 70 })

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.conventions.length).toBe(2)
    })
  })

  // ============================================================
  // ADD WISDOM ITEMS TESTS
  // ============================================================

  describe("addWisdomItems", () => {
    it("should add multiple items at once", () => {
      const items: WisdomItem[] = [
        { category: "Convention", pattern: "C1", problem: "P", solution: "S", severity: "minor", timestamp: new Date().toISOString(), confidence: 70 },
        { category: "Success", pattern: "S1", problem: "P", solution: "S", severity: "minor", timestamp: new Date().toISOString(), confidence: 80 },
        { category: "Gotcha", pattern: "G1", problem: "P", solution: "S", severity: "major", timestamp: new Date().toISOString(), confidence: 90 },
      ]

      addWisdomItems(testFeature, items)

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.conventions.length).toBe(1)
      expect(wisdom.successes.length).toBe(1)
      expect(wisdom.gotchas.length).toBe(1)
    })

    it("should handle empty array", () => {
      addWisdomItems(testFeature, [])

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.conventions.length).toBe(0)
    })
  })

  // ============================================================
  // SEARCH WISDOM TESTS
  // ============================================================

  describe("searchWisdom", () => {
    beforeEach(() => {
      // Add test data
      addWisdomItem(testFeature, { category: "Convention", pattern: "Use async/await", problem: "Callback hell", solution: "Use async/await", severity: "minor", timestamp: new Date().toISOString(), confidence: 80 })
      addWisdomItem(testFeature, { category: "Gotcha", pattern: "SQL injection", problem: "Unsanitized input", solution: "Use parameterized queries", severity: "critical", timestamp: new Date().toISOString(), confidence: 95 })
      addWisdomItem(testFeature, { category: "Gotcha", pattern: "XSS vulnerability", problem: "Unescaped output", solution: "Escape HTML", severity: "major", timestamp: new Date().toISOString(), confidence: 85 })
    })

    it("should search by pattern", () => {
      const wisdom = loadWisdom(testFeature)
      const results = searchWisdom(wisdom, { pattern: "SQL" })

      expect(results.length).toBeGreaterThan(0)
      for (const item of results) {
        const matches = item.pattern.toLowerCase().includes("sql") ||
          item.problem.toLowerCase().includes("sql") ||
          item.solution.toLowerCase().includes("sql")
        expect(matches).toBe(true)
      }
    })

    it("should filter by category", () => {
      const wisdom = loadWisdom(testFeature)
      const results = searchWisdom(wisdom, { category: "Gotcha" })

      for (const item of results) {
        expect(item.category).toBe("Gotcha")
      }
    })

    it("should filter by minConfidence", () => {
      const wisdom = loadWisdom(testFeature)
      const results = searchWisdom(wisdom, { minConfidence: 85 })

      for (const item of results) {
        expect(item.confidence).toBeGreaterThanOrEqual(85)
      }
    })

    it("should combine filters", () => {
      const wisdom = loadWisdom(testFeature)
      const results = searchWisdom(wisdom, { category: "Gotcha", minConfidence: 90 })

      for (const item of results) {
        expect(item.category).toBe("Gotcha")
        expect(item.confidence).toBeGreaterThanOrEqual(90)
      }
    })

    it("should return all items when no filters", () => {
      const wisdom = loadWisdom(testFeature)
      const results = searchWisdom(wisdom, {})

      const total = wisdom.conventions.length + wisdom.successes.length + wisdom.failures.length + wisdom.gotchas.length
      expect(results.length).toBe(total)
    })

    it("should filter by recent days", () => {
      const wisdom = loadWisdom(testFeature)
      const results = searchWisdom(wisdom, { recent: 7 })

      for (const item of results) {
        const itemDate = new Date(item.timestamp)
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 7)
        expect(itemDate >= cutoff).toBe(true)
      }
    })
  })

  // ============================================================
  // FILE I/O TESTS
  // ============================================================

  describe("File I/O", () => {
    it("should persist across calls", () => {
      addWisdomItem(testFeature, { category: "Convention", pattern: "Session persistence test", problem: "P", solution: "S", severity: "minor", timestamp: new Date().toISOString(), confidence: 70 })

      // Simulate session restart - load fresh
      const wisdom = loadWisdom(testFeature)
      expect(wisdom.conventions.some(c => c.pattern === "Session persistence test")).toBe(true)
    })

    it("should create directory if not exists", () => {
      const newFeature = getUniqueFeature()
      cleanupFeature(newFeature)

      addWisdomItem(newFeature, { category: "Convention", pattern: "New feature", problem: "P", solution: "S", severity: "minor", timestamp: new Date().toISOString(), confidence: 70 })

      const wisdom = loadWisdom(newFeature)
      expect(wisdom.conventions.length).toBe(1)

      cleanupFeature(newFeature)
    })

    it("should handle special characters in patterns", () => {
      const item = createTestWisdomItem({
        pattern: "Use ${variable} interpolation",
        problem: "Template literals ${foo}",
        solution: "Escape $ as \\$",
      })

      addWisdomItem(testFeature, item)

      const wisdom = loadWisdom(testFeature)
      const found = wisdom.conventions.find(c => c.pattern.includes("${variable}"))
      expect(found).toBeDefined()
    })

    it("should handle unicode in patterns", () => {
      const item = createTestWisdomItem({
        pattern: "使用异步编程",
        problem: "回调地狱",
        solution: "使用 async/await",
      })

      addWisdomItem(testFeature, item)

      const wisdom = loadWisdom(testFeature)
      const found = wisdom.conventions.find(c => c.pattern === "使用异步编程")
      expect(found).toBeDefined()
    })
  })

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe("Edge Cases", () => {
    it("should handle empty wisdom file gracefully", () => {
      ensureWisdomDir(testFeature)
      // Write an empty learnings.md
      const dir = join(".agents", "wisdom", testFeature)
      const filePath = join(dir, "learnings.md")
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(filePath, "")

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.feature).toBe(testFeature)
      expect(wisdom.conventions.length).toBe(0)
    })

    it("should handle malformed markdown gracefully", () => {
      ensureWisdomDir(testFeature)
      const dir = join(".agents", "wisdom", testFeature)
      const filePath = join(dir, "learnings.md")
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }
      writeFileSync(filePath, "## Invalid\nNo proper format\nRandom text")

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.feature).toBe(testFeature)
      // Should not throw, just return empty categories
    })

    it("should handle very long patterns", () => {
      const longPattern = "A".repeat(10000)
      const item = createTestWisdomItem({ pattern: longPattern })

      addWisdomItem(testFeature, item)

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.conventions[0].pattern).toBe(longPattern)
    })

    it("should handle multiple sequential writes", () => {
      // Add multiple items rapidly
      for (let i = 0; i < 10; i++) {
        addWisdomItem(testFeature, {
          category: "Convention",
          pattern: `Pattern ${i}`,
          problem: "P",
          solution: "S",
          severity: "minor",
          timestamp: new Date().toISOString(),
          confidence: 70,
        })
      }

      const wisdom = loadWisdom(testFeature)
      expect(wisdom.conventions.length).toBe(10)
    })
  })
})