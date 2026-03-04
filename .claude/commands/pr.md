---
description: Create feature branch, push, and open PR
model: claude-sonnet-4-6
---

# PR: Create Branch and Pull Request

## Arguments

`$ARGUMENTS` — Optional: feature name for the branch (e.g., `supabase-provider`), or PR title override

(If no arguments, derive branch name from the latest commit message)

## Prerequisites

- Commit must already exist (run `/commit` first)
- If working tree is dirty, report and exit

---

## Step 1: Gather Context

```bash
git status
git log -5 --oneline
git remote -v
git branch --show-current
```

**If working tree is dirty (uncommitted changes):**
- Report: "Uncommitted changes detected. Run `/commit` first."
- Exit — do NOT commit automatically.

---

## Step 2: Determine Branch Name and Scope

Each PR gets its own branch. The branch name should reflect the specific feature/fix, not a long-lived epic branch.

**Branch naming convention**: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`

> Note: `FEATURE_NAME` is resolved in Step 2a below — read the full step before deriving the branch name.

Derive the branch name:
1. If `$ARGUMENTS` contains a feature name → use it directly (e.g., `feat/supabase-provider`)
2. If `FEATURE_NAME` detected from report (Step 2a below) → use it: `feat/{FEATURE_NAME}` (or `fix/` / `chore/` based on the commit type of `PR_COMMITS`)
3. Otherwise → derive from the latest commit message:
   - `feat(memory): add Supabase provider` → `feat/supabase-provider`
   - `fix(rerank): handle empty results` → `fix/rerank-empty-results`

---

**Auto-detect feature and scope commits from execution report:**

**Step 2a — Identify the feature:**
1. If `$ARGUMENTS` is a feature slug (e.g., `/pr build-batch-dispatch-wiring`) → `FEATURE_NAME = $ARGUMENTS`
2. Otherwise → find the most recently modified report file:
   - Unix: `ls -t .agents/features/*/report.md .agents/features/*/report.done.md 2>/dev/null | head -1`
   - Windows: check each path in `.agents/features/*/report.md` and `.agents/features/*/report.done.md` directly, use the one with the latest modification time
   - Extract `FEATURE_NAME` from the result: the directory segment between `features/` and the filename.
     Example: `.agents/features/build-batch-dispatch-wiring/report.done.md` → `FEATURE_NAME = build-batch-dispatch-wiring`
3. If no report found → `FEATURE_NAME = null`, skip to fallback at end of Step 2c.

**Step 2b — Locate report and parse files touched:**

Try each path in order, use the first that exists:
```
.agents/features/{FEATURE_NAME}/report.md        ← canonical active
.agents/features/{FEATURE_NAME}/report.done.md   ← canonical done
.agents/reports/{FEATURE_NAME}-report.md         ← legacy active
.agents/reports/{FEATURE_NAME}-report.done.md    ← legacy done
```

Store the found path as `REPORT_PATH`.

From the `## Meta Information` section of `REPORT_PATH`, parse:
- Lines matching `- **Files modified**: {value}` — extract `{value}`
- Lines matching `- **Files added**: {value}` — extract `{value}`
- If `{value}` is exactly `None` → skip that line
- Otherwise: split `{value}` on `,` → for each item: trim whitespace → strip surrounding backticks → add to list
- Stop parsing at the next `##` header

Collect all resulting paths into `FEATURE_FILES`.

**Step 2c — Intersect with unpushed commits:**

```bash
# Find unpushed commits that touched the feature's files only
git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline -- {FEATURE_FILES}
```

Store the SHA list as `PR_COMMITS` (oldest first).

**If `PR_COMMITS` is empty** (feature already pushed, or files not in git log):
Report: "No unpushed commits found touching `{FEATURE_FILES}` — feature may already be pushed."
Fall back to full unpushed list:
```bash
git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline
```
Ask user to confirm which commits to include.

**If `REPORT_PATH` not found or `FEATURE_FILES` is empty** (no report, or both lines were `None`):
Report: "No execution report found for `{FEATURE_NAME}`. Showing all unpushed commits."
Fall back to:
```bash
git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline
```

**Display detection result before proceeding** (always show, even in fallback):
```
Feature detected:  {FEATURE_NAME}   (or "unknown" if null)
Report:            {REPORT_PATH}    (or "not found")
Files touched:     {FEATURE_FILES}  (or "none detected")
Commits selected:  {PR_COMMITS}

Proceeding with {N} commit(s) → {branch-name}
Abort with Ctrl+C if this scope is wrong.
```

---

## Step 3: Detect Remote and Main Branch

Auto-detect from git config (no hardcoded values):

```bash
# Detect remote name (prefer 'origin', fall back to first remote)
git remote | head -1

# Detect main branch
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo "main"

# Fetch to ensure remote refs are current
git fetch {REMOTE}
```

Store:
- `REMOTE` — the remote name (usually `origin`)
- `MAIN_BRANCH` — the main branch name (usually `main` or `master`)
- `BASE_SHA` — the current tip of `{REMOTE}/{MAIN_BRANCH}`

If `.claude/config.md` specifies these values, use those instead.

---

## Step 4: Create Isolated Feature Branch and Push

**Critical:** The feature branch must contain ONLY the PR's commits — not the full local history.

```bash
# 1. Branch from remote main (not local HEAD) — clean base with no extra commits
git checkout -b <branch-name> {REMOTE}/{MAIN_BRANCH}

# 2. Cherry-pick only the selected feature commits (oldest first)
git cherry-pick <commit-sha-1> <commit-sha-2> ...   # PR_COMMITS, oldest→newest

# 3. Push only this branch
git push {REMOTE} <branch-name> -u

# 4. Return to original branch
git checkout <original-branch>
```

**If cherry-pick conflicts:**
- Report which commit conflicted and which files
- Do NOT auto-resolve — stop and surface to user

**If branch name already exists on remote:**
- Report: "Branch `<name>` already exists on remote."
- Ask: create with a suffix (e.g., `feat/supabase-provider-2`), or use existing?

**Result:** The feature branch on remote contains exactly `PR_COMMITS` on top of `{REMOTE}/{MAIN_BRANCH}` — nothing else.

---

## Step 5: Generate PR Title and Body

```bash
# Gather context — scoped to the feature branch only (not local master)
git log --oneline {REMOTE}/{MAIN_BRANCH}...<branch-name>
git diff {REMOTE}/{MAIN_BRANCH}...<branch-name> --stat
git diff {REMOTE}/{MAIN_BRANCH}...<branch-name>
```

Also read (if they exist) for richer PR body context:
- `{REPORT_PATH}` — execution report (already resolved in Step 2b; contains validation results, files changed, task summary)
- `.agents/features/{FEATURE_NAME}/review.done.md` — code review findings addressed this loop
- `.agents/reviews/{FEATURE_NAME}*.done.md` — legacy review location fallback

Generate the PR title and body directly:

**Title format:** `type(scope): description` (conventional commit format, max 72 chars)

**Body format:**
```markdown
## What
- {2-4 bullets: what changed, specific and concrete}

## Why
{1-2 sentences: why this was needed}

## Changes
{Files changed grouped by area with 1-line description each}

## Testing
{Test results, validation commands run, pass/fail}

## Notes
{Breaking changes, migration steps, known skips — or "None"}
```

---

## Step 6: Create Pull Request

```bash
gh pr create \
  --base {MAIN_BRANCH} \
  --head <branch-name> \
  --title "<pr-title>" \
  --body "$(cat <<'EOF'
{generated PR body}
EOF
)"
```

If `gh` CLI is not available or not authenticated:
- Report: "GitHub CLI not available. Install with `gh auth login` or create PR manually."
- Provide the branch name and suggested title/body for manual creation.

---

## Step 7: Report Completion

```
PR Created
==========

Branch:  <branch-name> (new, from <original-branch>)
PR:      <pr-url>
Title:   <pr-title>
Base:    {MAIN_BRANCH}
Commits: <N> commits
Current: Back on <original-branch>

Next: Wait for review, then merge or address feedback.
```

### Pipeline Handoff Write (required)

After PR creation, overwrite `.agents/context/next-command.md`:

```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /pr
- **Feature**: {feature}
- **Next Command**: [pipeline complete — PR open at {pr-url}]
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: pr-open
```

This is a terminal handoff — the pipeline is complete for this feature. `/prime` will show this as informational ("Last feature PR'd: {feature}") rather than actionable.

**If PR creation fails** (e.g., `gh` not authenticated, network error, cherry-pick conflict, branch already exists): Write handoff preserving the feature context:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /pr (failed)
- **Feature**: {feature}
- **Next Command**: /pr {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```
Report the error clearly: what failed (cherry-pick conflict? auth? network?), what the user should do (resolve conflict, run `gh auth login`, retry). Clean up any partial state (delete local feature branch if push failed).

---

## Notes

- **One PR per feature/slice** — each `/pr` creates a fresh branch, not extending a prior PR
- **Branch from `{REMOTE}/{MAIN_BRANCH}`, not from local HEAD** — this is the key isolation guarantee; cherry-pick brings only the selected commits
- Always auto-detect remote and main branch — no hardcoded repos
- After PR creation, return to the original branch so work can continue
- If `gh` CLI is not authenticated, report and suggest `gh auth login`
- Do NOT force-push unless explicitly asked
- If the current branch IS already a clean feature branch (branched from remote main with only relevant commits), skip Steps 2-4 and push + PR directly
- **Never push local master/main to remote** — always use an isolated feature branch for PRs
