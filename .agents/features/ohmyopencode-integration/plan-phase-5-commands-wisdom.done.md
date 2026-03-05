# Phase 5: Commands + Wisdom System — Task Brief

## Feature Description

Implement slash commands (`/prometheus`, `/start-work`, `/ultrawork`, `/ralph-loop`) for planning and execution, plus the wisdom accumulation system that passes learnings from task to task.

## User Story

As an orchestrator, I want interview-mode planning that asks questions before writing code, and wisdom accumulation that learns from each task so I don't repeat mistakes.

## Problem Statement

Current system:
1. **No interview planning** — `/planning` writes directly without questions
2. **No execution trigger** — No `/start-work` to switch to Atlas mode
3. **No wisdom accumulation** — Each task starts fresh without learnings
4. **No boulder tracking** — No persistent "push until done" state

## Solution Statement

Add `/prometheus` command for interview-mode planning (asks questions, analyzes gaps, gets reviewed), `/start-work` to trigger Atlas execution, `/ultrawork` for deep autonomous work, and wisdom notepad system that accumulates learnings across tasks.

## Feature Metadata

- **Depth**: heavy
- **Dependencies**: Phase 1-4
- **Estimated tasks**: 15
- **Priority**: Core for planning and learning

---

## Context References

### Source Files (OhMyOpenCode)
- `/tmp/oh-my-opencode/src/agents/prometheus/` — Interview-mode planner
- `/tmp/oh-my-opencode/src/agents/prometheus/interview-mode.ts` — Interview logic
- `/tmp/oh-my-opencode/src/agents/prometheus/plan-generation.ts` — Plan writing
- `/tmp/oh-my-opencode/.opencode/command/` — Slash commands
- Key concepts: `.sisyphus/plans/`, `.sisyphus/notepads/`, `boulder.json`

### Target Files
- `.opencode/commands/prometheus/SKILL.md` — NEW
- `.opencode/commands/start-work/SKILL.md` — NEW
- `.opencode/commands/ultrawork/SKILL.md` — NEW
- `.opencode/commands/ralph-loop/SKILL.md` — NEW
- `.agents/wisdom/` — NEW: Wisdom accumulation

---

## Commands

### /prometheus — Interview-Mode Planner
- **Purpose**: Plan with questions, not just write
- **Flow**: Interview → Gap Analysis (Metis) → Plan → Review (Momus) → Approve
- **Output**: `.sisyphus/plans/{feature}.md`

### /start-work — Execution Trigger
- **Purpose**: Read plan, switch to Atlas mode, execute todos
- **Flow**: Read plan → Load todos → Switch to Atlas → Begin execution
- **Input**: `.sisyphus/plans/{feature}.md`

### /ultrawork — Deep Autonomous Work
- **Purpose**: Keyword trigger for deep problem-solving
- **Flow**: Trigger when user says "ultrawork" → Spawn Hephaestus with autonomy
- **Model**: Maximum capability, long context

### /ralph-loop — Self-Referential Loop
- **Purpose**: Continuous improvement loop
- **Flow**: Execute → Review → Fix → Re-review until clean
- **Integration**: Works with wisdom accumulation

---

## Wisdom System

```
.agents/wisdom/{feature}/
├── learnings.md      # Patterns, conventions, successes
├── decisions.md      # Architectural choices + rationales
├── issues.md         # Blockers, gotchas, problems encountered
├── verification.md   # Test results, validation outcomes
└── problems.md       # Unresolved issues, technical debt
```

**Flow**:
1. After task completion → Extract learnings
2. Categorize: Conventions, Successes, Failures, Gotchas
3. On next task → Inject relevant wisdom into prompt
4. Wisdom accumulates → Prevents repeating mistakes

---

## Key Decisions

1. **Wisdom Location**: `.agents/wisdom/` alongside `.agents/features/`
2. **Plan Location**: `.sisyphus/plans/` for Prometheus output
3. **Boulder Format**: `boulder.json` with todo list state
4. **Interview Mode**: Metis analyzes gaps, Momus reviews final plan

---

## Step-by-Step Tasks

### Commands (Tasks 1-8)

#### Task 1: Create /prometheus Command
- **ACTION**: CREATE
- **TARGET**: `.opencode/commands/prometheus/SKILL.md`
- **IMPLEMENT**: Interview-mode planner with questions
- **FLOW**: Interview → Metis gap analysis → Plan generation → Momus review
- **OUTPUT**: `.sisyphus/plans/{feature}.md`
- **VALIDATE**: Command enters interview mode on invocation

#### Task 2: Create /prometheus Interview Logic
- **ACTION**: CREATE
- **TARGET**: `.opencode/commands/prometheus/interview.ts`
- **IMPLEMENT**: Question generation, scope clarification, constraint gathering
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/prometheus/interview-mode.ts`

#### Task 3: Create /prometheus Plan Template
- **ACTION**: CREATE
- **TARGET**: `.opencode/commands/prometheus/plan-template.ts`
- **IMPLEMENT**: Plan structure with all required sections
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/prometheus/plan-template.ts`

#### Task 4: Create /start-work Command
- **ACTION**: CREATE
- **TARGET**: `.opencode/commands/start-work/SKILL.md`
- **IMPLEMENT**: Read plan, switch to Atlas, execute todos
- **FLOW**: Read `.sisyphus/plans/{feature}.md` → Load todos → Begin execution
- **VALIDATE**: Command reads plan and starts execution

#### Task 5: Create /start-work Boulder Handler
- **ACTION**: CREATE
- **TARGET**: `.opencode/commands/start-work/boulder.ts`
- **IMPLEMENT**: Manage `boulder.json` state file
- **STATE**: Current todo, progress, failures
- **VALIDATE**: Boulder file created and updated correctly

#### Task 6: Create /ultrawork Command
- **ACTION**: CREATE
- **TARGET**: `.opencode/commands/ultrawork/SKILL.md`
- **IMPLEMENT**: Deep autonomous work trigger
- **FLOW**: Detect "ultrawork" keyword → Spawn Hephaestus with autonomy
- **VALIDATE**: Keyword triggers deep work mode

#### Task 7: Create /ralph-loop Command
- **ACTION**: CREATE
- **TARGET**: `.opencode/commands/ralph-loop/SKILL.md`
- **IMPLEMENT**: Self-referential improvement loop
- **FLOW**: Execute → Review → Fix → Re-review until clean
- **VALIDATE**: Loop runs until exit criteria met

#### Task 8: Register Commands
- **ACTION**: UPDATE
- **TARGET**: `.opencode/plugin/commands.ts`
- **IMPLEMENT**: Register all 4 new commands
- **VALIDATE**: Commands appear in available commands

---

### Wisdom System (Tasks 9-15)

#### Task 9: Create Wisdom Directory Structure
- **ACTION**: CREATE
- **TARGET**: `.agents/wisdom/` directory
- **IMPLEMENT**: Create wisdom storage location
- **STRUCTURE**: `{feature}/learnings.md`, `decisions.md`, `issues.md`, etc.

#### Task 10: Create Wisdom Extractor
- **ACTION**: CREATE
- **TARGET**: `.opencode/features/wisdom/extractor.ts`
- **IMPLEMENT**: Extract learnings from completed task
- **PATTERN**: Parse task output for patterns, conventions, gotchas

#### Task 11: Create Wisdom Categorizer
- **ACTION**: CREATE
- **TARGET**: `.opencode/features/wisdom/categorizer.ts`
- **IMPLEMENT**: Categorize learnings into: Conventions, Successes, Failures, Gotchas
- **PATTERN**: Follow OhMyOpenCode wisdom categorization

#### Task 12: Create Wisdom Injector
- **ACTION**: CREATE
- **TARGET**: `.opencode/features/wisdom/injector.ts`
- **IMPLEMENT**: Inject relevant wisdom into subagent prompts
- **FLOW**: On task start → Load feature wisdom → Inject into prompt

#### Task 13: Create Wisdom Storage
- **ACTION**: CREATE
- **TARGET**: `.opencode/features/wisdom/storage.ts`
- **IMPLEMENT**: Read/write wisdom files
- **FORMAT**: Markdown files with structured sections

#### Task 14: Integrate with /execute
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/execute/SKILL.md`
- **IMPLEMENT**: After task completion, extract and store wisdom
- **VALIDATE**: Wisdom accumulated after each task execution

#### Task 15: Integrate with /prime
- **ACTION**: UPDATE
- **TARGET**: `.opencode/commands/prime/SKILL.md`
- **IMPLEMENT**: During prime, load relevant wisdom for context
- **VALIDATE**: Wisdom injected into context on session start

---

## Testing Strategy

### Command Tests
- `/prometheus` enters interview mode
- `/start-work` reads plan and starts execution
- `/ultrawork` spawns deep worker
- `/ralph-loop` runs until clean

### Wisdom Tests
- Wisdom extracted from task
- Wisdom categorized correctly
- Wisdom injected on next task
- Wisdom persists across sessions

---

## Acceptance Criteria

### Implementation
- [ ] `/prometheus` command creates interview-mode plan
- [ ] `/start-work` command reads plan and executes
- [ ] `/ultrawork` command spawns deep worker
- [ ] `/ralph-loop` command runs improvement loop
- [ ] Wisdom extracted after task completion
- [ ] Wisdom categorized and stored
- [ ] Wisdom injected on task start

### Runtime
- [ ] `/prometheus` asks questions before writing code
- [ ] `/start-work` switches to Atlas mode correctly
- [ ] Wisdom accumulates across tasks
- [ ] Learnings prevent repeating mistakes
- [ ] All tests pass

---

## Notes

- **Key decision**: Wisdom stored per-feature, not global
- **Risk**: Wisdom accumulation overhead
- **Mitigation**: Lazy load wisdom, selective injection
- **Confidence**: 8/10 — Clear patterns, but integration complexity