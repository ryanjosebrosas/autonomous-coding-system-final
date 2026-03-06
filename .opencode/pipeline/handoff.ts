// ============================================================================
// PIPELINE HANDOFF FILE MANAGER
// ============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from "node:fs"
import { join } from "node:path"
import type { PipelineHandoff, PipelineStatus, TaskIndexEntry } from "./types"

const HANDOFF_FILE = "next-command.md"
const CONTEXT_DIR = ".agents/context"

/**
 * Read the pipeline handoff file.
 * 
 * Returns null if the file doesn't exist or can't be parsed.
 */
export function readHandoff(workspaceDir: string): PipelineHandoff | null {
  const handoffPath = join(workspaceDir, CONTEXT_DIR, HANDOFF_FILE)
  
  if (!existsSync(handoffPath)) {
    return null
  }
  
  try {
    const content = readFileSync(handoffPath, "utf-8")
    return parseHandoffMarkdown(content)
  } catch (error) {
    console.error(`[pipeline] Failed to read handoff file:`, error)
    return null
  }
}

/**
 * Write the pipeline handoff file.
 * 
 * Creates the context directory if it doesn't exist.
 * Updates the timestamp automatically.
 * Uses atomic write (temp file + rename) for crash safety.
 */
export function writeHandoff(workspaceDir: string, handoff: PipelineHandoff): boolean {
  const contextDir = join(workspaceDir, CONTEXT_DIR)
  const handoffPath = join(contextDir, HANDOFF_FILE)
  const tempPath = join(contextDir, `${HANDOFF_FILE}.tmp`)
  
  try {
    if (!existsSync(contextDir)) {
      mkdirSync(contextDir, { recursive: true })
    }
    
    // Update timestamp
    handoff.timestamp = new Date().toISOString()
    
    const content = serializeHandoffMarkdown(handoff)
    
    // Atomic write: write to temp, then rename
    writeFileSync(tempPath, content, "utf-8")
    renameSync(tempPath, handoffPath)
    
    return true
  } catch (error) {
    console.error(`[pipeline] Failed to write handoff file:`, error)
    
    // Clean up temp file if write failed
    try {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath)
      }
    } catch {
      // Ignore cleanup errors
    }
    
    return false
  }
}

/**
 * Parse handoff from markdown content.
 * 
 * The handoff file uses a specific markdown format:
 * 
 * # Pipeline Handoff
 * <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->
 * 
 * - **Last Command**: /execute
 * - **Feature**: auth-system
 * - **Next Command**: /code-loop auth-system
 * - **Status**: awaiting-review
 * - **Timestamp**: 2026-03-06T12:00:00Z
 */
function parseHandoffMarkdown(content: string): PipelineHandoff {
  const lines = content.split("\n")
  const handoff: Partial<PipelineHandoff> = {}
  const taskIndex: TaskIndexEntry[] = []
  
  let inTaskIndex = false
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Parse header fields
    if (trimmed.startsWith("- **Last Command**:")) {
      handoff.lastCommand = extractValue(trimmed)
    } else if (trimmed.startsWith("- **Feature**:")) {
      handoff.feature = extractValue(trimmed)
    } else if (trimmed.startsWith("- **Next Command**:")) {
      handoff.nextCommand = extractValue(trimmed)
    } else if (trimmed.startsWith("- **Master Plan**:")) {
      handoff.masterPlan = extractValue(trimmed)
    } else if (trimmed.startsWith("- **Task Progress**:")) {
      const match = extractValue(trimmed).match(/(\d+)\/(\d+)/)
      if (match) {
        handoff.taskProgress = {
          completed: parseInt(match[1], 10),
          total: parseInt(match[2], 10),
        }
      }
    } else if (trimmed.startsWith("- **Phase Progress**:")) {
      const match = extractValue(trimmed).match(/(\d+)\/(\d+)/)
      if (match) {
        handoff.phaseProgress = {
          current: parseInt(match[1], 10),
          total: parseInt(match[2], 10),
        }
      }
    } else if (trimmed.startsWith("- **Timestamp**:")) {
      handoff.timestamp = extractValue(trimmed)
    } else if (trimmed.startsWith("- **Status**:")) {
      handoff.status = extractValue(trimmed) as PipelineStatus
    } else if (trimmed.startsWith("- **Notes**:")) {
      handoff.notes = extractValue(trimmed)
    }
    
    // Parse task index table
    if (trimmed.startsWith("## Task Index")) {
      inTaskIndex = true
      continue
    }
    
    if (inTaskIndex && trimmed.startsWith("|")) {
      const task = parseTaskIndexRow(trimmed)
      if (task) {
        taskIndex.push(task)
      }
    }
    
    // End of task index section
    if (inTaskIndex && trimmed.startsWith("---") && handoff.feature) {
      inTaskIndex = false
    }
  }
  
  if (taskIndex.length > 0) {
    handoff.taskIndex = taskIndex
  }
  
  return handoff as PipelineHandoff
}

/**
 * Serialize handoff to markdown format.
 */
function serializeHandoffMarkdown(handoff: PipelineHandoff): string {
  const lines: string[] = [
    "# Pipeline Handoff",
    "<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->",
    "",
    `- **Last Command**: ${handoff.lastCommand}`,
    `- **Feature**: ${handoff.feature}`,
    `- **Next Command**: ${handoff.nextCommand}`,
  ]
  
  if (handoff.masterPlan) {
    lines.push(`- **Master Plan**: ${handoff.masterPlan}`)
  }
  
  if (handoff.taskProgress) {
    lines.push(`- **Task Progress**: ${handoff.taskProgress.completed}/${handoff.taskProgress.total} complete`)
  }
  
  if (handoff.phaseProgress) {
    lines.push(`- **Phase Progress**: ${handoff.phaseProgress.current}/${handoff.phaseProgress.total} complete`)
  }
  
  lines.push(`- **Timestamp**: ${handoff.timestamp}`)
  lines.push(`- **Status**: ${handoff.status}`)
  
  if (handoff.notes) {
    lines.push(`- **Notes**: ${handoff.notes}`)
  }
  
  // Add task index if present
  if (handoff.taskIndex && handoff.taskIndex.length > 0) {
    lines.push("")
    lines.push("## Task Index")
    lines.push("")
    lines.push("| Task | Brief Path | Scope | Status | Files |")
    lines.push("|------|-----------|-------|--------|-------|")
    
    for (const task of handoff.taskIndex) {
      const files = task.files?.join(", ") ?? "-"
      lines.push(`| ${task.task} | \`${task.briefPath}\` | ${task.scope} | ${task.status} | ${files} |`)
    }
  }
  
  lines.push("")
  return lines.join("\n")
}

/**
 * Extract value from a markdown list item.
 * 
 * Input: "- **Field**: value"
 * Output: "value"
 */
function extractValue(line: string): string {
  // Handle format: "- **Field**: value" or "- **Field**: value (extra)"
  const colonIndex = line.indexOf(":")
  if (colonIndex === -1) return ""
  
  let value = line.slice(colonIndex + 1).trim()
  
  // Remove trailing parenthetical notes like "complete"
  const parenIndex = value.indexOf(" (")
  if (parenIndex > 0) {
    value = value.slice(0, parenIndex)
  }
  
  return value
}

/**
 * Parse a task index table row.
 * 
 * Input: "| 1 | `task-1.md` | Sync models | done | 1 modified |"
 */
function parseTaskIndexRow(line: string): TaskIndexEntry | null {
  const parts = line.split("|").map(s => s.trim()).filter(s => s.length > 0)
  
  if (parts.length < 4) return null
  
  // parts[0] = task number
  // parts[1] = brief path
  // parts[2] = scope
  // parts[3] = status
  // parts[4] = files (optional)
  
  const taskNum = parseInt(parts[0], 10)
  if (isNaN(taskNum)) return null
  
  // Extract brief path (remove backticks)
  const briefPath = parts[1].replace(/`/g, "")
  
  // Parse status
  const status = parts[3] as TaskIndexEntry["status"]
  if (!["pending", "in_progress", "done", "blocked"].includes(status)) {
    return null
  }
  
  return {
    task: taskNum,
    briefPath,
    scope: parts[2],
    status,
    files: parts[4] && parts[4] !== "-" ? parts[4].split(", ").map(f => f.trim()) : undefined,
  }
}

/**
 * Create a new handoff with default values.
 */
export function createHandoff(
  feature: string, 
  lastCommand: string, 
  nextCommand: string,
  status: PipelineStatus = "awaiting-execution"
): PipelineHandoff {
  return {
    lastCommand,
    feature,
    nextCommand,
    timestamp: new Date().toISOString(),
    status,
  }
}

/**
 * Update specific fields in a handoff.
 */
export function updateHandoff(
  handoff: PipelineHandoff, 
  updates: Partial<PipelineHandoff>
): PipelineHandoff {
  return {
    ...handoff,
    ...updates,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Check if a handoff has pending work.
 */
export function hasPendingWork(handoff: PipelineHandoff | null): boolean {
  if (!handoff) return false
  
  // Terminal states have no pending work
  if (handoff.status === "pr-open") return false
  
  // Blocked states need attention
  if (handoff.status === "blocked") return true
  
  // If task progress exists, check if incomplete
  if (handoff.taskProgress) {
    return handoff.taskProgress.completed < handoff.taskProgress.total
  }
  
  // Default: there's pending work
  return true
}