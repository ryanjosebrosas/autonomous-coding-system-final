# Task 3: Fix Readonly Array Assignments

## Task Metadata

- **ACTION**: UPDATE
- **TARGET**: `.opencode/agents/registry.ts`
- **FEATURE**: type-safety-fixes
- **ESTIMATED TIME**: 5 minutes

## Problem

8 TypeScript errors in `registry.ts` from assigning `readonly` arrays to mutable `string[]`:

```
error TS4104: The type 'readonly ["kimi-k2.5", "glm-5", "big-pickle"]' is 'readonly' 
and cannot be assigned to the mutable type 'string[]'.
```

Root cause: `FALLBACK_CHAINS` is defined with `as const`, making all arrays readonly. But `AgentMetadata.fallbackChain` is typed as `string[]` (mutable).

## Solution

Change `fallbackChain` type in `AgentMetadata` interface from `string[]` to `readonly string[]`.

## Implementation Steps

### Step 1: Update AgentMetadata interface

In `.opencode/agents/registry.ts`, find the interface definition (around line 15-26):

```typescript
export interface AgentMetadata {
  name: string
  displayName: string
  description: string
  category: string
  model: string
  temperature: number
  mode: AgentMode
  permissions: AgentPermissions
  fallbackChain: string[]  // CHANGE THIS LINE
  deniedTools: string[]
}
```

Change `fallbackChain: string[]` to:

```typescript
  fallbackChain: readonly string[]
```

### Step 2: Update AgentPermissions if needed

The `deniedTools` field is also a string array. Check if it needs readonly:

```typescript
// Current:
deniedTools: string[]

// Check if this also causes errors. If agents assign readonly arrays to it, change to:
deniedTools: readonly string[]
```

Actually, looking at the code, `deniedTools` is assigned mutable arrays (line 116: `deniedTools: []`), so it should stay `string[]`.

### Step 3: Verify fallback chain assignments

After the type change, verify all fallback chain assignments work:

```typescript
// Line 115 - This should now compile:
fallbackChain: FALLBACK_CHAINS.sisyphus,  // readonly array assigned to readonly string[]
```

## Files to Modify

1. `.opencode/agents/registry.ts` — Change `fallbackChain: string[]` to `fallbackChain: readonly string[]`

## Pattern to Follow

```typescript
// Pattern: Use readonly for arrays that shouldn't be modified

// When defining constant arrays:
export const MY_ARRAY = ['a', 'b', 'c'] as const  // readonly

// In interfaces that consume them:
export interface MyConfig {
  items: readonly string[]  // Accept readonly
}

// Alternative: Spread to create mutable copy if needed:
export interface MyConfig {
  items: string[]  // Mutable
}
// Usage:
const config: MyConfig = {
  items: [...MY_ARRAY]  // Spread creates mutable copy
}
```

## Gotchas

- `as const` makes arrays readonly - preserve this intent in consuming types
- If a function needs to mutate the array, spread it first: `[...readonlyArray]`
- `readonly string[]` is a supertype of `string[]` - can assign mutable to readonly, but not vice versa

## Validation

```bash
npx tsc --noEmit .opencode/agents/registry.ts
```

Should show: 0 errors (the 8 `TS4104` errors resolved)

## Success Criteria

- `fallbackChain` accepts readonly arrays
- All `FALLBACK_CHAINS.something` assignments compile
- TypeScript compiles registry.ts without readonly errors