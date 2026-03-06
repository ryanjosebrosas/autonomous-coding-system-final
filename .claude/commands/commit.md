---
description: Create git commit with conventional message format
model: glm-4.7:cloud
---

# Commit: Create Git Commit

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit (this) → /pr
```

Commits completed work. Reads changed files from git status. Outputs commit hash and feeds `/pr`.

## Files to Commit

Files specified: $ARGUMENTS

(If no files specified, stage and commit only files relevant to the current spec. Never use `git add -A`.)

## Commit Process

### 1. Review Current State

```bash
git status
git diff HEAD
```

If staging specific files: `git diff HEAD -- $ARGUMENTS`

### 2. Generate Commit Message

Generate the commit message directly:
- Format: `type(scope): short description` (imperative mood, max 50 chars)
- Types: feat, fix, refactor, docs, test, chore, perf, style, plan
- Optional body: 3 bullet points max — what and why, not how

### 3. Stage and Commit

Before staging, run artifact completion sweep (required):
- Scan `.agents/features/*/` for completed artifacts and rename `.md` → `.done.md`:
  - `report.md` → `report.done.md` (execution report — commit means it's final)
  - `review.md` → `review.done.md` (if all findings were addressed in this commit)
  - Any other active artifacts that are fully resolved
- Keep filenames as the source of completion status; do not rely on title edits.
- Only rename artifacts in feature folders relevant to this commit's changes.

```bash
git add $ARGUMENTS  # or git add -- src/ tests/ if no files specified (scoped to relevant files)
git commit -m "{generated message}"
```

### 4. Confirm Success

```bash
git log -1 --oneline
git show --stat
```

## Output Report

**Commit Hash**: [hash]
**Message**: [full message]
**Files**: [list with change stats]
**Summary**: X files changed, Y insertions(+), Z deletions(-)

**Next**: Push to remote (`git push`) or continue development.

### 5. Update Memory (if memory.md exists)

Append to memory.md: session note, any lessons/gotchas/decisions discovered. Keep entries 1-2 lines each. Don't repeat existing entries. Skip if memory.md doesn't exist.

### 5.5. Pipeline Handoff Write (required)

After successful commit, overwrite `.agents/context/next-command.md`:

```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /commit
- **Feature**: {feature, from commit scope or .agents/context/next-command.md}
- **Next Command**: /pr {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: ready-for-pr
```

Derive `{feature}` from: (1) the commit scope (e.g., `feat(auth): ...` → `auth`), (2) the previous handoff file's Feature field, or (3) the most recent `.agents/features/*/report.md`.



**If commit fails** (e.g., pre-commit hooks, merge conflict, empty commit): Write handoff with the previous feature name preserved:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /commit (failed)
- **Feature**: {feature}
- **Next Command**: /commit
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```
Report the error clearly: what failed, why, and what the user should do to fix it. Do NOT leave the handoff stale from the previous command.

### 6. Report Completion

Report the commit details and suggest next steps:
- "Committed. Next: `/pr {feature}` to create a pull request."

## Notes

- If no changes to commit, report clearly
- If commit fails (pre-commit hooks), report the error
- Follow the project's commit message conventions
- Do NOT include Co-Authored-By lines in commits
