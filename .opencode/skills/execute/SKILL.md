---
name: execute
description: Knowledge framework for disciplined plan execution with divergence tracking, self-review quality, and validation pyramid enforcement
license: MIT
compatibility: opencode
---

# Execute — Plan Execution Methodology

This skill provides the quality standards for rigorous plan execution. It complements
the `/execute` command — the command provides the workflow, this skill provides the
reasoning depth for divergence judgment, self-review honesty, and validation discipline.

## When This Skill Applies

- `/execute {plan-path}` is invoked
- A task brief (`task-N.md`) or plan file needs to be implemented
- Implementation work is in progress and a decision point requires classification

## The Entry Gate (Why It Is Non-Skippable)

The hard entry gate — requiring a plan file under `.agents/features/` — exists because:
- Ad-hoc implementation from chat intent cannot be reviewed systematically
- Plans are the contract between planning and execution — they define scope
- Without a plan, there is no acceptance criteria to verify against
- Without a plan, there is no way to classify divergences (there is nothing to diverge from)

If a user asks you to implement something without a plan, the correct response is NOT
to implement it anyway. The correct response is: "This needs a plan first. Run
`/planning {feature}` to create one, then execute from the plan."

## Divergence Classification — Deep Criteria

Divergence classification is a judgment call. These criteria help make it consistently:

**Good Divergence ✅ — The plan had a limitation:**

The plan was written at planning time with incomplete information. Execution reveals reality.
A good divergence means: "The plan told me to do X, but when I got there, X wasn't possible
or X was clearly wrong, and I found a better approach."

Signals that a divergence is Good:
- The file the plan referenced didn't exist or had a different structure
- The pattern the plan pointed to was deprecated or removed since planning
- A security or correctness concern emerged that the plan couldn't have anticipated
- The plan specified a wrong import path or method name

**Bad Divergence ❌ — Execution had a problem:**

A bad divergence means: "I knew what the plan said, but I did something else anyway."
Bad divergences are process failures, not plan limitations.

Signals that a divergence is Bad:
- You found the implementation harder than expected and took a shortcut
- You disagreed with the plan's approach and substituted your preference without noting it
- You misread a requirement and implemented the wrong thing
- You skipped a validation step because it seemed redundant

**Root Cause Assignment:**

Every divergence needs a root cause category:
- `unclear plan` — The plan was ambiguous; a clearer specification would have prevented this
- `missing context` — The plan didn't have information about X that execution revealed
- `missing validation` — No test existed to catch that the planned approach was wrong
- `manual step repeated` — The executor did manually what the plan said to automate

Root causes inform plan quality improvements — they are not just labels.

## Self-Review Quality Standards

Self-review (Step 5) is a genuine cross-check, not a rubber stamp. Quality standard:

**Task-by-task cross-check must be specific:**
Bad: "Task 1: completed"
Good: "Task 1 (Create AuthService): ACTION=CREATE on TARGET=src/services/auth.ts ✓;
IMPLEMENT=login/logout/refresh methods ✓; VALIDATE=`npm test -- --grep auth` passed ✓"

**Acceptance criteria cross-check must have evidence:**
Bad: "AuthService login method works ✓"
Good: "AuthService login method works ✓ — evidence: test output shows 3/3 auth tests
passing including the expired token edge case"

**File inventory must be exhaustive:**
List every file that was created or modified. Compare against the plan.
If a file was changed that the plan didn't mention, flag it as unplanned and explain why.

**Verdict must be honest:**
If any gap exists, the verdict is INCOMPLETE — even if it's a small gap.
Write the self-review before writing the execution report, and fix gaps before proceeding.
A self-review that always says COMPLETE is not being used as intended.

## Validation Pyramid Non-Negotiability

Every execution loop must run the full validation depth. The pyramid:

| Level | What | Why |
|-------|------|-----|
| L1: Syntax/Lint | No syntax errors, style consistent | Catches obvious mistakes before any test runs |
| L2: Types | Type safety verified | Catches interface mismatches that unit tests might miss |
| L3: Unit Tests | Functionality verified in isolation | Proves the implementation is correct |
| L4: Integration Tests | Components work together | Proves the integration points work |
| L5: Manual | End-to-end human verification | Proves the feature works from the user's perspective |

**Single checks are not sufficient:**
"L1 passes so the code is fine" — wrong. L1 passing means syntax is valid, not that
the logic is correct or the integration works.

**"N/A" must be justified:**
If L3 is N/A, explain why: "L3: N/A — markdown files only, no executable code."
If L3 is N/A but the task adds a new function, that is not actually N/A.

## One-Brief-Per-Session Discipline

The rule: execute exactly ONE task brief per session. This is not a soft guideline.

Why this rule exists:
- Each brief is designed to fit in one context window comfortably
- Executing multiple briefs dilutes attention and produces shallow work on later briefs
- The self-review for brief N must be completed before starting brief N+1
- Brief N+1 may depend on the actual output of brief N, not the planned output

When you finish brief N, write the handoff and STOP. The next session reads the handoff
via /prime and continues with brief N+1.

## Artifact Lifecycle

After each task brief completes:
- `task-N.md` → `task-N.done.md` (completed brief)
- `plan.md` → `plan.done.md` ONLY when ALL briefs are done (not before)
- `report.md` is created/updated (never renamed until /commit runs)

These renames are how /prime detects progress. Getting them wrong produces incorrect
pending work reports in future sessions.

## Anti-Patterns

**Implementing from chat intent** — "I'll add the auth endpoint you described" without
a plan artifact. This skips scope definition, acceptance criteria, and validation planning.

**Divergence without classification** — Deviating from the plan without noting it. Even
if the deviation is obviously correct, it must be classified and documented.

**Rubber-stamp self-review** — Marking all criteria as met without checking evidence.
The self-review is the last quality gate before the execution report — it must be genuine.

**Skipping validation levels** — "I'll just run the unit tests since we're in a hurry."
Skipped validation levels produce bugs that surface in production or code review.

**Continuing to brief N+1 immediately** — The temptation to "just do the next one too"
while context is warm. Resist it. The handoff exists specifically to pause here.

## Key Rules

1. **No execution without a plan artifact** — Chat intent is not a plan
2. **Classify every divergence** — Good or Bad, with root cause
3. **Self-review before report** — Genuine cross-check, not rubber stamp
4. **Full validation pyramid** — Every level, every time (or explicitly justified N/A)
5. **One brief per session** — Write handoff, stop, let /prime detect next brief
6. **Artifact renames are functional** — They drive /prime's pending work detection
7. **Bad divergences are process failures** — Document them to improve future plans

## Wisdom Extraction

After successful execution, extract wisdom from the work:

### When to Extract

- After each task brief completes
- After divergences (good or bad)
- After resolving issues in `/code-loop`
- After `/ralph-loop` iterations

### What to Extract

| Source | Category | Example |
|--------|----------|---------|
| Good divergence | Success | "Found better pattern at X" |
| Bad divergence | Failure | "Misread requirement, was Y" |
| Code review finding | Gotcha | "Anti-pattern: nested promises" |
| Established pattern | Convention | "Always use Z for database ops" |
| Test failure | Failure | "Edge case: empty array input" |

### How to Extract

```typescript
// After task completion
const wisdom = extractFromReport({
  divergences: executionReport.divergences,
  issues: codeReviewFindings,
  successes: executionReport.successes
})

// Categorize
categorizeItems(wisdom)

// Store
addWisdomItems(feature, wisdom)
```

### Wisdom File Location

```
.agents/wisdom/{feature}/learnings.md
```

Format:
```markdown
## Session: {timestamp}

### Conventions
- {pattern}: {location} — {rationale}

### Gotchas
- {anti-pattern}: {location} — {warning}

### Failures Avoided
- {failure}: {manifestation} — {prevention}
```

## Related Commands

- `/execute {plan-path}` — The execution workflow this skill supports
- `/planning {feature}` — Creates the plan artifacts that /execute consumes
- `/code-loop {feature}` — Next step after all task briefs complete (awaiting-review)
- `/prime` — Detects pending execution work via artifact scan
- `/wisdom` — View accumulated wisdom for a feature