/**
 * Agent Usage Reminder Hook Types
 */

/**
 * Plugin input for hook initialization.
 */
export interface PluginInput {
  directory: string
}

/**
 * Session state for tracking agent usage.
 */
export interface AgentUsageState {
  sessionID: string
  agentUsed: boolean
  reminderCount: number
  updatedAt: number
}