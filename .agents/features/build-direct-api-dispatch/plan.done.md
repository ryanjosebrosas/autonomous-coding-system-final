# Plan: build-direct-api-dispatch

> **Feature**: `build-direct-api-dispatch`
> **Feature Directory**: `.agents/features/build-direct-api-dispatch/`
> **Plan Type**: Task Briefs (1 task, 1 brief)
> **Generated**: 2026-03-02

---

## FEATURE DESCRIPTION

Update `/build` (build.md) to use the **direct API pattern** that was proven to work in E2E testing, instead of the dispatch tool with `sessionId` (which is blocked by stale MCP cache).

**What works** (proven in testing):
```
Step 1: POST /session           → create session, get {id}
Step 2: POST /session/{id}/command  {"command":"prime", "arguments":"", "model":"provider/model"}
Step 3: POST /session/{id}/command  {"command":"planning", "arguments":"...", "model":"provider/model"}
```

**What doesn't work** (current build.md approach):
```
dispatch({ mode:"command", command:"prime", ... })       → works
dispatch({ mode:"command", command:"planning", ..., sessionId: X })  → sessionId silently dropped (stale MCP cache)
```

The dispatch tool works fine for single calls (Call 1). But `sessionId` reuse in Call 2 fails because the MCP tool schema cached in the Claude session doesn't include `sessionId`. This means every dispatch creates a new session — the `/prime` context from Call 1 is lost.

**Solution**: Replace the dispatch-tool pseudocode in build.md with direct API pseudocode using `fetch()` / bash `curl`. This matches exactly what we tested:

1. **Session 1** (planning): `create session` → `POST /command prime` → `POST /command planning`
2. **Session 2** (execution): `create session` → `POST /command prime` → `POST /command execute`

Each phase gets its own fresh session with its own `/prime`, matching the session model from AGENTS.md.

**Key insight from testing**: `/planning` and `/execute` must be in SEPARATE sessions. Each session is one context window:
```
Session 1: /prime → /planning  → END
Session 2: /prime → /execute   → END
```

---

## FEATURE METADATA

| Field | Value |
|-------|-------|
| **Complexity** | light |
| **Target Files** | `.opencode/commands/build.md` |
| **Files to Modify** | 1 |
| **Risk Level** | LOW |

### Slice Guardrails

**What's In Scope**:
- Update Step 2 (planning dispatch) to use direct API pattern
- Update Step 5 (execution dispatch) both modes to use direct API pattern
- Ensure separate sessions for planning vs execution

**What's Out of Scope**:
- dispatch.ts — no changes needed (direct API bypasses it)
- Other build.md steps (1, 3, 4, 6, 7)
- `/planning` or `/execute` commands themselves

**Definition of Done**:
- [x] Step 2 uses direct API `POST /session/{id}/command` pattern
- [x] Step 5 Task Brief Mode uses direct API with separate session from planning
- [x] Step 5 Master Plan Mode uses direct API with separate session
- [x] Each phase (planning, execution) explicitly creates its own session
- [x] Fallback paths preserved

---

## TASK INDEX

| Task | Brief | Target File | Description |
|------|-------|-------------|-------------|
| 1 | `task-1.md` | `.opencode/commands/build.md` | Replace dispatch-tool pseudocode with direct API pattern |

---

## CONTEXT REFERENCES

### The proven direct API pattern

From E2E testing that produced plan.md (735 lines) + task-1.md (814 lines):

**Planning session:**
```bash
# Create session
SESSION=$(curl -s -X POST "http://127.0.0.1:4096/session" \
  -H "Content-Type: application/json" \
  -d '{"title": "Planning: {spec-name}"}' | jq -r '.id')

# /prime
curl -s -X POST "http://127.0.0.1:4096/session/${SESSION}/command" \
  -H "Content-Type: application/json" \
  -d '{"command":"prime", "arguments":"", "model":"bailian-coding-plan-test/qwen3.5-plus"}'

# /planning
curl -s -X POST "http://127.0.0.1:4096/session/${SESSION}/command" \
  -H "Content-Type: application/json" \
  -d '{"command":"planning", "arguments":"string-capitalize --auto-approve", "model":"bailian-coding-plan-test/qwen3.5-plus"}'
```

**Execution session (SEPARATE from planning):**
```bash
# Create NEW session
SESSION2=$(curl -s -X POST "http://127.0.0.1:4096/session" \
  -H "Content-Type: application/json" \
  -d '{"title": "Execute: {spec-name}"}' | jq -r '.id')

# /prime
curl -s -X POST "http://127.0.0.1:4096/session/${SESSION2}/command" \
  -H "Content-Type: application/json" \
  -d '{"command":"prime", "arguments":"", "model":"bailian-coding-plan-test/qwen3.5-plus"}'

# /execute
curl -s -X POST "http://127.0.0.1:4096/session/${SESSION2}/command" \
  -H "Content-Type: application/json" \
  -d '{"command":"execute", "arguments":".agents/features/{spec-name}/plan.md", "model":"bailian-coding-plan-test/qwen3.5-plus"}'
```

### Current build.md pseudocode to replace

**Step 2** (lines 228-281): Uses `dispatch()` with `sessionId` — broken due to stale MCP cache.

**Step 5 Task Brief** (lines 396-442): Uses `dispatch()` with `sessionId` — same issue.

**Step 5 Master Plan** (lines 459-500): Uses `dispatch()` with `sessionId` — same issue.

### Model selection

The direct API pattern uses an explicit `model` string in the format `provider/model`. For `/build`:
- Planning: `bailian-coding-plan-test/qwen3-max-2026-01-23` (T0 planning model) or cascade fallback
- Execution: `bailian-coding-plan-test/qwen3.5-plus` (T1c execution workhorse)

The pseudocode should reference the model-strategy.md routing table rather than hardcoding models.

---

## TESTING STRATEGY

After applying the change, the E2E test we just ran IS the validation:
1. Create session → `/prime` → `/planning` → verify plan artifacts
2. Create NEW session → `/prime` → `/execute` → verify implementation

Both already proven to work.
