# Task 1: Wire `/code-review` Step 4 with Concrete Dispatch Calls

## Objective

Replace the prose table in `/code-review` Step 4 (lines 130-142) with concrete `dispatch({...})` and `batch-dispatch({...})` call blocks that a model can execute deterministically.

## File to Modify

`.opencode/commands/code-review.md`

## Current State (lines 130-142)

```markdown
## Step 4: Dispatch for Second Opinions (Optional)

For security-sensitive or architecturally complex changes, get a second opinion:

**If dispatch available:**

| Concern | Tier | Approach |
|---------|------|----------|
| Security review | T2 | Dispatch security-focused review |
| Architecture | T2 | Dispatch architecture audit |
| Logic verification | T2 | Dispatch logic review |

**If dispatch unavailable:** Proceed with your own thorough review. Consider reviewing from multiple angles (security, performance, architecture) sequentially.
```

**Problem**: Prose table — a model knows WHAT to do but has no executable call syntax.

## Target State

Replace lines 130-142 with concrete dispatch calls following the `/build` Step 7a pattern. The key design decisions:

1. **Use `batch-dispatch` for multi-concern review** — sends to 3+ models in parallel for diverse perspectives, rather than sequential single dispatches
2. **Use single `dispatch` for targeted concern** — when only one specific concern needs a second opinion
3. **Define a reusable `SECOND_OPINION_PROMPT`** variable
4. **Gate on change characteristics** — not every review needs dispatch; only security-sensitive, architecturally complex, or zero-finding reviews

## Exact Replacement Content

Replace the entire Step 4 section (from `## Step 4:` through the line before `## Step 5:`) with:

```markdown
## Step 4: Dispatch for Second Opinions (Optional)

For security-sensitive or architecturally complex changes, get additional review perspectives.

**When to dispatch:**
- Changes touch auth, crypto, payments, or data handling → security review
- Changes touch 5+ files or introduce new architectural patterns → architecture review  
- Primary review found 0 issues → sanity check (did we miss something?)
- Changes touch multiple interconnected modules → comprehensive second opinion

**When to skip dispatch:**
- Changes are trivial (typos, formatting, docs-only)
- Changes are confined to a single file with no security implications
- Prior dispatch in this pipeline already covered these concerns

**If dispatch available:**

Define the review prompt once:
```
SECOND_OPINION_PROMPT = "You are reviewing code changes for a second opinion. The primary review has already run.\n\nChanges:\n{git diff output or file contents}\n\nPrimary review found: {summary of Step 3 findings}\n\nFocus on: {concern — security / architecture / logic}\n\nRespond with:\n- ISSUES FOUND: [list each as: Severity | File:Line | Description]\n- NO ISSUES: code is clean from this perspective."
```

**For targeted single-concern review** (one specific worry):
```
dispatch({
  taskType: "security-review",
  prompt: SECOND_OPINION_PROMPT,
})
```
Or substitute `taskType` based on concern:
| Concern | taskType |
|---------|----------|
| Security | `security-review` |
| Architecture | `architecture-audit` |
| Logic/correctness | `logic-review` |

**For comprehensive multi-concern review** (complex changes, 5+ files, or zero-finding sanity check):
```
batch-dispatch({
  batchPattern: "free-review-gauntlet",
  prompt: SECOND_OPINION_PROMPT,
})
```
Read `escalationAction` from output:
| `escalationAction` | Action |
|--------------------|--------|
| `skip-t4` | No additional issues — proceed to Step 5 |
| `run-t4` | 2 models found issues — `dispatch({ taskType: "codex-review", prompt: SECOND_OPINION_PROMPT })` as tiebreaker |
| `fix-and-rerun` | 3+ models found issues — add findings to report, recommend `/code-review-fix` |

**Merging dispatch findings with primary review:**
- Deduplicate — if dispatch confirms a primary finding, mark "confirmed by second model"
- Add new findings to the report with source attribution: `[dispatch: {model}]`
- Promote severity if dispatch finds a higher severity for the same issue

**If dispatch unavailable:** Proceed with your own thorough review. Consider reviewing from multiple angles (security, performance, architecture) sequentially.
```

## Validation

After editing:
1. Verify the section starts with `## Step 4:` and ends before `## Step 5:`
2. Verify all `taskType` values exist in `model-strategy.md:27-61` routing table
3. Verify `batchPattern: "free-review-gauntlet"` exists in `model-strategy.md:134-149`
4. Verify graceful degradation ("If dispatch unavailable") is preserved
5. Verify no changes to any other section of the file

## Notes

- The `SECOND_OPINION_PROMPT` pattern matches `/build` Step 7a's `REVIEW_PROMPT` pattern
- `escalationAction` gating follows `/build` Step 7b's consensus logic exactly
- The "When to dispatch / When to skip" guidance helps models make the dispatch decision — without it, models either always dispatch (wasteful) or never dispatch (defeats the purpose)
