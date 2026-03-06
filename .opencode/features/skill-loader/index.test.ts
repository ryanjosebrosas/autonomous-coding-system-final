import { describe, it, expect, beforeEach } from "vitest"
import {
  discoverSkills,
  loadSkill,
  loadSkills,
  getSkillContentForPrompt,
  clearSkillsCache,
} from "./index"

describe("Skill Loader", () => {
  beforeEach(() => {
    clearSkillsCache()
  })

  describe("discoverSkills", () => {
    it("should discover skills from .opencode/skills/", () => {
      const skills = discoverSkills()
      expect(skills.size).toBeGreaterThan(0)
      
      // Check for known skills from the codebase
      const skillNames = Array.from(skills.keys())
      expect(skillNames).toContain("prime")
      expect(skillNames).toContain("execute")
      expect(skillNames).toContain("code-review")
      expect(skillNames).toContain("commit")
    })

    it("should cache skills after first discovery", () => {
      const skills1 = discoverSkills()
      const skills2 = discoverSkills()
      expect(skills1).toBe(skills2) // Same reference
    })
  })

  describe("loadSkill", () => {
    it("should load a specific skill by name", () => {
      const skill = loadSkill("prime")
      expect(skill).not.toBeNull()
      expect(skill!.name).toBe("prime")
      expect(skill!.content).toBeDefined()
      expect(skill!.content.length).toBeGreaterThan(100)
    })

    it("should return null for non-existent skill", () => {
      const skill = loadSkill("non-existent-skill")
      expect(skill).toBeNull()
    })
  })

  describe("loadSkills", () => {
    it("should load multiple skills", () => {
      const skills = loadSkills(["prime", "execute"])
      expect(skills.length).toBe(2)
      expect(skills[0].name).toBe("prime")
      expect(skills[1].name).toBe("execute")
    })

    it("should skip non-existent skills", () => {
      const skills = loadSkills(["prime", "non-existent", "execute"])
      expect(skills.length).toBe(2)
    })

    it("should return empty array for empty input", () => {
      const skills = loadSkills([])
      expect(skills.length).toBe(0)
    })
  })

  describe("getSkillContentForPrompt", () => {
    it("should format skills for prompt injection", () => {
      const content = getSkillContentForPrompt(["prime"])
      expect(content).toContain("SKILL: prime")
      expect(content).toContain("END SKILL: prime")
      expect(content).toContain("━━━━━━━━━━━━━━━━━━")
    })

    it("should return empty string for empty input", () => {
      const content = getSkillContentForPrompt([])
      expect(content).toBe("")
    })

    it("should return empty string for non-existent skills", () => {
      const content = getSkillContentForPrompt(["non-existent-skill"])
      expect(content).toBe("")
    })

    it("should include all skills in order", () => {
      const content = getSkillContentForPrompt(["prime", "execute"])
      const primeIndex = content.indexOf("SKILL: prime")
      const executeIndex = content.indexOf("SKILL: execute")
      expect(primeIndex).toBeLessThan(executeIndex)
    })
  })

  describe("clearSkillsCache", () => {
    it("should clear the skills cache", () => {
      const skills1 = discoverSkills()
      clearSkillsCache()
      const skills2 = discoverSkills()
      expect(skills1).not.toBe(skills2) // Different references after clear
    })
  })
})