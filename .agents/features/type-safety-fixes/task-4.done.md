# Task 4: Fix Type Annotations and Resolve Agent Errors

## Task Metadata

- **ACTION**: UPDATE
- **TARGET**: `.opencode/agents/resolve-agent.ts`, `.opencode/hooks/todo-continuation/index.ts`
- **FEATURE**: type-safety-fixes
- **ESTIMATED TIME**: 15 minutes

## Problem

Two type errors:

1. **resolve-agent.ts:150** — `No overload matches this call` for `filter()` predicate
2. **todo-continuation/index.ts:59** — `Type 'unknown' is not assignable to type 'PluginInput'`

These require type guards or correct type annotations.

## Solution

1. Fix `resolve-agent.ts` filter predicate to match `AgentMetadata[]` type
2. Add type guard for `PluginInput` in `todo-continuation/index.ts`

## Implementation Steps

### Step 1: Fix resolve-agent.ts filter predicate

In `.opencode/agents/resolve-agent.ts` at line 150:

```typescript
// Current (ERROR):
export function getAgentsForTask(taskType: string): AgentMetadata[] {
  const taskAgentMap: Record<string, AgentName[]> = {
    "architecture": ["oracle", "metis"],
    "planning": ["prometheus", "momus"],
    // ...
  }
  
  const agentNames = taskAgentMap[taskType] || []
  return agentNames.map(name => AGENT_REGISTRY[name]).filter(Boolean)
  // Error: filter(Boolean) doesn't narrow type properly
}

// FIX - Use proper type guard:
export function getAgentsForTask(taskType: string): AgentMetadata[] {
  const taskAgentMap: Record<string, AgentName[]> = {
    "architecture": ["oracle", "metis"],
    "planning": ["prometheus", "momus"],
    "code-review": ["momus"],
    "research": ["librarian", "explore"],
    "execution": ["hephaestus", "sisyphus-junior"],
    "debug": ["oracle"],
    "writing": ["sisyphus"],
    "visual": ["sisyphus-junior"],
  }
  
  const agentNames = taskAgentMap[taskType] || []
  return agentNames
    .map(name => AGENT_REGISTRY[name])
    .filter((agent): agent is AgentMetadata => agent !== null && agent !== undefined)
}
```

### Step 2: Fix todo-continuation type annotation

In `.opencode/hooks/todo-continuation/index.ts` at line 59:

```typescript
// Current (ERROR):
const handler = createTodoContinuationHandler({
  ctx,
  sessionStateStore,
  backgroundManager,
  skipAgents,
  isContinuationStopped,
})

// The ctx parameter is typed as unknown but used as PluginInput

// FIX - Add proper type annotation:
import type { PluginInput } from "../types"

// Then use type assertion with validation:
function isPluginInput(ctx: unknown): ctx is PluginInput {
  return typeof ctx === 'object' && ctx !== null && 'event' in ctx
}

export function createTodoContinuationEnforcer(
  ctx: unknown,  // Keep as unknown for safety
  options: TodoContinuationEnforcerOptions = {}
): TodoContinuationEnforcer {
  // Validate before use
  if (!isPluginInput(ctx)) {
    throw new Error('Invalid plugin context')
  }
  
  const {
    backgroundManager,
    skipAgents = DEFAULT_SKIP_AGENTS,
    isContinuationStopped,
  } = options
  
  // ... rest of implementation
}
```

Actually, looking at the error more carefully, the issue is that line 59 assigns `unknown` to `PluginInput`. Let me check the actual context:

```typescript
// The function signature:
export function createTodoContinuationEnforcer(
  ctx: unknown,  // This is the issue
  options: TodoContinuationEnforcerOptions = {}
): TodoContinuationEnforcer

// The handler expects PluginInput, but ctx is unknown
```

The fix is to add a type assertion after validation, OR change the function to accept a more specific type.

## Files to Modify

1. `.opencode/agents/resolve-agent.ts` — Fix filter predicate type guard
2. `.opencode/hooks/todo-continuation/index.ts` — Add PluginInput type guard

## Pattern to Follow

```typescript
// Pattern: Type guards for runtime validation

function isSomething(value: unknown): value is Something {
  return typeof value === 'object' 
    && value !== null 
    && 'requiredField' in value
}

// Usage:
if (!isSomething(maybeSomething)) {
  throw new Error('Invalid input')
}
// Now TypeScript knows maybeSomething is Something
const valid: Something = maybeSomething
```

## Gotchas

- `filter(Boolean)` doesn't narrow types in TypeScript - use proper type guards
- `unknown` is safer than `any` but requires validation before use
- Type predicates (`value is Type`) tell TypeScript the type after the function returns true

## Validation

```bash
npx tsc --noEmit .opencode/agents/resolve-agent.ts .opencode/hooks/todo-continuation/index.ts
```

Should show: 0 errors for these files

## Success Criteria

- `getAgentsForTask` returns `AgentMetadata[]` with proper type guard
- `createTodoContinuationEnforcer` validates `ctx` before use
- TypeScript compiles without overload or assignment errors