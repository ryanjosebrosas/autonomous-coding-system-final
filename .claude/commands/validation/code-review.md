---
description: Technical code review for quality and bugs — runs pre-commit
---

# Validation: Code Review

Perform a thorough technical code review on recently changed files. This is the validation-focused review — deeper than a quick `/code-review`, designed to run before committing.

## Core Principles

Review Philosophy:

- Simplicity is the ultimate sophistication — every line should justify its existence
- Code is read far more often than it's written — optimize for readability
- The best code is often the code you don't write
- Elegance emerges from clarity of intent and economy of expression

## What to Review

Start by gathering codebase context to understand standards and patterns.

### 1. Read Project Context

- `memory.md` — gotchas, decisions, patterns
- `.opencode/config.md` — validation commands, stack info
- Key files in the main source directory
- Documented standards in docs/ or similar

### 2. Examine Changes

Run these commands:

```bash
git status
git diff HEAD
git diff --stat HEAD
```

Then check the list of new files:

```bash
git ls-files --others --exclude-standard
```

Read each new file in its entirety. Read each changed file in its entirety (not just the diff) to understand full context.

### 3. Analyze Each File

For each changed file or new file, analyze for:

**Logic Errors**
- Off-by-one errors
- Incorrect conditionals
- Missing error handling
- Race conditions
- Null/undefined access

**Security Issues**
- SQL injection vulnerabilities
- XSS vulnerabilities
- Insecure data handling
- Exposed secrets or API keys
- Missing input validation

**Performance Problems**
- N+1 queries
- Inefficient algorithms (O(n^2) where O(n) possible)
- Memory leaks
- Unnecessary computations
- Blocking operations in async contexts

**Code Quality**
- Violations of DRY principle
- Overly complex functions (high cyclomatic complexity)
- Poor naming (variables, functions, types)
- Missing type hints/annotations
- Dead code

**Adherence to Codebase Standards**
- Adherence to documented project patterns
- Linting, typing, and formatting standards
- Logging standards
- Testing standards
- Existing code conventions in the same module

## Verify Issues Are Real

Before reporting any issue:
- Run specific tests related to the concern
- Confirm type errors are legitimate (not false positives from stubs)
- Validate security concerns with full context
- Check if the pattern is intentional (used elsewhere in the codebase)

Do NOT report:
- Pre-existing issues not introduced by this change
- Intentional patterns used consistently across the project
- Style preferences that contradict project conventions

## Output Format

Save a new file to `.agents/reviews/{appropriate-name}.md`

**Stats:**

- Files Modified: {N}
- Files Added: {N}
- Files Deleted: {N}
- New lines: +{N}
- Deleted lines: -{N}

**For each issue found:**

```
severity: critical|high|medium|low
file: path/to/file
line: 42
issue: [one-line description]
detail: [explanation of why this is a problem]
suggestion: [how to fix it]
```

If no issues found: "Code review passed. No technical issues detected."

**Summary:**

```
VALIDATION CODE REVIEW
======================
Critical: {N}
High:     {N}
Medium:   {N}
Low:      {N}

Verdict: PASS / FAIL (fix critical/high first)
```

## Dispatch Integration (Optional)

If dispatch is available, consider sending the diff to additional reviewers for a second opinion:

| Concern | Tier | When |
|---------|------|------|
| Security-sensitive changes | T3/T4 | Always for auth, crypto, data handling |
| Architecture changes | T2/T3 | When touching >5 files or new patterns |
| Complex logic | T2 | When cyclomatic complexity is high |

Merge dispatch findings with primary review, deduplicate, and include source attribution.

## Important

- Be specific (line numbers, not vague complaints)
- Focus on real bugs, not style preferences
- Suggest fixes, don't just complain
- Flag security issues as CRITICAL
- This command is **read-only** — it reports findings, does NOT fix them
- Use `/validation/code-review-fix` to process and fix the findings
