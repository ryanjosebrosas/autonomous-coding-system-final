# Distilled Task Briefs — Task 2/7
<!-- Source: .agents/features/distilled-task-briefs/plan.md -->
<!-- Scope: Update planning.md — make task briefs the default output mode -->
<!-- Prior: task-1.md (TASK-BRIEF-TEMPLATE.md created) -->

## PRIOR TASKS

**Files Changed in Prior Task(s):**
- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — Created new template defining the structure of task-N.md files

**Key Outcomes from Prior Task(s):**
- Task brief template exists with 10 required sections: PRIOR TASKS, OBJECTIVE, SCOPE, FILES TO READ, STEP-BY-STEP TASKS, TESTING, VALIDATION COMMANDS, ACCEPTANCE CRITERIA, HANDOFF, COMPLETION CHECKLIST
- Template includes the 7-field task format and Current/Replace block examples

**State Carried Forward:**
- Template path: `.opencode/templates/TASK-BRIEF-TEMPLATE.md`
- This task will reference the template when adding task brief generation instructions to planning.md

**Known Issues or Deferred Items:**
- None

---

## OBJECTIVE

Update `.opencode/commands/planning.md` to make task briefs the default output mode. After this task, `/planning` will produce `plan.md` (overview + task index) plus `task-1.md` through `task-N.md` (execution briefs) for every feature. The master plan mode stays as an escape hatch for very large features. The old "single plan only" mode (where plan.md was both overview AND execution document) is replaced.

---

## SCOPE

**What This Task Delivers:**

Planning command updated with task brief mode as default, including complexity detection, output paths, pipeline handoff, and after-writing display.

**Files This Task Touches:**
- `.opencode/commands/planning.md` — modify (6 sections updated)

**Dependencies:**
- Task 1 must complete first (TASK-BRIEF-TEMPLATE.md must exist)

**Out of Scope for This Task:**
- execute.md changes (task 3)
- prime.md changes (task 4)
- AGENTS.md changes (task 5)
- build.md changes (task 6)

---

## FILES TO READ BEFORE STARTING

- `.opencode/commands/planning.md` (all 384 lines) — The file being modified. Read the ENTIRE file to understand current structure.
- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` (all lines) — The new template created in task 1. Reference for task brief generation instructions.
- `.opencode/templates/STRUCTURED-PLAN-TEMPLATE.md` (lines 1-25) — Header comment block. Shows the "When to use this template" guidance that needs updating.

### Patterns to Follow

**Existing mode documentation pattern** — See `planning.md:218-260`
- What to match: Each mode has its own subsection under Phase 5 with clear instructions, line requirements, and save paths
- Gotcha: The new task brief mode section must be equally detailed — not a thin "also generate task briefs" note

**Output section pattern** — See `planning.md:263-278`
- What to match: Each mode shows the exact directory listing of files produced
- Gotcha: Task brief mode must show plan.md + task-N.md files

**Handoff pattern** — See `planning.md:287-315`
- What to match: Each mode has its own handoff markdown block with mode-specific fields
- Gotcha: Task brief handoff introduces `Task Progress` field (new, not in existing handoff blocks)

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE Phase 4 Preview — `.opencode/commands/planning.md`

- **IMPLEMENT**: Update the Mode line in the preview to include task brief mode as the default option.

  **Current** (line 195 of `planning.md`):
  ```
  Mode:      {Single Plan | Master + Sub-Plans (N phases)}
  ```

  **Replace with:**
  ```
  Mode:      {Task Briefs (N tasks) | Master + Sub-Plans (N phases)}
  ```

- **PATTERN**: Same line, same structure — just replacing the mode options
- **IMPORTS**: N/A
- **GOTCHA**: "Single Plan" is removed as a preview option because task briefs are now the default. A feature with 1 task still produces plan.md + task-1.md (just one brief).
- **VALIDATE**: Read line 195 of the updated file and confirm the new Mode options

### Step 2: UPDATE Phase 5 Auto-Detect Complexity — `.opencode/commands/planning.md`

- **IMPLEMENT**: Replace the complexity detection logic to make task briefs the default and master plans the exception.

  **Current** (lines 206-214 of `planning.md`):
  ```markdown
  ### Auto-Detect Complexity

  After Phases 1-4 (discovery/design), assess complexity:
  - **Single Plan Mode**: Estimated tasks < 10, no distinct phases
  - **Master + Sub-Plan Mode**: Estimated tasks >= 10 OR multiple distinct phases identified

  Announce the mode transparently:
  - Single: "This looks like ~8 tasks in one phase — I'll write a single structured plan."
  - Multi: "I count ~15 tasks across 3 phases — I'll use the master + sub-plan approach."
  ```

  **Replace with:**
  ```markdown
  ### Auto-Detect Complexity

  After Phases 1-4 (discovery/design), assess complexity:
  - **Task Brief Mode (DEFAULT)**: Most features. Produces `plan.md` (overview + task index) plus `task-1.md` through `task-N.md` (one brief per unit of work, each 700-1000 lines).
  - **Master + Sub-Plan Mode (EXCEPTION)**: Very large features with 10+ tasks AND multiple distinct phases with heavy cross-cutting concerns. Produces `plan-master.md` + `plan-phase-N.md` files.

  Splitting into task briefs:
  - One task brief = one coherent unit of work that fits comfortably in a single `/execute` session
  - Default: 1 task brief per logical change. If the feature has 5 tasks, produce 5 briefs.
  - Group only when splitting would make execution harder (e.g., two tightly coupled steps on the same file)
  - Use judgment, not formulas — "what's the smallest meaningful change you can ship?"

  Announce the mode transparently:
  - Task briefs: "This looks like ~{N} tasks — I'll write plan.md + {N} task briefs."
  - Master: "This is a large feature with {N} tasks across {M} distinct phases — I'll use the master + sub-plan approach."
  ```

- **PATTERN**: Same section location, same header level
- **IMPORTS**: N/A
- **GOTCHA**: The splitting guidance is intentionally vague ("use judgment") — don't add formulas or tables mapping complexity to brief count. The user explicitly requested this be simple.
- **VALIDATE**: Read lines 206-225 of updated file and confirm both modes documented with task briefs as default

### Step 3: REPLACE Single Plan Mode section — `.opencode/commands/planning.md`

- **IMPLEMENT**: Replace the "Single Plan Mode" section with "Task Brief Mode (Default)". This is the biggest change — it defines how plan.md and task briefs are generated.

  **Current** (lines 218-235 of `planning.md`):
  ```markdown
  ### Single Plan Mode

  Generate the structured plan. **Every plan is 700-1000 lines. No exceptions.** The depth label (light/standard/heavy) does NOT affect planning quality — it only affects the validation tier during `/build`. All plans get the full treatment:

  - Feature Description, User Story, Problem Statement, Solution Statement
  - Feature Metadata with Slice Guardrails
  - Pillar Context (if available): pillar N — name, scope, research findings relevant to this spec, PRD requirements this spec covers
  - Context References (codebase files with line numbers, related memories, relevant docs)
  - Patterns to Follow (with actual code snippets from the project)
  - Implementation Plan (Foundation → Core → Integration → Testing phases)
  - Step-by-Step Tasks (every task has ACTION, TARGET, IMPLEMENT, PATTERN, IMPORTS, GOTCHA, VALIDATE)
  - Testing Strategy (unit, integration, edge cases)
  - Validation Commands (all levels of the validation pyramid)
  - Acceptance Criteria (Implementation + Runtime, with checkboxes)
  - Completion Checklist
  - Notes (key decisions, risks, confidence score)

  **Hard requirement:** If the plan is under 700 lines, it is REJECTED. Expand code samples, add more task detail, include more pattern references. Code samples must be copy-pasteable, not summaries.
  ```

  **Replace with:**
  ```markdown
  ### Task Brief Mode (Default)

  Produce TWO types of output: the overview plan and the task briefs.

  **Step 1: Write `plan.md` (Overview + Task Index)**

  The overview plan. **700-1000 lines minimum. No exceptions.** Contains ALL context and design decisions — this is the human-readable source of truth:

  - Feature Description, User Story, Problem Statement, Solution Statement
  - Feature Metadata with Slice Guardrails
  - Pillar Context (if available): pillar N — name, scope, research findings relevant to this spec, PRD requirements this spec covers
  - Context References (codebase files with line numbers, related memories, relevant docs)
  - Patterns to Follow (with actual code snippets from the project)
  - Implementation Plan (Foundation → Core → Integration → Testing phases)
  - Step-by-Step Tasks (summary — ACTION, TARGET, one-line description per task)
  - Testing Strategy (unit, integration, edge cases)
  - Validation Commands (all levels of the validation pyramid)
  - Acceptance Criteria (Implementation + Runtime, with checkboxes — whole feature)
  - Completion Checklist
  - Notes (key decisions, risks, confidence score)
  - **TASK INDEX** (NEW — table mapping each task to its brief file, scope, status, and files touched)

  The TASK INDEX table at the bottom of plan.md:
  ```
  | Task | Brief Path | Scope | Status | Files |
  |------|-----------|-------|--------|-------|
  | 1 | `task-1.md` | {1-line scope} | pending | {files touched} |
  | 2 | `task-2.md` | {1-line scope} | pending | {files touched} |
  | N | `task-N.md` | {1-line scope} | pending | {files touched} |
  ```

  Save to: `.agents/features/{feature}/plan.md`

  **Hard requirement:** If plan.md is under 700 lines, it is REJECTED. The overview must be comprehensive — full context references, full pattern examples, full design rationale.

  **Step 2: Write task briefs (`task-1.md` through `task-N.md`)**

  One brief per unit of work. **700-1000 lines each. No exceptions.** Each brief is self-contained — the executor should NOT need to read plan.md to implement the task.

  Use template: `.opencode/templates/TASK-BRIEF-TEMPLATE.md`

  Each brief contains:
  - Prior task summary (what was already done)
  - Objective (what this task accomplishes)
  - Scope (in/out/dependencies)
  - Files to read (exact file:line references — executor reads these directly)
  - Step-by-step tasks with 7-field format (ACTION, TARGET, IMPLEMENT, PATTERN, IMPORTS, GOTCHA, VALIDATE)
  - Full code blocks — copy-paste ready, not summaries
  - Current/Replace blocks for text-centric changes
  - Testing (test files to create with full test code)
  - Validation commands (L1-L5)
  - Acceptance criteria (checkboxes)
  - Handoff notes (what the next brief needs to know)

  Save to: `.agents/features/{feature}/task-{N}.md`

  **Hard requirement:** If any task brief is under 700 lines, it is REJECTED. Expand code samples, add more step detail, include more Current/Replace blocks. Every line must be operational — no advisory sections.

  **Key principle**: `/execute` loads ONE task brief per session. The brief must contain EVERYTHING the executor needs — file references, code blocks, patterns, validation commands. The executor should never need to hunt through plan.md for missing context.
  ```

- **PATTERN**: Same section location under Phase 5, same header level (###)
- **IMPORTS**: N/A
- **GOTCHA**: The Step-by-Step Tasks in plan.md are now SUMMARY form (ACTION, TARGET, one-line) — the detailed 7-field tasks live in the task briefs. This is a deliberate design choice: plan.md is the overview, briefs are the execution documents.
- **VALIDATE**: Read the updated "Task Brief Mode" section and verify both plan.md and task brief generation are documented with line requirements

### Step 4: UPDATE Master + Sub-Plan Mode section — `.opencode/commands/planning.md`

- **IMPLEMENT**: Keep the Master + Sub-Plan Mode section but add a note that it's the exception, not the default. No structural changes — just a framing update.

  **Current** (line 239 of `planning.md`):
  ```markdown
  ### Master + Sub-Plan Mode
  ```

  **Replace with:**
  ```markdown
  ### Master + Sub-Plan Mode (Exception — Large Features Only)
  ```

  Also update the opening line. **Current** (line 241):
  ```
  For complex features with 10+ tasks or multiple distinct phases:
  ```

  **Replace with:**
  ```
  For very large features with 10+ tasks AND multiple distinct phases with heavy cross-cutting concerns. Use task brief mode for everything else.
  ```

- **PATTERN**: Same section, minimal change
- **IMPORTS**: N/A
- **GOTCHA**: Don't change the master plan mechanics — just update framing. The master plan system works and should stay untouched.
- **VALIDATE**: Read lines 239-241 of updated file and confirm the "exception" framing

### Step 5: UPDATE Output section — `.opencode/commands/planning.md`

- **IMPLEMENT**: Replace the output section to show task brief mode as default, master mode as exception.

  **Current** (lines 263-278 of `planning.md`):
  ```markdown
  ## Output

  Create the feature directory if it doesn't exist: `.agents/features/{feature}/`

  **Single Plan Mode:**
  ```
  .agents/features/{feature}/plan.md
  ```

  **Master + Sub-Plan Mode:**
  ```
  .agents/features/{feature}/plan-master.md
  .agents/features/{feature}/plan-phase-1.md
  .agents/features/{feature}/plan-phase-2.md
  ...
  ```
  ```

  **Replace with:**
  ```markdown
  ## Output

  Create the feature directory if it doesn't exist: `.agents/features/{feature}/`

  **Task Brief Mode (default):**
  ```
  .agents/features/{feature}/plan.md
  .agents/features/{feature}/task-1.md
  .agents/features/{feature}/task-2.md
  ...
  .agents/features/{feature}/task-N.md
  ```

  **Master + Sub-Plan Mode (exception):**
  ```
  .agents/features/{feature}/plan-master.md
  .agents/features/{feature}/plan-phase-1.md
  .agents/features/{feature}/plan-phase-2.md
  ...
  ```
  ```

- **PATTERN**: Same section, same structure — just updating mode names and adding task brief listing
- **IMPORTS**: N/A
- **GOTCHA**: The task brief listing shows `task-1.md` through `task-N.md` alongside `plan.md` — this makes it clear that both are produced in the same `/planning` session.
- **VALIDATE**: Read the Output section and confirm both modes shown with correct file listings

### Step 6: UPDATE Pipeline Handoff Write section — `.opencode/commands/planning.md`

- **IMPLEMENT**: Replace the handoff section to show task brief mode handoff as default.

  **Current** (lines 287-315 of `planning.md`):
  ```markdown
  ### Pipeline Handoff Write (required)

  After writing the plan (and Archon sync if applicable), overwrite `.agents/context/next-command.md`:

  **Single Plan Mode:**
  ```markdown
  # Pipeline Handoff
  <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

  - **Last Command**: /planning
  - **Feature**: {feature}
  - **Next Command**: /execute .agents/features/{feature}/plan.md
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
  ```

  **Replace with:**
  ```markdown
  ### Pipeline Handoff Write (required)

  After writing the plan (and Archon sync if applicable), overwrite `.agents/context/next-command.md`:

  **Task Brief Mode (default):**
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

  **Master + Sub-Plan Mode (exception):**
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
  ```

- **PATTERN**: Same section structure, same handoff format
- **IMPORTS**: N/A
- **GOTCHA**: Task brief handoff uses `Task Progress` field (new) instead of `Master Plan` + `Phase Progress`. The Next Command points to `plan.md` (the executor auto-detects task briefs from there).
- **VALIDATE**: Read the handoff section and confirm both modes shown with correct fields

### Step 7: UPDATE After Writing section — `.opencode/commands/planning.md`

- **IMPLEMENT**: Replace the after-writing display to show task brief mode as default.

  **Current** (lines 319-346 of `planning.md`):
  ```markdown
  ## After Writing

  **Single Plan Mode:**
  ```
  Plan written: .agents/features/{feature}/plan.md
  Tasks: {N} tasks across {phases} phases
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
  ```

  **Replace with:**
  ```markdown
  ## After Writing

  **Task Brief Mode (default):**
  ```
  Plan written: .agents/features/{feature}/plan.md
  Task briefs:  .agents/features/{feature}/task-1.md
                .agents/features/{feature}/task-2.md
                ...
                .agents/features/{feature}/task-{N}.md
  Total:       {N} tasks ({700-1000 lines each})
  Pillar: {N} — {name} (from {pillar-file-path})   ← omit if no pillar context
  PRD requirements covered: {list from pillar file PRD Coverage}   ← omit if no pillar context
  Confidence: {X}/10 for one-pass success
  Key risk: {top risk}
  Archon: {synced N tasks / not connected}

  Next: /execute .agents/features/{feature}/plan.md
  ```

  **Master + Sub-Plan Mode (exception):**
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
  ```

- **PATTERN**: Same section structure, same display format
- **IMPORTS**: N/A
- **GOTCHA**: The "Next" command for task brief mode still points to `plan.md` (not `task-1.md`) because `/execute` auto-detects the first undone task brief.
- **VALIDATE**: Read the After Writing section and confirm both modes shown with correct display

---

## TESTING

No tests required — this task modifies a command documentation file (markdown). Validation is structural.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```
# Verify markdown is well-formed (manual check)
```

### Level 2: Type Safety
```
N/A — markdown command file
```

### Level 3: Unit Tests
```
N/A — no code
```

### Level 4: Integration Tests
```
N/A — command correctness verified when /planning runs in a later session
```

### Level 5: Manual Validation

Read the updated `.opencode/commands/planning.md` and verify:
1. Phase 4 Preview Mode line shows "Task Briefs (N tasks)" as first option
2. Phase 5 complexity detection lists task briefs as DEFAULT, master plans as EXCEPTION
3. Task Brief Mode section explains both plan.md and task brief generation
4. plan.md requirements include the TASK INDEX table
5. Task brief requirements reference TASK-BRIEF-TEMPLATE.md
6. Master + Sub-Plan Mode section has "(Exception)" in header
7. Output section shows task brief file listing as default
8. Pipeline Handoff section shows task brief handoff with `Task Progress` field
9. After Writing section shows task brief display as default
10. All file paths use `.agents/features/{feature}/` format (no stale `.agents/plans/` references)

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Phase 4 preview updated with task brief mode
- [ ] Phase 5 complexity detection makes task briefs the default
- [ ] Task Brief Mode section documents plan.md generation with TASK INDEX
- [ ] Task Brief Mode section documents task-N.md generation with 700-1000 line requirement
- [ ] Master plan mode marked as exception
- [ ] Output section shows both modes with correct file listings
- [ ] Pipeline handoff section shows task brief handoff with Task Progress field
- [ ] After Writing section shows task brief display
- [ ] All validation commands pass with zero errors

### Runtime (verify after testing/deployment)

- [ ] `/planning` produces plan.md + task-N.md files when run
- [ ] `/planning` produces master plan + phase files when master mode explicitly chosen
- [ ] No regressions in existing planning functionality

---

## HANDOFF

### Files Created/Modified

- `.opencode/commands/planning.md` — Updated Phase 4, Phase 5, Output, Handoff, After Writing sections to make task briefs the default mode

### Patterns Established

- Task brief mode as default: plan.md (overview + task index) + task-N.md (execution briefs)
- Master plan mode as exception: only for very large features with 10+ tasks and distinct phases
- TASK INDEX table in plan.md: maps task numbers to brief files with scope and status
- Task Progress field in handoff: `0/{N} complete` format

### State to Carry Forward

- planning.md now produces task briefs by default
- Task 3 (execute.md) must add detection logic for task-N.md files in the feature directory
- Task 4 (prime.md) must add detection for Task Progress in handoff and task-N.md files in artifact scan
- Task 5 (AGENTS.md) must document the new task brief artifacts, handoff fields, and session model

### Known Issues or Deferred Items

- The STRUCTURED-PLAN-TEMPLATE.md header (lines 19-24 "When to use this template") still references "Single Plan" and "<10 tasks" — could be updated for consistency but is low priority since planning.md instructions take precedence

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step validation passed
- [ ] All validation commands executed successfully
- [ ] Tests pass (N/A)
- [ ] No linting or type checking errors (N/A)
- [ ] Manual validation confirms all 10 checkpoints pass
- [ ] Acceptance criteria all met
- [ ] Handoff notes completed for next task
