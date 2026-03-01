# Task 2 of 5: Remove `/final-review` from Mandatory Pipeline + Fix `/code-loop` Handoff

> **Feature**: `autonomous-loop-fixes`
> **Brief Path**: `.agents/features/autonomous-loop-fixes/task-2.md`
> **Plan Overview**: `.agents/features/autonomous-loop-fixes/plan.md`

---

## OBJECTIVE

Remove `/final-review` from the mandatory pipeline so `/code-loop` hands off directly to `/commit`, eliminating the phantom step that creates an infinite handoff loop. Also fix the `/code-review-fix` stale artifact path.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/code-loop.md` | UPDATE | Replace all `/final-review` references with `/commit`, fix status `ready-for-review` → `ready-to-commit` |
| `.opencode/commands/code-review-fix.md` | UPDATE | Fix artifact save path from `.agents/reviews/` → `.agents/features/{feature}/` |

**Out of Scope:**
- `.opencode/commands/final-review.md` itself — it stays as an optional standalone command (users can still invoke it manually)
- AGENTS.md updates — handled in Task 5
- `/prime` changes — handled in Task 1

**Dependencies:**
- Task 1 must complete first — `/prime` now recognizes `ready-to-commit` (which this task will write)

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Task(s):**
- `.opencode/commands/prime.md` — Status list extended from 6→11 entries, Pending Work displays extended. `/prime` now recognizes `ready-to-commit` which this task will write from `/code-loop`.

**State Carried Forward:**
- All 11 statuses are now recognized by `/prime`. This task changes what `/code-loop` writes.

**Known Issues or Deferred Items:**
- None from Task 1.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/code-loop.md` (all 302 lines) — Why: every `/final-review` reference must be found and replaced
- `.opencode/commands/code-review-fix.md` (lines 146-165) — Why: handoff write and stale artifact path
- `.opencode/commands/final-review.md` (lines 1-20) — Why: confirm it has no handoff write (validates our design decision)

### Patterns to Follow

**Handoff write pattern** (from `code-loop.md:218-227`):
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /code-loop
- **Feature**: {feature}
- **Next Command**: {depends on mode}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: {depends on mode}
```

---

## STEP-BY-STEP TASKS

---

### Step 1: UPDATE `.opencode/commands/code-loop.md` — Fix the purpose/next-step description

**What**: Replace the line that says "Run `/final-review`" with direct `/commit` guidance.

**IMPLEMENT**:

Current (line 16 of `.opencode/commands/code-loop.md`):
```
**Next step after clean exit:** Run `/final-review` to summarize all changes and get human approval, then `/commit`.
```

Replace with:
```
**Next step after clean exit:** Run `/commit` to commit changes, then `/pr` to create a pull request.
```

**PATTERN**: Same line format, just different command references.

**IMPORTS**: N/A

**GOTCHA**: This is a documentation line, not a programmatic instruction. But it sets expectations for the LLM executing `/code-loop`, so accuracy matters.

**VALIDATE**:
```bash
# Search code-loop.md for "final-review" — should find fewer occurrences after this step
```

---

### Step 2: UPDATE `.opencode/commands/code-loop.md` — Fix `--auto-commit` description

**What**: Update the `--auto-commit` flag description to remove `/final-review` reference.

**IMPLEMENT**:

Current (line 33 of `.opencode/commands/code-loop.md`):
```
- `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), skip `/final-review` and run `/commit` directly. Useful for autonomous pipelines where human approval is not needed.
```

Replace with:
```
- `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), run `/commit` automatically within this session instead of handing off. Useful for autonomous pipelines.
```

**PATTERN**: Same bullet point format.

**IMPORTS**: N/A

**GOTCHA**: The semantic change is: without `--auto-commit`, `/code-loop` now hands off to `/commit` (next session). With `--auto-commit`, it runs `/commit` in the same session. Previously the distinction was `/final-review` vs skip-it.

**VALIDATE**:
```bash
# Verify line 33 no longer references /final-review
```

---

### Step 3: UPDATE `.opencode/commands/code-loop.md` — Fix Loop Exit Conditions table

**What**: Update the exit conditions table to point to `/commit` instead of `/final-review`.

**IMPLEMENT**:

Current (lines 163-168 of `.opencode/commands/code-loop.md`):
```
| Condition | Action |
|-----------|--------|
| 0 issues + validation passes (no `--auto-commit`) | → Hand off to `/final-review` |
| 0 issues + validation passes (`--auto-commit`) | → Run `/commit` directly, skip `/final-review` |
| Only Minor issues | → Fix if quick and safe; otherwise ask user whether to defer |
| Unfixable error detected | → Stop, report what's blocking |
```

Replace with:
```
| Condition | Action |
|-----------|--------|
| 0 issues + validation passes (no `--auto-commit`) | → Hand off to `/commit` (next session) |
| 0 issues + validation passes (`--auto-commit`) | → Run `/commit` directly in this session |
| Only Minor issues | → Fix if quick and safe; otherwise ask user whether to defer |
| Unfixable error detected | → Stop, report what's blocking |
```

**PATTERN**: Same table format.

**IMPORTS**: N/A

**GOTCHA**: None.

**VALIDATE**:
```bash
# Verify the exit conditions table has no /final-review references
```

---

### Step 4: UPDATE `.opencode/commands/code-loop.md` — Fix handoff report status line

**What**: Replace the status line that references `/final-review`.

**IMPLEMENT**:

Current (line 209 of `.opencode/commands/code-loop.md`):
```
   Status: {if --auto-commit: "Auto-committing" | else: "Ready for /final-review"}
```

Replace with:
```
   Status: {if --auto-commit: "Auto-committing" | else: "Ready for /commit"}
```

**PATTERN**: Same conditional format.

**IMPORTS**: N/A

**GOTCHA**: None.

**VALIDATE**:
```bash
# Verify line ~209 says "Ready for /commit"
```

---

### Step 5: UPDATE `.opencode/commands/code-loop.md` — Fix handoff instructions (items 2-3)

**What**: Replace the instructions that tell the user to run `/final-review` with `/commit`.

**IMPLEMENT**:

Current (lines 212-215 of `.opencode/commands/code-loop.md`):
```
2. **If `--auto-commit`:** Run `/commit` directly. Skip `/final-review`. After commit succeeds, update handoff to point at `/pr`.

3. **If no `--auto-commit`:** Tell the user to run `/final-review` for a summary + approval gate, then `/commit`.
   - Do NOT auto-commit. The user must approve via `/final-review` first.
```

Replace with:
```
2. **If `--auto-commit`:** Run `/commit` directly in this session. After commit succeeds, update handoff to point at `/pr`.

3. **If no `--auto-commit`:** Tell the user to run `/commit` in the next session.
   - Do NOT auto-commit. The user reviews the code-loop output and commits when ready.
```

**PATTERN**: Same numbered list format.

**IMPORTS**: N/A

**GOTCHA**: The key semantic change: without `--auto-commit`, the pipeline now hands off to `/commit` (which is a real pipeline command that writes its own handoff) instead of `/final-review` (which wrote nothing).

**VALIDATE**:
```bash
# Verify lines ~212-215 have no /final-review references
```

---

### Step 6: UPDATE `.opencode/commands/code-loop.md` — Fix handoff write template

**What**: Update the handoff write to use `ready-to-commit` instead of `ready-for-review`, and `/commit` instead of `/final-review`.

**IMPLEMENT**:

Current (lines 217-227 of `.opencode/commands/code-loop.md`):
```
4. **Pipeline Handoff Write** (required): Overwrite `.agents/context/next-command.md`:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /code-loop
   - **Feature**: {feature}
   - **Next Command**: {if --auto-commit and commit succeeded: "/pr {feature}" | if --auto-commit and commit failed: "/commit" | else: "/final-review"}
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: {if committed: "ready-for-pr" | else: "ready-for-review"}
   ```
```

Replace with:
```
4. **Pipeline Handoff Write** (required): Overwrite `.agents/context/next-command.md`:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /code-loop
   - **Feature**: {feature}
   - **Next Command**: {if --auto-commit and commit succeeded: "/pr {feature}" | if --auto-commit and commit failed: "/commit" | else: "/commit"}
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: {if committed: "ready-for-pr" | else: "ready-to-commit"}
   ```
```

**PATTERN**: Same handoff template format used by all pipeline commands.

**IMPORTS**: N/A

**GOTCHA**: Two changes in this block: (1) Next Command default changes from `/final-review` to `/commit`. (2) Status changes from `ready-for-review` to `ready-to-commit`. The `ready-for-review` value was never in AGENTS.md's enum — `ready-to-commit` is the correct canonical value, now recognized by `/prime` after Task 1.

**VALIDATE**:
```bash
# Search code-loop.md for "final-review" — should find 0 occurrences
# Search code-loop.md for "ready-for-review" — should find 0 occurrences
```

---

### Step 7: UPDATE `.opencode/commands/code-review-fix.md` — Fix stale artifact save path

**What**: Change the fix report save path from `.agents/reviews/` to `.agents/features/{feature}/`.

**IMPLEMENT**:

Current (line 165 of `.opencode/commands/code-review-fix.md`):
```
Save to: `.agents/reviews/{feature}-fix-report.md`
```

Replace with:
```
Save to: `.agents/features/{feature}/fix-report.md`
```

**PATTERN**: Follows canonical artifact path used by all other commands: `.agents/features/{feature}/{artifact}.md`.

**IMPORTS**: N/A

**GOTCHA**: The filename changes too: from `{feature}-fix-report.md` (feature prefix in name) to `fix-report.md` (no prefix, since the feature is the directory). This matches the pattern of `report.md`, `review.md`, etc.

**VALIDATE**:
```bash
# Search code-review-fix.md for ".agents/reviews/" — should find 0 occurrences
# Verify the new path matches the canonical pattern: .agents/features/{feature}/fix-report.md
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this task modifies markdown command specs.

### Integration Tests
N/A — no executable code modified.

### Edge Cases
- `/code-loop` with `--auto-commit` flag — should still commit directly and write `ready-for-pr` (unchanged behavior)
- `/code-loop` without `--auto-commit` — now writes `ready-to-commit` and points to `/commit` (changed behavior)
- `/code-review-fix` artifact — now saves to canonical path under `.agents/features/{feature}/`

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Verify both modified files are valid markdown
```

### Level 2-4: N/A

### Level 5: Manual Validation

1. Open `code-loop.md` and search for "final-review" — should find 0 occurrences
2. Open `code-loop.md` and search for "ready-for-review" — should find 0 occurrences
3. Verify the handoff template at ~line 224 writes `/commit` as default Next Command
4. Verify the handoff template at ~line 226 writes `ready-to-commit` as default Status
5. Open `code-review-fix.md` and verify the save path at ~line 165 is `.agents/features/{feature}/fix-report.md`
6. Search `code-review-fix.md` for `.agents/reviews/` — should find 0 occurrences

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Zero occurrences of `/final-review` in `code-loop.md`
- [ ] Zero occurrences of `ready-for-review` in `code-loop.md`
- [ ] `/code-loop` handoff default Next Command is `/commit`
- [ ] `/code-loop` handoff default Status is `ready-to-commit`
- [ ] `code-review-fix.md` save path is `.agents/features/{feature}/fix-report.md`
- [ ] Zero occurrences of `.agents/reviews/` in `code-review-fix.md`

### Runtime (verify after testing/deployment)

- [ ] After `/code-loop` exits clean (no `--auto-commit`), `/prime` shows "ready to commit: /commit"
- [ ] After `/code-review-fix` runs, fix report is saved under `.agents/features/{feature}/`

---

## HANDOFF NOTES

### Files Created/Modified
- `.opencode/commands/code-loop.md` — Removed all `/final-review` references (7 locations), changed status from `ready-for-review` to `ready-to-commit`
- `.opencode/commands/code-review-fix.md` — Fixed artifact path from `.agents/reviews/` to `.agents/features/{feature}/`

### Patterns Established
- `/final-review` is no longer in the mandatory pipeline — it remains as an optional standalone command
- All artifact paths now use the canonical `.agents/features/{feature}/` directory

### State to Carry Forward
- The status value `ready-to-commit` is now written by both `/code-review` (0 issues) and `/code-loop` (clean exit without `--auto-commit`)
- Task 5 will update AGENTS.md to reflect `/final-review`'s new optional status

### Known Issues or Deferred Items
- `.opencode/commands/final-review.md` still references stale paths (`.agents/reviews/`, `.agents/reports/loops/`). This is a low-priority cleanup since `/final-review` is now optional. Not in scope for this feature.

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
