# Feature: Pipeline Handoff and Pending Work Detection

## Feature Description

Add persistent cross-session handoff tracking and pending work detection to the autonomous pipeline. Every pipeline command writes a handoff file to `.agents/context/next-command.md` on completion, and `/prime` scans both the handoff file and `.agents/features/*/` artifacts to surface pending work — plans awaiting execution, reports awaiting commit, reviews with open findings, and master plan phase progress. Additionally, `/code-review` gains an explicit `--feature` argument to stop guessing feature names, and `/code-loop` gains an `--auto-commit` flag to skip the manual `/final-review` → `/commit` dance when the loop exits clean.

## User Story

As a developer switching between AI model sessions, I want the new session to immediately know what pipeline step I'm on and what command to run next, so that I don't lose context or waste time re-discovering my position in the workflow.

## Problem Statement

The current pipeline has no persistent state between sessions. Every "Next:" instruction is printed to the conversation and lost when the session ends. When switching models (e.g., `/planning` on one model, `/execute` on another), the new session starts completely blind — it doesn't know which feature has a pending plan, which report is awaiting commit, or which phase of a master plan was last completed. The user must manually remember and type the exact plan path. Additionally, `/code-review` guesses the feature name from context (often wrong after a model switch), and the `/code-loop` → `/final-review` → `/commit` exit requires 3 manual steps for what should be automatic after a clean loop.

## Solution Statement

- Decision 1: Singleton handoff file at `.agents/context/next-command.md` — because every command overwrites it with the current pipeline position. Simple, no log management, no parsing history. The file answers one question: "what should I run next?"
- Decision 2: `/prime` scans `.agents/features/*/` for non-`.done.md` artifacts as a fallback — because the handoff file may be stale (user skipped a command) or missing. The artifact scan provides ground truth from file system state.
- Decision 3: Phase-aware handoff for master plans — because multi-phase features need to track which phase completed and which is next, referencing the master plan for the full picture.
- Decision 4: Every pipeline command writes the handoff — because users may switch models at any point, not just between `/planning` and `/execute`.

## Feature Metadata

- **Feature Type**: Enhancement
- **Estimated Complexity**: Medium
- **Primary Systems Affected**: `/prime`, `/planning`, `/execute`, `/code-review`, `/code-loop`, `/commit`, `/pr` command files
- **Dependencies**: None — all changes are to `.opencode/commands/*.md` instruction files and `AGENTS.md`

### Slice Guardrails (Required)

- **Single Outcome**: Persistent pipeline position tracking across sessions
- **Expected Files Touched**: 8 files (7 commands + AGENTS.md)
- **Scope Boundary**: Does NOT change `/build`, `/ship`, `/mvp`, `/prd`, `/pillars`, `/decompose`, `/sync`, `/final-review`, `/code-review-fix`. These can be wired up later.
- **Split Trigger**: If any command modification exceeds 80 lines of new content, split into a Phase 2

---

## CONTEXT REFERENCES

### Relevant Codebase Files

> IMPORTANT: The execution agent MUST read these files before implementing!

- `.opencode/commands/prime.md` (lines 175-242) — Why: Step 4 "Assemble Report" is where pending work section is inserted. Two report modes (System/Codebase) both need it.
- `.opencode/commands/planning.md` (lines 287-316) — Why: "After Writing" section where handoff write is added. Has both Single Plan and Master Plan output formats.
- `.opencode/commands/execute.md` (lines 121-132) — Why: Series Mode Execution (Step 2.5) is where phase-level handoff updates go. Also lines 257-274 for completion sweep where final handoff writes.
- `.opencode/commands/code-review.md` (lines 19-27, 179-181) — Why: Usage section for adding `--feature` arg, and output file section for feature name derivation.
- `.opencode/commands/code-loop.md` (lines 26-33, 160-167, 199-211) — Why: Usage section for `--auto-commit` flag, Loop Exit Conditions, and Handoff section.
- `.opencode/commands/commit.md` (lines 63-80) — Why: Steps 4-6 where commit completion is reported and handoff should be written.
- `.opencode/commands/pr.md` (lines 236-250) — Why: Step 7 Report Completion where handoff should be written (terminal command — handoff says "pipeline complete").
- `AGENTS.md` (line 46) — Why: Documents `.agents/context/` as "Session context" — needs to document the handoff file.

### New Files to Create

- None — all modifications to existing files. The `.agents/context/` directory already exists (empty).

### Related Memories (from memory.md)

- No memory.md exists in this repository.

### Relevant Documentation

- `AGENTS.md` (lines 33-59) — Project Structure section documenting `.agents/` layout and `.done.md` lifecycle table.
- `.opencode/reference/file-structure.md` (line 54) — Documents `context/` directory as "Session context".

### Patterns to Follow

**Pipeline "After Writing" block** (from `.opencode/commands/planning.md:289-316`):
```markdown
## After Writing

**Single Plan Mode:**
```
Plan written: .agents/features/{feature}/plan.md
Tasks: {N} tasks across {phases} phases
Confidence: {X}/10 for one-pass success
Key risk: {top risk}
Archon: {synced N tasks / not connected}

Next: /execute .agents/features/{feature}/plan.md
```
```
- Why this pattern: Every command already ends with a "Next:" line. The handoff write mirrors this pattern — same information, persisted to disk.
- Common gotchas: Master Plan mode has different output format with phase tracking. Both paths need the handoff write.

**`.done.md` lifecycle** (from `AGENTS.md:48-59`):
```markdown
| Artifact | Created by | Marked `.done.md` by | Trigger |
|----------|-----------|---------------------|---------|
| `plan.md` | `/planning` | `/execute` | All plan tasks completed |
| `report.md` | `/execute` | `/commit` | Changes committed to git |
| `review.md` | `/code-review` | `/commit` or `/code-loop` | All findings addressed |
```
- Why this pattern: The pending work scan relies on this convention. If `plan.md` exists without `plan.done.md`, it's pending. The scan MUST match the documented lifecycle.
- Common gotchas: `build-batch-dispatch-wiring` has BOTH `plan.md` AND `plan.done.md` coexisting (original wasn't deleted). The scan must check for `.done.md` presence, not absence of `.md`.

**Feature name derivation** (from `.opencode/commands/execute.md:56-58`):
```markdown
- **Derive feature name** from the plan path: extract the feature directory name from `.agents/features/{feature}/`.
    Example: `.agents/features/user-auth/plan.md` → `user-auth`.
```
- Why this pattern: All commands use the same convention — feature name = directory name under `.agents/features/`. The handoff file should store this so other commands don't need to re-derive it.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation — Handoff File Format & Write Logic

Define the handoff file format and add write instructions to the two most critical transition points: `/planning` (produces plan) and `/execute` (consumes plan, produces report).

**Tasks:**
- Define handoff file format (documented in the plan, implemented by commands)
- Add handoff write to `/planning` "After Writing" section
- Add handoff write to `/execute` completion sweep + series mode

### Phase 2: Core — Wire Remaining Commands

Add handoff write instructions to `/code-review`, `/code-loop`, `/commit`, and `/pr`.

**Tasks:**
- Add handoff write to `/code-review` after saving review
- Add handoff write to `/code-loop` at loop exit
- Add handoff write to `/commit` after successful commit
- Add handoff write to `/pr` after PR creation

### Phase 3: Integration — Prime Reads Handoff + Pending Work Scan

Update `/prime` to read the handoff file and scan artifacts, surfacing pending work in Step 4.

**Tasks:**
- Add Step 3.5 to `/prime`: Read handoff file + scan artifacts
- Add "Pending Work" section to both System Mode and Codebase Mode reports

### Phase 4: Enhancements — Code-Review Feature Arg + Code-Loop Auto-Commit

Add the P1 improvements that smooth out remaining friction points.

**Tasks:**
- Add `--feature` argument to `/code-review`
- Add `--auto-commit` flag to `/code-loop`

---

## STEP-BY-STEP TASKS

> Execute every task in order, top to bottom. Each task is atomic and independently testable.

---

### Task 1: UPDATE `.opencode/commands/planning.md` — Add handoff write to "After Writing"

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/planning.md`
- **IMPLEMENT**: Insert a handoff write step between the Archon Task Sync section and the "After Writing" section. Add a new `### Handoff Write` subsection after line 285 (end of Archon Task Sync).

  The new section should be inserted after line 286 (`3. Store Archon task IDs in plan metadata for /execute to update`) and before line 287 (`---`):

  **Current** (lines 280-287):
  ```markdown
  ### Archon Task Sync (if connected)

  After writing the plan, sync to Archon:
  1. Call `list_projects()` to find or create project for this codebase
  2. Call `manage_task("create", ...)` for each task in the plan
  3. Store Archon task IDs in plan metadata for `/execute` to update

  ---
  ```

  **Replace with**:
  ```markdown
  ### Archon Task Sync (if connected)

  After writing the plan, sync to Archon:
  1. Call `list_projects()` to find or create project for this codebase
  2. Call `manage_task("create", ...)` for each task in the plan
  3. Store Archon task IDs in plan metadata for `/execute` to update

  ### Pipeline Handoff Write (required)

  After writing the plan (and Archon sync if applicable), overwrite `.agents/context/next-command.md`:

  **Single Plan Mode:**
  ```markdown
  # Pipeline Handoff
  <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

  - **Last Command**: /planning
  - **Feature**: {feature}
  - **Next Command**: /execute .agents/features/{feature}/plan.md
  - **Timestamp**: {ISO 8601 timestamp}
  - **Status**: awaiting-execution
  ```

  **Master + Sub-Plan Mode:**
  ```markdown
  # Pipeline Handoff
  <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

  - **Last Command**: /planning
  - **Feature**: {feature}
  - **Next Command**: /execute .agents/features/{feature}/plan-master.md
  - **Master Plan**: .agents/features/{feature}/plan-master.md
  - **Phase Progress**: 0/{M} complete
  - **Timestamp**: {ISO 8601 timestamp}
  - **Status**: awaiting-execution
  ```

  ---
  ```

- **PATTERN**: Follows the existing "After Writing" output block at `planning.md:289-316` — same information persisted to a file.
- **GOTCHA**: The handoff write must happen AFTER Archon sync (if applicable) but BEFORE the "After Writing" console output. If Archon fails, handoff still writes. Two code blocks — one for single plan, one for master plan — must both be present.
- **VALIDATE**: Read `.opencode/commands/planning.md` and verify the "Pipeline Handoff Write" section exists between Archon Task Sync and the `---` before "After Writing". Verify both Single Plan and Master Plan handoff formats are present.

---

### Task 2: UPDATE `.opencode/commands/execute.md` — Add handoff write to series mode and completion

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/execute.md`
- **IMPLEMENT**: Two insertion points:

  **Insertion A — Series Mode phase-level handoff (after Step 2.5 line 130):**

  After line 130 (`6. Report: "Phase {N}/{total} complete."`), insert a new step 7:

  **Current** (lines 121-132):
  ```markdown
  ### 2.5. Series Mode Execution (if plan series detected)

  For each sub-plan in PLAN INDEX order (or SUB-PLAN INDEX for master plans):

  1. Read sub-plan file
  2. Read shared context from master plan's SHARED CONTEXT REFERENCES section
  3. Execute tasks using Step 2 process (a → e)
  4. Run sub-plan's validation commands
  5. Read HANDOFF NOTES and include them as context for the next sub-plan
  6. Report: "Phase {N}/{total} complete."

  **If a sub-plan fails**: Stop, report which sub-plan/task failed. Don't continue — failed state propagates.
  ```

  **Replace with**:
  ```markdown
  ### 2.5. Series Mode Execution (if plan series detected)

  For each sub-plan in PLAN INDEX order (or SUB-PLAN INDEX for master plans):

  1. Read sub-plan file
  2. Read shared context from master plan's SHARED CONTEXT REFERENCES section
  3. Execute tasks using Step 2 process (a → e)
  4. Run sub-plan's validation commands
  5. Read HANDOFF NOTES and include them as context for the next sub-plan
  6. Report: "Phase {N}/{total} complete."
  7. **Update handoff** — overwrite `.agents/context/next-command.md`:
     ```markdown
     # Pipeline Handoff
     <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

     - **Last Command**: /execute (phase {N} of {total})
     - **Feature**: {feature}
     - **Next Command**: /execute .agents/features/{feature}/plan-phase-{N+1}.md
     - **Master Plan**: .agents/features/{feature}/plan-master.md
     - **Phase Progress**: {N}/{total} complete
     - **Timestamp**: {ISO 8601 timestamp}
     - **Status**: executing-series
     ```
     If this was the LAST phase, set **Next Command** to `/code-loop {feature}` (or `/code-review` if `/code-loop` is not in the pipeline) and **Status** to `awaiting-review`.

  **If a sub-plan fails**: Stop, report which sub-plan/task failed. Don't continue — failed state propagates. Update handoff with **Status**: `blocked` and **Next Command**: `[manual intervention — phase {N} failed]`.
  ```

  **Insertion B — Single plan completion handoff (after Step 6.6, before "## Output Report" at line 267):**

  After the completion sweep block (line 265: `- Never leave a completed artifact without the .done.md suffix.`), insert:

  **Current** (lines 265-267):
  ```markdown
  - Never leave a completed artifact without the `.done.md` suffix.

  ## Output Report
  ```

  **Replace with**:
  ```markdown
  - Never leave a completed artifact without the `.done.md` suffix.

  ### 6.7. Pipeline Handoff Write (required)

  After completion sweep, overwrite `.agents/context/next-command.md`:

  ```markdown
  # Pipeline Handoff
  <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

  - **Last Command**: /execute
  - **Feature**: {feature}
  - **Next Command**: /code-loop {feature}
  - **Timestamp**: {ISO 8601 timestamp}
  - **Status**: awaiting-review
  ```

  If execution was part of a master plan and this was the LAST phase, use the same format above (awaiting-review). If more phases remain, the series mode handoff (Step 2.5, item 7) already handled it.

  ## Output Report
  ```

- **PATTERN**: Mirrors the series mode reporting at `execute.md:130` — phase tracking already exists, we're persisting it. Also follows `/planning`'s handoff write pattern from Task 1.
- **GOTCHA**: Series mode writes the handoff after EACH phase (step 7), not just at the end. The completion handoff (6.7) is for single plans and for the final phase of a master plan. Don't double-write — series mode step 7 handles mid-series, 6.7 handles end-of-execution.
- **VALIDATE**: Read `.opencode/commands/execute.md` and verify: (1) Step 2.5 has a new item 7 with phase-level handoff, (2) Step 6.7 exists with single-plan handoff, (3) both reference `.agents/context/next-command.md`.

---

### Task 3: UPDATE `.opencode/commands/code-review.md` — Add `--feature` arg and handoff write

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/code-review.md`
- **IMPLEMENT**: Two changes:

  **Change A — Update Usage section (lines 19-27):**

  **Current** (lines 19-27):
  ```markdown
  ## Usage

  ```
  /code-review [target]
  ```

  `$ARGUMENTS` — What to review:
  - Empty (default): review all uncommitted changes (`git diff` + `git diff --cached`)
  - File path: review a specific file
  - `last-commit`: review changes in the most recent commit
  ```

  **Replace with**:
  ```markdown
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
  ```

  **Change B — Update output file section (lines 179-181):**

  **Current** (lines 179-181):
  ```markdown
  **Output file**: Save review to `.agents/features/{feature}/review.md`
  Create the `.agents/features/{feature}/` directory if it doesn't exist.
  Derive `{feature}` from the most relevant context: if reviewing changes from a plan execution, use the plan's feature name. If reviewing standalone changes, derive from the primary file's module/directory name.
  ```

  **Replace with**:
  ```markdown
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
  ```

- **PATTERN**: Feature name derivation priority order mirrors `/pr`'s report detection at `pr.md:55-61` — check explicit arg first, then handoff file, then heuristic scan, then guess.
- **GOTCHA**: The `--feature` flag is in `$ARGUMENTS` alongside the target. Parsing: if an arg starts with `--feature`, the next token is the feature name. Everything else is the target. If both a file path and `--feature` are provided, both apply.
- **VALIDATE**: Read `.opencode/commands/code-review.md` and verify: (1) Usage section shows `--feature` with priority order, (2) output file section references handoff write, (3) handoff file path is `.agents/context/next-command.md`.

---

### Task 4: UPDATE `.opencode/commands/code-loop.md` — Add `--auto-commit` flag and handoff writes

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/code-loop.md`
- **IMPLEMENT**: Three changes:

  **Change A — Update Usage section (lines 26-33):**

  **Current** (lines 26-33):
  ```markdown
  ## Usage

  ```
  /code-loop [feature-name]
  ```

  - `feature-name` (optional): Used for commit message and report file
  ```

  **Replace with**:
  ```markdown
  ## Usage

  ```
  /code-loop [feature-name] [--auto-commit]
  ```

  - `feature-name` (optional): Used for commit message and report file. If omitted, read `.agents/context/next-command.md` for the active feature name.
  - `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), skip `/final-review` and run `/commit` directly. Useful for autonomous pipelines where human approval is not needed.
  ```

  **Change B — Update Loop Exit Conditions (lines 160-167):**

  **Current** (lines 160-167):
  ```markdown
  ### Loop Exit Conditions

  | Condition | Action |
  |-----------|--------|
  | 0 issues + validation passes | → Hand off to `/final-review` |
  | Only Minor issues | → Fix if quick and safe; otherwise ask user whether to defer |
  | Unfixable error detected | → Stop, report what's blocking |
  ```

  **Replace with**:
  ```markdown
  ### Loop Exit Conditions

  | Condition | Action |
  |-----------|--------|
  | 0 issues + validation passes (no `--auto-commit`) | → Hand off to `/final-review` |
  | 0 issues + validation passes (`--auto-commit`) | → Run `/commit` directly, skip `/final-review` |
  | Only Minor issues | → Fix if quick and safe; otherwise ask user whether to defer |
  | Unfixable error detected | → Stop, report what's blocking |
  ```

  **Change C — Update Handoff section (lines 199-211):**

  **Current** (lines 199-211):
  ```markdown
  ## Handoff (When Loop Exits Clean)

  1. **Report completion:**
     ```
     Code loop complete

     Iterations: N
     Issues fixed: X (Critical: Y, Major: Z, Minor: W)
     Status: Ready for /final-review
     ```

  2. **Next step:** Tell the user to run `/final-review` for a summary + approval gate, then `/commit`.
     - Do NOT auto-commit. The user must approve via `/final-review` first.
  ```

  **Replace with**:
  ```markdown
  ## Handoff (When Loop Exits Clean)

  1. **Report completion:**
     ```
     Code loop complete

     Iterations: N
     Issues fixed: X (Critical: Y, Major: Z, Minor: W)
     Status: {if --auto-commit: "Auto-committing" | else: "Ready for /final-review"}
     ```

  2. **If `--auto-commit`:** Run `/commit` directly. Skip `/final-review`. After commit succeeds, update handoff to point at `/pr`.

  3. **If no `--auto-commit`:** Tell the user to run `/final-review` for a summary + approval gate, then `/commit`.
     - Do NOT auto-commit. The user must approve via `/final-review` first.

  4. **Pipeline Handoff Write** (required): Overwrite `.agents/context/next-command.md`:
     ```markdown
     # Pipeline Handoff
     <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

     - **Last Command**: /code-loop
     - **Feature**: {feature}
     - **Next Command**: {if --auto-commit and commit succeeded: "/pr {feature}" | if --auto-commit and commit failed: "/commit" | else: "/final-review"}
     - **Timestamp**: {ISO 8601 timestamp}
     - **Status**: {if committed: "ready-for-pr" | else: "ready-for-review"}
     ```
  ```

- **PATTERN**: Flag parsing follows the same pattern as `/code-review --feature` from Task 3. The `--auto-commit` flag is a boolean — if present, it's true.
- **GOTCHA**: When `--auto-commit` triggers `/commit`, the `/commit` command itself will also write a handoff (Task 5). That's fine — it overwrites the code-loop's handoff with the post-commit state. But if `/commit` fails (pre-commit hook), the code-loop's handoff should NOT point at `/pr` — it should still point at `/commit`. The "commit succeeded/failed" conditional in the handoff handles this.
- **VALIDATE**: Read `.opencode/commands/code-loop.md` and verify: (1) Usage shows `--auto-commit`, (2) Exit conditions table has two rows for the clean-exit case, (3) Handoff section has conditional auto-commit behavior, (4) handoff write block exists with correct conditional next commands.

---

### Task 5: UPDATE `.opencode/commands/commit.md` — Add handoff write after commit

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/commit.md`
- **IMPLEMENT**: Insert a handoff write step after Step 5 (Update Memory) and update Step 6 (Report Completion).

  **Current** (lines 72-80):
  ```markdown
  ### 5. Update Memory (if memory.md exists)

  Append to memory.md: session note, any lessons/gotchas/decisions discovered. Keep entries 1-2 lines each. Don't repeat existing entries. Skip if memory.md doesn't exist.

  ### 6. Report Completion

  Report the commit details and suggest next steps based on context:
  - If in a `/build` loop: "Spec committed. Continuing to next spec."
  - If standalone: "Committed. Next: `git push` or continue development."
  ```

  **Replace with**:
  ```markdown
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

  If in a `/build` loop, set **Next Command** to `/build next` and **Status** to `build-loop-continuing`.

  ### 6. Report Completion

  Report the commit details and suggest next steps based on context:
  - If in a `/build` loop: "Spec committed. Continuing to next spec."
  - If standalone: "Committed. Next: `/pr {feature}` or `git push` or continue development."
  ```

- **PATTERN**: Same handoff format as all other commands. Feature name derivation from commit scope mirrors `/pr`'s Step 2a at `pr.md:44-49`.
- **GOTCHA**: `/commit` may be called in a `/build` loop context. In that case, the "Next Command" should be `/build next`, not `/pr`. Check context from the previous handoff file — if Status was `build-loop-continuing` or came from a `/build` context, keep the build loop going. Also: the artifact completion sweep (Step 3, lines 43-49) renames `report.md` → `report.done.md`. Do the handoff write AFTER this sweep so the Feature field is still derivable.
- **VALIDATE**: Read `.opencode/commands/commit.md` and verify: (1) Step 5.5 exists with handoff write, (2) feature derivation priority is documented, (3) build-loop special case is handled, (4) Step 6 updated to suggest `/pr {feature}`.

---

### Task 6: UPDATE `.opencode/commands/pr.md` — Add handoff write after PR creation

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/pr.md`
- **IMPLEMENT**: Add a handoff write to Step 7 (Report Completion).

  **Current** (lines 236-250):
  ```markdown
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
  ```

  **Replace with**:
  ```markdown
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
  ```

- **PATTERN**: Same handoff format. Terminal status (`pr-open`) signals no action needed.
- **GOTCHA**: The handoff write goes AFTER the report completion block, not inside it. The report block is displayed to the user; the handoff write is a file operation that happens silently. Also: the `{feature}` comes from FEATURE_NAME resolved in Step 2a — it's already available at this point.
- **VALIDATE**: Read `.opencode/commands/pr.md` and verify: (1) "Pipeline Handoff Write" subsection exists after the report completion block, (2) Status is `pr-open`, (3) Next Command indicates pipeline complete.

---

### Task 7: UPDATE `.opencode/commands/prime.md` — Add pending work scan and handoff read

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/prime.md`
- **IMPLEMENT**: Insert a new Step 3.5 between Step 3 (Write/Update Config) and Step 4 (Assemble Report), and add a "Pending Work" section to both report formats.

  **Insertion A — New Step 3.5 (after line 171, before line 173 `---`):**

  After line 171 (`If .opencode/config.md already exists, read it and use its values...`), insert before the `---` separator:

  **Current** (lines 171-175):
  ```markdown
  If `.opencode/config.md` already exists, read it and use its values (user overrides take priority over auto-detection).

  ---

  ## Step 4: Assemble Report
  ```

  **Replace with**:
  ```markdown
  If `.opencode/config.md` already exists, read it and use its values (user overrides take priority over auto-detection).

  ---

  ## Step 3.5: Detect Pending Work

  Scan for in-progress pipeline state. Two sources, merged:

  ### Source 1: Handoff file

  Read `.agents/context/next-command.md` if it exists. Extract:
  - **Last Command**: the command that last ran
  - **Feature**: the active feature name
  - **Next Command**: what should run next
  - **Status**: pipeline state
  - **Master Plan** and **Phase Progress** (if present): multi-phase tracking

  If the file does not exist or is empty, skip to Source 2.

  ### Source 2: Artifact scan (fallback + cross-check)

  Scan `.agents/features/*/` for non-`.done.md` artifacts. For each feature directory:

  1. If `plan.md` exists AND `plan.done.md` does NOT exist → **plan awaiting execution**
  2. If `plan-master.md` exists AND `plan-master.done.md` does NOT exist → check which `plan-phase-{N}.done.md` files exist to determine current phase → **master plan in progress (phase X/Y)**
  3. If `report.md` exists AND `report.done.md` does NOT exist → **report awaiting commit**
  4. If `review.md` exists AND `review.done.md` does NOT exist → **review with open findings**
  5. If `review-{N}.md` exists (any N) without matching `.done.md` → **code-loop review in progress**

  ### Merge logic

  - If the handoff file exists AND artifact scan confirms the same state → use handoff (more specific, has exact next command)
  - If the handoff file exists BUT artifact scan contradicts it (e.g., handoff says "awaiting-execution" but `plan.done.md` exists) → the handoff is stale. Use artifact scan state and note "Handoff stale — overridden by artifact state"
  - If no handoff file exists → use artifact scan only
  - If neither source finds pending work → no pending work section shown

  ---

  ## Step 4: Assemble Report
  ```

  **Insertion B — Add "Pending Work" to System Mode report (after line 192, before the closing ```):**

  **Current** (lines 191-193):
  ```
  - **Memory Health**: {if last session date is >7 days ago, warn "Stale — last updated {date}". Otherwise "Fresh"}
  Otherwise: "No memory.md found"}
  ```
  ```

  **Replace with**:
  ```
  - **Memory Health**: {if last session date is >7 days ago, warn "Stale — last updated {date}". Otherwise "Fresh"}
  Otherwise: "No memory.md found"}

  ## Pending Work
  {If pending work found in Step 3.5:
  - **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
  - **[plan]** {feature} — plan awaiting execution: /execute .agents/features/{feature}/plan.md
  - **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-phase-{N+1}.md
  - **[report]** {feature} — execution done, awaiting commit: /commit
  - **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
  (Show only lines that apply. Handoff line first if present.)
  Otherwise: "No pending work found."}
  ```
  ```

  **Insertion C — Add "Pending Work" to Codebase Mode report (after Build State, before Archon Status):**

  Insert after line 234 (`Otherwise: "No build state found. Run /mvp to start a new project."`), before line 236 (`## Archon Status`):

  **Current** (lines 234-236):
  ```
  Otherwise: "No build state found. Run /mvp to start a new project."}

  ## Archon Status
  ```

  **Replace with**:
  ```
  Otherwise: "No build state found. Run /mvp to start a new project."}

  ## Pending Work
  {If pending work found in Step 3.5:
  - **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
  - **[plan]** {feature} — plan awaiting execution: /execute .agents/features/{feature}/plan.md
  - **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-phase-{N+1}.md
  - **[report]** {feature} — execution done, awaiting commit: /commit
  - **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
  (Show only lines that apply. Handoff line first if present.)
  Otherwise: "No pending work found."}

  ## Archon Status
  ```

- **PATTERN**: Same report section style as the existing Build State and Archon Status sections — conditional content based on file existence. Uses `{If ... Otherwise:}` pattern from `prime.md:186-192`.
- **GOTCHA**: (1) For master plan phase detection, check `plan-phase-{N}.done.md` files to count completed phases. The highest N with `.done.md` = last completed phase. (2) The artifact scan may find multiple features with pending work — show ALL of them, one line each. (3) If `plan.md` AND `plan.done.md` both exist (like `build-batch-dispatch-wiring`), the plan IS done — don't flag it. Check for `.done.md` presence, not `.md` absence.
- **VALIDATE**: Read `.opencode/commands/prime.md` and verify: (1) Step 3.5 exists between Step 3 and Step 4, (2) Two sources documented (handoff file + artifact scan), (3) Merge logic handles stale handoff, (4) "Pending Work" section appears in BOTH System Mode and Codebase Mode reports, (5) Section shows before Archon Status in Codebase Mode.

---

### Task 8: UPDATE `AGENTS.md` — Document handoff file in project structure

- **ACTION**: UPDATE
- **TARGET**: `AGENTS.md`
- **IMPLEMENT**: Update the `.agents/context/` documentation.

  **Current** (line 46):
  ```markdown
  - `.agents/context/` — Session context
  ```

  **Replace with**:
  ```markdown
  - `.agents/context/` — Session context
    - `next-command.md` — Pipeline handoff file (auto-updated by every pipeline command, read by `/prime`)
  ```

  Also add a row to the `.done.md` Lifecycle table (after line 59):

  **Current** (lines 48-59):
  ```markdown
  #### `.done.md` Lifecycle

  | Artifact | Created by | Marked `.done.md` by | Trigger |
  |----------|-----------|---------------------|---------|
  | `plan.md` | `/planning` | `/execute` | All plan tasks completed |
  | `plan-master.md` | `/planning` | `/execute` | All phases completed |
  | `plan-phase-{N}.md` | `/planning` | `/execute` | Phase fully executed |
  | `report.md` | `/execute` | `/commit` | Changes committed to git |
  | `review.md` | `/code-review` | `/commit` or `/code-loop` | All findings addressed |
  | `review-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
  | `loop-report-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
  | `fixes-{N}.md` | `/code-loop` | `/code-loop` | Fixes fully applied |
  ```

  **Replace with**:
  ```markdown
  #### `.done.md` Lifecycle

  | Artifact | Created by | Marked `.done.md` by | Trigger |
  |----------|-----------|---------------------|---------|
  | `plan.md` | `/planning` | `/execute` | All plan tasks completed |
  | `plan-master.md` | `/planning` | `/execute` | All phases completed |
  | `plan-phase-{N}.md` | `/planning` | `/execute` | Phase fully executed |
  | `report.md` | `/execute` | `/commit` | Changes committed to git |
  | `review.md` | `/code-review` | `/commit` or `/code-loop` | All findings addressed |
  | `review-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
  | `loop-report-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
  | `fixes-{N}.md` | `/code-loop` | `/code-loop` | Fixes fully applied |

  #### Pipeline Handoff File

  `.agents/context/next-command.md` is a **singleton** file overwritten by every pipeline command on completion. It tracks the current pipeline position so that `/prime` can surface "what to do next" when starting a new session.

  | Field | Purpose |
  |-------|---------|
  | **Last Command** | Which command just completed |
  | **Feature** | Active feature name |
  | **Next Command** | Exact command to run next |
  | **Master Plan** | Path to master plan (if multi-phase) |
  | **Phase Progress** | N/M complete (if multi-phase) |
  | **Timestamp** | When handoff was written |
  | **Status** | Pipeline state (awaiting-execution, executing-series, awaiting-review, ready-to-commit, ready-for-pr, pr-open, blocked) |

  The handoff file is NOT a log — it only contains the latest state. History lives in git commits and `.done.md` artifacts.
  ```

- **PATTERN**: Follows the existing documentation style in `AGENTS.md:33-59` — nested bullet lists for directory contents, tables for structured data.
- **GOTCHA**: The `@.opencode/sections/*.md` includes in AGENTS.md are auto-loaded. Our changes are to the static content that's directly in AGENTS.md, not in sections files. Make sure the table insertion doesn't break the markdown rendering of the existing `.done.md` table.
- **VALIDATE**: Read `AGENTS.md` and verify: (1) `.agents/context/` has `next-command.md` documented, (2) Pipeline Handoff File section exists with field table, (3) `.done.md` lifecycle table is unchanged, (4) new section is visually separate from the lifecycle table.

---

### Task 9: UPDATE `.opencode/commands/code-review-fix.md` — Add handoff write

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/code-review-fix.md`
- **IMPLEMENT**: Add a handoff write after Step 5 (Report Summary).

  **Current** (lines 143-148):
  ```markdown
  Next: Run /code-review to verify fixes, or /commit if confident
  ```

  ---

  ## Output Report
  ```

  **Replace with**:
  ```markdown
  Next: Run /code-review to verify fixes, or /commit if confident

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
  ```

- **PATTERN**: Same handoff format as all other commands. Feature name derived from the review file path (`.agents/features/{feature}/review.md` → `{feature}`).
- **GOTCHA**: The review file path in `$ARGUMENTS` may be in the legacy location (`.agents/reviews/`). If so, derive feature from the filename pattern instead. The `--feature` on the next `/code-review` command ensures the re-review goes to the right feature folder.
- **VALIDATE**: Read `.opencode/commands/code-review-fix.md` and verify the "Pipeline Handoff Write" section exists after Step 5 summary, before "## Output Report".

---

## TESTING STRATEGY

### Unit Tests

Not applicable — all changes are to markdown instruction files. No executable code.

### Integration Tests

Not applicable — these are LLM instruction files, not code.

### Edge Cases

- **Stale handoff**: Handoff says "awaiting-execution" but the plan is already `.done.md`. `/prime` must detect this via artifact scan and note "Handoff stale".
- **Missing handoff**: `.agents/context/next-command.md` doesn't exist (first run, or deleted). `/prime` falls back to artifact scan only. Commands create the file on first write.
- **Multiple pending features**: Artifact scan finds 3 features with pending work. All should be listed, one line each.
- **Master plan mid-phase**: Phase 2 of 4 completed. Handoff shows phase 2/4, next command is phase 3. Session dies. New `/prime` finds `plan-phase-1.done.md`, `plan-phase-2.done.md`, `plan-phase-3.md` (not done), `plan-master.md` (not done). Both handoff and scan agree.
- **`plan.md` AND `plan.done.md` coexist**: (Known in `build-batch-dispatch-wiring`.) The plan IS done. Don't flag as pending. Check `.done.md` presence.
- **`/code-loop --auto-commit` with commit failure**: Handoff must point at `/commit` (retry), not `/pr`.
- **`/code-review` with no `--feature` and no handoff file**: Falls back to heuristic (scan reports, then derive from changed files). Same as current behavior — no regression.
- **`/pr` terminal handoff**: Status `pr-open` should cause `/prime` to show it as informational, not actionable.

---

## VALIDATION COMMANDS

> Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# Verify all modified markdown files are valid (no broken formatting)
# Read each file and check for unclosed code blocks, broken tables, missing headers
```

Not applicable for markdown — no linter configured. Manual visual inspection.

### Level 2: Type Safety

Not applicable — markdown instruction files only.

### Level 3: Unit Tests

Not applicable — no executable code.

### Level 4: Integration Tests

Not applicable — no executable code.

### Level 5: Manual Validation

1. **Read each modified command file end-to-end** — verify the handoff write section integrates naturally with surrounding content, no broken flow.
2. **Verify handoff format consistency** — every command uses the same base fields (Last Command, Feature, Next Command, Timestamp, Status). Master plan commands add Master Plan and Phase Progress.
3. **Verify `/prime` Step 3.5 logic** — mentally trace through these scenarios:
   - Fresh repo with no `.agents/context/next-command.md` → should show "No pending work"
   - After `/planning` → handoff exists, artifact scan finds `plan.md` → should show handoff line
   - After `/execute` phase 2 of 3 → handoff shows phase progress, scan finds phase-1.done.md + phase-2.done.md → should show master plan progress
   - Stale handoff (says awaiting-execution but plan.done.md exists) → should show "Handoff stale"
4. **Verify `--auto-commit` in `/code-loop`** — trace through: clean exit → auto-commit → commit succeeds → handoff points to `/pr`. Clean exit → auto-commit → commit fails → handoff points to `/commit`.
5. **Cross-reference AGENTS.md** — new Pipeline Handoff File section correctly documents all fields, doesn't break existing `.done.md` table.

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [x] Every pipeline command (planning, execute, code-review, code-review-fix, code-loop, commit, pr) has a "Pipeline Handoff Write" section
- [x] All handoff writes target `.agents/context/next-command.md`
- [x] Handoff format includes all base fields: Last Command, Feature, Next Command, Timestamp, Status
- [x] Master plan handoff includes Master Plan path and Phase Progress fields
- [x] `/execute` series mode (Step 2.5) writes handoff after EACH phase completion
- [x] `/prime` has Step 3.5 with handoff read + artifact scan + merge logic
- [x] `/prime` shows "Pending Work" section in BOTH System Mode and Codebase Mode reports
- [x] `/code-review` accepts `--feature feature-name` argument with documented priority order
- [x] `/code-loop` accepts `--auto-commit` flag with updated exit conditions
- [x] `AGENTS.md` documents `next-command.md` and the Pipeline Handoff File fields
- [x] All Status values are consistent: awaiting-execution, executing-series, awaiting-review, awaiting-fixes, awaiting-re-review, ready-to-commit, ready-for-pr, pr-open, blocked, build-loop-continuing
- [x] Stale handoff detection documented in `/prime` merge logic

### Runtime (verify after testing/deployment)

- [ ] Running `/prime` on current repo shows pending work for `pr-auto-detect-feature-commits` (plan + report pending) — deferred to runtime
- [ ] Running `/planning` on a test feature creates `.agents/context/next-command.md` — deferred to runtime
- [ ] Running `/execute` after `/planning` updates the handoff to point at `/code-loop` — deferred to runtime
- [ ] Running `/code-loop --auto-commit` with clean exit auto-commits without `/final-review` — deferred to runtime
- [ ] Switching models and running `/prime` surfaces the correct next command — deferred to runtime

---

## COMPLETION CHECKLIST

- [x] All 9 tasks completed in order
- [x] Each task validation passed
- [x] All validation commands executed successfully
- [x] Manual testing confirms feature works (Level 5 scenarios)
- [x] Acceptance criteria all met
- [x] Handoff format is consistent across all 7+ command files
- [x] No existing command behavior broken (only additive changes)

---

## NOTES

### Key Design Decisions

- **Singleton over log**: The handoff file is overwritten, not appended. This keeps it simple — one file, one state. History is in git. If we later need a log, we can add `.agents/context/pipeline-log.md` separately.
- **Two-source merge in `/prime`**: The handoff file is the primary source (most specific), but the artifact scan is the ground truth (can't lie — files either exist or don't). When they disagree, artifact scan wins. This prevents stale handoffs from sending users down the wrong path.
- **Every command writes**: Even though model switches typically happen at `/planning` → `/execute` and `/execute` → `/code-loop`, the user might switch at any point. Writing from every command costs nothing (one file overwrite) and covers all cases.
- **`--auto-commit` is opt-in**: Defaults to current behavior (human gate via `/final-review`). The flag is for autonomous pipelines where the review loop is trusted.

### Risks

- **Risk 1**: Commands forget to write the handoff → Mitigated by the artifact scan fallback in `/prime`. Even without the handoff file, pending work is detected.
- **Risk 2**: Handoff format drift across commands → Mitigated by documenting the format in `AGENTS.md` and using exact templates in each command.

### Confidence Score: 9/10

- **Strengths**: All changes are additive (no breaking changes), handoff format is simple and consistent, two-source merge provides resilience, all insertion points identified with exact line numbers.
- **Uncertainties**: Markdown code block nesting (handoff template inside a command's markdown) may need careful escaping during execution.
- **Mitigations**: Each task includes exact Current/Replace blocks — the execution agent has copy-paste content, not prose to interpret.
