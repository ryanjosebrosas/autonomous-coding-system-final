# Task 3 of 9: Wire `/code-review-fix` Step 2b (T1 Fix Dispatch)

> **Feature**: `dispatch-wiring-completion`
> **Brief Path**: `.agents/features/dispatch-wiring-completion/task-3.md`
> **Plan Overview**: `.agents/features/dispatch-wiring-completion/plan.md`

---

## OBJECTIVE

Add a dispatch-to-T1 section (Step 2b) to `/code-review-fix` so fix implementation can be delegated to fast models when dispatch is available.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/code-review-fix.md` | UPDATE | Insert new Step 2b between Steps 2 and 3 |

**Out of Scope:**
- Steps 1, 3, 4, 5 content — unchanged (Step 3 becomes the manual fallback)
- Pipeline handoff template at bottom — unchanged
- The "Opus Never Implements" rule — handled in Task 4

**Dependencies:**
- None — this is independent of other tasks

---

## PRIOR TASK CONTEXT

Tasks 1 and 2 wired `/code-review` and `/code-loop` with dispatch calls. This task applies the same pattern to `/code-review-fix`.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/code-review-fix.md` (all 216 lines) — full command to understand where Step 2b inserts
- `.opencode/commands/code-review-fix.md` (lines 62-75) — Step 2 ends here; Step 2b inserts after
- `.opencode/commands/code-review-fix.md` (lines 77-101) — Step 3 that becomes the manual fallback
- `.opencode/commands/build.md` (lines 312-316) — Reference: `/build` Step 6a fix dispatch pattern ("Fix them or dispatch to T1")

### Patterns to Follow

**Fix dispatch pattern** (from `/code-loop` task-2, the pattern we're establishing):
```
dispatch({
  mode: "agent",
  taskType: "simple-fix",
  prompt: "Fix the following issues...",
  timeout: 300,
})
```
- Uses `mode: "agent"` because fix work needs file read/write access
- Uses `taskType` routing for tier flexibility
- Includes validation commands in the prompt so T1 runs them after fixing

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/commands/code-review-fix.md`

**What**: Insert new Step 2b between the end of Step 2 and the start of Step 3.

**IMPLEMENT**:

The insertion point is after Step 2's final line (line 73: `Report: "Fixing {N} issues ({X} Critical, {Y} Major, {Z} Minor) in {M} files."`) and before Step 3 (line 77: `## Step 3: Fix Issues by Severity`).

Insert the following new section between them:

```markdown
---

## Step 2b: Dispatch Fix Implementation (Optional)

**If dispatch available**, delegate the fix work to a T1 implementation model:

**For simple, isolated fixes** (null checks, imports, naming, single-file changes):
```
dispatch({
  mode: "agent",
  taskType: "simple-fix",
  prompt: "Fix the following code review issues. Read each file fully before editing.\n\nReview file: {review-file-path}\nScope: {scope}\n\nIssues to fix:\n{filtered findings from Step 2, formatted as file:line — severity — description — suggested fix}\n\nAfter fixing all issues, run validation:\n{configured lint command}\n{configured type check command}\n{configured test command}\n\nReport which issues were fixed and which could not be fixed.",
  timeout: 300,
})
```

**For complex, multi-file fixes** (architecture changes, refactors, cross-module fixes):
```
dispatch({
  mode: "agent",
  taskType: "complex-fix",
  prompt: "Fix the following code review issues. These are complex fixes requiring careful cross-file reasoning.\n\nReview file: {review-file-path}\nScope: {scope}\n\nIssues to fix:\n{filtered findings from Step 2}\n\nFor each fix:\n1. Read the full file and surrounding context\n2. Understand the fix's impact on other files\n3. Apply the minimal correct fix\n4. Verify no regressions\n\nAfter all fixes, run validation:\n{configured lint command}\n{configured type check command}\n{configured test command}",
  timeout: 600,
})
```

**After dispatch returns:**
1. Verify the dispatched model's fixes are correct (read modified files)
2. If dispatch fixed all issues → skip to Step 4 (validation)
3. If dispatch missed issues or introduced new ones → fix remaining issues in Step 3 manually
4. If dispatch failed entirely → proceed to Step 3 and fix manually

**If dispatch unavailable:** Proceed to Step 3 and implement fixes directly.
```

**PATTERN**: Follows the same fix dispatch pattern from `/code-loop` task-2 (simple-fix / complex-fix split with agent mode)

**IMPORTS**: N/A

**GOTCHA**: The inserted section must end with the `---` separator that currently exists between Step 2 and Step 3. Don't create a double separator.

**VALIDATE**:
```bash
# Read the file and verify:
# 1. Step 2b appears between Step 2 and Step 3
# 2. Step 3 heading and content are unchanged
# 3. Both dispatch calls use mode: "agent" and include timeout
# 4. "If dispatch unavailable" fallback is present
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this task modifies markdown. Covered by manual testing in Level 5.

### Edge Cases
- Step 2b must not alter the line numbers or content of Steps 3, 4, 5
- The `{configured lint command}` placeholders must match the same convention used elsewhere in the file (Step 4, lines 109-117)

---

## VALIDATION COMMANDS

### Level 1: File Structure
```bash
# Verify file is well-formed and Step 2b exists between Step 2 and Step 3
```

### Level 5: Manual Validation
1. Open `.opencode/commands/code-review-fix.md`
2. Verify the section flow: Step 1 → Step 2 → Step 2b → Step 3 → Step 4 → Step 5
3. Verify both `dispatch` calls have `mode: "agent"` and `taskType` values
4. Verify `taskType: "simple-fix"` and `taskType: "complex-fix"` exist in `model-strategy.md:27-61`
5. Verify "If dispatch unavailable" fallback reads "Proceed to Step 3 and implement fixes directly"
6. Verify Steps 3, 4, 5 content is unchanged

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] Step 2b exists between Step 2 and Step 3
- [ ] Simple fix dispatch uses `taskType: "simple-fix"` with `timeout: 300`
- [ ] Complex fix dispatch uses `taskType: "complex-fix"` with `timeout: 600`
- [ ] Both use `mode: "agent"` for file access
- [ ] Graceful degradation present ("If dispatch unavailable")
- [ ] Steps 3, 4, 5 unchanged

---

## COMPLETION CHECKLIST

- [ ] Step 1 completed
- [ ] Validation passed
- [ ] Brief marked done: rename `task-3.md` → `task-3.done.md`
