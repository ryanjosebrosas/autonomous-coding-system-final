// ============================================================================
// CATEGORY CONFIG LOADER
// ============================================================================

import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { validateCategoriesConfig, type CategoriesConfig, type CategoryDefinition } from "./category-schema"
import { mergeCategoryConfigs } from "../shared/merge-categories"

/**
 * Paths to category configuration files.
 */
const USER_CATEGORIES_PATH = "oh-my-opencode.jsonc"

/**
 * Cached category configuration.
 */
let cachedConfig: CategoriesConfig | null = null

/**
 * Load the default categories from the embedded constant.
 * These are hardcoded in constants.ts for performance.
 */
function getDefaultCategories(): CategoriesConfig {
  return {
    categories: {
      "visual-engineering": {
        model: "gpt-5.3-codex",
        provider: "openai",
        temperature: 0.7,
        description: "Frontend, UI/UX, design, styling, animation",
        useWhen: ["UI components", "CSS/styling", "responsive design"],
        avoidWhen: ["backend logic", "database operations"],
        promptAppend: "You are a frontend specialist...",
        reasoning: "medium",
        creativity: "high",
      },
      "ultrabrain": {
        model: "gpt-5.3-codex",
        provider: "openai",
        temperature: 0.1,
        description: "Genuinely hard, logic-heavy tasks",
        useWhen: ["Complex algorithms", "Architecture decisions"],
        avoidWhen: ["Simple CRUD", "UI styling"],
        promptAppend: "You are solving a genuinely difficult problem...",
        reasoning: "xhigh",
        creativity: "low",
      },
      "artistry": {
        model: "gpt-5.3-codex",
        provider: "openai",
        temperature: 0.9,
        description: "Creative problem-solving",
        useWhen: ["Innovative solutions", "Non-standard tasks"],
        avoidWhen: ["Standard patterns available"],
        promptAppend: "You are a creative problem-solver...",
        reasoning: "high",
        creativity: "max",
      },
      "quick": {
        model: "gpt-5.3-codex",
        provider: "openai",
        temperature: 0.1,
        description: "Trivial tasks, single file changes",
        useWhen: ["Single file changes", "Typo fixes", "Simple modifications"],
        avoidWhen: ["Multi-file changes", "Architecture decisions"],
        promptAppend: "Quick task mode...",
        reasoning: "low",
        creativity: "low",
      },
      "deep": {
        model: "gpt-5.3-codex",
        provider: "openai",
        temperature: 0.3,
        description: "Goal-oriented autonomous problem-solving",
        useWhen: ["Complex debugging", "Root cause analysis"],
        avoidWhen: ["Well-defined simple tasks"],
        promptAppend: "You are on a deep investigation mission...",
        reasoning: "medium",
        creativity: "medium",
      },
      "unspecified-low": {
        model: "gpt-5.3-codex",
        provider: "openai",
        temperature: 0.3,
        description: "General tasks, low complexity",
        useWhen: ["General tasks", "Low complexity work"],
        avoidWhen: ["Visual work", "Hard logic"],
        promptAppend: "General-purpose execution...",
        reasoning: "medium",
        creativity: "low",
      },
      "unspecified-high": {
        model: "gpt-5.3-codex",
        provider: "openai",
        temperature: 0.2,
        description: "Complex tasks, high effort",
        useWhen: ["Complex general tasks", "Cross-cutting concerns"],
        avoidWhen: ["Visual work", "Genuinely hard logic"],
        promptAppend: "High-stakes general task...",
        reasoning: "high",
        creativity: "low",
      },
      "writing": {
        model: "gpt-5.3-codex",
        provider: "openai",
        temperature: 0.5,
        description: "Documentation, prose, technical writing",
        useWhen: ["Documentation", "README files", "Technical guides"],
        avoidWhen: ["Code implementation"],
        promptAppend: "You are a technical writer...",
        reasoning: "low",
        creativity: "medium",
      },
    },
    defaults: {
      fallbackCategory: "unspecified-low",
      fallbackModel: {
        provider: "openai",
        model: "gpt-5.3-codex",
      },
    },
  }
}

/**
 * Load categories from JSONC file (JSON with comments).
 * Strips comments and parses as JSON.
 */
function loadCategoriesFromJSONC(filePath: string): CategoriesConfig | null {
  try {
    if (!existsSync(filePath)) {
      return null
    }
    
    let content = readFileSync(filePath, "utf-8")
    
    // Strip single-line comments
    content = content.replace(/\/\/.*$/gm, "")
    
    // Strip multi-line comments
    content = content.replace(/\/\*[\s\S]*?\*\//g, "")
    
    const parsed = JSON.parse(content)
    const validation = validateCategoriesConfig(parsed)
    
    if (!validation) {
      console.warn(`Invalid categories config in ${filePath}`)
      return null
    }
    
    return validation
  } catch (error) {
    console.warn(`Failed to load categories from ${filePath}:`, error)
    return null
  }
}

/**
 * Load the effective category configuration.
 * Merges defaults with user overrides if present.
 */
export function loadCategories(): CategoriesConfig {
  if (cachedConfig) {
    return cachedConfig
  }
  
  const defaultConfig = getDefaultCategories()
  
  // Try to load user overrides from project root
  const userConfigPath = join(process.cwd(), USER_CATEGORIES_PATH)
  const userConfig = loadCategoriesFromJSONC(userConfigPath)
  
  if (userConfig) {
    cachedConfig = mergeCategoryConfigs(defaultConfig, userConfig)
  } else {
    cachedConfig = defaultConfig
  }
  
  return cachedConfig
}

/**
 * Get a specific category definition.
 */
export function getCategoryDefinition(name: string): CategoryDefinition | null {
  const config = loadCategories()
  return config.categories[name] || null
}

/**
 * Clear the configuration cache.
 */
export function clearCategoriesCache(): void {
  cachedConfig = null
}