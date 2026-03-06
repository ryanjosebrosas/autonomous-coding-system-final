# Claude Command Optimization — Implementation Plan

## Feature Description

Optimize `.claude/commands/` by replacing the current symlink (pointing to `.opencode/commands/`) with a real directory containing Claude-model-optimized command files. Each command is restructured into a lean reasoning kernel with Haiku subagent research delegation, tailored to the specific Claude model tier that should run it.

## User Story

As a developer using Claude Code with this AI coding system, I want each slash command to be optimized for the specific Claude model running it, so that Opus focuses on deep reasoning, Sonnet focuses on structured decisions, and Haiku focuses on fast retrieval — with all research/retrieval offloaded to cheap Haiku subagents.

## Problem Statement

**Current State:**
- `.claude/commands` is a symlink to `.opencode/commands` — both directories serve identical content
- Commands reference non-Claude models (`glm-4.7:cloud`, `gpt-5.3-codex`, `deepseek-v3.1:671b-cloud`)
- Every command mixes retrieval (40-50% of content) with reasoning (30-40%) and I/O (15-20%)
- No model-tier optimization — Opus gets the same verbose retrieval instructions as Haiku
- Research/context-gathering is done inline by the main model instead of delegated to cheaper subagents

**Problem:** Commands are generic, not Claude-optimized. The main model wastes tokens on file reads, glob searches, and context gathering that a Haiku subagent could handle faster and cheaper.

## Solution Statement

Replace the `.claude/commands` symlink with a real directory containing 14 Claude-optimized command files. Each file:
1. Has the correct Claude model ID in YAML frontmatter (`claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`)
2. Delegates all research/retrieval to Haiku `Explore` subagents via Phase 0
3. Contains only the reasoning kernel — decision logic, output format, handoff rules
4. Preserves all pipeline semantics (handoff writes, artifact lifecycle, gate enforcement)

## Feature Metadata

- **Spec ID**: claude-command-optimization-001
- **Depth**: standard (file creation, no code logic)
- **Pillar**: Developer Experience
- **Dependencies**: None — `.opencode/commands/` stays untouched
- **Estimated tasks**: 6
- **Scope**: `.claude/commands/` directory only

### Slice Guardrails

- **In scope**: 14 command files in `.claude/commands/`
- **Out of scope**: `.opencode/commands/`, `.claude/skills/`, `.opencode/pipeline/`, validation/ subdirectory commands, special SKILL.md commands (prometheus, ralph-loop, start-work, ultrawork)

## Context References

### Codebase Files

#### Current Symlink
- `.claude/commands` → symlink to `.opencode/commands` (must be replaced with real directory)

#### Existing Commands (Source Material — DO NOT MODIFY)
- `.opencode/commands/prime.md` (326 lines) — Haiku-tier, context loading
- `.opencode/commands/commit.md` (118 lines) — Haiku-tier, git commit
- `.opencode/commands/code-review.md` (240 lines) — Sonnet-tier, review findings
- `.opencode/commands/code-review-fix.md` (218 lines) — Sonnet-tier, fix issues
- `.opencode/commands/code-loop.md` (246 lines) — Sonnet-tier, automated loop
- `.opencode/commands/final-review.md` (220 lines) — Sonnet-tier, approval gate
- `.opencode/commands/system-review.md` (415 lines) — Sonnet-tier, process analysis
- `.opencode/commands/pr.md` (299 lines) — Sonnet-tier, PR creation
- `.opencode/commands/planning.md` (576 lines) — Opus-tier, interactive planning
- `.opencode/commands/council.md` (83 lines) — Opus-tier, multi-perspective
- `.opencode/commands/mvp.md` (207 lines) — Opus-tier, big idea discovery
- `.opencode/commands/prd.md` (412 lines) — Opus-tier, product requirements
- `.opencode/commands/pillars.md` (199 lines) — Opus-tier, infrastructure layers
- `.opencode/commands/decompose.md` (245 lines) — Opus-tier, pillar research

### Memory References
- No memory.md exists yet

### RAG References
- None needed — all context is local

## Patterns to Follow

### Pattern 1: Command YAML Frontmatter
```yaml
---
description: {same description as original}
model: claude-sonnet-4-6
---
```

### Pattern 2: Phase 0 Research Delegation (Sonnet/Opus Commands)
```markdown
## Phase 0: Gather Context (Haiku Subagent)

Before reasoning, launch a Haiku Explore subagent to gather all context:

Use the Agent tool with `subagent_type="Explore"` and this prompt:

> Gather context for /code-review:
> 1. Run `git diff --name-only` and `git diff --cached --name-only`
> 2. Read each changed file in full
> 3. Read `.claude/config.md` for validation commands
> 4. Read `.agents/context/next-command.md` for feature name
> 5. Check for similar patterns in the codebase near changed files
>
> Return a structured Context Bundle with:
> - Modified files (path, lines added/removed)
> - Full content of each changed file
> - Config: validation commands from config.md
> - Feature name from handoff
> - Related patterns found

Wait for the subagent to return. Then proceed to Phase 1 with the Context Bundle.
```

### Pattern 3: Haiku Command (Trimmed — No Delegation)
```markdown
---
description: {description}
model: claude-haiku-4-5-20251001
---

# {Title}

## Pipeline Position
{same as original}

{Trimmed steps — essential logic only, no verbose tables or detection heuristics}
```

### Pattern 4: Pipeline Position Section (Unchanged)
Every command keeps its Pipeline Position section exactly as the original.

### Pattern 5: Handoff Write (Unchanged)
Every command keeps its Pipeline Handoff Write section exactly as the original.

## Implementation Plan

### Phase 1: Foundation
- Task 1: Remove symlink, create real `.claude/commands/` directory

### Phase 2: Haiku Tier
- Task 2: Create optimized `prime.md` and `commit.md`

### Phase 3: Sonnet Tier
- Task 3: Create optimized `code-review.md` and `code-review-fix.md`
- Task 4: Create optimized `code-loop.md` and `final-review.md`
- Task 5: Create optimized `system-review.md` and `pr.md`

### Phase 4: Opus Tier
- Task 6: Create optimized `planning.md`, `council.md`, `mvp.md`, `prd.md`, `pillars.md`, `decompose.md`

## Step-by-Step Tasks

### Task 1: Foundation — Replace Symlink
- **ACTION**: DELETE symlink + CREATE directory
- **TARGET**: `.claude/commands/`
- **IMPLEMENT**: Remove `.claude/commands` symlink, create real directory
- **VALIDATE**: `ls -la .claude/commands/` shows a real directory, not a symlink

### Task 2: Haiku Commands — prime.md, commit.md
- **ACTION**: CREATE
- **TARGET**: `.claude/commands/prime.md`, `.claude/commands/commit.md`
- **IMPLEMENT**: Trimmed versions with `model: claude-haiku-4-5-20251001`. Remove verbose detection tables from prime.md (move heuristics to inline comments). Trim commit.md to essential flow.
- **PATTERN**: Pattern 3 (Haiku — no delegation)
- **VALIDATE**: Files exist, frontmatter has correct model

### Task 3: Sonnet Review Commands — code-review.md, code-review-fix.md
- **ACTION**: CREATE
- **TARGET**: `.claude/commands/code-review.md`, `.claude/commands/code-review-fix.md`
- **IMPLEMENT**: Add Phase 0 Haiku delegation for file gathering and diff reading. Keep severity classification, verdict logic, handoff writes. Strip inline file reading steps.
- **PATTERN**: Pattern 2 (Phase 0 delegation)
- **VALIDATE**: Files exist, frontmatter has `model: claude-sonnet-4-6`

### Task 4: Sonnet Loop/Gate Commands — code-loop.md, final-review.md
- **ACTION**: CREATE
- **TARGET**: `.claude/commands/code-loop.md`, `.claude/commands/final-review.md`
- **IMPLEMENT**: Add Phase 0 Haiku delegation for artifact and diff gathering. Keep loop control logic, checkpoint system, exit conditions, verdict logic.
- **PATTERN**: Pattern 2 (Phase 0 delegation)
- **VALIDATE**: Files exist, frontmatter has `model: claude-sonnet-4-6`

### Task 5: Sonnet Delivery Commands — system-review.md, pr.md
- **ACTION**: CREATE
- **TARGET**: `.claude/commands/system-review.md`, `.claude/commands/pr.md`
- **IMPLEMENT**: Add Phase 0 Haiku delegation for plan/report/diff gathering. Keep scoring formulas, PR generation logic, handoff writes.
- **PATTERN**: Pattern 2 (Phase 0 delegation)
- **VALIDATE**: Files exist, frontmatter has `model: claude-sonnet-4-6`

### Task 6: Opus Commands — planning.md, council.md, mvp.md, prd.md, pillars.md, decompose.md
- **ACTION**: CREATE
- **TARGET**: 6 files in `.claude/commands/`
- **IMPLEMENT**: Update model to `claude-opus-4-6`. planning.md already has subagent delegation — keep as-is with model update. council.md: add research phase before perspectives. mvp.md, prd.md: add research delegation for existing docs. pillars.md, decompose.md: add research delegation for PRD/codebase.
- **PATTERN**: Pattern 2 (Phase 0 delegation) + extended thinking scaffolding
- **VALIDATE**: Files exist, frontmatter has `model: claude-opus-4-6`

## Testing Strategy

### Validation Approach
Since these are markdown command files (not TypeScript), validation is structural:
- L1: YAML frontmatter parses correctly (model field present and valid)
- L2: Required sections present (Pipeline Position, Handoff Write)
- L3: Phase 0 delegation block present (Sonnet/Opus commands)
- L4: Semantic consistency — handoff status values match AGENTS.md
- L5: Manual — invoke each command in Claude Code and verify it works

### Edge Cases
- Command with no arguments (default behavior preserved)
- Command with `$ARGUMENTS` (argument passing preserved)
- Subagent returns empty results (command should still function)
- RAG not available (command should skip RAG gracefully)

## Validation Commands

```bash
# L1: Symlink removed, real directory exists
test -d .claude/commands && ! test -L .claude/commands && echo "PASS" || echo "FAIL"

# L2: All 14 command files exist
for f in prime commit code-review code-review-fix code-loop final-review system-review pr planning council mvp prd pillars decompose; do
  test -f ".claude/commands/$f.md" && echo "OK: $f.md" || echo "MISSING: $f.md"
done

# L3: Model frontmatter present in all files
for f in .claude/commands/*.md; do
  grep -q "^model:" "$f" && echo "OK: $(basename $f)" || echo "MISSING model: $(basename $f)"
done

# L4: Correct model per tier
grep "model: claude-haiku" .claude/commands/prime.md .claude/commands/commit.md
grep "model: claude-sonnet" .claude/commands/code-review.md .claude/commands/code-review-fix.md .claude/commands/code-loop.md .claude/commands/final-review.md .claude/commands/system-review.md .claude/commands/pr.md
grep "model: claude-opus" .claude/commands/planning.md .claude/commands/council.md .claude/commands/mvp.md .claude/commands/prd.md .claude/commands/pillars.md .claude/commands/decompose.md
```

## Acceptance Criteria

### Implementation
- [x] `.claude/commands` symlink removed
- [ ] `.claude/commands/` is a real directory
- [ ] 14 command files created with correct Claude model IDs
- [ ] Haiku commands (2): trimmed, no delegation, `claude-haiku-4-5-20251001`
- [ ] Sonnet commands (6): Phase 0 delegation, reasoning kernel, `claude-sonnet-4-6`
- [ ] Opus commands (6): Phase 0 delegation, extended thinking, `claude-opus-4-6`
- [ ] All Pipeline Position sections preserved from originals
- [ ] All Pipeline Handoff Write sections preserved from originals
- [ ] All gate enforcement (hard stops) preserved from originals

### Runtime
- [ ] Claude Code discovers commands from `.claude/commands/`
- [ ] `/prime` runs and produces context report
- [ ] `/code-review` delegates research to subagent before reviewing
- [ ] `/planning` uses correct Opus model for deep reasoning

## Completion Checklist

- [ ] Task 1: Symlink replaced with real directory
- [ ] Task 2: Haiku commands created (prime.md, commit.md)
- [ ] Task 3: Sonnet review commands created (code-review.md, code-review-fix.md)
- [ ] Task 4: Sonnet loop/gate commands created (code-loop.md, final-review.md)
- [ ] Task 5: Sonnet delivery commands created (system-review.md, pr.md)
- [ ] Task 6: Opus commands created (planning.md, council.md, mvp.md, prd.md, pillars.md, decompose.md)
- [ ] All 14 files have correct model in frontmatter
- [ ] All handoff writes preserved
- [ ] `.opencode/commands/` untouched

## Notes

### Key Decisions
1. **Break mirror sync intentionally** — `.claude/commands/` will diverge from `.opencode/commands/`. The generic versions remain as reference for non-Claude agents.
2. **Inline delegation, not shared preamble** — Claude Code has no include mechanism for commands. Each command is self-contained.
3. **Skip execute.md** — Codex-only command, not invoked by Claude.
4. **Skip validation/ and SKILL.md commands** — Out of scope. Can be optimized in a follow-up.
5. **Preserve all pipeline semantics** — Handoff writes, artifact lifecycle, gate enforcement are copied verbatim from originals.

### Risks
- MEDIUM: Symlink removal could break something. Mitigation: `.opencode/commands/` still exists, pipeline code checks it first.
- LOW: Subagent delegation adds latency on first call. Acceptable — research quality improves.

### Confidence
8/10 — Pattern is clear and repetitive. All source commands are read. Main uncertainty is whether subagent delegation phrasing is optimal (can be tuned after first use).

## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.md` | Remove symlink, create real `.claude/commands/` dir | pending | 0 created, 1 dir |
| 2 | `task-2.md` | Haiku commands: prime.md, commit.md | pending | 2 created |
| 3 | `task-3.md` | Sonnet review: code-review.md, code-review-fix.md | pending | 2 created |
| 4 | `task-4.md` | Sonnet loop/gate: code-loop.md, final-review.md | pending | 2 created |
| 5 | `task-5.md` | Sonnet delivery: system-review.md, pr.md | pending | 2 created |
| 6 | `task-6.md` | Opus commands: planning.md, council.md, mvp.md, prd.md, pillars.md, decompose.md | pending | 6 created |
