# Task 6 of 9: Wire `/build` Step 7d (Final Review Panel)

> **Feature**: `dispatch-wiring-completion`
> **Brief Path**: `.agents/features/dispatch-wiring-completion/task-6.md`
> **Plan Overview**: `.agents/features/dispatch-wiring-completion/plan.md`

---

## OBJECTIVE

Replace the prose "Run 2-3 T3/T4 reviewers in parallel" in `/build` Step 7d with a concrete `batch-dispatch({ batchPattern: "t4-sign-off" })` call block.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/build.md` | UPDATE | Replace Step 7d dispatch prose (lines 439-441) with concrete call |

**Out of Scope:**
- Steps 7a-7c (already wired) — unchanged
- Step 7e (handled in Task 7) — unchanged
- Self-review fallback content in 7d — unchanged
- Quantified Review Criteria — unchanged
- Result handling table — unchanged

**Dependencies:**
- None — independent (though logically follows Tasks 1-5)

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/build.md` (lines 435-459) — Step 7d full context
- `.opencode/commands/build.md` (lines 349-387) — Steps 7a pattern (gold standard to follow)
- `.opencode/reference/model-strategy.md` (line 59) — `t4-sign-off` batch pattern: codex + sonnet-4-5 + sonnet-4-6

### Patterns to Follow

**Batch dispatch pattern** (from `build.md:359-363`, Step 7a light):
```
batch-dispatch({
  batchPattern: "free-impl-validation",
  prompt: REVIEW_PROMPT,
})
```
Step 7d follows the same structure but uses `t4-sign-off` pattern for paid T4 models.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/commands/build.md` Step 7d

**What**: Replace the prose dispatch block in Step 7d with a concrete call.

**IMPLEMENT**:

Current (lines 439-440):
```
**If dispatch available:**
Run 2-3 T3/T4 reviewers in parallel with verdict: APPROVE or REJECT.
```

Replace with:
```
**If dispatch available:**

Define the final review prompt:
```
FINAL_REVIEW_PROMPT = "Final review before commit. Respond with APPROVE or REJECT: {list of issues}.\n\nPlan:\n{plan summary — first 100 lines of plan.md}\n\nImplementation diff:\n{git diff HEAD — truncate to 300 lines if longer}\n\nAcceptance criteria:\n{from BUILD_ORDER spec entry}\n\nPrior review findings (all addressed):\n{summary of 7a-7c findings and fixes}"
```

```
batch-dispatch({
  batchPattern: "t4-sign-off",
  prompt: FINAL_REVIEW_PROMPT,
})
```

This runs the T4 sign-off panel (codex + sonnet-4-5 + sonnet-4-6). Read results:
| Result | Action |
|--------|--------|
| All APPROVE | Proceed to Step 8 (commit) |
| Any REJECT with fixable issues | Fix → re-validate → re-run 7d panel (max 2 retries) |
| Stuck (same REJECT across 2 runs) | Escalate to 7e |
```

**PATTERN**: Same batch-dispatch structure as Steps 7a light/standard, but with `t4-sign-off` pattern

**IMPORTS**: N/A

**GOTCHA**: 
- The `**If dispatch unavailable:**` block (self-review rubric at lines 442-448) must stay unchanged
- The Quantified Review Criteria section (lines 449-453) must stay unchanged
- The result handling table at lines 455-459 already exists — the new table replaces or augments it with the same logic but tied to the batch-dispatch output

**VALIDATE**:
```bash
# Read build.md Step 7d and verify:
# 1. FINAL_REVIEW_PROMPT variable is defined
# 2. batch-dispatch call uses batchPattern: "t4-sign-off"
# 3. Result table shows APPROVE/REJECT/Stuck paths
# 4. Self-review fallback is unchanged
# 5. Steps 7a-7c and 7e are unchanged
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — markdown edit.

### Edge Cases
- `batchPattern: "t4-sign-off"` must exist in `model-strategy.md:59`
- The stuck escalation must correctly point to Step 7e
- The prompt must include enough context (plan + diff + criteria) for T4 models to make an informed call

---

## VALIDATION COMMANDS

### Level 5: Manual Validation
1. Open `.opencode/commands/build.md`
2. Find Step 7d — verify `FINAL_REVIEW_PROMPT` and `batch-dispatch` call exist
3. Verify `batchPattern: "t4-sign-off"` matches `model-strategy.md:59`
4. Verify self-review fallback is intact
5. Verify Steps 7a-7c are not altered
6. Verify Step 7e is not altered (Task 7 handles it)

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] `FINAL_REVIEW_PROMPT` variable defined with plan/diff/criteria context
- [ ] `batch-dispatch({ batchPattern: "t4-sign-off" })` call present
- [ ] Result handling table with APPROVE/REJECT/Stuck paths
- [ ] Stuck path escalates to 7e
- [ ] Self-review fallback unchanged
- [ ] Steps 7a-7c unchanged

---

## COMPLETION CHECKLIST

- [ ] Step 1 completed
- [ ] Validation passed
- [ ] Brief marked done: rename `task-6.md` → `task-6.done.md`
