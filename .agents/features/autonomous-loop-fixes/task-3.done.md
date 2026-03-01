# Task 3 of 5: Add Failure Handoff Writes to `/commit`, `/pr`, `/code-review`

> **Feature**: `autonomous-loop-fixes`
> **Brief Path**: `.agents/features/autonomous-loop-fixes/task-3.md`
> **Plan Overview**: `.agents/features/autonomous-loop-fixes/plan.md`

---

## OBJECTIVE

Add failure handoff writes to `/commit`, `/pr`, and `/code-review` so that when these commands fail, the pipeline state reflects the failure instead of going stale.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/commit.md` | UPDATE | Add failure handoff write after the success handoff section |
| `.opencode/commands/pr.md` | UPDATE | Add failure handoff write after the success handoff section |
| `.opencode/commands/code-review.md` | UPDATE | Add failure handoff write after the success handoff section |

**Out of Scope:**
- `/execute` — already has failure handoff (writes `blocked` in Steps 2.5 and 2.6)
- `/code-loop` — its failure paths are handled by internal iteration; unfixable errors stop the loop and the handoff remains from the last successful state
- `/planning` — planning failure means no plan was written, so no handoff needed

**Dependencies:**
- Task 1 must complete first — `/prime` now recognizes `blocked` status (already did) and all other statuses
- Task 2 must complete first — `/code-loop` handoff is fixed

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Task(s):**
- `.opencode/commands/prime.md` — (Task 1) Status list extended, Pending Work displays extended
- `.opencode/commands/code-loop.md` — (Task 2) `/final-review` removed, status fixed to `ready-to-commit`
- `.opencode/commands/code-review-fix.md` — (Task 2) Artifact path fixed

**State Carried Forward:**
- `/prime` now recognizes `blocked` status with display line `[blocked]`
- All commands in the pipeline now write recognized statuses

**Known Issues or Deferred Items:**
- None from prior tasks.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/commit.md` (lines 76-94) — Why: existing handoff write section, need to add failure path after it
- `.opencode/commands/pr.md` (lines 252-267) — Why: existing handoff write section
- `.opencode/commands/code-review.md` (lines 190-201) — Why: existing handoff write section
- `.opencode/commands/execute.md` (lines 178, 217) — Why: reference pattern for `blocked` handoff writes

### Patterns to Follow

**Failure handoff pattern** (from `execute.md:178`):
```
5. **If phase execution failed** — do NOT rename the phase file (no `.done.md`). Write handoff with **Status**: `blocked` and **Next Command**: `[manual intervention — phase {N} failed]`. Report the failure and stop.
```
The pattern is: on failure, write `blocked` status with a descriptive Next Command explaining what failed.

---

## STEP-BY-STEP TASKS

---

### Step 1: UPDATE `.opencode/commands/commit.md` — Add failure handoff

**What**: Add a failure handoff write section after the success handoff at line 93.

**IMPLEMENT**:

Current (lines 93-94 of `.opencode/commands/commit.md`):
```
If in a `/build` loop, set **Next Command** to `/build next` and **Status** to `build-loop-continuing`.

### 6. Report Completion
```

Replace with:
```
If in a `/build` loop, set **Next Command** to `/build next` and **Status** to `build-loop-continuing`.

**If commit fails** (e.g., pre-commit hooks, merge conflict, empty commit): Write handoff with the previous feature name preserved:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /commit (failed)
- **Feature**: {feature}
- **Next Command**: /commit
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```
Report the error clearly: what failed, why, and what the user should do to fix it. Do NOT leave the handoff stale from the previous command.

### 6. Report Completion
```

**PATTERN**: Follows `execute.md:178` failure handoff pattern — `blocked` status with actionable Next Command.

**IMPORTS**: N/A

**GOTCHA**: The failure handoff points Next Command back to `/commit` (retry), not to some other command. The `(failed)` suffix on Last Command is for diagnostics — `/prime` does not parse it, but it helps users understand what happened when they read the handoff.

**VALIDATE**:
```bash
# Open commit.md and verify there is now a "If commit fails" section between the success handoff and Step 6
# Verify the failure handoff uses Status: blocked
```

---

### Step 2: UPDATE `.opencode/commands/pr.md` — Add failure handoff

**What**: Add a failure handoff write section after the success handoff at line 267.

**IMPLEMENT**:

Current (lines 267-269 of `.opencode/commands/pr.md`):
```
This is a terminal handoff — the pipeline is complete for this feature. `/prime` will show this as informational ("Last feature PR'd: {feature}") rather than actionable.

---
```

Replace with:
```
This is a terminal handoff — the pipeline is complete for this feature. `/prime` will show this as informational ("Last feature PR'd: {feature}") rather than actionable.

**If PR creation fails** (e.g., `gh` not authenticated, network error, cherry-pick conflict, branch already exists): Write handoff preserving the feature context:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /pr (failed)
- **Feature**: {feature}
- **Next Command**: /pr {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```
Report the error clearly: what failed (cherry-pick conflict? auth? network?), what the user should do (resolve conflict, run `gh auth login`, retry). Clean up any partial state (delete local feature branch if push failed).

---
```

**PATTERN**: Same failure handoff pattern. Next Command retries `/pr` with the feature name.

**IMPORTS**: N/A

**GOTCHA**: If cherry-pick failed, the local branch may be in a dirty state. The error report should tell the user to `git checkout <original-branch>` and `git branch -D <feature-branch>` before retrying.

**VALIDATE**:
```bash
# Open pr.md and verify there is now a "If PR creation fails" section after the terminal handoff paragraph
# Verify the failure handoff uses Status: blocked
```

---

### Step 3: UPDATE `.opencode/commands/code-review.md` — Add failure handoff

**What**: Add a failure handoff write section after the success handoff at line 201.

**IMPLEMENT**:

Current (lines 201-203 of `.opencode/commands/code-review.md`):
```
If review found 0 issues, set **Next Command** to `/commit` and **Status** to `ready-to-commit`.

---
```

Replace with:
```
If review found 0 issues, set **Next Command** to `/commit` and **Status** to `ready-to-commit`.

**If code review fails** (e.g., cannot read changed files, git state corrupted, no changes found when changes expected): Write handoff preserving the feature context:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /code-review (failed)
- **Feature**: {feature}
- **Next Command**: /code-review --feature {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```
Report the error clearly: what failed and what the user should check.

---
```

**PATTERN**: Same failure handoff pattern. Next Command retries `/code-review`.

**IMPORTS**: N/A

**GOTCHA**: "No changes found" when `/code-review` is called standalone (not from `/code-loop`) is not necessarily a failure — it could mean the user ran it on a clean tree. In that case, report "No changes to review" without writing a failure handoff. Only write `blocked` if the command encounters an actual error preventing it from completing.

**VALIDATE**:
```bash
# Open code-review.md and verify there is now a "If code review fails" section after the 0-issues conditional
# Verify the failure handoff uses Status: blocked
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this task modifies markdown command specs.

### Integration Tests
N/A — no executable code modified.

### Edge Cases
- `/commit` fails due to pre-commit hook — handoff should say `blocked` with retry pointing to `/commit`
- `/pr` fails during cherry-pick — handoff should say `blocked` with retry pointing to `/pr {feature}`
- `/code-review` finds no changes (clean tree) — this is NOT a failure, should NOT write `blocked` handoff
- `/code-review` encounters git corruption — this IS a failure, should write `blocked` handoff
- Multiple failures in sequence — each failure overwrites the previous handoff (singleton), which is correct

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Verify all three modified files are valid markdown with properly closed code fences
```

### Level 2-4: N/A

### Level 5: Manual Validation

1. Open `commit.md` — verify "If commit fails" section exists with `blocked` handoff template
2. Open `pr.md` — verify "If PR creation fails" section exists with `blocked` handoff template
3. Open `code-review.md` — verify "If code review fails" section exists with `blocked` handoff template
4. Verify all three failure handoffs use `Status: blocked`
5. Verify all three failure handoffs preserve the `Feature` field
6. Verify Next Command in each failure handoff retries the same command

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] `commit.md` has failure handoff section with `Status: blocked`
- [ ] `pr.md` has failure handoff section with `Status: blocked`
- [ ] `code-review.md` has failure handoff section with `Status: blocked`
- [ ] All failure handoffs preserve the Feature field
- [ ] All failure handoffs set Next Command to retry the failed command
- [ ] All failure handoffs include error reporting guidance

### Runtime (verify after testing/deployment)

- [ ] After `/commit` fails, `/prime` shows `[blocked]` with retry guidance
- [ ] After `/pr` fails, `/prime` shows `[blocked]` with retry guidance
- [ ] Pipeline does not go stale after any command failure

---

## HANDOFF NOTES

### Files Created/Modified
- `.opencode/commands/commit.md` — Added failure handoff section after success handoff
- `.opencode/commands/pr.md` — Added failure handoff section after success handoff
- `.opencode/commands/code-review.md` — Added failure handoff section after success handoff

### Patterns Established
- Every pipeline command that writes a success handoff now also writes a failure handoff
- Failure handoff pattern: `Status: blocked`, `Last Command: /{cmd} (failed)`, `Next Command: /{cmd}` (retry)

### State to Carry Forward
- All pipeline commands now handle both success and failure paths for handoff writes
- Task 4 modifies `execute.md` which already has failure handoffs — no conflict

### Known Issues or Deferred Items
- `/code-loop` does not have an explicit failure handoff — its internal loop handles errors by stopping and preserving the last good state. This is acceptable for now.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written
- [ ] Brief marked done: rename `task-3.md` → `task-3.done.md`
