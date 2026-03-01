# Dispatch Wiring Completion — Implementation Plan

## Feature Description

Complete the dispatch tool wiring across all pipeline commands so that autonomous execution works deterministically. Every command that references dispatch gets concrete, executable `dispatch({...})` or `batch-dispatch({...})` call blocks instead of prose descriptions. Also cleans up stale references, clarifies the "Opus Never Implements" rule for standalone command contexts, and softens the hardcoded task count thresholds in `/planning` and `/build`.

## User Story

As a pipeline orchestrator (human or autonomous), I want every command that mentions dispatch to have concrete, copy-paste-ready call syntax, so that dispatch is used consistently and deterministically across all pipeline paths — not just `/build`.

## Problem Statement

The dispatch system is fully implemented (three TypeScript tools: `dispatch.ts`, `batch-dispatch.ts`, `council.ts`) and wired into `/build` and `/commit` with concrete call blocks. But five other commands (`/code-review`, `/code-loop`, `/code-review-fix`, `/pr`, plus `/build` Steps 7d/7e/8a) describe dispatch only in prose — "if dispatch available, send to T2" — which executing models interpret inconsistently or skip. This creates a two-tier system where autonomous execution through `/build` uses dispatch, but standalone command usage silently drops it.

Additionally, the `/planning` and `/build` commands use a hardcoded `<10` / `>=10` task threshold for choosing between task brief mode and master plan mode. This rigid boundary discourages organic task splitting — features that naturally have 10-12 tasks get forced into the heavier master plan mode when task briefs would work fine.

## Solution Statement

1. Add concrete `dispatch({...})` and `batch-dispatch({...})` call blocks to every command that currently has prose-only dispatch references, following the established pattern from `/build` Steps 7a-7c.
2. Clean the stale `_dispatch-primer.md` ghost reference in `model-strategy.md`.
3. Clarify the "Opus Never Implements" graceful degradation rule.
4. Soften the task count threshold to a guideline ("typically 3-10 tasks per plan; master plan when phases have distinct dependencies"), removing the hard `<10` / `>=10` boundary.

## Feature Metadata

- **Depth**: light
- **Dependencies**: multi-model-dispatch (done), build-batch-dispatch-wiring (done)
- **Estimated tasks**: 9
- **Risk**: Low — markdown-only edits following established patterns

---

## Context References

### Codebase Files

- `.opencode/commands/build.md:349-419` — Gold standard for dispatch wiring (Steps 7a-7c with concrete call syntax, consensus gating, escalation)
- `.opencode/commands/build.md:439-479` — Steps 7d, 7e, 8a that need concrete calls (currently prose)
- `.opencode/commands/build.md:146-147` — Hardcoded `<10` / `>=10` task threshold
- `.opencode/commands/commit.md:26-33` — Working example of dispatch in a non-build command
- `.opencode/commands/code-review.md:130-142` — Step 4 prose table needing concrete calls
- `.opencode/commands/code-loop.md:50-109` — Full dispatch section needing concrete calls
- `.opencode/commands/code-review-fix.md` — No dispatch at all, needs T1 fix delegation
- `.opencode/commands/pr.md:189-192` — Step 5 prose needing concrete call
- `.opencode/commands/planning.md:211` — `10+` threshold for master plan mode
- `.opencode/commands/planning.md:274` — Task splitting heuristic (good, but gated by the threshold)
- `.opencode/reference/model-strategy.md:92` — Stale `_dispatch-primer.md` reference to remove
- `.opencode/reference/model-strategy.md:27-61` — Definitive task type routing table (source of truth for tier mappings)
- `.opencode/sections/01_core_principles.md:1` — "Opus Never Implements" rule needing scope clarification
- `.opencode/templates/STRUCTURED-PLAN-TEMPLATE.md:20-21` — `<10` reference in template
- `.opencode/templates/MASTER-PLAN-TEMPLATE.md:3,12` — `10+` / `<10` references in template

### Pattern to Follow

**Reference pattern** — `/build` Step 7a (`build.md:349-387`):

```
**If dispatch available**, run the free review gauntlet by depth. Use this prompt for all patterns:

REVIEW_PROMPT = "Review the following code changes..."

**light:**
batch-dispatch({
  batchPattern: "free-impl-validation",
  prompt: REVIEW_PROMPT,
})

**standard:**
batch-dispatch({
  batchPattern: "free-review-gauntlet",
  prompt: REVIEW_PROMPT,
})

**If dispatch unavailable:**
Run thorough self-review using `/code-review` methodology...
```

This pattern has three consistent elements:
1. **Prompt variable** defined once, reused across depth tiers
2. **Concrete call blocks** with exact tool name, parameters, and pattern name
3. **Graceful degradation** — "If dispatch unavailable" fallback to self-review

All task briefs in this plan follow this exact structure.

### Task Type Routing Reference

From `model-strategy.md:27-61`, the task types we'll use:

| Task | TaskType | Routes To | Tier |
|------|----------|-----------|------|
| Security review | `security-review` | glm-5 | T2a |
| Architecture audit | `architecture-audit` | glm-4.5 | T2b |
| Code review | `code-review` | glm-5 | T2a |
| Simple fix | `simple-fix` | qwen3-coder-next | T1a |
| Complex fix | `complex-fix` | qwen3.5-plus | T1c |
| PR description | `pr-description` | claude-haiku-4-5 | Haiku |
| Commit message | `commit-message` | claude-haiku-4-5 | Haiku |
| Final review panel | `t4-sign-off` | batch-dispatch pattern | T4 |
| T5 escalation | `final-review` | claude-sonnet-4-6 | T5 |

### Batch Dispatch Patterns Reference

From `model-strategy.md:134-149`:

| Pattern | Models | Use Case |
|---------|--------|----------|
| `free-review-gauntlet` | 5 models | Consensus review |
| `free-impl-validation` | 3 models | Quick post-impl check |
| `free-security-audit` | 3 models | Security-focused review |
| `multi-review` | 4 models | Multi-family code review |
| `t4-sign-off` | codex + sonnet-4-5 + sonnet-4-6 | Final review panel |

---

## Implementation Plan

### Phase 1: Standalone Command Wiring (Tasks 1-3)
Wire the three standalone commands that are used both independently and inside `/code-loop`. Each task is one file, one section.

### Phase 2: System Rules (Task 4)
Clarify the "Opus Never Implements" rule with explicit graceful degradation.

### Phase 3: Pipeline Tail Wiring (Tasks 5-7)
Wire the remaining pipeline steps — each step gets its own task brief for clean verification.

### Phase 4: Cleanup & Threshold (Tasks 8-9)
Remove stale references and soften the task count threshold.

---

## Step-by-Step Tasks

### Task 1: Wire `/code-review` Step 4

- **Brief**: `task-1.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/code-review.md`
- **Scope**: Replace Step 4 prose table (lines 130-142) with concrete `dispatch` and `batch-dispatch` calls following the `/build` 7a pattern. Add when-to-dispatch/skip guidance, prompt variable, escalation gating, and graceful degradation.

### Task 2: Wire `/code-loop` Dispatch Section

- **Brief**: `task-2.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/code-loop.md`
- **Scope**: Replace lines 50-109 (the "Multi-Model Dispatch in Loop" prose section) with concrete calls for review dispatch (batch for first iteration, single for later), fix dispatch (agent mode for T1), model routing table with taskTypes, and consensus gating. Preserve all existing guidance about when to dispatch/skip.

### Task 3: Wire `/code-review-fix` Step 2b

- **Brief**: `task-3.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/code-review-fix.md`
- **Scope**: Insert new Step 2b between Steps 2 and 3 with dispatch-to-T1 for fix implementation (simple-fix and complex-fix taskTypes, agent mode). Existing Step 3 becomes the manual fallback.

### Task 4: Clarify "Opus Never Implements" Graceful Degradation

- **Brief**: `task-4.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/sections/01_core_principles.md`
- **Scope**: Rewrite line 1 to add explicit graceful degradation clause. Keep rule force intact. Make clear: dispatch available = must dispatch; dispatch unavailable = primary model handles work directly (not a violation). No changes to lines 3-19.

### Task 5: Wire `/pr` Step 5

- **Brief**: `task-5.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/pr.md`
- **Scope**: Replace the prose "Dispatch to T1 for PR title + body generation" (lines 189-192) with concrete `dispatch({ taskType: "pr-description" })` call block. Keep the manual generation format template below as the fallback.

### Task 6: Wire `/build` Step 7d (Final Review Panel)

- **Brief**: `task-6.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md`
- **Scope**: Replace the prose "Run 2-3 T3/T4 reviewers" in Step 7d (lines 439-441) with concrete `batch-dispatch({ batchPattern: "t4-sign-off" })` call block. Add prompt variable, result handling table, and stuck escalation path to 7e.

### Task 7: Wire `/build` Steps 7e + 8a

- **Brief**: `task-7.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md`
- **Scope**: Two small edits in the same file:
  - Step 7e (lines 465-466): Replace prose with `dispatch({ taskType: "final-review" })` call block
  - Step 8a (lines 476-477): Replace prose with `dispatch({ taskType: "commit-message" })` call block

### Task 8: Clean Stale `_dispatch-primer.md` Reference

- **Brief**: `task-8.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/reference/model-strategy.md`
- **Scope**: Replace line 92 (stale primer reference) with accurate description of how dispatch models get context (agent mode: native tools; text mode: command includes context in prompt).

### Task 9: Soften Task Count Threshold in `/planning` + `/build`

- **Brief**: `task-9.md`
- **ACTION**: UPDATE
- **TARGETS**: `.opencode/commands/planning.md`, `.opencode/commands/build.md`, `.opencode/templates/STRUCTURED-PLAN-TEMPLATE.md`, `.opencode/templates/MASTER-PLAN-TEMPLATE.md`
- **Scope**: Replace all hardcoded `<10` / `>=10` / `10+` task thresholds with soft guidelines. Task brief mode is the default for any count; master plan mode is for features with distinct phases and heavy cross-phase dependencies, not a task count boundary.

---

## Testing Strategy

### Manual Verification (All Tasks)
- Read each modified file end-to-end after edits
- Verify all `taskType` values exist in `model-strategy.md:27-61`
- Verify all `batchPattern` values exist in `model-strategy.md:134-149`
- Verify every dispatch block has "If dispatch unavailable" graceful degradation
- Verify no existing wired sections in `/build` Steps 7a-7c or `/commit` are altered

---

## Validation Commands

```bash
# L1: Verify files exist and are well-formed (manual — open and read)
# L2: N/A — no type-checked code
# L3: N/A — no unit tests for markdown edits
# L5: Manual — read each file, trace dispatch calls against model-strategy.md routing table
```

---

## Acceptance Criteria

### Implementation
- [x] Every command that references dispatch has concrete `dispatch({...})` or `batch-dispatch({...})` call blocks
- [x] All call blocks include `taskType` (not hardcoded provider/model) for routing flexibility
- [x] All call blocks include "If dispatch unavailable" graceful degradation
- [x] Stale `_dispatch-primer.md` reference removed from `model-strategy.md`
- [x] "Opus Never Implements" rule has explicit graceful degradation clause
- [x] Task count threshold is a soft guideline, not a hard boundary

### Consistency
- [x] All new dispatch blocks follow the same 3-element pattern: prompt variable, concrete call, graceful degradation
- [x] Task types used match the routing table in `model-strategy.md:27-61`
- [x] Batch patterns used match the patterns in `model-strategy.md:134-149`

### No Regressions
- [x] No existing dispatch wiring in `/build` Steps 7a-7c or `/commit` is altered
- [x] No command behavior changes when dispatch is unavailable (graceful degradation preserved)
- [x] Master plan mode still available for genuinely multi-phase features

## Completion Checklist

- [x] All 9 tasks implemented
- [x] Each modified file reviewed for consistency
- [x] No orphaned references to `_dispatch-primer.md`
- [x] `/planning` and `/build` threshold language updated
- [x] Pipeline handoff updated

## Notes

- **Key decision**: Use `taskType` routing everywhere (not hardcoded provider/model) so that tier changes in `model-strategy.md` propagate automatically
- **Key decision**: "Opus Never Implements" graceful degradation is the existing implicit behavior — we're codifying it, not changing behavior
- **Key decision**: Task count threshold softening preserves master plan mode for genuine multi-phase features while removing the artificial `<10` boundary that forces small features into arbitrary task counts
- **Confidence**: 9/10 for one-pass success

---

## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.md` | Wire /code-review Step 4 dispatch calls | done | 0 created, 1 modified |
| 2 | `task-2.md` | Wire /code-loop dispatch section | done | 0 created, 1 modified |
| 3 | `task-3.md` | Wire /code-review-fix Step 2b dispatch | done | 0 created, 1 modified |
| 4 | `task-4.md` | Clarify Opus Never Implements rule | done | 0 created, 1 modified |
| 5 | `task-5.md` | Wire /pr Step 5 dispatch call | done | 0 created, 1 modified |
| 6 | `task-6.md` | Wire /build Step 7d final review panel | done | 0 created, 1 modified |
| 7 | `task-7.md` | Wire /build Steps 7e + 8a | done | 0 created, 1 modified |
| 8 | `task-8.md` | Clean stale _dispatch-primer.md reference | done | 0 created, 1 modified |
| 9 | `task-9.md` | Soften task count threshold in /planning + /build | done | 0 created, 4 modified |
