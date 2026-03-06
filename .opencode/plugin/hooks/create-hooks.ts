/**
 * Hook Composition - Create all hooks in correct tier order
 * 
 * This module creates and wires all hooks together following the tier order:
 * 1. Continuation hooks (todo enforcement, atlas, recovery)
 * 2. Session hooks (lifecycle, errors)
 * 3. Tool-guard hooks (pre/post tool execution)
 * 4. Transform hooks (message transformation)
 * 5. Skill hooks (skill-specific)
 */

import type { HookName, PluginInput } from "../../hooks/base"
import type { TodoContinuationPluginInput } from "../../hooks/todo-continuation/types"
import type { SessionRecoveryPluginInput } from "../../hooks/session-recovery/types"
import {
  createTodoContinuationEnforcer,
  createAtlasHook,
  createSessionRecoveryHook,
  createCompactionTodoPreserverHook,
  createBackgroundNotificationHook,
  createAgentUsageReminderHook,
  createRulesInjectorHook,
  createCommentCheckerHooks,
  createDirectoryAgentsInjectorHook,
  createDirectoryReadmeInjectorHook,
  createCategorySkillReminderHook,
} from "../../hooks/index"

import type { AvailableSkill } from "../../agents/dynamic-prompt-builder"
import { log } from "../../shared/logger"

/**
 * Configuration for enabling/disabling hooks.
 */
export interface OhMyOpenCodeConfig {
  hooks?: Record<HookName, boolean>
  agents?: Record<string, unknown>
  start_work?: {
    auto_commit?: boolean
  }
  [key: string]: unknown
}

/**
 * Hook context passed to all hooks.
 */
export interface HookContext {
  client: unknown
  directory: string
}

/**
 * Background manager interface.
 */
export interface BackgroundManager {
  handleEvent(event: { type: string; properties?: unknown }): void
  injectPendingNotificationsIntoChatMessage(output: unknown, sessionID: string): void
  getTasksByParentSession(sessionID: string): Array<{ status: string }>
}

/**
 * Continuation hooks output.
 */
export interface ContinuationHooks {
  stopContinuationGuard: unknown | null
  compactionContextInjector: unknown | null
  compactionTodoPreserver: ReturnType<typeof createCompactionTodoPreserverHook> | null
  todoContinuationEnforcer: ReturnType<typeof createTodoContinuationEnforcer> | null
  unstableAgentBabysitter: unknown | null
  backgroundNotificationHook: ReturnType<typeof createBackgroundNotificationHook> | null
  atlasHook: ReturnType<typeof createAtlasHook> | null
}

/**
 * Safe hook creation wrapper - catches errors during hook creation.
 */
function safeHook<T>(
  hookName: HookName,
  factory: () => T,
  _options?: { enabled?: boolean }
): T | null {
  try {
    return factory()
  } catch (error) {
    log(`[create-hooks] Failed to create hook ${hookName}`, { error: String(error) })
    return null
  }
}

/**
 * Create continuation hooks (tier 1).
 */
export function createContinuationHooks(args: {
  ctx: HookContext
  pluginConfig: OhMyOpenCodeConfig
  isHookEnabled: (hookName: HookName) => boolean
  backgroundManager?: BackgroundManager
  sessionRecovery?: {
    setOnAbortCallback: (callback: (sessionID: string) => void) => void
    setOnRecoveryCompleteCallback: (callback: (sessionID: string) => void) => void
  } | null
}): ContinuationHooks {
  const { ctx, pluginConfig, isHookEnabled, backgroundManager, sessionRecovery } = args

  // Create todo continuation enforcer
  const todoContinuationEnforcer = isHookEnabled("todo-continuation-enforcer")
    ? safeHook("todo-continuation-enforcer", () =>
        createTodoContinuationEnforcer(ctx as TodoContinuationPluginInput, {
          backgroundManager,
        }))
    : null

  // Create compaction todo preserver
  const compactionTodoPreserver = isHookEnabled("compaction-todo-preserver")
    ? safeHook("compaction-todo-preserver", () => createCompactionTodoPreserverHook(ctx as PluginInput))
    : null

  // Create background notification hook
  const backgroundNotificationHook = isHookEnabled("background-notification")
    ? safeHook("background-notification", () => createBackgroundNotificationHook(backgroundManager ?? null))
    : null

  // Create atlas hook (boulder pusher)
  const atlasHook = isHookEnabled("atlas")
    ? safeHook("atlas", () =>
        createAtlasHook(ctx as PluginInput, {
          directory: ctx.directory,
          backgroundManager,
          autoCommit: pluginConfig.start_work?.auto_commit,
        }))
    : null

  // Wire up session recovery callbacks
  if (sessionRecovery) {
    const onAbortCallbacks: Array<(sessionID: string) => void> = []
    const onRecoveryCompleteCallbacks: Array<(sessionID: string) => void> = []

    if (todoContinuationEnforcer) {
      onAbortCallbacks.push(todoContinuationEnforcer.markRecovering)
      onRecoveryCompleteCallbacks.push(todoContinuationEnforcer.markRecoveryComplete)
    }

    if (onAbortCallbacks.length > 0) {
      sessionRecovery.setOnAbortCallback((sessionID: string) => {
        for (const callback of onAbortCallbacks) callback(sessionID)
      })
    }

    if (onRecoveryCompleteCallbacks.length > 0) {
      sessionRecovery.setOnRecoveryCompleteCallback((sessionID: string) => {
        for (const callback of onRecoveryCompleteCallbacks) callback(sessionID)
      })
    }
  }

  return {
    stopContinuationGuard: null,
    compactionContextInjector: null,
    compactionTodoPreserver,
    todoContinuationEnforcer,
    unstableAgentBabysitter: null,
    backgroundNotificationHook,
    atlasHook,
  }
}

/**
 * Create session hooks (tier 2).
 */
export function createSessionHooks(args: {
  ctx: HookContext
  pluginConfig: OhMyOpenCodeConfig
  isHookEnabled: (hookName: HookName) => boolean
}): Record<string, unknown> {
  const { ctx, isHookEnabled } = args

  const sessionRecovery = isHookEnabled("session-recovery")
    ? safeHook("session-recovery", () => createSessionRecoveryHook(ctx as SessionRecoveryPluginInput))
    : null

  const agentUsageReminder = isHookEnabled("agent-usage-reminder")
    ? safeHook("agent-usage-reminder", () => createAgentUsageReminderHook(ctx as PluginInput))
    : null

  return {
    sessionRecovery,
    agentUsageReminder,
  }
}

/**
 * Create tool-guard hooks (tier 3).
 */
export function createToolGuardHooks(args: {
  ctx: HookContext
  pluginConfig: OhMyOpenCodeConfig
  isHookEnabled: (hookName: HookName) => boolean
}): Record<string, unknown> {
  const { ctx, isHookEnabled } = args

  const rulesInjector = isHookEnabled("rules-injector")
    ? safeHook("rules-injector", () => createRulesInjectorHook(ctx as PluginInput))
    : null

  const commentChecker = isHookEnabled("comment-checker")
    ? safeHook("comment-checker", () => createCommentCheckerHooks())
    : null

  const directoryAgentsInjector = isHookEnabled("directory-agents-injector")
    ? safeHook("directory-agents-injector", () => createDirectoryAgentsInjectorHook(ctx as PluginInput))
    : null

  const directoryReadmeInjector = isHookEnabled("directory-readme-injector")
    ? safeHook("directory-readme-injector", () => createDirectoryReadmeInjectorHook(ctx as PluginInput))
    : null

  return {
    rulesInjector,
    commentChecker,
    directoryAgentsInjector,
    directoryReadmeInjector,
  }
}

/**
 * Create transform hooks (tier 4).
 */
export function createTransformHooks(args: {
  ctx: HookContext
  pluginConfig: OhMyOpenCodeConfig
  isHookEnabled: (hookName: HookName) => boolean
}): Record<string, unknown> {
  // Placeholder for transform hooks
  return {}
}

/**
 * Create skill hooks (tier 5).
 */
export function createSkillHooks(args: {
  ctx: HookContext
  pluginConfig: OhMyOpenCodeConfig
  isHookEnabled: (hookName: HookName) => boolean
  availableSkills: AvailableSkill[]
}): Record<string, unknown> {
  const { ctx, isHookEnabled, availableSkills } = args

  const categorySkillReminder = isHookEnabled("category-skill-reminder")
    ? safeHook("category-skill-reminder", () =>
        createCategorySkillReminderHook(ctx as PluginInput, availableSkills))
    : null

  return {
    categorySkillReminder,
  }
}

/**
 * Create all core hooks.
 */
export function createCoreHooks(args: {
  ctx: HookContext
  pluginConfig: OhMyOpenCodeConfig
  isHookEnabled: (hookName: HookName) => boolean
  backgroundManager?: BackgroundManager
  availableSkills: AvailableSkill[]
}): {
  continuation: ContinuationHooks
  session: Record<string, unknown>
  tool: Record<string, unknown>
  transform: Record<string, unknown>
  skill: Record<string, unknown>
} {
  const { ctx, pluginConfig, isHookEnabled, backgroundManager, availableSkills } = args

  // Create session recovery first (needed for continuation hooks)
  const sessionRecovery = isHookEnabled("session-recovery")
    ? safeHook("session-recovery", () => createSessionRecoveryHook(ctx as SessionRecoveryPluginInput))
    : null

  const continuation = createContinuationHooks({
    ctx,
    pluginConfig,
    isHookEnabled,
    backgroundManager,
    sessionRecovery,
  })

  const session = createSessionHooks({ ctx, pluginConfig, isHookEnabled })
  
  // Add session recovery to session hooks
  if (sessionRecovery) {
    session["sessionRecovery"] = sessionRecovery
  }

  const tool = createToolGuardHooks({ ctx, pluginConfig, isHookEnabled })
  const transform = createTransformHooks({ ctx, pluginConfig, isHookEnabled })
  const skill = createSkillHooks({ ctx, pluginConfig, isHookEnabled, availableSkills })

  return {
    continuation,
    session,
    tool,
    transform,
    skill,
  }
}