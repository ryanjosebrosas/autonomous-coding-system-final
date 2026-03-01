# Task 4 of 9: Clarify "Opus Never Implements" Graceful Degradation

> **Feature**: `dispatch-wiring-completion`
> **Brief Path**: `.agents/features/dispatch-wiring-completion/task-4.md`
> **Plan Overview**: `.agents/features/dispatch-wiring-completion/plan.md`

---

## OBJECTIVE

Add an explicit graceful degradation clause to the "Opus Never Implements" rule so standalone commands don't halt when dispatch is unavailable.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/sections/01_core_principles.md` | UPDATE | Rewrite line 1 to add graceful degradation; adjust line 3 header |

**Out of Scope:**
- Lines 9-19 (council rules, YAGNI, KISS, DRY, etc.) — unchanged
- Violation examples content — stays, only the header text adjusts
- Any other files

**Dependencies:**
- None — independent of other tasks

---

## PRIOR TASK CONTEXT

Tasks 1-3 added dispatch wiring to commands. Each uses "If dispatch unavailable" fallback paths. This task codifies WHY that fallback is legitimate — not a rule violation.

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/sections/01_core_principles.md` (all 19 lines) — the full file to understand the complete rule set
- `.opencode/commands/build.md` (line 45) — existing precedent: "If dispatch is unavailable, the primary session model handles all tiers."

### Patterns to Follow

**Graceful degradation pattern** (already used in every command):
```
**If dispatch available:**
{concrete dispatch call}

**If dispatch unavailable:**
{manual fallback}
```
This task makes the core rule explicitly acknowledge this pattern.

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/sections/01_core_principles.md`

**What**: Rewrite the first paragraph (line 1) and adjust the violation examples header (line 3) to add graceful degradation.

**IMPLEMENT**:

Current (line 1):
```
**HARD RULE — Opus Never Implements** — Claude Opus (this model) handles ONLY planning, architecture, orchestration, exploration, and strategy. ALL implementation (file edits, code writing, refactoring) MUST be dispatched to T1-T5 models via the dispatch tool through opencode serve. Opus writing code directly is a violation. No exceptions. If dispatch tools are unavailable, write a plan to .agents/plans/ and stop.
```

Replace with:
```
**HARD RULE — Opus Never Implements (When Dispatch Available)** — Claude Opus (this model) handles ONLY planning, architecture, orchestration, exploration, and strategy. ALL implementation (file edits, code writing, refactoring) MUST be dispatched to T1-T5 models via the dispatch tool through opencode serve. Opus writing code directly when dispatch is available is a violation.

**Graceful degradation**: If dispatch tools are unavailable (opencode serve not running, network error, tool not found), commands degrade to primary-model execution — the executing model handles implementation directly. This is NOT a violation; it is the designed fallback. Commands MUST include "If dispatch unavailable" paths for this reason.
```

Current (line 3):
```
**Violation examples** (all FORBIDDEN):
```

Replace with:
```
**Violation examples** (all FORBIDDEN when dispatch IS available):
```

**PATTERN**: Matches the "If dispatch available / unavailable" pattern established across all pipeline commands

**IMPORTS**: N/A

**GOTCHA**: Lines 4-8 (the violation examples list) must remain unchanged. Only the header on line 3 gets the qualifier added.

**VALIDATE**:
```bash
# Read the file and verify:
# 1. Line 1 now says "When Dispatch Available" in the title
# 2. Graceful degradation paragraph exists as a separate paragraph
# 3. Violation examples header says "when dispatch IS available"
# 4. Lines 4-19 are unchanged
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — this modifies a core principles markdown file.

### Edge Cases
- The rule must still feel strong and enforceable — not weakened
- The degradation clause must be clearly separated so it doesn't dilute the main rule
- The violation examples must still apply when dispatch IS available

---

## VALIDATION COMMANDS

### Level 5: Manual Validation
1. Open `.opencode/sections/01_core_principles.md`
2. Read the full file — does the rule still feel authoritative?
3. Verify the graceful degradation is a separate paragraph, not merged into the main rule
4. Verify violation examples still list all forbidden patterns
5. Verify lines 9-19 (council rules, YAGNI, etc.) are untouched

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] Line 1 title includes "(When Dispatch Available)"
- [ ] Graceful degradation paragraph is present and clearly separated
- [ ] Violation examples header includes "when dispatch IS available" qualifier
- [ ] Lines 4-8 (violation examples content) unchanged
- [ ] Lines 9-19 (other rules) unchanged

---

## COMPLETION CHECKLIST

- [ ] Step 1 completed
- [ ] Validation passed
- [ ] Brief marked done: rename `task-4.md` → `task-4.done.md`
