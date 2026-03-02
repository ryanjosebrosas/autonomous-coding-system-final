---
description: Process and fix bugs found in code review
---

# Validation: Code Review Fix

Fix issues found by `/validation/code-review` or `/code-review`. Takes a review artifact and systematically resolves each issue.

## Usage

```
/validation/code-review-fix <review-file-or-description> [scope]
```

- `$1` — Path to code review file (e.g., `.agents/reviews/auth-review.md`) OR inline description of issues
- `$2` — Optional scope constraint (e.g., `src/auth/` to limit fixes to specific directory)

## Process

### Step 1: Read the Review

If `$1` is a file path:
1. Read the entire review file to understand all issues
2. Sort issues by severity: critical → high → medium → low
3. Count total issues to fix

If `$1` is an inline description:
1. Parse the issues described
2. Classify severity if not already done

### Step 2: Fix Each Issue (Sequential)

For EACH issue, starting with critical severity:

**a. Explain what was wrong**
- Quote the problematic code
- Explain why it's a problem (the root cause, not just the symptom)

**b. Implement the fix**
- Show the fix with context
- Fix the root cause, not the symptom
- If the fix affects other files, fix those too
- Maintain consistency with existing project patterns

**c. Verify the fix**
- Create relevant tests if none exist for this code path
- Run existing tests to confirm no regression
- Run type checker on the changed file
- Run linter on the changed file

**If scope ($2) is provided:**
- Only fix issues within the specified scope
- Report any out-of-scope issues as "deferred" with explanation

### Step 3: Run Full Validation

After all fixes are applied, run the project's validation pyramid:

```bash
{configured lint command}        # L1: Syntax & Style
{configured type check command}  # L2: Type Safety
{configured test command}        # L3: Tests
```

Report results for each level.

### Step 4: Report

```
CODE REVIEW FIX REPORT
======================

Issues fixed: {N}/{total}
- Critical: {fixed}/{total}
- High:     {fixed}/{total}
- Medium:   {fixed}/{total}
- Low:      {fixed}/{total}

Deferred (out of scope): {N}
Tests added: {N}

Validation:
- Lint:  PASS/FAIL
- Types: PASS/FAIL
- Tests: PASS/FAIL ({passed}/{total})

Status: ALL FIXED / {N} REMAINING
```

### Step 5: Mark Review Done

If all issues are fixed and validation passes:
- Rename the review file from `.md` to `.done.md`

If issues remain:
- Leave the review file as `.md`
- Note which issues are still open

## Rules

- Fix critical and high issues first — always
- Never introduce new issues while fixing existing ones
- If a fix is non-trivial (changes architecture), stop and create a plan via `/planning` instead
- Test each fix individually before moving to the next
- If the review file doesn't exist, ask the user to describe the issues or run `/validation/code-review` first
