# Task 3 of 6: Sonnet Review Commands -- code-review.md, code-review-fix.md

> **Feature**: `claude-command-optimization`
> **Brief Path**: `.agents/features/claude-command-optimization/task-3.md`
> **Plan Overview**: `.agents/features/claude-command-optimization/plan.md`

---

## OBJECTIVE

Create Claude-optimized Sonnet-tier review commands (`.claude/commands/code-review.md` and `.claude/commands/code-review-fix.md`) with Phase 0 Haiku subagent research delegation and `model: claude-sonnet-4-6` frontmatter, preserving all decision logic, severity classification, output format, handoff writes, and gate enforcement from the originals.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.claude/commands/code-review.md` | CREATE | Claude-optimized code review command with Phase 0 Haiku delegation, Sonnet reasoning kernel |
| `.claude/commands/code-review-fix.md` | CREATE | Claude-optimized code review fix command with Phase 0 Haiku delegation, Sonnet reasoning kernel |

**Out of Scope:**
- `.opencode/commands/code-review.md` -- the original stays untouched as reference for non-Claude agents
- `.opencode/commands/code-review-fix.md` -- the original stays untouched as reference for non-Claude agents
- Other Sonnet commands (`code-loop.md`, `final-review.md`, `system-review.md`, `pr.md`) -- those are Tasks 4 and 5
- Haiku commands (`prime.md`, `commit.md`) -- that was Task 2
- Opus commands -- that is Task 6
- Any TypeScript code, pipeline logic, or config files

**Dependencies:**
- Task 1 must complete first -- `.claude/commands/` directory must exist as a real directory (not a symlink)
- Task 2 created the Haiku commands -- establishes the trimming pattern (but no direct file dependency)

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Tasks:**

- `.claude/commands/` -- Task 1 removed the symlink to `.opencode/commands/` and created a real empty directory. This directory is now ready for command files.
- `.claude/commands/prime.md` -- Task 2 created the Haiku-optimized prime command (trimmed, no delegation, `model: claude-haiku-4-5-20251001`)
- `.claude/commands/commit.md` -- Task 2 created the Haiku-optimized commit command (trimmed, no delegation, `model: claude-haiku-4-5-20251001`)

**State Carried Forward:**
- `.claude/commands/` exists as a real directory with 2 Haiku command files already present
- The optimization pattern is established: change model frontmatter, restructure for the target model's strengths
- For Sonnet commands specifically: add Phase 0 Haiku Explore subagent delegation to offload research/retrieval

**Known Issues or Deferred Items:**
- None from prior tasks affecting this task

---

## CONTEXT REFERENCES

> IMPORTANT: Read ALL files listed here before implementing. They are not optional.
> All relevant content is pasted inline below.

### Files to Read

- `.opencode/commands/code-review.md` (all 240 lines) -- Why: This is the source command that must be optimized. All decision logic, output format, and handoff writes come from this file.
- `.opencode/commands/code-review-fix.md` (all 218 lines) -- Why: This is the source command that must be optimized. Hard entry gate, severity processing, validation, and handoff writes come from this file.
- `.claude/config.md` (all 45 lines) -- Why: Contains validation commands referenced by code-review-fix's Step 4.

### Current Content: code-review.md (Full File -- 240 Lines)

```markdown
---
description: Technical code review for quality and bugs that runs pre-commit
model: deepseek-v3.1:671b-cloud
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
3. **`.claude/sections/`** — auto-loaded rules and patterns
4. **`.claude/config.md`** — validation commands and stack info

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

## Step 4: Deep Review Pass (Optional)

For security-sensitive or architecturally complex changes, review from multiple angles:

- **Security angle** — auth, crypto, data handling, input validation
- **Performance angle** — N+1 queries, memory leaks, O(n²) patterns
- **Architecture angle** — layer boundaries, coupling, contract violations

This is a second independent pass with a fresh perspective, not a repeat of Step 3.

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

Deep Review Pass:
- {additional findings from second angle review, or "No additional findings"}

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
```

**Analysis**: Steps 1 and 2 are pure retrieval -- determining which files changed and reading them plus context files. These entire sections (roughly 55 lines combined) should be offloaded to a Haiku Explore subagent in Phase 0. Steps 3-6 contain the reasoning kernel: severity classification, deep review, report format, handoff writes, next-step logic. These must be preserved verbatim. The Core Principles section should be kept as it guides Sonnet's review quality. The Usage and Pipeline Position sections must be preserved exactly.

### Current Content: code-review-fix.md (Full File -- 218 Lines)

```markdown
---
description: Process to fix bugs found in manual/AI code review
model: deepseek-v3.1:671b-cloud
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
```

**Analysis**: Step 1 (Read Review File) is pure retrieval -- reading and parsing the review artifact. This should be offloaded to a Haiku Explore subagent in Phase 0. The Hard Entry Gate must be preserved verbatim and must remain BEFORE Phase 0 (the gate checks that the review file argument exists before the subagent tries to read it). Steps 2-5 contain the reasoning kernel: filtering by scope, fixing by severity, running validation, reporting. These must be preserved verbatim. The Pipeline Handoff Write and Output Report sections must be preserved exactly.

### Current Content: config.md (Full File -- 45 Lines)

```markdown
# Project Configuration
<!-- Auto-detected by /prime on 2026-03-06. Override any value manually. -->
<!-- Run /prime to re-detect and update auto-detected values. -->
<!-- Manual overrides in this file take priority over auto-detection. -->

## Stack
- **Language**: TypeScript
- **Framework**: OpenCode AI Plugin Framework
- **Package Manager**: npm (detected in .opencode/)

## Validation Commands

These commands are used by `/planning`, `/final-review`, `/code-loop`, and other pipeline commands.

- **L1 Lint**: npx eslint .opencode/
- **L1 Format**: npx prettier --check .opencode/
- **L2 Types**: npx tsc --noEmit
- **L3 Unit Tests**: npx vitest run
- **L4 Integration Tests**: npx vitest run .opencode/tests/integration/
- **L5 Manual**: Code review via /code-loop

## Source Directories
- **Source**: .opencode/
- **Tests**: .opencode/**/*.test.ts (pattern, not verified)
- **Config**: .opencode/config/, .claude/config/

## Git
- **Remote**: origin (https://github.com/ryanjosebrosas/autonomous-coding-system-final.git)
- **Main Branch**: master
- **PR Target**: master

## RAG Integration (Optional)

- **RAG Available**: no (Archon MCP not detected)
- **RAG Tool Prefix**: N/A
- **Indexed Sources**: N/A

## Notes

- This is an OpenCode AI coding system framework (meta-framework for AI-assisted development)
- Framework files are in .opencode/, mirrored to .claude/ for Claude Code compatibility
- Validation commands are custom (no standard npm scripts detected)
- L1-L4 validation is performed by /code-loop with model-based code review
- L5 is manual human verification via /final-review
- Project uses the PIV Loop methodology: Plan → Implement → Validate
```

**Analysis**: The validation commands section is referenced by code-review-fix's Step 4. The Haiku subagent in Phase 0 should read this file and include the validation commands in the Context Bundle so Sonnet can reference them directly.

---

## PATTERNS TO FOLLOW

### Pattern 1: Phase 0 Haiku Explore Subagent Delegation (from plan.md)

This is the core optimization pattern for all Sonnet/Opus commands. The Haiku Explore subagent gathers all context before the main model begins reasoning.

```markdown
## Phase 0: Gather Context (Haiku Subagent)

Before reasoning, launch a Haiku Explore subagent to gather all context:

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /code-review:
> 1. Run `git diff --name-only` and `git diff --cached --name-only`
> 2. Read each changed file in full
> 3. Read `.claude/config.md` for validation commands
> 4. Read `.agents/context/next-command.md` for feature name
> 5. Check for similar patterns in the codebase near changed files
>
> Return a structured Context Bundle with:
> - Modified files (path, lines added/removed)
> - Full content of each changed file
> - Config: validation commands from config.md
> - Feature name from handoff
> - Related patterns found

Wait for the subagent to return. Then proceed to Phase 1 with the Context Bundle.
```

- Why this pattern: Offloads 40-50% of the command's token budget (file reads, glob searches, context gathering) to a cheap Haiku subagent, letting the expensive Sonnet model focus on reasoning and decision-making
- How to apply: Each Sonnet command gets a Phase 0 section before the first reasoning step. The Phase 0 prompt must list exactly what the subagent should gather, and what format the Context Bundle should take.
- Common gotchas: The subagent prompt must be specific enough that Haiku returns structured data, not a narrative summary. Always specify the return format.

### Pattern 2: Command YAML Frontmatter for Sonnet Tier (from plan.md)

```yaml
---
description: Technical code review for quality and bugs that runs pre-commit
model: claude-sonnet-4-6
---
```

- Why this pattern: The `model` field tells Claude Code which model to invoke for this command. Sonnet is the correct tier for review/validation commands -- it has strong structured reasoning without the cost of Opus.
- How to apply: Replace `model: deepseek-v3.1:671b-cloud` with `model: claude-sonnet-4-6` in the YAML frontmatter of both files.
- Common gotchas: The model ID must be exact: `claude-sonnet-4-6`. Not `claude-sonnet` or `sonnet-4-6`.

### Pattern 3: Hard Entry Gate Preservation (from code-review-fix.md)

```markdown
## Hard Entry Gate (Non-Skippable)

Before any fix work:

1. Verify `$ARGUMENTS` includes a review file path
2. Verify the review file exists and contains findings
3. If either check fails, stop and report:
   - `Blocked: /code-review-fix requires a review file. Run /code-review first.`

Never run fixes without a review artifact.
```

- Why this pattern: The gate enforces a strict dependency -- code-review-fix must never run without a review artifact. This is a safety mechanism that prevents blind fixing.
- How to apply: The gate must appear BEFORE Phase 0 in the optimized command. The Haiku subagent should not even launch if the gate fails.
- Common gotchas: Do NOT move the gate into Phase 0. The gate is a prerequisite check that must happen before any work is delegated.

### Pattern 4: Pipeline Handoff Write Format (from code-review.md and code-review-fix.md)

```markdown
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
```

- Why this pattern: Pipeline handoff writes are the mechanism for command chaining. Each command writes the next recommended command to a known file, which `/prime` reads to suggest the next action.
- How to apply: Copy the handoff write section verbatim from the original command. Do not modify the format, field names, or status values.
- Common gotchas: The handoff for code-review has TWO variants: one for when issues are found (awaiting-fixes) and one for when the review is clean (ready-to-commit). Both must be preserved. There is also a failure variant (blocked). All three must appear in the optimized command.

---

## STEP-BY-STEP TASKS

---

### Step 1: CREATE `.claude/commands/code-review.md`

**What**: Create the Claude-optimized Sonnet-tier code review command with Phase 0 Haiku subagent delegation for context gathering and the full reasoning kernel from the original.

**IMPLEMENT**:

Create a new file at `.claude/commands/code-review.md` with the following complete content:

```markdown
---
description: Technical code review for quality and bugs that runs pre-commit
model: claude-sonnet-4-6
---

# Code Review: Find Bugs, Security Issues, and Quality Problems

Run a comprehensive code review. Reports findings only -- does NOT implement fixes.

## Core Principles

**Review Philosophy:**
- Simplicity is the ultimate sophistication -- every line should justify its existence
- Code is read far more often than it's written -- optimize for readability
- The best code is often the code you don't write
- Elegance emerges from clarity of intent and economy of expression

## Usage

```
/code-review [target] [--feature feature-name]
```

`$ARGUMENTS` -- What to review:
- Empty (default): review all uncommitted changes (`git diff` + `git diff --cached`)
- File path: review a specific file
- `last-commit`: review changes in the most recent commit

`--feature feature-name` -- Explicit feature name for the review artifact directory:
- When provided: save review to `.agents/features/{feature-name}/review.md`
- When omitted: derive feature name using this priority order:
  1. Read `.agents/context/next-command.md` -- use the **Feature** field if it exists
  2. Scan `.agents/features/*/report.md` (non-done) -- use the most recently modified feature
  3. Fall back to deriving from the primary changed file's module/directory name

---

## Pipeline Position

Used manually, or inside the `/code-loop` automated review-fix cycle:

```
/code-review -> /code-review-fix -> /code-review (verify) -> /commit
```

Alternatively: `/code-review` -> `/code-review-fix {scope}` -> `/code-review` -> `/commit`

---

## Phase 0: Gather Context (Haiku Subagent)

Before reviewing, launch a Haiku Explore subagent to gather all context.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /code-review. Here is what to collect:
>
> **1. Determine scope from arguments**: `$ARGUMENTS`
> - If no arguments: run `git diff --name-only` and `git diff --cached --name-only` to get changed files
> - If a file path is provided: use that specific file
> - If `last-commit`: run `git diff HEAD~1 --name-only` to get changed files
> - If no changes found, return: `{ "empty": true, "message": "No changes to review." }`
>
> **2. Read each changed file in full** -- not just the diff. Return full content of every file.
>
> **3. Read context files**:
> - `.claude/config.md` -- extract validation commands
> - `.agents/context/next-command.md` -- extract feature name if present
>
> **4. Check for similar patterns** near each changed file:
> - Look at sibling files in the same directory
> - Note naming conventions, error handling patterns, existing style
>
> **5. RAG search** (if RAG MCP is available):
> - Search for best practices related to the technologies in changed files (2-5 keyword queries)
> - If RAG unavailable, skip this step
>
> Return a structured **Context Bundle**:
> ```
> CONTEXT BUNDLE
> ==============
> Scope: {default | file-path | last-commit}
> Feature: {feature name from handoff or derived}
>
> Changed Files:
> - {path} (+{added} -{removed} lines)
>   [full content of file]
>
> Config:
> - Validation commands: {from config.md}
>
> Patterns Found:
> - {pattern description from sibling files}
>
> RAG Results:
> - {results or "RAG not available"}
> ```

Wait for the subagent to return. If the Context Bundle shows `"empty": true`, report "No changes to review." and stop.

Then proceed to Step 1 with the Context Bundle.

---

## Step 1: Review

Using the Context Bundle from Phase 0, check for issues at three severity levels:

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

## Step 2: Deep Review Pass (Optional)

For security-sensitive or architecturally complex changes, review from multiple angles:

- **Security angle** -- auth, crypto, data handling, input validation
- **Performance angle** -- N+1 queries, memory leaks, O(n^2) patterns
- **Architecture angle** -- layer boundaries, coupling, contract violations

This is a second independent pass with a fresh perspective, not a repeat of Step 1.

---

## Step 3: Report Findings

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
- `{file:line}` -- {issue}
  Why: {explanation of why this is a problem}
  Fix: {specific suggestion}

Major (fix soon):
- `{file:line}` -- {issue}
  Why: {explanation}
  Fix: {suggestion}

Minor (consider):
- `{file:line}` -- {issue}
  Why: {explanation}
  Fix: {suggestion}

RAG-Informed:
- {findings backed by documentation, or "No RAG sources applicable"}

Deep Review Pass:
- {additional findings from second angle review, or "No additional findings"}

Summary: {X} critical, {Y} major, {Z} minor
Recommendation: {PASS / FIX CRITICAL / FIX MAJOR}
```

**Output file**: Save review to `.agents/features/{feature}/review.md`
Create the `.agents/features/{feature}/` directory if it doesn't exist.
Derive `{feature}` using the `--feature` argument if provided. Otherwise, use the priority order from the Usage section above (handoff file -> recent report -> primary file's module name).

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
Report the error clearly: what failed and what the user should check. Note: "No changes to review" on a clean tree is NOT a failure -- do not write a blocked handoff in that case.

---

## Step 4: Next Steps

Based on severity:

- **All clear**: "No issues found. Ready to commit with `/commit`."
- **Minor only**: "Minor issues found. Commit at your discretion, or fix first with `/code-review-fix {review-file} minor`."
- **Major/Critical**: "Found issues that should be fixed."
  - Simple fixes: `Run /code-review-fix {review-file} critical+major` then re-review.
  - Complex/architectural fixes: Create a fix plan with `/planning`, then `/execute {fix-plan}`, then re-review.

---

## Notes

- This command is **read-only** -- it does NOT modify any files
- For automated review-fix loops, use `/code-loop` instead
- Single sequential review -- no parallel agents unless dispatch is available

### `.done.md` Lifecycle

`/code-review` does NOT mark its own output as done. The review is marked `.done.md` by:
- `/commit` -- when committing changes that address the review findings
- `/code-loop` -- when the loop exits clean after all findings are addressed

This is intentional: a review is only "done" when its findings are acted upon, not when the review is written.
```

**PATTERN**: Pattern 1 (Phase 0 delegation) and Pattern 2 (Sonnet frontmatter) from Patterns to Follow section above.

**IMPORTS**: N/A -- this is a markdown command file.

**GOTCHA**: The Phase 0 subagent prompt must include the `$ARGUMENTS` reference so Haiku knows whether to run `git diff`, read a specific file, or check `last-commit`. Without this, the subagent will always default to `git diff`. Also ensure the step numbering is updated -- the original Steps 1-6 become Phase 0 + Steps 1-4 (Steps 1-2 absorbed into Phase 0, Steps 3-6 renumbered to Steps 1-4).

**VALIDATE**:
```bash
# File exists
test -f .claude/commands/code-review.md && echo "PASS: file exists" || echo "FAIL: file missing"

# Model is correct
grep -q "model: claude-sonnet-4-6" .claude/commands/code-review.md && echo "PASS: model correct" || echo "FAIL: wrong model"

# Phase 0 present
grep -q "Phase 0" .claude/commands/code-review.md && echo "PASS: Phase 0 present" || echo "FAIL: Phase 0 missing"

# Pipeline Handoff Write present
grep -q "Pipeline Handoff Write" .claude/commands/code-review.md && echo "PASS: handoff present" || echo "FAIL: handoff missing"

# Severity levels preserved
grep -q "Critical (blocks commit)" .claude/commands/code-review.md && echo "PASS: severity present" || echo "FAIL: severity missing"

# .done.md lifecycle preserved
grep -q ".done.md" .claude/commands/code-review.md && echo "PASS: lifecycle present" || echo "FAIL: lifecycle missing"

# Old retrieval steps removed (Step 1: Determine Scope should NOT exist as a separate section)
! grep -q "## Step 1: Determine Scope" .claude/commands/code-review.md && echo "PASS: old Step 1 removed" || echo "FAIL: old Step 1 still present"
! grep -q "## Step 2: Gather Context" .claude/commands/code-review.md && echo "PASS: old Step 2 removed" || echo "FAIL: old Step 2 still present"
```

---

### Step 2: CREATE `.claude/commands/code-review-fix.md`

**What**: Create the Claude-optimized Sonnet-tier code review fix command with Phase 0 Haiku subagent delegation for review file parsing and file reading, preserving the Hard Entry Gate before Phase 0.

**IMPLEMENT**:

Create a new file at `.claude/commands/code-review-fix.md` with the following complete content:

```markdown
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
  - `all` (default) -- Fix all issues regardless of severity
  - `critical+major` -- Fix only Critical and Major issues, skip Minor
  - `critical` -- Fix only Critical issues
  - `file-path` -- Fix issues only in specified file(s)

## Pipeline Position

Used after `/code-review`, before `/commit`:

```
/code-review -> /code-review-fix -> /code-review (re-verify) -> /commit
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

## Phase 0: Gather Context (Haiku Subagent)

After the entry gate passes, launch a Haiku Explore subagent to gather all context.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /code-review-fix. The review file is: `{review-file from $ARGUMENTS}`
>
> **1. Read the review file in full**:
> - Parse findings by severity (Critical/Major/Minor)
> - Extract file paths and line numbers from each finding
> - Note any RAG-informed or second-opinion findings
> - If no issues found in the file, return: `{ "empty": true, "message": "Review file indicates no issues. Nothing to fix." }`
>
> **2. Read each file referenced in the review findings** in full -- not just the lines mentioned.
> Return the complete content of every file that has findings against it.
>
> **3. Read `.claude/config.md`** -- extract validation commands for post-fix validation.
>
> Return a structured **Context Bundle**:
> ```
> CONTEXT BUNDLE
> ==============
> Review File: {path}
> Feature: {derived from review file path}
> Scope: {scope from $ARGUMENTS or "all"}
>
> Findings:
> - Critical ({N}):
>   - {file:line} -- {issue summary}
> - Major ({N}):
>   - {file:line} -- {issue summary}
> - Minor ({N}):
>   - {file:line} -- {issue summary}
>
> File Contents:
> - {path}:
>   [full content of file]
>
> Validation Commands:
> - L1 Lint: {from config.md}
> - L2 Types: {from config.md}
> - L3 Tests: {from config.md}
> ```

Wait for the subagent to return. If the Context Bundle shows `"empty": true`, report "Review file indicates no issues. Nothing to fix." and stop.

Then proceed to Step 1 with the Context Bundle.

---

## Step 1: Filter by Scope

Apply the scope parameter to filter findings from the Context Bundle:

| Scope | What Gets Fixed |
|-------|----------------|
| `all` | All findings regardless of severity |
| `critical+major` | Only Critical and Major findings |
| `critical` | Only Critical findings |
| `file-path` | Only findings in specified file(s) |

Report: "Fixing {N} issues ({X} Critical, {Y} Major, {Z} Minor) in {M} files."

---

## Step 2: Fix Issues by Severity

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

## Step 3: Run Validation

After all fixes applied, run the project's validation commands from the Context Bundle:

```bash
# Level 1: Syntax & Style
{L1 lint command from Context Bundle}

# Level 2: Type Safety
{L2 type check command from Context Bundle}

# Level 3: Unit Tests
{L3 test command from Context Bundle}
```

**If validation fails:**
- Classify as fixable vs. unresolvable (see `/execute` Step 6)
- Fix fixable errors
- Report unresolvable errors to user

---

## Step 4: Report Summary

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
### {file:line} -- {issue}

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

- **Fix in severity order**: Critical -> Major -> Minor
- **Minimal changes**: Fix the issue, don't refactor surrounding code
- **Verify each fix**: Don't batch all fixes before validating
- **Respect scope**: Don't fix Minor issues if scope is `critical+major`
- **Report unresolvable**: If a fix introduces new problems, stop and report

---

## Notes

- This command is **fix-oriented** -- it modifies files to address findings
- For automated review-fix loops, use `/code-loop` instead
- After fixing, re-run `/code-review` to verify all issues resolved
```

**PATTERN**: Pattern 1 (Phase 0 delegation), Pattern 2 (Sonnet frontmatter), and Pattern 3 (Hard Entry Gate) from Patterns to Follow section above.

**IMPORTS**: N/A -- this is a markdown command file.

**GOTCHA**: The Hard Entry Gate MUST appear BEFORE Phase 0. If the gate fails, the Haiku subagent should never launch. The step numbering changes from the original: original Step 1 (Read Review File) is absorbed into Phase 0, original Steps 2-5 become Steps 1-4. Also note that the Phase 0 subagent prompt must reference the actual review file path from `$ARGUMENTS`, not a placeholder. The `{review-file from $ARGUMENTS}` notation tells Sonnet to substitute the actual argument value.

**VALIDATE**:
```bash
# File exists
test -f .claude/commands/code-review-fix.md && echo "PASS: file exists" || echo "FAIL: file missing"

# Model is correct
grep -q "model: claude-sonnet-4-6" .claude/commands/code-review-fix.md && echo "PASS: model correct" || echo "FAIL: wrong model"

# Phase 0 present
grep -q "Phase 0" .claude/commands/code-review-fix.md && echo "PASS: Phase 0 present" || echo "FAIL: Phase 0 missing"

# Hard Entry Gate present and BEFORE Phase 0
GATE_LINE=$(grep -n "Hard Entry Gate" .claude/commands/code-review-fix.md | head -1 | cut -d: -f1)
PHASE0_LINE=$(grep -n "Phase 0" .claude/commands/code-review-fix.md | head -1 | cut -d: -f1)
[ "$GATE_LINE" -lt "$PHASE0_LINE" ] && echo "PASS: gate before Phase 0" || echo "FAIL: gate not before Phase 0"

# Pipeline Handoff Write present
grep -q "Pipeline Handoff Write" .claude/commands/code-review-fix.md && echo "PASS: handoff present" || echo "FAIL: handoff missing"

# Severity processing preserved
grep -q "Critical First" .claude/commands/code-review-fix.md && echo "PASS: severity process present" || echo "FAIL: severity process missing"

# Old Step 1 (Read Review File) removed as separate section
! grep -q "## Step 1: Read Review File" .claude/commands/code-review-fix.md && echo "PASS: old Step 1 removed" || echo "FAIL: old Step 1 still present"
```

---

## TESTING STRATEGY

### Unit Tests

No unit tests -- these are markdown command files, not TypeScript code. Validation is structural: YAML frontmatter correctness, required section presence, and content preservation from the originals.

### Integration Tests

N/A -- command files are consumed directly by Claude Code's command discovery. Integration testing is manual: invoke the command in a Claude Code session and verify the model used, subagent delegation, and output format.

### Edge Cases

- **No arguments to /code-review**: Phase 0 subagent defaults to `git diff` -- must be handled in the subagent prompt (it is: "If no arguments: run git diff")
- **Review file does not exist for /code-review-fix**: Hard Entry Gate catches this before Phase 0 launches
- **Subagent returns empty Context Bundle**: Both commands handle this -- code-review stops with "No changes to review", code-review-fix stops with "Nothing to fix"
- **RAG MCP not available**: Subagent prompt includes "If RAG unavailable, skip this step" -- graceful degradation
- **Feature name not derivable**: code-review falls back to deriving from primary changed file's directory name (same as original)

---

## VALIDATION COMMANDS

### Level 1: Syntax and Style
```bash
# Both files exist and have valid YAML frontmatter
for f in code-review.md code-review-fix.md; do
  test -f ".claude/commands/$f" && echo "L1 PASS: $f exists" || echo "L1 FAIL: $f missing"
  head -1 ".claude/commands/$f" | grep -q "^---" && echo "L1 PASS: $f has frontmatter" || echo "L1 FAIL: $f no frontmatter"
done
```

### Level 2: Type Safety
```bash
# N/A -- no type-checked code modified. These are markdown files.
echo "L2 N/A: Markdown files only, no TypeScript"
```

### Level 3: Unit Tests
```bash
# N/A -- no unit tests for markdown command files. See Testing Strategy.
echo "L3 N/A: No unit tests for command files"
```

### Level 4: Integration Tests
```bash
# N/A -- covered by Level 5 manual validation
echo "L4 N/A: Covered by manual validation"
```

### Level 5: Manual Validation

1. Open a Claude Code session in this project directory
2. Type `/code-review` -- verify it triggers with `claude-sonnet-4-6` model
3. Observe that an Explore subagent is invoked before the review begins
4. Verify the output format matches the report template (Stats, Critical/Major/Minor sections, Summary, Recommendation)
5. Verify the pipeline handoff file is written to `.agents/context/next-command.md`
6. Type `/code-review-fix .agents/features/{feature}/review.md` -- verify it triggers with `claude-sonnet-4-6` model
7. Verify the Hard Entry Gate blocks execution if no review file argument is provided
8. Observe that an Explore subagent reads the review file and affected source files
9. Verify the fix report is saved and handoff is written

**What success looks like**: Both commands invoke `claude-sonnet-4-6`, both delegate context gathering to a Haiku Explore subagent before reasoning, both preserve all output formats and pipeline handoff writes from the originals.

**What failure looks like**: Wrong model used, no subagent delegation (Sonnet reads files directly), missing handoff write, missing severity classification, Hard Entry Gate skipped.

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] `.claude/commands/code-review.md` exists as a new file
- [ ] `.claude/commands/code-review-fix.md` exists as a new file
- [ ] Both files have `model: claude-sonnet-4-6` in YAML frontmatter
- [ ] code-review.md has Phase 0 Haiku Explore subagent delegation section
- [ ] code-review-fix.md has Phase 0 Haiku Explore subagent delegation section
- [ ] code-review.md preserves severity classification (Critical/Major/Minor) verbatim
- [ ] code-review.md preserves Deep Review Pass section verbatim
- [ ] code-review.md preserves Report Findings output format verbatim
- [ ] code-review.md preserves all three Pipeline Handoff Write variants (success, clean, failure)
- [ ] code-review.md preserves Next Steps logic verbatim
- [ ] code-review.md preserves `.done.md` lifecycle notes verbatim
- [ ] code-review-fix.md preserves Hard Entry Gate verbatim and BEFORE Phase 0
- [ ] code-review-fix.md preserves Filter by Scope table verbatim
- [ ] code-review-fix.md preserves Fix by Severity process verbatim
- [ ] code-review-fix.md preserves Run Validation section verbatim
- [ ] code-review-fix.md preserves Report Summary output format verbatim
- [ ] code-review-fix.md preserves Pipeline Handoff Write verbatim
- [ ] code-review-fix.md preserves Output Report section verbatim
- [ ] code-review-fix.md preserves Important Rules section verbatim
- [ ] Original Steps 1-2 of code-review.md are NOT present as separate sections (absorbed into Phase 0)
- [ ] Original Step 1 of code-review-fix.md is NOT present as a separate section (absorbed into Phase 0)
- [ ] No regressions -- `.opencode/commands/code-review.md` and `.opencode/commands/code-review-fix.md` are untouched

### Runtime (verify after testing/deployment)

- [ ] Claude Code discovers both commands from `.claude/commands/`
- [ ] `/code-review` runs with Sonnet model and delegates context gathering to Haiku subagent
- [ ] `/code-review-fix` runs with Sonnet model and delegates file reading to Haiku subagent
- [ ] Hard Entry Gate blocks `/code-review-fix` when no review file argument is provided

---

## HANDOFF NOTES

> What the NEXT task needs to know. Written AFTER execution completes.
> These feed into Task 4's "Prior Task Context" section.

### Files Created/Modified

- `.claude/commands/code-review.md` -- Claude-optimized Sonnet-tier code review command with Phase 0 Haiku subagent delegation. Contains reasoning kernel (severity classification, deep review, report format, handoff writes, next steps, .done.md lifecycle).
- `.claude/commands/code-review-fix.md` -- Claude-optimized Sonnet-tier code review fix command with Phase 0 Haiku subagent delegation. Contains Hard Entry Gate (before Phase 0), scope filtering, severity-ordered fixing, validation, report summary, handoff write, output report, important rules.

### Patterns Established

- **Phase 0 delegation pattern for Sonnet commands**: Haiku Explore subagent gathers context, returns structured Context Bundle, Sonnet reasons over the bundle. This pattern should be followed by Task 4 (code-loop.md, final-review.md) and Task 5 (system-review.md, pr.md).
- **Hard Entry Gate ordering**: When a command has a prerequisite gate, the gate appears BEFORE Phase 0. The subagent should not launch if the gate fails.
- **Step renumbering**: Original retrieval steps are absorbed into Phase 0. Remaining reasoning steps are renumbered starting from Step 1.

### State to Carry Forward

- The `.claude/commands/` directory now contains 4 files: `prime.md`, `commit.md`, `code-review.md`, `code-review-fix.md`
- The Phase 0 delegation prompt structure is established -- Task 4 should follow the same pattern but customize the subagent prompt for its specific context needs (code-loop needs checkpoint artifacts, final-review needs plan/report files)
- Pipeline handoff write format is preserved exactly -- no changes from originals

### Known Issues or Deferred Items

- None -- both files are self-contained command definitions with no external dependencies beyond the standard pipeline handoff mechanism

---

## COMPLETION CHECKLIST

> Final gate before marking this brief done. All boxes must be checked.

- [ ] All steps completed in order (Step 1: code-review.md, Step 2: code-review-fix.md)
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (L1 passed, L2-L4 N/A with reason, L5 manual walkthrough done)
- [ ] Manual testing confirms expected behavior (commands invoke Sonnet, delegate to Haiku subagent)
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in `.opencode/commands/` files
- [ ] Handoff notes written for Task 4
- [ ] Brief marked done: rename `task-3.md` to `task-3.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **Gate before Phase 0 in code-review-fix**: The Hard Entry Gate checks that the review file argument exists before launching the Haiku subagent. This prevents wasting a subagent call on a guaranteed failure. The alternative (gate inside Phase 0) was rejected because it mixes retrieval concerns with safety checks.
- **Absorbing Steps 1-2 into Phase 0 for code-review**: The original Steps 1 (Determine Scope) and 2 (Gather Context) are pure retrieval operations. Moving them into Phase 0 lets Sonnet start reasoning immediately when it receives the Context Bundle. The alternative (keeping Steps 1-2 and adding Phase 0 before them) was rejected because it would duplicate the retrieval work.
- **Keeping Core Principles section**: Although it could be considered "soft content," the Core Principles section guides Sonnet's review quality and tone. Removing it would change the review character. It is kept verbatim.
- **Preserving all three handoff variants in code-review**: The original has success (issues found), clean (no issues), and failure (error) handoff variants. All three are preserved because each represents a distinct pipeline state that downstream commands depend on.

### Implementation Notes

- The optimized code-review.md should be approximately 160 lines (down from 240) -- the savings come from absorbing Steps 1-2 into Phase 0 and the subagent prompt being more compact than the original verbose instructions
- The optimized code-review-fix.md should be approximately 190 lines (down from 218) -- smaller savings because the original was already leaner, and the Phase 0 subagent prompt adds some lines while absorbing only Step 1
- Both files use em-dash (`--`) instead of the Unicode em-dash from the original. This is intentional for plain-text compatibility. Either form works in Claude Code's markdown parser.
- If validation shows the wrong model is being used, check that the YAML frontmatter has exactly `model: claude-sonnet-4-6` (no trailing spaces, no quotes around the value)

---

> **Reminder**: Mark this brief done after execution:
> Rename `task-3.md` to `task-3.done.md`
> This signals to `/execute` (via artifact scan) that this task is complete.
