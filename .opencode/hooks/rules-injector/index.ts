/**
 * Rules Injector Hook
 * 
 * Injects project rules (.cursorrules, .opencode/rules, etc.) into file read outputs.
 */

import { log } from "../../shared/logger"
import * as path from "path"
import * as fs from "fs"

interface PluginInput {
  directory: string
}

interface ToolExecuteInput {
  tool: string
  sessionID: string
  callID: string
}

interface ToolExecuteOutput {
  title: string
  output: string
  metadata: unknown
}

interface ToolExecuteBeforeOutput {
  args: unknown
}

interface EventInput {
  event: {
    type: string
    properties?: unknown
  }
}

interface RuleFile {
  path: string
  content: string
  distance: number
}

const TRACKED_TOOLS = ["read", "write", "edit", "multiedit"]

/**
 * Create the rules injector hook.
 */
export function createRulesInjectorHook(
  ctx: PluginInput,
  _modelCacheState?: { anthropicContext1MEnabled: boolean }
): {
  "tool.execute.before": (input: ToolExecuteInput, output: ToolExecuteBeforeOutput) => Promise<void>
  "tool.execute.after": (input: ToolExecuteInput, output: ToolExecuteOutput) => Promise<void>
  event: (input: EventInput) => Promise<void>
} {
  const sessionCaches = new Map<string, Set<string>>()

  /**
   * Find all rule files in the project.
   */
  function findRuleFiles(filePath: string): RuleFile[] {
    const rules: RuleFile[] = []
    const workspaceRoot = ctx.directory

    // Rule files to look for
    const ruleFileNames = [
      ".cursorrules",
      ".opencode/rules",
      "AGENTS.md",
      "CLAUDE.md",
      ".github/copilot-instructions.md",
    ]

    // Walk up from filePath to workspace root
    let currentDir = path.dirname(filePath)
    while (currentDir.startsWith(workspaceRoot)) {
      for (const ruleFile of ruleFileNames) {
        const rulePath = path.join(currentDir, ruleFile)
        if (fs.existsSync(rulePath)) {
          const relativePath = path.relative(workspaceRoot, rulePath)
          if (relativePath.startsWith("..")) continue // Outside workspace

          try {
            const content = fs.readFileSync(rulePath, "utf-8")
            rules.push({
              path: relativePath,
              content,
              distance: path.dirname(filePath).split(path.sep).length -
                       currentDir.split(path.sep).length,
            })
          } catch {
            // Silently skip unreadable files
          }
        }
      }

      if (currentDir === workspaceRoot) break
      currentDir = path.dirname(currentDir)
    }

    return rules
  }

  /**
   * Inject rules into output.
   */
  async function injectRules(
    filePath: string,
    sessionID: string,
    output: ToolExecuteOutput
  ): Promise<void> {
    const cache = sessionCaches.get(sessionID) ?? new Set<string>()

    // Skip if already injected for this path
    if (cache.has(filePath)) {
      return
    }

    const rules = findRuleFiles(filePath)
    if (rules.length === 0) {
      return
    }

    // Build injection message
    let injection = "\n\n## <injected-context>\n"
    injection += "**Project Rules (auto-injected)**\n\n"

    for (const rule of rules) {
      // Only inject if not already in cache
      if (!cache.has(rule.path)) {
        injection += `### From ${rule.path}\n\n`
        // Truncate long rules
        const truncated = rule.content.length > 2000
          ? rule.content.substring(0, 2000) + "\n... (truncated)"
          : rule.content
        injection += "```\n" + truncated + "\n```\n\n"
        cache.add(rule.path)
      }
    }

    injection += "</injected-context>\n"

    // Append to output
    output.output += injection
    cache.add(filePath)
    sessionCaches.set(sessionID, cache)

    log("[rules-injector] Injected rules", { sessionID, ruleCount: rules.length })
  }

  /**
   * Handle tool execution before.
   */
  const toolExecuteBefore = async (
    _input: ToolExecuteInput,
    _output: ToolExecuteBeforeOutput
  ): Promise<void> => {
    // No-op for before
  }

  /**
   * Handle tool execution after.
   */
  const toolExecuteAfter = async (
    input: ToolExecuteInput,
    output: ToolExecuteOutput
  ): Promise<void> => {
    const toolName = input.tool.toLowerCase()

    if (TRACKED_TOOLS.includes(toolName)) {
      const filePath = output.title // For read, title is the file path
      if (!filePath) return

      await injectRules(filePath, input.sessionID, output)
    }
  }

  /**
   * Handle events.
   */
  const event = async ({ event }: EventInput): Promise<void> => {
    const props = event.properties as Record<string, unknown> | undefined

    // Clean up on session deletion
    if (event.type === "session.deleted") {
      const sessionInfo = props?.info as { id?: string } | undefined
      if (sessionInfo?.id) {
        sessionCaches.delete(sessionInfo.id)
      }
    }

    // Clean up on compaction
    if (event.type === "session.compacted") {
      const sessionID = (props?.sessionID ?? (props?.info as { id?: string } | undefined)?.id) as string | undefined
      if (sessionID) {
        sessionCaches.delete(sessionID)
      }
    }
  }

  return {
    "tool.execute.before": toolExecuteBefore,
    "tool.execute.after": toolExecuteAfter,
    event,
  }
}