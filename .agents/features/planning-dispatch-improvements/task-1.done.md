# Task 1 of 4: Wire NO_TIMEOUT_TASK_TYPES Through dispatch.ts

> **Feature**: `planning-dispatch-improvements`
> **Brief Path**: `.agents/features/planning-dispatch-improvements/task-1.md`
> **Plan Overview**: `.agents/features/planning-dispatch-improvements/plan.md`

---

## OBJECTIVE

Wire the existing `NO_TIMEOUT_TASK_TYPES` set and `AGENT_SESSION_NO_TIMEOUT` constant through `execute()` and `dispatchCascade()` so that planning and execution agent sessions run without a timeout.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/tools/dispatch.ts` | UPDATE | Timeout selection in `execute()`, `dispatchCascade()` signature and body, cascade call site in `execute()` |

**Out of Scope:**
- `dispatchAgent()` — already updated to handle `timeoutMs === 0` (skip `AbortSignal`)
- `dispatchText()` — text mode always has a timeout (short requests)
- `dispatchCommand()` — command mode has its own timeout logic
- `build.md` timeout removal — handled in Task 2
- `planning.md` changes — handled in Tasks 2 and 4
- `plan-writer.md` creation — handled in Task 3

**Dependencies:**
- None — this is the first task

---

## PRIOR TASK CONTEXT

This is the first task — no prior work. Start fresh from the codebase state.

Note: `dispatch.ts` has two partial edits already applied from a prior session:
1. Lines 11-18: `AGENT_SESSION_NO_TIMEOUT` and `NO_TIMEOUT_TASK_TYPES` constants added
2. Lines 264-307: `dispatchAgent()` updated to conditionally skip `AbortSignal.timeout`

These are the foundation. This task wires them through the upstream callers.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/tools/dispatch.ts` (lines 1-22) — Why: Configuration constants including the already-added `NO_TIMEOUT_TASK_TYPES` and `AGENT_SESSION_NO_TIMEOUT`
- `.opencode/tools/dispatch.ts` (lines 264-307) — Why: `dispatchAgent()` already handles `timeoutMs === 0`
- `.opencode/tools/dispatch.ts` (lines 374-420) — Why: `dispatchCascade()` needs `taskType` parameter and no-timeout logic
- `.opencode/tools/dispatch.ts` (lines 591-599) — Why: `execute()` timeout selection needs `NO_TIMEOUT_TASK_TYPES` override
- `.opencode/tools/dispatch.ts` (lines 656-665) — Why: `execute()` cascade call site needs to pass `taskType`
- `.opencode/tools/dispatch.ts` (lines 667-714) — Why: Direct agent call and fallback paths — these automatically get the fixed timeout from `execute()` level

### Current Content: Configuration Block (Lines 1-22)

```typescript
import { tool } from "@opencode-ai/plugin"

// ============================================================================
// CONFIGURATION
// ============================================================================

const OPENCODE_URL = "http://127.0.0.1:4096"
const TEXT_TIMEOUT_MS = 120_000      // 2 min — text mode (reviews, analysis)
const AGENT_TIMEOUT_MS = 300_000     // 5 min — agent mode (default)
const AGENT_LONG_TIMEOUT_MS = 900_000 // 15 min — agent mode (complex tasks)
const AGENT_SESSION_NO_TIMEOUT = 0   // No timeout — planning/execution sessions run until done
const CASCADE_TIMEOUT_MS = 30_000    // 30 sec — per cascade attempt (text mode)
const COMMAND_TIMEOUT_MS = 600_000   // 10 min — command mode (full command execution)

// Task types that are long-running sessions where timeout is not applicable.
// These sessions involve extensive codebase exploration, multi-file writes,
// and interactive tool use that can take 20-60+ minutes.
const NO_TIMEOUT_TASK_TYPES = new Set(["planning", "execution"])
const HEALTH_TIMEOUT_MS = 5_000
const ARCHIVE_AFTER_DAYS = 3
const ARCHIVE_AFTER_MS = ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000
const MAX_ARCHIVE_PER_RUN = 10
```

**Analysis**: `AGENT_SESSION_NO_TIMEOUT = 0` and `NO_TIMEOUT_TASK_TYPES` are already defined. The set contains `"planning"` and `"execution"` — the two task types that map to long-running agent sessions. These constants are used by the changes in this task.

### Current Content: dispatchAgent() (Lines 264-307)

```typescript
async function dispatchAgent(
  sessionId: string,
  provider: string,
  model: string,
  prompt: string,
  description: string,
  timeoutMs: number,
): Promise<string | null> {
  try {
    // timeoutMs === 0 means no timeout — session runs until completion.
    // Used for planning/execution sessions that can take 20-60+ minutes.
    const fetchOptions: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: { providerID: provider, modelID: model }, // top-level model routes the message
        parts: [{
          type: "subtask",
          prompt,
          description,
          agent: "general",
          model: { providerID: provider, modelID: model }, // subtask part model (for child agent)
        }],
      }),
    }
    if (timeoutMs > 0) {
      fetchOptions.signal = AbortSignal.timeout(timeoutMs)
    }
    const response = await fetch(`${OPENCODE_URL}/session/${sessionId}/message`, fetchOptions)
    if (!response.ok) return null
    const data = await response.json()
    // Try extracting text directly from response parts
    const text = extractTextFromParts(data)
    if (text) return text
    // If response contains subtask parts, the result is in the child session
    const subtaskParts = data?.parts?.filter((p: any) => p.type === "subtask") || []
    if (subtaskParts.length > 0 && subtaskParts[0].sessionID) {
      return await getSessionLastResponse(subtaskParts[0].sessionID)
    }
    return null
  } catch {
    return null
  }
}
```

**Analysis**: Already handles `timeoutMs === 0` by conditionally skipping `AbortSignal.timeout`. When `timeoutMs > 0`, the signal is set. When `timeoutMs === 0`, no signal is set — the fetch waits indefinitely. This is the foundation that the upstream changes rely on.

### Current Content: dispatchCascade() (Lines 374-420)

```typescript
async function dispatchCascade(
  sessionId: string,
  cascade: CascadeRoute,
  prompt: string,
  mode: DispatchMode,
  description: string,
  command?: string,
  commandArgs?: string,
): Promise<DispatchResult | null> {
  for (let i = 0; i < cascade.models.length; i++) {
    const route = cascade.models[i]
    const start = Date.now()
    let text: string | null = null

    if (mode === "command" && command) {
      text = await dispatchCommand(
        sessionId, route.provider, route.model,
        command, commandArgs || "", COMMAND_TIMEOUT_MS,
      )
    } else if (mode === "agent") {
      text = await dispatchAgent(
        sessionId, route.provider, route.model,
        prompt, description, AGENT_LONG_TIMEOUT_MS,
      )
    } else {
      text = await dispatchText(
        sessionId, route.provider, route.model,
        prompt, CASCADE_TIMEOUT_MS,
      )
    }

    const latencyMs = Date.now() - start

    if (text) {
      return {
        text,
        provider: route.provider,
        model: route.model,
        label: route.label,
        mode,
        latencyMs,
        sessionId,
        cascadeAttempts: i + 1,
      }
    }
    // Model failed — try next in cascade
  }
  return null
}
```

**Analysis**: The critical issue is on line 396: `AGENT_LONG_TIMEOUT_MS` is hardcoded (15 min). For planning sessions that use the T0 cascade route, this needs to be `AGENT_SESSION_NO_TIMEOUT` (0). The function needs a `taskType` parameter to make this decision. The cascade is the PRIMARY path for `taskType: "planning"` since the TASK_ROUTES table maps `"planning"` to a cascade route (lines 98-106).

### Current Content: execute() Timeout Selection (Lines 591-599)

```typescript
  async execute(args, context) {
    const mode: DispatchMode = (args.mode as DispatchMode) || "text"
    const taskDescription = args.description || args.taskType || "Dispatch task"

    // Default timeouts by mode
    const defaultTimeout = mode === "command" ? COMMAND_TIMEOUT_MS
      : mode === "agent" ? AGENT_TIMEOUT_MS
      : TEXT_TIMEOUT_MS
    const timeoutMs = args.timeout || defaultTimeout
```

**Analysis**: Timeout is selected by mode only, ignoring `taskType`. For agent mode, always uses `AGENT_TIMEOUT_MS` (5 min). The fix adds a check: after computing `defaultTimeout`, if `args.taskType` is in `NO_TIMEOUT_TASK_TYPES` and mode is `"agent"`, override to `AGENT_SESSION_NO_TIMEOUT`. The `args.timeout` override still takes precedence (if caller explicitly sets a timeout, respect it).

### Current Content: execute() Cascade Call (Lines 656-665)

```typescript
    if (isCascade) {
      result = await dispatchCascade(
        sessionId,
        resolved.route as CascadeRoute,
        args.prompt,
        mode,
        taskDescription,
        args.command,
        args.prompt, // For command mode, prompt = command arguments
      )
```

**Analysis**: Does not pass `taskType` to `dispatchCascade()`. After adding the `taskType` parameter to `dispatchCascade()`, this call site needs to pass `args.taskType`.

### Current Content: execute() Direct Agent Calls (Lines 675-678 and 705-708)

Primary path:
```typescript
      } else if (mode === "agent") {
        text = await dispatchAgent(
          sessionId, route.provider, route.model,
          args.prompt, taskDescription, timeoutMs,
        )
```

Fallback path:
```typescript
        } else if (mode === "agent") {
          fallbackText = await dispatchAgent(
            sessionId, FALLBACK_ROUTE.provider, FALLBACK_ROUTE.model,
            args.prompt, taskDescription, timeoutMs,
          )
```

**Analysis**: Both use `timeoutMs` from the execute-level selection. Once Step 1 fixes the timeout selection to use `AGENT_SESSION_NO_TIMEOUT` for planning/execution taskTypes, these automatically get `0` — no changes needed here.

### Patterns to Follow

**Conditional timeout pattern** (from `dispatchAgent()` lines 289-291):

```typescript
    if (timeoutMs > 0) {
      fetchOptions.signal = AbortSignal.timeout(timeoutMs)
    }
```

- Why this pattern: Already established in the codebase. `timeoutMs === 0` means "no timeout". All timeout consumers should follow the same convention.
- How to apply: `dispatchCascade()` selects the correct timeout value based on `taskType`, then passes it to `dispatchAgent()` which already handles the `0` case.
- Common gotchas: Don't use `!timeoutMs` for the check — use `timeoutMs > 0`. Zero is falsy in JS but is a deliberate value here, not "missing."

**Task type routing pattern** (from TASK_ROUTES lines 98-106):

```typescript
  // ── T0: Planning (Cascade: FREE → PAID) ──
  "planning": {
    type: "cascade",
    models: [
      { provider: "ollama-cloud", model: "kimi-k2-thinking", label: "KIMI-K2-THINKING" },
      { provider: "ollama-cloud", model: "cogito-2.1:671b", label: "COGITO-2.1" },
      { provider: "bailian-coding-plan-test", model: "qwen3-max-2026-01-23", label: "QWEN3-MAX" },
      { provider: "anthropic", model: "claude-opus-4-5", label: "CLAUDE-OPUS-4-5" },
    ],
  },
```

- Why this pattern: Shows that `taskType: "planning"` routes to a cascade. The cascade is the primary path where `AGENT_LONG_TIMEOUT_MS` was hardcoded and needs to be replaced with `AGENT_SESSION_NO_TIMEOUT`.
- How to apply: The `dispatchCascade()` function receives the `taskType` and uses it to decide the timeout.

---

## STEP-BY-STEP TASKS

---

### Step 1: UPDATE `execute()` Timeout Selection

**What**: Override the default agent timeout to `AGENT_SESSION_NO_TIMEOUT` when `taskType` is in `NO_TIMEOUT_TASK_TYPES`.

**IMPLEMENT**:

Current (lines 591-599 of `.opencode/tools/dispatch.ts`):
```typescript
  async execute(args, context) {
    const mode: DispatchMode = (args.mode as DispatchMode) || "text"
    const taskDescription = args.description || args.taskType || "Dispatch task"

    // Default timeouts by mode
    const defaultTimeout = mode === "command" ? COMMAND_TIMEOUT_MS
      : mode === "agent" ? AGENT_TIMEOUT_MS
      : TEXT_TIMEOUT_MS
    const timeoutMs = args.timeout || defaultTimeout
```

Replace with:
```typescript
  async execute(args, context) {
    const mode: DispatchMode = (args.mode as DispatchMode) || "text"
    const taskDescription = args.description || args.taskType || "Dispatch task"

    // Default timeouts by mode, with no-timeout override for long-running sessions
    let defaultTimeout = mode === "command" ? COMMAND_TIMEOUT_MS
      : mode === "agent" ? AGENT_TIMEOUT_MS
      : TEXT_TIMEOUT_MS

    // Planning and execution sessions are long-running (20-60+ min).
    // Override to no-timeout so AbortSignal doesn't kill them.
    if (mode === "agent" && args.taskType && NO_TIMEOUT_TASK_TYPES.has(args.taskType)) {
      defaultTimeout = AGENT_SESSION_NO_TIMEOUT
    }

    const timeoutMs = args.timeout ?? defaultTimeout
```

**PATTERN**: `dispatchAgent()` lines 289-291 — conditional timeout pattern

**IMPORTS**: N/A — all constants are already defined in the same file

**GOTCHA**: Changed `args.timeout || defaultTimeout` to `args.timeout ?? defaultTimeout`. The `||` operator treats `0` as falsy — if someone explicitly passes `timeout: 0`, the old code would fall back to `defaultTimeout` instead of using `0`. The `??` operator only falls back on `null`/`undefined`, preserving an explicit `0`. This is important because `AGENT_SESSION_NO_TIMEOUT` is `0`.

**VALIDATE**:
```bash
# Read the modified section and verify the logic
grep -A 12 "Default timeouts by mode" .opencode/tools/dispatch.ts
```

---

### Step 2: UPDATE `dispatchCascade()` Signature

**What**: Add `taskType` parameter to `dispatchCascade()` so it can select the correct timeout for agent mode dispatches.

**IMPLEMENT**:

Current (lines 374-382 of `.opencode/tools/dispatch.ts`):
```typescript
async function dispatchCascade(
  sessionId: string,
  cascade: CascadeRoute,
  prompt: string,
  mode: DispatchMode,
  description: string,
  command?: string,
  commandArgs?: string,
): Promise<DispatchResult | null> {
```

Replace with:
```typescript
async function dispatchCascade(
  sessionId: string,
  cascade: CascadeRoute,
  prompt: string,
  mode: DispatchMode,
  description: string,
  command?: string,
  commandArgs?: string,
  taskType?: string,
): Promise<DispatchResult | null> {
```

**PATTERN**: Standard TypeScript optional parameter — appended after existing optional parameters

**IMPORTS**: N/A

**GOTCHA**: `taskType` must be added AFTER the existing optional parameters (`command`, `commandArgs`), not before them. Adding it before would break the positional argument order at the call site.

**VALIDATE**:
```bash
# Verify the signature has the new parameter
grep -A 10 "async function dispatchCascade" .opencode/tools/dispatch.ts
```

---

### Step 3: UPDATE `dispatchCascade()` Agent Timeout Logic

**What**: Use `AGENT_SESSION_NO_TIMEOUT` instead of `AGENT_LONG_TIMEOUT_MS` when `taskType` is in `NO_TIMEOUT_TASK_TYPES`.

**IMPLEMENT**:

Current (lines 393-397 of `.opencode/tools/dispatch.ts`):
```typescript
    } else if (mode === "agent") {
      text = await dispatchAgent(
        sessionId, route.provider, route.model,
        prompt, description, AGENT_LONG_TIMEOUT_MS,
      )
```

Replace with:
```typescript
    } else if (mode === "agent") {
      // Use no-timeout for planning/execution sessions; fallback to AGENT_LONG_TIMEOUT_MS
      const agentTimeout = taskType && NO_TIMEOUT_TASK_TYPES.has(taskType)
        ? AGENT_SESSION_NO_TIMEOUT
        : AGENT_LONG_TIMEOUT_MS
      text = await dispatchAgent(
        sessionId, route.provider, route.model,
        prompt, description, agentTimeout,
      )
```

**PATTERN**: Same pattern as Step 1 — check `NO_TIMEOUT_TASK_TYPES.has()` to select timeout

**IMPORTS**: N/A

**GOTCHA**: The `taskType` parameter is optional (can be `undefined`). The guard `taskType && NO_TIMEOUT_TASK_TYPES.has(taskType)` handles this — if `taskType` is `undefined`, the first condition short-circuits to `false` and `AGENT_LONG_TIMEOUT_MS` is used as fallback. This preserves backward compatibility for any code that calls `dispatchCascade()` without a `taskType`.

**VALIDATE**:
```bash
# Verify the new timeout logic
grep -A 8 "mode === .agent." .opencode/tools/dispatch.ts | head -20
```

---

### Step 4: UPDATE `execute()` Cascade Call Site

**What**: Pass `args.taskType` to `dispatchCascade()` so the cascade can use the no-timeout logic.

**IMPLEMENT**:

Current (lines 656-665 of `.opencode/tools/dispatch.ts`):
```typescript
    if (isCascade) {
      result = await dispatchCascade(
        sessionId,
        resolved.route as CascadeRoute,
        args.prompt,
        mode,
        taskDescription,
        args.command,
        args.prompt, // For command mode, prompt = command arguments
      )
```

Replace with:
```typescript
    if (isCascade) {
      result = await dispatchCascade(
        sessionId,
        resolved.route as CascadeRoute,
        args.prompt,
        mode,
        taskDescription,
        args.command,
        args.prompt, // For command mode, prompt = command arguments
        args.taskType,
      )
```

**PATTERN**: Positional argument addition — `taskType` goes last, matching the new signature from Step 2

**IMPORTS**: N/A

**GOTCHA**: `args.taskType` is already optional in the tool schema (`.optional()` on line 518). When not provided, it passes `undefined` to `dispatchCascade()`, which correctly falls back to `AGENT_LONG_TIMEOUT_MS` (see Step 3 guard).

**VALIDATE**:
```bash
# Verify the cascade call passes taskType
grep -A 12 "if (isCascade)" .opencode/tools/dispatch.ts
```

---

### Step 5: VERIFY No Changes Needed for Direct Agent Paths

**What**: Confirm that the direct (non-cascade) agent dispatch paths in `execute()` automatically get the correct timeout from Step 1's fix.

**IMPLEMENT**:

No code changes needed. Verification only.

The direct agent paths at lines 675-678 and 705-708 both use `timeoutMs`:

```typescript
      } else if (mode === "agent") {
        text = await dispatchAgent(
          sessionId, route.provider, route.model,
          args.prompt, taskDescription, timeoutMs,
        )
```

After Step 1, `timeoutMs` is `AGENT_SESSION_NO_TIMEOUT` (0) when `taskType` is `"planning"` or `"execution"`. Since `dispatchAgent()` already handles `0` by skipping `AbortSignal.timeout`, no changes are needed here.

**PATTERN**: N/A — verification step

**IMPORTS**: N/A

**GOTCHA**: If someone calls dispatch with `taskType: "planning"` but `mode: "text"`, the no-timeout override does NOT apply (Step 1 checks `mode === "agent"`). This is intentional — text mode planning dispatches (like plan reviews) are short and should have timeouts.

**VALIDATE**:
```bash
# Verify the direct paths still use timeoutMs (unchanged)
grep -B 1 -A 4 "dispatchAgent" .opencode/tools/dispatch.ts | grep -v "^--$"
```

---

### Step 6: VERIFY End-to-End Timeout Flow

**What**: Trace the full timeout flow for a `taskType: "planning"` agent dispatch to confirm correctness.

**IMPLEMENT**:

No code changes. This is a verification step tracing the flow:

**Flow 1: Cascade path (primary — planning routes to cascade)**
```
1. User calls dispatch({ taskType: "planning", mode: "agent", prompt: "..." })
2. execute() computes defaultTimeout:
   - mode === "agent" → initially AGENT_TIMEOUT_MS (300_000)
   - args.taskType === "planning" && NO_TIMEOUT_TASK_TYPES.has("planning") → override to AGENT_SESSION_NO_TIMEOUT (0)
   - timeoutMs = args.timeout ?? 0 → 0 (no explicit timeout)
3. resolveRoute("planning") → cascade route (T0: kimi-k2-thinking → cogito → qwen3-max → claude-opus)
4. dispatchCascade(sessionId, cascade, prompt, "agent", desc, undefined, prompt, "planning")
5. For each model in cascade:
   - mode === "agent" → checks taskType ("planning") in NO_TIMEOUT_TASK_TYPES → agentTimeout = 0
   - dispatchAgent(sessionId, provider, model, prompt, desc, 0)
   - dispatchAgent: timeoutMs === 0 → no AbortSignal → fetch waits indefinitely
```

**Flow 2: Direct path (explicit provider/model override)**
```
1. User calls dispatch({ provider: "openai", model: "gpt-5.3-codex", mode: "agent", taskType: "planning", prompt: "..." })
2. execute() computes defaultTimeout:
   - mode === "agent" && taskType === "planning" → override to AGENT_SESSION_NO_TIMEOUT (0)
   - timeoutMs = 0
3. resolveRoute(undefined, "openai", "gpt-5.3-codex") → explicit route (not cascade)
4. dispatchAgent(sessionId, "openai", "gpt-5.3-codex", prompt, desc, 0)
5. dispatchAgent: timeoutMs === 0 → no AbortSignal → fetch waits indefinitely
```

**Flow 3: Non-planning agent dispatch (unaffected)**
```
1. User calls dispatch({ taskType: "execution", mode: "agent", prompt: "..." })
2. execute() computes defaultTimeout:
   - mode === "agent" && taskType === "execution" → override to AGENT_SESSION_NO_TIMEOUT (0)
   - timeoutMs = 0
3. (Same no-timeout behavior — execution is also in NO_TIMEOUT_TASK_TYPES)

1. User calls dispatch({ taskType: "code-review", mode: "agent", prompt: "..." })
2. execute() computes defaultTimeout:
   - mode === "agent" → AGENT_TIMEOUT_MS (300_000)
   - taskType === "code-review" → NOT in NO_TIMEOUT_TASK_TYPES → no override
   - timeoutMs = 300_000
3. (Normal 5-min timeout — unchanged behavior)
```

**PATTERN**: N/A — verification step

**IMPORTS**: N/A

**GOTCHA**: The `??` operator in `const timeoutMs = args.timeout ?? defaultTimeout` means an explicit `timeout: 0` from the caller will be respected (unlike the old `||` which would fall through). This is the desired behavior — if someone explicitly says "no timeout", respect it.

**VALIDATE**:
```bash
# Full file verification — check all timeout-related lines
grep -n "timeout\|TIMEOUT\|NO_TIMEOUT" .opencode/tools/dispatch.ts
```

---

## TESTING STRATEGY

### Unit Tests

No unit tests — this task modifies a TypeScript tool plugin. The OpenCode plugin system doesn't have a unit test harness for tool files. Covered by manual testing in Level 5.

### Integration Tests

N/A — integration tested via manual dispatch calls.

### Edge Cases

- **`taskType: "planning"` with `mode: "text"`**: Should NOT get no-timeout. Step 1 checks `mode === "agent"` first. Text mode planning dispatches (plan reviews) are short and should timeout.
- **`taskType: "planning"` with explicit `timeout: 600000`**: Should respect the explicit timeout. The `??` operator preserves explicit values. If user explicitly sets a timeout, they mean it.
- **`taskType: "planning"` with explicit `timeout: 0`**: Should get no-timeout. The `??` operator passes `0` through (unlike `||`).
- **`taskType: undefined` (no taskType specified)**: Should fall back to mode-based defaults. The `NO_TIMEOUT_TASK_TYPES.has()` guard handles this.
- **Cascade with `taskType: undefined`**: Falls back to `AGENT_LONG_TIMEOUT_MS` (15 min) — backward compatible.
- **Direct agent dispatch for non-planning taskType**: Gets `AGENT_TIMEOUT_MS` (5 min) — unchanged.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Verify file exists and is well-formed TypeScript
head -30 .opencode/tools/dispatch.ts
```

### Level 2: Type Safety
```bash
# TypeScript compilation check (if tsc is available)
npx tsc --noEmit .opencode/tools/dispatch.ts 2>&1 || echo "Manual check: verify no type errors in the modified sections"
```

### Level 3: Unit Tests
N/A — no unit test framework for tool TypeScript files in this project.

### Level 4: Integration Tests
N/A — covered by Level 5 manual validation.

### Level 5: Manual Validation

1. Open `.opencode/tools/dispatch.ts` and verify:
   - Line ~596: `NO_TIMEOUT_TASK_TYPES.has(args.taskType)` check exists
   - Line ~598: Uses `??` not `||` for timeout selection
   - `dispatchCascade()` signature includes `taskType?: string` as last parameter
   - `dispatchCascade()` body computes `agentTimeout` using `NO_TIMEOUT_TASK_TYPES`
   - Cascade call in `execute()` passes `args.taskType` as last argument
2. Run a dispatch with `taskType: "planning"`, `mode: "agent"` and verify it doesn't abort after 5 or 15 minutes
3. Run a dispatch with `taskType: "code-review"`, `mode: "text"` and verify it still times out normally

### Level 6: Cross-Check
```bash
# Verify no other files reference the old AGENT_LONG_TIMEOUT_MS pattern in cascade
grep -rn "AGENT_LONG_TIMEOUT_MS" .opencode/tools/
# Should only appear: in the constant definition (line 10) and as fallback in dispatchCascade()
```

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] `execute()` checks `NO_TIMEOUT_TASK_TYPES.has(args.taskType)` for agent mode
- [ ] `execute()` uses `??` operator (not `||`) for timeout selection
- [ ] `dispatchCascade()` has `taskType?: string` parameter
- [ ] `dispatchCascade()` computes `agentTimeout` conditionally
- [ ] `dispatchCascade()` uses `agentTimeout` instead of `AGENT_LONG_TIMEOUT_MS`
- [ ] Cascade call in `execute()` passes `args.taskType`
- [ ] No changes to `dispatchAgent()` (already correct)
- [ ] No changes to direct agent paths in `execute()` (automatically get correct timeout)
- [ ] `AGENT_LONG_TIMEOUT_MS` is still used as fallback in cascade (not deleted)

### Runtime (verify after testing)

- [ ] `taskType: "planning"` + `mode: "agent"` dispatch runs without timeout
- [ ] `taskType: "execution"` + `mode: "agent"` dispatch runs without timeout
- [ ] `taskType: "code-review"` + `mode: "text"` dispatch still times out normally
- [ ] Cascade path for planning uses no-timeout
- [ ] Direct path for planning uses no-timeout

---

## HANDOFF NOTES

### Files Created/Modified

- `.opencode/tools/dispatch.ts` — Modified timeout selection in `execute()`, added `taskType` parameter to `dispatchCascade()`, updated cascade agent timeout logic, passed `taskType` through cascade call site

### Patterns Established

- **No-timeout convention**: `timeoutMs === 0` means no timeout. `NO_TIMEOUT_TASK_TYPES` set is the authoritative list of long-running task types. New long-running task types should be added to this set.
- **`??` operator for timeout selection**: Use nullish coalescing (`??`) not logical OR (`||`) when a timeout value of `0` is meaningful.

### State to Carry Forward

- `dispatch.ts` is now ready for no-timeout planning sessions
- Task 2 modifies `build.md` to remove the `timeout: 900` that was working around this issue

### Known Issues or Deferred Items

- The `dispatchAgent()` response extraction bug (returns `null` even when the agent session works and writes files) is a separate issue not addressed by this task. This task only fixes the timeout — the response extraction bug is tracked separately.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written
- [ ] Brief marked done: rename `task-1.md` → `task-1.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **`0` means no timeout, not "use default"**: The convention is explicit — `AGENT_SESSION_NO_TIMEOUT = 0`. Any consumer checking timeouts should use `timeoutMs > 0` to decide whether to set an `AbortSignal`.
- **`??` over `||`**: Critical for correctness when `0` is a valid explicit value. This is a subtle JavaScript gotcha that would silently break the no-timeout feature.
- **Cascade fallback to AGENT_LONG_TIMEOUT_MS**: When `taskType` is not in `NO_TIMEOUT_TASK_TYPES`, the cascade still uses 15 min. This is the correct fallback for cascade dispatches that aren't planning/execution (if such routes are added in the future).

### Implementation Notes

- The `NO_TIMEOUT_TASK_TYPES` set is defined at module level, not inside a function. This is intentional — it's a configuration constant.
- Adding new long-running task types in the future is a one-line change: add the string to the `Set` constructor.
- The `taskType` parameter was added as the LAST optional parameter in `dispatchCascade()` to maintain backward compatibility with any internal callers.
