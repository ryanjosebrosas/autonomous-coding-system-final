---
name: validation/validation/execution-report
description: Project-level execution report standards for plan adherence and divergence tracking
license: MIT
compatibility: opencode
---

# Validation Execution Report — Implementation Tracking

This skill extends the execution reporting with project-specific standards
for tracking plan adherence and documenting divergences.

## When This Skill Applies

- `/execute {plan}` completes a task
- `/system-review` analyzes execution quality
- `/code-loop` generates reports between cycles

## Report Structure

Every execution report must include:

1. **Summary** — What was implemented (2-3 sentences)
2. **Files Modified** — Complete list with change counts
3. **Plan Adherence** — Did execution match the plan?
4. **Divergences** — What deviated from plan and why
5. **Validation Results** — L1-L5 check outcomes

## Project-Specific Report Standards

### Plan Adherence Scoring

**Full adherence:**
- All planned files modified
- All patterns followed
- No scope creep

**Minor divergence:**
- Additional file modified (documented reason)
- Pattern adapted slightly (explained)

**Major divergence:**
- Different approach taken (requires explanation)
- Files not touched that should have been
- Validation skipped

### Divergence Classification

| Class | Description | Example |
|-------|-------------|----------|
| Good ✅ | Plan limitation discovered | "Plan referenced deprecated function, found replacement" |
| Neutral ⚪ | Implementation detail changed | "Used helper function instead of inline code" |
| Bad ❌ | Executor preference | "Chose different approach without justification" |

### Validation Ladder

| Level | Check | Tool |
|-------|-------|------|
| L1 | Lint | `eslint` or `ruff` |
| L2 | Types | `tsc --noEmit` or `mypy` |
| L3 | Unit | `vitest run` or `pytest` |
| L4 | Integration | `vitest run integration/` |
| L5 | Manual | Human review |

## Key Rules

1. **Every file change documented** — No hidden modifications
2. **Divergences explained** — Not just listed, justified
3. **Validation run results** — Pass/fail for each level
4. **Scope boundaries noted** — What was intentionally out of scope

## Related Commands

- `/execute {plan}` — Generates the report
- `/system-review` — Analyzes the report
- `/code-loop` — Uses reports between cycles