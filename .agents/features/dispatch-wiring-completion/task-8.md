# Task 8 of 9: Clean Stale `_dispatch-primer.md` Reference

> **Feature**: `dispatch-wiring-completion`
> **Brief Path**: `.agents/features/dispatch-wiring-completion/task-8.md`
> **Plan Overview**: `.agents/features/dispatch-wiring-completion/plan.md`

---

## OBJECTIVE

Remove the stale reference to `_dispatch-primer.md` in `model-strategy.md` and replace it with an accurate description of how dispatch models get context.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/reference/model-strategy.md` | UPDATE | Replace line 92 |

**Out of Scope:**
- All other lines in the file — unchanged
- Any other files

**Dependencies:**
- None — independent

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/reference/model-strategy.md` (lines 90-94) — surrounding context for the edit
- `.agents/features/multi-model-dispatch/report.done.md` (lines 81-82) — confirms primer was intentionally eliminated

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/reference/model-strategy.md`

**What**: Replace the stale primer reference with accurate context delivery description.

**IMPLEMENT**:

Current (line 92):
```
**Primer**: `_dispatch-primer.md` auto-prepended to every dispatch and council — ensures all models have project context, core principles, and methodology.
```

Replace with:
```
**Context delivery**: Agent mode — models access AGENTS.md, memory.md, and project files through native tool infrastructure (no primer needed). Text mode — the calling command includes relevant context directly in the prompt.
```

**PATTERN**: N/A — one-line replacement

**GOTCHA**: Line 91 (`**Requires**: opencode serve running...`) and line 93 (blank or `**Pre-dispatch**:...`) must remain unchanged.

**VALIDATE**:
```bash
# Search entire .opencode/ directory for any remaining references to _dispatch-primer.md or dispatch-primer
# If any found, update or remove them
```

---

### Step 2: Verify no orphaned references

**What**: Search for any other mentions of `_dispatch-primer.md` or `dispatch-primer` across the codebase.

**IMPLEMENT**: Use grep to search `.opencode/` and `.agents/` for the pattern. If found in any active (non-`.done.md`) file, update or remove the reference.

**VALIDATE**:
```bash
# grep -r "dispatch-primer" .opencode/ .agents/ --include="*.md" | grep -v ".done.md"
# Expected: 0 results
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — single line markdown replacement.

### Edge Cases
- Historical `.done.md` files may reference the primer — that's fine (they're archived)
- Only active files should be cleaned

---

## VALIDATION COMMANDS

### Level 5: Manual Validation
1. Open `.opencode/reference/model-strategy.md`
2. Verify line 92 now describes "Context delivery" instead of "Primer"
3. Verify lines 91 and 93 are unchanged
4. Run search for `dispatch-primer` — confirm 0 results in active files

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] Line 92 replaced with accurate context delivery description
- [ ] No remaining references to `_dispatch-primer.md` in active files
- [ ] Lines 91, 93 unchanged

---

## COMPLETION CHECKLIST

- [ ] Steps 1-2 completed
- [ ] Validation passed
- [ ] Brief marked done: rename `task-8.md` → `task-8.done.md`
