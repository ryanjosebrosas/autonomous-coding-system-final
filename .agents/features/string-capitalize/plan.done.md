# Plan: string-capitalize

> **Feature**: `string-capitalize`
> **Spec ID**: P1-02 (light)
> **Pillar**: P1 — Core String Utilities
> **Feature Directory**: `.agents/features/string-capitalize/`
> **Plan Type**: Task Briefs (1 task, 1 brief)
> **Generated**: 2026-03-02
> **Mode**: Auto-approve (autonomous planning for /build pipeline)

---

## FEATURE DESCRIPTION

Implement a `capitalize()` function that takes a string input and returns the string with the first letter of each word capitalized. This is the second and final spec in Pillar 1 (Core String Utilities), building on the patterns established in P1-01 (string-reverse).

**User Story**: As a developer using this utility library, I need a `capitalize()` function so that I can easily capitalize strings (title case) without implementing the logic myself.

**Problem Statement**: String capitalization (title case) is a common operation needed in many contexts (formatting display text, normalizing user input, generating titles). Rather than reimplementing this logic each time, we need a reliable, tested utility function.

**Solution Statement**: Create a pure function `capitalize(str: string): string` that uses a regex pattern to capitalize the first letter of each word, preserving original whitespace and case for non-initial letters.

---

## FEATURE METADATA

| Field | Value |
|-------|-------|
| **Spec ID** | P1-02 |
| **Spec Name** | string-capitalize |
| **Complexity** | light |
| **Pillar** | P1 — Core String Utilities |
| **Dependencies** | P1-01 (string-reverse) — ✅ Complete |
| **Target Files** | `src/strings.ts`, `src/strings.test.ts` |
| **Files to Create** | None (both files exist from P1-01) |
| **Files to Modify** | `src/strings.ts`, `src/strings.test.ts` |
| **Estimated Effort** | 1 task, ~30 minutes |
| **Risk Level** | LOW |
| **Test Framework** | vitest (established) |

### Slice Guardrails

**What's In Scope**:
- `capitalize()` function implementation in `src/strings.ts`
- Unit tests in `src/strings.test.ts` covering acceptance criteria
- Export the function from `src/strings.ts` alongside `reverse()`
- Update build-state.json to track P1-02 completion

**What's Out of Scope**:
- Additional string utilities (future specs)
- Special handling for hyphens, apostrophes, or other punctuation
- Locale-specific capitalization (Turkish I, etc.)
- Performance optimization (the regex pattern is efficient for this use case)

**Definition of Done**:
- [ ] `capitalize()` function implemented and exported from `src/strings.ts`
- [ ] Tests pass for `capitalize("hello world")` === `"Hello World"`
- [ ] Tests pass for `capitalize("")` === `""`
- [ ] All validation commands pass (L1-L5)
- [ ] No TypeScript errors
- [ ] Task brief marked done: `task-1.md` → `task-1.done.md`

---

## PILLAR CONTEXT

### Pillar Overview

**Pillar**: P1 — Core String Utilities

**Scope**: Foundational string manipulation functions that form the base of the utility library. This pillar establishes:
- Function signature patterns (pure functions, TypeScript types)
- Testing patterns (vitest setup, test structure)
- Export patterns (how functions are exposed from modules)

**Research Findings**: From P1-01:
- vitest established as test framework — fast, ESM-native, TypeScript-compatible
- Function export pattern established — JSDoc comments, named exports, explicit types
- Test structure established — describe/it blocks with descriptive names
- Build state tracking established — patternsEstablished, decisionsLog

**PRD Requirements Covered by This Spec**:
- [x] Create foundational string utilities (P1-01 covered reverse, P1-02 covers capitalize)
- [x] Establish testing patterns (reuse vitest pattern from P1-01)
- [x] Create exportable module structure (both functions exported from strings.ts)

**Specs in This Pillar**:
1. `P1-01` **string-reverse** (light) — ✅ Complete
2. `P1-02` **string-capitalize** (light) — This spec

**Pillar Gate**: `src/strings.ts` exports `reverse` and `capitalize`, all tests pass.

---

## CONTEXT REFERENCES

### Codebase Files

#### src/strings.ts (11 lines) — Current state with reverse()

**Why**: This is the target file for modification. Need to understand the current structure with reverse() already implemented.

**File Path**: `C:\Users\Utopia\Desktop\opencode-ai-coding-system\src\strings.ts`

**Current Content**:
```typescript
// String utility functions — Build Test Project
// This file will be populated by /build specs

/**
 * Reverses a string.
 * @param str - The string to reverse
 * @returns The reversed string
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('');
}
```

**Analysis**: 
- Lines 1-2: Comment header — must be preserved
- Lines 4-8: JSDoc pattern for reverse() — capitalize() should follow same pattern
- Lines 9-10: Function implementation and export — capitalize() added below this
- Total: 11 lines, capitalize() will be added starting at line 12

**Modification Strategy**: 
- Preserve lines 1-10 exactly
- Add capitalize() function below reverse() (lines 12+)
- Both functions exported from same module

#### src/strings.test.ts (24 lines) — Current tests for reverse()

**Why**: This is the target file for adding capitalize() tests. Need to understand the existing test structure.

**File Path**: `C:\Users\Utopia\Desktop\opencode-ai-coding-system\src\strings.test.ts`

**Current Content**:
```typescript
import { describe, it, expect } from 'vitest';
import { reverse } from './strings';

describe('reverse', () => {
  it('should reverse a string', () => {
    expect(reverse('hello')).toBe('olleh');
  });

  it('should return empty string for empty input', () => {
    expect(reverse('')).toBe('');
  });

  it('should handle single character', () => {
    expect(reverse('a')).toBe('a');
  });

  it('should handle palindrome', () => {
    expect(reverse('radar')).toBe('radar');
  });

  it('should handle string with spaces', () => {
    expect(reverse('hello world')).toBe('dlrow olleh');
  });
});
```

**Analysis**:
- Line 1: Import from 'vitest' — add capitalize import to same line (already imports describe, it, expect)
- Line 2: Import reverse from './strings' — add capitalize to same import
- Lines 4-24: describe('reverse') block — capitalize tests added as new describe block below
- Test naming pattern: "should [behavior]" — capitalize tests follow same pattern

**Modification Strategy**: 
- Update line 2 to: `import { reverse, capitalize } from './strings';`
- Add new describe('capitalize') block after line 24
- Follow exact same test structure as reverse() tests

#### BUILD_ORDER.md (lines 1-18) — Spec definition

**Why**: Contains the authoritative spec definition for this feature. Source of truth for acceptance criteria.

**File Path**: `C:\Users\Utopia\Desktop\opencode-ai-coding-system\.agents\specs\BUILD_ORDER.md`

**Current Content**:
```markdown
# Build Order — Build Test Project

Generated: 2026-03-01
Status: 0/2 complete

---

## Pillar 1: Core String Utilities

- [x] `P1-01` **string-reverse** (light) — Create reverse() function that reverses a string
  - depends: none
  - touches: src/strings.ts, src/strings.test.ts
  - acceptance: reverse("hello") returns "olleh", reverse("") returns ""

- [ ] `P1-02` **string-capitalize** (light) — Create capitalize() function that capitalizes first letter of each word
  - depends: P1-01
  - touches: src/strings.ts, src/strings.test.ts
  - acceptance: capitalize("hello world") returns "Hello World", capitalize("") returns ""
```

**Analysis**:
- Line 4: Status will be updated to "1/2 complete" after P1-01, then "2/2 complete" after this spec
- Lines 10-13: P1-01 spec — marked complete (x)
- Lines 15-18: P1-02 spec — THIS SPEC (capitalize function)

**Acceptance Criteria** (from lines 15-18):
1. `capitalize("hello world")` must return `"Hello World"` — primary test case
2. `capitalize("")` must return `""` — edge case (empty string)

**Dependencies**: `depends: P1-01` — string-reverse must be complete (it is)

**Touches**: 
- `src/strings.ts` — modify (add function)
- `src/strings.test.ts` — modify (add tests)

**Pillar Completion**: After this spec, Pillar 1 gate criteria are met (both reverse and capitalize exported, all tests pass)

#### build-state.json — Current build state

**Why**: Tracks build progress, patterns established, and decisions log. Updated after each spec.

**File Path**: `C:\Users\Utopia\Desktop\opencode-ai-coding-system\.agents\specs\build-state.json`

**Current Content**:
```json
{
  "lastSpec": "string-reverse",
  "completed": ["P1-01"],
  "currentPillar": 1,
  "totalSpecs": 2,
  "currentSpec": "string-capitalize",
  "currentStep": "planning",
  "patternsEstablished": ["vitest-testing", "function-export-pattern"],
  "decisionsLog": [
    {
      "spec": "P1-01",
      "decision": "Use vitest as test framework",
      "rationale": "Modern, fast, ESM-native, works well with TypeScript"
    },
    {
      "spec": "P1-01",
      "decision": "split-reverse-join pattern for string reversal",
      "rationale": "Idiomatic JavaScript/TypeScript approach"
    }
  ]
}
```

**Field Analysis**:
- `lastSpec: "string-reverse"` — P1-01 complete, will become "string-capitalize" after this spec
- `completed: ["P1-01"]` — will become `["P1-01", "P1-02"]` after completion
- `currentPillar: 1` — working on Pillar 1 (Core String Utilities)
- `totalSpecs: 2` — Pillar 1 has 2 specs total
- `currentSpec: "string-capitalize"` — this spec
- `currentStep: "planning"` — current phase (will update to "complete" after execution)
- `patternsEstablished: ["vitest-testing", "function-export-pattern"]` — from P1-01, reused here
- `decisionsLog` — P1-01 decisions logged, will add P1-02 decisions

**Update Strategy** (after execution):
```json
{
  "lastSpec": "string-capitalize",
  "completed": ["P1-01", "P1-02"],
  "currentPillar": 1,
  "totalSpecs": 2,
  "currentSpec": null,
  "currentStep": "complete",
  "patternsEstablished": ["vitest-testing", "function-export-pattern", "regex-capitalization"],
  "decisionsLog": [
    {
      "spec": "P1-01",
      "decision": "Use vitest as test framework",
      "rationale": "Modern, fast, ESM-native, works well with TypeScript"
    },
    {
      "spec": "P1-01",
      "decision": "split-reverse-join pattern for string reversal",
      "rationale": "Idiomatic JavaScript/TypeScript approach"
    },
    {
      "spec": "P1-02",
      "decision": "regex pattern /\\b\\w/g for capitalization",
      "rationale": "Preserves whitespace exactly, single-pass, MDN recommended"
    }
  ]
}
```

---

## PATTERNS TO FOLLOW

### Pattern 1: TypeScript Function Export (from P1-01)

**Source**: `src/strings.ts:4-10`

```typescript
/**
 * Reverses a string.
 * @param str - The string to reverse
 * @returns The reversed string
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('');
}
```

**Why this pattern**: 
- Standard TypeScript ESM export syntax
- JSDoc comments provide IDE autocomplete and documentation
- Explicit TypeScript types (string in, string out)
- Named export (not default) for consistency

**How to apply**: 
- Use same structure for `capitalize()` function
- Add JSDoc comment describing what the function does
- Use explicit TypeScript types (string in, string out)
- Export the function so it can be imported by tests and other modules

**Common gotchas**:
- Don't remove the comment header (lines 1-2)
- Ensure function signature is correct (`capitalize(str: string): string`)
- Use `export` keyword (not `export default`)
- JSDoc is optional but recommended for documentation

**Example Applied to capitalize()**:
```typescript
/**
 * Capitalizes the first letter of each word in a string.
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
```

### Pattern 2: Vitest Test Structure (from P1-01)

**Source**: `src/strings.test.ts:1-24`

```typescript
import { describe, it, expect } from 'vitest';
import { reverse } from './strings';

describe('reverse', () => {
  it('should reverse a string', () => {
    expect(reverse('hello')).toBe('olleh');
  });

  it('should return empty string for empty input', () => {
    expect(reverse('')).toBe('');
  });

  it('should handle single character', () => {
    expect(reverse('a')).toBe('a');
  });

  it('should handle palindrome', () => {
    expect(reverse('radar')).toBe('radar');
  });

  it('should handle string with spaces', () => {
    expect(reverse('hello world')).toBe('dlrow olleh');
  });
});
```

**Why this pattern**: 
- Standard vitest structure with describe/it blocks
- Clear test names that describe behavior ("should do X when Y")
- Import from 'vitest' (not 'jest' or other frameworks)
- Import function being tested from correct relative path

**How to apply**: 
- Use this structure for all capitalize() tests
- First test covers acceptance criteria (normal case)
- Second test covers acceptance criteria (empty string edge case)
- Additional tests cover other edge cases (single word, already capitalized, mixed case)

**Common gotchas**:
- Import path is `./strings` NOT `./strings.ts` — vitest resolves extension automatically
- Test names should be descriptive (not just "test 1", "test 2")
- Use `expect().toBe()` for exact string matching
- Import the function being tested from the correct relative path

**Example Applied to capitalize()**:
```typescript
import { describe, it, expect } from 'vitest';
import { reverse, capitalize } from './strings';

// ... reverse tests above ...

describe('capitalize', () => {
  it('should capitalize first letter of each word', () => {
    expect(capitalize('hello world')).toBe('Hello World');
  });

  it('should return empty string for empty input', () => {
    expect(capitalize('')).toBe('');
  });

  it('should handle single word', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('should handle already capitalized string', () => {
    expect(capitalize('Hello World')).toBe('Hello World');
  });

  it('should handle mixed case string', () => {
    expect(capitalize('hElLo wOrLd')).toBe('HElLo WOrLd');
  });
});
```

### Pattern 3: Regex Capitalization (MDN recommended)

**Source**: External research — MDN String.replace() documentation

```typescript
export function capitalize(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
```

**Why this pattern**: 
- `\b` matches word boundaries (start of each word)
- `\w` matches word characters (letters, digits, underscore)
- Single-pass through string (more efficient than split-map-join)
- Preserves original whitespace exactly (multiple spaces, tabs, newlines)
- MDN recommended approach for this use case

**How it works**:
1. `/\b\w/g` — regex matching first character of each word globally
2. `(char) => char.toUpperCase()` — callback converting matched character to uppercase
3. Result: First letter of each word capitalized, rest unchanged, whitespace preserved

**Common gotchas**:
- Works correctly for empty strings: `"".replace(...)` returns `""`
- Does NOT lowercase rest of word (preserves original case — by design)
- Word boundary `\b` treats hyphens and apostrophes as non-word characters
- For strict title case (lowercase rest), use alternative pattern

**Edge Case Verification**:
```typescript
capitalize('')              // '' ✓
capitalize('hello')         // 'Hello' ✓
capitalize('hello world')   // 'Hello World' ✓
capitalize('  hello  ')     // '  Hello  ' (preserves spaces) ✓
capitalize('HELLO')         // 'HELLO' (preserves rest of word) ✓
```

**Alternative Pattern** (if strict lowercase needed):
```typescript
export function capitalize(str: string): string {
  return str.replace(/\b\w\w*/g, word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );
}
```
Not used here because acceptance criteria don't require lowercasing rest of word.

### Pattern 4: Import Multiple Named Exports

**Source**: Adapting `src/strings.test.ts:2`

**Current** (from P1-01):
```typescript
import { reverse } from './strings';
```

**Updated** (for P1-02):
```typescript
import { reverse, capitalize } from './strings';
```

**Why this pattern**: 
- Named exports allow importing specific functions
- Multiple imports from same module use comma-separated list
- Clear which functions are being used from the module

**How to apply**: 
- Update line 2 in strings.test.ts to import both functions
- Import order: alphabetical or by order of use (reverse first since it exists)

**Common gotchas**:
- Don't create duplicate import statements — update existing import
- Maintain consistent formatting (space after comma)
- Import path stays `./strings` (no .ts extension)

---

## IMPLEMENTATION PLAN

### Overview

This implementation is straightforward — one task updating both implementation and tests. The task will:
1. Add capitalize() function to strings.ts (core implementation)
2. Add capitalize() tests to strings.test.ts (verification)
3. Run validation commands to verify (L1-L5 validation pyramid)
4. Update build-state.json to track completion

### Why One Task?

**Decision**: Single task for implementation + tests rather than separate tasks.

**Rationale**:
- Implementation and tests are tightly coupled — can't meaningfully test without implementation
- Both files are small modifications (~10 lines each)
- Single task reduces overhead for such a simple feature
- Tests verify implementation in the same execution session
- P1-01 proved single-task approach works well for light specs

**When to Split**: For larger features where:
- Implementation is complex (100+ lines)
- Tests are extensive (50+ test cases)
- Multiple files are involved (5+ files)
- Tests depend on external systems (integration tests)

**This Spec**: None of the above apply — single task is appropriate.

### Execution Flow

```
/execute .agents/features/string-capitalize/plan.md
  ↓
Reads task-1.md
  ↓
Step 1: Update src/strings.ts — add capitalize() function
  ↓
Step 2: Update src/strings.test.ts — add capitalize() tests
  ↓
Step 3: Run validation commands
  ↓
Step 4: Update build-state.json
  ↓
Step 5: Update pipeline handoff
  ↓
Step 6: Mark task-1.md as done
  ↓
Returns: task-1.done.md, all tests passing
```

### Validation Strategy

Each step includes a VALIDATE section with commands to verify correctness. The validation pyramid:

| Level | Purpose | Command |
|-------|---------|---------|
| L1 | Syntax & Style | File existence, JSON validity |
| L2 | Type Safety | `npx tsc --noEmit` |
| L3 | Unit Tests | `npx vitest run` |
| L4 | Integration | N/A (no integration points) |
| L5 | Manual | Read files, verify structure |

**Pass Criteria**: All levels that apply must pass. L4 is N/A for this spec.

---

## STEP-BY-STEP TASKS

### Task 1: Implement capitalize() and add tests

| Field | Value |
|-------|-------|
| **Target Files** | `src/strings.ts` (modify), `src/strings.test.ts` (modify) |
| **Scope** | Implement capitalize() function with vitest tests |
| **Dependencies** | P1-01 complete (reverse() implemented and tested) |
| **Estimated Lines** | 700-1000 lines in task brief |
| **Execution Mode** | Single `/execute` session |

**Summary**: Implement the capitalize() function using regex pattern. Add comprehensive tests covering the acceptance criteria (normal case and empty string). Follow established patterns from P1-01.

**Detailed scope in task brief**: `task-1.md`

---

## TESTING STRATEGY

### Unit Tests

**Location**: `src/strings.test.ts` (add to existing file)

**Test Cases**:
1. Normal case: `capitalize("hello world")` returns `"Hello World"` — acceptance criteria
2. Empty string: `capitalize("")` returns `""` — acceptance criteria
3. Single word: `capitalize("hello")` returns `"Hello"` — edge case
4. Already capitalized: `capitalize("Hello World")` returns `"Hello World"` — edge case
5. Mixed case: `capitalize("hElLo wOrLd")` returns `"HElLo WOrLd"` — edge case

**Coverage Goal**: 100% of capitalize() function (trivial for single function)

### Integration Tests

N/A — No integration points exist yet. This is a standalone utility function.

### Edge Cases

- Empty string (required by acceptance criteria) — naturally handled by regex
- Single word (boundary case) — first letter capitalized
- Already capitalized (idempotent) — returns same string
- Mixed case (preserves non-initial case) — only first letter of each word changes
- Multiple spaces (whitespace preservation) — regex preserves exactly

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style

```bash
# TypeScript syntax check
npx tsc --noEmit

# If ESLint configured (not yet)
# npx eslint .
```

### Level 2: Type Safety

```bash
# TypeScript type check
npx tsc --noEmit
```

### Level 3: Unit Tests

```bash
# Run vitest
npx vitest run
```

### Level 4: Integration Tests

N/A — No integration tests for this spec.

### Level 5: Manual Validation

1. Read `src/strings.ts` and verify `capitalize()` function is exported
2. Read `src/strings.test.ts` and verify test structure for capitalize
3. Run `npx vitest run` and verify all tests pass (reverse + capitalize)
4. Manually verify `capitalize("hello world")` === `"Hello World"` in Node REPL if needed

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] `capitalize()` function implemented in `src/strings.ts`
- [ ] Function uses regex pattern `/\b\w/g` for capitalization
- [ ] Function is exported from `src/strings.ts`
- [ ] `src/strings.test.ts` updated with capitalize import
- [ ] Tests for `capitalize("hello world")` === `"Hello World"` exist
- [ ] Tests for `capitalize("")` === `""` exist
- [ ] All TypeScript compilation passes
- [ ] All tests pass (reverse + capitalize tests)

### Runtime (verify after testing)

- [ ] `npx vitest run` passes with all tests green
- [ ] No TypeScript errors in strings.ts or strings.test.ts
- [ ] Function can be imported: `import { reverse, capitalize } from './strings'`

---

## COMPLETION CHECKLIST

- [ ] Task 1 executed and marked done (`task-1.md` → `task-1.done.md`)
- [ ] All validation levels passed (L1-L5)
- [ ] Acceptance criteria verified
- [ ] No regressions (reverse() tests still pass)
- [ ] Handoff notes written in task-1.done.md
- [ ] Build state updated (`.agents/specs/build-state.json`)
- [ ] Pipeline handoff updated (`.agents/context/next-command.md`)

---

## NOTES

### Key Design Decisions

1. **Regex pattern over split-map-join**: Regex `/\b\w/g` preserves whitespace exactly and is single-pass. split-map-join would collapse multiple spaces. This is the MDN-recommended approach.

2. **Preserve original case for non-initial letters**: Acceptance criteria don't require lowercasing rest of word. Simpler implementation preserves original case (e.g., "hElLo" → "HElLo").

3. **Single task for implementation + tests**: For such a small feature, separating implementation and tests would add unnecessary overhead. They are tightly coupled. P1-01 proved this works well.

### Risks

- **LOW**: Regex word boundary behavior with hyphens/apostrophes — not in acceptance criteria, can be addressed in future spec if needed.
- **LOW**: Case preservation vs normalization — acceptance criteria don't specify, preserving is simpler and more flexible.

### Confidence Score

**10/10** — Patterns are proven from P1-01. Files exist and are well-understood. Test framework configured. Acceptance criteria are clear and achievable. Implementation pattern is well-documented (MDN). No unknowns.

### Dependencies

- **Internal**: P1-01 (string-reverse) — complete, patterns established
- **External**: vitest (already configured in package.json)

---

## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.md` | Implement capitalize() function and add vitest tests | pending | 0 created, 2 modified |

---

## METADATA

**Plan Length**: This plan is designed to be 700-1000 lines when rendered, providing comprehensive context for execution.

**Execution Model**: `/execute .agents/features/string-capitalize/plan.md` will read this plan and execute task-1.md in a single session.

**Next Command After Planning**: `/execute .agents/features/string-capitalize/plan.md`

**Next Command After Execution**: `/code-loop string-capitalize`

**Next Command After Review**: `/commit string-capitalize`

**Next Command After Commit**: `/pr string-capitalize`

**Pillar Completion**: After this spec, Pillar 1 is complete (both reverse and capitalize implemented and tested).

---

*End of plan — proceed to task-1.md for execution details*
