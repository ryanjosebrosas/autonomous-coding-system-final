# Task 1: Sync Agent Primary Models with AGENTS.md

**Status:** pending  
**Created:** 2026-03-06  

---

## Objective

Update the AGENT_REGISTRY in registry.ts to use the primary models documented in AGENTS.md, ensuring consistency between documentation and code.

---

## Scope

### Files Modified
- `.opencode/agents/registry.ts` — AGENT_REGISTRY object

### Files Modified Per Agent
The following agents need model updates:

| Agent | Current Model | Correct Model |
|-------|---------------|---------------|
| sisyphus | gpt-5.3-codex | claude-opus-4-6 |
| prometheus | qwen3-next:80b-cloud | claude-opus-4-6 |
| metis | qwen3-next:80b-cloud | claude-opus-4-6 |
| multimodal-looker | qwen3-vl:cloud | gemini-3-flash |

### What's Out of Scope
- Fallback chains (Task 5)
- Category routing (Task 2)
- Any behavior changes

### Dependencies
None — this is the first task.

---

## Prior Task Context

None — this is Task 1.

---

## Context References

### AGENTS.md Agent Table (Source of Truth)

From AGENTS.md, the documented primary models are:

```
| Agent | Primary Model | Provider |
|-------|---------------|----------|
| sisyphus | claude-opus-4-6 | anthropic |
| hephaestus | gpt-5.3-codex | openai |
| atlas | kimi-k2.5 | ollama |
| prometheus | claude-opus-4-6 | anthropic |
| oracle | gpt-5.2 | openai |
| metis | claude-opus-4-6 | anthropic |
| momus | gpt-5.2 | openai |
| sisyphus-junior | claude-sonnet-4-6 | anthropic |
| librarian | kimi-k2.5 | ollama |
| explore | grok-code-fast-1 | ollama |
| multimodal-looker | gemini-3-flash | ollama |
```

### Current registry.ts AGENT_REGISTRY (Lines 105-248)

```typescript
export const AGENT_REGISTRY: Record<string, AgentMetadata> = {
  sisyphus: {
    name: "sisyphus",
    displayName: "Sisyphus — Main Orchestrator",
    description: "Primary orchestrator that manages workflow, plans, delegates, and maintains session continuity. Named after the figure who rolls the boulder each day — representing daily engineering work.",
    category: "unspecified-high",
    model: "gpt-5.3-codex",  // WRONG: should be "claude-opus-4-6"
    temperature: 0.1,
    mode: "all",
    permissions: PERMISSIONS.full,
    fallbackChain: FALLBACK_CHAINS.sisyphus,
    deniedTools: [],
  },

  hephaestus: {
    name: "hephaestus",
    displayName: "Hephaestus — Deep Autonomous Worker",
    description: "Autonomous problem-solver for genuinely difficult, logic-heavy tasks. Takes clear goals and works autonomously without hand-holding.",
    category: "ultrabrain",
    model: "gpt-5.3-codex",  // CORRECT
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
    model: "kimi-k2.5:cloud",  // CORRECT (note: :cloud suffix is fine)
    temperature: 0.1,
    mode: "primary",
    permissions: PERMISSIONS.full,
    fallbackChain: FALLBACK_CHAINS.atlas,
    deniedTools: ["task", "call_omo_agent"],
  },

  prometheus: {
    name: "prometheus",
    displayName: "Prometheus — Strategic Interview Planner",
    description: "Interview-mode planner that discovers requirements through Socratic questioning before planning begins.",
    category: "unspecified-high",
    model: "qwen3-next:80b-cloud",  // WRONG: should be "claude-opus-4-6"
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.prometheus,
    deniedTools: ["write", "edit", "task"],
  },

  oracle: {
    name: "oracle",
    displayName: "Oracle — Architecture Consultant",
    description: "Read-only consultant for architecture decisions, debugging help, and multi-system tradeoffs. Provides consultation, never implementation.",
    category: "ultrabrain",
    model: "gpt-5.3-codex",  // WRONG: should be "gpt-5.2"
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.oracle,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
  },

  metis: {
    name: "metis",
    displayName: "Metis — Pre-Planning Gap Analyzer",
    description: "Identifies hidden intentions, ambiguities, and AI failure points before planning. Uses higher temperature (0.3) for creative gap detection.",
    category: "artistry",
    model: "qwen3-next:80b-cloud",  // WRONG: should be "claude-opus-4-6"
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
    model: "gpt-5.3-codex",  // WRONG: should be "gpt-5.2"
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
    model: "qwen3.5:cloud",  // WRONG: should be "claude-sonnet-4-6"
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
    model: "kimi-k2.5:cloud",  // CORRECT
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.librarian,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
  },

  explore: {
    name: "explore",
    displayName: "Explore — Internal Codebase Grep",
    description: "Fast contextual grep for the internal codebase. Find files, extract patterns, discover implementations.",
    category: "deep",
    model: "qwen3-coder-next:cloud",  // WRONG: should be "grok-code-fast-1"
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.readOnly,
    fallbackChain: FALLBACK_CHAINS.explore,
    deniedTools: ["write", "edit", "task", "call_omo_agent"],
  },

  "multimodal-looker": {
    name: "multimodal-looker",
    displayName: "Multimodal-Looker — PDF/Image Analysis",
    description: "Analyzes PDFs, images, diagrams, and visual content requiring interpretation beyond text extraction.",
    category: "unspecified-low",
    model: "qwen3-vl:cloud",  // WRONG: should be "gemini-3-flash"
    temperature: 0.1,
    mode: "subagent",
    permissions: PERMISSIONS.visionOnly,
    fallbackChain: FALLBACK_CHAINS.multimodalLooker,
    deniedTools: ["write", "edit", "bash", "grep", "task", "call_omo_agent"],
  },
} as const
```

---

## Patterns to Follow

### Pattern: Model Identifier Format

From AGENTS.md and existing correct entries:
- Anthropic models: `claude-opus-4-6`, `claude-sonnet-4-6`
- OpenAI models: `gpt-5.3-codex`, `gpt-5.2`
- Ollama models: `kimi-k2.5`, `grok-code-fast-1`, `gemini-3-flash`
- With `:cloud` suffix for Ollama Cloud: `kimi-k2.5:cloud`, `qwen3-coder-next:cloud`

### Pattern: Registry Entry Structure

```typescript
agentName: {
  name: "agent-name",
  displayName: "Display Name — Description",
  description: "Full description...",
  category: "category-name",
  model: "model-identifier",  // <-- This is what we're fixing
  temperature: 0.1,
  mode: "all" | "primary" | "subagent",
  permissions: PERMISSIONS.full,
  fallbackChain: FALLBACK_CHAINS.agentName,
  deniedTools: [],
},
```

---

## Step-by-Step Tasks

### Step 1: Update sisyphus model

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:111`

**Current:**
```typescript
    model: "gpt-5.3-codex",
```

**Replace with:**
```typescript
    model: "claude-opus-4-6",
```

---

### Step 2: Update prometheus model

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:150`

**Current:**
```typescript
    model: "qwen3-next:80b-cloud",
```

**Replace with:**
```typescript
    model: "claude-opus-4-6",
```

---

### Step 3: Update metis model

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:176`

**Current:**
```typescript
    model: "qwen3-next:80b-cloud",
```

**Replace with:**
```typescript
    model: "claude-opus-4-6",
```

---

### Step 4: Verify oracle model (should already be gpt-5.2)

**ACTION:** VALIDATE  
**TARGET:** `.opencode/agents/registry.ts:163`

**Expected:**
```typescript
    model: "gpt-5.2",
```

If current model is `gpt-5.3-codex`, update to `gpt-5.2`.

**Current in registry.ts:**
```typescript
    model: "gpt-5.3-codex",
```

**Replace with:**
```typescript
    model: "gpt-5.2",
```

---

### Step 5: Verify momus model (should already be gpt-5.2)

**ACTION:** VALIDATE  
**TARGET:** `.opencode/agents/registry.ts:189`

**Expected:**
```typescript
    model: "gpt-5.2",
```

If current model is `gpt-5.3-codex`, update to `gpt-5.2`.

**Current in registry.ts:**
```typescript
    model: "gpt-5.3-codex",
```

**Replace with:**
```typescript
    model: "gpt-5.2",
```

---

### Step 6: Update sisyphus-junior model

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:202`

**Current:**
```typescript
    model: "qwen3.5:cloud",
```

**Replace with:**
```typescript
    model: "claude-sonnet-4-6",
```

---

### Step 7: Update explore model

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:228`

**Current:**
```typescript
    model: "qwen3-coder-next:cloud",
```

**Replace with:**
```typescript
    model: "grok-code-fast-1",
```

---

### Step 8: Update multimodal-looker model

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:241`

**Current:**
```typescript
    model: "qwen3-vl:cloud",
```

**Replace with:**
```typescript
    model: "gemini-3-flash",
```

---

### Step 9: Verify hephaestus model (should already be correct)

**ACTION:** VALIDATE  
**TARGET:** `.opencode/agents/registry.ts:124`

**Expected:**
```typescript
    model: "gpt-5.3-codex",
```

This is CORRECT as-is. No change needed.

---

### Step 10: Verify atlas model (should already be correct)

**ACTION:** VALIDATE  
**TARGET:** `.opencode/agents/registry.ts:137`

**Expected:**
```typescript
    model: "kimi-k2.5:cloud",
```

This is CORRECT as-is. No change needed.

---

### Step 11: Verify librarian model (should already be correct)

**ACTION:** VALIDATE  
**TARGET:** `.opencode/agents/registry.ts:215`

**Expected:**
```typescript
    model: "kimi-k2.5:cloud",
```

This is CORRECT as-is. No change needed.

---

## Testing Strategy

### Unit Test: agent-resolution.test.ts

The existing test file `.opencode/tests/integration/agent-resolution.test.ts` verifies agent resolution.

### Manual Validation Checklist

After changes, verify:
- [ ] All agent models match AGENTS.md documentation
- [ ] TypeScript compilation succeeds
- [ ] No runtime errors when loading registry

---

## Validation Commands

| Level | Command | Expected |
|-------|---------|----------|
| L1 | `npx tsc --noEmit` | No type errors |
| L2 | `npx vitest run .opencode/tests/integration/agent-resolution.test.ts` | All tests pass |

---

## Acceptance Criteria

### Implementation Criteria
- [ ] sisyphus uses `claude-opus-4-6`
- [ ] prometheus uses `claude-opus-4-6`
- [ ] metis uses `claude-opus-4-6`
- [ ] oracle uses `gpt-5.2`
- [ ] momus uses `gpt-5.2`
- [ ] sisyphus-junior uses `claude-sonnet-4-6`
- [ ] explore uses `grok-code-fast-1`
- [ ] multimodal-looker uses `gemini-3-flash`
- [ ] hephaestus remains `gpt-5.3-codex` (correct)
- [ ] atlas remains `kimi-k2.5:cloud` (correct)
- [ ] librarian remains `kimi-k2.5:cloud` (correct)

### Runtime Verification
- [ ] TypeScript compilation succeeds
- [ ] agent-resolution.test.ts passes

---

## Handoff Notes

After completing this task:
- Task 5 will update fallback chains for these same agents
- The primary models are now aligned with AGENTS.md documentation
- Fallback chains still need expansion to match AGENTS.md fallback tables