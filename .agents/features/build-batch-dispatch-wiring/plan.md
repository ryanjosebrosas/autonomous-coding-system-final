# build-batch-dispatch-wiring — Implementation Plan

## Feature Description

Wire `batch-dispatch` into `/build`'s Step 3 (Plan Review) and Step 7 (Code Review) so the free multi-model gauntlet actually fires during autonomous spec builds. Currently these steps describe parallel review in prose but call no tool. After this change, `batch-dispatch(...)` calls with explicit `batchPattern` values replace the vague table — making review model selection deterministic, cost-optimized, and correctly escalated.

## User Story

As an orchestrator running `/build`, I want the free review gauntlet to automatically run based on spec depth so that paid T4/T5 models are only called when the free consensus disagrees — not for every spec.

## Problem Statement

`batch-dispatch.ts` is fully implemented with 11 patterns and a consensus engine. `model-strategy.md` specifies exactly which pattern fires at each depth. But `/build`'s Step 7a has only a 3-row prose table ("light: 1-2 model review | standard: 3-5 model parallel | heavy: full gauntlet") with no tool call syntax. A model executing `/build` cannot infer the correct `batch-dispatch` call from this description, so it either skips it or calls `dispatch` (single model) instead — defeating the consensus mechanism entirely.

Step 3 (plan review) has the same problem: it calls `dispatch({ taskType: "plan-review" })` (single model) for all depths, while model-strategy.md specifies that standard/heavy should use `batchPattern: "free-plan-review"` (4 models) for stronger pre-implementation confidence.

## Solution Statement

Replace the vague prose table in Step 7a and the single-model call in Step 3 with explicit `batch-dispatch` call blocks per depth. Wire Step 7b's consensus gating to the `escalationAction` field returned by `batch-dispatch`. No other files are touched.

## Feature Metadata

- **Depth**: light (single-file edit, 3 localized sections)
- **Dependencies**: `batch-dispatch.ts` (implemented ✓), `dispatch.ts` (implemented ✓)
- **Files touched**: `.opencode/commands/build.md` only
- **Estimated tasks**: 3 (one per section modified)

---

## Context References

### Codebase Files

- `.opencode/commands/build.md:194-221` — Step 3 plan review: current single-model dispatch block to be upgraded for standard/heavy
- `.opencode/commands/build.md:333-368` — Step 7a + 7b: prose table and consensus gating to be replaced with concrete batch-dispatch calls
- `.opencode/tools/batch-dispatch.ts:46-316` — BATCH_PATTERNS registry: all 11 patterns, exact names
- `.opencode/tools/batch-dispatch.ts:317-412` — `dispatchParallel()` + `analyzeConsensus()`: what the tool returns
- `.opencode/tools/batch-dispatch.ts:413-465` — `formatBatchOutput()`: shape of the output string
- `.opencode/reference/model-strategy.md:134-181` — Batch patterns table, consensus rules, per-spec-depth matrix (authoritative source)

### Key Facts from model-strategy.md (lines 155-181)

**Consensus rules** (lines 155-163):
- 0-1 models find issues → `escalationAction: "skip-t4"` → commit directly, $0 paid cost
- 2 models find issues → `escalationAction: "run-t4"` → run T4 gate
- 3+ models find issues → `escalationAction: "fix-and-rerun"` → T1 fix + re-gauntlet (max 3x)

**Per-spec depth** (lines 165-171):
- `light` → `free-impl-validation` (3 models), no T4
- `standard` → `free-review-gauntlet` (5 models) + T4 only if consensus says `run-t4`
- `heavy` → `free-review-gauntlet` (5 models) + T4 always + T5 always

**Plan review patterns** (inferred from model-strategy.md + batch pattern registry):
- `light` → single `dispatch({ taskType: "plan-review" })` — GLM-5, fast
- `standard/heavy` → `batch-dispatch({ batchPattern: "free-plan-review" })` — 4 models (GLM-5, GLM-4.5, Qwen3-MAX, DeepSeek-V3.2)

### Pattern: Existing dispatch call syntax in build.md

From `build.md:154-162` (Step 2 — planning):
```
dispatch({
  mode: "agent",
  prompt: "Run /prime first. Then run /planning {spec-id} {spec-name}...",
  taskType: "planning",
  timeout: 900,
})
```

From `build.md:196-201` (Step 3 — plan review, current):
```
dispatch({
  taskType: "plan-review",
  model: {T3 or T4 model},
  prompt: "Review this implementation plan for completeness, correctness, and risks:\n\n{full plan content}\n\n..."
})
```

From `build.md:254-261` (Step 5 — execute):
```
dispatch({
  mode: "agent",
  prompt: "Run /prime first. Then run /execute .agents/plans/{spec-name}.md",
  taskType: "execution",
  timeout: 900,
})
```

### Pattern: batch-dispatch call syntax (from batch-dispatch.ts tool export)

```
batch-dispatch({
  batchPattern: "free-review-gauntlet",
  prompt: "Review this code for Critical and Major issues:\n\n{git diff HEAD}\n\nRespond with: ISSUES FOUND: {list} or NO ISSUES.",
})
```

```
batch-dispatch({
  batchPattern: "free-plan-review",
  prompt: "Review this implementation plan:\n\n{plan content}\n\nRespond with APPROVE, IMPROVE: {list}, or REJECT: {list}.",
})
```

---

## Patterns to Follow

### Pattern 1: Depth-conditional dispatch blocks (existing in build.md)

build.md uses `| Depth | Review Approach |` tables for depth-conditional behavior. The new pattern uses depth-conditional code blocks instead:

```markdown
**If dispatch available**, run reviews by depth:

**light:**
```
dispatch({ taskType: "code-review", prompt: "..." })
```

**standard:**
```
batch-dispatch({ batchPattern: "free-review-gauntlet", prompt: "..." })
```

**heavy:**
```
batch-dispatch({ batchPattern: "free-review-gauntlet", prompt: "..." })
```
```

### Pattern 2: consensus escalationAction wiring (new)

After `batch-dispatch` returns, the `escalationAction` field drives the next step:

```markdown
**Read `escalationAction` from batch-dispatch output:**
- `skip-t4` → proceed directly to Step 7d (no T4)
- `run-t4` → dispatch to T4 for confirmation, then 7d
- `fix-and-rerun` → go to 7c (fix loop), re-run gauntlet after fix (max 3x)
```

---

## Step-by-Step Tasks

### Task 1: Upgrade Step 3 (Plan Review) — single dispatch → batch-dispatch for standard/heavy

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md` — lines 190-228 (Step 3: Review Plan)
- **IMPLEMENT**: Replace the current single `dispatch({ taskType: "plan-review", ... })` block with a depth-conditional structure:
  - `light`: keep single `dispatch({ taskType: "plan-review", ... })` — fast, GLM-5
  - `standard`/`heavy`: use `batch-dispatch({ batchPattern: "free-plan-review", ... })` — 4 models (GLM-5, GLM-4.5, Qwen3-MAX, DeepSeek-V3.2)
  - The prompt is the same in both cases: full plan content + APPROVE/IMPROVE/REJECT response format
  - Master + Sub-Plan Mode section: same upgrade (standard/heavy → batch-dispatch for each sub-plan)

  Replace this block:
  ```markdown
  **If dispatch available:**
  ```
  dispatch({
    taskType: "plan-review",
    model: {T3 or T4 model},
    prompt: "Review this implementation plan for completeness, correctness, and risks:\n\n{full plan content}\n\nRespond with one of:\n- APPROVE: Plan is ready for implementation.\n- IMPROVE: {list specific improvements} — then provide the improved sections.\n- REJECT: {list critical issues that must be fixed before implementation}."
  })
  ```
  ```

  With this expanded block:
  ```markdown
  **If dispatch available**, review by depth:

  **light:**
  ```
  dispatch({
    taskType: "plan-review",
    prompt: "Review this implementation plan for completeness, correctness, and risks:\n\n{full plan content}\n\nRespond with APPROVE, IMPROVE: {list}, or REJECT: {list}."
  })
  ```

  **standard / heavy:**
  ```
  batch-dispatch({
    batchPattern: "free-plan-review",
    prompt: "Review this implementation plan for completeness, correctness, and risks:\n\n{full plan content}\n\nRespond with APPROVE, IMPROVE: {list}, or REJECT: {list}."
  })
  ```
  Aggregate results: if majority APPROVE → proceed. If majority IMPROVE or REJECT → apply most-mentioned improvements and re-review.
  ```

- **GOTCHA**: The plan content can be long (700-1000 lines). The `prompt` field is a string — truncate to first 400 lines if the plan is very long to avoid timeout. Add a note: "Truncate plan to 400 lines for the review prompt if > 400 lines — reviewers see enough to assess structure and approach."
- **VALIDATE**: Read the modified section. Verify light uses `dispatch`, standard/heavy use `batch-dispatch({ batchPattern: "free-plan-review" })`.

---

### Task 2: Replace Step 7a prose table with concrete batch-dispatch calls

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md` — lines 333-347 (Step 7a: Run Code Review)
- **IMPLEMENT**: Replace the 3-row depth table with explicit `batch-dispatch` call blocks per depth. The prompt for all patterns is the same: git diff + clear task instruction + response format.

  Replace this section:
  ```markdown
  **If dispatch available**, dispatch reviews based on depth label:

  | Depth | Review Approach |
  |-------|----------------|
  | **light** | 1-2 model review |
  | **standard** | 3-5 model parallel review with consensus |
  | **heavy** | Full model gauntlet + T4 + T5 |

  **If dispatch unavailable:**
  Run thorough self-review using `/code-review` methodology:
  - Check for Critical issues (security, logic errors, type safety)
  - Check for Major issues (performance, architecture, error handling)
  - Check for Minor issues (code quality, naming, documentation)
  ```

  With this expanded section:
  ```markdown
  **If dispatch available**, run the free review gauntlet by depth. Use this prompt for all patterns:

  ```
  REVIEW_PROMPT = "Review the following code changes for Critical and Major issues only.\n\n{git diff HEAD}\n\nRespond with:\n- ISSUES FOUND: [list each issue as: Severity | File:Line | Description]\n- NO ISSUES: code is clean."
  ```

  **light:**
  ```
  batch-dispatch({
    batchPattern: "free-impl-validation",
    prompt: REVIEW_PROMPT,
  })
  ```
  3 models (GLM-5, GLM-4.7-FLASH, DeepSeek-V3.2) in parallel. Read `escalationAction` from output.

  **standard:**
  ```
  batch-dispatch({
    batchPattern: "free-review-gauntlet",
    prompt: REVIEW_PROMPT,
  })
  ```
  5 models (GLM-5, GLM-4.5, Qwen3-CODER-PLUS, GLM-4.7-FLASH, DeepSeek-V3.2) in parallel. Read `escalationAction` from output.

  **heavy:**
  ```
  batch-dispatch({
    batchPattern: "free-review-gauntlet",
    prompt: REVIEW_PROMPT,
  })
  ```
  5 models in parallel. Then unconditionally:
  ```
  dispatch({ taskType: "codex-review", prompt: REVIEW_PROMPT })
  dispatch({ taskType: "sonnet-46-review", prompt: REVIEW_PROMPT })
  ```

  **If dispatch unavailable:**
  Run thorough self-review using `/code-review` methodology:
  - Check for Critical issues (security, logic errors, type safety)
  - Check for Major issues (performance, architecture, error handling)
  - Check for Minor issues (code quality, naming, documentation)
  ```

- **GOTCHA**: The `git diff HEAD` in the prompt must be scoped. A large diff (>200 lines) should be summarized or truncated to the most important files. Add note: "If `git diff HEAD` exceeds 200 lines, include only changed files list + first 200 lines of diff."
- **VALIDATE**: Read the modified section. Verify: (1) `free-impl-validation` for light, (2) `free-review-gauntlet` for standard, (3) `free-review-gauntlet` + unconditional T4+T5 for heavy, (4) `REVIEW_PROMPT` defined before all calls.

---

### Task 3: Wire Step 7b consensus gating to escalationAction

- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/build.md` — lines 349-368 (Step 7b: Process Review Results + Consensus gating)
- **IMPLEMENT**: Replace the vague consensus gating section with explicit `escalationAction`-driven routing. The current text says "Majority say clean → proceed | Mixed results → T3/T4 tiebreaker | Majority say issues → fix". Replace with the three-case `escalationAction` decision tree from model-strategy.md.

  Replace this paragraph:
  ```markdown
  **Consensus gating (when dispatch available with multiple reviewers):**
  - Majority say clean → proceed to Step 7d
  - Mixed results → dispatch to T3/T4 as tiebreaker
  - Majority say issues → fix → re-review
  ```

  With this explicit routing table:
  ```markdown
  **Consensus gating — read `escalationAction` from `batch-dispatch` output:**

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

- **GOTCHA**: The `escalationAction` field is in the batch-dispatch output's consensus section. The model reading the output needs to know where to find it. The output format is: `## Consensus Analysis` table with `| Escalation action | **{value}** |`. Add a note pointing to this.
- **VALIDATE**: Read the modified section. Verify the three-case table matches model-strategy.md lines 159-163 exactly: 0-1→skip-t4, 2→run-t4, 3+→fix-and-rerun.

---

## Testing Strategy

### Manual Verification

After edits, read the modified `build.md` and check:

1. Step 3 has depth-conditional plan review: `dispatch` for light, `batch-dispatch({ batchPattern: "free-plan-review" })` for standard/heavy
2. Step 7a has `batch-dispatch({ batchPattern: "free-impl-validation" })` for light
3. Step 7a has `batch-dispatch({ batchPattern: "free-review-gauntlet" })` for standard and heavy
4. Step 7a heavy adds unconditional `dispatch({ taskType: "codex-review" })` and `dispatch({ taskType: "sonnet-46-review" })`
5. Step 7b has the three-case `escalationAction` table with correct values: skip-t4 / run-t4 / fix-and-rerun
6. `REVIEW_PROMPT` is defined before it's used in Step 7a
7. Truncation notes exist for long plan content and large diffs
8. "If dispatch unavailable" fallback still present for all sections

### Structural Check

- Line count: `build.md` should go from 573 lines to ~630-650 lines (added ~60-80 lines of explicit call syntax)
- No sections removed — only additions and replacements within Step 3 and Step 7a/7b

---

## Validation Commands

```bash
# L1: File exists and is valid markdown
wc -l .opencode/commands/build.md
# Expected: 620-670 lines (was 573)

# L2: Key patterns present
grep -n "batchPattern" .opencode/commands/build.md
# Expected: 4+ matches (free-plan-review, free-impl-validation, free-review-gauntlet x2)

grep -n "escalationAction" .opencode/commands/build.md
# Expected: 4+ matches

grep -n "skip-t4\|run-t4\|fix-and-rerun" .opencode/commands/build.md
# Expected: 3 matches (one per escalation action in the table)

# L3: No existing dispatch calls broken
grep -n "dispatch(" .opencode/commands/build.md
# Expected: dispatch calls at Steps 2, 3 (light), 5, 6b, 6c, 7d, 7e, 8a — all still present

# L4: batch-dispatch pattern names are correct (match batch-dispatch.ts registry)
grep -o "batchPattern.*\"[^\"]*\"" .opencode/commands/build.md
# Expected: "free-plan-review", "free-impl-validation", "free-review-gauntlet"
```

---

## Acceptance Criteria

### Implementation

- [x] Step 3 uses `batch-dispatch({ batchPattern: "free-plan-review" })` for standard/heavy depth
- [x] Step 3 keeps `dispatch({ taskType: "plan-review" })` for light depth
- [x] Step 7a defines `REVIEW_PROMPT` before the depth-conditional blocks
- [x] Step 7a uses `batch-dispatch({ batchPattern: "free-impl-validation" })` for light
- [x] Step 7a uses `batch-dispatch({ batchPattern: "free-review-gauntlet" })` for standard and heavy
- [x] Step 7a heavy adds unconditional T4 (`codex-review`) and T5 (`sonnet-46-review`) after gauntlet
- [x] Step 7b has `escalationAction` routing table with three cases: skip-t4, run-t4, fix-and-rerun
- [x] Escalation actions match model-strategy.md lines 159-163 exactly
- [x] Long-prompt truncation notes present for plan content and git diff
- [x] "If dispatch unavailable" fallbacks still present
- [x] No other sections of build.md modified

### Runtime

- [x] A model executing `/build` on a standard-depth spec will call `batch-dispatch({ batchPattern: "free-review-gauntlet" })` in Step 7a
- [x] After receiving batch-dispatch output, the model reads `escalationAction` and routes correctly
- [x] A clean `skip-t4` result causes the model to skip T4 and go directly to Step 7d

---

## Completion Checklist

- [x] Task 1 completed (Step 3 upgraded)
- [x] Task 2 completed (Step 7a replaced)
- [x] Task 3 completed (Step 7b escalationAction wired)
- [x] All validation commands pass
- [x] Acceptance criteria all met

---

## Notes

- **Key decision**: `REVIEW_PROMPT` is defined as a variable before the depth blocks to avoid copy-paste duplication — all three depth patterns use identical prompt text
- **Key decision**: heavy depth always runs T4+T5 (unconditional), regardless of `escalationAction` — this matches model-strategy.md's "heavy = full cascade, always" definition
- **Key decision**: `free-plan-review` for standard/heavy plan review (4 models) vs single model for light — aligns with the goal of catching plan issues early before expensive execution
- **Risk**: `escalationAction` is extracted from the batch-dispatch output text by reading the `## Consensus Analysis` table. A model may not parse it correctly if it skims the output. Mitigation: the output format puts `escalationAction` in a clearly labelled markdown table cell.
- **Confidence**: 9/10 — single file, three localized sections, all patterns well-defined
