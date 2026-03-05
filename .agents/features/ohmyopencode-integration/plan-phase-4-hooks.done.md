# Phase 4: Lifecycle Hooks System — Task Brief

## Feature Description

Implement 46 lifecycle hooks from OhMyOpenCode across 5 tiers: Session, Tool-Guard, Transform, Continuation, and Skill. Hooks enable completion guarantees (todo continuation), session recovery, context injection, and automation.

## User Story

As an orchestrator, I want completion guarantees enforced via hooks, so that work never stalls and todos are always completed.

## Problem Statement

Current system:
1. **No todo enforcement** — Agent can stop mid-work
2. **No session recovery** — Lost context on interruption
3. **No category reminders** — Easy to forget skill loading
4. **No context injection** — Manual environment setup
5. **No boulder tracking** — No "push until done" mechanism

## Solution Statement

Implement hooks in 5 tiers, covering session lifecycle (23), tool guards (10), transforms (4), continuation (7), and skill hooks (2). Priority: todo-continuation, atlas, session-recovery, category-skill-reminder, background-notification.

## Feature Metadata

- **Depth**: heavy
- **Dependencies**: Phase 1-3
- **Estimated tasks**: 20
- **Priority**: Core for completion guarantees

---

## Context References

### Source Files (OhMyOpenCode)
- `/tmp/oh-my-opencode/src/hooks/` — 46 hook implementations
- `/tmp/oh-my-opencode/src/plugin/hooks/` — Hook composition
- Key hooks: `todo-continuation/`, `atlas/`, `session-recovery/`, `category-skill-reminder/`, `background-notification/`

### Target Files
- `.opencode/hooks/*/index.ts` — Individual hook implementations
- `.opencode/plugin/hooks/` — Hook composition

---

## Hook Tiers

| Tier | Count | Purpose | Priority |
|------|-------|---------|----------|
| **Session** | 23 | Session lifecycle, idle, errors | HIGH |
| **Tool-Guard** | 10 | Pre-tool validation, file protection | HIGH |
| **Transform** | 4 | Message/context transformation | MEDIUM |
| **Continuation** | 7 | Todo/task continuation enforcement | CRITICAL |
| **Skill** | 2 | Skill-specific hooks | LOW |

---

## Priority Hooks (Implement First)

### 1. todo-continuation
- **Purpose**: Enforce todo completion before response
- **Trigger**: Agent attempts response with incomplete todos
- **Action**: Inject system reminder to force completion
- **File**: `.opencode/hooks/todo-continuation/index.ts`

### 2. atlas
- **Purpose**: Read boulder.json, orchestrate todo list
- **Trigger**: Session start with boulder.json
- **Action**: Load todos, switch to Atlas mode
- **File**: `.opencode/hooks/atlas/index.ts`

### 3. session-recovery
- **Purpose**: Resume interrupted sessions
- **Trigger**: Session recovery request
- **Action**: Load context, resume from last state
- **File**: `.opencode/hooks/session-recovery/index.ts`

### 4. category-skill-reminder
- **Purpose**: Remind to use category + skills
- **Trigger**: Before task dispatch
- **Action**: Check if category/skills available, suggest
- **File**: `.opencode/hooks/category-skill-reminder/index.ts`

### 5. background-notification
- **Purpose**: Notify on background task completion
- **Trigger**: Background task completes
- **Action**: Send notification with results
- **File**: `.opencode/hooks/background-notification/index.ts`

---

## Key Decisions

1. **Hook Tiers**: 5 tiers with clear execution order
2. **Priority Order**: Continuation hooks first, then session, then tool-guard
3. **Composition**: Hooks compose via plugin infrastructure
4. **Timeout Limits**: Hook execution must complete in <500ms

---

## Step-by-Step Tasks

### Session Hooks (Tasks 1-10)

#### Task 1: Create Hook Base Infrastructure
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/base.ts`
- **IMPLEMENT**: Base hook interface and types
- **PATTERN**: Follow OhMyOpenCode hook structure

#### Task 2: Create todo-continuation Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/todo-continuation/index.ts`
- **IMPLEMENT**: Check incomplete todos, inject reminder
- **TRIGGER**: Before agent response
- **VALIDATE**: Hook fires on incomplete todos

#### Task 3: Create atlas Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/atlas/index.ts`
- **IMPLEMENT**: Read boulder.json, orchestrate todos
- **TRIGGER**: Session start with boulder file
- **VALIDATE**: Hook loads todo list correctly

#### Task 4: Create session-recovery Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/session-recovery/index.ts`
- **IMPLEMENT**: Load context, resume from state
- **TRIGGER**: Recovery request
- **VALIDATE**: Hook restores session state

#### Task 5: Create agent-usage-reminder Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/agent-usage-reminder/index.ts`
- **IMPLEMENT**: Remind about available agents
- **TRIGGER**: Periodic reminder

#### Task 6: Create anthropic-effort Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/anthropic-effort/index.ts`
- **IMPLEMENT**: Adjust Anthropic effort level
- **TRIGGER**: Before model call

#### Task 7: Create auto-slash-command Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/auto-slash-command/index.ts`
- **IMPLEMENT**: Auto-execute slash commands
- **TRIGGER**: Keyword detection

#### Task 8: Create keyword-detector Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/keyword-detector/index.ts`
- **IMPLEMENT**: Detect keywords, trigger actions
- **TRIGGER**: Message contains keyword

#### Task 9: Create non-interactive-env Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/non-interactive-env/index.ts`
- **IMPLEMENT**: Setup non-interactive environment
- **TRIGGER**: Non-interactive session start

#### Task 10: Create compaction-todo-preserver Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/compaction-todo-preserver/index.ts`
- **IMPLEMENT**: Preserve todos during compaction
- **TRIGGER**: Context compaction

---

### Tool-Guard Hooks (Tasks 11-15)

#### Task 11: Create rules-injector Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/rules-injector/index.ts`
- **IMPLEMENT**: Inject project rules into context
- **TRIGGER**: Before tool execution
- **PATTERN**: Pre-tool hook

#### Task 12: Create comment-checker Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/comment-checker/index.ts`
- **IMPLEMENT**: Check for AI-generated comments
- **TRIGGER**: After file write
- **VALIDATE**: Rejects AI comment patterns

#### Task 13: Create directory-agents-injector Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/directory-agents-injector/index.ts`
- **IMPLEMENT**: Inject directory-level agents
- **TRIGGER**: Context assembly

#### Task 14: Create directory-readme-injector Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/directory-readme-injector/index.ts`
- **IMPLEMENT**: Inject directory READMEs
- **TRIGGER**: Context assembly

#### Task 15: Create read-image-resizer Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/read-image-resizer/index.ts`
- **IMPLEMENT**: Resize images before processing
- **TRIGGER**: Image read

---

### Transform Hooks (Tasks 16-18)

#### Task 16: Create compaction-context-injector Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/compaction-context-injector/index.ts`
- **IMPLEMENT**: Inject context during compaction
- **TRIGGER**: Context compaction

#### Task 17: Create hashline-read-enhancer Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/hashline-read-enhancer/index.ts`
- **IMPLEMENT**: Enhance hashline-based reads
- **TRIGGER**: File read with hashlines

#### Task 18: Create question-label-truncator Hook
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/question-label-truncator/index.ts`
- **IMPLEMENT**: Truncate question labels
- **TRIGGER**: Question output

---

### Continuation Hooks (Tasks 19)

#### Task 19: Create Background Notification System
- **ACTION**: CREATE
- **TARGET**: `.opencode/hooks/background-notification/index.ts`
- **IMPLEMENT**: Notify on background task completion
- **TRIGGER**: Background task done

---

### Hook Registration (Task 20)

#### Task 20: Create Hook Composition
- **ACTION**: CREATE
- **TARGET**: `.opencode/plugin/hooks/create-hooks.ts`
- **IMPLEMENT**: Register all hooks in correct order
- **PATTERN**: Follow OhMyOpenCode hook composition
- **VALIDATE**: Hooks execute in tier order

---

## Testing Strategy

### Hook Unit Tests
- Each hook has isolated unit tests
- Mock trigger conditions
- Verify action taken

### Integration Tests
- Hook composition order
- Multiple hook interactions
- Performance (timeouts)

---

## Acceptance Criteria

### Implementation
- [ ] 46 hooks created (in priority order)
- [ ] All 5 tiers implemented
- [ ] Hook composition infrastructure complete
- [ ] Todo-continuation hook enforces completion
- [ ] Atlas hook reads boulder.json
- [ ] Session-recovery hook restores state

### Runtime
- [ ] Hooks execute in correct tier order
- [ ] Todo continuation prevents early termination
- [ ] Session recovery works after crash
- [ ] Category reminders appear when needed
- [ ] All hook tests pass

---

## Notes

- **Key decision**: Continuation hooks are CRITICAL for "boulder pushing" guarantee
- **Risk**: Hook performance overhead
- **Mitigation**: Lazy load hooks, use priority tiers
- **Confidence**: 8/10 — Well-defined patterns, but 46 hooks is substantial