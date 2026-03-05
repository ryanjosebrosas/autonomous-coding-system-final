/**
 * OpenCode Hooks - Main Export
 * 
 * Exports all hook implementations organized by tier.
 * Hooks are grouped into 5 tiers based on execution priority:
 * 
 * 1. Continuation - Run first to enforce completion guarantees
 * 2. Session - Session lifecycle management
 * 3. Tool-Guard - Pre/post tool execution
 * 4. Transform - Message transformation
 * 5. Skill - Skill-specific hooks
 */

// ============================================================================
// BASE TYPES
// ============================================================================

export type { HookName, HookTier, HookConfig, HookContext, HookResult, HookEventType, HookHandler, HookDefinition, HookRegistry } from "./base"
export { HOOK_TIER_ORDER, getHookTierOrder, createHookRegistry } from "./base"

// ============================================================================
// CONTINUATION TIER (Priority 1)
// ============================================================================

// Todo Continuation Enforcer - Enforce todo completion
export { createTodoContinuationEnforcer } from "./todo-continuation"
export type { TodoContinuationEnforcer, TodoContinuationEnforcerOptions, SessionStateStore, Todo } from "./todo-continuation/types"

// Atlas - Boulder pusher for task orchestration
export { createAtlasHook, readBoulderState, writeBoulderState, getPlanProgress, getNextPendingTask, createBoulderState } from "./atlas"
export type { AtlasHookOptions, SessionState as AtlasSessionState, BoulderState, PlanProgress, TaskInfo } from "./atlas/types"

// Session Recovery - Resume from errors
export { createSessionRecoveryHook } from "./session-recovery"
export type { SessionRecoveryHook, SessionRecoveryOptions, RecoveryErrorType } from "./session-recovery"

// Compaction Todo Preserver - Preserve todos during compaction
export { createCompactionTodoPreserverHook } from "./compaction-todo-preserver"
export type { CompactionTodoPreserver } from "./compaction-todo-preserver"

// Background Notification - Event routing
export { createBackgroundNotificationHook } from "./background-notification"

// ============================================================================
// SESSION TIER (Priority 2)
// ============================================================================

// Agent Usage Reminder - Remind about available agents
export { createAgentUsageReminderHook } from "./agent-usage-reminder"
export type { AgentUsageState } from "./agent-usage-reminder/types"

// ============================================================================
// TOOL-GUARD TIER (Priority 3)
// ============================================================================

// Rules Injector - Inject project rules
export { createRulesInjectorHook } from "./rules-injector"

// Comment Checker - Check for AI comments
export { createCommentCheckerHooks } from "./comment-checker"

// Directory Agents Injector - Inject AGENTS.md
export { createDirectoryAgentsInjectorHook } from "./directory-agents-injector"

// Directory README Injector - Inject README.md
export { createDirectoryReadmeInjectorHook } from "./directory-readme-injector"

// ============================================================================
// TRANSFORM TIER (Priority 4)
// ============================================================================

// Placeholder for transform hooks
// - compaction-context-injector
// - hashline-read-enhancer
// - question-label-truncator

// ============================================================================
// SKILL TIER (Priority 5)
// ============================================================================

// Category Skill Reminder - Remind about category + skills
export { createCategorySkillReminderHook } from "./category-skill-reminder"
export type { AvailableSkill } from "./category-skill-reminder/hook"