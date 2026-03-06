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