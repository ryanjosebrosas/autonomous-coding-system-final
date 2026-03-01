# Task 2 of 5: Error Handling for Steps 4, 9, and Dispatch Timeouts

> **Feature**: `build-pipeline-hardening`
> **Brief Path**: `.agents/features/build-pipeline-hardening/task-2.md`
> **Plan Overview**: `.agents/features/build-pipeline-hardening/plan.md`

---

## OBJECTIVE

Add explicit error handling to `/build` Step 4 (plan commit failure), Step 9 (reorder integration check before state update), and all dispatch calls (timeout fallback) — so no failure mode silently corrupts pipeline state.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/build.md` | UPDATE | Step 4 gets commit failure handling; Step 9 reordered; Steps 2, 5, 7 get dispatch timeout fallback |

**Out of Scope:**
- Step 8 (commit + push) — handled by Task 1
- Handoff writes at stop points — handled by Task 4
- `/commit` and `/execute` changes — handled by Tasks 1 and 3

**Dependencies:**
- Task 1 must complete first — Step 8 is already rewritten, and this task references the new Step 8 structure.

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Task(s):**
- `.opencode/commands/build.md` — Step 8 rewritten to delegate to `/commit` + `git push` with error handling

**State Carried Forward:**
- The push error handling pattern (retry → blocked handoff) from Task 1 is the model for error handling in this task.
- Step 8 no longer has custom git ops — `/commit` handles everything.

**Known Issues or Deferred Items:**
- None from Task 1.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/build.md` (lines 245-262) — Why: Step 4 (Commit Plan) needs error handling added
- `.opencode/commands/build.md` (lines 567-596) — Why: Step 9 (Update State) needs reordering
- `.opencode/commands/build.md` (lines 152-167) — Why: Step 2 dispatch call needs timeout fallback
- `.opencode/commands/build.md` (lines 273-296) — Why: Step 5 dispatch calls need timeout fallback
- `.opencode/commands/build.md` (lines 398-427) — Why: Step 7 dispatch calls need timeout fallback

### Current Content: Step 4 (Lines 245-262)

```markdown
### Step 4: Commit Plan

Git save point:

#### Task Brief Mode (Default)
```bash
git add .agents/features/{spec-name}/plan.md .agents/features/{spec-name}/task-*.md
git commit -m "plan({spec-name}): structured implementation plan + {N} task briefs"
```

#### Master + Sub-Plan Mode
```bash
git add .agents/features/{spec-name}/plan-master.md .agents/features/{spec-name}/plan-phase-*.md
git commit -m "plan({spec-name}): master plan + {N} sub-plans"
```

This is the rollback point. If implementation fails, `git stash` to here and retry.
```

**Analysis**: No handling for commit failure. If pre-commit hooks reject, or the commit is empty (plan files not found), or disk is full — the pipeline proceeds to Step 5 (Execute) without a rollback point. Step 5 then implements code changes with no saved plan to roll back to.

### Current Content: Step 9 (Lines 567-596)

```markdown
### Step 9: Update State

1. **Mark spec complete** in `.agents/specs/BUILD_ORDER.md`:
   - Change `- [ ]` to `- [x]` for the completed spec

2. **Update `.agents/specs/build-state.json`:**
   ```json
   {
     "lastSpec": "P1-02",
     "completed": ["P1-01", "P1-02"],
     "currentPillar": 1,
     "totalSpecs": 20,
     "patternsEstablished": ["strict typing", "config pattern"],
     "decisionsLog": [
       {"spec": "P1-01", "decision": "Used X pattern", "reason": "Maintains compatibility"}
     ]
   }
   ```

3. **Update Archon** (if connected):
   - Call `manage_task("update", task_id="...", status="done")` for all spec tasks
   - Update project progress

4. **Run rolling integration check:**
   ```bash
   {configured lint command}
   {configured type check command}
   {configured test command}
   ```
   If integration check fails: STOP, report regression. Do not proceed to next spec.
```

**Analysis**: Steps 9.1 and 9.2 update state files BEFORE Step 9.4 runs the integration check. If the check fails, BUILD_ORDER shows `[x]` and build-state.json says "completed" even though the spec has a regression. The correct order is: run integration check first, then update state only on success.

### Current Content: Step 2 Dispatch (Lines 152-167)

```markdown
   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /planning {spec-id} {spec-name} --auto-approve ...",
     taskType: "planning",
     timeout: 900,
   })
   ```
   The `--auto-approve` flag skips the interactive approval gate in `/planning` Phase 4 — the spec was already approved via BUILD_ORDER.
   Use a T1 thinking model for best results (reasoning produces better plans and task briefs).

   **If dispatch unavailable:**
   Write the plan directly using the `/planning` methodology.
```

**Analysis**: No timeout or error handling. If dispatch returns an error or times out after 900s, what happens? The pipeline has no fallback.

### Patterns to Follow

**Pattern: Execute failed-task handling** (from `execute.md:217`):
```markdown
5. **If task execution failed** — do NOT rename the task file (no `.done.md`). Write handoff with **Status**: `blocked` and **Next Command**: `[manual intervention — task {N} failed]`. Report the failure and stop.
```
- Why this pattern: Same principle — on failure, don't update state, report clearly, stop.
- How to apply: Each error handler follows: (1) don't proceed, (2) write blocked handoff, (3) report.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/commands/build.md` — Add error handling to Step 4

**What**: Add commit failure handling to Step 4 so the pipeline stops if the plan can't be committed.

**IMPLEMENT**:

Current (lines 245-262 of `.opencode/commands/build.md`):
```markdown
### Step 4: Commit Plan

Git save point:

#### Task Brief Mode (Default)
```bash
git add .agents/features/{spec-name}/plan.md .agents/features/{spec-name}/task-*.md
git commit -m "plan({spec-name}): structured implementation plan + {N} task briefs"
```

#### Master + Sub-Plan Mode
```bash
git add .agents/features/{spec-name}/plan-master.md .agents/features/{spec-name}/plan-phase-*.md
git commit -m "plan({spec-name}): master plan + {N} sub-plans"
```

This is the rollback point. If implementation fails, `git stash` to here and retry.
```

Replace with:
```markdown
### Step 4: Commit Plan

Git save point:

#### Task Brief Mode (Default)
```bash
git add .agents/features/{spec-name}/plan.md .agents/features/{spec-name}/task-*.md
git commit -m "plan({spec-name}): structured implementation plan + {N} task briefs"
```

#### Master + Sub-Plan Mode
```bash
git add .agents/features/{spec-name}/plan-master.md .agents/features/{spec-name}/plan-phase-*.md
git commit -m "plan({spec-name}): master plan + {N} sub-plans"
```

**If `git commit` fails** (pre-commit hooks, empty diff, plan files missing):
- STOP the pipeline. Do NOT proceed to Step 5.
- Report: "Plan commit failed for spec {spec-name}: {error}. Fix the issue and run `/build {spec-name}` to retry."
- Without this commit, there is no rollback point — execution must not begin.

This is the rollback point. If implementation fails, `git reset --hard HEAD` to here and retry.
```

**PATTERN**: Error handling from `execute.md:217` — don't proceed, report, stop.

**IMPORTS**: N/A

**GOTCHA**: Changed `git stash` to `git reset --hard HEAD` for rollback — `git stash` doesn't reliably roll back to a specific commit; `git reset --hard HEAD` returns to the plan commit point.

**VALIDATE**:
```bash
# Read Step 4 and verify: commit failure is explicitly handled with a STOP
```

---

### Step 2: UPDATE `.opencode/commands/build.md` — Reorder Step 9

**What**: Move the integration check (9.4) to run BEFORE state updates (9.1, 9.2, 9.3), so a failed check doesn't leave stale success markers.

**IMPLEMENT**:

Current (lines 567-596 of `.opencode/commands/build.md`):
```markdown
### Step 9: Update State

1. **Mark spec complete** in `.agents/specs/BUILD_ORDER.md`:
   - Change `- [ ]` to `- [x]` for the completed spec

2. **Update `.agents/specs/build-state.json`:**
   ```json
   {
     "lastSpec": "P1-02",
     "completed": ["P1-01", "P1-02"],
     "currentPillar": 1,
     "totalSpecs": 20,
     "patternsEstablished": ["strict typing", "config pattern"],
     "decisionsLog": [
       {"spec": "P1-01", "decision": "Used X pattern", "reason": "Maintains compatibility"}
     ]
   }
   ```

3. **Update Archon** (if connected):
   - Call `manage_task("update", task_id="...", status="done")` for all spec tasks
   - Update project progress

4. **Run rolling integration check:**
   ```bash
   {configured lint command}
   {configured type check command}
   {configured test command}
   ```
   If integration check fails: STOP, report regression. Do not proceed to next spec.
```

Replace with:
```markdown
### Step 9: Verify + Update State

**9.1. Run rolling integration check (BEFORE updating state):**

```bash
{configured lint command}
{configured type check command}
{configured test command}
```

If integration check fails:
- STOP the pipeline. Do NOT update BUILD_ORDER or build-state.json.
- Report: "Regression detected after committing spec {spec-name}. Integration check failed: {errors}."
- The spec is committed (Step 8) but not marked complete. Fix the regression and run `/build {spec-name}` to re-validate and mark complete.

**9.2. Mark spec complete** in `.agents/specs/BUILD_ORDER.md` (only after 9.1 passes):
- Change `- [ ]` to `- [x]` for the completed spec

**9.3. Update `.agents/specs/build-state.json`:**
```json
{
  "lastSpec": "P1-02",
  "completed": ["P1-01", "P1-02"],
  "currentPillar": 1,
  "totalSpecs": 20,
  "patternsEstablished": ["strict typing", "config pattern"],
  "decisionsLog": [
    {"spec": "P1-01", "decision": "Used X pattern", "reason": "Maintains compatibility"}
  ]
}
```

**9.4. Update Archon** (if connected):
- Call `manage_task("update", task_id="...", status="done")` for all spec tasks
- Update project progress
```

**PATTERN**: Same principle as Step 4 error handling — verify before committing state.

**IMPORTS**: N/A

**GOTCHA**: The renumbering (old 9.1→9.2, old 9.2→9.3, old 9.3→9.4, old 9.4→9.1) must be reflected in any references to Step 9 sub-steps elsewhere in the file. Search for "Step 9" references.

**VALIDATE**:
```bash
# Read Step 9 and verify: integration check is item 9.1, state updates follow only on pass
```

---

### Step 3: UPDATE `.opencode/commands/build.md` — Add dispatch timeout fallback

**What**: Add a standard timeout/error fallback clause to dispatch calls in Steps 2, 5, and 7.

**IMPLEMENT**:

After the dispatch block in Step 2 (after line 167 approximately), add:

```markdown
   **If dispatch fails or times out:**
   - Fall back to the "If dispatch unavailable" path (write the plan inline).
   - Log: "Dispatch timed out for planning {spec-name} — falling back to inline planning."
```

After the dispatch block in Step 5 (after each dispatch call in the brief-completion loop), add:

```markdown
   **If dispatch fails or times out:**
   - Fall back to the "If dispatch unavailable" path (run `/execute` inline).
   - Log: "Dispatch timed out for execution — falling back to inline execution."
   - If inline execution also fails: STOP, report the error.
```

After the dispatch blocks in Step 7a (after each `batch-dispatch` / `dispatch` call), add:

```markdown
**If any dispatch/batch-dispatch fails or times out:**
- Fall back to the "If dispatch unavailable" path (self-review).
- Log: "Dispatch timed out for code review — falling back to self-review."
```

The pattern is the same for all three: on dispatch failure, fall back to the non-dispatch path. This makes the dispatch path a best-effort optimization, not a hard dependency.

**PATTERN**: The dual-path structure (dispatch available / unavailable) already exists in every step. The timeout fallback simply routes to the "unavailable" path on failure.

**IMPORTS**: N/A

**GOTCHA**: Do NOT add timeout fallback to Step 7d (final review panel) or Step 7e (T5 escalation) — those are the final quality gates where fallback to self-review would weaken the gate. If the final panel dispatch fails, STOP.

**VALIDATE**:
```bash
# Search build.md for "dispatch" calls and verify each has either:
# (a) an explicit timeout fallback to the non-dispatch path, or
# (b) a STOP on failure (for final gates)
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this task modifies a markdown command spec. Covered by manual testing in Level 5.

### Integration Tests
N/A

### Edge Cases

- **Step 4 commit fails on pre-commit hook**: Pipeline stops before execution — correct.
- **Step 9 integration check fails**: State NOT updated — spec stays `[ ]` in BUILD_ORDER. Next `/build next` re-picks the same spec.
- **Dispatch timeout in Step 2**: Falls back to inline planning. Plan quality may differ but pipeline continues.
- **Dispatch timeout in Step 7d final panel**: Pipeline STOPs — no fallback. Correct behavior for the quality gate.
- **Network outage kills all dispatches**: Every step falls back to inline. Pipeline runs entirely on the primary model.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Open build.md and verify valid markdown (no unclosed code blocks)
```

### Level 2: Type Safety
N/A — no type-checked code modified.

### Level 3: Unit Tests
N/A

### Level 4: Integration Tests
N/A — covered by Level 5 manual validation.

### Level 5: Manual Validation

1. Read Step 4 — verify commit failure stops pipeline
2. Read Step 9 — verify integration check is 9.1 (before state updates)
3. Search for all `dispatch(` calls in build.md — verify each has timeout fallback or explicit STOP
4. Verify no step proceeds past an unhandled failure
5. Cross-check: Step 9 renumbering doesn't break any references

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Step 4 has explicit commit failure handling (STOP, don't proceed to Step 5)
- [ ] Step 4 uses `git reset --hard HEAD` instead of `git stash` for rollback
- [ ] Step 9 integration check runs BEFORE state updates (renumbered to 9.1)
- [ ] Step 9 failure does NOT update BUILD_ORDER or build-state.json
- [ ] Step 2 dispatch has timeout fallback to inline planning
- [ ] Step 5 dispatch has timeout fallback to inline execution
- [ ] Step 7a dispatch has timeout fallback to self-review
- [ ] Steps 7d/7e dispatch failures STOP the pipeline (no weak fallback)

### Runtime (verify after testing/deployment)

- [ ] A failed integration check in Step 9 leaves the spec as `[ ]` in BUILD_ORDER
- [ ] A dispatch timeout in Step 2 produces a valid plan via inline fallback
- [ ] The pipeline never updates state after a failure

---

## HANDOFF NOTES

### Files Created/Modified
- `.opencode/commands/build.md` — Steps 4, 9 rewritten; dispatch timeout fallback added to Steps 2, 5, 7a

### Patterns Established
- **Verify-before-state pattern**: Run checks before updating state files. Applied to Step 9; should be applied anywhere state is written after a verification step.
- **Dispatch timeout fallback pattern**: On timeout, fall back to the non-dispatch path. Exception: final quality gates STOP instead.

### State to Carry Forward
- Step 9 is now renumbered (9.1=check, 9.2=BUILD_ORDER, 9.3=build-state, 9.4=Archon). Task 4 will reference build-state.json updates and must use the new numbering.

### Known Issues or Deferred Items
- None.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written
- [ ] Brief marked done: rename `task-2.md` → `task-2.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **Integration check first, then state**: The simplest fix for the state corruption gap. The alternative (write state optimistically + rollback on failure) was rejected — it's complex and error-prone.
- **Dispatch timeout falls back to inline**: Makes dispatch a best-effort optimization. The pipeline works without dispatch; dispatch just makes it faster and higher-quality.
- **No fallback for final quality gates**: Steps 7d and 7e are the last line of defense. Falling back to self-review here would defeat the purpose of multi-model review. Better to STOP and let the user investigate.

### Implementation Notes

- The rollback instruction in Step 4 was changed from `git stash` to `git reset --hard HEAD`. `git stash` doesn't reliably return to a specific commit point — it creates a stash entry that might be lost. `git reset --hard HEAD` returns to the exact plan commit.
- Step 9 renumbering means any future task adding sub-steps must use 9.5+ to avoid conflicts.
