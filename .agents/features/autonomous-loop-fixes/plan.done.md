# Autonomous Loop Fixes — Implementation Plan

## Feature Description

Fix 7 gaps in the autonomous session loop pipeline that cause broken handoffs, stale state, data loss, and ambiguous routing between `/prime`, `/execute`, `/code-loop`, `/commit`, and `/pr`.

## User Story

As a user running the autonomous pipeline (`/prime` → one command → END), I want every pipeline state to be recognized and routed correctly, so that `/prime` always tells me the right next command and no data is lost between sessions.

## Problem Statement

The autonomous loop has critical gaps:
1. `/prime` only recognizes 6 of 11 status values — after `/commit`, `/code-review`, or `/code-loop`, `/prime` cannot route correctly
2. `/code-loop` hands off to `/final-review` which writes no handoff, creating an infinite loop
3. Commands that fail leave stale handoffs with no failure indication
4. Multi-task execution overwrites `report.md` each session, destroying prior task reports
5. AGENTS.md says `/commit` + `/pr` run in one session, but `/commit` writes a handoff implying separate sessions
6. `.done.md` renames are duplicated between Steps 2.6 and 6.6 in `execute.md`
7. Feature name is derived independently by each command with different fallback chains

## Solution Statement

Direct, targeted edits to 6 existing files. No new files, no structural changes. Each fix is a precise text replacement at known line numbers, closing the gap between what commands write and what `/prime` reads.

## Feature Metadata

- Depth: standard
- Dependencies: none (all edits are to system config files, no code)
- Estimated tasks: 5

## Context References

### Codebase Files

- `.opencode/commands/prime.md` (lines 189-195) — Status recognition list (6 of 11)
- `.opencode/commands/prime.md` (lines 239-248, 292-301) — Pending Work display templates
- `.opencode/commands/code-loop.md` (lines 16, 165, 209, 212-215, 224-226) — `/final-review` references and handoff
- `.opencode/commands/execute.md` (lines 186, 346) — Duplicate `.done.md` rename
- `.opencode/commands/execute.md` (lines 331-332, 377) — `report.md` write path (no per-task support)
- `.opencode/commands/commit.md` (lines 76-93) — Handoff write with no failure path
- `.opencode/commands/pr.md` (lines 252-267) — Handoff write with no failure path
- `.opencode/commands/code-review.md` (lines 190-201) — Handoff write with no failure path
- `.opencode/commands/code-review-fix.md` (line 165) — Stale artifact path `.agents/reviews/`
- `AGENTS.md` (lines 77, 89-97, 128-141) — Status enum, session model, command table

### Patterns to Follow

**Handoff write pattern** (from `execute.md:148-158`):
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /execute (phase {N} of {total})
- **Feature**: {feature}
- **Next Command**: /execute .agents/features/{feature}/plan-master.md
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: executing-series
```
All handoff writes follow this exact format. New failure handoffs must match it.

**Status recognition pattern** (from `prime.md:190`):
```
- `awaiting-execution` — plan written, no execution started
```
All status entries in the recognized list follow: `- \`{status}\` — {description}`.

## Implementation Plan

### Phase 1: Pipeline State (Tasks 1-2)
Fix what `/prime` recognizes and remove the `/final-review` phantom from the mandatory pipeline.

### Phase 2: Resilience (Tasks 3-4)
Add failure handoffs and fix report overwrite/rename duplication.

### Phase 3: Consistency (Task 5)
Align AGENTS.md session model and add canonical feature name propagation.

## Step-by-Step Tasks (Summary)

### Task 1: Add missing statuses to `/prime`
- **ACTION**: UPDATE `.opencode/commands/prime.md`
- **TARGET**: Lines 189-195 (status list) and lines 239-248, 292-301 (Pending Work display)
- **Scope**: Add 6 missing status values + corresponding display lines

### Task 2: Remove `/final-review` from mandatory pipeline, fix `/code-loop` handoff
- **ACTION**: UPDATE `.opencode/commands/code-loop.md`
- **TARGET**: Lines 16, 33, 165-166, 209, 212-215, 224-226
- **Scope**: Replace `/final-review` with `/commit` as the default next step. Fix status value `ready-for-review` → `ready-to-commit`. Update `/code-review-fix` artifact path.

### Task 3: Add failure handoff writes to `/commit`, `/pr`, `/code-review`
- **ACTION**: UPDATE 3 files
- **TARGET**: `commit.md` (after line 93), `pr.md` (after line 267), `code-review.md` (after line 201)
- **Scope**: Add "If command fails, write handoff with blocked status" sections

### Task 4: Fix `report.md` overwrite + `.done.md` rename duplication
- **ACTION**: UPDATE `.opencode/commands/execute.md`
- **TARGET**: Lines 331-332 (report path), line 346 (duplicate rename), line 377 (redundant write)
- **Scope**: Switch to per-task append sections in report. Deduplicate rename by making Step 2.6 defer to Step 6.6.

### Task 5: Align AGENTS.md session model + feature name propagation
- **ACTION**: UPDATE `AGENTS.md`
- **TARGET**: Lines 77, 89-97, 128-141
- **Scope**: Confirm status enum is complete. Clarify `/commit` + `/pr` same-session. Add `/final-review` as optional standalone. Add feature name canonical source rule.

## Testing Strategy

### Manual Validation
All changes are to markdown command specs. Testing = manual pipeline walkthrough:
1. Run `/prime` after each possible handoff state and verify correct routing
2. Simulate failure paths and verify blocked handoff appears
3. Run multi-task execution and verify report accumulates

### Edge Cases
- Status value not in the recognized list (should fall through to artifact scan)
- Handoff file missing (artifact scan fallback)
- Feature name mismatch between handoff and commit scope
- report.md with 0 prior task sections (first task brief)

## Validation Commands

```bash
# L1: File exists and is well-formed markdown
# Verify each modified file opens without parse errors

# L2-L4: N/A — no type-checked code, no tests

# L5: Manual validation
# Run /prime and verify Pending Work section for each status state
```

## Acceptance Criteria

### Implementation
- [x] `/prime` recognizes all 11 status values from AGENTS.md line 77
- [x] `/prime` Pending Work display has lines for all actionable statuses
- [x] `/code-loop` default handoff points to `/commit`, not `/final-review`
- [x] `/code-loop` status is `ready-to-commit`, not `ready-for-review`
- [x] `/commit`, `/pr`, `/code-review` write blocked handoff on failure
- [x] `execute.md` report path supports per-task sections (append, not overwrite)
- [x] `execute.md` `.done.md` rename for tasks defers to Step 6.6 (no duplication)
- [x] `code-review-fix.md` saves to `.agents/features/{feature}/` (not `.agents/reviews/`)
- [x] AGENTS.md status enum matches what all commands actually write
- [x] AGENTS.md session model shows `/commit → /pr` in same session
- [x] AGENTS.md Key Commands table includes `/final-review` as optional
- [x] All commands read Feature from handoff first, derive as fallback

### Runtime
- [ ] `/prime` displays correct next command for every pipeline state — deferred to runtime
- [ ] Multi-task execution preserves all task reports in single `report.md` — deferred to runtime
- [ ] Pipeline recovers from failures without stale handoff loops — deferred to runtime

## Completion Checklist
- [x] All 5 tasks implemented
- [x] All validation commands pass
- [x] No regressions in adjacent command files
- [x] Code follows existing patterns

## Notes
- **Key decisions**: Remove `/final-review` from mandatory pipeline (keep as optional standalone). Use append-mode report over numbered per-task reports.
- **Risks**: LLMs may still attempt double-rename if the deferral language isn't explicit enough. Mitigate with strong "SKIP — already handled" wording.
- **Confidence**: 9/10 for one-pass success — all changes are targeted text edits with exact line references

## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.done.md` | Add 6 missing statuses + display lines to `/prime` | done | 0 created, 1 modified |
| 2 | `task-2.done.md` | Remove `/final-review` from mandatory pipeline, fix `/code-loop` + `/code-review-fix` | done | 0 created, 2 modified |
| 3 | `task-3.done.md` | Add failure handoff writes to `/commit`, `/pr`, `/code-review` | done | 0 created, 3 modified |
| 4 | `task-4.done.md` | Fix `report.md` overwrite + `.done.md` rename deduplication in `/execute` | done | 0 created, 2 modified |
| 5 | `task-5.done.md` | Align AGENTS.md session model, command table, feature name propagation | done | 0 created, 1 modified |
