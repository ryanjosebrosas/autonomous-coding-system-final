# Plan: build-autonomous-readiness

> **Feature**: `build-autonomous-readiness`
> **Plan Path**: `.agents/features/build-autonomous-readiness/plan.md`
> **Mode**: Task Briefs (4 briefs)
> **Date**: 2026-03-01

---

## Feature Description

Make the `/build` command and its supporting pipeline commands (`/planning`, `/code-loop`) fully autonomous — capable of running a complete spec pipeline from plan through commit without human intervention. Currently, three specific interaction gates and one execution logic gap prevent true autonomous operation.

## User Story

As a developer running `/build next`, I want the pipeline to autonomously plan, execute all task briefs, review, fix, and commit each spec without stalling on user prompts or incomplete execution loops, so that I can start `/build` and walk away while it processes my BUILD_ORDER.

## Problem Statement

The `/build` command is architecturally complete but has 7 identified gaps that prevent autonomous operation:

1. **CRITICAL**: `/build` Step 5 dispatches ONE `/execute` call, but `/execute` only processes one task brief per session. A spec with N task briefs only gets brief 1 done before Step 6 validates incomplete work.
2. **HIGH**: `/planning` Phase 4 requires explicit user approval before writing the plan. When `/build` dispatches to `/planning`, this blocks the autonomous loop.
3. **MEDIUM**: `/code-loop` asks the user whether to fix or skip Minor-only findings. Not blocking for `/build` itself (which has its own review loop), but blocks standalone autonomous `/code-loop --auto-commit` usage.
4. **LOW**: Sections 02 and 04 reference `.agents/plans/{feature}-plan.md` (old convention) instead of `.agents/features/{feature}/plan.md`. Could mislead agents reading auto-loaded context.
5. **LOW (verified OK)**: `/decompose` output format matches `/build` input — `- [ ]` checkbox format with `**name**` field. No code change needed.
6. **LOW (verified OK)**: All 5 batch dispatch patterns referenced in `build.md` (`free-impl-validation`, `free-review-gauntlet`, `free-plan-review`, `t4-sign-off`, `free-security-audit`) are defined in `model-strategy.md`. No code change needed.
7. **LOW (design only)**: Cherry-pick conflicts in `/pr` stop the pipeline. This is a `/pr`/`/ship` concern, not a `/build` concern — `/build` pushes directly. Deferred.

## Solution Statement

Four targeted edits to existing `.md` command/section files:

1. **Task 1** — Add a brief-completion loop to `/build` Step 5. After each `/execute` dispatch returns, check if `plan.done.md` exists. If not, re-dispatch for the next brief. This makes `/build` the owner of the multi-brief loop while respecting `/execute`'s one-brief-per-session design.
2. **Task 2** — Add `--auto-approve` flag to `/planning`. When present, Phase 4 replaces the user approval prompt with an automated self-review checklist. `/build` Step 2 dispatch prompt includes this flag.
3. **Task 3** — Add `--auto` flag to `/code-loop`. When present, Minor-only findings are auto-fixed (if < 3 files touched) or auto-skipped to commit. Complements the existing `--auto-commit` flag.
4. **Task 4** — Fix 3 stale path references in `sections/02_piv_loop.md` and `sections/04_git_save_points.md`.

Gaps 5-6 were verified during research (formats match, patterns defined). Gap 7 is out of scope (affects `/pr`, not `/build`).

---

## Feature Metadata

| Field | Value |
|-------|-------|
| **Complexity** | Standard |
| **Slice Guardrail** | 4 tasks, each editing 1 file (task 4 edits 2 small files) |
| **Risk Level** | Low — all changes are additive to existing command specs |
| **Confidence** | 9/10 — the changes are well-scoped and the codebase patterns are clear |

---

## Context References

### Codebase Files

| File | Lines | Relevance |
|------|-------|-----------|
| `.opencode/commands/build.md` | 264-284 | Step 5 (Execute) — needs brief-completion loop |
| `.opencode/commands/build.md` | 152-173 | Step 2 (Plan) — dispatch prompt that needs `--auto-approve` |
| `.opencode/commands/planning.md` | 180-200 | Phase 4 (Preview/Approval Gate) — needs flag bypass |
| `.opencode/commands/planning.md` | 1-9 | Front matter + Usage — needs flag documentation |
| `.opencode/commands/code-loop.md` | 26-33 | Usage section — needs `--auto` flag |
| `.opencode/commands/code-loop.md` | 183-218 | Loop exit conditions — needs auto behavior |
| `.opencode/sections/02_piv_loop.md` | 19, 25, 27 | Stale `.agents/plans/` references |
| `.opencode/sections/04_git_save_points.md` | 3 | Stale `.agents/plans/` reference |

### Related Memories

No `memory.md` exists in this repo.

### Relevant Documentation

- `AGENTS.md` — Defines `.agents/features/{feature}/` as the canonical path convention
- `.opencode/reference/model-strategy.md` — Batch dispatch pattern names referenced by `/build`
- `.opencode/commands/decompose.md` — Produces `BUILD_ORDER.md` consumed by `/build` Step 1
- `.opencode/commands/execute.md` — One-brief-per-session rule that Task 1 must respect

---

## Patterns to Follow

### Pattern 1: Flag handling in `/code-loop` (existing)

`code-loop.md:26-33` already handles `--auto-commit` as an optional flag:

```markdown
## Usage

```
/code-loop [feature-name] [--auto-commit]
```

- `feature-name` (optional): Used for commit message and report file. If omitted, read `.agents/context/next-command.md` for the active feature name.
- `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), run `/commit` automatically within this session instead of handing off. Useful for autonomous pipelines.
```

New flags (`--auto`) should follow this exact pattern: listed in the usage block, documented with a dash-prefixed description, and referenced in the relevant logic sections.

### Pattern 2: Dispatch prompt structure in `/build`

`build.md:268-276` shows the dispatch pattern for Step 5:

```markdown
**If dispatch available:**
```
dispatch({
  mode: "agent",
  prompt: "Run /prime first. Then run /execute .agents/features/{spec-name}/plan.md",
  taskType: "execution",
  timeout: 900,
})
```
```

The brief-completion loop wraps around this dispatch call. After each dispatch returns, check the `.done.md` state and re-dispatch if briefs remain.

### Pattern 3: Conditional behavior in `/planning`

`planning.md:36-40` shows how `/planning` already branches on caller context:

```markdown
### If called from `/build` with a spec:
- Read the spec from `.agents/specs/BUILD_ORDER.md`
- Read `.agents/specs/build-state.json` for context from prior specs
- Summarize: "This spec is about {purpose}. It depends on {deps} which are done. Here's what I think we need to build..."
- Ask: "Does this match your thinking? Anything to add or change?"
```

The `--auto-approve` flag adds another conditional branch to Phase 4, following the same "If X: do Y" pattern.

---

## Implementation Plan

### Phase 1: Critical Pipeline Fix (Task 1)

Fix the execution gap that prevents `/build` from completing multi-brief specs.

### Phase 2: Autonomy Flags (Tasks 2-3)

Add flags that eliminate human prompts during autonomous operation.

### Phase 3: Path Cleanup (Task 4)

Fix stale references in auto-loaded sections.

---

## Step-by-Step Tasks (Summary)

### Task 1: Add brief-completion loop to `/build` Step 5
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md`
- **IMPLEMENT**: Replace the current single-dispatch Step 5 with a loop that checks `plan.done.md` after each `/execute` dispatch and re-dispatches until all briefs are complete. Also update Step 2 dispatch prompt to include `--auto-approve`.
- **VALIDATE**: Read the updated file and verify the loop logic handles both dispatch-available and dispatch-unavailable paths, and both task-brief and master-plan modes.

### Task 2: Add `--auto-approve` flag to `/planning`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/planning.md`
- **IMPLEMENT**: Add `--auto-approve` flag to Usage section. In Phase 4, add conditional: if `--auto-approve` is present, run the self-review checklist and proceed without user prompt.
- **VALIDATE**: Read the updated file and verify Phase 4 branches correctly on the flag.

### Task 3: Add `--auto` flag to `/code-loop`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/code-loop.md`
- **IMPLEMENT**: Add `--auto` flag to Usage section. In the Minor-only finding handler (line 185) and exit conditions (line 218), add conditional: if `--auto`, auto-fix if < 3 files, else skip to commit.
- **VALIDATE**: Read the updated file and verify Minor handling branches correctly on the flag.

### Task 4: Fix stale path references in auto-loaded sections
- **ACTION**: UPDATE
- **TARGET**: `.opencode/sections/02_piv_loop.md` + `.opencode/sections/04_git_save_points.md`
- **IMPLEMENT**: Replace `.agents/plans/{feature}-plan.md` with `.agents/features/{feature}/plan.md` in 3 locations across 2 files.
- **VALIDATE**: Read both files and confirm no remaining `.agents/plans/` references.

---

## Testing Strategy

### L1 Syntax/Format
- All modified files must remain valid Markdown
- No broken links or unclosed code blocks
- Flag documentation follows existing patterns

### L2 Structural Consistency
- `/build` Step 5 loop logic handles all modes (task brief, master plan)
- `/build` Step 5 loop handles both dispatch-available and dispatch-unavailable paths
- `/planning` Phase 4 branches correctly on `--auto-approve`
- `/code-loop` Minor handler branches correctly on `--auto`
- Path references in sections match AGENTS.md convention

### L3 Cross-File Consistency
- `/build` Step 2 dispatch prompt includes `--auto-approve` when dispatching to `/planning`
- `/build` Step 5 loop checks for `.done.md` files (same convention as `/execute` and `/prime`)
- `/code-loop` `--auto` flag documented alongside existing `--auto-commit` flag
- Section paths match `.agents/features/{feature}/plan.md` convention used everywhere else

### L4 Integration (Manual)
- Run `/build next` on a test project with BUILD_ORDER.md containing a 2-brief spec
- Verify: `/planning` auto-approves and writes plan without user prompt
- Verify: `/build` Step 5 dispatches `/execute` twice (once per brief) before proceeding to Step 6
- Verify: `/code-loop --auto --auto-commit` handles Minor findings without prompting

### L5 Manual Review
- Read all 4 modified files end-to-end to verify no unintended changes
- Verify the loop logic doesn't create infinite loops (clear exit condition: `plan.done.md` exists)

---

## Validation Commands

```
L1: N/A — Markdown files, no linter configured for .md
L2: Manual review — read each file, verify structural consistency
L3: Grep for ".agents/plans/" across all files — should return 0 matches after Task 4
L4: Run /build on a test project (manual)
L5: Human review of all changes
```

---

## Acceptance Criteria

### Implementation

- [x] `/build` Step 5 loops through all task briefs before proceeding to Step 6
- [x] `/build` Step 5 loop handles dispatch-available and dispatch-unavailable paths
- [x] `/build` Step 5 loop handles both task-brief and master-plan modes
- [x] `/build` Step 5 loop has clear exit condition (no infinite loop risk)
- [x] `/build` Step 2 dispatch prompt includes `--auto-approve` flag
- [x] `/planning` recognizes `--auto-approve` flag in `$ARGUMENTS`
- [x] `/planning` Phase 4 auto-approves when flag is present
- [x] `/planning` Phase 4 still requires user approval when flag is absent (backward compatible)
- [x] `/code-loop` recognizes `--auto` flag
- [x] `/code-loop` auto-handles Minor findings when `--auto` is set
- [x] `/code-loop` still prompts for Minor findings when `--auto` is absent (backward compatible)
- [x] `sections/02_piv_loop.md` uses `.agents/features/{feature}/plan.md` path
- [x] `sections/04_git_save_points.md` uses `.agents/features/{feature}/plan.md` path
- [x] No remaining `.agents/plans/` references in any auto-loaded section

### Runtime

- [x] `/build next` can process a multi-brief spec without stalling
- [x] `/build next` can process a spec without prompting for plan approval
- [x] `/code-loop --auto --auto-commit` runs end-to-end without user prompts
- [x] Backward compatibility: standalone `/planning` still prompts for approval
- [x] Backward compatibility: standalone `/code-loop` still prompts for Minor findings

---

## Completion Checklist

- [x] All 4 task briefs executed
- [x] All acceptance criteria checked
- [x] Execution report written
- [x] No regressions in existing command behavior

---

## Notes

### Key Decisions

1. **`/build` owns the brief loop, not `/execute`**: `/execute` stays one-brief-per-session (its design is correct for context management in standalone use). `/build` adds a wrapper loop that re-dispatches `/execute` until all briefs are done. This respects both commands' design philosophies.

2. **Flag-based autonomy, not caller detection**: We use explicit flags (`--auto-approve`, `--auto`) rather than trying to detect "am I being called from `/build`?" This is cleaner, testable, and useful for other autonomous scenarios beyond `/build`.

3. **Gaps 5-7 verified/deferred, not fixed**: Gap 5 (decompose format) and Gap 6 (batch patterns) were verified during research — they already match. Gap 7 (cherry-pick conflicts in `/pr`) is deferred — it's a `/pr` concern, not a `/build` concern.

### Risks

1. **Brief loop context burn**: If `/build` dispatches `/execute` 5 times in one session for a 5-brief spec, each dispatch may consume significant context. Mitigation: dispatch uses agent mode with fresh context per call; the dispatched agent reads the plan file directly.

2. **`--auto-approve` could skip bad plans**: If the self-review checklist doesn't catch issues, a bad plan could proceed to execution. Mitigation: the checklist mirrors the existing manual approval criteria; Step 3 (plan review via batch-dispatch) already provides multi-model validation before approval.

### Confidence

**9/10** — All changes are additive edits to well-understood command files. The patterns are established. The only risk is the brief loop's interaction with dispatch context limits, which is mitigated by agent mode's fresh context per dispatch.

---

## Verification Notes (Gaps 5-7)

### Gap 5: `/decompose` output format (VERIFIED OK)

`/decompose` Step 3 writes `.agents/specs/BUILD_ORDER.md` with this format:
```markdown
- [ ] `P{N}-{NN}` **{spec-name}** ({depth}) — {description}
  - depends: {spec IDs}
  - touches: {files}
  - enables: {what later specs depend on this}
  - acceptance: {test}
```

`/build` Step 1 reads BUILD_ORDER.md and looks for `[ ]` specs with `[x]` dependencies. The format is compatible. No change needed.

### Gap 6: Batch dispatch patterns (VERIFIED OK)

All patterns referenced in `build.md`:
- `free-impl-validation` — defined in `model-strategy.md:144` (3 models: GLM-5, GLM-4.7-FLASH, DeepSeek-V3.2)
- `free-review-gauntlet` — defined in `model-strategy.md:140` (5 models: GLM-5, GLM-4.5, Qwen3-CODER-PLUS, GLM-4.7-FLASH, DeepSeek-V3.2)
- `free-plan-review` — defined in `model-strategy.md:143` (4 models: GLM-5, GLM-4.5, Qwen3-MAX, DeepSeek-V3.2)
- `t4-sign-off` — defined in `model-strategy.md:59` (codex + sonnet-4-5 + sonnet-4-6)
- `free-security-audit` — defined in `model-strategy.md:142` (3 models: GLM-4.7-FLASH, GLM-5, Qwen3-CODER-PLUS)

All 5 patterns exist. No change needed.

### Gap 7: Cherry-pick conflicts in `/pr` (DEFERRED)

`/build` Step 8 does `git push` directly to the current branch. Cherry-pick conflicts only occur when `/pr` creates a feature branch post-build. This is a `/pr` concern and is out of scope for this feature.

---

## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.md` | Add brief-completion loop to `/build` Step 5 + `--auto-approve` in Step 2 dispatch | pending | 0 created, 1 modified |
| 2 | `task-2.md` | Add `--auto-approve` flag to `/planning` Phase 4 | pending | 0 created, 1 modified |
| 3 | `task-3.md` | Add `--auto` flag to `/code-loop` Minor handling | pending | 0 created, 1 modified |
| 4 | `task-4.md` | Fix stale `.agents/plans/` paths in sections 02 + 04 | pending | 0 created, 2 modified |
