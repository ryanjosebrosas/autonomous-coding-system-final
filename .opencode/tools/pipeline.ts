// ============================================================================
// PIPELINE TOOL - MCP Interface
// ============================================================================

import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import {
  readHandoff,
  writeHandoff,
  createHandoff,
  updateHandoff,
  hasPendingWork,
} from "../pipeline/handoff"
import {
  discoverArtifacts,
  getPendingArtifacts,
  getDoneArtifacts,
  markArtifactDone,
  getNextPendingTask,
  getArtifactDiscoveryResult,
} from "../pipeline/artifacts"
import {
  validateTransition,
  getValidNextStates,
  getStatusDescription,
  getCommandTargetState,
} from "../pipeline/state-machine"
import {
  loadCommand,
  listCommands,
  isValidCommand,
  suggestNextCommand,
} from "../pipeline/commands"
import type { PipelineStatus, PipelineHandoff } from "../pipeline/types"

/**
 * Pipeline orchestration tool for AI coding workflow.
 * 
 * Commands:
 * - status: Read current handoff state
 * - next: Get valid next states
 * - advance: Transition to new state
 * - artifacts: List artifacts for a feature
 * - commands: List available commands
 */
export const pipelineTool = {
  name: "pipeline",
  description: `Pipeline orchestrator for AI coding workflow. Commands: status, next, advance, artifacts, commands.

Examples:
- pipeline status -- Show current pipeline state
- pipeline next -- Show valid next states
- pipeline advance --status awaiting-review -- Transition to new state
- pipeline artifacts --feature auth-system -- List artifacts for feature
- pipeline commands -- List available commands`,

  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Command to execute: status, next, advance, artifacts, commands",
        enum: ["status", "next", "advance", "artifacts", "commands"],
      },
      feature: {
        type: "string",
        description: "Feature name (e.g., 'auth-system')",
      },
      status: {
        type: "string",
        description: "Target status for advance command",
      },
      task: {
        type: "number",
        description: "Task number to mark done (for mark-done command)",
      },
    },
    required: ["command"],
  },

  async execute(args: {
    command: "status" | "next" | "advance" | "artifacts" | "commands"
    feature?: string
    status?: string
    task?: number
  }): Promise<string> {
    const workspaceDir = process.cwd()

    switch (args.command) {
      case "status":
        return handleStatus(workspaceDir)
      
      case "next":
        return handleNext(workspaceDir)
      
      case "advance":
        return handleAdvance(workspaceDir, args.status)
      
      case "artifacts":
        return handleArtifacts(workspaceDir, args.feature)
      
      case "commands":
        return handleCommands(workspaceDir)
      
      default:
        return `# Unknown Command\n\nUnknown command: ${args.command}\n\nValid commands: status, next, advance, artifacts, commands`
    }
  },
}

/**
 * Handle: pipeline status
 */
function handleStatus(workspaceDir: string): string {
  const handoff = readHandoff(workspaceDir)
  
  if (!handoff) {
    return `# No Active Pipeline

No handoff file found at \`.agents/context/next-command.md\`

To start a new pipeline:
1. Run \`/planning {feature}\` to create a plan
2. Run \`/execute .agents/features/{feature}/plan.md\` to start execution`
  }
  
  const lines = [
    `# Pipeline Status`,
    ``,
    `- **Feature**: ${handoff.feature}`,
    `- **Status**: ${handoff.status}`,
    `- **Last Command**: ${handoff.lastCommand}`,
    `- **Next Command**: ${handoff.nextCommand}`,
    `- **Timestamp**: ${handoff.timestamp}`,
  ]
  
  if (handoff.notes) {
    lines.push(`- **Notes**: ${handoff.notes}`)
  }
  
  if (handoff.taskProgress) {
    lines.push(``)
    lines.push(`**Task Progress**: ${handoff.taskProgress.completed}/${handoff.taskProgress.total} tasks complete`)
  }
  
  if (handoff.phaseProgress) {
    lines.push(``)
    lines.push(`**Phase Progress**: ${handoff.phaseProgress.current}/${handoff.phaseProgress.total} phases complete`)
  }
  
  if (handoff.taskIndex && handoff.taskIndex.length > 0) {
    lines.push(``)
    lines.push(`## Task Index`)
    lines.push(``)
    lines.push(`| # | Brief | Scope | Status |`)
    lines.push(`|---|-------|-------|--------|`)
    
    for (const task of handoff.taskIndex) {
      lines.push(`| ${task.task} | ${task.briefPath} | ${task.scope} | ${task.status} |`)
    }
  }
  
  return lines.join("\n")
}

/**
 * Handle: pipeline next
 */
function handleNext(workspaceDir: string): string {
  const handoff = readHandoff(workspaceDir)
  
  if (!handoff) {
    return `# No Active Pipeline

No handoff file found. Start with \`/planning {feature}\`.`
  }
  
  const validStates = getValidNextStates(handoff.status)
  const description = getStatusDescription(handoff.status)
  const suggestion = suggestNextCommand(handoff.status, handoff.feature)
  
  const lines = [
    `# Valid Next States`,
    ``,
    `**Current**: ${handoff.status} (${description})`,
    ``,
    `**Valid Transitions**:`,
  ]
  
  if (validStates.length === 0) {
    lines.push(`- (none - terminal state)`)
  } else {
    for (const state of validStates) {
      const stateDesc = getStatusDescription(state)
      lines.push(`- ${state} — ${stateDesc}`)
    }
  }
  
  if (suggestion) {
    lines.push(``)
    lines.push(`**Suggested Command**: \`${suggestion}\``)
    if (handoff.feature) {
      lines.push(``)
      lines.push(`Run: \`${suggestion} ${handoff.feature}\``)
    }
  }
  
  return lines.join("\n")
}

/**
 * Handle: pipeline advance --status <status>
 */
function handleAdvance(workspaceDir: string, targetStatus?: string): string {
  if (!targetStatus) {
    return `# Error: Missing Status

\`status\` argument required for advance command.

Usage: pipeline advance --status <status>

Run \`pipeline next\` to see valid next states.`
  }
  
  const handoff = readHandoff(workspaceDir)
  
  if (!handoff) {
    return `# Error: No Active Pipeline

No handoff file found. Start with \`/planning {feature}\`.`
  }
  
  const result = validateTransition(handoff.status, targetStatus as PipelineStatus)
  
  if (!result.success) {
    return `# Transition Failed

${result.error}

Run \`pipeline next\` to see valid transitions.`
  }
  
  const updated = updateHandoff(handoff, { status: targetStatus as PipelineStatus })
  
  if (!writeHandoff(workspaceDir, updated)) {
    return `# Error: Failed to Update Handoff

Failed to write handoff file. Check file permissions.`
  }
  
  const fromDesc = getStatusDescription(handoff.status)
  const toDesc = getStatusDescription(targetStatus as PipelineStatus)
  const suggestion = suggestNextCommand(targetStatus as PipelineStatus, handoff.feature)
  
  const lines = [
    `# State Advanced`,
    ``,
    `**${handoff.status}** → **${targetStatus}**`,
    ``,
    `${fromDesc}`,
    `↓`,
    `${toDesc}`,
  ]
  
  if (suggestion) {
    lines.push(``)
    lines.push(`**Next**: Run \`${suggestion}\` to continue.`)
  }
  
  return lines.join("\n")
}

/**
 * Handle: pipeline artifacts --feature <name>
 */
function handleArtifacts(workspaceDir: string, feature?: string): string {
  if (!feature) {
    return `# Error: Missing Feature

\`feature\` argument required for artifacts command.

Usage: pipeline artifacts --feature <name>`
  }
  
  const result = getArtifactDiscoveryResult(workspaceDir, feature)
  
  if (result.artifacts.length === 0) {
    return `# No Artifacts

No artifacts found for feature: **${feature}**

Check that \`.agents/features/${feature}/\` directory exists.`
  }
  
  const lines = [
    `# Artifacts for ${feature}`,
    ``,
    `Found: ${result.artifacts.length} artifacts`,
    `Pending: ${result.pending.length}`,
    `Done: ${result.done.length}`,
  ]
  
  if (result.pending.length > 0) {
    lines.push(``)
    lines.push(`## Pending (${result.pending.length})`)
    for (const artifact of result.pending) {
      lines.push(`- ${artifact.name} (${artifact.type})`)
    }
  }
  
  if (result.done.length > 0) {
    lines.push(``)
    lines.push(`## Done (${result.done.length})`)
    for (const artifact of result.done) {
      lines.push(`- ${artifact.name} (${artifact.type}) ✓`)
    }
  }
  
  if (result.nextTask) {
    lines.push(``)
    lines.push(`**Next Task**: ${result.nextTask.name}`)
    lines.push(``)
    lines.push(`Run \`/execute .agents/features/${feature}/${result.nextTask.name}\``)
  }
  
  return lines.join("\n")
}

/**
 * Handle: pipeline commands
 */
function handleCommands(workspaceDir: string): string {
  const commands = listCommands(workspaceDir)
  
  const lines = [
    `# Available Commands`,
    ``,
    `Found: ${commands.length} commands`,
    ``,
  ]
  
  // Group by status effect
  const planning = commands.filter(c => c.name.startsWith("mvp") || c.name.startsWith("prd") || c.name.startsWith("pillars") || c.name.startsWith("decompose") || c.name.startsWith("planning"))
  const execution = commands.filter(c => c.name === "execute")
  const review = commands.filter(c => c.name.includes("review") || c.name.includes("loop"))
  const commit = commands.filter(c => c.name === "commit" || c.name === "pr")
  const other = commands.filter(c => c.name === "prime" || c.name === "council" || c.name === "handoff")
  
  if (planning.length > 0) {
    lines.push(`## Planning`)
    for (const cmd of planning) {
      lines.push(`- \`/${cmd.name}\` — ${cmd.description || "See method file"}`)
    }
    lines.push(``)
  }
  
  if (execution.length > 0) {
    lines.push(`## Execution`)
    for (const cmd of execution) {
      lines.push(`- \`/${cmd.name}\` — ${cmd.description || "Execute plan"}`)
    }
    lines.push(``)
  }
  
  if (review.length > 0) {
    lines.push(`## Review`)
    for (const cmd of review) {
      lines.push(`- \`/${cmd.name}\` — ${cmd.description || "Review code"}`)
    }
    lines.push(``)
  }
  
  if (commit.length > 0) {
    lines.push(`## Commit`)
    for (const cmd of commit) {
      lines.push(`- \`/${cmd.name}\` — ${cmd.description || "Commit changes"}`)
    }
    lines.push(``)
  }
  
  if (other.length > 0) {
    lines.push(`## Other`)
    for (const cmd of other) {
      lines.push(`- \`/${cmd.name}\` — ${cmd.description || "See method file"}`)
    }
  }
  
  return lines.join("\n")
}

// Export for MCP registration
export default pipelineTool