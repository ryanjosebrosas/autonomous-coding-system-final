---
name: validation/validation/system-review
description: Project-level meta-analysis of pipeline quality, divergence judgment, and process improvements
license: MIT
compatibility: opencode
---

# Validation System Review — Process Quality Analysis

This skill extends the built-in system-review skill with project-specific
standards for analyzing implementation process quality.

## When This Skill Applies

- `/system-review` is invoked after implementation
- `/code-loop` cycles need quality scoring
- Memory.md suggestions are being evaluated

## Relationship to Base Skill

The built-in `system-review` skill provides:
- Process vs code analysis distinction
- Scoring formula (Plan Adherence, Divergence Judgment, etc.)
- Memory suggestion standards

This project skill adds:
- Project-specific scoring criteria
- Convention adherence checking
- Tech stack process validation

## Project-Specific Review Standards

### TypeScript Project Quality

**Plan Adherence Check:**
- Did implementation follow the file structure in plan?
- Were the planned patterns actually used?
- Did TypeScript types get properly defined?

**Code Quality Component:**
- Type safety score: `(1 - error count / loc) * 10`
- Import organization score
- Export coherence score

### Validation Ladder Check

| Level | Expected | Actual | Status |
|-------|----------|--------|--------|
| L1 | Lint clean | result | ✓/✗ |
| L2 | Types clean | result | ✓/✗ |
| L3 | Unit tests pass | result | ✓/✗ |
| L4 | Integration pass | result | ✓/✗ |
| L5 | Manual review | result | ✓/✗ |

### Memory Suggestion Standards

Good memory suggestions:
- Named the exact asset to update (file, section)
- Has transferable lesson (applies beyond this feature)
- Specific enough to change behavior

Bad memory suggestions:
- "Be more careful" — too vague
- "This happened once" — not transferable
- "Everything" — not actionable

## Scoring Criteria

| Component | Weight | Assessment |
|-----------|--------|------------|
| Plan Adherence | 40% | File + pattern match |
| Plan Quality | 20% | Section completeness |
| Divergence Justification | 30% | Good vs Bad ratio |
| Code Quality | 10% | From code review |

## Key Rules

1. **System review ≠ code review** — Focus on process, not implementation details
2. **Score honestly** — Inflated scores provide no learning
3. **Memory suggestions are precious** — They improve every future session
4. **Divergence evidence required** — "Better approach" needs justification

## Related Commands

- `/system-review` — The meta-analysis workflow
- `/code-review` — Feeds Code Quality component
- `/execute {plan}` — Generates the execution report being analyzed