# Task 1 of 5: Add Missing Statuses to `/prime`

> **Feature**: `autonomous-loop-fixes`
> **Brief Path**: `.agents/features/autonomous-loop-fixes/task-1.md`
> **Plan Overview**: `.agents/features/autonomous-loop-fixes/plan.md`

---

## OBJECTIVE

Add all 6 missing pipeline status values to `/prime`'s recognition list and Pending Work display so that `/prime` correctly routes users after every pipeline command.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/prime.md` | UPDATE | Add 6 status values to lines 189-195, add display lines to both Pending Work sections |

**Out of Scope:**
- The commands that *write* these statuses (those are correct already)
- The artifact scan logic (Source 2) — it works as fallback
- Any other section of `prime.md` besides status recognition and Pending Work display

**Dependencies:**
- None — this is the first task

---

## PRIOR TASK CONTEXT

This is the first task — no prior work. Start fresh from the codebase state.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/prime.md` (lines 189-195) — Why: the exact 6-item status list to extend
- `.opencode/commands/prime.md` (lines 239-248) — Why: System Mode Pending Work display template
- `.opencode/commands/prime.md` (lines 292-301) — Why: Codebase Mode Pending Work display template
- `AGENTS.md` (line 77) — Why: the canonical 11-status enum that prime must match

### Patterns to Follow

**Status list entry pattern** (from `prime.md:190`):
```
- `awaiting-execution` — plan written, no execution started
```
Every entry is: `- \`{status-string}\` — {human-readable description}`.

**Pending Work display line pattern** (from `prime.md:241`):
```
- **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
```
Every display line is: `- **[{tag}]** {feature} — {description}: {suggested command}`.

---

## STEP-BY-STEP TASKS

---

### Step 1: UPDATE `.opencode/commands/prime.md` — Extend status recognition list

**What**: Add 6 missing status values to the recognized status list at lines 189-195.

**IMPLEMENT**:

Current (lines 189-195 of `.opencode/commands/prime.md`):
```
Recognized status values:
- `awaiting-execution` — plan written, no execution started
- `executing-tasks` — task brief mode in progress (some briefs done)
- `executing-series` — master plan phase mode in progress
- `awaiting-review` — all execution done, awaiting `/code-loop`
- `ready-to-commit` — review complete, awaiting `/commit`
- `blocked` — manual intervention required
```

Replace with:
```
Recognized status values:
- `awaiting-execution` — plan written, no execution started
- `executing-tasks` — task brief mode in progress (some briefs done)
- `executing-series` — master plan phase mode in progress
- `awaiting-review` — all execution done, awaiting `/code-loop`
- `awaiting-fixes` — code review found issues, awaiting `/code-review-fix`
- `awaiting-re-review` — fixes applied, awaiting re-review via `/code-review`
- `ready-to-commit` — review complete, awaiting `/commit`
- `ready-for-pr` — committed, awaiting `/pr`
- `pr-open` — PR created, pipeline complete (informational)
- `blocked` — manual intervention required
- `build-loop-continuing` — commit done in `/build` loop, continuing to next spec
```

**PATTERN**: Follows existing format at `prime.md:190` — backtick-wrapped status string + em-dash + description.

**IMPORTS**: N/A

**GOTCHA**: The order matters for readability. Group statuses by pipeline progression: planning → execution → review → fix → commit → PR → terminal. `blocked` and `build-loop-continuing` go at the end as special states.

**VALIDATE**:
```bash
# Verify the file has exactly 11 status entries (not 6)
# Open prime.md and count lines matching the pattern `- \`` between "Recognized status values:" and the next blank line
```

---

### Step 2: UPDATE `.opencode/commands/prime.md` — Extend System Mode Pending Work display

**What**: Add display lines for the 5 new actionable statuses in the System Mode report template.

**IMPLEMENT**:

Current (lines 239-248 of `.opencode/commands/prime.md`):
```
## Pending Work
{If pending work found in Step 3.5:
- **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
- **[tasks]** {feature} — task {N}/{total} done, next: /execute .agents/features/{feature}/plan.md
- **[plan]** {feature} — legacy plan awaiting execution: /execute .agents/features/{feature}/plan.md
- **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-master.md
- **[report]** {feature} — execution done, awaiting commit: /commit
- **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
(Show only lines that apply. Handoff line first if present.)
Otherwise: "No pending work found."}
```

Replace with:
```
## Pending Work
{If pending work found in Step 3.5:
- **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
- **[tasks]** {feature} — task {N}/{total} done, next: /execute .agents/features/{feature}/plan.md
- **[plan]** {feature} — legacy plan awaiting execution: /execute .agents/features/{feature}/plan.md
- **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-master.md
- **[fixes]** {feature} — review found issues: /code-review-fix .agents/features/{feature}/review.md critical+major
- **[re-review]** {feature} — fixes applied, verify: /code-review --feature {feature}
- **[report]** {feature} — execution done, awaiting commit: /commit
- **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
- **[commit]** {feature} — ready to commit: /commit
- **[pr]** {feature} — committed, create PR: /pr {feature}
- **[done]** {feature} — PR open at {pr-url} (pipeline complete)
- **[blocked]** {feature} — blocked: {reason from Next Command field}
(Show only lines that apply. Handoff line first if present.)
Otherwise: "No pending work found."}
```

**PATTERN**: Follows existing format at `prime.md:241` — bold bracketed tag + feature + em-dash + description + colon + command.

**IMPORTS**: N/A

**GOTCHA**: The `[fixes]` and `[review]` lines look similar but serve different statuses. `[fixes]` maps to `awaiting-fixes` (from `/code-review` handoff). `[review]` maps to artifact scan finding `review.md` without `.done.md`. Both point to `/code-review-fix` but with different context. The `[done]` line for `pr-open` is informational only — it shows the PR URL from the handoff's Next Command field.

**VALIDATE**:
```bash
# Open prime.md and verify the Pending Work section in System Mode has 12 display lines (was 6)
```

---

### Step 3: UPDATE `.opencode/commands/prime.md` — Extend Codebase Mode Pending Work display

**What**: Add the same display lines to the Codebase Mode report template (mirrors System Mode).

**IMPLEMENT**:

Current (lines 292-301 of `.opencode/commands/prime.md`):
```
## Pending Work
{If pending work found in Step 3.5:
- **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
- **[tasks]** {feature} — task {N}/{total} done, next: /execute .agents/features/{feature}/plan.md
- **[plan]** {feature} — legacy plan awaiting execution: /execute .agents/features/{feature}/plan.md
- **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-master.md
- **[report]** {feature} — execution done, awaiting commit: /commit
- **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
(Show only lines that apply. Handoff line first if present.)
Otherwise: "No pending work found."}
```

Replace with:
```
## Pending Work
{If pending work found in Step 3.5:
- **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
- **[tasks]** {feature} — task {N}/{total} done, next: /execute .agents/features/{feature}/plan.md
- **[plan]** {feature} — legacy plan awaiting execution: /execute .agents/features/{feature}/plan.md
- **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-master.md
- **[fixes]** {feature} — review found issues: /code-review-fix .agents/features/{feature}/review.md critical+major
- **[re-review]** {feature} — fixes applied, verify: /code-review --feature {feature}
- **[report]** {feature} — execution done, awaiting commit: /commit
- **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
- **[commit]** {feature} — ready to commit: /commit
- **[pr]** {feature} — committed, create PR: /pr {feature}
- **[done]** {feature} — PR open at {pr-url} (pipeline complete)
- **[blocked]** {feature} — blocked: {reason from Next Command field}
(Show only lines that apply. Handoff line first if present.)
Otherwise: "No pending work found."}
```

**PATTERN**: Identical to System Mode (Step 2). Both sections must stay in sync.

**IMPORTS**: N/A

**GOTCHA**: These two Pending Work sections (System Mode and Codebase Mode) are separate copy-paste blocks in `prime.md`. They must have identical display lines. If you edit one, edit both.

**VALIDATE**:
```bash
# Verify both Pending Work sections (System Mode ~line 239, Codebase Mode ~line 292) have identical display line sets
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this task modifies markdown command specs. Covered by manual testing in Level 5.

### Integration Tests
N/A — no executable code modified.

### Edge Cases
- Status value `build-loop-continuing` — only occurs inside `/build` loop, not in normal pipeline. Display should still work.
- Status value `pr-open` — terminal state. Display is informational only, no actionable command.
- Status value not in the recognized list — should fall through to artifact scan (Source 2). This behavior is unchanged by this task.
- Multiple features with different statuses — `/prime` already scans all feature directories. The display lines handle this per-feature.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Open prime.md and verify it is valid markdown with no broken formatting
# Check that all backtick-wrapped status strings are properly closed
```

### Level 2: Type Safety
N/A — no type-checked code modified.

### Level 3: Unit Tests
N/A — no unit tests for this task.

### Level 4: Integration Tests
N/A — covered by Level 5 manual validation.

### Level 5: Manual Validation

1. Open `.opencode/commands/prime.md` and locate the "Recognized status values:" section
2. Count the status entries — should be exactly 11
3. Verify every status from AGENTS.md line 77 is present: `awaiting-execution`, `executing-tasks`, `executing-series`, `awaiting-review`, `awaiting-fixes`, `awaiting-re-review`, `ready-to-commit`, `ready-for-pr`, `pr-open`, `blocked`, `build-loop-continuing`
4. Locate both Pending Work sections (System Mode and Codebase Mode)
5. Verify both have identical display line sets with 12 lines each
6. Verify each new display line has the correct tag, description, and suggested command

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Status recognition list has exactly 11 entries (was 6)
- [ ] All 6 missing statuses added: `awaiting-fixes`, `awaiting-re-review`, `ready-for-pr`, `pr-open`, `build-loop-continuing`, and the previously-missing display lines for `ready-to-commit` and `blocked`
- [ ] System Mode Pending Work has 12 display lines (was 6)
- [ ] Codebase Mode Pending Work has 12 display lines (was 6)
- [ ] Both Pending Work sections are identical
- [ ] Status order follows pipeline progression

### Runtime (verify after testing/deployment)

- [ ] `/prime` displays correct next command for `awaiting-fixes` status
- [ ] `/prime` displays correct next command for `ready-for-pr` status
- [ ] `/prime` displays informational line for `pr-open` status

---

## HANDOFF NOTES

### Files Created/Modified
- `.opencode/commands/prime.md` — Extended status list from 6→11 entries, extended both Pending Work displays from 6→12 lines

### Patterns Established
- Status list follows pipeline progression order (plan → execute → review → fix → commit → PR → terminal → special)
- Display lines use descriptive tags: `[fixes]`, `[re-review]`, `[commit]`, `[pr]`, `[done]`, `[blocked]`

### State to Carry Forward
- `/prime` now recognizes all 11 statuses. Task 2 will change what `/code-loop` writes (from `ready-for-review` → `ready-to-commit`), which is already recognized after this task.

### Known Issues or Deferred Items
- The `[done]` display line references `{pr-url}` which must be extracted from the handoff's Next Command field. This is a parse detail the executing agent handles at runtime.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written
- [ ] Brief marked done: rename `task-1.md` → `task-1.done.md`
