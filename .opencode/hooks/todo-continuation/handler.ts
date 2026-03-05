/**
 * Event handler for todo continuation enforcement.
 */

import type { SessionStateStore, Todo } from "./types"
import { HOOK_NAME, DEFAULT_SKIP_AGENTS, COUNTDOWN_DELAY_MS, CONTINUATION_INTERVAL_MS, INJECTION_COOLDOWN_MS } from "./constants"
import { log } from "../../shared/logger"

interface PluginInput {
  client: {
    session: {
      todo: (args: { path: { id: string } }) => Promise<{ data?: Todo[] }>
      prompt: (args: { path: { id: string }; body: unknown }) => Promise<void>
    }
  }
  directory: string
}

interface EventHandlerArgs {
  ctx: PluginInput
  sessionStateStore: SessionStateStore
  backgroundManager?: unknown
  skipAgents?: string[]
  isContinuationStopped?: (sessionID: string) => boolean
}

/**
 * Handle session.idle event - check for incomplete todos and inject reminder.
 */
export async function handleSessionIdle(args: {
  ctx: PluginInput
  sessionID: string
  sessionStateStore: SessionStateStore
  backgroundManager?: unknown
  skipAgents?: string[]
  isContinuationStopped?: (sessionID: string) => boolean
}): Promise<void> {
  const { ctx, sessionID, sessionStateStore, skipAgents = DEFAULT_SKIP_AGENTS, isContinuationStopped } = args

  const state = sessionStateStore.getState(sessionID)

  // Skip if recovering from error
  if (state.isRecovering) {
    log(`[${HOOK_NAME}] Skipping - session is recovering`, { sessionID })
    return
  }

  // Skip if continuation is explicitly stopped
  if (isContinuationStopped?.(sessionID)) {
    log(`[${HOOK_NAME}] Skipping - continuation stopped`, { sessionID })
    return
  }

  // Check for cooldown
  if (state.lastInjectedAt && Date.now() - state.lastInjectedAt < INJECTION_COOLDOWN_MS) {
    log(`[${HOOK_NAME}] Skipping - in cooldown period`, { sessionID })
    return
  }

  // Check if already in flight
  if (state.inFlight) {
    log(`[${HOOK_NAME}] Skipping - already in flight`, { sessionID })
    return
  }

  state.inFlight = true

  try {
    // Fetch todos
    const todoResponse = await ctx.client.session.todo({ path: { id: sessionID } })
    const todos = todoResponse.data ?? []

    // Check for incomplete todos
    const incompleteTodos = todos.filter(
      (t) => t.status === "pending" || t.status === "in_progress"
    )

    if (incompleteTodos.length === 0) {
      log(`[${HOOK_NAME}] No incomplete todos - session can end`, { sessionID })
      return
    }

    // Build continuation reminder
    const reminder = buildContinuationReminder(incompleteTodos)

    // Inject as prompt (noReply mode)
    await ctx.client.session.prompt({
      path: { id: sessionID },
      body: {
        content: reminder,
        noReply: true,
      },
    })

    state.lastInjectedAt = Date.now()
    log(`[${HOOK_NAME}] Injected continuation reminder`, { sessionID, todoCount: incompleteTodos.length })
  } catch (error) {
    log(`[${HOOK_NAME}] Error checking todos`, { sessionID, error: String(error) })
    state.consecutiveFailures++
  } finally {
    state.inFlight = false
  }
}

/**
 * Handle non-idle events - reset state appropriately.
 */
export function handleNonIdleEvent(args: {
  eventType: string
  properties: Record<string, unknown> | undefined
  sessionStateStore: SessionStateStore
}): void {
  const { eventType, properties, sessionStateStore } = args

  // Reset on user message
  if (eventType === "message.user") {
    const sessionID = properties?.sessionID as string | undefined
    if (sessionID) {
      const state = sessionStateStore.getState(sessionID)
      state.consecutiveFailures = 0
    }
  }
}

/**
 * Build the continuation reminder message.
 */
function buildContinuationReminder(incompleteTodos: Todo[]): string {
  const pendingTodos = incompleteTodos.filter((t) => t.status === "pending")
  const inProgressTodos = incompleteTodos.filter((t) => t.status === "in_progress")

  let message = "## <system-reminder>\n"
  message += "**Todo Completion Enforcement**\n\n"
  message += "The session has gone idle with incomplete todos. All todos must be completed before the session can end.\n\n"

  if (inProgressTodos.length > 0) {
    message += "**In Progress:**\n"
    for (const todo of inProgressTodos) {
      message += `- ${todo.content}\n`
    }
    message += "\n"
  }

  if (pendingTodos.length > 0) {
    message += "**Pending:**\n"
    for (const todo of pendingTodos) {
      message += `- ${todo.content}\n`
    }
    message += "\n"
  }

  message += "Continue working on the in-progress todo, then mark it complete and move to the next pending todo.\n"
  message += "</system-reminder>"

  return message
}

/**
 * Create the todo continuation event handler.
 */
export function createTodoContinuationHandler(args: EventHandlerArgs): (input: { event: { type: string; properties?: unknown } }) => Promise<void> {
  const { ctx, sessionStateStore, backgroundManager, skipAgents = DEFAULT_SKIP_AGENTS, isContinuationStopped } = args

  return async ({ event }: { event: { type: string; properties?: unknown } }): Promise<void> => {
    const props = event.properties as Record<string, unknown> | undefined

    // Handle session error (abort detection)
    if (event.type === "session.error") {
      const sessionID = props?.sessionID as string | undefined
      if (!sessionID) return

      const error = props?.error as { name?: string } | undefined
      if (error?.name === "MessageAbortedError" || error?.name === "AbortError") {
        const state = sessionStateStore.getState(sessionID)
        state.abortDetectedAt = Date.now()
        log(`[${HOOK_NAME}] Abort detected via session.error`, { sessionID, errorName: error.name })
      }

      sessionStateStore.cancelCountdown(sessionID)
      log(`[${HOOK_NAME}] session.error`, { sessionID })
      return
    }

    // Handle session idle
    if (event.type === "session.idle") {
      const sessionID = props?.sessionID as string | undefined
      if (!sessionID) return

      await handleSessionIdle({
        ctx,
        sessionID,
        sessionStateStore,
        backgroundManager,
        skipAgents,
        isContinuationStopped,
      })
      return
    }

    // Handle session deleted
    if (event.type === "session.deleted") {
      const sessionInfo = props?.info as { id?: string } | undefined
      if (sessionInfo?.id) {
        sessionStateStore.cleanup(sessionInfo.id)
      }
      return
    }

    // Handle non-idle events
    handleNonIdleEvent({
      eventType: event.type,
      properties: props,
      sessionStateStore,
    })
  }
}