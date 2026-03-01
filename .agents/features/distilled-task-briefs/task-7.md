# Distilled Task Briefs — Task 7/7
<!-- Source: .agents/features/distilled-task-briefs/plan.md -->
<!-- Scope: Update execution-report-template + planning-research agent for task brief awareness -->
<!-- Prior: task-1 through task-6 (all core files updated) -->

## PRIOR TASKS

**Files Changed in Prior Task(s):**
- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — Created (task 1)
- `.opencode/commands/planning.md` — Task brief mode as default (task 2)
- `.opencode/commands/execute.md` — Auto-detect + Step 2.6 (task 3)
- `.opencode/commands/prime.md` — Artifact scan + display (task 4)
- `AGENTS.md` — Full documentation update (task 5)
- `.opencode/commands/build.md` — Mode detection + stale paths (task 6)

**Key Outcomes from Prior Task(s):**
- Complete task brief system is operational and documented across all core command files
- All stale `.agents/plans/` paths fixed in build.md
- AGENTS.md documents the full task brief lifecycle

**State Carried Forward:**
- Two remaining files need minor updates for completeness:
  - EXECUTION-REPORT-TEMPLATE.md — completion sweep needs task-{N}.md rename rule
  - planning-research.md agent — scan pattern needs task-{N}.done.md awareness

**Known Issues or Deferred Items:**
- Stale paths in reference/ and sections/ files are out of scope (separate cleanup)

---

## OBJECTIVE

Make two minor updates for task brief awareness: (1) add `task-{N}.md` → `task-{N}.done.md` to the execution report template's completion sweep, and (2) update the planning-research agent to scan for `task-{N}.done.md` files alongside `plan.done.md` when searching for completed plans.

---

## SCOPE

**What This Task Delivers:**

Execution report template and planning-research agent updated with task brief file patterns.

**Files This Task Touches:**
- `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` — modify (completion sweep section)
- `.opencode/agents/planning-research.md` — modify (scan pattern)

**Dependencies:**
- Tasks 1-6 must complete first (task brief artifacts must be defined)

**Out of Scope for This Task:**
- All other template files (STRUCTURED-PLAN-TEMPLATE.md header comment could be updated but is low priority)
- Reference file stale paths
- VIBE-PLANNING-GUIDE.md
- PLAN-QUALITY-ASSESSMENT.md

---

## FILES TO READ BEFORE STARTING

- `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` (all 201 lines) — The template being modified. Focus on completion sweep section near the end.
- `.opencode/agents/planning-research.md` (all 67 lines) — The agent being modified. Focus on scan patterns.

### Patterns to Follow

**Completion sweep pattern** — See `execute.md:293-301` (updated in task 3)
- What to match: The execute.md completion sweep was already updated with task-{N}.md rules. The execution report template should mirror those exact rules.
- Gotcha: The template is a reference — it may not list every rename rule. Just ensure task-{N}.md is included.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE Completion sweep — `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md`

- **IMPLEMENT**: Add task-{N}.md rename rule to the completion sweep section. The execution report template has a completion sweep checklist near the end of the file.

  Read the file first to locate the exact section. Look for lines mentioning:
  - `plan.md` → `plan.done.md`
  - `plan-phase-{N}.md` → `plan-phase-{N}.done.md`
  - `plan-master.md` → `plan-master.done.md`

  Add `task-{N}.md` → `task-{N}.done.md` to this list, and update the `plan.md` rule to note "only when ALL task briefs are done."

  **Expected change pattern:**

  Find the completion sweep list and add:
  ```
  - `task-{N}.md` → `task-{N}.done.md` (for each completed task brief)
  ```
  Before the existing `plan.md` → `plan.done.md` line.

  Update the `plan.md` rule:
  ```
  - `plan.md` → `plan.done.md` (only when ALL task briefs are done, OR legacy single plan fully executed)
  ```

- **PATTERN**: Same list format as existing completion sweep entries
- **IMPORTS**: N/A
- **GOTCHA**: The exact location in the template may differ from execute.md — read the file first. The template is a reference document, not executable instructions.
- **VALIDATE**: Read the updated completion sweep section and confirm task-{N}.md rule present

### Step 2: UPDATE Scan pattern — `.opencode/agents/planning-research.md`

- **IMPLEMENT**: Update the planning-research agent to also scan for `task-{N}.done.md` files when looking for completed plans and past implementation patterns.

  Read the file first to locate the scan instructions. Look for references to:
  - `.agents/features/*/plan.done.md`
  - Completed plans
  - Past implementations

  Add `task-{N}.done.md` alongside `plan.done.md` in the scan patterns. The agent should look at both:
  - `.agents/features/*/plan.done.md` — completed overview plans
  - `.agents/features/*/task-*.done.md` — completed task briefs (contain detailed implementation steps)

  The task briefs are actually MORE useful for the planning-research agent because they contain the actual step-by-step implementation detail, code blocks, and validation commands that were executed.

  **Expected change pattern:**

  Where the agent currently says to scan `plan.done.md`, add:
  ```
  Also scan `.agents/features/*/task-*.done.md` for detailed implementation patterns from completed task briefs. These contain step-by-step implementation detail, code blocks, and validation results from past executions.
  ```

- **PATTERN**: Same prose instruction style as existing agent file
- **IMPORTS**: N/A
- **GOTCHA**: The planning-research agent is a subagent prompt — changes should be in natural language instructions, not code.
- **VALIDATE**: Read the updated agent file and confirm task brief scan pattern documented

---

## TESTING

No tests required — these are documentation/configuration file updates.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```
# Verify markdown is well-formed (manual check)
```

### Level 2: Type Safety
```
N/A — markdown files
```

### Level 3: Unit Tests
```
N/A — no code
```

### Level 4: Integration Tests
```
N/A — template and agent correctness verified when used
```

### Level 5: Manual Validation

Read the updated files and verify:
1. EXECUTION-REPORT-TEMPLATE.md completion sweep includes `task-{N}.md` → `task-{N}.done.md` rule
2. EXECUTION-REPORT-TEMPLATE.md `plan.md` rule notes "only when ALL task briefs are done"
3. planning-research.md scans for `task-*.done.md` alongside `plan.done.md`
4. planning-research.md notes that task briefs contain detailed implementation patterns

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] EXECUTION-REPORT-TEMPLATE.md has task-{N}.md rename rule in completion sweep
- [ ] EXECUTION-REPORT-TEMPLATE.md plan.md rule qualified with task brief condition
- [ ] planning-research.md scans for task-*.done.md files
- [ ] All validation commands pass

### Runtime (verify after testing/deployment)

- [ ] `/execute` report template correctly guides completion sweep for task briefs
- [ ] `/planning` research agent finds past task brief implementations
- [ ] No regressions in existing template or agent behavior

---

## HANDOFF

### Files Created/Modified

- `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` — Added task-{N}.md to completion sweep
- `.opencode/agents/planning-research.md` — Added task brief scan pattern

### Patterns Established

- All template and agent files now aware of task brief artifacts
- Completion sweep rules are consistent between execute.md and the execution report template

### State to Carry Forward

- This is the LAST task. All 7 tasks are complete.
- The full task brief system is implemented and documented across:
  - 1 new template file (TASK-BRIEF-TEMPLATE.md)
  - 4 updated command files (planning.md, execute.md, prime.md, build.md)
  - 1 updated documentation file (AGENTS.md)
  - 2 updated supporting files (execution-report-template, planning-research agent)
- The system is ready for testing: run `/planning` on a real feature to validate end-to-end

### Known Issues or Deferred Items

- **Low priority**: STRUCTURED-PLAN-TEMPLATE.md header comment (lines 19-24) still references "Single Plan" — could be updated for consistency but planning.md instructions take precedence
- **Low priority**: VIBE-PLANNING-GUIDE.md line 53 references plan.md without mentioning task briefs — minor, guide is for freeform use
- **Separate cleanup**: Stale `.agents/plans/` paths in reference/ and sections/ files (8+ files) — not part of this feature

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step validation passed
- [ ] All validation commands executed successfully
- [ ] Tests pass (N/A)
- [ ] No linting or type checking errors (N/A)
- [ ] Manual validation confirms all 4 checkpoints pass
- [ ] Acceptance criteria all met
- [ ] Handoff notes completed (final task — no next task)
