# Feature Plan: Planning & Dispatch Improvements

> **Feature**: `planning-dispatch-improvements`
> **Created**: 2026-03-01
> **Status**: Active
> **Plan Mode**: Task Briefs (4 briefs)

---

## Feature Description

Improve the planning pipeline in three dimensions: (1) fix dispatch timeout handling so planning/execution agent sessions aren't killed prematurely, (2) deepen the `/planning` command's Phase 3 from a shallow 3-bullet "propose and confirm" step into a structured reasoning phase with Synthesize→Analyze→Decide→Decompose sub-phases, and (3) offload the heavyweight Phase 5 plan writing to a dedicated `plan-writer` sub-agent that writes one task brief per invocation, keeping the main planning context clean for discovery and reasoning.

## User Story

As a developer using the `/build` pipeline, I want planning sessions to complete successfully without timeout failures, produce deeply-reasoned plans through structured analysis, and keep the main planning context focused on thinking rather than consumed by writing thousands of lines of plan artifacts.

## Problem Statement

Three problems with the current planning pipeline:

1. **Timeout kills planning sessions**: `dispatch.ts` uses `AGENT_TIMEOUT_MS` (5 min) for direct agent calls and `AGENT_LONG_TIMEOUT_MS` (15 min) for cascade calls. Planning sessions routinely take 20-60+ minutes. The `AbortSignal.timeout()` kills the fetch, dispatch returns `null`, and `/build` sees "No model responded." The `NO_TIMEOUT_TASK_TYPES` set and `AGENT_SESSION_NO_TIMEOUT` constant were partially added but never wired through `execute()` or `dispatchCascade()`.

2. **Phase 3 is anemic**: The entire design/thinking phase of `/planning` is 6 lines — "propose approach, present alternatives, confirm direction." There's no structured analysis, no dependency mapping, no risk assessment, no failure mode thinking, no explicit reasoning about task decomposition. The model jumps from "research found stuff" to "here's the plan" with no visible thinking.

3. **Phase 5 consumes the context**: Writing `plan.md` (700-1000 lines) + N task briefs (700-1000 lines each) floods the main planning context. For a 6-task feature, that's ~5000 lines of file writes in the same context that did discovery and design. The main context should stay focused on thinking; writing should be offloaded.

Additionally, `build.md` line 221 has `timeout: 900` (likely meant 900_000ms but written as 900ms), which needs to be removed since the auto-detection via `NO_TIMEOUT_TASK_TYPES` handles it.

## Solution Statement

1. **Wire no-timeout through dispatch.ts**: Make `execute()` detect `NO_TIMEOUT_TASK_TYPES` and pass `AGENT_SESSION_NO_TIMEOUT` (0) as the timeout. Make `dispatchCascade()` accept a `taskType` parameter and use 0 when it matches. `dispatchAgent()` already handles `timeoutMs === 0` (skip `AbortSignal`).

2. **Expand Phase 3 with structured sub-phases**: Replace the 6-line Phase 3 with four sub-phases:
   - **3a. Synthesize**: Merge Phase 1 understanding + Phase 2 research into a distilled picture — what we know, what matters, what's noise, what's unknown
   - **3b. Analyze**: Dependency graph, critical path, risk assessment (HIGH/MEDIUM/LOW with mitigations), failure mode analysis (blast radius, rollback), interface boundaries (inputs/outputs/touches)
   - **3c. Decide**: Approach selection with explicit reasoning tied to analysis, rejected alternatives with specific reasons, key tradeoff accepted
   - **3d. Decompose**: Task breakdown with justification for each split, dependency chain, order rationale, confidence score with reasoning

3. **Create plan-writer sub-agent**: A dedicated agent in `.opencode/agents/plan-writer.md` specialized for writing plan artifacts. Reads `TASK-BRIEF-TEMPLATE.md` at runtime. Knows the 700-line requirement, rejection criteria, inline content rules. Invoked one brief per dispatch from `/planning` Phase 5.

4. **Update Phase 5 to offload writing**: When sub-agents are available, Phase 5 dispatches the plan-writer agent — once for `plan.md`, then once per `task-N.md` brief. Main context sends a structured prompt with all Phase 1-4 context. Main context verifies files were written correctly and does handoff/Archon sync.

5. **Remove `timeout: 900` from build.md**: The planning dispatch call in `/build` Step 4 has a hardcoded `timeout: 900`. Remove it — `NO_TIMEOUT_TASK_TYPES` auto-detection handles planning sessions now.

---

## Feature Metadata

| Field | Value |
|-------|-------|
| Complexity | Standard |
| Estimated Tasks | 4 |
| Mode | Task Briefs |
| Review Tier | Standard (batch free review) |
| Confidence | 8/10 |
| Key Risk | Phase 3 structure must be prescriptive enough that models follow it systematically, not so rigid it becomes checkbox-filling |

### Slice Guardrails

- Each task modifies 1 file (except Task 2 which modifies 2 tightly-coupled files: `planning.md` and `build.md`)
- No task exceeds 1000 lines of changes
- Each task is independently verifiable

---

## Context References

### dispatch.ts — Configuration Block (lines 1-22)

```typescript
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
```

**Analysis**: `AGENT_SESSION_NO_TIMEOUT` and `NO_TIMEOUT_TASK_TYPES` are already defined from a prior partial edit. They need to be wired into the `execute()` function and `dispatchCascade()` function.

### dispatch.ts — dispatchAgent() (lines 264-307)

```typescript
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
        model: { providerID: provider, modelID: model },
        parts: [{
          type: "subtask",
          prompt,
          description,
          agent: "general",
          model: { providerID: provider, modelID: model },
        }],
      }),
    }
    if (timeoutMs > 0) {
      fetchOptions.signal = AbortSignal.timeout(timeoutMs)
    }
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, fetchOptions)
    if (!response.ok) return null
    const data = await response.json()
    const text = extractTextFromParts(data)
    if (text) return text
    const subtaskParts = data?.parts?.filter((p: any) => p.type === "subtask") || []
    if (subtaskParts.length > 0 && subtaskParts[0].sessionID) {
      return await getSessionLastResponse(subtaskParts[0].sessionID)
    }
    return null
  } catch {
    return null
  }
}
```

**Analysis**: Already updated to conditionally skip `AbortSignal.timeout` when `timeoutMs === 0`. This is the foundation — the remaining work is passing `0` from upstream callers.

### dispatch.ts — dispatchCascade() (lines 374-420)

```typescript
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
```

**Analysis**: Hardcodes `AGENT_LONG_TIMEOUT_MS` (15 min) for agent mode. Needs to accept a `taskType` parameter and use `AGENT_SESSION_NO_TIMEOUT` when `taskType` is in `NO_TIMEOUT_TASK_TYPES`. The cascade is primarily used for `taskType: "planning"` (T0 route), so this is the critical path.

### dispatch.ts — execute() timeout selection (lines 591-599)

```typescript
  async execute(args, context) {
    const mode: DispatchMode = (args.mode as DispatchMode) || "text"
    const taskDescription = args.description || args.taskType || "Dispatch task"

    // Default timeouts by mode
    const defaultTimeout = mode === "command" ? COMMAND_TIMEOUT_MS
      : mode === "agent" ? AGENT_TIMEOUT_MS
      : TEXT_TIMEOUT_MS
    const timeoutMs = args.timeout || defaultTimeout
```

**Analysis**: Selects timeout by mode only, ignoring `taskType`. For agent mode, always uses 5 min. Need to check `NO_TIMEOUT_TASK_TYPES` and override to `AGENT_SESSION_NO_TIMEOUT` (0) when matched.

### dispatch.ts — execute() cascade call (lines 656-665)

```typescript
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
```

**Analysis**: Does not pass `taskType` to `dispatchCascade()`. Needs to pass `args.taskType` so cascade can use the no-timeout logic.

### dispatch.ts — execute() direct agent calls (lines 675-678, 705-708)

```typescript
      } else if (mode === "agent") {
        text = await dispatchAgent(
          sessionId, route.provider, route.model,
          args.prompt, taskDescription, timeoutMs,
        )
```

and fallback:

```typescript
        } else if (mode === "agent") {
          fallbackText = await dispatchAgent(
            sessionId, FALLBACK_ROUTE.provider, FALLBACK_ROUTE.model,
            args.prompt, taskDescription, timeoutMs,
          )
```

**Analysis**: Both use `timeoutMs` from the execute-level selection. Once we fix the timeout selection at the top of `execute()`, these will automatically get the right value.

### planning.md — Phase 3 (lines 172-182)

```markdown
## Phase 3: Design (Strategic Decisions)

Discuss the implementation approach with the user:

1. **Propose the approach** — "Here's how I'd build this: {approach}. The key decision is {X}."
2. **Present alternatives** — if multiple valid approaches exist, show 2-3 options with tradeoffs
3. **Confirm the direction** — "Lock in approach A? Or should we explore B more?"

For non-trivial architecture decisions, suggest council:
- "This has multiple valid approaches. Want to run `/council` to get multi-model input?"
```

**Analysis**: The entire thinking/reasoning phase is 6 lines of conversation prompts. No structured analysis, no synthesis of research findings, no risk assessment, no dependency mapping, no failure mode thinking, no explicit decomposition reasoning. This is the core gap — the model jumps from data gathering to decision without visible reasoning.

### planning.md — Phase 5 Write Plan (lines 231-317)

```markdown
## Phase 5: Write Plan

### Auto-Detect Complexity

After Phases 1-4 (discovery/design), assess complexity and select the output mode:

- **Task Brief Mode** (DEFAULT — use for all standard features)...
- **Master + Sub-Plan Mode** (EXCEPTION — escape hatch for genuinely complex features)...

### Task Brief Mode (Default)

**Step 1: Write `plan.md` (overview + task index)**

Every `plan.md` is 700-1000 lines...

**Step 2: Write task briefs (`task-N.md`) — one per target file**

Using `.opencode/templates/TASK-BRIEF-TEMPLATE.md` as the structural reference...
```

**Analysis**: Phase 5 writing happens inline in the main planning context. For a 6-task feature, this means ~5000 lines of file writes consuming the context window. The writing is mechanical once Phases 1-4 are done — it should be offloaded to a dedicated sub-agent.

### build.md — Planning dispatch call (lines 213-222)

```markdown
4. **Write or dispatch plan:**

   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /planning {spec-id} {spec-name} --auto-approve ...",
     taskType: "planning",
     timeout: 900,
   })
   ```
```

**Analysis**: `timeout: 900` is 900ms — almost certainly a typo for 900_000ms (15 min), but even 15 min is too short. This should be removed entirely since `NO_TIMEOUT_TASK_TYPES` auto-detection handles it.

### Existing agent patterns — code-review.md (100 lines)

The code-review agent is the closest structural analog for the plan-writer. It follows the standard agent skeleton:

```markdown
# Code Review Agent

Comprehensive code review agent covering type safety, security, architecture, performance, and quality.

## Purpose

Review code changes for bugs, security issues, architecture violations, and quality problems.
Reports findings at three severity levels — does NOT implement fixes.

## Review Dimensions

### 1. Type Safety
- Missing type hints / annotations
- Unsafe type casts or coercions
- Nullable value handling (missing null checks)
- Generic type misuse
- Type narrowing gaps

### 2. Security
- SQL injection, XSS, command injection
- Hardcoded secrets, API keys, passwords
- Insecure data handling (PII exposure, unencrypted storage)
- Missing input validation / sanitization
- Authentication / authorization gaps
- Insecure dependencies

### 3. Architecture
- Layer boundary violations (e.g., UI calling DB directly)
- Tight coupling between modules
- Dependency direction violations
- Convention drift from established patterns
- Missing abstractions or unnecessary abstractions
- SOLID principle violations

### 4. Performance
- N+1 query patterns
- O(n^2) or worse algorithms where O(n) is possible
- Memory leaks (unclosed resources, growing collections)
- Unnecessary computation (redundant loops, repeated calculations)
- Missing caching where appropriate
- Blocking operations in async contexts

### 5. Code Quality
- DRY violations (duplicated logic)
- Unclear naming (variables, functions, types)
- Missing or misleading comments
- Overly complex functions (high cyclomatic complexity)
- Missing error handling
- Dead code

## Severity Levels

### Critical (blocks commit)
### Major (fix soon)
### Minor (consider fixing)

## Output Format

CODE REVIEW: {scope}
Critical/Major/Minor findings with file:line references
Summary and Recommendation

## Rules

- Always include `file:line` references for every finding
- Be specific about fixes — "add null check" not "handle edge cases"
- If you find 0 issues, say so clearly — don't inflate findings
```

**Analysis**: Key structural observations for the plan-writer:
1. **Purpose** clearly states what the agent does AND does NOT do
2. **Domain sections** (Review Dimensions) contain the specialized knowledge — for plan-writer, this becomes Artifact Types and Quality Criteria
3. **Output Format** prescribes exact output structure — for plan-writer, this is file writes plus a completion report
4. **Rules** are hard constraints with actionable specifics, not vague guidelines
5. The agent is ~100 lines — lean enough to be fully loaded into context. The plan-writer targets ~150 lines.

### Existing agent patterns — planning-research.md (69 lines)

```markdown
# Planning Research Agent

Knowledge base search and completed plan reference agent for `/planning`.

## Purpose

Search the Archon RAG knowledge base and scan completed plans in `.agents/features/` to provide
research context for planning sessions. Returns structured findings that inform plan design
without consuming main conversation context.

## Capabilities

- **RAG knowledge search**: Query Archon RAG for architecture patterns, code examples, and best practices
- **Completed plan mining**: Scan `.agents/features/*/plan.done.md` and `.agents/features/*/task-{N}.done.md`
- **Pattern synthesis**: Combine RAG and plan findings into actionable planning context

## Instructions

When invoked with a feature description:
1. Search Archon RAG (if available)
2. Scan completed plans
3. Synthesize findings

## Output Format

## Planning Research: {feature topic}
### RAG Findings
### Completed Plan References
### Recommended Patterns
### Warnings

## Rules

- Never modify files — this is a read-only research agent
- Keep RAG queries SHORT (2-5 keywords) for best vector search results
- Only reference completed artifacts (`.done.md`)
- Always cite sources (RAG page URLs or plan file paths)
```

**Analysis**: This is the read-side counterpart to the plan-writer. Key pattern observations:
1. The **Capabilities** section (what the agent can do) maps to the plan-writer's **Artifact Types** section (what it produces)
2. The **Instructions** section (step-by-step process) maps to the plan-writer's **Writing Process** section
3. Read-only agents produce text output to the caller. Write agents produce files on disk. The plan-writer reports completion status to the caller after writing files.
4. The planning-research agent is invoked from Phase 2. The plan-writer is invoked from Phase 5. They bracket the planning process — research in, artifacts out.

### TASK-BRIEF-TEMPLATE.md (534 lines)

The template defines the full structure of a task brief with all required sections:

```markdown
# Task Brief Template

> **Target Length**: Each task brief should be **700-1000 lines** when filled.
> **Self-containment rule**: Every line must be operationally useful.
> **Granularity rule**: One task brief = one target file.
> **Inline content rule**: All context must be pasted directly into the brief in code blocks.

Required sections:
- OBJECTIVE — one sentence, the test for "done"
- SCOPE — files touched, out of scope, dependencies
- PRIOR TASK CONTEXT — what task N-1 did
- CONTEXT REFERENCES — files with line ranges + full content pasted inline
- PATTERNS TO FOLLOW — complete code snippets (NOT summaries)
- STEP-BY-STEP TASKS — each step with Current/Replace blocks, PATTERN, GOTCHA, VALIDATE
- TESTING STRATEGY — unit, integration, edge cases
- VALIDATION COMMANDS — L1 through L5
- ACCEPTANCE CRITERIA — Implementation + Runtime checkboxes
- HANDOFF NOTES — what task N+1 needs
- COMPLETION CHECKLIST — all boxes must be checked

Rejection criteria:
- Under 700 lines
- Uses "see lines X-Y" instead of pasting content inline
- Skips any required section
- Current/Replace blocks that abbreviate or use "..."
- Covers 3+ files without justification
```

**Analysis**: The plan-writer agent must read this full 534-line file at runtime (using the Read tool) and follow its structure when writing task briefs. The agent definition references this file but does NOT embed it — keeping the template as single-source-of-truth. If the template evolves, the plan-writer automatically uses the updated version without needing its own definition updated.

### Phase 2 Sub-Agent Invocation Pattern (from planning.md lines 98-157)

The Phase 2 sub-agent invocation is the pattern that Phase 5 sub-agent offload follows:

```markdown
### 2b. Launch parallel research agents:

Launch ALL three agents in a single message (parallel Task tool calls).

**Agent 1: research-codebase** (Task tool, subagent_type: "explore")
Prompt: "Thorough exploration for planning context.
Feature: {feature description from Phase 1}
Find: 1. Files with patterns... 2. Integration points... 3. Naming conventions...
Return: structured findings with exact file:line references."

**Agent 2: research-external** (Task tool, subagent_type: "explore")
Prompt: "Research external documentation and best practices.
Feature: {feature description}...
Return: findings with source URLs/citations."

**Agent 3: planning-research** (Task tool, subagent_type: "explore")
Prompt: "Search for planning context from knowledge base and completed plans.
Feature: {feature description}...
Return: structured findings with sources."

### 2c. Collect and share findings:
When all three agents return:
1. Read each agent's summary
2. Share key findings with the user
3. Merge findings into the working context for Phase 3

**Fallback**: If Task tool is unavailable, do research inline...
```

**Analysis**: Key differences between Phase 2 and Phase 5 sub-agent usage:
1. Phase 2 launches agents **in parallel** (independent research). Phase 5 launches agents **sequentially** (each brief depends on the prior one's handoff notes).
2. Phase 2 agents **return text summaries** to the main context. Phase 5 agents **write files to disk** — the main context verifies file existence and quality.
3. Phase 2 has a **binary fallback** (all agents or none). Phase 5 has a **per-artifact fallback** (individual brief failures fall back to inline, systemic failure falls back entirely).
4. Both follow the same structural pattern: "If Task tool available → sub-agent path. If unavailable → inline fallback."

---

## Patterns to Follow

### Agent Definition Pattern (from `code-review.md`)

```markdown
# {Agent Name}

{One-line description}

## Purpose

{What the agent does. What it produces. What it does NOT do.}

## {Structured Sections}

{Domain-specific knowledge the agent needs}

## Output Format

{Exact format of what the agent produces}

## Rules

{Constraints, rejection criteria, hard requirements}
```

- Why this pattern: All existing agents follow it. The plan-writer agent follows the same structure.
- How to apply: Purpose = "write plan artifacts." Structured sections = plan.md structure + brief structure + quality criteria. Output format = file writes. Rules = 700-line minimum, inline content, rejection criteria.

### Sub-Agent Invocation Pattern (from planning.md Phase 2)

```markdown
**Agent 1: research-codebase** (Task tool, subagent_type: "explore")
```
Prompt: "Thorough exploration for planning context.
Feature: {feature description from Phase 1}
Find: ...
Return: structured findings with exact file:line references."
```

- Why this pattern: Phase 2 already offloads research to sub-agents via Task tool. Phase 5 follows the same pattern but for writing instead of reading.
- How to apply: Phase 5 invokes `plan-writer` via Task tool. Prompt includes all Phase 1-4 context in structured format.

---

## Implementation Plan

### Overview

4 tasks, each modifying 1 file (Task 2 modifies 2 tightly-coupled files):

1. **Task 1**: Wire no-timeout through `dispatch.ts` — 3 touch points in `execute()` and `dispatchCascade()`
2. **Task 2**: Expand Phase 3 in `planning.md` + remove `timeout: 900` from `build.md` — the Phase 3 expansion is the heavyweight change, build.md is a 1-line removal bundled because it's trivially coupled
3. **Task 3**: Create `plan-writer.md` agent — new file, ~150 lines, specialized for plan artifact writing
4. **Task 4**: Update Phase 5 in `planning.md` to offload writing to plan-writer sub-agent — modifies the same file as Task 2 but in a different section (Phase 5 vs Phase 3), and Task 3 must complete first

### Task Dependency Chain

```
Task 1 (dispatch.ts) ──────────── independent
Task 2 (planning.md Phase 3 + build.md) ── independent
Task 3 (plan-writer.md) ──────── independent
Task 4 (planning.md Phase 5) ─── depends on Task 3 (agent must exist before Phase 5 references it)
```

Tasks 1, 2, 3 can execute in any order. Task 4 must run after Task 3.

### Phase 3 Design Rationale

The Phase 3 expansion is the most impactful change in this feature. Here's why each sub-phase exists:

**3a. Synthesize** exists because raw research data is not actionable. Phase 2 returns three separate reports (codebase patterns, external docs, prior plans). Without synthesis, the model picks an approach based on whichever finding it noticed last, not the full picture. Synthesis forces the model to explicitly merge all sources and identify unknowns.

**3b. Analyze** exists because design decisions without analysis are gut feelings. Dependency graphs prevent wrong task ordering. Risk assessment prevents surprise failures. Failure mode analysis prevents "it worked in dev but breaks in production." Interface boundaries prevent scope creep. These are not optional — they're the minimum thinking required before committing to an approach.

**3c. Decide** exists because approach selection must be traceable. "I'd build it like X" is not a decision — it's a preference. A decision has reasoning tied to analysis, explicitly rejected alternatives, and an acknowledged tradeoff. When a plan fails, traceability lets us identify which assumption was wrong.

**3d. Decompose** exists because task splitting is itself a design decision. "6 tasks" is not a decomposition — it's a count. A decomposition has per-task justification ("why is this a separate task?"), dependency chains ("what depends on what?"), ordering rationale ("why this order?"), and confidence assessment ("where might this plan fail?").

### Context Window Management

The sub-agent offload in Phase 5 addresses a real context window pressure:

| Artifact | Lines | Count | Total Lines |
|----------|-------|-------|-------------|
| plan.md | 700-1000 | 1 | 700-1000 |
| task-N.md | 700-1000 | 4-8 typical | 2800-8000 |
| Phase 3 output | 100-200 | 1 | 100-200 |
| **Total** | | | **3600-9200** |

Without offloading, a 6-task feature generates ~5800 lines of file writes in the main context — on top of the ~200 lines of Phase 3 reasoning, ~300 lines of research summaries, and ~100 lines of conversation. That's ~6400 lines in one context window.

With offloading, the main context handles ~600 lines (conversation + research + reasoning + verification). Each plan-writer invocation handles ~800 lines (one artifact). No single context exceeds ~1000 lines of generated content.

---

## Step-by-Step Tasks (Summary)

### Task 1: UPDATE `dispatch.ts` — Wire NO_TIMEOUT_TASK_TYPES

- **ACTION**: UPDATE
- **TARGET**: `.opencode/tools/dispatch.ts`
- **IMPLEMENT**: 
  1. In `execute()`, after computing `defaultTimeout`, check if `args.taskType` is in `NO_TIMEOUT_TASK_TYPES` and override to `AGENT_SESSION_NO_TIMEOUT` when mode is agent
  2. Add `taskType?: string` parameter to `dispatchCascade()` signature
  3. In `dispatchCascade()`, use `AGENT_SESSION_NO_TIMEOUT` instead of `AGENT_LONG_TIMEOUT_MS` when `taskType` is in `NO_TIMEOUT_TASK_TYPES`
  4. Pass `args.taskType` in the `dispatchCascade()` call from `execute()`
- **VALIDATE**: TypeScript compiles, dispatch with `taskType: "planning"` produces `timeoutMs === 0` path

### Task 2: UPDATE `planning.md` Phase 3 + `build.md` timeout removal

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/planning.md` (Phase 3) + `.opencode/commands/build.md` (line 221)
- **IMPLEMENT**:
  1. Replace Phase 3 (lines 172-182) with expanded Synthesize→Analyze→Decide→Decompose structure (~120 lines)
  2. Remove `timeout: 900,` from build.md dispatch call
- **VALIDATE**: planning.md Phase 3 has all 4 sub-phases with structured output formats; build.md dispatch call has no timeout field

### Task 3: CREATE `plan-writer.md` — Dedicated plan-writer sub-agent

- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/plan-writer.md`
- **IMPLEMENT**: Write a ~150 line agent definition following the `code-review.md` pattern. Purpose: write plan artifacts (plan.md or individual task-N.md briefs). Knows the plan.md structure, reads TASK-BRIEF-TEMPLATE.md at runtime, follows rejection criteria, writes one artifact per invocation.
- **VALIDATE**: Agent file exists, follows established agent pattern, covers all required sections

### Task 4: UPDATE `planning.md` Phase 5 — Offload writing to plan-writer

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/planning.md` (Phase 5)
- **IMPLEMENT**: Add sub-agent offload path to Phase 5. When Task tool is available, invoke `plan-writer` agent — once for `plan.md`, then once per `task-N.md`. Main context sends structured prompt with Phase 1-4 context. Main context verifies files and does handoff/Archon sync. Fallback: write inline (current behavior).
- **VALIDATE**: planning.md Phase 5 has both sub-agent and inline paths with clear fallback

---

## Testing Strategy

### Manual Testing (Primary)

All changes are to markdown commands and TypeScript tool config. No unit test framework applies. Validation is:

1. **dispatch.ts**: Run dispatch with `taskType: "planning"` and verify the agent session runs without timeout
2. **planning.md Phase 3**: Run `/planning` on a test feature and verify the model produces all 4 sub-phases (Synthesize, Analyze, Decide, Decompose) with structured output
3. **plan-writer.md**: Invoke the plan-writer agent directly via Task tool and verify it writes a correctly-structured file
4. **planning.md Phase 5**: Run `/planning` end-to-end and verify Phase 5 dispatches to plan-writer and files are written correctly

### Edge Cases

- Planning session with 0 tasks (should be caught in Phase 4 preview)
- Plan-writer agent fails or times out (Phase 5 should fall back to inline writing)
- Feature with 10+ tasks (plan-writer handles one brief per dispatch, so this is N dispatches)
- `--auto-approve` mode (Phase 3 still runs in full — auto-approve only skips Phase 4 user prompt)

---

## Validation Commands

### Level 1: Syntax & Style
```bash
# Verify all modified files exist and are well-formed
cat .opencode/tools/dispatch.ts | head -30
cat .opencode/commands/planning.md | head -10
cat .opencode/agents/plan-writer.md | head -10
cat .opencode/commands/build.md | grep -A5 "dispatch plan"
```

### Level 2: Type Safety
```bash
# TypeScript compilation check for dispatch.ts
# (depends on project build setup — may need manual verification)
npx tsc --noEmit .opencode/tools/dispatch.ts 2>&1 || echo "Check manually"
```

### Level 3: Unit Tests
N/A — no unit test framework for command markdown files or tool TypeScript files in this project.

### Level 4: Integration Tests
N/A — integration tested via manual `/planning` and `/build` runs.

### Level 5: Manual Validation
1. Run `/planning test-feature` and verify Phase 3 produces structured analysis
2. Run dispatch with `taskType: "planning"` and verify no timeout abort
3. Invoke plan-writer agent and verify file output
4. Run full `/planning` and verify Phase 5 offloads to plan-writer

---

## Acceptance Criteria

### Implementation (verify during execution)

- [x] `dispatch.ts` `execute()` uses `AGENT_SESSION_NO_TIMEOUT` for planning/execution taskTypes
- [x] `dispatch.ts` `dispatchCascade()` accepts and uses `taskType` parameter for timeout selection
- [x] `dispatch.ts` cascade call in `execute()` passes `args.taskType`
- [x] `planning.md` Phase 3 has 4 sub-phases: Synthesize, Analyze, Decide, Decompose
- [x] Each sub-phase has a structured output format (not just conversation prompts)
- [x] `plan-writer.md` exists with Purpose, structured sections, Output Format, Rules
- [x] `plan-writer.md` instructs agent to read TASK-BRIEF-TEMPLATE.md at runtime
- [x] `planning.md` Phase 5 has sub-agent offload path using plan-writer
- [x] `planning.md` Phase 5 has inline fallback when sub-agents unavailable
- [x] `build.md` planning dispatch call has no `timeout` field

### Runtime (verify after testing)

- [ ] Dispatch with `taskType: "planning"` does not abort after 5 or 15 minutes
- [ ] `/planning` Phase 3 produces visible structured reasoning before plan writing
- [ ] Plan-writer agent produces files meeting 700-line minimum
- [ ] Phase 5 sub-agent offload works end-to-end

---

## Completion Checklist

- [x] All 4 task briefs executed
- [x] All acceptance criteria met
- [x] Manual validation passed
- [x] No regressions in existing `/planning`, `/build`, or dispatch behavior
- [x] All briefs marked `.done.md`

---

## Notes

### Key Design Decisions

1. **No-timeout rather than very-long-timeout**: Planning sessions have no predictable upper bound. A 2-hour timeout would still be arbitrary. Setting `timeoutMs === 0` to skip `AbortSignal` entirely is cleaner — if a session hangs, the user kills it manually.

2. **Phase 3 sub-phases are output structures, not conversation scripts**: The Synthesize/Analyze/Decide/Decompose phases produce structured artifacts (printed to output), not just conversation prompts. This forces the model to show its work rather than skipping to conclusions.

3. **Plan-writer as dedicated agent, not generic sub-agent**: A `general` sub-agent with a long prompt would work, but a dedicated `plan-writer` agent encodes the structural knowledge permanently. Every invocation gets the same quality standards without relying on the caller's prompt to specify them.

4. **One brief per dispatch for plan-writer**: Writing all briefs in one session risks context overflow on large features. One brief per dispatch keeps each invocation focused and manageable. Cross-brief coherence is maintained by passing prior brief handoff notes in each prompt.

5. **Template read at runtime, not embedded**: TASK-BRIEF-TEMPLATE.md is 534 lines. Embedding it in the agent definition would make the agent 700+ lines and duplicate the template. Reading at runtime keeps the agent lean and the template single-source-of-truth.

### Risks

- **Phase 3 quality depends on model capability**: Weaker models may produce shallow analysis even with structured prompts. Mitigated by using thinking models (T0 cascade) for planning.
- **Plan-writer may need iteration**: First version may not consistently hit 700-line briefs. The rejection criteria in the agent definition serve as guardrails, but may need tuning.

### Confidence Score

**8/10** — All changes are well-understood modifications to existing patterns. The dispatch timeout fix is mechanical. The Phase 3 expansion is the most impactful change and has the most risk of models not following the structure deeply enough. The plan-writer agent follows established patterns from code-review.md.

---

## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.done.md` | Wire NO_TIMEOUT_TASK_TYPES through dispatch.ts execute() and dispatchCascade() | done | 0 created, 1 modified |
| 2 | `task-2.done.md` | Expand planning.md Phase 3 to Synthesize→Analyze→Decide→Decompose + remove build.md timeout | done | 0 created, 2 modified |
| 3 | `task-3.done.md` | Create plan-writer.md dedicated sub-agent for plan artifact writing | done | 1 created, 0 modified |
| 4 | `task-4.done.md` | Update planning.md Phase 5 to offload writing to plan-writer sub-agent | done | 0 created, 1 modified |
