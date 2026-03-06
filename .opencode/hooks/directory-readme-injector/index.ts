/**
 * Directory README Injector Hook
 * 
 * Injects directory README.md content into file reads.
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
 * Create the directory readme injector hook.
 */
export function createDirectoryReadmeInjectorHook(
  ctx: PluginInput,
  _modelCacheState?: { anthropicContext1MEnabled: boolean }
): {
  "tool.execute.before": (input: ToolExecuteInput, output: { args: unknown }) => Promise<void>
  "tool.execute.after": (input: ToolExecuteInput, output: ToolExecuteOutput) => Promise<void>
  event: (input: { event: { type: string; properties?: unknown } }) => Promise<void>
} {
  const sessionCaches = new Map<string, Set<string>>()

  /**
   * Find README.md files in parent directories.
   */
  function findReadmeFiles(filePath: string): string[] {
    const readmeFiles: string[] = []
    const workspaceRoot = ctx.directory

    let currentDir = path.dirname(filePath)
    while (currentDir.startsWith(workspaceRoot)) {
      const readmePath = path.join(currentDir, "README.md")
      if (fs.existsSync(readmePath)) {
        readmeFiles.push(readmePath)
      }

      if (currentDir === workspaceRoot) break
      currentDir = path.dirname(currentDir)
    }

    return readmeFiles
  }

  /**
   * Inject readme content.
   */
  async function processFilePathForReadmeInjection(
    filePath: string,
    sessionID: string,
    output: ToolExecuteOutput
  ): Promise<void> {
    const cache = sessionCaches.get(sessionID) ?? new Set<string>()
    
    const readmeFiles = findReadmeFiles(filePath)
    if (readmeFiles.length === 0) return

    for (const readmePath of readmeFiles) {
      if (cache.has(readmePath)) continue

      try {
        const content = fs.readFileSync(readmePath, "utf-8")
        const truncated = content.length > 2000
          ? content.substring(0, 2000) + "\n... (truncated)"
          : content

        output.output += `\n\n## <readme-context file="${path.relative(ctx.directory, readmePath)}">\n`
        output.output += "```\n" + truncated + "\n```\n"
        output.output += "</readme-context>\n"

        cache.add(readmePath)
      } catch (err) {
        log("[directory-readme-injector] Failed to read readme", { readmePath, error: String(err) })
      }
    }

    sessionCaches.set(sessionID, cache)
  }

  const toolExecuteAfter = async (input: ToolExecuteInput, output: ToolExecuteOutput): Promise<void> => {
    if (input.tool.toLowerCase() === "read") {
      await processFilePathForReadmeInjection(output.title, input.sessionID, output)
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