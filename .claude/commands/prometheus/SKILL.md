# /prometheus — Interview-Mode Planner

## Pipeline Position

```
/prime → /mvp → /prd → /prometheus (this) → /start-work → /code-loop → /commit → /pr
```

Alternative planning path with Socratic discovery. Produces `.agents/features/{feature}/plan.md` through structured questioning before planning.

## Purpose

Interview-mode planner that asks questions before writing code. Unlike `/planning` which auto-generates plans, Prometheus discovers requirements through Socratic dialogue, surfaces hidden assumptions, and produces plans that reflect true user intent.

## Usage

```
/prometheus {feature-name-or-description}
```

- `$ARGUMENTS` — Feature name or brief description to start discovery

---

## Step 0: Intent Classification (EVERY Request)

Before consultation, classify work intent. This determines interview strategy.

### Intent Types

| Intent | Signal | Strategy |
|--------|--------|----------|
| **Trivial** | Single file, <10 lines, obvious fix | Skip heavy interview. Quick confirm → suggest action. |
| **Simple** | 1-2 files, clear scope, <30 min | Lightweight: 1-2 questions → propose approach. |
| **Refactoring** | "refactor", "restructure", existing code | Safety focus: tests, rollback, behavior preservation |
| **Build from Scratch** | New feature, greenfield, "create new" | Discovery focus: patterns first, then requirements |
| **Mid-sized** | Scoped feature, clear boundaries | Boundary focus: deliverables, exclusions, guardrails |
| **Collaborative** | "let's figure out", "help me plan" | Dialogue focus: explore together, incremental clarity |
| **Architecture** | System design, infrastructure | Strategic focus: Oracle consultation REQUIRED |
| **Research** | Goal exists, path unclear | Investigation focus: parallel probes, exit criteria |

---

## Step 1: Check Draft State

Check `.agents/features/{feature}/prometheus-draft.md` for existing interview progress.

**If exists:**
1. Read draft to restore context
2. Present: "Continuing from our previous discussion about {topic}. We'd covered: {summary}"
3. Ask: "Ready to continue, or should we start fresh?"

**If not exists:**
1. Create `.agents/features/{feature}/` directory if needed
2. Create initial draft: `.agents/features/{feature}/prometheus-draft.md`
3. Begin Step 2

---

## Step 2: Intent-Specific Interview

Each intent type has a focused interview strategy.

### Trivial/Simple — Tiki-Taka (Rapid Back-and-Forth)

```
User: "Fix the typo in login button"

Prometheus: "Quick fix - I see the typo. Before I add this:
- Should I also check other buttons for similar typos?
- Any commit message preference?

Or should I just note this single fix?"
```

- Skip heavy exploration
- Ask smart questions (not "what do you want?")
- Propose, don't plan

### Refactoring — Safety Focus

**Pre-Interview Research (launch in parallel):**
```typescript
task(subagent_type="explore", run_in_background=true, load_skills=[], prompt="I'm refactoring [target] and need to map impact scope before changes. Find all usages via lsp_find_references — call sites, return value consumers, type flow, patterns that would break on signature changes. Also check for dynamic access. Return: file path, usage pattern, risk level per call site.")

task(subagent_type="explore", run_in_background=true, load_skills=[], prompt="I'm modifying [affected code] and need test coverage for behavior preservation. Find all test files exercising this — what each asserts, inputs used, public API vs internals. Identify coverage gaps. Return coverage map.")
```

**Interview Focus:**
1. What specific behavior must be preserved?
2. What test commands verify current behavior?
3. What's the rollback strategy?
4. Should changes propagate or stay isolated?

### Build from Scratch — Discovery Focus

**Pre-Interview Research (launch BEFORE questions):**
```typescript
task(subagent_type="explore", run_in_background=true, load_skills=[], prompt="I'm building a new [feature] from scratch and need to match codebase conventions. Find 2-3 similar implementations — directory structure, naming, exports, shared utilities, error handling, registration steps. Return concrete file paths and patterns.")

task(subagent_type="explore", run_in_background=true, load_skills=[], prompt="I'm adding [feature type] and need organizational conventions. Find how similar features are organized: nesting depth, index.ts barrels, types conventions, test placement, registration patterns. Return canonical structure.")

task(subagent_type="librarian", run_in_background=true, load_skills=[], prompt="I'm implementing [technology] and need production guidance. Find official docs: setup, project structure, API reference, pitfalls, migration gotchas. Also find 1-2 OSS examples (not tutorials).")
```

**Interview Focus (AFTER research):**
1. Found pattern X. Should new code follow or deviate?
2. What should explicitly NOT be built? (boundaries)
3. Minimum viable version vs full vision?
4. Preferred libraries/approaches?

### Mid-sized Task — Boundary Focus

**Interview Focus:**
1. What are the EXACT outputs? (files, endpoints, UI)
2. What must NOT be included? (explicit exclusions)
3. What are hard boundaries? (no touching X, no changing Y)
4. How do we know it's done? (acceptance criteria)

**AI-Slop Patterns to Surface:**
- Scope inflation: "Also tests for adjacent modules" → "Should I include tests beyond [TARGET]?"
- Premature abstraction: "Extracted to utility" → "Do you want abstraction or inline?"
- Over-validation: "15 error checks for 3 inputs" → "Error handling: minimal or comprehensive?"
- Documentation bloat: "Added JSDoc everywhere" → "Documentation: none, minimal, or full?"

### Architecture — Strategic Focus

**Research First:**
```typescript
task(subagent_type="explore", run_in_background=true, load_skills=[], prompt="I'm planning architectural changes. Find: module boundaries, dependency direction, data flow, key abstractions, any ADRs. Map dependency graph, identify circular deps and coupling hotspots.")

task(subagent_type="librarian", run_in_background=true, load_skills=[], prompt="I'm designing architecture for [domain]. Find proven patterns, scalability trade-offs, common failure modes, case studies from engineering blogs. Skip generic patterns — need domain-specific.")
```

**Oracle Consultation (required for architecture):**
```typescript
task(subagent_type="oracle", run_in_background=false, load_skills=[], prompt="Architecture consultation: [context]...")
```

**Interview Focus:**
1. Expected lifespan of this design?
2. Scale/load to handle?
3. Non-negotiable constraints?
4. Existing systems to integrate?

---

## Step 3: Test Infrastructure Assessment

**MANDATORY for Build and Refactor intents.**

### Step 3a: Detect Test Infrastructure

Ask: "Do you have test infrastructure set up? (jest, vitest, pytest, etc.)"

Or search automatically:
```typescript
task(subagent_type="explore", run_in_background=true, load_skills=[], prompt="Assess test infrastructure: Find test framework (package.json scripts, jest/vitest/bun/pytest configs), test patterns (2-3 examples showing assertion style, mocks), coverage config, CI integration. Return: YES/NO per capability with examples.")
```

### Step 3b: Ask the Test Question

**If infrastructure EXISTS:**
```
"I see test infrastructure ({framework}).

Should this work include automated tests?
- TDD: Tests written first, then implementation
- Tests-after: Tests added after implementation
- None: No unit/integration tests

Regardless, every task includes Agent-Executed QA Scenarios — the executing agent directly verifies deliverables."
```

**If infrastructure DOES NOT exist:**
```
"No test infrastructure detected.

Would you like to set up testing?
- YES: Include test infrastructure setup in the plan (framework selection, config, example)
- NO: Proceed without unit tests

Either way, Agent-Executed QA Scenarios verify each deliverable."
```

### Step 3c: Record Decision

Add to draft immediately:
```markdown
## Test Strategy
- **Infrastructure**: EXISTS/NOT_FOUND
- **Automated tests**: TDD | TESTS_AFTER | NONE
- **Framework**: {choice}
```

---

## Step 4: Draft Management

**First response**: Create draft file immediately after understanding topic.

```typescript
// Create .agents/features/{name}/prometheus-draft.md
```

**Every subsequent response**: Append/update draft with new information.

```typescript
// After each meaningful exchange
Edit(".agents/features/{name}/prometheus-draft.md", ...)
```

**Inform user**: "I'm recording our discussion in `.agents/features/{name}/prometheus-draft.md`."

---

## Step 5: Clearance Check

After interview, before plan generation:

```
## Interview Clearance Check

**Discussed**:
- [x] {topic 1}
- [x] {topic 2}
- [x] Test strategy
- [x] Scope boundaries

**Auto-Resolved** (sensible defaults applied):
- {default 1}
- {default 2}

**Ready for Plan Generation?**
- YES: All requirements clear → proceed to Step 6
- NEEDS INPUT: {specific question} → wait for answer, then check again
```

---

## Step 6: Metis Consultation (After Clearance)

**Before generating the plan**, summon Metis to catch what you might have missed:

```typescript
task(
  subagent_type="metis",
  load_skills=[],
  prompt=`Review this planning session before I generate the work plan:

  **User's Goal**: {summarize what user wants}

  **What We Discussed**:
  {key points from interview}

  **My Understanding**:
  {your interpretation}

  **Research Findings**:
  {key discoveries}

  Please identify:
  1. Questions I should have asked but didn't
  2. Guardrails that need to be explicitly set
  3. Potential scope creep areas to lock down
  4. Assumptions I'm making that need validation
  5. Missing acceptance criteria
  6. Edge cases not addressed`,
  run_in_background=false
)
```

---

## Step 7: Generate Plan

**Auto-transition when clearance check passes.**

**Explicit trigger when user says:**
- "Make it into a work plan!"
- "Create the work plan"
- "Generate the plan"

### Register Todos (FIRST ACTION)

```typescript
todoWrite([
  { content: "Consult Metis for gap analysis", status: "completed", priority: "high" },
  { content: "Generate work plan to .agents/features/{name}/plan.md", status: "in_progress", priority: "high" },
  { content: "Self-review: classify gaps", status: "pending", priority: "high" },
  { content: "Present summary with auto-resolved items", status: "pending", priority: "high" },
  { content: "Ask about high accuracy mode (Momus review)", status: "pending", priority: "medium" }
])
```

### Write Plan

Generate plan to: `.agents/features/{name}/plan.md`

**Plan Structure:**
```markdown
# {Plan Title}

## TL;DR

> **Quick Summary**: [1-2 sentences - core objective and approach]
> **Deliverables**: [Bullet list of outputs]
> **Estimated Effort**: [Quick | Short | Medium | Large | XL]
> **Parallel Execution**: [YES - N waves | NO - sequential]

---

## Context

### Original Request
[User's initial description]

### Interview Summary
**Key Discussions**:
- [Point 1]: [User's decision]

**Research Findings**:
- [Finding]: [Implication]

### Metis Review
**Identified Gaps** (addressed):
- [Gap]: [How resolved]

---

## Work Objectives

### Core Objective
[What we're achieving]

### Concrete Deliverables
- [Exact file/endpoint/feature]

### Definition of Done
- [ ] [Verifiable condition]

### Must Have
- [Non-negotiable requirement]

### Must NOT Have (Guardrails)
- [Explicit exclusion]
- [AI slop pattern to avoid]

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES/NO
- **Automated tests**: TDD | TESTS_AFTER | NONE
- **Framework**: {choice}

### QA Policy
Every task includes agent-executed QA scenarios.

---

## TODOs

- [ ] 1. [Task Title]

  **What to do**:
  - [Implementation steps]
  - [Test cases]

  **Must NOT do**:
  - [Exclusions]

  **Recommended Agent Profile**:
  - **Category**: [category]
  - **Skills**: [skill-1, skill-2]

  **Parallelization**:
  - **Can Run In Parallel**: YES/NO
  - **Parallel Group**: Wave N
  - **Blocks**: [dependent tasks]
  - **Blocked By**: [dependencies]

  **References**:
  - Pattern: `path/file.ts:lines` - [why]
  - API: `types/file.ts:Type` - [why]

  **Acceptance Criteria**:
  - [ ] [Verifiable condition]

  **QA Scenarios**:
  ```
  Scenario: [Happy path]
    Tool: [Playwright/interactive_bash/Bash]
    Steps: [exact steps]
    Expected: [concrete result]
    Evidence: .agents/features/{name}/evidence/task-N-slug.ext
  ```

  **Commit**: YES/NO

---

## Success Criteria

### Verification Commands
```bash
command  # Expected output
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
```

---

## Step 8: Self-Review

### Gap Classification

| Gap Type | Action |
|----------|--------|
| **CRITICAL** | Ask user immediately |
| **MINOR** | Fix silently, note in summary |
| **AMBIGUOUS** | Apply default, disclose in summary |

### Self-Review Checklist

```
□ All TODOs have acceptance criteria?
□ All file references exist?
□ No assumptions without evidence?
□ Guardrails from Metis incorporated?
□ Scope boundaries clearly defined?
□ Every task has QA scenarios?
□ QA scenarios include happy + error paths?
```

---

## Step 9: Present Summary

After generating plan:

```
## Plan Generated: {plan-name}

**Key Decisions Made**:
- [Decision]: [Rationale]

**Scope**:
- IN: [Included]
- OUT: [Excluded]

**Guardrails Applied**:
- [Guardrail]

**Auto-Resolved** (minor gaps):
- [Gap]: [How resolved]

**Defaults Applied**:
- [Default]: [Assumption]

Plan saved to: `.agents/features/{name}/plan.md`

**Ready to proceed?**
1. **Start Work** → `/start-work {name}` — Plan is solid, ready to execute
2. **High Accuracy Review** → Have Momus rigorously verify every detail
```

---

## Step 10: Momus Review (Optional)

If user chooses "High Accuracy Review":

```typescript
task(
  subagent_type="momus",
  load_skills=[],
  prompt=`Review this plan for clarity, verifiability, and completeness:

**Plan**: .agents/features/{name}/plan.md

Check:
1. Every TODO has clear acceptance criteria
2. Every "Must Have" is verifiable
3. Every QA scenario is specific (not vague)
4. No gaps in dependencies
5. Scope is bounded, not open-ended

Reject if:
- Acceptance criteria requires human judgment
- QA scenarios use vague language ("verify it works")
- Dependencies are implicit or missing
- Guardrails are missing or unclear`,
  run_in_background=false
)
```

Iterate until Momus says "APPROVE".

---

## Step 11: Cleanup

After user confirms:
1. Delete draft file: `.agents/features/{name}/prometheus-draft.md`
2. Present: "Ready to execute. Run `/start-work {name}` to begin."

---

## Pipeline Handoff Write

```markdown
# Pipeline Handoff

- **Last Command**: /prometheus
- **Feature**: {name}
- **Plan**: .agents/features/{name}/plan.md
- **Next Command**: /start-work {name}
- **Timestamp**: {ISO 8601}
- **Status**: awaiting-execution
```

---

## Anti-Patterns

**NEVER in Interview Mode:**
- Generate a work plan file before clearance
- Write TODOs during discovery
- Create acceptance criteria during interview
- Use plan-like structure in responses

**ALWAYS in Interview Mode:**
- Maintain conversational tone
- Use gathered evidence to inform suggestions
- Ask questions that help user articulate needs
- Confirm understanding before proceeding
- Update draft file after EVERY meaningful exchange

---

## Notes

- Interview mode is the default; skip only for trivial/simple requests
- Test question affects entire plan structure — ask early
- Momus review adds time but guarantees plan quality
- Use `question` tool for structured multi-option questions
- Draft file enables session resumption and recovery