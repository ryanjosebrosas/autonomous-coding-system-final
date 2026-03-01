# Distilled Task Briefs — Task 5/7
<!-- Source: .agents/features/distilled-task-briefs/plan.md -->
<!-- Scope: Update AGENTS.md — artifact table, session model, handoff fields, documentation -->
<!-- Prior: task-1 through task-4 (template + planning + execute + prime updated) -->

## PRIOR TASKS

**Files Changed in Prior Task(s):**
- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — Created (task 1)
- `.opencode/commands/planning.md` — Task brief mode as default (task 2)
- `.opencode/commands/execute.md` — Auto-detect task briefs, Step 2.6 (task 3)
- `.opencode/commands/prime.md` — Artifact scan + pending work display (task 4)

**Key Outcomes from Prior Task(s):**
- All core commands now support task briefs: planning produces them, execute detects and runs them, prime displays progress
- New concepts introduced: `task-{N}.md` / `task-{N}.done.md` artifacts, `executing-tasks` status, `Task Progress` handoff field, `[tasks]` display tag
- Session model: plan.md → auto-detect → execute one task brief per session → handoff → next session

**State Carried Forward:**
- AGENTS.md is the system documentation — it must reflect all changes made in tasks 1-4
- Specific items to document: task brief artifacts, .done.md lifecycle, handoff fields, session model

**Known Issues or Deferred Items:**
- None

---

## OBJECTIVE

Update `AGENTS.md` to document the task brief system. This is the primary system documentation file that's auto-loaded into every session. It must accurately reflect the new default planning mode, artifacts, handoff fields, and session model.

---

## SCOPE

**What This Task Delivers:**

AGENTS.md updated with task brief artifact documentation, .done.md lifecycle for task briefs, handoff field additions, and session model for task brief features.

**Files This Task Touches:**
- `AGENTS.md` — modify (4 sections updated)

**Dependencies:**
- Tasks 1-4 must complete first (all concepts being documented must already exist in the system)

**Out of Scope for This Task:**
- build.md changes (task 6)
- execution-report-template and planning-research changes (task 7)

---

## FILES TO READ BEFORE STARTING

- `AGENTS.md` (all 148 lines) — The file being modified. Read the ENTIRE file.
- `AGENTS.md` (lines 33-47) — Dynamic Content section with artifact listings
- `AGENTS.md` (lines 49-60) — .done.md Lifecycle table
- `AGENTS.md` (lines 62-76) — Pipeline Handoff File fields
- `AGENTS.md` (lines 78-108) — Session Model documentation

### Patterns to Follow

**Artifact listing pattern** — See `AGENTS.md:35-44`
- What to match: Indented bullet list with path pattern + description
- Gotcha: Task brief artifacts go between plan.md and plan-master.md lines

**Lifecycle table pattern** — See `AGENTS.md:51-60`
- What to match: Markdown table with Artifact | Created by | Marked .done.md by | Trigger columns
- Gotcha: New row for task-{N}.md needs all 4 columns filled correctly

**Session model pattern** — See `AGENTS.md:86-108`
- What to match: Code block showing session flow with comments
- Gotcha: Task brief model replaces single plan model as the first (default) example

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE Dynamic Content artifact list — `AGENTS.md`

- **IMPLEMENT**: Add `task-{N}.md` artifacts to the feature directory listing.

  **Current** (lines 35-38 of `AGENTS.md`):
  ```markdown
  - `.agents/features/{name}/` — All artifacts for one feature (plan, report, review, loop reports)
    - `plan.md` / `plan.done.md` — Feature plan (marked done after execution)
    - `plan-master.md` — Master plan for multi-phase features
    - `plan-phase-{N}.md` — Sub-plans for each phase (executed one per session, not sequentially)
  ```

  **Replace with:**
  ```markdown
  - `.agents/features/{name}/` — All artifacts for one feature (plan, report, review, loop reports)
    - `plan.md` / `plan.done.md` — Feature plan overview + task index (marked done when all tasks complete)
    - `task-{N}.md` / `task-{N}.done.md` — Self-contained task briefs (700-1000 lines each, executed one per session)
    - `plan-master.md` — Master plan for multi-phase features (exception — large features only)
    - `plan-phase-{N}.md` — Sub-plans for each phase (executed one per session, not sequentially)
  ```

- **PATTERN**: Same indented bullet format
- **IMPORTS**: N/A
- **GOTCHA**: The plan.md description changes from "Feature plan" to "Feature plan overview + task index" and the done trigger changes from "after execution" to "when all tasks complete". This reflects the new role of plan.md.
- **VALIDATE**: Read lines 35-39 and confirm task-{N}.md listed between plan.md and plan-master.md

### Step 2: UPDATE .done.md Lifecycle table — `AGENTS.md`

- **IMPLEMENT**: Add task-{N}.md row and update plan.md trigger description.

  **Current** (lines 51-60 of `AGENTS.md`):
  ```markdown
  | Artifact | Created by | Marked `.done.md` by | Trigger |
  |----------|-----------|---------------------|---------|
  | `plan.md` | `/planning` | `/execute` | All plan tasks completed |
  | `plan-master.md` | `/planning` | `/execute` | All phases completed |
  | `plan-phase-{N}.md` | `/planning` | `/execute` | Phase fully executed |
  | `report.md` | `/execute` | `/commit` | Changes committed to git |
  | `review.md` | `/code-review` | `/commit` or `/code-loop` | All findings addressed |
  | `review-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
  | `loop-report-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
  | `fixes-{N}.md` | `/code-loop` | `/code-loop` | Fixes fully applied |
  ```

  **Replace with:**
  ```markdown
  | Artifact | Created by | Marked `.done.md` by | Trigger |
  |----------|-----------|---------------------|---------|
  | `plan.md` | `/planning` | `/execute` | All task briefs completed (or legacy single plan executed) |
  | `task-{N}.md` | `/planning` | `/execute` | Task brief fully executed |
  | `plan-master.md` | `/planning` | `/execute` | All phases completed |
  | `plan-phase-{N}.md` | `/planning` | `/execute` | Phase fully executed |
  | `report.md` | `/execute` | `/commit` | Changes committed to git |
  | `review.md` | `/code-review` | `/commit` or `/code-loop` | All findings addressed |
  | `review-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
  | `loop-report-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
  | `fixes-{N}.md` | `/code-loop` | `/code-loop` | Fixes fully applied |
  ```

- **PATTERN**: Same table format, add row after plan.md
- **IMPORTS**: N/A
- **GOTCHA**: plan.md trigger updated to "All task briefs completed (or legacy single plan executed)" — covers both modes.
- **VALIDATE**: Read the lifecycle table and confirm task-{N}.md row present with correct columns

### Step 3: UPDATE Pipeline Handoff File fields — `AGENTS.md`

- **IMPLEMENT**: Add `Task Progress` field and `executing-tasks` status.

  **Current** (lines 66-74 of `AGENTS.md`):
  ```markdown
  | Field | Purpose |
  |-------|---------|
  | **Last Command** | Which command just completed |
  | **Feature** | Active feature name |
  | **Next Command** | Exact command to run next |
  | **Master Plan** | Path to master plan (if multi-phase) |
  | **Phase Progress** | N/M complete (if multi-phase) |
  | **Timestamp** | When handoff was written |
  | **Status** | Pipeline state (awaiting-execution, executing-series, awaiting-review, awaiting-fixes, awaiting-re-review, ready-to-commit, ready-for-pr, pr-open, blocked, build-loop-continuing) |
  ```

  **Replace with:**
  ```markdown
  | Field | Purpose |
  |-------|---------|
  | **Last Command** | Which command just completed |
  | **Feature** | Active feature name |
  | **Next Command** | Exact command to run next |
  | **Task Progress** | N/M complete (if task brief mode) |
  | **Master Plan** | Path to master plan (if multi-phase) |
  | **Phase Progress** | N/M complete (if multi-phase) |
  | **Timestamp** | When handoff was written |
  | **Status** | Pipeline state (awaiting-execution, executing-tasks, executing-series, awaiting-review, awaiting-fixes, awaiting-re-review, ready-to-commit, ready-for-pr, pr-open, blocked, build-loop-continuing) |
  ```

- **PATTERN**: Same table format, add row and extend Status enum
- **IMPORTS**: N/A
- **GOTCHA**: `Task Progress` uses the same `N/M complete` format as `Phase Progress`. The Status enum now includes `executing-tasks` (for task briefs) alongside `executing-series` (for master plan phases).
- **VALIDATE**: Read the handoff field table and confirm Task Progress row and executing-tasks in Status enum

### Step 4: UPDATE Session Model — `AGENTS.md`

- **IMPLEMENT**: Replace the single plan feature session model with task brief feature as the default, and add it as the first example.

  **Current** (lines 86-108 of `AGENTS.md`):
  ```markdown
  **Single plan feature:**
  ```
  Session 1:  /prime → /planning {feature}                         → END
  Session 2:  /prime → /execute .agents/features/{f}/plan.md       → END
  Session 3:  /prime → /code-loop {feature}                        → END
  Session 4:  /prime → /commit → /pr                               → END
  ```

  **Master plan feature (multi-phase):**
  ```
  Session 1:  /prime → /planning {feature}                         → END (master + sub-plans written)
  Session 2:  /prime → /execute .../plan-master.md                 → END (phase 1 only)
  Session 3:  /prime → /execute .../plan-master.md                 → END (phase 2 — auto-detected)
  Session 4:  /prime → /execute .../plan-master.md                 → END (phase N — auto-detected)
  Session 5:  /prime → /code-loop {feature}                        → END
  Session 6:  /prime → /commit → /pr                               → END
  ```

  **Key rules:**
  - `/execute` with a master plan executes ONE phase per session, never loops through all phases
  - The handoff file tells the next session exactly what to run — the user just runs `/prime`
  - Phase detection is automatic: `/execute plan-master.md` scans for `.done.md` files and picks the next undone phase
  - If a session crashes, the phase wasn't marked `.done.md`, so the next session retries it
  ```

  **Replace with:**
  ```markdown
  **Task brief feature (default):**
  ```
  Session 1:  /prime → /planning {feature}                         → END (plan.md + task-1.md ... task-N.md written)
  Session 2:  /prime → /execute .agents/features/{f}/plan.md       → END (task 1 only — auto-detected)
  Session 3:  /prime → /execute .agents/features/{f}/plan.md       → END (task 2 — auto-detected)
  Session N+1: /prime → /execute .agents/features/{f}/plan.md      → END (task N — auto-detected)
  Session N+2: /prime → /code-loop {feature}                       → END
  Session N+3: /prime → /commit → /pr                              → END
  ```

  **Master plan feature (multi-phase — exception for large features):**
  ```
  Session 1:  /prime → /planning {feature}                         → END (master + sub-plans written)
  Session 2:  /prime → /execute .../plan-master.md                 → END (phase 1 only)
  Session 3:  /prime → /execute .../plan-master.md                 → END (phase 2 — auto-detected)
  Session 4:  /prime → /execute .../plan-master.md                 → END (phase N — auto-detected)
  Session 5:  /prime → /code-loop {feature}                        → END
  Session 6:  /prime → /commit → /pr                               → END
  ```

  **Key rules:**
  - `/execute plan.md` with task briefs executes ONE task per session, never loops through all tasks
  - `/execute plan-master.md` executes ONE phase per session, never loops through all phases
  - The handoff file tells the next session exactly what to run — the user just runs `/prime`
  - Task/phase detection is automatic: scans for `.done.md` files and picks the next undone item
  - If a session crashes, the item wasn't marked `.done.md`, so the next session retries it
  ```

- **PATTERN**: Same code block format with session flow
- **IMPORTS**: N/A
- **GOTCHA**: The old "Single plan feature" is REPLACED by "Task brief feature (default)" — not kept alongside it. Legacy single plans (plan.md without task files) still work through the auto-detection fallback, but they don't need their own session model example since they're a legacy path.
- **GOTCHA**: Master plan heading gets "(exception for large features)" annotation to match the framing in planning.md.
- **VALIDATE**: Read the session model section and confirm: (1) task brief model is first/default, (2) single plan model removed, (3) master plan marked as exception, (4) key rules cover both task and phase detection

---

## TESTING

No tests required — this task modifies a system documentation file (markdown).

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```
# Verify markdown is well-formed (manual check)
# Verify all tables render correctly
```

### Level 2: Type Safety
```
N/A — markdown documentation file
```

### Level 3: Unit Tests
```
N/A — no code
```

### Level 4: Integration Tests
```
N/A — documentation correctness verified by reading
```

### Level 5: Manual Validation

Read the updated `AGENTS.md` and verify:
1. Dynamic Content section lists `task-{N}.md` / `task-{N}.done.md` with description
2. plan.md description updated to "overview + task index"
3. plan-master.md has "(exception — large features only)" annotation
4. .done.md lifecycle table has `task-{N}.md` row
5. plan.md trigger updated to mention "All task briefs completed"
6. Handoff field table has `Task Progress` row
7. Status enum includes `executing-tasks`
8. Session model shows task brief feature as first (default) example
9. Session model no longer shows "Single plan feature"
10. Master plan session model annotated as exception
11. Key rules cover both task and phase detection

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Dynamic Content lists task-{N}.md artifacts
- [ ] plan.md description updated to reflect overview + task index role
- [ ] .done.md lifecycle table includes task-{N}.md row
- [ ] Handoff field table includes Task Progress field
- [ ] Status enum includes executing-tasks
- [ ] Session model shows task brief feature as default
- [ ] Session model removes old single plan feature example
- [ ] Key rules cover both task and phase detection
- [ ] All validation commands pass

### Runtime (verify after testing/deployment)

- [ ] AGENTS.md accurately reflects the system state after all tasks are implemented
- [ ] No contradictions between AGENTS.md and the actual command behavior

---

## HANDOFF

### Files Created/Modified

- `AGENTS.md` — Updated artifact list, .done.md lifecycle, handoff fields, session model

### Patterns Established

- Task brief feature as the documented default session model
- Master plan as documented exception for large features
- `executing-tasks` status documented in handoff field table

### State to Carry Forward

- AGENTS.md now documents the complete task brief system
- Task 6 (build.md) needs to update plan mode detection to match
- Task 7 (templates + agents) needs minor updates for completeness

### Known Issues or Deferred Items

- None

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step validation passed
- [ ] All validation commands executed successfully
- [ ] Tests pass (N/A)
- [ ] No linting or type checking errors (N/A)
- [ ] Manual validation confirms all 11 checkpoints pass
- [ ] Acceptance criteria all met
- [ ] Handoff notes completed for next task
