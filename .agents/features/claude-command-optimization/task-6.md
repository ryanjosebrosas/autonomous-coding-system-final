# Task 6: Opus Commands — planning.md, council.md, mvp.md, prd.md, pillars.md, decompose.md

## OBJECTIVE

Create Claude-optimized Opus-tier command files in `.claude/commands/` with `model: claude-opus-4-6`, adding Phase 0 research delegation where missing.

## SCOPE

- **Files created**: `.claude/commands/planning.md`, `.claude/commands/council.md`, `.claude/commands/mvp.md`, `.claude/commands/prd.md`, `.claude/commands/pillars.md`, `.claude/commands/decompose.md`
- **Source material (DO NOT MODIFY)**: Corresponding files in `.opencode/commands/`
- **Out of scope**: All other commands, `.opencode/` directory, Haiku/Sonnet commands
- **Dependencies**: Task 1 (directory exists)

## PRIOR TASK CONTEXT

- Task 1: Created real `.claude/commands/` directory
- Tasks 2-5: Created Haiku commands (prime, commit) and Sonnet commands (code-review, code-review-fix, code-loop, final-review, system-review, pr)
- Phase 0 delegation pattern established in Tasks 3-5
- This is the final task — completes all 14 commands

## CONTEXT REFERENCES

### Source Files Summary

| Command | Lines | Has Delegation? | Optimization Needed |
|---------|-------|----------------|-------------------|
| planning.md | 576 | YES (Phase 2 subagents) | Model update only |
| council.md | 83 | NO | Add Phase 0 + model |
| mvp.md | 207 | NO | Add Phase 0 + model |
| prd.md | 412 | NO | Add Phase 0 + model |
| pillars.md | 199 | NO | Add Phase 0 + model |
| decompose.md | 245 | NO | Add Phase 0 + model |

### Source: `.opencode/commands/council.md` (83 lines — full content)

```markdown
---
description: Run a multi-perspective council discussion on the given topic
model: gpt-5.3-codex
---

# Council

## Pipeline Position

Standalone utility — invoke at any point for architecture decisions

Provides multi-model perspective on complex decisions. Reads topic from user input. Outputs synthesized recommendation.

## Topic: $ARGUMENTS

---

## How It Works

Council is a Claude-native discussion command. There is no external dispatch tool. Claude presents 3-5 distinct perspectives on the topic, then offers analysis and synthesis.

**RULE — No Pre-Summarize**: Present perspectives FIRST, in full. Do NOT summarize or synthesize before the user has read the perspectives. Present all perspectives, then offer analysis.

---

## Action

1. **Identify 3-5 distinct perspectives** relevant to the topic. Choose perspectives that represent genuinely different viewpoints, not slight variations of the same position. Examples:
   - "Pragmatist vs Purist vs Performance-focused vs Security-focused"
   - "Junior dev vs Senior dev vs Architect vs User"
   - "Short-term vs Long-term vs Risk-averse vs Innovation-first"

2. **Present each perspective in full** using this format:

# Council: {topic}

**{N} perspectives**

---

## Perspective 1: {name/role}
{Full response — 150-300 words. Be genuinely distinct. Argue from this viewpoint's values and priorities.}

---

## Perspective 2: {name/role}
{Full response}

... (all perspectives)

---

## Analysis
- Agreement: {what all perspectives agree on}
- Conflicts: {where perspectives fundamentally disagree and why}
- Key themes: {2-3 recurring themes}

---

## Synthesis
{The most useful takeaway given all perspectives. Which tradeoffs matter most? What would a well-informed decision-maker conclude?}

3. **After presenting all perspectives**, offer to explore any perspective in more depth or to analyze a specific conflict.

---

## Rules

- Max 1 council per user question. Never re-run unless user explicitly requests.
- For brainstorming use 3-4 perspectives; for architecture decisions use 4-5.
- Each perspective must argue its position genuinely — not strawman the others.
- The synthesis must not pick a "winner" unless the evidence clearly points to one — instead map the decision to the user's context and priorities.
- If the user wants a second opinion from an actual external model, suggest they run Codex or another CLI tool on the question separately.
```

### Source: `.opencode/commands/planning.md` (576 lines — key sections)

Planning.md already has Phase 2 subagent delegation with 5 subagent types:
- `research-codebase` — codebase patterns and integration points
- `archon-retrieval` — RAG knowledge base
- `research-external` — external docs
- `planning-research` — past plans
- Synthesize step

**Only change needed**: Update frontmatter `model: gpt-5.3-codex` → `model: claude-opus-4-6`. All other content stays IDENTICAL.

### Source: `.opencode/commands/mvp.md` (207 lines — key structure)

Key sections to preserve verbatim:
- Pipeline Position
- Step 1: Check Existing MVP (read mvp.md, present summary, ask user)
- Step 2: Big Idea Discovery — Phase A (Extract Core Idea), Phase B (Tech Direction), Phase C (Scope Gate with HARD STOP)
- Step 3: Write mvp.md template (exact markdown template)
- Step 4: Confirm and Advance
- Notes (Socratic rules, scope challenge rules)

### Source: `.opencode/commands/prd.md` (412 lines — key structure)

Key sections to preserve verbatim:
- Pipeline Position
- Step 0: Spec Lock (HARD STOP)
- Step 0.5: PRD Direction Preview (HARD STOP)
- Full PRD Structure (all 15 sections — exact templates)
- Instructions (4 synthesis steps + quality checks)
- Output Confirmation
- RAG Integration Point
- Notes

### Source: `.opencode/commands/pillars.md` (199 lines — key structure)

Key sections to preserve verbatim:
- Pipeline Position
- Step 2: Propose Pillar Structure (Pillar 0 Rule MANDATORY, typical order table)
- Step 3: Present Pillars for Approval (HARD STOP)
- Step 4: Write PILLARS.md (exact template)
- Re-run behavior rules
- Notes

### Source: `.opencode/commands/decompose.md` (245 lines — key structure)

Key sections to preserve verbatim:
- Pipeline Position
- Step 1: Read Inputs ($ARGUMENTS validation)
- Step 2: Research (2a RAG, 2b PRD Cross-Reference MANDATORY, 2c Dependency Analysis MANDATORY)
- Step 3: Draft Spec List (HARD STOP)
- Step 4: Write Pillar Spec File (exact template)
- Notes

## PATTERNS TO FOLLOW

### Pattern: Opus Frontmatter

```yaml
---
description: {same as original}
model: claude-opus-4-6
---
```

### Pattern: Phase 0 for Opus Commands

Opus commands are interactive/conversational. Phase 0 gathers pre-existing context so the conversation starts informed, not from scratch:

```markdown
## Phase 0: Gather Context (Haiku Subagent)

Before starting the conversation, launch a Haiku Explore subagent to gather existing context.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /{command}:
> 1. {check for existing artifacts}
> 2. {read relevant docs}
> 3. {scan codebase for relevant structure}
>
> Return a Context Bundle with:
> - {existing artifacts found}
> - {relevant docs content}
> - {codebase structure}

Use the Context Bundle to inform the conversation. Do not re-read files the subagent already gathered.
```

### Pattern: Planning Model-Only Update

For planning.md, the ONLY change is the frontmatter model field. Do NOT rewrite or restructure the content — it already has proper delegation.

## STEP-BY-STEP TASKS

### Step 1: Create `.claude/commands/planning.md`

- **ACTION**: CREATE
- **TARGET**: `.claude/commands/planning.md`
- **IMPLEMENT**: Copy the ENTIRE content of `.opencode/commands/planning.md` (576 lines) and change ONLY the frontmatter model:

**CURRENT frontmatter:**
```yaml
---
description: Interactive discovery session — explore ideas WITH the user, then produce a structured plan
model: gpt-5.3-codex
---
```

**REPLACE WITH:**
```yaml
---
description: Interactive discovery session — explore ideas WITH the user, then produce a structured plan
model: claude-opus-4-6
---
```

All other content (576 lines) stays IDENTICAL. Do not modify any section, step, or instruction.

- **GOTCHA**: This file is 576 lines. Copy it EXACTLY with only the model line changed. Do not accidentally truncate or restructure.
- **VALIDATE**: `diff <(sed '3s/gpt-5.3-codex/claude-opus-4-6/' .opencode/commands/planning.md) .claude/commands/planning.md` should show no differences.

### Step 2: Create `.claude/commands/council.md`

- **ACTION**: CREATE
- **TARGET**: `.claude/commands/council.md`
- **IMPLEMENT**: Write the following complete optimized content:

```markdown
---
description: Run a multi-perspective council discussion on the given topic
model: claude-opus-4-6
---

# Council

## Pipeline Position

```
Standalone utility — invoke at any point for architecture decisions
```

Provides multi-perspective analysis on complex decisions. Reads topic from user input. Outputs synthesized recommendation.

## Topic: $ARGUMENTS

---

## Phase 0: Gather Context (Haiku Subagent)

If the topic involves a codebase decision, launch a Haiku Explore subagent to gather relevant context.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /council on topic: "{$ARGUMENTS}"
> 1. Search the codebase for files, patterns, or configuration related to this topic
> 2. Read any relevant architecture docs (AGENTS.md, CLAUDE.md, README.md)
> 3. Read `.claude/config.md` for stack and tooling context
> 4. Check `.agents/features/` for any related feature plans
>
> Return a Context Bundle with:
> - **Relevant files** found (path + brief description)
> - **Architecture context** from docs
> - **Stack info** from config
> - **Related features** if any

If the topic is purely conceptual (not codebase-related), skip Phase 0 and proceed directly.

---

## How It Works

Council is a Claude-native discussion command. Claude presents 3-5 distinct perspectives on the topic, then offers analysis and synthesis.

**RULE — No Pre-Summarize**: Present perspectives FIRST, in full. Do NOT summarize or synthesize before the user has read the perspectives.

---

## Action

1. **Identify 3-5 distinct perspectives** relevant to the topic. Choose perspectives that represent genuinely different viewpoints, not slight variations. Examples:
   - "Pragmatist vs Purist vs Performance-focused vs Security-focused"
   - "Junior dev vs Senior dev vs Architect vs User"
   - "Short-term vs Long-term vs Risk-averse vs Innovation-first"

2. **Present each perspective in full** (150-300 words each). Argue genuinely from each viewpoint's values and priorities.

3. **Analysis section:**
   - Agreement: what all perspectives agree on
   - Conflicts: where they fundamentally disagree and why
   - Key themes: 2-3 recurring themes

4. **Synthesis:** The most useful takeaway. Which tradeoffs matter most? Map the decision to the user's context and priorities.

5. After presenting, offer to explore any perspective deeper or analyze a specific conflict.

---

## Rules

- Max 1 council per user question. Never re-run unless user explicitly requests.
- For brainstorming use 3-4 perspectives; for architecture decisions use 4-5.
- Each perspective must argue its position genuinely — not strawman the others.
- The synthesis must not pick a "winner" unless the evidence clearly points to one.
- If the user wants a second opinion from an actual external model, suggest they run Codex or another CLI tool separately.
```

- **VALIDATE**: File exists, model is `claude-opus-4-6`, Phase 0 block present, "No Pre-Summarize" rule preserved.

### Step 3: Create `.claude/commands/mvp.md`

- **ACTION**: CREATE
- **TARGET**: `.claude/commands/mvp.md`
- **IMPLEMENT**: Copy the content of `.opencode/commands/mvp.md` with these changes:
  1. Change frontmatter model to `claude-opus-4-6`
  2. Add Phase 0 after Pipeline Position section:

```markdown
---
description: Define or refine the product MVP vision through interactive big-idea discovery
model: claude-opus-4-6
---

# MVP: Big Idea Discovery

{KEEP the intro paragraph exactly as original}

## Usage

```
/mvp [topic or direction]
```

`$ARGUMENTS` — Optional: a rough idea, product name, or direction to start from.

---

## Pipeline Position

```
/mvp (big idea) → /prd (full spec) → /planning (feature plan) → /execute → /code-review → /commit → /pr
```

This is Step 1. Nothing else starts without a clear `mvp.md`.

---

## Phase 0: Gather Context (Haiku Subagent)

Before starting discovery, launch a Haiku Explore subagent to check for existing context.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /mvp:
> 1. Check if `mvp.md` exists at project root — if so, read it in full
> 2. Check if `README.md` exists — read it for project overview
> 3. Check if `PRD.md` or any `*-prd.md` exists — read for existing specs
> 4. Scan top-level directories for project structure
>
> Return a Context Bundle with:
> - **Existing mvp.md** (full content, or "not found")
> - **README summary** (purpose and capabilities, or "not found")
> - **PRD exists** (yes/no + path)
> - **Project structure** (top-level dirs)

Use the Context Bundle in Step 1. Do not re-read files the subagent already gathered.

---
```

Then include Steps 1-4 and Notes EXACTLY as original (with Step 1 using Context Bundle data for the existing mvp.md check instead of reading it inline).

- **VALIDATE**: File exists, model is `claude-opus-4-6`, Phase 0 present, Socratic discovery rules preserved, Scope Gate HARD STOP preserved.

### Step 4: Create `.claude/commands/prd.md`

- **ACTION**: CREATE
- **TARGET**: `.claude/commands/prd.md`
- **IMPLEMENT**: Copy the content of `.opencode/commands/prd.md` with these changes:
  1. Change frontmatter model to `claude-opus-4-6`
  2. Add Phase 0 after Pipeline Position:

Phase 0 to add:
```markdown
## Phase 0: Gather Context (Haiku Subagent)

Before starting the PRD, launch a Haiku Explore subagent to gather existing context.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /prd:
> 1. Read `mvp.md` in full (required input for PRD)
> 2. Check if PRD already exists (`PRD.md`, `docs/PRD.md`, `*-prd.md`)
> 3. Scan codebase for existing architecture (top-level dirs, key config files)
> 4. Read `.claude/config.md` for stack info
> 5. Read `memory.md` if it exists for past decisions
>
> Return a Context Bundle with:
> - **mvp.md content** (full text — required)
> - **Existing PRD** (full content + path, or "not found")
> - **Codebase structure** (top-level dirs, key files)
> - **Stack info** from config.md
> - **Memory context** (past decisions, or "not found")

Use the Context Bundle in Step 0 (Spec Lock). Do not re-read mvp.md — it's in the bundle.
```

All other content (Spec Lock, Direction Preview, PRD Structure sections 1-15, Instructions, Quality Checks, Output Confirmation, RAG Integration, Notes) stays EXACTLY as original.

- **VALIDATE**: File exists, model is `claude-opus-4-6`, Phase 0 present, Spec Lock HARD STOP preserved, all 15 PRD sections preserved.

### Step 5: Create `.claude/commands/pillars.md`

- **ACTION**: CREATE
- **TARGET**: `.claude/commands/pillars.md`
- **IMPLEMENT**: Copy the content of `.opencode/commands/pillars.md` with these changes:
  1. Change frontmatter model to `claude-opus-4-6`
  2. Add Phase 0 after Pipeline Position:

Phase 0 to add:
```markdown
## Phase 0: Gather Context (Haiku Subagent)

Before analyzing pillars, launch a Haiku Explore subagent to gather inputs.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /pillars:
> 1. Find and read PRD file (`PRD.md`, `docs/PRD.md`, or `*-prd.md`)
> 2. Read `mvp.md` if it exists
> 3. Check if `.agents/specs/PILLARS.md` already exists — read if so
> 4. Scan `.agents/specs/pillar-*.md` for completed pillar files
> 5. Scan top-level directories for existing infrastructure
>
> Return a Context Bundle with:
> - **PRD content** (full text, or "not found" — REQUIRED)
> - **mvp.md content** (full text, or "not found")
> - **Existing PILLARS.md** (full content, or "not found")
> - **Completed pillars** (list of pillar-N-name.md files found)
> - **Codebase structure** (top-level dirs)

If PRD not found in Context Bundle, stop: "No PRD found. Run /prd first."
```

All other content stays EXACTLY as original. Step 1 uses Context Bundle data instead of inline reads.

- **VALIDATE**: File exists, model is `claude-opus-4-6`, Phase 0 present, Pillar 0 Rule preserved, approval HARD STOP preserved.

### Step 6: Create `.claude/commands/decompose.md`

- **ACTION**: CREATE
- **TARGET**: `.claude/commands/decompose.md`
- **IMPLEMENT**: Copy the content of `.opencode/commands/decompose.md` with these changes:
  1. Change frontmatter model to `claude-opus-4-6`
  2. Add Phase 0 after Pipeline Position:

Phase 0 to add:
```markdown
## Phase 0: Gather Context (Haiku Subagent)

Before researching the pillar, launch a Haiku Explore subagent to gather all inputs.

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /decompose with pillar: "$ARGUMENTS"
> 1. Read `.agents/specs/PILLARS.md` — find the pillar matching the argument
> 2. Find and read PRD file — focus on sections 8a (Data Models), 8b (Service Contracts), 9 (API Spec), 12 (Implementation Phases)
> 3. Check if `.agents/specs/pillar-{N}-{name}.md` already exists for this pillar
> 4. Read prior pillar spec files (pillar-{N-1}-*.md) for dependency context
>
> Return a Context Bundle with:
> - **PILLARS.md content** (full text — REQUIRED)
> - **Target pillar** (scope, dependencies, gate criteria from PILLARS.md)
> - **PRD sections** (8a, 8b, 9, 12 content)
> - **Existing pillar spec** (full content, or "not found")
> - **Prior pillar specs** (summary of what they provide)

If PILLARS.md not found in Context Bundle, stop: "No PILLARS.md found. Run /pillars first."
```

All other content stays EXACTLY as original. Step 1 uses Context Bundle data. Step 2 research steps (RAG, PRD cross-ref, dependency analysis) remain as reasoning logic.

- **VALIDATE**: File exists, model is `claude-opus-4-6`, Phase 0 present, $ARGUMENTS validation preserved, approval HARD STOP preserved, spec template preserved.

## TESTING STRATEGY

### Structural Verification
- All 6 files exist in `.claude/commands/`
- YAML frontmatter parses correctly with `model: claude-opus-4-6`
- planning.md is identical to original except model line
- council.md has Phase 0 + all original rules preserved
- mvp.md has Phase 0 + Socratic discovery preserved + Scope Gate HARD STOP
- prd.md has Phase 0 + Spec Lock HARD STOP + Direction Preview HARD STOP + all 15 sections
- pillars.md has Phase 0 + Pillar 0 Rule + approval HARD STOP
- decompose.md has Phase 0 + $ARGUMENTS validation + approval HARD STOP

### Edge Cases
- council.md: Non-code topic → Phase 0 skipped (instruction says "if topic involves codebase")
- mvp.md: No existing mvp.md → Phase 0 returns "not found", Step 1 skips to Step 2
- prd.md: No mvp.md → Phase 0 returns "not found", Step 0 Spec Lock catches it
- pillars.md: No PRD → Phase 0 returns "not found", command stops with clear message
- decompose.md: No $ARGUMENTS → Step 1 stops with usage message (before Phase 0)

## VALIDATION COMMANDS

```bash
# L1: All 6 files exist
for f in planning council mvp prd pillars decompose; do
  test -f ".claude/commands/$f.md" && echo "OK: $f.md" || echo "MISSING: $f.md"
done

# L2: Correct model in all frontmatter
for f in planning council mvp prd pillars decompose; do
  grep -q "model: claude-opus-4-6" ".claude/commands/$f.md" && echo "OK: $f" || echo "WRONG MODEL: $f"
done

# L3: Phase 0 present in council, mvp, prd, pillars, decompose
for f in council mvp prd pillars decompose; do
  grep -q "Phase 0" ".claude/commands/$f.md" && echo "OK: Phase 0 in $f" || echo "MISSING Phase 0: $f"
done

# L4: planning.md content matches original (except model)
diff <(sed 's/gpt-5.3-codex/claude-opus-4-6/' .opencode/commands/planning.md) .claude/commands/planning.md && echo "L4 PASS: planning identical" || echo "L4 INFO: planning has additional changes"

# L5: Key gates preserved
grep -c "HARD STOP" .claude/commands/mvp.md
grep -c "HARD STOP" .claude/commands/prd.md
grep -c "HARD STOP" .claude/commands/pillars.md
grep -c "HARD STOP" .claude/commands/decompose.md

# L6: Manual — invoke /planning, /council, /mvp in Claude Code
```

## ACCEPTANCE CRITERIA

### Implementation
- [ ] `.claude/commands/planning.md` created — identical to original except `model: claude-opus-4-6`
- [ ] `.claude/commands/council.md` created — Phase 0 added, "No Pre-Summarize" rule preserved
- [ ] `.claude/commands/mvp.md` created — Phase 0 added, Socratic rules preserved, Scope Gate HARD STOP preserved
- [ ] `.claude/commands/prd.md` created — Phase 0 added, Spec Lock HARD STOP preserved, Direction Preview HARD STOP preserved, all 15 sections preserved
- [ ] `.claude/commands/pillars.md` created — Phase 0 added, Pillar 0 Rule preserved, approval HARD STOP preserved
- [ ] `.claude/commands/decompose.md` created — Phase 0 added, $ARGUMENTS validation preserved, approval HARD STOP preserved
- [ ] All 6 files have `model: claude-opus-4-6` in frontmatter
- [ ] All Pipeline Position sections preserved from originals
- [ ] No content removed from reasoning sections (Opus benefits from verbose prompts)

### Runtime
- [ ] /planning launches research subagents in Phase 2 (already built in)
- [ ] /council launches Explore subagent for codebase topics
- [ ] /mvp launches Explore subagent to check existing artifacts
- [ ] /prd launches Explore subagent to read mvp.md and scan codebase
- [ ] /pillars launches Explore subagent to read PRD and existing pillars
- [ ] /decompose launches Explore subagent to read PILLARS.md and PRD sections

## COMPLETION CHECKLIST

- [ ] planning.md created (model update only)
- [ ] council.md created (Phase 0 + model)
- [ ] mvp.md created (Phase 0 + model)
- [ ] prd.md created (Phase 0 + model)
- [ ] pillars.md created (Phase 0 + model)
- [ ] decompose.md created (Phase 0 + model)
- [ ] All frontmatter models verified
- [ ] All HARD STOPs verified preserved
- [ ] All validation commands pass
- [ ] Feature complete — all 14 Claude-optimized commands created across Tasks 1-6
