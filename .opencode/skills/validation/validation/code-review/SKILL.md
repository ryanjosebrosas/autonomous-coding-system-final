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