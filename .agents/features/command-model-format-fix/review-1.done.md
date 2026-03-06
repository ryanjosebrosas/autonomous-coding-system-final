# Code Review — Iteration 1

**Feature**: command-model-format-fix
**Date**: 2026-03-06T08:35:00+08:00
**Reviewer**: /code-loop automated review

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Major | 2 |
| Minor | 1 |

---

## Findings

### Major-1: ESLint config missing ignores for dist/ and test files

**File**: `.opencode/eslint.config.mjs`
**Lines**: 4-22

**Problem**: The ESLint configuration doesn't ignore `dist/` directory or test files (`*.test.ts`). This causes parsing errors during lint:
- `dist/**/*.d.ts` files are not in tsconfig.json project
- `*.test.ts` files are not in tsconfig.json project

**Evidence**:
```
C:\...\.opencode\dist\agents\agent-builder.d.ts
  0:0  error  Parsing error: "parserOptions.project" has been provided for @typescript-eslint/parser.
The file was not found in any of the provided project(s): dist\agents\agent-builder.d.ts
```

**Fix**: Add ignores array to the ESLint config:
```javascript
export default [
  {
    ignores: ['dist/**', '**/*.test.ts'],
  },
  {
    files: ['**/*.ts'],
    // ... rest of config
  },
]
```

---

### Major-2: Unused import in sisyphus.ts

**File**: `.opencode/agents/sisyphus.ts`
**Line**: 13

**Problem**: `buildPermissionContext` is imported but never used in the file.

**Evidence**:
```
C:\...\.opencode\agents\sisyphus.ts
  13:3  error  'buildPermissionContext' is defined but never used  @typescript-eslint/no-unused-vars
```

**Fix**: Remove unused import:
```typescript
import {
  buildSystemPrompt,
  buildRules,
  buildDecisionTree,
  type AgentPromptContext,
  type BuiltPrompt,
} from "./prompt-builder"
```

---

### Minor-1: Unused parameter in config.ts

**File**: `.opencode/core/config.ts`
**Line**: 143

**Problem**: `ctx` parameter is defined but never used in `loadPluginConfig`.

**Evidence**:
```
C:\...\.opencode\core\config.ts
  143:3  error  'ctx' is defined but never used. Allowed unused args must match /^_/u  @typescript-eslint/no-unused-vars
```

**Fix**: Prefix with underscore to indicate intentionally unused:
```typescript
export function loadPluginConfig(
  directory: string,
  _ctx: PluginContext
): OhMyOpenCodeConfig {
```

---

## Validation Status

| Level | Status | Notes |
|-------|--------|-------|
| L1 Lint | ❌ FAIL | 2 Major + 1 Minor issues |
| L2 Types | ✅ PASS | `tsc --noEmit` clean |
| L3 Tests | ⏳ SKIP | Test files excluded from lint |

---

## Next Action

Apply fixes via `/code-review-fix .agents/features/command-model-format-fix/review-1.md`
