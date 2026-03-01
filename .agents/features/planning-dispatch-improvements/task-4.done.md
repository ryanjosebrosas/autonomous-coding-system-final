# Task 4 of 4: Update Planning Phase 5 to Offload Writing to plan-writer

> **Feature**: `planning-dispatch-improvements`
> **Brief Path**: `.agents/features/planning-dispatch-improvements/task-4.md`
> **Plan Overview**: `.agents/features/planning-dispatch-improvements/plan.md`

---

## OBJECTIVE

Update `/planning` Phase 5 to offload plan artifact writing to the `plan-writer` sub-agent via Task tool calls (one invocation per artifact), with inline writing as the fallback when sub-agents are unavailable.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/planning.md` | UPDATE | Phase 5 (lines 231-343) — add sub-agent offload path before inline writing, restructure as "5a. Sub-Agent Path" and "5b. Inline Fallback" |

**Out of Scope:**
- Phase 1-4 — no changes (Phase 3 was expanded in Task 2)
- Phase 5 plan.md content requirements — unchanged (still 700-1000 lines, same sections)
- Phase 5 task brief content requirements — unchanged (still 700-1000 lines, same template)
- The plan-writer agent definition — created in Task 3
- Master + Sub-Plan mode — untouched (sub-agent offload only applies to Task Brief mode initially)
- Output section, After Writing section, Pipeline Handoff — unchanged

**Dependencies:**
- Task 3 must complete first — the plan-writer agent must exist before Phase 5 references it
- Task 2 should complete first — Phase 3 output format is what gets passed to the plan-writer

---

## PRIOR TASK CONTEXT

**Files Changed in Task 1:**
- `.opencode/tools/dispatch.ts` — Wired no-timeout for planning/execution agent sessions

**Files Changed in Task 2:**
- `.opencode/commands/planning.md` — Phase 3 expanded to Synthesize→Analyze→Decide→Decompose
- `.opencode/commands/build.md` — Removed `timeout: 900` from planning dispatch

**Files Changed in Task 3:**
- `.opencode/agents/plan-writer.md` — Created dedicated plan-writer agent (~150 lines)
- `.opencode/agents/README.md` — Added plan-writer to registry

**State Carried Forward:**
- Phase 3 now produces structured output blocks: SYNTHESIS, ANALYSIS, APPROACH DECISION, TASK DECOMPOSITION
- The plan-writer agent exists at `.opencode/agents/plan-writer.md` and can be invoked via Task tool with `subagent_type: "plan-writer"`
- The plan-writer writes one artifact per invocation and self-validates
- The plan-writer reads `.opencode/templates/TASK-BRIEF-TEMPLATE.md` at runtime

**Known Issues or Deferred Items:**
- Master + Sub-Plan mode doesn't get sub-agent offload in this task — it can be added later when needed
- The plan-writer's effectiveness depends on model quality — self-validation mitigates but doesn't guarantee depth

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/planning.md` (lines 230-345) — Why: Phase 5 current content to be restructured
- `.opencode/commands/planning.md` (lines 346-403) — Why: Output section, Pipeline Handoff, After Writing — must remain unchanged
- `.opencode/commands/planning.md` (lines 87-168) — Why: Phase 2 sub-agent pattern to follow for Phase 5
- `.opencode/agents/plan-writer.md` (lines 1-30) — Why: Agent purpose and invocation interface

### Current Content: Phase 5 Write Plan (Lines 230-244)

```markdown
---

## Phase 5: Write Plan

### Auto-Detect Complexity

After Phases 1-4 (discovery/design), assess complexity and select the output mode:

- **Task Brief Mode** (DEFAULT — use for all standard features): Produces `plan.md` (overview + task index) + one `task-N.md` brief per task. Each brief is a self-contained execution document for one `/execute` session. Use this for the vast majority of features — there is no task count upper boundary for this mode.
- **Master + Sub-Plan Mode** (EXCEPTION — escape hatch for genuinely complex features): Use ONLY when the feature has multiple distinct phases with heavy cross-phase dependencies that make a single plan unwieldy. The trigger is architectural complexity, not task count. A feature with 12 straightforward tasks fits comfortably in task brief mode. A feature with 8 tasks across truly independent phases with separate validation gates may warrant master plan mode.

Announce the mode transparently:
- Task Brief: "This has ~6 tasks — I'll write `plan.md` + 6 task briefs. Each brief runs in one `/execute` session."
- Master Plan: "This has {N} tasks across {M} distinct phases with independent validation gates — the cross-phase dependencies make a single plan unwieldy. I'll use the master + sub-plan approach."
```

**Analysis**: The complexity detection and mode announcement stay unchanged. The sub-agent offload is inserted after this section, before the current Task Brief Mode section.

### Current Content: Phase 5 Task Brief Mode (Lines 246-317)

```markdown
### Task Brief Mode (Default)

**Step 1: Write `plan.md` (overview + task index)**

Every `plan.md` is 700-1000 lines. It is the source of truth and human-readable overview. It contains:

- Feature Description, User Story, Problem Statement, Solution Statement
- Feature Metadata with Slice Guardrails
- Pillar Context (if available): pillar N — name, scope, research findings, PRD requirements
- Context References (codebase files with line numbers, related memories, relevant docs)
- Patterns to Follow (with actual code snippets from the project)
- Implementation Plan (overview of phases/groupings)
- Step-by-Step Tasks (summary level — 3-4 lines per task with ACTION, TARGET, scope description)
- Testing Strategy (overview)
- Validation Commands (all levels of the validation pyramid)
- Acceptance Criteria (Implementation + Runtime, with checkboxes)
- Completion Checklist
- Notes (key decisions, risks, confidence score)
- **TASK INDEX** table at the bottom listing all task briefs with scope and status

**TASK INDEX table format:**
```markdown
## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.md` | {one-line scope description} | pending | {N created, M modified} |
| 2 | `task-2.md` | {one-line scope description} | pending | {N created, M modified} |
...
```

**Hard requirement:** If `plan.md` is under 700 lines, it is REJECTED. Expand code samples, add more context references, add more pattern detail. Code samples must be copy-pasteable, not summaries.

**Step 2: Write task briefs (`task-N.md`) — one per target file**

Using `.opencode/templates/TASK-BRIEF-TEMPLATE.md` as the structural reference, write one task brief for each task:

- Save to `.agents/features/{feature}/task-{N}.md`
- Each brief is **self-contained** — `/execute` can run it without reading `plan.md` or any other file
- Each brief targets **700-1000 lines** — this is achieved by pasting all context inline, not by padding
- No advisory sections (no Feature Description, User Story, Problem Statement, Confidence Score — those live in `plan.md`)
- Every line must be operationally useful: steps, exact code, validation commands, acceptance criteria

**Task splitting heuristic**: One task brief = one target file. This is the default granularity. A brief that modifies `planning.md` is one task; a brief that modifies `TASK-BRIEF-TEMPLATE.md` is a separate task. Multi-file briefs are the exception — only when edits are tightly coupled (e.g., renaming in file A requires updating the import in file B). If a brief covers 3+ files, split it unless you can justify why the files can't be changed independently.

**How briefs reach 700 lines — inline content, not padding:**
- **Context References**: Paste the full current content of every section being modified in code blocks (50-150 lines)
- **Patterns to Follow**: Paste complete reference patterns from other files with analysis (30-80 lines)
- **Current/Replace blocks**: Paste the EXACT current content and COMPLETE replacement content — every line, preserving indentation (50-200 lines per step)
- **All sections filled**: Every section from OBJECTIVE through COMPLETION CHECKLIST must be present and substantive. No empty sections, no "N/A" without explanation.

**Hard requirement:** If a task brief is under 700 lines, it is REJECTED. Expand inline content — paste more of the target file's current content, add more pattern snippets, add more validation steps, add more acceptance criteria. If a brief genuinely can't reach 700 lines for a single file, the task is too small — merge it with an adjacent task or add depth (more edge cases, more validation, more context).

**Required sections per task brief:**
- Objective (one sentence — the test for "done")
- Scope (files touched, what's out of scope, dependencies)
- Prior Task Context (what was done in task N-1; "None" for task 1)
- Context References (files to read with line ranges AND full content pasted inline in code blocks)
- Patterns to Follow (complete code snippets from the codebase — NOT optional, NOT summaries)
- Step-by-Step Tasks (each step: IMPLEMENT with exact Current/Replace-with blocks, PATTERN, GOTCHA, VALIDATE)
- Testing Strategy (unit, integration, edge cases)
- Validation Commands (L1–L5, each level filled or explicitly "N/A" with reason)
- Acceptance Criteria (Implementation + Runtime checkboxes)
- Handoff Notes (what task N+1 needs to know; omit for last task)
- Completion Checklist

**Rejection criteria** — a task brief is REJECTED if it:
- Is under 700 lines
- Uses "see lines X-Y" or "read file Z" instead of pasting content inline
- Skips any required section (every section above must be present)
- Has Current/Replace blocks that abbreviate, summarize, or use "..." to skip lines
- Covers 3+ files without explicit justification
```

**Analysis**: This entire section becomes the "5b. Inline Fallback" path. It stays unchanged as the fallback. The new "5a. Sub-Agent Path" is inserted before it.

### Current Content: Phase 5 Master + Sub-Plan Mode (Lines 319-343)

```markdown
### Master + Sub-Plan Mode (Escape Hatch)

For genuinely complex features with multiple distinct phases and heavy cross-phase dependencies:

**Step 1: Write Master Plan**
- ~400-600 lines
- Save to `.agents/features/{feature}/plan-master.md`
- Contains: overview, phases, dependencies, cross-phase decisions, risk register
- Includes SUB-PLAN INDEX table

**Step 2: Write Sub-Plans (sequential)**
- 700-1000 lines each
- Save to `.agents/features/{feature}/plan-phase-{N}.md`
- Phase count heuristic: 1 phase per 3-5 tasks, 2-4 phases typical
- Each sub-plan references handoff notes from prior phases
- Later sub-plans include "Handoff Received" section with context from earlier phases

**Phase naming:**
- Phase 1: Foundation/Setup tasks
- Phase 2: Core implementation
- Phase 3: Integration/Testing
- (Adjust based on actual feature structure)
```

**Analysis**: Master + Sub-Plan mode stays unchanged. Sub-agent offload could be added here in the future but is out of scope for this task.

### Current Content: Phase 2 Sub-Agent Invocation Pattern (Lines 98-148)

```markdown
### 2b. Launch parallel research agents:

Launch ALL three agents in a single message (parallel Task tool calls). Each runs in its own context and returns a summary.

**Agent 1: research-codebase** (Task tool, subagent_type: "explore")
```
Prompt: "Thorough exploration for planning context.

Feature: {feature description from Phase 1}

Find:
1. Files with patterns we should follow for this feature
2. Integration points — where new code connects to existing code
3. Naming conventions, error handling patterns, testing patterns
4. Gotchas from the codebase (inconsistencies, non-obvious behavior)

Return: structured findings with exact file:line references."
```

**Agent 2: research-external** (Task tool, subagent_type: "explore")
```
Prompt: "Research external documentation and best practices.

Feature: {feature description}
Technologies: {languages, frameworks, libraries involved}

Find:
1. Official documentation for relevant APIs
2. Best practices and recommended patterns
3. Version compatibility notes
4. Common pitfalls in the documentation

Use Archon RAG first (rag_search_knowledge_base, rag_search_code_examples with 2-5 keyword queries).
If RAG unavailable, use WebFetch for official docs.

Return: findings with source URLs/citations."
```

**Agent 3: planning-research** (Task tool, subagent_type: "explore")
```
Prompt: "Search for planning context from knowledge base and completed plans.

Feature: {feature description}

Find:
1. Archon RAG: architecture patterns and code examples (2-5 keyword queries)
2. Completed plans: scan .agents/features/*/plan.done.md for similar features
3. Lessons and patterns from past implementations

Return: structured findings with sources."
```

### 2c. Collect and share findings:

When all three agents return:
1. Read each agent's summary
2. Share key findings with the user: "Research found these patterns..." / "Past plan for {X} used this approach..."
3. Merge findings into the working context for Phase 3

**Fallback**: If Task tool is unavailable, do research inline using Glob/Grep/Read for codebase, Archon RAG for knowledge base, and WebFetch for external docs. The agent prompts above serve as a checklist for what to cover.
```

**Analysis**: This is the pattern for sub-agent invocation in `/planning`. Phase 5 follows the same structure: "If Task tool available, dispatch to sub-agent. If unavailable, do inline." The key differences:
- Phase 2 launches agents in parallel (research is independent)
- Phase 5 launches agents sequentially (plan.md first, then briefs in order — each brief needs the prior one's handoff notes)
- Phase 2 agents return summaries to the main context
- Phase 5 agents write files to disk (main context verifies)

### Current Content: plan-writer.md Purpose (Lines 1-20)

```markdown
# Plan Writer Agent

Specialized agent for writing plan artifacts (plan.md and task brief files) from structured planning context.

## Purpose

Write plan artifacts for a feature based on structured context received from `/planning` Phase 3 (Synthesize, Analyze, Decide, Decompose). Produces two types of artifacts:
1. `plan.md` — feature overview + task index (700-1000 lines)
2. `task-N.md` — individual task briefs (700-1000 lines each)

Each invocation writes ONE artifact. The calling agent dispatches the plan-writer once for `plan.md`, then once per task brief.

This agent does NOT:
- Do discovery or research (that's Phase 1-2)
- Make design decisions (that's Phase 3)
- Execute code or run commands (that's `/execute`)
- Approve plans (that's Phase 4)
```

**Analysis**: Confirms the invocation model — one artifact per call. The Phase 5 instructions must call it N+1 times (1 for plan.md, N for task briefs), sequentially.

### Patterns to Follow

**Phase 2 sub-agent invocation** (from planning.md lines 98-157):

```markdown
**Agent 1: research-codebase** (Task tool, subagent_type: "explore")
```
Prompt: "..."
```

**Fallback**: If Task tool is unavailable, do research inline...
```

- Why this pattern: Established pattern in the same file. Phase 5 follows it — sub-agent path first, inline fallback second.
- How to apply: Phase 5 has "5a. Sub-Agent Path (plan-writer)" and "5b. Inline Fallback (write directly)". The sub-agent path uses Task tool calls. The inline path preserves the current Phase 5 content unchanged.
- Common gotchas: Phase 2 agents run in parallel. Phase 5 agents run SEQUENTIALLY — plan.md first (because briefs reference it), then briefs in order (because each needs prior task context). Don't launch all brief writers in parallel.

---

## STEP-BY-STEP TASKS

---

### Step 1: UPDATE `planning.md` — Restructure Phase 5 Task Brief Mode

**What**: Add the sub-agent offload path as "5a" before the existing inline writing, which becomes "5b".

**IMPLEMENT**:

The current Phase 5 Task Brief Mode section (lines 246-317) needs to be restructured. The new structure is:

```
## Phase 5: Write Plan
  ### Auto-Detect Complexity (unchanged)
  ### Task Brief Mode (Default)
    #### 5a. Sub-Agent Path (plan-writer)     ← NEW
    #### 5b. Inline Fallback (write directly)  ← EXISTING content moved here
  ### Master + Sub-Plan Mode (Escape Hatch)    ← UNCHANGED
```

Current (lines 246-248 of `.opencode/commands/planning.md`):
```markdown
### Task Brief Mode (Default)

**Step 1: Write `plan.md` (overview + task index)**
```

Replace with:
```markdown
### Task Brief Mode (Default)

#### 5a. Sub-Agent Path (plan-writer)

When the Task tool is available, offload the heavyweight writing to the `plan-writer` sub-agent. This keeps the main planning context focused on reasoning (Phases 1-4) and delegates the mechanical file writing to a specialized agent.

**Prepare the context handoff:**

Collect all Phase 3 output into a structured context block. This is the primary input for the plan-writer:

```
PLANNING CONTEXT FOR PLAN-WRITER
=================================
Feature: {feature name}
Feature Directory: .agents/features/{feature}/

--- PHASE 3 OUTPUT ---

{Paste the full SYNTHESIS block from Phase 3a}

{Paste the full ANALYSIS block from Phase 3b}

{Paste the full APPROACH DECISION block from Phase 3c}

{Paste the full TASK DECOMPOSITION block from Phase 3d}

--- ADDITIONAL CONTEXT ---

Codebase patterns found:
{Key patterns from Phase 2 research — file paths and brief descriptions}

Prior plan references:
{Relevant patterns from completed plans, if any}

Pillar context:
{Pillar scope and PRD requirements, if applicable}
```

**Step 1: Invoke plan-writer for `plan.md`:**

```
Task tool call:
  subagent_type: "plan-writer"
  description: "Write plan.md for {feature}"
  prompt: "Write plan.md for feature '{feature}'.

  {PLANNING CONTEXT block from above}

  Save to: .agents/features/{feature}/plan.md

  Remember:
  - Read all target files before writing (use Read tool for current content)
  - plan.md must be 700-1000 lines
  - Include TASK INDEX table at the bottom
  - Self-validate before reporting complete"
```

After the agent returns, verify:
1. File exists at `.agents/features/{feature}/plan.md`
2. Read it and check line count (target: 700-1000)
3. Check TASK INDEX table is present

If the file is missing or under 700 lines, fall back to 5b (inline writing).

**Step 2: Invoke plan-writer for each task brief (sequentially):**

For each task N (from 1 to total tasks), invoke the plan-writer:

```
Task tool call:
  subagent_type: "plan-writer"
  description: "Write task-{N}.md for {feature}"
  prompt: "Write task-{N}.md for feature '{feature}'.

  {PLANNING CONTEXT block from above}

  This is task {N} of {total}: {task name from TASK DECOMPOSITION}
  Target file: {target file path from decomposition}
  Scope: {scope description from decomposition}
  Depends on: {dependency from decomposition}

  Prior task handoff: {If N > 1, paste the Handoff Notes from the prior brief's
  prompt or read task-{N-1}.md and extract its handoff section. If N == 1, say 'None — first task.'}

  Save to: .agents/features/{feature}/task-{N}.md

  Remember:
  - Read .opencode/templates/TASK-BRIEF-TEMPLATE.md first
  - Read the target file for current content (for inline pasting)
  - Brief must be 700-1000 lines
  - All sections from the template are required
  - Self-validate before reporting complete"
```

After each agent returns, verify:
1. File exists at `.agents/features/{feature}/task-{N}.md`
2. Read it and check line count (target: 700-1000)

If any brief fails (missing or under 700 lines), note the failure and continue with remaining briefs. At the end, fall back to 5b (inline writing) ONLY for the failed briefs.

**Important**: Invoke briefs sequentially, not in parallel. Each brief's "Prior Task Context" section needs to accurately describe the previous task. Sequential invocation ensures the plan-writer can read the prior brief from disk.

**Step 3: Verify all artifacts:**

After all invocations complete:
1. List all files in `.agents/features/{feature}/`
2. Verify `plan.md` + all `task-N.md` files exist
3. Spot-check: read the first task brief and verify it has all required sections
4. If all artifacts are present and valid, skip 5b and proceed to Output section

**Fallback trigger**: If the Task tool is unavailable, or if the plan-writer agent fails on more than half the artifacts, fall back to 5b entirely.

#### 5b. Inline Fallback (write directly)

If the Task tool is unavailable, or if the plan-writer sub-agent fails, write the artifacts directly in the main context. This is the original Phase 5 behavior.

**Step 1: Write `plan.md` (overview + task index)**
```

**PATTERN**: Phase 2's "2b. Launch parallel research agents" → "Fallback: If Task tool is unavailable" structure.

**IMPORTS**: N/A

**GOTCHA**: 
1. The briefs must be invoked SEQUENTIALLY, not in parallel (unlike Phase 2 research agents which run in parallel). Each brief needs prior task context.
2. The "5b. Inline Fallback" section is the EXISTING Phase 5 content — do NOT rewrite it, just move it under the 5b header. The only change is adding the `#### 5b. Inline Fallback (write directly)` header and the one-line intro.
3. The context handoff block must include ALL of Phase 3's output — truncating it defeats the purpose of structured reasoning.

**VALIDATE**:
```bash
# Verify both sub-sections exist
grep "#### 5a\|#### 5b" .opencode/commands/planning.md
# Verify plan-writer reference
grep "plan-writer" .opencode/commands/planning.md
```

---

### Step 2: VERIFY Inline Fallback Is Unchanged

**What**: Confirm that the existing Phase 5 content (now under "5b. Inline Fallback") is preserved exactly.

**IMPLEMENT**:

No code changes. The existing content from "Step 1: Write `plan.md`" through "Rejection criteria" must be preserved verbatim under the "5b. Inline Fallback" header. The only additions are:
1. The `#### 5b. Inline Fallback (write directly)` header
2. The one-line intro: "If the Task tool is unavailable, or if the plan-writer sub-agent fails, write the artifacts directly in the main context. This is the original Phase 5 behavior."

Everything else in the section stays word-for-word identical.

**PATTERN**: N/A — preservation verification

**IMPORTS**: N/A

**GOTCHA**: Do NOT edit, rewrite, or "improve" the inline fallback content. It's battle-tested and any changes would be a separate task.

**VALIDATE**:
```bash
# Verify key content from the original Phase 5 is still present
grep "700-1000 lines" .opencode/commands/planning.md
grep "self-contained" .opencode/commands/planning.md
grep "TASK INDEX" .opencode/commands/planning.md
grep "Rejection criteria" .opencode/commands/planning.md
```

---

### Step 3: VERIFY Context Handoff Completeness

**What**: Verify the context handoff block includes all Phase 3 outputs.

**IMPLEMENT**:

No code changes. Cross-reference:

| Phase 3 Output Block | In Context Handoff? |
|----------------------|-------------------|
| SYNTHESIS (3a) | Yes — "Paste the full SYNTHESIS block from Phase 3a" |
| ANALYSIS (3b) | Yes — "Paste the full ANALYSIS block from Phase 3b" |
| APPROACH DECISION (3c) | Yes — "Paste the full APPROACH DECISION block from Phase 3c" |
| TASK DECOMPOSITION (3d) | Yes — "Paste the full TASK DECOMPOSITION block from Phase 3d" |
| Phase 2 codebase patterns | Yes — "Codebase patterns found" in ADDITIONAL CONTEXT |
| Phase 2 external findings | Partially — covered under "Codebase patterns found" broadly |
| Phase 2 prior plan references | Yes — "Prior plan references" in ADDITIONAL CONTEXT |
| Pillar context | Yes — "Pillar context" in ADDITIONAL CONTEXT |

The Phase 2 external findings (docs, best practices) should be included more explicitly. However, the plan-writer agent has file access and can re-read research results if needed. The current context handoff is sufficient because:
1. Phase 3a (Synthesize) already incorporates external findings into the SYNTHESIS block
2. The plan-writer can read files for additional detail
3. Over-loading the context handoff risks hitting context window limits

No changes needed — the handoff is complete enough.

**PATTERN**: N/A — verification step

**IMPORTS**: N/A

**GOTCHA**: The context handoff should NOT include raw Phase 2 agent output — it should include the synthesized versions from Phase 3. Raw research output would bloat the context. Phase 3 exists precisely to distill Phase 2 into actionable decisions.

**VALIDATE**:
```bash
# Verify Phase 3 output references in the handoff block
grep -c "Phase 3" .opencode/commands/planning.md
```

---

### Step 4: VERIFY Sequential Invocation Instruction

**What**: Confirm the instructions clearly specify sequential (not parallel) invocation for task briefs.

**IMPLEMENT**:

No code changes. The Step 2 instructions in 5a include:

> **Important**: Invoke briefs sequentially, not in parallel. Each brief's "Prior Task Context" section needs to accurately describe the previous task. Sequential invocation ensures the plan-writer can read the prior brief from disk.

This is explicit and clear. Additionally, the prompt for each brief includes:

> Prior task handoff: {If N > 1, paste the Handoff Notes from the prior brief's prompt or read task-{N-1}.md and extract its handoff section.}

This makes the sequential dependency concrete — the calling agent must read the prior brief before constructing the next prompt.

**PATTERN**: Phase 2 explicitly says "Launch ALL three agents in a single message (parallel Task tool calls)." Phase 5 explicitly says the opposite — "Invoke briefs sequentially, not in parallel." The contrast is intentional and clear.

**IMPORTS**: N/A

**GOTCHA**: A model optimizing for speed might try to parallelize brief writing despite the instruction. The "Prior task handoff" field in each prompt makes this structurally difficult — you can't fill in "paste the Handoff Notes from task-2.md" until task-2.md exists. This structural dependency is the real guardrail, not just the text instruction.

**VALIDATE**:
```bash
# Verify sequential instruction is present
grep -i "sequential\|not in parallel" .opencode/commands/planning.md
```

---

### Step 5: VERIFY Fallback Trigger Conditions

**What**: Verify the fallback logic is clear and covers all failure modes.

**IMPLEMENT**:

No code changes. The fallback triggers are:

1. **Task tool unavailable** → fall back to 5b entirely (write all artifacts inline)
2. **Plan-writer fails on plan.md** → fall back to 5b entirely (if plan.md fails, briefs would be without their reference)
3. **Plan-writer fails on a single brief** → note failure, continue remaining briefs, then write ONLY the failed brief inline in 5b
4. **Plan-writer fails on more than half the briefs** → fall back to 5b entirely

This graceful degradation ensures:
- One flaky brief doesn't trigger a full inline rewrite
- Systemic failure (agent consistently produces bad output) triggers full fallback
- The final artifact set is complete regardless of which path produced each file

**PATTERN**: Phase 2's fallback — "If Task tool is unavailable, do research inline." Same binary fallback. Phase 5's fallback is more granular (per-brief fallback) because individual briefs are independent.

**IMPORTS**: N/A

**GOTCHA**: "More than half" is a heuristic. For a 2-task feature, one failure = 50% = triggers full fallback. For a 10-task feature, one failure is 10% = only that brief is written inline. This seems reasonable but could be tuned based on experience.

**VALIDATE**:
```bash
# Verify fallback conditions are documented
grep -i "fallback" .opencode/commands/planning.md
```

---

### Step 6: VERIFY Output/After Writing/Handoff Sections Unchanged

**What**: Confirm the Output, After Writing, and Pipeline Handoff sections at the end of planning.md don't need changes.

**IMPLEMENT**:

No code changes. Analysis:

- **Output section** (lines 346-365): Lists the file paths for both modes. Unchanged — plan-writer writes to the same paths.
- **Archon Task Sync** (lines 367-372): Happens after plan writing. Unchanged — the calling agent does the sync after plan-writer finishes, not the plan-writer itself.
- **Pipeline Handoff** (lines 374-403): Happens after plan writing. Unchanged — the calling agent writes the handoff after verifying all artifacts.
- **After Writing** (lines 407-438): Summary output. Unchanged — the calling agent prints this after verification.

The plan-writer agent writes files. Everything else (Archon sync, handoff, summary) stays with the main planning context. This separation is correct — the plan-writer is a writer, not an orchestrator.

**PATTERN**: N/A — verification step

**IMPORTS**: N/A

**GOTCHA**: The plan-writer does NOT write the pipeline handoff or do Archon sync. These are post-writing orchestration tasks that belong to the main context. If the plan-writer tried to do them, it would duplicate logic and risk inconsistency.

**VALIDATE**:
```bash
# Verify these sections still exist unchanged
grep "## Output\|Archon Task Sync\|Pipeline Handoff\|## After Writing" .opencode/commands/planning.md
```

---

## TESTING STRATEGY

### Unit Tests

No unit tests — this task modifies a markdown command file. Covered by manual testing in Level 5.

### Integration Tests

N/A — integration tested via manual `/planning` runs with the plan-writer agent.

### Edge Cases

- **Task tool unavailable**: Phase 5 falls back to 5b (inline writing). The transition should be seamless — the model detects the tool is unavailable and proceeds with the existing writing logic.
- **Plan-writer produces plan.md under 700 lines**: Main context detects this, falls back to 5b for plan.md, then still tries plan-writer for briefs (plan.md failure doesn't necessarily mean brief failure).
- **Single-task feature**: Plan-writer invoked twice total — once for plan.md, once for task-1.md. Minimal overhead.
- **10+ task feature**: Plan-writer invoked 11+ times sequentially. Each invocation is independent. No context overflow in any single invocation.
- **`--auto-approve` mode**: Phase 5 sub-agent path works identically — no user interaction needed in Phase 5. The plan-writer doesn't ask questions.
- **Plan-writer agent file missing**: Task tool invocation would fail — fall back to 5b.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Verify planning.md has correct markdown structure
grep "^## Phase\|^### \|^#### 5" .opencode/commands/planning.md
```

### Level 2: Type Safety
N/A — no type-checked code modified.

### Level 3: Unit Tests
N/A — no unit test framework for command markdown files.

### Level 4: Integration Tests
N/A — covered by Level 5 manual validation.

### Level 5: Manual Validation

1. Open `.opencode/commands/planning.md` and verify:
   - Phase 5 Task Brief Mode has `#### 5a. Sub-Agent Path (plan-writer)` section
   - Phase 5 Task Brief Mode has `#### 5b. Inline Fallback (write directly)` section
   - 5a includes context handoff block with all Phase 3 outputs
   - 5a includes Task tool invocation for plan.md with prompt template
   - 5a includes sequential Task tool invocation for each task brief
   - 5a includes verification steps after each invocation
   - 5a includes fallback triggers (tool unavailable, plan.md fails, >50% brief failures)
   - 5b contains the original Phase 5 content unchanged
   - Master + Sub-Plan mode section unchanged
   - Output, Archon sync, Pipeline Handoff, After Writing sections unchanged
2. Run `/planning test-feature` and observe whether:
   - Phase 5 attempts plan-writer invocation
   - Falls back to inline if plan-writer unavailable
   - Final artifacts are produced either way

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Phase 5 has `#### 5a. Sub-Agent Path (plan-writer)` section
- [ ] Phase 5 has `#### 5b. Inline Fallback (write directly)` section
- [ ] 5a context handoff includes all 4 Phase 3 output blocks
- [ ] 5a context handoff includes additional context (patterns, prior plans, pillar)
- [ ] 5a plan.md invocation uses `subagent_type: "plan-writer"`
- [ ] 5a task brief invocations are explicitly SEQUENTIAL
- [ ] 5a includes prior task handoff in each brief prompt
- [ ] 5a includes verification after each invocation (file exists, line count)
- [ ] 5a includes fallback trigger conditions
- [ ] 5b content is the original Phase 5 content, unchanged
- [ ] Master + Sub-Plan mode section unchanged
- [ ] Output/Handoff/After Writing sections unchanged

### Runtime (verify after testing)

- [ ] `/planning` Phase 5 attempts plan-writer invocation when Task tool available
- [ ] `/planning` Phase 5 falls back to inline when Task tool unavailable
- [ ] Plan-writer produces plan.md at target path
- [ ] Plan-writer produces task briefs at target paths
- [ ] Sequential invocation maintains cross-brief consistency

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Brief marked done: rename `task-4.md` → `task-4.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **5a before 5b, not 5b with optional 5a**: The sub-agent path is the preferred path, not an optional enhancement. Inline writing is the fallback. This ordering signals intent — plan writing should be offloaded by default.
- **Sequential brief invocation**: Trading speed for correctness. Parallel invocation would be faster but breaks cross-brief consistency (Prior Task Context, Handoff Notes). The plan-writer self-validates, so each invocation is thorough — parallelism would save wall-clock time but risk incoherent briefs.
- **Per-brief fallback, not all-or-nothing**: If 1 of 6 briefs fails, only that brief falls back to inline. This maximizes plan-writer usage while ensuring all artifacts are produced.
- **Master + Sub-Plan mode excluded**: Sub-agent offload for master plans is deferred. Master plans are rare (escape hatch) and the sub-plan structure is different enough to warrant separate handling in a future task.

### Implementation Notes

- The context handoff block is printed by the model (not stored in a file). It exists in the planning context window and is pasted into each plan-writer prompt. For large features with extensive Phase 3 output, this could be 200-300 lines per prompt. This is within context window limits for all supported models.
- The plan-writer's self-validation (line count, section completeness) provides a first line of defense. The main context's verification (file exists, line count check) provides a second. This double-check pattern is intentional.
- The `subagent_type: "plan-writer"` must match the agent filename exactly (`plan-writer.md` → `"plan-writer"`). This is established by the existing agent invocation pattern.
