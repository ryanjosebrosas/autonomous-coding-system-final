# Distilled Task Briefs — Task 3/7
<!-- Source: .agents/features/distilled-task-briefs/plan.md -->
<!-- Scope: Update execute.md — auto-detect task briefs + one-per-session execution + completion logic -->
<!-- Prior: task-1.md (template created), task-2.md (planning.md updated) -->

## PRIOR TASKS

**Files Changed in Prior Task(s):**
- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — Created task brief template (task 1)
- `.opencode/commands/planning.md` — Updated to produce task briefs as default output mode (task 2)

**Key Outcomes from Prior Task(s):**
- `/planning` now produces `plan.md` + `task-N.md` files by default
- plan.md contains a TASK INDEX table mapping task numbers to brief files
- Pipeline handoff from `/planning` uses `Task Progress` field and points to `plan.md`
- Master plan mode preserved as exception for very large features

**State Carried Forward:**
- `/execute` receives `plan.md` as input (same as before)
- It must detect task-N.md files in the same directory and execute one per session
- The task brief format follows TASK-BRIEF-TEMPLATE.md (10 sections)

**Known Issues or Deferred Items:**
- None

---

## OBJECTIVE

Update `.opencode/commands/execute.md` to auto-detect task brief files when executing a `plan.md`. When task-N.md files exist alongside plan.md, `/execute` enters "task brief mode" — it finds the next undone task brief, executes it, and writes a handoff for the next session. This mirrors the existing master plan phase detection pattern exactly.

---

## SCOPE

**What This Task Delivers:**

Execute command updated with task brief auto-detection in Step 0.5, task completion logic as Step 2.6, updated completion sweep in Step 6.6, and updated handoff in Step 6.7.

**Files This Task Touches:**
- `.opencode/commands/execute.md` — modify (5 sections updated)

**Dependencies:**
- Task 2 must complete first (planning.md must produce task briefs for execute to consume)

**Out of Scope for This Task:**
- prime.md changes (task 4)
- AGENTS.md changes (task 5)
- build.md changes (task 6)

---

## FILES TO READ BEFORE STARTING

- `.opencode/commands/execute.md` (all 387 lines) — The file being modified. Read the ENTIRE file.
- `.opencode/commands/execute.md` (lines 40-58) — Step 0.5 plan type detection. The core routing logic being extended.
- `.opencode/commands/execute.md` (lines 129-168) — Step 2.5 phase completion. The pattern to mirror for task completion.
- `.opencode/commands/execute.md` (lines 293-301) — Step 6.6 completion sweep. Add task-N.md rename rules.
- `.opencode/commands/execute.md` (lines 303-318) — Step 6.7 handoff. Add task brief mode handoff reference.

### Patterns to Follow

**Master plan phase detection pattern** — See `execute.md:44-52`
- What to match: Scan for files in feature directory, find next undone, execute one per session
- Gotcha: Must handle the legacy case — plan.md without task files should fall through to old behavior

**Phase completion handoff pattern** — See `execute.md:135-148`
- What to match: Write handoff with progress count, point back to main plan file, end session
- Gotcha: Use `executing-tasks` status (new) instead of `executing-series`

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE Step 0.5 — Add task brief detection — `.opencode/commands/execute.md`

- **IMPLEMENT**: Add a new detection path in Step 0.5 for task briefs. Insert it BEFORE the "If no marker" fallback (current line 58) so that plan.md files with task briefs are caught before falling through to legacy single plan mode.

  The new detection works as follows:
  1. When `/execute` receives a `plan.md` (not `plan-master.md`, not a phase file, no PLAN-SERIES marker)
  2. Scan the same directory for `task-*.md` files (excluding `task-*.done.md`)
  3. If task files exist → this is task brief mode
  4. If NO task files exist → legacy single plan mode (fall through to existing behavior)

  **Current** (lines 56-58 of `execute.md`):
  ```markdown
  **If file contains `<!-- PLAN-SERIES -->`**: Treat as master plan — extract sub-plan paths from PLAN INDEX and apply the same one-phase-per-session logic above.

  **If no marker**: Standard single plan — proceed normally, skip Step 2.5 entirely.
  ```

  **Replace with:**
  ```markdown
  **If file contains `<!-- PLAN-SERIES -->`**: Treat as master plan — extract sub-plan paths from PLAN INDEX and apply the same one-phase-per-session logic above.

  **If file is `plan.md` (not master, not phase, no PLAN-SERIES marker)**: Check for task briefs in the same directory:
  1. Scan `.agents/features/{feature}/` for `task-*.md` files (excluding `task-*.done.md`)
  2. If task brief files found → this is **task brief mode**. Execute ONE task per session:
     a. Count total task briefs (files matching `task-{N}.md` pattern)
     b. Scan for `task-{N}.done.md` files to determine which tasks are complete
     c. Identify the next undone task (lowest N without a matching `.done.md`)
     d. **If ALL tasks are done** → report "All {total} tasks complete. Feature ready for `/code-loop {feature}`." Write handoff with **Status** `awaiting-review` and **Next Command** `/code-loop {feature}`. Rename `plan.md` → `plan.done.md`. **Stop — do not execute anything.**
     e. **If a next task exists** → report "Task brief mode: task {N}/{total}. Executing task-{N}.md in this session."
        - Read `plan.md`'s TASK INDEX table for overview context (lightweight — just the table, not the full plan)
        - If a previous task exists (`task-{N-1}.done.md`), read its HANDOFF section for continuity context
        - Proceed to execute ONLY `task-{N}.md` as the plan for this session (Step 1 onward). After execution completes, proceed to Step 2.6 for task completion.
  3. If NO task brief files found → **legacy single plan** — proceed normally, skip Step 2.5 and Step 2.6 entirely.
  ```

- **PATTERN**: Mirror `execute.md:44-52` (master plan detection) exactly in structure
- **IMPORTS**: N/A
- **GOTCHA**: The scan MUST exclude `.done.md` files. Pattern: match `task-*.md` but not `task-*.done.md`. A task brief like `task-3.done.md` is complete, not pending.
- **GOTCHA**: Reading the TASK INDEX table from plan.md is lightweight context (5-10 lines) — the executor does NOT read the full plan.md. This is the key context savings.
- **VALIDATE**: Read the updated Step 0.5 and verify: (1) task brief detection comes after PLAN-SERIES and before legacy fallback, (2) scan logic documented, (3) all-done case handled, (4) next-task case handled with handoff reference

### Step 2: UPDATE Step 1 — Clarify what "read the plan" means — `.opencode/commands/execute.md`

- **IMPLEMENT**: Add a note to Step 1 clarifying that in task brief mode, "the plan" means the task brief, not plan.md.

  **Current** (lines 60-66 of `execute.md`):
  ```markdown
  ### 1. Read and Understand

  - Read the ENTIRE plan carefully — all tasks, dependencies, validation commands, testing strategy
  - Check `memory.md` for gotchas related to this feature area
  - **Derive feature name** from the plan path: extract the feature directory name from `.agents/features/{feature}/`.
      Example: `.agents/features/user-auth/plan.md` → `user-auth`. For plan series: `.agents/features/big-feature/plan-master.md` → `big-feature`.
      Store this — you'll use it for all artifact paths within `.agents/features/{feature}/`.
  ```

  **Replace with:**
  ```markdown
  ### 1. Read and Understand

  - Read the ENTIRE plan carefully — all tasks, dependencies, validation commands, testing strategy
    - **Task brief mode**: "The plan" is the task brief (`task-{N}.md`), NOT `plan.md`. The brief is self-contained at 700-1000 lines. You already read the TASK INDEX from plan.md in Step 0.5 for overview context.
    - **Master plan mode**: "The plan" is the phase sub-plan (`plan-phase-{N}.md`) plus shared context from the master plan.
    - **Legacy single plan**: "The plan" is `plan.md` itself.
  - Check `memory.md` for gotchas related to this feature area
  - **Derive feature name** from the plan path: extract the feature directory name from `.agents/features/{feature}/`.
      Example: `.agents/features/user-auth/plan.md` → `user-auth`. For task briefs: `.agents/features/user-auth/task-3.md` → `user-auth`. For plan series: `.agents/features/big-feature/plan-master.md` → `big-feature`.
      Store this — you'll use it for all artifact paths within `.agents/features/{feature}/`.
  ```

- **PATTERN**: Same section, adds clarifying bullet points
- **IMPORTS**: N/A
- **GOTCHA**: The key insight is that in task brief mode, the executor loads ~700-1000 lines (the brief) instead of the full plan.md. This is the whole point of the feature — context savings.
- **VALIDATE**: Read the updated Step 1 and confirm task brief mode clarification is present with the feature name derivation example

### Step 3: ADD Step 2.6 — Task Completion — `.opencode/commands/execute.md`

- **IMPLEMENT**: Add a new Step 2.6 section after Step 2.5 (Phase Completion). This handles task brief completion — the analog of Step 2.5 for master plan phases.

  Insert AFTER the current Step 2.5 section (after line 168). The new section:

  ```markdown
  ### 2.6. Task Completion (for task brief mode)

  After executing a single task brief (routed here from Step 0.5), complete the task:

  1. Let the existing completion sweep (Step 6.6) handle renaming `task-{N}.md` → `task-{N}.done.md`
  2. Determine task progress: count `task-{N}.done.md` files vs total task briefs in the directory
  3. **If more tasks remain** — write handoff:
     ```markdown
     # Pipeline Handoff
     <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

     - **Last Command**: /execute (task {N} of {total})
     - **Feature**: {feature}
     - **Next Command**: /execute .agents/features/{feature}/plan.md
     - **Task Progress**: {N}/{total} complete
     - **Timestamp**: {ISO 8601 timestamp}
     - **Status**: executing-tasks
     ```
     Report: "Task {N}/{total} complete. Next session: `/prime` → `/execute .agents/features/{feature}/plan.md` to continue with task {N+1}."
     **End session.** Do NOT continue to the next task — each task gets a fresh context window.

  4. **If ALL tasks done** — rename `plan.md` → `plan.done.md`. Write handoff:
     ```markdown
     # Pipeline Handoff
     <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

     - **Last Command**: /execute (task {total} of {total})
     - **Feature**: {feature}
     - **Next Command**: /code-loop {feature}
     - **Task Progress**: {total}/{total} complete
     - **Timestamp**: {ISO 8601 timestamp}
     - **Status**: awaiting-review
     ```
     Report: "All {total} tasks complete. Feature ready for review. Next session: `/prime` → `/code-loop {feature}`."

  5. **If task execution failed** — do NOT rename the task file (no `.done.md`). Write handoff with **Status**: `blocked` and **Next Command**: `[manual intervention — task {N} failed]`. Report the failure and stop.

  **Key rule**: `/execute` in task brief mode ALWAYS executes exactly one task per session. The next session picks up the next task via `/prime` → handoff file. This prevents context compaction.
  ```

- **PATTERN**: Mirror `execute.md:129-168` (Step 2.5 Phase Completion) exactly in structure
- **IMPORTS**: N/A
- **GOTCHA**: The handoff Next Command points to `plan.md` (not to `task-{N+1}.md`). This matches the master plan pattern where Next Command points to `plan-master.md`. The auto-detection logic in Step 0.5 handles finding the next undone task.
- **GOTCHA**: `plan.md` only gets renamed to `plan.done.md` when ALL tasks are complete — never after a single task. Same as `plan-master.md` only gets renamed when all phases are done.
- **VALIDATE**: Read the new Step 2.6 and verify: (1) mirrors Step 2.5 structure, (2) handoff uses `executing-tasks` status, (3) plan.md renamed only when all tasks done, (4) failed case handled

### Step 4: UPDATE Step 6.6 — Completion sweep — `.opencode/commands/execute.md`

- **IMPLEMENT**: Add task brief rename rules to the completion sweep.

  **Current** (lines 293-301 of `execute.md`):
  ```markdown
  Completion sweep (required):
  - Before finishing `/execute`, rename completed artifacts within `.agents/features/{feature}/`:
    - `plan.md` → `plan.done.md` (plan fully executed)
    - `plan-phase-{N}.md` → `plan-phase-{N}.done.md` (for each completed phase)
    - `plan-master.md` → `plan-master.done.md` (only when ALL phases are done)
    - `review.md` → `review.done.md` (if a review exists and all findings were addressed)
    - `review-{N}.md` → `review-{N}.done.md` (code-loop reviews)
    - `loop-report-{N}.md` → `loop-report-{N}.done.md` (code-loop reports)
  - Never leave a completed artifact without the `.done.md` suffix.
  ```

  **Replace with:**
  ```markdown
  Completion sweep (required):
  - Before finishing `/execute`, rename completed artifacts within `.agents/features/{feature}/`:
    - `task-{N}.md` → `task-{N}.done.md` (for each completed task brief)
    - `plan.md` → `plan.done.md` (only when ALL task briefs are done, OR legacy single plan fully executed)
    - `plan-phase-{N}.md` → `plan-phase-{N}.done.md` (for each completed phase)
    - `plan-master.md` → `plan-master.done.md` (only when ALL phases are done)
    - `review.md` → `review.done.md` (if a review exists and all findings were addressed)
    - `review-{N}.md` → `review-{N}.done.md` (code-loop reviews)
    - `loop-report-{N}.md` → `loop-report-{N}.done.md` (code-loop reports)
  - Never leave a completed artifact without the `.done.md` suffix.
  ```

- **PATTERN**: Same list format, add task brief rule at the top
- **IMPORTS**: N/A
- **GOTCHA**: `task-{N}.md` rename comes FIRST in the list (before plan.md) because plan.md depends on whether all tasks are done. The `plan.md` rule now has a qualifier: "only when ALL task briefs are done" — same pattern as plan-master.md with phases.
- **VALIDATE**: Read the updated completion sweep and verify task-{N}.md rule present and plan.md rule has the ALL tasks qualifier

### Step 5: UPDATE Step 6.7 — Pipeline Handoff reference — `.opencode/commands/execute.md`

- **IMPLEMENT**: Add task brief mode reference to the handoff note at the end of Step 6.7.

  **Current** (line 318 of `execute.md`):
  ```markdown
  If execution was part of a master plan and this was the LAST phase, use the same format above (awaiting-review). If more phases remain, the series mode handoff (Step 2.5, item 7) already handled it.
  ```

  **Replace with:**
  ```markdown
  If execution was part of a master plan and this was the LAST phase, use the same format above (awaiting-review). If more phases remain, the series mode handoff (Step 2.5) already handled it. If execution was part of a task brief set, the task completion handoff (Step 2.6) already handled it.
  ```

- **PATTERN**: Same line, just extending the conditional note
- **IMPORTS**: N/A
- **GOTCHA**: Simple reference addition — don't overthink
- **VALIDATE**: Read line 318 and confirm Step 2.6 reference added

### Step 6: UPDATE Step 5 Self-Review — `.opencode/commands/execute.md`

- **IMPLEMENT**: Add task brief mode note to the Series Mode note in Step 5.

  **Current** (line 259 of `execute.md`):
  ```markdown
  **Series Mode note:** In Master + Sub-Plan execution, run this self-review after EACH phase sub-plan, not just at the end. Each phase gets its own summary. The final phase summary covers the whole feature.
  ```

  **Replace with:**
  ```markdown
  **Series/Task Mode note:** In Master + Sub-Plan execution, run this self-review after EACH phase sub-plan. In Task Brief execution, run this self-review after EACH task brief. Each task/phase gets its own summary. The final task/phase summary covers the whole feature.
  ```

- **PATTERN**: Same line, extending the note
- **IMPORTS**: N/A
- **GOTCHA**: Minor clarification — task briefs each get their own self-review (they're independent sessions)
- **VALIDATE**: Read line 259 and confirm task brief note added

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
N/A — command correctness verified when /execute runs in a later session
```

### Level 5: Manual Validation

Read the updated `.opencode/commands/execute.md` and verify:
1. Step 0.5 has 5 detection paths: master plan, phase file, PLAN-SERIES, task brief mode (NEW), legacy single plan
2. Task brief detection: scans for task-*.md files, excludes .done.md, finds next undone
3. Step 1 clarifies "the plan" = task brief in task brief mode
4. Step 2.6 exists with task completion logic mirroring Step 2.5
5. Step 2.6 handoff uses `executing-tasks` status and points back to `plan.md`
6. Step 2.6 only renames plan.md to plan.done.md when ALL tasks are done
7. Step 5 series/task mode note covers both modes
8. Step 6.6 completion sweep includes `task-{N}.md` → `task-{N}.done.md` rule
9. Step 6.6 plan.md rename has "only when ALL task briefs are done" qualifier
10. Step 6.7 references Step 2.6 for task brief handoff

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Step 0.5 has task brief detection path (between PLAN-SERIES and legacy fallback)
- [ ] Task brief detection scans for task-*.md files excluding .done.md
- [ ] All-tasks-done case handled (rename plan.md, write awaiting-review handoff)
- [ ] Next-task case handled (execute one, write executing-tasks handoff)
- [ ] Step 1 clarifies "the plan" = task brief in task brief mode
- [ ] Step 2.6 (Task Completion) section added mirroring Step 2.5
- [ ] Step 6.6 includes task-{N}.md rename rule
- [ ] Step 6.6 plan.md rename qualified with "only when ALL task briefs are done"
- [ ] Step 6.7 references Step 2.6
- [ ] All validation commands pass with zero errors

### Runtime (verify after testing/deployment)

- [ ] `/execute plan.md` with task briefs auto-detects and runs one task per session
- [ ] `/execute plan.md` without task briefs falls through to legacy single plan mode
- [ ] Handoff correctly written after task execution
- [ ] plan.md only renamed to .done.md when all tasks complete

---

## HANDOFF

### Files Created/Modified

- `.opencode/commands/execute.md` — Updated Step 0.5, Step 1, added Step 2.6, updated Step 5, Step 6.6, Step 6.7 for task brief auto-detection and one-per-session execution

### Patterns Established

- Task brief detection: scan feature directory for `task-*.md` excluding `.done.md`
- Task completion handoff: `executing-tasks` status, Next Command points to `plan.md`
- plan.md → plan.done.md only when ALL task briefs complete
- Step 2.6 structure mirrors Step 2.5 exactly

### State to Carry Forward

- execute.md now handles task briefs alongside master plans and legacy single plans
- Task 4 (prime.md) must detect `executing-tasks` status and `Task Progress` field in handoff
- Task 4 (prime.md) must detect `task-{N}.md` / `task-{N}.done.md` files in artifact scan
- Task 5 (AGENTS.md) must document `executing-tasks` status and task brief artifacts

### Known Issues or Deferred Items

- None

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
