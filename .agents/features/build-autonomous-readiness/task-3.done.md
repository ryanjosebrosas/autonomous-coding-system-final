# Task 3 of 4: Add `--auto` Flag to `/code-loop` Minor Handling

> **Feature**: `build-autonomous-readiness`
> **Brief Path**: `.agents/features/build-autonomous-readiness/task-3.md`
> **Plan Overview**: `.agents/features/build-autonomous-readiness/plan.md`

---

## OBJECTIVE

Add `--auto` flag to `/code-loop` so that Minor-only findings are automatically handled (fixed if small, skipped if not) instead of prompting the user, enabling fully autonomous code-loop operation.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/code-loop.md` | UPDATE | Usage section gains `--auto` flag; Minor handling in iteration logic and exit conditions gain conditional auto behavior |

**Out of Scope:**
- `/build` command — has its own review loop (Step 7) and doesn't call `/code-loop`
- `/code-review` and `/code-review-fix` — unchanged
- Critical/Major handling — unchanged (always fix, never skip)
- `--auto-commit` flag behavior — unchanged (composable with `--auto`)
- Unfixable error handling — unchanged

**Dependencies:**
- None — this task edits a different file than Tasks 1-2 and is independent

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Tasks:**
- `.opencode/commands/build.md` (Task 1) — Step 5 brief-completion loop, Step 2 `--auto-approve` in dispatch
- `.opencode/commands/planning.md` (Task 2) — `--auto-approve` flag and Phase 4 conditional

**State Carried Forward:**
- Flag pattern established: flags documented in Usage block with dash-prefixed descriptions
- The `--auto` flag is independent of `/build` but complements it for standalone autonomous usage
- `/code-loop` already has `--auto-commit` flag — `--auto` follows the same pattern

**Known Issues or Deferred Items:**
- None from prior tasks

---

## CONTEXT REFERENCES

### File: `.opencode/commands/code-loop.md` — Usage section, lines 26-33

This is where the new flag goes, alongside the existing `--auto-commit`:

```markdown
## Usage

```
/code-loop [feature-name] [--auto-commit]
```

- `feature-name` (optional): Used for commit message and report file. If omitted, read `.agents/context/next-command.md` for the active feature name.
- `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), run `/commit` automatically within this session instead of handing off. Useful for autonomous pipelines.
```

### File: `.opencode/commands/code-loop.md` — Iteration logic (Minor handling), lines 178-210

This is where Minor-only findings trigger a user prompt:

```markdown
### Iteration 1-N

1. **Run `/code-review`**
   - Save to: `.agents/features/{feature}/review-{N}.md`

2. **Check findings:**
   - **If 0 issues:** → Exit loop, go to commit
   - **If only Minor issues:** → Ask user: "Fix minor issues or skip to commit?"
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
```

### File: `.opencode/commands/code-loop.md` — Loop exit conditions, lines 212-219

This is the other location that references Minor handling:

```markdown
### Loop Exit Conditions

| Condition | Action |
|-----------|--------|
| 0 issues + validation passes (no `--auto-commit`) | → Hand off to `/commit` (next session) |
| 0 issues + validation passes (`--auto-commit`) | → Run `/commit` directly in this session |
| Only Minor issues | → Fix if quick and safe; otherwise ask user whether to defer |
| Unfixable error detected | → Stop, report what's blocking |
```

### File: `.opencode/commands/code-loop.md` — Handoff section, lines 252-278

The handoff already handles `--auto-commit`. The `--auto` flag doesn't change the handoff logic — it only affects the Minor handling decision:

```markdown
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
```

---

## PATTERNS TO FOLLOW

### Pattern: `--auto-commit` flag in `/code-loop` (existing model)

The `--auto-commit` flag is the template for `--auto`:

```markdown
## Usage

```
/code-loop [feature-name] [--auto-commit]
```

- `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), run `/commit` automatically within this session instead of handing off. Useful for autonomous pipelines.
```

`--auto` follows this exact pattern: documented in the same Usage block, same dash-prefixed format.

### Pattern: `/planning` `--auto-approve` (from Task 2)

Task 2 established the pattern: flags are stripped from `$ARGUMENTS` before parsing the feature name. `/code-loop` already parses `$ARGUMENTS` for `feature-name` and `--auto-commit`, so it already has flag parsing. Adding `--auto` extends the same parsing.

### Pattern: Minor handling in `/build` Step 7b (reference for auto behavior)

`/build` Step 7b (lines 398-408) shows how `/build` handles Minor findings autonomously:

```markdown
| Finding Level | Action |
|--------------|--------|
| **0 issues / only Minor / only false-positives** | Exit loop → Step 7d (final review) |
| **Critical/Major fixable** | Continue to 7c |
```

`/build` treats Minor-only as equivalent to clean — exits the review loop. The `--auto` flag in `/code-loop` should follow this precedent: auto-fix if trivial, otherwise treat as clean and exit.

---

## STEP-BY-STEP TASKS

### Step 1: Add `--auto` flag to Usage section

**IMPLEMENT:**

In `.opencode/commands/code-loop.md`, find the Usage section (lines 26-33):

**Current:**
```markdown
## Usage

```
/code-loop [feature-name] [--auto-commit]
```

- `feature-name` (optional): Used for commit message and report file. If omitted, read `.agents/context/next-command.md` for the active feature name.
- `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), run `/commit` automatically within this session instead of handing off. Useful for autonomous pipelines.
```

**Replace with:**
```markdown
## Usage

```
/code-loop [feature-name] [--auto] [--auto-commit]
```

- `feature-name` (optional): Used for commit message and report file. If omitted, read `.agents/context/next-command.md` for the active feature name.
- `--auto` (optional): Handle Minor-only findings automatically without prompting the user. If Minor fixes touch fewer than 3 files, auto-fix them. If 3+ files, skip Minor fixes and proceed to commit. Useful for autonomous pipelines where Minor findings should not block progress.
- `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), run `/commit` automatically within this session instead of handing off. Useful for autonomous pipelines.

**Combining flags:** `--auto --auto-commit` gives fully autonomous behavior: Minor findings are handled without prompting, and the loop auto-commits when clean. This is the recommended combination for autonomous use (e.g., inside `/build`).
```

**PATTERN:** Follows the existing `--auto-commit` documentation style.

**GOTCHA:** `--auto` and `--auto-commit` are separate flags with separate concerns. `--auto` controls the Minor-only decision. `--auto-commit` controls the commit-on-clean decision. They compose cleanly.

**VALIDATE:** Read code-loop.md lines 26-37 and confirm both flags are documented.

### Step 2: Update Minor handling in iteration logic

**IMPLEMENT:**

In `.opencode/commands/code-loop.md`, find the iteration check-findings step (line 183-186):

**Current:**
```markdown
2. **Check findings:**
   - **If 0 issues:** → Exit loop, go to commit
   - **If only Minor issues:** → Ask user: "Fix minor issues or skip to commit?"
   - **If Critical/Major issues:** → Continue to fix step
```

**Replace with:**
```markdown
2. **Check findings:**
   - **If 0 issues:** → Exit loop, go to commit
   - **If only Minor issues:**
     - **If `--auto` is set:** Auto-decide based on scope:
       - Minor fixes touch < 3 files → auto-fix (continue to fix step with Minor scope)
       - Minor fixes touch 3+ files → skip Minor fixes, exit loop, go to commit
       - Log decision: "AUTO: Fixing {N} minor issues in {M} files" or "AUTO: Skipping {N} minor issues (3+ files — deferring)"
     - **If `--auto` is NOT set:** → Ask user: "Fix minor issues or skip to commit?"
   - **If Critical/Major issues:** → Continue to fix step
```

**PATTERN:** The 3-file threshold follows the "minimal changes" philosophy from `/code-review-fix` — small scoped fixes are safe to auto-apply; broad fixes deserve human judgment.

**GOTCHA:** The auto-fix path still goes through the normal fix step (Steps 3-4: plan via `/planning` → execute via `/execute`). It does not bypass the fix pipeline — it only bypasses the user prompt.

**GOTCHA:** The decision is logged to output. This creates an audit trail so the user can see what `--auto` decided after the fact.

**VALIDATE:** Read code-loop.md iteration step 2 and verify:
1. Three branches: 0 issues, Minor-only (with sub-branches), Critical/Major
2. `--auto` sub-branch has the 3-file threshold
3. `--auto` sub-branch logs the decision
4. Default (no flag) still prompts the user

### Step 3: Update loop exit conditions table

**IMPLEMENT:**

In `.opencode/commands/code-loop.md`, find the exit conditions table (lines 212-219):

**Current:**
```markdown
### Loop Exit Conditions

| Condition | Action |
|-----------|--------|
| 0 issues + validation passes (no `--auto-commit`) | → Hand off to `/commit` (next session) |
| 0 issues + validation passes (`--auto-commit`) | → Run `/commit` directly in this session |
| Only Minor issues | → Fix if quick and safe; otherwise ask user whether to defer |
| Unfixable error detected | → Stop, report what's blocking |
```

**Replace with:**
```markdown
### Loop Exit Conditions

| Condition | Action |
|-----------|--------|
| 0 issues + validation passes (no `--auto-commit`) | → Hand off to `/commit` (next session) |
| 0 issues + validation passes (`--auto-commit`) | → Run `/commit` directly in this session |
| Only Minor issues (`--auto`) | → Auto-fix if < 3 files; skip to commit if 3+ files |
| Only Minor issues (no `--auto`) | → Ask user: fix or defer? |
| Unfixable error detected | → Stop, report what's blocking |
```

**PATTERN:** The table now has separate rows for the `--auto` and non-`--auto` paths, matching how the table already separates `--auto-commit` and non-`--auto-commit` paths.

**VALIDATE:** Read the exit conditions table and confirm:
1. Four conditions (up from three, with Minor split into two)
2. `--auto` row matches the iteration logic from Step 2
3. No `--auto-commit` row is unchanged

---

## TESTING STRATEGY

### Structural Verification
- Read the updated `code-loop.md` around Usage, iteration logic, and exit conditions
- Verify `--auto` flag is documented, parsed, and referenced in all three locations
- Verify the 3-file threshold is consistent between iteration logic and exit conditions

### Edge Cases
- **`--auto` + 0 issues**: Normal exit (no Minor handling needed)
- **`--auto` + 1 Minor issue in 1 file**: Auto-fix
- **`--auto` + 5 Minor issues across 2 files**: Auto-fix (< 3 files)
- **`--auto` + 3 Minor issues across 4 files**: Skip to commit
- **`--auto` + Critical + Minor**: Critical/Major path takes precedence — `--auto` only affects the Minor-only branch
- **`--auto` + `--auto-commit`**: Minor auto-handled, then auto-commit on clean exit
- **No `--auto`**: Original behavior — user prompt for Minor-only
- **`--auto` + unfixable error**: Unfixable still stops the loop (unchanged)

### Cross-File Consistency
- `--auto` flag documented alongside `--auto-commit` (same style)
- Auto-fix path still uses the normal fix pipeline (Steps 3-4)
- Decision logging follows the pattern of reporting actions to output

---

## VALIDATION COMMANDS

- **L1**: N/A — Markdown file
- **L2**: Read `code-loop.md` Usage section and verify both flags documented
- **L2**: Read `code-loop.md` iteration step 2 and verify conditional branching
- **L2**: Read `code-loop.md` exit conditions table and verify split rows
- **L3**: Grep for `--auto` in `code-loop.md` — should appear in Usage, iteration logic, and exit conditions
- **L4**: N/A — Manual integration test
- **L5**: Human review

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] `--auto` flag documented in Usage section alongside `--auto-commit`
- [ ] "Combining flags" note explains `--auto --auto-commit` for full autonomy
- [ ] Iteration step 2 has conditional branch for `--auto` on Minor-only findings
- [ ] Auto-fix threshold is < 3 files (consistent in iteration logic and exit conditions)
- [ ] Auto-decision is logged to output (audit trail)
- [ ] Exit conditions table has separate rows for `--auto` and non-`--auto` Minor handling
- [ ] Default behavior (no `--auto`) is UNCHANGED — still prompts user
- [ ] `--auto` does NOT affect Critical/Major handling (unchanged)
- [ ] `--auto` does NOT affect unfixable error handling (unchanged)

### Runtime
- [ ] `/code-loop feature --auto` would auto-handle Minor-only findings
- [ ] `/code-loop feature --auto --auto-commit` would run fully autonomously
- [ ] `/code-loop feature` (no flags) would still prompt for Minor findings

---

## HANDOFF NOTES

Task 4 is independent (edits section files, not command files). No dependency.

The `--auto` flag complements `--auto-commit` for fully autonomous `/code-loop` operation. If `/build` is ever updated to use `/code-loop` instead of its own Step 7 review loop, it should pass both flags: `--auto --auto-commit`.

---

## COMPLETION CHECKLIST

- [ ] `--auto` flag added to Usage section
- [ ] "Combining flags" note added
- [ ] Iteration step 2 updated with conditional Minor handling
- [ ] Exit conditions table updated with split Minor rows
- [ ] Decision logging noted in auto path
- [ ] Default behavior unchanged
- [ ] File is valid Markdown with no broken code blocks
