/**
 * Category Skill Reminder Hook
 * 
 * Reminds orchestrator agents to use category + skill delegation
 * when they start doing work manually that could be delegated.
 */

export { createCategorySkillReminderHook } from "./hook"
export type { AvailableSkill } from "../../agents/dynamic-prompt-builder"