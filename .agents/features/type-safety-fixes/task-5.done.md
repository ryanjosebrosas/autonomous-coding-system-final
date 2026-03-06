# Task 5: Add Test Framework Support (Bun + Vitest)

## Task Metadata

- **ACTION**: CREATE / UPDATE
- **TARGET**: `.opencode/package.json`, `.opencode/vitest.config.ts`
- **FEATURE**: type-safety-fixes
- **ESTIMATED TIME**: 10 minutes

## Problem

16 test files use `bun:test` module which has no TypeScript declarations. Tests can't compile:

```
error TS2307: Cannot find module 'bun:test' or its corresponding type declarations.
```

We need to support **both** test frameworks:
- `bun test` — for users with Bun installed
- `npx vitest run` — for Node.js users

## Solution

1. Add `@types/bun` to devDependencies for TypeScript compilation
2. Create `vitest.config.ts` for Vitest runner
3. Add test scripts to `package.json`

## Implementation Steps

### Step 1: Update package.json

In `.opencode/package.json`:

```json
{
  "name": "@opencode-ai/ai-coding-system",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "@opencode-ai/plugin": "latest"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/bun": "^1.1.0",
    "typescript": "^5.9.3",
    "vitest": "^3.0.0"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:bun": "bun test",
    "test:vitest": "vitest run"
  }
}
```

### Step 2: Create vitest.config.ts

Create `.opencode/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
```

### Step 3: Install dependencies

Run from `.opencode/` directory:

```bash
npm install
```

This installs:
- `@types/bun` — TypeScript declarations for Bun APIs including `bun:test`
- `vitest` — Node.js test runner

## Files to Modify

1. `.opencode/package.json` — Add @types/bun, vitest, and test scripts
2. `.opencode/vitest.config.ts` — Create vitest configuration

## Pattern to Follow

```typescript
// Pattern: Dual test framework support

// Tests use bun:test syntax:
import { describe, it, expect } from 'bun:test'

// Vitest can run these with globals: true in config
// Both frameworks support similar APIs

// For bun-specific APIs, you may need:
try {
  // Bun-specific test code
} catch {
  // Vitest fallback
}
```

## Gotchas

- `bun:test` and `vitest` have similar APIs but some differences
- Set `globals: true` in vitest.config.ts to use global `describe`, `it`, `expect`
- Some tests may use Bun-specific features that need polyfills for Vitest
- Install from `.opencode/` directory, not project root

## Validation

```bash
# From .opencode/ directory:
npm install
npx tsc --noEmit
npx vitest run --passWithNoTests
```

Should show: 0 module resolution errors for `bun:test`

## Success Criteria

- `@types/bun` installed and resolves `bun:test` imports
- `vitest.config.ts` created with proper settings
- `npm run test` executes without TypeScript errors
- Both `bun test` and `npx vitest run` work (if bun is installed)