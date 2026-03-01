---
description: Technical code review for quality and bugs that runs pre-commit
---

# Code Review: Find Bugs, Security Issues, and Quality Problems

Run a comprehensive code review. Reports findings only — does NOT implement fixes.

## Core Principles

**Review Philosophy:**
- Simplicity is the ultimate sophistication — every line should justify its existence
- Code is read far more often than it's written — optimize for readability
- The best code is often the code you don't write
- Elegance emerges from clarity of intent and economy of expression

## Usage

```
/code-review [target] [--feature feature-name]
```

`$ARGUMENTS` — What to review:
- Empty (default): review all uncommitted changes (`git diff` + `git diff --cached`)
- File path: review a specific file
- `last-commit`: review changes in the most recent commit

`--feature feature-name` — Explicit feature name for the review artifact directory:
- When provided: save review to `.agents/features/{feature-name}/review.md`
- When omitted: derive feature name using this priority order:
  1. Read `.agents/context/next-command.md` — use the **Feature** field if it exists
  2. Scan `.agents/features/*/report.md` (non-done) — use the most recently modified feature
  3. Fall back to deriving from the primary changed file's module/directory name

---

## Pipeline Position

Used manually, or inside the `/code-loop` automated review-fix cycle:

```
/code-review → /code-review-fix → /code-review (verify) → /commit
```

Alternatively: `/code-review` → `/code-review-fix {scope}` → `/code-review` → `/commit`

---

## Step 1: Determine Scope

**If no arguments:**
```bash
git diff --name-only
git diff --cached --name-only
```
Review all changed files.

**If file path provided:**
Review that specific file.

**If `last-commit`:**
```bash
git diff HEAD~1 --name-only
```
Review files changed in the last commit.

If no changes found, report: "No changes to review." and stop.

---

## Step 2: Gather Context

Before reviewing, gather supporting context:

### Codebase Context (Required)

Read these files to understand project standards and patterns:
1. **AGENTS.md** or **CLAUDE.md** — project methodology and conventions
2. **README.md** — project purpose and capabilities
3. **`.opencode/sections/`** — auto-loaded rules and patterns
4. **`.opencode/config.md`** — validation commands and stack info

### Affected Files (Required)

**Read each changed file in its entirety** — not just the diff. Context matters for understanding:
- How the change fits into the larger module
- Existing patterns that should be followed
- Potential side effects on other parts of the file

### Project Patterns

Check similar files in the project:
- How do other files handle the same concern?
- What naming conventions are used?
- What error handling patterns exist?

### RAG Integration (Optional)

If a RAG knowledge base MCP is available:
- Search for best practices related to the technologies in changed files (2-5 keyword queries)
- Search for reference implementations of similar patterns
- Keep queries SHORT for best vector search results

If RAG unavailable, proceed with local context only.

---

## Step 3: Review

Check for issues at three severity levels:

### Critical (blocks commit)
- Security vulnerabilities (SQL injection, XSS, hardcoded secrets)
- Logic errors (null dereference, off-by-one, race conditions)
- Type safety issues (unsafe casts, missing null checks)

### Major (fix soon)
- Performance issues (N+1 queries, O(n^2), memory leaks)
- Architecture violations (layer breaches, tight coupling)
- Error handling gaps (uncaught exceptions, silent failures)
- Documentation mismatches with known best practices

### Minor (consider fixing)
- Code quality (DRY violations, unclear naming)
- Missing tests for new functionality
- Documentation gaps

---

## Step 4: Dispatch for Second Opinions (Optional)

For security-sensitive or architecturally complex changes, get a second opinion.

**When to dispatch:**
- Changes touch auth, crypto, payments, or data handling (security-sensitive)
- Changes span multiple interconnected files (architecture risk)
- First pass found 0 issues (sanity check — did we miss something?)
- Review confidence is low

**When to skip dispatch:**
- Trivial changes (typos, formatting, docs-only)
- Previous dispatch round added no new findings

**If dispatch available:**

```
REVIEW_PROMPT = "Review the following code changes for Critical and Major issues only.\n\n{git diff or file content}\n\nRespond with:\n- ISSUES FOUND: [list each issue as: Severity | File:Line | Description]\n- NO ISSUES: code is clean."
```

**Security-sensitive changes:**
```
dispatch({
  taskType: "security-review",
  prompt: REVIEW_PROMPT,
})
```

**Architecture-heavy changes:**
```
dispatch({
  taskType: "architecture-audit",
  prompt: REVIEW_PROMPT,
})
```

**General second opinion (default):**
```
dispatch({
  taskType: "code-review",
  prompt: REVIEW_PROMPT,
})
```

**Multiple concerns — run gauntlet:**
```
batch-dispatch({
  batchPattern: "free-impl-validation",
  prompt: REVIEW_PROMPT,
})
```
Read `escalationAction` from the `## Consensus Analysis` table in the output:
- `skip-t4` → 0-1 models found issues → proceed to Step 5
- `run-t4` → 2 models found issues → one more dispatch tiebreaker, then Step 5
- `fix-and-rerun` → 3+ models found issues → surface findings in Step 5

**If dispatch unavailable:** Proceed with your own thorough review. Consider reviewing from multiple angles (security, performance, architecture) sequentially.

---

## Step 5: Report Findings

Present findings in this structured format:

```
CODE REVIEW: {scope description}
================================

Stats:
- Files Modified: {N}
- Files Added: {N}
- Files Deleted: {N}
- New lines: +{N}
- Deleted lines: -{N}

Critical (blocks commit):
- `{file:line}` — {issue}
  Why: {explanation of why this is a problem}
  Fix: {specific suggestion}

Major (fix soon):
- `{file:line}` — {issue}
  Why: {explanation}
  Fix: {suggestion}

Minor (consider):
- `{file:line}` — {issue}
  Why: {explanation}
  Fix: {suggestion}

RAG-Informed:
- {findings backed by documentation, or "No RAG sources applicable"}

Second Opinions:
- {findings from dispatch, or "No dispatch used"}

Summary: {X} critical, {Y} major, {Z} minor
Recommendation: {PASS / FIX CRITICAL / FIX MAJOR}
```

**Output file**: Save review to `.agents/features/{feature}/review.md`
Create the `.agents/features/{feature}/` directory if it doesn't exist.
Derive `{feature}` using the `--feature` argument if provided. Otherwise, use the priority order from the Usage section above (handoff file → recent report → primary file's module name).

**Pipeline Handoff Write** (required): After saving the review, overwrite `.agents/context/next-command.md`:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /code-review
- **Feature**: {feature}
- **Next Command**: /code-review-fix .agents/features/{feature}/review.md critical+major
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: awaiting-fixes
```
If review found 0 issues, set **Next Command** to `/commit` and **Status** to `ready-to-commit`.

**If code review fails** (e.g., cannot read changed files, git state corrupted, no changes found when changes expected): Write handoff preserving the feature context:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /code-review (failed)
- **Feature**: {feature}
- **Next Command**: /code-review --feature {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```
Report the error clearly: what failed and what the user should check. Note: "No changes to review" on a clean tree is NOT a failure — do not write a blocked handoff in that case.

---

## Step 6: Next Steps

Based on severity:

- **All clear**: "No issues found. Ready to commit with `/commit`."
- **Minor only**: "Minor issues found. Commit at your discretion, or fix first with `/code-review-fix {review-file} minor`."
- **Major/Critical**: "Found issues that should be fixed."
  - Simple fixes: `Run /code-review-fix {review-file} critical+major` then re-review.
  - Complex/architectural fixes: Create a fix plan with `/planning`, then `/execute {fix-plan}`, then re-review.

---

## Notes

- This command is **read-only** — it does NOT modify any files
- For automated review-fix loops, use `/code-loop` instead
- Single sequential review — no parallel agents unless dispatch is available

### `.done.md` Lifecycle

`/code-review` does NOT mark its own output as done. The review is marked `.done.md` by:
- `/commit` — when committing changes that address the review findings
- `/code-loop` — when the loop exits clean after all findings are addressed

This is intentional: a review is only "done" when its findings are acted upon, not when the review is written.
