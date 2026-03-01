# Task 1 of 5: Delegate Step 8 to `/commit` — Activate Build-Loop Path

> **Feature**: `build-pipeline-hardening`
> **Brief Path**: `.agents/features/build-pipeline-hardening/task-1.md`
> **Plan Overview**: `.agents/features/build-pipeline-hardening/plan.md`

---

## OBJECTIVE

Replace `/build` Step 8's custom git add/commit/push with a delegation to `/commit`, activating the existing build-loop awareness, artifact sweep, handoff writes, and memory updates — fixing 5 gaps in one change.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/build.md` | UPDATE | Step 8 rewritten to delegate to `/commit` with build-loop context, then push with error handling |

**Out of Scope:**
- `/commit` itself — already has the build-loop path (line 93), artifact sweep (lines 43-49), and handoff write (lines 76-106). No changes needed.
- Step 9 reordering — handled by Task 2.
- Handoff writes at other stop points — handled by Task 4.

**Dependencies:**
- None — this is the first task.

---

## PRIOR TASK CONTEXT

This is the first task — no prior work. Start fresh from the codebase state.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/build.md` (lines 533-563) — Why: This is Step 8, the section being replaced
- `.opencode/commands/commit.md` (lines 43-53) — Why: Artifact completion sweep that `/build` currently skips
- `.opencode/commands/commit.md` (lines 76-106) — Why: Pipeline handoff write + build-loop path that's currently dead code

### Current Content: Step 8 in build.md (Lines 533-563)

```markdown
### Step 8: Commit + Push

On successful validation + clean review:

**8a. Generate commit message:**

**If dispatch available:**
```
dispatch({
  taskType: "commit-message",
  prompt: "Generate a conventional commit message for the following changes.\n\nSpec: {spec-name}\nType hint: {feat|fix|chore|refactor based on spec type}\n\n{git diff HEAD --stat}\n\nFormat:\n{type}({spec-name}): short description (imperative, max 50 chars)\n\n- bullet 1: what was implemented\n- bullet 2: what was implemented\n- bullet 3: why (if non-obvious)\n\nMax 3 bullets. No Co-Authored-By lines.",
})
```

**If dispatch unavailable:**
Generate commit message directly:
```
Format: feat({spec-name}): short description (imperative, max 50 chars)
Body (3 bullets max): what was implemented and why.
```

**8b. Commit and push:**
```bash
git add -- {relevant files from spec touches}
git commit -m "{generated message}"
git push
```

**Never include `Co-Authored-By` lines.** Commits are authored solely by the user.

Push immediately after every spec — keeps remote in sync, enables rollback from any point.
```

**Analysis**: This section duplicates `/commit`'s message generation, does its own `git add/commit`, scopes staging to `{touches}` only (missing created files, test files, build-state.json), skips the artifact completion sweep (so `report.md` / `review.md` never get `.done.md`), skips the handoff write, skips memory updates, and has no `git push` error handling. All of these are already handled by `/commit`.

### Current Content: /commit Artifact Sweep (Lines 43-53)

```markdown
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
```

**Analysis**: This is exactly what `/build` Step 8 is missing. The sweep renames `report.md` → `report.done.md` and `review.md` → `review.done.md`. When `/build` delegates to `/commit`, this runs automatically.

### Current Content: /commit Handoff + Build-Loop (Lines 76-106)

```markdown
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

If in a `/build` loop, set **Next Command** to `/build next` and **Status** to `build-loop-continuing`.

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
```

**Analysis**: Line 93 (`If in a /build loop, set Next Command to /build next and Status to build-loop-continuing`) is currently dead code because `/build` never calls `/commit`. Task 1 activates this path. The fail-commit handoff also provides error recovery that `/build` Step 8 currently lacks.

### Patterns to Follow

**Pattern: `/build` Step 5 dispatch block** (from `build.md:273-286`):
```markdown
**If dispatch available:**
```
dispatch({
  mode: "agent",
  prompt: "Run /prime first. Then run /execute .agents/features/{spec-name}/plan.md",
  taskType: "execution",
  timeout: 900,
})
```

**If dispatch unavailable:**
Run `/execute .agents/features/{spec-name}/plan.md` inline. `/execute` auto-detects the next undone brief by scanning for `task-{N}.done.md` files.
```
- Why this pattern: Step 8 should follow the same dispatch-available vs inline structure.
- How to apply: `/commit` can be dispatched or run inline, with the same dual-path pattern.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/commands/build.md` — Replace Step 8

**What**: Replace the entire Step 8 section (lines 533-563) with a delegation to `/commit` plus `git push` with error handling.

**IMPLEMENT**:

Current (lines 533-563 of `.opencode/commands/build.md`):
```markdown
### Step 8: Commit + Push

On successful validation + clean review:

**8a. Generate commit message:**

**If dispatch available:**
```
dispatch({
  taskType: "commit-message",
  prompt: "Generate a conventional commit message for the following changes.\n\nSpec: {spec-name}\nType hint: {feat|fix|chore|refactor based on spec type}\n\n{git diff HEAD --stat}\n\nFormat:\n{type}({spec-name}): short description (imperative, max 50 chars)\n\n- bullet 1: what was implemented\n- bullet 2: what was implemented\n- bullet 3: why (if non-obvious)\n\nMax 3 bullets. No Co-Authored-By lines.",
})
```

**If dispatch unavailable:**
Generate commit message directly:
```
Format: feat({spec-name}): short description (imperative, max 50 chars)
Body (3 bullets max): what was implemented and why.
```

**8b. Commit and push:**
```bash
git add -- {relevant files from spec touches}
git commit -m "{generated message}"
git push
```

**Never include `Co-Authored-By` lines.** Commits are authored solely by the user.

Push immediately after every spec — keeps remote in sync, enables rollback from any point.
```

Replace with:
```markdown
### Step 8: Commit + Push

On successful validation + clean review, delegate to `/commit` — do NOT duplicate its logic.

**8a. Run `/commit`:**

`/commit` handles: commit message generation (via dispatch or inline), artifact completion sweep (`report.md` → `report.done.md`, `review.md` → `review.done.md`), staging, commit, handoff write, and memory update.

Tell `/commit` this is a `/build` loop context so it writes `build-loop-continuing` status instead of `ready-for-pr`. The feature name is `{spec-name}`.

**If dispatch available:**
```
dispatch({
  mode: "agent",
  prompt: "Run /commit for spec {spec-name}. This is a /build loop — set handoff status to build-loop-continuing with Next Command /build next. Stage all files in the spec's touches list plus .agents/features/{spec-name}/ and .agents/specs/.",
  taskType: "commit-message",
  timeout: 300,
})
```

**If dispatch unavailable:**
Run `/commit` inline. Before running, inform it: "This is a `/build` loop — use `build-loop-continuing` status in the handoff."

**If `/commit` fails** (pre-commit hooks, empty diff, merge conflict):
- `/commit` writes a `blocked` handoff automatically (see commit.md line 95-106).
- STOP the pipeline. Report: "Commit failed for spec {spec-name}. See handoff for details."
- Do NOT proceed to Step 9 or update any state.

**8b. Push to remote:**

After `/commit` succeeds:
```bash
git push
```

**If `git push` fails:**
1. Retry once: `git push`
2. If retry fails: STOP the pipeline. Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /build (push failed after commit)
   - **Feature**: {spec-name}
   - **Next Command**: git push && /build next
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: blocked
   ```
   Report: "Spec {spec-name} committed locally but push failed. Run `git push` manually, then `/build next` to continue."
3. Do NOT proceed to Step 9 or update any state until push succeeds.

**Never include `Co-Authored-By` lines.** Commits are authored solely by the user.
```

**PATTERN**: `/commit` build-loop path at `commit.md:93` — the `/commit` command already knows how to set `build-loop-continuing` when told it's in a `/build` loop.

**IMPORTS**: N/A

**GOTCHA**: Do NOT remove the "Never include Co-Authored-By lines" note — it applies to `/commit` too (commit.md:119 already has this).

**VALIDATE**:
```bash
# Read the updated Step 8 and verify:
# 1. No custom git add/commit — delegates to /commit
# 2. git push has retry + error handling + handoff write on failure
# 3. Commit failure stops the pipeline
# 4. /commit is told about build-loop context
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this task modifies a markdown command spec. Covered by manual testing in Level 5.

### Integration Tests
N/A — validation is structural review of the markdown.

### Edge Cases

- **`/commit` fails on pre-commit hook**: Pipeline stops, handoff says `blocked`. Verified by `/commit`'s existing fail path (lines 95-106).
- **`git push` fails on network timeout**: Retry once, then stop with blocked handoff. Next session can run `git push` then `/build next`.
- **`git push` fails on remote reject** (branch protection): Same path — stop, handoff, manual fix.
- **Dispatch unavailable + `/commit` inline**: `/commit` runs inline; build-loop context must be communicated via instruction text, not a flag.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Open build.md and verify valid markdown (no unclosed code blocks)
```

### Level 2: Type Safety
N/A — no type-checked code modified.

### Level 3: Unit Tests
N/A — no unit tests for this task (see Testing Strategy).

### Level 4: Integration Tests
N/A — covered by Level 5 manual validation.

### Level 5: Manual Validation

1. Read `.opencode/commands/build.md` Step 8 end-to-end
2. Verify: No `git add`, `git commit` commands remain in Step 8 (only `git push`)
3. Verify: `/commit` is called with build-loop context
4. Verify: `git push` has retry logic and blocked handoff on failure
5. Verify: Commit failure path stops pipeline and doesn't proceed to Step 9
6. Cross-check: `commit.md` line 93 still says "If in a `/build` loop, set Next Command to `/build next`" — confirms the path is already there

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Step 8 delegates to `/commit` — no custom `git add` or `git commit` in Step 8
- [ ] `/commit` is told about `/build` loop context (for handoff status)
- [ ] `git push` has explicit error handling: retry once, then stop with handoff
- [ ] Commit failure stops pipeline — does NOT proceed to Step 9
- [ ] Push failure stops pipeline — does NOT proceed to Step 9
- [ ] "Never include Co-Authored-By" note preserved

### Runtime (verify after testing/deployment)

- [ ] `report.md` gets renamed to `report.done.md` after spec commit (via `/commit`'s artifact sweep)
- [ ] `/commit` writes `build-loop-continuing` handoff when called from `/build`
- [ ] `/prime` no longer shows phantom "report awaiting commit" after `/build` completes a spec

---

## HANDOFF NOTES

### Files Created/Modified
- `.opencode/commands/build.md` — Step 8 rewritten: custom git ops replaced with `/commit` delegation + `git push` with error handling

### Patterns Established
- **Delegation pattern**: `/build` delegates to existing commands (`/commit`) rather than duplicating their logic. This pattern should be followed for any future `/build` steps that overlap with existing commands.
- **Push error handling pattern**: retry once → stop with blocked handoff → manual intervention. This pattern applies to any future push operations.

### State to Carry Forward
- Step 8 now assumes `/commit` handles artifact sweeps and handoff writes. Task 2 adds error handling to Steps 4 and 9 which are adjacent.
- The push error handling pattern (retry → blocked handoff) should be referenced by Task 4 when adding handoff writes at other stop points.

### Known Issues or Deferred Items
- `/commit` inline path relies on instructing the model "this is a `/build` loop" — no formal flag mechanism. Acceptable because `/commit` already checks for this context (line 93) and the instruction is clear.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written
- [ ] Brief marked done: rename `task-1.md` → `task-1.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **Delegate rather than patch**: Instead of adding artifact sweeps and handoff writes to `/build` Step 8 (duplicating `/commit`), we delegate entirely. This means future improvements to `/commit` automatically benefit `/build`.
- **Push is separate from commit**: `/commit` handles the git commit; `/build` handles `git push` after. This keeps `/commit` push-agnostic (it already says "Next: Push to remote" as a suggestion, not a command).

### Implementation Notes

- The dispatch prompt for `/commit` must include the build-loop instruction explicitly — `/commit` checks for this context to decide between `ready-for-pr` and `build-loop-continuing` handoff status.
- If `/commit` is dispatched as an agent, it runs `/prime` first (standard agent pattern), which reads the handoff file. The handoff at this point should still be from the prior step (Step 7 review complete). `/commit` will update it.
