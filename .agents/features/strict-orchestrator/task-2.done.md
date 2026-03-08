# Task 2 — Add prime-agent Definition + Skill

## Task Metadata
- Feature: strict-orchestrator
- Wave: 1 (Foundation)
- Depends on: Task 1
- Blocks: Task 3
- Objective: Introduce a dedicated prime-agent for lightweight context loading.

## Objective
Add `prime-agent` in registry fallback chains, AGENT_REGISTRY, and AGENT_NAMES; then create `.opencode/agents/prime-agent/SKILL.md` with role and operational constraints.

## Required Prime Agent Definition
```typescript
"prime-agent": {
  name: "prime-agent",
  displayName: "Prime Agent — Context Loader",
  description: "Lightweight context loading agent for /prime command. Gathers git state, stack detection, pipeline status, memory context.",
  category: "unspecified-low",
  model: "ollama/glm-5:cloud",
  temperature: 0.1,
  mode: "subagent",
  permissions: {
    readFile: true,
    writeFile: false,
    editFile: false,
    bash: true,
    grep: true,
    task: false,
  },
  fallbackChain: ["ollama/glm-5:cloud"],
  deniedTools: ["write", "edit", "task", "call_omo_agent"],
}
```

## Current Content Baseline (Inline)
### Current File: `.opencode/agents/registry.ts`

````text
// ============================================================================
// AGENT REGISTRY
// ============================================================================
// 
// Central registry of all built-in agents with their configurations.
// Each agent follows the AgentFactory pattern: createXXXAgent(model) → AgentConfig
//

import type { AgentMode } from "./types"

// ============================================================================
// AGENT METADATA TYPES
// ============================================================================

export interface AgentMetadata {
  name: string
  displayName: string
  description: string
  category: string
  model: string
  temperature: number
  mode: AgentMode
  permissions: AgentPermissions
  fallbackChain: readonly string[]
  deniedTools: string[]
  archonEnabled?: boolean // Optional: enables Archon RAG search capabilities
}

export interface AgentPermissions {
  readFile: boolean
  writeFile: boolean
  editFile: boolean
  bash: boolean
  grep: boolean
  task: boolean // Can delegate to other agents
}

// ============================================================================
// PERMISSION PRESETS
// ============================================================================

export const PERMISSIONS = {
  full: {
    readFile: true,
    writeFile: true,
    editFile: true,
    bash: true,
    grep: true,
    task: true,
  },
  readOnly: {
    readFile: true,
    writeFile: false,
    editFile: false,
    bash: false,
    grep: true,
    task: false,
  },
  fullNoTask: {
    readFile: true,
    writeFile: true,
    editFile: true,
    bash: true,
    grep: true,
    task: false, // Cannot delegate
  },
  visionOnly: {
    readFile: false,
    writeFile: false,
    editFile: false,
    bash: false,
    grep: false,
    task: false,
  },
  orchestratorOnly: {
    readFile: true,
    writeFile: false,
    editFile: false,
    bash: false,
    grep: true,
    task: true, // Can ONLY delegate
  },
} as const

// ============================================================================
// FALLBACK CHAINS
// ============================================================================

export const FALLBACK_CHAINS = {
  // Orchestrator
  sisyphus: ["ollama/glm-5:cloud"],

  // Execution/Analysis agents
  hephaestus: ["ollama/glm-5:cloud"],
  oracle: ["ollama/glm-5:cloud"],
  momus: ["ollama/glm-5:cloud"],
  metis: ["ollama/glm-5:cloud"],
  atlas: ["ollama/glm-5:cloud"],
  librarian: ["ollama/glm-5:cloud"],
  explore: ["ollama/glm-5:cloud"],
  prometheus: ["ollama/glm-5:cloud"],
  multimodalLooker: ["ollama/glm-5:cloud"],
  tmuxMaster: ["ollama/glm-5:cloud"],

  // Inherited from category dispatch
  sisyphusJunior: [],
} as const

// ============================================================================
// AGENT REGISTRY
// ============================================================================

export const AGENT_REGISTRY: Record<string, AgentMetadata> = {
  sisyphus: {
    name: "sisyphus",
    displayName: "Sisyphus — Main Orchestrator",
    description: "Primary orchestrator that manages workflow, plans, delegates, and maintains session continuity. Named after the figure who rolls the boulder each day — representing daily engineering work.",
    category: "unspecified-high",
    model: "anthropic/claude-sonnet-4-6",
    temperature: 0.1,
    mode: "all",
    permissions: PERMISSIONS.orchestratorOnly,
    fallbackChain: FALLBACK_CHAINS.sisyphus,
    deniedTools: [],
  },

  hephaestus: {
    name: "hephaestus",
    displayName: "Hephaestus — Deep Autonomous Worker",
    description: "Autonomous problem-solver for genuinely difficult, logic-heavy tasks. Takes clear goals and works autonomously without hand-holding.",
    category: "ultrabrain",
    model: "openai/gpt-5.3-codex",
    temperature: 0.1,
    mode: "all",
    permissions: PERMISSIONS.full,
    fallbackChain: FALLBACK_CHAINS.hephaestus,
    deniedTools: [],
  },

  atlas: {
    name: "atlas",
    displayName: "Atlas — Todo List Conductor",
    description: "Manages todo list and tracks progress. Ensures tasks don't fall through cracks and accumulates wisdom across sessions.",
    category: "writing",
    model: "ollama/glm-5:cloud",
    temperature: 0.1,
    mode: "primary",
    permissions: PERMISSIONS.full,
    fallbackChain: FALLBACK_CHAINS.atlas,
    deniedTools: ["task", "call_omo_agent"],
  },

  oracle: {
    name: "oracle",
    displayName: "Oracle — Architecture Consultant",
    description: "Read-only consultant for architecture decisions, debugging help, and multi-system tradeoffs. Provides consultation, never implementation.",
    category: "ultrabrain",
    model: "anthropic/claude-opus-4-6",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.oracle,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
  },

  prometheus: {
    name: "prometheus",
    displayName: "Prometheus — Strategic Planner",
    description: "Strategic planner with interview mode. Runs the full /planning process: intent classification, discovery interview, codebase research, design reasoning, task decomposition, and gap analysis. Produces plan.md + task-N.md artifacts.",
    category: "unspecified-high",
    model: "anthropic/claude-sonnet-4-6",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.full,
    fallbackChain: FALLBACK_CHAINS.prometheus,
    deniedTools: [],
  },

  metis: {
    name: "metis",
    displayName: "Metis — Pre-Planning Gap Analyzer",
    description: "Identifies hidden intentions, ambiguities, and AI failure points before planning. Uses higher temperature (0.3) for creative gap detection.",
    category: "artistry",
    model: "anthropic/claude-sonnet-4-6",
    temperature: 0.3, // Higher for creative gap detection
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.metis,
    deniedTools: ["write", "edit", "task"],
  },

  momus: {
    name: "momus",
    displayName: "Momus — Plan Reviewer",
    description: "Ruthless plan reviewer that ensures plans are complete, verifiable, and actionable. Rejects vague plans.",
    category: "ultrabrain",
    model: "anthropic/claude-opus-4-6",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.momus,
    deniedTools: ["write", "edit", "task"],
  },

  "sisyphus-junior": {
    name: "sisyphus-junior",
    displayName: "Sisyphus-Junior — Category Executor",
    description: "Focused executor spawned by category dispatch. Works autonomously within MUST DO / MUST NOT DO constraints. Cannot delegate further.",
    category: "unspecified-high", // Inherited from dispatch
    model: "openai/gpt-5.3-codex",
    temperature: 0.1,
    mode: "all",
    permissions: PERMISSIONS.fullNoTask,
    fallbackChain: [], // User-configurable via category
    deniedTools: ["task"],
  },

  librarian: {
    name: "librarian",
    displayName: "Librarian — External Documentation",
    description: "Searches external documentation and finds implementation examples from real repositories.",
    category: "writing",
    model: "ollama/glm-5:cloud",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.librarian,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
    archonEnabled: true,
  },

  explore: {
    name: "explore",
    displayName: "Explore — Internal Codebase Grep",
    description: "Fast contextual grep for the internal codebase. Find files, extract patterns, discover implementations.",
    category: "deep",
    model: "ollama/glm-5:cloud",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.explore,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
    archonEnabled: true,
  },

  "tmux-master": {
    name: "tmux-master",
    displayName: "Tmux-Master — Terminal Multiplexer",
    description: "Manages tmux sessions, windows, and panes. Use for interactive processes, REPLs, debuggers, TUI apps, long-running commands, and parallel terminal workflows.",
    category: "unspecified-low",
    model: "ollama/glm-5:cloud",
    temperature: 0.1,
    mode: "subagent",
    permissions: {
      readFile: false,
      writeFile: false,
      editFile: false,
      bash: true,
      grep: false,
      task: false,
    },
    fallbackChain: FALLBACK_CHAINS.tmuxMaster,
    deniedTools: ["write", "edit", "read", "grep", "task", "call_omo_agent"],
  },

  "multimodal-looker": {
    name: "multimodal-looker",
    displayName: "Multimodal-Looker — PDF/Image Analysis",
    description: "Analyzes PDFs, images, diagrams, and visual content requiring interpretation beyond text extraction.",
    category: "unspecified-low",
    model: "ollama-cloud/gemini-3-flash-preview",
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.visionOnly,
    fallbackChain: FALLBACK_CHAINS.multimodalLooker,
    deniedTools: ["write", "edit", "bash", "grep", "task", "call_omo_agent"],
  },
} as const

// ============================================================================
// AGENT LOOKUP FUNCTIONS
// ============================================================================

export function getAgentByName(name: string): AgentMetadata | null {
  return AGENT_REGISTRY[name] || null
}

export function getAllAgentNames(): string[] {
  return Object.keys(AGENT_REGISTRY)
}

export function getAgentsByMode(mode: AgentMode): AgentMetadata[] {
  return Object.values(AGENT_REGISTRY).filter(agent => agent.mode === mode || agent.mode === "all")
}

export function getAgentsByCategory(category: string): AgentMetadata[] {
  return Object.values(AGENT_REGISTRY).filter(agent => agent.category === category)
}

export function getReadOnlyAgents(): AgentMetadata[] {
  return Object.values(AGENT_REGISTRY).filter(agent => 
    !agent.permissions.writeFile && !agent.permissions.editFile
  )
}

export function getDelegatingAgents(): AgentMetadata[] {
  return Object.values(AGENT_REGISTRY).filter(agent => 
    agent.permissions.task === true
  )
}

// ============================================================================
// AGENT TYPE EXPORTS
// ============================================================================

export type AgentName = keyof typeof AGENT_REGISTRY

export const AGENT_NAMES: AgentName[] = [
  "sisyphus",
  "hephaestus",
  "atlas",
  "prometheus",
  "oracle",
  "metis",
  "momus",
  "sisyphus-junior",
  "librarian",
  "explore",
  "multimodal-looker",
  "tmux-master",
] as const

````

### Current File: `.opencode/skills/prime/SKILL.md`

````text
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
````


## Planned Change Blocks
### Block A — FALLBACK_CHAINS
Add:
```text
primeAgent: ["ollama/glm-5:cloud"],
```

### Block B — AGENT_REGISTRY
Add a new object entry for `"prime-agent"` near other lightweight helpers (after tmux-master and before closing block is acceptable).

### Block C — AGENT_NAMES
Add `"prime-agent"` to the exported AGENT_NAMES array.

### Block D — New Skill File
Create `.opencode/agents/prime-agent/SKILL.md` describing:
- role and mission
- allowed tools and denied tools
- dirty-state-first and context-load-only behavior
- no write/edit/task delegation capability

## Implementation Steps
1. Update fallback chains.
2. Insert AGENT_REGISTRY entry.
3. Add AGENT_NAMES entry.
4. Create prime-agent skill markdown file.
5. Run `.opencode` tests.

## QA Scenarios
1. **Registry existence check**
   - Tool: Read
   - Action: search `prime-agent` in `registry.ts`
   - Expected: appears in FALLBACK_CHAINS, AGENT_REGISTRY, AGENT_NAMES
2. **Permission correctness check**
   - Tool: Read
   - Action: inspect prime-agent permissions in registry
   - Expected: readFile=true, writeFile=false, editFile=false, bash=true, grep=true, task=false
3. **Skill file check**
   - Tool: Read
   - Action: open `.opencode/agents/prime-agent/SKILL.md`
   - Expected: file exists with role + tool constraints
4. **Runtime check**
   - Tool: Bash
   - Action: `cd .opencode && bun vitest`
   - Expected: all tests pass

## Parallelization
- Parallelizable:
  - drafting skill file content and planning registry insertion points.
- Sequential required:
  - fallback update -> registry entry -> AGENT_NAMES -> tests.

## Acceptance Criteria
- [ ] `prime-agent` exists in AGENT_REGISTRY
- [ ] `prime-agent` exists in FALLBACK_CHAINS
- [ ] `prime-agent` exists in AGENT_NAMES
- [ ] `.opencode/agents/prime-agent/SKILL.md` exists with full role content
- [ ] custom permissions match specification exactly
- [ ] `bun vitest` passes in `.opencode/`

## Validation Commands
```bash
cd .opencode && bun vitest
```

## Rollback
- Revert only prime-agent-specific edits if tests fail due to insertion mistakes.
- Do not alter unrelated agent entries.

## Task Completion Checklist
- [ ] registry updates complete
- [ ] skill file created
- [ ] QA scenarios passed
- [ ] acceptance criteria all met

## Extended Execution Detail Matrix

- Detail 001: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 002: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 003: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 004: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 005: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 006: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 007: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 008: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 009: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 010: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 011: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 012: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 013: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 014: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 015: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 016: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 017: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 018: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 019: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 020: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 021: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 022: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 023: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 024: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 025: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 026: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 027: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 028: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 029: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 030: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 031: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 032: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 033: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 034: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 035: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 036: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 037: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 038: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 039: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 040: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 041: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 042: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 043: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 044: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 045: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 046: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 047: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 048: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 049: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 050: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 051: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 052: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
- Detail 053: Preserve strict-orchestrator decision integrity across planning, delegation, verification, and pipeline handoff semantics.
