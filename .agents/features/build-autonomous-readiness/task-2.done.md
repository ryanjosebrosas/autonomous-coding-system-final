# Task 2 of 4: Add `--auto-approve` Flag to `/planning` Phase 4

> **Feature**: `build-autonomous-readiness`
> **Brief Path**: `.agents/features/build-autonomous-readiness/task-2.md`
> **Plan Overview**: `.agents/features/build-autonomous-readiness/plan.md`

---

## OBJECTIVE

Add `--auto-approve` flag to `/planning` so that Phase 4 (Preview/Approval Gate) auto-approves via self-review checklist instead of prompting the user, enabling autonomous operation when called from `/build`.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/planning.md` | UPDATE | Usage section gains `--auto-approve` flag; Phase 4 gains conditional auto-approve branch |

**Out of Scope:**
- `/build` command — `--auto-approve` in dispatch prompt was added in Task 1
- Phase 1-3 of `/planning` — unchanged (discovery, research, design still run)
- Phase 5 of `/planning` — unchanged (plan writing is the same regardless of flag)
- Plan quality requirements (700-line minimum, etc.) — unchanged
- Interactive behavior when `--auto-approve` is NOT present — backward compatible

**Dependencies:**
- Task 1 must complete first — it adds `--auto-approve` to `/build` Step 2's dispatch prompt. The flag name must match exactly.

---

## PRIOR TASK CONTEXT

**Files Changed in Task 1:**
- `.opencode/commands/build.md` — Step 2 dispatch prompt now includes `--auto-approve`; Step 5 now has a brief-completion loop

**State Carried Forward:**
- The flag name is `--auto-approve` (with double dash, hyphenated)
- It appears in `/build` Step 2's dispatch prompt: `"Run /prime first. Then run /planning {spec-id} {spec-name} --auto-approve ..."`
- `/planning` must recognize this flag in `$ARGUMENTS` and skip the interactive approval gate

**Known Issues or Deferred Items:**
- None from Task 1

---

## CONTEXT REFERENCES

### File: `.opencode/commands/planning.md` — Front matter + description, lines 1-3

```markdown
---
description: Interactive discovery session — explore ideas WITH the user, then produce a structured plan
---
```

The description stays the same — `/planning` is still interactive by default. The flag only affects Phase 4.

### File: `.opencode/commands/planning.md` — Feature line + Usage implicit, line 9

```markdown
## Feature: $ARGUMENTS
```

`$ARGUMENTS` is where the flag will appear. The command currently reads `$ARGUMENTS` as a feature name or spec ID. It needs to also parse flags from `$ARGUMENTS`.

### File: `.opencode/commands/planning.md` — Phase 1 standalone handling, lines 54-65

```markdown
### If called standalone:
- If `$ARGUMENTS` matches a pillar spec ID (e.g., `P0-01`, `P1-03`):
  1. Read the matching pillar file from `.agents/specs/pillar-{N}-*.md`
  2. Read the specific spec entry from that file
  3. Summarize: "This spec is about {purpose}. Pillar context: {scope}. Research found: {key findings}."
  4. Ask: "Does this match your thinking? Anything to add or change?"
- Otherwise:
  - Ask: "What are we building? Give me the short version."
  - Listen, then ask 2-3 targeted follow-up questions:
    - "What's the most important thing this needs to do?"
    - "What existing code should this integrate with?"
    - "Any constraints or preferences on how to build it?"
```

This shows how `$ARGUMENTS` is currently parsed — as a feature name or spec ID. The flag needs to be stripped from `$ARGUMENTS` before this parsing happens.

### File: `.opencode/commands/planning.md` — Phase 4 (Preview/Approval Gate), lines 180-200

This is the section that needs the conditional auto-approve branch:

```markdown
## Phase 4: Preview (Approval Gate)

Before writing the full plan, show a **1-page preview**:

```
PLAN PREVIEW: {spec-name}
=============================

What:      {1-line description}
Approach:  {the locked-in approach}
Files:     {create: X, modify: Y}
Key decision: {the main architectural choice and why}
Risks:     {top 1-2 risks}
Tests:     {testing approach}
Estimated tasks: {N tasks}
Mode:      {Task Briefs (N briefs, default) | Master + Sub-Plans (N phases, escape hatch)}

Approve this direction to write the full plan? [y/n/adjust]
```

Only write the plan file after explicit approval.
```

### File: `.opencode/commands/planning.md` — Phase 3 (Design), lines 167-177

```markdown
## Phase 3: Design (Strategic Decisions)

Discuss the implementation approach with the user:

1. **Propose the approach** — "Here's how I'd build this: {approach}. The key decision is {X}."
2. **Present alternatives** — if multiple valid approaches exist, show 2-3 options with tradeoffs
3. **Confirm the direction** — "Lock in approach A? Or should we explore B more?"

For non-trivial architecture decisions, suggest council:
- "This has multiple valid approaches. Want to run `/council` to get multi-model input?"
```

Phase 3 comes right before Phase 4. When `--auto-approve` is set, the design phase should still run (decisions are important), but the final approval prompt should be skipped.

### File: `.opencode/commands/planning.md` — Phase 5 start, lines 204-216

```markdown
## Phase 5: Write Plan

### Auto-Detect Complexity

After Phases 1-4 (discovery/design), assess complexity and select the output mode:

- **Task Brief Mode** (DEFAULT — use for all standard features): Produces `plan.md` (overview + task index) + one `task-N.md` brief per task. Each brief is a self-contained execution document for one `/execute` session. Use this for the vast majority of features — there is no task count upper boundary for this mode.
- **Master + Sub-Plan Mode** (EXCEPTION — escape hatch for genuinely complex features): Use ONLY when the feature has multiple distinct phases with heavy cross-phase dependencies that make a single plan unwieldy. The trigger is architectural complexity, not task count. A feature with 12 straightforward tasks fits comfortably in task brief mode. A feature with 8 tasks across truly independent phases with separate validation gates may warrant master plan mode.
```

Phase 5 follows Phase 4. The auto-approve must complete before Phase 5 starts.

---

## PATTERNS TO FOLLOW

### Pattern: Flag handling in `/code-loop` (existing model)

`code-loop.md:26-33` shows how flags are documented alongside positional arguments:

```markdown
## Usage

```
/code-loop [feature-name] [--auto-commit]
```

- `feature-name` (optional): Used for commit message and report file. If omitted, read `.agents/context/next-command.md` for the active feature name.
- `--auto-commit` (optional): When the loop exits clean (0 Critical/Major issues + all validation passes), run `/commit` automatically within this session instead of handing off. Useful for autonomous pipelines.
```

`/planning` should follow the exact same format: flag in the usage block, dash-prefixed description below.

### Pattern: Conditional behavior based on caller context (planning.md:36-40)

```markdown
### If called from `/build` with a spec:
- Read the spec from `.agents/specs/BUILD_ORDER.md`
- Read `.agents/specs/build-state.json` for context from prior specs
```

This shows the command already branches on context. The `--auto-approve` flag adds another branch point specifically in Phase 4.

### Pattern: Self-review checklist (build.md:217-224)

`/build` Step 3 already has a self-review checklist for when dispatch is unavailable:

```markdown
**If dispatch unavailable:**
Self-review the plan against this checklist:
- All acceptance criteria from BUILD_ORDER are addressed
- File paths and imports are correct
- Code samples are copy-pasteable (not pseudocode)
- Validation commands are included for every task
- No circular dependencies between tasks
- Testing strategy covers the acceptance criteria
If issues found, fix them before proceeding.
```

The auto-approve checklist reuses these same criteria — they represent the quality bar for plan approval.

---

## STEP-BY-STEP TASKS

### Step 1: Add `--auto-approve` flag to Usage section

**IMPLEMENT:**

In `.opencode/commands/planning.md`, find the Feature/Arguments line (line 9):

**Current:**
```markdown
## Feature: $ARGUMENTS
```

**Replace with:**
```markdown
## Feature: $ARGUMENTS

**Flags** (parsed from `$ARGUMENTS`):
- `--auto-approve` (optional): Skip Phase 4 interactive approval gate. The plan preview is still generated and logged, but approval is automatic via self-review checklist instead of user prompt. Used by `/build` when dispatching to `/planning` for autonomous operation.

When flags are present in `$ARGUMENTS`, strip them before parsing the remaining value as the feature name or spec ID.
```

**PATTERN:** Follows `/code-loop`'s flag documentation style — flag name, "(optional)" tag, description of behavior, and use case.

**GOTCHA:** The flag must be stripped from `$ARGUMENTS` before the feature name parsing in Phase 1 (lines 54-65). Otherwise `$ARGUMENTS` would be `"P1-03 --auto-approve"` and fail to match as a spec ID.

**VALIDATE:** Read planning.md lines 9-16 and confirm the flag documentation is present and clear.

### Step 2: Add conditional auto-approve branch to Phase 4

**IMPLEMENT:**

In `.opencode/commands/planning.md`, find Phase 4 (lines 180-200):

**Current:**
```markdown
## Phase 4: Preview (Approval Gate)

Before writing the full plan, show a **1-page preview**:

```
PLAN PREVIEW: {spec-name}
=============================

What:      {1-line description}
Approach:  {the locked-in approach}
Files:     {create: X, modify: Y}
Key decision: {the main architectural choice and why}
Risks:     {top 1-2 risks}
Tests:     {testing approach}
Estimated tasks: {N tasks}
Mode:      {Task Briefs (N briefs, default) | Master + Sub-Plans (N phases, escape hatch)}

Approve this direction to write the full plan? [y/n/adjust]
```

Only write the plan file after explicit approval.
```

**Replace with:**
```markdown
## Phase 4: Preview (Approval Gate)

Before writing the full plan, show a **1-page preview**:

```
PLAN PREVIEW: {spec-name}
=============================

What:      {1-line description}
Approach:  {the locked-in approach}
Files:     {create: X, modify: Y}
Key decision: {the main architectural choice and why}
Risks:     {top 1-2 risks}
Tests:     {testing approach}
Estimated tasks: {N tasks}
Mode:      {Task Briefs (N briefs, default) | Master + Sub-Plans (N phases, escape hatch)}
```

### If `--auto-approve` is set:

Run the self-review checklist instead of prompting the user:

1. All acceptance criteria from the spec (BUILD_ORDER or feature description) are addressed in the preview
2. File paths listed are correct and exist (or will be created)
3. The approach is consistent with established project patterns
4. Testing approach covers the acceptance criteria
5. No obvious gaps in the task breakdown

**If all checklist items pass:** Log the preview (print it to output for the record), then proceed directly to Phase 5.

**If any checklist item fails:** Log the preview with the failing items noted, then STOP and surface the issue — even in autonomous mode, a fundamentally flawed plan should not proceed.

```
AUTO-APPROVED: Plan preview passed self-review checklist. Proceeding to Phase 5.
```

### If `--auto-approve` is NOT set (default):

```
Approve this direction to write the full plan? [y/n/adjust]
```

Only write the plan file after explicit approval.
```

**PATTERN:** The self-review checklist mirrors `/build` Step 3's dispatch-unavailable checklist. Same quality bar, different trigger.

**GOTCHA:** The auto-approve path must still PRINT the preview to output. This creates an audit trail — if a bad plan is auto-approved, the preview is visible in the session log for diagnosis.

**GOTCHA:** The auto-approve checklist is a SELF-review, not a rubber stamp. If the plan preview has obvious issues (missing acceptance criteria, no testing strategy, wrong files), it must fail even in autonomous mode.

**VALIDATE:** Read planning.md Phase 4 and verify:
1. The preview block is still generated in both paths
2. `--auto-approve` path has a checklist with 5 items
3. `--auto-approve` path has a failure mode (STOP on checklist failure)
4. Default path (no flag) is unchanged — still prompts for approval

---

## TESTING STRATEGY

### Structural Verification
- Read the updated `planning.md` end-to-end around the flag documentation and Phase 4
- Verify the flag documentation follows `/code-loop`'s pattern
- Verify Phase 4 branches correctly on the flag presence

### Edge Cases
- **Flag present + checklist passes**: Preview logged, auto-proceed to Phase 5
- **Flag present + checklist fails**: Preview logged with failures, STOP
- **Flag absent**: Original behavior — user prompt, wait for [y/n/adjust]
- **Flag with other arguments**: `P1-03 --auto-approve` — flag stripped, `P1-03` parsed as spec ID
- **Flag alone**: `--auto-approve` — flag stripped, empty feature name triggers "What are we building?" flow

### Cross-File Consistency
- Flag name `--auto-approve` matches exactly what Task 1 added to `/build` Step 2 dispatch prompt
- Self-review checklist items are consistent with `/build` Step 3 checklist

---

## VALIDATION COMMANDS

- **L1**: N/A — Markdown file
- **L2**: Read `planning.md` lines 9-16 and verify flag documentation
- **L2**: Read `planning.md` Phase 4 section and verify conditional branching
- **L3**: Grep for `--auto-approve` in `planning.md` — should appear in Usage and Phase 4
- **L3**: Grep for `--auto-approve` in `build.md` — should appear in Step 2 dispatch prompt (from Task 1)
- **L4**: N/A — Manual integration test
- **L5**: Human review

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] `--auto-approve` flag documented in Usage section of `planning.md`
- [ ] Flag stripping instruction present (strip flags before parsing feature name)
- [ ] Phase 4 has conditional branch: `--auto-approve` set vs not set
- [ ] Auto-approve path has self-review checklist (5 items)
- [ ] Auto-approve path prints preview to output (audit trail)
- [ ] Auto-approve path has failure mode (STOP on checklist failure)
- [ ] Default path (no flag) is UNCHANGED — still prompts for user approval
- [ ] Flag name matches `/build` Step 2 dispatch prompt exactly

### Runtime
- [ ] `/planning feature-name --auto-approve` would skip the approval prompt
- [ ] `/planning feature-name` (no flag) would still prompt for approval
- [ ] `/build` dispatching `/planning` with `--auto-approve` would get an auto-approved plan

---

## HANDOFF NOTES

Task 3 is independent of this task (edits a different file: `code-loop.md`). No dependency.

The `--auto-approve` flag in `/planning` is now the mechanism that `/build` uses to get autonomous plan approval. If future commands need to call `/planning` autonomously, they should use the same flag.

---

## COMPLETION CHECKLIST

- [ ] Flag documentation added to Usage section
- [ ] Flag stripping instruction added
- [ ] Phase 4 conditional branch implemented
- [ ] Self-review checklist present in auto-approve path
- [ ] Failure mode present in auto-approve path
- [ ] Default behavior unchanged
- [ ] File is valid Markdown with no broken code blocks
