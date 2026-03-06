/**
 * Atlas Hook - The Boulder Pusher
 * 
 * Atlas reads boulder.json and orchestrates the todo list to ensure
 * work continues until all tasks are complete. This is the core "boulder
 * pusher" hook that enforces completion guarantees.
 * 
 * Priority: CRITICAL - Part of continuation tier.
 */

import type { AtlasHookOptions, SessionState, PluginInput } from "./types"
import { createAtlasEventHandler } from "./event-handler"
import { HOOK_NAME } from "./hook-name"

/**
 * Create the Atlas hook.
 * 
 * @param ctx - Plugin context
 * @param options - Hook options
 * @returns Hook handlers for event and tool.execute
 */
export function createAtlasHook(ctx: PluginInput, options?: AtlasHookOptions) {
  const sessions = new Map<string, SessionState>()
  const pendingFilePaths = new Map<string, string>()

  function getState(sessionID: string): SessionState {
    let state = sessions.get(sessionID)
    if (!state) {
      state = { promptFailureCount: 0 }
      sessions.set(sessionID, state)
    }
    return state
  }

  return {
    handler: createAtlasEventHandler({ ctx, options, sessions, getState }),
    
    // Tool execute before handler (for file path tracking)
    "tool.execute.before": async (input: { tool: string; sessionID: string; callID: string }, output: { args: Record<string, unknown> }) => {
      const filePath = (output.args.filePath ?? output.args.file_path ?? output.args.path) as string | undefined
      if (filePath) {
        pendingFilePaths.set(input.callID, filePath)
      }
    },
    
    // Tool execute after handler (for file path cleanup)
    "tool.execute.after": async (input: { tool: string; sessionID: string; callID: string }, _output: { title: string; output: string }) => {
      pendingFilePaths.delete(input.callID)
    },
  }
}

export { HOOK_NAME }
export type { AtlasHookOptions, SessionState } from "./types"
export { readBoulderState, writeBoulderState, getPlanProgress, getNextPendingTask, createBoulderState } from "./boulder-state"