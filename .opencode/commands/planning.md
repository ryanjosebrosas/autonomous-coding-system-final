---
description: Interactive discovery session — explore ideas WITH the user, then produce a structured plan
model: anthropic/claude-opus-4-6
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

## Step 0: Intent Classification

Before discovery, classify the work intent. This determines interview strategy and required consultations.

### Intent Types

| Intent | Signal | Interview Strategy |
|--------|--------|-------------------|
| **Trivial** | Single file, <10 lines, obvious fix | Quick confirm, but still full planning process |
| **Simple** | 1-2 files, clear scope, <30 min work | Focused questions on scope boundaries |
| **Refactoring** | "refactor", "restructure", existing code | Safety focus: tests, rollback, behavior preservation |
| **Build from Scratch** | New feature, greenfield, "create new" | Discovery focus: find patterns first, then requirements |
| **Mid-sized** | Scoped feature, clear boundaries | Boundary focus: deliverables, exclusions, guardrails |
| **Collaborative** | "let's figure out", "help me plan" | Dialogue focus: explore together, incremental clarity |
| **Architecture** | System design, infrastructure | Strategic focus: **Oracle consultation REQUIRED** |
| **Research** | Goal exists, path unclear | Investigation focus: parallel probes, exit criteria |

### Classification Process

1. Parse `$ARGUMENTS` and any prior context
2. Match against signal patterns
3. Select primary intent (may have secondary)
4. Announce classification to user

### Intent Announcement

After classification, tell the user:

```
I'm classifying this as **{INTENT}** based on {observed signals}.

Interview focus: {strategy description}
{If Architecture: "Oracle consultation will be required in Phase 2."}
{If Refactoring: "I'll focus on safety: tests, rollback strategy, behavior preservation."}

Let's begin discovery.
```

### Intent Determines Downstream Behavior

| Intent | Phase 1 Focus | Phase 2 Extras | Phase 3 Extras |
|--------|---------------|----------------|----------------|
| Trivial | Quick scope confirm | Standard | Standard |
| Simple | Boundary questions | Standard | Standard |
| Refactoring | Safety + rollback | Test coverage search | Risk analysis emphasis |
| Build from Scratch | Pattern discovery | Extra pattern search | Standard |
| Mid-sized | Exclusions + guardrails | Standard | Standard |
| Collaborative | Open exploration | Standard | Standard |
| Architecture | System boundaries | Oracle in Phase 2 | Oracle review required |
| Research | Exit criteria | Parallel probes | Standard |

---

## Step 1: Draft Management

Planning sessions persist across context windows via draft files.

### Draft File Location

```
.agents/features/{feature}/planning-draft.md
```

### On Session Start

**Check for existing draft:**

```typescript
// Check if draft exists
const draftPath = `.agents/features/${feature}/planning-draft.md`
```

**If draft exists:**
1. Read draft to restore context
2. Summarize what was previously discussed
3. Present to user:
   ```
   Continuing from our previous planning session for {feature}.
   
   **Previously discussed:**
   - {topic 1}
   - {topic 2}
   - {key decision made}
   
   **Current status:** {where we left off}
   
   Ready to continue, or should we start fresh?
   ```
4. If user says "start fresh" → delete draft, begin from Step 0

**If no draft exists:**
1. Create feature directory: `.agents/features/{feature}/`
2. Create initial draft with intent classification
3. Inform user: "I'm recording our discussion in `.agents/features/{feature}/planning-draft.md`"

### During Session

**After every meaningful exchange**, update the draft:

```markdown
# Planning Draft: {feature}

## Intent Classification
- **Type**: {intent}
- **Signals**: {why this classification}
- **Classified at**: {timestamp}

## Discovery Progress
- [ ] Intent classified
- [ ] Test strategy discussed
- [ ] Scope boundaries defined
- [ ] Clearance check passed

## Key Discussions

### {timestamp} — {topic}
{summary of what was discussed}
{decisions made}
{open questions}

### {timestamp} — {topic}
...

## Current Understanding
{latest synthesis of what we're building}

## Open Questions
- {question 1}
- {question 2}

## Decisions Made
- {decision 1}: {rationale}
- {decision 2}: {rationale}
```

### Draft Cleanup

After plan is written and user confirms:
1. Draft file is deleted
2. Plan artifacts remain in `.agents/features/{feature}/`

---

## Phase 1: Discovery (Intent-Specific Interview)

> **Prerequisite**: Steps 0-1 complete (intent classified, draft initialized)

Phase 1 adapts to the classified intent. The interview strategy, pre-research, and questions all change based on intent type.

### 1a. Pre-Interview Research (Intent-Specific)

**Launch research agents BEFORE asking questions.** The intent determines what to search for.

#### Trivial / Simple
No pre-research needed. Proceed directly to interview.

#### Refactoring
```typescript
// Find all usages to understand impact scope
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Map refactoring impact",
  prompt=`Find all usages of the code being refactored via references.
  Map: call sites, return value consumers, type dependencies.
  Identify: dynamic access patterns that won't show in static analysis.
  Return: file paths, usage patterns, risk level per call site.`
)

// Find test coverage
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find test coverage for refactoring",
  prompt=`Find all tests exercising the code being refactored.
  Map: what each test asserts, inputs used, public API vs internals.
  Identify: coverage gaps.
  Return: test file paths, coverage assessment.`
)
```

#### Build from Scratch
```typescript
// Find similar implementations for patterns
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find similar implementations",
  prompt=`Find 2-3 similar implementations in the codebase.
  Look for: directory structure, naming conventions, exports, shared utilities,
  error handling patterns, registration steps.
  Return: file paths with pattern descriptions.`
)

// Find organizational conventions
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find organizational conventions",
  prompt=`Find how similar features are organized.
  Look for: nesting depth, index.ts barrels, types conventions,
  test placement, registration patterns.
  Return: canonical structure recommendation.`
)

// Find external docs if new technology
task(
  subagent_type="librarian",
  run_in_background=true,
  load_skills=[],
  description="Find external documentation",
  prompt=`Find official documentation for {technology}.
  Look for: setup guides, project structure, API reference, pitfalls.
  Skip basic tutorials — need production patterns.
  Return: key documentation excerpts.`
)
```

#### Architecture
```typescript
// Map existing architecture
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Map existing architecture",
  prompt=`Map the current architecture.
  Find: module boundaries, dependency direction, data flow, key abstractions, ADRs.
  Identify: circular dependencies, coupling hotspots.
  Return: architecture overview with dependency graph.`
)

// Find architectural patterns
task(
  subagent_type="librarian",
  run_in_background=true,
  load_skills=[],
  description="Find architectural patterns",
  prompt=`Find proven patterns for {architecture domain}.
  Look for: scalability trade-offs, common failure modes, case studies.
  Skip generic patterns — need domain-specific guidance.
  Return: pattern recommendations with rationale.`
)
```

#### Mid-sized / Collaborative / Research
Standard explore agent for codebase patterns (covered in Phase 2).

---

### 1b. Intent-Specific Interview

**Questions adapt to intent type.** Use research findings to inform questions.

#### Trivial
```
Quick confirm: {summarize the obvious fix}
Anything else to consider, or should I proceed?
```

#### Simple
```
1. Scope boundary: Should this include {adjacent concern} or stay focused on {core}?
2. Integration: Any existing code this needs to work with?
```

#### Refactoring
```
1. Behavior preservation: What specific behavior MUST stay identical?
2. Test verification: What command verifies current behavior works?
3. Rollback strategy: If this goes wrong, how do we revert?
4. Propagation: Should changes stay isolated or propagate to callers?
```

#### Build from Scratch
```
I found pattern {X} in {similar file}. Questions:
1. Should new code follow this pattern or deviate? Why?
2. What should explicitly NOT be built? (scope boundaries)
3. MVP vs full vision: What's the minimum useful version?
4. Any preferred libraries or approaches?
```

#### Mid-sized
```
1. Exact outputs: What files/endpoints/UI will this create?
2. Explicit exclusions: What must NOT be included?
3. Hard boundaries: What existing code must NOT be touched?
4. Done criteria: How will we know this is complete?
```

#### Collaborative
```
Let's explore together. Starting point:
- What's the core problem you're trying to solve?
- What have you already tried or considered?
- What feels unclear right now?
```

#### Architecture
```
1. Lifespan: How long should this design last? (months/years)
2. Scale: What load/scale does this need to handle?
3. Constraints: What's absolutely non-negotiable?
4. Integration: What existing systems must this work with?

Note: Oracle consultation is required in Phase 2 for Architecture intent.
```

#### Research
```
1. Goal: What specific question are we trying to answer?
2. Exit criteria: How will we know we've found the answer?
3. Constraints: Any paths we should NOT explore?
4. Time box: How much time should we spend before deciding?
```

---

### 1c. Test Infrastructure Assessment

**Run for ALL intents.** Testing strategy affects plan output.

#### Detect Test Infrastructure

```typescript
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Detect test infrastructure",
  prompt=`Assess test infrastructure in this project.
  Find: test framework (jest/vitest/pytest/etc), test patterns, coverage config, CI integration.
  Return: YES/NO per capability with examples.`
)
```

#### Ask Test Strategy Question

**If infrastructure EXISTS:**
```
I see test infrastructure ({framework}).

Should this work include automated tests?
- **TDD**: Tests written first, then implementation
- **Tests-after**: Tests added after implementation  
- **None**: No unit/integration tests for this work

Regardless of choice, every task includes agent-executed QA scenarios.
```

**If infrastructure DOES NOT exist:**
```
No test infrastructure detected.

Would you like to set up testing as part of this work?
- **YES**: Include test infrastructure setup in the plan
- **NO**: Proceed without unit tests

Either way, agent-executed QA scenarios verify each deliverable.
```

#### Record Decision

Update draft with test strategy:
```markdown
## Test Strategy
- **Infrastructure**: EXISTS / NOT_FOUND
- **Approach**: TDD / TESTS_AFTER / NONE
- **Framework**: {detected or chosen}
```

---

### 1d. Context File Reading

Read these files for additional context (if they exist):
- `mvp.md` — product vision
- `PRD.md` (or similar) — product requirements  
- `memory.md` — past decisions and gotchas
- `.agents/wisdom/{feature}/` — accumulated wisdom

Share relevant findings: "From memory.md, I see a past decision about {X}..."

---

### 1e. Checkpoints

After each major discovery or decision:
- "Here's what I'm seeing — does this match your intent?"
- "I think we should approach it like X because Y. Sound right?"

Keep confirmations SHORT — one sentence, not paragraphs.

Update draft after each checkpoint.

---

### 1f. Clearance Check

**Gate before Phase 2.** Do not proceed until clearance passes.

```
## Phase 1 Clearance Check

**Discussed:**
- [x] Intent: {classified intent}
- [x] Scope: {what's in/out}
- [x] Test strategy: {TDD/Tests-after/None}
- [x] Key constraints: {boundaries}

**Auto-resolved (sensible defaults):**
- {any assumptions made}

**Ready for Phase 2 (Research)?**
```

If anything is unclear, ask before proceeding.
If user confirms, move to Phase 2.

---

## Phase 2: Explore (Research)

Once the direction is clear, delegate all retrieval to explore/librarian agents. Run in parallel (all with `run_in_background=true`).

### 2a. Codebase research → `explore` agent

Invoke the explore agent for internal codebase search. Run in background for parallel execution:

```typescript
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find codebase patterns for {feature}",
  prompt=`
    [CONTEXT]: Building {feature} — need to understand existing codebase patterns
    [GOAL]: Find integration points and patterns to follow
    [DOWNSTREAM]: Will use findings to inform implementation approach
    [REQUEST]: Find:
    - Key integration points in likely directories
    - Naming conventions and patterns used
    - Error handling approaches
    - Test patterns if they exist
    
    Return: file:line references, patterns found, gotchas, integration points.
  `
)
```

The explore agent returns structured findings from the internal codebase.

### 2b. Knowledge base (if Archon connected) → `librarian` agent

The librarian agent has `archonEnabled: true` and can search the Archon knowledge base:

```typescript
task(
  subagent_type="librarian",
  run_in_background=true,
  load_skills=[],
  description="Search knowledge base for {feature} patterns",
  prompt=`
    [CONTEXT]: Building {feature} — need relevant documentation and examples
    [GOAL]: Find authoritative docs and code examples from knowledge base
    [DOWNSTREAM]: Will use findings to inform implementation patterns
    [REQUEST]: Search for:
    - 2-5 keyword queries for key concepts: {keywords}
    - Both documentation and code examples
    - Focus on production patterns, skip tutorials
    
    Return: matched documentation excerpts and code examples with source references.
  `
)
```

The librarian agent automatically uses Archon RAG when connected.

### 2c. External docs (if needed) → `librarian` agent

For external documentation beyond the knowledge base:

```typescript
task(
  subagent_type="librarian",
  run_in_background=true,
  load_skills=[],
  description="Find external docs for {library/API}",
  prompt=`
    [CONTEXT]: Building {feature} with {library/API}
    [GOAL]: Find official documentation and best practices
    [DOWNSTREAM]: Will use findings to implement correctly
    [REQUEST]: Look up:
    - Official documentation for {library/API}
    - Version-specific constraints: {versions}
    - Best practices and common pitfalls
    
    Return: relevant docs, best practices, pitfalls to avoid.
  `
)
```

The librarian agent searches GitHub, Context7, and web sources for documentation.

### 2d. Past plans → `explore` agent

Search completed plans for patterns and lessons learned:

```typescript
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find similar past plans for {feature}",
  prompt=`
    [CONTEXT]: Planning {feature} — want to learn from past work
    [GOAL]: Find similar completed plans and extract reusable patterns
    [DOWNSTREAM]: Will use findings to avoid repeating mistakes
    [REQUEST]: Scan:
    - .agents/features/*/plan.done.md for similar features
    - Look for: prior architectural decisions, reusable patterns, lessons learned
    - Match on: {keywords related to feature}
    
    Return: prior decisions, reusable patterns, gotchas to avoid.
  `
)
```

The explore agent searches the internal codebase including completed plan artifacts.

### 2e. Oracle Consultation (Architecture Intent ONLY)

**REQUIRED when intent = Architecture.** Skip for other intents.

Oracle provides strategic consultation on architecture decisions. This is read-only — Oracle advises, does not implement.

```typescript
task(
  subagent_type="oracle",
  run_in_background=false,  // Wait for Oracle's response
  load_skills=[],
  description="Architecture consultation for {feature}",
  prompt=`
    Architecture consultation request:
    
    **Feature**: {feature name}
    **Intent**: Architecture / System Design
    
    **Context from Phase 1 Interview**:
    - Lifespan requirement: {years}
    - Scale requirement: {load expectations}
    - Non-negotiable constraints: {list}
    - Systems to integrate: {list}
    
    **Research Findings**:
    - Current architecture: {from explore agent}
    - External patterns: {from librarian agent}
    
    **Questions for Oracle**:
    1. Given these constraints, what architectural approach do you recommend?
    2. What are the key tradeoffs we should consider?
    3. What failure modes should we design against?
    4. What would you advise against doing?
    
    Provide strategic guidance. Be specific about tradeoffs.
  `
)
```

**Oracle Response Handling:**
- Incorporate Oracle's recommendations into Phase 3 Analysis
- Note Oracle's warnings in risk assessment
- Reference Oracle's guidance in approach decision

---

### 2f. Synthesize findings

Collect results from all background agents (`background_output(task_id="...")`) and summarize:
- "Research found these patterns..." / "Past plan for {X} used this approach..."
- **If Architecture intent**: "Oracle recommends {approach} because {rationale}. Key warnings: {list}."
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
    - {key pattern from explore agent}
    - {integration point discovered}
    - {gotcha or inconsistency found}
  External findings:
    - {relevant docs/best practice from librarian agent}
    - {pitfall or compatibility note}
  Prior plan findings:
    - {pattern from explore agent — what worked in similar features}
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

Parallelization Plan:
  Wave 1: Tasks {list} — no dependencies, can start immediately
  Wave 2: Tasks {list} — depends on Wave 1 completing
  Wave 3: Tasks {list} — depends on Wave 2 completing
  Parallel within waves: {which tasks can run simultaneously}

Task 1: {name}
  Target file: {path}
  Why separate: {what boundary this follows — "this is the foundation that other tasks depend on"}
  Depends on: nothing (first task)
  Blocks: Tasks {N, M}
  Wave: 1
  Scope: {1-2 sentences — what this task creates/modifies}

Task 2: {name}
  Target file: {path}
  Why separate: {boundary reasoning — "different file, different concern"}
  Depends on: Task 1 ({specifically what it needs — "the interface defined in Task 1"})
  Blocks: Tasks {N}
  Wave: 2
  Scope: {1-2 sentences}

Task 3: {name}
  Target file: {path}
  Why separate: {boundary reasoning}
  Depends on: Task 1 and/or Task 2 ({specific dependency})
  Blocks: Tasks {N}
  Wave: 2
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

### 3e. Metis Consultation (Gap Analysis)

**Before presenting the preview**, summon Metis to catch what you might have missed.

Metis is the pre-planning gap analyzer. It identifies hidden assumptions, ambiguities, and potential AI failure points.

```typescript
task(
  subagent_type="metis",
  run_in_background=false,  // Wait for response
  load_skills=[],
  description="Gap analysis for {feature} plan",
  prompt=`
    Review this planning session before I present the preview:
    
    **User's Goal**: 
    {summarize what user wants from Phase 1}
    
    **What We Discussed**:
    {key points from Phase 1 interview}
    
    **My Understanding** (from Synthesis):
    {SYNTHESIS block content}
    
    **Research Findings**:
    {key discoveries from Phase 2}
    
    **Proposed Approach** (from Decide):
    {APPROACH DECISION block content}
    
    **Task Breakdown** (from Decompose):
    {TASK DECOMPOSITION block content}
    
    Please identify:
    1. **Questions I should have asked but didn't** — gaps in discovery
    2. **Guardrails that need to be explicitly set** — scope boundaries missing
    3. **Potential scope creep areas** — where AI might over-build
    4. **Assumptions I'm making that need validation** — implicit assumptions
    5. **Missing acceptance criteria** — how will we know tasks are done
    6. **Edge cases not addressed** — failure modes not covered
    
    Be specific. Reference the task breakdown by task number.
  `
)
```

**Metis Response Handling:**

1. **CRITICAL gaps** (blocks preview):
   - Return to user: "Metis identified a critical gap: {gap}. Let me ask: {question}"
   - Update draft with answer
   - Re-run Metis if needed

2. **MINOR gaps** (fix silently):
   - Incorporate into Phase 4 preview
   - Note in "Guardrails Applied" section

3. **ASSUMPTIONS flagged**:
   - Add to preview as "Assumptions (validate with user)"
   - Ask user to confirm before proceeding

---

### Phase 3 Output Summary

By the end of Phase 3, the following are locked in and available for Phase 4:
- **Synthesis** — distilled understanding of what we're building and why
- **Analysis** — dependency graph, risks with mitigations, failure modes, interface boundaries
- **Approach** — chosen approach with reasoning, rejected alternatives, accepted tradeoff
- **Decomposition** — task list with per-task justification, order rationale, confidence score
- **Metis Review** — gaps identified and addressed, guardrails applied

Phase 4's preview draws directly from these: `Approach` → preview's "Approach" field, `Risks` from analysis → preview's "Risks" field, `Decomposition` → preview's "Estimated tasks" and "Mode" fields, `Metis Review` → preview's "Guardrails" field.

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
Tests:     {testing approach from Phase 1}
Estimated tasks: {N tasks}
Mode:      {Task Briefs (N briefs, default) | Master + Sub-Plans (N phases, escape hatch)}

Metis Review:
  Gaps addressed: {list of gaps Metis found that were incorporated}
  Assumptions: {list — ask user to validate}
  Guardrails: {explicit scope boundaries}
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
- **QA Scenarios** (agent-executed verification steps)
- Validation Commands (L1–L5, each level filled or explicitly "N/A" with reason)
- Acceptance Criteria (Implementation + Runtime checkboxes)
- **Parallelization** (Wave N, blocks, blocked-by)
- Handoff Notes (what task N+1 needs to know; omit for last task)
- Completion Checklist

#### QA Scenarios

Every task brief includes agent-executed QA scenarios. These are NOT unit tests — they are verification steps the executing agent performs.

**Format:**
```markdown
## QA Scenarios

### Scenario 1: {Happy Path Name}
**Tool**: Bash / Playwright / Read
**Steps**:
1. {exact command or action}
2. {exact command or action}
**Expected**: {concrete, verifiable result}
**Evidence**: `.agents/features/{feature}/evidence/task-{N}-{slug}.{ext}`

### Scenario 2: {Error Path Name}
**Tool**: Bash
**Steps**:
1. {trigger error condition}
**Expected**: {specific error message or behavior}
**Evidence**: `.agents/features/{feature}/evidence/task-{N}-{slug}.{ext}`
```

**Rules:**
- Every task has at least 2 QA scenarios (happy path + error path)
- Scenarios use specific tools (Bash, Playwright, Read), not vague "verify"
- Expected results are concrete, not "it works"
- Evidence is saved to `.agents/features/{feature}/evidence/`

#### Parallelization

Every task brief specifies parallelization constraints.

**Format:**
```markdown
## Parallelization

- **Wave**: {N} — Tasks in the same wave can run in parallel
- **Can Parallel**: YES / NO
- **Blocks**: {task numbers this task blocks, e.g., "Tasks 4, 5"}
- **Blocked By**: {task numbers this task depends on, e.g., "Task 1"}
```

**Rules:**
- Wave 1 tasks have no dependencies (can start immediately)
- Higher wave numbers depend on lower waves completing
- "Blocks" lists downstream tasks that wait for this one
- "Blocked By" lists upstream tasks this one waits for
- Tasks in the same wave with `Can Parallel: YES` can run simultaneously

**Example:**
```
Task 1: Create base types     — Wave 1, Blocks: 2, 3, 4
Task 2: Implement service     — Wave 2, Blocked By: 1, Blocks: 4
Task 3: Implement handler     — Wave 2, Blocked By: 1, Blocks: 4
Task 4: Integration tests     — Wave 3, Blocked By: 2, 3
```

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

### Archon Task Sync (if connected) → `librarian` agent

After writing the plan, invoke the librarian agent to sync tasks with Archon:

```typescript
task(
  subagent_type="librarian",
  run_in_background=false,  // Wait for result
  load_skills=[],
  description="Sync tasks to Archon for {feature}",
  prompt=`
    [CONTEXT]: Plan written for {feature} with {N} task briefs
    [GOAL]: Create Archon tasks for tracking
    [REQUEST]:
    1. Find or create Archon project for this feature
    2. Create one Archon task per task brief
    3. Return task IDs to store in plan metadata
  `
)
```

The librarian agent uses Archon MCP tools when connected.

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

## Phase 6: Self-Review

Before presenting to user, perform self-review with gap classification.

### Gap Classification

| Gap Type | Definition | Action |
|----------|------------|--------|
| **CRITICAL** | Blocks execution, user input required | Ask user immediately, do not proceed |
| **MINOR** | Small issue, sensible default exists | Fix silently, note in summary |
| **AMBIGUOUS** | Multiple valid interpretations | Apply default, disclose in summary |

### Self-Review Checklist

Run through this checklist after writing plan artifacts:

```
## Self-Review: {feature}

### Completeness
- [ ] All TODOs have acceptance criteria?
- [ ] All file references exist in codebase?
- [ ] No assumptions without evidence?
- [ ] Guardrails from Metis incorporated?
- [ ] Scope boundaries clearly defined?

### QA Coverage
- [ ] Every task has QA scenarios?
- [ ] QA scenarios include happy path?
- [ ] QA scenarios include error path?
- [ ] Evidence collection paths defined?

### Parallelization
- [ ] Wave assignments are valid?
- [ ] Dependencies correctly mapped?
- [ ] No circular dependencies?

### Gaps Found
- CRITICAL: {list or "None"}
- MINOR: {list or "None"} — {how resolved}
- AMBIGUOUS: {list or "None"} — {default applied}
```

### Gap Resolution

**CRITICAL gaps:**
1. Stop self-review
2. Ask user the blocking question
3. Update draft with answer
4. Re-run self-review

**MINOR gaps:**
1. Fix in place (edit plan.md or task briefs)
2. Note in summary: "Auto-resolved: {gap} → {fix}"

**AMBIGUOUS gaps:**
1. Apply sensible default
2. Note in summary: "Assumption: {assumption}. Override if needed."

---

## Phase 7: Present Summary + Optional Momus Review

After self-review passes (no CRITICAL gaps), present summary and offer high-accuracy review.

### Summary Presentation

```
## Plan Complete: {feature}

**Plan artifacts:**
- `.agents/features/{feature}/plan.md` (overview + task index)
- `.agents/features/{feature}/task-1.md` through `task-{N}.md`

**Key Decisions:**
- {decision 1}: {rationale}
- {decision 2}: {rationale}

**Scope:**
- IN: {what's included}
- OUT: {what's explicitly excluded}

**Guardrails Applied:**
- {guardrail from Metis}
- {guardrail from Metis}

**Auto-Resolved (minor gaps):**
- {gap}: {how resolved}

**Assumptions (validate if needed):**
- {assumption 1}
- {assumption 2}

**Test Strategy:** {TDD / Tests-after / None}
**Confidence:** {X}/10
**Estimated effort:** {N} tasks across {M} waves

---

**Ready to proceed?**
1. **Execute** → `/execute .agents/features/{feature}/plan.md`
2. **High Accuracy Review** → Have Momus rigorously verify every detail first
```

### Momus Review (If Requested)

If user chooses "High Accuracy Review":

```typescript
task(
  subagent_type="momus",
  run_in_background=false,
  load_skills=[],
  description="Plan review for {feature}",
  prompt=`
    Rigorously review this plan for clarity, verifiability, and completeness.
    
    **Plan location:** .agents/features/{feature}/plan.md
    **Task briefs:** .agents/features/{feature}/task-{1..N}.md
    
    **Review Criteria:**
    
    1. **Acceptance Criteria Quality**
       - Every TODO has clear, testable acceptance criteria?
       - Criteria are objective (not "verify it works")?
       - Success/failure is unambiguous?
    
    2. **QA Scenario Quality**
       - Every task has QA scenarios?
       - Scenarios use specific tools (Bash/Playwright/Read)?
       - Expected results are concrete?
       - Evidence paths are defined?
    
    3. **Dependency Integrity**
       - All dependencies explicitly listed?
       - No implicit assumptions between tasks?
       - Wave assignments are valid?
       - No circular dependencies?
    
    4. **Scope Boundedness**
       - Scope is clearly defined?
       - Exclusions are explicit?
       - No open-ended tasks?
       - Guardrails prevent scope creep?
    
    5. **Execution Readiness**
       - Each task is self-contained?
       - Context references are complete?
       - Patterns to follow are specific?
       - Validation commands are provided?
    
    **Verdict:** APPROVE or REJECT
    
    If REJECT, list specific issues to fix:
    - Task {N}: {issue} → {required fix}
  `
)
```

### Momus Iteration

If Momus rejects:
1. Fix the specific issues listed
2. Re-run Momus review
3. Repeat until APPROVE

If Momus approves:
```
Momus review: **APPROVED**

Plan is verified for clarity, verifiability, and completeness.

Ready to execute: `/execute .agents/features/{feature}/plan.md`
```

---

## Cleanup

After user confirms ready to execute:

1. **Delete draft file:**
   ```
   rm .agents/features/{feature}/planning-draft.md
   ```

2. **Keep plan artifacts:**
   - `plan.md` — overview and task index
   - `task-{N}.md` — individual task briefs
   - (or `plan-master.md` + `plan-phase-{N}.md` for complex features)

3. **Write pipeline handoff** (already defined in Phase 5)

4. **Present next step:**
   ```
   Planning complete. Ready to execute.
   
   Next: /execute .agents/features/{feature}/plan.md
   ```

---

## The Task Format

Every task in a plan MUST include at minimum ACTION, TARGET, IMPLEMENT, VALIDATE. Full plans include all fields:

| Field | Purpose | Example |
|-------|---------|---------|
| **ACTION** | What operation | CREATE / UPDATE / ADD / REMOVE / REFACTOR |
| **TARGET** | Specific file path | `src/services/auth.ts` |
| **IMPLEMENT** | Code-level detail | "Class AuthService with methods: login(), logout()" |
| **PATTERN** | Reference pattern | "Follow pattern in `src/services/user.ts:45-62`" |
| **IMPORTS** | Exact imports | Copy-paste ready import statements |
| **GOTCHA** | Known pitfalls | "Must use async/await — the database client is async-only" |
| **VALIDATE** | Verification command | `npm test -- --grep "auth"` |
| **QA** | Agent verification | "Run login flow, verify token returned" |
| **WAVE** | Parallelization | "Wave 2, Blocked By: Task 1" |

Light plans use a reduced format (ACTION, TARGET, IMPLEMENT, VALIDATE minimum). Full plans include QA and WAVE for every task.

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
