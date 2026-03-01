---
description: Fully autonomous spec builder — plan, review, execute, validate, commit, loop
---

# Build: Autonomous Spec Pipeline

Fully autonomous builder that picks specs from BUILD_ORDER.md and processes them in a continuous loop: plan → review → execute → validate → code review → fix → commit → next. Zero interaction between specs. Stops only on gate failure, unresolvable error, or user interrupt.

## Usage

```
/build [next | spec-number | spec-name]
```

`$ARGUMENTS` — Which spec to start from:
- `next` (default) — pick the next pending spec in order
- `P1-05` or `flexible-metadata-schema` — start from a specific spec

Once started, the pipeline loops autonomously through specs until a stop condition is hit.

---

## Pipeline Position

```
/mvp → /prd → /pillars → /decompose → /build next (this — runs until pillar done) → /ship
```

This is Step 5 (the main loop). You run it once; it builds until done.

---

## Model Tier Reference

This command references model tiers. Map these to your configured models:

| Tier | Purpose | Examples |
|------|---------|---------|
| T1 | Fast/free — planning, execution, simple fixes | DeepSeek, Qwen, Gemini Flash, local models |
| T2 | Standard — code review, moderate reasoning | Claude Sonnet, GPT-4o, Gemini Pro |
| T3 | Strong reasoning — architecture, complex review | Claude Opus, GPT-4, Gemini Ultra |
| T4 | Premium — final review, stuck escalation | Claude Opus, GPT Codex, o1 |
| T5 | Top-tier — last resort, critical decisions | Best available model |

**If dispatch is unavailable**, the primary session model handles all tiers.

---

## Stop Conditions

The autonomous loop stops ONLY when:

| Condition | Behavior |
|-----------|----------|
| **Gate PASSED** | Auto-continue to next pillar |
| **Gate FAILED** | STOP — report which criteria failed |
| **Unresolvable error** | STOP — after max retries exhausted, report what's blocking |
| **User interrupts** (Ctrl+C) | STOP — save checkpoint, report progress |
| **All specs complete** | STOP — project done, run `/ship` |

Gates that PASS trigger automatic continuation to the next pillar. Gates that FAIL always stop for review.

---

## ENFORCEMENT — No Step Skipping (EVER)

**This rule applies in ALL modes: autonomous, manual, `/build next`, single spec.**

Every spec — regardless of depth label — MUST run every step in order:

```
Step 1 (Pick) → Step 2 (Plan) → Step 3 (Plan Review) → Step 4 (Commit Plan)
→ Step 5 (Execute) → Step 6 (Validate) → Step 7 (Code Review)
→ Step 8 (Commit + Push) → Step 9 (Update State) → Step 10 (Gate Check) → Step 11 (Loop)
```

The depth label (light/standard/heavy) ONLY controls:
- How many review models run in Step 7a (if dispatch available)
- Whether T5 is called in Step 7e (heavy only, as last resort)

**The depth label does NOT skip:**
- Step 3 (plan review) — runs for ALL depths
- Step 6 (validate: lint + types + tests) — runs for ALL depths
- Step 7d (final review panel) — runs for ALL depths

**Forbidden shortcuts (all VIOLATIONS):**
- Skipping plan review because "it's a light spec"
- Skipping the final review panel because "gauntlet was clean"
- Skipping validation because "implementation looked clean"
- Executing before plan is written and reviewed
- Committing without running the review panel
- Running only T5 instead of the full review pipeline

If you find yourself skipping any step: STOP, go back, run the skipped step.

---

## The Pipeline (Steps 1-11)

### Step 1: Pick Spec

Read `.agents/specs/BUILD_ORDER.md`. If it doesn't exist: "No BUILD_ORDER.md found. Run `/decompose` first." and stop.

**If `$ARGUMENTS` is `next` or empty:**
- Find the first `[ ]` spec whose dependencies are ALL marked `[x]`
- If no spec has all deps satisfied, report which deps are blocking and stop

**If `$ARGUMENTS` is a number or name:**
- Find that spec. Check its dependencies are satisfied.
- If deps not satisfied: "Spec {name} depends on {list}. Build those first." and stop.

Print progress dashboard:
```
+----------------------------------------------+
|  BUILD: {spec-name}                          |
|  Spec {N}/{total} | Pillar {P}               |
|  Depth: {light|standard|heavy}               |
|  Completed: {done}/{total} ({pct}%)          |
|  Pillar progress: {pillar-done}/{pillar-total}|
+----------------------------------------------+
```

---

### Step 2: Plan (T1)

**Every spec gets a full 700-1000 line plan.** No exceptions. No tiered plan sizes. The depth label (light/standard/heavy) does NOT affect planning quality — it only affects the validation tier in Step 7.

#### Planning Process

1. **Gather context:**
   - Read the spec entry from `.agents/specs/BUILD_ORDER.md` (description, depends, touches, acceptance)
   - Read `.agents/specs/PILLARS.md` for pillar context and gate criteria
   - Read `PRD.md` for product requirements context
   - Read `memory.md` for gotchas and lessons learned
   - Read `.agents/specs/build-state.json` for context from prior specs (if exists)
   - Read relevant codebase files listed in the spec's `touches` field
   - Read patterns from recently completed specs in the same pillar

2. **Judgment call on user interaction:**
   - If the spec's approach is fully covered by BUILD_ORDER + PILLARS + PRD (acceptance criteria, files touched, approach is obvious): write the plan directly without asking questions.
   - If there are real tradeoffs, ambiguity, or decisions NOT covered in existing artifacts: ask the user before writing the plan.
   - Default: most specs should NOT need user interaction — the BUILD_ORDER was already approved.

3. **Detect plan mode:**
   - **Single Plan Mode** (DEFAULT — 90%+ of specs): Use when spec has <10 estimated tasks OR touches <5 files OR is marked "light"/"standard"
   - **Master + Sub-Plan Mode** (EXCEPTION — rare, heavy specs): Use when spec has >=10 estimated tasks OR touches >=5 files OR is marked "heavy"
   - When in doubt: default to Single Plan Mode

#### Single Plan Mode (Default)

4. **Write or dispatch plan:**

   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /planning {spec-id} {spec-name}...",
     taskType: "planning",
     timeout: 900,
   })
   ```
   Use a T1 thinking model for best results (reasoning produces better 700-1000 line plans).

   **If dispatch unavailable:**
   Write the plan directly using the `/planning` methodology. The primary model gathers context, runs discovery, and produces the structured plan inline.

   - Plan MUST be 700-1000 lines — this is a hard requirement
   - Plan MUST include actual code samples (copy-pasteable), not summaries
   - Plan MUST include exact file paths, line references, import statements
   - Plan MUST include validation commands for every task
   - Save to: `.agents/plans/{spec-name}.md`

5. **Validate plan size:**
   - Count lines. If under 700: reject, re-write with explicit "plan is too short, expand code samples and task detail"
   - If over 1000: acceptable but flag if significantly over

#### Master + Sub-Plan Mode (Exception)

4. **Write or dispatch master plan:**
   Same as above but in master mode. The master plan defines phases, task groupings, phase gates.
   - Master plan MUST be ~400-600 lines
   - Each sub-plan MUST be 700-1000 lines
   - Save to: `.agents/plans/{spec-name}-master.md` + `.agents/plans/{spec-name}-phase-*.md`

---

### Step 3: Review Plan (T3/T4)

#### Single Plan Mode (Default)

Review the completed plan for quality:

**If dispatch available**, review by depth:

> Note: Truncate plan to 400 lines for the review prompt if > 400 lines — reviewers see enough to assess structure and approach.

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

**If dispatch unavailable:**
Self-review the plan against this checklist:
- All acceptance criteria from BUILD_ORDER are addressed
- File paths and imports are correct
- Code samples are copy-pasteable (not pseudocode)
- Validation commands are included for every task
- No circular dependencies between tasks
- Testing strategy covers the acceptance criteria
If issues found, fix them before proceeding.

**Handle review result:**

| Result | Action |
|--------|--------|
| **APPROVE** | Proceed to Step 4 |
| **IMPROVE** | Apply improvements to the plan, proceed to Step 4 |
| **REJECT** | Re-write plan with feedback → re-review (max 2 loops) |

If rejected twice: STOP and surface the issue to the user.

#### Master + Sub-Plan Mode

1. Review master plan first, then each sub-plan sequentially.
2. For each sub-plan, apply the same depth-conditional dispatch logic above (light → `dispatch`, standard/heavy → `batch-dispatch({ batchPattern: "free-plan-review" })`).
3. All artifacts must be approved before proceeding to Step 4.

---

### Step 4: Commit Plan

Git save point:

#### Single Plan Mode
```bash
git add .agents/plans/{spec-name}.md
git commit -m "plan({spec-name}): structured implementation plan"
```

#### Master + Sub-Plan Mode
```bash
git add .agents/plans/{spec-name}-master.md .agents/plans/{spec-name}-phase-*.md
git commit -m "plan({spec-name}): master plan + {N} sub-plans"
```

This is the rollback point. If implementation fails, `git stash` to here and retry.

---

### Step 5: Execute (T1)

#### Single Plan Mode (Default)

**If dispatch available:**
```
dispatch({
  mode: "agent",
  prompt: "Run /prime first. Then run /execute .agents/plans/{spec-name}.md",
  taskType: "execution",
  timeout: 900,
})
```

**If dispatch unavailable:**
Execute the plan inline using `/execute` methodology. Read the plan, implement each task in order, validate after each change.

#### Master + Sub-Plan Mode

Execute with master plan — `/execute` handles sub-plan looping automatically.

---

### Step 6: Validate

Run the project's validation pyramid (commands auto-detected by `/prime` or configured in `.opencode/config.md`):

```bash
# Level 1: Syntax & Style — {configured lint command}
# Level 2: Type Safety — {configured type check command}
# Level 3: Unit + Integration Tests — {configured test command}
```

**On failure — classify before looping:**

First, classify every failing error into one of two buckets:

| Class | Examples | Action |
|-------|---------|--------|
| **Fixable** | type error in our code, import missing, test assertion wrong, lint violation | Fix loop (Step 6a) |
| **Unresolvable** | missing DB/service, missing API key, third-party stub gap, network-dependent test, false positive from external library | Skip fix loop → escalate (Step 6b) |

**Unresolvable signals:**
- Error originates in `node_modules/`, `site-packages/`, or a known stub-gap module
- Test requires a live database, live API, or environment variable not set in CI
- Type error on a line we did not touch in this spec
- Error message matches a known pre-existing issue in `memory.md`

#### 6a: Fix Loop (fixable errors only)

1. Collect all **fixable** errors
2. Fix them (or dispatch to T1: "Fix these validation errors: {errors}. Plan: {path}.")
3. Re-run validation
4. Repeat until all fixable errors are resolved — **no iteration cap**
5. **Stuck detection**: if the same error appears unchanged across 3 consecutive iterations without progress, escalate to Step 6c

**Divergence tracking**: If fixing errors requires deviating from the plan, track each divergence:
- What changed and why
- Classification: Good ✅ (plan gap discovered) or Bad ❌ (execution issue)
- Root cause: unclear plan / missing context / missing validation / manual step repeated
- Document in execution report for `/system-review`

#### 6b: Unresolvable Bypass

For each unresolvable error:
1. Document it: `# KNOWN SKIP: {error} — reason: {why unresolvable}`
2. If dispatch available, send to T3/T4 to confirm it is genuinely unresolvable
3. If confirmed BYPASS: add to known-skips list, continue to Step 7
4. If confirmed FIXABLE: treat as fixable, go back to Step 6a

#### 6c: Escalate After Stuck Detection

If the same fixable error repeats unchanged across 3 consecutive iterations (stuck):
1. If dispatch available, send full error list + git diff to T4 for root cause analysis
2. Apply fixes, re-run validation once more
3. If still failing: STOP, surface to user (cannot auto-resolve)

---

### Step 7: Code Review → Fix Loop

This is the quality gate. Runs until code is clean or issues are classified as acceptable.

#### 7a: Run Code Review

**If dispatch available**, run the free review gauntlet by depth. Use this prompt for all patterns:

```
REVIEW_PROMPT = "Review the following code changes for Critical and Major issues only.\n\n{git diff HEAD}\n\nRespond with:\n- ISSUES FOUND: [list each issue as: Severity | File:Line | Description]\n- NO ISSUES: code is clean."
```

> Note: If `git diff HEAD` exceeds 200 lines, include only the changed files list + first 200 lines of diff.

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

#### 7c: Fix Loop (unlimited — until fixed or stuck)

1. Collect all Critical/Major **fixable** findings
2. Fix them (or dispatch to T1)
3. Re-run validation (Step 6)
4. Re-run code review (Step 7a)
5. Repeat until all fixable findings are resolved — **no iteration cap**

**Stuck detection**: if the exact same Critical/Major finding appears unchanged across 3 consecutive fix attempts, escalate to T4 (if available) or STOP and surface to user.

#### 7d: Final Review Panel (always runs)

Before committing, run final review:

**If dispatch available:**
Run 2-3 T3/T4 reviewers in parallel with verdict: APPROVE or REJECT.

**If dispatch unavailable:**
Self-review with structured rubric:
- Does the implementation match the plan?
- Are all acceptance criteria met?
- Are there any security concerns?
- Is the code consistent with project patterns?

**Quantified Review Criteria (required):**
- Test coverage delta ≥0% (no regression)
- Zero new lint errors
- All type checks pass
- No Critical/Major findings from ≥2 reviewers (or Alignment Score ≥7/10 from `/system-review`)

| Result | Action |
|--------|--------|
| **APPROVE** | Commit + push (Step 8) |
| **REJECT with fixable issues** | Fix → re-validate → re-review |
| **Stuck** (same REJECT findings across 2 runs) | Escalate to T5 if available, else STOP |

#### 7e: T5 Escalation (last resort — stuck only)

Only reached when final review panel is stuck on the same findings across 2 consecutive runs:

If dispatch available, send to T5 (best available model) for final call.
If not available, STOP and surface to user.

---

### Step 8: Commit + Push

On successful validation + clean review:

**8a. Generate commit message:**

**If dispatch available:**
Dispatch to T1 for conventional commit message generation.

**If dispatch unavailable:**
Generate commit message directly:
```
Format: feat({spec-name}): short description (imperative, max 50 chars)
Body (3 bullets max): what was implemented and why.
```

**8b. Commit and push:**
```bash
git add -- {relevant files from spec touches}
git commit -m "{generated message}"
git push
```

**Never include `Co-Authored-By` lines.** Commits are authored solely by the user.

Push immediately after every spec — keeps remote in sync, enables rollback from any point.

---

### Step 9: Update State

1. **Mark spec complete** in `.agents/specs/BUILD_ORDER.md`:
   - Change `- [ ]` to `- [x]` for the completed spec

2. **Update `.agents/specs/build-state.json`:**
   ```json
   {
     "lastSpec": "P1-02",
     "completed": ["P1-01", "P1-02"],
     "currentPillar": 1,
     "totalSpecs": 20,
     "patternsEstablished": ["strict typing", "config pattern"],
     "decisionsLog": [
       {"spec": "P1-01", "decision": "Used X pattern", "reason": "Maintains compatibility"}
     ]
   }
   ```

3. **Update Archon** (if connected):
   - Call `manage_task("update", task_id="...", status="done")` for all spec tasks
   - Update project progress

4. **Run rolling integration check:**
   ```bash
   {configured lint command}
   {configured type check command}
   {configured test command}
   ```
   If integration check fails: STOP, report regression. Do not proceed to next spec.

---

### Step 10: Gate Check

**If the completed spec is a gate (P1-GATE, P2-GATE, etc.):**

1. Read gate criteria from `.agents/specs/PILLARS.md` for this pillar
2. Run EACH gate criterion:
   - Validation commands (lint, types, tests)
   - Integration tests specified in gate criteria
   - Manual checks (verify specific behaviors)
3. Report pass/fail for each criterion

**On ALL PASS:**
- Mark pillar as `[x] complete` in PILLARS.md
- Auto-continue to next pillar (Step 11 loops back to Step 1)
- Report: "Pillar {N} gate PASSED. Continuing to Pillar {N+1}."

**On ANY FAIL:**
- List which criteria failed and why
- STOP the pipeline
- Report:
  ```
  PILLAR {N} GATE FAILED

  Passed: {list}
  Failed:
  - {criterion}: {reason}
  - {criterion}: {reason}

  Fix the failures and run /build next to continue.
  ```

**If the spec is NOT a gate:** Skip this step entirely, go to Step 11.

---

### Step 11: Loop to Next Spec

1. Increment to next unchecked spec in BUILD_ORDER.md
2. **Zero interaction** — do NOT ask the user for approval between specs
3. Go back to **Step 1**
4. Repeat until a stop condition is hit

---

## Backward Repair

If implementing spec N reveals that completed spec M needs changes:

1. Emit a note: "Spec {N} needs changes to completed spec {M}"
2. Plan + execute the patch to spec M
3. Re-validate spec M (run its acceptance criteria again)
4. Continue with spec N
5. Log the backward repair in `build-state.json`

This is autonomous — do NOT ask the user unless the repair is architectural (changes to 3+ completed specs).

---

## Context Management

For large projects with many specs, context window management is critical:

1. **Between specs:** Clear working context but preserve:
   - `build-state.json` (always read at Step 1)
   - `memory.md` (always read at Step 1)
   - Current pillar's completed spec list (for pattern reference)

2. **Within a spec:** Full context for that spec's plan + implementation

3. **Checkpoint system:** At the end of each spec, the state is fully captured in:
   - `.agents/specs/build-state.json` — what's done, patterns established
   - `.agents/specs/BUILD_ORDER.md` — checkboxes
   - `.agents/specs/PILLARS.md` — pillar status
   - Git history — every spec is a commit

If context compacts mid-spec: read `build-state.json` + current plan file to resume.

---

## Validation Pyramid by Depth

The depth label ONLY affects the validation tier. Planning is always 700-1000 lines.

| Depth | L1 Syntax | L2 Types | L3 Unit | L4 Integration | Review Tier |
|-------|-----------|----------|---------|----------------|-------------|
| light | Required | Required | Required | — | T1-T2 |
| standard | Required | Required | Required | Required | T1-T3 + consensus |
| heavy | Required | Required | Required | Required | Full T1-T4 + T5 |

---

## Notes

- `/build` is fully autonomous. You say `/build next` once and it churns through specs.
- Old commands (`/planning`, `/execute`, `/code-loop`, `/final-review`, `/commit`) remain available for manual use.
- `.agents/specs/build-state.json` is the cross-session state bridge.
- Every spec produces: 1 plan commit + 1 code commit (minimum 2 commits per spec).
- **Never skip planning.** Every spec gets 700-1000 lines. No shortcuts.
