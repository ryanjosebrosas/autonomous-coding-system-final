/**
 * Agent Usage Reminder Hook Types
 */

/**
 * Session state for tracking agent usage.
 */
export interface AgentUsageState {
  sessionID: string
  agentUsed: boolean
  reminderCount: number
  updatedAt: number
}