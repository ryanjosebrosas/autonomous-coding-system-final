# Distilled Task Briefs — Task 4/7
<!-- Source: .agents/features/distilled-task-briefs/plan.md -->
<!-- Scope: Update prime.md — artifact scan detects task briefs + pending work display -->
<!-- Prior: task-1.md (template), task-2.md (planning.md), task-3.md (execute.md) -->

## PRIOR TASKS

**Files Changed in Prior Task(s):**
- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — Created task brief template (task 1)
- `.opencode/commands/planning.md` — Updated to produce task briefs as default (task 2)
- `.opencode/commands/execute.md` — Updated to auto-detect task briefs and execute one per session (task 3)

**Key Outcomes from Prior Task(s):**
- `/planning` now produces plan.md + task-N.md files by default
- `/execute` auto-detects task-N.md files in the feature directory
- `/execute` uses `executing-tasks` status and `Task Progress` field in handoff
- Handoff Next Command points to `plan.md` (auto-detection finds the next undone task)

**State Carried Forward:**
- `/prime` must now detect the new `executing-tasks` status and `Task Progress` field in next-command.md
- `/prime` must detect `task-{N}.md` / `task-{N}.done.md` files in the artifact scan

**Known Issues or Deferred Items:**
- None

---

## OBJECTIVE

Update `.opencode/commands/prime.md` so that it correctly detects and displays task brief progress. This means: (1) Source 1 (handoff file) recognizes the new `Task Progress` field and `executing-tasks` status, (2) Source 2 (artifact scan) detects `task-{N}.md` files alongside plan.md, and (3) the Pending Work display shows a `[tasks]` line for task brief features.

---

## SCOPE

**What This Task Delivers:**

Prime command updated with task brief detection in Step 3.5 (both sources) and pending work display in both System Mode and Codebase Mode.

**Files This Task Touches:**
- `.opencode/commands/prime.md` — modify (3 sections updated)

**Dependencies:**
- Task 3 must complete first (execute.md must write the handoff that prime.md reads)

**Out of Scope for This Task:**
- AGENTS.md changes (task 5)
- build.md changes (task 6)

---

## FILES TO READ BEFORE STARTING

- `.opencode/commands/prime.md` (all 296 lines) — The file being modified. Read the ENTIRE file.
- `.opencode/commands/prime.md` (lines 175-206) — Step 3.5 pending work detection. The core logic being extended.
- `.opencode/commands/prime.md` (lines 228-236) — System Mode pending work display.
- `.opencode/commands/prime.md` (lines 280-288) — Codebase Mode pending work display.

### Patterns to Follow

**Handoff field extraction pattern** — See `prime.md:179-187`
- What to match: Extract named fields from next-command.md including new `Task Progress` field
- Gotcha: `Task Progress` uses the same `N/M complete` format as `Phase Progress`

**Artifact scan detection pattern** — See `prime.md:192-198`
- What to match: Sequential checks for artifact files in feature directories
- Gotcha: Task brief detection must check for plan.md + task-*.md files (not just plan.md alone)

**Pending work display pattern** — See `prime.md:229-236`
- What to match: Bracketed tag + feature name + status + next command format
- Gotcha: Display appears in BOTH System Mode and Codebase Mode (duplicated sections)

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE Source 1 — Handoff file extraction — `.opencode/commands/prime.md`

- **IMPLEMENT**: Add `Task Progress` to the list of fields extracted from next-command.md.

  **Current** (lines 179-187 of `prime.md`):
  ```markdown
  ### Source 1: Handoff file

  Read `.agents/context/next-command.md` if it exists. Extract:
  - **Last Command**: the command that last ran
  - **Feature**: the active feature name
  - **Next Command**: what should run next
  - **Status**: pipeline state
  - **Master Plan** and **Phase Progress** (if present): multi-phase tracking

  If the file does not exist or is empty, skip to Source 2.
  ```

  **Replace with:**
  ```markdown
  ### Source 1: Handoff file

  Read `.agents/context/next-command.md` if it exists. Extract:
  - **Last Command**: the command that last ran
  - **Feature**: the active feature name
  - **Next Command**: what should run next
  - **Status**: pipeline state
  - **Task Progress** (if present): task brief tracking (format: `N/M complete`)
  - **Master Plan** and **Phase Progress** (if present): multi-phase tracking

  If the file does not exist or is empty, skip to Source 2.
  ```

- **PATTERN**: Same list format, add Task Progress before Master Plan
- **IMPORTS**: N/A
- **GOTCHA**: `Task Progress` and `Phase Progress` use the same `N/M complete` format. The Status field distinguishes them: `executing-tasks` vs `executing-series`.
- **VALIDATE**: Read lines 179-189 and confirm Task Progress field documented

### Step 2: UPDATE Source 2 — Artifact scan — `.opencode/commands/prime.md`

- **IMPLEMENT**: Add task brief detection between the plan.md check and the master plan check.

  **Current** (lines 192-198 of `prime.md`):
  ```markdown
  Scan `.agents/features/*/` for non-`.done.md` artifacts. For each feature directory:

  1. If `plan.md` exists AND `plan.done.md` does NOT exist → **plan awaiting execution**
  2. If `plan-master.md` exists AND `plan-master.done.md` does NOT exist → check which `plan-phase-{N}.done.md` files exist to determine current phase → **master plan in progress (phase X/Y)**
  3. If `report.md` exists AND `report.done.md` does NOT exist → **report awaiting commit**
  4. If `review.md` exists AND `review.done.md` does NOT exist → **review with open findings**
  5. If `review-{N}.md` exists (any N) without matching `.done.md` → **code-loop review in progress**
  ```

  **Replace with:**
  ```markdown
  Scan `.agents/features/*/` for non-`.done.md` artifacts. For each feature directory:

  1. If `plan.md` exists AND `plan.done.md` does NOT exist AND `task-*.md` files exist (excluding `task-*.done.md`) → check which `task-{N}.done.md` files exist to determine current task → **task briefs in progress (task X/Y)**
  2. If `plan.md` exists AND `plan.done.md` does NOT exist AND NO `task-*.md` files exist → **legacy plan awaiting execution**
  3. If `plan-master.md` exists AND `plan-master.done.md` does NOT exist → check which `plan-phase-{N}.done.md` files exist to determine current phase → **master plan in progress (phase X/Y)**
  4. If `report.md` exists AND `report.done.md` does NOT exist → **report awaiting commit**
  5. If `review.md` exists AND `review.done.md` does NOT exist → **review with open findings**
  6. If `review-{N}.md` exists (any N) without matching `.done.md` → **code-loop review in progress**
  ```

- **PATTERN**: Same numbered list format, split item 1 into two cases (task briefs vs legacy)
- **IMPORTS**: N/A
- **GOTCHA**: The check order matters. Task brief detection (item 1) must come BEFORE legacy plan detection (item 2) because both check for `plan.md`. The distinguishing factor is whether `task-*.md` files exist.
- **GOTCHA**: When counting task progress, scan for `task-{N}.md` (undone) and `task-{N}.done.md` (done). Total = done + undone. Current = done count.
- **VALIDATE**: Read the updated artifact scan and confirm: (1) task briefs detected before legacy plan, (2) distinguishing factor is presence of task-*.md files, (3) numbering updated to 1-6

### Step 3: UPDATE Pending Work Display — System Mode — `.opencode/commands/prime.md`

- **IMPLEMENT**: Add `[tasks]` display line for task brief features.

  **Current** (lines 228-236 of `prime.md`):
  ```markdown
  ## Pending Work
  {If pending work found in Step 3.5:
  - **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
  - **[plan]** {feature} — plan awaiting execution: /execute .agents/features/{feature}/plan.md
  - **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-phase-{N+1}.md
  - **[report]** {feature} — execution done, awaiting commit: /commit
  - **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
  (Show only lines that apply. Handoff line first if present.)
  Otherwise: "No pending work found."}
  ```

  **Replace with:**
  ```markdown
  ## Pending Work
  {If pending work found in Step 3.5:
  - **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
  - **[tasks]** {feature} — task {N}/{total} done, next: /execute .agents/features/{feature}/plan.md
  - **[plan]** {feature} — plan awaiting execution: /execute .agents/features/{feature}/plan.md
  - **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-master.md
  - **[report]** {feature} — execution done, awaiting commit: /commit
  - **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
  (Show only lines that apply. Handoff line first if present.)
  Otherwise: "No pending work found."}
  ```

- **PATTERN**: Same display format, add `[tasks]` line between `[handoff]` and `[plan]`
- **IMPORTS**: N/A
- **GOTCHA**: The `[tasks]` next command points to `plan.md` (not `task-{N+1}.md`) because `/execute` auto-detects the next undone task from plan.md.
- **GOTCHA**: Also fixed `[master]` line — was pointing to `plan-phase-{N+1}.md` which is wrong. Master plan execution goes through `plan-master.md` (auto-detection). Updated to point to `plan-master.md`.
- **VALIDATE**: Read the System Mode pending work display and confirm `[tasks]` line present with correct format

### Step 4: UPDATE Pending Work Display — Codebase Mode — `.opencode/commands/prime.md`

- **IMPLEMENT**: Same change as Step 3, but in the Codebase Mode section.

  **Current** (lines 280-288 of `prime.md`):
  ```markdown
  ## Pending Work
  {If pending work found in Step 3.5:
  - **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
  - **[plan]** {feature} — plan awaiting execution: /execute .agents/features/{feature}/plan.md
  - **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-phase-{N+1}.md
  - **[report]** {feature} — execution done, awaiting commit: /commit
  - **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
  (Show only lines that apply. Handoff line first if present.)
  Otherwise: "No pending work found."}
  ```

  **Replace with:**
  ```markdown
  ## Pending Work
  {If pending work found in Step 3.5:
  - **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
  - **[tasks]** {feature} — task {N}/{total} done, next: /execute .agents/features/{feature}/plan.md
  - **[plan]** {feature} — plan awaiting execution: /execute .agents/features/{feature}/plan.md
  - **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-master.md
  - **[report]** {feature} — execution done, awaiting commit: /commit
  - **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
  (Show only lines that apply. Handoff line first if present.)
  Otherwise: "No pending work found."}
  ```

- **PATTERN**: Exact same change as Step 3 — these two sections are duplicated
- **IMPORTS**: N/A
- **GOTCHA**: These sections MUST stay in sync. If you change one, change both.
- **VALIDATE**: Read the Codebase Mode pending work display and confirm it matches the System Mode display exactly

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
N/A — command correctness verified when /prime runs in a later session
```

### Level 5: Manual Validation

Read the updated `.opencode/commands/prime.md` and verify:
1. Source 1 extracts `Task Progress` field from handoff file
2. Source 2 artifact scan detects task briefs (plan.md + task-*.md) as item 1
3. Source 2 distinguishes task briefs from legacy single plan (presence of task-*.md files)
4. Source 2 numbering is 1-6 (was 1-5)
5. System Mode Pending Work has `[tasks]` display line
6. Codebase Mode Pending Work has `[tasks]` display line
7. Both `[tasks]` lines point to plan.md (not task-{N+1}.md)
8. Both `[master]` lines point to plan-master.md (not plan-phase-{N+1}.md)
9. System Mode and Codebase Mode Pending Work sections are in sync

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Source 1 extracts Task Progress field
- [ ] Source 2 artifact scan detects task briefs as first check
- [ ] Source 2 distinguishes task briefs from legacy plan by presence of task-*.md files
- [ ] System Mode has [tasks] display line with correct format
- [ ] Codebase Mode has [tasks] display line matching System Mode
- [ ] Both [master] lines fixed to point to plan-master.md
- [ ] All validation commands pass with zero errors

### Runtime (verify after testing/deployment)

- [ ] `/prime` correctly shows task progress when task briefs are in progress
- [ ] `/prime` correctly shows legacy plan state when no task briefs exist
- [ ] No regressions in master plan or report/review detection

---

## HANDOFF

### Files Created/Modified

- `.opencode/commands/prime.md` — Updated Step 3.5 (Source 1 + Source 2) and Pending Work display in both modes

### Patterns Established

- Task brief artifact detection: plan.md + task-*.md files = task brief mode
- `[tasks]` display tag for task brief features
- Task Progress field in handoff file recognized by prime

### State to Carry Forward

- prime.md now detects and displays task brief progress
- Task 5 (AGENTS.md) must document the `executing-tasks` status and `Task Progress` handoff field
- Task 5 must add `task-{N}.md` to the artifact table and session model

### Known Issues or Deferred Items

- The System Mode and Codebase Mode pending work displays are duplicated code — could be refactored into a shared section, but that's a separate improvement

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step validation passed
- [ ] All validation commands executed successfully
- [ ] Tests pass (N/A)
- [ ] No linting or type checking errors (N/A)
- [ ] Manual validation confirms all 9 checkpoints pass
- [ ] Acceptance criteria all met
- [ ] Handoff notes completed for next task
