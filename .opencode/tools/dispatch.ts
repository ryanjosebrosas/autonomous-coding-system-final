import { tool } from "@opencode-ai/plugin"

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENCODE_URL = "http://127.0.0.1:4096"
const TEXT_TIMEOUT_MS = 120_000      // 2 min — text mode (reviews, analysis)
const AGENT_TIMEOUT_MS = 300_000     // 5 min — agent mode (default)
const AGENT_LONG_TIMEOUT_MS = 900_000 // 15 min — agent mode (complex tasks)
const AGENT_SESSION_NO_TIMEOUT = 0   // No timeout — planning/execution sessions run until done
const CASCADE_TIMEOUT_MS = 30_000    // 30 sec — per cascade attempt (text mode)
const COMMAND_TIMEOUT_MS = 600_000   // 10 min — command mode (full command execution)

// Task types that are long-running sessions where timeout is not applicable.
// These sessions involve extensive codebase exploration, multi-file writes,
// and interactive tool use that can take 20-60+ minutes.
const NO_TIMEOUT_TASK_TYPES = new Set(["planning", "execution"])
const HEALTH_TIMEOUT_MS = 5_000
const ARCHIVE_AFTER_DAYS = 3
const ARCHIVE_AFTER_MS = ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000
const MAX_ARCHIVE_PER_RUN = 10

// Protected path prefixes — files here must NOT be modified by dispatched models.
// If a dispatch changes files matching these patterns, it's "interference".
const PROTECTED_PREFIXES = [
  ".opencode/",
  ".claude/",
  ".agents/specs/",
  "AGENTS.md",
  "CLAUDE.md",
]

// Path to the model scores file (interference events appended here)
const MODEL_SCORES_PATH = ".agents/specs/model-scores.json"

// ============================================================================
// INTERFERENCE TYPES
// ============================================================================

interface InterferenceEvent {
  timestamp: string
  provider: string
  model: string
  mode: string
  sessionId: string
  interferedFiles: string[]
  reverted: boolean
}

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

  // ── T0: Planning (Cascade: CODEX → FREE → PAID) ──
  // NOTE: ollama-cloud models (kimi-k2-thinking, cogito-2.1) removed — they output
  // raw tool call tokens in agent mode instead of making actual tool calls.
  // Codex-first per user policy; qwen3-max and qwen3.5-plus confirmed working.
  "planning": {
    type: "cascade",
    models: [
      { provider: "openai", model: "gpt-5.3-codex", label: "GPT-5.3-CODEX" },
      { provider: "bailian-coding-plan-test", model: "qwen3-max-2026-01-23", label: "QWEN3-MAX" },
      { provider: "bailian-coding-plan-test", model: "qwen3.5-plus", label: "QWEN3.5-PLUS" },
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

// Broader extraction for agent sessions where the final output may not be
// in TextPart entries. Checks: TextPart → ToolPart (completed) → ReasoningPart.
// Used by getSessionLastResponse() for child session message scanning.
function extractContentFromParts(data: any): string | null {
  // Priority 1: TextPart — the standard output
  const textParts = data?.parts?.filter((p: any) => p.type === "text") || []
  const text = textParts.map((p: any) => p.text).join("\n")
  if (text) return text

  // Priority 2: Completed ToolPart outputs — tool calls that produced results
  const toolParts = data?.parts?.filter(
    (p: any) => p.type === "tool" && p.state?.status === "completed" && p.state?.output
  ) || []
  if (toolParts.length > 0) {
    const toolOutput = toolParts.map((p: any) => p.state.output).join("\n")
    if (toolOutput) return toolOutput
  }

  // Priority 3: ReasoningPart — model's reasoning text (some providers expose this)
  const reasoningParts = data?.parts?.filter((p: any) => p.type === "reasoning" && p.text) || []
  if (reasoningParts.length > 0) {
    const reasoning = reasoningParts.map((p: any) => p.text).join("\n")
    if (reasoning) return reasoning
  }

  return null
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
    // timeoutMs === 0 means no timeout — session runs until completion.
    // Used for planning/execution sessions that can take 20-60+ minutes.
    const fetchOptions: RequestInit = {
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
    }
    if (timeoutMs > 0) {
      fetchOptions.signal = AbortSignal.timeout(timeoutMs)
    }
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, fetchOptions)
    if (!response.ok) return null
    const data = await response.json()
    // Check for error in the response
    if (data?.info?.error) {
      const err = data.info.error
      return `[Agent error: ${err.type || "unknown"}] ${err.message || ""}`
    }
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
      `${OPENCODE_URL}/session/${sessionId}/message?limit=20`,
      { signal: AbortSignal.timeout(30_000) },
    )
    if (!response.ok) return null
    const messages = await response.json()
    if (!Array.isArray(messages) || messages.length === 0) return null

    // Pass 1: Walk backward looking for TextPart content (most common case)
    for (let i = messages.length - 1; i >= 0; i--) {
      const text = extractTextFromParts(messages[i])
      if (text) return text
    }

    // Pass 2: Walk backward looking for any content (ToolPart output, ReasoningPart)
    // Agent sessions often end with tool calls, so the final text may be in these parts
    for (let i = messages.length - 1; i >= 0; i--) {
      const content = extractContentFromParts(messages[i])
      if (content) return content
    }

    // Pass 3: Check if any message has an error we should surface
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg?.info?.error) {
        const err = msg.info.error
        return `[Session error: ${err.type || "unknown"}] ${err.message || ""}`
      }
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
    const fetchOptions: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command,
        arguments: commandArgs,
        model: `${provider}/${model}`,
      }),
    }
    // timeoutMs === 0 means no timeout — execution sessions run until completion.
    if (timeoutMs > 0) {
      fetchOptions.signal = AbortSignal.timeout(timeoutMs)
    }
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/command`, fetchOptions)
    if (!response.ok) return null
    const data = await response.json()
    // Command responses have multi-step structures (step-start, reasoning, tool, text, step-finish).
    // Try broad extraction first (covers text, tool output, reasoning parts).
    const content = extractContentFromParts(data)
    if (content) return content
    // If direct extraction fails, scan session messages as fallback.
    // This handles cases where the command API returns a different structure
    // than expected (e.g., array of messages, nested response).
    return await getSessionLastResponse(sessionId)
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
  taskType?: string,
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
      // Use no-timeout for planning/execution sessions; fallback to AGENT_LONG_TIMEOUT_MS
      const agentTimeout = taskType && NO_TIMEOUT_TASK_TYPES.has(taskType)
        ? AGENT_SESSION_NO_TIMEOUT
        : AGENT_LONG_TIMEOUT_MS
      text = await dispatchAgent(
        sessionId, route.provider, route.model,
        prompt, description, agentTimeout,
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
// CASCADE RESOLUTION (resolve cascade to single model for sequential use)
// ============================================================================

// Resolves a cascade to a single working ModelRoute by trying each model
// with a quick text ping. Used when you need one model for multiple sequential
// steps (e.g., /prime then /planning in the same session).
//
// Returns the first model that responds, or null if all fail.
async function resolveCascadeToModel(
  cascade: CascadeRoute,
  sessionId: string,
): Promise<{ model: ModelRoute; attempts: number } | null> {
  for (let i = 0; i < cascade.models.length; i++) {
    const route = cascade.models[i]
    try {
      // Quick text ping — "respond with OK" to test if model is reachable
      const text = await dispatchText(
        sessionId, route.provider, route.model,
        "Respond with exactly: OK", 15_000, // 15s timeout for ping
      )
      if (text) {
        return { model: route, attempts: i + 1 }
      }
    } catch {
      // Model failed — try next
    }
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
// INTERFERENCE TRACKING
// ============================================================================

// Capture current file state via git status --porcelain.
// Returns a Set of file paths that have any status (modified, untracked, etc.)
async function captureFileSnapshot(): Promise<Set<string>> {
  try {
    const proc = Bun.spawn(["git", "status", "--porcelain"], {
      stdout: "pipe",
      stderr: "pipe",
    })
    const output = await new Response(proc.stdout).text()
    await proc.exited
    const files = new Set<string>()
    for (const line of output.split("\n")) {
      if (line.length < 4) continue
      // git status --porcelain format: "XY filename" (first 3 chars are status + space)
      const filePath = line.slice(3).trim()
      if (filePath) files.add(filePath)
    }
    return files
  } catch {
    return new Set()
  }
}

// Compare before/after snapshots. Returns files that appeared or changed AFTER dispatch
// that were NOT in the before snapshot.
function detectNewChanges(before: Set<string>, after: Set<string>): string[] {
  const newChanges: string[] = []
  for (const file of after) {
    if (!before.has(file)) {
      newChanges.push(file)
    }
  }
  return newChanges
}

// Filter changed files to only those in protected paths
function filterProtectedFiles(files: string[]): string[] {
  return files.filter(file =>
    PROTECTED_PREFIXES.some(prefix => file.startsWith(prefix) || file === prefix.replace(/\/$/, ""))
  )
}

// Revert interfered files: checkout for modified, rm for untracked
async function revertInterference(files: string[]): Promise<boolean> {
  try {
    for (const file of files) {
      // Try git checkout first (works for modified tracked files)
      const checkout = Bun.spawn(["git", "checkout", "HEAD", "--", file], {
        stdout: "pipe",
        stderr: "pipe",
      })
      const exitCode = await checkout.exited
      if (exitCode !== 0) {
        // File might be untracked (new) — delete it
        try {
          const { unlinkSync } = await import("node:fs")
          unlinkSync(file)
        } catch {
          // File doesn't exist or can't be deleted — skip
        }
      }
    }
    return true
  } catch {
    return false
  }
}

// Log interference event to model-scores.json
async function logInterference(event: InterferenceEvent): Promise<void> {
  try {
    const { readFileSync, writeFileSync, existsSync, mkdirSync } = await import("node:fs")
    const { dirname } = await import("node:path")

    let scores: any = { models: {}, interferenceLog: [], codeLoopLineup: [] }
    if (existsSync(MODEL_SCORES_PATH)) {
      scores = JSON.parse(readFileSync(MODEL_SCORES_PATH, "utf-8"))
    } else {
      const dir = dirname(MODEL_SCORES_PATH)
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    }

    // Ensure interferenceLog array exists
    if (!scores.interferenceLog) scores.interferenceLog = []
    scores.interferenceLog.push(event)

    // Update per-model interference count
    const modelKey = `${event.provider}/${event.model}`
    if (!scores.models) scores.models = {}
    if (!scores.models[modelKey]) {
      scores.models[modelKey] = {
        provider: event.provider,
        model: event.model,
        interferenceCount: 0,
        dispatchCount: 0,
      }
    }
    scores.models[modelKey].interferenceCount++

    writeFileSync(MODEL_SCORES_PATH, JSON.stringify(scores, null, 2))
  } catch {
    // Silent fail — interference logging is best-effort
  }
}

// ============================================================================
// CODE LOOP LINEUP AUTO-SELECTION
// ============================================================================

interface ModelScore {
  provider: string
  model: string
  interferenceCount: number
  dispatchCount: number
  benchmark?: {
    responseTimeMs: number
    reviewQuality: number       // 0-10
    formatCompliance: number    // 0-10
    issuesFound: number
    falsePositiveRate: number   // 0.0-1.0
    timestamp: string
  }
}

// Composite score: weighted sum of review quality, format compliance, response time,
// interference rate, and reliability. Lower interference = better. Faster = better (tiebreaker).
function computeCompositeScore(m: ModelScore): number {
  if (!m.benchmark) return -1  // No benchmark = not eligible

  const interferenceRate = m.dispatchCount > 0
    ? m.interferenceCount / m.dispatchCount
    : 0

  // Disqualify models with >0 interference rate
  if (interferenceRate > 0) return -1

  // Weighted score (out of ~10):
  //   reviewQuality:    40% (most important)
  //   formatCompliance: 25% (need parseable output)
  //   responseTime:     15% (prefer faster, normalize 0-10)
  //   falsePositiveRate: 20% (prefer fewer false positives)
  const timeScore = Math.max(0, 10 - (m.benchmark.responseTimeMs / 30_000) * 10)
  const fpScore = 10 * (1 - m.benchmark.falsePositiveRate)

  return parseFloat((
    m.benchmark.reviewQuality * 0.4 +
    m.benchmark.formatCompliance * 0.25 +
    timeScore * 0.15 +
    fpScore * 0.2
  ).toFixed(2))
}

// Generate the top-3 free model lineup for /code-loop gauntlet
function generateCodeLoopLineup(scores: Record<string, ModelScore>): Array<{
  provider: string
  model: string
  label: string
  compositeScore: number
}> {
  const candidates = Object.values(scores)
    .filter(m => m.benchmark != null && computeCompositeScore(m) > 0)
    .map(m => ({
      provider: m.provider,
      model: m.model,
      label: `${m.provider}/${m.model}`,
      compositeScore: computeCompositeScore(m),
    }))
    .sort((a, b) => b.compositeScore - a.compositeScore)

  // Pick top 3, ensuring provider diversity (max 2 from same provider)
  const lineup: typeof candidates = []
  const providerCounts: Record<string, number> = {}

  for (const candidate of candidates) {
    if (lineup.length >= 3) break
    const count = providerCounts[candidate.provider] || 0
    if (count >= 2) continue  // Max 2 from same provider
    lineup.push(candidate)
    providerCounts[candidate.provider] = count + 1
  }

  return lineup
}

// Read model-scores.json, recompute codeLoopLineup, and write back
async function refreshCodeLoopLineup(): Promise<void> {
  try {
    const { readFileSync, writeFileSync, existsSync } = await import("node:fs")
    if (!existsSync(MODEL_SCORES_PATH)) return

    const scores = JSON.parse(readFileSync(MODEL_SCORES_PATH, "utf-8"))
    if (!scores.models) return

    scores.codeLoopLineup = generateCodeLoopLineup(scores.models)
    writeFileSync(MODEL_SCORES_PATH, JSON.stringify(scores, null, 2))
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
    "Use taskType for auto-routing or specify provider/model explicitly.\n\n" +
    "For sequential dispatch (e.g., /prime then /planning in the same session),\n" +
    "call dispatch once to get a sessionId, then pass that sessionId in subsequent calls.\n\n" +
    "NOTE: If sessionId does not appear as a parameter in this tool's schema, the MCP\n" +
    "tool definition is stale (cached from before sessionId was added). Fix: restart\n" +
    "opencode serve and start a new Claude session to pick up the updated schema.",

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
        "Planning/execution tasks use no-timeout automatically (taskType routing). " +
        "Set to 0 explicitly to disable timeout for any task.",
      ),

    description: tool.schema
      .string()
      .optional()
      .describe(
        "Short description for the session title (shown in OpenCode UI). " +
        "Defaults to taskType or 'Dispatch task'.",
      ),

    sessionId: tool.schema
      .string()
      .optional()
      .describe(
        "Existing session ID to send to (skips session creation). " +
        "Use this for sequential dispatch — send /prime to a session, then " +
        "/planning to the SAME session so context carries over. " +
        "Get a session ID by calling dispatch once (it returns sessionId in output), " +
        "then pass that ID in subsequent calls.",
      ),
  },

  async execute(args, context) {
    const mode: DispatchMode = (args.mode as DispatchMode) || "text"
    const taskDescription = args.description || args.taskType || "Dispatch task"

    // Default timeouts by mode, with no-timeout override for long-running sessions
    let defaultTimeout = mode === "command" ? COMMAND_TIMEOUT_MS
      : mode === "agent" ? AGENT_TIMEOUT_MS
      : TEXT_TIMEOUT_MS

    // Planning and execution sessions are long-running (20-60+ min).
    // Override to no-timeout so AbortSignal doesn't kill them.
    if ((mode === "agent" || mode === "command") && args.taskType && NO_TIMEOUT_TASK_TYPES.has(args.taskType)) {
      defaultTimeout = AGENT_SESSION_NO_TIMEOUT
    }

    const timeoutMs = args.timeout ?? defaultTimeout

    // ── 1. Validate inputs ──
    if (args.prompt == null) {
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

    // ── 4. Create or reuse session ──
    const isCascade = "type" in resolved.route && resolved.route.type === "cascade"
    const routeLabel = isCascade ? "CASCADE" : (resolved.route as ModelRoute).label
    let sessionId: string
    if (args.sessionId) {
      // Reuse existing session — for sequential dispatch (e.g., /prime then /planning)
      sessionId = args.sessionId
    } else {
      const sessionTitle = `Dispatch: [${routeLabel}] ${taskDescription} (${mode})`
      const newSessionId = await createSession(sessionTitle)
      if (!newSessionId) {
        return "# Dispatch Error\n\nFailed to create session."
      }
      sessionId = newSessionId
    }

    // ── 5. Dispatch ──
    // ── Interference tracking: pre-dispatch snapshot ──
    const trackInterference = mode === "agent" || mode === "command"
    const preSnapshot = trackInterference ? await captureFileSnapshot() : new Set<string>()

    const start = Date.now()
    let result: DispatchResult | null = null

    if (isCascade) {
      // If reusing a session, resolve cascade to single model first
      // so all messages in the session use the same model.
      if (args.sessionId) {
        const resolved_model = await resolveCascadeToModel(
          resolved.route as CascadeRoute, sessionId,
        )
        if (resolved_model) {
          const route = resolved_model.model
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
              cascadeAttempts: resolved_model.attempts,
            }
          }
        }
      } else {
        result = await dispatchCascade(
          sessionId,
          resolved.route as CascadeRoute,
          args.prompt,
          mode,
          taskDescription,
          args.command,
          args.prompt, // For command mode, prompt = command arguments
          args.taskType,
        )
      }
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

    // ── Interference tracking: post-dispatch detection ──
    if (trackInterference && result) {
      const postSnapshot = await captureFileSnapshot()
      const newChanges = detectNewChanges(preSnapshot, postSnapshot)
      const interferedFiles = filterProtectedFiles(newChanges)

      if (interferedFiles.length > 0) {
        const reverted = await revertInterference(interferedFiles)
        await logInterference({
          timestamp: new Date().toISOString(),
          provider: result.provider,
          model: result.model,
          mode: result.mode,
          sessionId: result.sessionId,
          interferedFiles,
          reverted,
        })

        // Refresh lineup — interference disqualifies this model
        refreshCodeLoopLineup().catch(() => {})

        // Append interference warning to result
        result.text += `\n\n---\n\n⚠️ **INTERFERENCE DETECTED**\n\n` +
          `This model modified ${interferedFiles.length} protected file(s):\n` +
          interferedFiles.map(f => `- \`${f}\``).join("\n") + "\n\n" +
          (reverted ? "All changes were automatically reverted." : "⚠️ Auto-revert failed — manual cleanup required.")
      }

      // Track dispatch count for the model (even if no interference)
      try {
        const { readFileSync, writeFileSync, existsSync } = await import("node:fs")
        let scores: any = { models: {} }
        if (existsSync(MODEL_SCORES_PATH)) {
          scores = JSON.parse(readFileSync(MODEL_SCORES_PATH, "utf-8"))
        }
        const modelKey = `${result.provider}/${result.model}`
        if (!scores.models) scores.models = {}
        if (!scores.models[modelKey]) {
          scores.models[modelKey] = {
            provider: result.provider,
            model: result.model,
            interferenceCount: 0,
            dispatchCount: 0,
          }
        }
        scores.models[modelKey].dispatchCount++
        writeFileSync(MODEL_SCORES_PATH, JSON.stringify(scores, null, 2))
      } catch {
        // Silent fail
      }
    }

    // ── 6. Background cleanup ──
    archiveOldDispatches().catch(() => {})

    // ── 7. Format output ──
    if (!result) {
      // Even on failure, check for partial interference
      if (trackInterference) {
        const postSnapshot = await captureFileSnapshot()
        const newChanges = detectNewChanges(preSnapshot, postSnapshot)
        const interferedFiles = filterProtectedFiles(newChanges)
        if (interferedFiles.length > 0) {
          await revertInterference(interferedFiles)
          // Log with best-effort model info from resolved route
          const route = resolved.route as ModelRoute
          await logInterference({
            timestamp: new Date().toISOString(),
            provider: route?.provider || "unknown",
            model: route?.model || "unknown",
            mode,
            sessionId,
            interferedFiles,
            reverted: true,
          })
          // Refresh lineup — interference disqualifies this model
          refreshCodeLoopLineup().catch(() => {})
        }
      }

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
      `**Session ID**: \`${result.sessionId}\``,
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
