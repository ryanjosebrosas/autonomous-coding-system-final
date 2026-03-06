# Task 2: Fix Import Paths in Overlays and Hooks

## Task Metadata

- **ACTION**: UPDATE
- **TARGET**: Multiple files in `.opencode/agents/overlays/` and `.opencode/hooks/`
- **FEATURE**: type-safety-fixes
- **ESTIMATED TIME**: 10 minutes

## Problem

Incorrect relative import paths in subdirectories. Files in subdirectories use `./types` when they should use `../types` to reach parent directory types.

Files affected:
- `.opencode/agents/overlays/gemini-overlays.ts` (line 9)
- `.opencode/agents/overlays/index.ts` (line 18)
- `.opencode/hooks/agent-usage-reminder/hook.ts` (line 8)
- `.opencode/hooks/atlas/event-handler.ts` (line 7)
- `.opencode/hooks/category-skill-reminder/*.ts` (lines 5, 8, 9)
- `.opencode/plugin/hooks/create-hooks.ts` (lines 12, 25, 27)

## Solution

Correct import paths:
- `overlays/` subdirectory: `./types` → `../types`
- `hooks/*/` subdirectories: `./types` → `../../types` (for PluginInput)
- `plugin/hooks/` subdirectory: `../base` → `../../hooks/base`

## Implementation Steps

### Step 1: Fix agents/overlays imports

In `.opencode/agents/overlays/gemini-overlays.ts`:

```typescript
// Line 9 - CHANGE:
import type { AgentConfig } from "./types"
// TO:
import type { AgentConfig } from "../types"
```

In `.opencode/agents/overlays/index.ts`:

```typescript
// Line 18 - CHANGE:
import type { AgentConfig } from "./types"
// TO:
import type { AgentConfig } from "../types"
```

### Step 2: Fix hooks imports (PluginInput)

In `.opencode/hooks/agent-usage-reminder/hook.ts`:

```typescript
// Line 8 - CHANGE:
import type { PluginInput } from "./types"
// TO:
import type { PluginInput } from "../types"
```

In `.opencode/hooks/atlas/event-handler.ts`:

```typescript
// Line 7 - CHANGE:
import type { PluginInput } from "./types"
// TO:
import type { PluginInput } from "../types"
```

### Step 3: Fix category-skill-reminder imports (AvailableSkill)

In `.opencode/hooks/category-skill-reminder/formatter.ts`:

```typescript
// Line 5 - CHANGE:
import { AvailableSkill } from "../../agents/dynamic-prompt-builder"
// TO:
import type { AvailableSkill } from "../../agents/dynamic-prompt-builder"
```

In `.opencode/hooks/category-skill-reminder/hook.ts`:

```typescript
// Line 8 - CHANGE:
import { AvailableSkill } from "../../agents/dynamic-prompt-builder"
// TO:
import type { AvailableSkill } from "../../agents/dynamic-prompt-builder"
```

In `.opencode/hooks/category-skill-reminder/index.ts`:

```typescript
// Line 9 - CHANGE:
import { AvailableSkill } from "../../agents/dynamic-prompt-builder"
// TO:
import type { AvailableSkill } from "../../agents/dynamic-prompt-builder"
```

### Step 4: Fix plugin/hooks imports

In `.opencode/plugin/hooks/create-hooks.ts`:

```typescript
// Line 12 - CHANGE:
import { createHookRegistry } from '../index'
// TO:
import { createHookRegistry } from '../../hooks/index'

// Line 25 - CHANGE:
import type { HookDefinition } from '../base'
// TO:
import type { HookDefinition } from '../../hooks/base'

// Line 27 - CHANGE:
import { AvailableSkill } from "../../agents/dynamic-prompt-builder"
// TO:
import type { AvailableSkill } from "../../agents/dynamic-prompt-builder"
```

## Files to Modify

1. `.opencode/agents/overlays/gemini-overlays.ts` — Fix AgentConfig import path
2. `.opencode/agents/overlays/index.ts` — Fix AgentConfig import path
3. `.opencode/hooks/agent-usage-reminder/hook.ts` — Fix PluginInput import path
4. `.opencode/hooks/atlas/event-handler.ts` — Fix PluginInput import path
5. `.opencode/hooks/category-skill-reminder/formatter.ts` — Fix AvailableSkill import
6. `.opencode/hooks/category-skill-reminder/hook.ts` — Fix AvailableSkill import
7. `.opencode/hooks/category-skill-reminder/index.ts` — Fix AvailableSkill import
8. `.opencode/plugin/hooks/create-hooks.ts` — Fix all three import paths

## Pattern to Follow

```typescript
// Pattern: Relative imports from subdirectories

// At root level:
import { Something } from "./types"  // Correct

// One level deep (subdirectory/):
import { Something } from "../types"  // Correct (parent level)

// Two levels deep (subdirectory/subdirectory/):
import { Something } from "../../types"  // Correct (two levels up)
```

## Gotchas

- Count directory levels carefully: each `../` goes up one level
- Use `import type` for type-only imports (better tree-shaking)
- Verify the target file exists at the corrected path before committing

## Validation

```bash
npx tsc --noEmit .opencode/agents/overlays/*.ts .opencode/hooks/agent-usage-reminder/*.ts .opencode/hooks/atlas/*.ts .opencode/hooks/category-skill-reminder/*.ts .opencode/plugin/hooks/*.ts
```

Should show: Import path errors resolved for these files

## Success Criteria

- All import paths correctly reference parent directories
- No "Cannot find module" errors for these files
- TypeScript compiles without import path errors