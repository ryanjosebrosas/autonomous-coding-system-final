# Task 1 of 4: Add Brief-Completion Loop to `/build` Step 5 + `--auto-approve` in Step 2 Dispatch

> **Feature**: `build-autonomous-readiness`
> **Brief Path**: `.agents/features/build-autonomous-readiness/task-1.md`
> **Plan Overview**: `.agents/features/build-autonomous-readiness/plan.md`

---

## OBJECTIVE

Add a brief-completion loop to `/build` Step 5 so it re-dispatches `/execute` until all task briefs (or phases) are complete, and update Step 2's dispatch prompt to include `--auto-approve` when calling `/planning`.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/build.md` | UPDATE | Step 5 gains a brief-completion loop; Step 2 dispatch prompt gains `--auto-approve` |

**Out of Scope:**
- `/execute` command — its one-brief-per-session design is correct and unchanged
- `/planning` command — `--auto-approve` flag handling is Task 2
- Steps 1, 3, 4, 6-11 of `/build` — unchanged
- Master + Sub-Plan mode detection logic — unchanged (but the loop handles both modes)

**Dependencies:**
- None — this is the first task

---

## PRIOR TASK CONTEXT

This is the first task — no prior work. Start fresh from the codebase state.

---

## CONTEXT REFERENCES

### File: `.opencode/commands/build.md` — Step 2 (Plan), lines 125-185

This is the planning step that dispatches to `/planning`. The dispatch prompt on line 158 needs `--auto-approve`:

```markdown
### Step 2: Plan (T1)

**Every spec gets a full 700-1000 line plan.** No exceptions. No tiered plan sizes. The depth label (light/standard/heavy) does NOT affect planning quality — it only affects the validation tier in Step 7.

#### Planning Process

1. **Gather context:**
   - Read the spec entry from `.agents/specs/BUILD_ORDER.md` (description, depends, touches, acceptance)
   - Read `.agents/specs/PILLARS.md` for pillar context and gate criteria
   - Read `PRD.md` for product requirements context
   - Read `memory.md` for gotchas and lessons learned
   - Read `.agents/specs/build-state.json` for context from prior specs (if exists)
   - Read relevant codebase files listed in the spec's `touches` field
   - Read patterns from recently completed specs in the same pillar

2. **Judgment call on user interaction:**
   - If the spec's approach is fully covered by BUILD_ORDER + PILLARS + PRD (acceptance criteria, files touched, approach is obvious): write the plan directly without asking questions.
   - If there are real tradeoffs, ambiguity, or decisions NOT covered in existing artifacts: ask the user before writing the plan.
   - Default: most specs should NOT need user interaction — the BUILD_ORDER was already approved.

3. **Detect plan mode:**
   - **Task Brief Mode** (DEFAULT — use for all standard specs): Produces `plan.md` (overview + task index) + one `task-N.md` brief per task. Each brief runs in one `/execute` session. Use this for the vast majority of specs — there is no task count upper boundary.
   - **Master + Sub-Plan Mode** (EXCEPTION — rare, genuinely complex specs): Use only when the spec has multiple distinct phases with heavy cross-phase dependencies that make a single plan unwieldy. The trigger is architectural complexity, not task count. This is rare.
   - When in doubt: default to Task Brief Mode

#### Task Brief Mode (Default)

4. **Write or dispatch plan:**

   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /planning {spec-id} {spec-name}...",
     taskType: "planning",
     timeout: 900,
   })
   ```
   Use a T1 thinking model for best results (reasoning produces better plans and task briefs).

   **If dispatch unavailable:**
   Write the plan directly using the `/planning` methodology. The primary model gathers context, runs discovery, and produces the structured plan inline.

   - `plan.md` MUST be 700-1000 lines — this is a hard requirement
   - Each `task-{N}.md` brief MUST be self-contained and executable without reading `plan.md`
   - Plans MUST include actual code samples (copy-pasteable), not summaries
   - Plans MUST include exact file paths, line references, import statements
   - Plans MUST include validation commands for every task
   - Save to: `.agents/features/{spec-name}/plan.md` + `.agents/features/{spec-name}/task-{N}.md`

5. **Validate plan size:**
   - Count lines of `plan.md`. If under 700: reject, re-write with explicit "plan is too short, expand code samples and task detail"
   - If over 1000: acceptable but flag if significantly over

#### Master + Sub-Plan Mode (Exception)

4. **Write or dispatch master plan:**
   Same as above but in master mode. The master plan defines phases, task groupings, phase gates.
   - Master plan MUST be ~400-600 lines
   - Each sub-plan MUST be 700-1000 lines
   - Save to: `.agents/features/{spec-name}/plan-master.md` + `.agents/features/{spec-name}/plan-phase-{N}.md`
```

### File: `.opencode/commands/build.md` — Step 5 (Execute), lines 264-284

This is the section that needs the brief-completion loop:

```markdown
### Step 5: Execute (T1)

#### Single Plan Mode (Default)

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
Execute the plan inline using `/execute` methodology. Read the plan, implement each task in order, validate after each change.

#### Master + Sub-Plan Mode

Execute with master plan — `/execute` handles sub-plan looping automatically.
```

### File: `.opencode/commands/build.md` — Step 6 (Validate), lines 287-340

Step 6 immediately follows Step 5. The loop must ensure ALL briefs complete before Step 6 runs:

```markdown
### Step 6: Validate

Run the project's validation pyramid (commands auto-detected by `/prime` or configured in `.opencode/config.md`):

```bash
# Level 1: Syntax & Style — {configured lint command}
# Level 2: Type Safety — {configured type check command}
# Level 3: Unit + Integration Tests — {configured test command}
```

**On failure — classify before looping:**

First, classify every failing error into one of two buckets:

| Class | Examples | Action |
|-------|---------|--------|
| **Fixable** | type error in our code, import missing, test assertion wrong, lint violation | Fix loop (Step 6a) |
| **Unresolvable** | missing DB/service, missing API key, third-party stub gap, network-dependent test, false positive from external library | Skip fix loop → escalate (Step 6b) |
```

### Reference Pattern: `/execute` `.done.md` convention

From the plan research, `/execute` marks task briefs as done by renaming:
- `task-{N}.md` → `task-{N}.done.md` (per completed brief)
- `plan.md` → `plan.done.md` (when ALL briefs done)
- `plan-phase-{N}.md` → `plan-phase-{N}.done.md` (per completed phase)
- `plan-master.md` → `plan-master.done.md` (when ALL phases done)

The brief-completion loop checks for `plan.done.md` (task brief mode) or `plan-master.done.md` (master plan mode) as the exit condition.

### Reference Pattern: `/prime` artifact scanning

From `AGENTS.md`, `/prime` scans for `.done.md` files to detect pending work:
```markdown
1. If `plan.md` exists AND `plan.done.md` does NOT exist:
   - If `task-{N}.md` files exist (any N) → check which `task-{N}.done.md` exist → **task brief mode in progress (task X/Y)**
```

The loop uses the same detection logic — checking which `task-{N}.done.md` exist to determine if execution is complete.

---

## PATTERNS TO FOLLOW

### Pattern: Dispatch call structure (from build.md Step 5, line 270)

```markdown
dispatch({
  mode: "agent",
  prompt: "Run /prime first. Then run /execute .agents/features/{spec-name}/plan.md",
  taskType: "execution",
  timeout: 900,
})
```

The brief-completion loop wraps around this call. The dispatch prompt stays the same — `/execute` auto-detects the next undone brief when given `plan.md`.

### Pattern: Flag passing in dispatch prompts (from build.md Step 2, line 158)

```markdown
dispatch({
  mode: "agent",
  prompt: "Run /prime first. Then run /planning {spec-id} {spec-name}...",
  taskType: "planning",
  timeout: 900,
})
```

The `--auto-approve` flag gets appended to the prompt string. The dispatched agent reads it as part of `$ARGUMENTS`.

### Pattern: `/execute` auto-detection of next brief

From `/execute` command spec, when called with `plan.md`:
1. `/execute` scans for `task-{N}.done.md` files
2. Picks the first `task-{N}.md` without a matching `.done.md`
3. Executes that ONE brief
4. Renames it to `task-{N}.done.md`
5. If all briefs are done, renames `plan.md` to `plan.done.md`

This means `/build` can re-dispatch the same `/execute .../plan.md` command each time — `/execute` automatically picks the next undone brief.

---

## STEP-BY-STEP TASKS

### Step 1: Update Step 2 dispatch prompt to include `--auto-approve`

**IMPLEMENT:**

In `.opencode/commands/build.md`, find the Step 2 dispatch prompt (line 156-161):

**Current:**
```markdown
   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /planning {spec-id} {spec-name}...",
     taskType: "planning",
     timeout: 900,
   })
   ```
```

**Replace with:**
```markdown
   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /planning {spec-id} {spec-name} --auto-approve ...",
     taskType: "planning",
     timeout: 900,
   })
   ```
   The `--auto-approve` flag skips the interactive approval gate in `/planning` Phase 4 — the spec was already approved via BUILD_ORDER.
```

**PATTERN:** Follows the existing dispatch prompt structure, adding the flag as an argument.

**GOTCHA:** The `...` in the prompt is a placeholder in the original — the actual prompt would include spec details. The `--auto-approve` flag must be placed where `/planning` will parse it from `$ARGUMENTS`.

**VALIDATE:** Read build.md lines 154-163 and confirm `--auto-approve` is present in the dispatch prompt.

### Step 2: Replace Step 5 with brief-completion loop (Task Brief Mode)

**IMPLEMENT:**

In `.opencode/commands/build.md`, replace Step 5 (lines 264-284):

**Current:**
```markdown
### Step 5: Execute (T1)

#### Single Plan Mode (Default)

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
Execute the plan inline using `/execute` methodology. Read the plan, implement each task in order, validate after each change.

#### Master + Sub-Plan Mode

Execute with master plan — `/execute` handles sub-plan looping automatically.
```

**Replace with:**
```markdown
### Step 5: Execute All Briefs (T1)

`/execute` processes ONE task brief (or ONE phase) per dispatch. `/build` owns the loop that re-dispatches until all briefs/phases are complete.

#### Task Brief Mode (Default)

**Brief-completion loop:**

1. **Dispatch or execute one brief:**

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

2. **Check completion:**
   - If `.agents/features/{spec-name}/plan.done.md` exists → ALL briefs complete. Exit loop → Step 6.
   - If `plan.done.md` does NOT exist → briefs remain. Go back to step 1.

3. **Stuck detection:**
   - Track which brief was completed each iteration (check `task-{N}.done.md` count before and after dispatch).
   - If no new `.done.md` file appears after a dispatch (brief count unchanged) → the dispatch failed or stalled.
   - Retry once. If still no progress: STOP and report "Execution stalled on task brief {N} for spec {spec-name}."

**Loop invariant:** Each dispatch completes exactly one brief. The loop runs N times for N briefs. `/execute` picks the next undone brief automatically — `/build` does not need to track which brief is next.

#### Master + Sub-Plan Mode

**Phase-completion loop:**

1. **Dispatch or execute one phase:**

   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /execute .agents/features/{spec-name}/plan-master.md",
     taskType: "execution",
     timeout: 900,
   })
   ```

   **If dispatch unavailable:**
   Run `/execute .agents/features/{spec-name}/plan-master.md` inline. `/execute` auto-detects the next undone phase by scanning for `plan-phase-{N}.done.md` files.

2. **Check completion:**
   - If `.agents/features/{spec-name}/plan-master.done.md` exists → ALL phases complete. Exit loop → Step 6.
   - If `plan-master.done.md` does NOT exist → phases remain. Go back to step 1.

3. **Stuck detection:**
   - Same as task brief mode: track `plan-phase-{N}.done.md` count before and after dispatch.
   - If no new `.done.md` file appears after a dispatch → retry once, then STOP.
```

**PATTERN:** The loop structure mirrors `/prime`'s artifact scanning logic — checking for `.done.md` files to determine completion.

**GOTCHA:** The dispatch prompt is identical each iteration — `/execute` handles the brief/phase selection internally. Do NOT try to specify which brief to execute in the dispatch prompt.

**GOTCHA:** In dispatch-unavailable mode, `/execute` runs inline and uses the same one-brief-per-call behavior. The loop still applies — call `/execute` inline, check completion, repeat.

**VALIDATE:** Read the updated Step 5 and verify:
1. Both task-brief and master-plan modes have loops
2. Both dispatch-available and dispatch-unavailable paths are covered
3. Stuck detection prevents infinite loops
4. Exit condition is `plan.done.md` (or `plan-master.done.md`)

### Step 3: Verify no other references to Step 5 need updating

**IMPLEMENT:** Search `build.md` for references to "Step 5" to ensure no other sections assume single-dispatch behavior.

Check these specific locations:
- Step 6 (Validate) references "after Step 5" — this is fine, Step 6 still runs after Step 5 completes
- Step 7c fix loop says "Re-run validation (Step 6)" — this is fine, doesn't reference Step 5
- Context Management section says "Within a spec: Full context for that spec's plan + implementation" — this is fine

No other changes needed outside Step 5 and the Step 2 dispatch prompt.

**VALIDATE:** Grep for "Step 5" and "Execute (T1)" in the file to confirm no stale references.

---

## TESTING STRATEGY

### Structural Verification
- Read the updated `build.md` end-to-end around Steps 2 and 5
- Verify the brief-completion loop has a clear entry, loop body, exit condition, and stuck detection
- Verify both modes (task brief + master plan) are handled
- Verify both paths (dispatch available + unavailable) are handled

### Edge Cases
- **Single-brief spec**: Loop runs once, `plan.done.md` appears, exits immediately
- **Multi-brief spec (e.g., 5 briefs)**: Loop runs 5 times, each dispatch completes one brief
- **Dispatch failure**: Stuck detection catches it after 1 retry
- **Master plan with 3 phases**: Phase loop runs 3 times

### Cross-File Consistency
- `--auto-approve` in Step 2 dispatch prompt matches what Task 2 adds to `/planning`
- `.done.md` file convention matches what `/execute` produces

---

## VALIDATION COMMANDS

- **L1**: N/A — Markdown file
- **L2**: Read `build.md` lines 125-175 (Step 2) and verify `--auto-approve` in dispatch prompt
- **L2**: Read `build.md` lines 264-340 (Step 5 replacement) and verify loop structure
- **L3**: Grep for "Step 5" in `build.md` to confirm no stale references
- **L4**: N/A — Manual integration test (run `/build` on test project)
- **L5**: Human review of all changes

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] `/build` Step 2 dispatch prompt includes `--auto-approve` flag
- [ ] `/build` Step 2 has a note explaining why `--auto-approve` is used
- [ ] `/build` Step 5 has a brief-completion loop for task brief mode
- [ ] `/build` Step 5 has a phase-completion loop for master plan mode
- [ ] Both loops handle dispatch-available and dispatch-unavailable paths
- [ ] Both loops have stuck detection (no infinite loop risk)
- [ ] Exit condition is `plan.done.md` / `plan-master.done.md`
- [ ] Loop invariant documented: each dispatch completes exactly one brief/phase

### Runtime
- [ ] A 3-brief spec would cause `/build` Step 5 to dispatch `/execute` 3 times before moving to Step 6
- [ ] A failed dispatch triggers stuck detection after 1 retry

---

## HANDOFF NOTES

Task 2 depends on this task's `--auto-approve` flag addition to `/build` Step 2. Task 2 adds the flag handling to `/planning` itself. The flag name `--auto-approve` must match exactly between the two files.

---

## COMPLETION CHECKLIST

- [ ] Step 2 dispatch prompt updated with `--auto-approve`
- [ ] Step 5 replaced with brief-completion loop (task brief mode)
- [ ] Step 5 includes phase-completion loop (master plan mode)
- [ ] Stuck detection included in both loops
- [ ] No stale "Step 5" references elsewhere in the file
- [ ] File is valid Markdown with no broken code blocks
