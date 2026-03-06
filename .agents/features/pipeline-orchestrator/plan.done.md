# Pipeline Orchestrator — Implementation Plan

## Feature Description

A client-side TypeScript runtime that orchestrates the AI coding system's 23 pipeline commands. The orchestrator reads handoff state, enforces valid transitions, manages artifact lifecycle, and provides a clean programmatic API for command invocation.

## User Story

As an AI agent or developer, I want to programmatically manage pipeline state so that commands execute in valid sequence and artifacts follow the `.done.md` lifecycle.

## Problem Statement

**Current State:**
- 23 pipeline commands are documented in markdown (ready as specs)
- Agent registry with 11 agents is complete (ready)
- Category routing system is complete (ready)
- Dispatch tool for model routing is ready
- Handoff file format is documented but has NO TypeScript implementation
- `.done.md` lifecycle pattern is documented but NOT implemented
- NO state machine enforcing valid transitions

**Problem:** The system has all the pieces but lacks the runtime that wires them together. Commands are method files invoked by OpenCode server, not TypeScript functions. There's no centralized state management or artifact lifecycle enforcement.

## Solution Statement

Create a TypeScript pipeline orchestrator that:
1. Reads/writes handoff state from `.agents/context/next-command.md`
2. Enforces valid state transitions (can't `/commit` before `/execute`)
3. Manages artifact lifecycle (atomic `.done.md` renaming)
4. Provides a `pipeline` tool for programmatic command invocation
5. Integrates with existing hooks system for pre/post actions

## Feature Metadata

- **Spec ID**: pipeline-orchestrator-001
- **Depth**: heavy (core infrastructure)
- **Pillar**: Runtime Infrastructure
- **Dependencies**: dispatch.ts, category-selector.ts, hooks system
- **Estimated tasks**: 8

## Context References

### Codebase Files

#### Existing Infrastructure (Ready to Use)
- `.opencode/tools/dispatch.ts` — Model routing and session management
- `.opencode/tools/delegate-task/index.ts` — Category routing exports
- `.opencode/agents/registry.ts` — Agent definitions
- `.opencode/features/skill-loader/index.ts` — Skill discovery
- `.opencode/hooks/atlas/boulder-state.ts` — Similar state file pattern
- `.opencode/hooks/todo-continuation/` — Session state management
- `.opencode/features/wisdom/storage.ts` — File I/O patterns

#### Documentation (Specs, NOT Code)
- `.opencode/commands/*.md` — Command method files (23 total)
- `.opencode/commands/validation/*.md` — Validation commands (4 total)
- `AGENTS.md` — System documentation

### Memory References
- `.agents/features/production-gap-fixes/plan.done.md` — Fixed registry sync
- `.agents/features/pipeline-hardening/plan.md` — Pipeline hardening work

### RAG References
- None needed — all context is local

## Patterns to Follow

### Pattern 1: State File I/O
From `.opencode/hooks/atlas/boulder-state.ts`:
```typescript
// Pattern: Synchronous file read/write with JSON parse
export function readBoulderState(directory: string): BoulderState | null {
  const boulderPath = path.join(directory, ".agents", "boulder", BOULDER_FILE)
  
  try {
    if (!fs.existsSync(boulderPath)) { return null }
    const content = fs.readFileSync(boulderPath, "utf-8")
    return JSON.parse(content) as BoulderState
  } catch (error) {
    log(`[atlas] Failed to read boulder state`, { directory, error: String(error) })
    return null
  }
}

export function writeBoulderState(directory: string, state: BoulderState): boolean {
  const boulderDir = path.join(directory, ".agents", "boulder")
  const boulderPath = path.join(boulderDir, BOULDER_FILE)
  
  try {
    if (!fs.existsSync(boulderDir)) {
      fs.mkdirSync(boulderDir, { recursive: true })
    }
    state.updated_at = Date.now()
    fs.writeFileSync(boulderPath, JSON.stringify(state, null, 2), "utf-8")
    return true
  } catch (error) {
    log(`[atlas] Failed to write boulder state`, { directory, error: String(error) })
    return false
  }
}
```

### Pattern 2: Async File Operations with Bun
From `.opencode/tools/dispatch.ts`:
```typescript
// Pattern: Use node:fs for file operations, abortSignal for timeouts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"

async function captureFileSnapshot(): Promise<Set<string>> {
  try {
    const proc = Bun.spawn(["git", "status", "--porcelain"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const output = await new Response(proc.stdout).text()
    await proc.exited
    // ... parse output
    return files
  } catch {
    return new Set()
  }
}
```

### Pattern 3: Hook Registration
From `.opencode/hooks/todo-continuation/index.ts`:
```typescript
// Pattern: Export factory function with typed options
export function createTodoContinuationEnforcer(
  ctx: unknown,
  options: TodoContinuationEnforcerOptions = {}
): TodoContinuationEnforcer {
  const { backgroundManager, skipAgents = DEFAULT_SKIP_AGENTS, isContinuationStopped } = options
  const sessionStateStore = createSessionStateStore()
  
  const handler = createTodoContinuationHandler({
    ctx, sessionStateStore, backgroundManager, skipAgents, isContinuationStopped
  })
  
  return { handler, markRecovering, markRecoveryComplete, cancelAllCountdowns }
}
```

## Implementation Plan

### Phase 1: Foundation — Types & State Machine
- Task 1.1: Create pipeline state types
- Task 1.2: Implement state machine with transition validation
- Task 1.3: Add handoff file reader/writer

### Phase 2: Artifact Lifecycle
- Task 2.1: Implement artifact discovery (scan for `.done.md`)
- Task 2.2: Implement atomic renaming (artifact → artifact.done.md)
- Task 2.3: Add artifact validation (check required sections)

### Phase 3: Command Router
- Task 3.1: Create command registry (parse markdown method files)
- Task 3.2: Implement command invocation (dispatch → model → response)
- Task 3.3: Add pre/post hooks integration

### Phase 4: Pipeline Tool
- Task 4.1: Create `pipeline` MCP tool interface
- Task 4.2: Implement `pipeline.run()` — execute command sequence
- Task 4.3: Implement `pipeline.status()` — read current state
- Task 4.4: Implement `pipeline.advance()` — transition state
- Task 4.5: Add crash recovery (resume from handoff)

### Phase 5: Integration
- Task 5.1: Integrate with existing hooks system
- Task 5.2: Add telemetry/logging
- Task 5.3: Write comprehensive tests

## Step-by-Step Tasks

### Task 1: Create Pipeline State Types
- **ACTION**: CREATE
- **TARGET**: `.opencode/pipeline/types.ts`
- **IMPLEMENT**: 
  Define TypeScript types for pipeline state machine:
  ```typescript
  // All valid pipeline statuses
  export type PipelineStatus =
    | "awaiting-execution"
    | "executing-tasks"
    | "executing-series"
    | "awaiting-review"
    | "awaiting-fixes"
    | "awaiting-re-review"
    | "ready-to-commit"
    | "ready-for-pr"
    | "pr-open"
    | "blocked"

  // Handoff file structure (mirrors .agents/context/next-command.md)
  export interface PipelineHandoff {
    lastCommand: string
    feature: string
    nextCommand: string
    masterPlan?: string
    phaseProgress?: { current: number; total: number }
    taskProgress?: { completed: number; total: number }
    timestamp: string
    status: PipelineStatus
    notes?: string
    taskIndex?: TaskIndexEntry[]
  }

  export interface TaskIndexEntry {
    task: number
    briefPath: string
    scope: string
    status: "pending" | "in_progress" | "done" | "blocked"
    files?: string[]
  }

  // State transition result
  export interface TransitionResult {
    success: boolean
    from: PipelineStatus
    to: PipelineStatus
    error?: string
    handoff?: PipelineHandoff
  }
  ```
- **PATTERN**: Follow `.opencode/agents/types.ts` structure for type exports
- **IMPORTS**: None
- **GOTCHA**: Status values MUST match AGENTS.md documentation exactly
- **VALIDATE**: `npx tsc --noEmit`.agents/features/pipeline-orchestrator

### Task 2: Implement State Machine with Transition Validation
- **ACTION**: CREATE
- **TARGET**: `.opencode/pipeline/state-machine.ts`
- **IMPLEMENT**:
  Define valid transitions and validation logic:
  ```typescript
  import type { PipelineStatus, TransitionResult } from "./types"

  // Valid state transitions: { from: [valid to states] }
  const VALID_TRANSITIONS: Record<PipelineStatus, PipelineStatus[]> = {
    "awaiting-execution": ["executing-tasks", "executing-series", "blocked"],
    "executing-tasks": ["awaiting-review", "executing-tasks", "blocked"],
    "executing-series": ["awaiting-review", "executing-series", "blocked"],
    "awaiting-review": ["awaiting-fixes", "ready-to-commit"],
    "awaiting-fixes": ["awaiting-re-review", "awaiting-fixes", "blocked"],
    "awaiting-re-review": ["ready-to-commit", "awaiting-fixes", "blocked"],
    "ready-to-commit": ["ready-for-pr", "blocked"],
    "ready-for-pr": ["pr-open", "blocked"],
    "pr-open": [], // Terminal state
    "blocked": ["awaiting-execution", "executing-tasks", "awaiting-review", "ready-to-commit"], // Can resume from any
  }

  export function canTransition(from: PipelineStatus, to: PipelineStatus): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false
  }

  export function validateTransition(from: PipelineStatus, to: PipelineStatus): TransitionResult {
    if (canTransition(from, to)) {
      return { success: true, from, to }
    }
    return {
      success: false,
      from,
      to,
      error: `Invalid transition: ${from} → ${to}. Valid transitions from ${from}: ${VALID_TRANSITIONS[from]?.join(", ") || "none"}`
    }
  }

  export function getValidNextStates(current: PipelineStatus): PipelineStatus[] {
    return VALID_TRANSITIONS[current] ?? []
  }

  // Command to state mapping
  export const COMMAND_TARGET_STATES: Record<string, PipelineStatus> = {
    "/planning": "awaiting-execution",
    "/execute": "executing-tasks", // or executing-series based on plan type
    "/code-loop": "awaiting-review", // transitions internally to ready-to-commit
    "/code-review": "awaiting-fixes",
    "/code-review-fix": "awaiting-re-review",
    "/commit": "ready-for-pr",
    "/pr": "pr-open",
  }
  ```
- **PATTERN**: Follow `.opencode/hooks/atlas/boulder-state.ts` pattern for state files
- **IMPORTS**: `import type { PipelineStatus, TransitionResult } from "./types"`
- **GOTCHA**: "blocked" is a special state that allows resuming from the blocked point
- **VALIDATE**: `npx tsc --noEmit`

### Task 3: Implement Handoff File Reader/Writer
- **ACTION**: CREATE
- **TARGET**: `.opencode/pipeline/handoff.ts`
- **IMPLEMENT**:
  ```typescript
  import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"
  import { join } from "node:path"
  import type { PipelineHandoff, PipelineStatus } from "./types"

  const HANDOFF_FILE = "next-command.md"
  const CONTEXT_DIR = ".agents/context"

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

  export function writeHandoff(workspaceDir: string, handoff: PipelineHandoff): boolean {
    const contextDir = join(workspaceDir, CONTEXT_DIR)
    const handoffPath = join(contextDir, HANDOFF_FILE)
    
    try {
      if (!existsSync(contextDir)) {
        mkdirSync(contextDir, { recursive: true })
      }
      
      handoff.timestamp = new Date().toISOString()
      const content = serializeHandoffMarkdown(handoff)
      writeFileSync(handoffPath, content, "utf-8")
      return true
    } catch (error) {
      console.error(`[pipeline] Failed to write handoff file:`, error)
      return false
    }
  }

  function parseHandoffMarkdown(content: string): PipelineHandoff {
    // Parse markdown frontmatter and list items
    const lines = content.split("\n")
    const handoff: Partial<PipelineHandoff> = {}
    const taskIndex: TaskIndexEntry[] = []
    
    for (const line of lines) {
      if (line.startsWith("- **Last Command**:")) {
        handoff.lastCommand = line.split(":").slice(1).join(":").trim()
      } else if (line.startsWith("- **Feature**:")) {
        handoff.feature = line.split(":").slice(1).join(":").trim()
      } else if (line.startsWith("- **Next Command**:")) {
        handoff.nextCommand = line.split(":").slice(1).join(":").trim()
      } else if (line.startsWith("- **Status**:")) {
        handoff.status = line.split(":").slice(1).join(":").trim() as PipelineStatus
      }
      // ... parse other fields
    }
    
    return handoff as PipelineHandoff
  }

  function serializeHandoffMarkdown(handoff: PipelineHandoff): string {
    const lines = [
      "# Pipeline Handoff",
      "<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->",
      "",
      `- **Last Command**: ${handoff.lastCommand}`,
      `- **Feature**: ${handoff.feature}`,
      `- **Next Command**: ${handoff.nextCommand}`,
      `- **Timestamp**: ${handoff.timestamp}`,
      `- **Status**: ${handoff.status}`,
    ]
    
    if (handoff.taskProgress) {
      lines.push(`- **Task Progress**: ${handoff.taskProgress.completed}/${handoff.taskProgress.total} complete`)
    }
    
    if (handoff.masterPlan) {
      lines.push(`- **Master Plan**: ${handoff.masterPlan}`)
    }
    
    if (handoff.phaseProgress) {
      lines.push(`- **Phase Progress**: ${handoff.phaseProgress.current}/${handoff.phaseProgress.total} complete`)
    }
    
    // ... add task index if present
    
    return lines.join("\n")
  }
  ```
- **PATTERN**: Mirror `.opencode/features/wisdom/storage.ts` file I/O patterns
- **IMPORTS**: `import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs"`
- **GOTCHA**: Must create `.agents/context/` directory if it doesn't exist
- **VALIDATE**: Unit tests for parse/serialize roundtrip

### Task 4: Implement Artifact Discovery
- **ACTION**: CREATE
- **TARGET**: `.opencode/pipeline/artifacts.ts`
- **IMPLEMENT**:
  ```typescript
  import { readdirSync, existsSync, statSync, renameSync } from "node:fs"
  import { join, basename } from "node:path"

  export interface ArtifactInfo {
    path: string
    name: string
    type: ArtifactType
    status: ArtifactStatus
    feature: string
  }

  export type ArtifactType = 
    | "plan"
    | "plan-master"
    | "task"
    | "plan-phase"
    | "report"
    | "review"
    | "loop-report"
    | "fixes"

  export type ArtifactStatus = "pending" | "done" | "blocked"

  const ARTIFACTS_DIR = ".agents/features"

  export function discoverArtifacts(workspaceDir: string, feature: string): ArtifactInfo[] {
    const featureDir = join(workspaceDir, ARTIFACTS_DIR, feature)
    
    if (!existsSync(featureDir)) {
      return []
    }
    
    const entries = readdirSync(featureDir, { withFileTypes: true })
    const artifacts: ArtifactInfo[] = []
    
    for (const entry of entries) {
      if (!entry.isFile()) continue
      if (!entry.name.endsWith(".md") && !entry.name.endsWith(".done.md")) continue
      
      const artifact = parseArtifactName(entry.name, feature)
      if (artifact) {
        artifacts.push(artifact)
      }
    }
    
    return artifacts.sort((a, b) => a.name.localeCompare(b.name))
  }

  export function getPendingArtifacts(artifacts: ArtifactInfo[]): ArtifactInfo[] {
    return artifacts.filter(a => a.status === "pending")
  }

  export function getDoneArtifacts(artifacts: ArtifactInfo[]): ArtifactInfo[] {
    return artifacts.filter(a => a.status === "done")
  }

  export function markArtifactDone(workspaceDir: string, artifact: ArtifactInfo): boolean {
    const sourcePath = artifact.path
    const donePath = sourcePath.replace(/\.md$/, ".done.md")
    
    try {
      renameSync(sourcePath, donePath)
      return true
    } catch (error) {
      console.error(`[pipeline] Failed to mark artifact done:`, error)
      return false
    }
  }

  function parseArtifactName(filename: string, feature: string): ArtifactInfo | null {
    // task-1.md → { type: "task", name: "task-1", status: "pending" }
    // task-1.done.md → { type: "task", name: "task-1", status: "done" }
    // plan.md → { type: "plan", name: "plan", status: "pending" }
    
    const isDone = filename.endsWith(".done.md")
    const baseName = isDone ? filename.replace(/\.done\.md$/, "") : filename.replace(/\.md$/, "")
    
    let type: ArtifactType | null = null
    
    if (baseName === "plan") type = "plan"
    else if (baseName === "plan-master") type = "plan-master"
    else if (baseName.startsWith("task-")) type = "task"
    else if (baseName.startsWith("plan-phase-")) type = "plan-phase"
    else if (baseName === "report") type = "report"
    else if (baseName.startsWith("review-")) type = "review"
    else if (baseName.startsWith("loop-report-")) type = "loop-report"
    else if (baseName.startsWith("fixes-")) type = "fixes"
    else return null
    
    return {
      path: join(ARTIFACTS_DIR, feature, filename),
      name: baseName,
      type,
      status: isDone ? "done" : "pending",
      feature,
    }
  }
  ```
- **PATTERN**: Mirror `.opencode/features/wisdom/storage.ts` for file discovery
- **IMPORTS**: `import { readdirSync, existsSync, renameSync } from "node:fs"`
- **GOTCHA**: `.done.md` renaming is APPENDING `.done`, not replacing `.md`
- **VALIDATE**: Unit tests for artifact discovery and parsing

### Task 5: Create Command Registry
- **ACTION**: CREATE
- **TARGET**: `.opencode/pipeline/commands.ts`
- **IMPLEMENT**:
  ```typescript
  import { readFileSync, existsSync } from "node:fs"
  import { join } from "node:path"
  import type { PipelineStatus } from "./types"
  import { COMMAND_TARGET_STATES } from "./state-machine"

  export interface CommandInfo {
    name: string
    description: string
    model: string
    targetStatus?: PipelineStatus
    methodPath: string
  }

  const COMMANDS_DIR = ".opencode/commands"
  const CLAUDE_COMMANDS_DIR = ".claude/commands"

  export function loadCommand(commandName: string, workspaceDir: string): CommandInfo | null {
    // Try .opencode/commands first, then .claude/commands
    const opencodePath = join(workspaceDir, COMMANDS_DIR, `${commandName}.md`)
    const claudePath = join(workspaceDir, CLAUDE_COMMANDS_DIR, `${commandName}.md`)
    
    const methodPath = existsSync(opencodePath) ? opencodePath 
                      : existsSync(claudePath) ? claudePath 
                      : null
    
    if (!methodPath) {
      return null
    }
    
    try {
      const content = readFileSync(methodPath, "utf-8")
      const frontmatter = parseFrontmatter(content)
      
      return {
        name: commandName,
        description: frontmatter.description || "",
        model: frontmatter.model || "",
        targetStatus: COMMAND_TARGET_STATES[`/${commandName}`],
        methodPath,
      }
    } catch (error) {
      console.error(`[pipeline] Failed to load command ${commandName}:`, error)
      return null
    }
  }

  export function listCommands(workspaceDir: string): CommandInfo[] {
    const commands: CommandInfo[] = []
    
    const opencodeDir = join(workspaceDir, COMMANDS_DIR)
    if (existsSync(opencodeDir)) {
      const entries = readdirSync(opencodeDir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".md")) {
          const name = entry.name.replace(/\.md$/, "")
          const cmd = loadCommand(name, workspaceDir)
          if (cmd) commands.push(cmd)
        }
      }
    }
    
    return commands
  }

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
  ```
- **PATTERN**: Mirror `.opencode/features/skill-loader/index.ts` for file discovery
- **IMPORTS**: `import { readFileSync, readdirSync, existsSync } from "node:fs"`
- **GOTCHA**: Commands may be in `.opencode/commands/` OR `.claude/commands/`
- **VALIDATE**: `npx tsc --noEmit`

### Task 6: Create Pipeline Tool (MCP Interface)
- **ACTION**: CREATE
- **TARGET**: `.opencode/tools/pipeline.ts`
- **IMPLEMENT**:
  ```typescript
  import { tool } from "@opencode-ai/plugin"
  import { readHandoff, writeHandoff } from "../pipeline/handoff"
  import { discoverArtifacts, markArtifactDone } from "../pipeline/artifacts"
  import { validateTransition, getValidNextStates } from "../pipeline/state-machine"
  import { loadCommand } from "../pipeline/commands"
  import type { PipelineStatus, PipelineHandoff } from "../pipeline/types"

  export default tool({
    description: "Pipeline orchestrator for AI coding workflow. Commands: status, next, advance, artifacts, run.",
    
    args: {
      command: tool.schema.string().describe(
        "Command to execute: status (read handoff), next (get next state), " +
        "advance (transition state), artifacts (list artifacts), run (execute command sequence)"
      ),
      feature: tool.schema.string().optional().describe("Feature name (e.g., 'auth-system')"),
      status: tool.schema.string().optional().describe("Target status for advance command"),
      commandSequence: tool.schema.array(tool.schema.string()).optional()
        .describe("Commands to run (e.g., ['/planning', '/execute'])"),
    },
    
    async execute(args, context) {
      const workspaceDir = process.cwd() // or from context
      
      switch (args.command) {
        case "status": {
          const handoff = readHandoff(workspaceDir)
          if (!handoff) {
            return "# Pipeline Status\n\nNo handoff file found. Start with `/planning`."
          }
          return formatHandoff(handoff)
        }
        
        case "next": {
          const handoff = readHandoff(workspaceDir)
          if (!handoff) {
            return "# No Active Pipeline\n\nStart with `/planning`."
          }
          const validStates = getValidNextStates(handoff.status)
          return `# Valid Next States\n\nFrom: **${handoff.status}**\n\nValid transitions:\n${validStates.map(s => `- ${s}`).join("\n")}`
        }
        
        case "advance": {
          if (!args.status) {
            return "# Error\n\n`status` argument required for advance command."
          }
          
          const handoff = readHandoff(workspaceDir)
          if (!handoff) {
            return "# Error\n\nNo handoff file found. Start with `/planning`."
          }
          
          const result = validateTransition(handoff.status, args.status as PipelineStatus)
          if (!result.success) {
            return `# Transition Failed\n\n${result.error}`
          }
          
          const updated: PipelineHandoff = {
            ...handoff,
            status: args.status as PipelineStatus,
          }
          
          if (writeHandoff(workspaceDir, updated)) {
            return `# State Advanced\n\n${handoff.status} → ${args.status}\n\nRun \`/prime\` to continue.`
          }
          
          return "# Error\n\nFailed to write handoff file."
        }
        
        case "artifacts": {
          if (!args.feature) {
            return "# Error\n\n`feature` argument required for artifacts command."
          }
          
          const artifacts = discoverArtifacts(workspaceDir, args.feature)
          if (artifacts.length === 0) {
            return `# No Artifacts\n\nNo artifacts found for feature: ${args.feature}`
          }
          
          const pending = artifacts.filter(a => a.status === "pending")
          const done = artifacts.filter(a => a.status === "done")
          
          return `# Artifacts for ${args.feature}\n\n## Pending (${pending.length})\n${pending.map(a => `- ${a.name}`).join("\n") || "None"}\n\n## Done (${done.length})\n${done.map(a => `- ${a.name}`).join("\n") || "None"}`
        }
        
        case "run": {
          // This would dispatch commands via the dispatch tool
          // For now, return instructions
          if (!args.commandSequence || args.commandSequence.length === 0) {
            return "# Error\n\n`commandSequence` argument required for run command."
          }
          
          return `# Run Command Sequence\n\nCommands: ${args.commandSequence.join(" → ")}\n\nThis feature requires integration with dispatch tool. For now, run commands manually.`
        }
        
        default:
          return `# Unknown Command\n\nUnknown command: ${args.command}\n\nValid commands: status, next, advance, artifacts, run`
      }
    }
  })

  function formatHandoff(handoff: PipelineHandoff): string {
    return `# Pipeline Status

- **Feature**: ${handoff.feature}
- **Status**: ${handoff.status}
- **Last Command**: ${handoff.lastCommand}
- **Next Command**: ${handoff.nextCommand}
- **Timestamp**: ${handoff.timestamp}

${handoff.notes ? `\n**Notes**: ${handoff.notes}` : ""}

${handoff.taskProgress ? `\n**Task Progress**: ${handoff.taskProgress.completed}/${handoff.taskProgress.total} tasks complete` : ""}

${handoff.phaseProgress ? `\n**Phase Progress**: ${handoff.phaseProgress.current}/${handoff.phaseProgress.total} phases complete` : ""}`
  }
  ```
- **PATTERN**: Mirror `.opencode/tools/dispatch.ts` tool structure
- **IMPORTS**: `import { tool } from "@opencode-ai/plugin"`, plus pipeline modules
- **GOTCHA**: The "run" command is complex — start with status/advance/artifacts, defer run for Phase 5
- **VALIDATE**: `npx tsc --noEmit` + unit tests

### Task 7: Integrate Pipeline Tool with Hooks
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/pipeline-hook/index.ts`
- **IMPLEMENT**:
  ```typescript
  /**
   * Pipeline Hook - Injects handoff status into context
   * 
   * Reads handoff file and injects pending work reminder
   * Fires on session start to surface "what to do next"
   */
  import type { PluginContext } from "@opencode-ai/plugin"
  import { readHandoff } from "../../pipeline/handoff"
  import { getValidNextStates } from "../../pipeline/state-machine"

  export function createPipelineHook(ctx: PluginContext) {
    return {
      name: "pipeline-handoff",
      priority: 90, // After context load, before agent logic
      
      async onSessionStart(sessionId: string) {
        const workspaceDir = process.cwd()
        const handoff = readHandoff(workspaceDir)
        
        if (!handoff) {
          return null // No pending work
        }
        
        // Inject pending work reminder
        return {
          type: "system-reminder",
          content: `
[PIPELINE HANDOFF] Pending work detected:

- **Feature**: ${handoff.feature}
- **Status**: ${handoff.status}
- **Next Command**: ${handoff.nextCommand}
- **Last Command**: ${handoff.lastCommand}

Valid next states: ${getValidNextStates(handoff.status).join(", ")}

Run \`/prime\` to load context and continue.
          `.trim(),
        }
      },
      
      async onCommandComplete(sessionId: string, command: string, result: unknown) {
        // After certain commands complete, update handoff
        // This is called by the OpenCode server after a command finishes
        // We can hook in to auto-update the handoff based on command result
        
        // Implementation depends on how commands return results
        // For MVP, rely on manual state transitions via pipeline.advance()
        return null
      },
    }
  }
  ```
- **PATTERN**: Mirror `.opencode/hooks/todo-continuation/index.ts` hook structure
- **IMPORTS**: `import { readHandoff } from "../../pipeline/handoff"`
- **GOTCHA**: Hook priority must be AFTER context load (90) but BEFORE agent logic
- **VALIDATE**: Integration tests with actual OpenCode sessions

### Task 8: Write Comprehensive Tests
- **ACTION**: CREATE
- **TARGET**: `.opencode/tests/integration/pipeline.test.ts`
- **IMPLEMENT**:
  ```typescript
  import { describe, it, expect, beforeEach, afterEach } from "bun:test"
  import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs"
  import { join } from "node:path"
  import { readHandoff, writeHandoff } from "../../pipeline/handoff"
  import { discoverArtifacts, markArtifactDone } from "../../pipeline/artifacts"
  import { validateTransition, getValidNextStates } from "../../pipeline/state-machine"
  import { loadCommand } from "../../pipeline/commands"

  describe("Pipeline State Machine", () => {
    it("should allow valid transitions", () => {
      expect(validateTransition("awaiting-execution", "executing-tasks").success).toBe(true)
      expect(validateTransition("awaiting-review", "ready-to-commit").success).toBe(true)
      expect(validateTransition("ready-for-pr", "pr-open").success).toBe(true)
    })
    
    it("should reject invalid transitions", () => {
      expect(validateTransition("awaiting-execution", "pr-open").success).toBe(false)
      expect(validateTransition("pr-open", "awaiting-execution").success).toBe(false)
    })
    
    it("should allow recovery from blocked state", () => {
      expect(validateTransition("blocked", "awaiting-execution").success).toBe(true)
      expect(validateTransition("blocked", "executing-tasks").success).toBe(true)
    })
  })

  describe("Handoff File I/O", () => {
    const testDir = join(process.cwd(), ".test-handoff")
    
    beforeEach(() => {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true })
      mkdirSync(join(testDir, ".agents", "context"), { recursive: true })
    })
    
    afterEach(() => {
      if (existsSync(testDir)) rmSync(testDir, { recursive: true })
    })
    
    it("should read and write handoff files", () => {
      const handoff = {
        lastCommand: "/execute",
        feature: "test-feature",
        nextCommand: "/code-loop test-feature",
        timestamp: new Date().toISOString(),
        status: "awaiting-review" as const,
      }
      
      expect(writeHandoff(testDir, handoff)).toBe(true)
      
      const read = readHandoff(testDir)
      expect(read).not.toBeNull()
      expect(read?.feature).toBe("test-feature")
      expect(read?.status).toBe("awaiting-review")
    })
    
    it("should return null for missing handoff", () => {
      const read = readHandoff(testDir)
      expect(read).toBeNull()
    })
  })

  describe("Artifact Discovery", () => {
    const testDir = join(process.cwd(), ".test-artifacts")
    const feature = "test-feature"
    
    beforeEach(() => {
      const featureDir = join(testDir, ".agents", "features", feature)
      if (existsSync(featureDir)) rmSync(join(testDir, ".agents"), { recursive: true })
      mkdirSync(featureDir, { recursive: true })
      
      // Create test artifacts
      writeFileSync(join(featureDir, "plan.md"), "")
      writeFileSync(join(featureDir, "task-1.md"), "")
      writeFileSync(join(featureDir, "task-2.done.md"), "")
    })
    
    afterEach(() => {
      if (existsSync(join(testDir, ".agents"))) {
        rmSync(join(testDir, ".agents"), { recursive: true })
      }
    })
    
    it("should discover artifacts", () => {
      const artifacts = discoverArtifacts(testDir, feature)
      expect(artifacts.length).toBe(3)
      expect(artifacts.find(a => a.name === "plan")?.status).toBe("pending")
      expect(artifacts.find(a => a.name === "task-1")?.status).toBe("pending")
      expect(artifacts.find(a => a.name === "task-2")?.status).toBe("done")
    })
    
    it("should mark artifact as done", () => {
      const artifacts = discoverArtifacts(testDir, feature)
      const task1 = artifacts.find(a => a.name === "task-1")!
      
      expect(markArtifactDone(testDir, task1)).toBe(true)
      
      const updated = discoverArtifacts(testDir, feature)
      expect(updated.find(a => a.name === "task-1")?.status).toBe("done")
    })
  })
  ```
- **PATTERN**: Mirror `.opencode/tests/integration/agent-resolution.test.ts` structure
- **IMPORTS**: `import { describe, it, expect } from "bun:test"`
- **GOTCHA**: Tests MUST clean up temporary directories
- **VALIDATE**: `bun test .opencode/tests/integration/pipeline.test.ts`

## Testing Strategy

### Unit Tests
- `.opencode/tests/integration/pipeline.test.ts`: State machine, handoff I/O, artifact discovery

### Integration Tests
- Create a test feature directory with various artifact states
- Test handoff file read/write cycle
- Test state transitions via pipeline.advance()

### Edge Cases
- Missing handoff file (should return null, not error)
- Corrupted handoff file (should log error, return null)
- Invalid state transition (should return error message, not throw)
- Artifact rename race condition (should handle gracefully)
- Commands directory not found (should search both locations)

## Validation Commands

```bash
# L1: Lint
npx biome check .opencode/pipeline/

# L2: Types
npx tsc --noEmit

# L3: Unit Tests
bun test .opencode/tests/integration/pipeline.test.ts

# L4: Integration Tests
bun test .opencode/tests/integration/pipeline-integration.test.ts

# L5: Manual
# Run /prime in a test workspace with handoff file
# Verify handoff status is displayed
# Run pipeline.advance to test transitions
```

## Acceptance Criteria

### Implementation
- [ ] Pipeline state machine enforces all valid transitions
- [ ] Handoff file read/write is atomic and handles missing files
- [ ] Artifact discovery correctly identifies `.done.md` status
- [ ] State transitions log errors without throwing
- [ ] Commands can be loaded from both `.opencode/commands/` and `.claude/commands/`

### Runtime
- [ ] `pipeline.status` returns current handoff state
- [ ] `pipeline.next` returns valid transitions
- [ ] `pipeline.advance` updates handoff file atomically
- [ ] `pipeline.artifacts` lists pending/done artifacts for a feature
- [ ] Pipeline hook surfaces pending work on session start

### Integration
- [ ] Hook integrates with existing hook system
- [ ] Pipeline tool integrates with OpenCode MCP server
- [ ] No conflicts with existing tools (dispatch, category-selector)

## Completion Checklist
- [ ] All 8 tasks implemented
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Handoff file can be read/written via pipeline tool
- [ ] State transitions validated
- [ ] Artifact discovery works for test feature
- [ ] Pipeline hook surfaces pending work in test session

## Notes

### Key Decisions
1. **Synchronous file I/O**: Use `node:fs` sync methods for simplicity. State file is small (<10KB), async doesn't provide meaningful benefit.
2. **No database**: Stick with file-based state for portability and crash recovery. `.done.md` pattern is already documented.
3. **Tool-first approach**: Implement `pipeline` tool before full orchestration. Commands can be invoked step-by-step via pipeline status/advance.
4. **Defer command invocation**: `pipeline.run` is complex — requires dispatch integration. Start with state management first.

### Risks
- **Concurrent access**: Multiple sessions could write handoff simultaneously. File locking not trivial on all platforms. Mitigation: Document single-session assumption.
- **Artifact corruption**: If `.done.md` rename fails mid-write, state could be inconsistent. Mitigation: Validate artifacts on read, allow manual recovery.
- **Hook ordering**: Pipeline hook must fire at correct priority. Mitigation: Extensive testing with existing hooks.

### Confidence
- **8/10** for one-pass success. Architecture is clear, patterns exist in codebase. Risk is integration with OpenCode server and hook ordering.