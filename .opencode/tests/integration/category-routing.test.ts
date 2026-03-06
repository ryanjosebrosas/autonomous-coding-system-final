/**
 * Category Routing Integration Tests
 * 
 * Tests verify:
 * - Category name → model/provider resolution
 * - Selection gate validation
 * - Prompt append content
 * - Full routing flow
 */

import { describe, it, expect } from "bun:test"
import { 
  resolveCategory, 
  isValidCategory, 
  getAvailableCategories,
  getCategoryPromptAppend 
} from "../../tools/delegate-task/category-selector"
import { 
  validateCategorySelection,
  quickCategoryGate,
  ultrabrainCategoryGate,
  artistryCategoryGate,
  deepCategoryGate,
  CATEGORY_MODEL_ROUTES,
  CATEGORY_PROMPT_APPENDS
} from "../../tools/delegate-task/constants"

// ============================================================
// CATEGORY RESOLUTION TESTS
// ============================================================

describe("Category Routing Integration", () => {
  describe("Category Resolution", () => {
    describe("resolveCategory", () => {
      // ============================================================
      // VALID CATEGORY TESTS
      // ============================================================
      
      describe("when category is valid", () => {
        it("should resolve visual-engineering to Gemini 3 Flash", () => {
          const result = resolveCategory("visual-engineering")
          expect(result).not.toBeNull()
          expect(result!.category).toBe("visual-engineering")
          expect(result!.provider).toBe("ollama")
          expect(result!.model).toBe("gemini-3-flash-preview:latest")
          expect(result!.label).toBe("GEMINI-3-FLASH")
          expect(result!.source).toBe("category")
        })

        it("should resolve ultrabrain to GPT-5.3 Codex", () => {
          const result = resolveCategory("ultrabrain")
          expect(result).not.toBeNull()
          expect(result!.category).toBe("ultrabrain")
          expect(result!.provider).toBe("openai")
          expect(result!.model).toBe("gpt-5.3-codex")
          expect(result!.label).toBe("GPT-5.3-CODEX")
        })

        it("should resolve artistry to Gemini 3 Flash", () => {
          const result = resolveCategory("artistry")
          expect(result).not.toBeNull()
          expect(result!.provider).toBe("ollama")
          expect(result!.model).toBe("gemini-3-flash-preview:latest")
        })

        it("should resolve quick to GLM-4.7", () => {
          const result = resolveCategory("quick")
          expect(result).not.toBeNull()
          expect(result!.category).toBe("quick")
          expect(result!.provider).toBe("ollama")
          expect(result!.model).toBe("glm-4.7:cloud")
          expect(result!.label).toBe("GLM-4.7")
        })

        it("should resolve deep to Qwen3 Coder Next", () => {
          const result = resolveCategory("deep")
          expect(result).not.toBeNull()
          expect(result!.provider).toBe("ollama")
          expect(result!.model).toBe("qwen3-coder-next:cloud")
        })

        it("should resolve unspecified-low to Qwen3 Coder Next", () => {
          const result = resolveCategory("unspecified-low")
          expect(result).not.toBeNull()
          expect(result!.provider).toBe("ollama")
          expect(result!.model).toBe("qwen3-coder-next:cloud")
        })

        it("should resolve unspecified-high to DeepSeek V3.1", () => {
          const result = resolveCategory("unspecified-high")
          expect(result).not.toBeNull()
          expect(result!.provider).toBe("ollama")
          expect(result!.model).toBe("deepseek-v3.1:671b-cloud")
        })

        it("should resolve writing to Kimi K2.5", () => {
          const result = resolveCategory("writing")
          expect(result).not.toBeNull()
          expect(result!.provider).toBe("ollama")
          expect(result!.model).toBe("kimi-k2.5:cloud")
        })
      })

      // ============================================================
      // INVALID CATEGORY TESTS
      // ============================================================

      describe("when category is invalid", () => {
        it("should return fallback for unknown category", () => {
          const result = resolveCategory("nonexistent")
          expect(result).not.toBeNull()
          expect(result!.category).toBe("fallback")
          expect(result!.source).toBe("fallback")
        })

        it("should return fallback for empty string", () => {
          const result = resolveCategory("")
          expect(result).not.toBeNull()
          expect(result!.source).toBe("fallback")
        })

        it("should return fallback for fake category", () => {
          const result = resolveCategory("fake-category")
          expect(result).not.toBeNull()
          expect(result!.source).toBe("fallback")
        })

        it("should be case-sensitive", () => {
          expect(resolveCategory("QUICK")!.source).toBe("fallback")
          expect(resolveCategory("UltraBrain")!.source).toBe("fallback")
          expect(resolveCategory("VISUAL-ENGINEERING")!.source).toBe("fallback")
        })
      })
    })

    // ============================================================
    // VALIDATION TESTS
    // ============================================================

    describe("isValidCategory", () => {
      it("should return true for all 8 valid categories", () => {
        expect(isValidCategory("visual-engineering")).toBe(true)
        expect(isValidCategory("ultrabrain")).toBe(true)
        expect(isValidCategory("artistry")).toBe(true)
        expect(isValidCategory("quick")).toBe(true)
        expect(isValidCategory("deep")).toBe(true)
        expect(isValidCategory("unspecified-low")).toBe(true)
        expect(isValidCategory("unspecified-high")).toBe(true)
        expect(isValidCategory("writing")).toBe(true)
      })

      it("should return false for invalid categories", () => {
        expect(isValidCategory("invalid")).toBe(false)
        expect(isValidCategory("")).toBe(false)
        expect(isValidCategory("frontend")).toBe(false)
        expect(isValidCategory("backend")).toBe(false)
      })
    })

    // ============================================================
    // TABLE-DRIVEN TESTS FOR ALL MODEL ROUTES
    // ============================================================

    describe("All category model routes", () => {
      const categoryRoutes = [
        { category: "visual-engineering", expectedProvider: "ollama", expectedModel: "gemini-3-flash-preview:latest", expectedLabel: "GEMINI-3-FLASH" },
        { category: "ultrabrain", expectedProvider: "openai", expectedModel: "gpt-5.3-codex", expectedLabel: "GPT-5.3-CODEX" },
        { category: "artistry", expectedProvider: "ollama", expectedModel: "gemini-3-flash-preview:latest", expectedLabel: "GEMINI-3-FLASH" },
        { category: "quick", expectedProvider: "ollama", expectedModel: "glm-4.7:cloud", expectedLabel: "GLM-4.7" },
        { category: "deep", expectedProvider: "ollama", expectedModel: "qwen3-coder-next:cloud", expectedLabel: "QWEN3-CODER-NEXT" },
        { category: "unspecified-low", expectedProvider: "ollama", expectedModel: "qwen3-coder-next:cloud", expectedLabel: "QWEN3-CODER-NEXT" },
        { category: "unspecified-high", expectedProvider: "ollama", expectedModel: "deepseek-v3.1:671b-cloud", expectedLabel: "DEEPSEEK-V3.1" },
        { category: "writing", expectedProvider: "ollama", expectedModel: "kimi-k2.5:cloud", expectedLabel: "KIMI-K2.5" },
      ]

      for (const { category, expectedProvider, expectedModel, expectedLabel } of categoryRoutes) {
        it(`should route ${category} to ${expectedModel} via ${expectedProvider}`, () => {
          const result = resolveCategory(category)
          expect(result).not.toBeNull()
          expect(result!.category).toBe(category)
          expect(result!.provider).toBe(expectedProvider)
          expect(result!.model).toBe(expectedModel)
          expect(result!.label).toBe(expectedLabel)
        })
      }
    })
  })

  // ============================================================
  // AVAILABILITY TESTS
  // ============================================================

  describe("Category Availability", () => {
    describe("getAvailableCategories", () => {
      it("should return exactly 8 categories", () => {
        const categories = getAvailableCategories()
        expect(categories.length).toBe(8)
      })

      it("should include all expected categories", () => {
        const categories = getAvailableCategories()
        expect(categories).toContain("visual-engineering")
        expect(categories).toContain("ultrabrain")
        expect(categories).toContain("artistry")
        expect(categories).toContain("quick")
        expect(categories).toContain("deep")
        expect(categories).toContain("unspecified-low")
        expect(categories).toContain("unspecified-high")
        expect(categories).toContain("writing")
      })

      it("should match CATEGORY_MODEL_ROUTES keys", () => {
        const categories = getAvailableCategories()
        const routesKeys = Object.keys(CATEGORY_MODEL_ROUTES)
        expect(categories.sort()).toEqual(routesKeys.sort())
      })
    })
  })

  // ============================================================
  // PROMPT APPEND TESTS
  // ============================================================

  describe("Category Prompt Appends", () => {
    describe("getCategoryPromptAppend", () => {
      describe("visual-engineering", () => {
        it("should contain frontend specialist guidance", () => {
          const append = getCategoryPromptAppend("visual-engineering")
          expect(append).toContain("frontend specialist")
          expect(append).toContain("visual excellence")
        })

        it("should contain accessibility mention", () => {
          const append = getCategoryPromptAppend("visual-engineering")
          expect(append).toContain("Accessibility")
          expect(append).toContain("WCAG")
        })

        it("should contain pixel-perfect implementation guidance", () => {
          const append = getCategoryPromptAppend("visual-engineering")
          expect(append).toContain("Pixel-perfect")
          expect(append).toContain("Responsive design")
        })
      })

      describe("ultrabrain", () => {
        it("should contain difficult problem context", () => {
          const append = getCategoryPromptAppend("ultrabrain")
          expect(append).toContain("difficult problem")
          expect(append).toContain("exceptional reasoning")
        })

        it("should contain step-by-step approach", () => {
          const append = getCategoryPromptAppend("ultrabrain")
          expect(append).toContain("step by step")
          expect(append).toContain("Quality over speed")
        })

        it("should contain systematic approach requirements", () => {
          const append = getCategoryPromptAppend("ultrabrain")
          expect(append).toContain("Break down")
          expect(append).toContain("edge cases")
          expect(append).toContain("tradeoffs")
        })
      })

      describe("artistry", () => {
        it("should contain creative problem-solving context", () => {
          const append = getCategoryPromptAppend("artistry")
          expect(append).toContain("creative")
          expect(append).toContain("unconventional")
        })

        it("should give permission to explore", () => {
          const append = getCategoryPromptAppend("artistry")
          expect(append).toContain("Permission to")
          expect(append).toContain("Challenge assumptions")
        })

        it("should discourage standard solutions", () => {
          const append = getCategoryPromptAppend("artistry")
          expect(append).toContain("Standard solutions discouraged")
        })
      })

      describe("quick", () => {
        it("should emphasize speed and minimalism", () => {
          const append = getCategoryPromptAppend("quick")
          expect(append).toContain("Speed")
          expect(append).toContain("Minimal changes")
          expect(append).toContain("No over-engineering")
        })

        it("should contain get in get out metaphor", () => {
          const append = getCategoryPromptAppend("quick")
          expect(append).toContain("Get in, make the change, get out")
        })
      })

      describe("deep", () => {
        it("should emphasize investigation", () => {
          const append = getCategoryPromptAppend("deep")
          expect(append).toContain("investigation mission")
          expect(append).toContain("Research thoroughly")
        })

        it("should require evidence", () => {
          const append = getCategoryPromptAppend("deep")
          expect(append).toContain("Verify findings")
          expect(append).toContain("evidence")
        })

        it("should mention tool usage", () => {
          const append = getCategoryPromptAppend("deep")
          expect(append).toContain("grep, read, search")
        })
      })

      describe("unspecified-low", () => {
        it("should emphasize clear implementation", () => {
          const append = getCategoryPromptAppend("unspecified-low")
          expect(append).toContain("Clear implementation")
          expect(append).toContain("existing patterns")
        })

        it("should mention proper error handling", () => {
          const append = getCategoryPromptAppend("unspecified-low")
          expect(append).toContain("error handling")
        })
      })

      describe("unspecified-high", () => {
        it("should emphasize thoroughness", () => {
          const append = getCategoryPromptAppend("unspecified-high")
          expect(append).toContain("Thoroughness")
          expect(append).toContain("Correctness")
        })

        it("should mention edge cases", () => {
          const append = getCategoryPromptAppend("unspecified-high")
          expect(append).toContain("Edge case handling")
        })

        it("should emphasize documentation", () => {
          const append = getCategoryPromptAppend("unspecified-high")
          expect(append).toContain("documentation")
        })
      })

      describe("writing", () => {
        it("should identify as technical writer", () => {
          const append = getCategoryPromptAppend("writing")
          expect(append).toContain("technical writer")
        })

        it("should emphasize clarity", () => {
          const append = getCategoryPromptAppend("writing")
          expect(append).toContain("Clarity")
          expect(append).toContain("readability")
        })

        it("should mention audience-appropriate language", () => {
          const append = getCategoryPromptAppend("writing")
          expect(append).toContain("Audience-appropriate")
        })
      })

      describe("invalid category", () => {
        it("should return empty string for unknown category", () => {
          const append = getCategoryPromptAppend("nonexistent")
          expect(append).toBe("")
        })

        it("should return empty string for empty string", () => {
          const append = getCategoryPromptAppend("")
          expect(append).toBe("")
        })
      })
    })

    describe("All categories have substantial prompts", () => {
      const categories = getAvailableCategories()

      for (const category of categories) {
        it(`should have prompt append with minimum 50 characters for ${category}`, () => {
          const append = getCategoryPromptAppend(category)
          expect(append.length).toBeGreaterThan(50)
        })
      }
    })
  })

  // ============================================================
  // SELECTION GATE TESTS
  // ============================================================

  describe("Selection Gates", () => {
    describe("quickCategoryGate", () => {
      describe("rejection cases", () => {
        it("should reject architecture tasks", () => {
          const result = quickCategoryGate("refactor the architecture for better scalability")
          expect(result.valid).toBe(false)
          expect(result.reason).toContain("complex")
          expect(result.suggestion).toContain("deep")
        })

        it("should reject security-related tasks", () => {
          const result = quickCategoryGate("implement security authentication")
          expect(result.valid).toBe(false)
        })

        it("should reject database migration tasks", () => {
          const result = quickCategoryGate("create database migration for users table")
          expect(result.valid).toBe(false)
        })

        it("should reject performance optimization tasks", () => {
          const result = quickCategoryGate("optimize performance of the API")
          expect(result.valid).toBe(false)
        })

        it("should reject multi-file refactoring", () => {
          const result = quickCategoryGate("refactor multiple files for consistency")
          expect(result.valid).toBe(false)
        })

        it("should reject feature implementation", () => {
          const result = quickCategoryGate("implement feature for user dashboard")
          expect(result.valid).toBe(false)
        })

        it("should reject complex keyword: design", () => {
          const result = quickCategoryGate("design new component library")
          expect(result.valid).toBe(false)
        })

        it("should reject complex keyword: encryption", () => {
          const result = quickCategoryGate("add encryption to sensitive data")
          expect(result.valid).toBe(false)
        })

        it("should reject complex keyword: algorithm", () => {
          const result = quickCategoryGate("fix algorithm complexity issue")
          expect(result.valid).toBe(false)
        })
      })

      describe("acceptance cases", () => {
        it("should accept typo fixes", () => {
          const result = quickCategoryGate("fix a typo in the README")
          expect(result.valid).toBe(true)
        })

        it("should accept simple variable renames", () => {
          const result = quickCategoryGate("rename variable xyz to abc")
          expect(result.valid).toBe(true)
        })

        it("should accept comment fixes", () => {
          const result = quickCategoryGate("update comment in utils.ts")
          expect(result.valid).toBe(true)
        })

        it("should accept log statement additions", () => {
          const result = quickCategoryGate("add logging statement for debug")
          expect(result.valid).toBe(true)
        })

        it("should accept simple configuration changes", () => {
          const result = quickCategoryGate("change timeout from 30 to 60 seconds")
          expect(result.valid).toBe(true)
        })
      })
    })

    describe("ultrabrainCategoryGate", () => {
      describe("acceptance cases (genuinely hard)", () => {
        it("should accept algorithm tasks", () => {
          const result = ultrabrainCategoryGate("optimize sorting algorithm for large datasets")
          expect(result.valid).toBe(true)
        })

        it("should accept architecture design tasks", () => {
          const result = ultrabrainCategoryGate("design distributed system architecture")
          expect(result.valid).toBe(true)
        })

        it("should accept compiler-related tasks", () => {
          const result = ultrabrainCategoryGate("implement compiler optimization pass")
          expect(result.valid).toBe(true)
        })

        it("should accept security encryption tasks", () => {
          const result = ultrabrainCategoryGate("design secure encryption protocol")
          expect(result.valid).toBe(true)
        })

        it("should accept complex reasoning tasks", () => {
          const result = ultrabrainCategoryGate("complex reasoning for constraint satisfaction")
          expect(result.valid).toBe(true)
        })

        it("should accept design system tasks", () => {
          const result = ultrabrainCategoryGate("create extensible design system architecture")
          expect(result.valid).toBe(true)
        })

        it("should accept pattern recognition tasks", () => {
          const result = ultrabrainCategoryGate("implement pattern recognition for anomaly detection")
          expect(result.valid).toBe(true)
        })
      })

      describe("rejection cases (simple tasks)", () => {
        it("should reject simple typo fixes", () => {
          const result = ultrabrainCategoryGate("fix a typo in the code")
          expect(result.valid).toBe(false)
        })

        it("should reject simple styling tasks", () => {
          const result = ultrabrainCategoryGate("change button color to blue")
          expect(result.valid).toBe(false)
        })

        it("should reject simple text changes", () => {
          const result = ultrabrainCategoryGate("update text content")
          expect(result.valid).toBe(false)
        })
      })
    })

    describe("artistryCategoryGate", () => {
      describe("creative task acceptance", () => {
        it("should accept creative tasks", () => {
          const result = artistryCategoryGate("implement creative solution for UX")
          expect(result.valid).toBe(true)
        })

        it("should accept innovative tasks", () => {
          const result = artistryCategoryGate("design innovative approach to data visualization")
          expect(result.valid).toBe(true)
        })

        it("should accept unconventional tasks", () => {
          const result = artistryCategoryGate("use unconventional pattern for this problem")
          expect(result.valid).toBe(true)
        })

        it("should accept novel tasks", () => {
          const result = artistryCategoryGate("implement novel caching strategy")
          expect(result.valid).toBe(true)
        })
      })

      describe("conventional task warnings", () => {
        it("should warn for conventional tasks", () => {
          const result = artistryCategoryGate("implement standard CRUD operations")
          expect(result.valid).toBe(true) // Still valid, but with warning
          expect(result.reason).toContain("conventional")
        })

        it("should warn but accept routine tasks", () => {
          const result = artistryCategoryGate("update configuration file")
          expect(result.valid).toBe(true)
          expect(result.reason).toBeDefined()
        })
      })
    })

    describe("deepCategoryGate", () => {
      describe("research task acceptance", () => {
        it("should accept investigate tasks", () => {
          const result = deepCategoryGate("investigate the memory leak issue")
          expect(result.valid).toBe(true)
        })

        it("should accept research tasks", () => {
          const result = deepCategoryGate("research best practices for caching")
          expect(result.valid).toBe(true)
        })

        it("should accept explore tasks", () => {
          const result = deepCategoryGate("explore the codebase for unused dependencies")
          expect(result.valid).toBe(true)
        })

        it("should accept analyze tasks", () => {
          const result = deepCategoryGate("analyze the performance bottleneck")
          expect(result.valid).toBe(true)
        })

        it("should accept debug tasks", () => {
          const result = deepCategoryGate("debug the connection timeout issue")
          expect(result.valid).toBe(true)
        })

        it("should accept understand tasks", () => {
          const result = deepCategoryGate("understand how the auth flow works")
          expect(result.valid).toBe(true)
        })
      })

      describe("non-research task warnings", () => {
        it("should warn for simple implementation tasks", () => {
          const result = deepCategoryGate("implement a button component")
          expect(result.valid).toBe(true) // Still valid, but with warning
          expect(result.reason).toBeDefined()
        })
      })
    })

    describe("validateCategorySelection", () => {
      it("should route quick tasks to quickCategoryGate", () => {
        const result = validateCategorySelection("quick", "refactor architecture")
        expect(result.valid).toBe(false)
      })

      it("should route ultrabrain tasks to ultrabrainCategoryGate", () => {
        const result = validateCategorySelection("ultrabrain", "simple fix")
        expect(result.valid).toBe(false)
      })

      it("should route artistry tasks to artistryCategoryGate", () => {
        const result = validateCategorySelection("artistry", "creative design")
        expect(result.valid).toBe(true)
      })

      it("should route deep tasks to deepCategoryGate", () => {
        const result = validateCategorySelection("deep", "investigate issue")
        expect(result.valid).toBe(true)
      })

      it("should pass through for other categories", () => {
        const result = validateCategorySelection("visual-engineering", "build UI")
        expect(result.valid).toBe(true)
      })

      it("should pass through for writing category", () => {
        const result = validateCategorySelection("writing", "write documentation")
        expect(result.valid).toBe(true)
      })
    })
  })

  // ============================================================
  // CATEGORY CONSTANTS INTEGRITY TESTS
  // ============================================================

  describe("Category Constants Integrity", () => {
    it("should have matching keys between CATEGORY_MODEL_ROUTES and CATEGORY_PROMPT_APPENDS", () => {
      const routeKeys = Object.keys(CATEGORY_MODEL_ROUTES).sort()
      const appendKeys = Object.keys(CATEGORY_PROMPT_APPENDS).sort()
      expect(routeKeys).toEqual(appendKeys)
    })

    it("should have 8 categories defined", () => {
      expect(Object.keys(CATEGORY_MODEL_ROUTES).length).toBe(8)
      expect(Object.keys(CATEGORY_PROMPT_APPENDS).length).toBe(8)
    })

    it("should have non-empty model for each category", () => {
      for (const [category, route] of Object.entries(CATEGORY_MODEL_ROUTES)) {
        expect(route.model).toBeTruthy()
        expect(route.model.length).toBeGreaterThan(0)
      }
    })

    it("should have non-empty provider for each category", () => {
      for (const [category, route] of Object.entries(CATEGORY_MODEL_ROUTES)) {
        expect(route.provider).toBeTruthy()
        expect(route.provider.length).toBeGreaterThan(0)
      }
    })

    it("should have non-empty label for each category", () => {
      for (const [category, route] of Object.entries(CATEGORY_MODEL_ROUTES)) {
        expect(route.label).toBeTruthy()
        expect(route.label.length).toBeGreaterThan(0)
      }
    })
  })
})