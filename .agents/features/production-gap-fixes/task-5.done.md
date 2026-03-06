# Task 5: Expand Fallback Chains

**Status:** pending  
**Created:** 2026-03-06  

---

## Objective

Expand the FALLBACK_CHAINS in registry.ts to include all fallback models documented in AGENTS.md, increasing resilience when primary models fail.

---

## Scope

### Files Modified
- `.opencode/agents/registry.ts` — FALLBACK_CHAINS object

### What's Out of Scope
- Primary models (Task 1)
- Category routing
- Any behavior changes

### Dependencies
**Depends on Task 1** — Same file (registry.ts), but editing different section (FALLBACK_CHAINS vs AGENT_REGISTRY). Edit Task 5 after Task 1 is complete to avoid merge conflicts.

---

## Prior Task Context

Task 1 updated AGENT_REGISTRY primary models. This task updates FALLBACK_CHAINS (lines 80-99) in the same file. The two objects are separate, so conflicts are unlikely, but Task 1 should be committed first.

---

## Context References

### AGENTS.md Fallback Table (Lines 362-371)

From AGENTS.md:

| Agent | Primary Model | Fallback 1 | Fallback 2 | Fallback 3 |
|-------|---------------|------------|------------|------------|
| sisyphus | claude-opus-4-6 | kimi-k2.5 | glm-5 | big-pickle |
| hephaestus | gpt-5.3-codex | gpt-5.2 | — | — |
| oracle | gpt-5.2 | gemini-3.1-pro | claude-opus-4-6 | — |
| librarian | kimi-k2.5 | gemini-3-flash | gpt-5.2 | glm-4.6v |
| explore | grok-code-fast-1 | minimax-m2.5 | claude-haiku-4-5 | gpt-5-nano |
| metis | claude-opus-4-6 | gpt-5.2 | kimi-k2.5 | gemini-3.1-pro |
| momus | gpt-5.2 | claude-opus-4-6 | gemini-3.1-pro | — |
| atlas | kimi-k2.5 | claude-sonnet-4-6 | gpt-5.2 | — |
| prometheus | claude-opus-4-6 | kimi-k2.5 | gpt-5.2 | gemini-3.1-pro |
| multimodal-looker | gemini-3-flash | minimax-m2.5 | big-pickle | — |

### Current FALLBACK_CHAINS (Lines 80-99)

```typescript
export const FALLBACK_CHAINS = {
  // Ultrabrain tier: Codex with GPT-5.2 fallback
  sisyphus: ["gpt-5.2"],
  hephaestus: ["gpt-5.2"],
  oracle: ["gpt-5.2"],
  momus: ["gpt-5.2"],

  // Medium tier: Ollama Cloud fallbacks
  prometheus: ["qwen3-next:80b-cloud"],
  metis: ["qwen3-next:80b-cloud"],
  atlas: ["kimi-k2.5:cloud"],
  librarian: ["kimi-k2.5:cloud"],

  // Fast tier: Ollama Cloud fallbacks
  explore: ["qwen3-coder-next:cloud"],
  multimodalLooker: ["qwen3-vl:cloud"],

  // Inherited from category dispatch
  sisyphusJunior: [],
} as const
```

### Issue: Single Fallback vs Documented 3-4 Fallbacks

The current implementation has only 1 fallback per agent. AGENTS.md documents 2-4 fallbacks for resilience.

---

## Patterns to Follow

### Pattern: Fallback Chain Structure

```typescript
export const FALLBACK_CHAINS = {
  agentName: ["fallback-1", "fallback-2", "fallback-3"],
  // Model names without :cloud suffix for Ollama models
  // Use documented model identifiers
} as const
```

### Pattern: Fallback Chain Naming Convention

From AGENTS.md documentation and installed models:
- Anthropic: `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5`
- OpenAI: `gpt-5.3-codex`, `gpt-5.2`
- Ollama Cloud: `kimi-k2.5:cloud`, `gemini-3-flash`, `glm-5`, `minimax-m2.5`, etc.

### Pattern: Model Suffix Handling

AGENTS.md uses model names without `:cloud` suffix in most cases. The `:cloud` suffix is added by the routing layer when dispatching to Ollama Cloud. For consistency with documentation, use the names as documented in AGENTS.md.

---

## Step-by-Step Tasks

### Step 1: Update sisyphus fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:82`

**Current:**
```typescript
  sisyphus: ["gpt-5.2"],
```

**Replace with:**
```typescript
  sisyphus: ["kimi-k2.5", "glm-5", "big-pickle"],
```

---

### Step 2: Update hephaestus fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:83`

**Current:**
```typescript
  hephaestus: ["gpt-5.2"],
```

**Replace with:**
```typescript
  hephaestus: ["gpt-5.2"],
```

Note: Already correct — only one fallback documented.

---

### Step 3: Update oracle fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:84`

**Current:**
```typescript
  oracle: ["gpt-5.2"],
```

**Replace with:**
```typescript
  oracle: ["gemini-3.1-pro", "claude-opus-4-6"],
```

---

### Step 4: Update momus fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:85`

**Current:**
```typescript
  momus: ["gpt-5.2"],
```

**Replace with:**
```typescript
  momus: ["claude-opus-4-6", "gemini-3.1-pro"],
```

---

### Step 5: Update prometheus fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:88`

**Current:**
```typescript
  prometheus: ["qwen3-next:80b-cloud"],
```

**Replace with:**
```typescript
  prometheus: ["kimi-k2.5", "gpt-5.2", "gemini-3.1-pro"],
```

---

### Step 6: Update metis fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:89`

**Current:**
```typescript
  metis: ["qwen3-next:80b-cloud"],
```

**Replace with:**
```typescript
  metis: ["gpt-5.2", "kimi-k2.5", "gemini-3.1-pro"],
```

---

### Step 7: Update atlas fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:90`

**Current:**
```typescript
  atlas: ["kimi-k2.5:cloud"],
```

**Replace with:**
```typescript
  atlas: ["claude-sonnet-4-6", "gpt-5.2"],
```

---

### Step 8: Update librarian fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:91`

**Current:**
```typescript
  librarian: ["kimi-k2.5:cloud"],
```

**Replace with:**
```typescript
  librarian: ["gemini-3-flash", "gpt-5.2", "glm-4.6v"],
```

---

### Step 9: Update explore fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:94`

**Current:**
```typescript
  explore: ["qwen3-coder-next:cloud"],
```

**Replace with:**
```typescript
  explore: ["minimax-m2.5", "claude-haiku-4-5", "gpt-5-nano"],
```

---

### Step 10: Update multimodalLooker fallback chain

**ACTION:** UPDATE  
**TARGET:** `.opencode/agents/registry.ts:95`

**Current:**
```typescript
  multimodalLooker: ["qwen3-vl:cloud"],
```

**Replace with:**
```typescript
  multimodalLooker: ["minimax-m2.5", "big-pickle"],
```

---

### Step 11: Verify sisyphusJunior fallback chain

**ACTION:** VALIDATE  
**TARGET:** `.opencode/agents/registry.ts:98`

**Expected:**
```typescript
  sisyphusJunior: [],
```

This is correct — sisyphus-junior inherits from category dispatch, not fallback chains.

---

## Testing Strategy

### Unit Test: agent-resolution.test.ts

The existing test verifies agent resolution including fallback chains.

### Manual Validation Checklist

After changes:
- [ ] All fallback chains have 2-4 fallback models
- [ ] Fallback models match AGENTS.md documentation
- [ ] TypeScript compilation succeeds
- [ ] Agent resolution tests pass

---

## Validation Commands

| Level | Command | Expected |
|-------|---------|----------|
| L1 | `npx tsc --noEmit` | No type errors |
| L2 | `npx vitest run .opencode/tests/integration/agent-resolution.test.ts` | All tests pass |

---

## Acceptance Criteria

### Implementation Criteria
- [ ] sisyphus: `["kimi-k2.5", "glm-5", "big-pickle"]`
- [ ] hephaestus: `["gpt-5.2"]` (unchanged, only one documented)
- [ ] oracle: `["gemini-3.1-pro", "claude-opus-4-6"]`
- [ ] momus: `["claude-opus-4-6", "gemini-3.1-pro"]`
- [ ] prometheus: `["kimi-k2.5", "gpt-5.2", "gemini-3.1-pro"]`
- [ ] metis: `["gpt-5.2", "kimi-k2.5", "gemini-3.1-pro"]`
- [ ] atlas: `["claude-sonnet-4-6", "gpt-5.2"]`
- [ ] librarian: `["gemini-3-flash", "gpt-5.2", "glm-4.6v"]`
- [ ] explore: `["minimax-m2.5", "claude-haiku-4-5", "gpt-5-nano"]`
- [ ] multimodalLooker: `["minimax-m2.5", "big-pickle"]`
- [ ] sisyphusJunior: `[]` (unchanged, inherited from category)

### Runtime Verification
- [ ] TypeScript compilation succeeds
- [ ] Agent resolution tests pass
- [ ] Fallback fallback chains are properly typed

---

## Handoff Notes

After completing this task:
- **ALL TASKS COMPLETE** — All 5 tasks for production-gap-fixes feature are done
- Fallback chains now match AGENTS.md documentation
- Registry.ts is fully aligned with documentation

---

## COMPLETION CHECKLIST

- [ ] Task 1: Agent primary models synced ✓
- [ ] Task 2: Category model naming fixed ✓
- [ ] Task 3: Validation skills created ✓
- [ ] Task 4: Skill recommendations populated ✓
- [ ] Task 5: Fallback chains expanded ✓
- [ ] L1 validation passed (TypeScript)
- [ ] L2 validation passed (tests)
- [ ] All changes committed
- [ ] Plan marked done