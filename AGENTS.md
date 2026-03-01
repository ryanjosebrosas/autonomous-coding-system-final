# OpenCode AI Coding System

This repository contains an AI-assisted development framework with structured workflows, slash commands, agents, and context engineering methodology.

## Core Methodology

@.opencode/sections/01_core_principles.md

## PIV Loop (Plan → Implement → Validate)

@.opencode/sections/02_piv_loop.md

## Context Engineering (4 Pillars)

@.opencode/sections/03_context_engineering.md

## Git Save Points

@.opencode/sections/04_git_save_points.md

## Decision Framework

@.opencode/sections/05_decision_framework.md

## Archon Integration

@.opencode/sections/06_archon_workflow.md

---

## Project Structure

### Dynamic Content (`.agents/`)
All generated/dynamic content lives at project root:
- `.agents/features/{name}/` — All artifacts for one feature (plan, report, review, loop reports)
  - `plan.md` / `plan.done.md` — Feature plan overview + task index (marked done when all task briefs done)
  - `task-{N}.md` / `task-{N}.done.md` — Task briefs (one per `/execute` session, default mode)
  - `plan-master.md` — Master plan for very large multi-phase features (escape hatch)
  - `plan-phase-{N}.md` — Sub-plans for each phase (executed one per session, not sequentially)
  - `report.md` / `report.done.md` — Execution report (marked done after commit)
  - `review.md` / `review.done.md` — Code review (marked done when addressed)
  - `review-{N}.md` — Numbered reviews from `/code-loop` iterations
  - `loop-report-{N}.md` — Loop iteration reports
  - `checkpoint-{N}.md` — Loop checkpoints
  - `fixes-{N}.md` — Fix plans from `/code-loop`
- `.agents/specs/` — BUILD_ORDER, PILLARS, build-state.json
- `.agents/context/` — Session context
  - `next-command.md` — Pipeline handoff file (auto-updated by every pipeline command, read by `/prime`)

#### `.done.md` Lifecycle

| Artifact | Created by | Marked `.done.md` by | Trigger |
|----------|-----------|---------------------|---------|
| `plan.md` | `/planning` | `/execute` | All task briefs done (or legacy single plan executed) |
| `task-{N}.md` | `/planning` | `/execute` | Task brief fully executed in one session |
| `plan-master.md` | `/planning` | `/execute` | All phases completed |
| `plan-phase-{N}.md` | `/planning` | `/execute` | Phase fully executed |
| `report.md` | `/execute` | `/commit` | Changes committed to git |
| `review.md` | `/code-review` | `/commit` or `/code-loop` | All findings addressed |
| `review-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
| `loop-report-{N}.md` | `/code-loop` | `/code-loop` | Clean exit |
| `fixes-{N}.md` | `/code-loop` | `/code-loop` | Fixes fully applied |

#### Pipeline Handoff File

`.agents/context/next-command.md` is a **singleton** file overwritten by every pipeline command on completion. It tracks the current pipeline position so that `/prime` can surface "what to do next" when starting a new session.

| Field | Purpose |
|-------|---------|
| **Last Command** | Which command just completed |
| **Feature** | Active feature name |
| **Next Command** | Exact command to run next |
| **Master Plan** | Path to master plan (if multi-phase) |
| **Phase Progress** | N/M complete (if multi-phase) |
| **Task Progress** | N/M complete (if task brief mode) |
| **Timestamp** | When handoff was written |
| **Status** | Pipeline state (awaiting-execution, executing-tasks, executing-series, awaiting-review, awaiting-fixes, awaiting-re-review, ready-to-commit, ready-for-pr, pr-open, blocked, build-loop-continuing) |

The handoff file is NOT a log — it only contains the latest state. History lives in git commits and `.done.md` artifacts.

#### Feature Name Propagation

The **Feature** field in the handoff file is the canonical source for feature names. All pipeline commands must:
1. **Read** the Feature field from `.agents/context/next-command.md` first
2. **Fall back** to derivation (commit scope, report path, directory name) only if the handoff is missing or stale
3. **Write** the same Feature value to the handoff when completing

This ensures consistent feature names across sessions. If a command derives a feature name from a fallback source, it must match the handoff value. If they conflict, the handoff value wins.

#### Session Model (One Command Per Context Window)

Each session is one model context window. The autonomous flow is:

```
Session:  /prime → [one command] → END
```

**Task brief feature (default):**
```
Session 1:  /prime → /planning {feature}                         → END (plan.md + task-N.md files written)
Session 2:  /prime → /execute .agents/features/{f}/plan.md       → END (task 1 only — auto-detected)
Session 3:  /prime → /execute .agents/features/{f}/plan.md       → END (task 2 — auto-detected)
Session N+1:/prime → /execute .agents/features/{f}/plan.md       → END (task N — auto-detected)
Session N+2:/prime → /code-loop {feature}                        → END
Session N+3:/prime → /commit → /pr                               → END (both in same session)
```

**Master plan feature (multi-phase, escape hatch for 10+ task features):**
```
Session 1:  /prime → /planning {feature}                         → END (master + sub-plans written)
Session 2:  /prime → /execute .../plan-master.md                 → END (phase 1 only)
Session 3:  /prime → /execute .../plan-master.md                 → END (phase 2 — auto-detected)
Session 4:  /prime → /execute .../plan-master.md                 → END (phase N — auto-detected)
Session 5:  /prime → /code-loop {feature}                        → END
Session 6:  /prime → /commit → /pr                               → END (both in same session)
```

**Key rules:**
- `/execute` with task briefs executes ONE brief per session, never loops through all briefs
- `/execute` with a master plan executes ONE phase per session, never loops through all phases
- The handoff file tells the next session exactly what to run — the user just runs `/prime`
- Task brief detection is automatic: `/execute plan.md` scans for `task-{N}.done.md` files and picks the next undone brief
- Phase detection is automatic: `/execute plan-master.md` scans for `.done.md` files and picks the next undone phase
- If a session crashes, the brief/phase wasn't marked `.done.md`, so the next session retries it
- `/commit → /pr` runs in the same session when they are the final pipeline step. `/commit` writes a `ready-for-pr` handoff, but `/pr` runs immediately after (not in a separate session). If `/pr` fails, its failure handoff persists for the next `/prime` session.

### Static Configuration (`.opencode/`)
System configuration and reusable assets:
- `.opencode/commands/` — Slash commands
- `.opencode/agents/` — Custom subagents
- `.opencode/templates/` — Plan and document templates
- `.opencode/reference/` — On-demand guides (loaded when needed)
- `.opencode/sections/` — Auto-loaded rules (always loaded)
- `.opencode/skills/` — Planning methodology and workflows

---

## Key Commands

| Command | Purpose |
|---------|---------|
| `/prime` | Load codebase context at session start |
| `/planning {feature}` | Create structured implementation plan |
| `/execute {plan}` | Implement from plan |
| `/build` | Guided feature implementation with /pillars |
| `/code-review` | Technical code review |
| `/code-loop` | Automated review → fix → commit cycle |
| `/system-review` | Divergence analysis (plan vs implementation) |
| `/commit` | Conventional git commit |
| `/pr` | Create pull request from feature commits |
| `/sync` | Check Archon sync status |
| `/final-review` | Optional: human approval gate before commit |
| `/code-review-fix` | Apply fixes from code review findings |

---

## On-Demand Reference Guides

Load these when needed for specific tasks:

| Guide | When to Load |
|-------|--------------|
| `reference/piv-loop-practice.md` | Deep dive on PIV methodology |
| `reference/validation-discipline.md` | 5-level validation pyramid |
| `reference/implementation-discipline.md` | Execute command patterns |
| `reference/command-design-framework.md` | Creating new commands |
| `reference/system-foundations.md` | Core system architecture |
| `reference/layer1-guide.md` | Building CLAUDE.md/AGENTS.md |
