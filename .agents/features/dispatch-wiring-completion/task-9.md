# Task 9 of 9: Soften Task Count Threshold in `/planning` + `/build`

> **Feature**: `dispatch-wiring-completion`
> **Brief Path**: `.agents/features/dispatch-wiring-completion/task-9.md`
> **Plan Overview**: `.agents/features/dispatch-wiring-completion/plan.md`

---

## OBJECTIVE

Replace all hardcoded `<10` / `>=10` / `10+` task count thresholds with soft guidelines so task brief mode is the default regardless of count, and master plan mode is triggered by phase complexity — not a number.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/commands/planning.md` | UPDATE | Lines 211, 215, 280 — soften threshold language |
| `.opencode/commands/build.md` | UPDATE | Lines 146-147 — soften threshold language |
| `.opencode/templates/STRUCTURED-PLAN-TEMPLATE.md` | UPDATE | Lines 20-21 — soften threshold reference |
| `.opencode/templates/MASTER-PLAN-TEMPLATE.md` | UPDATE | Lines 3, 12 — soften threshold reference |

**Out of Scope:**
- Phase naming, brief format, master plan structure — all unchanged
- The task splitting heuristic at `planning.md:274` — already good ("one coherent unit of work"), keep as-is
- Sub-plan template (`SUB-PLAN-TEMPLATE.md` line 13: "5-10 tasks per sub-plan") — this is a per-phase guideline, not the mode-selection threshold; keep as-is

**Dependencies:**
- None — independent of other tasks

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/commands/planning.md` (lines 206-216) — Auto-Detect Complexity section
- `.opencode/commands/planning.md` (lines 278-300) — Master + Sub-Plan Mode section
- `.opencode/commands/build.md` (lines 145-148) — Plan mode detection
- `.opencode/templates/STRUCTURED-PLAN-TEMPLATE.md` (lines 18-22) — Template guidance
- `.opencode/templates/MASTER-PLAN-TEMPLATE.md` (lines 1-15) — Template guidance

---

## STEP-BY-STEP TASKS

### Step 1: UPDATE `.opencode/commands/planning.md` line 211

**What**: Soften the master plan trigger from "10+ tasks" to a complexity/phase-based criterion.

**IMPLEMENT**:

Current (line 211):
```
- **Master + Sub-Plan Mode** (EXCEPTION — escape hatch for very large features): Use ONLY when the feature has 10+ tasks across multiple distinct phases with heavy cross-phase dependencies. This is rare — task brief mode handles most features, including those with 7-9 tasks.
```

Replace with:
```
- **Master + Sub-Plan Mode** (EXCEPTION — escape hatch for multi-phase features): Use ONLY when the feature has multiple distinct phases with heavy cross-phase dependencies (e.g., "foundation must complete before integration can start"). Task count alone does NOT trigger master plan mode — a 12-task feature with independent tasks uses task briefs; a 6-task feature with tightly coupled phases might use a master plan. This is rare.
```

**GOTCHA**: This is a long line — match exactly to avoid edit failures.

---

### Step 2: UPDATE `.opencode/commands/planning.md` line 215

**What**: Update the master plan announcement example.

**IMPLEMENT**:

Current (line 215):
```
- Master Plan: "I count ~14 tasks across 3 distinct phases — task briefs alone aren't enough. I'll use the master + sub-plan approach."
```

Replace with:
```
- Master Plan: "This feature has 3 distinct phases with heavy cross-phase dependencies — task briefs alone can't capture the phase gates. I'll use the master + sub-plan approach."
```

---

### Step 3: UPDATE `.opencode/commands/planning.md` line 280

**What**: Soften the master plan section header context.

**IMPLEMENT**:

Current (line 280):
```
For very complex features with 10+ tasks across multiple distinct phases:
```

Replace with:
```
For features with multiple distinct phases and heavy cross-phase dependencies:
```

---

### Step 4: UPDATE `.opencode/commands/build.md` lines 146-147

**What**: Soften the mode detection criteria.

**IMPLEMENT**:

Current (lines 146-147):
```
   - **Task Brief Mode** (DEFAULT — use for all standard specs): Produces `plan.md` (overview + task index) + one `task-N.md` brief per task. Use when spec has <10 estimated tasks. Each brief runs in one `/execute` session.
   - **Master + Sub-Plan Mode** (EXCEPTION — rare, very large specs): Use when spec has >=10 estimated tasks across multiple distinct phases. This is rare.
```

Replace with:
```
   - **Task Brief Mode** (DEFAULT — use for all specs): Produces `plan.md` (overview + task index) + one `task-N.md` brief per task. Each brief runs in one `/execute` session. Works for any task count — the typical range is 3-12 tasks.
   - **Master + Sub-Plan Mode** (EXCEPTION — rare, multi-phase specs): Use ONLY when the spec has multiple distinct phases with heavy cross-phase dependencies. Task count alone does not trigger this — a 15-task feature with independent tasks still uses task briefs.
```

---

### Step 5: UPDATE `.opencode/templates/STRUCTURED-PLAN-TEMPLATE.md` lines 20-21

**What**: Soften template guidance.

**IMPLEMENT**:

Current (lines 20-21):
```
> - **This template** (single plan): Features with <10 tasks that fit in one 700-1000 line plan
> - **Master + Sub-Plan**: Complex features with 10+ tasks or multiple distinct phases
```

Replace with:
```
> - **This template** (single plan): Features of any task count that fit in one 700-1000 line plan (most features)
> - **Master + Sub-Plan**: Features with multiple distinct phases and heavy cross-phase dependencies (rare)
```

---

### Step 6: UPDATE `.opencode/templates/MASTER-PLAN-TEMPLATE.md` lines 3 and 12

**What**: Soften template header guidance.

**IMPLEMENT**:

Current (line 3):
```
> Use this for complex features with 10+ tasks or multiple distinct phases.
```

Replace with:
```
> Use this for features with multiple distinct phases and heavy cross-phase dependencies.
```

Current (line 12):
```
> with <10 tasks that fit in one 700-1000 line plan.
```

Replace with:
```
> that fit in one 700-1000 line plan (the default for most features).
```

---

## TESTING STRATEGY

### Unit Tests
No unit tests — markdown edits across 4 files.

### Edge Cases
- Must not remove the master plan mode entirely — it's still valid for genuinely multi-phase features
- Must not change any structural elements (section headers, formatting)
- The sub-plan template's "5-10 tasks per sub-plan" is intentionally not changed — that's a per-phase sizing guideline, not the mode threshold

---

## VALIDATION COMMANDS

### Level 5: Manual Validation
1. Search all four files for remaining `<10`, `>=10`, `10+` references — expect 0
2. Read each modified section — does task brief mode feel like the clear default?
3. Does master plan mode feel like it's triggered by structure (phases), not count?
4. Verify `planning.md:274` (task splitting heuristic) is unchanged

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] `planning.md` lines 211, 215, 280 updated — no hardcoded count thresholds
- [ ] `build.md` lines 146-147 updated — task brief mode is "for all specs"
- [ ] `STRUCTURED-PLAN-TEMPLATE.md` lines 20-21 updated
- [ ] `MASTER-PLAN-TEMPLATE.md` lines 3, 12 updated
- [ ] Master plan mode is still available (triggered by phase complexity, not count)
- [ ] No other content in any file changed

---

## HANDOFF NOTES

This is the final task. After completion:
- All 9 tasks are done
- Pipeline handoff should point to `/code-loop dispatch-wiring-completion`

---

## COMPLETION CHECKLIST

- [ ] Steps 1-6 completed
- [ ] All 4 files validated
- [ ] No hardcoded `<10` / `>=10` / `10+` thresholds remain in active command/template files
- [ ] Brief marked done: rename `task-9.md` → `task-9.done.md`
