// ============================================================================
// SKILL LOADER INFRASTRUCTURE
// ============================================================================

import { readFileSync, existsSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Represents a loaded skill from a SKILL.md file.
 */
export interface Skill {
  name: string
  path: string
  content: string
  description: string
  compatibility: string
}

/**
 * Cached skills by name for fast lookup.
 */
let skillsCache: Map<string, Skill> | null = null

/**
 * Get the base directory for skill files.
 */
function getSkillBasePaths(): string[] {
  const baseDir = dirname(fileURLToPath(import.meta.url))
  
  // Determine if running from .opencode/features/skill-loader/ or .opencode/
  // Try multiple possible locations for skills directory
  
  const paths = [
    // When running from .opencode/features/skill-loader/ (../../skills = .opencode/skills/)
    join(baseDir, "..", "..", "skills"),
    // When running from .opencode/ (skills/ is sibling)
    join(baseDir, "skills"),
    // When running from project root (.opencode/skills/)
    join(baseDir, ".opencode", "skills"),
    // Claude Code skills (project root/.claude/skills/)
    join(baseDir, "..", "..", "..", "..", ".claude", "skills"),
  ]
  
  // Debug: log attempted paths if no skills found
  const validPaths = paths.filter(existsSync)
  
  if (validPaths.length === 0) {
    console.warn("Skills directory not found. Attempted paths:")
    paths.forEach(p => console.warn(`  - ${p} (exists: ${existsSync(p)})`))
  }
  
  return validPaths
}

/**
 * Parse a SKILL.md file and extract metadata.
 */
function parseSkillFile(content: string, name: string, path: string): Skill {
  // Extract description (first paragraph after title)
  const lines = content.split("\n")
  let description = ""
  let compatibility = "unknown"
  
  // Look for description after first # header
  let foundTitle = false
  for (const line of lines) {
    if (line.startsWith("# ")) {
      foundTitle = true
      continue
    }
    if (foundTitle && line.trim() && !line.startsWith("#")) {
      // Stop at next section or empty content
      if (line.startsWith("##")) break
      description += line.trim() + " "
      if (description.length > 200) break
    }
  }
  
  // Extract compatibility from content
  const compatMatch = content.match(/\*\*Compatibility\*\*[:\s]*(\w+)/i)
  if (compatMatch) {
    compatibility = compatMatch[1].toLowerCase()
  }
  
  return {
    name,
    path,
    content,
    description: description.trim() || `Skill: ${name}`,
    compatibility,
  }
}

/**
 * Discover all available skills from skill directories.
 * Scans .opencode/skills/ and .claude/skills/ directories.
 */
export function discoverSkills(): Map<string, Skill> {
  if (skillsCache) {
    return skillsCache
  }
  
  const skills = new Map<string, Skill>()
  const basePaths = getSkillBasePaths()
  
  for (const skillsDir of basePaths) {
    if (!existsSync(skillsDir)) continue
    
    const entries = readdirSync(skillsDir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      
      const skillName = entry.name
      const skillFile = join(skillsDir, skillName, "SKILL.md")
      
      if (existsSync(skillFile)) {
        try {
          const content = readFileSync(skillFile, "utf-8")
          const skill = parseSkillFile(content, skillName, skillFile)
          skills.set(skillName, skill)
        } catch (error) {
          console.warn(`Failed to load skill ${skillName}:`, error)
        }
      }
    }
  }
  
  skillsCache = skills
  return skills
}

/**
 * Load a specific skill by name.
 */
export function loadSkill(name: string): Skill | null {
  const skills = discoverSkills()
  return skills.get(name) || null
}

/**
 * Load multiple skills by name.
 * Returns array of successfully loaded skills (skips failed ones).
 */
export function loadSkills(names: string[]): Skill[] {
  const skills = discoverSkills()
  const loaded: Skill[] = []
  
  for (const name of names) {
    const skill = skills.get(name)
    if (skill) {
      loaded.push(skill)
    } else {
      console.warn(`Skill not found: ${name}`)
    }
  }
  
  return loaded
}

/**
 * Get skill content for injection into prompts.
 * Formats skills as a prependable block for agent prompts.
 */
export function getSkillContentForPrompt(skillNames: string[]): string {
  if (!skillNames || skillNames.length === 0) {
    return ""
  }
  
  const skills = loadSkills(skillNames)
  if (skills.length === 0) {
    return ""
  }
  
  const sections: string[] = []
  
  for (const skill of skills) {
    sections.push(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SKILL: ${skill.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${skill.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
END SKILL: ${skill.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)
  }
  
  return sections.join("\n")
}

/**
 * Build instructions for combining category + skills.
 * Prepends skill content before category prompt.
 */
export function buildCategorySkillPrompt(
  categoryPrompt: string,
  skillNames: string[]
): string {
  const skillContent = getSkillContentForPrompt(skillNames)
  
  if (!skillContent) {
    return categoryPrompt
  }
  
  // Skills come BEFORE category prompt - they define HOW to work
  // Category prompt defines WHAT context to focus on
  return `${skillContent}

---

${categoryPrompt}`
}

/**
 * Clear the skills cache (useful for testing or hot reload).
 */
export function clearSkillsCache(): void {
  skillsCache = null
}