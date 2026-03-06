# Task 2: Fix Category Model Naming Consistency

**Status:** pending  
**Created:** 2026-03-06  

---

## Objective

Align CATEGORY_MODEL_ROUTES in constants.ts with the model names in categories.json, fixing the `:latest` vs `-cloud` suffix inconsistency.

---

## Scope

### Files Modified
- `.opencode/tools/delegate-task/constants.ts` — CATEGORY_MODEL_ROUTES object

### What's Out of Scope
- categories.json (source of truth, no changes needed)
- Category prompts (no changes needed)
- Any behavior changes

### Dependencies
None — this task is independent of Task 1.

---

## Prior Task Context

None — this task is independent.

---

## Context References

### categories.json Model Names (Source of Truth)

From `.opencode/config/categories.json`:

```json
{
  "visual-engineering": {
    "model": "gemini-3-flash-preview:latest",
    "provider": "ollama"
  },
  "ultrabrain": {
    "model": "gpt-5.3-codex",
    "provider": "openai"
  },
  "artistry": {
    "model": "gemini-3-flash-preview:latest",
    "provider": "ollama"
  },
  "quick": {
    "model": "glm-4.7:cloud",
    "provider": "ollama"
  },
  "deep": {
    "model": "qwen3-coder-next:cloud",
    "provider": "ollama"
  },
  "unspecified-low": {
    "model": "qwen3-coder-next:cloud",
    "provider": "ollama"
  },
  "unspecified-high": {
    "model": "deepseek-v3.1:671b-cloud",
    "provider": "ollama"
  },
  "writing": {
    "model": "kimi-k2.5:cloud",
    "provider": "ollama"
  }
}
```

### Current constants.ts CATEGORY_MODEL_ROUTES (Lines 244-289)

```typescript
export const CATEGORY_MODEL_ROUTES: Record<string, {
  provider: string
  model: string
  label: string
}> = {
  "visual-engineering": {
    provider: "ollama",
    model: "gemini-3-flash-preview-cloud",  // MISMATCH: should be "gemini-3-flash-preview:latest"
    label: "GEMINI-3-FLASH"
  },
  "ultrabrain": {
    provider: "openai",
    model: "gpt-5.3-codex",  // CORRECT
    label: "GPT-5.3-CODEX"
  },
  "artistry": {
    provider: "ollama",
    model: "gemini-3-flash-preview-cloud",  // MISMATCH: should be "gemini-3-flash-preview:latest"
    label: "GEMINI-3-FLASH"
  },
  "quick": {
    provider: "ollama",
    model: "glm-4.7:cloud",  // CORRECT
    label: "GLM-4.7"
  },
  "deep": {
    provider: "ollama",
    model: "qwen3-coder-next:cloud",  // CORRECT
    label: "QWEN3-CODER-NEXT"
  },
  "unspecified-low": {
    provider: "ollama",
    model: "qwen3-coder-next:cloud",  // CORRECT
    label: "QWEN3-CODER-NEXT"
  },
  "unspecified-high": {
    provider: "ollama",
    model: "deepseek-v3.1:671b-cloud",  // CORRECT
    label: "DEEPSEEK-V3.1"
  },
  "writing": {
    provider: "ollama",
    model: "kimi-k2.5:cloud",  // CORRECT
    label: "KIMI-K2.5"
  }
}
```

### The Issue

`visual-engineering` and `artistry` categories have:
- **categories.json:** `gemini-3-flash-preview:latest`
- **constants.ts:** `gemini-3-flash-preview-cloud`

The `:latest` suffix format vs `-cloud` suffix format is inconsistent. Align to categories.json.

---

## Patterns to Follow

### Pattern: Model Naming Convention in constants.ts

The model identifier should match exactly what's in categories.json:

```typescript
"category-name": {
  provider: "ollama" | "openai" | "anthropic",
  model: "exact-model-identifier-from-categories-json",
  label: "DISPLAY-LABEL"
},
```

### Pattern: Ollama Cloud Model Suffixes

From the codebase, valid Ollama Cloud model suffixes:
- `:cloud` — for Ollama Cloud hosted models
- `:latest` — for latest version tag

---

## Step-by-Step Tasks

### Step 1: Update visual-engineering model

**ACTION:** UPDATE  
**TARGET:** `.opencode/tools/delegate-task/constants.ts:249-252`

**Current:**
```typescript
  "visual-engineering": {
    provider: "ollama",
    model: "gemini-3-flash-preview-cloud",
    label: "GEMINI-3-FLASH"
  },
```

**Replace with:**
```typescript
  "visual-engineering": {
    provider: "ollama",
    model: "gemini-3-flash-preview:latest",
    label: "GEMINI-3-FLASH"
  },
```

---

### Step 2: Update artistry model

**ACTION:** UPDATE  
**TARGET:** `.opencode/tools/delegate-task/constants.ts:259-262`

**Current:**
```typescript
  "artistry": {
    provider: "ollama",
    model: "gemini-3-flash-preview-cloud",
    label: "GEMINI-3-FLASH"
  },
```

**Replace with:**
```typescript
  "artistry": {
    provider: "ollama",
    model: "gemini-3-flash-preview:latest",
    label: "GEMINI-3-FLASH"
  },
```

---

### Step 3: Verify remaining categories are correct

**ACTION:** VALIDATE  
**TARGET:** `.opencode/tools/delegate-task/constants.ts:244-289`

Verify these match categories.json:
- [ ] ultrabrain: `gpt-5.3-codex` ✓
- [ ] quick: `glm-4.7:cloud` ✓
- [ ] deep: `qwen3-coder-next:cloud` ✓
- [ ] unspecified-low: `qwen3-coder-next:cloud` ✓
- [ ] unspecified-high: `deepseek-v3.1:671b-cloud` ✓
- [ ] writing: `kimi-k2.5:cloud` ✓

---

### Step 4: Verify L2 fallback model is also consistent

**ACTION:** VALIDATE  
**TARGET:** `.opencode/tools/delegate-task/category-selector.ts`

Check if there's a fallback model referenced that also needs updating. Look for `glm-4.7` without the `:cloud` suffix.

The audit found a potential issue at line 57 of category-selector.ts with `glm-4.7` vs `glm-4.7-cloud`.

---

## Testing Strategy

### Integration Test: category-routing.test.ts

The existing test file `.opencode/tests/integration/category-routing.test.ts` verifies category routing.

### Manual Validation Checklist

After changes, verify:
- [ ] visual-engineering uses `gemini-3-flash-preview:latest`
- [ ] artistry uses `gemini-3-flash-preview:latest`
- [ ] TypeScript compilation succeeds
- [ ] Category routing tests pass

---

## Validation Commands

| Level | Command | Expected |
|-------|---------|----------|
| L1 | `npx tsc --noEmit` | No type errors |
| L2 | `npx vitest run .opencode/tests/integration/category-routing.test.ts` | All tests pass |

---

## Acceptance Criteria

### Implementation Criteria
- [ ] visual-engineering model matches categories.json
- [ ] artistry model matches categories.json
- [ ] All other categories remain unchanged (already correct)
- [ ] TypeScript compilation succeeds
- [ ] category-routing.test.ts passes

### Runtime Verification
- [ ] No runtime errors when loading categories
- [ ] Category routing resolves correctly

---

## Handoff Notes

After completing this task:
- Category model names are now consistent with categories.json
- No changes to categories.json itself (it was correct)
- Task 4 will populate skill recommendations for categories