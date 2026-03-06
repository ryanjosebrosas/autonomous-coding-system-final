import { describe, it, expect } from "bun:test"
import {
  CATEGORY_PROMPT_APPENDS,
  CATEGORY_MODEL_ROUTES,
  validateCategorySelection,
  quickCategoryGate,
  ultrabrainCategoryGate,
  artistryCategoryGate,
  deepCategoryGate,
} from "./constants"

describe("Category Constants", () => {
  describe("CATEGORY_PROMPT_APPENDS", () => {
    it("should have prompts for all 8 categories", () => {
      const categories = [
        "visual-engineering",
        "ultrabrain",
        "artistry",
        "quick",
        "deep",
        "unspecified-low",
        "unspecified-high",
        "writing",
      ]

      for (const category of categories) {
        expect(CATEGORY_PROMPT_APPENDS[category as keyof typeof CATEGORY_PROMPT_APPENDS]).toBeDefined()
        expect(typeof CATEGORY_PROMPT_APPENDS[category as keyof typeof CATEGORY_PROMPT_APPENDS]).toBe("string")
        expect(CATEGORY_PROMPT_APPENDS[category as keyof typeof CATEGORY_PROMPT_APPENDS].length).toBeGreaterThan(50)
      }
    })

    it("should provide context-appropriate guidance for visual-engineering", () => {
      const prompt = CATEGORY_PROMPT_APPENDS["visual-engineering"]
      expect(prompt).toContain("frontend")
      expect(prompt).toContain("Accessibility")
    })

    it("should emphasize reasoning for ultrabrain", () => {
      const prompt = CATEGORY_PROMPT_APPENDS["ultrabrain"]
      expect(prompt).toContain("difficult")
      expect(prompt).toContain("reasoning")
      expect(prompt).toContain("step")
    })

    it("should encourage creativity for artistry", () => {
      const prompt = CATEGORY_PROMPT_APPENDS["artistry"]
      expect(prompt).toContain("creative")
      expect(prompt).toContain("Permission")
    })
  })

  describe("CATEGORY_MODEL_ROUTES", () => {
    it("should have routes for all 8 categories", () => {
      const categories = [
        "visual-engineering",
        "ultrabrain",
        "artistry",
        "quick",
        "deep",
        "unspecified-low",
        "unspecified-high",
        "writing",
      ]

      for (const category of categories) {
        const route = CATEGORY_MODEL_ROUTES[category]
        expect(route).toBeDefined()
        expect(route.provider).toBeDefined()
        expect(route.model).toBeDefined()
        expect(route.label).toBeDefined()
      }
    })

    it("should map visual-engineering to Gemini", () => {
      const route = CATEGORY_MODEL_ROUTES["visual-engineering"]
      expect(route.provider).toBe("ollama")
      expect(route.model).toContain("gemini")
    })

    it("should map ultrabrain to Codex", () => {
      const route = CATEGORY_MODEL_ROUTES["ultrabrain"]
      expect(route.provider).toBe("openai")
      expect(route.model).toContain("codex")
    })

    it("should map quick to GLM-4.7", () => {
      const route = CATEGORY_MODEL_ROUTES["quick"]
      expect(route.provider).toBe("ollama")
      expect(route.model).toContain("glm")
    })
  })
})

describe("Category Selection Gates", () => {
  describe("quickCategoryGate", () => {
    it("should reject complex tasks", () => {
      const result = quickCategoryGate("Implement the authentication architecture for the system")
      expect(result.valid).toBe(false)
      expect(result.reason).toContain("complex")
      expect(result.suggestion).toBeDefined()
    })

    it("should accept simple tasks", () => {
      const result = quickCategoryGate("Fix typo in README")
      expect(result.valid).toBe(true)
    })

    it("should accept single file changes", () => {
      const result = quickCategoryGate("Update the version number in package.json")
      expect(result.valid).toBe(true)
    })

    it("should reject security-related tasks", () => {
      const result = quickCategoryGate("Add encryption to password storage")
      expect(result.valid).toBe(false)
    })
  })

  describe("ultrabrainCategoryGate", () => {
    it("should accept complex algorithm tasks", () => {
      const result = ultrabrainCategoryGate("Design a distributed consensus algorithm")
      expect(result.valid).toBe(true)
    })

    it("should accept architecture tasks", () => {
      const result = ultrabrainCategoryGate("Design the system architecture for scalability")
      expect(result.valid).toBe(true)
    })

    it("should reject simple tasks", () => {
      const result = ultrabrainCategoryGate("Fix typo in README")
      expect(result.valid).toBe(false)
      expect(result.suggestion).toBeDefined()
    })

    it("should reject UI tasks", () => {
      const result = ultrabrainCategoryGate("Style the button component")
      expect(result.valid).toBe(false)
    })
  })

  describe("artistryCategoryGate", () => {
    it("should always be valid", () => {
      const result = artistryCategoryGate("Any task description")
      expect(result.valid).toBe(true)
    })

    it("should warn for conventional tasks", () => {
      const result = artistryCategoryGate("Add a simple button")
      expect(result.valid).toBe(true)
      expect(result.reason).toContain("conventional")
    })

    it("should not warn for creative tasks", () => {
      const result = artistryCategoryGate("Design an innovative creative solution")
      expect(result.valid).toBe(true)
      expect(result.reason).toBeUndefined()
    })
  })

  describe("deepCategoryGate", () => {
    it("should accept research tasks", () => {
      const result = deepCategoryGate("Investigate why the database is slow")
      expect(result.valid).toBe(true)
    })

    it("should accept debug tasks", () => {
      const result = deepCategoryGate("Trace the null pointer exception")
      expect(result.valid).toBe(true)
    })

    it("should warn for simple tasks (still valid)", () => {
      const result = deepCategoryGate("Add a simple function")
      expect(result.valid).toBe(true)
      expect(result.reason).toBeDefined()
    })
  })

  describe("validateCategorySelection", () => {
    it("should validate quick with simple task", () => {
      const result = validateCategorySelection("quick", "Fix typo in README.md")
      expect(result.valid).toBe(true)
    })

    it("should reject quick with complex task", () => {
      const result = validateCategorySelection("quick", "Implement complex security architecture")
      expect(result.valid).toBe(false)
    })

    it("should validate ultrabrain with hard task", () => {
      const result = validateCategorySelection("ultrabrain", "Design distributed system architecture")
      expect(result.valid).toBe(true)
    })

    it("should reject ultrabrain with simple task", () => {
      const result = validateCategorySelection("ultrabrain", "Fix typo")
      expect(result.valid).toBe(false)
    })

    it("should always accept other categories", () => {
      const categories = ["visual-engineering", "artistry", "deep", "unspecified-low", "unspecified-high", "writing"]
      for (const category of categories) {
        const result = validateCategorySelection(category, "Some task")
        expect(result.valid).toBe(true)
      }
    })
  })
})