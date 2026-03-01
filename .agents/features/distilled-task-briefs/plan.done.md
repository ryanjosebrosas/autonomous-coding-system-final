# Feature: Distilled Task Briefs

## Feature Description

Make `/planning` produce per-task execution briefs (`task-N.md`) as its default output mode. Each task brief is a self-contained 700-1000 line document scoped to one `/execute` session worth of work. The full `plan.md` stays as the human-readable source of truth and overview, while task briefs carry the execution detail. `/execute` auto-detects task brief files (like it auto-detects master plan phases) and executes one per session.

## User Story

As a developer using the AI coding system, I want planning output to be split into per-task execution briefs, so that each `/execute` session loads only what it needs — reducing context window pressure and making execution simpler.

## Problem Statement

Current plans are 700-1400 lines with ~200 lines of advisory sections (Feature Description, User Story, Problem Statement, Solution Statement, Risks, Confidence Score) that `/execute` loads but never operationally uses. Master plan sessions can load ~2700 lines / 122KB from plan artifacts alone. Plans get re-read 3 times during execution. The system has zero compression or distillation mechanisms — it relies on context window size being sufficient rather than reducing what's loaded.

The 700-line minimum is enforced per plan, meaning even simple features produce a single dense artifact. Multi-session execution requires the master plan system which adds complexity (master plan + sub-plan + shared context references + handoff notes between phases).

## Solution Statement

- **Decision 1**: Task brief mode becomes the new default — replacing the old "single plan only" mode. When `/planning` runs, it always produces `plan.md` (overview + task index) + `task-1.md` through `task-N.md` (execution briefs).
- **Decision 2**: `plan.md` stays as the source of truth with full context (700-line minimum). It adds a TASK INDEX table listing all task briefs with scope and status.
- **Decision 3**: Each `task-N.md` is 700-1000 lines, self-contained, every line operational. No advisory sections — just steps, code, validation, and acceptance criteria.
- **Decision 4**: `/execute plan.md` auto-detects task briefs in the same directory (like master plan phase detection). Finds the next undone `task-N.md`, executes it, writes handoff.
- **Decision 5**: Master plan system stays available for very large features (10+ tasks, multiple distinct phases with heavy cross-cutting concerns). It's the escape hatch, not the default.
- **Decision 6**: One task brief = one coherent unit of work. Splitting is by judgment — "what's the smallest meaningful change you can ship in one session?"

## Feature Metadata

- **Feature Type**: Enhancement
- **Estimated Complexity**: Medium
- **Primary Systems Affected**: Planning command, Execute command, Prime command, AGENTS.md, templates, build command
- **Dependencies**: None — this is a system configuration change
- **Total Tasks**: 7

### Slice Guardrails

- **Single Outcome**: `/planning` produces task brief files as default output; `/execute` auto-detects and runs them one per session
- **Expected Files Touched**: 7 files modified, 1 file created
- **Scope Boundary**: Does NOT change master plan system, does NOT change code-loop/code-review/commit/pr commands, does NOT fix stale path references in reference/ docs
- **Split Trigger**: If template design requires iteration based on real-world usage feedback

---

## CONTEXT REFERENCES

### Relevant Codebase Files

> IMPORTANT: The execution agent MUST read these files before implementing!

- `.opencode/commands/planning.md` (all 384 lines) — The planning command being modified. Key sections: Phase 5 (lines 204-260), Output (lines 263-278), Pipeline Handoff (lines 287-315), After Writing (lines 319-346)
- `.opencode/commands/execute.md` (all 387 lines) — The execute command being modified. Key sections: Step 0.5 (lines 40-58), Step 1 (lines 60-66), Step 2.5 (lines 129-168), Step 6.6 (lines 293-301), Step 6.7 (lines 303-318)
- `.opencode/commands/prime.md` (lines 175-296) — Pending work detection and display. Key sections: Step 3.5 (lines 175-206), Pending Work display in both modes (lines 228-236, 280-288)
- `AGENTS.md` (all 148 lines) — System documentation. Key sections: Dynamic Content (lines 33-47), .done.md Lifecycle (lines 49-60), Handoff File (lines 62-76), Session Model (lines 78-108)
- `.opencode/commands/build.md` (lines 125-283) — Build command plan mode detection and paths. Key sections: Step 2 (lines 145-184), Step 4 (lines 243-259), Step 5 (lines 263-283)
- `.opencode/templates/STRUCTURED-PLAN-TEMPLATE.md` (291 lines) — Current single plan template. Reference for task brief template design.
- `.opencode/templates/SUB-PLAN-TEMPLATE.md` (278 lines) — Current sub-plan template. Closest analog to the new task brief template.
- `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` (lines 190-201) — Completion sweep section needs task-N.md rename rules

### New Files to Create

- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — Template for individual task brief files (700-1000 lines target)

### Related Memories

No relevant memories found in memory.md (memory.md does not exist).

### Relevant Documentation

None — this is an internal system change. All context is in the codebase files listed above.

### Patterns to Follow

**Master plan phase detection pattern** (from `execute.md:44-52`):
```markdown
**If file path contains `plan-master.md`**: This is a multi-phase feature. Execute ONE phase per session:
1. Extract phase sub-plan paths from the SUB-PLAN INDEX table at the bottom of the master plan
2. Scan `.agents/features/{feature}/` for `plan-phase-{N}.done.md` files to determine which phases are complete
3. Identify the next undone phase (lowest N without a matching `.done.md`)
4. **If ALL phases are done** → report complete, write handoff, stop
5. **If a next phase exists** → execute it, proceed to Step 2.5
```
- Why this pattern: Task brief detection mirrors this exactly — scan for `task-{N}.done.md`, find next undone, execute one per session
- Common gotchas: Must handle the case where plan.md exists but has NO task-N.md files (legacy single plan — fall through to old behavior)

**Phase completion handoff pattern** (from `execute.md:135-148`):
```markdown
**If more phases remain** — write handoff:
- **Last Command**: /execute (phase {N} of {total})
- **Next Command**: /execute .agents/features/{feature}/plan-master.md
- **Status**: executing-series
```
- Why this pattern: Task brief completion uses same structure with `executing-tasks` status
- Common gotchas: The handoff points back to plan.md (not to task-{N+1}.md directly), same as master plan points back to plan-master.md

**Artifact scan detection pattern** (from `prime.md:192-198`):
```markdown
1. If `plan.md` exists AND `plan.done.md` does NOT exist → plan awaiting execution
2. If `plan-master.md` exists AND `plan-master.done.md` does NOT exist → check phases
```
- Why this pattern: Need to add task brief detection between these two items
- Common gotchas: plan.md existing + task-N.md existing = task brief mode. plan.md existing + NO task-N.md = legacy single plan mode.

---

## IMPLEMENTATION PLAN

### Phase 1: Template (Task 1)
Create the TASK-BRIEF-TEMPLATE.md that defines the structure of each task-N.md file.

### Phase 2: Core Commands (Tasks 2-3)
Update planning.md to produce task briefs as default output. Update execute.md to auto-detect and execute them.

### Phase 3: Supporting Commands (Tasks 4-6)
Update prime.md for artifact detection, AGENTS.md for documentation, build.md for plan mode paths.

### Phase 4: Cleanup (Task 7)
Update execution-report-template and planning-research agent for task brief awareness.

---

## STEP-BY-STEP TASKS

### Task 1: CREATE `.opencode/templates/TASK-BRIEF-TEMPLATE.md`
- **ACTION**: CREATE
- **TARGET**: `.opencode/templates/TASK-BRIEF-TEMPLATE.md`
- **IMPLEMENT**: New template defining the structure of individual task brief files. Self-contained, 700-1000 lines target. Sections: Objective, Scope, Files to Read, Steps (with the 7-field format per step), Tests, Validation Commands, Acceptance Criteria, Handoff, Completion Checklist. No advisory sections.
- **PATTERN**: Follow structure of `SUB-PLAN-TEMPLATE.md` but strip advisory sections
- **GOTCHA**: Template must be usable without reading plan.md — self-contained is the whole point
- **VALIDATE**: File exists and is well-structured markdown

### Task 2: UPDATE `.opencode/commands/planning.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/planning.md`
- **IMPLEMENT**: Replace Phase 5 complexity detection to make task briefs the default. Update Output section, Pipeline Handoff section, and After Writing section. Add task brief generation after writing plan.md.
- **PATTERN**: Follow existing Phase 5 structure but add task brief mode as primary
- **GOTCHA**: Must preserve master plan mode as escape hatch. Phase 4 preview needs Mode updated.
- **VALIDATE**: Read the updated file and verify all three modes are documented with correct output paths

### Task 3: UPDATE `.opencode/commands/execute.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/execute.md`
- **IMPLEMENT**: Add task brief detection in Step 0.5, add task completion logic as Step 2.6 (parallel to Step 2.5 for phases), update Step 6.6 completion sweep, update Step 6.7 handoff. Must handle: plan.md with task files → auto-detect mode; plan.md without task files → legacy single plan.
- **PATTERN**: Mirror master plan phase detection pattern exactly
- **GOTCHA**: Step 1 "read the ENTIRE plan" now means reading the task brief, not plan.md. Step 5 self-review checks against the task brief's acceptance criteria.
- **VALIDATE**: Read updated file and verify all detection paths documented

### Task 4: UPDATE `.opencode/commands/prime.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/prime.md`
- **IMPLEMENT**: Add task brief detection in Step 3.5 Source 2 (artifact scan). Add `[tasks]` display line in Pending Work for both System Mode and Codebase Mode. Update Source 1 to recognize `Task Progress` and `executing-tasks` status fields.
- **PATTERN**: Follow existing `[master]` detection pattern
- **GOTCHA**: Must distinguish plan.md with task files (new mode) from plan.md without task files (legacy single plan)
- **VALIDATE**: Read updated file and verify task brief detection documented in both artifact scan and display sections

### Task 5: UPDATE `AGENTS.md`
- **ACTION**: UPDATE
- **TARGET**: `AGENTS.md`
- **IMPLEMENT**: Add `task-{N}.md` to artifact list. Add row to .done.md lifecycle table. Add `Task Progress` and `executing-tasks` to handoff file fields. Add "Task brief feature (default)" session model block. Update key rules.
- **PATTERN**: Follow existing master plan documentation style
- **GOTCHA**: This is the primary documentation — must be accurate and complete
- **VALIDATE**: Read updated file and verify all new artifacts documented

### Task 6: UPDATE `.opencode/commands/build.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md`
- **IMPLEMENT**: Update Step 2 plan mode detection to make task briefs default. Fix stale `.agents/plans/` paths to `.agents/features/{feature}/`. Update Step 4 commit paths and Step 5 execute paths.
- **PATTERN**: Follow existing plan mode detection structure
- **GOTCHA**: build.md has many stale path references (`.agents/plans/{spec-name}.md`) that need updating to `.agents/features/{feature}/`
- **VALIDATE**: Grep for `.agents/plans/` in the updated file — should return zero matches

### Task 7: UPDATE `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` and `.opencode/agents/planning-research.md`
- **ACTION**: UPDATE
- **TARGET**: `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` and `.opencode/agents/planning-research.md`
- **IMPLEMENT**: Add `task-{N}.md` → `task-{N}.done.md` to completion sweep in execution report template. Update planning-research agent to also scan `task-{N}.done.md` files alongside `plan.done.md`.
- **PATTERN**: Follow existing completion sweep list
- **GOTCHA**: Minor changes — don't over-engineer
- **VALIDATE**: Read updated files and verify task brief patterns included

---

## TESTING STRATEGY

### Manual Testing

This is a system configuration change (markdown command files, not code). Testing is manual:

1. Run `/planning` on a test feature and verify it produces `plan.md` + `task-N.md` files
2. Run `/execute plan.md` and verify it auto-detects task briefs, executes one, writes handoff
3. Run `/prime` and verify it shows task progress in pending work
4. Verify master plan mode still works when explicitly chosen

### Edge Cases

- Feature with only 1 task — produces plan.md + task-1.md (single brief)
- Feature with 10+ tasks — should still use task briefs unless master plan explicitly chosen
- Legacy plan.md without task files — must fall through to old single plan behavior
- Crashed session mid-task — task-N.md not renamed to .done.md, next session retries

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```
# Verify all modified markdown files are valid
# Manual: open each file and check structure
```

### Level 2: Structural Integrity
```
# Verify no broken cross-references between commands
# Grep for file paths mentioned in commands and verify they exist
```

### Level 3: Consistency Check
```
# Verify all three modes (task briefs, master plan, legacy single) are consistently documented
# across planning.md, execute.md, prime.md, AGENTS.md, build.md
```

### Level 5: Manual Validation
Run `/planning` on a real feature and verify:
- plan.md produced with TASK INDEX table
- task-N.md files produced, each 700-1000 lines
- `/execute plan.md` auto-detects and runs one task brief
- `/prime` shows correct pending work state

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [x] TASK-BRIEF-TEMPLATE.md created with all required sections
- [x] planning.md updated: task briefs are default mode, master plans preserved as escape hatch
- [x] execute.md updated: auto-detects task-N.md files, executes one per session, writes correct handoff
- [x] prime.md updated: artifact scan detects task briefs, pending work shows [tasks] line
- [x] AGENTS.md updated: artifact table, .done.md lifecycle, handoff fields, session model
- [x] build.md updated: plan mode detection, stale paths fixed
- [x] execution-report-template and planning-research agent updated

### Runtime (verify after testing/deployment)

- [ ] `/planning` produces task brief files as default output
- [ ] `/execute plan.md` correctly auto-detects and executes one task brief per session
- [ ] `/prime` correctly shows task progress in pending work
- [ ] Master plan mode still works when needed
- [ ] Legacy plan.md (without task files) still works

---

## COMPLETION CHECKLIST

- [x] All 7 tasks completed in order
- [x] Each task validation passed
- [x] All modified files are internally consistent
- [x] Cross-references between commands are correct
- [x] No stale paths remain in modified files
- [ ] Manual testing confirms the pipeline works end-to-end — deferred to runtime

---

## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.md` | Create TASK-BRIEF-TEMPLATE.md | pending | 1 created |
| 2 | `task-2.md` | Update planning.md — new default mode + task brief generation | pending | 1 modified |
| 3 | `task-3.md` | Update execute.md — auto-detect task briefs + completion logic | pending | 1 modified |
| 4 | `task-4.md` | Update prime.md — artifact scan + pending work display | pending | 1 modified |
| 5 | `task-5.md` | Update AGENTS.md — documentation + session model | pending | 1 modified |
| 6 | `task-6.md` | Update build.md — plan mode + stale path fixes | pending | 1 modified |
| 7 | `task-7.md` | Update execution-report-template + planning-research agent | pending | 2 modified |

---

## NOTES

### Key Design Decisions
- Task briefs replace single plan mode as default — simplifies the mental model (plan.md is always an overview, execution always happens through briefs)
- Master plan system kept as escape hatch — provides backward compatibility and handles genuinely complex multi-phase features
- 700-1000 lines per brief enforced — ensures briefs are rigorous execution documents, not thin summaries
- Auto-detection mirrors phase detection — users don't need to learn new commands, just `/execute plan.md`

### Risks
- **Risk 1**: 700-1000 lines per brief may be too much for simple single-file tasks → Mitigation: splitting logic is by judgment, not formula. A "rename one variable" task doesn't get its own 700-line brief.
- **Risk 2**: Existing plans without task files may break → Mitigation: explicit fallback in execute.md — plan.md without task files = legacy single plan mode.

### Confidence Score: 8/10
- **Strengths**: Clear design, mirrors existing patterns, backward compatible
- **Uncertainties**: Template sizing needs real-world validation — will 700 lines fill naturally for typical tasks?
- **Mitigations**: First run through a real feature will validate sizing, template can be iterated
