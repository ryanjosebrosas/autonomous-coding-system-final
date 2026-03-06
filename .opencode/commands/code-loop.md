---
description: Automated review → fix → review loop until clean
model: ollama/deepseek-v3.1:671b-cloud
---

# Code Loop: Automated Fix Loop

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop (this) → /commit → /pr
```

Automated review-fix cycle. Reads review artifacts. Outputs clean code ready for commit.

## Purpose

Automates the fix loop workflow:
```
/code-review → /code-review-fix (review artifact) → validation → /code-review
```

Runs until all issues are fixed or unfixable error detected.

**Next step after clean exit:** Run `/commit` to commit changes, then `/pr` to create a pull request.

Slice completion rule:
- A slice is considered complete only when code review returns no Critical/Major issues (or user explicitly accepts remaining minor issues).
- Start the next slice only after this completion condition.

Incremental rule:
- Keep each loop focused on one concrete outcome.
- If fixes spread into unrelated domains, stop and split into a follow-up loop/plan.

## Usage

```
/code-loop [feature-name]
```

- `feature-name` (optional): Used for report file. If omitted, read `.agents/context/next-command.md` for the active feature name.

---

## Pre-Loop: RAG Context Load (Optional)

Before starting the review loop, gather relevant documentation context:

**If RAG knowledge base MCP is available:**
1. Search for relevant patterns based on the feature/files being reviewed (2-5 keyword queries)
2. Search for reference implementations of similar patterns
3. Pass context to code-review steps so reviews can cross-reference against documentation

**If RAG unavailable:** Proceed without RAG context — the review steps have their own exploration capabilities.

---



---

## Fix Loop

### Checkpoint System (Context Compaction)

At the start of EACH iteration, save progress checkpoint:
```markdown
**Checkpoint {N}** - {timestamp}
- Issues remaining: X (Critical: Y, Major: Z)
- Last fix: {what was fixed}
- Validation: {lint/test results}
```

**Why:** If context compacts or session interrupts, work can be recovered from last checkpoint.

### Iteration 1-N

1. **Run `/code-review`**
   - Save to: `.agents/features/{feature}/review-{N}.md`

2. **Check findings:**
   - **If 0 issues:** → Exit loop, go to commit
   - **If only Minor issues:** → Ask user: "Fix minor issues or skip to commit?"
   - **If Critical/Major issues:** → Continue to fix step

 3. **Fix issues with `/code-review-fix` (primary path)**

    Run the dedicated fix command on the review artifact:
    ```
    /code-review-fix .agents/features/{feature}/review-{N}.md critical+major
    ```

    Where scope is:
    - `critical+major` — Fix Critical and Major only (default for loop)
    - `all` — Fix all issues including Minor
    - `critical` — Fix Critical only
    - `{file-path}` — Fix issues only in specified file(s)

    `/code-review-fix` handles: reading the review, fixing by severity order, running validation after each fix. After this fix pass succeeds, mark the source review file `.done.md`.



 4. **Run full validation for this slice:**
   - Run lint/style checks (project-configured)
   - Run type safety checks (project-configured)
   - Run unit tests (project-configured)
   - Run integration tests (project-configured)
   - Run manual verification steps from the active plan

 5. **Check for unfixable errors:**
   - Command not found → Stop, report missing tool
   - Dependency errors → Stop, report missing dependencies
   - Syntax errors blocking analysis → Stop, report file:line
   - If no unfixable errors → Continue to next iteration

### Loop Exit Conditions

| Condition | Action |
|-----------|--------|
| 0 issues + validation passes | → Hand off to `/commit` |
| Only Minor issues | → Ask user: fix or defer? |
| Unfixable error detected | → Stop, report what's blocking |

### Escape Hatch: `/planning` → `/execute` for Architectural Fixes

If `/code-review-fix` cannot handle the fix (architectural changes, multi-file refactors, complex logic rewrites):

1. **Create fix plan via `/planning`**
   - Input: latest review artifact `.agents/features/{feature}/review-{N}.md`
   - Output: `.agents/features/{feature}/fixes-{N}.md`
   - The fix plan must define a single bounded fix slice (Critical/Major first)

2. **Run `/execute` with the fix plan**
   - Input: `.agents/features/{feature}/fixes-{N}.md`
   - After this fix pass succeeds, mark the source review file `.done.md`

**When to escalate to `/planning` → `/execute`**: Fix requires changes to 5+ files, introduces new abstractions, or changes API surfaces.
**When to stay with `/code-review-fix`**: Everything else — null checks, imports, naming, type fixes, missing error handling, test fixes.

### User Interruption Handling

**If user presses Ctrl+C during iteration:**
1. Save current checkpoint to `.agents/features/{feature}/interrupted-{N}.md`
2. Report progress and remaining issues
3. Clean exit (no partial commits)

**If context compacts (session memory limit):**
1. Last checkpoint is already saved (from checkpoint system)
2. Next iteration reads checkpoint and continues
3. Report: "Resumed from checkpoint {N}"

---

## Handoff (When Loop Exits Clean)

1. **Report completion:**
   ```
   Code loop complete

   Iterations: N
   Issues fixed: X (Critical: Y, Major: Z, Minor: W)
   Status: Ready for /commit
   ```

2. Tell the user to run `/commit` when ready. The user reviews the output and commits when satisfied.

3. **Pipeline Handoff Write** (required): Overwrite `.agents/context/next-command.md`:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /code-loop
   - **Feature**: {feature}
   - **Next Command**: /commit
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: ready-to-commit
   ```

---

## Output Report

Working filename: `.agents/features/{feature}/loop-report-{N}.md`

Write the loop report to the working filename as the loop progresses. Do NOT use `.done.md` until the completion sweep.

Done marker rule:
- Mark done status in filenames only by appending `.done` before `.md`.
- Do not modify markdown H1/title text just to indicate completion.
- On clean exit (0 issues or user accepts), perform a **completion sweep** as the final step before commit:
  1. Rename the loop report: `.agents/features/{feature}/loop-report-{N}.md` → `.agents/features/{feature}/loop-report-{N}.done.md`
  2. Rename the last review file: `.agents/features/{feature}/review-{N}.md` → `.agents/features/{feature}/review-{N}.done.md`
  3. Rename any fix plan artifacts that were fully applied: `.agents/features/{feature}/fixes-{N}.md` → `.agents/features/{feature}/fixes-{N}.done.md`
- On interrupted/stopped exit, leave filenames as `.md` (not done).

### Loop Summary

- **Feature**: {feature-name}
- **Iterations**: N
- **Final Status**: Clean / Stopped (unfixable error) / Stopped (user interrupt) / Stopped (user choice)

### Issues Fixed by Iteration

| Iteration | Critical | Major | Minor | Total |
|-----------|----------|-------|-------|-------|
| 1 | X | Y | Z | T |
| 2 | X | Y | Z | T |
| N (final) | X | Y | Z | T |

### Checkpoints Saved

- `.agents/features/{feature}/checkpoint-1.md` — Iteration 1 progress
- ...
- **If interrupted:** `.agents/features/{feature}/interrupted-{N}.md` — Resume point

### Validation Results

```bash
# Output from lint/typecheck/tests
```

---

## Error Handling

**Distinguish Fixable vs Unfixable Errors:**

**Fixable (continue loop):**
- Code review finds issues → `/code-review-fix` fixes them
- Lint errors → `/code-review-fix` fixes formatting
- Type errors (simple) → `/code-review-fix` adds type annotations
- Test failures → `/code-review-fix` fixes logic

**Unfixable (stop loop, report to user):**
- Command not found (lint tool not installed)
- Missing dependencies (package install needed)
- Syntax errors preventing parsing
- Circular dependencies requiring refactor
- Missing files or broken imports
- Architecture-level changes needed

**If `/code-review` fails:** Retry once. If still fails: Stop, report error.
**If `/code-review-fix` fails:** Report which issues couldn't be fixed. If unfixable: Stop. If temporary: Continue.
**If `/commit` fails:** Report error (pre-commit hook?). Don't retry automatically.
**If user interrupts (Ctrl+C):** Save checkpoint, report progress, clean exit.
