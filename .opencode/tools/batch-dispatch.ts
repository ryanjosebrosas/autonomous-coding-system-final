import { tool } from "@opencode-ai/plugin"

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENCODE_URL = "http://127.0.0.1:4096"
const DEFAULT_TIMEOUT_MS = 120_000   // 2 minutes per model
const HEALTH_TIMEOUT_MS = 5_000
const ARCHIVE_AFTER_DAYS = 3
const ARCHIVE_AFTER_MS = ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000
const MAX_ARCHIVE_PER_RUN = 10

// ============================================================================
// TYPES
// ============================================================================

interface ModelConfig {
  provider: string
  model: string
  label: string
}

interface ModelResponse {
  label: string
  provider: string
  model: string
  text: string
  latencyMs: number
}

interface BatchResult {
  responses: ModelResponse[]
  totalModels: number
  respondedModels: number
  wallTimeMs: number
  consensus: ConsensusAnalysis
}

interface ConsensusAnalysis {
  score: number              // 0.0 - 1.0 (1.0 = full agreement)
  issueCount: number         // How many models found issues
  noIssueCount: number       // How many models found NO issues
  summary: string            // Human-readable consensus summary
  escalationAction: string   // "skip-t4" | "run-t4" | "fix-and-rerun"
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
// BATCH PATTERNS (from model-strategy.md)
// ============================================================================

// 10 pre-defined workflows from model-strategy.md + t4-sign-off panel.
// Each pattern specifies which models to dispatch in parallel.

const BATCH_PATTERNS: Record<string, { models: ModelConfig[]; description: string }> = {
  "free-review-gauntlet": {
    description: "5-model consensus review — core of smart escalation",
    models: [
      { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
      { provider: "zai-coding-plan", model: "glm-4.5", label: "GLM-4.5" },
      { provider: "bailian-coding-plan-test", model: "qwen3-coder-plus", label: "QWEN3-CODER-PLUS" },
      { provider: "zai-coding-plan", model: "glm-4.7-flash", label: "GLM-4.7-FLASH" },
      { provider: "ollama", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
    ],
  },
  "free-heavy-architecture": {
    description: "Architecture decisions with ZAI+Bailian+Ollama flagships",
    models: [
      { provider: "zai-coding-plan", model: "glm-4.5", label: "GLM-4.5" },
      { provider: "bailian-coding-plan-test", model: "qwen3-max-2026-01-23", label: "QWEN3-MAX" },
      { provider: "ollama", model: "kimi-k2:1t", label: "KIMI-K2" },
      { provider: "ollama", model: "deepseek-v3.1:671b", label: "DEEPSEEK-V3.1" },
      { provider: "ollama", model: "cogito-2.1:671b", label: "COGITO-2.1" },
    ],
  },
  "free-security-audit": {
    description: "3-model security-focused review",
    models: [
      { provider: "zai-coding-plan", model: "glm-4.7-flash", label: "GLM-4.7-FLASH" },
      { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
      { provider: "bailian-coding-plan-test", model: "qwen3-coder-plus", label: "QWEN3-CODER-PLUS" },
    ],
  },
  "free-plan-review": {
    description: "4-model plan critique before approval",
    models: [
      { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
      { provider: "zai-coding-plan", model: "glm-4.5", label: "GLM-4.5" },
      { provider: "bailian-coding-plan-test", model: "qwen3-max-2026-01-23", label: "QWEN3-MAX" },
      { provider: "ollama", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
    ],
  },
  "free-impl-validation": {
    description: "Quick 3-model check after T1 implementation",
    models: [
      { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
      { provider: "zai-coding-plan", model: "glm-4.7-flash", label: "GLM-4.7-FLASH" },
      { provider: "ollama", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
    ],
  },
  "free-regression-sweep": {
    description: "3-model regression check",
    models: [
      { provider: "zai-coding-plan", model: "glm-4.7", label: "GLM-4.7" },
      { provider: "bailian-coding-plan-test", model: "qwen3-coder-plus", label: "QWEN3-CODER-PLUS" },
      { provider: "ollama", model: "devstral-2:123b", label: "DEVSTRAL-2" },
    ],
  },
  "multi-review": {
    description: "Multi-family code review (4 free models)",
    models: [
      { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
      { provider: "zai-coding-plan", model: "glm-4.5", label: "GLM-4.5" },
      { provider: "ollama", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
      { provider: "ollama", model: "kimi-k2-thinking", label: "KIMI-K2-THINKING" },
    ],
  },
  "plan-review": {
    description: "Plan critique with Bailian flagship",
    models: [
      { provider: "zai-coding-plan", model: "glm-5", label: "GLM-5" },
      { provider: "bailian-coding-plan-test", model: "qwen3-max-2026-01-23", label: "QWEN3-MAX" },
      { provider: "ollama", model: "qwen3.5:397b", label: "QWEN3.5-397B" },
      { provider: "ollama", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
    ],
  },
  "pre-impl-scan": {
    description: "Pre-implementation pattern scan",
    models: [
      { provider: "zai-coding-plan", model: "glm-4.7-flash", label: "GLM-4.7-FLASH" },
      { provider: "bailian-coding-plan-test", model: "qwen3-coder-next", label: "QWEN3-CODER-NEXT" },
      { provider: "ollama", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
    ],
  },
  "heavy-architecture": {
    description: "Deep architecture with ZAI+Bailian+Ollama",
    models: [
      { provider: "zai-coding-plan", model: "glm-4.5", label: "GLM-4.5" },
      { provider: "bailian-coding-plan-test", model: "qwen3-max-2026-01-23", label: "QWEN3-MAX" },
      { provider: "ollama", model: "kimi-k2:1t", label: "KIMI-K2" },
      { provider: "ollama", model: "deepseek-v3.1:671b", label: "DEEPSEEK-V3.1" },
      { provider: "ollama", model: "cogito-2.1:671b", label: "COGITO-2.1" },
    ],
  },

  // T4 sign-off panel (PAID — use only when free gauntlet requires it)
  // NOTE: Replaced Claude with DeepSeek/GPT models per user request
  "t4-sign-off": {
    description: "⚠️ PAID: T4 review panel — codex + deepseek + qwen-max",
    models: [
      { provider: "openai", model: "gpt-5.3-codex", label: "GPT-5.3-CODEX" },
      { provider: "ollama", model: "deepseek-v3.1:671b-cloud", label: "DEEPSEEK-V3.1" },
      { provider: "ollama", model: "qwen3-max:80b-cloud", label: "QWEN3-MAX" },
    ],
  },
}

// ============================================================================
// SERVER INTERACTION (duplicated from dispatch.ts for zero coupling)
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

async function sendMessage(
  sessionId: string,
  provider: string,
  model: string,
  text: string,
  timeoutMs: number,
): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: { providerID: provider, modelID: model },
        parts: [{ type: "text", text }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return null
    const data = await response.json()
    const textParts = data?.parts?.filter((p: any) => p.type === "text") || []
    return textParts.map((p: any) => p.text).join("\n") || null
  } catch {
    return null
  }
}

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

async function archiveOldBatches(): Promise<void> {
  try {
    const sessions = await listSessions()
    const now = Date.now()
    let archived = 0
    const batchSessions = sessions.filter(
      (s) =>
        s.title?.startsWith("Batch:") &&
        !s.parentID &&
        s.time?.created &&
        now - s.time.created > ARCHIVE_AFTER_MS &&
        !s.time?.archived,
    )
    for (const session of batchSessions) {
      if (archived >= MAX_ARCHIVE_PER_RUN) break
      const children = sessions.filter((s) => s.parentID === session.id)
      for (const child of children) {
        await archiveSession(child.id)
      }
      await archiveSession(session.id)
      archived++
    }
  } catch {
    // Silent fail — archiving is best-effort
  }
}

// ============================================================================
// PARALLEL DISPATCH
// ============================================================================

async function dispatchParallel(
  parentSessionId: string,
  models: ModelConfig[],
  prompt: string,
  timeoutMs: number,
): Promise<ModelResponse[]> {
  const promises = models.map(async (model) => {
    // Create child session per model
    const childId = await createSession(
      `[${model.label}] Response`,
      parentSessionId,
    )
    if (!childId) return null

    const start = Date.now()
    const text = await sendMessage(
      childId,
      model.provider,
      model.model,
      prompt,
      timeoutMs,
    )
    const latencyMs = Date.now() - start

    if (!text) return null

    return {
      label: model.label,
      provider: model.provider,
      model: model.model,
      text,
      latencyMs,
    }
  })

  const results = await Promise.allSettled(promises)
  return results
    .filter(
      (r): r is PromiseFulfilledResult<ModelResponse | null> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value)
    .filter((v): v is ModelResponse => v !== null)
}

// ============================================================================
// CONSENSUS ANALYSIS
// ============================================================================

// Issue detection keywords — models that find problems tend to use these
const ISSUE_KEYWORDS = [
  "bug", "error", "issue", "problem", "vulnerability", "risk",
  "incorrect", "wrong", "broken", "fail", "missing", "should",
  "must", "critical", "major", "minor", "warning", "concern",
  "security", "unsafe", "race condition", "memory leak", "injection",
  "fix", "needs", "required", "recommend", "suggest",
]

const NO_ISSUE_KEYWORDS = [
  "looks good", "lgtm", "no issues", "no problems", "clean",
  "well-structured", "well-written", "correct", "solid",
  "no concerns", "approve", "approved", "ship it", "good to go",
  "no bugs", "no errors", "no vulnerabilities",
]

function analyzeConsensus(responses: ModelResponse[]): ConsensusAnalysis {
  if (responses.length === 0) {
    return {
      score: 0,
      issueCount: 0,
      noIssueCount: 0,
      summary: "No models responded",
      escalationAction: "run-t4",
    }
  }

  let issueCount = 0
  let noIssueCount = 0

  for (const response of responses) {
    const lower = response.text.toLowerCase()

    // Count keyword hits
    const issueHits = ISSUE_KEYWORDS.filter((kw) => lower.includes(kw)).length
    const noIssueHits = NO_ISSUE_KEYWORDS.filter((kw) => lower.includes(kw)).length

    // A model "found issues" if issue keywords significantly outweigh no-issue keywords
    // Threshold: more than 3 issue keywords AND at least 2x as many as no-issue keywords
    if (issueHits > 3 && issueHits > noIssueHits * 2) {
      issueCount++
    } else if (noIssueHits > 0 || issueHits <= 1) {
      noIssueCount++
    } else {
      // Ambiguous — count as no-issue (conservative)
      noIssueCount++
    }
  }

  const total = responses.length

  // Consensus score: agreement ratio
  // If most models agree (either all issues or all clean), score is high
  const maxAgreement = Math.max(issueCount, noIssueCount)
  const score = maxAgreement / total

  // Escalation action (from model-strategy.md lines 155-163)
  let escalationAction: string
  let summary: string

  if (issueCount <= 1) {
    // 0-1 out of N found issues → SKIP T4, commit directly
    escalationAction = "skip-t4"
    summary = `${noIssueCount}/${total} models found no issues. Safe to commit directly ($0 cost).`
  } else if (issueCount === 2) {
    // 2 found issues → Run T4 gate only
    escalationAction = "run-t4"
    summary = `${issueCount}/${total} models found issues. Recommend running T4 gate.`
  } else {
    // 3+ found issues → T1 fix + re-gauntlet
    escalationAction = "fix-and-rerun"
    summary = `${issueCount}/${total} models found issues. Fix issues (T1) and re-run gauntlet.`
  }

  return { score, issueCount, noIssueCount, summary, escalationAction }
}

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

function formatBatchOutput(
  patternName: string | null,
  patternDesc: string | null,
  result: BatchResult,
  _prompt: string,
): string {
  const { responses, totalModels, respondedModels, wallTimeMs, consensus } = result

  // Header
  let output = `# Batch Dispatch Result\n\n`

  // Meta info
  if (patternName) {
    output += `**Pattern**: \`${patternName}\` — ${patternDesc}\n`
  } else {
    output += `**Pattern**: Custom model list\n`
  }
  output += `**Models**: ${respondedModels}/${totalModels} responded\n`
  output += `**Wall Time**: ${(wallTimeMs / 1000).toFixed(1)}s\n`
  output += `**Consensus**: ${(consensus.score * 100).toFixed(0)}% agreement\n\n`

  // Consensus summary box
  output += `## Consensus Analysis\n\n`
  output += `| Metric | Value |\n`
  output += `|--------|-------|\n`
  output += `| Models finding issues | ${consensus.issueCount}/${totalModels} |\n`
  output += `| Models finding no issues | ${consensus.noIssueCount}/${totalModels} |\n`
  output += `| Agreement score | ${(consensus.score * 100).toFixed(0)}% |\n`
  output += `| Escalation action | **${consensus.escalationAction}** |\n\n`
  output += `> ${consensus.summary}\n\n`

  // Escalation guidance
  output += `### Smart Escalation Guidance\n\n`
  switch (consensus.escalationAction) {
    case "skip-t4":
      output += `0-1 models found issues. **SKIP T4**, commit directly. $0 paid cost.\n\n`
      break
    case "run-t4":
      output += `2 models found issues. **Run T4 gate** (codex or sonnet) for confirmation.\n\n`
      break
    case "fix-and-rerun":
      output += `3+ models found issues. **Fix with T1** (free), then re-run gauntlet (max 3x).\n\n`
      break
  }

  output += `---\n\n`

  // Per-model responses
  output += `## Individual Model Responses\n\n`

  // Latency comparison table
  output += `| Model | Provider | Latency | Found Issues |\n`
  output += `|-------|----------|---------|-------------|\n`
  for (const r of responses) {
    const lower = r.text.toLowerCase()
    const issueHits = ISSUE_KEYWORDS.filter((kw) => lower.includes(kw)).length
    const noIssueHits = NO_ISSUE_KEYWORDS.filter((kw) => lower.includes(kw)).length
    const foundIssues = (issueHits > 3 && issueHits > noIssueHits * 2) ? "Yes" : "No"
    output += `| ${r.label} | ${r.provider} | ${(r.latencyMs / 1000).toFixed(1)}s | ${foundIssues} |\n`
  }
  output += `\n`

  // Full responses
  for (const r of responses) {
    output += `### ${r.label}\n\n`
    output += `*Provider: \`${r.provider}\` | Model: \`${r.model}\` | Latency: ${(r.latencyMs / 1000).toFixed(1)}s*\n\n`
    output += `${r.text}\n\n`
    output += `---\n\n`
  }

  // Failed models (if any)
  if (respondedModels < totalModels) {
    output += `## Failed Models\n\n`
    output += `${totalModels - respondedModels} model(s) did not respond (timeout or error).\n\n`
  }

  return output
}

// ============================================================================
// TOOL EXPORT
// ============================================================================

export default tool({
  description:
    "Send the same prompt to multiple AI models in parallel and compare responses. " +
    "Use batchPattern for pre-defined model sets or provide custom models. " +
    "Returns per-model responses with latency, consensus analysis, and escalation guidance. " +
    "Minimum 2 models required.",

  args: {
    prompt: tool.schema
      .string()
      .describe("The prompt to send to all models in parallel."),

    batchPattern: tool.schema
      .string()
      .optional()
      .describe(
        "Pre-defined batch pattern name. Options: " +
        "'free-review-gauntlet' (5 models), 'free-heavy-architecture' (5 flagships), " +
        "'free-security-audit' (3 models), 'free-plan-review' (4 models), " +
        "'free-impl-validation' (3 models), 'free-regression-sweep' (3 models), " +
        "'multi-review' (4 models), 'plan-review' (4 models), " +
        "'pre-impl-scan' (3 models), 'heavy-architecture' (5 models), " +
        "'t4-sign-off' (3 PAID models). " +
        "If both batchPattern and models are given, models takes precedence.",
      ),

    models: tool.schema
      .string()
      .optional()
      .describe(
        "Custom model list as JSON array. Each entry: { provider, model, label }. " +
        'Example: [{"provider":"zai-coding-plan","model":"glm-5","label":"GLM-5"},...]. ' +
        "Minimum 2 models. Use this for ad-hoc model combinations not covered by patterns.",
      ),

    timeout: tool.schema
      .number()
      .optional()
      .describe(
        "Timeout per model in milliseconds. Default: 120000 (2 minutes). " +
        "All models run in parallel, so wall time ≈ slowest model's response time.",
      ),
  },

  async execute(args, context) {
    const timeoutMs = args.timeout || DEFAULT_TIMEOUT_MS

    // ── 1. Validate inputs ──
    if (!args.prompt) {
      return "# Batch Dispatch Error\n\nNo prompt provided."
    }

    // ── 2. Resolve model list ──
    let models: ModelConfig[]
    let patternName: string | null = null
    let patternDesc: string | null = null

    if (args.models) {
      // Custom model list takes precedence over batchPattern
      try {
        models = JSON.parse(args.models) as ModelConfig[]
        if (!Array.isArray(models) || models.length < 2) {
          return (
            "# Batch Dispatch Error\n\n" +
            "Custom models must be a JSON array with at least 2 entries.\n" +
            'Format: [{"provider":"...","model":"...","label":"..."},...]'
          )
        }
        // Validate each model has required fields
        for (const m of models) {
          if (!m.provider || !m.model || !m.label) {
            return (
              "# Batch Dispatch Error\n\n" +
              `Invalid model entry: ${JSON.stringify(m)}.\n` +
              "Each entry must have: provider, model, label."
            )
          }
        }
      } catch (e) {
        return (
          "# Batch Dispatch Error\n\n" +
          `Failed to parse custom models JSON: ${e instanceof Error ? e.message : String(e)}`
        )
      }
    } else if (args.batchPattern) {
      // Pre-defined pattern
      const pattern = BATCH_PATTERNS[args.batchPattern]
      if (!pattern) {
        const available = Object.keys(BATCH_PATTERNS).join(", ")
        return (
          `# Batch Dispatch Error\n\n` +
          `Unknown batch pattern: "${args.batchPattern}".\n\n` +
          `Available patterns: ${available}`
        )
      }
      models = pattern.models
      patternName = args.batchPattern
      patternDesc = pattern.description
    } else {
      return (
        "# Batch Dispatch Error\n\n" +
        "No models specified. Provide either `batchPattern` (pre-defined) " +
        "or `models` (custom JSON array)."
      )
    }

    // ── 3. Check server health ──
    const healthy = await checkServerHealth()
    if (!healthy) {
      return (
        `# Batch Dispatch Error\n\n` +
        `OpenCode server not reachable at ${OPENCODE_URL}.\n` +
        `Make sure \`opencode serve\` is running.`
      )
    }

    // ── 4. Create parent session ──
    const sessionTitle = patternName
      ? `Batch: [${patternName}] ${models.length} models`
      : `Batch: [custom] ${models.length} models`
    const parentSessionId = await createSession(sessionTitle)
    if (!parentSessionId) {
      return "# Batch Dispatch Error\n\nFailed to create session on OpenCode server."
    }

    // ── 5. Dispatch to all models in parallel ──
    const start = Date.now()
    const responses = await dispatchParallel(
      parentSessionId,
      models,
      args.prompt,
      timeoutMs,
    )
    const wallTimeMs = Date.now() - start

    // ── 6. Analyze consensus ──
    const consensus = analyzeConsensus(responses)

    // ── 7. Build result ──
    const result: BatchResult = {
      responses,
      totalModels: models.length,
      respondedModels: responses.length,
      wallTimeMs,
      consensus,
    }

    // ── 8. Post summary to parent session (fire-and-forget for UI browsing) ──
    const summaryText = [
      `Batch dispatch complete.`,
      `Pattern: ${patternName || "custom"}`,
      `Models: ${responses.length}/${models.length} responded`,
      `Consensus: ${(consensus.score * 100).toFixed(0)}% agreement`,
      `Escalation: ${consensus.escalationAction}`,
      `Wall time: ${(wallTimeMs / 1000).toFixed(1)}s`,
    ].join("\n")

    fetch(`${OPENCODE_URL}/session/${parentSessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parts: [{ type: "text", text: summaryText }],
      }),
    }).catch(() => {}) // Fire-and-forget

    // ── 9. Archive old batches (background) ──
    archiveOldBatches().catch(() => {})

    // ── 10. Format and return output ──
    if (responses.length === 0) {
      return (
        `# Batch Dispatch Failed\n\n` +
        `**Pattern**: ${patternName || "custom"}\n` +
        `**Models Attempted**: ${models.length}\n` +
        `**Wall Time**: ${(wallTimeMs / 1000).toFixed(1)}s\n\n` +
        `No models responded successfully. ` +
        `Check that providers are configured and models are available.\n\n` +
        `**Session**: ${parentSessionId}`
      )
    }

    return formatBatchOutput(patternName, patternDesc, result, args.prompt)
  },
})
