# /ralph-loop — Self-Referential Development Loop

## Pipeline Position

```
/execute → /code-loop → /ralph-loop (this) → autonomous improvement → clean exit
```

An alternative to `/code-loop` that runs a self-referential, autonomous improvement loop until the code is clean.

## Purpose

Named after Ralph, the loop runs continuously: execute → review → fix → re-review → repeat, accumulating wisdom from each iteration until all issues are resolved. It's self-referential because each iteration learns from previous ones.

## Usage

```
/ralph-loop {feature}
```

- `$ARGUMENTS` — Feature name with report in `.agents/features/{feature}/report.md`

---

## The Ralph Loop Concept

Unlike `/code-loop` which runs code-review → fix → review, Ralph accumulates wisdom:

1. **Execute**: Make changes or fix issues
2. **Review**: Analyze for problems
3. **Learn**: Extract wisdom from what was found/fixed
4. **Fix**: Apply fixes using learned wisdom
5. **Re-review**: Check for new issues
6. **Iterate**: Repeat until clean

Each iteration makes the next one smarter because wisdom accumulates.

---

## Step 0: Initialization

### Load Report

Read: `.agents/features/{feature}/report.md`

### Load Wisdom (if exists)

Read: `.agents/wisdom/{feature}/learnings.md`

If not exists, start with empty wisdom.

### Initialize Loop State

Create: `.agents/features/{feature}/ralph-state.json`

```json
{
  "iteration": 0,
  "max_iterations": 10,
  "issues_total": 0,
  "issues_fixed": 0,
  "issues_by_severity": {
    "critical": { "found": 0, "fixed": 0 },
    "major": { "found": 0, "fixed": 0 },
    "minor": { "found": 0, "fixed": 0 }
  },
  "wisdom_accumulated": [],
  "exit_condition": null,
  "started": "{ISO timestamp}"
}
```

---

## Step 1: Run Code Review

Spawn a code review agent:

```typescript
task(
  subagent_type: "code-review",
  load_skills: ["code-review"],
  prompt: `Review the implementation for {feature}.

[CONTEXT]: This is iteration {N} of the Ralph loop. Previous iterations found: {issues_from_last}

[GOAL]: Find ALL issues at all severity levels.

[WISDOM APPLIED]:
{accumulated_wisdom}

[REQUEST]:
1. Review all files modified in this feature
2. Classify each issue: Critical / Major / Minor
3. Check for patterns we've seen before (avoid re-finding same issues)
4. Return structured findings with exact locations`,
  run_in_background: false
)
```

Save findings to: `.agents/features/{feature}/review-{N}.md`

---

## Step 2: Analyze Findings

### Count Issues by Severity

```typescript
const critical = findings.filter(f => f.severity === 'critical')
const major = findings.filter(f => f.severity === 'major')
const minor = findings.filter(f => f.severity === 'minor')
```

### Check Exit Conditions

| Condition | Action |
|-----------|--------|
| 0 issues found | → EXIT CLEAN |
| Only minor issues | → ASK: fix or skip? |
| Any critical/major | → CONTINUE to fix |
| Max iterations reached (10) | → EXIT BLOCKED |
| Same issues 3+ times | → EXIT BLOCKED (escalate) |

---

## Step 3: Extract Wisdom

Before fixing, extract wisdom from each finding:

```typescript
import { categorize } from '.opencode/features/wisdom/categorizer'

for (const issue of findings) {
  const category = categorize({
    pattern: issue.type,
    problem: issue.message,
    solution: issue.suggestion,
    location: issue.location,
    severity: issue.severity,
    timestamp: new Date().toISOString(),
    confidence: 80
  })
  
  state.wisdom_accumulated.push({
    category,
    pattern: issue.type,
    problem: issue.message,
    solution: issue.suggestion,
    location: issue.location,
    severity: issue.severity,
    iteration: state.iteration
  })
}
```

**Categories from categorizer.ts:**
- `Convention`: Patterns to follow (keyword matching)
- `Success`: What worked well  
- `Failure`: What didn't work
- `Gotcha`: Anti-patterns to avoid

Save wisdom to: `.agents/wisdom/{feature}/learnings.md`

```markdown
# Wisdom: {feature}

## Iteration {N}

### Conventions
- {pattern}: {location} — {why it matters}

### Gotchas
- {anti-pattern}: {location} — {why to avoid}

### Failures Avoided
- {failure}: {how it manifested} — {how to prevent}

## Cumulative Wisdom

### Patterns Observed
- {pattern_1}
- {pattern_2}
```

---

## Step 4: Fix Issues (with Wisdom)

Use accumulated wisdom to fix smarter:

```typescript
task(
  subagent_type: "hephaestus",  // or "code-review-fix" skill
  load_skills: ["code-review-fix"],
  prompt: `Fix the following issues for {feature}.

[CONTEXT]: Ralph loop iteration {N}. We've learned:

{accumulated_wisdom}

[ISSUES TO FIX]:
{findings}

[WISDOM GUIDANCE]:
- Avoid the patterns that caused issues before
- Follow the successful patterns we've identified
- Apply the gotchas we've documented

[PRIORITY ORDER]:
1. Critical issues first
2. Major issues second
3. Minor issues third (only if user approved)

Fix all {count} issues. Report each fix with before/after.`,
  run_in_background: false
)
```

---

## Step 5: Update State

After fixes:

```typescript
state.iteration += 1
state.issues_fixed += fixedCount
state.issues_by_severity.critical.fixed += criticalFixed
state.issues_by_severity.major.fixed += majorFixed
state.issues_by_severity.minor.fixed += minorFixed

writeFileSync(ralphStatePath, JSON.stringify(state, null, 2))
```

---

## Step 6: Loop Checkpoint

Before next iteration:

```markdown
**Checkpoint {N}** - {timestamp}
- Iteration: {N} of {max}
- Issues found: {count}
- Issues fixed: {fixed}
- Remaining: {remaining}
- Wisdom items: {wisdom_count}
- Exit condition: {condition or "none yet"}
```

Save to: `.agents/features/{feature}/checkpoint-{N}.md`

---

## Step 7: Loop or Exit

### Continue Condition

If issues remain and iteration < max:
1. Update previous findings for comparison
2. Continue to Step 1 (next review)

### Exit Clean

If 0 issues found:
```
## Ralph Loop Complete: {feature}

**Iterations**: {N}
**Issues Fixed**: {total}
- Critical: {count}
- Major: {count}
- Minor: {count}

**Wisdom Accumulated**: {count} items
- Conventions: {count}
- Gotchas: {count}
- Failures Avoided: {count}

**Status**: Clean exit — all issues resolved
**Next**: Run `/commit` when ready
```

Archive:
- `.agents/features/{feature}/ralph-state.json` → `.agents/features/{feature}/ralph-state.done.json`
- `.agents/features/{feature}/checkpoint-{N}.md` → `.agents/features/{feature}/checkpoint-{N}.done.md`

### Exit Blocked

If max iterations reached or stuck:
```
## Ralph Loop Blocked: {feature}

**Reason**: {reason}
**Iterations**: {N}
**Remaining Issues**: {count}

**Issue Pattern**: Same issues appearing 3+ times
**Recommendation**: {action}

**Stuck Items**:
- {issue_1}
- {issue_2}

Next steps:
1. Review stuck items manually
2. Adjust approach
3. Resume with `/ralph-loop {feature} --continue`
```

Write handoff with `blocked` status.

---

## Step 8: Wisdom Persistence

After clean exit:

### Update Feature Wisdom

Write to: `.agents/wisdom/{feature}/learnings.md`

```markdown
# Wisdom: {feature}

## Session Summary

**Total Iterations**: {N}
**Issues Fixed**: {count}

## Learned Conventions

1. {convention_1}
   - Pattern: {pattern}
   - Why: {rationale}

2. {convention_2}
   - Pattern: {pattern}
   - Why: {rationale}

## Gotchas Avoided

1. {gotcha_1}
   - Anti-pattern: {pattern}
   - Issue: {what_happened}
   - Fix: {how_fixed}

2. {gotcha_2}
   - Anti-pattern: {pattern}
   - Issue: {what_happened}
   - Fix: {how_fixed}

## Failures Prevented

1. {failure_1}
   - Symptom: {how_manifested}
   - Root cause: {why}
   - Prevention: {how_to_prevent}

## Patterns for Future

1. {pattern_1}
2. {pattern_2}
```

---

## Continue Flag

```
/ralph-loop {feature} --continue
```

Resume from interrupted state:
1. Read `.agents/features/{feature}/ralph-state.json`
2. Determine last iteration
3. Continue from there

---

## Wisdom Categories

| Category | Description | Example |
|----------|-------------|---------|
| **Convention** | Pattern to follow | "Use async/await for all DB calls" |
| **Success** | What worked well | "Parallel spawn reduced time by 70%" |
| **Failure** | What didn't work | "Nested promises caused memory leak" |
| **Gotcha** | Anti-pattern to avoid | "Don't use var in async contexts" |

---

## Pipeline Handoff

After clean exit:

```markdown
# Pipeline Handoff

- **Last Command**: /ralph-loop
- **Feature**: {feature}
- **Iterations**: {N}
- **Wisdom**: {count} items accumulated
- **Next Command**: /commit
- **Timestamp**: {ISO 8601}
- **Status**: ready-to-commit
```

---

## Notes

- Wisdom accumulates across iterations, making each one smarter
- Max 10 iterations to prevent infinite loops
- Stuck detection: same issue 3+ times triggers escalation
- Wisdom persists for future sessions on same feature
- Works with `/code-loop` findings format