// ============================================================================
// CATEGORY + SKILLS DELEGATION GUIDE
// ============================================================================

import { CATEGORY_MODEL_ROUTES, CATEGORY_PROMPT_APPENDS, type CategoryPromptAppendKey } from "../../tools/delegate-task/constants"
import { getSkillContentForPrompt, loadSkills, type Skill } from "../../features/skill-loader/index"

/**
 * Recommended skill combinations for each category.
 * Maps category → suggested skills to load for optimal results.
 */
export const CATEGORY_SKILL_RECOMMENDATIONS: Record<string, string[]> = {
  "visual-engineering": ["frontend-ui-ux", "playwright"],
  "ultrabrain": ["council"],
  "artistry": ["council"],
  "quick": ["git-master"],
  "deep": ["code-review"],
  "unspecified-low": ["git-master"],
  "unspecified-high": ["code-review"],
  "writing": ["planning-methodology"],
}

/**
 * Build the complete delegation prompt for a category + skills combination.
 * 
 * Structure:
 * 1. Skill content (prepended)
 * 2. Category prompt append
 * 
 * This order ensures skills define HOW to work, category defines context focus.
 */
export function buildCategorySkillsDelegationGuide(
  category: CategoryPromptAppendKey | string,
  skillNames: string[] = []
): {
  prompt: string
  model: { provider: string; model: string; label: string }
  skills: Skill[]
  warnings: string[]
} {
  const warnings: string[] = []
  
  // Resolve category
  const categoryRoute = CATEGORY_MODEL_ROUTES[category]
  if (!categoryRoute) {
    warnings.push(`Unknown category: ${category}. Using unspecified-low fallback.`)
  }
  
  const model = categoryRoute || {
    provider: "ollama",
    model: "qwen3-coder-next:cloud",
    label: "QWEN3-CODER-NEXT"
  }
  
  // Get category prompt
  const categoryPrompt = CATEGORY_PROMPT_APPENDS[category as CategoryPromptAppendKey] || ""
  
  // Load skills
  const skills = skillNames.length > 0 ? loadSkills(skillNames) : []
  
  // Check for missing skills
  const availableSkillNames = skills.map(s => s.name)
  for (const requested of skillNames) {
    if (!availableSkillNames.includes(requested)) {
      warnings.push(`Skill not found: ${requested}`)
    }
  }
  
  // Build prompt: skills first, then category
  const skillContent = getSkillContentForPrompt(skillNames)
  
  let prompt = ""
  if (skillContent) {
    prompt = skillContent + "\n\n---\n\n"
  }
  if (categoryPrompt) {
    prompt += categoryPrompt
  }
  
  return {
    prompt,
    model,
    skills,
    warnings,
  }
}

/**
 * Get recommended skills for a category.
 * Returns copy to prevent modification.
 */
export function getRecommendedSkillsForCategory(category: string): string[] {
  const recommended = CATEGORY_SKILL_RECOMMENDATIONS[category]
  return recommended ? [...recommended] : []
}

/**
 * Validate that a skill combination is appropriate for a category.
 * Returns warnings for mismatched skill/category combinations.
 */
export function validateCategorySkillCombination(
  category: string,
  skillNames: string[]
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []
  
  // Quick category with complex skill
  if (category === "quick") {
    const complexSkills = ["council", "planning-methodology", "prd"]
    for (const skill of skillNames) {
      if (complexSkills.includes(skill)) {
        warnings.push(
          `Complex skill '${skill}' may not be appropriate for quick category. ` +
          `Consider using 'deep' or 'unspecified-high' instead.`
        )
      }
    }
  }
  
  // Ultrabrain without complex skill warning (actually fine - ultrabrain IS complex)
  // Visual-engineering without UI skills
  if (category === "visual-engineering") {
    const uiskills = ["frontend-ui-ux", "playwright", "dev-browser"]
    const hasUISkill = skillNames.some(s => uiskills.includes(s))
    if (skillNames.length > 0 && !hasUISkill) {
      warnings.push(
        `Visual-engineering category used without UI-related skills. ` +
        `Consider adding: ${uiskills.join(", ")}`
      )
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  }
}