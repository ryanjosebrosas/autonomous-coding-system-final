# pr-auto-detect-feature-commits — Implementation Plan

## Feature Description

Auto-detect which commits belong to the last feature loop when running `/pr`, by reading the execution report artifact to extract files touched, then tracing those files through `git log` to identify the exact commits — so the user never has to manually specify commits or count ranges.

## User Story

As a developer running `/pr` after a `/planning → /execute → /code-loop → /commit` cycle, I want the PR to automatically contain only the commits from that feature loop — not every unpushed commit on master — so I can create focused, reviewable PRs without thinking about commit ranges.

## Problem Statement

The current `/pr` Step 2 runs `git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline` and uses the entire result as `PR_COMMITS`. When you work iteratively on a single master branch (the standard workflow here), that list includes commits from multiple past features. The user is then prompted to manually select which commits to include — defeating the point of an automated PR command.

Three alternative detection approaches were evaluated:

| Approach | Reliability | Verdict |
|----------|-------------|---------|
| `git log --after={report-mtime}` | Fragile — mtime changes on copy/touch | Rejected |
| Parse `feat(scope):` from commit messages | Unreliable — scope ≠ feature slug | Rejected |
| Parse `Files modified/added` from report → `git log -- {files}` | Reliable — file paths are exact | **Selected** |

The selected approach: read `**Files modified**` and `**Files added**` from the execution report, run `git log --oneline -- {those files}` scoped to unpushed commits, intersect the results. That intersection is `PR_COMMITS`. Zero user input required for a clean single-feature loop.

## Solution Statement

Rewrite Step 2 of `.opencode/commands/pr.md` to:
1. Auto-detect the feature name from `$ARGUMENTS` or from the most recent execution report
2. Locate the report at `.agents/features/{feature}/report.md` or `.agents/features/{feature}/report.done.md` (canonical) with fallback to `.agents/reports/{feature}-report.md` (legacy)
3. Parse `**Files added**` and `**Files modified**` lines from the report's Meta Information section
4. Run `git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline -- {files}` to find unpushed commits touching those files
5. Store result as `PR_COMMITS` — the automatically scoped commit set

Also fix the stale report path reference in Step 5 (currently points to legacy `.agents/reports/` only; needs to check canonical path first).

No other steps modified. Single file, three localized edits.

## Feature Metadata

- **Depth**: light (single-file edit, 3 localized sections)
- **Dependencies**: none — pure markdown command edit
- **Files touched**: `.opencode/commands/pr.md` only
- **Estimated tasks**: 3

---

## Context References

### Codebase Files

- `.opencode/commands/pr.md:35-59` — Step 2 (current commit scope logic to be replaced)
- `.opencode/commands/pr.md:119-128` — Step 5 (stale report path reference to be fixed)
- `.opencode/commands/pr.md:195-204` — Notes section (may need one addition)
- `.agents/reports/build-batch-dispatch-wiring-report.md:9-17` — canonical report Meta Information structure (the template to parse)
- `.agents/features/build-batch-dispatch-wiring/plan.done.md:1-27` — feature name in path convention

### Report Meta Information Structure (from build-batch-dispatch-wiring-report.md:9-17)

This is the exact format `/execute` produces. The parser must handle this:

```markdown
## Meta Information

- **Plan file**: `.agents/features/{feature}/plan.md`
- **Plan checkboxes updated**: yes
- **Files added**: None                          ← parse this line
- **Files modified**: `.opencode/commands/build.md`   ← parse this line
- **RAG used**: no — plan was self-contained
- **Archon tasks updated**: no
- **Dispatch used**: no
```

**Parse rules:**
- `**Files added**: None` → no files to add to the file list
- `**Files added**: path/a, path/b` → extract each comma-separated path
- `**Files modified**: path/a` → extract each comma-separated path
- Multiple paths on one line are comma-separated
- Paths may be wrapped in backticks — strip them when building the git command

### Report Path Lookup Order (canonical → legacy)

```
1. .agents/features/{feature}/report.md         ← canonical (execute.md current spec)
2. .agents/features/{feature}/report.done.md    ← canonical done
3. .agents/reports/{feature}-report.md          ← legacy
4. .agents/reports/{feature}-report.done.md     ← legacy done
```

Use the first path that exists. If none found: fall back to current Step 2 git-only behavior.

### Feature Name Detection Order

```
1. $ARGUMENTS contains a feature slug (e.g., /pr build-batch-dispatch-wiring) → use directly
2. Latest report.md in .agents/features/*/report.md sorted by mtime → extract {feature} from path
3. Latest report.done.md in .agents/features/*/report.done.md sorted by mtime → extract {feature} from path
4. Fallback: derive from latest commit message (current behavior)
```

### Current Step 2 Text (lines 35-59, to be replaced)

```markdown
## Step 2: Determine Branch Name and Scope

Each PR gets its own branch. The branch name should reflect the specific feature/fix, not a long-lived epic branch.

**Branch naming convention**: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`

Derive the branch name:
1. If `$ARGUMENTS` contains a feature name → use it (e.g., `feat/supabase-provider`)
2. Otherwise → derive from the latest commit message:
   - `feat(memory): add Supabase provider` → `feat/supabase-provider`
   - `fix(rerank): handle empty results` → `fix/rerank-empty-results`

**Determine which commits belong to this PR:**

```bash
# Show commits on current branch not yet on remote main — these are the candidates
git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline
```

- Default: commits since the last push to remote main (everything in the above list)
- If the list has commits from multiple unrelated features: ask the user which ones to include
- If `$ARGUMENTS` specifies a count (e.g., `last 3`): use the last N commits
- **Never include commits that are already on `{REMOTE}/{MAIN_BRANCH}`**

Store the selected commit hashes as `PR_COMMITS` — these are the only commits going into the PR.
```

### Current Step 5 stale path (lines 126-128, to be fixed)

```markdown
Also read (if they exist) for richer PR body context:
- `.agents/reports/{feature}-report.md` — execution summary, validation results
- `.agents/reviews/{feature}*.done.md` — what was reviewed and resolved
```

### Pattern: Existing depth-conditional blocks in other commands

Other commands (e.g. `build.md`) use this structure for fallback logic:

```markdown
**If {condition}:**
{primary path}

**If {condition} unavailable / not found:**
{fallback path}
```

Follow this pattern for the "if report found / if not found" branching in Step 2.

---

## Patterns to Follow

### Pattern 1: Feature name from path

The feature directory name IS the feature name — no parsing of file contents needed for that:
```
.agents/features/build-batch-dispatch-wiring/report.md
                 ↑ this segment is FEATURE_NAME
```

Extract with: second-to-last path segment when splitting on `/` or `\` (Windows).

**Concrete examples:**

| Path | FEATURE_NAME |
|------|-------------|
| `.agents/features/build-batch-dispatch-wiring/report.md` | `build-batch-dispatch-wiring` |
| `.agents/features/pr-auto-detect-feature-commits/report.done.md` | `pr-auto-detect-feature-commits` |
| `.agents/features/multi-model-dispatch/report.done.md` | `multi-model-dispatch` |
| `.agents/features/execute-self-review/report.md` | `execute-self-review` |

The feature slug is always the directory name immediately under `.agents/features/`. Never parse the filename itself — only the directory.

### Pattern 2: Files list parsing from report

The `**Files modified**` and `**Files added**` line formats are consistent across all reports produced by `/execute`. Here are real examples from existing reports in this repo:

**Single file modified (most common):**
```markdown
- **Files modified**: `.opencode/commands/build.md`
```
→ `FEATURE_FILES = [".opencode/commands/build.md"]`

**Multiple files modified:**
```markdown
- **Files modified**: `src/services/memory.py`, `src/deps.py`, `tests/test_memory.py`
```
→ `FEATURE_FILES = ["src/services/memory.py", "src/deps.py", "tests/test_memory.py"]`

**Files added (non-None):**
```markdown
- **Files added**: `.opencode/tools/dispatch.ts`, `.opencode/tools/batch-dispatch.ts`
```
→ append to `FEATURE_FILES`: `[".opencode/tools/dispatch.ts", ".opencode/tools/batch-dispatch.ts"]`

**Files added (None — skip):**
```markdown
- **Files added**: None
```
→ skip, do not add anything to `FEATURE_FILES`

**Mixed added + modified:**
```markdown
- **Files added**: `contracts/knowledge.py`, `migrations/001_knowledge_schema.sql`
- **Files modified**: `services/supabase.py`, `services/memory.py`
```
→ `FEATURE_FILES = ["contracts/knowledge.py", "migrations/001_knowledge_schema.sql", "services/supabase.py", "services/memory.py"]`

**Full parse algorithm** (step by step, for the model executing this):
1. Read the report file content into memory
2. Find the `## Meta Information` section header
3. Within that section, scan each line:
   - If line matches `- **Files added**: {value}` → extract `{value}`
   - If line matches `- **Files modified**: {value}` → extract `{value}`
   - Stop scanning at the next `##` section header
4. For each extracted value:
   - If value is `None` (exactly, case-sensitive) → skip
   - Otherwise: split on `,` → for each item: trim leading/trailing whitespace → strip one leading `` ` `` and one trailing `` ` `` if present → add to `FEATURE_FILES`
5. `FEATURE_FILES` is the collected list — may contain 0 to N paths

### Pattern 3: git log scoped to files

```bash
# Get unpushed commits touching specific files only
git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline -- path/one path/two path/three
```

This returns only commits that modified at least one of those files AND are not yet on remote main. The result is `PR_COMMITS`.

**Worked example** — after running `build-batch-dispatch-wiring` feature loop:

```bash
# FEATURE_FILES = [".opencode/commands/build.md"]
git log origin/master..HEAD --oneline -- .opencode/commands/build.md

# Output:
d9a13e4 feat(build): wire batch-dispatch into Step 3 plan review and Step 7 code review
```

→ `PR_COMMITS = ["d9a13e4"]` — exactly the one commit from this feature loop, not the other 6 on master.

**Worked example** — multi-file feature (dispatch tools):

```bash
# FEATURE_FILES = [".opencode/tools/dispatch.ts", ".opencode/tools/batch-dispatch.ts", ".opencode/package.json"]
git log origin/master..HEAD --oneline -- .opencode/tools/dispatch.ts .opencode/tools/batch-dispatch.ts .opencode/package.json

# Output:
9994976 feat(tools): add dispatch and batch-dispatch multi-model routing tools
a0c5afe fix(dispatch): correct agent mode — use 'general' agent type and add top-level model field
```

→ `PR_COMMITS = ["9994976", "a0c5afe"]` — both commits from that feature's loop (original + fix), nothing else.

**Edge case catalog:**

| Situation | Detection output | Action |
|-----------|-----------------|--------|
| Clean single-feature loop | Exactly the feature's commits | Proceed automatically |
| Multi-commit feature (original + fix) | All commits touching those files | Proceed — all belong to the same feature |
| Feature already pushed to remote | Empty result (0 commits) | Report "Already pushed?" + fallback to full unpushed list |
| Two features touched same file | Over-inclusive result | Show detection block — user can abort |
| No report file found | Cannot determine FEATURE_FILES | Fall back to full unpushed list + confirmation prompt |
| Report found but FEATURE_FILES is empty | `None` on both lines | Fall back to full unpushed list + confirmation prompt |
| `$ARGUMENTS` is a feature slug | Skip scan, use directly | Proceed with explicit feature |
| `$ARGUMENTS` is `last 3` | Skip artifact detection | Use last 3 commits (existing behavior) |

### Pattern 4: Detection result display block

Before cherry-picking, always display what was auto-detected. This is the user's abort point:

```
Feature detected:  build-batch-dispatch-wiring
Report:            .agents/features/build-batch-dispatch-wiring/report.done.md
Files touched:     .opencode/commands/build.md
Commits selected:  d9a13e4 feat(build): wire batch-dispatch into Step 3 plan review and Step 7 code review

Proceeding with 1 commit → feat/build-batch-dispatch-wiring
Abort with Ctrl+C if this is wrong.
```

If the scope looks wrong (over-inclusive, under-inclusive), the user aborts before any branch is created. No recovery needed.

### Pattern 5: Consistent variable naming across the whole step

Variables set in Step 2a must be referenced by the same name in 2b, 2c, and Step 5. The naming convention:

| Variable | Set in | Used in | Value |
|----------|--------|---------|-------|
| `FEATURE_NAME` | Step 2a | 2b, 2c, 4, 5 | Feature directory name slug |
| `REPORT_PATH` | Step 2b | 2c, 5 | Full path to the report file |
| `FEATURE_FILES` | Step 2b | 2c, display block | Space-separated list of file paths |
| `PR_COMMITS` | Step 2c | Step 4, display block | Space-separated list of commit SHAs |

Using consistent variable names prevents the model from re-deriving values and ensures the detection result display in Step 2c matches what Step 4 actually cherry-picks.

---

## Step-by-Step Tasks

### Task 1: Rewrite Step 2 — auto-detect feature name and locate report

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/pr.md` — lines 35-59 (Step 2: Determine Branch Name and Scope)
- **IMPLEMENT**: Replace the entire Step 2 content with the expanded version below. This is a full replacement — do not attempt a partial edit.

  The new Step 2 must look exactly like this (copy-paste ready):

  ```markdown
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
  ```

- **PATTERN**: Follow the `**If {condition}:** / **If {condition} unavailable:**` fallback pattern used in `build.md` and `execute.md` for conditional behavior blocks.
- **GOTCHA**: Step 2 currently ends at line 59. The replacement is longer (~65 lines). Do not leave the old "Determine which commits belong to this PR" block — replace the entire subsection from "Determine which commits belong to this PR" to the end of Step 2.
- **GOTCHA**: The `---` separator between Step 2 and Step 3 must be preserved. Do not include it in the replacement block — it already exists in the file.
- **VALIDATE**: After editing, read lines 35 through the first `---` after Step 2. Verify all six elements are present:
  1. Branch derivation with three-priority order including `FEATURE_NAME`
  2. `FEATURE_NAME` resolved note before the list
  3. Step 2a with `$ARGUMENTS` check, `ls -t` scan, and null fallback
  4. Step 2b with four-path lookup order and parse instructions for `Files modified`/`Files added`
  5. Step 2c with `git log -- {FEATURE_FILES}` and two fallback cases
  6. Detection result display block with abort instruction

---

### Task 2: Update branch name derivation — already included in Task 1

- **ACTION**: NOTE (no separate edit needed)
- **TARGET**: `.opencode/commands/pr.md` — branch name derivation (was lines 41-45)
- **IMPLEMENT**: The branch name derivation update (adding `FEATURE_NAME` as priority 2, adding the read-ahead note) is folded into the full replacement block in Task 1. The "Derive the branch name" list at the top of the new Step 2 already contains the three-priority order.

  Confirm the replacement block in Task 1 contains:
  ```markdown
  > Note: `FEATURE_NAME` is resolved in Step 2a below — read the full step before deriving the branch name.

  Derive the branch name:
  1. If `$ARGUMENTS` contains a feature name → use it directly (e.g., `feat/supabase-provider`)
  2. If `FEATURE_NAME` detected from report (Step 2a below) → use it: `feat/{FEATURE_NAME}` (...)
  3. Otherwise → derive from the latest commit message:
  ```

- **VALIDATE**: The three-priority order is present in the replacement. Priority 2 references `FEATURE_NAME`. The read-ahead note is present above the list.

---

### Task 3: Fix stale report path in Step 5

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/pr.md` — Step 5 artifact references (after Task 1, these will be around lines 155-162 due to expanded Step 2)
- **IMPLEMENT**: Step 5 currently references only the legacy `.agents/reports/{feature}-report.md`. After Task 1, `FEATURE_NAME` and `REPORT_PATH` are available — use them.

  Find this block in Step 5:
  ```markdown
  Also read (if they exist) for richer PR body context:
  - `.agents/reports/{feature}-report.md` — execution summary, validation results
  - `.agents/reviews/{feature}*.done.md` — what was reviewed and resolved
  ```

  Replace it with:
  ```markdown
  Also read (if they exist) for richer PR body context:
  - `{REPORT_PATH}` — execution report (already resolved in Step 2b; contains validation results, files changed, task summary)
  - `.agents/features/{FEATURE_NAME}/review.done.md` — code review findings addressed this loop
  - `.agents/reviews/{FEATURE_NAME}*.done.md` — legacy review location fallback
  ```

  Note: `REPORT_PATH` is already the correct path (canonical or legacy, whichever was found). No need to list both paths again — Step 2b already resolved it.

- **GOTCHA**: After Task 1 expands Step 2 by ~40 lines, the original line numbers shift. Do not use hardcoded line numbers to locate the target — find the block by its text content ("Also read (if they exist)").
- **GOTCHA**: `{feature}` in the original text is a template placeholder — the replacement uses the actual variable `{FEATURE_NAME}` which is set by Step 2a. This is consistent with the variable naming established in Task 1.
- **VALIDATE**: Read the modified Step 5 artifact references. Verify:
  1. `{REPORT_PATH}` is the primary reference (no duplicate canonical/legacy listing)
  2. `.agents/features/{FEATURE_NAME}/review.done.md` is listed (canonical review path)
  3. `.agents/reviews/{FEATURE_NAME}*.done.md` is listed as legacy fallback
  4. Old `.agents/reports/{feature}-report.md` reference is removed (replaced by `{REPORT_PATH}`)

---

## Testing Strategy

### Scenario A: Clean single-feature loop (happy path)

Setup state:
- `master` has 3 unpushed commits: `abc1` (unrelated), `def2` (feature A), `ghi3` (feature A fix)
- Feature A's report has `**Files modified**: src/foo.py`
- Feature A's report is at `.agents/features/feature-a/report.done.md`

Expected `/pr` behavior:
1. Step 2a: scans report files → finds `feature-a/report.done.md` → `FEATURE_NAME = feature-a`
2. Step 2b: reads report → `FEATURE_FILES = ["src/foo.py"]`
3. Step 2c: `git log origin/master..HEAD --oneline -- src/foo.py` → returns `def2`, `ghi3`
4. `PR_COMMITS = ["def2", "ghi3"]`
5. Display: shows feature-a, report path, src/foo.py, 2 commits
6. Branch: `feat/feature-a` created from `origin/master`, cherry-picks `def2` then `ghi3`
7. PR contains exactly 2 commits — `abc1` (unrelated) excluded

### Scenario B: Multi-file feature

Setup state:
- Feature B touched `src/api.py`, `src/models.py`, `tests/test_api.py`
- 1 commit: `jkl4`

Expected:
1. `FEATURE_FILES = ["src/api.py", "src/models.py", "tests/test_api.py"]`
2. `git log origin/master..HEAD --oneline -- src/api.py src/models.py tests/test_api.py` → `jkl4`
3. `PR_COMMITS = ["jkl4"]`
4. Branch cherry-picks only `jkl4`

### Scenario C: Feature already pushed (edge case)

Setup state:
- Feature C was committed and pushed to remote in a prior session
- Local master has 0 unpushed commits touching feature C's files

Expected:
1. `git log origin/master..HEAD --oneline -- {FEATURE_FILES}` → empty
2. Report: "No unpushed commits found touching `{FEATURE_FILES}` — feature may already be pushed."
3. Fallback: show full `git log origin/master..HEAD --oneline`
4. Ask user to confirm which commits to include

### Scenario D: No report found (cold start)

Setup state:
- `/pr` run without a preceding `/execute` cycle, or from a directory with no `.agents/features/`

Expected:
1. Step 2a: no report files found → `FEATURE_NAME = null`
2. Step 2c: fallback immediately — show all unpushed commits
3. Report: "No execution report found. Showing all unpushed commits — confirm which to include."
4. Detection display: all fields show "unknown" / "not found"

### Scenario E: $ARGUMENTS overrides auto-detection

Command: `/pr fix-pr-isolation`

Expected:
1. Step 2a: `FEATURE_NAME = fix-pr-isolation` (from `$ARGUMENTS`)
2. Skip `ls -t` scan entirely
3. Step 2b: look for report at `.agents/features/fix-pr-isolation/report.md` etc.
4. If found: normal detection. If not found: fallback with `FEATURE_NAME = fix-pr-isolation` in display.

### Scenario F: Shared file conflict (two features touched same file)

Setup state:
- Feature X and Feature Y both modified `.opencode/commands/build.md`
- Most recent report is for Feature X
- 4 unpushed commits: 2 from Feature X, 2 from Feature Y

Expected:
1. `FEATURE_FILES = [".opencode/commands/build.md"]`
2. `git log` returns all 4 commits (all touched `build.md`)
3. Detection display shows 4 commits — user sees over-inclusive scope
4. User aborts with Ctrl+C, reruns as `/pr feature-x` with explicit slug to narrow scope
5. On rerun with `$ARGUMENTS = feature-x`: same `FEATURE_FILES`, same 4 commits — still over-inclusive
6. User must manually specify `last 2` to get the right subset

**Documented in display**: "If commits look over-inclusive (multiple features touched the same file), abort and specify `/pr {feature-name} last N` to limit by count."

### Manual Verification Checklist

After edits, read the modified `pr.md` and verify each item:

1. Step 2 header and branch naming convention unchanged
2. Read-ahead note present above branch derivation list
3. Branch derivation: three-priority order (`$ARGUMENTS` → `FEATURE_NAME` → commit message)
4. Step 2a: `$ARGUMENTS` check first, then `ls -t` scan, then null fallback
5. Step 2a: Windows alternative documented
6. Step 2b: four-path lookup order (canonical report.md, canonical report.done.md, legacy report.md, legacy report.done.md)
7. Step 2b: parse instructions for `Files modified` — split on comma, strip backticks
8. Step 2b: parse instructions for `Files added` — same, plus skip if `None`
9. Step 2b: stops parsing at next `##` header
10. Step 2c: `git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline -- {FEATURE_FILES}` present
11. Step 2c: empty-result fallback documented with user-facing message
12. Step 2c: no-report fallback documented with user-facing message
13. Detection display block: Feature / Report / Files / Commits / branch name / abort instruction
14. Step 5: `{REPORT_PATH}` as primary artifact reference
15. Step 5: `.agents/features/{FEATURE_NAME}/review.done.md` present
16. Step 5: `.agents/reviews/{FEATURE_NAME}*.done.md` as legacy fallback
17. All other steps (1, 3, 4, 6, 7) completely unchanged

### Structural Check

- Line count: `pr.md` should go from 204 lines to ~265-290 lines (+60-85 lines of new logic)
- No steps removed — Step 2 expanded, Step 5 artifact block updated, everything else untouched
- All 7 step headers (`## Step 1:` through `## Step 7:`) must still be present

---

## Validation Commands

```bash
# L1: File exists and line count in expected range
wc -l .opencode/commands/pr.md
# Expected: 265-290 lines (was 204)

# L2a: FEATURE_NAME variable used consistently
grep -n "FEATURE_NAME" .opencode/commands/pr.md
# Expected: 8+ matches across Step 2a, 2b, 2c, branch derivation, Step 5

# L2b: Report path lookup — both canonical and legacy present
grep -n "report.done.md\|report\.md" .opencode/commands/pr.md
# Expected: 5+ matches (Step 2b four-path list, Step 5 REPORT_PATH reference)

# L2c: File parsing instructions present
grep -n "Files modified\|Files added" .opencode/commands/pr.md
# Expected: 2 matches (parse instructions in Step 2b)

# L2d: FEATURE_FILES defined and used
grep -n "FEATURE_FILES" .opencode/commands/pr.md
# Expected: 3+ matches (Step 2b definition, Step 2c git log call, display block)

# L2e: REPORT_PATH variable flows into Step 5
grep -n "REPORT_PATH" .opencode/commands/pr.md
# Expected: 2+ matches (set in Step 2b, used in Step 5 artifact references)

# L3: Fallback behavior — both cases documented
grep -n "fallback\|Fallback\|not found\|already be pushed" .opencode/commands/pr.md
# Expected: 3+ matches (empty result fallback, no-report fallback, user message)

# L4: Legacy path still present (not removed, just demoted to fallback)
grep -n "agents/reports" .opencode/commands/pr.md
# Expected: 2+ matches (Step 2b lookup order entry, Step 5 legacy review fallback)

# L5: Detection display block present
grep -n "Feature detected\|Commits selected\|Abort with Ctrl" .opencode/commands/pr.md
# Expected: 3 matches (one per line of the display block)

# L6: Read-ahead note present (for branch name derivation)
grep -n "read.*ahead\|read the full step" .opencode/commands/pr.md
# Expected: 1 match

# L7: No breakage — all 7 steps still present
grep -n "^## Step [1-7]:" .opencode/commands/pr.md
# Expected: exactly 7 matches
```

---

## Acceptance Criteria

### Implementation

- [x] Step 2 branch derivation uses three-priority order: `$ARGUMENTS` → `FEATURE_NAME` → commit message
- [x] Step 2a detects `FEATURE_NAME` from `$ARGUMENTS` or latest report file scan, with null fallback
- [x] Step 2b defines four-path lookup order: canonical `report.md`, canonical `report.done.md`, legacy `report.md`, legacy `report.done.md`
- [x] Step 2b parse instructions handle `Files modified` and `Files added` lines, strip backticks, skip `None`
- [x] Step 2c runs `git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline -- {FEATURE_FILES}` to produce `PR_COMMITS`
- [x] Step 2c fallback documented: no report found → show all unpushed commits + confirmation prompt
- [x] Step 2c detection result display block present before proceeding
- [x] Step 5 canonical report path listed first, legacy path as fallback
- [x] Step 5 review artifact path updated to include `.agents/features/{FEATURE_NAME}/review.done.md`
- [x] No other steps of `pr.md` modified

### Runtime

- [x] A model running `/pr` after a clean single-feature loop can identify `PR_COMMITS` without user input
- [x] A model running `/pr` with multiple stacked features on master sees the detection result and can abort if wrong
- [x] A model running `/pr` with no report file falls back gracefully to the full unpushed commit list

---

## Completion Checklist

- [x] Task 1 completed (Step 2 auto-detection rewritten)
- [x] Task 2 completed (branch name derivation updated to use FEATURE_NAME)
- [x] Task 3 completed (Step 5 report paths fixed)
- [x] All validation commands pass
- [x] Acceptance criteria all met

---

## Implementation Decision Log

### Decision 1: File-intersection approach over alternatives

**Chosen**: Parse `Files modified/added` from report → `git log -- {files}` → `PR_COMMITS`

**Rejected alternatives:**

| Alternative | Why rejected |
|-------------|-------------|
| `git log --after={report-mtime}` | `mtime` changes on file copy, `git stash`, or Windows timezone handling — too fragile for a command that must be reliable |
| Parse `feat(scope):` from commit message | The commit scope (e.g. `build`) never equals the feature slug (e.g. `build-batch-dispatch-wiring`) — unreliable by design |
| Store commit SHA in report at commit time | Would require modifying `/commit` — scope creep; this feature should be self-contained in `/pr` |
| Interactive selection every time | Defeats the purpose — the user asked for zero-input auto-detection |

The file-intersection approach works because: (a) file paths in the report are exact and stable, (b) `git log -- {files}` is a standard, well-defined git operation, (c) the intersection with unpushed commits gives precisely the right scope.

### Decision 2: Task 2 folded into Task 1

**Original plan**: Task 2 was a separate edit to the branch name derivation (lines 41-45). On closer examination, the branch name derivation is inside Step 2, and Task 1 replaces the entire Step 2 block. Writing Task 2 as a separate edit would require a second pass on the same region, risking conflict. Folding it into the Task 1 replacement block is cleaner.

The Task 2 section is kept in the plan as a verification checkpoint, not as a separate code change.

### Decision 3: `REPORT_PATH` as the Step 5 reference

**Original**: Step 5 listed two separate paths (canonical + legacy) for the report.

**Changed**: Step 5 now references `{REPORT_PATH}` directly — the variable already resolved in Step 2b. This is simpler and avoids redundancy. The model executing `/pr` already knows which file was found; there's no reason to re-derive it.

### Decision 4: Detection result display is always shown

Even in fallback mode (no report found), the display block is shown with "not found" / "none detected" values. This ensures the user always sees what the command is about to do — consistent UX regardless of whether auto-detection succeeded.

---

## Notes

- **Key decision**: File-intersection approach chosen over mtime and scope-parse alternatives — most reliable with zero new infrastructure
- **Key decision**: Display the detection result (Feature / Report / Files / Commits) before proceeding — gives the user an abort point without requiring interactive confirmation for every PR
- **Key decision**: Fallback is non-blocking — if no report found, degrade gracefully to current behavior rather than erroring out
- **Key decision**: `FEATURE_NAME` flows from Step 2a through Step 2b, 2c, and Step 5 — defined once, referenced consistently throughout
- **Key decision**: Task 2 (branch name derivation) folded into Task 1's replacement block — avoids a second edit on the same region
- **Key decision**: Step 5 uses `{REPORT_PATH}` directly instead of re-listing canonical/legacy paths — simpler, avoids redundancy
- **Risk**: The `ls -t` scan is Unix-only. Mitigation: Windows alternative documented inline in the Step 2a block. This is a markdown instruction file — the executing model adapts to OS.
- **Risk**: If multiple features modified the same file (e.g., both touched `build.md`), the git log intersection returns commits from both features. Mitigation: the detection result display block shows exactly what was selected before any cherry-pick runs — the user can abort with Ctrl+C.
- **Risk**: Legacy report path (`.agents/reports/`) will eventually be fully deprecated as all features move to `.agents/features/` canonical paths. The four-path lookup order gracefully handles both during the transition period.
- **Confidence**: 9/10 — single file, three localized edits (Task 2 folded into Task 1), approach is well-defined, all edge cases catalogued and handled
