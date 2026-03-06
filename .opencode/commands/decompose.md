---
description: Deep-research one infrastructure pillar and produce a spec file for /planning
model: gpt-5.3-codex
argument-hint: <pillar-name-or-number>
---

# Decompose: Research and Spec One Pillar

Deep-research a single infrastructure pillar — using PRD cross-referencing, dependency analysis,
and RAG (if available) — then produce a spec file that feeds `/planning`.

Run once per pillar, in dependency order (Pillar 0 first, then 1, then 2, etc.).

## Usage

```
/decompose <pillar-name-or-number>
```

`$ARGUMENTS` — Required: the pillar to decompose. Can be a number (`0`), a name slug
(`data-infrastructure`), or both (`0-data-infrastructure`).

Example: `/decompose 0` or `/decompose data-infrastructure` or `/decompose 0-data-infrastructure`

---

## Pipeline Position

```
/mvp → /prd → /pillars → /decompose {pillar-N} (this) → /planning → /execute → /commit → /pr
```

This is Step 4. Requires `PILLARS.md` (produced by `/pillars`). Processes ONE pillar per run.
Output: `.agents/specs/pillar-{N}-{name}.md` — feeds `/planning` for each spec in the pillar.

---

## Step 1: Read Inputs

1. Check `$ARGUMENTS`. If empty: stop and report:
   ```
   /decompose requires a pillar argument.
   Usage: /decompose <pillar-name-or-number>
   Example: /decompose 0 or /decompose data-infrastructure
   Run /pillars first to see the pillar list, then decompose each one.
   ```

2. Read `.agents/specs/PILLARS.md`.
   - If not found: stop — "No PILLARS.md found. Run `/pillars` first."
   - Find the pillar matching `$ARGUMENTS` (by number or name slug).
   - If no match: list available pillars from PILLARS.md and ask which to use.

3. Extract for the target pillar:
   - Scope (what's included)
   - Not included (boundary)
   - Depends on (prior pillars)
   - What this unlocks (for next pillar)
   - Gate criteria (what must pass before next pillar starts)

4. Look for a PRD file (`PRD.md`, `docs/PRD.md`, or `*-prd.md`).
   - If found: read sections relevant to this pillar's scope.
   - If not found: proceed with PILLARS.md only — note "PRD not available" in output.

5. Check if `.agents/specs/pillar-{N}-{name}.md` already exists.
   - If exists: present existing content and ask: "Pillar {N} was already decomposed.
     Overwrite, extend, or cancel? (overwrite / extend / cancel)"

---

## Step 2: Research the Pillar

Process these three research steps for the target pillar:

### 2a. RAG Knowledge Base (optional)

If a RAG knowledge base MCP is available:
- Search for architecture patterns relevant to this pillar's domain:
  - Example (Pillar 0, data): `rag_search_knowledge_base(query="database schema migrations")`
  - Example (Pillar 1, services): `rag_search_knowledge_base(query="service layer patterns")`
  - Example (Pillar 2, integration): `rag_search_knowledge_base(query="API integration auth")`
- Keep queries SHORT — 2-5 keywords. Longer queries degrade vector search quality.
- Read top results in full with `rag_read_full_page()` if available.
- Record findings for the Research Findings section of the output file.

If no RAG available: note "RAG not available — proceeding with PRD cross-ref + dependency analysis."

### 2b. PRD Cross-Reference (MANDATORY)

For each requirement in the PRD that falls within this pillar's scope:
- Identify which spec in the initial draft covers it.
- If a requirement has no covering spec: create one.
- Track coverage for the PRD Coverage Map table.

Cross-reference these PRD sections:
- Section 8a (Data Models) → typically Pillar 0 or 1
- Section 8b (Service Contracts) → typically Pillar 1 or 2
- Section 9 (API Spec) → typically Pillar 3
- Section 12 (Implementation Phases) → cross-reference which phase this pillar corresponds to

PRD requirements with no covering spec are GAPS — add a spec or flag for next pillar.

### 2c. Dependency Analysis (MANDATORY)

For each proposed spec in this pillar:
- Verify all `depends_on` targets exist in prior specs (within this pillar) or prior pillars.
- Verify no circular dependencies (spec A depends on spec B which depends on spec A).
- Verify spec order: dependencies must appear earlier in the list.

Cross-pillar check:
- Read the prior pillar's spec file (if it exists) to verify dependencies are met.
- Verify this pillar's output (what it provides) covers what the NEXT pillar needs.

---

## Step 3: Draft Spec List and Present for Approval

Based on research findings, draft the spec list for this pillar. Present to the user:

```
Pillar {N}: {Name}

Research summary:
  RAG: {hits found / not available}
  PRD coverage: {X}/{Y} requirements covered
  Dependency issues: {count or "none"}

Proposed specs:
  P{N}-01 {name} ({depth}) — {description}
  P{N}-02 {name} ({depth}) — {description}
  ...
  P{N}-GATE — gate criteria check (depends on all above)

PRD gaps found: {list or "none found"}
Dependency issues: {list or "none found"}

Approve this spec list? (yes / adjust: ...)
```

**HARD STOP** — Do NOT write the pillar file until the user approves the spec list.
If the user requests adjustments, update and re-present before writing.

Spec depth tags: `light` (simple file, single concern), `standard` (moderate complexity),
`heavy` (complex logic, multiple integrations, or significant design decisions).

---

## Step 4: Write Pillar Spec File

Write `.agents/specs/pillar-{N}-{name}.md`:

```markdown
# Pillar {N}: {Name}
<!-- Generated: {date} | Source: PRD.md + PILLARS.md | Research: {RAG / PRD cross-ref / deps} -->

## Pillar Context

- **Scope**: {from PILLARS.md — what's in this pillar}
- **Not included**: {from PILLARS.md — explicit boundaries}
- **Depends on**: {prior pillars or "none (first pillar)"}
- **What this unlocks**: {from PILLARS.md — what next pillar can do}
- **What breaks without it**: {from PILLARS.md — downstream impact}
- **Gate criteria**:
  - [ ] {criterion from PILLARS.md — measurable}
  - [ ] {criterion}

## Research Findings

### RAG / External Research
{Patterns or best practices found — with source references. If RAG unavailable: "Not available."}

### PRD Coverage
{Which PRD sections map to this pillar; which requirements drive the spec list}

### Dependency Analysis
{What prior pillars provide; what this pillar provides to next pillars; any issues found}

## Spec List

- [ ] `P{N}-01` **{spec-name}** ({depth}) — {description}
  - depends: none (first spec in pillar)
  - touches: {files or modules this spec creates/modifies}
  - enables: {what this spec unlocks for later specs}
  - acceptance: {measurable test — how to verify this spec is done}

- [ ] `P{N}-02` **{spec-name}** ({depth}) — {description}
  - depends: P{N}-01
  - touches: {files}
  - enables: {what this unlocks}
  - acceptance: {measurable test}

(continue for each spec)

- [ ] `P{N}-GATE` **pillar-{N}-gate** (light) — Run pillar gate criteria
  - depends: {list all spec IDs in this pillar, comma-separated}
  - acceptance: All gate criteria from PILLARS.md Pillar {N} pass

## PRD Coverage Map

| PRD Requirement | Spec | Notes |
|----------------|------|-------|
| {requirement from PRD} | P{N}-01 | |
| {requirement} | P{N}-02 | |
| {requirement with no spec} | MISSING | {action taken or flagged} |

Coverage: {X}/{Y} PRD requirements for this pillar
```

Create `.agents/specs/` directory if it doesn't exist.

---

## Step 5: Confirm and Advance

After writing the pillar file:

```
.agents/specs/pillar-{N}-{name}.md written.
Specs: {count} + gate | PRD coverage: {X}/{Y} | Depth: {L}L + {S}S + {H}H

Spec order for /planning:
  /planning P{N}-01    → {spec name}
  /planning P{N}-02    → {spec name}
  ...
  /planning P{N}-GATE  → gate criteria check

Next steps:
  This pillar: run /planning P{N}-01 to start implementation.
  After this pillar: run /decompose {next-pillar-name} to spec out Pillar {N+1}.
  (Run pillar gate before moving to next pillar)
```

---

## Notes

- **One pillar per session.** Deep research is more effective when scoped to one concern.
  Running all pillars in one session produces shallow research and spec lists.
- **PRD cross-reference is non-negotiable.** Every requirement in the PRD that belongs to
  this pillar must map to a spec. Uncovered requirements become missed features.
- **Dependency analysis prevents rework.** A spec that depends on something not yet built
  produces blocked implementation. Catch this before writing the spec file.
- **Gate spec is mandatory.** Every pillar ends with a gate spec. Without it, there is no
  clear signal that the pillar is done and the next one can start.
- **Re-decompose safely.** If a pillar file exists, the command asks before overwriting.
  Existing specs can be extended (add new specs) without losing previous work.
- **RAG is optional but valuable.** The two mandatory steps (PRD cross-ref + dependency analysis)
  ensure minimum quality without RAG. RAG adds domain-specific patterns and pitfalls.