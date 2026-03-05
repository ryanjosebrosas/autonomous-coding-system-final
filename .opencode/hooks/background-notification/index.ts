/**
 * Background Notification Hook
 * 
 * Handles event routing to BackgroundManager for background task notifications.
 * Notifies when background tasks complete or need attention.
 */

import { log } from "../../shared/logger"

interface Event {
  type: string
  properties?: Record<string, unknown>
}

interface EventInput {
  event: Event
}

interface ChatMessageInput {
  sessionID: string
}

interface ChatMessageOutput {
  parts: Array<{ type: string; text?: string; [key: string]: unknown }>
}

/**
 * BackgroundManager interface (stub for type checking).
 */
interface BackgroundManager {
  handleEvent(event: Event): void
  injectPendingNotificationsIntoChatMessage(output: ChatMessageOutput, sessionID: string): void
}

/**
 * Create the background notification hook.
 * 
 * @param manager - Background task manager instance
 */
export function createBackgroundNotificationHook(manager: BackgroundManager | null): {
  "chat.message": (input: ChatMessageInput, output: ChatMessageOutput) => Promise<void>
  event: (input: EventInput) => Promise<void>
} {
  /**
   * Handle events - route to background manager.
   */
  const event = async ({ event }: EventInput): Promise<void> => {
    if (!manager) return

    try {
      manager.handleEvent(event)
    } catch (err) {
      log("[background-notification] Error handling event", {
        eventType: event.type,
        error: String(err),
      })
    }
  }

  /**
   * Handle chat message - inject pending notifications.
   */
  const chatMessage = async (
    input: ChatMessageInput,
    output: ChatMessageOutput
  ): Promise<void> => {
    if (!manager) return

    try {
      manager.injectPendingNotificationsIntoChatMessage(output, input.sessionID)
    } catch (err) {
      log("[background-notification] Error injecting notifications", {
        sessionID: input.sessionID,
        error: String(err),
      })
    }
  }

  return {
    "chat.message": chatMessage,
    event,
  }
}