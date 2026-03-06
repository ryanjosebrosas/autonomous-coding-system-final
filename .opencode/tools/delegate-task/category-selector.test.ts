import { describe, it, expect } from "bun:test"
import {
  resolveCategory,
  isValidCategory,
  getAvailableCategories,
  getCategoryMetadata,
  type CategoryRouteResult,
} from "./category-selector"
import { CATEGORY_MODEL_ROUTES } from "./constants"

describe("Category Selector", () => {
  describe("resolveCategory", () => {
    it("should resolve visual-engineering to Gemini 3 Pro", () => {
      const result = resolveCategory("visual-engineering")
      expect(result).not.toBeNull()
      expect(result!.category).toBe("visual-engineering")
      expect(result!.provider).toBe("ollama-cloud")
      expect(result!.model).toContain("gemini")
      expect(result!.source).toBe("category")
    })

    it("should resolve ultrabrain to GPT Codex", () => {
      const result = resolveCategory("ultrabrain")
      expect(result).not.toBeNull()
      expect(result!.category).toBe("ultrabrain")
      expect(result!.provider).toBe("openai")
      expect(result!.model).toContain("codex")
    })

    it("should resolve quick to GLM-4.7", () => {
      const result = resolveCategory("quick")
      expect(result).not.toBeNull()
      expect(result!.category).toBe("quick")
      expect(result!.provider).toBe("ollama")
      expect(result!.model).toContain("glm")
    })

    it("should return fallback for unknown category", () => {
      const result = resolveCategory("unknown-category")
      expect(result).not.toBeNull()
      expect(result!.category).toBe("fallback")
      expect(result!.source).toBe("fallback")
    })

    it("should include gate warning for invalid selection", () => {
      const result = resolveCategory("quick", {
        taskDescription: "Implement complex security architecture",
      })
      expect(result).not.toBeNull()
      expect(result!.gateWarning).toBeDefined()
      expect(result!.gateWarning).toContain("complex")
    })

    it("should not include warning when warnOnInvalid is false", () => {
      const result = resolveCategory("quick", {
        taskDescription: "Implement complex security architecture",
        warnOnInvalid: false,
      })
      expect(result).not.toBeNull()
      // Warning should still be present but not logged
      expect(result!.category).toBe("quick")
    })

    it("should use fallback when useFallbackOnInvalid is true and task is invalid", () => {
      const result = resolveCategory("quick", {
        taskDescription: "Implement complex security architecture",
        useFallbackOnInvalid: true,
      })
      expect(result).not.toBeNull()
      expect(result!.category).toBe("quick")
      expect(result!.gateWarning).toBeDefined()
    })
  })

  describe("isValidCategory", () => {
    it("should return true for valid categories", () => {
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
        expect(isValidCategory(category)).toBe(true)
      }
    })

    it("should return false for invalid categories", () => {
      expect(isValidCategory("unknown")).toBe(false)
      expect(isValidCategory("frontend")).toBe(false)
      expect(isValidCategory("backend")).toBe(false)
      expect(isValidCategory("")).toBe(false)
    })
  })

  describe("getAvailableCategories", () => {
    it("should return all 8 categories", () => {
      const categories = getAvailableCategories()
      expect(categories.length).toBe(8)
      expect(categories).toContain("visual-engineering")
      expect(categories).toContain("ultrabrain")
      expect(categories).toContain("artistry")
      expect(categories).toContain("quick")
      expect(categories).toContain("deep")
      expect(categories).toContain("unspecified-low")
      expect(categories).toContain("unspecified-high")
      expect(categories).toContain("writing")
    })
  })

  describe("getCategoryMetadata", () => {
    it("should return metadata for valid category", () => {
      const metadata = getCategoryMetadata("visual-engineering")
      expect(metadata).not.toBeNull()
      expect(metadata!.provider).toBe("ollama-cloud")
      expect(metadata!.model).toContain("gemini")
      expect(metadata!.label).toBeDefined()
    })

    it("should return null for invalid category", () => {
      const metadata = getCategoryMetadata("unknown-category")
      expect(metadata).toBeNull()
    })
  })
})