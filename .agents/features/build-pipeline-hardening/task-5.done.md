# Task 5 of 5: Review Logic + Backward Repair + Template Fix

> **Feature**: `build-pipeline-hardening`
> **Brief Path**: `.agents/features/build-pipeline-hardening/task-5.md`
> **Plan Overview**: `.agents/features/build-pipeline-hardening/plan.md`

---

## OBJECTIVE

Fix Step 7e to re-validate after REJECT fix, add non-dispatch fallback to Step 7b consensus gating, flesh out backward repair with a concrete workflow, and update BUILD-ORDER-TEMPLATE to match `/build`'s plan size policy.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/build.md` | UPDATE | Steps 7b, 7e rewritten; Backward Repair expanded |
| `.opencode/templates/BUILD-ORDER-TEMPLATE.md` | UPDATE | Complexity Guide table corrected |

**Out of Scope:**
- Steps 7a, 7c, 7d — no changes needed. The dispatch patterns and fix loops are correct.
- AGENTS.md — `ready-to-ship` status documentation is a follow-up, not part of this task.

**Dependencies:**
- Tasks 1-4 must complete first. All Step 8/9 changes, inline contract, and checkpointing are in place.

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Task(s):**
- `.opencode/commands/build.md` — Step 8 delegates to `/commit`; Steps 4/9 have error handling; dispatch timeout fallbacks; per-step checkpointing; handoff writes at all stop points; Context Management rewritten
- `.opencode/commands/execute.md` — Inline-from-build override in Steps 2.4, 2.5, 2.6

**State Carried Forward:**
- Step 9 is renumbered (9.1=check, 9.2=BUILD_ORDER, 9.3=build-state, 9.4=Archon)
- build-state.json has `currentSpec`, `currentStep`, and `decisionsLog` fields
- Handoff writes happen at every stop point (Task 4)
- `ready-to-ship` is a new status (Task 4) — AGENTS.md update deferred

**Known Issues or Deferred Items:**
- AGENTS.md doesn't list `ready-to-ship` yet. Note this in the plan notes but don't modify AGENTS.md.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/build.md` (lines 435-464) — Why: Step 7b consensus gating, needs non-dispatch fallback
- `.opencode/commands/build.md` (lines 516-529) — Why: Step 7e, REJECT bypasses validation
- `.opencode/commands/build.md` (lines 644-654) — Why: Backward Repair, needs concrete workflow
- `.opencode/templates/BUILD-ORDER-TEMPLATE.md` (lines 50-56) — Why: Complexity Guide contradicts /build

### Current Content: Step 7b Process Review Results (Lines 435-464)

```markdown
#### 7b: Process Review Results

Collect all findings. Deduplicate. Classify each finding:

| Class | Examples | Action |
|-------|---------|--------|
| **Fixable** | real bug, logic error, missing null check, bad import | Fix loop (7c) |
| **False positive** | reviewer complaining about intentional pattern, pre-existing issue not introduced by this spec | Mark as acknowledged, do NOT fix |
| **External dependency** | "this will fail without a live connection", "needs live DB for integration test" | Mark as known-skip, proceed |

| Finding Level | Action |
|--------------|--------|
| **0 issues / only Minor / only false-positives** | Exit loop → Step 7d (final review) |
| **Critical/Major fixable** | Continue to 7c |

**Consensus gating — read `escalationAction` from `batch-dispatch` output:**

> The `escalationAction` value appears in the `## Consensus Analysis` table of the batch-dispatch output, in the row labelled `| Escalation action | **{value}** |`.

| `escalationAction` | Meaning | Action |
|--------------------|---------|--------|
| `skip-t4` | 0-1 models found issues | Proceed to Step 7d. $0 paid cost. |
| `run-t4` | 2 models found issues | `dispatch({ taskType: "codex-review", prompt: REVIEW_PROMPT })` as tiebreaker, then 7d. |
| `fix-and-rerun` | 3+ models found issues | Go to 7c (fix loop). After fix, re-run 7a gauntlet. Max 3 re-gauntlet iterations. |

**For light depth** (no `batch-dispatch` escalationAction available):
- 0 issues → Step 7d
- Any Critical/Major → 7c

**For heavy depth**: skip escalationAction — T4 and T5 always run regardless of consensus.
```

**Analysis**: The consensus gating section only applies when dispatch is available (`batch-dispatch` output). When dispatch is unavailable, Step 7a falls back to self-review (lines 429-433), but Step 7b has NO corresponding non-dispatch decision logic. The model must somehow decide whether its own self-review findings warrant fixes, with no defined criteria.

### Current Content: Step 7e T5 Escalation (Lines 516-529)

```markdown
#### 7e: T5 Escalation (last resort — stuck only)

Only reached when final review panel is stuck on the same findings across 2 consecutive runs:

**If dispatch available:**
```
dispatch({
  taskType: "final-review",
  prompt: "ESCALATION: Final review panel is stuck on the following findings across 2 consecutive runs. Make the final call — APPROVE or REJECT with specific reasoning.\n\nSpec: {spec-name}\nStuck findings:\n{list of persistent REJECT findings}\n\n{git diff HEAD}\n\nIf APPROVE: explain why the findings are acceptable or misclassified.\nIf REJECT: specify exactly what must change before commit.",
})
```
Apply the result. If APPROVE: proceed to Step 8. If REJECT: apply the specific fix, then Step 8 (no more review cycles).

**If dispatch unavailable:** STOP and surface to user — cannot auto-resolve without T5.
```

**Analysis**: The REJECT path says "apply the specific fix, then Step 8 (no more review cycles)." This means a fix is applied but never re-validated — no Step 6 re-run, no lint/type/test check. The fix could introduce new errors that go straight into a commit.

### Current Content: Backward Repair (Lines 644-654)

```markdown
## Backward Repair

If implementing spec N reveals that completed spec M needs changes:

1. Emit a note: "Spec {N} needs changes to completed spec {M}"
2. Plan + execute the patch to spec M
3. Re-validate spec M (run its acceptance criteria again)
4. Continue with spec N
5. Log the backward repair in `build-state.json`

This is autonomous — do NOT ask the user unless the repair is architectural (changes to 3+ completed specs).
```

**Analysis**: "Plan + execute the patch" has no concrete details: where is the patch plan saved? What format? Does it use `/planning`? Is there a review step? How is it committed? What scope/type for the git commit? What if the patch breaks spec M's tests?

### Current Content: BUILD-ORDER-TEMPLATE Complexity Guide (Lines 50-56)

```markdown
## Complexity Guide

| Tag | Plan Size | When |
|-----|-----------|------|
| `light` | ~100 lines | Scaffolding, config, simple CRUD, well-known patterns |
| `standard` | ~300 lines | Services, integrations, moderate business logic |
| `heavy` | ~700 lines | Core algorithms, AI/ML, complex orchestration |
```

**Analysis**: Directly contradicts `/build` Step 2 (line 127): "**Every spec gets a full 700-1000 line plan.** No exceptions. No tiered plan sizes." Light specs don't get 100-line plans — they get 700-1000 like everything else. The depth label only affects the review tier in Step 7.

### Patterns to Follow

**Pattern: Error handling with re-validation** (from `build.md` Step 6a):
```markdown
#### 6a: Fix Loop (fixable errors only)

1. Collect all **fixable** errors
2. Fix them
3. Re-run validation
4. Repeat until all fixable errors are resolved
```
- Why: The fix → re-validate pattern is already established. Step 7e REJECT should follow it.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/commands/build.md` — Add non-dispatch fallback to Step 7b

**What**: Add a "If dispatch unavailable" decision path to the consensus gating section.

**IMPLEMENT**:

After the current consensus gating section (after line 464, "For heavy depth: skip escalationAction..."), add:

```markdown
**If dispatch unavailable** (self-review in 7a):

Apply the same severity-based decision logic as the single-reviewer case:

| Self-Review Finding | Action |
|--------------------|--------|
| 0 issues | Exit loop → Step 7d |
| Only Minor / false-positives | Exit loop → Step 7d |
| Any Critical fixable | Continue to 7c (fix loop) |
| Any Major fixable | Continue to 7c (fix loop) |
| Only external dependency / unresolvable | Mark as known-skip → Step 7d |

No consensus gating applies — there is only one reviewer (self). The classification table above replaces `escalationAction` for the non-dispatch path.
```

**PATTERN**: Mirrors the "For light depth" section which also uses direct severity-based logic.

**IMPORTS**: N/A

**GOTCHA**: This must be clearly separate from the dispatch gating. Don't mix the two decision tables — they serve different paths.

**VALIDATE**:
```bash
# Read Step 7b and verify: three decision paths exist (dispatch+consensus, light/no-batch, non-dispatch)
```

---

### Step 2: UPDATE `.opencode/commands/build.md` — Fix Step 7e REJECT to re-validate

**What**: Change the REJECT path to re-run validation (Step 6) after applying the fix, before proceeding to Step 8.

**IMPLEMENT**:

Current (line 527):
```markdown
Apply the result. If APPROVE: proceed to Step 8. If REJECT: apply the specific fix, then Step 8 (no more review cycles).
```

Replace with:
```markdown
Apply the result:
- **If APPROVE**: proceed to Step 8.
- **If REJECT**: apply the specific fix, then re-run validation (Step 6 — lint, types, tests). If validation passes, proceed to Step 8. If validation fails, STOP and surface to user — this is the last escalation level, no more automated cycles.

This is the terminal fix — no further review cycles after 7e. But validation MUST pass before commit.
```

**PATTERN**: Step 6a fix loop pattern — fix then re-validate.

**IMPORTS**: N/A

**GOTCHA**: Do NOT add another review cycle after this — 7e is already the last resort. Only re-run validation (lint/types/tests), not the full review panel.

**VALIDATE**:
```bash
# Read Step 7e and verify: REJECT path includes "re-run validation (Step 6)" before Step 8
```

---

### Step 3: UPDATE `.opencode/commands/build.md` — Expand Backward Repair

**What**: Replace the 6-line backward repair section with a concrete workflow including file paths, git conventions, and validation.

**IMPLEMENT**:

Current (lines 644-654):
```markdown
## Backward Repair

If implementing spec N reveals that completed spec M needs changes:

1. Emit a note: "Spec {N} needs changes to completed spec {M}"
2. Plan + execute the patch to spec M
3. Re-validate spec M (run its acceptance criteria again)
4. Continue with spec N
5. Log the backward repair in `build-state.json`

This is autonomous — do NOT ask the user unless the repair is architectural (changes to 3+ completed specs).
```

Replace with:
```markdown
## Backward Repair

If implementing spec N reveals that completed spec M needs changes:

### 1. Assess Scope

- **Minor** (1-2 files, no API changes): Autonomous repair.
- **Moderate** (3+ files, no architecture change): Autonomous repair with extra caution.
- **Architectural** (changes to 3+ completed specs, or API surface changes): STOP and surface to user. Write handoff with `blocked` status.

### 2. Plan the Patch

Create an inline patch plan (NOT a full 700-line plan — this is a targeted fix):

```markdown
# Backward Repair: {spec-M-name}
# Triggered by: {spec-N-name}
# Reason: {why spec M needs changes}

## Changes
- File: {path} — {what changes and why}
- File: {path} — {what changes and why}

## Validation
- {spec M's acceptance criteria from its original plan}
- {spec N's acceptance criteria that triggered the repair}
```

Do NOT save this as a separate plan file — it's inline within the current `/build` session.

### 3. Execute the Patch

- Apply the changes to spec M's files.
- Do NOT create a separate `/execute` session — the patch is small enough to apply inline.

### 4. Re-validate Spec M

Run spec M's acceptance criteria (from its original plan, now at `.agents/features/{spec-M}/plan.done.md`):
```bash
{configured lint command}
{configured type check command}
{configured test command}
```

If validation fails: STOP. The backward repair introduced a regression. Surface to user with both spec names and the failure details.

### 5. Commit the Repair

```bash
git add -- {patched files}
git commit -m "fix({spec-M-name}): backward repair triggered by {spec-N-name}

- {what changed and why}"
git push
```

### 6. Log and Continue

Add to `build-state.json` `decisionsLog`:
```json
{"spec": "{spec-N-name}", "decision": "Backward repair to {spec-M-name}", "reason": "{why}"}
```

Resume spec N implementation from where it was before the repair detour.

### Guardrails

- Maximum 1 backward repair per spec execution. If a second repair is needed, STOP — something is wrong with the dependency graph.
- The repair commit is separate from spec N's commit — it has its own conventional commit message scoped to spec M.
- Spec M's `[x]` in BUILD_ORDER stays checked — it was already complete, the repair is a hotfix.
```

**PATTERN**: The inline patch approach mirrors how `/code-review-fix` works — targeted fixes without full planning overhead.

**IMPORTS**: N/A

**GOTCHA**: The repair commit must be scoped to spec M's name (`fix({spec-M-name})`), not spec N. This keeps git history clean — you can see which spec was patched and why.

**VALIDATE**:
```bash
# Read Backward Repair section and verify:
# 1. Scope assessment with clear thresholds
# 2. Inline patch plan format (not a full 700-line plan)
# 3. Validation using spec M's acceptance criteria
# 4. Separate git commit with proper scope
# 5. Guardrails (max 1 per spec, separate commit)
```

---

### Step 4: UPDATE `.opencode/templates/BUILD-ORDER-TEMPLATE.md` — Fix Complexity Guide

**What**: Update the Complexity Guide table to match `/build`'s policy that every spec gets 700-1000 line plans, and clarify that depth only affects the review tier.

**IMPLEMENT**:

Current (lines 50-56 of `BUILD-ORDER-TEMPLATE.md`):
```markdown
## Complexity Guide

| Tag | Plan Size | When |
|-----|-----------|------|
| `light` | ~100 lines | Scaffolding, config, simple CRUD, well-known patterns |
| `standard` | ~300 lines | Services, integrations, moderate business logic |
| `heavy` | ~700 lines | Core algorithms, AI/ML, complex orchestration |
```

Replace with:
```markdown
## Complexity Guide

**Every spec gets a 700-1000 line plan regardless of depth.** The depth tag controls the review tier in `/build` Step 7, not plan size.

| Tag | Review Tier | When |
|-----|------------|------|
| `light` | T1-T2 (3 free models) | Scaffolding, config, simple CRUD, well-known patterns |
| `standard` | T1-T3 + consensus (5 free models) | Services, integrations, moderate business logic |
| `heavy` | Full T1-T4 + T5 (5 free + 2 paid) | Core algorithms, AI/ML, complex orchestration |
```

**PATTERN**: The review tier breakdown matches the Validation Pyramid table in `build.md:679-687`.

**IMPORTS**: N/A

**GOTCHA**: The original "Plan Size" column is intentionally removed — it was misleading. The new "Review Tier" column is the actual differentiator.

**VALIDATE**:
```bash
# Read BUILD-ORDER-TEMPLATE.md Complexity Guide
# Verify: no "Plan Size" column, "Review Tier" column matches build.md Validation Pyramid
# Verify: bold note about 700-1000 lines for all specs
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — markdown files. Covered by Level 5.

### Integration Tests
N/A

### Edge Cases

- **Non-dispatch self-review finds Critical**: Step 7b non-dispatch path routes to 7c (fix loop). Correct.
- **Step 7e REJECT fix introduces lint error**: Re-validation catches it. Pipeline stops. Correct.
- **Backward repair fails validation**: Pipeline stops with both spec names. User can investigate.
- **Two backward repairs needed**: Second repair is blocked by guardrail. Pipeline stops for user review.
- **BUILD-ORDER generated from old template**: The template change only affects new BUILD_ORDERs. Existing ones aren't affected.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Open both files and verify valid markdown
```

### Level 2: Type Safety
N/A

### Level 3: Unit Tests
N/A

### Level 4: Integration Tests
N/A

### Level 5: Manual Validation

1. Read Step 7b — verify non-dispatch fallback table exists alongside dispatch consensus gating
2. Read Step 7e — verify REJECT path includes re-validation before Step 8
3. Read Backward Repair — verify all 6 sub-sections present with concrete details
4. Read BUILD-ORDER-TEMPLATE — verify "Plan Size" column removed, "Review Tier" column present
5. Cross-check: BUILD-ORDER-TEMPLATE Review Tier values match `build.md` Validation Pyramid table

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] Step 7b has non-dispatch fallback with severity-based decision table
- [ ] Step 7e REJECT path includes "re-run validation (Step 6)" before Step 8
- [ ] Backward Repair has: scope assessment, inline patch plan, validation, separate commit, guardrails
- [ ] BUILD-ORDER-TEMPLATE Complexity Guide uses "Review Tier" not "Plan Size"
- [ ] BUILD-ORDER-TEMPLATE has bold note about 700-1000 lines for all specs
- [ ] No regressions in dispatch-available review paths (Steps 7a, 7c, 7d unchanged)

### Runtime (verify after testing/deployment)

- [ ] Non-dispatch `/build` runs have clear review decision logic at Step 7b
- [ ] Step 7e REJECT never commits without re-validation
- [ ] New BUILD_ORDER files from the template set expectations correctly

---

## HANDOFF NOTES

### Files Created/Modified
- `.opencode/commands/build.md` — Steps 7b, 7e fixed; Backward Repair expanded from 6 lines to full workflow
- `.opencode/templates/BUILD-ORDER-TEMPLATE.md` — Complexity Guide corrected

### Patterns Established
- **Non-dispatch fallback pattern**: Every dispatch-dependent decision must have a non-dispatch equivalent. Self-review uses the same severity classification, just without consensus.
- **Re-validate after every fix pattern**: No fix goes to commit without re-validation. Applies to Steps 6a, 7c, and now 7e.

### State to Carry Forward
- All 5 tasks complete. AGENTS.md should be updated with `ready-to-ship` status (deferred from Task 4).

### Known Issues or Deferred Items
- AGENTS.md `ready-to-ship` status documentation — follow-up task.
- The inline patch plan format in Backward Repair is intentionally lightweight. If backward repairs become frequent, a formal template may be warranted.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written (final task — note AGENTS.md follow-up)
- [ ] Brief marked done: rename `task-5.md` → `task-5.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **Non-dispatch fallback mirrors severity logic, not consensus logic**: With one reviewer (self), there's no "consensus" to gate on. Instead, severity classification drives the decision directly. This is simpler and correct.
- **Step 7e re-validates but does NOT re-review**: 7e is the last review escalation. Adding another review cycle would create an infinite loop risk. Re-validation (lint/types/tests) is sufficient to catch regressions from the fix.
- **Backward repair is inline, not a full planning cycle**: A 700-line plan for a 5-line bugfix would be absurd. The inline patch plan format is proportional to the repair scope.
- **BUILD-ORDER-TEMPLATE: removed Plan Size entirely**: Rather than updating the numbers (which could still mislead), the column was replaced with "Review Tier" — the actual differentiator. The bold note makes the 700-1000 policy explicit.

### Implementation Notes

- The non-dispatch fallback in Step 7b should be placed AFTER all dispatch-related sections, clearly separated. Don't interleave it with the consensus gating tables.
- The backward repair guardrail (max 1 per spec) prevents cascade repairs that could consume the entire context window. If the dependency graph is bad enough to need 2+ repairs, the user should fix the graph.
