import { tool } from "@opencode-ai/plugin"

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENCODE_URL = "http://127.0.0.1:4096"
const BENCHMARK_TIMEOUT_MS = 120_000   // 2 min per model (text mode)
const MODEL_SCORES_PATH = ".agents/specs/model-scores.json"

// ============================================================================
// MODEL LIST — agent-capable free models only
// Excludes: kimi-k2-thinking, cogito-2.1 (broken in agent mode — output raw tokens)
// ============================================================================

const BENCHMARK_MODELS: Array<{ provider: string; model: string; label: string }> = [
  // ollama (all models available on Ollama Cloud)
  { provider: "ollama", model: "qwen3.5:122b", label: "QWEN3.5-122B" },
  { provider: "ollama", model: "qwen3-coder-next", label: "QWEN3-CODER-NEXT" },
  { provider: "ollama", model: "qwen3-next:80b", label: "QWEN3-NEXT" },
  { provider: "ollama", model: "kimi-k2.5", label: "KIMI-K2.5" },
  { provider: "ollama", model: "minimax-m2.5", label: "MINIMAX-M2.5" },
  { provider: "ollama", model: "glm-5", label: "GLM-5" },
  { provider: "ollama", model: "glm-4.7", label: "GLM-4.7" },
  { provider: "ollama", model: "glm-4.6", label: "GLM-4.6" },
  { provider: "ollama", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
  { provider: "ollama", model: "devstral-2:123b", label: "DEVSTRAL-2" },
  { provider: "ollama", model: "gemini-3-flash-preview", label: "GEMINI-3-FLASH" },
  { provider: "ollama", model: "cogito-2.1:671b", label: "COGITO-2.1" },
]

// ============================================================================
// STANDARDIZED BENCHMARK DIFF (string-truncate — real E2E test case)
// Known ground truth: 2 real issues
//   - Major: maxLength < 0 not handled (truncate('hello', -1) returns 'h' unexpectedly)
//   - Minor: missing unicode/emoji edge case (emoji may be cut mid-character)
// ============================================================================

const BENCHMARK_DIFF = `diff --git a/src/strings.test.ts b/src/strings.test.ts
index 0cee003..dfe68fd 100644
--- a/src/strings.test.ts
+++ b/src/strings.test.ts
@@ -1,5 +1,5 @@
 import { describe, it, expect } from 'vitest';
-import { reverse, capitalize } from './strings';
+import { reverse, capitalize, truncate } from './strings';
 
 describe('reverse', () => {
   it('should reverse a string', () => {
@@ -44,3 +44,31 @@ describe('capitalize', () => {
     expect(capitalize('hElLo wOrLd')).toBe('HElLo WOrLd');
   });
 });
+
+describe('truncate', () => {
+  it('should truncate string and add ellipsis when over maxLength', () => {
+    expect(truncate('hello world', 5)).toBe('he...');
+  });
+
+  it('should return original string when fits within maxLength', () => {
+    expect(truncate('hi', 10)).toBe('hi');
+  });
+
+  it('should return empty string for empty input', () => {
+    expect(truncate('', 5)).toBe('');
+  });
+
+  it('should handle exact maxLength boundary', () => {
+    expect(truncate('hello', 5)).toBe('hello');
+  });
+
+  it('should handle maxLength exactly equal to ellipsis length', () => {
+    expect(truncate('hello', 3)).toBe('...');
+  });
+
+  it('should handle maxLength less than ellipsis length', () => {
+    expect(truncate('hello', 2)).toBe('he');
+    expect(truncate('hello', 1)).toBe('h');
+    expect(truncate('hello', 0)).toBe('');
+  });
+});
diff --git a/src/strings.ts b/src/strings.ts
index 593d0f0..a00905b 100644
--- a/src/strings.ts
+++ b/src/strings.ts
@@ -18,3 +18,19 @@ export function reverse(str: string): string {
 export function capitalize(str: string): string {
   return str.replace(/\\b\\w/g, (char) => char.toUpperCase());
 }
+
+/**
+ * Truncates a string to maxLength and adds ellipsis if truncated.
+ * @param str - The string to truncate
+ * @param maxLength - Maximum length including ellipsis
+ * @returns The truncated string with ellipsis, or original if fits
+ */
+export function truncate(str: string, maxLength: number): string {
+  if (maxLength < 3) {
+    return str.slice(0, maxLength);
+  }
+  if (str.length <= maxLength) {
+    return str;
+  }
+  return str.slice(0, maxLength - 3) + '...';
+}`

const BENCHMARK_PROMPT_TEMPLATE = `You are reviewing a code change. Analyze the diff below and report any issues.

Format your response EXACTLY as:
## Issues Found: N

### Issue 1
- **Severity**: Critical | Major | Minor | Style
- **File**: filename
- **Line**: line number
- **Description**: what's wrong
- **Fix**: how to fix it

If no issues found, respond:
## Issues Found: 0
No issues found.

---

DIFF:
{DIFF}`

// ============================================================================
// SERVER INTERACTION
// ============================================================================

async function createSession(title: string): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    })
    if (!response.ok) return null
    const data = await response.json()
    return data?.id || null
  } catch {
    return null
  }
}

async function sendTextMessage(
  sessionId: string,
  provider: string,
  model: string,
  prompt: string,
): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: { providerID: provider, modelID: model },
        parts: [{ type: "text", text: prompt }],
      }),
      signal: AbortSignal.timeout(BENCHMARK_TIMEOUT_MS),
    })
    if (!response.ok) return null
    const data = await response.json()
    const textParts = data?.parts?.filter((p: any) => p.type === "text") || []
    const text = textParts.map((p: any) => p.text).join("\n")
    return text || null
  } catch {
    return null
  }
}

// ============================================================================
// SCORING
// ============================================================================

// Parse model response to extract issue count and format compliance.
// Ground truth: 2 real issues exist in the benchmark diff.
function scoreResponse(response: string): {
  issuesFound: number
  formatCompliance: number    // 0-10
  reviewQuality: number       // 0-10
  falsePositiveEstimate: number  // 0.0-1.0
} {
  // Format compliance: check for expected markers
  let formatScore = 0
  if (response.includes("## Issues Found:")) formatScore += 3
  if (response.includes("### Issue")) formatScore += 2
  if (response.includes("**Severity**:")) formatScore += 2
  if (response.includes("**File**:")) formatScore += 1
  if (response.includes("**Line**:")) formatScore += 1
  if (response.includes("**Fix**:")) formatScore += 1

  // Extract issue count
  const countMatch = response.match(/## Issues Found:\s*(\d+)/i)
  const issuesFound = countMatch ? parseInt(countMatch[1], 10) : 0

  // Review quality heuristic (known ground truth: 2 real issues exist)
  // - Found 0: missed all issues (score 3)
  // - Found 1: caught one (score 7)
  // - Found 2: caught both — ideal (score 9)
  // - Found 3-4: may have false positives (score 5-6)
  // - Found 5+: excessive false positives (score 2-4)
  let qualityScore = 5
  if (issuesFound === 0) qualityScore = 3
  else if (issuesFound === 1) qualityScore = 7
  else if (issuesFound === 2) qualityScore = 9
  else if (issuesFound === 3) qualityScore = 6
  else if (issuesFound === 4) qualityScore = 5
  else qualityScore = Math.max(2, 5 - (issuesFound - 4))

  // False positive estimate (known: 2 real issues)
  const falsePositives = Math.max(0, issuesFound - 2)
  const falsePositiveRate = issuesFound > 0 ? falsePositives / issuesFound : 0

  return {
    issuesFound,
    formatCompliance: formatScore,
    reviewQuality: qualityScore,
    falsePositiveEstimate: parseFloat(falsePositiveRate.toFixed(2)),
  }
}

// ============================================================================
// RESULTS PERSISTENCE
// ============================================================================

async function readScores(): Promise<any> {
  try {
    const { readFileSync, existsSync } = await import("node:fs")
    if (!existsSync(MODEL_SCORES_PATH)) {
      return { models: {}, interferenceLog: [], codeLoopLineup: [] }
    }
    return JSON.parse(readFileSync(MODEL_SCORES_PATH, "utf-8"))
  } catch {
    return { models: {}, interferenceLog: [], codeLoopLineup: [] }
  }
}

async function writeScores(scores: any): Promise<void> {
  try {
    const { writeFileSync, existsSync, mkdirSync } = await import("node:fs")
    const { dirname } = await import("node:path")
    const dir = dirname(MODEL_SCORES_PATH)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    writeFileSync(MODEL_SCORES_PATH, JSON.stringify(scores, null, 2))
  } catch {
    // Silent fail
  }
}

// ============================================================================
// CODE LOOP LINEUP AUTO-SELECTION (shared logic — also called from dispatch.ts)
// ============================================================================

interface ModelScore {
  provider: string
  model: string
  interferenceCount: number
  dispatchCount: number
  benchmark?: {
    responseTimeMs: number
    reviewQuality: number
    formatCompliance: number
    issuesFound: number
    falsePositiveRate: number
    timestamp: string
  }
}

// Composite score: weighted sum of review quality, format compliance, response time,
// and false positive rate. Models with interference are disqualified.
function computeCompositeScore(m: ModelScore): number {
  if (!m.benchmark) return -1  // No benchmark = not eligible

  const interferenceRate = m.dispatchCount > 0
    ? m.interferenceCount / m.dispatchCount
    : 0

  // Disqualify models with any interference
  if (interferenceRate > 0) return -1

  // Weighted score (out of ~10):
  //   reviewQuality:    40% (most important)
  //   formatCompliance: 25% (need parseable output)
  //   responseTime:     15% (prefer faster; normalize 0-10 over 30s range)
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
    const scores = await readScores()
    if (!scores.models) return
    scores.codeLoopLineup = generateCodeLoopLineup(scores.models)
    await writeScores(scores)
  } catch {
    // Silent fail
  }
}

// ============================================================================
// TOOL EXPORT
// ============================================================================

export default tool({
  description:
    "Benchmark all free AI models on a standardized code review task. " +
    "Sends the same code review prompt (a real git diff) to each model via text-mode dispatch, " +
    "scores each response on review quality, format compliance, and false positive rate, " +
    "and writes results to .agents/specs/model-scores.json. " +
    "After benchmarking, auto-generates the codeLoopLineup (top 3 models for /code-loop gauntlet). " +
    "Run once to populate the scorecard; re-run to refresh scores.",

  args: {
    diff: tool.schema
      .string()
      .optional()
      .describe(
        "Custom diff to use as benchmark prompt. " +
        "If omitted, uses the built-in string-truncate diff (45 lines, 2 files, 2 known issues).",
      ),

    models: tool.schema
      .string()
      .optional()
      .describe(
        "Comma-separated list of 'provider/model' to benchmark. " +
        "Example: 'ollama/glm-5,ollama/deepseek-v3.2'. " +
        "If omitted, benchmarks all ~20 free models.",
      ),
  },

  async execute(args) {
    // ── 1. Build the prompt ──
    const diffContent = args.diff || BENCHMARK_DIFF
    const prompt = BENCHMARK_PROMPT_TEMPLATE.replace("{DIFF}", diffContent)

    // ── 2. Parse model list ──
    let modelsToRun = BENCHMARK_MODELS
    if (args.models) {
      const requested = args.models.split(",").map(s => s.trim()).filter(Boolean)
      modelsToRun = requested.map(spec => {
        const slashIdx = spec.indexOf("/")
        if (slashIdx === -1) return null
        const provider = spec.slice(0, slashIdx)
        const model = spec.slice(slashIdx + 1)
        return { provider, model, label: `${provider}/${model}` }
      }).filter((m): m is NonNullable<typeof m> => m !== null)

      if (modelsToRun.length === 0) {
        return "# Benchmark Error\n\nNo valid models parsed from `models` argument. " +
          "Expected format: 'provider/model,provider/model,...'"
      }
    }

    // ── 3. Check server health ──
    try {
      const healthResp = await fetch(`${OPENCODE_URL}/global/health`, {
        signal: AbortSignal.timeout(5_000),
      })
      const health = await healthResp.json()
      if (health?.healthy !== true) {
        return `# Benchmark Error\n\nOpenCode server not healthy at ${OPENCODE_URL}. ` +
          `Make sure \`opencode serve\` is running.`
      }
    } catch {
      return `# Benchmark Error\n\nOpenCode server not reachable at ${OPENCODE_URL}. ` +
        `Make sure \`opencode serve\` is running.`
    }

    // ── 4. Load existing scores (merge don't overwrite) ──
    const scores = await readScores()
    if (!scores.models) scores.models = {}
    if (!scores.interferenceLog) scores.interferenceLog = []

    // ── 5. Run benchmark for each model sequentially ──
    const results: Array<{
      label: string
      provider: string
      model: string
      responseTimeMs: number | null
      reviewQuality: number | null
      formatCompliance: number | null
      issuesFound: number | null
      falsePositiveRate: number | null
      error?: string
    }> = []

    const totalModels = modelsToRun.length
    let completed = 0

    for (const m of modelsToRun) {
      const modelKey = `${m.provider}/${m.model}`
      const sessionId = await createSession(`Benchmark: ${m.label}`)

      if (!sessionId) {
        results.push({
          label: m.label,
          provider: m.provider,
          model: m.model,
          responseTimeMs: null,
          reviewQuality: null,
          formatCompliance: null,
          issuesFound: null,
          falsePositiveRate: null,
          error: "Failed to create session",
        })
        completed++
        continue
      }

      const start = Date.now()
      const response = await sendTextMessage(sessionId, m.provider, m.model, prompt)
      const responseTimeMs = Date.now() - start

      if (!response) {
        results.push({
          label: m.label,
          provider: m.provider,
          model: m.model,
          responseTimeMs: null,
          reviewQuality: null,
          formatCompliance: null,
          issuesFound: null,
          falsePositiveRate: null,
          error: "No response (timeout or error)",
        })

        // Record in scores with null benchmark
        if (!scores.models[modelKey]) {
          scores.models[modelKey] = {
            provider: m.provider,
            model: m.model,
            interferenceCount: 0,
            dispatchCount: 0,
          }
        }
        scores.models[modelKey].benchmarkError = "No response"
        scores.models[modelKey].benchmarkTimestamp = new Date().toISOString()
        completed++
        continue
      }

      const scored = scoreResponse(response)

      results.push({
        label: m.label,
        provider: m.provider,
        model: m.model,
        responseTimeMs,
        reviewQuality: scored.reviewQuality,
        formatCompliance: scored.formatCompliance,
        issuesFound: scored.issuesFound,
        falsePositiveRate: scored.falsePositiveEstimate,
      })

      // Merge benchmark results into existing model entry
      if (!scores.models[modelKey]) {
        scores.models[modelKey] = {
          provider: m.provider,
          model: m.model,
          interferenceCount: 0,
          dispatchCount: 0,
        }
      }
      scores.models[modelKey].benchmark = {
        responseTimeMs,
        reviewQuality: scored.reviewQuality,
        formatCompliance: scored.formatCompliance,
        issuesFound: scored.issuesFound,
        falsePositiveRate: scored.falsePositiveEstimate,
        timestamp: new Date().toISOString(),
      }
      // Clear any prior error
      delete scores.models[modelKey].benchmarkError
      delete scores.models[modelKey].benchmarkTimestamp

      completed++
    }

    // ── 6. Write results to model-scores.json ──
    await writeScores(scores)

    // ── 7. Refresh code loop lineup ──
    await refreshCodeLoopLineup()

    // Re-read to show the updated lineup
    const finalScores = await readScores()
    const lineup = finalScores.codeLoopLineup || []

    // ── 8. Format summary table ──
    const successResults = results.filter(r => r.reviewQuality !== null)
    const failedResults = results.filter(r => r.reviewQuality === null)

    const tableRows = successResults
      .sort((a, b) => (b.reviewQuality || 0) - (a.reviewQuality || 0))
      .map(r => {
        const time = r.responseTimeMs ? `${(r.responseTimeMs / 1000).toFixed(1)}s` : "—"
        const issues = r.issuesFound !== null ? `${r.issuesFound}` : "—"
        const quality = r.reviewQuality !== null ? `${r.reviewQuality}/10` : "—"
        const format = r.formatCompliance !== null ? `${r.formatCompliance}/10` : "—"
        const fp = r.falsePositiveRate !== null ? `${(r.falsePositiveRate * 100).toFixed(0)}%` : "—"
        return `| ${r.label.padEnd(22)} | ${time.padEnd(7)} | ${issues.padEnd(6)} | ${quality.padEnd(8)} | ${format.padEnd(9)} | ${fp.padEnd(5)} |`
      })

    const tableHeader = [
      "| Model                   | Time    | Issues | Quality  | Format    | FP%   |",
      "|-------------------------|---------|--------|----------|-----------|-------|",
    ]

    const lineupSection = lineup.length > 0
      ? `\n## Code Loop Lineup (auto-selected)\n\n` +
        lineup.map((m: any, i: number) =>
          `${i + 1}. \`${m.label}\` — score: ${m.compositeScore}`
        ).join("\n") +
        `\n4. \`openai/gpt-5.3-codex\` — T4 gate (fixed)`
      : `\n## Code Loop Lineup\n\nInsufficient data for auto-selection (need benchmark results + interference data).`

    const failedSection = failedResults.length > 0
      ? `\n## Failed Models\n\n` +
        failedResults.map(r => `- \`${r.label}\`: ${r.error}`).join("\n")
      : ""

    return (
      `# Benchmark Results\n\n` +
      `**Models tested**: ${totalModels} | **Completed**: ${successResults.length} | **Failed**: ${failedResults.length}\n` +
      `**Results saved**: \`${MODEL_SCORES_PATH}\`\n\n` +
      `## Scores (sorted by review quality)\n\n` +
      tableHeader.join("\n") + "\n" +
      tableRows.join("\n") +
      lineupSection +
      failedSection
    )
  },
})
