/**
 * Compaction Todo Preserver Hook
 * 
 * Preserves todo list state during context compaction.
 * Captures todos before compaction and restores them after.
 */

import type { Todo } from "../todo-continuation/types"
import { log } from "../../shared/logger"

const HOOK_NAME = "compaction-todo-preserver"

interface PluginInput {
  client: {
    session: {
      todo: (args: { path: { id: string } }) => Promise<{ data?: Todo[] }>
    }
  }
  directory: string
}

type TodoWriter = (input: { sessionID: string; todos: Todo[] }) => Promise<void>

/**
 * Extract todos from API response.
 */
function extractTodos(response: unknown): Todo[] {
  const payload = response as { data?: unknown }
  if (Array.isArray(payload?.data)) {
    return payload.data as Todo[]
  }
  if (Array.isArray(response)) {
    return response as Todo[]
  }
  return []
}

/**
 * Resolve the todo writer function.
 */
async function resolveTodoWriter(): Promise<TodoWriter | null> {
  // In a real implementation, this would resolve to the actual todo writer
  // For now, return null to indicate no-op
  return null
}

/**
 * Resolve session ID from event properties.
 */
function resolveSessionID(props?: Record<string, unknown>): string | undefined {
  return (props?.sessionID ?? (props?.info as { id?: string } | undefined)?.id) as string | undefined
}

/**
 * Compaction Todo Preserver hook interface.
 */
export interface CompactionTodoPreserver {
  capture: (sessionID: string) => Promise<void>
  event: (input: { event: { type: string; properties?: unknown } }) => Promise<void>
}

/**
 * Create the compaction todo preserver hook.
 */
export function createCompactionTodoPreserverHook(ctx: PluginInput): CompactionTodoPreserver {
  const snapshots = new Map<string, Todo[]>()

  /**
   * Capture todos for a session before compaction.
   */
  const capture = async (sessionID: string): Promise<void> => {
    if (!sessionID) return

    try {
      const response = await ctx.client.session.todo({ path: { id: sessionID } })
      const todos = extractTodos(response)

      if (todos.length === 0) return

      snapshots.set(sessionID, todos)
      log(`[${HOOK_NAME}] Captured todo snapshot`, { sessionID, count: todos.length })
    } catch (err) {
      log(`[${HOOK_NAME}] Failed to capture todos`, { sessionID, error: String(err) })
    }
  }

  /**
   * Restore todos after compaction.
   */
  const restore = async (sessionID: string): Promise<void> => {
    const snapshot = snapshots.get(sessionID)
    if (!snapshot || snapshot.length === 0) return

    // Check if todos already exist (compaction might have preserved them)
    let hasCurrent = false
    let currentTodos: Todo[] = []

    try {
      const response = await ctx.client.session.todo({ path: { id: sessionID } })
      currentTodos = extractTodos(response)
      hasCurrent = true
    } catch (err) {
      log(`[${HOOK_NAME}] Failed to fetch todos post-compaction`, { sessionID, error: String(err) })
    }

    // If todos already present, skip restore
    if (hasCurrent && currentTodos.length > 0) {
      snapshots.delete(sessionID)
      log(`[${HOOK_NAME}] Skipped restore (todos already present)`, { sessionID, count: currentTodos.length })
      return
    }

    // Resolve todo writer
    const writer = await resolveTodoWriter()
    if (!writer) {
      log(`[${HOOK_NAME}] Skipped restore (Todo.update unavailable)`, { sessionID })
      return
    }

    try {
      await writer({ sessionID, todos: snapshot })
      log(`[${HOOK_NAME}] Restored todos after compaction`, { sessionID, count: snapshot.length })
    } catch (err) {
      log(`[${HOOK_NAME}] Failed to restore todos`, { sessionID, error: String(err) })
    } finally {
      snapshots.delete(sessionID)
    }
  }

  /**
   * Handle events.
   */
  const event = async ({ event }: { event: { type: string; properties?: unknown } }): Promise<void> => {
    const props = event.properties as Record<string, unknown> | undefined

    // Clean up on session deletion
    if (event.type === "session.deleted") {
      const sessionID = resolveSessionID(props)
      if (sessionID) {
        snapshots.delete(sessionID)
      }
      return
    }

    // Restore todos after compaction
    if (event.type === "session.compacted") {
      const sessionID = resolveSessionID(props)
      if (sessionID) {
        await restore(sessionID)
      }
      return
    }
  }

  return { capture, event }
}