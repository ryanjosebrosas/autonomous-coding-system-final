# Type Safety Fixes — Implementation Plan

## Feature Description

Fix all 46 TypeScript compilation errors to make the codebase production-ready, and add missing validation tooling (eslint, prettier, dual test runner support for bun and vitest).

## User Story

As a developer copying this framework to a new project, I want `npx tsc --noEmit` to pass cleanly so I can be confident the codebase is type-safe and ready for production use.

## Problem Statement

The codebase has 46 TypeScript compilation errors across 4 categories:
1. Missing type exports (`AvailableSkill`, `PluginInput`, `CategoryDefinition`)
2. Incorrect import paths (`./types` should be `../types` in overlays)
3. Readonly array assignments to mutable types
4. Test framework types not available (`bun:test`)

Additionally, L1 validation (lint/format) commands are not configured in `.claude/config.md`.

## Solution Statement

Fix errors in dependency order (types → imports → readonly → tests), then add eslint/prettier configs and dual test runner support. This ensures a clean `npx tsc --noEmit` pass and enables L1-L3 validation commands.

## Feature Metadata

- **Spec ID**: N/A (production readiness fix)
- **Depth**: standard
- **Pillar**: Infrastructure
- **Dependencies**: None
- **Estimated tasks**: 6

## Context References

### Codebase Files

- `.opencode/agents/types.ts:1-106` — Core agent types (needs export additions)
- `.opencode/agents/registry.ts:1-300` — Agent registry (readonly array fixes)
- `.opencode/agents/overlays/gemini-overlays.ts:1-253` — Gemini overlays (import path fix)
- `.opencode/agents/overlays/index.ts:1-42` — Overlay index (import path fix)
- `.opencode/agents/dynamic-prompt-builder.ts:1-379` — Prompt builder (needs AvailableSkill export)
- `.opencode/agents/resolve-agent.ts:1-220` — Agent resolution (type fixes)
- `.opencode/config/load-categories.ts:1-200` — Category loader (needs CategoryDefinition export)
- `.opencode/hooks/agent-usage-reminder/hook.ts:1-169` — Hook (needs PluginInput import path fix)
- `.opencode/hooks/atlas/event-handler.ts:7` — Event handler (needs PluginInput import fix)
- `.opencode/hooks/category-skill-reminder/*.ts` — Category hook (needs AvailableSkill import)
- `.opencode/hooks/todo-continuation/index.ts:59` — Todo continuation (type annotation fix)
- `.opencode/plugin/hooks/create-hooks.ts:12-27` — Plugin hooks (missing module imports)
- `.opencode/tests/integration/*.test.ts` — All integration tests (need bun:test types)
- `.opencode/agents/*.test.ts` — Agent tests (need bun:test types)

### Memory References

- No prior work on type safety in memory.md

### RAG References

- None (local codebase fix)

## Patterns to Follow

### Pattern 1: Type exports from types.ts

```typescript
// .opencode/agents/types.ts - already exports AgentPermissions, AgentConfig
// Pattern: Add exports at end of file

export type { 
  AgentPermissions,
  AgentConfig,
  AvailableSkill,  // ADD THIS
  // ... other types
} from "./types"
```

### Pattern 2: Import path correction

```typescript
// WRONG: import type { AgentConfig } from "./types"
// RIGHT: import type { AgentConfig } from "../types"

// Pattern: overlays/ subdirectory needs ../ to reach parent types.ts
```

### Pattern 3: Readonly array handling

```typescript
// WRONG: fallbackChain: FALLBACK_CHAINS.sisyphus  // readonly, assigned to string[]
// RIGHT: fallbackChain: [...FALLBACK_CHAINS.sisyphus]  // spread creates mutable copy

// OR: change interface to accept readonly
export interface AgentMetadata {
  // ...
  fallbackChain: readonly string[]  // accept readonly
}
```

### Pattern 4: Union type for type safety

```typescript
// Type guard pattern for union types
export function isHookName(value: string): value is HookName {
  return HOOK_NAMES.includes(value as HookName)
}

// Use in test:
if (!isHookName("hook1")) throw new Error("Invalid hook name")
const hook: HookName = "hook1" as HookName  // safe cast after guard
```

## Implementation Plan

### Phase 1: Core Type Exports

Fix the root cause — missing type exports that cascade into other files.

- **Task 1.1**: Export `AvailableSkill` from `agents/types.ts` and `dynamic-prompt-builder.ts`
- **Task 1.2**: Export `PluginInput` from hook type files
- **Task 1.3**: Export `CategoryDefinition` from config schema

### Phase 2: Import Path Corrections

Fix incorrect relative import paths in subdirectories.

- **Task 2.1**: Fix `./types` → `../types` in `agents/overlays/`
- **Task 2.2**: Fix `./types` → `../types` in `hooks/agent-usage-reminder/`
- **Task 2.3**: Fix `./types` → `../types` in `hooks/atlas/`
- **Task 2.4**: Fix missing module imports in `plugin/hooks/create-hooks.ts`

### Phase 3: Readonly Array Assignments

Fix type-safety for readonly arrays assigned to mutable types.

- **Task 3.1**: Change `fallbackChain` type to `readonly string[]` in `AgentMetadata`
- **Task 3.2**: Verify all `FALLBACK_CHAINS` assignments work with readonly
- **Task 3.3**: Fix any remaining readonly assignment errors

### Phase 4: Test Framework Support

Add type definitions for both bun and vitest test runners.

- **Task 4.1**: Add `@types/bun` to `devDependencies` in `.opencode/package.json`
- **Task 4.2**: Create `vitest.config.ts` for Node.js test runner alternative
- **Task 4.3**: Add test scripts to `package.json` for both runners

### Phase 5: Validation Tooling

Add L1 lint and format validation.

- **Task 5.1**: Create `eslint.config.mjs` (flat config for ESLint 9+)
- **Task 5.2**: Create `.prettierrc` for formatting
- **Task 5.3**: Add lint/format scripts to `package.json`
- **Task 5.4**: Update `.claude/config.md` with validation commands

### Phase 6: Verification

Confirm clean compilation.

- **Task 6.1**: Run `npx tsc --noEmit` and verify 0 errors
- **Task 6.2**: Run `npx eslint .` and verify no blocking errors
- **Task 6.3**: Run `npx prettier --check .` and verify formatting
- **Task 6.4**: Update config.md validation commands section

## Step-by-Step Tasks

### Task 1: Export Missing Core Types

- **ACTION**: UPDATE
- **TARGET**: `.opencode/agents/types.ts`
- **IMPLEMENT**: 
  Add missing type export `AvailableSkill` at end of file. The type is already defined in `dynamic-prompt-builder.ts` but needs to be re-exported from `types.ts` for convenience.
- **PATTERN**: Follow existing export pattern in types.ts
- **IMPORTS**: No new imports needed
- **GOTCHA**: Don't duplicate the type definition - export from where it's defined, then re-export
- **VALIDATE**: `npx tsc --noEmit .opencode/agents/types.ts`

### Task 2: Fix Import Paths in Overlays

- **ACTION**: UPDATE
- **TARGET**: `.opencode/agents/overlays/gemini-overlays.ts`
- **IMPLEMENT**: 
  Change line 9 from:
  ```typescript
  import type { AgentConfig } from "./types"
  ```
  to:
  ```typescript
  import type { AgentConfig } from "../types"
  ```
- **PATTERN**: Relative imports from subdirectories need `../` prefix
- **IMPORTS**: No change to imports, just path fix
- **GOTCHA**: overlays/ is a subdirectory of agents/, so need ../ to reach types.ts
- **VALIDATE**: `npx tsc --noEmit .opencode/agents/overlays/gemini-overlays.ts`

### Task 3: Fix Import Paths in Overlay Index

- **ACTION**: UPDATE
- **TARGET**: `.opencode/agents/overlays/index.ts`
- **IMPLEMENT**: 
  Change line 18 from:
  ```typescript
  import type { AgentConfig } from "./types"
  ```
  to:
  ```typescript
  import type { AgentConfig } from "../types"
  ```
- **PATTERN**: Same as Task 2 - subdirectory needs parent path
- **IMPORTS**: No change, just path fix
- **GOTCHA**: Same as Task 2
- **VALIDATE**: `npx tsc --noEmit .opencode/agents/overlays/index.ts`

### Task 4: Fix Missing applyGeminiOverlay Export

- **ACTION**: UPDATE
- **TARGET**: `.opencode/agents/overlays/index.ts`
- **IMPLEMENT**: 
  Add export for `applyGeminiOverlay` function that's referenced in line 32:
  ```typescript
  // Line 32 currently references applyGeminiOverlay but it's not in scope
  // The file imports from gemini-overlays but doesn't export applyGeminiOverlay
  
  // FIX: The import on line 10-11 already exports applyGeminiOverlay
  // But line 32 tries to use it. Need to either:
  // 1. Use applyGeminiOverlay directly after import, OR
  // 2. Add it to the re-export
  
  // Current line 10-11:
  export {
    applyGeminiOverlay,
    applyGPTOverlay,
  } from "./gemini-overlays"
  
  // Line 32 error: Cannot find name 'applyGeminiOverlay'
  // This is in the applyOverlayForModel function
  // The function is defined in this file (index.ts) and uses applyGeminiOverlay
  // But applyGeminiOverlay is also being re-exported
  // The issue is the function is trying to use a name that's also being exported
  
  // Root cause: Line 36 requires applyGeminiOverlay but it's being used locally
  // The export { applyGeminiOverlay } from "./gemini-overlays" exports it
  // But the local function applyOverlayForModel needs to reference it
  
  // FIX: Keep the export, but reference it correctly in the function
  ```
- **PATTERN**: Named exports in TypeScript don't shadow local references
- **IMPORTS**: Already imported via line 10-11
- **GOTCHA**: TypeScript allows same name for import and usage - the issue is that `./types` should be `../types` (fixed in Task 3)
- **VALIDATE**: `npx tsc --noEmit .opencode/agents/overlays/`

### Task 5: Fix Readonly Array Assignments

- **ACTION**: UPDATE
- **TARGET**: `.opencode/agents/registry.ts`
- **IMPLEMENT**: 
  Change `AgentMetadata.fallbackChain` type from `string[]` to `readonly string[]`:
  ```typescript
  // Line 24 definition
  export interface AgentMetadata {
    // ...
    fallbackChain: readonly string[]  // Change from string[]
  }
  
  // This allows FALLBACK_CHAINS.sisyphus (which is readonly) to be assigned directly
  // No need to spread [...FALLBACK_CHAINS.sisyphus] at usage sites
  ```
- **PATTERN**: Keep readonly arrays readonly through the type chain
- **IMPORTS**: No new imports
- **GOTCHA**: TypeScript 5.x infers `as const` arrays as readonly - receiver must also be readonly
- **VALIDATE**: `npx tsc --noEmit .opencode/agents/registry.ts`

### Task 6: Fix Type Errors in agent-usage-reminder Hook

- **ACTION**: UPDATE
- **TARGET**: `.opencode/hooks/agent-usage-reminder/hook.ts`
- **IMPLEMENT**: 
  Change line 8:
  ```typescript
  // WRONG: import type { PluginInput } from "./types"
  // RIGHT: import type { PluginInput } from "../../types"
  ```
  
  The hook types are in `hooks/types.ts`, not `hooks/agent-usage-reminder/types.ts`.
- **PATTERN**: Check where types.ts actually lives before importing
- **IMPORTS**: No change to import content, just path
- **GOTCHA**: Each hook subdirectory has its own types.ts for hook-specific types, but PluginInput is in the parent hooks/ directory
- **VALIDATE**: `npx tsc --noEmit .opencode/hooks/agent-usage-reminder/hook.ts`

### Task 7: Fix Type Errors in atlas Hook

- **ACTION**: UPDATE
- **TARGET**: `.opencode/hooks/atlas/event-handler.ts`
- **IMPLEMENT**: 
  Change line 7:
  ```typescript
  // WRONG: import type { PluginInput } from "./types"
  // RIGHT: import type { PluginInput } from "../../types"
  ```
- **PATTERN**: Same as Task 6
- **IMPORTS**: Path fix only
- **GOTCHA**: Same pattern as agent-usage-reminder
- **VALIDATE**: `npx tsc --noEmit .opencode/hooks/atlas/event-handler.ts`

### Task 8: Fix Type Errors in category-skill-reminder Hook

- **ACTION**: UPDATE
- **TARGET**: `.opencode/hooks/category-skill-reminder/formatter.ts`, `hook.ts`, `index.ts`
- **IMPLEMENT**: 
  Change import for AvailableSkill:
  ```typescript
  // WRONG: import { AvailableSkill } from "../../agents/dynamic-prompt-builder"
  // RIGHT: import { AvailableSkill } from "../../agents/dynamic-prompt-builder"
  
  // Actually, the path is correct BUT AvailableSkill is not exported
  // Need to add export in dynamic-prompt-builder.ts:
  
  // In dynamic-prompt-builder.ts, add to exports:
  export interface AvailableSkill {
    name: string
    description: string
    compatibility: string
  }
  ```
- **PATTERN**: Define types near their usage, export for consumers
- **IMPORTS**: Add AvailableSkill interface definition to dynamic-prompt-builder.ts
- **GOTCHA**: The import path is correct, but the type doesn't exist yet - need to define it
- **VALIDATE**: `npx tsc --noEmit .opencode/hooks/category-skill-reminder/`

### Task 9: Fix Type Errors in todo-continuation Hook

- **ACTION**: UPDATE
- **TARGET**: `.opencode/hooks/todo-continuation/index.ts`
- **IMPLEMENT**: 
  Fix line 59 type annotation:
  ```typescript
  // Line 59: Type 'unknown' is not assignable to type 'PluginInput'
  
  // The input parameter is typed as 'unknown' but used as PluginInput
  // Need to add type guard or assert after validation
  
  // Option 1: Type assertion (if confident)
  const input = event as PluginInput
  
  // Option 2: Type guard (safer)
  function isPluginInput(value: unknown): value is PluginInput {
    return typeof value === 'object' && value !== null && 'event' in value
  }
  if (!isPluginInput(event)) return
  ```
- **PATTERN**: Use type guards for runtime validation before assertions
- **IMPORTS**: No new imports
- **GOTCHA**: `unknown` is safer than `any` - must validate before use
- **VALIDATE**: `npx tsc --noEmit .opencode/hooks/todo-continuation/index.ts`

### Task 10: Fix Type Errors in plugin/hooks/create-hooks

- **ACTION**: UPDATE
- **TARGET**: `.opencode/plugin/hooks/create-hooks.ts`
- **IMPLEMENT**: 
  Fix missing module imports on lines 12 and 25-27:
  ```typescript
  // Lines 12, 25, 27: Cannot find module '../base' or '../index'
  
  // Looking at directory structure:
  // .opencode/plugin/hooks/create-hooks.ts
  // Needs to import from:
  // - .opencode/hooks/base.ts (for HookDefinition)
  // - .opencode/hooks/index.ts (for hook registration)
  
  // Current imports:
  import { createHookRegistry } from '../index'
  import type { HookDefinition } from '../base'
  
  // Should be:
  import { createHookRegistry } from '../../hooks/index'
  import type { HookDefinition } from '../../hooks/base'
  import { AvailableSkill } from '../../agents/dynamic-prompt-builder'
  ```
- **PATTERN**: plugin/hooks is two levels deep, needs ../../hooks/
- **IMPORTS**: Fix all three import paths
- **GOTCHA**: plugin/hooks/ is nested deeper than expected
- **VALIDATE**: `npx tsc --noEmit .opencode/plugin/hooks/create-hooks.ts`

### Task 11: Add CategoryDefinition Export

- **ACTION**: UPDATE
- **TARGET**: `.opencode/config/load-categories.ts`
- **IMPLEMENT**: 
  Fix line 190 error - `Cannot find name 'CategoryDefinition'`:
  ```typescript
  // Line 190 references CategoryDefinition but it's not imported
  // It should be defined in category-schema.ts
  
  // Need to check category-schema.ts and ensure export:
  export interface CategoryDefinition {
    model: string
    provider: string
    temperature: number
    description: string
    useWhen: string[]
    avoidWhen: string[]
    promptAppend: string
    reasoning: 'low' | 'medium' | 'high' | 'xhigh'
    creativity: 'low' | 'medium' | 'high'
  }
  
  // Then import in load-categories.ts:
  import { CategoryDefinition } from './category-schema'
  ```
- **PATTERN**: Define types in schema files, import where needed
- **IMPORTS**: Add CategoryDefinition import from ./category-schema
- **GOTCHA**: May need to create category-schema.ts if it doesn't exist
- **VALIDATE**: `npx tsc --noEmit .opencode/config/load-categories.ts`

### Task 12: Add Bun Test Types

- **ACTION**: CREATE
- **TARGET**: `.opencode/package.json`
- **IMPLEMENT**: 
  Add @types/bun to devDependencies:
  ```json
  {
    "dependencies": {
      "@opencode-ai/plugin": "latest"
    },
    "devDependencies": {
      "@types/node": "^20.0.0",
      "@types/bun": "^1.1.0",
      "typescript": "^5.9.3"
    }
  }
  ```
  
  This provides type definitions for `bun:test` imports.
- **PATTERN**: Follow existing devDependencies pattern
- **IMPORTS**: Run `npm install` after update
- **GOTCHA**: Must use `@types/bun` not `bun-types` for proper TypeScript integration
- **VALIDATE**: `npx tsc --noEmit .opencode/tests/integration/*.test.ts`

### Task 13: Add Vitest Config

- **ACTION**: CREATE
- **TARGET**: `.opencode/vitest.config.ts`
- **IMPLEMENT**: 
  Create vitest config for Node.js test runner alternative:
  ```typescript
  import { defineConfig } from 'vitest/config'
  
  export default defineConfig({
    test: {
      include: ['**/*.test.ts'],
      exclude: ['node_modules'],
      globals: true,
      environment: 'node',
    },
  })
  ```
- **PATTERN**: Standard vitest config for TypeScript projects
- **IMPORTS**: Need to install vitest: `npm install -D vitest`
- **GOTCHA**: Tests using bun:test APIs need adjustment for vitest or dual support
- **VALIDATE**: `npx vitest run --passWithNoTests`

### Task 14: Add ESLint Config

- **ACTION**: CREATE
- **TARGET**: `.opencode/eslint.config.mjs`
- **IMPLEMENT**: 
  Create flat config for ESLint 9+:
  ```javascript
  import typescript from '@typescript-eslint/eslint-plugin'
  import typescriptParser from '@typescript-eslint/parser'
  
  export default [
    {
      files: ['**/*.ts'],
      languageOptions: {
        parser: typescriptParser,
        parserOptions: {
          project: './tsconfig.json',
        },
      },
      plugins: {
        '@typescript-eslint': typescript,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/explicit-function-return-type': 'off',
      },
    },
  ]
  ```
- **PATTERN**: ESLint 9+ flat config format
- **IMPORTS**: Install: `npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser`
- **GOTCHA**: Must use .mjs extension for ESM format
- **VALIDATE**: `npx eslint .opencode/`

### Task 15: Add Prettier Config

- **ACTION**: CREATE
- **TARGET**: `.opencode/.prettierrc`
- **IMPLEMENT**: 
  Create prettier config:
  ```json
  {
    "semi": false,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5",
    "printWidth": 100,
    "arrowParens": "avoid"
  }
  ```
- **PATTERN**: Standard TypeScript prettier config
- **IMPORTS**: Install: `npm install -D prettier`
- **GOTCHA**: Match existing code style - check existing files for formatting
- **VALIDATE**: `npx prettier --check .opencode/**/*.ts`

### Task 16: Update package.json Scripts

- **ACTION**: UPDATE
- **TARGET**: `.opencode/package.json`
- **IMPLEMENT**: 
  Add validation scripts:
  ```json
  {
    "scripts": {
      "typecheck": "tsc --noEmit",
      "lint": "eslint .",
      "lint:fix": "eslint . --fix",
      "format": "prettier --write .",
      "format:check": "prettier --check .",
      "test:bun": "bun test",
      "test:vitest": "vitest run",
      "test": "vitest run",
      "validate": "npm run typecheck && npm run lint && npm run test"
    }
  }
  ```
- **PATTERN**: Standard npm scripts for validation pipeline
- **IMPORTS**: No imports needed
- **GOTCHA**: Use vitest as default test runner for Node.js compatibility
- **VALIDATE**: `npm run validate`

### Task 17: Update config.md with Validation Commands

- **ACTION**: UPDATE
- **TARGET**: `.claude/config.md`
- **IMPLEMENT**: 
  Update validation commands section:
  ```markdown
  ## Validation Commands
  
  - **L1 Lint**: npx eslint .opencode/
  - **L1 Format**: npx prettier --check .opencode/
  - **L2 Types**: npx tsc --noEmit
  - **L3 Unit Tests**: npx vitest run
  - **L4 Integration Tests**: npx vitest run .opencode/tests/integration/
  - **L5 Manual**: Code review via /code-loop
  ```
- **PATTERN**: Match existing config.md format
- **IMPORTS**: No imports
- **GOTCHA**: Update all validation tiers in one pass
- **VALIDATE**: File readability, format matches existing

## Testing Strategy

### Unit Tests

- `.opencode/agents/agents.test.ts`: Tests agent registry functionality
- `.opencode/tools/delegate-task/*.test.ts`: Tests category routing
- All tests should compile and run after type fixes

### Integration Tests

- `.opencode/tests/integration/agent-resolution.test.ts`: Agent resolution logic
- `.opencode/tests/integration/category-routing.test.ts`: Category dispatch
- `.opencode/tests/integration/hooks/*.test.ts`: Hook system tests

### Edge Cases

- Multiple test frameworks (bun and vitest) should both work
- ESLint should not block on type-only files
- Prettier should not change existing style drastically
- Import path fixes should not break runtime resolution

## Validation Commands

```bash
# L1: Lint
npx eslint .opencode/

# L1: Format
npx prettier --check .opencode/

# L2: Types
npx tsc --noEmit

# L3: Unit Tests (vitest)
npx vitest run

# L3: Unit Tests (bun alternative)
bun test

# L4: Integration Tests
npx vitest run .opencode/tests/integration/

# L5: Manual
# Code review via /code-loop
```

## Acceptance Criteria

### Implementation

- [ ] All 46 TypeScript compilation errors fixed
- [ ] `npx tsc --noEmit` returns exit code 0
- [ ] ESLint config created and runs without fatal errors
- [ ] Prettier config created and formats consistently
- [ ] Both bun and vitest can run tests
- [ ] Validation commands in config.md updated

### Runtime

- [ ] `npm run typecheck` passes clean
- [ ] `npm run lint` reports no errors
- [ ] `npm run format:check` reports consistent formatting
- [ ] `npm run test` executes without TypeScript errors
- [ ] `.claude/config.md` L1-L5 commands are correct

## Completion Checklist

- [ ] All 17 tasks implemented
- [ ] All tests passing (both bun and vitest)
- [ ] All validation commands pass
- [ ] No new lint/type errors introduced
- [ ] Code follows project patterns
- [ ] config.md updated with validation commands

## Notes

### Key Decisions

1. **Dual test runner support**: Support both `bun test` and `npx vitest run` for flexibility
2. **ESLint 9+ flat config**: Use modern eslint.config.mjs format
3. **Readonly array fix**: Change interface to accept readonly rather than spreading at usage sites
4. **Type exports centralized**: Define types where used, export from types.ts, re-export for consumers

### Risks

1. **Test framework incompatibility**: Some tests may use bun-specific APIs - need vitest equivalents
2. **Breaking change**: Changing `FallbackChain` type could affect external consumers - but this is internal
3. **Prettier conflicts**: Existing code may have inconsistent formatting - use `--write` to fix first

### Confidence

**8/10** for one-pass success. The fixes are straightforward (import paths, type exports, readonly arrays). The main risk is test framework compatibility - some bun-specific APIs may need vitest equivalents.

## Task Briefs

This plan will be executed with the following task brief structure:

| Task | Brief | Files | Status |
|------|-------|-------|--------|
| 1 | Export core types | `agents/types.ts`, `agents/dynamic-prompt-builder.ts`, `config/category-schema.ts` | `task-1.md` ✓ |
| 2 | Fix import paths | `agents/overlays/*`, `hooks/*/hook.ts`, `plugin/hooks/create-hooks.ts` | `task-2.md` ✓ |
| 3 | Fix readonly arrays | `agents/registry.ts` | `task-3.md` ✓ |
| 4 | Fix type annotations | `agents/resolve-agent.ts`, `hooks/todo-continuation/index.ts` | `task-4.md` ✓ |
| 5 | Add test frameworks | `package.json`, `vitest.config.ts` | `task-5.md` ✓ |
| 6 | Add validation tooling | `eslint.config.mjs`, `.prettierrc`, `package.json` | `task-6.md` ✓ |
| 7 | Update config.md | `.claude/config.md` | `task-7.md` ✓ |