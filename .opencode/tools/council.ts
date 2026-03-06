import { tool } from "@opencode-ai/plugin"

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENCODE_URL = "http://127.0.0.1:4096"
const AGREEMENT_THRESHOLD = 0.7
const DEFAULT_TIMEOUT_MS = 90000
const ARCHIVE_AFTER_DAYS = 3
const ARCHIVE_AFTER_MS = ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000
const MAX_ARCHIVE_PER_RUN = 10

// Model configurations - verified working
const COUNCIL_MODELS = {
  quick: [
    { provider: "ollama", model: "glm-5", label: "GLM-5" },
    { provider: "ollama", model: "qwen3-next:80b", label: "QWEN3-NEXT" },
    { provider: "ollama", model: "kimi-k2.5", label: "KIMI-K2.5" },
  ],
  standard: [
    { provider: "ollama", model: "glm-5", label: "GLM-5" },
    { provider: "ollama", model: "glm-4.7", label: "GLM-4.7" },
    { provider: "ollama", model: "qwen3-next:80b", label: "QWEN3-NEXT" },
    { provider: "ollama", model: "kimi-k2.5", label: "KIMI-K2.5" },
    { provider: "ollama", model: "deepseek-v3.2", label: "DEEPSEEK-V3.2" },
  ],
}

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
  qualityScore: number
}

interface AgreementAnalysis {
  score: number              // 0.0 - 1.0
  conflicts: ConflictInfo[]
  themes: string[]
  bestResponder: ModelResponse | null
}

interface ConflictInfo {
  point1: string
  point2: string
  models: [string, string]
}

interface CouncilResult {
  topic: string
  modelCount: number
  wallTimeMs: number
  responses: ModelResponse[]
  analysis: AgreementAnalysis
  synthesis: string | null
}

interface DispatchResult {
  response: ModelResponse | null
  sessionId: string | null
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
// SERVER INTERACTION
// ============================================================================

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OPENCODE_URL}/global/health`, {
      signal: AbortSignal.timeout(5000)
    })
    if (!response.ok) return false
    const data = await response.json()
    return data.healthy === true
  } catch {
    return false
  }
}

async function createParentSession(topic: string): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `Council: ${topic.slice(0, 50)}` })
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.id
  } catch {
    return null
  }
}

async function createChildSession(
  parentId: string,
  modelLabel: string
): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `[${modelLabel}] Response`,
        parentID: parentId
      })
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.id
  } catch {
    return null
  }
}

async function updateSession(
  sessionId: string,
  updates: { title?: string; archived?: number }
): Promise<boolean> {
  try {
    const body: Record<string, unknown> = {}
    if (updates.title) body.title = updates.title
    if (updates.archived) body.time = { archived: updates.archived }

    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
    return response.ok
  } catch {
    return false
  }
}

async function postSummaryToParent(
  sessionId: string,
  summary: string
): Promise<boolean> {
  try {
    // Post as a text message to the parent session
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        parts: [{ type: "text", text: summary }]
      })
    })
    return response.ok
  } catch {
    return false
  }
}

async function listSessions(): Promise<SessionInfo[]> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session`)
    if (!response.ok) return []
    return await response.json()
  } catch {
    return []
  }
}

async function archiveSession(sessionId: string): Promise<boolean> {
  return updateSession(sessionId, { archived: Date.now() })
}

async function sendMessage(
  sessionId: string,
  provider: string,
  model: string,
  prompt: string
): Promise<string | null> {
  try {
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: { providerID: provider, modelID: model },
        parts: [{ type: "text", text: prompt }]
      }),
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS)
    })
    if (!response.ok) return null
    const data = await response.json()
    
    // Extract text from parts
    const textParts = data.parts?.filter((p: any) => p.type === "text") || []
    return textParts.map((p: any) => p.text).join("\n")
  } catch {
    return null
  }
}

// ============================================================================
// AUTO-ARCHIVE
// ============================================================================

async function archiveOldCouncils(): Promise<number> {
  try {
    const sessions = await listSessions()
    const now = Date.now()
    const cutoff = now - ARCHIVE_AFTER_MS
    let archived = 0

    for (const session of sessions) {
      // Only archive council parent sessions (not children)
      // Archive both parent and its children together
      if (
        session.title?.startsWith("Council:") &&
        !session.parentID &&
        !session.time?.archived &&
        session.time?.updated &&
        session.time.updated < cutoff
      ) {
        // Archive the parent
        const parentArchived = await archiveSession(session.id)
        if (parentArchived) {
          archived++
          
          // Archive all children of this parent
          for (const childSession of sessions) {
            if (childSession.parentID === session.id && !childSession.time?.archived) {
              await archiveSession(childSession.id)
            }
          }
        }
        
        // Limit archives per run to avoid slowdowns
        if (archived >= MAX_ARCHIVE_PER_RUN) break
      }
    }

    return archived
  } catch {
    return 0
  }
}

// ============================================================================
// DISPATCH ORCHESTRATION
// ============================================================================

function buildCouncilPrompt(topic: string): string {
  return `You are participating in a multi-model council discussion.

TOPIC: ${topic}

Give your honest analysis, opinion, or answer. Be specific and concrete.
If this is a decision, state your recommendation and why.
If this is a review, give strengths, risks, and improvements.

Keep your response to 200-400 words. Be direct.`
}

async function dispatchToSingleModel(
  config: ModelConfig,
  prompt: string,
  parentId: string
): Promise<DispatchResult> {
  const startTime = Date.now()
  
  // Create child session under parent
  const sessionId = await createChildSession(parentId, config.label)
  if (!sessionId) return { response: null, sessionId: null }
  
  // Send message (no cleanup - sessions persist!)
  const text = await sendMessage(sessionId, config.provider, config.model, prompt)
  if (!text) return { response: null, sessionId }
  
  const latencyMs = Date.now() - startTime
  
  return {
    response: {
      label: config.label,
      provider: config.provider,
      model: config.model,
      text,
      latencyMs,
      qualityScore: 0, // Calculated later in analysis
    },
    sessionId
  }
}

async function dispatchToAllModels(
  models: ModelConfig[],
  topic: string,
  parentId: string
): Promise<{ responses: ModelResponse[]; sessionIds: string[] }> {
  const prompt = buildCouncilPrompt(topic)
  
  // Dispatch to all models in parallel
  const results = await Promise.allSettled(
    models.map(m => dispatchToSingleModel(m, prompt, parentId))
  )
  
  // Collect responses and session IDs
  const responses: ModelResponse[] = []
  const sessionIds: string[] = []
  
  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.response) {
        responses.push(result.value.response)
      }
      if (result.value.sessionId) {
        sessionIds.push(result.value.sessionId)
      }
    }
  }
  
  return { responses, sessionIds }
}

// ============================================================================
// AGREEMENT ANALYSIS
// ============================================================================

function extractKeyPoints(text: string): string[] {
  // Extract actionable recommendations and key points
  const points: string[] = []
  
  // Split into sentences
  const sentences = text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
  
  // Look for recommendation patterns
  const recommendPatterns = [
    /\b(should|must|always|never|recommend|suggest|prefer|use|avoid|ensure)\b/i,
    /\b(best practice|important|critical|key|essential)\b/i,
  ]
  
  for (const sentence of sentences) {
    if (recommendPatterns.some(p => p.test(sentence))) {
      points.push(sentence.toLowerCase().trim())
    }
  }
  
  // If no patterns found, take first 3 sentences as key points
  if (points.length === 0) {
    points.push(...sentences.slice(0, 3).map(s => s.toLowerCase()))
  }
  
  return points.slice(0, 5) // Max 5 points per response
}

function calculateSimilarity(points1: string[], points2: string[]): number {
  if (points1.length === 0 || points2.length === 0) return 0.5 // Neutral if no points
  
  let matchCount = 0
  const allWords1 = new Set(points1.join(" ").split(/\s+/).filter(w => w.length > 3))
  const allWords2 = new Set(points2.join(" ").split(/\s+/).filter(w => w.length > 3))
  
  // Count shared significant words
  for (const word of allWords1) {
    if (allWords2.has(word)) matchCount++
  }
  
  const totalUnique = new Set([...allWords1, ...allWords2]).size
  if (totalUnique === 0) return 0.5
  
  return matchCount / totalUnique
}

function detectConflicts(
  responses: ModelResponse[]
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = []
  
  // Contradiction patterns (context-based)
  const contradictionPairs: [RegExp, RegExp][] = [
    [/\balways\s+use\b/i, /\bavoid\b|\bnever\s+use\b/i],
    [/\brecommend\b/i, /\bdon't\s+recommend\b|\bavoid\b/i],
    [/\bbest\s+practice\b/i, /\banti-?pattern\b|\bbad\s+practice\b/i],
    [/\bprefer\s+\w+/i, /\bavoid\s+\w+/i], // Prefer X vs Avoid Y (same concept)
    [/\buse\s+try[\s-]?catch\b/i, /\buse\s+\.catch\(\)\b/i], // Specific to error handling
  ]
  
  for (let i = 0; i < responses.length; i++) {
    for (let j = i + 1; j < responses.length; j++) {
      const text1 = responses[i].text.toLowerCase()
      const text2 = responses[j].text.toLowerCase()
      
      for (const [pattern1, pattern2] of contradictionPairs) {
        const match1 = pattern1.exec(text1)
        const match2 = pattern2.exec(text2)
        
        if (match1 && match2) {
          conflicts.push({
            point1: match1[0],
            point2: match2[0],
            models: [responses[i].label, responses[j].label]
          })
        }
        
        // Check reverse
        const match1r = pattern1.exec(text2)
        const match2r = pattern2.exec(text1)
        
        if (match1r && match2r) {
          conflicts.push({
            point1: match2r[0],
            point2: match1r[0],
            models: [responses[i].label, responses[j].label]
          })
        }
      }
    }
  }
  
  // Deduplicate conflicts
  const seen = new Set<string>()
  return conflicts.filter(c => {
    const key = `${c.point1}-${c.point2}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function extractCommonThemes(responses: ModelResponse[]): string[] {
  const allPoints = responses.flatMap(r => extractKeyPoints(r.text))
  
  // Count word frequency across all points
  const wordFreq = new Map<string, number>()
  for (const point of allPoints) {
    const words = point.split(/\s+/).filter(w => w.length > 4)
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
    }
  }
  
  // Find words that appear in multiple responses
  const threshold = Math.max(2, Math.floor(responses.length * 0.4))
  const commonWords = [...wordFreq.entries()]
    .filter(([_, count]) => count >= threshold)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
  
  return commonWords
}

function calculateQualityScore(response: ModelResponse): number {
  let score = 0
  const text = response.text
  
  // Length (20%) - optimal range 100-400 words
  const wordCount = text.split(/\s+/).length
  const lengthScore = Math.min(wordCount / 300, 1) * 0.2
  score += lengthScore
  
  // Specificity (30%) - code blocks, file refs, concrete examples
  if (text.includes("```")) score += 0.15
  if (/`[^`]+`/.test(text)) score += 0.10
  if (/\w+\.\w+/.test(text)) score += 0.05 // file.ext patterns
  
  // Actionability (30%) - imperative verbs, clear recommendations
  const actionWords = ["use", "implement", "add", "create", "avoid", "ensure", "always", "never", "should", "must"]
  const actionCount = actionWords.filter(w => text.toLowerCase().includes(w)).length
  score += Math.min(actionCount / 5, 1) * 0.3
  
  // Structure (20%) - numbered lists, bullet points, sections
  if (/^\s*[-*•]\s/m.test(text)) score += 0.10
  if (/^\s*\d+[.)]\s/m.test(text)) score += 0.10
  
  return Math.min(score, 1)
}

function analyzeAgreement(responses: ModelResponse[]): AgreementAnalysis {
  if (responses.length === 0) {
    return { score: 0, conflicts: [], themes: [], bestResponder: null }
  }
  
  if (responses.length === 1) {
    const r = responses[0]
    r.qualityScore = calculateQualityScore(r)
    return { score: 1, conflicts: [], themes: [], bestResponder: r }
  }
  
  // Calculate quality scores
  for (const response of responses) {
    response.qualityScore = calculateQualityScore(response)
  }
  
  // Extract key points from each response
  const pointsByResponse = responses.map(r => extractKeyPoints(r.text))
  
  // Calculate pairwise similarity
  let totalSimilarity = 0
  let pairCount = 0
  
  for (let i = 0; i < pointsByResponse.length; i++) {
    for (let j = i + 1; j < pointsByResponse.length; j++) {
      totalSimilarity += calculateSimilarity(pointsByResponse[i], pointsByResponse[j])
      pairCount++
    }
  }
  
  const agreementScore = pairCount > 0 ? totalSimilarity / pairCount : 0.5
  
  // Detect conflicts
  const conflicts = detectConflicts(responses)
  
  // Extract common themes
  const themes = extractCommonThemes(responses)
  
  // Find best responder
  const bestResponder = responses.reduce((best, r) => 
    r.qualityScore > best.qualityScore ? r : best
  )
  
  return {
    score: agreementScore,
    conflicts,
    themes,
    bestResponder,
  }
}

// ============================================================================
// SYNTHESIS
// ============================================================================

function buildSynthesisPrompt(
  topic: string,
  responses: ModelResponse[],
  conflicts: ConflictInfo[]
): string {
  const responsesText = responses
    .map(r => `[${r.label}]:\n${r.text}`)
    .join("\n\n---\n\n")
  
  const conflictsText = conflicts.length > 0
    ? `\nDETECTED CONFLICTS:\n${conflicts.map(c => 
        `- ${c.models[0]} says "${c.point1}" vs ${c.models[1]} says "${c.point2}"`
      ).join("\n")}`
    : ""
  
  return `You are synthesizing a multi-model council discussion.

TOPIC: ${topic}

MODEL RESPONSES:
${responsesText}
${conflictsText}

TASK: Synthesize these perspectives into a clear recommendation.
- Acknowledge where models agree
- Resolve conflicts with reasoning
- Provide a final actionable recommendation
- Keep response under 200 words`
}

async function runSynthesis(
  bestResponder: ModelResponse,
  topic: string,
  responses: ModelResponse[],
  conflicts: ConflictInfo[],
  sessionId: string
): Promise<string> {
  const prompt = buildSynthesisPrompt(topic, responses, conflicts)
  
  // Use provided session (already created as child of parent)
  const text = await sendMessage(
    sessionId,
    bestResponder.provider,
    bestResponder.model,
    prompt
  )
  return text || "[Synthesis failed: no response]"
}

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

function formatCouncilOutput(result: CouncilResult): string {
  const lines: string[] = []
  
  // Header - simple markdown
  lines.push(`# Council: ${result.topic}`)
  lines.push(`**${result.modelCount} models** | ${(result.wallTimeMs / 1000).toFixed(1)}s`)
  lines.push("")
  lines.push("---")
  lines.push("")
  
  // Individual responses
  for (const response of result.responses) {
    lines.push(`## ${response.label}`)
    lines.push(`*${response.provider}* | ${(response.latencyMs / 1000).toFixed(1)}s`)
    lines.push("")
    lines.push(response.text)
    lines.push("")
    lines.push("---")
    lines.push("")
  }
  
  // Analysis section
  lines.push("## Analysis")
  lines.push("")
  
  const agreementPct = Math.round(result.analysis.score * 100)
  const thresholdNote = agreementPct < 70 ? " (below threshold)" : ""
  lines.push(`**Agreement:** ${agreementPct}%${thresholdNote}`)
  lines.push("")
  
  if (result.analysis.conflicts.length > 0) {
    lines.push(`**Conflicts detected:** ${result.analysis.conflicts.length}`)
    for (const conflict of result.analysis.conflicts) {
      lines.push(`- ${conflict.models[0]} says "${conflict.point1}" vs ${conflict.models[1]} says "${conflict.point2}"`)
    }
    lines.push("")
  } else {
    lines.push("**Conflicts detected:** None")
    lines.push("")
  }
  
  if (result.analysis.themes.length > 0) {
    lines.push("**Common themes:**")
    for (const theme of result.analysis.themes) {
      lines.push(`- ${theme}`)
    }
    lines.push("")
  }
  
  // Synthesis section (if applicable)
  if (result.synthesis) {
    lines.push("---")
    lines.push("")
    const synthLabel = result.analysis.bestResponder?.label || "UNKNOWN"
    lines.push(`## Synthesis (by ${synthLabel})`)
    lines.push("")
    lines.push(result.synthesis)
  } else {
    lines.push("**Synthesis:** Skipped (strong agreement)")
  }
  
  lines.push("")
  
  return lines.join("\n")
}

function formatError(message: string): string {
  return `COUNCIL ERROR: ${message}\n\nMake sure OpenCode server is running: opencode serve`
}

// ============================================================================
// TOOL DEFINITION
// ============================================================================

export default tool({
  description: "Run multi-model council discussion with smart synthesis. Dispatches topic to 3-5 free AI models in parallel, analyzes agreement, and synthesizes only when models disagree.",
  args: {
    topic: tool.schema.string().describe("The topic, question, or decision to discuss"),
    quick: tool.schema.boolean().optional().describe("Use 3 models instead of 5 for faster results"),
  },
  async execute(args, context) {
    const startTime = Date.now()
    const models = args.quick ? COUNCIL_MODELS.quick : COUNCIL_MODELS.standard
    
    // Check server health first
    const healthy = await checkServerHealth()
    if (!healthy) {
      return formatError("OpenCode server not available at " + OPENCODE_URL)
    }
    
    // Auto-archive old councils (fire and forget)
    archiveOldCouncils().catch(() => {})
    
    // Phase 0: Create parent session for this council
    const parentId = await createParentSession(args.topic)
    if (!parentId) {
      return formatError("Failed to create council session")
    }
    
    // Phase 1: Parallel dispatch (creates child sessions)
    const { responses, sessionIds } = await dispatchToAllModels(models, args.topic, parentId)
    
    if (responses.length === 0) {
      return formatError("No models responded. Check provider connections.")
    }
    
    // Phase 2: Analyze agreement
    const analysis = analyzeAgreement(responses)
    
    // Phase 3: Smart synthesis (only if disagreement)
    let synthesis: string | null = null
    if (analysis.score < AGREEMENT_THRESHOLD || analysis.conflicts.length > 0) {
      if (analysis.bestResponder) {
        // Create synthesis child session
        const synthesisSessionId = await createChildSession(parentId, "SYNTHESIS")
        if (synthesisSessionId) {
          synthesis = await runSynthesis(
            analysis.bestResponder,
            args.topic,
            responses,
            analysis.conflicts,
            synthesisSessionId
          )
        }
      }
    }
    
    const wallTimeMs = Date.now() - startTime
    
    // Format result
    const result: CouncilResult = {
      topic: args.topic,
      modelCount: responses.length,
      wallTimeMs,
      responses,
      analysis,
      synthesis,
    }
    
    const output = formatCouncilOutput(result)
    
    // Phase 4: Post full output to parent session
    await postSummaryToParent(parentId, output)
    
    // Phase 5: Update parent title with summary stats
    const agreementPct = Math.round(analysis.score * 100)
    await updateSession(parentId, {
      title: `Council: ${args.topic.slice(0, 35)} (${agreementPct}% agree, ${responses.length} models)`
    })
    
    return output
  }
})
