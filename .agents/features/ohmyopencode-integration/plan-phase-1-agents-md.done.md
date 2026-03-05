# Phase 1: AGENTS.md Behavior Integration — Task Brief

## Feature Description

Integrate the complete Sisyphus orchestration behavior from OhMyOpenCode into the existing `AGENTS.md` file. This includes Intent Verbalization, enhanced Behavior_Instructions with delegation discipline, deep parallel execution patterns, session continuity, hard blocks, and model-specific behavior sections.

## User Story

As an orchestrator, I want explicit intent classification before every action, so that my routing decisions are transparent and my delegation is optimal.

## Problem Statement

The current Behavior_Instructions in AGENTS.md lack:
1. **Intent Verbalization** — Routing decisions happen silently
2. **Delegation Table** — No clear mapping of when to use which subagent
3. **Category/Skills Guide** — No guidance on category-based delegation
4. **Non-Claude Planner Sections** — Model-specific behavior overlays
5. **Session Continuity** — No `session_id` propagation pattern

## Solution Statement

Merge the Sisyphus behavior patterns from OhMyOpenCode's AGENTS.md into the existing AGENTS.md structure, adopting Intent Verbalization, Delegation Tables, Category/Skills Guide, and model-specific overlays (GPT, Gemini) while preserving existing pipeline commands.

## Feature Metadata

- **Depth**: heavy
- **Dependencies**: None (foundation phase)
- **Estimated tasks**: 10
- **Priority**: MUST complete before Phase 2

---

## Context References

### Source Files (OhMyOpenCode)
- `/tmp/oh-my-opencode/AGENTS.md` — Main behavior patterns (lines 1-137)
- `/tmp/oh-my-opencode/src/agents/sisyphus.ts` — Dynamic prompt builder (lines 1-300)
- `/tmp/oh-my-opencode/src/agents/dynamic-agent-prompt-builder.ts` — Section builders
- `/tmp/oh-my-opencode/src/agents/sisyphus-gemini-overlays.ts` — Gemini-specific behavior
- `/tmp/oh-my-opencode/src/tools/delegate-task/constants.ts` — Category prompts

### Target Files
- `AGENTS.md` — Merge target (existing)
- `.opencode/reference/subagents-deep-dive.md` — Existing subagent guide

### Patterns to Follow
- Existing Behavior_Instructions structure in AGENTS.md
- Dynamic prompt assembly from OhMyOpenCode
- Intent → Routing Map pattern

---

## Key Decisions

1. **Merge Strategy**: Section-by-section merge, not replacement
2. **Intent Verbalization**: Add BEFORE Phase 0 classification (new Step 0)
3. **Delegation Table**: Insert after Delegation Check section
4. **Category Guide**: New section after Delegation Table
5. **Model Overlays**: Add as conditional sections with detection guards

---

## Implementation Plan

### Step 1: Backup + Prepare
- Create backup of current AGENTS.md
- Identify merge points for each section

### Step 2: Add Intent Verbalization (Step 0)
- Insert `<intent_verbalization>` section before classification
- Add Intent → Routing Map table

### Step 3: Add Deep Parallel Execution
- Enhance Tool Usage Rules section
- Add parallel execution examples (fire 2-5 agents)

### Step 4: Add Delegation Table
- Insert `<delegation_table>` section
- Map each subagent type to use cases

### Step 5: Add Category/Skills Delegation Guide
- Insert category selection guide
- Add load_skills parameter documentation

### Step 6: Add Session Continuity
- Add `session_id` propagation pattern
- Document token savings (70%+)

### Step 7: Add Hard Blocks + Anti-Patterns
- Merge Hard Blocks section
- Merge Anti-Patterns section

### Step 8: Add Non-Claude Planner Sections
- Add Gemini overlay section (conditional)
- Add GPT overlay section (conditional)

### Step 9: Merge Oracle/Metis/Momus Sections
- Add consultation agent patterns
- Document when to use each consultant

### Step 10: Validation
- Verify all sections present
- Check section ordering
- Ensure no duplicate content

---

## Step-by-Step Tasks

### Task 1: Create Backup
- **ACTION**: CREATE
- **TARGET**: `AGENTS.md.backup`
- **IMPLEMENT**: Copy current AGENTS.md to AGENTS.md.backup for rollback safety
- **VALIDATE**: `diff AGENTS.md AGENTS.md.backup` returns empty

### Task 2: Add Intent Verbalization Section
- **ACTION**: INSERT
- **TARGET**: `AGENTS.md` (after `<Role>` block)
- **IMPLEMENT**: Add `<intent_verbalization>` section with Intent → Routing Map table
- **PATTERN**: Follow structure from `/tmp/oh-my-opencode/src/agents/sisyphus.ts:200-228`
- **VALIDATE**: Intent Verbalization section present, table renders correctly

### Task 3: Enhance Deep Parallel Execution
- **ACTION**: UPDATE
- **TARGET**: `AGENTS.md` (Tool_Usage_Rules section)
- **IMPLEMENT**: Add parallel execution examples, fire 2-5 agents pattern
- **PATTERN**: Follow structure from `/tmp/oh-my-opencode/src/agents/dynamic-agent-prompt-builder.ts`
- **VALIDATE**: Parallel execution examples present

### Task 4: Add Delegation Table
- **ACTION**: INSERT
- **TARGET**: `AGENTS.md` (after Phase 2A - Exploration section)
- **IMPLEMENT**: Add `<delegation_table>` with Oracle/Metis/Momus/explore/librarian mappings
- **PATTERN**: Follow `buildDelegationTable()` from dynamic-agent-prompt-builder.ts
- **VALIDATE**: Delegation Table section present with all agents

### Task 5: Add Category/Skills Guide
- **ACTION**: INSERT
- **TARGET**: `AGENTS.md` (after Delegation Table)
- **IMPLEMENT**: Add category selection guide with model mappings, add load_skills parameter docs
- **PATTERN**: Follow `buildCategorySkillsDelegationGuide()` and constants.ts
- **VALIDATE**: All 8 categories documented with models and use cases

### Task 6: Add Session Continuity Pattern
- **ACTION**: INSERT
- **TARGET**: `AGENTS.md` (Phase 2C or after Background Result Collection)
- **IMPLEMENT**: Add `session_id` propagation pattern, document 70%+ token savings
- **VALIDATE**: Session continuity section present

### Task 7: Merge Hard Blocks Section
- **ACTION**: UPDATE
- **TARGET**: `AGENTS.md` (Existing Constraints section)
- **IMPLEMENT**: Merge Hard Blocks from OhMyOpenCode, ensure all blocks present
- **PATTERN**: Follow `buildHardBlocksSection()` from dynamic-agent-prompt-builder.ts
- **VALIDATE**: All hard blocks present (Type Safety, Error Handling, Testing, Search, Debugging, Background Tasks, Oracle)

### Task 8: Merge Anti-Patterns Section
- **ACTION**: UPDATE
- **TARGET**: `AGENTS.md` (Existing Constraints section)
- **IMPLEMENT**: Merge Anti-Patterns from OhMyOpenCode
- **PATTERN**: Follow `buildAntiPatternsSection()` from dynamic-agent-prompt-builder.ts
- **VALIDATE**: Anti-Patterns section present with all items

### Task 9: Add Model-Specific Overlays
- **ACTION**: APPEND
- **TARGET**: `AGENTS.md` (end of Behavior_Instructions)
- **IMPLEMENT**: Add conditional sections for Gemini and GPT planner behavior
- **PATTERN**: Follow `buildGemini*` and `buildGpt*` overlays from sisyphus-gemini-overlays.ts
- **VALIDATE**: Model overlay sections present with conditional guards

### Task 10: Final Validation
- **ACTION**: VALIDATE
- **TARGET**: `AGENTS.md`
- **IMPLEMENT**: Verify all sections present, check ordering, ensure no duplicates
- **VALIDATE**:
  - Intent Verbalization section ✓
  - Deep Parallel Execution ✓
  - Delegation Table ✓
  - Category/Skills Guide ✓
  - Session Continuity ✓
  - Hard Blocks ✓
  - Anti-Patterns ✓
  - Model Overlays ✓

---

## Testing Strategy

### Manual Review
- Read through merged AGENTS.md
- Check all section headings render correctly
- Verify Intent → Routing Map table is clear

### Integration Test
- Verify existing pipeline commands still parse AGENTS.md
- Check that /planning command still works

---

## Acceptance Criteria

### Implementation
- [ ] Intent Verbalization section added with routing table
- [ ] Deep Parallel Execution enhanced with 2-5 agent pattern
- [ ] Delegation Table added with all 5 subagent types
- [ ] Category/Skills Guide added with 8 categories
- [ ] Session Continuity pattern documented
- [ ] Hard Blocks merged (7 blocks)
- [ ] Anti-Patterns merged
- [ ] Model-Specific Overlays added (Gemini, GPT)

### Runtime
- [ ] AGENTS.md parses without errors
- [ ] Existing /planning command works
- [ ] No duplicate content
- [ ] Section ordering logical

---

## Notes

- **Key decision**: Merge sections incrementally, not wholesale replace
- **Risk**: Breaking existing pipeline if AGENTS.md structure changes too much
- **Mitigation**: Backup before merge, validate each section
- **Confidence**: 9/10 — Straightforward merge with clear patterns to follow