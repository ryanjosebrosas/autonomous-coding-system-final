# Task 2 of 4: Expand Planning Phase 3 + Remove build.md Timeout

> **Feature**: `planning-dispatch-improvements`
> **Brief Path**: `.agents/features/planning-dispatch-improvements/task-2.md`
> **Plan Overview**: `.agents/features/planning-dispatch-improvements/plan.md`

---

## OBJECTIVE

Replace the 6-line Phase 3 in `planning.md` with a structured reasoning phase containing four sub-phases (Synthesize, Analyze, Decide, Decompose) and remove the `timeout: 900` from `build.md`'s planning dispatch call.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/planning.md` | UPDATE | Phase 3 (lines 172-182) replaced with ~130-line structured reasoning phase |
| `.opencode/commands/build.md` | UPDATE | Remove `timeout: 900,` from planning dispatch call (line 221) |

**Out of Scope:**
- Phase 1 (Understand) — no changes
- Phase 2 (Explore) — no changes
- Phase 4 (Preview) — no changes
- Phase 5 (Write Plan) — handled in Task 4
- dispatch.ts timeout logic — handled in Task 1
- plan-writer.md agent — handled in Task 3

**Dependencies:**
- Task 1 should complete first (dispatch.ts timeout fix) so that the build.md timeout removal is safe. However, this task can execute independently — the build.md change is a deletion, not dependent on Task 1's code.

---

## PRIOR TASK CONTEXT

**Files Changed in Task 1:**
- `.opencode/tools/dispatch.ts` — Wired `NO_TIMEOUT_TASK_TYPES` through `execute()` and `dispatchCascade()`. Planning/execution agent sessions now run without timeout.

**State Carried Forward:**
- `dispatch.ts` no longer needs explicit `timeout` values for planning dispatches — the `NO_TIMEOUT_TASK_TYPES` auto-detection handles it
- This is why `build.md`'s `timeout: 900` can be safely removed

**Known Issues or Deferred Items:**
- None from Task 1 that affect this task

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/planning.md` (lines 170-230) — Why: Phase 3 (to replace) and Phase 4 (to understand what Phase 3 feeds into)
- `.opencode/commands/planning.md` (lines 1-36) — Why: Core rules and feature description — understand the planning philosophy
- `.opencode/commands/planning.md` (lines 87-168) — Why: Phase 2 (Explore) — understand what research data Phase 3 receives
- `.opencode/commands/build.md` (lines 213-232) — Why: The dispatch call with `timeout: 900` to remove

### Current Content: Planning Phase 3 (Lines 170-183)

```markdown
---

## Phase 3: Design (Strategic Decisions)

Discuss the implementation approach with the user:

1. **Propose the approach** — "Here's how I'd build this: {approach}. The key decision is {X}."
2. **Present alternatives** — if multiple valid approaches exist, show 2-3 options with tradeoffs
3. **Confirm the direction** — "Lock in approach A? Or should we explore B more?"

For non-trivial architecture decisions, suggest council:
- "This has multiple valid approaches. Want to run `/council` to get multi-model input?"

---
```

**Analysis**: This is the entire thinking phase — 6 lines of conversation prompts. No structured analysis, no synthesis of research findings, no risk assessment, no dependency mapping, no failure mode thinking, no explicit decomposition reasoning. The model jumps from "research found stuff" to "I'd build it like X" with no visible reasoning process. This is the core gap in the planning pipeline.

### Current Content: Planning Core Rules (Lines 28-34)

```markdown
## Core Rules

1. **Discovery first, plan second.** Do NOT auto-generate a plan. Ask questions, discuss approaches, explore the codebase together.
2. **Work WITH the user.** This is a conversation. Ask short questions, confirm insights, discuss tradeoffs.
3. **No code in this phase.** Planning produces a plan document, not code.
4. **Plan-before-execute.** `/execute` only runs from a `/planning`-generated artifact in `.agents/features/{feature}/`.
```

**Analysis**: Core Rule 1 says "discovery first, plan second" — but Phase 3 skips the thinking step between discovery and planning. The expanded Phase 3 fills this gap: discovery (Phase 1) → research (Phase 2) → **reasoning** (Phase 3) → preview (Phase 4) → writing (Phase 5).

### Current Content: Planning Phase 2 Output (Lines 150-168)

```markdown
### 2c. Collect and share findings:

When all three agents return:
1. Read each agent's summary
2. Share key findings with the user: "Research found these patterns..." / "Past plan for {X} used this approach..."
3. Merge findings into the working context for Phase 3

**Fallback**: If Task tool is unavailable, do research inline using Glob/Grep/Read for codebase, Archon RAG for knowledge base, and WebFetch for external docs. The agent prompts above serve as a checklist for what to cover.

### 2d. Dispatch for deep research (optional, when agents aren't enough):

| Need | Tier | Approach |
|------|------|----------|
| Quick factual check | T1 | Dispatch quick-check |
| API/pattern question | T1 | Dispatch api-analysis |
| Library comparison | T2 | Dispatch research |
| Documentation lookup | T1 | Dispatch docs-lookup |

If dispatch unavailable, use Archon RAG or web search.
```

**Analysis**: Phase 2 produces three categories of input for Phase 3: codebase patterns (from research-codebase agent), external best practices (from research-external agent), and prior planning patterns (from planning-research agent). Phase 3a (Synthesize) must explicitly reference these three sources when distilling findings.

### Current Content: Planning Phase 4 Preview (Lines 185-228)

```markdown
## Phase 4: Preview (Approval Gate)

Before writing the full plan, show a **1-page preview**:

```
PLAN PREVIEW: {spec-name}
=============================

What:      {1-line description}
Approach:  {the locked-in approach}
Files:     {create: X, modify: Y}
Key decision: {the main architectural choice and why}
Risks:     {top 1-2 risks}
Tests:     {testing approach}
Estimated tasks: {N tasks}
Mode:      {Task Briefs (N briefs, default) | Master + Sub-Plans (N phases, escape hatch)}
```

### If `--auto-approve` is set:

Run the self-review checklist instead of prompting the user:

1. All acceptance criteria from the spec (BUILD_ORDER or feature description) are addressed in the preview
2. File paths listed are correct and exist (or will be created)
3. The approach is consistent with established project patterns
4. Testing approach covers the acceptance criteria
5. No obvious gaps in the task breakdown

**If all checklist items pass:** Log the preview (print it to output for the record), then proceed directly to Phase 5.

**If any checklist item fails:** Log the preview with the failing items noted, then STOP and surface the issue — even in autonomous mode, a fundamentally flawed plan should not proceed.

```
AUTO-APPROVED: Plan preview passed self-review checklist. Proceeding to Phase 5.
```

### If `--auto-approve` is NOT set (default):

```
Approve this direction to write the full plan? [y/n/adjust]
```

Only write the plan file after explicit approval.
```

**Analysis**: Phase 4 expects Phase 3 to have produced: a locked-in approach, a key decision, risks, testing approach, estimated tasks, and mode selection. The expanded Phase 3 must produce all of these explicitly so Phase 4 can reference them directly. Phase 3d (Decompose) produces the task count and order; Phase 3c (Decide) produces the approach and key decision; Phase 3b (Analyze) produces risks.

### Current Content: build.md Planning Dispatch (Lines 213-232)

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
   The `--auto-approve` flag skips the interactive approval gate in `/planning` Phase 4 — the spec was already approved via BUILD_ORDER.
   Use a T1 thinking model for best results (reasoning produces better plans and task briefs).

   **If dispatch unavailable:**
   Write the plan directly using the `/planning` methodology. The primary model gathers context, runs discovery, and produces the structured plan inline.

   **If dispatch fails or times out:**
   - Fall back to the "If dispatch unavailable" path (write the plan inline).
   - Log: "Dispatch timed out for planning {spec-name} — falling back to inline planning."
```

**Analysis**: `timeout: 900` on line 221 is 900 milliseconds — almost certainly a typo for 900_000ms (15 min), but even 15 min is too short for planning. After Task 1 wires `NO_TIMEOUT_TASK_TYPES`, the `taskType: "planning"` auto-detection handles timeout correctly. Remove the `timeout` field entirely. Also update the "If dispatch fails or times out" section since timeout is no longer the expected failure mode.

### Patterns to Follow

**Phase 2 structured output pattern** (from planning.md Phase 2c):

```markdown
### 2c. Collect and share findings:

When all three agents return:
1. Read each agent's summary
2. Share key findings with the user: "Research found these patterns..." / "Past plan for {X} used this approach..."
3. Merge findings into the working context for Phase 3
```

- Why this pattern: Phase 2 produces structured findings that feed into Phase 3. Phase 3's sub-phases should similarly produce structured output that feeds into Phase 4.
- How to apply: Each Phase 3 sub-phase (Synthesize, Analyze, Decide, Decompose) produces a named output block that subsequent sub-phases and Phase 4 reference.
- Common gotchas: The output blocks must be prescribed format, not free-form prose. Free-form allows the model to skip thinking; structured format forces it.

**Structured analysis pattern** (from this plan's own Phase 3 discussion):

```
SYNTHESIS
=========
What we're building: {1 paragraph}
What we learned from research:
  - Codebase: {key patterns, integration points, gotchas}
  - External: {relevant docs, best practices, pitfalls}
  - Prior plans: {what worked, what to reuse}
What the user cares about most: {from Phase 1}
Constraints: {technical, time, compatibility}
Unknowns: {explicit gaps}

ANALYSIS
========
Dependency Graph: ...
Critical Path: ...
Risk Assessment: HIGH/MEDIUM/LOW with mitigations
Failure Modes: blast radius, rollback
Interface Boundaries: inputs, outputs, touches

APPROACH DECISION
=================
Chosen: {approach}
Why: {reasoning tied to analysis}
Rejected alternatives: {with specific reasons}
Key tradeoff: {what we're trading off and why}

TASK DECOMPOSITION
==================
Total tasks: {N}
Split rationale: {why N tasks}
Per-task: name, why separate, target file, depends on
Order rationale: {why this order}
Confidence: {X}/10 with reasoning
```

- Why this pattern: This was the structure approved in our design discussion. It forces the model to show its work at each step.
- How to apply: Translate this into the planning.md Phase 3 markdown format with clear instructions for each sub-phase.
- Common gotchas: The model may try to collapse sub-phases or skip the explicit "rejected alternatives" section. The instructions must make each section mandatory.

---

## STEP-BY-STEP TASKS

---

### Step 1: UPDATE `planning.md` — Replace Phase 3

**What**: Replace the 6-line Phase 3 with the expanded Synthesize→Analyze→Decide→Decompose structure.

**IMPLEMENT**:

Current (lines 170-183 of `.opencode/commands/planning.md`):
```markdown
---

## Phase 3: Design (Strategic Decisions)

Discuss the implementation approach with the user:

1. **Propose the approach** — "Here's how I'd build this: {approach}. The key decision is {X}."
2. **Present alternatives** — if multiple valid approaches exist, show 2-3 options with tradeoffs
3. **Confirm the direction** — "Lock in approach A? Or should we explore B more?"

For non-trivial architecture decisions, suggest council:
- "This has multiple valid approaches. Want to run `/council` to get multi-model input?"

---
```

Replace with:
```markdown
---

## Phase 3: Design (Structured Reasoning)

Phase 3 is where raw discovery turns into architectural decisions. This is the most important phase — every downstream artifact (plan, task briefs, code) depends on the quality of thinking here.

**Do NOT skip sub-phases.** Each produces a structured output block that subsequent phases reference. The model must show its reasoning at each step, not jump from research to conclusions.

### 3a. Synthesize

Take everything from Phase 1 (user intent) + Phase 2 (research findings) and distill it into a clear picture. Print this output block:

```
SYNTHESIS
=========
What we're building:
  {1 paragraph — precise, no fluff. What this feature/spec does and why it matters.}

What we learned from research:
  Codebase findings:
    - {key pattern from research-codebase agent}
    - {integration point discovered}
    - {gotcha or inconsistency found}
  External findings:
    - {relevant docs/best practice from research-external agent}
    - {pitfall or compatibility note}
  Prior plan findings:
    - {pattern from planning-research agent — what worked in similar features}
    - {lesson or reusable structure}

What the user cares about most:
  {From Phase 1 conversation — the core requirement, not everything}

Constraints:
  - {Technical constraint — language, framework, existing architecture}
  - {Compatibility constraint — must work with existing X}
  - {Time/scope constraint — if applicable}

Unknowns (explicit gaps):
  - {What we still don't know — things research didn't answer}
  - {Assumptions we're making that could be wrong}
```

**Checkpoint**: Share the synthesis with the user. "Here's what I'm working with — anything missing or wrong?"

### 3b. Analyze

Structured analysis before making any decisions. Do NOT propose an approach yet — analyze first.

```
ANALYSIS
========
Dependency Graph:
  {component A} → depends on → {component B} → depends on → {component C}
  {component D} → independent (can be built in any order)
  (Use simple text arrows, not diagrams. List every dependency.)

Critical Path:
  {The sequence of work that determines total effort. What must be done first
   because everything else depends on it.}

Risk Assessment:
  HIGH: {risk description}
    Likelihood: {why this is likely or has high impact}
    Mitigation: {specific strategy to reduce risk}
    Fallback: {what to do if mitigation fails}
  MEDIUM: {risk description}
    Likelihood: {assessment}
    Mitigation: {strategy}
  LOW: {risk description}
    Acceptable because: {why we can live with this}

Failure Modes:
  If {X breaks/fails/is wrong}:
    Blast radius: {what else breaks — contained to one file? Cascading?}
    Detection: {how we'd know — test failure? Runtime error? Silent bug?}
    Rollback: {how to undo — git revert? Feature flag? Manual fix?}
  If {assumption Y is wrong}:
    Impact: {how the plan changes}
    Pivot: {alternative approach we'd take}

Interface Boundaries:
  Inputs: {what goes into this feature — data, config, user input, API calls}
  Outputs: {what comes out — files written, state changes, side effects, API responses}
  Touches: {existing systems/files this interacts with — be specific with file paths}
  Does NOT touch: {explicitly list what's out of scope to prevent scope creep}
```

**Checkpoint**: If risks are HIGH, flag them: "I see a significant risk with {X}. Want to discuss mitigation before I proceed?"

For non-trivial architecture decisions where multiple approaches are viable, suggest council:
- "This has {N} valid approaches with real tradeoffs. Want to run `/council` to get multi-model input before I decide?"

### 3c. Decide

Now — and only now — propose the approach. The decision must reference the analysis above, not gut feeling.

```
APPROACH DECISION
=================
Chosen approach:
  {Describe the approach in 2-3 sentences. Be specific — not "use a service" but
   "create AuthService class in src/services/auth.ts with login(), logout(), refresh() methods,
   following the pattern from src/services/user.ts"}

Why this approach:
  - {Reason 1 — tied to a specific finding from the analysis. "The dependency graph shows X
    must be built first, so this approach starts with X."}
  - {Reason 2 — tied to a risk mitigation. "This approach minimizes the HIGH risk identified
    in 3b by isolating the change to a single file."}
  - {Reason 3 — tied to a codebase pattern. "Research found the existing pattern in
    src/services/user.ts:45-62 which this approach extends consistently."}

Rejected alternatives:
  Alternative A: {description}
    Rejected because: {specific reason from analysis — not "it's worse" but "it increases
    coupling between X and Y which the dependency graph shows is already a risk"}
  Alternative B: {description}
    Rejected because: {specific reason}
  (If only one viable approach exists, state: "No viable alternatives identified —
   the constraints from 3b make this the only workable approach because {reason}.")

Key tradeoff accepted:
  {What we're trading off. Every approach trades something. Be explicit.
   Example: "Trading implementation speed for maintainability — the service pattern
   is more code than a direct function call, but follows established conventions
   and is easier to test."}
```

**Checkpoint**: Confirm the direction — "Lock in this approach? Or should we explore {specific alternative} more?"

### 3d. Decompose

Break the chosen approach into tasks. The decomposition must justify each split.

```
TASK DECOMPOSITION
==================
Total tasks: {N}
Split rationale:
  {Why N tasks, not N-1 or N+1. What principle drives the split —
   "one task per target file" is the default heuristic. If deviating, explain why.}

Task 1: {name}
  Target file: {path}
  Why separate: {what boundary this follows — "this is the foundation that other tasks depend on"}
  Depends on: nothing (first task)
  Scope: {1-2 sentences — what this task creates/modifies}

Task 2: {name}
  Target file: {path}
  Why separate: {boundary reasoning — "different file, different concern"}
  Depends on: Task 1 ({specifically what it needs — "the interface defined in Task 1"})
  Scope: {1-2 sentences}

Task 3: {name}
  Target file: {path}
  Why separate: {boundary reasoning}
  Depends on: Task 1 and/or Task 2 ({specific dependency})
  Scope: {1-2 sentences}

... (continue for all tasks)

Order rationale:
  {Why this order, not another. Reference the dependency graph from 3b.
   "Task 1 must be first because Tasks 2 and 3 both depend on its output.
   Tasks 2 and 3 are independent of each other but ordered by complexity —
   simpler first to establish patterns."}

Confidence: {X}/10
  Reasoning: {Why this score. What's well-understood vs uncertain.
  Example: "8/10 — Tasks 1-3 follow established patterns and are straightforward.
  Task 4 involves an integration point with the build system that has some uncertainty
  around error handling. If Task 4 proves harder than expected, the blast radius
  is contained to one file."}
```

**Checkpoint**: "Here's the task breakdown — {N} tasks in this order. The key dependency is {X}. Does this look right?"

### Phase 3 Output Summary

By the end of Phase 3, the following are locked in and available for Phase 4:
- **Synthesis** — distilled understanding of what we're building and why
- **Analysis** — dependency graph, risks with mitigations, failure modes, interface boundaries
- **Approach** — chosen approach with reasoning, rejected alternatives, accepted tradeoff
- **Decomposition** — task list with per-task justification, order rationale, confidence score

Phase 4's preview draws directly from these: `Approach` → preview's "Approach" field, `Risks` from analysis → preview's "Risks" field, `Decomposition` → preview's "Estimated tasks" and "Mode" fields.

---
```

**PATTERN**: Phase 2's structured sub-sections (2a, 2b, 2c, 2d) — each sub-section has a clear purpose, instructions, and expected output format.

**IMPORTS**: N/A — this is a markdown command file

**GOTCHA**: The code blocks inside the phase instructions use triple backticks. Since the planning.md file itself is markdown, these are literal code blocks that the model should print as output during a planning session. They are NOT fenced code to be executed. Make sure the backtick nesting is correct — the outer level uses ``` for the code block delimiters, and the inner level (the actual output templates) also uses ```. This works because the inner blocks are indented or clearly bounded.

**VALIDATE**:
```bash
# Count lines in the new Phase 3 section
grep -n "Phase 3\|Phase 4" .opencode/commands/planning.md | head -5
# Verify all 4 sub-phases are present
grep "### 3[a-d]" .opencode/commands/planning.md
```

---

### Step 2: UPDATE `build.md` — Remove timeout from planning dispatch

**What**: Remove `timeout: 900,` from the planning dispatch call. The `NO_TIMEOUT_TASK_TYPES` auto-detection (from Task 1) handles timeout for `taskType: "planning"`.

**IMPLEMENT**:

Current (lines 215-223 of `.opencode/commands/build.md`):
```markdown
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

Replace with:
```markdown
   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /planning {spec-id} {spec-name} --auto-approve ...",
     taskType: "planning",
   })
   ```
```

**PATTERN**: The other dispatch calls in `build.md` (execution, commit-message, code-review) don't specify `timeout` — they rely on `taskType` auto-detection. This makes planning consistent.

**IMPORTS**: N/A

**GOTCHA**: The `timeout: 900` was likely a typo for 900_000 (15 min in ms). Even if corrected, it would be wrong — planning sessions run 20-60+ minutes. Removing it entirely is the correct fix because `NO_TIMEOUT_TASK_TYPES` handles it at the dispatch.ts level.

**VALIDATE**:
```bash
# Verify no timeout field in the planning dispatch call
grep -A 6 "dispatch plan" .opencode/commands/build.md | grep -c "timeout"
# Should output: 0
```

---

### Step 3: UPDATE `build.md` — Update timeout failure text

**What**: Update the "If dispatch fails or times out" section to reflect that timeout is no longer the expected failure mode for planning.

**IMPLEMENT**:

Current (lines 230-232 of `.opencode/commands/build.md`):
```markdown
   **If dispatch fails or times out:**
   - Fall back to the "If dispatch unavailable" path (write the plan inline).
   - Log: "Dispatch timed out for planning {spec-name} — falling back to inline planning."
```

Replace with:
```markdown
   **If dispatch fails:**
   - Fall back to the "If dispatch unavailable" path (write the plan inline).
   - Log: "Dispatch failed for planning {spec-name} — falling back to inline planning."
```

**PATTERN**: Other dispatch failure sections in build.md use "If dispatch fails" without mentioning timeout (see Step 6 execution dispatch at lines 358-360).

**IMPORTS**: N/A

**GOTCHA**: Minor text change but important for accuracy. "Times out" is no longer an expected failure mode since planning sessions run without timeout. Keeping the old text would confuse future readers.

**VALIDATE**:
```bash
# Verify the updated text
grep -A 2 "If dispatch fails" .opencode/commands/build.md | head -6
```

---

### Step 4: VERIFY Phase 3 → Phase 4 Continuity

**What**: Verify that Phase 4's preview format can be populated directly from Phase 3's output.

**IMPLEMENT**:

No code changes. Verification mapping:

| Phase 4 Preview Field | Source from Phase 3 |
|----------------------|-------------------|
| `What` | Phase 3a Synthesis → "What we're building" |
| `Approach` | Phase 3c Decision → "Chosen approach" |
| `Files` | Phase 3d Decomposition → per-task target files |
| `Key decision` | Phase 3c Decision → "Why this approach" (reason 1) |
| `Risks` | Phase 3b Analysis → Risk Assessment (HIGH items) |
| `Tests` | Phase 3b Analysis → derived from interface boundaries |
| `Estimated tasks` | Phase 3d Decomposition → "Total tasks" |
| `Mode` | Phase 3d Decomposition → derived from total tasks and complexity |

All Phase 4 fields are covered by Phase 3 output. No gaps.

**PATTERN**: N/A — verification step

**IMPORTS**: N/A

**GOTCHA**: Phase 4's "Tests" field doesn't have a direct Phase 3 output block. It's derived from the interface boundaries (what to test) and the risk assessment (what's most important to test). The testing strategy is finalized in Phase 5 (plan writing), not Phase 3. Phase 4 only needs a high-level "testing approach" summary.

**VALIDATE**:
```bash
# Read Phase 4 preview format and confirm all fields have Phase 3 sources
grep -A 10 "PLAN PREVIEW" .opencode/commands/planning.md
```

---

### Step 5: VERIFY `--auto-approve` Compatibility

**What**: Verify that the expanded Phase 3 works correctly with `--auto-approve` mode (used by `/build`).

**IMPLEMENT**:

No code changes. Analysis:

When `--auto-approve` is set (autonomous mode via `/build`):
1. Phase 1: Reads spec from BUILD_ORDER, summarizes — **no user interaction needed**
2. Phase 2: Launches research agents — **no user interaction needed**
3. Phase 3 (expanded): Produces Synthesize/Analyze/Decide/Decompose output — **checkpoints are interactive but skippable**
4. Phase 4: Self-review checklist instead of user prompt — **no user interaction needed**
5. Phase 5: Write plan — **no user interaction needed**

The Phase 3 checkpoints say things like "Share the synthesis with the user" and "Confirm the direction." In `--auto-approve` mode, these checkpoints should be:
- **Printed to output** (for the record) but **not blocking**
- The model proceeds without waiting for user input

This is consistent with how `--auto-approve` already works for Phase 4 — the preview is "logged" but approval is automatic.

**Important**: The Phase 3 instructions say "Do NOT skip sub-phases." This applies equally in auto-approve mode. The model must still produce all four output blocks — it just doesn't wait for user confirmation at each checkpoint.

The existing checkpoint text uses conditional language ("Share... with the user", "Confirm...") which is appropriate — in auto-approve mode, the model shares by printing and confirms by self-assessment.

No changes needed to Phase 3 text for auto-approve compatibility. The `--auto-approve` flag only affects Phase 4 (approval gate). Phase 3 checkpoints are conversational suggestions, not blocking gates.

**PATTERN**: Phase 4's auto-approve pattern — "Log the preview (print it to output for the record), then proceed directly"

**IMPORTS**: N/A

**GOTCHA**: If a model in auto-approve mode skips Phase 3 sub-phases because "the user isn't there to respond to checkpoints," that defeats the purpose. The instruction "Do NOT skip sub-phases" is deliberately unconditional — it applies regardless of auto-approve.

**VALIDATE**:
```bash
# Verify auto-approve only affects Phase 4, not Phase 3
grep -n "auto-approve\|auto_approve" .opencode/commands/planning.md
```

---

## TESTING STRATEGY

### Unit Tests

No unit tests — this task modifies markdown command files. Covered by manual testing in Level 5.

### Integration Tests

N/A — integration tested via manual `/planning` runs.

### Edge Cases

- **`--auto-approve` mode**: Phase 3 sub-phases must still execute in full. Checkpoints are printed but not blocking.
- **Simple 1-task feature**: Phase 3d Decompose still runs but with "Total tasks: 1, Split rationale: single file change, no decomposition needed"
- **Feature with no viable alternatives**: Phase 3c Decision states "No viable alternatives identified" with reasoning instead of fabricating fake alternatives
- **Phase 2 returns empty research**: Phase 3a Synthesis handles this — "No findings from {agent}. Proceeding with Phase 1 understanding only."
- **Council suggestion**: Phase 3b includes council suggestion for non-trivial decisions. In auto-approve mode, the model should NOT trigger council (would block) — it makes the decision independently.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Verify planning.md is valid markdown with correct header structure
head -5 .opencode/commands/planning.md
grep "^## Phase" .opencode/commands/planning.md
grep "^### 3[a-d]" .opencode/commands/planning.md
```

### Level 2: Type Safety
N/A — no type-checked code modified.

### Level 3: Unit Tests
N/A — no unit tests for command markdown files.

### Level 4: Integration Tests
N/A — covered by Level 5 manual validation.

### Level 5: Manual Validation

1. Open `.opencode/commands/planning.md` and verify:
   - Phase 3 has title "Phase 3: Design (Structured Reasoning)"
   - Sub-phases 3a (Synthesize), 3b (Analyze), 3c (Decide), 3d (Decompose) are present
   - Each sub-phase has a structured output template in a code block
   - Each sub-phase has a checkpoint instruction
   - Phase 3 output summary section exists listing what's available for Phase 4
   - "Do NOT skip sub-phases" instruction is present
2. Open `.opencode/commands/build.md` and verify:
   - Planning dispatch call has no `timeout` field
   - "If dispatch fails" text no longer mentions "times out"
3. Run `/planning test-feature` and observe whether the model:
   - Produces all 4 sub-phase output blocks
   - References research findings in the synthesis
   - Shows explicit reasoning in the approach decision
   - Justifies each task split in the decomposition

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Phase 3 title changed to "Design (Structured Reasoning)"
- [ ] Phase 3 opening paragraph explains this is the most important phase
- [ ] "Do NOT skip sub-phases" instruction present
- [ ] Sub-phase 3a (Synthesize) has structured output template with: what we're building, research findings (codebase/external/prior), user priorities, constraints, unknowns
- [ ] Sub-phase 3b (Analyze) has structured output template with: dependency graph, critical path, risk assessment (HIGH/MEDIUM/LOW with mitigations), failure modes (blast radius/detection/rollback), interface boundaries
- [ ] Sub-phase 3c (Decide) has structured output template with: chosen approach, why (tied to analysis), rejected alternatives (with specific reasons), key tradeoff
- [ ] Sub-phase 3d (Decompose) has structured output template with: total tasks, split rationale, per-task details (name/target/why separate/depends on/scope), order rationale, confidence score with reasoning
- [ ] Phase 3 output summary lists what Phase 4 can reference
- [ ] Council suggestion in 3b for non-trivial decisions
- [ ] `build.md` planning dispatch has no `timeout` field
- [ ] `build.md` failure text says "fails" not "fails or times out"

### Runtime (verify after testing)

- [ ] `/planning` Phase 3 produces all 4 structured output blocks
- [ ] Phase 4 preview can be populated from Phase 3 output
- [ ] `--auto-approve` mode still works (Phase 3 runs in full, Phase 4 auto-approves)
- [ ] `/build` planning dispatch works without explicit timeout

---

## HANDOFF NOTES

### Files Created/Modified

- `.opencode/commands/planning.md` — Phase 3 expanded from 6 lines to ~130 lines with 4 structured sub-phases
- `.opencode/commands/build.md` — Removed `timeout: 900` from planning dispatch, updated failure text

### Patterns Established

- **Structured reasoning output blocks**: Each Phase 3 sub-phase produces a named output block (SYNTHESIS, ANALYSIS, APPROACH DECISION, TASK DECOMPOSITION) that subsequent phases reference
- **Checkpoints between sub-phases**: Short confirmation points that are printed in auto-approve mode but blocking in interactive mode
- **Decision traceability**: Every approach decision must reference specific findings from analysis, not gut feeling

### State to Carry Forward

- Phase 3 now produces the full reasoning context that Phase 4 and Phase 5 consume
- Task 3 (plan-writer agent) needs to understand the Phase 3 output format because the plan-writer will receive it as input
- Task 4 (Phase 5 offload) will reference Phase 3 output in the plan-writer prompt

### Known Issues or Deferred Items

- Council integration in auto-approve mode: Phase 3b suggests council for non-trivial decisions, but in auto-approve mode the model should decide independently (council would block). This is handled by the instruction text but could be made more explicit in a future iteration.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written
- [ ] Brief marked done: rename `task-2.md` → `task-2.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **Output blocks are prescribed format, not free-form**: Free-form analysis lets the model skip steps. Structured templates with named fields force the model to address each dimension. The fields can be filled briefly for simple features, but they must be filled.
- **Checkpoints are conversational, not gates**: Phase 3 checkpoints use language like "Share... with the user" rather than "Wait for approval." This lets auto-approve mode proceed while still encouraging interaction in manual mode.
- **Phase 3 does NOT make Phase 4 redundant**: Phase 3 produces the reasoning; Phase 4 compresses it into a 1-page preview for user approval. They serve different purposes — Phase 3 is for the model's thinking, Phase 4 is for the user's sign-off.

### Implementation Notes

- The Phase 3 section is ~130 lines, making planning.md grow from ~476 to ~600 lines. This is within reasonable bounds for a command file.
- The output templates use fenced code blocks inside markdown. The nesting works because the outer content is instructions (rendered) and the inner blocks are output templates (printed by the model during execution).
- The "confidence score with reasoning" in 3d is new — previous plans had confidence scores without justification. Making the reasoning mandatory improves calibration.
