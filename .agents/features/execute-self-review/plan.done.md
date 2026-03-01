# Feature: Execute Self-Review

## Feature Description

Add a structured self-review step to `/execute` that forces the agent to cross-check its implementation against every task, acceptance criterion, and file target in the plan before writing the execution report. The step asks "did we implement everything?" and produces a concise summary of what was done, what diverged, and what (if anything) was missed. This replaces the current shallow Step 5 ("Final Verification") with a rigorous, evidence-based self-audit.

## User Story

As a developer using this AI coding system, I want `/execute` to self-check its own work against the plan before declaring done, so that missed tasks and silent omissions are caught before the report is written.

## Problem Statement

The current Step 5 ("Final Verification") in `/execute` is a 5-line checklist:
```
- All tasks completed
- All tests passing
- All validations pass
- Code follows project conventions
- Slice remained focused (single outcome, no mixed-scope spillover)
```

This is too shallow. Three specific problems:

1. **No plan cross-reference**: The checklist says "all tasks completed" but doesn't instruct the agent to actually re-read the plan and verify each task. An agent can check this box based on a vague sense of completion rather than evidence.

2. **No structured output**: The verification produces no artifact. The agent goes from "yes I think it's done" straight to writing the report. There's no intermediate summary that could catch gaps before they're buried in the report.

3. **No gap resolution protocol**: If something IS missing, there's no instruction on what to do — fix it? skip it? document it? The agent has to improvise, which leads to inconsistent behavior.

The result: missed tasks slip through, the execution report says "all done" when it isn't, and the gap is only caught later by `/code-review` or `/system-review` — wasting a review cycle.

## Solution Statement

- **Decision 1**: Replace Step 5 with a structured "Self-Review" that has four sub-steps (Task Cross-Check, Acceptance Criteria Cross-Check, File Inventory, Implementation Summary) — because a structured walk-through catches more than a generic checklist.
- **Decision 2**: The self-review must re-read the plan file, not rely on memory — because context compaction or long execution runs can cause the agent to lose track of early tasks. This is the single most important design decision.
- **Decision 3**: The summary produced by the self-review uses a fixed format that feeds directly into the execution report — because it eliminates redundant analysis and ensures the report data comes from a genuine cross-check.
- **Decision 4**: An INCOMPLETE verdict triggers a resolution protocol (fix or document) before proceeding — because silent omissions are worse than documented skips.

## Feature Metadata

- **Feature Type**: Enhancement
- **Estimated Complexity**: Low
- **Primary Systems Affected**: `/execute` command, execution report template (path update only)
- **Dependencies**: None

### Slice Guardrails (Required)

- **Single Outcome**: `/execute` Step 5 is replaced with a rigorous self-review step, and the execution report template gets an updated "Self-Review Summary" section
- **Expected Files Touched**: 2 files (`.opencode/commands/execute.md`, `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md`)
- **Scope Boundary**: Does NOT change the report's other sections. Does NOT change how Steps 1-4 or Step 6 work. Does NOT affect `/code-review` or `/system-review` commands.
- **Split Trigger**: If the self-review requires changes to how Steps 2 or 6 track task status, split that into a follow-up.

---

## CONTEXT REFERENCES

### Relevant Codebase Files

> IMPORTANT: The execution agent MUST read these files before implementing!

- `.opencode/commands/execute.md` (all 265 lines) — Why: PRIMARY target. Step 5 at lines 148-154 is being replaced. Step 4 (lines 138-146) is the predecessor; Step 6 (lines 156-162) is the successor. The execution report output section (lines 198-265) is the consumer of the self-review's output.
- `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` (all 180 lines) — Why: SECONDARY target. The Completion Sweep section (lines 173-180) has stale paths, and the template needs a Self-Review Summary section added between Meta Information and Completed Tasks.

### New Files to Create

None — both are modifications of existing files.

### Related Memories (from memory.md)

No relevant memories found in memory.md (memory.md does not exist in this repo).

### Relevant Documentation

None required — this is an internal process improvement.

### Patterns to Follow

**Existing step structure pattern** (from `.opencode/commands/execute.md:76-93`):
```markdown
### 2. Execute Tasks in Order

For EACH task in "Step by Step Tasks":

**a.** Read the task and any existing files being modified.

**b.** Implement the task following specifications exactly. Maintain consistency with existing patterns.

**c.** Verify: check syntax, imports, types after each change.

**d.** Track divergences (if implementation differs from plan):
   - Note what changed and why
   - Classify as Good or Bad divergence (see Divergence Classification below)
   - Document in execution report

**e.** If Archon connected: `manage_task("update", task_id="...", status="done")` for completed task.

**f.** Move to the next task.
```
- Why this pattern: Steps use `### N. Title` headings with bold-letter sub-steps (`**a.**`, `**b.**`). The new Step 5 must follow this convention exactly.
- Common gotchas: Keep sub-steps concise — the agent reads this as instructions, not prose. Each sub-step should be actionable in one pass.

**Execution report "Completed Tasks" section** (from `.opencode/commands/execute.md:218-221`):
```markdown
### Completed Tasks

For each task in the plan:
- Task N: {brief description} — {completed / skipped with reason}
```
- Why this pattern: The self-review's 5a sub-step produces exactly this data — per-task status with Done/Diverged/Skipped/Partial. The report section should be writable directly from the self-review output.

**Execution report "Skipped Items" section** (from `.opencode/commands/execute.md:235-241`):
```markdown
### Skipped Items

List anything from the plan that was NOT implemented:
- **{Item}**: {what was skipped}
  - **Reason**: {why it was skipped}

If none: "None — all planned items implemented."
```
- Why this pattern: The self-review's 5a "Skipped" status and 5d gap list feed directly into this section.

**Execution report template "Completed Tasks" section** (from `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md:24-32`):
```markdown
## Completed Tasks

For each task in the plan:

- **Task {N}**: {brief description} — {completed / skipped with reason}
- **Task {N}**: {brief description} — {completed / skipped with reason}

**Summary**: {X}/{Y} tasks completed ({Z}%)
```
- Why this pattern: The template already expects per-task status. The self-review produces this data, the report consumes it. No format change needed in this section.

**Adjacent Step 4 (Validation) output** (from `.opencode/commands/execute.md:138-146`):
```markdown
### 4. Run Validation Commands

Execute ALL validation commands from the plan in order. Fix failures before continuing.

Validation policy (non-skippable):
- Every execution loop must run full validation depth for the current slice.
- Minimum expected pyramid: syntax/style → type safety → unit tests → integration tests → manual verification.
- Do not treat single checks as sufficient proof of completion.
- Use project-configured commands from `.opencode/config.md` or auto-detected by `/prime`.
```
- Why this pattern: Step 4 runs validations. Step 5 (self-review) confirms everything passed. The flow is: run validations → self-review confirms results → update checkboxes. Step 5 must reference Step 4's results, not re-run them.

**Adjacent Step 6 (Update Checkboxes)** (from `.opencode/commands/execute.md:156-162`):
```markdown
### 6. Update Plan Checkboxes

Mandatory after successful execution:
- Update the executed plan file in place.
- In `ACCEPTANCE CRITERIA` and `COMPLETION CHECKLIST`, convert completed items from `- [ ]` to `- [x]`.
- Leave unmet items unchecked and append a short blocker note on that line.
- Never mark an item `- [x]` unless validation evidence exists in this run.
```
- Why this pattern: Step 6 updates checkboxes based on what the self-review found. The "never mark `- [x]` unless validation evidence exists" rule is enforced by 5b (acceptance criteria cross-check). If 5b flagged a criterion as not met, Step 6 must leave it unchecked.

---

## IMPLEMENTATION PLAN

### Phase 1: Core — Replace Step 5 in execute.md

Replace the lightweight Step 5 with the structured self-review step.

**Tasks:**
- Task 1: Replace Step 5 content in execute.md
- Task 2: Add Self-Review Summary section to execution report template
- Task 3: Fix stale paths in execution report template (while we're touching it)

---

## STEP-BY-STEP TASKS

### Task 1: UPDATE `.opencode/commands/execute.md` — Replace Step 5

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/execute.md`
- **IMPLEMENT**: Replace the current Step 5 (lines 148-154) with a structured self-review step. The new content must:
  - Use `### 5.` heading format (matching existing steps)
  - Use bold-letter sub-steps (`**5a.**`, `**5b.**`, etc.)
  - Include four sub-steps: task cross-check, acceptance criteria cross-check, file inventory, implementation summary
  - Include the SELF-REVIEW SUMMARY format block
  - Include INCOMPLETE/COMPLETE verdict with resolution protocol
  - Explicitly instruct the agent to re-read the plan file

  **Current** (lines 148-154):
  ```markdown
  ### 5. Final Verification

  - All tasks completed
  - All tests passing
  - All validations pass
  - Code follows project conventions
  - Slice remained focused (single outcome, no mixed-scope spillover)
  ```

  **Replace with**:
  ```markdown
  ### 5. Self-Review (Plan Cross-Check)

  Before writing the report, re-read the plan file and systematically verify every commitment was met. This is not a rubber stamp — genuinely question whether each item was done.

  **5a. Task-by-task cross-check:**

  Re-read the plan's STEP-BY-STEP TASKS section. For each task, verify:
  - Was the ACTION performed on the correct TARGET file?
  - Does the implementation match what IMPLEMENT specified?
  - Was the VALIDATE command run and did it pass?
  - If anything diverged, was it tracked as a divergence in Step 2d?

  Record a status for each task:
  - **Done** — implemented as planned
  - **Done (diverged)** — implemented differently, divergence already tracked
  - **Skipped** — not implemented, with reason
  - **Partial** — partially implemented, with what's missing

  **5b. Acceptance criteria cross-check:**

  Re-read the plan's ACCEPTANCE CRITERIA section (both Implementation and Runtime). For each criterion:
  - Is there concrete evidence from this run that proves it's met?
  - If a criterion cannot be verified yet (e.g., runtime-only), mark as "deferred to runtime"
  - If a criterion was NOT met, flag it — do NOT mark it `[x]` in Step 6

  **5c. File inventory check:**

  Compare what was actually created/modified against the plan:
  - Were all "New Files to Create" actually created?
  - Were all files in "Expected Files Touched" actually touched?
  - Were any files changed that the plan did NOT mention? (flag as unplanned)

  **5d. Implementation summary:**

  Produce a concise summary using this exact format:

  ```
  SELF-REVIEW SUMMARY
  ====================
  Tasks:      {completed}/{total} ({skipped} skipped, {diverged} diverged)
  Files:      {added} added, {modified} modified ({unplanned} unplanned)
  Acceptance: {met}/{total} implementation criteria met ({deferred} deferred to runtime)
  Validation: L1 {pass/fail} | L2 {pass/fail} | L3 {pass/fail} | L4 {pass/fail} | L5 {pass/fail}
  Gaps:       {list any gaps, or "None"}
  Verdict:    {COMPLETE | INCOMPLETE — see gaps above}
  ```

  Display this summary inline to the user before writing the report.

  **If verdict is INCOMPLETE:**
  - List each gap with its source (task number, criterion, or file)
  - For each gap, decide: fix now (return to Step 2) or accept and document as skipped
  - Do NOT proceed to Step 6 until all gaps are resolved or explicitly accepted as skips
  - If returning to fix, re-run the self-review after the fix

  **If verdict is COMPLETE:**
  - Proceed to Step 6
  - The summary data feeds directly into the execution report sections:
    - Task statuses → "Completed Tasks" section
    - Divergences → "Divergences from Plan" section
    - Skipped items → "Skipped Items" section
    - File inventory → "Meta Information" section (files added/modified)

  **Series Mode note:** In Master + Sub-Plan execution, run this self-review after EACH phase sub-plan, not just at the end. Each phase gets its own summary. The final phase summary covers the whole feature.
  ```

  **Example of a good self-review** (include as a reference comment in the plan, NOT in execute.md):
  ```
  SELF-REVIEW SUMMARY
  ====================
  Tasks:      11/12 (1 skipped, 2 diverged)
  Files:      1 added, 10 modified (1 unplanned: VIBE-PLANNING-GUIDE.md)
  Acceptance: 14/15 implementation criteria met (0 deferred to runtime)
  Validation: L1 N/A | L2 N/A | L3 N/A | L4 N/A | L5 pass
  Gaps:       1 — Task 12 verification found residuals in out-of-scope files (accepted as follow-up)
  Verdict:    COMPLETE
  ```

  **Example of a bad (rubber-stamp) self-review** that this step is designed to prevent:
  ```
  All tasks done. All tests pass. Ready for report.
  ```
  ^ This is exactly what the old Step 5 allowed. The structured format makes this impossible — you MUST fill in task counts, file counts, criteria counts.

- **PATTERN**: Follow `.opencode/commands/execute.md:76-93` — `### N.` heading with bold-letter sub-steps
- **IMPORTS**: N/A (markdown file)
- **GOTCHA**: The self-review MUST re-read the plan file, not rely on memory. This is critical — context compaction or long execution runs can cause the agent to lose track of early tasks. The instruction "re-read the plan file" is intentional and non-negotiable. Also: the SELF-REVIEW SUMMARY contains a markdown code fence (triple backticks) inside the execute.md content. Make sure the fences are properly nested/escaped in the final file.
- **VALIDATE**: Read `execute.md` and verify: (1) Step 5 heading says "Self-Review (Plan Cross-Check)", (2) Sub-steps 5a through 5d are present, (3) SELF-REVIEW SUMMARY format block is present with all 6 fields (Tasks, Files, Acceptance, Validation, Gaps, Verdict), (4) INCOMPLETE verdict has fix-or-document instructions, (5) Series Mode note is present, (6) Step numbering 4 → 5 → 6 is preserved.

---

### Task 2: UPDATE `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` — Add Self-Review Summary section

- **ACTION**: UPDATE
- **TARGET**: `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md`
- **IMPLEMENT**: Add a "Self-Review Summary" section between "Meta Information" and "Completed Tasks". This is where the agent pastes the output from Step 5d.

  **Current** (lines 21-24):
  ```markdown
  ---

  ## Completed Tasks
  ```

  **Replace with**:
  ```markdown
  ---

  ## Self-Review Summary

  > Paste the SELF-REVIEW SUMMARY from Step 5d here.

  ```
  SELF-REVIEW SUMMARY
  ====================
  Tasks:      {completed}/{total} ({skipped} skipped, {diverged} diverged)
  Files:      {added} added, {modified} modified ({unplanned} unplanned)
  Acceptance: {met}/{total} implementation criteria met ({deferred} deferred to runtime)
  Validation: L1 {pass/fail} | L2 {pass/fail} | L3 {pass/fail} | L4 {pass/fail} | L5 {pass/fail}
  Gaps:       {list any gaps, or "None"}
  Verdict:    {COMPLETE | INCOMPLETE — see gaps above}
  ```

  ---

  ## Completed Tasks
  ```

- **PATTERN**: Follow existing template structure — `## Section` headings with guidance comments in blockquotes
- **IMPORTS**: N/A
- **GOTCHA**: The template uses `---` horizontal rules between sections. Make sure the new section has `---` before and after it, consistent with the rest of the template.
- **VALIDATE**: Read `EXECUTION-REPORT-TEMPLATE.md` and verify: (1) "Self-Review Summary" section exists between Meta Information and Completed Tasks, (2) The SELF-REVIEW SUMMARY format block is present, (3) Section ordering is correct.

---

### Task 3: UPDATE `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md` — Fix stale paths in Completion Sweep

- **ACTION**: UPDATE
- **TARGET**: `.opencode/templates/EXECUTION-REPORT-TEMPLATE.md`
- **IMPLEMENT**: Update the Completion Sweep section at the bottom (lines 173-180) to use the new `.agents/features/` paths from the prior commit's reorganization.

  **Current** (lines 1, 173-180):
  ```markdown
  > Save implementation reports to `.agents/reports/{feature}-report.md`
  ...
  ## Completion Sweep

  > Before finishing, rename same-feature artifacts with `.done.md` suffix:

  - `.agents/reviews/{feature}*.md` → `.agents/reviews/{feature}*.done.md`
  - `.agents/reports/loops/{feature}*.md` → `.agents/reports/loops/{feature}*.done.md`

  **Completed**: {yes/no — confirm all same-feature artifacts renamed}
  ```

  **Replace line 1 with**:
  ```markdown
  > Save implementation reports to `.agents/features/{feature}/report.md`
  ```

  **Replace lines 173-180 with**:
  ```markdown
  ## Completion Sweep

  > Before finishing, rename completed artifacts within `.agents/features/{feature}/`:

  - `plan.md` → `plan.done.md` (plan fully executed)
  - `plan-phase-{N}.md` → `plan-phase-{N}.done.md` (per completed phase)
  - `plan-master.md` → `plan-master.done.md` (only when ALL phases done)
  - `review.md` → `review.done.md` (if findings addressed)
  - `review-{N}.md` → `review-{N}.done.md` (code-loop reviews)
  - `loop-report-{N}.md` → `loop-report-{N}.done.md` (code-loop reports)

  **Completed**: {yes/no — confirm all same-feature artifacts renamed}
  ```

- **PATTERN**: Same `.agents/features/` path convention from the prior commit's reorganization
- **IMPORTS**: N/A
- **GOTCHA**: This is technically a residual fix from the prior slice (the execution report template was flagged as out-of-scope). Since we're already touching this file for Task 2, it's efficient to fix the paths now rather than creating a separate slice.
- **VALIDATE**: Grep `EXECUTION-REPORT-TEMPLATE.md` for `.agents/reports/` and `.agents/reviews/` — should find zero matches. All paths should use `.agents/features/`.

---

## TESTING STRATEGY

### Unit Tests

N/A — markdown configuration files, no test runner.

### Integration Tests

N/A — manual verification only.

### Edge Cases

- **Edge case 1**: All tasks completed perfectly — self-review should still walk through each one (not skip the check because "everything seemed fine"). The structured format enforces this: you must fill in task counts.
- **Edge case 2**: Context compaction during a long execution — the instruction to "re-read the plan file" ensures the agent refreshes its understanding rather than relying on potentially stale memory.
- **Edge case 3**: Plan has no acceptance criteria section — sub-step 5b should note "No acceptance criteria in plan — skipping criteria cross-check" and proceed.
- **Edge case 4**: Series mode (master + sub-plans) — the self-review runs after each phase sub-plan, producing a per-phase summary. The final phase also produces a whole-feature summary.
- **Edge case 5**: Agent discovers a genuine gap during self-review — the INCOMPLETE protocol instructs it to either fix (loop back to Step 2) or accept the skip (document in report). It must not silently ignore.
- **Edge case 6**: Unplanned file changes — sub-step 5c catches files modified that weren't in the plan. These should be flagged as "unplanned" in the summary, not hidden.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```
N/A — markdown files
```

### Level 2: Type Safety
```
N/A — markdown files
```

### Level 3: Unit Tests
```
N/A — no test runner
```

### Level 4: Integration Tests
```
N/A — manual verification
```

### Level 5: Manual Validation

1. Read `execute.md`:
   - Verify Step 5 heading reads "Self-Review (Plan Cross-Check)"
   - Verify sub-steps 5a, 5b, 5c, 5d are all present
   - Verify SELF-REVIEW SUMMARY format has all 6 fields: Tasks, Files, Acceptance, Validation, Gaps, Verdict
   - Verify INCOMPLETE verdict has fix-or-document instructions
   - Verify COMPLETE verdict describes how summary feeds into report sections
   - Verify Series Mode note is present
   - Verify step numbering 4 → 5 → 6 is intact (no gaps, no duplicates)
   - Verify "re-read the plan file" instruction is explicit

2. Read `EXECUTION-REPORT-TEMPLATE.md`:
   - Verify "Self-Review Summary" section exists between Meta Information and Completed Tasks
   - Verify the SELF-REVIEW SUMMARY format block is present
   - Verify Completion Sweep section uses `.agents/features/` paths
   - Verify save path in line 1 uses `.agents/features/{feature}/report.md`
   - Grep for `.agents/reports/` and `.agents/reviews/` — should find zero matches

### Level 6: Additional Validation

```bash
# Verify no old paths remain in the template
rg "\.agents/reports/|\.agents/reviews/" .opencode/templates/EXECUTION-REPORT-TEMPLATE.md
# Expected: no output (zero matches)
```

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [x] Step 5 heading reads "Self-Review (Plan Cross-Check)"
- [x] Sub-step 5a (task-by-task cross-check) is present with Done/Diverged/Skipped/Partial statuses
- [x] Sub-step 5b (acceptance criteria cross-check) is present
- [x] Sub-step 5c (file inventory check) is present
- [x] Sub-step 5d (implementation summary) is present with SELF-REVIEW SUMMARY format
- [x] SELF-REVIEW SUMMARY has all 6 fields: Tasks, Files, Acceptance, Validation, Gaps, Verdict
- [x] INCOMPLETE verdict has clear fix-or-document instructions
- [x] COMPLETE verdict describes data flow to report sections
- [x] Step explicitly instructs agent to re-read the plan file
- [x] Series Mode note is present
- [x] Step numbering (4 → 5 → 6) is preserved — no gaps or duplicates
- [x] Execution report template has "Self-Review Summary" section between Meta Info and Completed Tasks
- [x] Execution report template Completion Sweep uses `.agents/features/` paths
- [x] No stale `.agents/reports/` or `.agents/reviews/` paths remain in execution report template

### Runtime (verify after testing/deployment)

- [ ] Running `/execute` produces a SELF-REVIEW SUMMARY displayed to user before the report
- [ ] Missed tasks are caught by the cross-check and either fixed or documented
- [ ] The execution report includes the Self-Review Summary section

---

## COMPLETION CHECKLIST

- [x] Task 1 completed (Step 5 replaced in execute.md)
- [x] Task 2 completed (Self-Review Summary section added to report template)
- [x] Task 3 completed (stale paths fixed in report template)
- [x] All task validations passed
- [x] Manual verification confirms Step 5 content is correct
- [x] Step numbering intact
- [x] Report template structure is correct
- [x] No stale paths remain in report template
- [x] Acceptance criteria all met

---

## NOTES

### Key Design Decisions
- **Replace Step 5 rather than adding Step 5.5**: Avoids renumbering all subsequent steps (6, 6.5, 6.6) which are referenced elsewhere. The old Step 5 content ("all tasks completed, all tests passing") was too thin to justify keeping — all of that is now covered with evidence in the structured self-review.
- **Explicit "re-read the plan file" instruction**: Prevents the agent from relying on potentially stale context after a long execution. Forces a fresh comparison against the source of truth. This is the single most important design decision in this feature.
- **Summary format matches report sections**: The SELF-REVIEW SUMMARY produces exactly the data needed for the Completed Tasks, Divergences, Skipped Items, and Meta Information sections of the execution report. No redundant analysis — write the summary once, paste it into the report.
- **INCOMPLETE verdict loops back**: Instead of silently proceeding with gaps, the agent must explicitly choose to fix (return to Step 2) or accept (document as skipped). This eliminates the "it's probably fine" failure mode.
- **Series Mode per-phase summaries**: For master + sub-plan execution, each phase gets its own self-review. This catches phase-level gaps before they propagate to later phases. The final phase summary covers the whole feature.
- **Fix stale paths while touching the template**: Task 3 is technically a residual from the prior artifact reorganization slice. Since Task 2 already touches the file, it's efficient to fix paths in the same edit rather than creating a separate 1-task plan for it.

### Risks
- **Risk 1**: Agent might treat the self-review as a rubber stamp (check everything as "done" without actually verifying). **Mitigation**: The structured format requires specific counts and statuses per task, per criterion, per file. You can't rubber-stamp a format that demands numbers.
- **Risk 2**: The nested markdown code fences (SELF-REVIEW SUMMARY format inside execute.md) might break if not properly escaped. **Mitigation**: Use indentation or different fence styles (tildes vs backticks) to avoid nesting conflicts. The execution agent must verify the fences render correctly.

### Confidence Score: 9/10
- **Strengths**: Clear replacement targets, exact content specified, addresses a real gap in the current process, 3 small tasks with no dependencies between them
- **Uncertainties**: Agent compliance with "genuinely question" instruction (can't enforce rigor, only instruct it). Markdown fence nesting in execute.md.
- **Mitigations**: The structured format makes rubber-stamping mechanically harder. Fence nesting can be verified by reading the file after edit.
