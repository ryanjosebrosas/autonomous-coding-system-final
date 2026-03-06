# Task 1: Fix Core Type Exports

## Task Metadata

- **ACTION**: UPDATE / ADD
- **TARGET**: `.opencode/agents/types.ts`, `.opencode/agents/dynamic-prompt-builder.ts`, `.opencode/config/category-schema.ts` (may need creation)
- **FEATURE**: type-safety-fixes
- **ESTIMATED TIME**: 15 minutes

## Problem

Three types are referenced but not exported:
1. `AvailableSkill` - used by category-skill-reminder hooks
2. `PluginInput` - used by hooks (agent-usage-reminder, atlas, todo-continuation)
3. `CategoryDefinition` - used by load-categories.ts

This causes 12 TypeScript errors across multiple files.

## Solution

1. Define and export `AvailableSkill` in `dynamic-prompt-builder.ts`
2. Define and export `PluginInput` in a shared hooks types file
3. Create or update `category-schema.ts` to export `CategoryDefinition`

## Implementation Steps

### Step 1: Add AvailableSkill export

In `.opencode/agents/dynamic-prompt-builder.ts`, add after line 27:

```typescript
export interface AvailableSkill {
  name: string
  description: string
  compatibility: string
}
```

### Step 2: Create hooks types file if missing

Check if `.opencode/hooks/types.ts` exists. If not, create it:

```typescript
/**
 * Shared types for hooks
 */

export interface PluginInput {
  event: {
    type: string
    properties?: unknown
  }
  sessionID?: string
}
```

### Step 3: Export PluginInput from hooks/types.ts

Ensure the following exports exist in `.opencode/hooks/types.ts`:

```typescript
export interface PluginInput {
  event: {
    type: string
    properties?: unknown
  }
  sessionID?: string
}
```

### Step 4: Create category-schema.ts if needed

In `.opencode/config/category-schema.ts` (create if missing):

```typescript
/**
 * Category configuration schema
 */

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

export interface CategoriesConfig {
  categories: Record<string, CategoryDefinition>
}

export function validateCategoriesConfig(config: unknown): config is CategoriesConfig {
  // Implementation if needed
  return true
}
```

### Step 5: Import CategoryDefinition in load-categories.ts

In `.opencode/config/load-categories.ts`, add at the top:

```typescript
import { validateCategoriesConfig, type CategoriesConfig, type CategoryDefinition } from "./category-schema"
```

## Files to Modify

1. `.opencode/agents/dynamic-prompt-builder.ts` — Add AvailableSkill export
2. `.opencode/hooks/types.ts` — Create or update with PluginInput export
3. `.opencode/config/category-schema.ts` — Create with CategoryDefinition
4. `.opencode/config/load-categories.ts` — Import CategoryDefinition

## Pattern to Follow

```typescript
// Pattern: Define types where they're used, export for consumers

// In the file that uses the type most:
export interface MyType {
  field: string
}

// In a central types file (optional, for convenience):
export type { MyType } from './path/to/definition'
```

## Gotchas

- Don't duplicate type definitions - define once, re-export as needed
- Use `export type` for type-only exports to improve tree-shaking
- Check if files exist before creating new ones

## Validation

```bash
npx tsc --noEmit .opencode/agents/types.ts .opencode/agents/dynamic-prompt-builder.ts .opencode/config/load-categories.ts
```

Should show: 0 errors for these files (other errors remain for later tasks)

## Success Criteria

- `AvailableSkill` exported and accessible from `dynamic-prompt-builder.ts`
- `PluginInput` exported from `hooks/types.ts`
- `CategoryDefinition` exported from `config/category-schema.ts`
- TypeScript compiles these files without errors