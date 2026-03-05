# Phase 2: Category + Skill Dispatch System — Task Brief

## Feature Description

Implement the category-based model routing system from OhMyOpenCode, enabling semantic task delegation (visual-engineering, deep, quick, etc.) instead of model name specification. Add the `load_skills` parameter for domain-specific instruction injection.

## User Story

As an orchestrator, I want to delegate tasks by semantic category (e.g., "visual-engineering" for UI work), so that my delegation is model-agnostic and I can optimize for cost/performance dynamically.

## Problem Statement

Current dispatch system uses explicit taskType or model names:
1. **Model coupling** — Can't swap models without changing prompt structure
2. **No skill loading** — No way to inject domain-specific instructions
3. **No category prompting** — Missing model-specific behavior adjustments per task type
4. **Manual optimization** — No automatic model selection based on task complexity

## Solution Statement

Add a category layer on top of existing taskTypes, with 8 category definitions, model mappings, and prompt appends. Implement skill loading infrastructure that prepends domain instructions to subagent prompts.

## Feature Metadata

- **Depth**: heavy
- **Dependencies**: Phase 1 (AGENTS.md behavior)
- **Estimated tasks**: 15
- **Priority**: MUST complete before Phase 3

---

## Context References

### Source Files (OhMyOpenCode)
- `/tmp/oh-my-opencode/src/tools/delegate-task/constants.ts` — Category definitions
- `/tmp/oh-my-opencode/src/config/schema/category-config.ts` — Category schema
- `/tmp/oh-my-opencode/src/shared/merge-categories.ts` — Category merging logic
- `/tmp/oh-my-opencode/src/agents/dynamic-agent-prompt-builder.ts` — `buildCategorySkillsDelegationGuide()`

### Target Files
- `.opencode/tools/dispatch.ts` — Extend with category routing
- `.opencode/config/categories.json` — NEW: Category definitions
- `.opencode/features/skill-loader/` — NEW: Skill loading infrastructure

### Existing Files
- `.opencode/tools/dispatch.ts:97-201` — TASK_ROUTES (existing)
- `.opencode/agents/` — Existing agent definitions

---

## Categories

| Category | Model | Reasoning | Use Case |
|----------|-------|-----------|----------|
| `visual-engineering` | Gemini 3 Pro | creativity=high | Frontend, UI/UX, design, styling, animation |
| `ultrabrain` | GPT-5.3 Codex | reasoning=xhigh | Genuinely hard, logic-heavy tasks |
| `artistry` | Gemini 3 Pro (max) | creativity=max | Complex problem-solving, unconventional approaches |
| `quick` | Claude Haiku 4.5 | speed=fast | Trivial tasks, single-file changes, typos |
| `deep` | GPT-5.3 Codex | reasoning=medium | Goal-oriented autonomous problem-solving |
| `unspecified-low` | Claude Sonnet 4.6 | reasoning=medium | Low effort, doesn't fit other categories |
| `unspecified-high` | Claude Opus 4.6 | reasoning=max | High effort, doesn't fit other categories |
| `writing` | Kimi K2.5 | prose=high | Documentation, prose, technical writing |

---

## Key Decisions

1. **Category Layer Position**: Add category routing BEFORE taskType in dispatch hierarchy
2. **Skill Loading**: Implement in dispatch.ts, inject into subagent prompt
3. **Category Config**: JSON file for easy customization
4. **Fallback**: Default to existing taskType routing if category not found
5. **Model Resolution**: category → model → temperature → prompt-append

---

## Implementation Plan

### Step 1: Create Category Definitions
- Define 8 categories with model mappings
- Add category prompt appends (VISUAL, ULTRABRAIN, etc.)
- Create JSONC schema for user customization

### Step 2: Extend dispatch.ts
- Add category routing layer
- Implement category → model resolution
- Add skill loading parameter

### Step 3: Implement Skill Loader
- Create skill loading infrastructure
- Implement skill injection into prompts
- Add available skills discovery

### Step 4: Add Category Selection Logic
- Implement category detection from prompt analysis
- Add caller warning for quick/deep categories
- Add selection gates for unspecified categories

### Step 5: Update Agent Definitions
- Add category field to agent configs
- Update dynamic prompt builder

### Step 6: Validation
- Test category routing
- Test skill loading
- Test model resolution

---

## Step-by-Step Tasks

### Task 1: Create Category Definitions
- **ACTION**: CREATE
- **TARGET**: `.opencode/config/categories.json`
- **IMPLEMENT**: Create JSON file with 8 category definitions, each with model, temperature, prompt-append
- **PATTERN**: Follow structure from `/tmp/oh-my-opencode/src/tools/delegate-task/constants.ts`
```json
{
  "visual-engineering": {
    "model": "gemini-3-pro",
    "temperature": 0.1,
    "promptAppend": "...",
    "description": "Frontend, UI/UX, design, styling, animation",
    "useWhen": ["UI components", "CSS", "responsive design"],
    "avoidWhen": ["backend logic", "database", "API endpoints"]
  },
  ...
}
```
- **VALIDATE**: JSON parses, all 8 categories present

### Task 2: Create Category Schema
- **ACTION**: CREATE
- **TARGET**: `.opencode/config/category-schema.ts`
- **IMPLEMENT**: Create Zod v4 schema for category validation
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/config/schema/category-config.ts`
- **VALIDATE**: Schema validates category definitions

### Task 3: Add Category Routes to dispatch.ts
- **ACTION**: UPDATE
- **TARGET**: `.opencode/tools/dispatch.ts`
- **IMPLEMENT**: Add CATEGORY_ROUTES constant, implement category resolution before TASK_ROUTES
- **PATTERN**: Follow TASK_ROUTES structure but with category names
- **GOTCHA**: Category routing should take precedence, fall back to taskType
- **VALIDATE**: `dispatch({ category: "visual-engineering", prompt: "..." })` routes to Gemini 3 Pro

### Task 4: Implement Category Prompt Appends
- **ACTION**: ADD
- **TARGET**: `.opencode/tools/delegate-task/constants.ts` (NEW FILE)
- **IMPLEMENT**: Add VISUAL_CATEGORY_PROMPT_APPEND, ULTRABRAIN_CATEGORY_PROMPT_APPEND, etc.
- **PATTERN**: Copy from `/tmp/oh-my-opencode/src/tools/delegate-task/constants.ts`
- **VALIDATE**: Each category has corresponding prompt append

### Task 5: Add Category Selection Logic
- **ACTION**: CREATE
- **TARGET**: `.opencode/tools/delegate-task/category-selector.ts` (NEW FILE)
- **IMPLEMENT**: Add selection gates for each category, caller warnings for quick/deep
- **PATTERN**: Follow category-selection logic from constants.ts
- **VALIDATE**: Selection gates prevent misuse (e.g., quick used for architecture)

### Task 6: Create Skill Loader Infrastructure
- **ACTION**: CREATE
- **TARGET**: `.opencode/features/skill-loader/index.ts`
- **IMPLEMENT**: Create skill loading system that reads skills from SKILL.md files
- **PATTERN**: Follow skill-loader pattern from OhMyOpenCode
- **VALIDATE**: Skill loader discovers available skills

### Task 7: Implement Skill Injection
- **ACTION**: ADD
- **TARGET**: `.opencode/tools/dispatch.ts`
- **IMPLEMENT**: Add `load_skills` parameter, inject skill content into subagent prompt
- **GOTCHA**: Skills must be prepended to prompt, not appended
- **VALIDATE**: `dispatch({ category: "visual-engineering", load_skills: ["frontend-ui-ux"], prompt: "..." })` includes skill instructions

### Task 8: Add Available Skills Discovery
- **ACTION**: CREATE
- **TARGET**: `.opencode/features/skill-loader/available-skills.ts`
- **IMPLEMENT**: Create function to discover all skills from `.opencode/skills/` and `.claude/skills/`
- **VALIDATE**: `getAvailableSkills()` returns list of all skill names

### Task 9: Create Category Skills Delegation Guide
- **ACTION**: ADD
- **TARGET**: `.opencode/tools/delegate-task/category-skills-guide.ts`
- **IMPLEMENT**: Create guide function that returns category + skill combination recommendations
- **PATTERN**: Follow `buildCategorySkillsDelegationGuide()` from dynamic-agent-prompt-builder.ts
- **VALIDATE**: Guide provides correct skill recommendations per category

### Task 10: Update Agent Definitions for Categories
- **ACTION**: UPDATE
- **TARGET**: `.opencode/agents/*.ts` (existing agent files)
- **IMPLEMENT**: Add category field to agent configs where applicable
- **VALIDATE**: Agent definitions include category metadata

### Task 11: Add Merge Categories Function
- **ACTION**: CREATE
- **TARGET**: `.opencode/shared/merge-categories.ts`
- **IMPLEMENT**: Create function to merge user-defined categories with defaults
- **PATTERN**: Follow `/tmp/oh-my-opencode/src/shared/merge-categories.ts`
- **VALIDATE**: User categories override defaults correctly

### Task 12: Create Category Config Loader
- **ACTION**: CREATE
- **TARGET**: `.opencode/config/load-categories.ts`
- **IMPLEMENT**: Load categories from JSONC, validate with schema
- **VALIDATE**: Categories load and validate correctly

### Task 13: Add User Category Override Support
- **ACTION**: CREATE
- **TARGET**: `.opencode/config/oh-my-opencode.jsonc` (NEW FILE)
- **IMPLEMENT**: Create user configuration file with category override examples
- **VALIDATE**: User can override category model mappings

### Task 14: Write Unit Tests
- **ACTION**: CREATE
- **TARGET**: `.opencode/tools/delegate-task/*.test.ts`
- **IMPLEMENT**: Unit tests for category routing, skill loading, model resolution
- **VALIDATE**: `bun test src/tools/delegate-task/` passes

### Task 15: Integration Test
- **ACTION**: CREATE
- **TARGET**: `.opencode/tests/category-dispatch.test.ts`
- **IMPLEMENT**: Integration test for full category + skill dispatch flow
- **VALIDATE**: `bun test --grep "category dispatch"` passes

---

## Testing Strategy

### Unit Tests
- Category selection logic
- Model resolution
- Skill loading
- Prompt append assembly

### Integration Tests
- Full dispatch flow with category
- Skill injection validation
- Fallback to taskType

---

## Acceptance Criteria

### Implementation
- [ ] 8 categories defined with models and prompt appends
- [ ] Category routing precedes taskType routing
- [ ] Skill loader discovers all skills
- [ ] `load_skills` parameter injects skill content
- [ ] Category selection gates prevent misuse
- [ ] User can override category mappings
- [ ] Zod schema validates categories

### Runtime
- [ ] `dispatch({ category: "visual-engineering", ... })` routes to Gemini 3 Pro
- [ ] `dispatch({ category: "quick", load_skills: [...], ... })` includes skills
- [ ] Fallback to taskType when category not found
- [ ] All unit tests pass
- [ ] Integration tests pass

---

## Notes

- **Key decision**: Category layer BEFORE taskType — semantic routing first
- **Risk**: Breaking existing dispatch behavior
- **Mitigation**: Fallback to taskType, extensive testing
- **Confidence**: 8/10 — Well-defined patterns, but dispatch.ts is complex