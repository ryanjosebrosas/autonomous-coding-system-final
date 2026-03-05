---
name: prime
description: Knowledge framework for comprehensive context loading, stack detection, and pending work accuracy
license: MIT
compatibility: opencode
---

# Prime — Context Loading Methodology

This skill provides the quality standards for running effective priming sessions. It
complements the `/prime` command — the command provides the workflow, this skill provides
the completeness criteria and edge case handling.

## When This Skill Applies

- `/prime` command is invoked
- Session starts and context needs loading before any implementation work
- Pending work state needs to be determined accurately
- Tech stack needs to be detected for a new or unfamiliar codebase

## Dirty State Awareness

The dirty state check is the FIRST thing, not optional context. Why it matters:

**If you skip dirty state and start implementation work on top of uncommitted changes:**
- The new work mixes with the old changes in `git diff`
- Commit scope becomes unclear (what belongs to which feature?)
- Code review covers changes from two different efforts
- Rolling back becomes a surgical operation

**What "dirty" means in context:**
- Modified files (M): changes in progress, may be intentional
- Deleted files (D): could be intentional cleanup or accidental
- Untracked files (??): new files not yet staged

Present all three categories. Don't just say "dirty" — list the files so the user can
make an informed decision.

## Stack Detection Quality

A complete stack detection covers all four detection layers:

| Layer | What It Detects | Why It Matters |
|-------|----------------|----------------|
| Package manifests | Language + framework + major deps | Determines which commands are available |
| Linter config | L1 validation command | `npx eslint .` vs `ruff check .` vs `golangci-lint run` |
| Type checker | L2 validation command | `tsc --noEmit` vs `mypy` vs `cargo check` |
| Test runner | L3/L4 validation commands | `jest` vs `pytest` vs `go test ./...` |

If any layer is missing from `.claude/config.md`, note it in the report — don't silently
skip it. "L2 Types: not detected — no tsconfig.json or mypy.ini found" is more useful
than a blank field.

**Detection precedence:**
1. `.claude/config.md` (user override) — always wins
2. Auto-detection from project files — fallback
3. "Not detected" — explicit, not silent

## Pending Work Detection Accuracy

The merge logic between handoff file and artifact scan is the most failure-prone part
of /prime. Key rules:

**Handoff stale detection:**
The handoff file becomes stale when /execute or /commit runs in a different session
than expected. Signs of stale handoff:
- Handoff says `awaiting-execution` but `plan.done.md` exists (plan already executed)
- Handoff says `executing-tasks` but all `task-N.done.md` files exist (all tasks done)
- Handoff says `ready-to-commit` but `git log` shows the commit already happened

When stale: artifact scan wins. Always note "Handoff stale — overridden by artifact state"
so the user knows why the displayed state differs from the handoff file.

**Artifact scan completeness:**
For each feature directory under `.agents/features/`, check ALL of:
- plan.md / plan.done.md → determines if execution started
- task-N.md / task-N.done.md → determines task brief progress
- report.md / report.done.md → determines if execution report was written
- review.md / review.done.md → determines if code review has open findings
- review-N.md / review-N.done.md → code loop review progress

Missing any of these produces an incomplete picture.

## Config.md Creation Standards

When creating `.claude/config.md` for the first time:
- Include the auto-detection date as a comment so users know when it was last refreshed
- Mark every detected value as auto-detected vs. manually set
- Leave fields as "not detected — set manually" rather than guessing or leaving blank
- For validation commands: test the command exists before writing it
  (`which eslint` or `npx eslint --version` before writing `npx eslint .`)

When updating `.claude/config.md`:
- User-set values take priority — never overwrite them
- Auto-detected values that changed since last run should be flagged, not silently updated
- Preserve any comments the user has added

## Memory Context Health

When reading `memory.md`, assess staleness:
- Last session < 7 days: Fresh
- Last session 7-30 days: Stale — flag with date
- Last session > 30 days: Very stale — flag prominently
- No session notes: First session or memory not yet started

A stale memory means the Key Decisions and Gotchas sections may no longer reflect the
current codebase state. Flag this so the user can decide whether to update memory.md.

## Wisdom Injection

Load and inject feature wisdom at session start:

### When to Inject

- During `/prime` for any feature with active work
- When `/execute` starts a new task
- When `/code-loop` begins review
- When `/ralph-loop` starts iteration

### How to Inject

```typescript
// Build wisdom block for prompts
const wisdomBlock = buildInjectionBlock({
  feature: currentFeature,
  files: modifiedFiles,
  keywords: taskKeywords,
  patterns: expectedPatterns
})

// Prepend to task context
const prompt = `${wisdomBlock}${originalPrompt}`
```

### What Gets Injected

1. **Gotchas** — Anti-patterns to avoid
2. **Failures** — Problems encountered before
3. **Conventions** — Patterns to follow
4. **Successes** — What worked well

### Injection Format

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WISDOM FROM PREVIOUS SESSIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ⚠️ GOTCHAS TO AVOID
- **Pattern**: Issue description
  - Fix: Resolution
  - Location: Where it applies

## ❌ FAILURES AVOIDED
- **Pattern**: What went wrong
  - Resolution: How it was fixed
  - Severity: critical/major/minor

## 📋 CONVENTIONS TO FOLLOW
- **Pattern**: What to do
  - Location: Where to apply

## ✅ SUCCESSFUL PATTERNS
- **Approach**: What worked
  - Context: Situation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Wisdom Context in Prime Report

When presenting `/prime` output, include wisdom section:

```
### Wisdom Context

Feature: {feature}
- Conventions: {count} patterns
- Gotchas: {count} warnings
- Failures: {count} avoided
- Successes: {count} proven

Top 3 relevant insights:
1. {gotcha_1}
2. {convention_1}
3. {success_1}
```

### First Wisdom Extraction

If no wisdom exists for a feature, prime creates an initial file:

```
.agents/wisdom/{feature}/
├── learnings.md      # Patterns, conventions, successes
└── README.md         # Wisdom system explanation
```

## Anti-Patterns

**Silent missing detection** — When a stack detection layer finds nothing, do not skip
it silently. "L1 Lint: not detected" is better than a missing row in the config.
Users need to know what's missing so they can set it manually.

**Trusting a stale handoff** — The handoff file is a snapshot from when a command last
ran. If the artifact state contradicts it, the handoff is wrong. Artifact scan is ground
truth because it reads actual file existence.

**Skipping dirty state display** — "WARNING: Uncommitted changes" without listing the
files is unhelpful. Show the file list so the user can decide whether to commit first.

**System Mode when Codebase Mode is appropriate** — If `src/` or `app/` exists but
the glob didn't find files, check manually before defaulting to System Mode. False
System Mode means stack detection is skipped entirely.

**Config.md overwrite** — Creating a fresh `config.md` every time /prime runs
erases user overrides. Read first, update only non-overridden fields.

## Key Rules

1. **Dirty state is first** — Check before loading any other context
2. **All four detection layers** — package manifest → linter → type checker → test runner
3. **Explicit missing values** — "not detected" not blank
4. **Artifact scan overrides stale handoff** — File existence is ground truth
5. **User config overrides auto-detection** — Never silently overwrite manual settings
6. **Memory health assessment** — Flag stale memory, don't suppress it
7. **System Mode vs Codebase Mode is a real distinction** — Wrong mode means missing context

## Related Commands

- `/prime` — The context loading workflow this skill supports
- `/planning {feature}` — Reads config.md for validation commands during plan writing
- `/execute {plan}` — Reads config.md for L1-L4 validation commands
- `/code-review` — Reads config.md for lint/type check commands