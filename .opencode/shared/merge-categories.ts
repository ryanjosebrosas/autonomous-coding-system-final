// ============================================================================
// CATEGORY MERGING UTILITY
// ============================================================================

import type { CategoriesConfig, CategoryDefinition } from "../config/category-schema"

/**
 * Merge user-defined categories with default categories.
 * User categories override defaults with the same name.
 */
export function mergeCategories(
  defaultCategories: Record<string, CategoryDefinition>,
  userCategories: Record<string, CategoryDefinition>
): Record<string, CategoryDefinition> {
  const merged: Record<string, CategoryDefinition> = { ...defaultCategories }
  
  for (const [name, definition] of Object.entries(userCategories)) {
    // User categories override defaults
    if (merged[name]) {
      // Merge individual fields (user overrides specific fields)
      merged[name] = {
        ...merged[name],
        ...definition,
      }
    } else {
      // New user-defined category
      merged[name] = definition
    }
  }
  
  return merged
}

/**
 * Merge complete category configs (with defaults).
 */
export function mergeCategoryConfigs(
  defaultConfig: CategoriesConfig,
  userConfig: Partial<CategoriesConfig>
): CategoriesConfig {
  const defaultCategories = defaultConfig.categories || {}
  const userCategories = userConfig.categories || {}
  
  const mergedCategories = mergeCategories(defaultCategories, userCategories)
  
  return {
    $schema: userConfig.$schema || defaultConfig.$schema,
    categories: mergedCategories,
    defaults: {
      fallbackCategory: userConfig.defaults?.fallbackCategory || defaultConfig.defaults?.fallbackCategory || "unspecified-low",
      fallbackModel: userConfig.defaults?.fallbackModel || defaultConfig.defaults?.fallbackModel || {
        provider: "ollama",
        model: "glm-4.7",
      },
    },
  }
}

/**
 * Load user-defined categories from a config file path.
 * Returns null if file doesn't exist or is invalid.
 */
export function loadUserCategories(configPath: string): Record<string, CategoryDefinition> | null {
  try {
    const { readFileSync, existsSync } = require("node:fs")
    
    if (!existsSync(configPath)) {
      return null
    }
    
    const content = readFileSync(configPath, "utf-8")
    const config = JSON.parse(content)
    
    if (!config.categories || typeof config.categories !== "object") {
      console.warn(`Invalid categories config at ${configPath}: missing 'categories' object`)
      return null
    }
    
    return config.categories
  } catch (error) {
    console.warn(`Failed to load user categories from ${configPath}:`, error)
    return null
  }
}

/**
 * Get the effective category configuration by merging defaults with user overrides.
 */
export function getEffectiveCategories(
  defaultConfigPath: string,
  userConfigPath: string
): Record<string, CategoryDefinition> | null {
  try {
    const { readFileSync, existsSync } = require("node:fs")
    
    // Load defaults
    if (!existsSync(defaultConfigPath)) {
      console.warn(`Default categories config not found: ${defaultConfigPath}`)
      return null
    }
    
    const defaultContent = readFileSync(defaultConfigPath, "utf-8")
    const defaultConfig = JSON.parse(defaultContent)
    
    // Try to load user config
    if (!existsSync(userConfigPath)) {
      return defaultConfig.categories
    }
    
    const userContent = readFileSync(userConfigPath, "utf-8")
    const userConfig = JSON.parse(userContent)
    
    // Merge
    const merged = mergeCategoryConfigs(defaultConfig, userConfig)
    return merged.categories
  } catch (error) {
    console.warn(`Failed to get effective categories:`, error)
    return null
  }
}