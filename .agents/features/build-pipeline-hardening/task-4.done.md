# Task 4 of 5: Per-Step Checkpoint + Handoff Writes

> **Feature**: `build-pipeline-hardening`
> **Brief Path**: `.agents/features/build-pipeline-hardening/task-4.md`
> **Plan Overview**: `.agents/features/build-pipeline-hardening/plan.md`

---

## OBJECTIVE

Add per-step checkpointing to `build-state.json` and handoff writes at every `/build` stop point — so context compaction or crashes mid-spec can be recovered from, and `/prime` always knows the pipeline state.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/build.md` | UPDATE | `build-state.json` schema expanded; Context Management rewritten; handoff writes added at all stop points and spec transitions |

**Out of Scope:**
- `/prime` changes — `/prime` already reads the handoff file and detects `build-loop-continuing` status. No changes needed.
- `AGENTS.md` changes — the `build-loop-continuing` status is already documented.

**Dependencies:**
- Tasks 1-3 must complete first. Step 8 delegates to `/commit` (Task 1), error handling exists (Task 2), `/execute` inline contract defined (Task 3).

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Task(s):**
- `.opencode/commands/build.md` — Step 8 delegates to `/commit`; Steps 4/9 have error handling; dispatch timeout fallbacks added
- `.opencode/commands/execute.md` — Inline-from-build override added to Steps 2.4, 2.5, 2.6

**State Carried Forward:**
- Step 9 is renumbered (9.1=check, 9.2=BUILD_ORDER, 9.3=build-state, 9.4=Archon) from Task 2.
- `/commit` writes `build-loop-continuing` handoff when in build-loop context (activated by Task 1).
- `/execute` inline mode suppresses handoff writes — `/build` is responsible for handoffs.

**Known Issues or Deferred Items:**
- None from Tasks 1-3.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/build.md` (lines 567-596 — now renumbered by Task 2) — Why: Step 9 build-state.json schema to expand
- `.opencode/commands/build.md` (lines 658-675) — Why: Context Management section to rewrite
- `.opencode/commands/build.md` (lines 49-61) — Why: Stop Conditions table to add handoff behavior
- `.opencode/commands/build.md` (lines 100-121) — Why: Step 1 needs to read checkpoint for resume
- `AGENTS.md` (handoff status values) — Why: New statuses must be in the recognized list

### Current Content: build-state.json Schema (Step 9.3, formerly 9.2)

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

**Analysis**: No `currentStep` or `currentSpec` fields. If context compacts mid-spec (e.g., during Step 7 code review), recovery can only restart from Step 1 (re-pick the spec). Adding `currentStep` and `currentSpec` lets recovery resume at the exact step.

### Current Content: Context Management (Lines 658-675)

```markdown
## Context Management

For large projects with many specs, context window management is critical:

1. **Between specs:** Clear working context but preserve:
   - `build-state.json` (always read at Step 1)
   - `memory.md` (always read at Step 1)
   - Current pillar's completed spec list (for pattern reference)

2. **Within a spec:** Full context for that spec's plan + implementation

3. **Checkpoint system:** At the end of each spec, the state is fully captured in:
   - `.agents/specs/build-state.json` — what's done, patterns established
   - `.agents/specs/BUILD_ORDER.md` — checkboxes
   - `.agents/specs/PILLARS.md` — pillar status
   - Git history — every spec is a commit

If context compacts mid-spec: read `build-state.json` + current plan file to resume.
```

**Analysis**: "read `build-state.json` + current plan file to resume" is aspirational — there's no `currentStep` field to know which step to resume at. The model would start from Step 1, potentially re-executing already-completed steps (re-planning, re-committing plan).

### Current Content: Stop Conditions (Lines 49-61)

```markdown
## Stop Conditions

The autonomous loop stops ONLY when:

| Condition | Behavior |
|-----------|----------|
| **Gate PASSED** | Auto-continue to next pillar |
| **Gate FAILED** | STOP — report which criteria failed |
| **Unresolvable error** | STOP — after max retries exhausted, report what's blocking |
| **User interrupts** (Ctrl+C) | STOP — save checkpoint, report progress |
| **All specs complete** | STOP — project done, run `/ship` |

Gates that PASS trigger automatic continuation to the next pillar. Gates that FAIL always stop for review.
```

**Analysis**: "save checkpoint, report progress" is listed but no checkpoint mechanism is defined. And no stop condition writes a handoff file.

### Patterns to Follow

**Pattern: Handoff write in /commit** (from `commit.md:78-89`):
```markdown
### 5.5. Pipeline Handoff Write (required)

After successful commit, overwrite `.agents/context/next-command.md`:

```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /commit
- **Feature**: {feature}
- **Next Command**: /pr {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: ready-for-pr
```
```
- Why: Every handoff write follows this exact template format.
- How to apply: `/build` handoff writes use the same template with `/build`-specific statuses.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/commands/build.md` — Expand build-state.json schema

**What**: Add `currentSpec` and `currentStep` fields to the build-state.json schema in Step 9.3, and add update instructions at each step transition.

**IMPLEMENT**:

In Step 9.3 (the build-state.json update), replace the current JSON example with:

```json
{
  "lastSpec": "P1-02",
  "completed": ["P1-01", "P1-02"],
  "currentPillar": 1,
  "totalSpecs": 20,
  "currentSpec": null,
  "currentStep": null,
  "patternsEstablished": ["strict typing", "config pattern"],
  "decisionsLog": [
    {"spec": "P1-01", "decision": "Used X pattern", "reason": "Maintains compatibility"}
  ]
}
```

And add this note after the JSON:

```markdown
**`currentSpec` and `currentStep`**: Set at the START of each step, cleared (set to `null`) after spec completion. Used for context compaction recovery.

| Step | `currentStep` value |
|------|-------------------|
| Step 1 | `"pick"` |
| Step 2 | `"plan"` |
| Step 3 | `"plan-review"` |
| Step 4 | `"plan-commit"` |
| Step 5 | `"execute"` |
| Step 6 | `"validate"` |
| Step 7 | `"review"` |
| Step 8 | `"commit"` |
| Step 9 | `"update-state"` |
| Step 10 | `"gate-check"` |

At the start of each step, update `build-state.json`:
```bash
# Pseudocode — update the currentStep field
build-state.json.currentSpec = "{spec-name}"
build-state.json.currentStep = "{step-value}"
```

After Step 9 completes (spec fully done), clear both:
```bash
build-state.json.currentSpec = null
build-state.json.currentStep = null
```
```

**PATTERN**: Same JSON file, just two new fields.

**IMPORTS**: N/A

**GOTCHA**: The `currentStep` update is a lightweight write — just two fields. Do NOT rewrite the entire JSON on every step transition. Read, update two fields, write back.

**VALIDATE**:
```bash
# Read Step 9.3 and verify: JSON has currentSpec and currentStep fields
# Verify: step value table covers all 10 steps
```

---

### Step 2: UPDATE `.opencode/commands/build.md` — Rewrite Context Management

**What**: Replace the aspirational Context Management section with concrete recovery instructions that use `currentStep`.

**IMPLEMENT**:

Current (lines 658-675):
```markdown
## Context Management

For large projects with many specs, context window management is critical:

1. **Between specs:** Clear working context but preserve:
   - `build-state.json` (always read at Step 1)
   - `memory.md` (always read at Step 1)
   - Current pillar's completed spec list (for pattern reference)

2. **Within a spec:** Full context for that spec's plan + implementation

3. **Checkpoint system:** At the end of each spec, the state is fully captured in:
   - `.agents/specs/build-state.json` — what's done, patterns established
   - `.agents/specs/BUILD_ORDER.md` — checkboxes
   - `.agents/specs/PILLARS.md` — pillar status
   - Git history — every spec is a commit

If context compacts mid-spec: read `build-state.json` + current plan file to resume.
```

Replace with:
```markdown
## Context Management

For large projects with many specs, context window management is critical.

### Between Specs

Clear working context but preserve:
- `build-state.json` (always read at Step 1)
- `memory.md` (always read at Step 1)
- Current pillar's completed spec list (for pattern reference)

### Within a Spec

Full context for that spec's plan + implementation.

### Checkpoint System

State is captured at two granularities:

**Per-spec checkpoint** (after Step 9):
- `.agents/specs/build-state.json` — what's done, patterns established
- `.agents/specs/BUILD_ORDER.md` — checkboxes
- `.agents/specs/PILLARS.md` — pillar status
- Git history — every spec is a commit

**Per-step checkpoint** (every step transition):
- `build-state.json` fields `currentSpec` and `currentStep` — what spec and step are in progress

### Context Compaction Recovery

If context compacts mid-spec, follow this procedure:

1. Read `.agents/specs/build-state.json`. Check `currentSpec` and `currentStep`.
2. Read `.agents/context/next-command.md` for the latest handoff.
3. If `currentStep` is set:
   - **Steps 1-4** (pick through plan-commit): The plan may or may not be committed. Check `git log` for a plan commit. If committed, resume at Step 5. If not, restart at Step 2 (re-plan).
   - **Step 5** (execute): Check `.agents/features/{spec}/` for `.done.md` task briefs. Resume execution for remaining briefs.
   - **Steps 6-7** (validate/review): Re-run validation from Step 6. Prior review results are lost on compaction — re-review is safe.
   - **Steps 8-9** (commit/state): Check `git log` for a code commit. If committed, resume at Step 9. If not, resume at Step 8.
   - **Step 10** (gate): Re-run the gate check — it's idempotent.
4. If `currentStep` is null but `currentSpec` is set: spec was being picked. Start at Step 1.
5. If both are null: no spec in progress. Start at Step 1 (pick next).
```

**PATTERN**: The `/execute` recovery pattern (checking `.done.md` files) is reused for Step 5 recovery.

**IMPORTS**: N/A

**GOTCHA**: Steps 6-7 say "re-run validation from Step 6" — do NOT try to resume at Step 7 mid-review. Review state is in-memory and lost on compaction. Re-running from Step 6 is safe because validation and review are idempotent.

**VALIDATE**:
```bash
# Read Context Management section and verify:
# 1. Recovery instructions reference currentStep values from Step 1
# 2. Every step range has a concrete recovery action
# 3. The procedure is ordered (read state → check → resume)
```

---

### Step 3: UPDATE `.opencode/commands/build.md` — Add handoff writes at all stop points

**What**: Add handoff writes to the Stop Conditions section and at each spec transition (Step 11 loop, gate pass, gate fail, all-complete).

**IMPLEMENT**:

Replace the current Stop Conditions section (lines 49-61) with:

```markdown
## Stop Conditions

The autonomous loop stops ONLY when:

| Condition | Behavior | Handoff Status |
|-----------|----------|---------------|
| **Gate PASSED** | Auto-continue to next pillar | `build-loop-continuing` |
| **Gate FAILED** | STOP — report which criteria failed | `blocked` |
| **Unresolvable error** | STOP — after max retries exhausted | `blocked` |
| **User interrupts** (Ctrl+C) | STOP — save checkpoint | `blocked` |
| **All specs complete** | STOP — project done, run `/ship` | `ready-to-ship` |

**Every stop condition writes a handoff file.** No exception. The handoff is how `/prime` knows what happened and what to do next.

Gates that PASS write `build-loop-continuing` and auto-continue (no actual stop). Gates that FAIL always stop for review.
```

Then add a new section after Stop Conditions:

```markdown
## Handoff Writes

`/build` writes to `.agents/context/next-command.md` at these points:

**On spec loop (Step 11 → Step 1):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /build (spec {completed-spec} done)
- **Feature**: {next-spec-name}
- **Next Command**: /build next
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: build-loop-continuing
```

**On gate FAIL (Step 10):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /build (gate failed)
- **Feature**: {spec-name}
- **Next Command**: /build {spec-name}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```

**On unresolvable error (any step):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /build ({step} failed for {spec-name})
- **Feature**: {spec-name}
- **Next Command**: /build {spec-name}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```

**On all specs complete:**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /build (all specs complete)
- **Feature**: {project-name}
- **Next Command**: /ship
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: ready-to-ship
```

**On user interrupt (Ctrl+C):**
Write the same `blocked` handoff as unresolvable error, with the current spec and step. The per-step checkpoint in `build-state.json` captures exactly where to resume.

Note: Step 8 (`/commit`) writes its own `build-loop-continuing` handoff. `/build` does NOT overwrite it — `/commit`'s handoff is the correct state after a successful commit.
```

**PATTERN**: All handoff writes use the standard template from `commit.md:78-89`.

**IMPORTS**: N/A

**GOTCHA**: The `ready-to-ship` status is new — it's not in the current AGENTS.md recognized list. Add a note that AGENTS.md should be updated (but don't modify AGENTS.md in this task — it's out of scope).

**VALIDATE**:
```bash
# Read Stop Conditions and Handoff Writes sections
# Verify: every stop condition has a corresponding handoff template
# Verify: handoff statuses match recognized values (build-loop-continuing, blocked, ready-to-ship)
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — markdown command spec. Covered by Level 5.

### Integration Tests
N/A

### Edge Cases

- **Context compaction during Step 7 (review)**: Recovery re-runs from Step 6 (validation). Review results are lost but validation is idempotent.
- **Context compaction during Step 5 (execute)**: Recovery checks `.done.md` files to determine which briefs are complete. Resumes from the next undone brief.
- **Context compaction between Step 8 and Step 9**: Code is committed but state not updated. Recovery checks `git log` for the commit, then resumes at Step 9.
- **User interrupt during Step 2 (planning)**: Plan may be partially written. Recovery restarts at Step 2 (re-plan). The partial plan file is overwritten.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Open build.md and verify valid markdown
```

### Level 2: Type Safety
N/A

### Level 3: Unit Tests
N/A

### Level 4: Integration Tests
N/A

### Level 5: Manual Validation

1. Read `build-state.json` schema — verify `currentSpec` and `currentStep` fields present
2. Read Context Management — verify recovery procedure covers all step ranges
3. Read Stop Conditions — verify every condition has a handoff status column
4. Read Handoff Writes — verify every stop condition has a handoff template
5. Paper trace: simulate context compaction at Step 7 → verify recovery lands at Step 6
6. Paper trace: simulate user interrupt at Step 5 → verify handoff says `blocked` with correct spec

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] `build-state.json` schema includes `currentSpec` and `currentStep` fields
- [ ] Step value table maps all 10 steps to string values
- [ ] Context Management has concrete recovery instructions (not aspirational)
- [ ] Stop Conditions table has a Handoff Status column
- [ ] Handoff writes section has templates for: spec loop, gate fail, error, all-complete, interrupt
- [ ] `/commit`'s handoff is not overwritten by `/build` after Step 8
- [ ] `ready-to-ship` status is used for all-specs-complete

### Runtime (verify after testing/deployment)

- [ ] `/prime` can detect `/build` pipeline state from handoff file after any stop condition
- [ ] Context compaction recovery resumes at the correct step (not Step 1)
- [ ] build-state.json accurately tracks the current spec and step at any point during execution

---

## HANDOFF NOTES

### Files Created/Modified
- `.opencode/commands/build.md` — build-state.json schema expanded, Context Management rewritten with recovery procedure, Stop Conditions updated with handoff column, new Handoff Writes section

### Patterns Established
- **Per-step checkpointing pattern**: Update `currentStep` at the start of each step, clear on completion. Recovery reads this field.
- **Handoff-at-every-stop pattern**: Every stop condition writes a handoff. No exception.

### State to Carry Forward
- `ready-to-ship` is a new handoff status. AGENTS.md should be updated to include it in the recognized status list (Task 5 could note this, or it can be a follow-up).
- The recovery procedure references step value strings ("pick", "plan", "execute", etc.). These must stay in sync with the table in Step 9.3.

### Known Issues or Deferred Items
- AGENTS.md doesn't list `ready-to-ship` as a recognized status yet. It works functionally (handoff file is read by `/prime`), but the documentation is incomplete. Flag for a follow-up edit.

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

---

## NOTES

### Key Design Decisions (This Task)

- **Lightweight checkpointing**: Two fields in an existing JSON file rather than separate checkpoint files per step. Keeps the mechanism simple and avoids file proliferation.
- **Idempotent recovery**: Steps 6-7 (validate/review) are re-run from Step 6 on compaction. This is safe because validation and review are side-effect-free reads + checks. Re-running them wastes some time but never produces incorrect state.
- **`/commit`'s handoff is authoritative after Step 8**: `/build` doesn't overwrite the handoff after Step 8. `/commit` writes `build-loop-continuing` as the correct post-commit state. `/build` writes a new handoff only when transitioning to the next spec (Step 11).

### Implementation Notes

- The `currentStep` update should be done by reading build-state.json, updating the two fields, and writing it back. Do NOT rewrite the entire file — preserve all existing fields.
- The recovery procedure in Context Management is designed for the model to follow sequentially. Each step range has exactly one action ("resume at Step X" or "restart at Step Y").
