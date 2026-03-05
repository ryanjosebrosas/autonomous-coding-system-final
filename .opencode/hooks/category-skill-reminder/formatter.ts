/**
 * Build the reminder message for category + skill delegation.
 */

import type { AvailableSkill } from "../../agents/dynamic-prompt-builder"

/**
 * Build the reminder message shown to orchestrator agents.
 */
export function buildReminderMessage(availableSkills: AvailableSkill[]): string {
  const skillCategories = groupSkillsByCategory(availableSkills)
  
  let message = "\n\n## <system-reminder>\n"
  message += "**Category + Skill Delegation Reminder**\n\n"
  message += "You've made several tool calls without using delegation. Consider using `task()` with category and skills for specialized work:\n\n"
  
  if (skillCategories.size > 0) {
    message += "**Available Categories:**\n"
    for (const [category, skills] of skillCategories.entries()) {
      const skillNames = skills.map(s => s.name).join(", ")
      message += `- **${category}**: ${skillNames}\n`
    }
    message += "\n"
  }
  
  message += "**Example:**\n"
  message += "```typescript\n"
  message += "task(\n"
  message += "  category=\"visual-engineering\",\n"
  message += "  load_skills=[\"frontend-ui-ux\"],\n"
  message += "  prompt=\"Implement the login form with proper validation\"\n"
  message += ")\n"
  message += "```\n\n"
  message += "ALWAYS prefer: Multiple parallel task calls > Direct tool calls\n"
  message += "</system-reminder>\n"
  
  return message
}

/**
 * Group skills by their category.
 */
function groupSkillsByCategory(skills: AvailableSkill[]): Map<string, AvailableSkill[]> {
  const grouped = new Map<string, AvailableSkill[]>()
  
  for (const skill of skills) {
    // Extract category from skill (skills usually have format "category/skill-name")
    const parts = skill.name.split("/")
    const category = parts.length > 1 ? parts[0] : "general"
    
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(skill)
  }
  
  return grouped
}