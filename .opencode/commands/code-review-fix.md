---
description: Process to fix bugs found in manual/AI code review
model: claude-sonnet-4-6
---

# Code Review Fix: Fix Issues from Review

Fix issues identified in a code review report. Processes findings by severity and applies fixes systematically.

## Usage

```
/code-review-fix [review-file] [scope]
```

**Arguments:**
- `review-file` (required): Path to code review report (e.g., `.agents/features/{feature}/review.md`)
- `scope` (optional): What to fix
  - `all` (default) — Fix all issues regardless of severity
  - `critical+major` — Fix only Critical and Major issues, skip Minor
  - `critical` — Fix only Critical issues
  - `file-path` — Fix issues only in specified file(s)

## Pipeline Position

Used after `/code-review`, before `/commit`:

```
/code-review → /code-review-fix → /code-review (re-verify) → /commit
```

Also used inside `/code-loop` automated review-fix cycle.

---

## Hard Entry Gate (Non-Skippable)

Before any fix work:

1. Verify `$ARGUMENTS` includes a review file path
2. Verify the review file exists and contains findings
3. If either check fails, stop and report:
   - `Blocked: /code-review-fix requires a review file. Run /code-review first.`

Never run fixes without a review artifact.

---

## Step 1: Read Review File

Read the entire code review report to understand all issues:

```
- Parse findings by severity (Critical/Major/Minor)
- Extract file paths and line numbers
- Note any RAG-informed or second-opinion findings
```

If no issues found in the file: "Review file indicates no issues. Nothing to fix." and stop.

---

## Step 2: Filter by Scope

Apply the scope parameter to filter findings:

| Scope | What Gets Fixed |
|-------|----------------|
| `all` | All findings regardless of severity |
| `critical+major` | Only Critical and Major findings |
| `critical` | Only Critical findings |
| `file-path` | Only findings in specified file(s) |

Report: "Fixing {N} issues ({X} Critical, {Y} Major, {Z} Minor) in {M} files."

---

## Step 3: Fix Issues by Severity

Process findings in priority order:

### Critical First (blocks commit)

For each Critical finding:
1. **Explain** what was wrong and why it's critical
2. **Show** the fix with minimal changes to affected code
3. **Verify** the fix resolves the issue (check imports, types, syntax)

### Major Second (fix soon)

For each Major finding:
1. **Explain** what was wrong and the impact
2. **Show** the fix
3. **Verify** no regressions introduced

### Minor Last (consider fixing)

For each Minor finding:
1. **Explain** the improvement
2. **Show** the fix (if user approved Minor fixes)
3. **Verify** consistency with codebase style

---

## Step 4: Run Validation

After all fixes applied, run the project's validation commands:

```bash
# Level 1: Syntax & Style
{configured lint command}

# Level 2: Type Safety
{configured type check command}

# Level 3: Unit Tests
{configured test command}
```

**If validation fails:**
- Classify as fixable vs. unresolvable (see `/execute` Step 6)
- Fix fixable errors
- Report unresolvable errors to user

---

## Step 5: Report Summary

Output fix summary:

```
CODE REVIEW FIX: COMPLETE
=========================

Scope: {scope parameter used}
Issues Fixed: {N} total ({X} Critical, {Y} Major, {Z} Minor)
Files Modified: {list}

Validation:
- Lint: {PASS/FAIL}
- Types: {PASS/FAIL}
- Tests: {PASS/FAIL}

Next: Run /code-review to verify fixes, or /commit if confident
```

### Pipeline Handoff Write (required)

After fix completion, overwrite `.agents/context/next-command.md`:

```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /code-review-fix
- **Feature**: {feature, derived from review file path}
- **Next Command**: /code-review --feature {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: awaiting-re-review
```

---

## Output Report

Save to: `.agents/features/{feature}/fix-report.md`

### Meta Information

- **Review file**: {path to input review}
- **Scope used**: {all | critical+major | critical | file-path}
- **Issues found**: {N} total
- **Issues fixed**: {N} total

### Fixes Applied

For each fix:

```
### {file:line} — {issue}

**Severity**: {Critical/Major/Minor}
**What was wrong**: {explanation}
**Fix applied**: {description of changes}
**Verification**: {how we confirmed it's fixed}
```

### Validation Results

```bash
# Output from lint/typecheck/tests
```

### Skipped Issues

List any issues that were not fixed (with reason):
- "Minor issue deferred by scope"
- "Unresolvable: {reason}"
- "False positive: {explanation}"

---

## Important Rules

- **Fix in severity order**: Critical → Major → Minor
- **Minimal changes**: Fix the issue, don't refactor surrounding code
- **Verify each fix**: Don't batch all fixes before validating
- **Respect scope**: Don't fix Minor issues if scope is `critical+major`
- **Report unresolvable**: If a fix introduces new problems, stop and report

---

## Notes

- This command is **fix-oriented** — it modifies files to address findings
- For automated review-fix loops, use `/code-loop` instead
- After fixing, re-run `/code-review` to verify all issues resolved
