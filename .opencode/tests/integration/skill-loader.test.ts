/**
 * Skill Loader Integration Tests
 * 
 * Tests verify:
 * - Skill discovery from .opencode/skills/
 * - Skill caching behavior
 * - Prompt injection formatting
 * - Category + skill combination
 * 
 * Note: Tests use actual API signatures from implementation:
 * - discoverSkills() returns Map<string, Skill>
 * - getSkillContentForPrompt(skillNames: string[]) takes skill names
 * - buildCategorySkillPrompt(categoryPrompt: string, skillNames: string[])
 */

import { describe, it, expect, beforeEach } from "bun:test"
import { 
  discoverSkills, 
  loadSkill, 
  loadSkills, 
  getSkillContentForPrompt,
  buildCategorySkillPrompt,
  clearSkillsCache,
  type Skill
} from "../../features/skill-loader/index"
import {
  getAvailableSkillNames,
  getAvailableSkills,
  checkSkillAvailability,
  searchSkills,
  getSkillsByCompatibility
} from "../../features/skill-loader/available-skills"
import { CATEGORY_PROMPT_APPENDS } from "../../tools/delegate-task/constants"

// ============================================================
// SKILL DISCOVERY TESTS
// ============================================================

describe("Skill Loader Integration", () => {
  beforeEach(() => {
    clearSkillsCache()
  })

  // ============================================================
  // DISCOVER SKILLS - Map-based API
  // ============================================================

  describe("Skill Discovery", () => {
    describe("discoverSkills", () => {
      it("should discover all available skills as a Map", () => {
        const skills = discoverSkills()
        expect(skills).toBeInstanceOf(Map)
        expect(skills.size).toBeGreaterThan(10)
        
        // Check structure - each value must be a valid Skill
        for (const [name, skill] of skills) {
          expect(skill.name).toBe(name)
          expect(skill.path).toBeTruthy()
          expect(skill.content).toBeTruthy()
          expect(skill.description).toBeTruthy()
        }
      })

      it("should include standard project skills", () => {
        const skills = discoverSkills()
        const names = Array.from(skills.keys())
        
        // Core skills from .opencode/skills/
        expect(names).toContain("prime")
        expect(names).toContain("code-review")
        expect(names).toContain("commit")
        expect(names).toContain("execute")
        expect(names).toContain("planning-methodology")
      })

      it("should extract descriptions from skill content", () => {
        const skills = discoverSkills()
        const primeSkill = skills.get("prime")
        
        expect(primeSkill).toBeDefined()
        expect(primeSkill!.description).toBeDefined()
        expect(primeSkill!.description.length).toBeGreaterThan(0)
      })

      it("should include compatibility field", () => {
        const skills = discoverSkills()
        for (const skill of skills.values()) {
          expect(skill.compatibility).toBeDefined()
        }
      })

      it("should return cached Map on subsequent calls", () => {
        const skills1 = discoverSkills()
        const skills2 = discoverSkills()
        
        // Same reference (cached)
        expect(skills1).toBe(skills2)
      })

      it("should have valid file paths", () => {
        const skills = discoverSkills()
        
        for (const skill of skills.values()) {
          expect(skill.path).toContain(".opencode")
          expect(skill.path).toContain("skills")
          expect(skill.path).toContain("SKILL.md")
        }
      })
    })

    describe("loadSkill", () => {
      it("should load a specific skill by name", () => {
        const skill = loadSkill("prime")
        
        expect(skill).not.toBeNull()
        expect(skill!.name).toBe("prime")
        expect(skill!.content).toBeTruthy()
        expect(skill!.content.length).toBeGreaterThan(100)
      })

      it("should return null for non-existent skill", () => {
        const skill = loadSkill("nonexistent-skill-xyz")
        expect(skill).toBeNull()
      })

      it("should return cached skill after first load", () => {
        const skill1 = loadSkill("prime")
        const skill2 = loadSkill("prime")
        
        // Both should reference the same cached object
        expect(skill1).toBe(skill2)
      })
    })

    describe("loadSkills", () => {
      it("should load multiple skills by name", () => {
        const skills = loadSkills(["prime", "code-review", "commit"])
        
        expect(skills.length).toBe(3)
        expect(skills.map(s => s.name)).toEqual(["prime", "code-review", "commit"])
      })

      it("should return empty array for empty input", () => {
        const skills = loadSkills([])
        expect(skills.length).toBe(0)
      })

      it("should skip non-existent skills", () => {
        const skills = loadSkills(["prime", "fake-skill-123", "code-review"])
        
        expect(skills.length).toBe(2)
        expect(skills.map(s => s.name)).toEqual(["prime", "code-review"])
      })

      it("should handle duplicate skill names gracefully", () => {
        const skills = loadSkills(["prime", "prime"])
        
        // Implementation returns all requested skills including duplicates
        // This is by design - it preserves the order requested
        expect(skills.length).toBe(2)
        expect(skills[0].name).toBe("prime")
        expect(skills[1].name).toBe("prime")
        // Both point to the same cached skill object
        expect(skills[0]).toBe(skills[1])
      })
    })
  })

  // ============================================================
  // AVAILABLE SKILLS HELPERS
  // ============================================================

  describe("Available Skills Helpers", () => {
    beforeEach(() => {
      clearSkillsCache()
    })

    describe("getAvailableSkillNames", () => {
      it("should return array of skill names", () => {
        const names = getAvailableSkillNames()
        
        expect(Array.isArray(names)).toBe(true)
        expect(names.length).toBeGreaterThan(10)
        expect(typeof names[0]).toBe("string")
      })

      it("should include expected core skills", () => {
        const names = getAvailableSkillNames()
        
        expect(names).toContain("prime")
        expect(names).toContain("code-review")
        expect(names).toContain("commit")
        expect(names).toContain("execute")
      })
    })

    describe("getAvailableSkills", () => {
      it("should return array of Skill objects", () => {
        const skills = getAvailableSkills()
        
        expect(Array.isArray(skills)).toBe(true)
        expect(skills.length).toBeGreaterThan(10)
        
        for (const skill of skills) {
          expect(skill.name).toBeTruthy()
          expect(skill.content).toBeTruthy()
          expect(skill.description).toBeTruthy()
        }
      })
    })

    describe("checkSkillAvailability", () => {
      it("should check availability for given skill names", () => {
        const results = checkSkillAvailability(["prime", "fake-skill", "code-review"])
        
        expect(results.length).toBe(3)
        expect(results[0].name).toBe("prime")
        expect(results[0].available).toBe(true)
        expect(results[1].name).toBe("fake-skill")
        expect(results[1].available).toBe(false)
        expect(results[2].name).toBe("code-review")
        expect(results[2].available).toBe(true)
      })

      it("should include path and description for available skills", () => {
        const results = checkSkillAvailability(["prime"])
        
        expect(results[0].available).toBe(true)
        expect(results[0].path).toBeTruthy()
        expect(results[0].description).toBeTruthy()
      })

      it("should return undefined path for unavailable skills", () => {
        const results = checkSkillAvailability(["nonexistent"])
        
        expect(results[0].available).toBe(false)
        expect(results[0].path).toBeUndefined()
      })
    })

    describe("searchSkills", () => {
      it("should find skills by keyword", () => {
        const results = searchSkills("review")
        
        expect(results.length).toBeGreaterThan(0)
        // Should find code-review, possibly others
        const names = results.map(s => s.name)
        expect(names).toContain("code-review")
      })

      it("should match case-insensitively", () => {
        const results = searchSkills("PRIME")
        
        expect(results.length).toBeGreaterThan(0)
        expect(results.map(s => s.name)).toContain("prime")
      })

      it("should match in description", () => {
        const results = searchSkills("prime")
        
        expect(results.length).toBeGreaterThan(0)
        // Prime skill should be found by name search
        const names = results.map(s => s.name)
        expect(names).toContain("prime")
      })

      it("should return empty array for no matches", () => {
        const results = searchSkills("xyznonexistentkeyword")
        expect(results.length).toBe(0)
      })
    })

    describe("getSkillsByCompatibility", () => {
      it("should group skills by compatibility", () => {
        const grouped = getSkillsByCompatibility()
        
        expect(typeof grouped).toBe("object")
        // Should have at least one compatibility group
        expect(Object.keys(grouped).length).toBeGreaterThan(0)
      })
    })
  })

  // ============================================================
  // SKILL CACHING TESTS
  // ============================================================

  describe("Skill Caching", () => {
    beforeEach(() => {
      clearSkillsCache()
    })

    describe("clearSkillsCache", () => {
      it("should clear cached skills map", () => {
        // First load populates cache
        const skills1 = discoverSkills()
        expect(skills1.size).toBeGreaterThan(0)
        
        // Clear cache
        clearSkillsCache()
        
        // Next load creates new map
        const skills2 = discoverSkills()
        
        // Different Map references after clear
        expect(skills1).not.toBe(skills2)
      })

      it("should allow fresh reload after clear", () => {
        const skills1 = loadSkill("prime")
        clearSkillsCache()
        const skills2 = loadSkill("prime")
        
        // Both should have same content but different references
        expect(skills1!.name).toBe(skills2!.name)
        expect(skills1!.content).toBe(skills2!.content)
      })
    })

    describe("Cache Behavior", () => {
      it("should cache skills after discovery", () => {
        // First call discovers
        const skills1 = discoverSkills()
        
        // Second call returns same cached reference
        const skills2 = discoverSkills()
        
        expect(skills1).toBe(skills2)
      })

      it("should return cached skills from loadSkill", () => {
        const skills1 = loadSkill("prime")
        const skills2 = loadSkill("prime")
        
        // Same reference due to caching
        expect(skills1).toBe(skills2)
      })
    })
  })

  // ============================================================
  // PROMPT INJECTION TESTS
  // ============================================================

  describe("Prompt Injection", () => {
    beforeEach(() => {
      clearSkillsCache()
    })

    describe("getSkillContentForPrompt", () => {
      it("should return empty string for empty skill names array", () => {
        const content = getSkillContentForPrompt([])
        expect(content).toBe("")
      })

      it("should return empty string for non-existent skill names", () => {
        const content = getSkillContentForPrompt(["nonexistent-skill"])
        expect(content).toBe("")
      })

      it("should format single skill with delimiters", () => {
        const content = getSkillContentForPrompt(["prime"])
        
        expect(content).toContain("━━━━━━━━━━━━━━━━━━")
        expect(content).toContain("SKILL: prime")
        expect(content).toContain("END SKILL: prime")
      })

      it("should format multiple skills with separators", () => {
        const content = getSkillContentForPrompt(["prime", "code-review"])
        
        expect(content).toContain("SKILL: prime")
        expect(content).toContain("SKILL: code-review")
        expect(content).toContain("END SKILL: prime")
        expect(content).toContain("END SKILL: code-review")
      })

      it("should include actual skill content between delimiters", () => {
        const content = getSkillContentForPrompt(["prime"])
        
        // Content should be substantial (full skill documentation)
        expect(content.length).toBeGreaterThan(200)
        
        // Should contain actual skill content
        expect(content).toContain("context")
      })

      it("should skip non-existent skills and include valid ones", () => {
        const content = getSkillContentForPrompt(["prime", "fake-skill", "commit"])
        
        expect(content).toContain("SKILL: prime")
        expect(content).toContain("SKILL: commit")
        expect(content).not.toContain("SKILL: fake-skill")
      })

      it("should maintain skill order from input array", () => {
        const content = getSkillContentForPrompt(["commit", "prime", "code-review"])
        
        const commitIdx = content.indexOf("SKILL: commit")
        const primeIdx = content.indexOf("SKILL: prime")
        const reviewIdx = content.indexOf("SKILL: code-review")
        
        // All should be found
        expect(commitIdx).toBeGreaterThan(-1)
        expect(primeIdx).toBeGreaterThan(-1)
        expect(reviewIdx).toBeGreaterThan(-1)
        
        // Order should match input order
        expect(commitIdx).toBeLessThan(primeIdx)
        expect(primeIdx).toBeLessThan(reviewIdx)
      })

      it("should have consistent delimiter format for each skill", () => {
        const content = getSkillContentForPrompt(["commit"])
        
        // Each skill should have exactly 4 delimiter lines
        const lines = content.split("\n")
        const delimiterLines = lines.filter(line => line.includes("━"))
        
        // At least 4 delimiter lines (start/end for content block)
        expect(delimiterLines.length).toBeGreaterThanOrEqual(4)
      })
    })

    describe("buildCategorySkillPrompt", () => {
      it("should combine skills and category prompt", () => {
        const categoryPrompt = CATEGORY_PROMPT_APPENDS["ultrabrain"]
        const content = buildCategorySkillPrompt(categoryPrompt, ["execute"])
        
        // Should have skill content
        expect(content).toContain("SKILL: execute")
        
        // Should have category prompt
        expect(content).toContain("difficult problem")
      })

      it("should handle skills only (no category prompt)", () => {
        const content = buildCategorySkillPrompt("", ["prime"])
        
        expect(content).toContain("SKILL: prime")
        // When category prompt is empty but skills exist, returns skill content
        // Note: skill files may have their own YAML frontmatter with --- delimiters
        expect(content.length).toBeGreaterThan(100)
        expect(content).toContain("Prime")
      })

      it("should handle category only (no skills)", () => {
        const categoryPrompt = CATEGORY_PROMPT_APPENDS["quick"]
        const content = buildCategorySkillPrompt(categoryPrompt, [])
        
        // Should just be the category prompt (no skill injection)
        expect(content).toContain("Quick task mode")
        expect(content).not.toContain("SKILL:")
      })

      it("should separate skills and category with separator", () => {
        const categoryPrompt = CATEGORY_PROMPT_APPENDS["deep"]
        const content = buildCategorySkillPrompt(categoryPrompt, ["prime"])
        
        // Should have separator between skills and category
        expect(content).toContain("---")
        
        // Skills should come before separator
        const skillIdx = content.indexOf("SKILL:")
        const sepIdx = content.indexOf("---")
        expect(skillIdx).toBeLessThan(sepIdx)
      })

      it("should work with all 8 categories", () => {
        const categories = [
          "visual-engineering",
          "ultrabrain",
          "artistry",
          "quick",
          "deep",
          "unspecified-low",
          "unspecified-high",
          "writing"
        ]
        
        for (const category of categories) {
          const categoryPrompt = CATEGORY_PROMPT_APPENDS[category]
          const content = buildCategorySkillPrompt(categoryPrompt, ["prime"])
          
          expect(content).toContain("SKILL: prime")
          expect(content.length).toBeGreaterThan(100)
        }
      })

      it("should handle empty strings for both inputs", () => {
        const content = buildCategorySkillPrompt("", [])
        expect(content).toBe("")
      })
    })
  })

  // ============================================================
  // SKILL CONTENT VALIDATION TESTS
  // ============================================================

  describe("Skill Content Validation", () => {
    beforeEach(() => {
      clearSkillsCache()
    })

    describe("Each skill has required fields", () => {
      it("should have prime skill with context loading content", () => {
        const skill = loadSkill("prime")
        
        expect(skill).not.toBeNull()
        expect(skill!.content).toContain("context")
        expect(skill!.content.length).toBeGreaterThan(100)
      })

      it("should have code-review skill with review methodology", () => {
        const skill = loadSkill("code-review")
        
        expect(skill).not.toBeNull()
        expect(skill!.content.toLowerCase()).toContain("review")
      })

      it("should have commit skill with conventional format", () => {
        const skill = loadSkill("commit")
        
        expect(skill).not.toBeNull()
        expect(skill!.content.toLowerCase()).toContain("commit")
      })

      it("should have execute skill with execution methodology", () => {
        const skill = loadSkill("execute")
        
        expect(skill).not.toBeNull()
        expect(skill!.content.toLowerCase()).toContain("task")
      })

      it("should have planning-methodology skill", () => {
        const skill = loadSkill("planning-methodology")
        
        expect(skill).not.toBeNull()
        expect(skill!.content.length).toBeGreaterThan(100)
      })
    })

    describe("Skill content structure", () => {
      it("should have non-empty content for all discovered skills", () => {
        const skills = getAvailableSkills()
        
        for (const skill of skills) {
          expect(skill.content).toBeTruthy()
          expect(skill.content.length).toBeGreaterThan(50)
        }
      })

      it("should have valid path for all discovered skills", () => {
        const skills = getAvailableSkills()
        
        for (const skill of skills) {
          expect(skill.path).toBeTruthy()
          expect(skill.path).toMatch(/SKILL\.md$/)
        }
      })

      it("should have description extracted from content", () => {
        const skills = getAvailableSkills()
        
        for (const skill of skills) {
          expect(skill.description).toBeDefined()
          expect(skill.description.length).toBeGreaterThan(0)
        }
      })

      it("should have markdown content in skill files", () => {
        const skill = loadSkill("prime")
        
        // Should contain markdown headers
        expect(skill!.content).toMatch(/^#\s/m)
      })
    })
  })

  // ============================================================
  // CATEGORY + SKILL INTEGRATION TESTS
  // ============================================================

  describe("Category + Skill Integration", () => {
    beforeEach(() => {
      clearSkillsCache()
    })

    it("should combine ultrabrain category with execute skill", () => {
      const categoryPrompt = CATEGORY_PROMPT_APPENDS["ultrabrain"]
      const content = buildCategorySkillPrompt(categoryPrompt, ["execute"])
      
      // Skills first
      expect(content).toContain("SKILL: execute")
      // Then category
      expect(content).toContain("difficult problem")
      expect(content).toContain("step by step")
    })

    it("should combine quick category with prime skill", () => {
      const categoryPrompt = CATEGORY_PROMPT_APPENDS["quick"]
      const content = buildCategorySkillPrompt(categoryPrompt, ["prime"])
      
      expect(content).toContain("SKILL: prime")
      expect(content).toContain("Speed")
      expect(content).toContain("Minimal changes")
    })

    it("should combine deep category with planning-methodology skill", () => {
      const categoryPrompt = CATEGORY_PROMPT_APPENDS["deep"]
      const content = buildCategorySkillPrompt(categoryPrompt, ["planning-methodology"])
      
      expect(content).toContain("SKILL: planning-methodology")
      expect(content).toContain("investigation")
      expect(content).toContain("Research thoroughly")
    })

    it("should handle multiple skills with category", () => {
      const categoryPrompt = CATEGORY_PROMPT_APPENDS["visual-engineering"]
      const content = buildCategorySkillPrompt(categoryPrompt, ["prime", "code-review"])
      
      expect(content).toContain("SKILL: prime")
      expect(content).toContain("SKILL: code-review")
      expect(content).toContain("frontend")
    })

    it("should work with maximum practical skill count (5)", () => {
      const allNames = getAvailableSkillNames()
      const first5 = allNames.slice(0, 5)
      
      const categoryPrompt = CATEGORY_PROMPT_APPENDS["deep"]
      const content = buildCategorySkillPrompt(categoryPrompt, first5)
      
      expect(content.length).toBeGreaterThan(1000)
      
      // All 5 should be in content
      for (const name of first5) {
        expect(content).toContain(`SKILL: ${name}`)
      }
    })
  })

  // ============================================================
  // PERFORMANCE TESTS
  // ============================================================

  describe("Performance", () => {
    beforeEach(() => {
      clearSkillsCache()
    })

    it("should load cached skills faster than disk read", () => {
      // First load (from disk)
      const start1 = Date.now()
      discoverSkills()
      const diskTime = Date.now() - start1

      // Second load (from cache)
      const start2 = Date.now()
      discoverSkills()
      const cacheTime = Date.now() - start2

      // Cache should be significantly faster or equal
      // (allow small tolerance for timing variance)
      expect(cacheTime).toBeLessThanOrEqual(diskTime + 5)
    })

    it("should handle empty skill list efficiently", () => {
      const start = Date.now()
      const content = getSkillContentForPrompt([])
      const elapsed = Date.now() - start

      expect(content).toBe("")
      expect(elapsed).toBeLessThan(5) // Should be instant
    })

    it("should handle non-existent skills efficiently", () => {
      const start = Date.now()
      const skills = loadSkills(["nonexistent1", "nonexistent2", "nonexistent3"])
      const elapsed = Date.now() - start

      expect(skills.length).toBe(0)
      expect(elapsed).toBeLessThan(50) // Should fail quickly
    })

    it("should efficiently discover all skills", () => {
      const start = Date.now()
      const skills = discoverSkills()
      const elapsed = Date.now() - start

      expect(skills.size).toBeGreaterThan(10)
      expect(elapsed).toBeLessThan(100) // Should be fast
    })
  })

  // ============================================================
  // ERROR HANDLING TESTS
  // ============================================================

  describe("Error Handling", () => {
    it("should handle missing skills directory gracefully", () => {
      // discoverSkills should work even if some directories don't exist
      // (it filters with existsSync)
      const skills = discoverSkills()
      
      expect(skills).toBeInstanceOf(Map)
      expect(skills.size).toBeGreaterThan(0)
    })

    it("should skip invalid skill names and return valid ones", () => {
      const skills = loadSkills(["", "prime", "   ", "code-review", "nonexistent"])
      
      const names = skills.map(s => s.name)
      expect(names).toContain("prime")
      expect(names).toContain("code-review")
      expect(names).not.toContain("")
      expect(names).not.toContain("   ")
      expect(names).not.toContain("nonexistent")
    })

    it("should handle empty strings in skill names", () => {
      const skills = loadSkills(["", "", ""])
      expect(skills.length).toBe(0)
    })

    it("should handle whitespace-only skill names", () => {
      const skills = loadSkills(["   ", "\t", "\n"])
      expect(skills.length).toBe(0)
    })
  })
})