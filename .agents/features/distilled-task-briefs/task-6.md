# Distilled Task Briefs — Task 6/7
<!-- Source: .agents/features/distilled-task-briefs/plan.md -->
<!-- Scope: Update build.md — plan mode detection + stale path fixes -->
<!-- Prior: task-1 through task-5 (all core system files updated) -->

## PRIOR TASKS

**Files Changed in Prior Task(s):**
- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — Created (task 1)
- `.opencode/commands/planning.md` — Task brief mode as default (task 2)
- `.opencode/commands/execute.md` — Auto-detect + Step 2.6 (task 3)
- `.opencode/commands/prime.md` — Artifact scan + display (task 4)
- `AGENTS.md` — Full documentation update (task 5)

**Key Outcomes from Prior Task(s):**
- Complete task brief system is operational in all core commands
- Task brief mode is documented as the default in AGENTS.md
- Master plan mode is annotated as exception throughout

**State Carried Forward:**
- build.md still references the old "Single Plan Mode" and "Master + Sub-Plan Mode" framing
- build.md has stale paths using `.agents/plans/{spec-name}.md` format (pre-migration)
- These need updating for consistency with the rest of the system

**Known Issues or Deferred Items:**
- build.md has at least 8 stale path references that need fixing

---

## OBJECTIVE

Update `.opencode/commands/build.md` to make task briefs the default plan mode (matching planning.md) and fix all stale `.agents/plans/` path references to use the current `.agents/features/{feature}/` format.

---

## SCOPE

**What This Task Delivers:**

Build command updated with task brief mode as default plan mode, and all stale path references fixed.

**Files This Task Touches:**
- `.opencode/commands/build.md` — modify (4 sections + stale path fixes)

**Dependencies:**
- Tasks 2-5 must complete first (framing established in planning.md and AGENTS.md)

**Out of Scope for This Task:**
- Stale paths in `.opencode/reference/` files (separate cleanup task, not part of this feature)
- Stale paths in `.opencode/sections/` files (separate cleanup)

---

## FILES TO READ BEFORE STARTING

- `.opencode/commands/build.md` (all 628 lines) — The file being modified. Read the ENTIRE file.
- `.opencode/commands/build.md` (lines 125-185) — Step 2: Plan. Key section for plan mode detection.
- `.opencode/commands/build.md` (lines 243-259) — Step 4: Commit Plan. Stale git add paths.
- `.opencode/commands/build.md` (lines 263-283) — Step 5: Execute. Stale execute paths.

### Patterns to Follow

**Plan mode detection pattern** — See `planning.md` Phase 5 (updated in task 2)
- What to match: Task briefs as DEFAULT, master plans as EXCEPTION
- Gotcha: build.md has its own mode detection that must match planning.md's logic

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE Step 2 Plan Mode Detection — `.opencode/commands/build.md`

- **IMPLEMENT**: Replace the plan mode detection to make task briefs the default.

  **Current** (lines 145-148 of `build.md`):
  ```markdown
  3. **Detect plan mode:**
     - **Single Plan Mode** (DEFAULT — 90%+ of specs): Use when spec has <10 estimated tasks OR touches <5 files OR is marked "light"/"standard"
     - **Master + Sub-Plan Mode** (EXCEPTION — rare, heavy specs): Use when spec has >=10 estimated tasks OR touches >=5 files OR is marked "heavy"
     - When in doubt: default to Single Plan Mode
  ```

  **Replace with:**
  ```markdown
  3. **Detect plan mode:**
     - **Task Brief Mode** (DEFAULT — most specs): Produces `plan.md` (overview + task index) plus `task-1.md` through `task-N.md` (one per unit of work, 700-1000 lines each). Use for all features unless they require the master plan approach.
     - **Master + Sub-Plan Mode** (EXCEPTION — very large, heavy specs): Produces `plan-master.md` + `plan-phase-N.md`. Use only when spec has 10+ tasks AND multiple distinct phases with heavy cross-cutting concerns.
     - When in doubt: default to Task Brief Mode
  ```

- **PATTERN**: Same numbered list structure
- **IMPORTS**: N/A
- **GOTCHA**: The old conditions (<10 tasks, <5 files) are removed — task brief mode works for any feature size. The splitting into briefs is by judgment, not by task count thresholds.
- **VALIDATE**: Read lines 145-149 and confirm task brief mode is the default with correct description

### Step 2: FIX Step 2 — Plan save path — `.opencode/commands/build.md`

- **IMPLEMENT**: Fix the stale save path and update for task brief mode. Note: The exact line numbers may vary since build.md is 628 lines. Search for `.agents/plans/` to find all stale references.

  Find and replace all occurrences of `.agents/plans/{spec-name}.md` with the correct paths.

  **Stale pattern 1** — Single plan save path (around line 172):
  ```
  - Save to: `.agents/plans/{spec-name}.md`
  ```
  **Replace with:**
  ```
  - Save to: `.agents/features/{feature}/plan.md` + `.agents/features/{feature}/task-{N}.md`
  ```

  **Stale pattern 2** — Master plan save path (around line 184):
  ```
  - Save to: `.agents/plans/{spec-name}-master.md` + `.agents/plans/{spec-name}-phase-*.md`
  ```
  **Replace with:**
  ```
  - Save to: `.agents/features/{feature}/plan-master.md` + `.agents/features/{feature}/plan-phase-{N}.md`
  ```

- **PATTERN**: N/A — fixing stale paths
- **IMPORTS**: N/A
- **GOTCHA**: build.md has MANY stale `.agents/plans/` references. Search the entire file and fix ALL of them — don't just fix the two listed here. Use `replaceAll` if the path pattern is consistent.
- **VALIDATE**: Grep the updated file for `.agents/plans/` — should return ZERO matches

### Step 3: FIX Step 4 — Commit Plan git paths — `.opencode/commands/build.md`

- **IMPLEMENT**: Fix the stale git add paths in the commit step.

  **Stale pattern** (around lines 249-255):
  ```markdown
  #### Single Plan Mode
  ```bash
  git add .agents/plans/{spec-name}.md
  ```

  #### Master + Sub-Plan Mode
  ```bash
  git add .agents/plans/{spec-name}-master.md .agents/plans/{spec-name}-phase-*.md
  ```
  ```

  **Replace with:**
  ```markdown
  #### Task Brief Mode (default)
  ```bash
  git add .agents/features/{feature}/plan.md .agents/features/{feature}/task-*.md
  ```

  #### Master + Sub-Plan Mode (exception)
  ```bash
  git add .agents/features/{feature}/plan-master.md .agents/features/{feature}/plan-phase-*.md
  ```
  ```

- **PATTERN**: Same section structure, updated mode names and paths
- **IMPORTS**: N/A
- **GOTCHA**: The git add for task brief mode uses `task-*.md` glob to catch all task briefs in one command.
- **VALIDATE**: Read the commit step and confirm paths use `.agents/features/{feature}/` format

### Step 4: FIX Step 5 — Execute dispatch path — `.opencode/commands/build.md`

- **IMPLEMENT**: Fix the stale execute path in the dispatch/prompt section.

  **Stale pattern** (around line 271):
  ```
  prompt: "Run /prime first. Then run /execute .agents/plans/{spec-name}.md",
  ```

  **Replace with:**
  ```
  prompt: "Run /prime first. Then run /execute .agents/features/{feature}/plan.md",
  ```

- **PATTERN**: N/A — fixing stale path
- **IMPORTS**: N/A
- **GOTCHA**: There may be other stale references in this section. Search for `.agents/plans/` in the entire Step 5 section.
- **VALIDATE**: Grep Step 5 section for `.agents/plans/` — should return zero matches

### Step 5: SWEEP — Find and fix ALL remaining stale paths — `.opencode/commands/build.md`

- **IMPLEMENT**: After steps 1-4, do a full-file sweep for any remaining `.agents/plans/` references. This is a catch-all step to ensure nothing is missed.

  Search the entire file for:
  - `.agents/plans/` → replace with `.agents/features/{feature}/`
  - `{spec-name}.md` → replace with `plan.md` (or appropriate filename)
  - `{spec-name}-master.md` → replace with `plan-master.md`
  - `{spec-name}-phase-*.md` → replace with `plan-phase-{N}.md`

  Fix any remaining instances using context-appropriate replacements.

- **PATTERN**: N/A — cleanup sweep
- **IMPORTS**: N/A
- **GOTCHA**: Some references may be in prose descriptions rather than code blocks — fix those too. The goal is zero `.agents/plans/` references in the entire file.
- **VALIDATE**: `grep -c ".agents/plans/" .opencode/commands/build.md` returns 0

---

## TESTING

No tests required — this task modifies a command documentation file (markdown).

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
N/A — command correctness verified when /build runs
```

### Level 5: Manual Validation

Read the updated `.opencode/commands/build.md` and verify:
1. Step 2 plan mode detection has "Task Brief Mode" as DEFAULT
2. Step 2 plan mode detection has "Master + Sub-Plan Mode" as EXCEPTION
3. All save paths use `.agents/features/{feature}/` format
4. Step 4 git add paths use `.agents/features/{feature}/` format
5. Step 4 has correct glob patterns for task briefs (`task-*.md`)
6. Step 5 execute path uses `.agents/features/{feature}/plan.md`
7. ZERO occurrences of `.agents/plans/` in the entire file
8. Mode names are consistent with planning.md and AGENTS.md

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Plan mode detection makes task briefs the default
- [ ] Master plan mode marked as exception
- [ ] All `.agents/plans/` references replaced with `.agents/features/{feature}/`
- [ ] Git add paths updated for task brief mode
- [ ] Execute dispatch path updated
- [ ] Zero stale path references remain
- [ ] All validation commands pass

### Runtime (verify after testing/deployment)

- [ ] `/build` correctly invokes `/planning` in task brief mode
- [ ] `/build` correctly commits plan artifacts with new paths
- [ ] No regressions in master plan mode

---

## HANDOFF

### Files Created/Modified

- `.opencode/commands/build.md` — Updated plan mode detection, fixed all stale paths, updated commit and execute sections

### Patterns Established

- All command files now use `.agents/features/{feature}/` path format consistently
- Task brief mode is the default in all command files that reference plan modes

### State to Carry Forward

- All core command files are now updated (planning, execute, prime, build, AGENTS.md)
- Task 7 handles the remaining minor updates to templates and agents

### Known Issues or Deferred Items

- Stale paths in `.opencode/reference/` files and `.opencode/sections/` files are NOT fixed by this task. They should be addressed in a separate cleanup but are low priority since those files are loaded on-demand and the commands take precedence.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step validation passed
- [ ] All validation commands executed successfully
- [ ] Tests pass (N/A)
- [ ] No linting or type checking errors (N/A)
- [ ] Manual validation confirms all 8 checkpoints pass
- [ ] Acceptance criteria all met
- [ ] Handoff notes completed for next task
