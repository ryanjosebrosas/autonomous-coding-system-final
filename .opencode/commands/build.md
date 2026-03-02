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

**On spec loop (Step 10 → Step 1):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /build (spec {completed-spec} done)
- **Feature**: {next-spec-name}
- **Next Command**: /build next
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: build-loop-continuing
```

**On gate FAIL (Step 9):**
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

Note: Step 7 (`/code-loop --build`) writes its own `build-loop-continuing` handoff via `/commit`. `/build` does NOT overwrite it — `/code-loop`'s handoff is the correct state after a successful commit.

---

## ENFORCEMENT — No Step Skipping (EVER)

**This rule applies in ALL modes: autonomous, manual, `/build next`, single spec.**

Every spec — regardless of depth label — MUST run every step in order:

```
Step 1 (Pick) → Step 2 (Plan) → Step 3 (Plan Review) → Step 4 (Commit Plan)
→ Step 5 (Execute) → Step 6 (Validate) → Step 7 (Code Loop: Review + Fix + Commit + Push)
→ Step 8 (Update State) → Step 9 (Gate Check) → Step 10 (Loop)
```

The depth label (light/standard/heavy) ONLY controls:
- How many review models `/code-loop` dispatches (via its internal `/code-review` dispatch logic)

**The depth label does NOT skip:**
- Step 3 (plan review) — runs for ALL depths
- Step 6 (validate: lint + types + tests) — runs for ALL depths
- Step 7 (code-loop: review + fix + commit) — runs for ALL depths

**Forbidden shortcuts (all VIOLATIONS):**
- Skipping plan review because "it's a light spec"
- Skipping code-loop because "validation was clean"
- Skipping validation because "implementation looked clean"
- Executing before plan is written and reviewed
- Committing without running `/code-loop`

If you find yourself skipping any step: STOP, go back, run the skipped step.

---

## The Pipeline (Steps 1-10)

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

   **If dispatch available — use sequential dispatch (two calls, same session):**

   First, gather the spec context to pass inline:
   ```
   specContext = "Spec: {spec-id} {spec-name} ({depth})\n" +
     "Description: {spec description from BUILD_ORDER}\n" +
     "Depends: {depends field}\n" +
     "Touches: {touches field}\n" +
     "Acceptance: {acceptance criteria}\n" +
     "Patterns from prior specs: {patterns from build-state.json}\n" +
     "Pillar: {pillar name and gate criteria from PILLARS.md}"
   ```

   Then dispatch to a new session — `/prime` first to load context, then `/planning` with full spec details:

   **Planning session (direct API):**
   ```
   // Step A: Create a fresh session for planning
   session = POST http://127.0.0.1:4096/session
     body: { "title": "Planning: {spec-name}" }
   sessionId = session.id

   // Step B: Prime the session (load project context)
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "prime",
       "arguments": "",
       "model": "{planning-model}"  // from model-strategy.md T0 or T1c
     }

   // Step C: Run /planning in the SAME session (context carries over)
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "planning",
       "arguments": "{spec-name} --auto-approve",
       "model": "{planning-model}"  // same model as Step B
     }
   ```

   **Model selection**: Use the planning model from model-strategy.md:
   - Primary: `bailian-coding-plan-test/qwen3-max-2026-01-23` (T0 planning)
   - Fallback: `bailian-coding-plan-test/qwen3.5-plus` (T1c)
   - Last resort: `anthropic/claude-opus-4-5` (T0 paid)

   **Why direct API**: The dispatch tool's `sessionId` parameter may not be visible due to stale MCP cache. Direct API calls bypass this — `POST /session/{id}/command` always uses the correct session.

   **Why same session for /prime + /planning**: `/prime` loads project context (git state, build state, pending work). `/planning` needs this context to produce quality plans. Same session = accumulated context.

   **Why `--auto-approve`**: The spec was already approved via BUILD_ORDER. Skips interactive questions in all phases.

   **If direct API unavailable** (no server running):
   Write the plan directly using the `/planning` methodology inline.

   **If either command fails:**
   - If `/prime` fails: Retry once, then fall back to inline planning.
   - If `/planning` fails: Retry with fallback model. If all fail, fall back to inline planning.
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
   Same direct API pattern as Task Brief Mode above (create session → `/prime` → `/planning`), but pass `--master` flag in the planning arguments:
   ```
   "arguments": "{spec-name} --auto-approve --master"
   ```
   The master plan defines phases, task groupings, phase gates.
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

   **If server available — dispatch to a NEW session (separate from planning):**

   **Execution session (direct API):**
   ```
   // Step A: Create a fresh session for execution
   session = POST http://127.0.0.1:4096/session
     body: { "title": "Execute: {spec-name}" }
   sessionId = session.id

   // Step B: Prime the session
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "prime",
       "arguments": "",
       "model": "{execution-model}"  // from model-strategy.md T1c
     }

   // Step C: Execute in the SAME session (context carries over)
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "execute",
       "arguments": ".agents/features/{spec-name}/plan.md",
       "model": "{execution-model}"  // same model as Step B
     }
   ```

   **Model selection**: Use the execution model from model-strategy.md:
   - Primary: `bailian-coding-plan-test/qwen3.5-plus` (T1c execution workhorse)
   - Fallback: `bailian-coding-plan-test/qwen3-coder-next` (T1a fast)

   **Why a NEW session** (not the planning session): Each phase gets its own context window per AGENTS.md session model. Planning context (discovery, research) would pollute execution context. Fresh `/prime` gives the execution model clean project state.

   **If server unavailable:**
   Run `/execute .agents/features/{spec-name}/plan.md` inline. `/execute` auto-detects the next undone brief by scanning for `task-{N}.done.md` files.

   **If either command fails:**
   - If `/prime` fails: Fall back to inline execution.
   - If `/execute` fails: Retry once with new session. If still fails, fall back to inline execution.
   - Log: "Dispatch failed for execution {spec-name} — falling back to inline execution."

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

   **If server available — dispatch to a NEW session (separate from planning):**

   **Execution session (direct API):**
   ```
   // Step A: Create a fresh session for phase execution
   session = POST http://127.0.0.1:4096/session
     body: { "title": "Execute: {spec-name} phase" }
   sessionId = session.id

   // Step B: Prime the session
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "prime",
       "arguments": "",
       "model": "{execution-model}"  // from model-strategy.md T1c
     }

   // Step C: Execute phase in the SAME session (context carries over)
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "execute",
       "arguments": ".agents/features/{spec-name}/plan-master.md",
       "model": "{execution-model}"  // same model as Step B
     }
   ```

   **Model selection**: Use the execution model from model-strategy.md:
   - Primary: `bailian-coding-plan-test/qwen3.5-plus` (T1c execution workhorse)
   - Fallback: `bailian-coding-plan-test/qwen3-coder-next` (T1a fast)

   **Why a NEW session**: Same as Task Brief Mode — each phase gets its own context window. Fresh `/prime` gives clean project state.

   **If server unavailable:**
   Run `/execute .agents/features/{spec-name}/plan-master.md` inline. `/execute` auto-detects the next undone phase by scanning for `plan-phase-{N}.done.md` files.

   **If either command fails:**
   - If `/prime` fails: Fall back to inline execution.
   - If `/execute` fails: Retry once with new session. If still fails, fall back to inline execution.
   - Log: "Dispatch failed for execution {spec-name} — falling back to inline execution."

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

### Step 7: Code Review Gauntlet → Commit (4x `/code-loop`)

Run 4 sequential `/code-loop` sessions — 3 free models that review and fix, then 1 paid model (Codex) as the final gate that commits. Each loop sees the cleaned-up code from the prior loop.

```
Loop 1 (free)  → review + fix → Loop 2 (free)  → review + fix →
Loop 3 (free)  → review + fix → Loop 4 (Codex) → review + fix + commit + push
```

#### Model Lineup Selection

1. **Read `.agents/specs/model-scores.json`** — check if `codeLoopLineup` array exists and has >= 3 entries
2. **If lineup exists**: Use the top 3 models from `codeLoopLineup` as Loops 1-3, then Codex as Loop 4 (gate)
3. **If lineup missing or incomplete** (file absent, array missing, or fewer than 3 entries): Fall back to default lineup:
   - Loop 1: `zai-coding-plan/glm-5` (T2a thinking)
   - Loop 2: `ollama-cloud/deepseek-v3.2` (T3 independent)
   - Loop 3: `bailian-coding-plan-test/qwen3.5-plus` (T1c complex)
   - Loop 4: `openai/gpt-5.3-codex` (T4 gate — always Codex)

**Loop 4 is always Codex** — it serves as the paid quality gate regardless of benchmark results.

When using scorecard models, log which models were selected:
```
Model lineup (from scorecard):
  Loop 1: {provider}/{model} (score: {compositeScore})
  Loop 2: {provider}/{model} (score: {compositeScore})
  Loop 3: {provider}/{model} (score: {compositeScore})
  Loop 4: openai/gpt-5.3-codex (T4 gate — fixed)
```

| Loop | Provider/Model | Tier | Flags | Purpose |
|------|---------------|------|-------|---------|
| 1 | `lineup[0]` or `zai-coding-plan/glm-5` | T2a+ | `--auto` | Thinking review — catches logic errors |
| 2 | `lineup[1]` or `ollama-cloud/deepseek-v3.2` | T3 | `--auto` | Independent review — different perspective |
| 3 | `lineup[2]` or `bailian-coding-plan-test/qwen3.5-plus` | T1c | `--auto` | Code-focused review — catches implementation issues |
| 4 | `openai/gpt-5.3-codex` | T4 | `--auto --auto-commit --build` | Final gate — commits + pushes if clean |

#### Run Each Code-Loop

For each loop (1-4), dispatch to a **NEW session**:

**If server available — direct API dispatch:**

```
// Step A: Create a fresh session
session = POST http://127.0.0.1:4096/session
  body: { "title": "Code Loop {N}: {spec-name}" }
sessionId = session.id

// Step B: Prime the session
POST http://127.0.0.1:4096/session/{sessionId}/command
  body: {
    "command": "prime",
    "arguments": "",
    "model": "{loop-N-model}"
  }

// Step C: Run /code-loop
POST http://127.0.0.1:4096/session/{sessionId}/command
  body: {
    "command": "code-loop",
    "arguments": "{spec-name} {loop-N-flags}",
    "model": "{loop-N-model}"
  }
```

**Loops 1-3 (free, review + fix only):**
- Model: `lineup[N-1].provider/lineup[N-1].model` (from scorecard) or fallback default (see lineup table above)
- Flags: `--auto` (no `--auto-commit`, no `--build`)
- These loops review, fix issues, run validation — but do NOT commit
- Each loop exits clean or with fixes applied. The next loop reviews the updated code.

**Loop 4 (Codex, final gate + commit):**
- Model: `openai/gpt-5.3-codex` — always Codex regardless of scorecard
- Flags: `--auto --auto-commit --build`
- `--auto-commit`: Commits when review is clean
- `--build`: Tells `/commit` to write `build-loop-continuing` handoff + runs `git push`
- This is the paid gate. By this point, 3 free models have already caught and fixed easy issues.

**If server unavailable:**
Run each `/code-loop` inline with the appropriate flags. The primary model handles all 4 loops sequentially.

**If any loop fails:**
- If `/prime` fails: Retry once, then fall back to inline.
- If a free loop (1-3) fails: Log the failure, skip to the next loop. The next model will catch issues the failed one missed.
- If Codex loop (4) fails: Check handoff. If `blocked`, STOP and report. If no handoff, retry once.

#### Between Loops

After each free loop (1-3) completes:
1. Check that validation still passes (the loop should have ensured this, but verify)
2. Log: "Code-loop {N} ({model}) complete. Issues fixed: {count from loop report}."
3. Proceed to next loop

#### Verify Completion (After Loop 4)

After the Codex loop returns:

1. **Check for commit**: Run `git log -1 --oneline` and verify the latest commit is for `{spec-name}`.
2. **Check handoff**: Read `.agents/context/next-command.md`. Expected status: `build-loop-continuing`.
3. **If Codex loop stopped with issues** (handoff shows `blocked` or `ready-to-commit`):
   - STOP the pipeline. Report: "Codex final review stopped for spec {spec-name}. Check `.agents/features/{spec-name}/` for review artifacts."
   - Do NOT proceed to Step 7b.

#### 7b: Push + Create PR

After the Codex loop commits successfully, push and create a PR.

**Push:**
```bash
git push
```
If push fails: retry once. If still fails, STOP with `blocked` handoff.

**Create PR:**

PR title format: `{spec-name}: {one-line description} — {YYYY-MM-DD HH:MM}`

Example: `string-capitalize: add capitalize() with word-boundary regex — 2026-03-02 23:45`

```bash
gh pr create \
  --title "{spec-name}: {description from BUILD_ORDER spec entry} — {date and time}" \
  --body "$(cat <<'EOF'
## {spec-name}

**Spec**: {spec-id} from BUILD_ORDER.md
**Pillar**: {pillar number and name}
**Date**: {YYYY-MM-DD HH:MM}

### What
{2-4 bullets: what was implemented}

### Validation
- Code-loop: 4 rounds (GLM-5, DeepSeek-V3.2, Qwen3.5-plus, Codex)
- Issues found/fixed: {summary from loop reports}
- Tests: PASS
- Lint/Types: PASS

### Files Changed
{list from git diff --stat}
EOF
)"
```

If `gh` CLI is not available: log warning and continue — the PR can be created manually. Do NOT stop the pipeline for a PR failure.

**After PR creation** (or skip if `gh` unavailable):
- Log: "PR created for spec {spec-name}: {pr-url}"
- Proceed to Step 8 (Update State)

**Never include `Co-Authored-By` lines.** Commits are authored solely by the user.

---

### Step 8: Verify + Update State

**8.1. Run rolling integration check (BEFORE updating state):**

```bash
{configured lint command}
{configured type check command}
{configured test command}
```

If integration check fails:
- STOP the pipeline. Do NOT update BUILD_ORDER or build-state.json.
- Report: "Regression detected after committing spec {spec-name}. Integration check failed: {errors}."
- The spec is committed (Step 7) but not marked complete. Fix the regression and run `/build {spec-name}` to re-validate and mark complete.

**8.2. Mark spec complete** in `.agents/specs/BUILD_ORDER.md` (only after 8.1 passes):
- Change `- [ ]` to `- [x]` for the completed spec

**8.3. Update `.agents/specs/build-state.json`:**
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
| Step 7 | `"code-loop"` |
| Step 8 | `"update-state"` |
| Step 9 | `"gate-check"` |
| Step 10 | `"loop"` |

At the start of each step, update `build-state.json` with the current spec and step value. After Step 8 completes (spec fully done), clear both fields back to `null`.

**8.4. Update Archon** (if connected):
- Call `manage_task("update", task_id="...", status="done")` for all spec tasks
- Update project progress

---

### Step 9: Gate Check

**If the completed spec is a gate (P1-GATE, P2-GATE, etc.):**

1. Read gate criteria from `.agents/specs/PILLARS.md` for this pillar
2. Run EACH gate criterion:
   - Validation commands (lint, types, tests)
   - Integration tests specified in gate criteria
   - Manual checks (verify specific behaviors)
3. Report pass/fail for each criterion

**On ALL PASS:**
- Mark pillar as `[x] complete` in PILLARS.md
- Auto-continue to next pillar (Step 10 loops back to Step 1)
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

**If the spec is NOT a gate:** Skip this step entirely, go to Step 10.

---

### Step 10: Loop to Next Spec

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

**Per-spec checkpoint** (after Step 8):
- `.agents/specs/build-state.json` — what's done, patterns established
- `.agents/specs/BUILD_ORDER.md` — checkboxes
- `.agents/specs/PILLARS.md` — pillar status
- Git history — every spec is a commit + PR

**Per-step checkpoint** (every step transition):
- `build-state.json` fields `currentSpec` and `currentStep` — what spec and step are in progress

### Context Compaction Recovery

If context compacts mid-spec, follow this procedure:

1. Read `.agents/specs/build-state.json`. Check `currentSpec` and `currentStep`.
2. Read `.agents/context/next-command.md` for the latest handoff.
3. If `currentStep` is set:
   - **Steps 1-4** (pick through plan-commit): Check `git log` for a plan commit. If committed, resume at Step 5. If not, restart at Step 2 (re-plan).
   - **Step 5** (execute): Check `.agents/features/{spec}/` for `.done.md` task briefs. Resume execution for remaining briefs.
   - **Step 6** (validate): Re-run validation from Step 6. Safe and idempotent.
   - **Step 7** (code-loop): Check `git log` for a code commit. If committed + pushed, resume at Step 8. If not, re-run `/code-loop` — it's idempotent (re-reviews from scratch).
   - **Step 8** (update-state): Check BUILD_ORDER for `[x]`. If already marked, resume at Step 9. If not, re-run Step 8.
   - **Step 9** (gate): Re-run the gate check — it's idempotent.
4. If `currentStep` is null but `currentSpec` is set: spec was being picked. Start at Step 1.
5. If both are null: no spec in progress. Start at Step 1 (pick next).

---

## Validation Pyramid by Depth

The depth label ONLY affects the validation tier. Planning is always 700-1000 lines.

| Depth | L1 Syntax | L2 Types | L3 Unit | L4 Integration | Code Review |
|-------|-----------|----------|---------|----------------|-------------|
| light | Required | Required | Required | — | 4x code-loop (3 free + Codex) |
| standard | Required | Required | Required | Required | 4x code-loop (3 free + Codex) |
| heavy | Required | Required | Required | Required | 4x code-loop (3 free + Codex) |

All depths run the same 4x code-loop gauntlet. The depth label may affect future review intensity but currently all specs get the full treatment.

---

## Notes

- `/build` is fully autonomous. You say `/build next` once and it churns through specs.
- Old commands (`/planning`, `/execute`, `/code-loop`, `/final-review`, `/commit`) remain available for manual use.
- `.agents/specs/build-state.json` is the cross-session state bridge.
- Every spec produces: 1 plan commit + 1 code commit + 1 PR (minimum 2 commits per spec).
- **Never skip planning.** Every spec gets 700-1000 lines. No shortcuts.
