# Task 4 of 6: Sonnet Loop/Gate Commands — code-loop.md, final-review.md

> **Feature**: `claude-command-optimization`
> **Brief Path**: `.agents/features/claude-command-optimization/task-4.md`
> **Plan Overview**: `.agents/features/claude-command-optimization/plan.md`

---

## OBJECTIVE

Create Claude-optimized Sonnet-tier loop and gate commands (`.claude/commands/code-loop.md` and `.claude/commands/final-review.md`) with Phase 0 Haiku subagent research delegation, correct `claude-sonnet-4-6` model frontmatter, and all decision logic, loop control, checkpoint system, exit conditions, and verdict logic preserved from the originals.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.claude/commands/code-loop.md` | UPDATE | Replace deepseek model with claude-sonnet-4-6, add Phase 0 Haiku delegation, strip inline context gathering, keep all loop control logic |
| `.claude/commands/final-review.md` | UPDATE | Replace deepseek model with claude-sonnet-4-6, add Phase 0 Haiku delegation, move Step 1 Gather Context into Phase 0, keep verdict/approval logic |

**Multi-file justification:** Both files are Sonnet-tier loop/gate commands with identical optimization patterns (Phase 0 delegation + model swap). The edits are tightly coupled by the shared Phase 0 pattern and Sonnet model tier. They share the same pipeline segment (code-loop feeds into final-review).

**Out of Scope:**
- `.opencode/commands/code-loop.md` and `.opencode/commands/final-review.md` — source files, DO NOT MODIFY
- `.claude/commands/code-review.md` and `.claude/commands/code-review-fix.md` — handled by Task 3
- `.claude/commands/system-review.md` and `.claude/commands/pr.md` — handled by Task 5
- Any Opus-tier or Haiku-tier commands — handled by Tasks 2 and 6
- Pipeline code in `.opencode/pipeline/` — not in scope for this feature

**Dependencies:**
- Task 1 must complete first — `.claude/commands/` must be a real directory (not a symlink)
- Task 3 (code-review.md, code-review-fix.md) should ideally complete first since code-loop.md invokes `/code-review` and `/code-review-fix`, but the commands are invoked by name, not by file reference, so Task 4 can proceed independently

---

## PRIOR TASK CONTEXT

### Task 1: Foundation — Replace Symlink
**Files Changed:**
- `.claude/commands/` — converted from symlink (pointing to `.opencode/commands/`) to a real empty directory

**State Carried Forward:**
- `.claude/commands/` is now a real directory ready to receive optimized command files
- `.opencode/commands/` is completely untouched — all 14 original command files remain
- Claude Code discovers commands from `.claude/commands/` natively

### Task 2: Haiku Commands (prime.md, commit.md)
**What was done:** Created trimmed Haiku-tier commands with `model: claude-haiku-4-5-20251001`. No Phase 0 delegation (Haiku commands do their own lightweight retrieval).

### Task 3: Sonnet Review Commands (code-review.md, code-review-fix.md)
**What was done:** Created Sonnet-tier review commands with `model: claude-sonnet-4-6` and Phase 0 Haiku subagent delegation. Established the Phase 0 delegation pattern that this task follows.

**Patterns Established:**
- Phase 0 block format using `Agent tool with subagent_type="Explore"`
- Context Bundle return structure
- "Wait for subagent to return. Then proceed to Phase 1 with the Context Bundle." handoff pattern

**Known Issues or Deferred Items:**
- None from prior tasks affecting this task

---

## CONTEXT REFERENCES

> IMPORTANT: Read ALL files listed here before implementing. They are not optional.

### Files to Read

- `.opencode/commands/code-loop.md` (all 246 lines) — Why: Source material. Contains all loop control logic, checkpoint system, exit conditions, error handling that must be preserved
- `.opencode/commands/final-review.md` (all 220 lines) — Why: Source material. Contains all verdict logic, acceptance criteria checking, approval gate that must be preserved
- `.claude/config.md` (all 45 lines) — Why: Contains validation commands referenced by both commands

### Current Content: code-loop.md (Full File — 246 lines)

```markdown
---
description: Automated review -> fix -> review loop until clean
model: deepseek-v3.1:671b-cloud
---

# Code Loop: Automated Fix Loop

## Pipeline Position

```
/prime -> /mvp -> /prd -> /pillars -> /decompose -> /planning -> /execute -> /code-review -> /code-loop (this) -> /commit -> /pr
```

Automated review-fix cycle. Reads review artifacts. Outputs clean code ready for commit.

## Purpose

Automates the fix loop workflow:
```
/code-review -> /code-review-fix (review artifact) -> validation -> /code-review
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

**If RAG unavailable:** Proceed without RAG context -- the review steps have their own exploration capabilities.

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
   - **If 0 issues:** -> Exit loop, go to commit
   - **If only Minor issues:** -> Ask user: "Fix minor issues or skip to commit?"
   - **If Critical/Major issues:** -> Continue to fix step

 3. **Fix issues with `/code-review-fix` (primary path)**

    Run the dedicated fix command on the review artifact:
    ```
    /code-review-fix .agents/features/{feature}/review-{N}.md critical+major
    ```

    Where scope is:
    - `critical+major` -- Fix Critical and Major only (default for loop)
    - `all` -- Fix all issues including Minor
    - `critical` -- Fix Critical only
    - `{file-path}` -- Fix issues only in specified file(s)

    `/code-review-fix` handles: reading the review, fixing by severity order, running validation after each fix. After this fix pass succeeds, mark the source review file `.done.md`.



 4. **Run full validation for this slice:**
   - Run lint/style checks (project-configured)
   - Run type safety checks (project-configured)
   - Run unit tests (project-configured)
   - Run integration tests (project-configured)
   - Run manual verification steps from the active plan

 5. **Check for unfixable errors:**
   - Command not found -> Stop, report missing tool
   - Dependency errors -> Stop, report missing dependencies
   - Syntax errors blocking analysis -> Stop, report file:line
   - If no unfixable errors -> Continue to next iteration

### Loop Exit Conditions

| Condition | Action |
|-----------|--------|
| 0 issues + validation passes | -> Hand off to `/commit` |
| Only Minor issues | -> Ask user: fix or defer? |
| Unfixable error detected | -> Stop, report what's blocking |

### Escape Hatch: `/planning` -> `/execute` for Architectural Fixes

If `/code-review-fix` cannot handle the fix (architectural changes, multi-file refactors, complex logic rewrites):

1. **Create fix plan via `/planning`**
   - Input: latest review artifact `.agents/features/{feature}/review-{N}.md`
   - Output: `.agents/features/{feature}/fixes-{N}.md`
   - The fix plan must define a single bounded fix slice (Critical/Major first)

2. **Run `/execute` with the fix plan**
   - Input: `.agents/features/{feature}/fixes-{N}.md`
   - After this fix pass succeeds, mark the source review file `.done.md`

**When to escalate to `/planning` -> `/execute`**: Fix requires changes to 5+ files, introduces new abstractions, or changes API surfaces.
**When to stay with `/code-review-fix`**: Everything else -- null checks, imports, naming, type fixes, missing error handling, test fixes.

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
  1. Rename the loop report: `.agents/features/{feature}/loop-report-{N}.md` -> `.agents/features/{feature}/loop-report-{N}.done.md`
  2. Rename the last review file: `.agents/features/{feature}/review-{N}.md` -> `.agents/features/{feature}/review-{N}.done.md`
  3. Rename any fix plan artifacts that were fully applied: `.agents/features/{feature}/fixes-{N}.md` -> `.agents/features/{feature}/fixes-{N}.done.md`
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

- `.agents/features/{feature}/checkpoint-1.md` -- Iteration 1 progress
- ...
- **If interrupted:** `.agents/features/{feature}/interrupted-{N}.md` -- Resume point

### Validation Results

```bash
# Output from lint/typecheck/tests
```

---

## Error Handling

**Distinguish Fixable vs Unfixable Errors:**

**Fixable (continue loop):**
- Code review finds issues -> `/code-review-fix` fixes them
- Lint errors -> `/code-review-fix` fixes formatting
- Type errors (simple) -> `/code-review-fix` adds type annotations
- Test failures -> `/code-review-fix` fixes logic

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
```

**Analysis**: The current file uses `model: deepseek-v3.1:671b-cloud` which must change to `model: claude-sonnet-4-6`. The Pre-Loop RAG Context Load section (lines 45-55) is lightweight and stays as a reference note. The main optimization is adding Phase 0 to gather feature name, validation commands, and existing artifacts BEFORE the loop starts — eliminating the need for inline context reads during loop iterations. All Fix Loop logic (lines 62-151), Handoff (lines 154-178), Output Report (lines 180-220), and Error Handling (lines 224-246) must be preserved verbatim.

### Current Content: final-review.md (Full File — 220 lines)

```markdown
---
description: Final review gate -- summarize all changes, verify acceptance criteria, get human approval before commit
model: deepseek-v3.1:671b-cloud
---

# Final Review: Pre-Commit Approval Gate

## Pipeline Position

```
/prime -> /mvp -> /prd -> /pillars -> /decompose -> /planning -> /execute -> /code-review -> /code-loop -> /final-review (this) -> /commit -> /pr
```

Final approval gate before commit. Reads changed files and review artifacts. Outputs approval decision.

## Purpose

Final checkpoint between `/code-loop` (or `/code-review`) and `/commit`. Aggregates all review findings, shows what changed, verifies acceptance criteria from the plan, and asks for explicit human approval before committing.

This command does NOT fix code. It summarizes, verifies, and asks.

## Usage

```
/final-review [plan-path]
```

- `plan-path` (optional): Path to the plan file (e.g., `.agents/plans/retrieval-trace.md`). If provided, acceptance criteria are pulled from the plan. If omitted, criteria check is skipped and only the summary + diff is shown.

---

## Step 1: Gather Context

Run these commands to understand the current state:

```bash
git status
git diff --stat HEAD
git diff HEAD
git log -5 --oneline
```

Also check for review artifacts:

```bash
ls .agents/reviews/ 2>/dev/null || echo "No code review artifacts"
ls .agents/reports/loops/ 2>/dev/null || echo "No code loop artifacts"
```

---

## Step 2: Change Summary

Present a concise summary of everything that changed:

### Files Changed

| File | Status | Lines +/- |
|------|--------|-----------|
| {path} | {added/modified/deleted} | +X / -Y |

### Change Overview

For each changed file, write 1-2 sentences describing WHAT changed and WHY:

- `path/to/file.py` -- {what changed and why}
- `path/to/test.py` -- {what changed and why}

---

## Step 3: Validation Results

Run the full validation pyramid using project-configured commands and report results:

### Level 1: Syntax & Style
```bash
{configured lint command}
{configured format check command}
```

### Level 2: Type Safety
```bash
{configured type check command}
```

### Level 3: Tests
```bash
{configured test command}
```

Report the results as a table:

| Check | Status | Details |
|-------|--------|---------|
| Linting | PASS/FAIL | {details if fail} |
| Formatting | PASS/FAIL | {details if fail} |
| Type checking | PASS/FAIL | {details if fail} |
| Tests | PASS/FAIL | X passed, Y failed |

**If any Level 1-3 checks FAIL**: Stop here. Report failures and recommend running `/code-loop` or `/execute` to fix before retrying `/final-review`.

---

## Step 4: Review Findings Summary

If code review artifacts exist in `.agents/reviews/` or `.agents/reports/loops/`, summarize:

### Review History

| Review | Critical | Major | Minor | Status |
|--------|----------|-------|-------|--------|
| Review #1 | X | Y | Z | {Fixed/Open} |
| Review #2 | X | Y | Z | {Fixed/Open} |

### Outstanding Issues

List any remaining issues from reviews that were NOT fixed:

- **{severity}**: `file:line` -- {description} -- Reason not fixed: {reason}

If no outstanding issues: "All review findings have been addressed."

---

## Step 5: Acceptance Criteria Check

**If plan-path was provided**, read the plan file and locate the `## ACCEPTANCE CRITERIA` section.

For each criterion, verify whether it is met:

### Implementation Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {criterion text} | MET/NOT MET | {how verified} |
| 2 | {criterion text} | MET/NOT MET | {how verified} |

### Runtime Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {criterion text} | MET/NOT MET/DEFERRED | {how verified or why deferred} |

**If plan-path was NOT provided**: Skip this section and note "No plan provided -- acceptance criteria check skipped."

---

## Step 6: Final Verdict

Summarize the readiness assessment:

```
FINAL REVIEW SUMMARY
====================

Changes:     X files changed, +Y/-Z lines
Tests:       A passed, B failed
Lint/Types:  CLEAN / X issues remaining
Reviews:     N iterations, M issues fixed, P outstanding
Criteria:    X/Y met (Z deferred)

VERDICT:     READY TO COMMIT / NOT READY
```

**READY TO COMMIT** when:
- All validation levels pass (lint, types, tests)
- No Critical or Major review findings outstanding
- All Implementation acceptance criteria met (if plan provided)

**NOT READY** when:
- Any validation level fails
- Critical or Major review findings still open
- Implementation acceptance criteria not met

---

## Step 7: Ask for Approval

**If READY TO COMMIT:**

Ask the user:

```
Ready to commit. Suggested message:

  {type}({scope}): {description}

Proceed with /commit? (yes / modify message / abort)
```

Wait for explicit user response. Do NOT auto-commit.

**If NOT READY:**

Report what needs to be fixed and suggest next action:

```
Not ready to commit. Outstanding issues:

1. {issue}
2. {issue}

Recommended: Run /code-loop to address remaining issues, then retry /final-review.
```

---

## Output

This command produces no persistent artifact. Its output is the conversation itself -- the summary and approval decision. The subsequent `/commit` command handles the actual commit and report.

---

## Notes

- This command is read-only: it does NOT modify files, stage changes, or create commits.
- If the user says "yes", they should run `/commit` as the next command.
- If the user wants to modify the commit message, note it and they can pass it to `/commit`.
- Keep the summary concise -- the user has already been through `/code-loop` and wants a quick final check, not a deep re-review.
```

**Analysis**: The current file uses `model: deepseek-v3.1:671b-cloud` which must change to `model: claude-sonnet-4-6`. Step 1 (Gather Context, lines 32-49) performs inline context gathering (git commands, artifact scanning) that should move to Phase 0. Steps 2-7 (lines 52-220) contain the core verdict logic, acceptance criteria checking, and approval gate — all of which must be preserved exactly. The `$ARGUMENTS` handling for `plan-path` must be maintained.

### Current Content: .claude/config.md (Full File — 45 lines)

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
- Project uses the PIV Loop methodology: Plan -> Implement -> Validate
```

**Analysis**: Both commands reference validation commands from this config. The Phase 0 subagent should read this file and extract the validation command list so Sonnet can reference them without needing to read config itself.

---

### Patterns to Follow

**Pattern 1: Phase 0 Haiku Subagent Delegation** (established by Task 3 for code-review.md):

This is the Phase 0 block format that Task 3 established for Sonnet-tier commands. Task 4 follows the same pattern with task-specific context gathering instructions.

```markdown
## Phase 0: Gather Context (Haiku Subagent)

Before reasoning, launch a Haiku Explore subagent to gather all context:

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /{command-name}:
> 1. {specific read/gather instruction 1}
> 2. {specific read/gather instruction 2}
> 3. {specific read/gather instruction 3}
> 4. {specific read/gather instruction 4}
>
> Return a structured Context Bundle with:
> - {return field 1}
> - {return field 2}
> - {return field 3}
> - {return field 4}

Wait for the subagent to return. Then proceed to {next phase} with the Context Bundle.
```
- Why this pattern: Offloads retrieval to cheap Haiku model so Sonnet focuses on reasoning and decision-making
- How to apply: Each command gets its own Phase 0 with task-specific gather instructions and return fields
- Common gotchas: The subagent instructions must be specific (file paths, command names) not vague. The Context Bundle must list exactly what fields are returned.

**Pattern 2: YAML Frontmatter Model Declaration** (from plan.md):

```yaml
---
description: {same description as original — do not change}
model: claude-sonnet-4-6
---
```
- Why this pattern: Claude Code reads the `model` field to select the appropriate model tier
- How to apply: Replace `deepseek-v3.1:671b-cloud` with `claude-sonnet-4-6` in both files
- Common gotchas: Keep the `description` field exactly as the original. Only change the `model` field.

**Pattern 3: Pipeline Position Section (Unchanged)** (from plan.md Pattern 4):

Every command keeps its Pipeline Position section exactly as the original. This section is structural metadata, not reasoning content, and must not be modified during optimization.

```markdown
## Pipeline Position

```
/prime -> /mvp -> /prd -> ... -> /code-loop (this) -> /commit -> /pr
```

{one-line description of what the command does in the pipeline}
```
- Why this pattern: Pipeline position is structural metadata used by other commands and documentation
- How to apply: Copy the Pipeline Position section verbatim from the original
- Common gotchas: Do not abbreviate, reorder, or modify the pipeline position line

**Pattern 4: Handoff Write Section (Unchanged)** (from plan.md Pattern 5):

Every command keeps its Pipeline Handoff Write section exactly as the original. Handoff writes are the pipeline coordination mechanism.

```markdown
**Pipeline Handoff Write** (required): Overwrite `.agents/context/next-command.md`:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /{command-name}
- **Feature**: {feature}
- **Next Command**: /{next-command}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: {status-value}
```
```
- Why this pattern: Pipeline commands coordinate through handoff files — modifying these breaks the pipeline
- How to apply: Copy handoff write sections verbatim from the original
- Common gotchas: Status values must match AGENTS.md conventions. Do not change field names or structure.

---

## STEP-BY-STEP TASKS

---

### Step 1: UPDATE `.claude/commands/code-loop.md`

**What**: Replace the entire code-loop.md with the Claude-optimized version — Sonnet model, Phase 0 delegation, all loop logic preserved.

**IMPLEMENT**:

The file currently exists at `.claude/commands/code-loop.md` with 246 lines. Replace the ENTIRE file with the following optimized content.

Current (lines 1-4 of `.claude/commands/code-loop.md` — frontmatter):
```yaml
---
description: Automated review → fix → review loop until clean
model: deepseek-v3.1:671b-cloud
---
```

Replace the ENTIRE file with this optimized version (~180 lines):

```markdown
---
description: Automated review → fix → review loop until clean
model: claude-sonnet-4-6
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

- `feature-name` (optional): Used for report file. If omitted, derived from Context Bundle.

---

## Phase 0: Gather Context (Haiku Subagent)

Before starting the loop, launch a Haiku Explore subagent to gather all context:

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /code-loop:
> 1. Read `.agents/context/next-command.md` — extract the Feature name
> 2. Read `.claude/config.md` — extract all Validation Commands (L1-L5)
> 3. Scan `.agents/features/{feature}/` for existing artifacts:
>    - Any `review-*.md` files (current review state)
>    - Any `checkpoint-*.md` files (prior loop progress)
>    - Any `loop-report-*.md` files (prior loop reports)
>    - Any `interrupted-*.md` files (interrupted sessions)
>    - Any `fixes-*.md` files (escalated fix plans)
> 4. If `$ARGUMENTS` provides a feature name, use that instead of the handoff file
>
> Return a structured Context Bundle with:
> - Feature name (from args or handoff)
> - Validation commands (L1 lint, L1 format, L2 types, L3 unit, L4 integration)
> - Existing artifacts list (path, type, status — done vs active)
> - Resume state: if checkpoint/interrupted files exist, report the last checkpoint number and its content
> - Loop iteration number to start at (1 if fresh, N+1 if resuming)

Wait for the subagent to return. Then proceed with the Fix Loop using the Context Bundle.

---

## Pre-Loop: RAG Context Load (Optional)

**If RAG knowledge base MCP is available:**
1. Search for relevant patterns based on the feature/files being reviewed (2-5 keyword queries)
2. Search for reference implementations of similar patterns
3. Pass context to code-review steps so reviews can cross-reference against documentation

**If RAG unavailable:** Proceed without RAG context — the review steps have their own exploration capabilities.

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

 4. **Run full validation for this slice** (use commands from Context Bundle):
   - Run lint/style checks (L1 from config)
   - Run type safety checks (L2 from config)
   - Run unit tests (L3 from config)
   - Run integration tests (L4 from config)
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
```

**PATTERN**: Plan Phase 0 delegation pattern (Pattern 1 above) + original `.opencode/commands/code-loop.md` for all loop logic

**IMPORTS**: N/A — markdown file

**GOTCHA**: The Phase 0 subagent must gather artifact state (existing reviews, checkpoints, interrupted files) because the loop may be resuming from a prior session. The original handled this implicitly by reading files inline. The optimized version moves this to Phase 0 so Sonnet has the resume state immediately. Also ensure the validation step (Iteration step 4) references "commands from Context Bundle" rather than generic "project-configured" — this signals to Sonnet to use the config values from Phase 0.

**VALIDATE**:
```bash
# Verify file exists and has correct model
test -f .claude/commands/code-loop.md && echo "EXISTS" || echo "MISSING"
head -4 .claude/commands/code-loop.md
# Expected: model: claude-sonnet-4-6

# Verify Phase 0 section present
grep -c "Phase 0" .claude/commands/code-loop.md
# Expected: 1 or more

# Verify key sections preserved
grep -c "Checkpoint System" .claude/commands/code-loop.md
grep -c "Loop Exit Conditions" .claude/commands/code-loop.md
grep -c "Escape Hatch" .claude/commands/code-loop.md
grep -c "Pipeline Handoff Write" .claude/commands/code-loop.md
grep -c "Error Handling" .claude/commands/code-loop.md
# All should return 1
```

---

### Step 2: UPDATE `.claude/commands/final-review.md`

**What**: Replace the entire final-review.md with the Claude-optimized version — Sonnet model, Phase 0 delegation replacing Step 1, all verdict and approval logic preserved.

**IMPLEMENT**:

The file currently exists at `.claude/commands/final-review.md` with 220 lines. Replace the ENTIRE file with the following optimized content.

Current (lines 1-4 of `.claude/commands/final-review.md` — frontmatter):
```yaml
---
description: Final review gate — summarize all changes, verify acceptance criteria, get human approval before commit
model: deepseek-v3.1:671b-cloud
---
```

Replace the ENTIRE file with this optimized version (~160 lines):

```markdown
---
description: Final review gate — summarize all changes, verify acceptance criteria, get human approval before commit
model: claude-sonnet-4-6
---

# Final Review: Pre-Commit Approval Gate

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /final-review (this) → /commit → /pr
```

Final approval gate before commit. Reads changed files and review artifacts. Outputs approval decision.

## Purpose

Final checkpoint between `/code-loop` (or `/code-review`) and `/commit`. Aggregates all review findings, shows what changed, verifies acceptance criteria from the plan, and asks for explicit human approval before committing.

This command does NOT fix code. It summarizes, verifies, and asks.

## Usage

```
/final-review [plan-path]
```

- `plan-path` (optional): Path to the plan file (e.g., `.agents/plans/retrieval-trace.md`). If provided, acceptance criteria are pulled from the plan. If omitted, criteria check is skipped and only the summary + diff is shown.

---

## Phase 0: Gather Context (Haiku Subagent)

Before reviewing, launch a Haiku Explore subagent to gather all context:

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /final-review:
> 1. Run `git status` and capture output
> 2. Run `git diff --stat HEAD` and capture output
> 3. Run `git diff HEAD` and capture full diff output
> 4. Run `git log -5 --oneline` and capture output
> 5. Scan for review artifacts:
>    - Check `.agents/features/*/review*.md` for code review artifacts
>    - Check `.agents/features/*/loop-report*.md` for code loop artifacts
>    - Read any found artifacts and extract: severity counts, status (fixed/open), outstanding issues
> 6. If `$ARGUMENTS` provides a plan-path, read that plan file and extract the `## ACCEPTANCE CRITERIA` section (both Implementation and Runtime criteria)
> 7. Read `.claude/config.md` — extract all Validation Commands (L1-L5)
>
> Return a structured Context Bundle with:
> - Git status output
> - Diff stats (files changed, lines added/removed)
> - Full diff content
> - Recent commit log (5 entries)
> - Review history: list of review artifacts with severity counts and status
> - Outstanding issues: any unresolved Critical/Major/Minor from reviews
> - Acceptance criteria (if plan provided): list of Implementation and Runtime criteria text
> - Validation commands from config (L1 lint, L1 format, L2 types, L3 unit tests)

Wait for the subagent to return. Then proceed to Step 2 with the Context Bundle.

---

## Step 2: Change Summary

Present a concise summary of everything that changed (using diff stats from Context Bundle):

### Files Changed

| File | Status | Lines +/- |
|------|--------|-----------|
| {path} | {added/modified/deleted} | +X / -Y |

### Change Overview

For each changed file, write 1-2 sentences describing WHAT changed and WHY:

- `path/to/file.py` — {what changed and why}
- `path/to/test.py` — {what changed and why}

---

## Step 3: Validation Results

Run the full validation pyramid using commands from the Context Bundle and report results:

### Level 1: Syntax & Style
```bash
{L1 lint command from config}
{L1 format command from config}
```

### Level 2: Type Safety
```bash
{L2 types command from config}
```

### Level 3: Tests
```bash
{L3 unit test command from config}
```

Report the results as a table:

| Check | Status | Details |
|-------|--------|---------|
| Linting | PASS/FAIL | {details if fail} |
| Formatting | PASS/FAIL | {details if fail} |
| Type checking | PASS/FAIL | {details if fail} |
| Tests | PASS/FAIL | X passed, Y failed |

**If any Level 1-3 checks FAIL**: Stop here. Report failures and recommend running `/code-loop` or `/execute` to fix before retrying `/final-review`.

---

## Step 4: Review Findings Summary

Summarize review history from the Context Bundle:

### Review History

| Review | Critical | Major | Minor | Status |
|--------|----------|-------|-------|--------|
| Review #1 | X | Y | Z | {Fixed/Open} |
| Review #2 | X | Y | Z | {Fixed/Open} |

### Outstanding Issues

List any remaining issues from reviews that were NOT fixed:

- **{severity}**: `file:line` — {description} — Reason not fixed: {reason}

If no outstanding issues: "All review findings have been addressed."

---

## Step 5: Acceptance Criteria Check

**If plan-path was provided** (acceptance criteria available in Context Bundle):

For each criterion, verify whether it is met:

### Implementation Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {criterion text} | MET/NOT MET | {how verified} |
| 2 | {criterion text} | MET/NOT MET | {how verified} |

### Runtime Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {criterion text} | MET/NOT MET/DEFERRED | {how verified or why deferred} |

**If plan-path was NOT provided**: Skip this section and note "No plan provided — acceptance criteria check skipped."

---

## Step 6: Final Verdict

Summarize the readiness assessment:

```
FINAL REVIEW SUMMARY
====================

Changes:     X files changed, +Y/-Z lines
Tests:       A passed, B failed
Lint/Types:  CLEAN / X issues remaining
Reviews:     N iterations, M issues fixed, P outstanding
Criteria:    X/Y met (Z deferred)

VERDICT:     READY TO COMMIT / NOT READY
```

**READY TO COMMIT** when:
- All validation levels pass (lint, types, tests)
- No Critical or Major review findings outstanding
- All Implementation acceptance criteria met (if plan provided)

**NOT READY** when:
- Any validation level fails
- Critical or Major review findings still open
- Implementation acceptance criteria not met

---

## Step 7: Ask for Approval

**If READY TO COMMIT:**

Ask the user:

```
Ready to commit. Suggested message:

  {type}({scope}): {description}

Proceed with /commit? (yes / modify message / abort)
```

Wait for explicit user response. Do NOT auto-commit.

**If NOT READY:**

Report what needs to be fixed and suggest next action:

```
Not ready to commit. Outstanding issues:

1. {issue}
2. {issue}

Recommended: Run /code-loop to address remaining issues, then retry /final-review.
```

---

## Output

This command produces no persistent artifact. Its output is the conversation itself — the summary and approval decision. The subsequent `/commit` command handles the actual commit and report.

---

## Notes

- This command is read-only: it does NOT modify files, stage changes, or create commits.
- If the user says "yes", they should run `/commit` as the next command.
- If the user wants to modify the commit message, note it and they can pass it to `/commit`.
- Keep the summary concise — the user has already been through `/code-loop` and wants a quick final check, not a deep re-review.
```

**PATTERN**: Plan Phase 0 delegation pattern (Pattern 1 above) + original `.opencode/commands/final-review.md` for all verdict logic

**IMPORTS**: N/A — markdown file

**GOTCHA**: The original Step 1 contained specific git commands and artifact scan paths. These must ALL appear in the Phase 0 subagent prompt — nothing should be lost. The subagent must also handle the conditional plan-path reading: if `$ARGUMENTS` provides a plan path, read it and extract acceptance criteria. If not, the Context Bundle should indicate "no plan provided" so Step 5 can skip gracefully. Also note: the original checked `.agents/reviews/` and `.agents/reports/loops/` — the optimized version updates these paths to `.agents/features/*/review*.md` and `.agents/features/*/loop-report*.md` which reflects the actual artifact layout used by `/code-review` and `/code-loop`.

**VALIDATE**:
```bash
# Verify file exists and has correct model
test -f .claude/commands/final-review.md && echo "EXISTS" || echo "MISSING"
head -4 .claude/commands/final-review.md
# Expected: model: claude-sonnet-4-6

# Verify Phase 0 section present
grep -c "Phase 0" .claude/commands/final-review.md
# Expected: 1 or more

# Verify Step 1 (Gather Context) is REMOVED
grep -c "Step 1: Gather Context" .claude/commands/final-review.md
# Expected: 0

# Verify key sections preserved
grep -c "Change Summary" .claude/commands/final-review.md
grep -c "Validation Results" .claude/commands/final-review.md
grep -c "Acceptance Criteria Check" .claude/commands/final-review.md
grep -c "Final Verdict" .claude/commands/final-review.md
grep -c "Ask for Approval" .claude/commands/final-review.md
grep -c "Do NOT auto-commit" .claude/commands/final-review.md
# All should return 1
```

---

### Step 3: Cross-validate both files

**What**: Verify both optimized files are structurally sound and consistent with each other and the pipeline.

**IMPLEMENT**:

Run the following validation checks:

1. Both files reference the correct model:
```bash
grep "model:" .claude/commands/code-loop.md .claude/commands/final-review.md
# Both should show: model: claude-sonnet-4-6
```

2. Pipeline Position references are correct and consistent:
```bash
grep "code-loop" .claude/commands/code-loop.md | head -2
# Should include "(this)" marker

grep "final-review" .claude/commands/final-review.md | head -2
# Should include "(this)" marker
```

3. Phase 0 exists in both:
```bash
grep "Phase 0" .claude/commands/code-loop.md .claude/commands/final-review.md
# Both should have Phase 0 section
```

4. Neither file contains the old model:
```bash
grep "deepseek" .claude/commands/code-loop.md .claude/commands/final-review.md
# Should return NO matches
```

5. code-loop.md preserves all critical sections:
```bash
for section in "Checkpoint System" "Iteration 1-N" "Loop Exit Conditions" "Escape Hatch" "User Interruption" "Handoff" "Pipeline Handoff Write" "Output Report" "Done marker rule" "Error Handling" "Fixable" "Unfixable"; do
  grep -c "$section" .claude/commands/code-loop.md > /dev/null && echo "OK: $section" || echo "MISSING: $section"
done
```

6. final-review.md preserves all critical sections:
```bash
for section in "Change Summary" "Validation Results" "Review Findings Summary" "Acceptance Criteria Check" "Final Verdict" "READY TO COMMIT" "NOT READY" "Ask for Approval" "Do NOT auto-commit"; do
  grep -c "$section" .claude/commands/final-review.md > /dev/null && echo "OK: $section" || echo "MISSING: $section"
done
```

**PATTERN**: Structural validation pattern — verify section headers present in markdown files

**IMPORTS**: N/A

**GOTCHA**: The grep commands use exact section names from the original files. If the optimized versions changed any section headings, these checks will fail and the heading must match the original.

**VALIDATE**:
```bash
# All checks above must pass. Consolidate:
echo "=== MODEL CHECK ==="
grep "model:" .claude/commands/code-loop.md .claude/commands/final-review.md

echo "=== OLD MODEL CHECK ==="
grep -c "deepseek" .claude/commands/code-loop.md .claude/commands/final-review.md 2>/dev/null || echo "CLEAN: no deepseek references"

echo "=== PHASE 0 CHECK ==="
grep -c "Phase 0" .claude/commands/code-loop.md .claude/commands/final-review.md
```

---

## TESTING STRATEGY

### Unit Tests

No unit tests — this task modifies markdown command files, not TypeScript source code. Validation is structural (section presence, frontmatter correctness) covered by the validation commands below.

### Integration Tests

N/A — markdown command files are consumed by Claude Code's command discovery mechanism. Integration testing requires manually invoking `/code-loop` and `/final-review` in a Claude Code session (covered by Level 5 manual validation).

### Edge Cases

- **code-loop.md resumption**: If a prior loop was interrupted (checkpoint files exist), Phase 0 must detect and report the resume state. The subagent instructions explicitly gather checkpoint and interrupted artifact files.
- **final-review.md without plan-path**: When `$ARGUMENTS` is empty, Phase 0 should report "no plan provided" so Step 5 gracefully skips acceptance criteria. The subagent instructions handle this conditionally.
- **final-review.md with plan-path**: When `$ARGUMENTS` provides a plan path, Phase 0 must read the plan and extract the ACCEPTANCE CRITERIA section. The subagent instructions include this conditional read.
- **Empty artifact directories**: If `.agents/features/{feature}/` has no review or checkpoint files, Phase 0 should return empty lists, not errors. The subagent handles this via scan-and-report pattern.
- **Old model reference leaked**: If any reference to `deepseek-v3.1:671b-cloud` remains in either file, it indicates incomplete replacement. Validation step catches this.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Both files exist and are well-formed markdown
test -f .claude/commands/code-loop.md && echo "L1 PASS: code-loop.md exists" || echo "L1 FAIL: code-loop.md missing"
test -f .claude/commands/final-review.md && echo "L1 PASS: final-review.md exists" || echo "L1 FAIL: final-review.md missing"

# YAML frontmatter is present and has correct model
head -4 .claude/commands/code-loop.md
head -4 .claude/commands/final-review.md
# Both should show: model: claude-sonnet-4-6
```

### Level 2: Type Safety
```bash
# N/A — no type-checked code modified. These are markdown files.
echo "L2 N/A: markdown files only, no TypeScript"
```

### Level 3: Unit Tests
```bash
# N/A — no unit tests for markdown command files
echo "L3 N/A: no unit tests for markdown command files (see Testing Strategy)"
```

### Level 4: Integration Tests
```bash
# N/A — integration requires Claude Code runtime. Covered by L5 manual.
echo "L4 N/A: covered by Level 5 manual validation"
```

### Level 5: Manual Validation

1. Open Claude Code in the project directory
2. Type `/code-loop` and observe:
   - Claude Code discovers the command from `.claude/commands/code-loop.md`
   - The model selected is Sonnet (not deepseek)
   - Phase 0 launches a Haiku subagent to gather context
   - The loop control logic (checkpoint, iteration, exit conditions) is present
3. Type `/final-review` and observe:
   - Claude Code discovers the command from `.claude/commands/final-review.md`
   - The model selected is Sonnet (not deepseek)
   - Phase 0 launches a Haiku subagent to gather git diff, review artifacts, plan criteria
   - No inline "Step 1: Gather Context" — context comes from Phase 0
   - Verdict logic (READY TO COMMIT / NOT READY) is present
   - Approval gate (Do NOT auto-commit) is enforced
4. Type `/final-review .agents/features/some-feature/plan.md` and observe:
   - Phase 0 reads the plan file and extracts acceptance criteria
   - Step 5 checks each criterion against evidence
5. Success: Both commands run with Sonnet, Phase 0 gathers context, all logic preserved
6. Failure indicators: Wrong model shown, Phase 0 not triggered, missing sections in output, auto-commit happening

### Level 6: Cross-Check

```bash
# Verify no old model references remain in either file
grep -r "deepseek" .claude/commands/code-loop.md .claude/commands/final-review.md
# Expected: no output (clean)

# Verify both files have Phase 0 (consistent with code-review.md and code-review-fix.md from Task 3)
grep "Phase 0" .claude/commands/code-loop.md .claude/commands/code-review.md .claude/commands/final-review.md
# All three should have Phase 0

# Verify model consistency across Sonnet-tier commands
grep "model:" .claude/commands/code-loop.md .claude/commands/code-review.md .claude/commands/code-review-fix.md .claude/commands/final-review.md
# All four should show: model: claude-sonnet-4-6
```

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] `.claude/commands/code-loop.md` exists with `model: claude-sonnet-4-6` in frontmatter
- [ ] `.claude/commands/final-review.md` exists with `model: claude-sonnet-4-6` in frontmatter
- [ ] code-loop.md has Phase 0 section with Haiku subagent delegation
- [ ] code-loop.md Phase 0 gathers: feature name, validation commands, existing artifacts, resume state
- [ ] code-loop.md preserves all Fix Loop sections: Checkpoint System, Iteration 1-N, Loop Exit Conditions, Escape Hatch, User Interruption Handling
- [ ] code-loop.md preserves Handoff section with Pipeline Handoff Write verbatim
- [ ] code-loop.md preserves Output Report section with Done marker rules verbatim
- [ ] code-loop.md preserves Error Handling section (Fixable vs Unfixable) verbatim
- [ ] final-review.md has Phase 0 section replacing original Step 1 (Gather Context)
- [ ] final-review.md Phase 0 gathers: git status/diff/log, review artifacts, plan acceptance criteria, validation commands
- [ ] final-review.md preserves Steps 2-7: Change Summary, Validation Results, Review Findings Summary, Acceptance Criteria Check, Final Verdict, Ask for Approval
- [ ] final-review.md preserves HARD STOP on approval: "Do NOT auto-commit"
- [ ] final-review.md preserves READY TO COMMIT / NOT READY verdict criteria
- [ ] Neither file contains any reference to `deepseek-v3.1:671b-cloud`
- [ ] Neither file contains any reference to `glm-4.7:cloud` or `gpt-5.3-codex`
- [ ] Both files preserve their Pipeline Position sections verbatim from originals
- [ ] `.opencode/commands/code-loop.md` and `.opencode/commands/final-review.md` are UNTOUCHED

### Runtime (verify after testing/deployment)

- [ ] Claude Code discovers `/code-loop` from `.claude/commands/code-loop.md`
- [ ] Claude Code discovers `/final-review` from `.claude/commands/final-review.md`
- [ ] Both commands run on Sonnet model tier
- [ ] Phase 0 subagent is triggered before main reasoning in both commands
- [ ] `/final-review` without plan-path skips acceptance criteria check gracefully
- [ ] `/final-review` with plan-path reads and checks acceptance criteria

---

## HANDOFF NOTES

> What the NEXT task needs to know.

### Files Created/Modified

- `.claude/commands/code-loop.md` — Replaced with Claude-optimized Sonnet version. Phase 0 Haiku delegation added for artifact and config gathering. All loop control logic preserved verbatim.
- `.claude/commands/final-review.md` — Replaced with Claude-optimized Sonnet version. Phase 0 Haiku delegation replaces Step 1 (Gather Context). All verdict and approval logic preserved verbatim.

### Patterns Established

- Phase 0 delegation pattern continues from Task 3 — same structure, task-specific subagent instructions
- Conditional argument handling in Phase 0: code-loop.md handles optional feature-name arg, final-review.md handles optional plan-path arg
- Validation commands referenced "from Context Bundle" instead of "project-configured" — signals to Sonnet that config values come from Phase 0

### State to Carry Forward

- 4 of 6 Sonnet-tier commands now optimized (code-review.md, code-review-fix.md, code-loop.md, final-review.md)
- Task 5 handles the remaining 2 Sonnet commands: system-review.md and pr.md
- The Phase 0 pattern is now well-established across 4 files — Task 5 should follow the same structure
- All 4 Sonnet commands use `model: claude-sonnet-4-6` consistently

### Known Issues or Deferred Items

- The artifact scan paths in final-review.md Phase 0 were updated from `.agents/reviews/` and `.agents/reports/loops/` to `.agents/features/*/review*.md` and `.agents/features/*/loop-report*.md` — this reflects the actual artifact layout. If older artifacts exist at the legacy paths, they will not be found by Phase 0. This is acceptable since the legacy paths were never actually used by the pipeline.
- No handoff write was added to final-review.md — the original intentionally produces no persistent artifact (output is conversation-only). This design decision is preserved.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Step 1 VALIDATE commands executed and passed (code-loop.md)
- [ ] Step 2 VALIDATE commands executed and passed (final-review.md)
- [ ] Step 3 cross-validation commands executed and passed
- [ ] All validation levels run (L1 passed, L2 N/A, L3 N/A, L4 N/A, L5 manual pending)
- [ ] Manual testing confirms expected behavior (L5)
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in `.opencode/commands/` source files
- [ ] Handoff notes written for Task 5
- [ ] Brief marked done: rename `task-4.md` to `task-4.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **Phase 0 for code-loop.md gathers resume state**: Unlike code-review.md (which has no prior state), code-loop.md may be resuming from a prior interrupted session. Phase 0 explicitly gathers checkpoint and interrupted artifact files so Sonnet knows whether to start fresh or resume. This is the key difference from the Task 3 Phase 0 pattern.
- **Phase 0 replaces Step 1 entirely in final-review.md**: The original Step 1 was pure context gathering (git commands + artifact scanning). Moving this to Phase 0 is a clean 1:1 replacement — no logic was lost, just relocated to the subagent. Steps 2-7 are renumbered to keep the same step labels since Step 2 in the original becomes Step 2 in the optimized version (no renumbering needed since Step 1 is replaced, not removed and gaps left).
- **Artifact scan path update**: The original final-review.md referenced `.agents/reviews/` and `.agents/reports/loops/` which are legacy paths. The pipeline actually stores artifacts in `.agents/features/{feature}/review*.md` and `.agents/features/{feature}/loop-report*.md`. Phase 0 uses the correct current paths.
- **Validation step references "Context Bundle"**: In code-loop.md iteration step 4, the optimized version says "use commands from Context Bundle" instead of "project-configured". This is intentional — it tells Sonnet to use the specific commands that Phase 0 already extracted from config.md, avoiding redundant config reads.

### Implementation Notes

- Both files are complete replacements (not patches). The executing agent should write the entire file content, not attempt a line-by-line edit.
- The optimized code-loop.md is approximately 180 lines (down from 246) — the reduction comes from removing inline context gathering and adding the more compact Phase 0 block.
- The optimized final-review.md is approximately 160 lines (down from 220) — the reduction comes from replacing Step 1 (17 lines of bash commands and artifact checks) with a Phase 0 block (20 lines of structured subagent instructions).
- If validation fails on the "no deepseek references" check, search the file for any remaining model references and replace them.

---

> **Reminder**: Mark this brief done after execution:
> Rename `task-4.md` to `task-4.done.md`
> This signals to `/execute` (via artifact scan) that this task is complete.
