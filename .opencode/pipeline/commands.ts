// ============================================================================
// PIPELINE COMMAND REGISTRY
// ============================================================================

import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join } from "node:path"
import type { CommandInfo, PipelineStatus } from "./types"
import { COMMAND_TARGET_STATES, getCommandTargetState } from "./state-machine"

const OPENCODE_COMMANDS_DIR = ".opencode/commands"
const CLAUDE_COMMANDS_DIR = ".claude/commands"

// Valid command names (from AGENTS.md and command files)
const VALID_COMMANDS = [
  // Planning commands
  "mvp",
  "prd",
  "pillars",
  "decompose",
  "planning",
  
  // Execution commands
  "execute",
  
  // Review commands
  "code-review",
  "code-review-fix",
  "code-loop",
  "final-review",
  "system-review",
  
  // Commit commands
  "commit",
  "pr",
  
  // Context commands
  "prime",
  "council",
  
  // Continuation commands
  "ralph-loop",
  "ulw-loop",
  "start-work",
  "stop-continuation",
  "handoff",
]

/**
 * Load a command's metadata from its method file.
 */
export function loadCommand(commandName: string, workspaceDir: string): CommandInfo | null {
  // Remove leading slash if present
  const name = commandName.startsWith("/") ? commandName.slice(1) : commandName
  
  // Try .opencode/commands first, then .claude/commands
  const opencodePath = join(workspaceDir, OPENCODE_COMMANDS_DIR, `${name}.md`)
  const claudePath = join(workspaceDir, CLAUDE_COMMANDS_DIR, `${name}.md`)
  
  const methodPath = existsSync(opencodePath) ? opencodePath
                  : existsSync(claudePath) ? claudePath
                  : null
  
  if (!methodPath) {
    return null
  }
  
  try {
    const content = readFileSync(methodPath, "utf-8")
    const frontmatter = parseFrontmatter(content)
    const targetStatus = getCommandTargetState(name)
    
    return {
      name,
      description: frontmatter.description || "",
      model: frontmatter.model || "",
      targetStatus,
      methodPath,
    }
  } catch (error) {
    console.error(`[pipeline] Failed to load command ${commandName}:`, error)
    return null
  }
}

/**
 * List all available commands.
 */
export function listCommands(workspaceDir: string): CommandInfo[] {
  const commands: CommandInfo[] = []
  const foundNames = new Set<string>()
  
  // Scan .opencode/commands
  const opencodeDir = join(workspaceDir, OPENCODE_COMMANDS_DIR)
  if (existsSync(opencodeDir)) {
    try {
      const entries = readdirSync(opencodeDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          const name = entry.name.replace(/\.md$/, "")
          if (!foundNames.has(name)) {
            const cmd = loadCommand(name, workspaceDir)
            if (cmd) {
              commands.push(cmd)
              foundNames.add(name)
            }
          }
        }
      }
    } catch (error) {
      console.error(`[pipeline] Failed to scan opencode commands:`, error)
    }
  }
  
  // Scan .claude/commands
  const claudeDir = join(workspaceDir, CLAUDE_COMMANDS_DIR)
  if (existsSync(claudeDir)) {
    try {
      const entries = readdirSync(claudeDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          const name = entry.name.replace(/\.md$/, "")
          if (!foundNames.has(name)) {
            const cmd = loadCommand(name, workspaceDir)
            if (cmd) {
              commands.push(cmd)
              foundNames.add(name)
            }
          }
        }
      }
    } catch (error) {
      console.error(`[pipeline] Failed to scan claude commands:`, error)
    }
  }
  
  return commands.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Check if a command name is valid.
 */
export function isValidCommand(commandName: string): boolean {
  const name = commandName.startsWith("/") ? commandName.slice(1) : commandName
  return VALID_COMMANDS.includes(name)
}

/**
 * Get the target status for a command.
 */
export function getCommandStatus(commandName: string): PipelineStatus | undefined {
  return getCommandTargetState(commandName)
}

/**
 * Get all commands that can transition to a given status.
 */
export function getCommandsForStatus(status: PipelineStatus): string[] {
  const commands: string[] = []
  
  for (const [cmd, targetStatus] of Object.entries(COMMAND_TARGET_STATES)) {
    if (targetStatus === status) {
      commands.push(cmd)
    }
  }
  
  return commands
}

/**
 * Parse frontmatter from a command method file.
 */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  
  const frontmatter: Record<string, string> = {}
  const lines = match[1].split("\n")
  
  for (const line of lines) {
    const colonIdx = line.indexOf(":")
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim()
      const value = line.slice(colonIdx + 1).trim()
      frontmatter[key] = value
    }
  }
  
  return frontmatter
}

/**
 * Get a brief description of a command's purpose.
 */
export function getCommandDescription(commandName: string): string {
  const descriptions: Record<string, string> = {
    "/mvp": "Define product MVP vision",
    "/prd": "Create Product Requirements Document",
    "/pillars": "Analyze infrastructure pillars",
    "/decompose": "Decompose feature into task briefs",
    "/planning": "Interactive planning session",
    "/execute": "Execute implementation from plan",
    "/code-review": "Technical code review",
    "/code-review-fix": "Fix findings from code review",
    "/code-loop": "Automated review-fix loop",
    "/final-review": "Human approval gate before commit",
    "/system-review": "Meta-analysis of pipeline quality",
    "/commit": "Create conventional git commit",
    "/pr": "Create pull request from commits",
    "/prime": "Load context at session start",
    "/council": "Multi-perspective discussion",
  }
  
  const name = commandName.startsWith("/") ? commandName : `/${commandName}`
  return descriptions[name] || "Unknown command"
}

/**
 * Get the suggested next command based on current status.
 */
export function suggestNextCommand(status: PipelineStatus, feature?: string): string | null {
  const suggestions: Record<PipelineStatus, string | null> = {
    "awaiting-execution": "/execute",
    "executing-tasks": null, // Determined by artifact state
    "executing-series": null, // Determined by artifact state
    "awaiting-review": "/code-loop",
    "awaiting-fixes": "/code-review-fix",
    "awaiting-re-review": "/code-review",
    "ready-to-commit": "/commit",
    "ready-for-pr": "/pr",
    "pr-open": null, // Terminal
    "blocked": null, // Manual intervention required
  }
  
  let suggestion = suggestions[status]
  
  if (!suggestion && feature) {
    // Could add more sophisticated logic here based on artifacts
  }
  
  return suggestion
}