# Task 4 of 4: Fix Stale `.agents/plans/` Path References in Auto-Loaded Sections

> **Feature**: `build-autonomous-readiness`
> **Brief Path**: `.agents/features/build-autonomous-readiness/task-4.md`
> **Plan Overview**: `.agents/features/build-autonomous-readiness/plan.md`

---

## OBJECTIVE

Update 3 stale path references in `sections/02_piv_loop.md` and `sections/04_git_save_points.md` from the old `.agents/plans/{feature}-plan.md` convention to the current `.agents/features/{feature}/plan.md` convention.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/sections/02_piv_loop.md` | UPDATE | 3 path references updated from `.agents/plans/` to `.agents/features/` |
| `.opencode/sections/04_git_save_points.md` | UPDATE | 1 path reference updated from `.agents/plans/` to `.agents/features/` |

**Out of Scope:**
- All other files — no `.agents/plans/` references exist outside these two sections
- Content or logic changes to either section — only path strings change
- Any other path conventions — only `.agents/plans/` → `.agents/features/` replacement

**Dependencies:**
- None — this task is independent of Tasks 1-3 (different files entirely)

**Justification for multi-file brief:**
These two files are tightly coupled (same convention fix, same root cause) and the total change is 4 line edits across 2 files. Splitting into 2 separate briefs would create two trivially thin briefs that couldn't reach the 700-line threshold independently. Combined, the inline context from both files provides sufficient depth.

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Tasks:**
- `.opencode/commands/build.md` (Task 1) — Step 5 brief-completion loop, Step 2 `--auto-approve`
- `.opencode/commands/planning.md` (Task 2) — `--auto-approve` flag and Phase 4 conditional
- `.opencode/commands/code-loop.md` (Task 3) — `--auto` flag and Minor handling

**State Carried Forward:**
- The canonical path convention is `.agents/features/{feature}/plan.md` (confirmed by AGENTS.md, all command files, and all runtime artifacts)
- The old convention `.agents/plans/{feature}-plan.md` only persists in these two auto-loaded sections
- These sections are loaded into EVERY session context (they're in `.opencode/sections/` which is auto-loaded)

**Known Issues or Deferred Items:**
- None from prior tasks

---

## CONTEXT REFERENCES

### File: `.opencode/sections/02_piv_loop.md` — Full file (32 lines)

This is the complete current content of the file:

```markdown
```
PLAN → IMPLEMENT → VALIDATE → (iterate)
```

### Granularity Principle

Multiple small PIV loops — one feature slice per loop, built completely before moving on.
Complex features (15+ tasks, 4+ phases): `/planning` auto-decomposes into sub-plans.

### Planning (Layer 1 + Layer 2)

**Layer 1 — Project Planning** (done once):
- PRD (what to build), CLAUDE.md (how to build), reference guides (on-demand)

**Layer 2 — Task Planning** (done for every feature):
1. **Vibe Planning** — casual conversation to explore ideas, ask questions, research codebase. See: `templates/VIBE-PLANNING-GUIDE.md`
2. **Structured Plan** — turn conversation into a markdown document
   - Use template: `templates/STRUCTURED-PLAN-TEMPLATE.md`
   - Save to: `.agents/plans/{feature}-plan.md`
   - Apply the 4 pillars of Context Engineering (see `sections/03_context_engineering.md` for pillar → plan mapping)

**Do NOT** take your PRD and use it as a structured plan. Break it into granular Layer 2 plans — one per PIV loop.

### Implementation
- Fresh conversation → `/execute .agents/plans/{feature}-plan.md`
- Trust but verify
- Never execute implementation work without a `/planning` artifact in `.agents/plans/`

### Validation
- AI: tests + linting. Human: code review + manual testing.
- 5-level pyramid: Syntax → Types → Unit → Integration → Human. See `reference/validation-discipline.md`.
- Small issues → fix prompts. Major issues → revert to save point, tweak plan, retry.
```

**Stale references on lines 19, 25, and 27:**
- Line 19: `Save to: .agents/plans/{feature}-plan.md`
- Line 25: `/execute .agents/plans/{feature}-plan.md`
- Line 27: `without a /planning artifact in .agents/plans/`

### File: `.opencode/sections/04_git_save_points.md` — Full file (8 lines)

This is the complete current content of the file:

```markdown
**Before implementation**, commit the plan:
```
git add .agents/plans/{feature}-plan.md && git commit -m "plan: {feature} structured plan"
```

**If implementation fails**: `git stash` → tweak plan → retry.

**NEVER include `Co-Authored-By` lines in commits.** Commits are authored solely by the user.
```

**Stale reference on line 3:**
- Line 3: `git add .agents/plans/{feature}-plan.md`

### Reference: AGENTS.md — Canonical path convention

From AGENTS.md, the canonical artifact structure:

```markdown
### Dynamic Content (`.agents/`)
All generated/dynamic content lives at project root:
- `.agents/features/{name}/` — All artifacts for one feature (plan, report, review, loop reports)
  - `plan.md` / `plan.done.md` — Feature plan overview + task index
  - `task-{N}.md` / `task-{N}.done.md` — Task briefs
```

The correct paths are:
- Plan: `.agents/features/{feature}/plan.md`
- Execute: `/execute .agents/features/{feature}/plan.md`
- Artifact directory: `.agents/features/{feature}/`

### Reference: All command files use current convention

Every command file already uses the current convention:
- `build.md:173`: `Save to: .agents/features/{spec-name}/plan.md`
- `planning.md:325`: `.agents/features/{feature}/plan.md`
- `execute.md`: `$ARGUMENTS` is a path under `.agents/features/`
- `code-loop.md:181`: `.agents/features/{feature}/review-{N}.md`
- `commit.md`: reads `.agents/features/*/report.md`
- `prime.md`: scans `.agents/features/*/`

The sections are the ONLY files still using the old convention.

---

## PATTERNS TO FOLLOW

### Pattern: Current path convention (from AGENTS.md and all commands)

```
.agents/features/{feature}/plan.md         ← plan file
.agents/features/{feature}/task-{N}.md     ← task briefs
.agents/features/{feature}/report.md       ← execution report
.agents/features/{feature}/review.md       ← code review
```

The old convention was:
```
.agents/plans/{feature}-plan.md            ← plan file (flat directory, hyphenated name)
```

Key differences:
1. Directory: `.agents/plans/` → `.agents/features/{feature}/`
2. File name: `{feature}-plan.md` → `plan.md` (feature name is the directory, not the file prefix)
3. Structure: flat → nested (all artifacts for a feature live in one directory)

### Pattern: Git commit path in section 04

The git command also needs updating. Current convention from `/build` Step 4:

```bash
git add .agents/features/{spec-name}/plan.md .agents/features/{spec-name}/task-*.md
git commit -m "plan({spec-name}): structured implementation plan + {N} task briefs"
```

Section 04 should match this pattern (though simplified since it's a general-purpose section, not build-specific).

---

## STEP-BY-STEP TASKS

### Step 1: Update `sections/02_piv_loop.md` — Line 19 (Save to path)

**IMPLEMENT:**

In `.opencode/sections/02_piv_loop.md`, find line 19:

**Current:**
```markdown
   - Save to: `.agents/plans/{feature}-plan.md`
```

**Replace with:**
```markdown
   - Save to: `.agents/features/{feature}/plan.md`
```

**PATTERN:** Matches AGENTS.md and all command files.

**GOTCHA:** None — straightforward path replacement.

**VALIDATE:** Read line 19 and confirm the path is `.agents/features/{feature}/plan.md`.

### Step 2: Update `sections/02_piv_loop.md` — Line 25 (Execute path)

**IMPLEMENT:**

In `.opencode/sections/02_piv_loop.md`, find line 25:

**Current:**
```markdown
- Fresh conversation → `/execute .agents/plans/{feature}-plan.md`
```

**Replace with:**
```markdown
- Fresh conversation → `/execute .agents/features/{feature}/plan.md`
```

**PATTERN:** Matches the `/execute` command's expected input format.

**GOTCHA:** None — straightforward path replacement.

**VALIDATE:** Read line 25 and confirm the path is `.agents/features/{feature}/plan.md`.

### Step 3: Update `sections/02_piv_loop.md` — Line 27 (Artifact directory reference)

**IMPLEMENT:**

In `.opencode/sections/02_piv_loop.md`, find line 27:

**Current:**
```markdown
- Never execute implementation work without a `/planning` artifact in `.agents/plans/`
```

**Replace with:**
```markdown
- Never execute implementation work without a `/planning` artifact in `.agents/features/`
```

**PATTERN:** Matches the canonical artifact directory from AGENTS.md.

**GOTCHA:** None — straightforward path replacement.

**VALIDATE:** Read line 27 and confirm the path is `.agents/features/`.

### Step 4: Update `sections/04_git_save_points.md` — Line 3 (Git add path)

**IMPLEMENT:**

In `.opencode/sections/04_git_save_points.md`, find line 3:

**Current:**
```markdown
git add .agents/plans/{feature}-plan.md && git commit -m "plan: {feature} structured plan"
```

**Replace with:**
```markdown
git add .agents/features/{feature}/plan.md && git commit -m "plan: {feature} structured plan"
```

**PATTERN:** Matches `/build` Step 4's git command structure.

**GOTCHA:** Only the `git add` path changes. The commit message format stays the same — it's already correct.

**VALIDATE:** Read line 3 and confirm the path is `.agents/features/{feature}/plan.md`.

### Step 5: Verify no remaining `.agents/plans/` references

**IMPLEMENT:**

After all 4 edits, grep across all files in `.opencode/sections/` for `.agents/plans/`:

```bash
grep -r ".agents/plans/" .opencode/sections/
```

Expected result: 0 matches.

Also grep across the entire `.opencode/` directory for completeness:

```bash
grep -r ".agents/plans/" .opencode/
```

Expected result: 0 matches (all command files already use the current convention).

**VALIDATE:** Both grep commands return 0 matches.

---

## TESTING STRATEGY

### Structural Verification
- Read both files in full after edits
- Verify all 4 path references now use `.agents/features/{feature}/plan.md`
- Verify no other content was changed (only path strings)

### Edge Cases
- None — this is a pure find-and-replace with no logic changes

### Cross-File Consistency
- Section 02 paths match AGENTS.md, all command files, and section 04
- Section 04 git command path matches `/build` Step 4
- No remaining `.agents/plans/` references anywhere in the system

---

## VALIDATION COMMANDS

- **L1**: N/A — Markdown files
- **L2**: Read both files in full and verify paths
- **L3**: `grep -r ".agents/plans/" .opencode/sections/` — should return 0 matches
- **L3**: `grep -r ".agents/plans/" .opencode/` — should return 0 matches
- **L4**: N/A — no runtime behavior to test
- **L5**: Human review

---

## ACCEPTANCE CRITERIA

### Implementation
- [ ] `sections/02_piv_loop.md` line 19: `.agents/features/{feature}/plan.md`
- [ ] `sections/02_piv_loop.md` line 25: `.agents/features/{feature}/plan.md`
- [ ] `sections/02_piv_loop.md` line 27: `.agents/features/`
- [ ] `sections/04_git_save_points.md` line 3: `.agents/features/{feature}/plan.md`
- [ ] No remaining `.agents/plans/` references in `.opencode/sections/`
- [ ] No remaining `.agents/plans/` references in `.opencode/` (entire directory)
- [ ] No content changes beyond path strings (logic, formatting, wording unchanged)

### Runtime
- [ ] Agents reading auto-loaded sections see the correct path convention
- [ ] `/execute` path in section 02 matches the actual command's expected input format

---

## COMPLETION CHECKLIST

- [ ] Section 02 line 19 updated
- [ ] Section 02 line 25 updated
- [ ] Section 02 line 27 updated
- [ ] Section 04 line 3 updated
- [ ] Grep verification: 0 matches for `.agents/plans/`
- [ ] Both files are valid Markdown
- [ ] No unintended content changes
