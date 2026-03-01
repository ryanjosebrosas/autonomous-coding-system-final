# Task 3 of 5: Define `/execute` Inline Contract for `/build`

> **Feature**: `build-pipeline-hardening`
> **Brief Path**: `.agents/features/build-pipeline-hardening/task-3.md`
> **Plan Overview**: `.agents/features/build-pipeline-hardening/plan.md`

---

## OBJECTIVE

Add a "Called inline from `/build`" override to `/execute` that suppresses the "End session" directive and handoff writes when running inside `/build`'s loop — so `/build` can call `/execute` repeatedly without session-ending conflicts.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/execute.md` | UPDATE | Steps 2.5 and 2.6 get inline-from-build override; new section defining the contract |

**Out of Scope:**
- `/build` Step 5 — already has the brief-completion loop from `build-autonomous-readiness`. No changes needed to `/build` for this task.
- Dispatch path — dispatch creates a fresh agent with its own context; session-ending is correct there. Only the inline path needs the override.

**Dependencies:**
- Task 1 must complete first (Step 8 rewritten).
- Task 2 must complete first (error handling added).

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Task(s):**
- `.opencode/commands/build.md` — Step 8 delegates to `/commit`; Steps 4 and 9 have error handling; dispatch timeout fallbacks added.

**State Carried Forward:**
- `/build` Step 5 inline path says "Run `/execute` inline." The current `/execute` Steps 2.5 and 2.6 both say "End session" and write handoff files. These conflict with `/build`'s loop.
- Task 1 established the delegation pattern (commands tell sub-commands about their caller context).

**Known Issues or Deferred Items:**
- None from Tasks 1-2.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/execute.md` (lines 141-219) — Why: Steps 2.5 and 2.6, the completion sections with "End session" directives
- `.opencode/commands/build.md` (lines 265-325) — Why: Step 5, the brief-completion loop that calls `/execute`

### Current Content: Step 2.5 Phase Completion (Lines 141-180)

```markdown
### 2.5. Phase Completion (for master plan / plan series phases)

After executing a single phase sub-plan (routed here from Step 0.5), complete the phase:

1. Let the existing completion sweep (Step 6.6) handle renaming `plan-phase-{N}.md` → `plan-phase-{N}.done.md`
2. Determine phase progress: count `.done.md` phase files vs total phases from the master plan's SUB-PLAN INDEX
3. **If more phases remain** — write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (phase {N} of {total})
   - **Feature**: {feature}
   - **Next Command**: /execute .agents/features/{feature}/plan-master.md
   - **Master Plan**: .agents/features/{feature}/plan-master.md
   - **Phase Progress**: {N}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: executing-series
   ```
   Report: "Phase {N}/{total} complete. Next session: `/prime` → `/execute .agents/features/{feature}/plan-master.md` to continue with phase {N+1}."
   **End session.** Do NOT continue to the next phase — each phase gets a fresh context window.

4. **If ALL phases done** — rename `plan-master.md` → `plan-master.done.md`. Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (phase {total} of {total})
   - **Feature**: {feature}
   - **Next Command**: /code-loop {feature}
   - **Master Plan**: .agents/features/{feature}/plan-master.done.md
   - **Phase Progress**: {total}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: awaiting-review
   ```
   Report: "All {total} phases complete. Feature ready for review. Next session: `/prime` → `/code-loop {feature}`."

5. **If phase execution failed** — do NOT rename the phase file (no `.done.md`). Write handoff with **Status**: `blocked` and **Next Command**: `[manual intervention — phase {N} failed]`. Report the failure and stop.

**Key rule**: `/execute` with a master plan ALWAYS executes exactly one phase per session. The next session picks up the next phase via `/prime` → handoff file. This prevents context compaction on complex features.
```

**Analysis**: Item 3 says "End session. Do NOT continue to the next phase." This is correct for standalone `/execute` (one-per-session model). But when `/build` calls `/execute` inline, `/build` needs `/execute` to return control after one phase, NOT end the session. The `.done.md` rename and progress counting are still needed; the session-ending and handoff write are not.

### Current Content: Step 2.6 Task Brief Completion (Lines 182-219)

```markdown
### 2.6. Task Brief Completion (for task brief mode)

After executing a single task brief (routed here from Step 0.5), complete the task:

1. Let the existing completion sweep (Step 6.6) handle renaming `task-{N}.md` → `task-{N}.done.md`
2. Determine task progress: count `.done.md` task files vs total tasks from `plan.md`'s TASK INDEX table
3. **If more tasks remain** — write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (task {N} of {total})
   - **Feature**: {feature}
   - **Next Command**: /execute .agents/features/{feature}/plan.md
   - **Task Progress**: {N}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: executing-tasks
   ```
   Report: "Task {N}/{total} complete. Next session: `/prime` → `/execute .agents/features/{feature}/plan.md` to continue with task {N+1}."
   **End session.** Do NOT continue to the next task brief — each brief gets a fresh context window.

4. **If ALL tasks done** — rename `plan.md` → `plan.done.md`. Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (task {total} of {total})
   - **Feature**: {feature}
   - **Next Command**: /code-loop {feature}
   - **Task Progress**: {total}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: awaiting-review
   ```
   Report: "All {total} task briefs complete. Feature ready for review. Next session: `/prime` → `/code-loop {feature}`."

5. **If task execution failed** — do NOT rename the task file (no `.done.md`). Write handoff with **Status**: `blocked` and **Next Command**: `[manual intervention — task {N} failed]`. Report the failure and stop.

**Key rule**: `/execute` with task briefs ALWAYS executes exactly one brief per session. The next session auto-detects the next undone brief via artifact scan. This is identical to the master plan phase model.
```

**Analysis**: Same issue as 2.5. Item 3 says "End session" and writes a handoff. When called inline from `/build`, `/build` owns the loop and the handoff. The `.done.md` renames and progress counting must still happen; the session-ending and handoff writes must be suppressed.

### Patterns to Follow

**Pattern: Conditional behavior in /planning** (from `planning.md:203-221`):
```markdown
### If `--auto-approve` is set:

Run the following self-review checklist instead of prompting the user:
...

### If `--auto-approve` is NOT set (default):

Present the preview to the user and wait for explicit approval:
...
```
- Why this pattern: Clean conditional branching based on caller context.
- How to apply: Same structure: "If called inline from `/build`:" → suppress session-ending + handoff. "If standalone (default):" → current behavior unchanged.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/commands/execute.md` — Add inline-from-build contract

**What**: Add a new section before Steps 2.5/2.6 defining the behavioral differences when `/execute` is called inline from `/build`.

**IMPLEMENT**:

Insert the following new section after the current Step 2 "Execute Tasks in Order" section (after line 113, before Step 2.5):

```markdown
### 2.4. Inline-from-Build Override

When `/execute` is called inline from `/build` (not dispatched as a separate agent), the following behavioral overrides apply:

| Behavior | Standalone (default) | Inline from `/build` |
|----------|---------------------|---------------------|
| Execute one brief/phase | Yes | Yes (unchanged) |
| Rename `.done.md` artifacts | Yes | Yes (unchanged) |
| Count progress | Yes | Yes (unchanged) |
| Write handoff file | Yes | **No** — `/build` owns the handoff |
| "End session" directive | Yes | **No** — return control to `/build` |
| Report completion message | Yes | **Abbreviated** — just "Task {N}/{total} complete." |

**How to detect**: The calling context (from `/build` Step 5) will explicitly state "This is an inline `/execute` call from `/build`." There is no flag — the context instruction is sufficient.

**What still happens**: The `.done.md` rename (Step 6.6 completion sweep) and progress counting ALWAYS run regardless of mode. These are required for `/build`'s loop detection (checking `plan.done.md` to know when all briefs are complete).

**What is suppressed**: Only the handoff write and session-ending directive in Steps 2.5/2.6 are suppressed. Everything else (implementation, validation, self-review, report) runs normally.
```

**PATTERN**: `/planning`'s `--auto-approve` conditional at `planning.md:203-221`.

**IMPORTS**: N/A

**GOTCHA**: Do NOT add a formal flag like `--inline`. The caller context instruction is sufficient and avoids flag proliferation. `/build` Step 5 already says "Run `/execute` inline" — the override triggers on this context.

**VALIDATE**:
```bash
# Read the new section and verify: clear table of behavioral differences, no flag needed
```

---

### Step 2: UPDATE `.opencode/commands/execute.md` — Modify Step 2.5 for inline override

**What**: Add inline-from-build conditional to Step 2.5 item 3 (the "End session" point for phase completion).

**IMPLEMENT**:

Current (Step 2.5, item 3 — the "If more phases remain" block):
```markdown
3. **If more phases remain** — write handoff:
   ```markdown
   # Pipeline Handoff
   ...
   ```
   Report: "Phase {N}/{total} complete. Next session: `/prime` → `/execute .agents/features/{feature}/plan-master.md` to continue with phase {N+1}."
   **End session.** Do NOT continue to the next phase — each phase gets a fresh context window.
```

Replace with:
```markdown
3. **If more phases remain:**

   **Standalone mode (default):** Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (phase {N} of {total})
   - **Feature**: {feature}
   - **Next Command**: /execute .agents/features/{feature}/plan-master.md
   - **Master Plan**: .agents/features/{feature}/plan-master.md
   - **Phase Progress**: {N}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: executing-series
   ```
   Report: "Phase {N}/{total} complete. Next session: `/prime` → `/execute .agents/features/{feature}/plan-master.md` to continue with phase {N+1}."
   **End session.** Do NOT continue to the next phase — each phase gets a fresh context window.

   **Inline from `/build`:** Skip handoff write. Report: "Phase {N}/{total} complete." Return control to `/build`.
```

Also update the **Key rule** at the bottom of Step 2.5:

Current:
```markdown
**Key rule**: `/execute` with a master plan ALWAYS executes exactly one phase per session. The next session picks up the next phase via `/prime` → handoff file. This prevents context compaction on complex features.
```

Replace with:
```markdown
**Key rule**: `/execute` with a master plan executes exactly one phase per invocation. In standalone mode, this means one phase per session (the next session picks up via `/prime` → handoff). In inline-from-build mode, `/build` re-invokes `/execute` for the next phase within the same session.
```

**PATTERN**: The "Standalone / Inline" split mirrors the `/planning` auto-approve pattern.

**IMPORTS**: N/A

**GOTCHA**: The "If ALL phases done" (item 4) and "If phase failed" (item 5) blocks also write handoffs. Item 4's handoff should also be suppressed in inline mode (but the `plan-master.done.md` rename must still happen). Item 5's failure handoff should also be suppressed in inline mode — `/build` handles the error.

**VALIDATE**:
```bash
# Read Step 2.5 and verify: standalone and inline paths are clearly separated, .done.md rename always runs
```

---

### Step 3: UPDATE `.opencode/commands/execute.md` — Modify Step 2.6 for inline override

**What**: Add the same inline-from-build conditional to Step 2.6 item 3 (task brief completion).

**IMPLEMENT**:

Current (Step 2.6, item 3 — the "If more tasks remain" block):
```markdown
3. **If more tasks remain** — write handoff:
   ```markdown
   # Pipeline Handoff
   ...
   ```
   Report: "Task {N}/{total} complete. Next session: `/prime` → `/execute .agents/features/{feature}/plan.md` to continue with task {N+1}."
   **End session.** Do NOT continue to the next task brief — each brief gets a fresh context window.
```

Replace with:
```markdown
3. **If more tasks remain:**

   **Standalone mode (default):** Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (task {N} of {total})
   - **Feature**: {feature}
   - **Next Command**: /execute .agents/features/{feature}/plan.md
   - **Task Progress**: {N}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: executing-tasks
   ```
   Report: "Task {N}/{total} complete. Next session: `/prime` → `/execute .agents/features/{feature}/plan.md` to continue with task {N+1}."
   **End session.** Do NOT continue to the next task brief — each brief gets a fresh context window.

   **Inline from `/build`:** Skip handoff write. Report: "Task {N}/{total} complete." Return control to `/build`.
```

Also update item 4 ("If ALL tasks done") to suppress handoff in inline mode:

Current:
```markdown
4. **If ALL tasks done** — rename `plan.md` → `plan.done.md`. Write handoff:
   ```markdown
   ...
   ```
   Report: "All {total} task briefs complete. Feature ready for review. Next session: `/prime` → `/code-loop {feature}`."
```

Replace with:
```markdown
4. **If ALL tasks done** — rename `plan.md` → `plan.done.md`.

   **Standalone mode (default):** Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (task {total} of {total})
   - **Feature**: {feature}
   - **Next Command**: /code-loop {feature}
   - **Task Progress**: {total}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: awaiting-review
   ```
   Report: "All {total} task briefs complete. Feature ready for review. Next session: `/prime` → `/code-loop {feature}`."

   **Inline from `/build`:** Skip handoff write. Report: "All {total} task briefs complete." Return control to `/build`. The `plan.done.md` rename signals completion to `/build`'s loop.
```

Also update the **Key rule** at the bottom of Step 2.6:

Current:
```markdown
**Key rule**: `/execute` with task briefs ALWAYS executes exactly one brief per session. The next session auto-detects the next undone brief via artifact scan. This is identical to the master plan phase model.
```

Replace with:
```markdown
**Key rule**: `/execute` with task briefs executes exactly one brief per invocation. In standalone mode, this means one brief per session (the next session auto-detects via artifact scan). In inline-from-build mode, `/build` re-invokes `/execute` for the next brief within the same session.
```

**PATTERN**: Identical to Step 2 modifications for Step 2.5.

**IMPORTS**: N/A

**GOTCHA**: Item 5 (task failure) should also suppress handoff in inline mode — `/build` handles the error via its stuck detection in Step 5. The `.done.md` non-rename (leaving the task file un-renamed on failure) must still happen in both modes — it's the signal that the task failed.

**VALIDATE**:
```bash
# Read Step 2.6 and verify: standalone and inline paths clearly separated
# Verify: plan.done.md rename still happens in inline mode
# Verify: key rule updated to mention "per invocation" not "per session"
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this task modifies a markdown command spec. Covered by manual testing in Level 5.

### Integration Tests
N/A

### Edge Cases

- **Standalone `/execute` is unchanged**: All default behavior preserved — handoff writes, session-ending, everything.
- **`/build` dispatch path unaffected**: Dispatched `/execute` runs in its own agent context. The "End session" is fine there because the agent session ends and `/build` gets the result back. Only the inline path needs the override.
- **Task failure in inline mode**: `.done.md` is NOT created (correct). `/build`'s stuck detection catches it.
- **All tasks done in inline mode**: `plan.done.md` IS created (correct). `/build`'s loop checks for this file to exit.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Open execute.md and verify valid markdown
```

### Level 2: Type Safety
N/A

### Level 3: Unit Tests
N/A

### Level 4: Integration Tests
N/A

### Level 5: Manual Validation

1. Read Step 2.4 (new inline contract) — verify behavioral difference table is clear
2. Read Step 2.5 — verify standalone and inline paths are both present
3. Read Step 2.6 — verify standalone and inline paths are both present
4. Verify: `.done.md` renames happen in BOTH modes
5. Verify: Handoff writes happen ONLY in standalone mode
6. Verify: "End session" appears ONLY in standalone mode
7. Verify: Key rules updated to say "per invocation" not "per session"
8. Cross-check: `/build` Step 5 inline path says "Run `/execute` inline" — compatible with the new override

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] New Step 2.4 "Inline-from-Build Override" section exists with behavioral table
- [ ] Step 2.5 item 3 has standalone/inline split
- [ ] Step 2.5 item 4 has standalone/inline split (suppress handoff, keep `.done.md`)
- [ ] Step 2.5 Key Rule says "per invocation" not "per session"
- [ ] Step 2.6 item 3 has standalone/inline split
- [ ] Step 2.6 item 4 has standalone/inline split (suppress handoff, keep `.done.md`)
- [ ] Step 2.6 Key Rule says "per invocation" not "per session"
- [ ] All existing standalone behavior is unchanged (backward compatible)

### Runtime (verify after testing/deployment)

- [ ] `/build` Step 5 inline can call `/execute` repeatedly without session-ending conflicts
- [ ] Standalone `/execute` still writes handoffs and ends sessions as before
- [ ] `plan.done.md` is created when all tasks complete in both modes

---

## HANDOFF NOTES

### Files Created/Modified
- `.opencode/commands/execute.md` — New Step 2.4 (inline contract), Steps 2.5 and 2.6 updated with standalone/inline split

### Patterns Established
- **Inline-from-build override pattern**: Commands that can be called both standalone and from `/build` use a "Standalone mode (default) / Inline from `/build`" conditional. The override suppresses session-ending and handoff writes. `.done.md` renames always run.

### State to Carry Forward
- `/execute` now has two modes. Task 4 needs to know that handoff writes in inline mode are `/build`'s responsibility.

### Known Issues or Deferred Items
- The inline override relies on context instruction ("This is an inline /execute call from /build"), not a formal flag. If a future command needs the same override, a flag may be warranted — but for now, context instruction is sufficient.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written
- [ ] Brief marked done: rename `task-3.md` → `task-3.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **Context instruction, not flag**: The override triggers on `/build`'s instruction "This is an inline `/execute` call" rather than a `--inline` flag. This avoids flag proliferation and is clear enough for the model to understand.
- **`.done.md` always runs**: The rename is the signal mechanism for loop detection. Suppressing it would break `/build`'s completion check.
- **Dispatch path unaffected**: Dispatched `/execute` runs in its own context — session-ending is correct there. Only inline needs the override.

### Implementation Notes

- The behavioral difference table in Step 2.4 is the single source of truth for the inline contract. If future overrides are needed, add rows to this table.
- Items 4 and 5 in both Steps 2.5 and 2.6 also need the inline split for handoff writes. Don't forget these — they're less obvious than item 3.
