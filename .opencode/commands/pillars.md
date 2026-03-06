---
description: Analyze PRD and identify infrastructure pillars with dependency order and gate criteria
model: openai/gpt-5.3-codex
argument-hint: [focus area or pillar name]
---

# Pillars: Infrastructure Layer Analysis

Analyze the PRD and identify the fundamental infrastructure layers (pillars) that must be built
in order. Each pillar is a coherent phase of work with clear gate criteria that must pass before
the next pillar begins. Produces `.agents/specs/PILLARS.md`.

## Usage

```
/pillars [focus area or pillar to re-analyze]
```

`$ARGUMENTS` — Optional: focus on a specific area, or name a pillar to re-analyze mid-project.

---

## Pipeline Position

```
/mvp (big idea) → /prd (full spec) → /pillars (layers) → /decompose {pillar-N} (per-pillar spec) → /planning → /execute → /commit → /pr
```

This is Step 3. Requires `PRD.md` (produced by `/prd`). Output feeds `/decompose`, which specs
out one pillar per session.

---

## Step 1: Read Inputs

1. Look for a PRD file (`PRD.md`, `docs/PRD.md`, or any file matching `*-prd.md`).
   - If no PRD found: stop and report "No PRD found. Run `/prd` first." Do not proceed.
2. Read `mvp.md` if present — provides high-level vision and priority signals.
3. Scan the codebase for existing infrastructure:
   - Check `.agents/specs/PILLARS.md` if it exists — preserve completed pillar status on re-run.
   - Check `.agents/specs/pillar-*.md` — note which pillars are already fully decomposed.
   - Scan top-level directories to understand what already exists in the codebase.

Extract from the PRD:
- Core capabilities and feature groups
- Technical architecture decisions
- Integration points and dependencies
- Implementation phases (Section 12)
- Data models (Section 8a) — used to define Pillar 0 scope
- Service contracts (Section 8b) — used to define later pillar scope

**If `$ARGUMENTS` is provided**: Focus re-analysis on the named pillar or area.
All other pillars retain their current status unchanged.

---

## Step 2: Propose Pillar Structure

Analyze the PRD and propose infrastructure pillars. Each pillar must be:

- **Cohesive** — a single infrastructure concern (data, services, API, etc.)
- **Sequential** — later pillars genuinely depend on earlier ones
- **Scoped** — 1-2 weeks of focused work, roughly 3-8 specs per pillar
- **Gated** — has concrete pass/fail criteria before the next pillar starts

### Pillar 0 Rule (MANDATORY)

**Pillar 0 is ALWAYS the data/infrastructure foundation. No project skips this.**

- For database-backed projects: schema, storage, core models, migrations, connection setup
- For service/API projects: config, core types, shared contracts, project scaffold
- For CLI/tool projects: config, core types, input/output contracts
- For "no database" projects: Pillar 0 is still config + core types + project scaffold

If the PRD doesn't explicitly call out a data layer, create one from the data models in
PRD Section 8. If no data models exist, Pillar 0 is: scaffold + config + core types.

### Typical Pillar Order

Adapt to the PRD — don't force this structure:

| Layer | Example Pillar Name | What It Establishes |
|-------|--------------------|--------------------|
| 0 | Data Infrastructure (required) | Schema, storage, core models, config |
| 1 | Core Services | Business logic, processing pipelines |
| 2 | Integration Layer | External APIs, auth, cross-cutting concerns |
| 3 | Interface Layer | API endpoints, CLI, UI components |
| 4 | Observability | Logging, metrics, monitoring |

**Pillar count:** Let the PRD dictate. Typically 4-7 for a medium project.
Do not add pillars that aren't warranted by the PRD.

---

## Step 3: Present Pillars for Approval

Present the proposed pillars to the user as a structured summary:

```
Infrastructure Pillars: {N} pillars identified

Pillar 0 ({Name}): {brief description} — ~{N} specs
  → Enables: {what Pillar 1 can do}
Pillar 1 ({Name}): {brief description} — ~{N} specs
  → Enables: {what Pillar 2 can do}
Pillar 2 ({Name}): {brief description} — ~{N} specs
  → Enables: {what Pillar 3 can do}
...

Dependency order: 0 → 1 → 2 → ...

Key gate criteria:
- Pillar 0: {1-2 key gate criteria}
- Pillar 1: {1-2 key gate criteria}

Approve this pillar structure? (yes / adjust: ...)
```

**HARD STOP** — Do NOT write PILLARS.md until the user explicitly approves the structure.
If the user asks to adjust pillar scope or order, update and re-present before proceeding.

---

## Step 4: Write PILLARS.md

Write `.agents/specs/PILLARS.md`:

```markdown
# Infrastructure Pillars — {Project Name}
<!-- Generated: {date} | Source: PRD.md | Pillars: {N} -->

## Pillar 0: {Name}

**Scope**: {what's in this pillar — specific, not abstract}
**Not included**: {what's explicitly out of scope for this pillar}
**Depends on**: nothing (first pillar)
**What this unlocks**: {what Pillar 1 can do because Pillar 0 exists}
**What breaks without it**: {what can't be built if Pillar 0 is missing}
**Gate criteria**:
- [ ] {measurable pass/fail criterion — not "works" but "all migrations run without errors"}
- [ ] {measurable criterion}

## Pillar 1: {Name}

**Scope**: {what's in this pillar}
**Not included**: {exclusions}
**Depends on**: Pillar 0 ({specific dependency — exactly what it needs from Pillar 0})
**What this unlocks**: {what Pillar 2 can do}
**What breaks without it**: {what can't be built}
**Gate criteria**:
- [ ] {criterion}
- [ ] {criterion}

(repeat for each pillar)
```

**Re-run behavior**: If PILLARS.md already exists:
- Read existing content
- Preserve any pillars where `.agents/specs/pillar-N-{name}.md` exists and is fully complete
- Re-analyze and overwrite only incomplete pillars (or all if re-running from scratch)
- Do NOT overwrite completed pillar sections without explicit user confirmation

---

## Step 5: Confirm and Advance

After writing PILLARS.md:

```
PILLARS.md written to: .agents/specs/PILLARS.md
Pillars identified: {N}
Total estimated specs: ~{M} (across all pillars)

Pillar overview:
  Pillar 0 ({Name}): {brief} — start here
  Pillar 1 ({Name}): {brief} — after Pillar 0 gate passes
  ...

Next: /decompose {pillar-0-name} — research and spec out the first pillar.
/decompose processes one pillar per session and outputs .agents/specs/pillar-0-{name}.md
which feeds /planning.

Run /decompose {name of Pillar 0} to continue.
```

---

## Notes

- **Pillar 0 is non-negotiable.** If someone argues it's unnecessary, the project doesn't have
  a clear foundation — that's the argument for Pillar 0, not against it.
- **Gate criteria must be concrete.** "Everything works" is not a gate criterion.
  "All database migrations run without errors and 3/3 core model unit tests pass" is.
- **Pillar count from the PRD, not intuition.** Count the distinct infrastructure concerns
  in the PRD's implementation phases and architecture section.
- **Re-runs are safe.** PILLARS.md can be regenerated at any time. Completed pillar files
  are preserved; only incomplete pillars are re-analyzed.
- **$ARGUMENTS focus mode**: If a pillar name is given, re-analyze only that pillar.
  Use this when a pillar's scope needs adjusting mid-project without touching others.