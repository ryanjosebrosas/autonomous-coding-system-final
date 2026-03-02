---
description: Deep-research each pillar and produce per-pillar spec files with dependency-sorted build order
---

# Decompose: PRD → Researched Build Roadmap

The most important step in the pipeline. This command deeply researches each infrastructure pillar —
using RAG, multi-model validation, PRD cross-referencing, and dependency analysis — before producing
a spec list. The output is a set of per-pillar files that serve as the researched roadmap for the
entire project. A poorly researched roadmap wastes entire build cycles. This step prevents that.

## Usage

```
/decompose [focus area]
```

`$ARGUMENTS` — Optional: focus on a specific capability or re-decompose a section.

---

## Pipeline Position

```
/mvp (big idea) → /prd (full spec) → /pillars (layers) → /decompose (build order) → /build next → /ship
```

This is Step 4. Requires a PRD document to exist (produced by `/prd`). Falls back to `mvp.md` if no PRD found. PILLARS.md is now **required** — run `/pillars` first.

---

## Step 1: Read Inputs

1. Look for a PRD file (e.g., `PRD.md`, `docs/PRD.md`, or any file matching `*-prd.md`). This is the primary input — it contains detailed product requirements, user stories, and success criteria.
2. If no PRD found, fall back to `mvp.md`. If neither exists, report: "No PRD or mvp.md found. Run `/prd` first (or `/mvp` for a quick vision doc)." and stop.
3. Also read `mvp.md` if it exists alongside the PRD — it provides high-level vision context.
4. Read `.agents/specs/PILLARS.md`.
5. If no PILLARS.md found, stop and report: "No PILLARS.md found. Run `/pillars` first.
   /decompose requires pillar definitions to structure its research."
   Note: PILLARS.md is now REQUIRED, not optional. /decompose without pillars produces
   a flat, unresearched spec list — which defeats the purpose.

Extract the Core Capabilities / Feature Requirements — these become the high-level groupings for specs.

---

## Step 2: Research & Decompose Each Pillar

Process pillars sequentially — Pillar 0 first, then 1, then 2, etc.
Findings from earlier pillars inform later ones.

For EACH pillar in PILLARS.md:

### 2a. Gather Pillar Context

Read from PILLARS.md:
- Scope (what's included)
- Not included (boundary)
- What this unlocks
- What breaks without it
- Gate criteria
- Dependencies on prior pillars

Read from PRD:
- All sections relevant to this pillar's scope
- Data models (Section 8a) that belong to this pillar
- Service contracts (Section 8b) that belong to this pillar
- API endpoints (Section 9) that belong to this pillar

### 2b. Deep Research (per pillar)

Run these research steps for the current pillar:

**RAG Knowledge Base** (if available):
- Search for architecture patterns relevant to this pillar's domain
  - Example: Pillar 0 (data) → search "database schema design", "migration patterns"
  - Example: Pillar 1 (services) → search "service layer patterns", "business logic"
- Search for best practices in the chosen tech stack for this pillar's concerns
- Read full pages of top results for detailed context
- Keep queries SHORT (2-5 keywords) for best vector search results

**Multi-Model Validation** (if dispatch/council available):
- Dispatch the pillar scope + PRD requirements to council:
  "Given this pillar scope and these PRD requirements, what specs are needed?
   What are we likely to miss? What's the right dependency order?"
- Use the council critique to identify gaps in the initial spec list
- This is the "what are we missing?" check — the most valuable research step

**PRD Cross-Reference** (mandatory):
- For each requirement in the PRD that falls within this pillar's scope:
  - Verify at least one spec covers it
  - If a requirement has no covering spec, create one
- Track coverage: "PRD Section 8a: 4/4 data models covered by specs"
- Flag any PRD requirements that span multiple pillars (cross-cutting)

**Dependency Analysis** (mandatory):
- For each proposed spec in this pillar:
  - Verify all `depends_on` targets exist and are in an earlier or same pillar
  - Verify no circular dependencies
  - Verify `touches` doesn't conflict with specs in the same pillar
- Check that this pillar's specs provide everything the NEXT pillar needs
  - Read next pillar's scope from PILLARS.md
  - Verify the foundation is complete

### 2c. Draft Spec List

Based on research findings, draft the spec list for this pillar:
- Each spec must be atomic, testable, dependency-aware
- Assign complexity tags (light/standard/heavy)
- Add `enables:` field for each spec
- Number specs within the pillar: P{N}-01, P{N}-02, etc.

### 2d. Present Pillar for Approval

Present the researched pillar to the user:

```
Pillar {N}: {Name}
Research: {RAG hits used} | {council feedback summary} | PRD coverage: {X}/{Y}

Specs:
  P{N}-01 {name} ({depth}) — {description}
  P{N}-02 {name} ({depth}) — {description}
  ...
  P{N}-GATE — gate criteria check

Dependencies verified: {yes/no — issues if any}
PRD gaps found: {list or "none"}

Approve this pillar? (yes / adjust: ...)
```

Wait for approval before writing the pillar file. Adjust if requested.

### 2e. Write Per-Pillar File

Write `.agents/specs/pillar-{N}-{name}.md`:

```markdown
# Pillar {N}: {Name}
<!-- Generated: {date} | Source: PRD.md + PILLARS.md | Research: RAG + Council + PRD cross-ref -->

## Pillar Context

- **Scope**: {from PILLARS.md}
- **Not included**: {from PILLARS.md}
- **Depends on**: {prior pillars}
- **What this unlocks**: {from PILLARS.md}
- **What breaks without it**: {from PILLARS.md}
- **Gate criteria**:
  - [ ] {from PILLARS.md}
  - [ ] {from PILLARS.md}

## Research Findings

### RAG References
- {source}: {what was found and how it informs the specs}
- {source}: {finding}
(or "No RAG available — specs derived from PRD analysis only")

### Council/Dispatch Feedback
- {model}: {key insight or gap identified}
- {model}: {recommendation}
(or "No dispatch available — single-model analysis")

### PRD Coverage
| PRD Section | Requirement | Covering Spec | Status |
|------------|-------------|---------------|--------|
| 8a | {data model} | P{N}-01 | covered |
| 8b | {service} | P{N}-03 | covered |
| 9 | {endpoint} | — | GAP — added P{N}-05 |

### Dependency Verification
- All `depends_on` targets verified: {yes/no}
- Cross-pillar dependencies: {list or "none"}
- Next pillar readiness: {what Pillar N+1 needs from this pillar — verified}

## Spec List

Status: 0/{total} complete

- [ ] `P{N}-01` **{spec-name}** ({depth}) — {description}
  - depends: {spec IDs}
  - touches: {files}
  - enables: {what later specs depend on this}
  - acceptance: {test}

- [ ] `P{N}-02` **{spec-name}** ({depth}) — {description}
  - depends: P{N}-01
  - touches: {files}
  - enables: {what this unlocks}
  - acceptance: {test}

...

- [ ] `P{N}-GATE` **pillar-{N}-gate** (light) — Run gate criteria
  - depends: all specs in this pillar
  - acceptance: All gate criteria pass
```

### 2f. Move to Next Pillar

After pillar file is approved and written:
- Report: "Pillar {N} decomposed: {count} specs. Moving to Pillar {N+1}."
- Use findings from this pillar as context for the next
- Repeat from Step 2a for the next pillar

---

## Step 3: Write BUILD_ORDER.md (Index)

After all pillar files are written, create the BUILD_ORDER.md as the overview index.
This file is what `/build`, `/ship`, and `/sync` read. It must contain the full spec list
in the existing format — but now it references per-pillar files for detailed context.

`.agents/specs/BUILD_ORDER.md`:

```markdown
# Build Order — {Project Name}

Generated: {date} | Pillars: {N} | Status: 0/{total} complete
Pillar files: .agents/specs/pillar-{N}-{name}.md

## Pillar 0: {Name}
<!-- Detail: .agents/specs/pillar-0-{name}.md -->

> {narrative from pillar file}

- [ ] `P0-01` **{name}** ({depth}) — {description}
  - depends: none
  - touches: {files}
  - enables: {what this unlocks}
  - acceptance: {test}

- [ ] `P0-GATE` **pillar-0-gate** (light) — Gate criteria check
  - depends: P0-01, P0-02, ...
  - acceptance: All gate criteria from PILLARS.md Pillar 0 pass

## Pillar 1: {Name}
<!-- Detail: .agents/specs/pillar-1-{name}.md -->

> {narrative}

- [ ] `P1-01` **{name}** ({depth}) — {description}
  ...

(repeat for all pillars)
```

The BUILD_ORDER.md contains the same spec entries as the pillar files — it's the
flattened, machine-readable view. The pillar files add research context and PRD coverage.

---

## Step 4: Final Validation

After all pillar files and BUILD_ORDER.md are written:

1. **PRD completeness check**: Every requirement in the PRD must be covered by at
   least one spec across all pillars. Report coverage percentage.

2. **Dependency graph validation**: Run full cycle detection across ALL specs
   (cross-pillar). Flag any issues.

3. **Gate chain verification**: Verify that each pillar's gate depends on all specs
   in that pillar, and that cross-pillar dependencies are satisfied before gates.

4. **Present final summary**:

```
Build Roadmap: {N} specs across {P} pillars

Pillar 0 ({Name}):  {count} specs + gate
  → {narrative}
  → PRD coverage: {X}/{Y} requirements
Pillar 1 ({Name}):  {count} specs + gate
  → {narrative}
  → PRD coverage: {X}/{Y} requirements
...

Total PRD coverage: {total covered}/{total requirements} ({pct}%)
Dependency issues: {count or "none"}
Estimated effort: {light}L + {standard}S + {heavy}H + {P} gates

Pillar files written:
  .agents/specs/pillar-0-{name}.md
  .agents/specs/pillar-1-{name}.md
  ...
Index written:
  .agents/specs/BUILD_ORDER.md

Next: /build next — or /planning P0-01 for manual planning.
Run /build next to begin implementation.
```

---

## Step 5: Council Validation (Optional)

If the project has >10 specs or complex dependencies, suggest running a council:

```
This decomposition has {N} specs with complex dependencies.
Run /council to get multi-model validation? [y/n]
```

If yes, dispatch BUILD_ORDER.md to `/council` for critique. This is even more valuable now
because it validates the RESEARCHED roadmap, not just a quick list.

---

## Re-Decompose (Mid-Project)

`/decompose` can be re-run at any time. When re-running:

1. Read existing `.agents/specs/BUILD_ORDER.md`
2. Read existing per-pillar files in `.agents/specs/pillar-*.md`
3. Preserve completed pillar files (all specs `[x]`) — do not re-research these
4. Re-research only incomplete pillars (run full Step 2 flow for those pillars)
5. Update BUILD_ORDER.md index to reflect re-decomposed pillars
6. Ask human to confirm changes before overwriting any existing pillar file

---

## Research Degradation Behavior

When research tools are unavailable, each step degrades gracefully:

| Research Step | Available | Degraded |
|---------------|-----------|----------|
| RAG Knowledge Base | Search for domain patterns, read full pages | Skip — note "No RAG available" in pillar file |
| Council/Dispatch | Multi-model gap detection | Skip — note "Single-model analysis" in pillar file, self-review for gaps |
| PRD Cross-Reference | Always available | Always runs — this is mandatory, no degradation |
| Dependency Analysis | Always available | Always runs — this is mandatory, no degradation |

The two mandatory steps (PRD cross-ref + dependency analysis) ensure minimum quality even without RAG or council. The two optional steps (RAG + council) add depth when available.

---

## Spec ID Numbering Convention

Specs use pillar-prefixed IDs for clarity:

| Pattern | Example | Meaning |
|---------|---------|---------|
| `P{N}-{NN}` | `P0-01` | Pillar 0, spec 01 |
| `P{N}-GATE` | `P0-GATE` | Pillar 0 gate check |

This replaces the flat sequential numbering (`01`, `02`, `03`...) from the old BUILD_ORDER format.
Benefits:
- Immediately clear which pillar a spec belongs to
- `/planning` can extract pillar number from spec ID to load the right pillar file
- Re-decomposing a single pillar doesn't renumber specs in other pillars

Backward compatibility: `/build` parses spec entries by the `- [ ]` format and the `**name**` field, not by the number format. Pillar-prefixed IDs work with the existing parser.

---

## Per-Pillar File Lifecycle

```
/decompose creates:    .agents/specs/pillar-0-data.md     (status: 0/3 complete)
/planning reads:       .agents/specs/pillar-0-data.md     (context for P0-01 plan)
/build updates:        .agents/specs/pillar-0-data.md     (marks P0-01 as [x])
/build updates:        .agents/specs/BUILD_ORDER.md       (marks P0-01 as [x])
/sync validates:       .agents/specs/pillar-0-data.md     (verifies code matches specs)
/ship archives:        .agents/specs/pillar-0-data.md     (renamed to .done.md)
```

Both BUILD_ORDER.md and the pillar file track completion — they stay in sync via `/build` Step 9 (Update State).

---

## Notes

- **This is the most important step in the pipeline.** A poorly researched roadmap wastes entire
  build cycles. Invest the time here.
- **Research per pillar, not per project.** Generic project-wide research produces generic specs.
  Pillar-scoped research produces precise specs.
- **Sequential pillar processing matters.** Pillar 0 findings (data models, config patterns)
  directly inform Pillar 1 specs (services that use those models). Don't skip ahead.
- **PRD cross-reference is non-negotiable.** Every PRD requirement must map to a spec.
  Uncovered requirements are discovered too late during /build.
- **Council/dispatch for gap detection.** The most valuable research question is:
  "What are we missing?" — not "What should we build?" The PRD tells you what.
  Research tells you what the PRD forgot.
- **Per-pillar files are the scoped context for /planning.** When /planning runs for spec P0-03,
  it reads pillar-0-data.md — not the entire BUILD_ORDER. This keeps context focused.
- **BUILD_ORDER.md is the machine-readable index.** /build, /ship, /sync read this file.
  Per-pillar files are the human-readable + AI-readable research context.
- Keep specs small — if one feels too big, split it
- `depends_on` should reference spec IDs (P0-01, P1-03), not names
- `enables:` is the forward graph — what you're unlocking for later specs
- Pillar numbering starts at 0. Pillar 0 is always the foundation.
- PILLARS.md is now required (not optional). Run /pillars first.
