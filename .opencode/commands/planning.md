---
description: Interactive discovery session — explore ideas WITH the user, then produce a structured plan
model: claude-opus-4-6
---

# Planning: Interactive Discovery + Structured Plan

Work WITH the user to explore, question, and discover the right approach for a spec, then produce a structured implementation plan. This is a conversation, not an auto-generator.

## Feature: $ARGUMENTS

---

## Pipeline Position

```
/mvp → /prd → /planning (this) → codex /execute → /code-review → /commit → /pr
```

Used standalone for each feature or capability.

---

## Core Rules

1. **Discovery first, plan second.** Do NOT auto-generate a plan. Ask questions, discuss approaches, explore the codebase together.
2. **Work WITH the user.** This is a conversation. Ask short questions, confirm insights, discuss tradeoffs.
3. **No code in this phase.** Planning produces a plan document, not code.
4. **Plan-before-execute.** `codex /execute` only runs from a `/planning`-generated artifact in `.agents/features/{feature}/`.

---

## Phase 1: Understand (Discovery Conversation)

Start by understanding what the user wants to build. This is interactive — a conversation, not automation.

### Starting the conversation:
- Ask: "What are we building? Give me the short version."
- Listen, then ask 2-3 targeted follow-up questions:
  - "What's the most important thing this needs to do?"
  - "What existing code should this integrate with?"
  - "Any constraints or preferences on how to build it?"

If `$ARGUMENTS` is provided:
- Summarize what you understand from the feature name/description
- Ask: "This is about {purpose}. Does this match your thinking? Anything to add or change?"

Read these files for context (if they exist):
- `mvp.md` — product vision
- `PRD.md` (or similar) — product requirements
- `memory.md` — past decisions and gotchas

### Discovery Tools
Use these to explore the codebase during conversation:
- **Glob/Grep/Read** — find and read relevant files
- **Archon RAG** (if available) — search knowledge base for patterns and examples
- **WebFetch** — look up official docs for libraries/APIs in scope

### Checkpoints
After each major discovery, confirm:
- "Here's what I'm seeing — does this match your intent?"
- "I think we should approach it like X because Y. Sound right?"
- Keep confirmations SHORT — one sentence, not paragraphs.

---

## Phase 2: Explore (Research)

Once the direction is clear, delegate all retrieval to Haiku subagents. Run in parallel where possible.

### 2a. Codebase research → delegate to `research-codebase` subagent (Haiku)

Use the Agent tool to invoke the `research-codebase` subagent with a prompt covering:
- Feature being built and key integration points to find
- Patterns to look for (naming conventions, error handling, testing)
- Specific files or directories likely relevant

The subagent returns: file:line references, patterns found, gotchas, integration points.

### 2b. Knowledge base (if Archon connected) → delegate to `archon-retrieval` subagent (Haiku)

Use the Agent tool to invoke the `archon-retrieval` subagent with:
- 2-5 keyword queries for the feature's key concepts
- Ask for both docs and code examples

The subagent returns: matched documentation excerpts and code examples with source references.

### 2c. External docs (if needed) → delegate to `research-external` subagent (Haiku)

Use the Agent tool to invoke the `research-external` subagent with:
- Libraries/APIs involved and what specifically to look up
- Any known version constraints

The subagent returns: relevant docs, best practices, pitfalls.

### 2d. Past plans → delegate to `planning-research` subagent (Haiku)

Use the Agent tool to invoke the `planning-research` subagent with:
- Feature name and short description
- Ask it to scan `.agents/features/*/plan.done.md` for similar features and reusable patterns

The subagent returns: prior decisions, reusable patterns, lessons learned.

### 2e. Synthesise findings:

Take all subagent outputs and summarise:
- "Research found these patterns..." / "Past plan for {X} used this approach..."
- Share key file:line references, patterns, and gotchas before moving to Phase 3

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

For non-trivial architecture decisions where multiple approaches are viable:
- "This has {N} valid approaches with real tradeoffs. Want to discuss before I pick one?"

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

```
Approve this direction to write the full plan? [y/n/adjust]
```

Only write the plan file after explicit approval.

---

## Phase 5: Write Plan

### Auto-Detect Complexity

After Phases 1-4 (discovery/design), assess complexity and select the output mode:

- **Task Brief Mode** (DEFAULT — use for all standard features): Produces `plan.md` (overview + task index) + one `task-N.md` brief per task. Each brief is a self-contained execution document for one `codex /execute` session. Use this for the vast majority of features — there is no task count upper boundary for this mode.
- **Master + Sub-Plan Mode** (EXCEPTION — escape hatch for genuinely complex features): Use ONLY when the feature has multiple distinct phases with heavy cross-phase dependencies that make a single plan unwieldy. The trigger is architectural complexity, not task count. A feature with 12 straightforward tasks fits comfortably in task brief mode. A feature with 8 tasks across truly independent phases with separate validation gates may warrant master plan mode.

Announce the mode transparently:
- Task Brief: "This has ~6 tasks — I'll write `plan.md` + 6 task briefs. Each brief runs in one `/execute` session."
- Master Plan: "This has {N} tasks across {M} distinct phases with independent validation gates — the cross-phase dependencies make a single plan unwieldy. I'll use the master + sub-plan approach."

---

### Task Brief Mode (Default)

#### 5a. Write plan artifacts directly

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

Using the task brief structure below as the structural reference, write one task brief for each task:

- Save to `.agents/features/{feature}/task-{N}.md`
- Each brief is **self-contained** — `codex /execute` can run it without reading `plan.md` or any other file
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

### Archon Task Sync (if connected) → delegate to `archon-retrieval` subagent (Haiku)

After writing the plan, invoke the `archon-retrieval` subagent to sync tasks:
1. Find or create project for this feature
2. Create one Archon task per task brief
3. Return task IDs to store in plan metadata for `/execute` to update

### Pipeline Handoff Write (required)

After writing the plan (and Archon sync if applicable), overwrite `.agents/context/next-command.md`:

**Task Brief Mode (Default):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /planning
- **Feature**: {feature}
- **Next Command**: codex /execute .agents/features/{feature}/plan.md
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
- **Next Command**: codex /execute .agents/features/{feature}/plan-master.md
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
Confidence: {X}/10 for one-pass success
Key risk: {top risk}
Archon: {synced N tasks / not connected}

Next (hand to Codex):
  codex /execute .agents/features/{feature}/task-1.md
  (then task-2.md, task-3.md... one per session)
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

Next (hand to Codex):
  codex /execute .agents/features/{feature}/plan-master.md
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
