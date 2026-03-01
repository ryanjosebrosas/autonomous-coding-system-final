# Task 7 of 9: Wire `/build` Steps 7e + 8a

> **Feature**: `dispatch-wiring-completion`
> **Brief Path**: `.agents/features/dispatch-wiring-completion/task-7.md`
> **Plan Overview**: `.agents/features/dispatch-wiring-completion/plan.md`

---

## OBJECTIVE

Add concrete dispatch calls to `/build` Step 7e (T5 escalation) and Step 8a (commit message generation) — the last two prose-only steps in the pipeline.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/build.md` | UPDATE | Two edits: Step 7e (lines 465-466) + Step 8a (lines 476-477) |

**Out of Scope:**
- Steps 7a-7d — unchanged (7d was handled in Task 6)
- Step 8b (commit and push) — unchanged
- Steps 9-11 — unchanged

**Dependencies:**
- Task 6 must complete first (it modifies Step 7d, adjacent to 7e)

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/build.md` (lines 461-467) — Step 7e full context
- `.opencode/commands/build.md` (lines 470-484) — Step 8 full context
- `.opencode/commands/commit.md` (lines 26-33) — Reference: commit message dispatch (same pattern for 8a)
- `.opencode/reference/model-strategy.md` (line 60) — `final-review` taskType routes to T5
- `.opencode/reference/model-strategy.md` (line 61) — `commit-message` taskType routes to Haiku

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE Step 7e in `.opencode/commands/build.md`

**What**: Replace prose "send to T5" with concrete dispatch call.

**IMPLEMENT**:

Current (lines 465-466):
```
If dispatch available, send to T5 (best available model) for final call.
If not available, STOP and surface to user.
```

Replace with:
```
**If dispatch available:**
```
dispatch({
  taskType: "final-review",
  prompt: "FINAL ESCALATION — the review panel is stuck on the same findings across 2 runs.\n\nStuck findings:\n{list of REJECT findings that persisted}\n\nFull diff:\n{git diff HEAD}\n\nPlan:\n{plan summary}\n\nYour call: APPROVE (findings are acceptable/false-positive) or REJECT (genuine issues that must be fixed before commit). If REJECT, provide exact fixes.",
})
```

If T5 says APPROVE → proceed to Step 8 (commit).
If T5 says REJECT → apply T5's fixes, re-validate, commit. If still failing: STOP and surface to user.

**If dispatch unavailable:** STOP and surface to user. The review panel found persistent issues that need human judgment.
```

**PATTERN**: Single dispatch, same structure as `/commit` Step 2

**GOTCHA**: The Step 7e header and "Only reached when..." context line above (lines 461-464) must remain unchanged. Only the two action lines change.

**VALIDATE**:
```bash
# Verify dispatch call uses taskType: "final-review"
# Verify APPROVE/REJECT result handling is present
# Verify "STOP and surface to user" fallback for no-dispatch case
```

---

### Step 2: UPDATE Step 8a in `.opencode/commands/build.md`

**What**: Replace prose "Dispatch to T1" with concrete dispatch call.

**IMPLEMENT**:

Current (lines 476-477):
```
**If dispatch available:**
Dispatch to T1 for conventional commit message generation.
```

Replace with:
```
**If dispatch available:**
```
dispatch({
  taskType: "commit-message",
  prompt: "Generate a conventional commit message for these changes.\n\nFormat: feat({spec-name}): short description (imperative, max 50 chars)\nBody (3 bullets max): what was implemented and why.\n\nSpec: {spec-name}\nDiff stats:\n{git diff --stat}\n\nChanged files:\n{list of files}",
})
```
Use the dispatch result as the commit message.
```

**PATTERN**: Mirrors `/commit` Step 2 exactly (`commit.md:26-33`)

**GOTCHA**: The `**If dispatch unavailable:**` line and the format template below it (lines 479-484) must remain unchanged.

**VALIDATE**:
```bash
# Verify dispatch call uses taskType: "commit-message"
# Verify fallback format template is unchanged
# Verify Step 8b (commit and push) is unchanged
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — markdown edits.

### Edge Cases
- Step 7e prompt must include the specific stuck findings (not generic)
- Step 8a prompt must include spec-name so the commit follows `feat({spec-name}):` convention
- `taskType: "final-review"` routes to T5 per `model-strategy.md:60`
- `taskType: "commit-message"` routes to Haiku per `model-strategy.md:61`

---

## VALIDATION COMMANDS

### Level 5: Manual Validation
1. Open `.opencode/commands/build.md`
2. Find Step 7e — verify `dispatch({ taskType: "final-review" })` exists
3. Find Step 8a — verify `dispatch({ taskType: "commit-message" })` exists
4. Verify both taskTypes exist in `model-strategy.md:60-61`
5. Verify Steps 7a-7d are unchanged (especially 7d from Task 6)
6. Verify Step 8b and beyond are unchanged

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] Step 7e has concrete `dispatch({ taskType: "final-review" })` call
- [ ] Step 7e has APPROVE/REJECT result handling + STOP fallback
- [ ] Step 8a has concrete `dispatch({ taskType: "commit-message" })` call
- [ ] Step 8a fallback format template unchanged
- [ ] No other steps altered

---

## COMPLETION CHECKLIST

- [ ] Steps 1-2 completed
- [ ] Validation passed
- [ ] Brief marked done: rename `task-7.md` → `task-7.done.md`
