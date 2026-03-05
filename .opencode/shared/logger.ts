/**
 * Shared logging utility for hooks and features.
 * Writes to a temporary log file for debugging.
 */

import * as fs from "fs"
import * as os from "os"
import * as path from "path"

const logFile = path.join(os.tmpdir(), "opencode-hooks.log")

/**
 * Log a message with optional data to the hook log file.
 * @param message - Log message
 * @param data - Optional data to include
 */
export function log(message: string, data?: unknown): void {
  try {
    const timestamp = new Date().toISOString()
    const logEntry = `[${timestamp}] ${message} ${data ? JSON.stringify(data, null, 2) : ""}\n`
    fs.appendFileSync(logFile, logEntry)
  } catch {
    // Silently fail if logging is not possible
  }
}

/**
 * Get the path to the log file.
 */
export function getLogFilePath(): string {
  return logFile
}