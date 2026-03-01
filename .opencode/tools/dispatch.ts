import { tool } from "@opencode-ai/plugin"

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENCODE_URL = "http://127.0.0.1:4096"
const TEXT_TIMEOUT_MS = 120_000      // 2 min — text mode (reviews, analysis)
const AGENT_TIMEOUT_MS = 300_000     // 5 min — agent mode (default)
const AGENT_LONG_TIMEOUT_MS = 900_000 // 15 min — agent mode (planning, execution)
const CASCADE_TIMEOUT_MS = 30_000    // 30 sec — per cascade attempt (text mode)
const COMMAND_TIMEOUT_MS = 600_000   // 10 min — command mode (full command execution)
const HEALTH_TIMEOUT_MS = 5_000
const ARCHIVE_AFTER_DAYS = 3
const ARCHIVE_AFTER_MS = ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000
const MAX_ARCHIVE_PER_RUN = 10

// ============================================================================
// TYPES
// ============================================================================

type DispatchMode = "text" | "agent" | "command"

interface ModelRoute {
  provider: string
  model: string
  label: string
}

interface CascadeRoute {
  type: "cascade"
  models: ModelRoute[]
}

interface DispatchResult {
  text: string
  provider: string
  model: string
  label: string
  mode: DispatchMode
  latencyMs: number
  sessionId: string
  cascadeAttempts?: number
}

interface SessionInfo {
  id: string
  title?: string
  parentID?: string
  time?: {
    created: number
    updated: number
    archived?: number
  }
}

// ============================================================================
// TASK TYPE ROUTING TABLE
// ============================================================================

// Authoritative routing from model-strategy.md
// Each taskType → specific provider/model (or cascade for T0)

const TASK_ROUTES: Record<string, ModelRoute | CascadeRoute> = {
  // ── T1a: Fast (Bailian) ──
  "boilerplate":          { provider: "bailian-coding-plan-test", model: "qwen3-coder-next", label: "QWEN3-CODER-NEXT" },
  "simple-fix":           { provider: "bailian-coding-plan-test", model: "qwen3-coder-next", label: "QWEN3-CODER-NEXT" },
  "quick-check":          { provider: "bailian-coding-plan-test", model: "qwen3-coder-next", label: "QWEN3-CODER-NEXT" },
  "general-opinion":      { provider: "bailian-coding-plan-test", model: "qwen3-coder-next", label: "QWEN3-CODER-NEXT" },
  "pre-commit-analysis":  { provider: "bailian-coding-plan-test", model: "qwen3-coder-next", label: "QWEN3-CODER-NEXT" },

  // ── T1b: Code (Bailian) ──
  "test-scaffolding":     { provider: "bailian-coding-plan-test", model: "qwen3-coder-plus", label: "QWEN3-CODER-PLUS" },
  "test-generation":      { provider: "bailian-coding-plan-test", model: "qwen3-coder-plus", label: "QWEN3-CODER-PLUS" },
  "logic-verification":   { provider: "bailian-coding-plan-test", model: "qwen3-coder-plus", label: "QWEN3-CODER-PLUS" },
  "api-analysis":         { provider: "bailian-coding-plan-test", model: "qwen3-coder-plus", label: "QWEN3-CODER-PLUS" },
  "code-quality-review":  { provider: "bailian-coding-plan-test", model: "qwen3-coder-plus", label: "QWEN3-CODER-PLUS" },

  // ── T1c: Complex (Bailian) ──
  "complex-codegen":      { provider: "bailian-coding-plan-test", model: "qwen3.5-plus", label: "QWEN3.5-PLUS" },
  "complex-fix":          { provider: "bailian-coding-plan-test", model: "qwen3.5-plus", label: "QWEN3.5-PLUS" },
  "research":             { provider: "bailian-coding-plan-test", model: "qwen3.5-plus", label: "QWEN3.5-PLUS" },
  "architecture":         { provider: "bailian-coding-plan-test", model: "qwen3.5-plus", label: "QWEN3.5-PLUS" },
  "library-comparison":   { provider: "bailian-coding-plan-test", model: "qwen3.5-plus", label: "QWEN3.5-PLUS" },
  "pattern-scan":         { provider: "bailian-coding-plan-test", model: "qwen3.5-plus", label: "QWEN3.5-PLUS" },
  "execution":            { provider: "bailian-coding-plan-test", model: "qwen3.5-plus", label: "QWEN3.5-PLUS" },

  // ── T1d: Long Context (Bailian) ──
  "docs-lookup":          { provider: "bailian-coding-plan-test", model: "kimi-k2.5", label: "KIMI-K2.5" },
  "long-context-review":  { provider: "bailian-coding-plan-test", model: "kimi-k2.5", label: "KIMI-K2.5" },

  // ── T1e: Prose (Bailian) ──
  "docs-generation":      { provider: "bailian-coding-plan-test", model: "minimax-m2.5", label: "MINIMAX-M2.5" },
  "docstring-generation": { provider: "bailian-coding-plan-test", model: "minimax-m2.5", label: "MINIMAX-M2.5" },
  "changelog-generation": { provider: "bailian-coding-plan-test", model: "minimax-m2.5", label: "MINIMAX-M2.5" },

  // ── T0: Planning (Cascade: FREE → PAID) ──
  "planning": {
    type: "cascade",
    models: [
      { provider: "ollama-cloud", model: "kimi-k2-thinking", label: "KIMI-K2-THINKING" },
      { provider: "ollama-cloud", model: "cogito-2.1:671b", label: "COGITO-2.1" },
      { provider: "bailian-coding-plan-test", model: "qwen3-max-2026-01-23", label: "QWEN3-MAX" },
      { provider: "anthropic", model: "claude-opus-4-5", label: "CLAUDE-OPUS-4-5" },
    ],
  },

  // ── T1f: Reasoning (Bailian) ──
  "deep-plan-review":     { provider: "bailian-coding-plan-test", model: "qwen3-max-2026-01-23", label: "QWEN3-MAX" },
  "complex-reasoning":    { provider: "bailian-coding-plan-test", model: "qwen3-max-2026-01-23", label: "QWEN3-MAX" },

  // ── T2a: Thinking Review (ZAI) ──
  "thinking-review":      { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
  "first-validation":     { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
  "code-review":          { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
  "security-review":      { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
  "plan-review":          { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
  "logic-review":         { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },

  // ── T2b: Flagship (ZAI) ──
  "architecture-audit":   { provider: "zai-coding-plan", model: "glm-4.5", label: "GLM-4.5" },
  "design-review":        { provider: "zai-coding-plan", model: "glm-4.5", label: "GLM-4.5" },

  // ── T2c: Standard (ZAI) ──
  "regression-check":     { provider: "zai-coding-plan", model: "glm-4.7", label: "GLM-4.7" },
  "compatibility-check":  { provider: "zai-coding-plan", model: "glm-4.7", label: "GLM-4.7" },

  // ── T2d: Flash (ZAI) ──
  "style-review":         { provider: "zai-coding-plan", model: "glm-4.7-flash", label: "GLM-4.7-FLASH" },
  "quick-style-check":    { provider: "zai-coding-plan", model: "glm-4.7-flash", label: "GLM-4.7-FLASH" },

  // ── T2e: Ultrafast (ZAI) ──
  "fast-review":          { provider: "zai-coding-plan", model: "glm-4.7-flashx", label: "GLM-4.7-FLASHX" },
  "ultra-fast-check":     { provider: "zai-coding-plan", model: "glm-4.7-flashx", label: "GLM-4.7-FLASHX" },

  // ── T3: Second Validation (Ollama Cloud) ──
  "second-validation":    { provider: "ollama-cloud", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
  "deep-research":        { provider: "ollama-cloud", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
  "independent-review":   { provider: "ollama-cloud", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
  "architecture-review":  { provider: "ollama-cloud", model: "kimi-k2:1t", label: "KIMI-K2" },
  "deep-code-review":     { provider: "ollama-cloud", model: "deepseek-v3.1:671b", label: "DEEPSEEK-V3.1" },
  "reasoning-review":     { provider: "ollama-cloud", model: "cogito-2.1:671b", label: "COGITO-2.1" },
  "test-review":          { provider: "ollama-cloud", model: "devstral-2:123b", label: "DEVSTRAL-2" },
  "multi-review":         { provider: "ollama-cloud", model: "gemini-3-pro-preview", label: "GEMINI-3-PRO" },
  "fast-second-opinion":  { provider: "ollama-cloud", model: "gemini-3-flash-preview", label: "GEMINI-3-FLASH" },
  "heavy-codegen":        { provider: "ollama-cloud", model: "mistral-large-3:675b", label: "MISTRAL-LARGE-3" },
  "big-code-review":      { provider: "ollama-cloud", model: "qwen3-coder:480b", label: "QWEN3-CODER-480B" },
  "thinking-second":      { provider: "ollama-cloud", model: "kimi-k2-thinking", label: "KIMI-K2-THINKING" },
  "plan-critique":        { provider: "ollama-cloud", model: "qwen3.5:397b", label: "QWEN3.5-397B" },

  // ── T4: Paid Review Gate ──
  "codex-review":         { provider: "openai", model: "gpt-5.3-codex", label: "GPT-5.3-CODEX" },
  "codex-validation":     { provider: "openai", model: "gpt-5.3-codex", label: "GPT-5.3-CODEX" },
  "sonnet-45-review":     { provider: "anthropic", model: "claude-sonnet-4-5", label: "CLAUDE-SONNET-4-5" },
  "sonnet-46-review":     { provider: "anthropic", model: "claude-sonnet-4-6", label: "CLAUDE-SONNET-4-6" },

  // ── T5: Final Review ──
  "final-review":         { provider: "anthropic", model: "claude-sonnet-4-6", label: "CLAUDE-SONNET-4-6" },
  "critical-review":      { provider: "anthropic", model: "claude-sonnet-4-6", label: "CLAUDE-SONNET-4-6" },

  // ── Haiku: Cheap text generation ──
  "commit-message":       { provider: "anthropic", model: "claude-haiku-4-5", label: "CLAUDE-HAIKU-4-5" },
  "pr-description":       { provider: "anthropic", model: "claude-haiku-4-5", label: "CLAUDE-HAIKU-4-5" },
  "changelog":            { provider: "anthropic", model: "claude-haiku-4-5", label: "CLAUDE-HAIKU-4-5" },
}

// Fallback when primary provider 404s (from model-strategy.md line 22)
const FALLBACK_ROUTE: ModelRoute = {
  provider: "zai-coding-plan", model: "glm-4.7", label: "GLM-4.7 (fallback)"
}

// ============================================================================
// SERVER INTERACTION (mirrors council.ts patterns)
// ============================================================================

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCODE_URL}/global/health`, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    })
    const data = await response.json()
    return data?.healthy === true
  } catch {
    return false
  }
}

async function createSession(title: string, parentID?: string): Promise<string | null> {
  try {
    const body: any = { title }
    if (parentID) body.parentID = parentID
    const response = await fetch(`${OPENCODE_URL}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!response.ok) return null
    const data = await response.json()
    return data?.id || null
  } catch {
    return null
  }
}

function extractTextFromParts(data: any): string | null {
  const textParts = data?.parts?.filter((p: any) => p.type === "text") || []
  const text = textParts.map((p: any) => p.text).join("\n")
  return text || null
}

// ============================================================================
// TEXT MODE — prompt in, text out (no tool access)
// ============================================================================

async function dispatchText(
  sessionId: string,
  provider: string,
  model: string,
  prompt: string,
  timeoutMs: number,
): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: { providerID: provider, modelID: model },
        parts: [{ type: "text", text: prompt }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return null
    const data = await response.json()
    return extractTextFromParts(data)
  } catch {
    return null
  }
}

// ============================================================================
// AGENT MODE — full OpenCode session (file access, bash, grep, commands)
//
// The dispatched model gets the SAME tools we have. It reads AGENTS.md,
// navigates the codebase, follows the PIV loop, runs slash commands.
// The prompt should be SHORT — a task description, not a wall of text.
//
// Examples of good agent prompts:
//   "Run /planning auth-system"
//   "Run /execute .agents/features/auth/plan.md"
//   "Read src/auth.ts and fix the null pointer on line 42"
//   "Run /code-review"
//
// Examples of BAD agent prompts:
//   "Here is 500 lines of code, please review it and..." (use text mode)
//   "The project structure is: ... The conventions are: ..." (model reads itself)
// ============================================================================

async function dispatchAgent(
  sessionId: string,
  provider: string,
  model: string,
  prompt: string,
  description: string,
  timeoutMs: number,
): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: { providerID: provider, modelID: model }, // top-level model routes the message
        parts: [{
          type: "subtask",
          prompt,
          description,
          agent: "general",
          model: { providerID: provider, modelID: model }, // subtask part model (for child agent)
        }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return null
    const data = await response.json()
    // Try extracting text directly from response parts
    const text = extractTextFromParts(data)
    if (text) return text
    // If response contains subtask parts, the result is in the child session
    const subtaskParts = data?.parts?.filter((p: any) => p.type === "subtask") || []
    if (subtaskParts.length > 0 && subtaskParts[0].sessionID) {
      return await getSessionLastResponse(subtaskParts[0].sessionID)
    }
    return null
  } catch {
    return null
  }
}

async function getSessionLastResponse(sessionId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${OPENCODE_URL}/session/${sessionId}/message?limit=5`,
      { signal: AbortSignal.timeout(10_000) },
    )
    if (!response.ok) return null
    const messages = await response.json()
    if (!Array.isArray(messages) || messages.length === 0) return null
    // Get the last assistant message with text content
    for (let i = messages.length - 1; i >= 0; i--) {
      const text = extractTextFromParts(messages[i])
      if (text) return text
    }
    return null
  } catch {
    return null
  }
}

// ============================================================================
// COMMAND MODE — dispatch a slash command directly to a model
//
// The most structured dispatch. The model enters the command's workflow
// immediately. Example: command="planning", arguments="auth-system"
// makes the model run /planning auth-system in its own session.
//
// This is the preferred mode for PIV loop delegation:
//   command="planning"    → model runs /planning
//   command="execute"     → model runs /execute
//   command="code-review" → model runs /code-review
//   command="commit"      → model runs /commit
// ============================================================================

async function dispatchCommand(
  sessionId: string,
  provider: string,
  model: string,
  command: string,
  commandArgs: string,
  timeoutMs: number,
): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command,
        arguments: commandArgs,
        model: `${provider}/${model}`,
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return null
    const data = await response.json()
    return extractTextFromParts(data)
  } catch {
    return null
  }
}

// ============================================================================
// CASCADE DISPATCH (T0 Planning — sequential fallthrough)
// ============================================================================

async function dispatchCascade(
  sessionId: string,
  cascade: CascadeRoute,
  prompt: string,
  mode: DispatchMode,
  description: string,
  command?: string,
  commandArgs?: string,
): Promise<DispatchResult | null> {
  for (let i = 0; i < cascade.models.length; i++) {
    const route = cascade.models[i]
    const start = Date.now()
    let text: string | null = null

    if (mode === "command" && command) {
      text = await dispatchCommand(
        sessionId, route.provider, route.model,
        command, commandArgs || "", COMMAND_TIMEOUT_MS,
      )
    } else if (mode === "agent") {
      text = await dispatchAgent(
        sessionId, route.provider, route.model,
        prompt, description, AGENT_LONG_TIMEOUT_MS,
      )
    } else {
      text = await dispatchText(
        sessionId, route.provider, route.model,
        prompt, CASCADE_TIMEOUT_MS,
      )
    }

    const latencyMs = Date.now() - start

    if (text) {
      return {
        text,
        provider: route.provider,
        model: route.model,
        label: route.label,
        mode,
        latencyMs,
        sessionId,
        cascadeAttempts: i + 1,
      }
    }
    // Model failed — try next in cascade
  }
  return null
}

// ============================================================================
// ROUTE RESOLUTION
// ============================================================================

function resolveRoute(
  taskType?: string,
  provider?: string,
  model?: string,
): { route: ModelRoute | CascadeRoute; source: string } | null {
  // Explicit provider/model overrides taskType
  if (provider && model) {
    return {
      route: { provider, model, label: `${provider}/${model}` },
      source: "explicit",
    }
  }
  // TaskType lookup
  if (taskType) {
    const route = TASK_ROUTES[taskType]
    if (route) return { route, source: `taskType:${taskType}` }
    return { route: FALLBACK_ROUTE, source: `taskType:${taskType} (unknown → fallback)` }
  }
  return null
}

// ============================================================================
// SESSION ARCHIVING (mirrors council.ts)
// ============================================================================

async function listSessions(): Promise<SessionInfo[]> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

async function archiveSession(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: { archived: Date.now() } }),
    })
    return response.ok
  } catch {
    return false
  }
}

async function archiveOldDispatches(): Promise<void> {
  try {
    const sessions = await listSessions()
    const now = Date.now()
    let archived = 0
    const dispatchSessions = sessions.filter(
      (s) =>
        s.title?.startsWith("Dispatch:") &&
        !s.parentID &&
        s.time?.created &&
        now - s.time.created > ARCHIVE_AFTER_MS &&
        !s.time?.archived,
    )
    for (const session of dispatchSessions) {
      if (archived >= MAX_ARCHIVE_PER_RUN) break
      const children = sessions.filter((s) => s.parentID === session.id)
      for (const child of children) {
        await archiveSession(child.id)
      }
      await archiveSession(session.id)
      archived++
    }
  } catch {
    // Silent fail
  }
}

// ============================================================================
// TOOL EXPORT
// ============================================================================

export default tool({
  description:
    "Route a task to an AI model via the OpenCode server. Three modes:\n" +
    "• text: prompt → response (reviews, analysis, opinions)\n" +
    "• agent: full OpenCode session with file access, bash, grep, commands " +
    "(implementation, planning, execution — model follows the same PIV loop)\n" +
    "• command: dispatch a slash command directly to a model " +
    "(e.g., /planning, /execute, /code-review, /commit)\n\n" +
    "Use taskType for auto-routing or specify provider/model explicitly.",

  args: {
    prompt: tool.schema
      .string()
      .describe(
        "The prompt or instruction to send. For agent mode, keep it SHORT — " +
        "the model has full tool access and reads files itself. " +
        'Example: "Run /planning auth-system" or "Fix the null pointer in src/auth.ts:42"',
      ),

    taskType: tool.schema
      .string()
      .optional()
      .describe(
        "Auto-route to the correct model by task type. " +
        "Examples: 'code-review' → GLM-5, 'execution' → Qwen3.5-Plus, " +
        "'planning' → cascade (free→paid), 'commit-message' → Haiku. " +
        "Full table in model-strategy.md. Overridden by explicit provider/model.",
      ),

    provider: tool.schema
      .string()
      .optional()
      .describe(
        "Explicit provider ID. Examples: 'bailian-coding-plan-test', " +
        "'zai-coding-plan', 'ollama-cloud', 'anthropic', 'openai'. " +
        "Must be paired with 'model'.",
      ),

    model: tool.schema
      .string()
      .optional()
      .describe(
        "Explicit model ID. Examples: 'qwen3.5-plus', 'glm-5', " +
        "'deepseek-v3.2', 'kimi-k2:1t'. Must be paired with 'provider'.",
      ),

    mode: tool.schema
      .string()
      .optional()
      .describe(
        "Dispatch mode. Default: 'text'.\n" +
        "• 'text': prompt → response, no tool access\n" +
        "• 'agent': full OpenCode session (read/write/bash/grep/commands)\n" +
        "• 'command': dispatch a slash command (use with 'command' arg)",
      ),

    command: tool.schema
      .string()
      .optional()
      .describe(
        "Slash command to dispatch (command mode only). " +
        "Examples: 'planning', 'execute', 'code-review', 'commit'. " +
        "The 'prompt' arg becomes the command arguments.",
      ),

    timeout: tool.schema
      .number()
      .optional()
      .describe(
        "Custom timeout in ms. Defaults: text=120000, agent=300000, command=600000. " +
        "For long tasks: 900000 (15min) for planning/execution.",
      ),

    description: tool.schema
      .string()
      .optional()
      .describe(
        "Short description for the session title (shown in OpenCode UI). " +
        "Defaults to taskType or 'Dispatch task'.",
      ),
  },

  async execute(args, context) {
    const mode: DispatchMode = (args.mode as DispatchMode) || "text"
    const taskDescription = args.description || args.taskType || "Dispatch task"

    // Default timeouts by mode
    const defaultTimeout = mode === "command" ? COMMAND_TIMEOUT_MS
      : mode === "agent" ? AGENT_TIMEOUT_MS
      : TEXT_TIMEOUT_MS
    const timeoutMs = args.timeout || defaultTimeout

    // ── 1. Validate inputs ──
    if (!args.prompt) {
      return "# Dispatch Error\n\nNo prompt provided."
    }
    if (!args.taskType && !args.provider && !args.model) {
      return (
        "# Dispatch Error\n\n" +
        "No routing info. Provide `taskType` (auto-route) " +
        "or both `provider` + `model` (explicit route)."
      )
    }
    if ((args.provider && !args.model) || (!args.provider && args.model)) {
      return (
        "# Dispatch Error\n\n" +
        "`provider` and `model` must be used together. " +
        `Got provider=${args.provider || "none"}, model=${args.model || "none"}.`
      )
    }
    if (mode === "command" && !args.command) {
      return (
        "# Dispatch Error\n\n" +
        "Command mode requires the `command` arg. " +
        'Example: command="planning", prompt="auth-system"'
      )
    }

    // ── 2. Resolve route ──
    const resolved = resolveRoute(args.taskType, args.provider, args.model)
    if (!resolved) {
      return "# Dispatch Error\n\nCould not resolve model route."
    }

    // ── 3. Health check ──
    const healthy = await checkServerHealth()
    if (!healthy) {
      return (
        `# Dispatch Error\n\n` +
        `OpenCode server not reachable at ${OPENCODE_URL}.\n` +
        `Make sure \`opencode serve\` is running.`
      )
    }

    // ── 4. Create session ──
    const isCascade = "type" in resolved.route && resolved.route.type === "cascade"
    const routeLabel = isCascade ? "CASCADE" : (resolved.route as ModelRoute).label
    const sessionTitle = `Dispatch: [${routeLabel}] ${taskDescription} (${mode})`
    const sessionId = await createSession(sessionTitle)
    if (!sessionId) {
      return "# Dispatch Error\n\nFailed to create session."
    }

    // ── 5. Dispatch ──
    const start = Date.now()
    let result: DispatchResult | null = null

    if (isCascade) {
      result = await dispatchCascade(
        sessionId,
        resolved.route as CascadeRoute,
        args.prompt,
        mode,
        taskDescription,
        args.command,
        args.prompt, // For command mode, prompt = command arguments
      )
    } else {
      const route = resolved.route as ModelRoute
      let text: string | null = null

      if (mode === "command" && args.command) {
        text = await dispatchCommand(
          sessionId, route.provider, route.model,
          args.command, args.prompt, timeoutMs,
        )
      } else if (mode === "agent") {
        text = await dispatchAgent(
          sessionId, route.provider, route.model,
          args.prompt, taskDescription, timeoutMs,
        )
      } else {
        text = await dispatchText(
          sessionId, route.provider, route.model,
          args.prompt, timeoutMs,
        )
      }

      if (text) {
        result = {
          text,
          provider: route.provider,
          model: route.model,
          label: route.label,
          mode,
          latencyMs: Date.now() - start,
          sessionId,
        }
      } else if (resolved.source !== "explicit") {
        // Try fallback for non-explicit routes
        let fallbackText: string | null = null
        if (mode === "command" && args.command) {
          fallbackText = await dispatchCommand(
            sessionId, FALLBACK_ROUTE.provider, FALLBACK_ROUTE.model,
            args.command, args.prompt, timeoutMs,
          )
        } else if (mode === "agent") {
          fallbackText = await dispatchAgent(
            sessionId, FALLBACK_ROUTE.provider, FALLBACK_ROUTE.model,
            args.prompt, taskDescription, timeoutMs,
          )
        } else {
          fallbackText = await dispatchText(
            sessionId, FALLBACK_ROUTE.provider, FALLBACK_ROUTE.model,
            args.prompt, timeoutMs,
          )
        }
        if (fallbackText) {
          result = {
            text: fallbackText,
            provider: FALLBACK_ROUTE.provider,
            model: FALLBACK_ROUTE.model,
            label: FALLBACK_ROUTE.label,
            mode,
            latencyMs: Date.now() - start,
            sessionId,
          }
        }
      }
    }

    const totalMs = Date.now() - start

    // ── 6. Background cleanup ──
    archiveOldDispatches().catch(() => {})

    // ── 7. Format output ──
    if (!result) {
      return (
        `# Dispatch Failed\n\n` +
        `**Route**: ${resolved.source}\n` +
        `**Mode**: ${mode}\n` +
        `**Session**: ${sessionId}\n` +
        `**Time**: ${(totalMs / 1000).toFixed(1)}s\n\n` +
        `No model responded. Check provider configuration.\n\n` +
        `**Debug**: \`GET ${OPENCODE_URL}/session/${sessionId}\``
      )
    }

    const meta = [
      `**Model**: ${result.label} (\`${result.provider}/${result.model}\`)`,
      `**Mode**: ${result.mode}`,
      `**Route**: ${resolved.source}`,
      `**Latency**: ${(result.latencyMs / 1000).toFixed(1)}s`,
      `**Session**: ${result.sessionId}`,
    ]
    if (result.cascadeAttempts) {
      meta.push(`**Cascade**: attempt ${result.cascadeAttempts}/${(resolved.route as CascadeRoute).models.length}`)
    }
    if (mode === "command" && args.command) {
      meta.push(`**Command**: /${args.command} ${args.prompt}`)
    }

    return `# Dispatch Result\n\n${meta.join("\n")}\n\n---\n\n${result.text}`
  },
})
