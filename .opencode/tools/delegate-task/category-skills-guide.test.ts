import { describe, it, expect } from "vitest"
import {
  buildCategorySkillsDelegationGuide,
  getRecommendedSkillsForCategory,
  validateCategorySkillCombination,
} from "./category-skills-guide"

describe("Category Skills Guide Integration", () => {
  describe("buildCategorySkillsDelegationGuide", () => {
    it("should build delegation guide for visual-engineering", () => {
      const result = buildCategorySkillsDelegationGuide("visual-engineering", [])
      
      expect(result.prompt).toBeDefined()
      expect(result.model.provider).toBe("ollama")
      expect(result.model.model).toContain("gemini")
      expect(result.skills.length).toBe(0)
      expect(result.warnings.length).toBe(0)
    })

    it("should build delegation guide with skills", () => {
      // Note: This test depends on skills being available in the skills directory
      const result = buildCategorySkillsDelegationGuide("visual-engineering", ["prime"])
      
      expect(result.prompt).toContain("SKILL: prime")
      expect(result.prompt).toContain("frontend specialist")
    })

    it("should include warnings for mismatched category/skill combinations", () => {
      // Note: Validation is a separate function - buildCategorySkillsDelegationGuide doesn't validate
      // Use validateCategorySkillCombination directly for validation warnings
      const result = validateCategorySkillCombination("quick", ["planning-methodology", "prd"])
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes("Complex"))).toBe(true)
    })

    it("should return fallback for unknown category", () => {
      const result = buildCategorySkillsDelegationGuide("unknown-category" as any, [])
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain("Unknown category")
    })
  })

  describe("getRecommendedSkillsForCategory", () => {
    it("should return copy of recommended skills", () => {
      const skills1 = getRecommendedSkillsForCategory("visual-engineering")
      const skills2 = getRecommendedSkillsForCategory("visual-engineering")
      
      expect(skills1).not.toBe(skills2) // Different references (copy)
    })

    it("should return empty array for unknown category", () => {
      const skills = getRecommendedSkillsForCategory("unknown")
      expect(skills).toEqual([])
    })

    it("should return recommended skills for known categories", () => {
      const visualSkills = getRecommendedSkillsForCategory("visual-engineering")
      const quickSkills = getRecommendedSkillsForCategory("quick")
      const deepSkills = getRecommendedSkillsForCategory("deep")
      
      expect(visualSkills).toEqual(expect.arrayContaining(["frontend-ui-ux"]))
      expect(quickSkills).toEqual(expect.arrayContaining(["git-master"]))
      expect(deepSkills).toEqual(expect.arrayContaining(["code-review"]))
    })
  })

  describe("validateCategorySkillCombination", () => {
    it("should warn about complex skills in quick category", () => {
      const result = validateCategorySkillCombination("quick", ["planning-methodology"])
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes("Complex"))).toBe(true)
    })

    it("should warn about visual-engineering without UI skills", () => {
      const result = validateCategorySkillCombination("visual-engineering", ["code-review"])
      
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings.some(w => w.includes("UI"))).toBe(true)
    })

    it("should pass for appropriate combinations", () => {
      const result = validateCategorySkillCombination("deep", ["code-review", "git-master"])
      
      expect(result.warnings.length).toBe(0)
      expect(result.valid).toBe(true)
    })

    it("should pass for writing category", () => {
      const result = validateCategorySkillCombination("writing", [])
      
      expect(result.warnings.length).toBe(0)
      expect(result.valid).toBe(true)
    })
  })
})