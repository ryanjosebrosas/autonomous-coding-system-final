# Task 1 of 1: Replace dispatch-tool pseudocode with direct API pattern in build.md

> **Feature**: `build-direct-api-dispatch`
> **Brief Path**: `.agents/features/build-direct-api-dispatch/task-1.md`
> **Plan Overview**: `.agents/features/build-direct-api-dispatch/plan.md`

---

## OBJECTIVE

Replace all dispatch-tool `sessionId` pseudocode in `.opencode/commands/build.md` with direct API pseudocode (`POST /session/{id}/command`) that matches the proven E2E test pattern, with separate sessions for planning and execution.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/build.md` | UPDATE | Step 2 planning dispatch (lines 228-281) |
| `.opencode/commands/build.md` | UPDATE | Step 5 Task Brief Mode dispatch (lines 396-442) |
| `.opencode/commands/build.md` | UPDATE | Step 5 Master Plan Mode dispatch (lines 459-500) |

**Out of Scope:**
- dispatch.ts — no changes
- Steps 1, 3, 4, 6, 7 — not affected
- Master + Sub-Plan Mode in Step 2 (line 294+) — same pattern applies, update for consistency

---

## CONTEXT REFERENCES

### Current Step 2 planning dispatch (lines 228-281)

```markdown
   Then dispatch sequentially — `/prime` first to load context, then `/planning` with full spec details:

   **Call 1: Prime the session**
   ```
   result1 = dispatch({
     mode: "command",
     command: "prime",
     prompt: "",
     taskType: "planning",
     description: "Prime for {spec-name}",
   })
   // Extract from result1 output:
   //   **Session ID**: `{id}`        → sessionId
   //   **Model**: LABEL (`prov/mod`) → provider, model
   sessionId = extractSessionId(result1)
   provider = extractProvider(result1)   // e.g., "bailian-coding-plan-test"
   model = extractModel(result1)         // e.g., "qwen3-max-2026-01-23"
   ```

   **Call 2: Run planning in the SAME session (explicit model — no cascade)**
   ```
   result2 = dispatch({
     mode: "command",
     command: "planning",
     prompt: "{spec-name} --auto-approve\n\nSpec Context:\n{specContext}",
     provider: provider,   // from Call 1 — ensures same model handles both commands
     model: model,         // from Call 1 — bypasses cascade (no redundant ping)
     sessionId: sessionId, // from Call 1 — reuses the primed session
     description: "Plan {spec-name}",
   })
   ```

   **Why explicit provider/model**: Call 1 already resolved the cascade and found a working
   model. Passing it explicitly in Call 2 avoids a redundant cascade resolution ping,
   eliminates the risk of model mismatch, and saves ~15s latency.

   The `--auto-approve` flag skips the interactive approval gate in `/planning` Phase 4 — the spec was already approved via BUILD_ORDER.

   **Why sequential dispatch**: A single prompt with "Run /prime first, then /planning..." is unreliable — models skip steps or truncate. Two explicit command dispatches with shared sessionId ensures both commands run in order with accumulated context. Call 2 passes the exact provider/model from Call 1 to guarantee the same model handles the full session.

   **Why spec context inline**: Prior testing showed plan quality drops when the `/planning` model must discover spec details itself. Passing acceptance criteria, files touched, and patterns inline ensures 700+ line plans.

   **If `sessionId` is not a visible dispatch parameter:**
   The MCP tool schema is stale (cached at session start before sessionId was added to dispatch.ts).
   Fix: restart `opencode serve`, then start a NEW Claude session — the fresh session picks up the updated tool schema with `sessionId`. The current session cannot use sessionId regardless of what's in dispatch.ts.

   **If dispatch unavailable:**
   Write the plan directly using the `/planning` methodology. The primary model gathers context, runs discovery, and produces the structured plan inline.

   **If dispatch fails (either call):**
   - If Call 1 (`/prime`) fails: Fall back to inline planning — the session can't be primed.
   - If Call 2 (`/planning`) fails: Retry once with a new session (Call 1 + Call 2). If retry also fails, fall back to inline planning.
   - Log: "Dispatch failed for planning {spec-name} — falling back to inline planning."
   - Inline planning uses the same spec context gathered in step 1 — nothing is lost.
```

### Current Step 5 Task Brief Mode dispatch (lines 396-442)

```markdown
1. **Dispatch or execute one brief:**

   **If dispatch available — use sequential dispatch (two calls, same session):**

   **Call 1: Prime the session**
   ```
   result1 = dispatch({
     mode: "command",
     command: "prime",
     prompt: " ",
     taskType: "execution",
     description: "Prime for {spec-name} execution",
   })
   sessionId = extractSessionId(result1)
   provider = extractProvider(result1)
   model = extractModel(result1)
   ```

   **Call 2: Execute in the SAME session (explicit model — no routing)**
   ```
   result2 = dispatch({
     mode: "command",
     command: "execute",
     prompt: ".agents/features/{spec-name}/plan.md",
     provider: provider,
     model: model,
     sessionId: sessionId,
     description: "Execute {spec-name}",
     timeout: 0,
   })
   ```

   **Why two calls**: ...

   **If `sessionId` is not a visible dispatch parameter:** ...

   **If dispatch unavailable:** ...

   **If dispatch fails (either call):** ...
```

### Current Step 5 Master Plan Mode dispatch (lines 459-500)

Same pattern as Task Brief Mode but with `plan-master.md`.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE Step 2 planning dispatch

**Replace** the dispatch-tool pseudocode (lines 228-281) with direct API pattern:

```markdown
   Then dispatch to a new session — `/prime` first to load context, then `/planning` with full spec details:

   **Planning session (direct API):**
   ```
   // Step A: Create a fresh session for planning
   session = POST http://127.0.0.1:4096/session
     body: { "title": "Planning: {spec-name}" }
   sessionId = session.id

   // Step B: Prime the session (load project context)
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "prime",
       "arguments": "",
       "model": "{planning-model}"  // from model-strategy.md T0 or T1c
     }

   // Step C: Run /planning in the SAME session (context carries over)
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "planning",
       "arguments": "{spec-name} --auto-approve",
       "model": "{planning-model}"  // same model as Step B
     }
   ```

   **Model selection**: Use the planning model from model-strategy.md:
   - Primary: `bailian-coding-plan-test/qwen3-max-2026-01-23` (T0 planning)
   - Fallback: `bailian-coding-plan-test/qwen3.5-plus` (T1c)
   - Last resort: `anthropic/claude-opus-4-5` (T0 paid)

   **Why direct API**: The dispatch tool's `sessionId` parameter may not be visible due to stale MCP cache. Direct API calls bypass this — `POST /session/{id}/command` always uses the correct session.

   **Why same session for /prime + /planning**: `/prime` loads project context (git state, build state, pending work). `/planning` needs this context to produce quality plans. Same session = accumulated context.

   **Why `--auto-approve`**: The spec was already approved via BUILD_ORDER. Skips interactive questions in all phases.

   **If direct API unavailable** (no server running):
   Write the plan directly using the `/planning` methodology inline.

   **If either command fails:**
   - If `/prime` fails: Retry once, then fall back to inline planning.
   - If `/planning` fails: Retry with fallback model. If all fail, fall back to inline planning.
   - Log: "Dispatch failed for planning {spec-name} — falling back to inline planning."
```

### Step 2: UPDATE Step 5 Task Brief Mode dispatch

**Replace** the dispatch-tool pseudocode (lines 396-442) with direct API pattern:

```markdown
1. **Dispatch or execute one brief:**

   **If server available — dispatch to a NEW session (separate from planning):**

   **Execution session (direct API):**
   ```
   // Step A: Create a fresh session for execution
   session = POST http://127.0.0.1:4096/session
     body: { "title": "Execute: {spec-name}" }
   sessionId = session.id

   // Step B: Prime the session
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "prime",
       "arguments": "",
       "model": "{execution-model}"  // from model-strategy.md T1c
     }

   // Step C: Execute in the SAME session (context carries over)
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "execute",
       "arguments": ".agents/features/{spec-name}/plan.md",
       "model": "{execution-model}"  // same model as Step B
     }
   ```

   **Model selection**: Use the execution model from model-strategy.md:
   - Primary: `bailian-coding-plan-test/qwen3.5-plus` (T1c execution workhorse)
   - Fallback: `bailian-coding-plan-test/qwen3-coder-next` (T1a fast)

   **Why a NEW session** (not the planning session): Each phase gets its own context window per AGENTS.md session model. Planning context (discovery, research) would pollute execution context. Fresh `/prime` gives the execution model clean project state.

   **If server unavailable:**
   Run `/execute .agents/features/{spec-name}/plan.md` inline.

   **If either command fails:**
   - If `/prime` fails: Fall back to inline execution.
   - If `/execute` fails: Retry once with new session. If still fails, fall back to inline.
   - Log: "Dispatch failed for execution {spec-name} — falling back to inline execution."
```

### Step 3: UPDATE Step 5 Master Plan Mode dispatch

Same as Step 2 but with `plan-master.md` in the execute arguments:

```markdown
   // Step C: Execute phase in the SAME session
   POST http://127.0.0.1:4096/session/{sessionId}/command
     body: {
       "command": "execute",
       "arguments": ".agents/features/{spec-name}/plan-master.md",
       "model": "{execution-model}"
     }
```

### Step 4: Remove stale MCP cache warnings

Remove the `**If sessionId is not a visible dispatch parameter**` sections from Steps 2 and 5 — no longer relevant since we're using direct API.

---

## ACCEPTANCE CRITERIA

- [x] Step 2 uses `POST /session/{id}/command` pattern (not dispatch tool)
- [x] Step 5 Task Brief Mode uses `POST /session/{id}/command` with NEW session
- [x] Step 5 Master Plan Mode uses `POST /session/{id}/command` with NEW session
- [x] Planning and execution use SEPARATE sessions
- [x] Each session starts with `/prime` before the main command
- [x] Model selection references model-strategy.md (not hardcoded)
- [x] Stale MCP cache warnings removed — kept one explanatory note in Step 2 (Good divergence: explains why direct API is used)
- [x] Fallback paths preserved
- [x] No changes to Steps 1, 3, 4, 6, 7

---

## COMPLETION CHECKLIST

- [x] Step 1 completed (Step 2 planning)
- [x] Step 2 completed (Step 5 Task Brief)
- [x] Step 3 completed (Step 5 Master Plan)
- [x] Step 4 completed (remove stale cache warnings)
- [x] All acceptance criteria checked
- [x] Brief marked done: `task-1.md` → `task-1.done.md`
