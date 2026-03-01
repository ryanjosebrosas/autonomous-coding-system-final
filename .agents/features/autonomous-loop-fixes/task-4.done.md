# Task 4 of 5: Fix `report.md` Overwrite + `.done.md` Rename Deduplication

> **Feature**: `autonomous-loop-fixes`
> **Brief Path**: `.agents/features/autonomous-loop-fixes/task-4.md`
> **Plan Overview**: `.agents/features/autonomous-loop-fixes/plan.md`

---

## OBJECTIVE

Fix `execute.md` so that multi-task execution appends per-task sections to `report.md` instead of overwriting it, and deduplicate the `.done.md` rename by making Step 2.6 defer to Step 6.6.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/execute.md` | UPDATE | Fix report write semantics (lines 331-332, 377), deduplicate rename (line 186 vs 346) |
| `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` | UPDATE | Add per-task section structure |

**Out of Scope:**
- The report template's overall structure — only adding per-task section support
- `/commit` report handling — it already renames `report.md` → `report.done.md` which is correct
- Master plan report handling — phases already run one per session and the report is per-phase

**Dependencies:**
- Tasks 1-3 must complete first (no file conflicts, but sequential execution model)

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Task(s):**
- `.opencode/commands/prime.md` — (Task 1) Status list and Pending Work display extended
- `.opencode/commands/code-loop.md` — (Task 2) `/final-review` removed
- `.opencode/commands/code-review-fix.md` — (Task 2) Artifact path fixed
- `.opencode/commands/commit.md` — (Task 3) Failure handoff added
- `.opencode/commands/pr.md` — (Task 3) Failure handoff added
- `.opencode/commands/code-review.md` — (Task 3) Failure handoff added

**State Carried Forward:**
- All pipeline commands now handle success and failure handoffs
- `execute.md` has NOT been modified yet in this feature

**Known Issues or Deferred Items:**
- None from prior tasks.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/execute.md` (lines 182-219) — Why: Step 2.6 with the eager rename at line 186
- `.opencode/commands/execute.md` (lines 141-180) — Why: Step 2.5 with the correct deferral pattern at line 145
- `.opencode/commands/execute.md` (lines 328-353) — Why: Step 6.6 with report write and completion sweep
- `.opencode/commands/execute.md` (lines 375-381) — Why: redundant report write instruction
- `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` (lines 1-10) — Why: report template header and path

### Patterns to Follow

**Correct deferral pattern** (from `execute.md:145`):
```
1. Let the existing completion sweep (Step 6.6) handle renaming `plan-phase-{N}.md` → `plan-phase-{N}.done.md`
```
Step 2.5 (phases) correctly defers the rename to Step 6.6. Step 2.6 (tasks) should follow the same pattern.

---

## STEP-BY-STEP TASKS

---

### Step 1: UPDATE `.opencode/commands/execute.md` — Make Step 2.6 defer rename to Step 6.6

**What**: Change Step 2.6 item 1 from doing the rename eagerly to deferring it to Step 6.6, matching the pattern used by Step 2.5.

**IMPLEMENT**:

Current (line 186 of `.opencode/commands/execute.md`):
```
1. Rename the completed task brief: `task-{N}.md` → `task-{N}.done.md`
```

Replace with:
```
1. Let the existing completion sweep (Step 6.6) handle renaming `task-{N}.md` → `task-{N}.done.md`
```

**PATTERN**: Matches `execute.md:145` exactly — same wording, same deferral to Step 6.6.

**IMPORTS**: N/A

**GOTCHA**: This is the critical deduplication fix. After this change, the rename happens ONLY in Step 6.6 (line 346), never in Step 2.6. The comment on line 346 that says "(done in Step 2.6)" will need to be updated too (see Step 2 below).

**VALIDATE**:
```bash
# Verify line 186 now says "Let the existing completion sweep" instead of "Rename the completed task brief"
```

---

### Step 2: UPDATE `.opencode/commands/execute.md` — Fix Step 6.6 completion sweep comment

**What**: Remove the ambiguous "(done in Step 2.6)" comment from the completion sweep since Step 2.6 no longer does the rename.

**IMPLEMENT**:

Current (line 346 of `.opencode/commands/execute.md`):
```
  - `task-{N}.md` → `task-{N}.done.md` (completed task brief — done in Step 2.6)
```

Replace with:
```
  - `task-{N}.md` → `task-{N}.done.md` (completed task brief)
```

**PATTERN**: Matches the format of other lines in the sweep (e.g., line 348: `plan-phase-{N}.md → plan-phase-{N}.done.md (for each completed phase)`).

**IMPORTS**: N/A

**GOTCHA**: The old comment "(done in Step 2.6)" was a note saying the rename already happened. Since we changed Step 2.6 to defer, the note is now wrong. Removing it makes the sweep the single source of truth for the rename.

**VALIDATE**:
```bash
# Verify line 346 no longer has the "(done in Step 2.6)" comment
```

---

### Step 3: UPDATE `.opencode/commands/execute.md` — Fix report write for multi-task mode

**What**: Change the report write instruction to append per-task sections instead of overwriting the entire file.

**IMPLEMENT**:

Current (lines 328-332 of `.opencode/commands/execute.md`):
```
### 6.6. Execution Report

After successful execution, save the execution report using the template:
- **Template**: `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md`
- **Path**: `.agents/features/{feature}/report.md`
```

Replace with:
```
### 6.6. Execution Report

After successful execution, save the execution report using the template:
- **Template**: `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md`
- **Path**: `.agents/features/{feature}/report.md`

**Multi-task mode (task briefs):** If this is one of multiple task briefs:
- **First task (task 1):** Create `report.md` with the full template header (Meta Information through Ready for Commit), then add a `## Task 1: {task title}` section with this task's details (completed tasks, divergences, validation results).
- **Subsequent tasks (task 2+):** Read the existing `report.md`, append a new `## Task {N}: {task title}` section with this task's details. Update the Meta Information totals (cumulative files added/modified, cumulative lines changed). Do NOT overwrite previous task sections.
- **Final task:** After appending the last task section, update the top-level Self-Review Summary and Ready for Commit sections with cumulative totals.

**Single plan / single phase:** Write the full report as a single document (no per-task sections needed).
```

**PATTERN**: The per-task section approach follows the pattern of `review-{N}.md` (numbered artifacts) but keeps everything in a single file.

**IMPORTS**: N/A

**GOTCHA**: The key behavior change: `report.md` is now an **append** operation for task 2+, not a full overwrite. The executing agent must `Read` the existing report first, then append. If it creates a fresh report each time, all previous task data is lost.

**VALIDATE**:
```bash
# Verify the new multi-task mode instructions appear in Step 6.6
# Verify they specify "append" for task 2+ and "create" for task 1
```

---

### Step 4: UPDATE `.opencode/commands/execute.md` — Remove redundant report write at line 377

**What**: The "Output Report" section at line 377 redundantly repeats the report save path. Clarify it refers to the same report written in Step 6.6.

**IMPLEMENT**:

Current (lines 375-381 of `.opencode/commands/execute.md`):
```
## Output Report

Save this report to: `.agents/features/{feature}/report.md`

Use the feature name derived in Step 1. Create the `.agents/features/{feature}/` directory if it doesn't exist.

**IMPORTANT**: Save the report to the file FIRST, then also display it inline for the user. The saved file is consumed by `/system-review`.
```

Replace with:
```
## Output Report

The execution report was saved in Step 6.6 to: `.agents/features/{feature}/report.md`

Also display the report inline for the user. The saved file is consumed by `/system-review` and `/commit`.

**Do NOT re-write the report here** — Step 6.6 already handled it. This section is for inline display only.
```

**PATTERN**: Removes the ambiguity of having two write instructions for the same file.

**IMPORTS**: N/A

**GOTCHA**: Without this fix, an LLM could write the report twice — once at Step 6.6 (with the per-task append logic) and again at the Output Report section (full overwrite), destroying the appended data.

**VALIDATE**:
```bash
# Verify the Output Report section no longer says "Save this report to"
# Verify it says "was saved in Step 6.6" and "Do NOT re-write"
```

---

### Step 5: UPDATE `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` — Add per-task section structure

**What**: Add a per-task section template to the execution report template.

**IMPLEMENT**:

Current (lines 39-48 of `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md`):
```
---

## Completed Tasks

For each task in the plan:

- **Task {N}**: {brief description} — {completed / skipped with reason}
- **Task {N}**: {brief description} — {completed / skipped with reason}

**Summary**: {X}/{Y} tasks completed ({Z}%)
```

Replace with:
```
---

## Completed Tasks

**For single-plan execution:** List all tasks inline:

- **Task {N}**: {brief description} — {completed / skipped with reason}

**Summary**: {X}/{Y} tasks completed ({Z}%)

**For multi-task brief execution:** Each task brief session appends a section:

### Task {N}: {task title}

- **Brief**: `task-{N}.md`
- **Status**: completed / skipped / partial
- **Files added**: {list}
- **Files modified**: {list}
- **Divergences**: {count — Good: X, Bad: Y, or "None"}
- **Validation**: L1 {pass/fail} | L2 {pass/fail} | L3 {pass/fail}
- **Notes**: {any issues or observations}

*(Each `/execute` session appends one of these sections. Do NOT overwrite previous task sections.)*
```

**PATTERN**: The per-task section follows the same field structure as the existing "Completed Tasks" bullet format but in expanded form with a subsection header.

**IMPORTS**: N/A

**GOTCHA**: The template now has two modes documented. The executing agent must check which mode applies based on whether it's running a task brief or a single plan. This is determined by Step 0.5 in `execute.md`.

**VALIDATE**:
```bash
# Open EXECUTION-REPORT-TEMPLATE.md and verify the "Completed Tasks" section now has both single-plan and multi-task formats
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this task modifies markdown command specs and templates.

### Integration Tests
N/A — no executable code modified.

### Edge Cases
- Task 1 of 5 creates `report.md` fresh — should use full template
- Task 2 of 5 appends — must read existing report first, then add section
- Task 5 of 5 (last task) — appends final section, updates cumulative totals
- Single plan execution — uses the original full-report format, no per-task sections
- Phase execution — one report per phase, no per-task sections within a phase

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Verify both modified files are valid markdown
```

### Level 2-4: N/A

### Level 5: Manual Validation

1. Open `execute.md` line 186 — verify it says "Let the existing completion sweep (Step 6.6) handle renaming"
2. Open `execute.md` line 346 — verify the "(done in Step 2.6)" comment is removed
3. Open `execute.md` Step 6.6 — verify multi-task mode instructions with append semantics
4. Open `execute.md` Output Report section — verify it says "Do NOT re-write"
5. Open `EXECUTION-REPORT-TEMPLATE.md` — verify per-task section template exists

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Step 2.6 line 186 defers rename to Step 6.6 (matches Step 2.5 pattern)
- [ ] Step 6.6 line 346 has no "(done in Step 2.6)" comment
- [ ] Step 6.6 has multi-task mode instructions with append semantics
- [ ] Output Report section says "Do NOT re-write" and references Step 6.6
- [ ] EXECUTION-REPORT-TEMPLATE.md has per-task section template
- [ ] Template documents both single-plan and multi-task modes

### Runtime (verify after testing/deployment)

- [ ] Multi-task execution preserves all task reports in a single `report.md`
- [ ] Task brief rename happens exactly once (in Step 6.6 only)

---

## HANDOFF NOTES

### Files Created/Modified
- `.opencode/commands/execute.md` — Deduped rename, added multi-task append semantics, clarified Output Report section
- `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` — Added per-task section template

### Patterns Established
- Both Step 2.5 (phases) and Step 2.6 (tasks) now defer renames to Step 6.6 — single source of truth
- Report writes use append semantics for multi-task mode

### State to Carry Forward
- `execute.md` is now consistent: one rename location (Step 6.6), one report write location (Step 6.6)
- Task 5 updates AGENTS.md which does not conflict with these changes

### Known Issues or Deferred Items
- The Meta Information cumulative update (adding up files added/modified across tasks) requires the executing agent to parse the existing report header. This is a runtime detail, not a spec gap.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written
- [ ] Brief marked done: rename `task-4.md` → `task-4.done.md`
