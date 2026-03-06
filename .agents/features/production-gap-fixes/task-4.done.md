# Task 4: Add Skill Recommendations for Empty Categories

**Status:** pending  
**Created:** 2026-03-06  

---

## Objective

Populate CATEGORY_SKILL_RECOMMENDATIONS in category-skills-guide.ts for the 4 categories that currently have empty arrays.

---

## Scope

### Files Modified
- `.opencode/tools/delegate-task/category-skills-guide.ts` — CATEGORY_SKILL_RECOMMENDATIONS

### Categories to Populate
- `artistry` — currently `[]`
- `unspecified-low` — currently `[]`
- `unspecified-high` — currently `[]`
- `writing` — currently `[]`

### What's Out of Scope
- Already populated categories (visual-engineering, ultrabrain, quick, deep)
- Category model routes
- Any behavior changes

### Dependencies
None — this task is independent.

---

## Prior Task Context

None — this task is independent.

---

## Context References

### Current CATEGORY_SKILL_RECOMMENDATIONS (Lines 12-21)

```typescript
export const CATEGORY_SKILL_RECOMMENDATIONS: Record<string, string[]> = {
  "visual-engineering": ["frontend-ui-ux", "playwright"],
  "ultrabrain": ["council"],
  "artistry": [],
  "quick": ["git-master"],
  "deep": ["code-review"],
  "unspecified-low": [],
  "unspecified-high": [],
  "writing": [],
}
```

### Category Descriptions (from categories.json)

```json
"artistry": {
  "description": "Complex problem-solving with unconventional, creative approaches",
  "useWhen": ["Innovative solutions needed", "Standard patterns don't fit", "Creative problem-solving"]
}

"unspecified-low": {
  "description": "Tasks that don't fit other categories, low effort required",
  "useWhen": ["General tasks", "Low complexity work", "Default for simple requests"]
}

"unspecified-high": {
  "description": "Complex tasks that don't fit other categories, high effort required",
  "useWhen": ["Complex general tasks", "Cross-cutting concerns", "High-stakes decisions"]
}

"writing": {
  "description": "Documentation, prose, technical writing",
  "useWhen": ["Documentation", "README files", "Technical guides", "Changelog entries"]
}
```

### Available Skills

From AGENTS.md and .opencode/skills/:
- Built-in: playwright, frontend-ui-ux, git-master, dev-browser
- Project: code-loop, code-review, code-review-fix, commit, council, decompose, execute, final-review, mvp, pillars, planning-methodology, pr, prd, prime, system-review

---

## Patterns to Follow

### Pattern: Skill Recommendation Logic

Skills are recommended based on:
1. **Category purpose** — What kind of work does this category handle?
2. **Skill relevance** — Which skills help with that kind of work?
3. **Not overwhelming** — 0-3 skills per category is ideal

### Pattern: Existing Recommendations

```typescript
"visual-engineering": ["frontend-ui-ux", "playwright"],  // UI work → UI skills + browser testing
"ultrabrain": ["council"],  // Hard problems → multi-perspective reasoning
"quick": ["git-master"],  // Fast tasks → git operations
"deep": ["code-review"],  // Investigation → thorough analysis
```

---

## Step-by-Step Tasks

### Step 1: Analyze skill-to-category mappings

**ACTION:** ANALYZE

Skills by purpose:
- `council` — Multi-perspective reasoning for hard problems
- `planning-methodology` — Structured planning
- `prd` — Product requirements
- `mvp` — Product vision
- `code-review` — Quality analysis
- `git-master` — Git operations
- `commit` — Conventional commits
- `pr` — Pull requests
- `prime` — Context loading

### Step 2: Populate artistry recommendations

**Category:** artistry — "Creative problem-solving with unconventional approaches"

Recommended skill: **council** — Multi-perspective reasoning helps with unconventional solutions

**Reasoning:** Artistry involves non-standard solutions. Council provides multiple perspectives which helps generate unconventional approaches.

**Alternative:** No other skill directly helps with creativity. Could leave empty if council is already taken by ultrabrain.

**Recommendation:** `["council"]` (same as ultrabrain, but valid — both categories benefit from multi-perspective reasoning)

---

**ACTION:** UPDATE  
**TARGET:** `.opencode/tools/delegate-task/category-skills-guide.ts:15`

**Current:**
```typescript
  "artistry": [],
```

**Replace with:**
```typescript
  "artistry": ["council"],
```

---

### Step 3: Populate unspecified-low recommendations

**Category:** unspecified-low — "General tasks, low complexity, default for simple requests"

Recommended skill: **git-master** — Simple tasks often involve git operations

**Reasoning:** Low-complexity tasks are often file edits, renames, simple fixes. Git operations are common.

**Recommendation:** `["git-master"]`

---

**ACTION:** UPDATE  
**TARGET:** `.opencode/tools/delegate-task/category-skills-guide.ts:18`

**Current:**
```typescript
  "unspecified-low": [],
```

**Replace with:**
```typescript
  "unspecified-low": ["git-master"],
```

---

### Step 4: Populate unspecified-high recommendations

**Category:** unspecified-high — "Complex general tasks, cross-cutting concerns, high-stakes decisions"

Recommended skill: **code-review** — Thorough analysis for high-stakes work

**Reasoning:** High-complexity general tasks need thorough review. Code-review skill provides quality standards.

**Recommendation:** `["code-review"]`

---

**ACTION:** UPDATE  
**TARGET:** `.opencode/tools/delegate-task/category-skills-guide.ts:19`

**Current:**
```typescript
  "unspecified-high": [],
```

**Replace with:**
```typescript
  "unspecified-high": ["code-review"],
```

---

### Step 5: Populate writing recommendations

**Category:** writing — "Documentation, prose, technical writing"

Recommended skill: **planning-methodology** — Structured documentation planning

**Reasoning:** Writing tasks benefit from structured planning methodology. The planning skill provides organization frameworks.

**Alternative:** Could be empty since writing is self-contained. But planning-methodology helps structure documentation.

**Recommendation:** `["planning-methodology"]`

---

**ACTION:** UPDATE  
**TARGET:** `.opencode/tools/delegate-task/category-skills-guide.ts:20`

**Current:**
```typescript
  "writing": [],
```

**Replace with:**
```typescript
  "writing": ["planning-methodology"],
```

---

## Testing Strategy

### Unit Test

The existing test in `.opencode/tests/integration/category-routing.test.ts` verifies category routing.

### Manual Validation

After changes, verify:
- [ ] All 8 categories have recommendations
- [ ] Recommendations are valid skill names
- [ ] TypeScript compilation succeeds

---

## Validation Commands

| Level | Command | Expected |
|-------|---------|----------|
| L1 | `npx tsc --noEmit` | No type errors |

---

## Acceptance Criteria

### Implementation Criteria
- [ ] artistry: `["council"]`
- [ ] unspecified-low: `["git-master"]`
- [ ] unspecified-high: `["code-review"]`
- [ ] writing: `["planning-methodology"]`
- [ ] All skills referenced are valid (exist in project)
- [ ] TypeScript compilation succeeds

### Runtime Verification
- [ ] Skill recommendations load correctly
- [ ] getCategorySkillsDelegationGuide works for all categories

---

## Handoff Notes

After completing this task:
- All 8 categories now have skill recommendations
- Category-based dispatch can load appropriate skills
- Recommendations align with category purposes