/**
 * Directory Agents Injector Hook
 * 
 * Injects directory-level AGENTS.md content into file reads.
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

/**
 * Create the directory agents injector hook.
 */
export function createDirectoryAgentsInjectorHook(
  ctx: PluginInput,
  _modelCacheState?: { anthropicContext1MEnabled: boolean }
): {
  "tool.execute.before": (input: ToolExecuteInput, output: { args: unknown }) => Promise<void>
  "tool.execute.after": (input: ToolExecuteInput, output: ToolExecuteOutput) => Promise<void>
  event: (input: { event: { type: string; properties?: unknown } }) => Promise<void>
} {
  const sessionCaches = new Map<string, Set<string>>()

  /**
   * Find AGENTS.md files in parent directories.
   */
  function findAgentsFiles(filePath: string): string[] {
    const agentsFiles: string[] = []
    const workspaceRoot = ctx.directory

    let currentDir = path.dirname(filePath)
    while (currentDir.startsWith(workspaceRoot)) {
      const agentsPath = path.join(currentDir, "AGENTS.md")
      if (fs.existsSync(agentsPath)) {
        agentsFiles.push(agentsPath)
      }

      if (currentDir === workspaceRoot) break
      currentDir = path.dirname(currentDir)
    }

    return agentsFiles
  }

  /**
   * Inject agents content.
   */
  async function processFilePathForAgentsInjection(
    filePath: string,
    sessionID: string,
    output: ToolExecuteOutput
  ): Promise<void> {
    const cache = sessionCaches.get(sessionID) ?? new Set<string>()
    
    const agentsFiles = findAgentsFiles(filePath)
    if (agentsFiles.length === 0) return

    // Only inject if not already cached
    for (const agentsPath of agentsFiles) {
      if (cache.has(agentsPath)) continue

      try {
        const content = fs.readFileSync(agentsPath, "utf-8")
        // Truncate long content
        const truncated = content.length > 3000
          ? content.substring(0, 3000) + "\n... (truncated)"
          : content

        output.output += `\n\n## <agents-context file="${path.relative(ctx.directory, agentsPath)}">\n`
        output.output += "```\n" + truncated + "\n```\n"
        output.output += "</agents-context>\n"

        cache.add(agentsPath)
      } catch (err) {
        log("[directory-agents-injector] Failed to read agents file", { agentsPath, error: String(err) })
      }
    }

    sessionCaches.set(sessionID, cache)
  }

  const toolExecuteAfter = async (input: ToolExecuteInput, output: ToolExecuteOutput): Promise<void> => {
    if (input.tool.toLowerCase() === "read") {
      await processFilePathForAgentsInjection(output.title, input.sessionID, output)
    }
  }

  const toolExecuteBefore = async (_input: ToolExecuteInput, _output: { args: unknown }): Promise<void> => {
    // No-op
  }

  const event = async ({ event }: { event: { type: string; properties?: unknown } }): Promise<void> => {
    const props = event.properties as Record<string, unknown> | undefined

    if (event.type === "session.deleted") {
      const sessionInfo = props?.info as { id?: string } | undefined
      if (sessionInfo?.id) {
        sessionCaches.delete(sessionInfo.id)
      }
    }

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