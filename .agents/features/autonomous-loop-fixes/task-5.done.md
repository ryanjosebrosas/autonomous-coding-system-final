# Task 5 of 5: Align AGENTS.md Session Model, Command Table, Feature Name Propagation

> **Feature**: `autonomous-loop-fixes`
> **Brief Path**: `.agents/features/autonomous-loop-fixes/task-5.md`
> **Plan Overview**: `.agents/features/autonomous-loop-fixes/plan.md`

---

## OBJECTIVE

Update AGENTS.md to reflect all pipeline fixes: confirm the status enum is complete, clarify the `/commit → /pr` same-session model, add `/final-review` as optional, and document feature name canonical source.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `AGENTS.md` | UPDATE | Status enum (line 77), session model (lines 89-97), Key Commands table (lines 128-141), add feature name propagation rule |

**Out of Scope:**
- Individual command files — already fixed in Tasks 1-4
- `.opencode/commands/final-review.md` — stays as-is (optional standalone)
- Template files — already fixed in Task 4

**Dependencies:**
- Tasks 1-4 must complete first — this task documents the final state of all fixes

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Task(s):**
- `.opencode/commands/prime.md` — (Task 1) Status list 6→11, Pending Work display extended
- `.opencode/commands/code-loop.md` — (Task 2) `/final-review` removed, status `ready-to-commit`
- `.opencode/commands/code-review-fix.md` — (Task 2) Artifact path fixed
- `.opencode/commands/commit.md` — (Task 3) Failure handoff added
- `.opencode/commands/pr.md` — (Task 3) Failure handoff added
- `.opencode/commands/code-review.md` — (Task 3) Failure handoff added
- `.opencode/commands/execute.md` — (Task 4) Rename deduped, report append mode
- `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` — (Task 4) Per-task sections added

**State Carried Forward:**
- All pipeline commands now write recognized statuses
- All pipeline commands handle success and failure handoffs
- `/final-review` is removed from the mandatory pipeline but still exists as a command file
- `report.md` now supports multi-task append mode

**Known Issues or Deferred Items:**
- `/final-review.md` still references stale paths internally — low priority cleanup, not in this feature's scope

---

## CONTEXT REFERENCES

### Files to Read

- `AGENTS.md` (lines 50-115) — Why: the sections being modified (lifecycle table, handoff contract, session model)
- `AGENTS.md` (lines 128-141) — Why: Key Commands table

### Patterns to Follow

**Status enum format** (from `AGENTS.md:77`):
```
**Status** | Pipeline state (awaiting-execution, executing-tasks, ...)
```
Comma-separated list in a table cell.

**Session model format** (from `AGENTS.md:89-97`):
```
Session 1:  /prime → /planning {feature}                         → END
```
Fixed-width alignment with arrow notation.

---

## STEP-BY-STEP TASKS

---

### Step 1: UPDATE `AGENTS.md` — Verify status enum is complete

**What**: Confirm the status enum on line 77 includes all 11 statuses. It should already be correct — this step is a verification, not a change.

**IMPLEMENT**:

Current (line 77 of `AGENTS.md`):
```
| **Status** | Pipeline state (awaiting-execution, executing-tasks, executing-series, awaiting-review, awaiting-fixes, awaiting-re-review, ready-to-commit, ready-for-pr, pr-open, blocked, build-loop-continuing) |
```

This line already has all 11 statuses. **No change needed.** Verify it matches what `/prime` now recognizes (from Task 1).

**PATTERN**: N/A — verification only.

**IMPORTS**: N/A

**GOTCHA**: If this line was modified during prior work, verify it still has all 11 statuses. Do not accidentally remove any.

**VALIDATE**:
```bash
# Count the comma-separated status values on AGENTS.md line 77 — should be exactly 11
```

---

### Step 2: UPDATE `AGENTS.md` — Clarify session model for /commit + /pr

**What**: The session model shows `/commit → /pr` in the same session (line 96). This is intentional — clarify it with a comment.

**IMPLEMENT**:

Current (lines 95-96 of `AGENTS.md`):
```
Session N+2:/prime → /code-loop {feature}                        → END
Session N+3:/prime → /commit → /pr                               → END
```

Replace with:
```
Session N+2:/prime → /code-loop {feature}                        → END
Session N+3:/prime → /commit → /pr                               → END (both in same session)
```

**PATTERN**: Same fixed-width format. The `(both in same session)` note matches the existing `(plan.md + task-N.md files written)` annotation style on line 91.

**IMPORTS**: N/A

**GOTCHA**: Apply the same change to the master plan flow diagram too (line 106).

**VALIDATE**:
```bash
# Verify both session model diagrams (task brief and master plan) have the "(both in same session)" annotation
```

---

### Step 3: UPDATE `AGENTS.md` — Same change for master plan flow

**What**: Apply the same `/commit → /pr` clarification to the master plan session model.

**IMPLEMENT**:

Current (lines 105-106 of `AGENTS.md`):
```
Session 5:  /prime → /code-loop {feature}                        → END
Session 6:  /prime → /commit → /pr                               → END
```

Replace with:
```
Session 5:  /prime → /code-loop {feature}                        → END
Session 6:  /prime → /commit → /pr                               → END (both in same session)
```

**PATTERN**: Same as Step 2.

**IMPORTS**: N/A

**GOTCHA**: None.

**VALIDATE**:
```bash
# Verify line 106 has the annotation
```

---

### Step 4: UPDATE `AGENTS.md` — Add `/final-review` to Key Commands table as optional

**What**: Add `/final-review` to the command table so it's discoverable, but mark it as optional/standalone.

**IMPLEMENT**:

Current (lines 128-141 of `AGENTS.md`):
```
## Key Commands

| Command | Purpose |
|---------|---------|
| `/prime` | Load codebase context at session start |
| `/planning {feature}` | Create structured implementation plan |
| `/execute {plan}` | Implement from plan |
| `/build` | Guided feature implementation with /pillars |
| `/code-review` | Technical code review |
| `/code-loop` | Automated review → fix → commit cycle |
| `/system-review` | Divergence analysis (plan vs implementation) |
| `/commit` | Conventional git commit |
| `/sync` | Check Archon sync status |

---
```

Replace with:
```
## Key Commands

| Command | Purpose |
|---------|---------|
| `/prime` | Load codebase context at session start |
| `/planning {feature}` | Create structured implementation plan |
| `/execute {plan}` | Implement from plan |
| `/build` | Guided feature implementation with /pillars |
| `/code-review` | Technical code review |
| `/code-loop` | Automated review → fix → commit cycle |
| `/system-review` | Divergence analysis (plan vs implementation) |
| `/commit` | Conventional git commit |
| `/pr` | Create pull request from feature commits |
| `/sync` | Check Archon sync status |
| `/final-review` | Optional: human approval gate before commit |
| `/code-review-fix` | Apply fixes from code review findings |

---
```

**PATTERN**: Same table format. `/pr` was also missing and is added. Optional commands are marked with "Optional:" prefix.

**IMPORTS**: N/A

**GOTCHA**: `/pr` was already missing from the table (it's a real pipeline command used in every session model diagram). Adding it here alongside `/final-review` and `/code-review-fix` makes the table complete.

**VALIDATE**:
```bash
# Count rows in the Key Commands table — should be 12 (was 9)
# Verify /final-review row says "Optional:"
# Verify /pr is present
```

---

### Step 5: UPDATE `AGENTS.md` — Add feature name canonical source rule

**What**: Add a rule documenting how feature names propagate through the pipeline, with the handoff file as the canonical source.

**IMPLEMENT**:

After line 79 of `AGENTS.md` (after "The handoff file is NOT a log..." paragraph), add:

```

#### Feature Name Propagation

The **Feature** field in the handoff file is the canonical source for feature names. All pipeline commands must:
1. **Read** the Feature field from `.agents/context/next-command.md` first
2. **Fall back** to derivation (commit scope, report path, directory name) only if the handoff is missing or stale
3. **Write** the same Feature value to the handoff when completing

This ensures consistent feature names across sessions. If a command derives a feature name from a fallback source, it must match the handoff value. If they conflict, the handoff value wins.
```

**PATTERN**: Follows the existing paragraph style in the Pipeline Handoff File section.

**IMPORTS**: N/A

**GOTCHA**: This is a documentation addition, not a code change. Individual commands already have fallback chains — this rule establishes the priority order that all commands should follow.

**VALIDATE**:
```bash
# Verify AGENTS.md has a "Feature Name Propagation" subsection after the handoff file section
# Verify it specifies: handoff first, derivation fallback, write-back
```

---

### Step 6: UPDATE `AGENTS.md` — Add key rule about session termination

**What**: Add a key rule clarifying that `/commit → /pr` runs in the same session (the handoff from `/commit` is consumed by `/pr` immediately, not by the next `/prime`).

**IMPLEMENT**:

After line 115 of `AGENTS.md` (after the last key rule "If a session crashes..."), add:

```
- `/commit → /pr` runs in the same session when they are the final pipeline step. `/commit` writes a `ready-for-pr` handoff, but `/pr` runs immediately after (not in a separate session). If `/pr` fails, its failure handoff persists for the next `/prime` session.
```

**PATTERN**: Follows the existing bullet-point format of key rules at lines 109-115.

**IMPORTS**: N/A

**GOTCHA**: This clarifies the apparent contradiction between the session model diagram (same session) and the handoff write (which looks like separate sessions). The handoff exists for crash recovery — if `/commit` succeeds but `/pr` fails, the handoff guides the next session to retry `/pr`.

**VALIDATE**:
```bash
# Verify the new key rule appears after the existing rules
# Verify it mentions "same session" and crash recovery
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this task modifies markdown system documentation.

### Integration Tests
N/A — no executable code modified.

### Edge Cases
- AGENTS.md status enum already has all 11 values — Step 1 is verification only
- `/final-review` is marked optional — users can still invoke it manually
- Feature name conflicts between handoff and derivation — handoff wins per new rule

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Verify AGENTS.md is valid markdown with no broken tables or formatting
```

### Level 2-4: N/A

### Level 5: Manual Validation

1. Open `AGENTS.md` line 77 — verify 11 statuses in the enum
2. Verify both session model diagrams have "(both in same session)" on the `/commit → /pr` line
3. Verify Key Commands table has 12 rows including `/pr`, `/final-review` (optional), `/code-review-fix`
4. Verify "Feature Name Propagation" subsection exists with handoff-first rule
5. Verify new key rule about `/commit → /pr` same-session behavior
6. Cross-check: every status in AGENTS.md line 77 is recognized in `prime.md` (Task 1)
7. Cross-check: `/code-loop` handoff (Task 2) writes `ready-to-commit` which is in the AGENTS.md enum

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] AGENTS.md status enum has exactly 11 values (verified, no change needed)
- [ ] Both session model diagrams annotated with "(both in same session)"
- [ ] Key Commands table has `/pr`, `/final-review` (optional), `/code-review-fix`
- [ ] "Feature Name Propagation" subsection added with canonical source rule
- [ ] Key rule added: `/commit → /pr` same-session with crash recovery explanation
- [ ] No broken markdown formatting in AGENTS.md

### Runtime (verify after testing/deployment)

- [ ] AGENTS.md accurately reflects the full autonomous loop after all fixes
- [ ] New users reading AGENTS.md understand the complete pipeline flow
- [ ] Feature name propagation rule is actionable by executing agents

---

## HANDOFF NOTES

This is the final task — no handoff needed.

### Files Created/Modified
- `AGENTS.md` — Session model annotated, Key Commands table expanded, Feature Name Propagation rule added, same-session key rule added

### Summary of All Changes Across Feature

| Task | Files Modified | Key Change |
|------|---------------|------------|
| 1 | `prime.md` | Status list 6→11, Pending Work display 6→12 lines |
| 2 | `code-loop.md`, `code-review-fix.md` | `/final-review` removed from pipeline, artifact path fixed |
| 3 | `commit.md`, `pr.md`, `code-review.md` | Failure handoffs added to all three |
| 4 | `execute.md`, `EXECUTION-REPORT-TEMPLATE.md` | Rename deduped, report append mode |
| 5 | `AGENTS.md` | Session model, command table, feature name rule, same-session rule |

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Brief marked done: rename `task-5.md` → `task-5.done.md`
