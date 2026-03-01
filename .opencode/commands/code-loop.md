---
description: Automated review → fix → review loop until clean
---

# Code Loop: Automated Fix Loop

## Purpose

Automates the fix loop workflow:
```
/code-review → /planning (fix-slice) → /execute (fix plan) → /code-review
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
/code-loop [feature-name] [--auto] [--auto-commit]
```

- `feature-name` (optional): Used for commit message and report file. If omitted, read `.agents/context/next-command.md` for the active feature name.
- `--auto` (optional): Handle Minor-only findings automatically without prompting the user. If Minor fixes touch fewer than 3 files, auto-fix them. If 3+ files, skip Minor fixes and proceed to commit. Useful for autonomous pipelines where Minor findings should not block progress.
- `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), run `/commit` automatically within this session instead of handing off. Useful for autonomous pipelines.

**Combining flags:** `--auto --auto-commit` gives fully autonomous behavior: Minor findings are handled without prompting, and the loop auto-commits when clean. This is the recommended combination for autonomous use (e.g., inside `/build`).

---

## Pre-Loop: RAG Context Load (Optional)

Before starting the review loop, gather relevant documentation context:

**If RAG knowledge base MCP is available:**
1. Search for relevant patterns based on the feature/files being reviewed (2-5 keyword queries)
2. Search for reference implementations of similar patterns
3. Pass context to code-review steps so reviews can cross-reference against documentation

**If RAG unavailable:** Proceed without RAG context — the review steps have their own exploration capabilities.

---

## Multi-Model Dispatch in Loop (Optional)

The dispatch tool sends prompts to other AI models. In the code-loop context, use it for:

1. **Multi-model review** — get additional review perspectives beyond the primary review
2. **Fix delegation** — dispatch fix implementation to fast models while you orchestrate

**This is optional.** If dispatch is not available, skip all dispatch steps and run the loop with the primary model.

### Review Dispatch (during step 1 of each iteration)

After the primary `/code-review` runs, consider dispatching for additional findings.

**When to dispatch a second review:**
- First iteration (fresh code, worth getting a second perspective)
- When review finds security-sensitive issues (get confirmation)
- When review finds 0 issues (sanity check — did we miss something?)
- When changes touch multiple interconnected files

**When to skip dispatch review:**
- Later iterations with only minor fixes remaining
- When previous dispatch round added no new findings
- When changes are trivial (typos, formatting)

```
REVIEW_PROMPT = "Review the following code changes for Critical and Major issues only.\n\n{git diff HEAD}\n\nRespond with:\n- ISSUES FOUND: [list each issue as: Severity | File:Line | Description]\n- NO ISSUES: code is clean."
```

**First iteration (fresh code — run gauntlet):**
```
batch-dispatch({
  batchPattern: "free-impl-validation",
  prompt: REVIEW_PROMPT,
})
```
Read `escalationAction` from the `## Consensus Analysis` table in the output:
- `skip-t4` → 0-1 models found issues → proceed to fix step or commit
- `run-t4` → 2 models found issues → run one tiebreaker, then fix
- `fix-and-rerun` → 3+ models found issues → fix loop (step 4), then re-run gauntlet

**Later iterations (targeted — single dispatch):**
```
dispatch({
  taskType: "code-review",
  prompt: REVIEW_PROMPT,
})
```

**Security-sensitive changes (any iteration):**
```
dispatch({
  taskType: "security-review",
  prompt: REVIEW_PROMPT,
})
```
Hard rule: Auth, crypto, payment changes ALWAYS go through security-review, regardless of consensus.

**Merging dispatch findings with primary review:**
- Deduplicate — if dispatch finds the same issue as primary review, note "confirmed by second model"
- Add new findings to the review artifact with source attribution
- Include in the fix plan so `/execute` addresses them

### Fix Dispatch (during step 4 of each iteration)

For simple, isolated fixes (e.g., "add missing null check at line 42", "rename variable X to Y"):

**Simple fix (single file, clear issue):**
```
dispatch({
  mode: "agent",
  taskType: "simple-fix",
  prompt: "Fix the following issue in {file}: {issue description from review}. Read the file first. Make minimal changes. Run validation after.",
})
```

**Complex fix (multi-file or multi-concern):**
```
dispatch({
  mode: "agent",
  taskType: "complex-fix",
  prompt: "Fix the following issues: {list from review}. Read all affected files first. Make minimal changes. Run validation after.",
})
```

- Only dispatch fixes you can verify — review the result before accepting
- Never dispatch architectural changes or multi-file refactors via fix dispatch
- If the dispatched fix looks wrong, implement it yourself

### Model Routing for Loop Tasks

| Task | taskType | Tier |
|------|----------|------|
| Code review (general) | `code-review` | T2a |
| Security review | `security-review` | T2a |
| Architecture audit | `architecture-audit` | T2b |
| Simple fix | `simple-fix` | T1a |
| Complex fix | `complex-fix` | T1c |
| Near-final sign-off | `t4-sign-off` via `batch-dispatch` | T4 |
| Last-resort review | `final-review` | T5 |

### Consensus-Gating Rule

Read `escalationAction` from `batch-dispatch` output (`## Consensus Analysis` table):

| `escalationAction` | Meaning | Action |
|--------------------|---------|--------|
| `skip-t4` | 0-1 models found issues | Proceed to commit. $0 paid cost. |
| `run-t4` | 2 models found issues | `dispatch({ taskType: "code-review", prompt: REVIEW_PROMPT })` as tiebreaker |
| `fix-and-rerun` | 3+ models found issues | Fix loop → re-run gauntlet. Max 3 re-gauntlet iterations. |

**If dispatch unavailable:** Run the loop with the primary model only. Apply the same when-to-dispatch/skip guidance as a checklist for self-review angles (security, architecture, logic, quality).

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
   - **If only Minor issues:**
     - **If `--auto` is set:** Auto-decide based on scope:
       - Minor fixes touch < 3 files → auto-fix (continue to fix step with Minor scope)
       - Minor fixes touch 3+ files → skip Minor fixes, exit loop, go to commit
       - Log decision: "AUTO: Fixing {N} minor issues in {M} files" or "AUTO: Skipping {N} minor issues (3+ files — deferring)"
     - **If `--auto` is NOT set:** → Ask user: "Fix minor issues or skip to commit?"
   - **If Critical/Major issues:** → Continue to fix step

 3. **Create fix plan via `/planning` (required)**
     - Input: latest review artifact `.agents/features/{feature}/review-{N}.md`
     - Output: `.agents/features/{feature}/fixes-{N}.md`
     - The fix plan must define a single bounded fix slice (Critical/Major first)
     - If the review includes RAG-informed findings, include the RAG source references in the fix plan

 4. **Run `/execute` with the fix plan (required)**
    - Input: `.agents/features/{feature}/fixes-{N}.md`
    - Never run `/execute` directly on raw review findings
    - After this fix pass succeeds, mark the source review file `.done.md`

 5. **Run full validation for this slice:**
   - Run lint/style checks (project-configured)
   - Run type safety checks (project-configured)
   - Run unit tests (project-configured)
   - Run integration tests (project-configured)
   - Run manual verification steps from the active plan

6. **Check for unfixable errors:**
   - Command not found → Stop, report missing tool
   - Dependency errors → Stop, report missing dependencies
   - Syntax errors blocking analysis → Stop, report file:line
   - If no unfixable errors → Continue to next iteration

### Loop Exit Conditions

| Condition | Action |
|-----------|--------|
| 0 issues + validation passes (no `--auto-commit`) | → Hand off to `/commit` (next session) |
| 0 issues + validation passes (`--auto-commit`) | → Run `/commit` directly in this session |
| Only Minor issues (`--auto`) | → Auto-fix if < 3 files; skip to commit if 3+ files |
| Only Minor issues (no `--auto`) | → Ask user: fix or defer? |
| Unfixable error detected | → Stop, report what's blocking |

### Alternative: Skip Steps 3–4 with `/code-review-fix`

For straightforward fixes, use the dedicated command instead of the full plan → execute cycle:

```
/code-review-fix .agents/features/{feature}/review-{N}.md {scope}
```

Where `{scope}` is:
- `all` — Fix all issues (default)
- `critical+major` — Fix Critical and Major only
- `critical` — Fix Critical only
- `{file-path}` — Fix issues only in specified file(s)

**When to use**: Simple, isolated fixes (null checks, imports, naming).
**When to use Steps 3–4 instead**: Architectural changes, multi-file refactors, or any fix requiring a plan.

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
   Status: {if --auto-commit: "Auto-committing" | else: "Ready for /commit"}
   ```

2. **If `--auto-commit`:** Run `/commit` directly in this session. After commit succeeds, update handoff to point at `/pr`.

3. **If no `--auto-commit`:** Tell the user to run `/commit` in the next session.
   - Do NOT auto-commit. The user reviews the code-loop output and commits when ready.

4. **Pipeline Handoff Write** (required): Overwrite `.agents/context/next-command.md`:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /code-loop
   - **Feature**: {feature}
   - **Next Command**: {if --auto-commit and commit succeeded: "/pr {feature}" | if --auto-commit and commit failed: "/commit" | else: "/commit"}
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: {if committed: "ready-for-pr" | else: "ready-to-commit"}
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
- **Dispatch used**: {yes — N dispatches across M iterations / no}

### Issues Fixed by Iteration

| Iteration | Critical | Major | Minor | Total | Dispatches |
|-----------|----------|-------|-------|-------|------------|
| 1 | X | Y | Z | T | N |
| 2 | X | Y | Z | T | N |
| N (final) | X | Y | Z | T | N |

### Checkpoints Saved

- `.agents/features/{feature}/checkpoint-1.md` — Iteration 1 progress
- ...
- **If interrupted:** `.agents/features/{feature}/interrupted-{N}.md` — Resume point

### Validation Results

```bash
# Output from lint/typecheck/tests
```

### Commit Info

- **Hash**: {commit-hash}
- **Message**: {full message}
- **Files**: X changed, Y insertions, Z deletions

---

## Error Handling

**Distinguish Fixable vs Unfixable Errors:**

**Fixable (continue loop):**
- Code review finds issues → `/execute` fixes them
- Lint errors → `/execute` fixes formatting
- Type errors (simple) → `/execute` adds type annotations
- Test failures → `/execute` fixes logic

**Unfixable (stop loop, report to user):**
- Command not found (lint tool not installed)
- Missing dependencies (package install needed)
- Syntax errors preventing parsing
- Circular dependencies requiring refactor
- Missing files or broken imports
- Architecture-level changes needed

**If `/code-review` fails:** Retry once. If still fails: Stop, report error.
**If `/execute` (fix) fails:** Report which issues couldn't be fixed. If unfixable: Stop. If temporary: Continue.
**If `/commit` fails:** Report error (pre-commit hook?). Don't retry automatically.
**If user interrupts (Ctrl+C):** Save checkpoint, report progress, clean exit.
