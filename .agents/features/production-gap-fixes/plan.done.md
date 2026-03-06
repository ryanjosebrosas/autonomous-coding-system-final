# Production Gap Fixes

**Feature:** production-gap-fixes  
**Created:** 2026-03-06  
**Status:** pending  

---

## Feature Description

Align production configuration files with AGENTS.md documentation. The audit identified critical mismatches between what's documented and what's implemented in registry.ts, constants.ts, and category-skills-guide.ts. This feature fixes all alignment issues to ensure production readiness.

## User Story

As a developer using the OpenCode AI coding system, I need the configuration files to match the documented agent models and category routing so that dispatching agents and tasks uses the correct models as specified.

## Problem Statement

The audit revealed configuration drift:
- AGENTS.md documents agent models using `claude-opus-4-6`, `gpt-5.2`, etc., while registry.ts uses `gpt-5.3-codex`, `qwen3-*:cloud`
- categories.json uses `gemini-3-flash-preview:latest` while constants.ts uses `gemini-3-flash-preview-cloud`
- 4 validation skills are documented but directories don't exist
- 4 categories have empty skill recommendations
- Fallback chains documented with 3-4 models per agent, but registry has only 1

## Solution Statement

Update configuration files to match AGENTS.md documentation (treating AGENTS.md as source of truth):
1. Sync registry.ts primary models with AGENTS.md
2. Sync constants.ts category model names with categories.json
3. Create missing validation skill directories with SKILL.md files
4. Populate skill recommendations for empty categories
5. Expand fallback chains to match documentation

---

## Feature Metadata

| Field | Value |
|-------|-------|
| Priority | Critical |
| Complexity | Low (configuration alignment) |
| Risk | Medium (model names must be valid) |
| Estimated Time | 1-2 hours |

### Slice Guardrails

- **In Scope:** Configuration file updates, new skill directories
- **Out of Scope:** Code refactoring, behavior changes, new features
- **Rollback:** Git revert of all changes in single commit

---

## Context References

### Files to Modify

1. `.opencode/agents/registry.ts` — Agent primary models and fallback chains
2. `.opencode/tools/delegate-task/constants.ts` — Category model routes
3. `.opencode/tools/delegate-task/category-skills-guide.ts` — Skill recommendations
4. `.opencode/skills/validation/validation/` — New directories

### Files to Read (Reference Only)

1. `AGENTS.md` — Source of truth for agent configuration
2. `.opencode/config/categories.json` — Category model mappings
3. `.opencode/skills/code-review/SKILL.md` — Template for validation skills
4. `.opencode/skills/system-review/SKILL.md` — Template for validation skills

### Source of Truth: AGENTS.md Agent Table

From AGENTS.md lines 317-361 (extracted):

**Agent Primary Models:**
| Agent | Primary Model | Fallback 1 | Fallback 2 | Fallback 3 |
|-------|---------------|------------|------------|------------|
| sisyphus | claude-opus-4-6 | kimi-k2.5 | glm-5 | big-pickle |
| hephaestus | gpt-5.3-codex | gpt-5.2 | — | — |
| atlas | kimi-k2.5 | claude-sonnet-4-6 | gpt-5.2 | — |
| prometheus | claude-opus-4-6 | kimi-k2.5 | gpt-5.2 | gemini-3.1-pro |
| oracle | gpt-5.2 | gemini-3.1-pro | claude-opus-4-6 | — |
| metis | claude-opus-4-6 | gpt-5.2 | kimi-k2.5 | gemini-3.1-pro |
| momus | gpt-5.2 | claude-opus-4-6 | gemini-3.1-pro | — |
| sisyphus-junior | claude-sonnet-4-6 | — | — | — |
| librarian | kimi-k2.5 | gemini-3-flash | gpt-5.2 | glm-4.6v |
| explore | grok-code-fast-1 | minimax-m2.5 | claude-haiku-4-5 | gpt-5-nano |
| multimodal-looker | gemini-3-flash | minimax-m2.5 | big-pickle | — |

**Category Routing (from next-command.md):**
| Category | Model | Provider |
|----------|-------|----------|
| visual-engineering | gemini-3-flash-preview:latest | ollama |
| ultrabrain | gpt-5.3-codex | openai |
| artistry | gemini-3-flash-preview:latest | ollama |
| quick | claude-haiku-4-5-20251001 | anthropic |
| deep | qwen3-coder-next:cloud | ollama |
| unspecified-low | claude-sonnet-4-6 | anthropic |
| unspecified-high | claude-opus-4-6 | anthropic |
| writing | kimi-k2.5:cloud | ollama |

---

## Patterns to Follow

### Pattern 1: Agent Registry Structure (from registry.ts)

```typescript
export const AGENT_REGISTRY: Record<string, AgentMetadata> = {
  agentName: {
    name: "agent-name",
    displayName: "Display Name — Description",
    description: "Full description text",
    category: "category-name",
    model: "model-identifier",
    temperature: 0.1,
    mode: "all" | "primary" | "subagent",
    permissions: PERMISSIONS.full | PERMISSIONS.readOnly | PERMISSIONS.fullNoTask | PERMISSIONS.visionOnly,
    fallbackChain: FALLBACK_CHAINS.agentName,
    deniedTools: [],
  },
  // ... more agents
}
```

### Pattern 2: Fallback Chain Structure (from registry.ts)

```typescript
export const FALLBACK_CHAINS = {
  agentName: ["fallback-model-1", "fallback-model-2", "fallback-model-3"],
  // Model names must match provider naming conventions
} as const
```

### Pattern 3: Category Model Routes (from constants.ts)

```typescript
export const CATEGORY_MODEL_ROUTES: Record<string, {
  provider: string
  model: string
  label: string
}> = {
  "category-name": {
    provider: "ollama" | "openai" | "anthropic",
    model: "model-identifier",
    label: "DISPLAY-LABEL"
  },
}
```

### Pattern 4: Skill Recommendations (from category-skills-guide.ts)

```typescript
export const CATEGORY_SKILL_RECOMMENDATIONS: Record<string, string[]> = {
  "category-name": ["skill-1", "skill-2"],
}
```

### Pattern 5: Validation Skill Structure (from code-review/SKILL.md)

```markdown
---
name: skill-name
description: Single-line description
license: MIT
compatibility: opencode
---

# Skill Name — Brief Description

[Content describing when to use, methodology, rules, etc.]
```

---

## Implementation Plan

### Phase 1: Registry Alignment
- Task 1: Update agent primary models in AGENT_REGISTRY
- Task 5: Expand fallback chains in FALLBACK_CHAINS

### Phase 2: Category Configuration
- Task 2: Fix category model naming in constants.ts

### Phase 3: Skill Infrastructure
- Task 3: Create 4 validation skill directories
- Task 4: Populate skill recommendations for empty categories

---

## Step-by-Step Tasks

| Task | Scope | Files | Description |
|------|-------|-------|-------------|
| 1 | Sync agent models | registry.ts | Update AGENT_REGISTRY primary model values |
| 2 | Fix category naming | constants.ts | Align CATEGORY_MODEL_ROUTES with categories.json |
| 3 | Create validation skills | validation/ dirs | Create 4 SKILL.md files |
| 4 | Add skill recommendations | category-skills-guide.ts | Populate 4 empty categories |
| 5 | Expand fallback chains | registry.ts | Update FALLBACK_CHAINS with full chains |

---

## Testing Strategy

### L1: TypeScript Compilation
```bash
npx tsc --noEmit
```

### L2: Unit Tests
Existing tests cover:
- `.opencode/tests/integration/agent-resolution.test.ts` — Agent model resolution
- `.opencode/tests/integration/category-routing.test.ts` — Category routing

### L3: Integration Tests
- Verify agent dispatch still works
- Verify category routing still resolves correctly

### L4: Manual Validation
- Check that all model names exist in their respective providers
- Verify skill loading works for new validation skills

---

## Validation Commands

| Level | Command | Expected |
|-------|---------|----------|
| L1 | `npx tsc --noEmit` | No type errors |
| L2 | `npx vitest run .opencode/tests/integration/` | All tests pass |
| L3 | Manual inspection | Config files match docs |

---

## Acceptance Criteria

### Implementation Criteria
- [ ] Agent primary models in registry.ts match AGENTS.md table
- [ ] Category model names in constants.ts match categories.json
- [ ] All 4 validation skill directories exist with SKILL.md files
- [ ] All 4 categories have skill recommendations populated
- [ ] Fallback chains in registry.ts match AGENTS.md fallback table

### Runtime Verification
- [ ] TypeScript compilation succeeds
- [ ] Existing integration tests pass
- [ ] No runtime errors when loading agents or categories

---

## Completion Checklist

- [ ] All 5 tasks completed
- [ ] L1 validation passed
- [ ] L2 validation passed
- [ ] Changes committed
- [ ] Plan marked done

---

## Notes

- **Confidence:** 9/10 — Straightforward configuration updates
- **Key Risk:** Model names must be valid in their providers. The names in AGENTS.md should be verified.
- **Decision:** AGENTS.md is source of truth; align code to documentation
- **CLI Compatibility:** Duplicate skills in .codex/skills/ are intentional for Codex CLI compatibility — do NOT remove

---

## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.md` | Sync agent primary models with AGENTS.md | pending | 1 modified |
| 2 | `task-2.md` | Fix category model naming consistency | pending | 1 modified |
| 3 | `task-3.md` | Create validation skill directories | pending | 4 created |
| 4 | `task-4.md` | Add skill recommendations | pending | 1 modified |
| 5 | `task-5.md` | Expand fallback chains | pending | 1 modified |