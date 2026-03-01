# Task 2: Wire `/code-loop` Dispatch Section with Concrete Calls

## Objective

Replace the prose-only "Multi-Model Dispatch in Loop" section in `/code-loop` (lines 50-109) with concrete `dispatch({...})` and `batch-dispatch({...})` call blocks for both review dispatch and fix dispatch.

## File to Modify

`.opencode/commands/code-loop.md`

## Current State (lines 50-109)

The section has:
- Lines 50-57: Overview of dispatch in loop context (prose)
- Lines 59-77: Review dispatch guidance — when to dispatch, when to skip, how to merge (all prose)
- Lines 79-85: Fix dispatch guidance (prose)
- Lines 87-99: Model routing table (reference table, no calls)
- Lines 101-109: Consensus-gating rule (prose)

**Problem**: A model executing `/code-loop` gets detailed guidance about WHEN and WHY to dispatch, but zero executable call syntax. The guidance is excellent — we keep it. We ADD call blocks.

## Target State

Restructure lines 50-109 to preserve the existing guidance while adding concrete call blocks at the right points. The key changes:

1. **Review dispatch**: Add `batch-dispatch` and single `dispatch` call blocks after the "when to dispatch" guidance
2. **Fix dispatch**: Add concrete `dispatch({ mode: "agent", ... })` call block for T1 fix delegation
3. **Keep the model routing table** — it's a useful reference
4. **Keep consensus-gating** — it's correct guidance

## Exact Replacement Content

Replace the entire section from `## Multi-Model Dispatch in Loop (Optional)` through the line before `## Fix Loop` (i.e., lines 50 through 110, which is the `---` separator before Fix Loop) with:

```markdown
## Multi-Model Dispatch in Loop (Optional)

The dispatch tool sends prompts to other AI models. In the code-loop context, use it for:

1. **Multi-model review** — get additional review perspectives beyond the primary review
2. **Fix delegation** — dispatch fix implementation to fast models while you orchestrate

**This is optional.** If dispatch is not available, skip all dispatch steps and run the loop with the primary model only.

### Review Dispatch (during step 1 of each iteration)

After the primary `/code-review` runs, consider dispatching to additional models for a second opinion.

**When to dispatch a second review:**
- First iteration (fresh code, worth getting a second perspective)
- When review finds security-sensitive issues (get confirmation)
- When review finds 0 issues (sanity check — did we miss something?)
- When changes touch multiple interconnected files

**When to skip dispatch review:**
- Later iterations with only minor fixes remaining
- When previous dispatch review added no new findings
- When changes are trivial (typos, formatting)

**If dispatch available**, define the review prompt:
```
LOOP_REVIEW_PROMPT = "Review the following code changes for Critical and Major issues.\n\nChanges:\n{git diff of current iteration's changes}\n\nContext: This is iteration {N} of a code-loop. Previous iterations fixed: {summary of prior fixes}.\n\nRespond with:\n- ISSUES FOUND: [list each as: Severity | File:Line | Description]\n- NO ISSUES: code is clean."
```

**First iteration** (comprehensive — use batch for diverse perspectives):
```
batch-dispatch({
  batchPattern: "free-review-gauntlet",
  prompt: LOOP_REVIEW_PROMPT,
})
```
Read `escalationAction` from output:
| `escalationAction` | Action |
|--------------------|--------|
| `skip-t4` | No additional issues found — proceed with primary review findings only |
| `run-t4` | `dispatch({ taskType: "codex-review", prompt: LOOP_REVIEW_PROMPT })` as tiebreaker |
| `fix-and-rerun` | Merge findings into fix plan — all models agree there are issues |

**Later iterations** (targeted — single model for confirmation):
```
dispatch({
  taskType: "code-review",
  prompt: LOOP_REVIEW_PROMPT,
})
```

**Near-final iteration** (when 0-1 issues remain, before declaring clean):
```
dispatch({
  taskType: "codex-review",
  prompt: LOOP_REVIEW_PROMPT,
})
```

**Merging dispatch findings with primary review:**
- Deduplicate — if dispatch finds the same issue as primary review, note "confirmed by second model"
- Add new findings to the review artifact with source attribution
- Include all confirmed + new findings in the fix plan so `/execute` addresses them

### Fix Dispatch (during step 4 of each iteration)

For simple, isolated fixes (e.g., "add missing null check at line 42", "rename variable X to Y"):

**If dispatch available:**
```
dispatch({
  mode: "agent",
  taskType: "simple-fix",
  prompt: "Fix the following issues in the codebase. Read each file before editing.\n\nIssues to fix:\n{list of simple fixes from review with file:line references}\n\nAfter fixing, run validation: {configured lint/type/test commands}",
  timeout: 300,
})
```

For complex, multi-concern fixes:
```
dispatch({
  mode: "agent",
  taskType: "complex-fix",
  prompt: "Fix the following issues. Read the full context of each file before editing.\n\nIssues:\n{list of complex fixes}\n\nPlan reference: {path to fixes-N.md}\n\nAfter fixing, run validation: {configured lint/type/test commands}",
  timeout: 600,
})
```

**Fix dispatch rules:**
- Only dispatch fixes you can verify (review the result before accepting)
- Never dispatch architectural changes or multi-file refactors that require cross-file reasoning
- If the dispatched fix introduces new issues, revert and implement directly
- Simple fixes → `simple-fix` taskType (T1a fast). Complex fixes → `complex-fix` taskType (T1c)

**If dispatch unavailable:** Implement fixes directly using the primary model.

### Model Routing for Loop Tasks (5-Tier)

| Task | TaskType | Tier | When to Use |
|------|----------|------|-------------|
| First code review | `code-review` via batch `free-review-gauntlet` | T2 batch | First iteration |
| Later iteration review | `code-review` | T2a | Subsequent iterations |
| Near-final review | `codex-review` | T4 | Before declaring clean |
| Simple fix generation | `simple-fix` (agent mode) | T1a | Isolated, verifiable fixes |
| Complex fix generation | `complex-fix` (agent mode) | T1c | Multi-concern fixes |
| Security-sensitive review | `security-review` via batch `free-security-audit` | T2 batch | Auth, crypto, data handling |

### Consensus-Gating Rule (when batch-dispatch is used)

After `batch-dispatch` runs, read the `escalationAction` from the `## Consensus Analysis` table:

| `escalationAction` | Meaning | Action |
|--------------------|---------|--------|
| `skip-t4` | 0-1 models found issues | Proceed with primary review findings only. $0 paid cost. |
| `run-t4` | 2 models found issues | `dispatch({ taskType: "codex-review", prompt: LOOP_REVIEW_PROMPT })` as tiebreaker. |
| `fix-and-rerun` | 3+ models found issues | Merge all findings into fix plan. After fix, re-run gauntlet. Max 3 re-gauntlet iterations. |

**Hard rule**: Security-critical code (auth, crypto, payments) ALWAYS gets `batch-dispatch({ batchPattern: "free-security-audit" })` regardless of iteration number or consensus.

---
```

## Validation

After editing:
1. Verify section starts with `## Multi-Model Dispatch in Loop (Optional)` and ends at the `---` before `## Fix Loop`
2. Verify all `taskType` values (`code-review`, `codex-review`, `simple-fix`, `complex-fix`, `security-review`) exist in `model-strategy.md:27-61`
3. Verify all `batchPattern` values (`free-review-gauntlet`, `free-security-audit`) exist in `model-strategy.md:134-149`
4. Verify the `## Fix Loop` section (line 113+) is unchanged
5. Verify graceful degradation ("If dispatch unavailable") appears for both review and fix dispatch

## Notes

- The iteration-aware prompt (`LOOP_REVIEW_PROMPT`) includes context about which iteration we're on and what was already fixed — this helps dispatch models avoid re-flagging already-fixed issues
- Fix dispatch uses `mode: "agent"` because the model needs file read/write access to apply fixes
- The `timeout: 300` for simple fixes and `timeout: 600` for complex fixes matches the agent mode defaults from `model-strategy.md:99-102`
- The "Fix dispatch rules" section is preserved from the original prose — it was good guidance, now it sits alongside concrete calls
