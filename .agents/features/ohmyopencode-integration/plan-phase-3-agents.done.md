# Phase 3: Core Agent Definitions — Task Brief

## Feature Description

Create all 11 agent definitions from OhMyOpenCode as `.opencode/agents/*/SKILL.md` files, including Sisyphus (orchestrator), Hephaestus (deep worker), Atlas (todo conductor), Prometheus (interview planner), Oracle (architecture consultant), Metis (gap analyzer), Momus (plan reviewer), Sisyphus-Junior (category executor), Librarian (external docs), Explore (codebase grep), and Multimodal-Looker (PDF/image analysis).

## User Story

As an orchestrator, I want specialized agents for each task type (architecture consultation, codebase exploration, external research), so that I can delegate to the right agent for optimal results.

## Problem Statement

Current agent setup:
1. **Missing consultation agents** — No Oracle/Metis/Momus for architecture, gaps, and reviews
2. **Missing specialized agents** — No Librarian (external), Explore (internal), Multimodal-Looker
3. **No category executor** — No Sisyphus-Junior for category-spawned work
4. **No interview planner** — No Prometheus for planning with questions
5. **No deep worker** — No Hephaestus for autonomous problem-solving

## Solution Statement

Create 11 agent SKILL.md files following OhMyOpenCode's 5-component framework (Role → Mission → Context Gathering → Approach → Output Format), with appropriate models, temperatures, modes, and permissions.

## Feature Metadata

- **Depth**: heavy
- **Dependencies**: Phase 1 (AGENTS.md behavior), Phase 2 (Categories)
- **Estimated tasks**: 25
- **Priority**: Core integration

---

## Context References

### Source Files (OhMyOpenCode)
- `/tmp/oh-my-opencode/src/agents/sisyphus.ts` — Sisyphus orchestrator
- `/tmp/oh-my-opencode/src/agents/hephaestus.ts` — Hephaestus deep worker
- `/tmp/oh-my-opencode/src/agents/atlas/agent.ts` — Atlas todo conductor
- `/tmp/oh-my-opencode/src/agents/prometheus/index.ts` — Prometheus planner
- `/tmp/oh-my-opencode/src/agents/oracle.ts` — Oracle consultant
- `/tmp/oh-my-opencode/src/agents/metis.ts` — Metis gap analyzer
- `/tmp/oh-my-opencode/src/agents/momus.ts` — Momus reviewer
- `/tmp/oh-my-opencode/src/agents/sisyphus-junior/agent.ts` — Junior category executor
- `/tmp/oh-my-opencode/src/agents/librarian.ts` — Librarian external docs
- `/tmp/oh-my-opencode/src/agents/explore.ts` — Explore codebase grep
- `/tmp/oh-my-opencode/src/agents/multimodal-looker.ts` — Multimodal analyzer

### Target Files
- `.opencode/agents/sisyphus/SKILL.md` — NEW
- `.opencode/agents/hephaestus/SKILL.md` — NEW
- `.opencode/agents/atlas/SKILL.md` — NEW
- `.opencode/agents/prometheus/SKILL.md` — NEW
- `.opencode/agents/oracle/SKILL.md` — NEW
- `.opencode/agents/metis/SKILL.md` — NEW
- `.opencode/agents/momus/SKILL.md` — NEW
- `.opencode/agents/sisyphus-junior/SKILL.md` — NEW
- `.opencode/agents/librarian/SKILL.md` — NEW (may exist, update)
- `.opencode/agents/explore/SKILL.md` — NEW (may exist, update)
- `.opencode/agents/multimodal-looker/SKILL.md` — NEW

---

## Agents Overview

| # | Agent | Type | Model | Temperature | Mode | Permissions |
|---|-------|------|-------|-------------|------|--------------|
| 1 | **Sisyphus** | orchestrator | Claude Opus 4.6 | 0.1 | all | full |
| 2 | **Hephaestus** | deep worker | GPT-5.3 Codex | 0.1 | all | full |
| 3 | **Atlas** | todo conductor | Kimi K2.5 | 0.1 | primary | full |
| 4 | **Prometheus** | planner | Claude Opus 4.6 | 0.1 | subagent | read-only |
| 5 | **Oracle** | consultant | GPT-5.2 | 0.1 | subagent | read-only |
| 6 | **Metis** | gap analyzer | Claude Opus 4.6 | **0.3** | subagent | read-only |
| 7 | **Momus** | reviewer | GPT-5.2 | 0.1 | subagent | read-only |
| 8 | **Sisyphus-Junior** | executor | Claude Sonnet 4.6 | 0.1 | all | full (no task tool) |
| 9 | **Librarian** | external docs | Kimi K2.5 | 0.1 | subagent | read-only |
| 10 | **Explore** | internal grep | Grok Code Fast | 0.1 | subagent | read-only |
| 11 | **Multimodal-Looker** | PDF/image | Gemini 3 Flash | 0.1 | subagent | read-only |

---

## Key Decisions

1. **Agent Location**: Create in `.opencode/agents/{name}/SKILL.md`
2. **Mode**: `primary` (respects UI model), `subagent` (own fallback), `all` (both)
3. **Permissions**: Read-only for consultation agents, full for execution agents
4. **Temperature**: 0.1 for all except Metis (0.3 for creativity in gap analysis)
5. **Model Resolution**: Override → category-default → provider-fallback → system-default

---

## Step-by-Step Tasks

### Task 1-11: Create Each Agent SKILL.md

Each agent follows the same template structure with 5 components:

```markdown
# {Agent Name} — {Purpose}

## Role
{What this agent is and why it exists}

## Mission
{Primary goal and success criteria}

## Context Gathering
{How it gathers information before acting}

## Approach
{How it solves problems step-by-step}

## Output Format
{Structured output format}

## Rules
{Constraints and requirements}
```

#### Task 1: Sisyphus (Orchestrator)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/sisyphus/SKILL.md`
- **MODEL**: Claude Opus 4.6, temp=0.1, mode=all
- **PERMISSIONS**: full
- **IMPLEMENT**: Main orchestrator with Intent Gate, delegation, session continuity
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/sisyphus.ts`

#### Task 2: Hephaestus (Deep Worker)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/hephaestus/SKILL.md`
- **MODEL**: GPT-5.3 Codex, temp=0.1, mode=all
- **PERMISSIONS**: full
- **IMPLEMENT**: Autonomous deep worker, "Legitimate Craftsman" pattern
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/hephaestus.ts`

#### Task 3: Atlas (Todo Conductor)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/atlas/SKILL.md`
- **MODEL**: Kimi K2.5, temp=0.1, mode=primary
- **PERMISSIONS**: full
- **IMPLEMENT**: Todo orchestration, wisdom accumulation
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/atlas/agent.ts`

#### Task 4: Prometheus (Interview Planner)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/prometheus/SKILL.md`
- **MODEL**: Claude Opus 4.6, temp=0.1, mode=subagent
- **PERMISSIONS**: read-only
- **IMPLEMENT**: Interview-mode planning with questions
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/prometheus/`

#### Task 5: Oracle (Architecture Consultant)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/oracle/SKILL.md`
- **MODEL**: GPT-5.2, temp=0.1, mode=subagent
- **PERMISSIONS**: read-only
- **IMPLEMENT**: Architecture consultation, debugging help
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/oracle.ts`

#### Task 6: Metis (Gap Analyzer)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/metis/SKILL.md`
- **MODEL**: Claude Opus 4.6, temp=**0.3**, mode=subagent
- **PERMISSIONS**: read-only
- **IMPLEMENT**: Pre-planning gap analysis, hidden intentions
- **GOTCHA**: Uses higher temperature (0.3) for creative gap detection
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/metis.ts`

#### Task 7: Momus (Plan Reviewer)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/momus/SKILL.md`
- **MODEL**: GPT-5.2, temp=0.1, mode=subagent
- **PERMISSIONS**: read-only
- **IMPLEMENT**: Ruthless plan reviewer, rejects vague plans
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/momus.ts`

#### Task 8: Sisyphus-Junior (Category Executor)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/sisyphus-junior/SKILL.md`
- **MODEL**: Claude Sonnet 4.6, temp=0.1, mode=all
- **PERMISSIONS**: full EXCEPT task tool (cannot delegate)
- **IMPLEMENT**: Category-spawned executor with MUST DO / MUST NOT DO constraints
- **GOTCHA**: Blocked from delegating further — focused execution only
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/sisyphus-junior/`

#### Task 9: Librarian (External Docs)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/librarian/SKILL.md`
- **MODEL**: Kimi K2.5, temp=0.1, mode=subagent
- **PERMISSIONS**: read-only
- **IMPLEMENT**: External documentation search, code examples
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/librarian.ts`

#### Task 10: Explore (Internal Grep)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/explore/SKILL.md`
- **MODEL**: Grok Code Fast, temp=0.1, mode=subagent
- **PERMISSIONS**: read-only
- **IMPLEMENT**: Fast codebase grep, pattern discovery
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/explore.ts`

#### Task 11: Multimodal-Looker (PDF/Image)
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/multimodal-looker/SKILL.md`
- **MODEL**: Gemini 3 Flash, temp=0.1, mode=subagent
- **PERMISSIONS**: read-only
- **IMPLEMENT**: PDF analysis, image understanding
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/multimodal-looker.ts`

---

### Task 12-20: Agent Infrastructure

#### Task 12: Create Agent Registry
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/registry.ts`
- **IMPLEMENT**: Registry of all agents with metadata (model, temp, mode, permissions)
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/builtin-agents.ts`

#### Task 13: Create Agent Resolution Logic
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/resolve-agent.ts`
- **IMPLEMENT**: Resolve agent from category or name, handle fallbacks
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/builtin-agents/model-resolution.ts`

#### Task 14: Create Dynamic Prompt Builder
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/dynamic-prompt-builder.ts`
- **IMPLEMENT**: Build agent prompts dynamically based on available agents, skills, categories
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/dynamic-agent-prompt-builder.ts`

#### Task 15: Create Agent Overlays
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/overlays/` (new directory)
- **IMPLEMENT**: Create Gemini and GPT-specific overlay adjustments
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/sisyphus-gemini-overlays.ts`

#### Task 16: Add Permission Configuration
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/permissions.ts`
- **IMPLEMENT**: Permission levels (full, read-only, no-task, no-agent-call)
- **VALIDATE**: Oracle/Metis/Momus have read-only permissions

#### Task 17: Update Agent Templates
- **ACTION**: CREATE
- **TARGET**: `.opencode/templates/AGENT-TEMPLATE.md`
- **IMPLEMENT**: Update template with 5-component framework
- **VALIDATE**: Template matches pattern from OhMyOpenCode

#### Task 18: Create Agent Builder Factory
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/agent-builder.ts`
- **IMPLEMENT**: Factory for creating agent configs with resolution
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/agent-builder.ts`

#### Task 19: Add Environment Context
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/env-context.ts`
- **IMPLEMENT**: Capture environment context for dynamic prompts
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/env-context.ts`

#### Task 20: Create Available Agent Summaries
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/available-agents.ts`
- **IMPLEMENT**: Generate summaries for prompt inclusion
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/agents/custom-agent-summaries.ts`

---

### Task 21-25: Validation

#### Task 21: Write Agent Tests
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/*.test.ts`
- **IMPLEMENT**: Unit tests for each agent
- **VALIDATE**: `bun test src/agents/` passes

#### Task 22: Test Permission Enforcement
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/permissions.test.ts`
- **IMPLEMENT**: Test that read-only agents cannot write
- **VALIDATE**: Permission tests pass

#### Task 23: Test Model Resolution
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/model-resolution.test.ts`
- **IMPLEMENT**: Test fallback chain for model resolution
- **VALIDATE**: Resolution tests pass

#### Task 24: Test Dynamic Prompts
- **ACTION**: CREATE
- **TARGET**: `.opencode/agents/dynamic-prompt-builder.test.ts`
- **IMPLEMENT**: Test prompt assembly with different contexts
- **VALIDATE**: Prompt builder tests pass

#### Task 25: Integration Test
- **ACTION**: CREATE
- **TARGET**: `.opencode/tests/agent-dispatch.test.ts`
- **IMPLEMENT**: Full test of agent dispatch via task()
- **VALIDATE**: Integration tests pass

---

## Acceptance Criteria

### Implementation
- [ ] All 11 agent SKILL.md files created
- [ ] Each agent has 5-component structure
- [ ] Models and temperatures correctly assigned
- [ ] Permissions correctly configured
- [ ] Agent registry complete
- [ ] Dynamic prompt builder functional
- [ ] Model resolution logic works

### Runtime
- [ ] Can dispatch to each agent via task()
- [ ] Read-only agents cannot write files
- [ ] Category-spawned Junior cannot delegate
- [ ] Model fallback works correctly
- [ ] All tests pass

---

## Notes

- **Key decision**: Sisyphus-Junior blocked from task() tool to ensure focused execution
- **Risk**: Permission enforcement complexity
- **Mitigation**: Comprehensive permission tests
- **Confidence**: 9/10 — Clear patterns from source