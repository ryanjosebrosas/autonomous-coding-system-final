# Plan: build-pipeline-hardening

> **Feature**: `build-pipeline-hardening`
> **Plan Path**: `.agents/features/build-pipeline-hardening/plan.md`
> **Mode**: Task Briefs (5 briefs)
> **Date**: 2026-03-01

---

## Feature Description

Harden the `/build` command's internal pipeline logic to fix 6 Critical and 15 Major gaps found during deep gap analysis. The prior `build-autonomous-readiness` feature solved the execution loop and autonomy flags; this feature addresses error handling, artifact lifecycle, handoff writes, context checkpointing, review logic, and the `/execute` inline conflict.

## User Story

As a developer running `/build next`, I want every step in the pipeline to handle failures gracefully, write proper handoffs on interruption, manage `.done.md` artifacts correctly, and checkpoint progress so that context compaction or crashes mid-spec can be recovered from — instead of leaving the pipeline in an inconsistent state.

## Problem Statement

The `/build` command has 21 gaps across 6 categories that can cause silent failures, phantom pending work in `/prime`, lost progress on context compaction, or quality bypasses:

1. **Step 8 duplicates `/commit`** without its artifact sweep, handoff writes, or memory updates — `report.md` and `review.md` never get `.done.md`, the build-loop handoff path in `/commit` is dead code, and `git add` misses files not in `touches`.
2. **No error handling** for `git push` failure, `git commit` failure in Step 4, or dispatch timeouts. Step 9 updates state BEFORE the integration check passes, so a failed check leaves BUILD_ORDER claiming success.
3. **`/execute` inline conflict** — `/execute` says "end session" at Step 2.6 but `/build` needs to keep looping. `/execute` writes handoff mid-loop, confusing recovery.
4. **No per-step checkpoint** in `build-state.json` — context compaction loses track of which step was in progress within a spec.
5. **Review logic gaps** — Step 7e REJECT bypasses re-validation; Step 7b consensus gating has no non-dispatch fallback; backward repair is 6 lines with no concrete workflow.
6. **BUILD-ORDER-TEMPLATE** contradicts `/build`'s "every spec gets 700-1000 lines" policy.

## Solution Statement

Five targeted edits to existing files:

1. **Task 1** — Replace Step 8 with a delegation to `/commit`. Add a `/build`-context flag so `/commit` knows to use `build-loop-continuing` status, stage all spec-related files (not just `touches`), and push after commit. This single change fixes the artifact sweep, handoff, memory, and staging gaps.
2. **Task 2** — Add error handling to Steps 4, 8 (push), 9, and dispatch calls. Reorder Step 9 to run the integration check BEFORE updating state files.
3. **Task 3** — Add a `/build`-mode override to `/execute` that suppresses session-ending behavior and handoff writes when called inline from `/build`. Define the inline contract explicitly.
4. **Task 4** — Add per-step checkpointing to `build-state.json` and define explicit context compaction recovery instructions. Add handoff writes at every `/build` stop point.
5. **Task 5** — Fix Step 7e to re-validate after REJECT fix, add non-dispatch fallback to Step 7b, flesh out backward repair, and fix BUILD-ORDER-TEMPLATE contradiction.

---

## Feature Metadata

| Field | Value |
|-------|-------|
| **Complexity** | Standard |
| **Slice Guardrail** | 5 tasks, each editing 1-2 files |
| **Risk Level** | Low — all changes are additive edits to markdown command specs |
| **Confidence** | 8/10 — well-scoped edits with clear before/after, minor risk in `/execute` inline contract design |

---

## Context References

### Codebase Files

| File | Lines | Relevance |
|------|-------|-----------|
| `.opencode/commands/build.md` | 533-563 | Step 8 (Commit + Push) — replace with /commit delegation |
| `.opencode/commands/build.md` | 567-596 | Step 9 (Update State) — reorder integration check |
| `.opencode/commands/build.md` | 516-529 | Step 7e — REJECT bypasses validation |
| `.opencode/commands/build.md` | 435-464 | Step 7b — consensus gating, no non-dispatch fallback |
| `.opencode/commands/build.md` | 644-654 | Backward Repair — underspecified |
| `.opencode/commands/build.md` | 658-675 | Context Management — no per-step checkpoint |
| `.opencode/commands/build.md` | 245-260 | Step 4 (Commit Plan) — no error handling |
| `.opencode/commands/commit.md` | 43-53 | Artifact completion sweep |
| `.opencode/commands/commit.md` | 76-106 | Pipeline handoff write + build-loop awareness |
| `.opencode/commands/execute.md` | 182-219 | Task brief completion — "End session" directive |
| `.opencode/templates/BUILD-ORDER-TEMPLATE.md` | 50-56 | Complexity Guide — contradicts /build |

### Related Memories

No `memory.md` exists in this repo.

### Relevant Documentation

- `AGENTS.md` — `.done.md` lifecycle table, session model, handoff file spec
- `.agents/features/build-autonomous-readiness/plan.done.md` — Prior feature that added the brief-completion loop and autonomy flags (already applied)

---

## Patterns to Follow

### Pattern 1: `/commit` build-loop awareness (existing dead code to activate)

`commit.md:93` already has the build-loop path:

```markdown
If in a `/build` loop, set **Next Command** to `/build next` and **Status** to `build-loop-continuing`.
```

Currently dead code because `/build` does its own git ops. Task 1 activates this by delegating to `/commit`.

### Pattern 2: Error handling in `/execute` (existing)

`execute.md:178` shows the error handling pattern for failed execution:

```markdown
5. **If task execution failed** — do NOT rename the task file (no `.done.md`). Write handoff with **Status**: `blocked` and **Next Command**: `[manual intervention — task {N} failed]`. Report the failure and stop.
```

Task 2 follows this same pattern: on failure, don't update state, write blocked handoff, stop.

### Pattern 3: Handoff write structure (existing in /execute and /commit)

`execute.md:188-199` and `commit.md:78-89` both follow the same handoff template. Task 4 adds `/build`-specific handoff writes using the identical format.

---

## Implementation Plan

### Phase 1: Commit Delegation + Error Handling (Tasks 1-2)

Fix the commit/push/staging gaps and add error handling throughout. These are the highest-impact changes — Task 1 alone fixes 5 gaps.

### Phase 2: Execute Inline Contract (Task 3)

Define how `/execute` behaves when called inline from `/build` vs. standalone.

### Phase 3: Checkpointing + Handoff (Task 4)

Add per-step state tracking and handoff writes at all stop points.

### Phase 4: Review Logic + Template Fix (Task 5)

Fix the remaining review gaps, backward repair, and template contradiction.

---

## Step-by-Step Tasks (Summary)

### Task 1: Delegate Step 8 to `/commit` — activate build-loop path
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md` (Step 8)
- **IMPLEMENT**: Replace the custom git add/commit/push in Step 8 with a call to `/commit` with build-loop context. `/commit` already handles artifact sweeps, handoff writes, and memory updates. Add `git push` after `/commit` succeeds, with error handling.
- **VALIDATE**: Read updated build.md Step 8, verify it delegates to /commit and pushes with error handling.

### Task 2: Add error handling to Steps 4, 8 (push), 9 + dispatch timeouts
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md` (Steps 4, 9, dispatch calls)
- **IMPLEMENT**: Add git commit failure handling in Step 4. Reorder Step 9 to run integration check BEFORE marking spec complete. Add dispatch timeout fallback text to Steps 2, 5, 7.
- **VALIDATE**: Read updated build.md, verify each step has explicit failure handling.

### Task 3: Define `/execute` inline contract for `/build`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/execute.md` (Steps 2.5, 2.6)
- **IMPLEMENT**: Add a "Called from /build" override section: when `/execute` is invoked inline (not dispatched), suppress "End session" directive and handoff writes. `/build` owns the loop and handoff in inline mode.
- **VALIDATE**: Read updated execute.md, verify inline-from-build path is explicit.

### Task 4: Add per-step checkpoint + handoff writes to `/build`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md` (Context Management, Stop Conditions, Steps 10-11)
- **IMPLEMENT**: Expand `build-state.json` schema with `currentStep` and `currentSpec` fields. Add handoff writes at gate fail, error, interrupt, spec completion, and all-specs-done. Update Context Management with explicit compaction recovery instructions.
- **VALIDATE**: Read updated build.md, verify every stop condition writes a handoff, and build-state.json tracks current step.

### Task 5: Fix review logic + backward repair + template
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md` (Steps 7b, 7e, Backward Repair) + `.opencode/templates/BUILD-ORDER-TEMPLATE.md`
- **IMPLEMENT**: Fix Step 7e to re-run validation after REJECT fix. Add non-dispatch fallback to Step 7b. Expand backward repair from 6 lines to a concrete workflow. Update BUILD-ORDER-TEMPLATE complexity guide to match `/build` policy.
- **VALIDATE**: Read both files, verify all review paths have fallbacks and backward repair has concrete steps.

---

## Testing Strategy

### L1 Syntax/Format
- All modified files remain valid Markdown
- No broken links or unclosed code blocks

### L2 Structural Consistency
- Step 8 delegates to `/commit` correctly
- Step 9 integration check runs before state update
- Every step with a failure mode has explicit error handling
- `/execute` inline path suppresses session-ending cleanly
- `build-state.json` schema is consistent across all references
- Handoff writes use the standard template format

### L3 Cross-File Consistency
- `/build` Step 8 → `/commit` delegation is bidirectional (both files agree)
- `/execute` inline contract is referenced in both `/build` Step 5 and `/execute` Step 2.6
- BUILD-ORDER-TEMPLATE matches `/build` plan size policy
- Handoff status values match AGENTS.md recognized values

### L4 Integration (Manual)
- Trace through a complete spec lifecycle on paper: Step 1-11 with all new error paths
- Verify context compaction recovery: read build-state.json, determine correct resume point
- Verify `/prime` pending work detection handles all new handoff statuses

### L5 Manual Review
- Read all modified files end-to-end
- Verify no unintended changes to existing behavior

---

## Validation Commands

```
L1: N/A — Markdown files, no linter
L2: Manual review — read each file, verify structural consistency
L3: Grep for stale patterns — verify no orphaned references
L4: Paper trace through spec lifecycle with new error paths
L5: Human review of all changes
```

---

## Acceptance Criteria

### Implementation

- [x] `/build` Step 8 delegates to `/commit` instead of custom git ops
- [x] `/commit` build-loop path is activated (no longer dead code)
- [x] `git push` has explicit error handling (retry once, then stop)
- [x] Step 4 `git commit` failure is handled (stop, don't proceed to execute)
- [x] Step 9 runs integration check BEFORE updating state
- [x] Dispatch timeout fallback is specified in Steps 2, 5, 7
- [x] `/execute` has explicit inline-from-build override
- [x] `build-state.json` tracks `currentStep` and `currentSpec`
- [x] Handoff file is written at every `/build` stop point
- [x] Step 7e REJECT fix includes re-validation before commit
- [x] Step 7b has non-dispatch fallback for consensus gating
- [x] Backward repair has concrete workflow (file paths, git conventions, review)
- [x] BUILD-ORDER-TEMPLATE complexity guide matches `/build` plan size policy

### Runtime

- [ ] A `/build` crash mid-Step-7 can be recovered via `/prime` → handoff
- [ ] `/prime` correctly surfaces `/build` pipeline state from handoff
- [ ] Context compaction mid-spec resumes at the correct step
- [ ] `report.md` gets `.done.md` after spec commit (via `/commit` delegation)

---

## Completion Checklist

- [x] All 5 task briefs executed
- [x] All acceptance criteria checked
- [x] Execution report written
- [x] No regressions in existing command behavior

---

## Notes

### Key Decisions

1. **Delegate to `/commit` rather than duplicate**: The highest-leverage fix. `/commit` already has artifact sweeps, handoff writes, memory updates, and build-loop awareness. Duplicating this in `/build` Step 8 was the root cause of 5+ gaps.

2. **Inline contract via explicit override, not caller detection**: Add a clear "When called inline from `/build`" section to `/execute` rather than having `/execute` try to detect its caller. Explicit is better than implicit.

3. **Per-step checkpoint in `build-state.json`**: Adding `currentStep` and `currentSpec` fields lets any session resume mid-spec after compaction. The alternative (full checkpoint files per step) was rejected as overkill for markdown command files.

### Risks

1. **`/commit` delegation changes the git staging scope**: `/commit` uses `git add -- src/ tests/` as fallback instead of `/build`'s `git add -- {touches}`. This is actually better (catches files not in `touches`), but could stage unrelated changes. Mitigated by scoping to the current spec's feature directory + touched files.

2. **`/execute` inline override adds a conditional path**: Could be misread by agents. Mitigated by clear formatting ("When called inline from `/build`:" with explicit behavioral differences listed).

### Confidence

**8/10** — All changes are well-scoped edits to markdown files with clear patterns to follow. The `/execute` inline contract is the riskiest piece (two commands must agree on behavior), but explicit documentation minimizes ambiguity.

---

## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.done.md` | Delegate Step 8 to `/commit` — activate build-loop path | done | 0 created, 1 modified |
| 2 | `task-2.done.md` | Error handling for Steps 4, 9, dispatch timeouts | done | 0 created, 1 modified |
| 3 | `task-3.done.md` | Define `/execute` inline contract for `/build` | done | 0 created, 1 modified |
| 4 | `task-4.done.md` | Per-step checkpoint + handoff writes | done | 0 created, 1 modified |
| 5 | `task-5.done.md` | Review logic + backward repair + template fix | done | 0 created, 2 modified |
