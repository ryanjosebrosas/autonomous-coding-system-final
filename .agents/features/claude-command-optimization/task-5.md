# Task 5: Sonnet Delivery Commands — system-review.md, pr.md

## OBJECTIVE

Create Claude-optimized Sonnet-tier delivery commands `.claude/commands/system-review.md` and `.claude/commands/pr.md` with Phase 0 Haiku research delegation.

## SCOPE

- **Files created**: `.claude/commands/system-review.md`, `.claude/commands/pr.md`
- **Source material (DO NOT MODIFY)**: `.opencode/commands/system-review.md` (415 lines), `.opencode/commands/pr.md` (299 lines)
- **Out of scope**: All other commands, `.opencode/` directory
- **Dependencies**: Task 1 (directory exists)

## PRIOR TASK CONTEXT

- Task 1: Replaced `.claude/commands` symlink with real directory
- Task 2: Created Haiku commands (prime.md, commit.md)
- Task 3: Created Sonnet review commands (code-review.md, code-review-fix.md)
- Task 4: Created Sonnet loop/gate commands (code-loop.md, final-review.md)

The Phase 0 delegation pattern is now established from Tasks 3-4.

## CONTEXT REFERENCES

### Source: `.opencode/commands/system-review.md` (415 lines)

```markdown
---
description: Analyze implementation against plan with auto-diff, code-review integration, and memory suggestions
model: deepseek-v3.1:671b-cloud
---

# System Review (Enhanced)

## Pipeline Position

/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit → /pr → /system-review (this)

Post-PR meta-analysis. Reads plan artifacts and git diff. Outputs process improvement suggestions.

## Purpose

**System review is NOT code review.** You're looking for bugs in the **process**, not the code.

**Your job:**
- Analyze plan adherence and divergence patterns
- Classify divergences as justified vs. problematic
- Generate process improvements for project assets
- Auto-suggest lessons for memory.md

## Execution Workflow

### Step 0: Pre-Check (Code Review Integration)
Check if /code-review was run. Look for code review artifacts in .agents/reviews/.
If NOT run: Run /code-review on the current changes.
If run: Read code review findings for quality score.

### Step 1: Auto-Diff (Plan vs. Reality)
Compare the plan against what was actually implemented.
Extract metrics: File Adherence %, Pattern Compliance %, Scope Creep, Missed Files.
Calculate Plan Adherence Score.

### Step 2: Plan Quality Assessment
Read plan file and assess each section with scoring table (Feature Description, User Story, Solution Statement, Relevant Files, Patterns, Tasks, Testing, Validation, Acceptance — each scored /10 or /15).
Plan Quality Score = Total / 100 * 10.

### Step 3: Read Execution Report
Read .agents/reports/{feature}-report.md.
Extract completed tasks, divergences, issues, validation results.
Classify divergences as Good (justified) vs Bad (problematic).

### Step 4: Code Quality Score
From code review findings: count Critical/Major/Minor across Type Safety, Security, Architecture, Performance.
Code Quality = 10 - (Critical*2 + Major*1 + Minor*0.5). Min 0, Max 10.

### Step 5: Validation Pyramid Check
Verify 5-level validation: Syntax, Type Safety, Unit Tests, Integration Tests, Manual.
Validation Score = (Pass count / 5) * 10.

### Step 6: Memory Suggestions
Extract lessons: Divergences → planning gaps, Challenges → gotchas, Workarounds → patterns, "Wish we knew" → decisions.
Categorize: gotcha, pattern, decision, anti-pattern.

### Step 7: Generate Report
Save to .agents/reports/system-reviews/{feature}-review.md.
Overall Alignment Score = Plan Adherence × 0.40 + Plan Quality × 0.20 + Divergence Justification × 0.30 + Code Quality × 0.10.
Classification: 9-10 Excellent, 7-8 Good, 5-6 Fair, <5 Poor.

## Output Format (7 sub-sections)
- Overall Alignment Score with breakdown table
- Pattern Compliance Checklist (6 items)
- Auto-Diff Analysis (planned vs actual files)
- Plan Quality Assessment table
- Divergence Analysis (per-divergence YAML blocks)
- Code Quality Summary table
- Validation Pyramid table
- Memory Suggestions (copy-approved entries)
- System Improvement Actions (specific text to add/update in each asset)
- Key Learnings (what worked, what needs improvement, concrete improvements)

## Important Rules
- Be specific — don't say "plan was unclear", say "plan didn't specify X"
- Focus on patterns — look for repeated problems, not one-offs
- Action-oriented — every finding should have a concrete asset update suggestion
- Be selective — only action on recommendations that genuinely improve future loops
```

### Source: `.opencode/commands/pr.md` (299 lines)

```markdown
---
description: Create feature branch, push, and open PR
model: deepseek-v3.1:671b-cloud
---

# PR: Create Branch and Pull Request

## Pipeline Position

/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit → /pr (this)

Creates pull request for committed work. Reads commit history from git. Outputs PR URL.

## Arguments
$ARGUMENTS — Optional: feature name for the branch, or PR title override.
If no arguments, derive branch name from latest commit message.

## Prerequisites
- Commit must already exist (run /commit first)
- If working tree is dirty, report and exit

## Step 1: Gather Context
git status, git log -5, git remote -v, git branch --show-current.
If dirty: report and exit — do NOT commit automatically.

## Step 2: Determine Branch Name and Scope
Branch naming: feat/<short-name>, fix/<short-name>, chore/<short-name>.
Step 2a — Identify feature: from $ARGUMENTS, or from most recent report file, or FEATURE_NAME = null.
Step 2b — Locate report and parse files touched: try .agents/features/{FEATURE_NAME}/report.md, report.done.md, legacy paths.
Step 2c — Intersect with unpushed commits: git log {REMOTE}/{MAIN_BRANCH}..HEAD -- {FEATURE_FILES}.
Display detection result before proceeding.

## Step 3: Detect Remote and Main Branch
Auto-detect remote (prefer origin), main branch, BASE_SHA.
Fetch to ensure remote refs current.
Use .claude/config.md values if specified.

## Step 4: Create Isolated Feature Branch and Push
CRITICAL: Branch from REMOTE/MAIN_BRANCH, not local HEAD.
git checkout -b <branch-name> {REMOTE}/{MAIN_BRANCH}
git cherry-pick <commit-sha-1> <commit-sha-2> ... (PR_COMMITS, oldest→newest)
git push {REMOTE} <branch-name> -u
git checkout <original-branch>
Handle cherry-pick conflicts (stop, report to user).
Handle existing branch name on remote.

## Step 5: Generate PR Title and Body
git log/diff for the feature branch.
Read report and review artifacts for richer context.
Title: conventional commit format, max 72 chars.
Body: What, Why, Changes, Testing, Notes sections.

## Step 6: Create Pull Request
gh pr create with --base, --head, --title, --body.
Handle gh CLI not available.

## Step 7: Report Completion
Branch, PR URL, Title, Base, Commits, Current branch.

### Pipeline Handoff Write
Last Command: /pr, Feature: {feature}, Next Command: pipeline complete, Status: pr-open.
Handle failure: status blocked, report error.

## Notes
- One PR per feature/slice
- Branch from REMOTE/MAIN_BRANCH, not local HEAD (isolation guarantee)
- Always auto-detect remote and main branch
- Return to original branch after PR
- Never push local master/main to remote
```

### Reference: `.claude/config.md`

```markdown
## Validation Commands
- L1 Lint: npx eslint .opencode/
- L1 Format: npx prettier --check .opencode/
- L2 Types: npx tsc --noEmit
- L3 Unit Tests: npx vitest run
- L4 Integration Tests: npx vitest run .opencode/tests/integration/

## Git
- Remote: origin
- Main Branch: master
- PR Target: master
```

## PATTERNS TO FOLLOW

### Pattern: Phase 0 Research Delegation (from Tasks 3-4)

```markdown
## Phase 0: Gather Context (Haiku Subagent)

Before reasoning, launch a Haiku Explore subagent to gather all required context.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /{command-name}:
> 1. {specific retrieval task}
> 2. {specific retrieval task}
> ...
> Return a structured Context Bundle with:
> - {section 1}
> - {section 2}

Wait for the subagent to return the Context Bundle. Then proceed to Phase 1.
```

### Pattern: Sonnet Frontmatter

```yaml
---
description: {same as original}
model: claude-sonnet-4-6
---
```

### Pattern: Preserve Scoring Formulas

All mathematical formulas (weighted scores, quality calculations) must be preserved EXACTLY from the original. These are the core reasoning logic.

### Pattern: Preserve Safety Gates

Cherry-pick isolation in pr.md and Pre-Check in system-review.md are safety-critical. Preserve verbatim.

## STEP-BY-STEP TASKS

### Step 1: Create `.claude/commands/system-review.md`

- **ACTION**: CREATE
- **TARGET**: `.claude/commands/system-review.md`
- **IMPLEMENT**: Write the following complete optimized content:

```markdown
---
description: Analyze implementation against plan with auto-diff, code-review integration, and memory suggestions
model: claude-sonnet-4-6
---

# System Review (Enhanced)

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit → /pr → /system-review (this)
```

Post-PR meta-analysis. Reads plan artifacts and git diff. Outputs process improvement suggestions.

## Purpose

**System review is NOT code review.** You're looking for bugs in the **process**, not the code.

**Your job:**
- Analyze plan adherence and divergence patterns
- Classify divergences as justified vs. problematic
- Generate process improvements for project assets
- Auto-suggest lessons for `memory.md`

**Philosophy:**
- Good divergence → plan limitations → improve planning
- Bad divergence → unclear requirements → improve communication
- Repeated issues → missing automation → create commands

---

## Phase 0: Gather Context (Haiku Subagent)

Before analysis, launch a Haiku Explore subagent to gather all required context.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /system-review:
> 1. Read `.agents/context/next-command.md` for the active feature name
> 2. Find and read the plan file: `.agents/features/{feature}/plan.md` or `plan.done.md`
> 3. Find and read the execution report: `.agents/features/{feature}/report.md` or `report.done.md`
> 4. Find and read code review artifacts: `.agents/features/{feature}/review*.md` and `.agents/features/{feature}/review*.done.md`
> 5. Find and read loop report artifacts: `.agents/features/{feature}/loop-report*.md`
> 6. Run `git diff --stat` to get change summary
> 7. Run `git log -10 --oneline` for recent commits
> 8. Read `.claude/config.md` for validation commands
>
> Return a structured Context Bundle with:
> - **Feature name** from handoff
> - **Plan content** (full text of plan file)
> - **Report content** (full text of execution report)
> - **Review findings** (all review artifact content)
> - **Git diff stats** (files changed, lines +/-)
> - **Validation commands** from config.md

Wait for the subagent to return the Context Bundle. Then proceed to Step 0.

---

## Step 0: Pre-Check (Code Review Integration)

**Check if `/code-review` was run** (from Context Bundle — review artifacts present?):

**If NOT run:**
```
Code review not detected. Running code review now...
```
Run `/code-review` on the current changes. Use findings in Step 4.

**If run:** Read code review findings from Context Bundle for quality score.

---

## Step 1: Auto-Diff (Plan vs. Reality)

Compare the plan (from Context Bundle) against what was actually implemented (from git diff):

**Extract metrics:**
- File Adherence % (planned files that were modified)
- Pattern Compliance % (referenced patterns appear in diff)
- Scope Creep (+N files not in plan)
- Missed Files (N files in plan but not modified)

**Calculate Plan Adherence Score:**
```
Plan Adherence = (File Adherence + Pattern Compliance) / 2
```

---

## Step 2: Plan Quality Assessment

Assess each section of the plan (from Context Bundle):

| Section | Status | Points |
|---------|--------|--------|
| Feature Description | Complete/Partial/Missing | /10 |
| User Story | Complete/Partial/Missing | /10 |
| Solution Statement | Complete/Partial/Missing | /10 |
| Relevant Files | Complete/Partial/Missing | /15 |
| Patterns to Follow | Complete/Partial/Missing | /15 |
| Step-by-Step Tasks | Complete/Partial/Missing | /15 |
| Testing Strategy | Complete/Partial/Missing | /10 |
| Validation Commands | Complete/Partial/Missing | /10 |
| Acceptance Criteria | Complete/Partial/Missing | /5 |
| **Total** | | **/100** |

**Plan Quality Score** = Total Points / 100 * 10

---

## Step 3: Execution Report Analysis

From the execution report in Context Bundle, extract:
- Completed tasks (count / total)
- Divergences from plan (list each with reason)
- Issues & Notes (challenges encountered)
- Validation results (pass/fail status)

**Classify each divergence:**

**Good Divergence (Justified):**
- Plan assumed something that didn't exist
- Better pattern discovered during implementation
- Performance/security issue required different approach

**Bad Divergence (Problematic):**
- Ignored explicit constraints
- Created new architecture vs. following patterns
- Shortcuts introducing tech debt
- Misunderstood requirements

---

## Step 4: Code Quality Score

From code review findings in Context Bundle:
- Type Safety Issues: count Critical/Major/Minor
- Security Issues: count Critical/Major/Minor
- Architecture Issues: count Critical/Major/Minor
- Performance Issues: count Critical/Major/Minor

**Calculate Code Quality Score:**
```
Code Quality = 10 - (Critical*2 + Major*1 + Minor*0.5)
Min: 0, Max: 10
```

---

## Step 5: Validation Pyramid Check

**Verify 5-level validation was followed:**

| Level | Check | Pass/Fail |
|-------|-------|-----------|
| 1: Syntax & Style | Lint commands run? | |
| 2: Type Safety | Type checker run? | |
| 3: Unit Tests | Unit tests created + pass? | |
| 4: Integration Tests | Integration tests created + pass? | |
| 5: Manual Validation | Manual steps documented + tested? | |

**Validation Score** = (Pass count / 5) * 10

---

## Step 6: Memory Suggestions

**Extract lessons from the execution:**

1. Divergences → lessons about planning gaps
2. Challenges → gotchas for future features
3. Workarounds → patterns to replicate
4. "Wish we knew" → decisions to document

**Categorize each lesson:** gotcha, pattern, decision, anti-pattern

**Output format:**
```markdown
### {Date}: {Title}
**Category:** {category}
**What:** {one-liner}
**Why:** {why this matters}
**Applied to:** {which commands/templates/agents to update}
```

---

## Step 7: Generate Report

**Save to**: `.agents/reports/system-reviews/{feature}-review.md`

**Overall Alignment Score:**

```
Alignment Score = (
  Plan Adherence x 0.40 +
  Plan Quality x 0.20 +
  Divergence Justification x 0.30 +
  Code Quality x 0.10
)
```

| Component | Weight | Score |
|-----------|--------|-------|
| Plan Adherence | 40% | /10 |
| Plan Quality | 20% | /10 |
| Divergence Justification | 30% | /10 |
| Code Quality | 10% | /10 |
| **Total** | **100%** | **/10** |

**Classification:**
- 9-10: Excellent — process working well
- 7-8: Good — minor improvements needed
- 5-6: Fair — significant gaps identified
- <5: Poor — process breakdown, needs attention

---

## Output Format

### Overall Alignment Score: __/10

Scoring breakdown table (as above).

### Pattern Compliance Checklist
- [ ] Followed codebase architecture
- [ ] Used documented patterns
- [ ] Applied testing patterns correctly
- [ ] Met validation requirements (5-level pyramid)
- [ ] Followed naming conventions
- [ ] Used established error handling patterns

### Auto-Diff Analysis
```
Planned Files: N | Actual Files: N | Overlap: N
File Adherence: X% | Pattern Compliance: X%
Scope Creep: +N files | Missed Files: N files
```

### Plan Quality Assessment
| Section | Status | Notes |
|---------|--------|-------|
(9 sections as in Step 2)

### Divergence Analysis
Per-divergence YAML blocks with What, Planned, Actual, Reason, Classification, Root Cause, System Fix.

### Code Quality Summary
| Review Type | Critical | Major | Minor |
|-------------|----------|-------|-------|
(4 categories)

### Validation Pyramid
| Level | Check | Pass/Fail |
(5 levels)

### Memory Suggestions
Copy-approved entries for memory.md.

### System Improvement Actions
Specific text to add/update in commands, agents, memory.

### Key Learnings
What worked well (2-3), what needs improvement (2-3), concrete improvements (1-3).

---

## Important Rules

- **Be specific:** Don't say "plan was unclear" — say "plan didn't specify X"
- **Focus on patterns:** Look for repeated problems, not one-offs
- **Action-oriented:** Every finding should have a concrete asset update suggestion
- **Be selective:** Only action on recommendations that genuinely improve future loops
```

- **GOTCHA**: The Output Format section is lengthy but essential — it's the reasoning template Sonnet fills in. Do not trim it.
- **VALIDATE**: File exists, frontmatter has `model: claude-sonnet-4-6`, Phase 0 block present, all scoring formulas preserved.

### Step 2: Create `.claude/commands/pr.md`

- **ACTION**: CREATE
- **TARGET**: `.claude/commands/pr.md`
- **IMPLEMENT**: Write the following complete optimized content:

```markdown
---
description: Create feature branch, push, and open PR
model: claude-sonnet-4-6
---

# PR: Create Branch and Pull Request

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit → /pr (this)
```

Creates pull request for committed work. Reads commit history from git. Outputs PR URL.

## Arguments

`$ARGUMENTS` — Optional: feature name for the branch (e.g., `supabase-provider`), or PR title override.

(If no arguments, derive branch name from the latest commit message.)

## Prerequisites

- Commit must already exist (run `/commit` first)
- If working tree is dirty, report and exit

---

## Phase 0: Gather Context (Haiku Subagent)

Before creating the PR, launch a Haiku Explore subagent to gather all required context.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /pr:
> 1. Run `git status` — check for uncommitted changes
> 2. Run `git log -10 --oneline` — recent commits
> 3. Run `git remote -v` — remote URLs
> 4. Run `git branch --show-current` — current branch name
> 5. Read `.agents/context/next-command.md` for feature name
> 6. Read `.claude/config.md` for remote/main branch config
> 7. Find and read execution report: try `.agents/features/{feature}/report.md`, then `report.done.md`
> 8. If report found, parse the "Files modified" and "Files added" lines from Meta Information
> 9. Find and read review artifacts: `.agents/features/{feature}/review*.done.md`
> 10. Run `git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null` for main branch detection
> 11. Run `git fetch origin` to ensure remote refs are current
> 12. Run `git log origin/{main-branch}..HEAD --oneline` for all unpushed commits
>
> Return a structured Context Bundle with:
> - **Git state**: clean/dirty, current branch, remote name, main branch
> - **Feature name** from handoff (or null)
> - **Report content** (full text, or "not found")
> - **Feature files** parsed from report (list of paths, or empty)
> - **Review summary** (findings addressed, or "no reviews found")
> - **Unpushed commits** (full list with SHAs and messages)
> - **Remote refs** (remote name, main branch name, BASE_SHA)

Wait for the subagent to return the Context Bundle. Then proceed to Step 1.

---

## Step 1: Validate Prerequisites

**If working tree is dirty** (from Context Bundle git state):
- Report: "Uncommitted changes detected. Run `/commit` first."
- Exit — do NOT commit automatically.

**If no unpushed commits** (from Context Bundle):
- Report: "No unpushed commits found. Nothing to PR."
- Exit.

---

## Step 2: Determine Branch Name and Scope

Each PR gets its own branch. Branch naming: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.

**Derive the branch name:**
1. If `$ARGUMENTS` contains a feature name → use it directly
2. If feature name from Context Bundle → use it: `feat/{FEATURE_NAME}`
3. Otherwise → derive from the latest commit message

**Scope commits using Context Bundle data:**

If feature files were parsed from report:
```bash
git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline -- {FEATURE_FILES}
```
Store as `PR_COMMITS` (oldest first).

If `PR_COMMITS` is empty or no report found: fall back to full unpushed list from Context Bundle. Ask user to confirm which commits to include.

**Display detection result before proceeding:**
```
Feature detected:  {FEATURE_NAME}
Report:            {REPORT_PATH}
Files touched:     {FEATURE_FILES}
Commits selected:  {PR_COMMITS}

Proceeding with {N} commit(s) → {branch-name}
Abort with Ctrl+C if this scope is wrong.
```

---

## Step 3: Create Isolated Feature Branch and Push

**CRITICAL:** The feature branch must contain ONLY the PR's commits — not the full local history.

```bash
# 1. Branch from remote main (not local HEAD) — clean base
git checkout -b <branch-name> {REMOTE}/{MAIN_BRANCH}

# 2. Cherry-pick only the selected feature commits (oldest first)
git cherry-pick <commit-sha-1> <commit-sha-2> ...

# 3. Push only this branch
git push {REMOTE} <branch-name> -u

# 4. Return to original branch
git checkout <original-branch>
```

**If cherry-pick conflicts:**
- Report which commit conflicted and which files
- Do NOT auto-resolve — stop and surface to user

**If branch name already exists on remote:**
- Report and ask: create with suffix, or use existing?

---

## Step 4: Generate PR Title and Body

Use Context Bundle data (report, review summary, diff stats).

```bash
git log --oneline {REMOTE}/{MAIN_BRANCH}...<branch-name>
git diff {REMOTE}/{MAIN_BRANCH}...<branch-name> --stat
git diff {REMOTE}/{MAIN_BRANCH}...<branch-name>
```

**Title format:** `type(scope): description` (conventional commit, max 72 chars)

**Body format:**
```markdown
## What
- {2-4 bullets: what changed}

## Why
{1-2 sentences: why this was needed}

## Changes
{Files changed grouped by area}

## Testing
{Test results, validation commands run}

## Notes
{Breaking changes, migration steps, or "None"}
```

---

## Step 5: Create Pull Request

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

If `gh` CLI not available: report and provide branch name + suggested title/body for manual creation.

---

## Step 6: Report Completion

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

**If PR creation fails**: Write handoff with status `blocked`, report the error clearly.

---

## Notes

- **One PR per feature/slice** — each `/pr` creates a fresh branch
- **Branch from `{REMOTE}/{MAIN_BRANCH}`, not from local HEAD** — isolation guarantee
- Always auto-detect remote and main branch — no hardcoded repos
- After PR creation, return to the original branch
- If `gh` CLI is not authenticated, report and suggest `gh auth login`
- Do NOT force-push unless explicitly asked
- If current branch IS already a clean feature branch, skip cherry-pick and push directly
- **Never push local master/main to remote**
```

- **GOTCHA**: The cherry-pick isolation logic in Step 3 is SAFETY-CRITICAL. Preserve verbatim — it prevents pushing entire local history.
- **VALIDATE**: File exists, frontmatter has `model: claude-sonnet-4-6`, Phase 0 block present, cherry-pick isolation preserved.

## TESTING STRATEGY

### Structural Verification
- Both files exist in `.claude/commands/`
- YAML frontmatter parses with correct model
- Phase 0 Explore subagent block present in both
- All scoring formulas in system-review.md match original exactly
- Cherry-pick isolation in pr.md preserved exactly

### Edge Cases
- system-review.md: No code review artifacts → Pre-Check triggers /code-review
- system-review.md: No execution report → report error gracefully
- pr.md: Working tree dirty → exit before any git operations
- pr.md: No unpushed commits → exit with clear message
- pr.md: Cherry-pick conflict → stop, report to user
- pr.md: gh CLI not available → provide manual instructions

## VALIDATION COMMANDS

```bash
# L1: Files exist
test -f .claude/commands/system-review.md && echo "OK" || echo "MISSING: system-review.md"
test -f .claude/commands/pr.md && echo "OK" || echo "MISSING: pr.md"

# L2: Correct model in frontmatter
grep "model: claude-sonnet-4-6" .claude/commands/system-review.md && echo "OK" || echo "WRONG MODEL"
grep "model: claude-sonnet-4-6" .claude/commands/pr.md && echo "OK" || echo "WRONG MODEL"

# L3: Phase 0 present
grep -c "Phase 0" .claude/commands/system-review.md
grep -c "Phase 0" .claude/commands/pr.md

# L4: Key logic preserved
grep "Plan Adherence" .claude/commands/system-review.md && echo "OK: scoring preserved"
grep "cherry-pick" .claude/commands/pr.md && echo "OK: isolation preserved"

# L5: Manual — invoke /system-review and /pr in Claude Code
```

## ACCEPTANCE CRITERIA

### Implementation
- [ ] `.claude/commands/system-review.md` created with `model: claude-sonnet-4-6`
- [ ] `.claude/commands/pr.md` created with `model: claude-sonnet-4-6`
- [ ] Phase 0 Haiku delegation in both files
- [ ] system-review.md: All scoring formulas preserved (Plan Adherence, Plan Quality, Code Quality, Validation, Overall Alignment)
- [ ] system-review.md: All output format sections preserved
- [ ] system-review.md: Memory suggestions section preserved
- [ ] pr.md: Cherry-pick isolation preserved in Step 3
- [ ] pr.md: Branch naming convention preserved
- [ ] pr.md: gh pr create command format preserved
- [ ] Both: Pipeline Handoff Write sections preserved
- [ ] Both: Pipeline Position sections preserved

### Runtime
- [ ] system-review.md launches Explore subagent to gather plan/report/review data
- [ ] pr.md launches Explore subagent to gather git state and report data
- [ ] Sonnet receives Context Bundle and reasons without doing I/O

## HANDOFF NOTES

Task 6 creates the final batch — Opus commands (planning.md, council.md, mvp.md, prd.md, pillars.md, decompose.md). All Sonnet commands are now complete.

## COMPLETION CHECKLIST

- [ ] system-review.md created with correct content
- [ ] pr.md created with correct content
- [ ] Both have Phase 0 delegation
- [ ] Both have correct model in frontmatter
- [ ] Scoring formulas verified
- [ ] Cherry-pick isolation verified
- [ ] All validation commands pass
