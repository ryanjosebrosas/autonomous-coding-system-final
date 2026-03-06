# Task 3: Create Validation Skill Directories

**Status:** pending  
**Created:** 2026-03-06  

---

## Objective

Create the 4 missing validation skill directories documented in AGENTS.md but not implemented in the filesystem.

---

## Scope

### Files Created
- `.opencode/skills/validation/validation/code-review/SKILL.md`
- `.opencode/skills/validation/validation/code-review-fix/SKILL.md`
- `.opencode/skills/validation/validation/execution-report/SKILL.md`
- `.opencode/skills/validation/validation/system-review/SKILL.md`

### What's Out of Scope
- Existing skills (code-review, system-review at root level)
- Any behavior changes
- Test files

### Dependencies
None — this task is independent.

---

## Prior Task Context

None — this task is independent.

---

## Context References

### AGENTS.md Available Skills Section (Lines 239-260)

From AGENTS.md, the documented skills are:

**Built-in** (4): playwright, frontend-ui-ux, git-master, dev-browser  
**Project Skills** (18): code-loop, code-review, code-review-fix, commit, council, decompose, execute, final-review, mvp, pillars, planning-methodology, pr, prd, prime, system-review

**Validation Skills** (4):
- `validation/validation/code-review`
- `validation/validation/code-review-fix`
- `validation/validation/execution-report`
- `validation/validation/system-review`

### Missing Directories

The audit found these directories do NOT exist:
```
.opencode/skills/validation/validation/code-review/
.opencode/skills/validation/validation/code-review-fix/
.opencode/skills/validation/validation/execution-report/
.opencode/skills/validation/validation/system-review/
```

### Existing Skills Structure Template

From `.opencode/skills/code-review/SKILL.md`:

```markdown
---
name: code-review
description: Knowledge framework for severity classification, evidence-based findings, and actionable review output
license: MIT
compatibility: opencode
---

# Code Review — Severity Classification and Evidence Standards

This skill provides the quality standards for producing reviews that are
specific, evidence-based, and actionable. It complements the `/code-review` 
command — the command provides the workflow, this skill provides the 
classification criteria and review depth standards.

## When This Skill Applies
...
```

### Skill Naming Convention

The validation skills follow a namespace pattern:
- `validation/validation/code-review` → file at `.opencode/skills/validation/validation/code-review/SKILL.md`

---

## Patterns to Follow

### Pattern: SKILL.md Frontmatter

Every skill must have:
```markdown
---
name: skill-name
description: Single-line description
license: MIT
compatibility: opencode
---
```

### Pattern: Skill Content Structure

Based on existing skills:
1. **When This Skill Applies** — describe trigger conditions
2. **Core Methodology** — the framework or standards
3. **Key Rules** — numbered rules list
4. **Anti-Patterns** — what to avoid
5. **Related Commands** — linking to slash commands

---

## Step-by-Step Tasks

### Step 1: Create directory structure

**ACTION:** CREATE  
**TARGET:** Directory structure

Create directories:
```
.opencode/skills/validation/validation/code-review/
.opencode/skills/validation/validation/code-review-fix/
.opencode/skills/validation/validation/execution-report/
.opencode/skills/validation/validation/system-review/
```

---

### Step 2: Create validation/validation/code-review/SKILL.md

**ACTION:** CREATE  
**TARGET:** `.opencode/skills/validation/validation/code-review/SKILL.md`

```markdown
---
name: validation/validation/code-review
description: Project-level code review skill with severity classification and evidence-based findings
license: MIT
compatibility: opencode
---

# Validation Code Review — Project Skill Standards

This skill extends the built-in code-review skill with project-specific 
conventions and patterns. It complements the `/code-review` command.

## When This Skill Applies

- `/code-review` is invoked
- Pre-commit hook runs code review validation
- Inside `/code-loop` automated review cycles
- Project-specific review standards needed

## Relationship to Base Skill

This project skill supplements the built-in `code-review` skill:

**Built-in skill** provides:
- Generic severity classification (Critical/Major/Minor)
- Evidence standards (file:line, why, fix)
- Full file reading discipline

**Project skill** adds:
- Project-specific pattern recognition
- Convention enforcement (naming, structure)
- Tech stack considerations (TypeScript, React patterns)

## Project-Specific Standards

### TypeScript Patterns

**Critical if:**
- `as any` type assertion without documented reason
- `@ts-ignore` or `@ts-expect-error` without explanatory comment
- Empty catch block `catch(e) {}`

**Major if:**
- Missing return type on exported function
- Unused import after refactoring
- Complex type that could be simplified

### Code Organization

**Major if:**
- File exceeds 500 lines (consider splitting)
- Function exceeds 50 lines (consider extraction)
- Circular import detected

### Testing Standards

**Major if:**
- Deleted test file without replacement
- Test disabled with `.skip()` without issue reference

## Key Rules

1. **Project patterns override generic guidance** — When this skill and base skill conflict, project skill wins
2. **Tech-specific checks apply** — TypeScript, React, Node patterns in scope
3. **Test coverage is non-negotiable** — New code requires tests
4. **Documentation for public APIs** — Exported functions need JSDoc

## Related Commands

- `/code-review` — The review workflow this skill supports
- `/code-loop {feature}` — Automated review cycle
- `/final-review` — Human approval gate
```

---

### Step 3: Create validation/validation/code-review-fix/SKILL.md

**ACTION:** CREATE  
**TARGET:** `.opencode/skills/validation/validation/code-review-fix/SKILL.md`

```markdown
---
name: validation/validation/code-review-fix
description: Project-level bug fix discipline with severity ordering and per-fix verification
license: MIT
compatibility: opencode
---

# Validation Code Review Fix — Minimal Change Discipline

This skill extends the built-in code-review-fix skill with project-specific
fix discipline. It ensures fixes are minimal, targeted, and verified.

## When This Skill Applies

- `/code-review-fix {review-file}` is invoked
- Fixing findings from `/code-review` output
- Inside `/code-loop` fix cycles

## Fix Priority Order

Fix findings in severity order:

1. **Critical first** — Blocks all other work
2. **Major second** — Significant issues, fix before merge
3. **Minor last** — Quality improvements, consider batching

## Project-Specific Fix Standards

### Type Safety Fixes

**Incorrect approach:**
```typescript
// Adding @ts-ignore to suppress error
// @ts-ignore
someFunction(badInput)
```

**Correct approach:**
```typescript
// Fix the type, don't suppress
someFunction(badInput as unknown as ExpectedType) // Still wrong!
// Instead:
function validateInput(input: unknown): ExpectedType {
  // Validate and transform
}
someFunction(validateInput(badInput))
```

### Error Handling Fixes

**Incorrect approach:**
```typescript
catch(e) {} // Silent failure
```

**Correct approach:**
```typescript
catch(e) {
  logger.error('context-descriptor', e)
  throw e // Or handle appropriately
}
```

### Test Fixes

**Incorrect approach:**
```typescript
it.skip('failing test', () => { ... }) // Without issue tracking
```

**Correct approach:**
```typescript
// Document why and create follow-up
it.skip('failing test - issue #123 needs API mock fix', () => { ... })
```

## Fix Verification

After each fix:

1. **Run the specific validation** — Don't run all tests, run the affected test
2. **Verify no regression** — Ensure fix doesn't break other tests
3. **Lint the changed file** — Code style must pass

## Key Rules

1. **Fix severity order** — Critical before Major before Minor
2. **Minimal changes** — Don't refactor while fixing
3. **One fix per commit ideally** — Or one logical fix group
4. **Verify each fix** — Run validation after each
5. **No type suppression** — Fix types, don't bypass

## Related Commands

- `/code-review` — Produces the findings file
- `/code-loop` — Automates fix and re-review cycle
- `/commit` — Commit after all fixes verified
```

---

### Step 4: Create validation/validation/execution-report/SKILL.md

**ACTION:** CREATE  
**TARGET:** `.opencode/skills/validation/validation/execution-report/SKILL.md`

```markdown
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
```

---

### Step 5: Create validation/validation/system-review/SKILL.md

**ACTION:** CREATE  
**TARGET:** `.opencode/skills/validation/validation/system-review/SKILL.md`

```markdown
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
```

---

## Testing Strategy

### Manual Validation

After creating skills:
- [ ] All 4 directories exist
- [ ] Each SKILL.md has valid frontmatter
- [ ] Skill names match expected paths
- [ ] Skills are loadable by the skill loader

---

## Validation Commands

| Level | Command | Expected |
|-------|---------|----------|
| L1 | `ls -la .opencode/skills/validation/validation/*/SKILL.md` | 4 files listed |

---

## Acceptance Criteria

### Implementation Criteria
- [ ] `.opencode/skills/validation/validation/code-review/SKILL.md` exists with frontmatter
- [ ] `.opencode/skills/validation/validation/code-review-fix/SKILL.md` exists with frontmatter
- [ ] `.opencode/skills/validation/validation/execution-report/SKILL.md` exists with frontmatter
- [ ] `.opencode/skills/validation/validation/system-review/SKILL.md` exists with frontmatter
- [ ] All skills have `name`, `description`, `license`, `compatibility` in frontmatter

### Runtime Verification
- [ ] Skills can be loaded by skill loader
- [ ] Skills appear in available skills list

---

## Handoff Notes

After completing this task:
- All validation skills documented in AGENTS.md now exist
- Task 4 will populate skill recommendations for empty categories
- Skills follow the established SKILL.md pattern