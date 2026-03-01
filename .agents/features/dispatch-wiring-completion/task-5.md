# Task 5 of 9: Wire `/pr` Step 5 (PR Description Dispatch)

> **Feature**: `dispatch-wiring-completion`
> **Brief Path**: `.agents/features/dispatch-wiring-completion/task-5.md`
> **Plan Overview**: `.agents/features/dispatch-wiring-completion/plan.md`

---

## OBJECTIVE

Replace the prose "Dispatch to T1 for PR title + body generation" in `/pr` Step 5 with a concrete `dispatch({ taskType: "pr-description" })` call block.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/pr.md` | UPDATE | Replace lines 189-190 with concrete dispatch call |

**Out of Scope:**
- Steps 1-4 and 6-7 — unchanged
- The body format template below "If dispatch unavailable" — unchanged
- Pipeline handoff template — unchanged

**Dependencies:**
- None — independent

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/pr.md` (lines 175-215) — Step 5 context around the edit point
- `.opencode/commands/commit.md` (lines 26-33) — Reference: working dispatch call for commit message (similar pattern)
- `.opencode/reference/model-strategy.md` (line 61) — `pr-description` taskType routes to Haiku

### Patterns to Follow

**Commit message dispatch** (from `commit.md:26-33`):
```
dispatch({
  taskType: "commit-message",
  prompt: "Generate a conventional commit message...",
})
```
PR description dispatch follows the same pattern — single `dispatch` call, Haiku tier, prose generation task.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/commands/pr.md`

**What**: Replace the prose dispatch reference in Step 5 with a concrete call block.

**IMPLEMENT**:

Current (lines 189-190):
```
**If dispatch available:**
Dispatch to T1 for PR title + body generation with the git context.
```

Replace with:
```
**If dispatch available:**
```
dispatch({
  taskType: "pr-description",
  prompt: "Generate a PR title and body for these changes.\n\nTitle format: type(scope): description (conventional commit, max 72 chars)\n\nBody format:\n## What\n- {2-4 bullets}\n\n## Why\n{1-2 sentences}\n\n## Changes\n{files grouped by area}\n\n## Testing\n{validation results}\n\n## Notes\n{breaking changes or 'None'}\n\nCommit log:\n{git log output from Step 5}\n\nDiff stats:\n{git diff --stat output}\n\nExecution report context:\n{REPORT_PATH contents, if found}",
})
```
Use the dispatch result as the PR title and body. If the result is poorly formatted, adjust before creating the PR.
```

**PATTERN**: Same single-dispatch pattern as `/commit` Step 2

**IMPORTS**: N/A

**GOTCHA**: The `**If dispatch unavailable:**` line and the body format template below it (lines 192-213) must remain unchanged. Only lines 189-190 change.

**VALIDATE**:
```bash
# Read pr.md and verify:
# 1. dispatch call uses taskType: "pr-description"
# 2. "If dispatch unavailable" and body format template below are unchanged
# 3. Steps 1-4 and 6-7 are unchanged
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — markdown edit.

### Edge Cases
- The prompt must reference the same git context gathered earlier in Step 5 (git log, diff stats)
- `taskType: "pr-description"` must exist in model-strategy.md routing table

---

## VALIDATION COMMANDS

### Level 5: Manual Validation
1. Open `.opencode/commands/pr.md`
2. Locate Step 5 — verify concrete `dispatch({...})` block exists
3. Verify `taskType: "pr-description"` matches `model-strategy.md:61`
4. Verify fallback template is intact
5. Verify no other sections changed

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] Concrete `dispatch({ taskType: "pr-description" })` call in Step 5
- [ ] Prompt includes git log, diff stats, and report context placeholders
- [ ] "If dispatch unavailable" fallback unchanged
- [ ] All other steps unchanged

---

## COMPLETION CHECKLIST

- [ ] Step 1 completed
- [ ] Validation passed
- [ ] Brief marked done: rename `task-5.md` → `task-5.done.md`
