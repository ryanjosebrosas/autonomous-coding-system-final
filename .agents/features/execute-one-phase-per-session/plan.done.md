# Feature: Execute One Phase Per Session

## Feature Description

Change `/execute`'s master plan behavior from a sequential loop that processes all phases in one context window to a one-phase-per-session model where each `/execute` call handles exactly one phase, writes a handoff, and ends. The next session picks up the next phase via `/prime` reading the handoff file. This prevents context compaction on complex multi-phase features and aligns with the autonomous pipeline model where each session is: `/prime` → `/execute` → END.

## User Story

As a developer using multi-phase plans, I want each phase to execute in a fresh context window so that the model has full capacity for each phase and doesn't degrade on later phases due to context compaction.

## Problem Statement

`/execute` Step 0.5 currently detects a master plan and routes to Step 2.5 "Series Mode Execution," which contains a `For each sub-plan` loop. This loop reads and executes ALL phases sequentially in one session. On complex features with 4-6 phases of 700-1000 lines each, the model's context fills up, leading to:
- Degraded quality on later phases (compaction)
- Lost details from earlier phases' HANDOFF NOTES
- No clean session boundary between phases for model switching

The handoff write at Step 2.5 item 7 exists but is useless — it writes mid-loop as a checkpoint, but the loop immediately continues to the next phase. The handoff was designed to be a session boundary, not a mid-loop note.

## Solution Statement

- Decision 1: One phase per session always, no `--sequential` flag — because simplicity wins. If a feature is small enough to do in one session, it should be a single plan, not a master plan. Master plans exist specifically for features too large for one context window.
- Decision 2: Handoff Next Command points back to `plan-master.md`, not `plan-phase-{N+1}.md` directly — because the user shouldn't need to track phase numbers. Step 0.5's phase detection automatically picks the next undone phase.
- Decision 3: Phase completion detection uses `.done.md` files, not a counter — because `.done.md` is the existing ground truth convention. If a session crashes mid-phase, the phase file isn't renamed, so the next session correctly retries it.

## Feature Metadata

- **Feature Type**: Enhancement
- **Estimated Complexity**: Low
- **Primary Systems Affected**: `.opencode/commands/execute.md`, `AGENTS.md`
- **Dependencies**: Pipeline handoff system (already implemented — `.agents/context/next-command.md`)
- **Total Tasks**: 3

### Slice Guardrails (Required)

- **Single Outcome**: Master plan execution dispatches one phase per session instead of looping
- **Expected Files Touched**: 2 files (`execute.md`, `AGENTS.md`)
- **Scope Boundary**: Does NOT change single plan execution, does NOT change `/planning`'s sub-plan generation, does NOT change the handoff file format
- **Split Trigger**: N/A — this is already minimal

---

## CONTEXT REFERENCES

### Relevant Codebase Files

> IMPORTANT: The execution agent MUST read these files before implementing!

- `.opencode/commands/execute.md` (lines 40-50) — Why: Step 0.5 "Detect Plan Type" is the entry point that routes master plans to series mode. This is Edit A.
- `.opencode/commands/execute.md` (lines 121-146) — Why: Step 2.5 "Series Mode Execution" contains the sequential loop that must be replaced. This is Edit B.
- `.opencode/commands/execute.md` (lines 271-296) — Why: Step 6.6 completion sweep and Step 6.7 handoff write. These remain unchanged but the execution agent must understand how they interact with the new Step 2.5.
- `AGENTS.md` (line 38) — Why: Documents `plan-phase-{N}.md` — needs annotation about one-per-session execution.

### New Files to Create

- None — all modifications to existing files.

### Related Memories (from memory.md)

- No memory.md exists in this repository.

### Relevant Documentation

- `AGENTS.md` (lines 49-76) — `.done.md` lifecycle table and Pipeline Handoff File documentation. The phase detection logic relies on these conventions.

### Patterns to Follow

**`.done.md` phase tracking** (from `AGENTS.md:49-60`):
```markdown
| Artifact | Created by | Marked `.done.md` by | Trigger |
|----------|-----------|---------------------|---------|
| `plan-phase-{N}.md` | `/planning` | `/execute` | Phase fully executed |
| `plan-master.md` | `/planning` | `/execute` | All phases completed |
```
- Why this pattern: The one-phase-per-session model uses `.done.md` presence to detect which phases are complete. After executing a phase, rename `plan-phase-{N}.md` → `plan-phase-{N}.done.md`. When all phases have `.done.md`, rename `plan-master.md` → `plan-master.done.md`.
- Common gotchas: The completion sweep at Step 6.6 (lines 271-279) already handles `.done.md` renames. The new Step 2.5 must NOT duplicate this — it should let the existing sweep handle the rename.

**Handoff write format** (from `execute.md:131-143`, already implemented):
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /execute (phase {N} of {total})
- **Feature**: {feature}
- **Next Command**: /execute .agents/features/{feature}/plan-master.md
- **Master Plan**: .agents/features/{feature}/plan-master.md
- **Phase Progress**: {N}/{total} complete
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: executing-series
```
- Why this pattern: The handoff already has the right fields. The key change is that **Next Command** now points to `plan-master.md` (not `plan-phase-{N+1}.md`), and after this handoff write, the session ENDS instead of looping.

**Single phase execution path** (from `execute.md:46`):
```markdown
**If file path is a single phase file (`-phase-{N}.md`)**: Execute as a single sub-plan (normal mode, but note it's part of a larger feature).
```
- Why this pattern: This already works correctly. When Step 0.5 identifies the next undone phase, it dispatches to this exact code path — execute the sub-plan file as a single plan using the normal Step 1 → Step 2 → Step 3-6 flow. No new execution logic needed.

---

## IMPLEMENTATION PLAN

### Phase 1: Core Change — Step 0.5 + Step 2.5 + AGENTS.md

Rewrite Step 0.5 to detect the next undone phase from a master plan and dispatch it as a single sub-plan. Replace Step 2.5's sequential loop with a single-phase completion step that writes the handoff and ends. Update AGENTS.md annotation.

---

## TESTING STRATEGY

### Unit Tests

Not applicable — changes are to markdown instruction files, not executable code.

### Integration Tests

Not applicable — LLM instruction files.

### Edge Cases

- **Fresh master plan (no phases done)**: Step 0.5 scans, finds zero `.done.md` files, identifies phase 1 as next. Dispatches phase 1 as single sub-plan.
- **Mid-series resume (phases 1-3 done, 4-6 remain)**: Step 0.5 finds `plan-phase-1.done.md`, `plan-phase-2.done.md`, `plan-phase-3.done.md`. Identifies phase 4 as next. Dispatches phase 4.
- **All phases done**: Step 0.5 finds all `.done.md` files. Reports complete. Writes `awaiting-review` handoff. Renames `plan-master.md` → `plan-master.done.md`. Does NOT execute anything.
- **Direct phase call (`/execute plan-phase-3.md`)**: Bypasses master plan detection entirely. Executes as single sub-plan via the `-phase-{N}.md` path. Still proceeds to Step 2.5 for phase completion.
- **Phase fails mid-execution**: Step 2.5 item 5 — phase file is NOT renamed. Handoff writes `blocked`. Next session's `/prime` shows the blocked state.
- **Session crashes before handoff write**: The phase file was not renamed to `.done.md` (completion sweep didn't run). Next session runs `/execute plan-master.md` → Step 0.5 correctly detects the phase as undone and retries it.
- **`plan.done.md` and `plan.md` coexist** (known edge case from `build-batch-dispatch-wiring`): Step 0.5 checks for `.done.md` PRESENCE, not `.md` absence. If `plan-phase-2.done.md` exists, phase 2 is done regardless of whether `plan-phase-2.md` also exists.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

Not applicable for markdown — no linter configured.

### Level 2: Type Safety

Not applicable — markdown instruction files only.

### Level 3: Unit Tests

Not applicable — no executable code.

### Level 4: Integration Tests

Not applicable — no executable code.

### Level 5: Manual Validation

1. **Read `execute.md` end-to-end** — verify Step 0.5 and Step 2.5 flow coherently. Trace these scenarios mentally:
   - `/execute plan-master.md` with no phases done → Step 0.5 picks phase 1 → Steps 1-6 execute it → Step 2.5 writes handoff → session ends
   - `/execute plan-master.md` with phases 1-2 done → Step 0.5 picks phase 3 → executes → handoff → ends
   - `/execute plan-master.md` with all phases done → Step 0.5 reports complete → handoff `awaiting-review` → stops without executing
   - `/execute plan-phase-2.md` directly → normal single plan execution → Step 2.5 phase completion → handoff → ends

2. **Verify no loop remains** — grep for "For each sub-plan" or "for each" in Step 2.5. Must be gone.

3. **Verify "End session" is explicit** — Step 2.5 must contain the words "End session" and "Do NOT continue to the next phase."

4. **Verify handoff Next Command** — must point to `plan-master.md`, not `plan-phase-{N+1}.md`.

5. **Cross-reference Step 6.6** (completion sweep) — verify Step 2.5 doesn't duplicate the `.done.md` rename. Step 2.5 item 1 should defer to Step 6.6.

6. **Read AGENTS.md line 38** — verify annotation exists.

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [x] Step 0.5 no longer says "Proceed to Series Mode" for master plans
- [x] Step 0.5 includes phase detection logic (scan for `.done.md` files)
- [x] Step 0.5 handles all-phases-done case (report complete, write handoff, stop)
- [x] Step 0.5 reads SHARED CONTEXT REFERENCES from master plan
- [x] Step 0.5 reads HANDOFF NOTES from previous phase (if exists)
- [x] Step 2.5 no longer has "For each sub-plan" loop
- [x] Step 2.5 explicitly says "End session. Do NOT continue to the next phase."
- [x] Step 2.5 has "Key rule" block stating one phase per session
- [x] Handoff Next Command points to `plan-master.md` (not phase-N+1)
- [x] Failed phase case does NOT rename the file
- [x] Step 2.5 defers `.done.md` rename to Step 6.6 (no duplication)
- [x] AGENTS.md line 38 has "(executed one per session, not sequentially)" annotation

### Runtime (verify after testing/deployment)

- [ ] Running `/execute plan-master.md` on a fresh master plan executes only phase 1 and ends — deferred to runtime
- [ ] Running `/execute plan-master.md` again picks up phase 2 (via `.done.md` detection) — deferred to runtime
- [ ] Running `/prime` between phases shows correct phase progress in Pending Work — deferred to runtime
- [ ] All phases completing triggers `awaiting-review` handoff — deferred to runtime

---

## COMPLETION CHECKLIST

- [x] All 3 tasks completed in order
- [x] Each task validation passed
- [x] All validation commands executed successfully (Level 5 manual)
- [x] Acceptance criteria all met
- [x] No existing single-plan execution behavior broken (only master plan path changed)
- [x] No loop remains in Step 2.5

---

## TASK INDEX

| Task | Scope | Status | Files |
|------|-------|--------|-------|
| 1 | Rewrite Step 0.5 in execute.md — master plan detection → one-phase dispatch | done | execute.md |
| 2 | Replace Step 2.5 in execute.md — loop → single-phase completion + handoff + end session | done | execute.md |
| 3 | Annotate AGENTS.md — "(executed one per session, not sequentially)" | done | AGENTS.md |

---

## NOTES

### Key Design Decisions

- **One phase per session, no flag**: If the feature is small enough for one session, use a single plan. Master plans exist precisely because the feature is too large for one context window. Adding a `--sequential` flag would reintroduce the compaction problem.
- **Next Command points to `plan-master.md`**: The user always runs the same command. Step 0.5 auto-detects the right phase. This is simpler than making the user track phase numbers.
- **`.done.md` for phase tracking**: Reuses the existing convention. No new state files, no counters, no JSON. If it crashed, the `.done.md` wasn't written, so the phase retries correctly.
- **Step 2.5 runs AFTER Steps 3-6**: The ordering is Step 0.5 (detect) → Steps 1-2 (execute tasks) → Steps 3-6 (validate, self-review, completion sweep, handoff write) → Step 2.5 (phase-specific handoff override). Step 6.7's handoff write gets overridden by Step 2.5's phase-aware handoff.

### Risks

- **Risk 1**: Step 6.6 completion sweep tries to rename `plan-master.md` → `plan-master.done.md` prematurely (before all phases are done). Mitigation: Step 6.6 says "only when ALL phases are done" — this rule already exists. Step 2.5 item 4 is the redundant safety check.
- **Risk 2**: Step 2.5 ordering confusion — when does it run relative to Steps 3-6? Mitigation: The plan explicitly documents the ordering in the GOTCHA field of Task 2.

### Confidence Score: 9/10

- **Strengths**: Minimal change (2 sections in 1 file + 1 line annotation). Reuses existing `.done.md` convention. No new state management. Direct phase targeting (`/execute plan-phase-N.md`) still works unchanged.
- **Uncertainties**: The ordering of Step 2.5 relative to Steps 3-6 needs to be clear to the executing model. The GOTCHA in Task 2 addresses this explicitly.
- **Mitigations**: Exact Current/Replace blocks provided. The executing model has copy-paste content, not prose to interpret.
