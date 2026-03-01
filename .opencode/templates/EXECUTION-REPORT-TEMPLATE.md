# Execution Report Template

> Save implementation reports to `.agents/features/{feature}/report.md`
> 
> This report is consumed by `/system-review` for divergence analysis.
> Be specific and honest — this is for process improvement, not judgment.

---

## Meta Information

- **Plan file**: {path to the plan that guided this implementation}
- **Plan checkboxes updated**: {yes/no}
- **Files added**: {list with full paths, or "None"}
- **Files modified**: {list with full paths}
- **Files deleted**: {list with full paths, or "None"}
- **Lines changed**: +{N} -{M}
- **RAG used**: {yes — describe what was looked up / no — plan was self-contained}
- **Archon tasks updated**: {yes — N tasks marked done / no — not connected}
- **Dispatch used**: {yes — list tasks delegated and models used / no — all tasks self-executed}

---

## Self-Review Summary

> Paste the SELF-REVIEW SUMMARY from Step 5d here.

~~~
SELF-REVIEW SUMMARY
====================
Tasks:      {completed}/{total} ({skipped} skipped, {diverged} diverged)
Files:      {added} added, {modified} modified ({unplanned} unplanned)
Acceptance: {met}/{total} implementation criteria met ({deferred} deferred to runtime)
Validation: L1 {pass/fail} | L2 {pass/fail} | L3 {pass/fail} | L4 {pass/fail} | L5 {pass/fail}
Gaps:       {list any gaps, or "None"}
Verdict:    {COMPLETE | INCOMPLETE — see gaps above}
~~~

---

## Completed Tasks

For each task in the plan:

- **Task {N}**: {brief description} — {completed / skipped with reason}
- **Task {N}**: {brief description} — {completed / skipped with reason}

**Summary**: {X}/{Y} tasks completed ({Z}%)

---

## Divergences from Plan

> Document any deviation from the plan. Be specific — this helps improve the planning process.

### Classification Guide

**Good Divergence (Justified)** — Plan limitations discovered during implementation:
- Plan assumed something that didn't exist in the codebase
- Better pattern discovered during implementation
- Performance or security issue required different approach
- Technical constraint not known at planning time

**Bad Divergence (Problematic)** — Execution issues:
- Ignored explicit constraints in plan
- Created new architecture instead of following existing patterns
- Took shortcuts introducing technical debt
- Misunderstood requirements or plan instructions

**Root Cause Categories:**
- `unclear plan` — Plan didn't specify X clearly
- `missing context` — Didn't know about Y during planning
- `missing validation` — No test/check for Z
- `manual step repeated` — Did manually what should be automated

---

> Add one block per divergence. Remove this section entirely if there are none.

### Divergence 1

- **What**: {one-line summary of what changed}
- **Planned**: {what the plan specified}
- **Actual**: {what was implemented instead}
- **Reason**: {why the divergence occurred}
- **Classification**: Good ✅ / Bad ❌
- **Root Cause**: {unclear plan | missing context | missing validation | manual step repeated | other}

*(Copy block above for each additional divergence. If none: "None — implementation matched plan exactly.")*

---

## Skipped Items

> List anything from the plan that was NOT implemented.

- **{Item name}**: {what was skipped}
  - **Reason**: {why it was skipped — e.g., "deferred to follow-up", "not needed", "blocked by X"}

*(If none: "None — all planned items implemented.")*

---

## Validation Results

> Output from each validation command run during implementation.

### Level 1: Syntax & Style
```bash
{command run}
{output}
```
**Result**: PASS / FAIL

### Level 2: Type Safety
```bash
{command run}
{output}
```
**Result**: PASS / FAIL

### Level 3: Unit Tests
```bash
{command run}
{output}
```
**Result**: PASS / FAIL ({N} tests)

### Level 4: Integration Tests
```bash
{command run}
{output}
```
**Result**: PASS / FAIL

### Level 5: Manual Validation
```
{steps performed and results}
```
**Result**: PASS / FAIL

---

## Tests Added

- **Test files created**: {list paths}
- **Test cases added**: {N} total
  - Unit tests: {N}
  - Integration tests: {N}
- **Pass/fail status**: {all passing / N failing}

*(If no tests: "No tests specified in plan.")*

---

## Issues & Notes

### Challenges Encountered

- {what was difficult and why}
- {any blockers or delays}

### Unaddressed Issues

- {any issues not addressed in the plan that came up during implementation}

### Recommendations for Process Improvement

- **Plan command**: {suggestions for planning improvements}
- **Execute command**: {suggestions for execution improvements}
- **Templates**: {suggestions for template improvements}
- **CLAUDE.md/AGENTS.md**: {patterns or anti-patterns to document}

*(If none: "No issues encountered — process worked smoothly.")*

---

## Ready for Commit

- All changes complete: {yes/no}
- All validations pass: {yes/no}
- All tests passing: {yes/no}
- Ready for `/commit`: {yes/no}

**If no to any above, explain what's blocking:**
{description of blockers or remaining work}

---

## Completion Sweep

> Before finishing, rename completed artifacts within `.agents/features/{feature}/`:

- `plan.md` → `plan.done.md` (plan fully executed)
- `plan-phase-{N}.md` → `plan-phase-{N}.done.md` (per completed phase)
- `plan-master.md` → `plan-master.done.md` (only when ALL phases done)
- `review.md` → `review.done.md` (if findings addressed)
- `review-{N}.md` → `review-{N}.done.md` (code-loop reviews)
- `loop-report-{N}.md` → `loop-report-{N}.done.md` (code-loop reports)

**Completed**: {yes/no — confirm all same-feature artifacts renamed}
