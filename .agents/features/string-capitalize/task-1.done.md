# Task 1 of 1: Implement capitalize() function and add tests

> **Feature**: `string-capitalize`
> **Brief Path**: `.agents/features/string-capitalize/task-1.md`
> **Plan Overview**: `.agents/features/string-capitalize/plan.md`
> **Spec ID**: P1-02 (light)
> **Pillar**: P1 — Core String Utilities

---

## OBJECTIVE

> What this task delivers. One precise sentence — the test for "done."

Implement the `capitalize()` function in `src/strings.ts` using the regex pattern `/\b\w/g` and add `src/strings.test.ts` tests covering all acceptance criteria, following established patterns from P1-01, then mark this brief done.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `src/strings.ts` | UPDATE | Add `capitalize()` function implementation and export after reverse() |
| `src/strings.test.ts` | UPDATE | Add capitalize import and describe('capitalize') test block |

**Out of Scope:**
- Creating new files (both files exist from P1-01)
- Modifying package.json (vitest already configured)
- Additional string utilities (future specs)
- ESLint or TypeScript configuration (not needed for this light spec)

**Dependencies:**
- P1-01 (string-reverse) — ✅ Complete, patterns established

---

## PRIOR TASK CONTEXT

### From P1-01 (string-reverse)

**Current State**:
- `src/strings.ts` exists with `reverse()` function implemented (11 lines)
- `src/strings.test.ts` exists with 5 tests for reverse() (24 lines)
- `package.json` exists with vitest configured
- Established patterns: vitest-testing, function-export-pattern

**State Carried Forward**:
- Test framework is vitest (use same structure as reverse() tests)
- Function export pattern established (JSDoc comments, named exports, TypeScript types)
- Test file naming: `{module}.test.ts`
- Test structure: describe/it blocks with descriptive names
- Build state: P1-01 complete, ready for P1-02

**Known Issues or Deferred Items**:
- None from P1-01 — all tests pass, patterns are proven

---

## CONTEXT REFERENCES

> IMPORTANT: Read ALL files listed here before implementing. They are not optional.
> All relevant content MUST be pasted inline in this section or in the Steps below.
> The executing model reads this instead of opening the file.

### Files to Read

> List files with line ranges for the executing model to verify against.
> Then paste the actual content inline in code blocks below each reference.

- `src/strings.ts` (all 11 lines) — Why: This is the target file to modify. Need to see the current structure with reverse().
- `src/strings.test.ts` (all 24 lines) — Why: This is the target file for adding capitalize() tests. Need to see existing test structure.
- `.agents/specs/BUILD_ORDER.md` (lines 1-18) — Why: Contains the authoritative spec definition and acceptance criteria.
- `.agents/specs/build-state.json` (all 21 lines) — Why: Confirms build state, P1-01 completion, and patterns established.

### Current Content: src/strings.ts (All 11 lines)

> Paste the exact content from the file in a code block. This is NOT optional.

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

**Analysis**: The file has reverse() implemented with JSDoc comment (lines 4-8) and export (lines 9-10). The comment header (lines 1-2) must be preserved. capitalize() will be added below reverse() starting at line 12.

### Current Content: src/strings.test.ts (All 24 lines)

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

**Analysis**: Test file imports reverse() from './strings' (line 2). Has describe('reverse') block with 5 tests. capitalize() tests will be added as a new describe('capitalize') block after line 24. Import on line 2 must be updated to include capitalize.

### Current Content: BUILD_ORDER.md (Lines 1-18)

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

**Analysis**: Clear acceptance criteria for this spec. Two test cases required:
1. `capitalize("hello world")` must return `"Hello World"`
2. `capitalize("")` must return `""`

P1-01 is marked complete (x). P1-02 is this spec. After completion, Pillar 1 gate criteria are met.

### Current Content: build-state.json (All 21 lines)

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

**Analysis**: Confirms P1-01 is complete (`completed: ["P1-01"]`). Patterns established from P1-01: vitest-testing, function-export-pattern. Current spec is string-capitalize. After execution, build-state.json should be updated to reflect P1-02 completion.

### Patterns to Follow

> This section is NOT optional. Every task has at least one pattern to follow.
> Include COMPLETE code snippets from the codebase — copy-pasteable, not summaries.
> If the task creates a new file, the pattern is the closest existing analog.
> If the task modifies a file, the pattern is the established style in that file.

**Pattern 1: TypeScript Function Export** (from `src/strings.ts:4-10`):

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

- Why this pattern: Standard TypeScript ESM export syntax, JSDoc comments for documentation, explicit types.
- How to apply: Use same structure for capitalize() — JSDoc comment, named export, TypeScript types.
- Common gotchas: Preserve comment header (lines 1-2), use `export` keyword (not default), match function signature.

**Pattern 2: Vitest Test Structure** (from `src/strings.test.ts:4-24`):

```typescript
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

- Why this pattern: Standard vitest structure with describe/it blocks, clear test names that describe behavior.
- How to apply: Use same structure for capitalize() tests — describe('capitalize'), it('should...') blocks.
- Common gotchas: Import path is `./strings` not `./strings.ts`, test names should be descriptive.

**Pattern 3: Regex Capitalization** (MDN recommended pattern):

```typescript
export function capitalize(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
```

- Why this pattern: Idiomatic JavaScript/TypeScript capitalization using regex, preserves whitespace exactly, single-pass.
- How to apply: This is the exact implementation for capitalize().
- Common gotchas: Works correctly for empty strings, preserves original case for non-initial letters, word boundary treats hyphens/apostrophes as non-word characters.

**Pattern 4: Multiple Named Imports** (adapting `src/strings.test.ts:2`):

Current:
```typescript
import { reverse } from './strings';
```

Updated:
```typescript
import { reverse, capitalize } from './strings';
```

- Why this pattern: Named exports allow importing specific functions, comma-separated list for multiple imports.
- How to apply: Update line 2 in strings.test.ts to include capitalize.
- Common gotchas: Don't create duplicate import statements, maintain consistent formatting.

---

## STEP-BY-STEP TASKS

> Execute every step in order. Each step is atomic and independently verifiable.

---

### Step 1: UPDATE `src/strings.ts`

**What**: Add the capitalize() function implementation to the strings module after reverse().

**IMPLEMENT**:

Current (all 11 lines of `src/strings.ts`):
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

Replace with:
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

/**
 * Capitalizes the first letter of each word in a string.
 * @param str - The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}
```

**PATTERN**: `src/strings.ts:4-10` — follows same JSDoc + export pattern as reverse()

**IMPORTS**: N/A — no imports needed for this pure function

**GOTCHA**: Preserve the comment header exactly as-is (lines 1-2). Add capitalize() after reverse() (line 12+). The JSDoc comment is required for consistency with reverse(). The function must be exported (use `export` keyword). Function signature must be `capitalize(str: string): string`.

**VALIDATE**:
```bash
# Check TypeScript compilation (if tsconfig exists)
npx tsc --noEmit src/strings.ts

# Or verify syntax with Node
node -e "console.log('Syntax OK')"
```

---

### Step 2: UPDATE `src/strings.test.ts`

**What**: Add capitalize import and create describe('capitalize') test block with 5 tests.

**IMPLEMENT**:

Current line 2 of `src/strings.test.ts`:
```typescript
import { reverse } from './strings';
```

Replace with:
```typescript
import { reverse, capitalize } from './strings';
```

Current end of file (line 24):
```typescript
  it('should handle string with spaces', () => {
    expect(reverse('hello world')).toBe('dlrow olleh');
  });
});
```

Append after line 24:
```typescript

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

**PATTERN**: `src/strings.test.ts:4-24` — follows same describe/it structure as reverse() tests

**IMPORTS**: 
```typescript
import { reverse, capitalize } from './strings';
```

**GOTCHA**: Import path is `./strings` NOT `./strings.ts` — vitest resolves the extension automatically. Update existing import on line 2, don't create duplicate import. Add capitalize() describe block after reverse() block (line 25+). All test cases must use the exact acceptance criteria values. Test names should follow pattern "should [behavior]".

**VALIDATE**:
```bash
# Verify file syntax
node -e "console.log('Syntax OK')"
```

---

### Step 3: RUN VALIDATION COMMANDS

**What**: Execute all validation levels to verify the implementation.

**IMPLEMENT**:

Run each validation command in order and verify all pass:

```bash
# Level 1: Syntax & Style
# Verify files exist and are well-formed
ls -la src/strings.ts src/strings.test.ts

# Level 2: Type Safety
npx tsc --noEmit

# Level 3: Unit Tests
npx vitest run

# Level 5: Manual Validation
# Read the files and verify structure
# Already done via automated tests
```

**PATTERN**: Validation pyramid (L1-L5) from P1-01

**IMPORTS**: N/A

**GOTCHA**: vitest must be installed — run `npm install` if not already done. Both reverse() and capitalize() tests must pass. If TypeScript is not configured, L2 may be skipped (N/A for this simple case).

**VALIDATE**:
```bash
# All tests must pass (reverse + capitalize)
npx vitest run
# Expected output: "Test Files  1 passed (1)" and "Tests  10 passed (10)"
```

---

### Step 4: UPDATE BUILD STATE

**What**: Update `.agents/specs/build-state.json` to reflect P1-02 completion.

**IMPLEMENT**:

Current content of `.agents/specs/build-state.json`:
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

Replace with:
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

**PATTERN**: Build state update from P1-01 completion

**IMPORTS**: N/A

**GOTCHA**: Ensure JSON is valid (no trailing commas, proper quoting). The `lastSpec` should be "string-capitalize". The `completed` array should include both P1-01 and P1-02. The `currentStep` should be "complete" (Pillar 1 is done). Add new pattern "regex-capitalization" to patternsEstablished. Add P1-02 decision to decisionsLog.

**VALIDATE**:
```bash
# Verify JSON is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('.agents/specs/build-state.json', 'utf8')))"
```

---

### Step 5: UPDATE PIPELINE HANDOFF

**What**: Update `.agents/context/next-command.md` to reflect completion and next step.

**IMPLEMENT**:

Current handoff (from prior command):
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /planning
- **Feature**: string-capitalize
- **Next Command**: /execute .agents/features/string-capitalize/plan.md
- **Task Progress**: 0/1 complete
- **Timestamp**: 2026-03-02T...
- **Status**: awaiting-execution
```

Replace with:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /execute (task 1 of 1)
- **Feature**: string-capitalize
- **Next Command**: /code-loop string-capitalize
- **Task Progress**: 1/1 complete
- **Timestamp**: 2026-03-02T...
- **Status**: awaiting-review
```

**PATTERN**: Pipeline handoff format from P1-01

**IMPORTS**: N/A

**GOTCHA**: Use current ISO 8601 timestamp. Status must be `awaiting-review` to trigger code-loop in the next session. Task progress shows 1/1 complete. Last Command indicates this was the execute phase.

**VALIDATE**:
```bash
# Verify handoff file exists and has correct status
grep "awaiting-review" .agents/context/next-command.md
```

---

### Step 6: MARK TASK BRIEF DONE

**What**: Rename task brief to indicate completion.

**IMPLEMENT**:

After all steps complete and validation passes:

```bash
# Rename task brief to mark done
move .agents\features\string-capitalize\task-1.md .agents\features\string-capitalize\task-1.done.md
```

**PATTERN**: `.done.md` lifecycle convention from P1-01

**IMPORTS**: N/A

**GOTCHA**: Only mark done after ALL validation commands pass and acceptance criteria are verified. The `.done.md` suffix signals to `/prime` and `/execute` that this task is complete.

**VALIDATE**:
```bash
# Verify file was renamed
dir .agents\features\string-capitalize\task-1.done.md
```

---

## TESTING STRATEGY

> Every brief must include a testing strategy, even for configuration/doc changes.
> For markdown/config changes, manual testing IS the strategy — describe it precisely.

### Unit Tests

**Location**: `src/strings.test.ts` (add to existing file)

**Test Cases** (5 total):
1. Normal case: `capitalize("hello world")` returns `"Hello World"` — acceptance criteria
2. Empty string: `capitalize("")` returns `""` — acceptance criteria
3. Single word: `capitalize("hello")` returns `"Hello"` — edge case
4. Already capitalized: `capitalize("Hello World")` returns `"Hello World"` — edge case
5. Mixed case: `capitalize("hElLo wOrLd")` returns `"HElLo WOrLd"` — edge case

**Coverage Goal**: 100% of capitalize() function (trivial for single function)

**Combined Test Count**: 10 tests total (5 reverse + 5 capitalize)

### Integration Tests

N/A — No integration points exist yet. This is a standalone utility function.

### Edge Cases

- **Empty string** (required by acceptance criteria) — naturally handled by regex
- **Single word** (boundary case) — first letter capitalized
- **Already capitalized** (idempotent) — returns same string
- **Mixed case** (preserves non-initial case) — only first letter of each word changes
- **Multiple spaces** (whitespace preservation) — regex preserves exactly (not explicitly tested, but guaranteed by pattern)

---

## VALIDATION COMMANDS

> Execute every level that applies. Full depth is required — one signal is not enough.
> For markdown/config changes: L1 is file existence check, L5 is manual walkthrough.

### Level 1: Syntax & Style
```bash
# Files exist and are well-formed
ls -la src/strings.ts src/strings.test.ts

# Verify build-state.json is valid JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('.agents/specs/build-state.json', 'utf8')))"
```

### Level 2: Type Safety
```bash
# TypeScript type check (if tsconfig exists)
npx tsc --noEmit

# If no tsconfig, this level is N/A
# N/A — no TypeScript configuration yet
```

### Level 3: Unit Tests
```bash
# Run vitest
npx vitest run

# Expected output:
# Test Files  1 passed (1)
# Tests  10 passed (10)
```

### Level 4: Integration Tests
```bash
# N/A — no integration tests for this spec
# Covered by Level 5 manual validation
```

### Level 5: Manual Validation

> Precise walkthrough. Not "test it" — exact steps that produce evidence.

1. Read `src/strings.ts` and verify both `reverse()` and `capitalize()` functions are exported with correct signatures
2. Read `src/strings.test.ts` and verify both describe blocks exist (reverse and capitalize)
3. Verify capitalize has 5 test cases (acceptance criteria + 3 edge cases)
4. Run `npx vitest run` and verify output shows "10 passed" (5 reverse + 5 capitalize)
5. Verify BUILD_ORDER.md spec P1-02 is now complete (mentally note for next planning)
6. Verify build-state.json shows P1-02 in completed array

**What success looks like**: All files exist, all 10 tests pass, no TypeScript errors.

**What failure looks like**: Test failures indicate implementation error. Check the error message and fix the capitalize() implementation.

### Level 6: Cross-Check (Optional)

N/A — this task has no cross-task dependencies (single task for this spec).

---

## ACCEPTANCE CRITERIA

> Implementation items: verify during execution and check off.
> Runtime items: verify during manual testing after execution.
>
> DO NOT check off an item unless you have concrete evidence from this run.

### Implementation (verify during execution)

- [ ] `capitalize()` function implemented in `src/strings.ts`
- [ ] Function uses regex pattern `str.replace(/\b\w/g, (char) => char.toUpperCase())`
- [ ] Function is exported from `src/strings.ts` (uses `export` keyword)
- [ ] Function has JSDoc comment with @param and @returns
- [ ] `src/strings.test.ts` updated with capitalize import
- [ ] describe('capitalize') block added with 5 test cases
- [ ] Test for `capitalize("hello world")` === `"Hello World"` exists and passes
- [ ] Test for `capitalize("")` === `""` exists and passes
- [ ] `npx vitest run` passes with all 10 tests green (5 reverse + 5 capitalize)
- [ ] Build state updated (`.agents/specs/build-state.json`)
- [ ] Pipeline handoff updated (`.agents/context/next-command.md`)
- [ ] Task brief marked done (`task-1.md` → `task-1.done.md`)

### Runtime (verify after testing)

- [ ] `npx vitest run` passes with exit code 0
- [ ] No TypeScript errors in strings.ts or strings.test.ts
- [ ] Both functions can be imported: `import { reverse, capitalize } from './strings'`
- [ ] Empty string returns empty string (verified by test)
- [ ] No regressions — reverse() tests still pass

---

## HANDOFF NOTES

> What the NEXT task needs to know. Written AFTER execution completes.
> These feed into Task N+1's "Prior Task Context" section.

### Files Created/Modified

- `src/strings.ts` — Added `capitalize()` function with JSDoc comment, exported (now 21 lines)
- `src/strings.test.ts` — Added 5 capitalize test cases in describe('capitalize') block (now ~45 lines)

### Patterns Established

- **regex-capitalization** — Use `/\b\w/g` pattern for title case, preserves whitespace exactly

### State to Carry Forward

- Pillar 1 is complete (both reverse and capitalize implemented and tested)
- Test framework is vitest (use for all future specs)
- Test file naming: `{module}.test.ts`
- Test structure: describe/it structure, import from 'vitest'
- Build state updated: P1-01 and P1-02 complete, Pillar 1 done

### Known Issues or Deferred Items

- No TypeScript configuration (tsconfig.json) — may be needed for L2 validation in future specs
- No ESLint configuration — may be needed for L1 validation in future specs
- Regex word boundary behavior with hyphens/apostrophes — not in acceptance criteria, defer if needed
- Case normalization (lowercasing rest of word) — not required by acceptance criteria, defer if needed

---

## COMPLETION CHECKLIST

> Final gate before marking this brief done. All boxes must be checked.

- [ ] All steps completed in order (Step 1 through Step 6)
- [ ] Step 1 VALIDATE: strings.ts has correct capitalize() implementation
- [ ] Step 2 VALIDATE: strings.test.ts has capitalize import and 5 test cases
- [ ] Step 3 VALIDATE: All validation levels run and passed
- [ ] Step 4 VALIDATE: build-state.json updated correctly
- [ ] Step 5 VALIDATE: next-command.md updated with awaiting-review status
- [ ] Step 6 VALIDATE: task-1.md renamed to task-1.done.md
- [ ] All validation levels run (L1, L2 if applicable, L3, L5)
- [ ] Manual testing confirms expected behavior (all 10 tests pass)
- [ ] Implementation acceptance criteria all checked (12 items above)
- [ ] No regressions in reverse() tests (all 5 reverse tests still pass)
- [ ] Handoff notes written (section above)
- [ ] Brief marked done: rename `task-1.md` → `task-1.done.md`

---

## NOTES

### Key Design Decisions (This Task)

1. **Regex pattern over split-map-join**: Chosen for whitespace preservation and single-pass efficiency. MDN recommended approach.

2. **Preserve original case for non-initial letters**: Acceptance criteria don't require lowercasing rest of word. Simpler implementation preserves original case.

3. **Single task for implementation + tests**: For a light spec with 2 file modifications, combining into one task reduces overhead. Files are tightly coupled (tests depend on implementation).

4. **5 test cases**: Covers both acceptance criteria plus 3 edge cases (single word, already capitalized, mixed case) for robustness.

### Trade-offs Accepted

- Regex may behave unexpectedly with hyphens/apostrophes — acceptable since not in acceptance criteria
- No case normalization (rest of word preserved) — acceptable since acceptance criteria don't specify
- No tsconfig.json yet — acceptable for this light spec, may be needed later

### Implementation Notes

- The regex pattern `/\b\w/g` works correctly for ALL strings including empty strings
- No error handling needed — function accepts any string input
- JSDoc comment is required for consistency with reverse()
- Test file imports from `./strings` (no .ts extension) — vitest resolves automatically
- Both functions exported from same module (strings.ts)

### What to Check First If Validation Fails

1. **Tests fail**: Check the error message — likely implementation error in capitalize()
2. **Import error**: Verify import path is `./strings` not `./strings.ts`
3. **vitest not found**: Run `npm install` first
4. **TypeScript errors**: Check function signature matches `capitalize(str: string): string`
5. **Reverse tests fail**: Check that reverse() wasn't accidentally modified

### Pillar 1 Completion

After this task completes:
- Pillar 1 gate criteria are met: `src/strings.ts` exports both `reverse` and `capitalize`
- All tests pass (10 total: 5 reverse + 5 capitalize)
- Build state shows Pillar 1 complete
- Ready for next pillar or feature (depending on project roadmap)

---

> **Reminder**: Mark this brief done after execution:
> Rename `task-1.md` → `task-1.done.md`
> This signals to `/execute` (via artifact scan) that this task is complete.
