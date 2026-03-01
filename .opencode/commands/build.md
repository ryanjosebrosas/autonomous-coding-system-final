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

| Condition | Behavior | Handoff Status |
|-----------|----------|---------------|
| **Gate PASSED** | Auto-continue to next pillar | `build-loop-continuing` |
| **Gate FAILED** | STOP — report which criteria failed | `blocked` |
| **Unresolvable error** | STOP — after max retries exhausted | `blocked` |
| **User interrupts** (Ctrl+C) | STOP — save checkpoint | `blocked` |
| **All specs complete** | STOP — project done, run `/ship` | `ready-to-ship` |

**Every stop condition writes a handoff file.** No exception. The handoff is how `/prime` knows what happened and what to do next.

Gates that PASS write `build-loop-continuing` and auto-continue (no actual stop). Gates that FAIL always stop for review.

---

## Handoff Writes

`/build` writes to `.agents/context/next-command.md` at these points:

**On spec loop (Step 11 → Step 1):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /build (spec {completed-spec} done)
- **Feature**: {next-spec-name}
- **Next Command**: /build next
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: build-loop-continuing
```

**On gate FAIL (Step 10):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /build (gate failed)
- **Feature**: {spec-name}
- **Next Command**: /build {spec-name}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```

**On unresolvable error (any step):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /build ({step} failed for {spec-name})
- **Feature**: {spec-name}
- **Next Command**: /build {spec-name}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```

**On all specs complete:**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /build (all specs complete)
- **Feature**: {project-name}
- **Next Command**: /ship
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: ready-to-ship
```

**On user interrupt (Ctrl+C):**
Write the same `blocked` handoff as unresolvable error, with the current spec and step. The per-step checkpoint in `build-state.json` captures exactly where to resume.

Note: Step 8 (`/commit`) writes its own `build-loop-continuing` handoff. `/build` does NOT overwrite it — `/commit`'s handoff is the correct state after a successful commit.

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
   - **Task Brief Mode** (DEFAULT — use for all standard specs): Produces `plan.md` (overview + task index) + one `task-N.md` brief per task. Each brief runs in one `/execute` session. Use this for the vast majority of specs — there is no task count upper boundary.
   - **Master + Sub-Plan Mode** (EXCEPTION — rare, genuinely complex specs): Use only when the spec has multiple distinct phases with heavy cross-phase dependencies that make a single plan unwieldy. The trigger is architectural complexity, not task count. This is rare.
   - When in doubt: default to Task Brief Mode

#### Task Brief Mode (Default)

4. **Write or dispatch plan:**

   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /planning {spec-id} {spec-name} --auto-approve ...",
     taskType: "planning",
   })
   ```
   The `--auto-approve` flag skips the interactive approval gate in `/planning` Phase 4 — the spec was already approved via BUILD_ORDER.
   Use a T1 thinking model for best results (reasoning produces better plans and task briefs).

   **If dispatch unavailable:**
   Write the plan directly using the `/planning` methodology. The primary model gathers context, runs discovery, and produces the structured plan inline.

   **If dispatch fails:**
   - Fall back to the "If dispatch unavailable" path (write the plan inline).
   - Log: "Dispatch failed for planning {spec-name} — falling back to inline planning."

   - `plan.md` MUST be 700-1000 lines — this is a hard requirement
   - Each `task-{N}.md` brief MUST be self-contained and executable without reading `plan.md`
   - Plans MUST include actual code samples (copy-pasteable), not summaries
   - Plans MUST include exact file paths, line references, import statements
   - Plans MUST include validation commands for every task
   - Save to: `.agents/features/{spec-name}/plan.md` + `.agents/features/{spec-name}/task-{N}.md`

5. **Validate plan size:**
   - Count lines of `plan.md`. If under 700: reject, re-write with explicit "plan is too short, expand code samples and task detail"
   - If over 1000: acceptable but flag if significantly over

#### Master + Sub-Plan Mode (Exception)

4. **Write or dispatch master plan:**
   Same as above but in master mode. The master plan defines phases, task groupings, phase gates.
   - Master plan MUST be ~400-600 lines
   - Each sub-plan MUST be 700-1000 lines
   - Save to: `.agents/features/{spec-name}/plan-master.md` + `.agents/features/{spec-name}/plan-phase-{N}.md`

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

#### Task Brief Mode (Default)
```bash
git add .agents/features/{spec-name}/plan.md .agents/features/{spec-name}/task-*.md
git commit -m "plan({spec-name}): structured implementation plan + {N} task briefs"
```

#### Master + Sub-Plan Mode
```bash
git add .agents/features/{spec-name}/plan-master.md .agents/features/{spec-name}/plan-phase-*.md
git commit -m "plan({spec-name}): master plan + {N} sub-plans"
```

**If `git commit` fails** (pre-commit hooks, empty diff, plan files missing):
- STOP the pipeline. Do NOT proceed to Step 5.
- Report: "Plan commit failed for spec {spec-name}: {error}. Fix the issue and run `/build {spec-name}` to retry."
- Without this commit, there is no rollback point — execution must not begin.

This is the rollback point. If implementation fails, `git reset --hard HEAD` to here and retry.

---

### Step 5: Execute All Briefs (T1)

`/execute` processes ONE task brief (or ONE phase) per dispatch. `/build` owns the loop that re-dispatches until all briefs/phases are complete.

#### Task Brief Mode (Default)

**Brief-completion loop:**

1. **Dispatch or execute one brief:**

   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /execute .agents/features/{spec-name}/plan.md",
     taskType: "execution",
     timeout: 900,
   })
   ```

   **If dispatch unavailable:**
   Run `/execute .agents/features/{spec-name}/plan.md` inline. `/execute` auto-detects the next undone brief by scanning for `task-{N}.done.md` files.

   **If dispatch fails or times out:**
   - Fall back to the "If dispatch unavailable" path (run `/execute` inline).
   - Log: "Dispatch timed out for execution — falling back to inline execution."
   - If inline execution also fails: STOP, report the error.

2. **Check completion:**
   - If `.agents/features/{spec-name}/plan.done.md` exists → ALL briefs complete. Exit loop → Step 6.
   - If `plan.done.md` does NOT exist → briefs remain. Go back to step 1.

3. **Stuck detection:**
   - Track which brief was completed each iteration (check `task-{N}.done.md` count before and after dispatch).
   - If no new `.done.md` file appears after a dispatch (brief count unchanged) → the dispatch failed or stalled.
   - Retry once. If still no progress: STOP and report "Execution stalled on task brief {N} for spec {spec-name}."

**Loop invariant:** Each dispatch completes exactly one brief. The loop runs N times for N briefs. `/execute` picks the next undone brief automatically — `/build` does not need to track which brief is next.

#### Master + Sub-Plan Mode

**Phase-completion loop:**

1. **Dispatch or execute one phase:**

   **If dispatch available:**
   ```
   dispatch({
     mode: "agent",
     prompt: "Run /prime first. Then run /execute .agents/features/{spec-name}/plan-master.md",
     taskType: "execution",
     timeout: 900,
   })
   ```

   **If dispatch unavailable:**
   Run `/execute .agents/features/{spec-name}/plan-master.md` inline. `/execute` auto-detects the next undone phase by scanning for `plan-phase-{N}.done.md` files.

   **If dispatch fails or times out:**
   - Fall back to the "If dispatch unavailable" path (run `/execute` inline).
   - Log: "Dispatch timed out for execution — falling back to inline execution."
   - If inline execution also fails: STOP, report the error.

2. **Check completion:**
   - If `.agents/features/{spec-name}/plan-master.done.md` exists → ALL phases complete. Exit loop → Step 6.
   - If `plan-master.done.md` does NOT exist → phases remain. Go back to step 1.

3. **Stuck detection:**
   - Same as task brief mode: track `plan-phase-{N}.done.md` count before and after dispatch.
   - If no new `.done.md` file appears after a dispatch → retry once, then STOP.

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

**If any dispatch/batch-dispatch fails or times out:**
- Fall back to the "If dispatch unavailable" path (self-review).
- Log: "Dispatch timed out for code review — falling back to self-review."

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

#### 7c: Fix Loop (unlimited — until fixed or stuck)

1. Collect all Critical/Major **fixable** findings
2. Fix them (or dispatch to T1)
3. Re-run validation (Step 6)
4. Re-run code review (Step 7a)
5. Repeat until all fixable findings are resolved — **no iteration cap**

**Stuck detection**: if the exact same Critical/Major finding appears unchanged across 3 consecutive fix attempts, escalate to T4 (if available) or STOP and surface to user.

#### 7d: Final Review Panel (always runs)

Before committing, run the final review panel:

**If dispatch available:**

```
FINAL_REVIEW_PROMPT = "Final pre-commit review panel. Review the following implementation for the spec '{spec-name}'.\n\n{git diff HEAD}\n\nAcceptance criteria from the plan:\n{acceptance criteria section from plan.md}\n\nRespond with:\n- APPROVE — implementation is clean and meets criteria\n- REJECT: [list specific findings as: Severity | File:Line | Issue]\nDo NOT report issues that are pre-existing or out-of-scope for this spec."

batch-dispatch({
  batchPattern: "t4-sign-off",
  prompt: FINAL_REVIEW_PROMPT,
})
```

The `t4-sign-off` pattern runs: codex + claude-sonnet-4-5 + claude-sonnet-4-6 in parallel.

**Read result from output:**

| Result | Meaning | Action |
|--------|---------|--------|
| All APPROVE | Unanimous pass | Commit + push (Step 8) |
| Mixed (some APPROVE, some REJECT) | Split verdict | Fix REJECT findings → re-run panel once |
| All REJECT | Full failure | Fix findings → re-run panel once |
| **Stuck** (same REJECT findings across 2 panel runs) | Unresolvable | Escalate to 7e (T5) |

**Quantified Review Criteria (required):**
- Test coverage delta ≥0% (no regression)
- Zero new lint errors
- All type checks pass
- No Critical/Major findings from ≥2 reviewers (or Alignment Score ≥7/10 from `/system-review`)

**If dispatch unavailable:**
Self-review with structured rubric:
- Does the implementation match the plan?
- Are all acceptance criteria met?
- Are there any security concerns?
- Is the code consistent with project patterns?
Apply the quantified criteria above as a checklist. If all pass: proceed to Step 8.

#### 7e: T5 Escalation (last resort — stuck only)

Only reached when final review panel is stuck on the same findings across 2 consecutive runs:

**If dispatch available:**
```
dispatch({
  taskType: "final-review",
  prompt: "ESCALATION: Final review panel is stuck on the following findings across 2 consecutive runs. Make the final call — APPROVE or REJECT with specific reasoning.\n\nSpec: {spec-name}\nStuck findings:\n{list of persistent REJECT findings}\n\n{git diff HEAD}\n\nIf APPROVE: explain why the findings are acceptable or misclassified.\nIf REJECT: specify exactly what must change before commit.",
})
```
Apply the result:
- **If APPROVE**: proceed to Step 8.
- **If REJECT**: apply the specific fix, then re-run validation (Step 6 — lint, types, tests). If validation passes, proceed to Step 8. If validation fails, STOP and surface to user — this is the last escalation level, no more automated cycles.

This is the terminal fix — no further review cycles after 7e. But validation MUST pass before commit.

**If dispatch unavailable:** STOP and surface to user — cannot auto-resolve without T5.

---

### Step 8: Commit + Push

On successful validation + clean review, delegate to `/commit` — do NOT duplicate its logic.

**8a. Run `/commit`:**

`/commit` handles: commit message generation (via dispatch or inline), artifact completion sweep (`report.md` → `report.done.md`, `review.md` → `review.done.md`), staging, commit, handoff write, and memory update.

Tell `/commit` this is a `/build` loop context so it writes `build-loop-continuing` status instead of `ready-for-pr`. The feature name is `{spec-name}`.

**If dispatch available:**
```
dispatch({
  mode: "agent",
  prompt: "Run /commit for spec {spec-name}. This is a /build loop — set handoff status to build-loop-continuing with Next Command /build next. Stage all files in the spec's touches list plus .agents/features/{spec-name}/ and .agents/specs/.",
  taskType: "commit-message",
  timeout: 300,
})
```

**If dispatch unavailable:**
Run `/commit` inline. Before running, inform it: "This is a `/build` loop — use `build-loop-continuing` status in the handoff."

**If `/commit` fails** (pre-commit hooks, empty diff, merge conflict):
- `/commit` writes a `blocked` handoff automatically.
- STOP the pipeline. Report: "Commit failed for spec {spec-name}. See handoff for details."
- Do NOT proceed to Step 9 or update any state.

**8b. Push to remote:**

After `/commit` succeeds:
```bash
git push
```

**If `git push` fails:**
1. Retry once: `git push`
2. If retry fails: STOP the pipeline. Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /build (push failed after commit)
   - **Feature**: {spec-name}
   - **Next Command**: git push && /build next
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: blocked
   ```
   Report: "Spec {spec-name} committed locally but push failed. Run `git push` manually, then `/build next` to continue."
3. Do NOT proceed to Step 9 or update any state until push succeeds.

**Never include `Co-Authored-By` lines.** Commits are authored solely by the user.

---

### Step 9: Verify + Update State

**9.1. Run rolling integration check (BEFORE updating state):**

```bash
{configured lint command}
{configured type check command}
{configured test command}
```

If integration check fails:
- STOP the pipeline. Do NOT update BUILD_ORDER or build-state.json.
- Report: "Regression detected after committing spec {spec-name}. Integration check failed: {errors}."
- The spec is committed (Step 8) but not marked complete. Fix the regression and run `/build {spec-name}` to re-validate and mark complete.

**9.2. Mark spec complete** in `.agents/specs/BUILD_ORDER.md` (only after 9.1 passes):
- Change `- [ ]` to `- [x]` for the completed spec

**9.3. Update `.agents/specs/build-state.json`:**
```json
{
  "lastSpec": "P1-02",
  "completed": ["P1-01", "P1-02"],
  "currentPillar": 1,
  "totalSpecs": 20,
  "currentSpec": null,
  "currentStep": null,
  "patternsEstablished": ["strict typing", "config pattern"],
  "decisionsLog": [
    {"spec": "P1-01", "decision": "Used X pattern", "reason": "Maintains compatibility"}
  ]
}
```

**`currentSpec` and `currentStep`**: Set at the START of each step, cleared (set to `null`) after spec completion. Used for context compaction recovery.

| Step | `currentStep` value |
|------|-------------------|
| Step 1 | `"pick"` |
| Step 2 | `"plan"` |
| Step 3 | `"plan-review"` |
| Step 4 | `"plan-commit"` |
| Step 5 | `"execute"` |
| Step 6 | `"validate"` |
| Step 7 | `"review"` |
| Step 8 | `"commit"` |
| Step 9 | `"update-state"` |
| Step 10 | `"gate-check"` |

At the start of each step, update `build-state.json` with the current spec and step value. After Step 9 completes (spec fully done), clear both fields back to `null`.

**9.4. Update Archon** (if connected):
- Call `manage_task("update", task_id="...", status="done")` for all spec tasks
- Update project progress

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

---

## Context Management

For large projects with many specs, context window management is critical.

### Between Specs

Clear working context but preserve:
- `build-state.json` (always read at Step 1)
- `memory.md` (always read at Step 1)
- Current pillar's completed spec list (for pattern reference)

### Within a Spec

Full context for that spec's plan + implementation.

### Checkpoint System

State is captured at two granularities:

**Per-spec checkpoint** (after Step 9):
- `.agents/specs/build-state.json` — what's done, patterns established
- `.agents/specs/BUILD_ORDER.md` — checkboxes
- `.agents/specs/PILLARS.md` — pillar status
- Git history — every spec is a commit

**Per-step checkpoint** (every step transition):
- `build-state.json` fields `currentSpec` and `currentStep` — what spec and step are in progress

### Context Compaction Recovery

If context compacts mid-spec, follow this procedure:

1. Read `.agents/specs/build-state.json`. Check `currentSpec` and `currentStep`.
2. Read `.agents/context/next-command.md` for the latest handoff.
3. If `currentStep` is set:
   - **Steps 1-4** (pick through plan-commit): Check `git log` for a plan commit. If committed, resume at Step 5. If not, restart at Step 2 (re-plan).
   - **Step 5** (execute): Check `.agents/features/{spec}/` for `.done.md` task briefs. Resume execution for remaining briefs.
   - **Steps 6-7** (validate/review): Re-run validation from Step 6. Prior review results are lost on compaction — re-review is safe and idempotent.
   - **Steps 8-9** (commit/state): Check `git log` for a code commit. If committed, resume at Step 9. If not, resume at Step 8.
   - **Step 10** (gate): Re-run the gate check — it's idempotent.
4. If `currentStep` is null but `currentSpec` is set: spec was being picked. Start at Step 1.
5. If both are null: no spec in progress. Start at Step 1 (pick next).

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
