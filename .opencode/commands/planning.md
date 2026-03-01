---
description: Interactive discovery session — explore ideas WITH the user, then produce a structured plan
---

# Planning: Interactive Discovery + Structured Plan

Work WITH the user to explore, question, and discover the right approach for a spec, then produce a structured implementation plan. This is a conversation, not an auto-generator.

## Feature: $ARGUMENTS

**Flags** (parsed from `$ARGUMENTS`):
- `--auto-approve` (optional): Skip Phase 4 interactive approval gate. The plan preview is still generated and logged, but approval is automatic via self-review checklist instead of user prompt. Used by `/build` when dispatching to `/planning` for autonomous operation.

When flags are present in `$ARGUMENTS`, strip them before parsing the remaining value as the feature name or spec ID.

---

## Pipeline Position

```
/mvp → /prd → /pillars → /decompose → /planning (this) → /build → /ship
```

Used per-spec inside the `/build` loop, or standalone for manual planning.

---

## Core Rules

1. **Discovery first, plan second.** Do NOT auto-generate a plan. Ask questions, discuss approaches, explore the codebase together.
2. **Work WITH the user.** This is a conversation. Ask short questions, confirm insights, discuss tradeoffs.
3. **No code in this phase.** Planning produces a plan document, not code.
4. **Plan-before-execute.** `/execute` only runs from a `/planning`-generated artifact in `.agents/features/{feature}/`.

---

## Phase 1: Understand (Discovery Conversation)

Start by understanding what the user wants to build. This is interactive:

### If called from `/build` with a spec:
- Read the spec from `.agents/specs/BUILD_ORDER.md`
- Read `.agents/specs/build-state.json` for context from prior specs
- Summarize: "This spec is about {purpose}. It depends on {deps} which are done. Here's what I think we need to build..."
- Ask: "Does this match your thinking? Anything to add or change?"

### Pillar context loading (automatic):
When planning any spec with a pillar ID (e.g., P0-03, P1-02):
1. Extract pillar number from spec ID
2. Look for `.agents/specs/pillar-{N}-*.md` matching that pillar
3. If found, read the pillar file — it contains:
   - Pillar scope and context from PILLARS.md
   - Research findings (RAG references, council feedback)
   - PRD coverage analysis
   - The full spec list for that pillar with dependencies
4. Use this as the PRIMARY context for planning (more specific than BUILD_ORDER.md)
5. If no pillar file found, fall back to reading BUILD_ORDER.md directly

### If called standalone:
- If `$ARGUMENTS` matches a pillar spec ID (e.g., `P0-01`, `P1-03`):
  1. Read the matching pillar file from `.agents/specs/pillar-{N}-*.md`
  2. Read the specific spec entry from that file
  3. Summarize: "This spec is about {purpose}. Pillar context: {scope}. Research found: {key findings}."
  4. Ask: "Does this match your thinking? Anything to add or change?"
- Otherwise:
  - Ask: "What are we building? Give me the short version."
  - Listen, then ask 2-3 targeted follow-up questions:
    - "What's the most important thing this needs to do?"
    - "What existing code should this integrate with?"
    - "Any constraints or preferences on how to build it?"

### Discovery Tools
Use these to explore the codebase during conversation:
- **Glob/Grep/Read** — find and read relevant files
- **Archon RAG** (if available) — search knowledge base for patterns and examples
- **Dispatch** (if available) — send targeted research queries to free models
- **Council** — for architectural decisions with multiple valid approaches (suggest to user)

### Checkpoints
After each major discovery, confirm:
- "Here's what I'm seeing — does this match your intent?"
- "I think we should approach it like X because Y. Sound right?"
- Keep confirmations SHORT — one sentence, not paragraphs.

---

## Phase 2: Explore (Sub-Agent Research)

Once the direction is clear, offload research to sub-agents running in parallel. This keeps the main conversation context clean — only research summaries come back, not raw search results.

### 2a. Pillar context (inline — read directly, small and pre-curated):
If the spec has a pillar ID and a matching pillar file was found in Phase 1:
- Read the Research Findings section — pre-researched RAG results and council feedback
- Read the PRD Coverage table — which PRD requirements this spec covers
- Read the Dependency Verification — cross-pillar dependencies
- Use these as starting context — don't re-research what /decompose already found

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

### 2d. Dispatch for deep research (optional, when agents aren't enough):

| Need | Tier | Approach |
|------|------|----------|
| Quick factual check | T1 | Dispatch quick-check |
| API/pattern question | T1 | Dispatch api-analysis |
| Library comparison | T2 | Dispatch research |
| Documentation lookup | T1 | Dispatch docs-lookup |

If dispatch unavailable, use Archon RAG or web search.

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

---

## Phase 5: Write Plan

### Auto-Detect Complexity

After Phases 1-4 (discovery/design), assess complexity and select the output mode:

- **Task Brief Mode** (DEFAULT — use for all standard features): Produces `plan.md` (overview + task index) + one `task-N.md` brief per task. Each brief is a self-contained execution document for one `/execute` session. Use this for the vast majority of features — there is no task count upper boundary for this mode.
- **Master + Sub-Plan Mode** (EXCEPTION — escape hatch for genuinely complex features): Use ONLY when the feature has multiple distinct phases with heavy cross-phase dependencies that make a single plan unwieldy. The trigger is architectural complexity, not task count. A feature with 12 straightforward tasks fits comfortably in task brief mode. A feature with 8 tasks across truly independent phases with separate validation gates may warrant master plan mode.

Announce the mode transparently:
- Task Brief: "This has ~6 tasks — I'll write `plan.md` + 6 task briefs. Each brief runs in one `/execute` session."
- Master Plan: "This has {N} tasks across {M} distinct phases with independent validation gates — the cross-phase dependencies make a single plan unwieldy. I'll use the master + sub-plan approach."

---

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

---

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

---

## Output

Create the feature directory if it doesn't exist: `.agents/features/{feature}/`

**Task Brief Mode (Default):**
```
.agents/features/{feature}/plan.md         ← overview + task index
.agents/features/{feature}/task-1.md       ← task brief 1
.agents/features/{feature}/task-2.md       ← task brief 2
...
.agents/features/{feature}/task-{N}.md     ← task brief N
```

**Master + Sub-Plan Mode (Escape Hatch):**
```
.agents/features/{feature}/plan-master.md
.agents/features/{feature}/plan-phase-1.md
.agents/features/{feature}/plan-phase-2.md
...
```

### Archon Task Sync (if connected)

After writing the plan, sync to Archon:
1. Call `list_projects()` to find or create project for this codebase
2. Call `manage_task("create", ...)` for each task in the plan
3. Store Archon task IDs in plan metadata for `/execute` to update

### Pipeline Handoff Write (required)

After writing the plan (and Archon sync if applicable), overwrite `.agents/context/next-command.md`:

**Task Brief Mode (Default):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /planning
- **Feature**: {feature}
- **Next Command**: /execute .agents/features/{feature}/plan.md
- **Task Progress**: 0/{N} complete
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: awaiting-execution
```

**Master + Sub-Plan Mode:**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /planning
- **Feature**: {feature}
- **Next Command**: /execute .agents/features/{feature}/plan-master.md
- **Master Plan**: .agents/features/{feature}/plan-master.md
- **Phase Progress**: 0/{M} complete
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: awaiting-execution
```

---

## After Writing

**Task Brief Mode (Default):**
```
Plan written:  .agents/features/{feature}/plan.md
Task briefs:   .agents/features/{feature}/task-1.md
               .agents/features/{feature}/task-2.md
               ...
               .agents/features/{feature}/task-{N}.md
Total:         {N} tasks, {N} briefs (one session per brief)
Pillar: {N} — {name} (from {pillar-file-path})   ← omit if no pillar context
PRD requirements covered: {list from pillar file PRD Coverage}   ← omit if no pillar context
Confidence: {X}/10 for one-pass success
Key risk: {top risk}
Archon: {synced N tasks / not connected}

Next: /execute .agents/features/{feature}/plan.md
```

**Master + Sub-Plan Mode:**
```
Master plan: .agents/features/{feature}/plan-master.md
Sub-plans:   .agents/features/{feature}/plan-phase-1.md
             .agents/features/{feature}/plan-phase-2.md
             .agents/features/{feature}/plan-phase-3.md
Total:       {N} tasks across {M} phases
Confidence:  {X}/10 for one-pass success
Key risk:    {top risk}
Archon:      {synced N tasks / not connected}

Next: /execute .agents/features/{feature}/plan-master.md
```

---

## The 7-Field Task Format

Every task in a plan MUST include at minimum ACTION, TARGET, IMPLEMENT, VALIDATE. Heavy plans include all 7 fields:

| Field | Purpose | Example |
|-------|---------|---------|
| **ACTION** | What operation | CREATE / UPDATE / ADD / REMOVE / REFACTOR |
| **TARGET** | Specific file path | `src/services/auth.ts` |
| **IMPLEMENT** | Code-level detail | "Class AuthService with methods: login(), logout()" |
| **PATTERN** | Reference pattern | "Follow pattern in `src/services/user.ts:45-62`" |
| **IMPORTS** | Exact imports | Copy-paste ready import statements |
| **GOTCHA** | Known pitfalls | "Must use async/await — the database client is async-only" |
| **VALIDATE** | Verification command | `npm test -- --grep "auth"` |

Light and standard plans use a reduced format (ACTION, TARGET, IMPLEMENT, VALIDATE minimum).

---

## Interaction Protocol

- **Be concise.** Short questions, short confirmations. Don't lecture.
- **Listen more than talk.** The user knows what they want — help them articulate it.
- **Share discoveries.** When you find something in the codebase, share it immediately.
- **Confirm, don't assume.** If unsure about intent, ask. Don't guess.
- **Know when to stop discovering.** When direction is clear, move to the plan. Don't over-explore.
- **If user says "I already told you"** — synthesize from their inputs immediately. Don't re-ask.

---

## Notes

- This command replaces automated planning with interactive discovery
- Archon RAG is preferred for knowledge lookup; falls back to local exploration
- The plan must pass the "no-prior-knowledge test" — another session can execute it without context
- Keep the conversation moving — a planning session should take 10-30 minutes depending on complexity
