# Task 4 — Interactive Command Frontmatter Cleanup

## Task Metadata
- Feature: strict-orchestrator
- Wave: 2
- Depends on: Task 1
- Objective: Remove command-level `model:` routing from interactive commands so session model (Opus) handles them.

## Objective
Remove only the `model:` frontmatter line from these files:
- `.opencode/commands/mvp.md`
- `.opencode/commands/prd.md`
- `.opencode/commands/pillars.md`
- `.opencode/commands/decompose.md`
- `.opencode/commands/planning.md`
- `.opencode/commands/council.md`
- `.opencode/commands/final-review.md`

`description:` must remain. Command body must be byte-for-byte unchanged.

## Current Content Baseline (Inline)
### Current File: `.opencode/commands/mvp.md`

````text
---
description: Define or refine the product MVP vision through interactive big-idea discovery
model: anthropic/claude-opus-4-6
---

# MVP: Big Idea Discovery

The entry point to everything. Before a single line of code is written, the idea must be sharp. This command runs a Socratic discovery conversation to extract, pressure-test, and articulate the big idea — then produces `mvp.md` as the compass for the entire build pipeline.

## Usage

```
/mvp [topic or direction]
```

`$ARGUMENTS` — Optional: a rough idea, product name, or direction to start from.

---

## Pipeline Position

```
/mvp (big idea) → /prd (full spec) → /planning (feature plan) → /execute → /code-review → /commit → /pr
```

This is Step 1. Nothing else starts without a clear `mvp.md`.

---

## Step 1: Check Existing MVP

Check if `mvp.md` exists at the project root.

**If exists:**
1. Read `mvp.md` fully.
2. Present a crisp summary:
   ```
   Existing MVP found:
   - Product: {name}
   - Big Idea: {2 sentences}
   - Core Capabilities: {list}
   - Tech Direction: {stack or "not set"}
   - Status: {MVP Done When — how many checked?}
   ```
3. Ask: "Is this still the direction, or do you want to revise?"
4. If satisfied → skip to Step 4 (confirm and done).
5. If revising → continue to Step 2 with the existing content as context.

**If doesn't exist:**
Continue to Step 2.

---

## Step 2: Big Idea Discovery (Interactive)

This is the most important step. The goal is not to fill a form — it is to pressure-test the idea until it is clear, honest, and buildable.

### Phase A: Extract the Core Idea

Start with one open question. Do NOT ask a list of questions upfront.

```
What are you building?
```

Listen to the answer. Then respond with one of:
- **Restate + challenge**: "So you're building X. What makes that different from Y that already exists?"
- **Dig deeper**: "Who specifically is the person who needs this? What are they doing right now instead?"
- **Scope probe**: "When you say 'done', what does the first working version look like?"

**Rules for this phase:**
- Ask ONE question at a time. Never fire a list.
- Each question must respond to what the user just said — not a pre-written script.
- Push back if the idea is vague: "That's broad — can you give me a concrete scenario where this gets used?"
- Push back if the scope is too large: "That sounds like 6 months of work. What's the smallest version that proves the idea?"
- Keep going until you can answer all three of these yourself:
  1. What does this build?
  2. Who uses it and why?
  3. What is the first working version?

### Phase B: Capture Tech Direction

Once the product idea is clear, shift to tech direction. This feeds directly into `/prd`.

Ask:
```
What's your tech direction? (language, framework, stack — or "not sure yet")
```

If they have a direction: capture it. Don't challenge it unless it's clearly wrong for the use case.
If they say "not sure": ask one follow-up — "What environment does this run in? (web app, CLI tool, API service, mobile app, etc.)"

Capture:
- Preferred language/framework (or "undecided")
- Runtime environment (web, API, CLI, desktop, mobile, embedded)
- Any known constraints (existing codebase, hosting requirements, team familiarity)

### Phase C: Scope Gate

Before writing anything, present your synthesis and ask for a hard confirmation:

```
Here's what I've heard:

Big Idea: {one sentence — what it does and why it matters}
User: {who uses it}
Core Problem: {the pain it solves}
First Version: {what "done" looks like concretely}
Tech Direction: {stack or "undecided"}

Does this capture it? (yes / adjust: ...)
```

**HARD STOP** — Do NOT write `mvp.md` until the user explicitly confirms. "Close enough"
is not confirmation. If the user is vague, re-present the synthesis and ask again.
Incorporate corrections and re-present until you have an unambiguous "yes".

---

## Step 3: Write mvp.md

Write `mvp.md` at the project root:

```markdown
# {Product Name}

## Big Idea

{2-3 sentences: what it is, who it's for, what problem it solves, what makes it different.
This should be precise enough to read to a developer and have them understand what to build.}

## Users and Problems

- **Primary user**: {who — be specific, not "developers" but "solo developers building SaaS tools"}
- **Problem 1**: {concrete pain point with a real scenario}
- **Problem 2**: {concrete pain point}
- **Problem 3**: {optional — only add if genuinely distinct}

## Core Capabilities

These are the building blocks. Each one becomes one or more features in /planning.

1. {Capability — one line, verb-first: "Store and retrieve..."}
2. {Capability}
3. {Capability}
4. {Capability}
5. {Optional — 4-6 capabilities is the right range for an MVP}

## Tech Direction

- **Language**: {language or "undecided"}
- **Framework**: {framework or "undecided"}
- **Runtime**: {web app / API service / CLI / mobile / etc.}
- **Key Constraints**: {any hard constraints, or "none identified"}

## Out of Scope (MVP)

**REQUIRED: At least 2 items.** An MVP with no Out of Scope section has not been scoped.
Scope creep happens downstream when deferrals are unnamed here.

These are real ideas that belong in a future version — not this one.

- {Deferred capability — with one sentence on WHY it's deferred}
- {Deferred capability}

## MVP Done When

These are the acceptance signals for the entire project.

- [ ] {Concrete, testable signal — not "works well" but "user can do X end-to-end"}
- [ ] {Concrete signal}
- [ ] {Concrete signal}
```

---

## Step 4: Confirm and Advance

Show the user the written `mvp.md` and present the next step:

```
mvp.md written to: {project root}/mvp.md
Lines: {line count} | Capabilities: {N} | Done-when criteria: {N}

Core capabilities identified: {N}
Tech direction: {stack summary}
MVP done when: {N criteria}

Next: /prd — expand this into a full product spec with architecture, tech stack,
backend design, API contracts, and implementation phases.

Then for each capability: /planning {feature} to create an implementation plan.

Run /prd to continue.
```

---

## Notes

- **One question at a time.** The Socratic approach only works if you listen between questions.
- **Push back on scope.** An MVP that takes 6 months is not an MVP. Challenge large ideas into their smallest useful form.
- **Tech direction is captured here, not invented in /prd.** If the user says "FastAPI + PostgreSQL", that's what /prd designs around.
- **mvp.md is a compass, not a spec.** Keep it under 50 lines. Details belong in /prd.
- **"Out of Scope" is as important as "In Scope".** Explicitly naming what's deferred prevents scope creep in every downstream command.
- **The discovery conversation is the real work.** A 10-minute conversation here saves days of building the wrong thing.

````

### Current File: `.opencode/commands/prd.md`

````text
---
description: Create a full Product Requirements Document with architecture, tech specs, and backend design
model: anthropic/claude-opus-4-6
argument-hint: [output-filename]
---

# PRD: Product Requirements Document

The detailed build blueprint. Takes the vision from `/mvp` and expands it into a complete product specification: product requirements, system architecture, tech stack, backend design, API contracts, data models, and implementation phases.

## Usage

```
/prd [output-filename]
```

`$ARGUMENTS` — Optional: output filename. Default: `PRD.md`.

---

## Pipeline Position

```
/mvp (big idea) → /prd (full spec) → /pillars (layers) → /decompose (per-pillar spec) → /planning → /execute → /code-review → /commit → /pr
```

This is Step 2. Reads `mvp.md` as primary input. Output feeds `/pillars`.

---

## Output File

Write the PRD to: `$ARGUMENTS` (default: `PRD.md`)

Path safety (mandatory):
- If `$ARGUMENTS` points to an existing file, ask whether it is: (1) source to analyze, or (2) output to overwrite.
- If ambiguous, create a new sibling file with `-prd.md` suffix.

---

## Step 0: Spec Lock (before drafting)

Read `mvp.md` first. Then lock these items — restate what you found and ask for explicit confirmation before writing anything:

```
Spec Lock:
- Product: {name from mvp.md}
- Big Idea: {one sentence}
- Tech Direction: {from mvp.md Tech Direction section}
- Implementation Mode: {docs-only | code implementation | both}
- Target Path: {PRD.md or custom path}
- Maturity Target: {alpha | MVP | production}
- PRD Depth: {lightweight (skip optional sections) | full (all sections)}

Confirm? (yes / adjust: ...)
```

**HARD STOP** — Do NOT write the PRD until the user confirms. "Sure" or silence is not
confirmation. If the user says "just write it", explain that the Spec Lock catches
foundation mismatches that cost hours to fix after the PRD is written. Re-present and
wait for explicit "yes" or specific adjustments.

---

## Step 0.5: PRD Direction Preview

Generate a concise preview before writing the full file:

```
PRD Direction:

Problem framing: {1 sentence on the problem this solves}
Scope in:        {3-5 bullet points of what's included}
Scope out:       {2-3 explicit exclusions}
Architecture:    {1-sentence approach: "REST API + PostgreSQL + React" or similar}
Key assumptions: {list any assumptions made due to missing info}
Tech stack:      {from mvp.md + any inferences}

Approve this direction before I write the full PRD? (yes / adjust: ...)
```

Only write the PRD after explicit approval.

---

## PRD Structure

### Section 1: Executive Summary

- Product name and one-line description
- Core value proposition (what it does better than alternatives)
- MVP goal statement (what "done" means for this version)
- Maturity target (alpha / MVP / production)

### Section 2: Mission and Principles

- Product mission statement (one sentence: why this exists)
- Core principles (3-5 items that guide every architecture and product decision)
  - Example: "Offline-first", "Zero-config for new users", "Composable over monolithic"

### Section 3: Target Users

- Primary user persona (specific, not abstract — not "developers" but "solo developers building SaaS tools")
- Technical comfort level (beginner / intermediate / expert)
- Key user needs (what they are trying to accomplish)
- Key pain points (what they are currently suffering through)
- User scenario: one concrete end-to-end story of a user accomplishing a goal

### Section 4: MVP Scope

**In Scope** (use checkboxes):
- [ ] {Core functionality group 1}
- [ ] {Core functionality group 2}
- Group by: Core Functionality, Technical Infrastructure, Integrations, Deployment

**Out of Scope** (use checkboxes — each with a reason):
- [ ] {Feature} — {why deferred: complexity, timeline, user feedback needed first, etc.}
- [ ] {Feature} — {why deferred}

### Section 5: User Stories

5-8 primary stories in format: "As a {user}, I want to {action}, so that {benefit}."

For each story:
- Include a concrete example (not abstract)
- Mark as: Core (must-have) or Enhanced (nice-to-have)

Technical user stories (for system-level needs):
- "As the system, I need to {capability} so that {outcome}."

### Section 6: System Architecture

The high-level design. This is the most important technical section.

**6a. Architecture Diagram (ASCII)**
```
[Component A] → [Component B] → [Component C]
      ↓
[Storage Layer]
```
Draw the actual system. Show how components connect.

**6b. Architecture Approach**
- Pattern: {monolith / microservices / serverless / event-driven / etc.}
- Key design principles (from Section 2, applied technically)
- Scalability approach (vertical / horizontal / not a concern for MVP)
- State management strategy (where state lives, how it's accessed)

**6c. Directory Structure**
```
{project-root}/
├── {top-level dirs with one-line purpose each}
```
Only show meaningful structure — not a full file tree.

**6d. Key Design Patterns**
List the patterns that will recur throughout the codebase:
- {Pattern}: {where it applies and why}
- {Pattern}: {where it applies and why}

### Section 7: Technology Stack

This section is binding. Tech choices made here flow directly into `/pillars` and `/decompose`.

**7a. Core Stack**
| Layer | Technology | Version | Reason |
|-------|-----------|---------|--------|
| Language | {from mvp.md} | {version} | {one-line justification} |
| Framework | {from mvp.md} | {version} | {one-line justification} |
| Database | {primary DB} | {version} | {one-line justification} |
| Runtime | {Node / Python / etc.} | {version} | {one-line justification} |

**7b. Key Dependencies**
List only meaningful dependencies (not boilerplate):
| Package | Version | Purpose |
|---------|---------|---------|
| {name} | {version} | {what it does in this project} |

**7c. Optional / Deferred Dependencies**
| Package | Purpose | When to Add |
|---------|---------|-------------|
| {name} | {purpose} | {condition: "when X users", "if feature Y is needed"} |

**7d. Infrastructure and Deployment**
- Hosting: {where it runs}
- CI/CD: {pipeline approach or "not configured for MVP"}
- Containerization: {Docker / none / etc.}
- Environment config: {.env / secrets manager / etc.}

### Section 8: Backend Design

This is the technical heart of the PRD. Be specific — vague architecture produces bad specs.

**8a. Data Models**

For each core entity:
```
Entity: {Name}
Fields:
  - {field}: {type} — {purpose}
  - {field}: {type} — {purpose, constraints}
Relationships:
  - {relationship to other entities}
Indexes:
  - {field(s)}: {reason}
```

**8b. Core Service Contracts**

For each major service or module:
```
Service: {Name}
Responsibility: {one sentence — what this service owns}
Interface:
  {method/function signature}
  Input: {type}
  Output: {type}
  Errors: {what it can throw/return on failure}
Dependencies: {what it needs from other services}
```

**8c. State Management**
- Where is application state stored? (DB, in-memory, file, cache)
- What state is ephemeral vs. persistent?
- Session/auth state approach (if applicable)

**8d. Error Handling Strategy**
- Error taxonomy: {classify errors by type — validation, not found, auth, internal, external}
- Error propagation: {how errors bubble up — exceptions / result types / error objects}
- Client-facing errors: {what users/callers see vs. what gets logged}

**8e. Background Processing** (if applicable)
- Job types and their triggers
- Queue or scheduler approach
- Failure handling and retry logic

### Section 9: API Specification (if applicable)

For each endpoint:
```
{METHOD} {/path}
Purpose: {one sentence}
Auth: {required / optional / none}
Request:
  {JSON schema or parameter list}
Response 200:
  {JSON schema}
Response errors:
  {status code}: {when this happens}
Example:
  curl -X {method} {url} -d '{example body}'
```

Group endpoints by resource/domain.

### Section 10: Security and Configuration

**10a. Authentication / Authorization**
- Auth approach: {JWT / session / API key / OAuth / none for MVP}
- Authorization model: {RBAC / per-resource / open}
- What is explicitly out of scope for security in this version

**10b. Configuration Management**
- Required environment variables (list with purpose)
- Optional environment variables
- Config validation approach (validated at startup? or runtime?)

**10c. Security Scope**
- In scope: {what security concerns this version addresses}
- Out of scope: {explicitly deferred — rate limiting, audit logs, etc.}

### Section 11: Success Criteria

**MVP Success Definition**: {one sentence — what "this works" looks like}

Functional requirements (use checkboxes):
- [ ] {Measurable requirement — not "fast" but "responds in <200ms for typical queries"}
- [ ] {Measurable requirement}

Quality indicators:
- Test coverage target: {%}
- Lint: zero errors
- Type check: zero errors
- Performance baseline: {specific measurement}

### Section 12: Implementation Phases

Break the build into 3-4 phases. Each phase becomes one or more `/planning` sessions.

**Phase 1: {Name} — {goal}**
- Deliverables:
  - [ ] {concrete deliverable}
  - [ ] {concrete deliverable}
- Validation: {how to know this phase is done}
- Enables: {what Phase 2 can do because Phase 1 exists}

**Phase 2: {Name} — {goal}**
- Deliverables:
  - [ ] {concrete deliverable}
- Validation: {how to know this phase is done}
- Enables: {what Phase 3 can do}

**Phase 3: {Name} — {goal}**
- (same structure)

**Phase 4: {Name} — {goal}** (if needed)
- (same structure)

### Section 13: Risks and Mitigations

3-5 key risks:

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| {risk} | {low/med/high} | {low/med/high} | {specific action to reduce risk} |

### Section 14: Future Considerations

Post-MVP ideas — capture them here so they don't creep into the current build:
- {Enhancement}: {why it's valuable and when to consider it}
- {Enhancement}: {why and when}

### Section 15: Appendix (optional)

- Related documents (with paths)
- Key external dependencies with documentation links
- Repository structure (if meaningfully complex)

---

## Instructions

### 1. Extract from Context

Review the entire conversation history and `mvp.md`. Extract:
- Explicit requirements (stated directly)
- Implicit requirements (follow from stated requirements)
- Technical constraints (stated or strongly implied)
- User goals and success criteria

### 2. Synthesize with Evidence

- Use concrete codebase evidence where relevant (file paths and line refs for existing projects)
- Use external docs references for major architecture choices
- Label every assumption as: `Assumption: {statement} — Rationale: {why assumed}`
- Do not produce generic architecture claims without evidence or rationale

### 3. Section Depth

**Default: Full PRD** (all 15 sections, full detail). Use Lightweight only when the user
explicitly requests it — do not default to Lightweight to save time.

- **Full PRD** (default): all sections, full detail
- **Lightweight PRD** (user-requested only): Sections 1-6, 11-12 only — skip detailed API spec, backend design depth, appendix
- For agent/tool projects: emphasize Section 8 (backend design) and tool contracts
- For user-facing apps: emphasize Section 5 (user stories) and Section 9 (API spec)

### 4. Quality Checks (before writing file)

- [ ] Spec Lock confirmed
- [ ] PRD Direction approved
- [ ] All required sections present
- [ ] Tech stack explicitly stated (not "TBD" in all fields)
- [ ] Data models have actual field names, not just entity names
- [ ] Implementation phases are coherent with the data model (Phase 1 builds the foundation)
- [ ] Success criteria are measurable
- [ ] Assumptions are labeled
- [ ] Out-of-scope items have reasons

---

## Output Confirmation

After writing the PRD:
1. Confirm file path
2. Summary: sections written, key architecture decision, tech stack chosen
3. List any assumptions made
4. Next step:

```
PRD written to {path}.

Key decisions:
- Stack: {language + framework + DB}
- Architecture: {pattern}
- Phases: {N phases, Phase 1 = {name}}

Next: /pillars — analyze this PRD to identify infrastructure layers and build order.
Run /pillars to continue.
```

---

## RAG Integration Point

If a RAG knowledge base MCP is available, search for:
- Architecture patterns relevant to the chosen tech stack
- Best practices for the domain (e.g., AI agent patterns, API design, etc.)
- Reference implementations from indexed documentation

If no RAG available, proceed with codebase exploration + conversation context.

---

## Notes

- Never skip the Spec Lock and Direction Preview gates
- The backend design section (Section 8) is what makes a PRD useful for planning — vague service descriptions produce vague plans
- Tech stack in Section 7 must be concrete: specific languages, frameworks, and versions — not "modern web stack"
- Implementation phases in Section 12 become the input for `/pillars`, which identifies the build order — then `/decompose` per pillar, then `/planning`
- For existing codebases: scan the repo first, extract actual patterns and stack from the code rather than inventing

````

### Current File: `.opencode/commands/pillars.md`

````text
---
description: Analyze PRD and identify infrastructure pillars with dependency order and gate criteria
model: anthropic/claude-opus-4-6
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

````

### Current File: `.opencode/commands/decompose.md`

````text
---
description: Deep-research one infrastructure pillar and produce a spec file for /planning
model: anthropic/claude-opus-4-6
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

````

### Current File: `.opencode/commands/planning.md`

````text
---
description: Interactive discovery session — explore ideas WITH the user, then produce a structured plan
model: anthropic/claude-opus-4-6
---

# Planning: Interactive Discovery + Structured Plan

Work WITH the user to explore, question, and discover the right approach for a spec, then produce a structured implementation plan. This is a conversation, not an auto-generator.

## Feature: $ARGUMENTS

---

## Pipeline Position

```
/mvp → /prd → /planning (this) → codex /execute → /code-review → /commit → /pr
```

Used standalone for each feature or capability.

---

## Core Rules

1. **Discovery first, plan second.** Do NOT auto-generate a plan. Ask questions, discuss approaches, explore the codebase together.
2. **Work WITH the user.** This is a conversation. Ask short questions, confirm insights, discuss tradeoffs.
3. **No code in this phase.** Planning produces a plan document, not code.
4. **Plan-before-execute.** `codex /execute` only runs from a `/planning`-generated artifact in `.agents/features/{feature}/`.

---

## Step 0: Intent Classification

Before discovery, classify the work intent. This determines interview strategy and required consultations.

### Intent Types

| Intent | Signal | Interview Strategy |
|--------|--------|-------------------|
| **Trivial** | Single file, <10 lines, obvious fix | Quick confirm, but still full planning process |
| **Simple** | 1-2 files, clear scope, <30 min work | Focused questions on scope boundaries |
| **Refactoring** | "refactor", "restructure", existing code | Safety focus: tests, rollback, behavior preservation |
| **Build from Scratch** | New feature, greenfield, "create new" | Discovery focus: find patterns first, then requirements |
| **Mid-sized** | Scoped feature, clear boundaries | Boundary focus: deliverables, exclusions, guardrails |
| **Collaborative** | "let's figure out", "help me plan" | Dialogue focus: explore together, incremental clarity |
| **Architecture** | System design, infrastructure | Strategic focus: **Oracle consultation REQUIRED** |
| **Research** | Goal exists, path unclear | Investigation focus: parallel probes, exit criteria |

### Classification Process

1. Parse `$ARGUMENTS` and any prior context
2. Match against signal patterns
3. Select primary intent (may have secondary)
4. Announce classification to user

### Intent Announcement

After classification, tell the user:

```
I'm classifying this as **{INTENT}** based on {observed signals}.

Interview focus: {strategy description}
{If Architecture: "Oracle consultation will be required in Phase 2."}
{If Refactoring: "I'll focus on safety: tests, rollback strategy, behavior preservation."}

Let's begin discovery.
```

### Intent Determines Downstream Behavior

| Intent | Phase 1 Focus | Phase 2 Extras | Phase 3 Extras |
|--------|---------------|----------------|----------------|
| Trivial | Quick scope confirm | Standard | Standard |
| Simple | Boundary questions | Standard | Standard |
| Refactoring | Safety + rollback | Test coverage search | Risk analysis emphasis |
| Build from Scratch | Pattern discovery | Extra pattern search | Standard |
| Mid-sized | Exclusions + guardrails | Standard | Standard |
| Collaborative | Open exploration | Standard | Standard |
| Architecture | System boundaries | Oracle in Phase 2 | Oracle review required |
| Research | Exit criteria | Parallel probes | Standard |

---

## Step 1: Draft Management

Planning sessions persist across context windows via draft files.

### Draft File Location

```
.agents/features/{feature}/planning-draft.md
```

### On Session Start

**Check for existing draft:**

```typescript
// Check if draft exists
const draftPath = `.agents/features/${feature}/planning-draft.md`
```

**If draft exists:**
1. Read draft to restore context
2. Summarize what was previously discussed
3. Present to user:
   ```
   Continuing from our previous planning session for {feature}.
   
   **Previously discussed:**
   - {topic 1}
   - {topic 2}
   - {key decision made}
   
   **Current status:** {where we left off}
   
   Ready to continue, or should we start fresh?
   ```
4. If user says "start fresh" → delete draft, begin from Step 0

**If no draft exists:**
1. Create feature directory: `.agents/features/{feature}/`
2. Create initial draft with intent classification
3. Inform user: "I'm recording our discussion in `.agents/features/{feature}/planning-draft.md`"

### During Session

**After every meaningful exchange**, update the draft:

```markdown
# Planning Draft: {feature}

## Intent Classification
- **Type**: {intent}
- **Signals**: {why this classification}
- **Classified at**: {timestamp}

## Discovery Progress
- [ ] Intent classified
- [ ] Test strategy discussed
- [ ] Scope boundaries defined
- [ ] Clearance check passed

## Key Discussions

### {timestamp} — {topic}
{summary of what was discussed}
{decisions made}
{open questions}

### {timestamp} — {topic}
...

## Current Understanding
{latest synthesis of what we're building}

## Open Questions
- {question 1}
- {question 2}

## Decisions Made
- {decision 1}: {rationale}
- {decision 2}: {rationale}
```

### Draft Cleanup

After plan is written and user confirms:
1. Draft file is deleted
2. Plan artifacts remain in `.agents/features/{feature}/`

---

## Phase 1: Discovery (Intent-Specific Interview)

> **Prerequisite**: Steps 0-1 complete (intent classified, draft initialized)

Phase 1 adapts to the classified intent. The interview strategy, pre-research, and questions all change based on intent type.

### 1a. Pre-Interview Research (Intent-Specific)

**Launch research agents BEFORE asking questions.** The intent determines what to search for.

#### Trivial / Simple
No pre-research needed. Proceed directly to interview.

#### Refactoring
```typescript
// Find all usages to understand impact scope
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Map refactoring impact",
  prompt=`Find all usages of the code being refactored via references.
  Map: call sites, return value consumers, type dependencies.
  Identify: dynamic access patterns that won't show in static analysis.
  Return: file paths, usage patterns, risk level per call site.`
)

// Find test coverage
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find test coverage for refactoring",
  prompt=`Find all tests exercising the code being refactored.
  Map: what each test asserts, inputs used, public API vs internals.
  Identify: coverage gaps.
  Return: test file paths, coverage assessment.`
)
```

#### Build from Scratch
```typescript
// Find similar implementations for patterns
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find similar implementations",
  prompt=`Find 2-3 similar implementations in the codebase.
  Look for: directory structure, naming conventions, exports, shared utilities,
  error handling patterns, registration steps.
  Return: file paths with pattern descriptions.`
)

// Find organizational conventions
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find organizational conventions",
  prompt=`Find how similar features are organized.
  Look for: nesting depth, index.ts barrels, types conventions,
  test placement, registration patterns.
  Return: canonical structure recommendation.`
)

// Find external docs if new technology
task(
  subagent_type="librarian",
  run_in_background=true,
  load_skills=[],
  description="Find external documentation",
  prompt=`Find official documentation for {technology}.
  Look for: setup guides, project structure, API reference, pitfalls.
  Skip basic tutorials — need production patterns.
  Return: key documentation excerpts.`
)
```

#### Architecture
```typescript
// Map existing architecture
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Map existing architecture",
  prompt=`Map the current architecture.
  Find: module boundaries, dependency direction, data flow, key abstractions, ADRs.
  Identify: circular dependencies, coupling hotspots.
  Return: architecture overview with dependency graph.`
)

// Find architectural patterns
task(
  subagent_type="librarian",
  run_in_background=true,
  load_skills=[],
  description="Find architectural patterns",
  prompt=`Find proven patterns for {architecture domain}.
  Look for: scalability trade-offs, common failure modes, case studies.
  Skip generic patterns — need domain-specific guidance.
  Return: pattern recommendations with rationale.`
)
```

#### Mid-sized / Collaborative / Research
Standard explore agent for codebase patterns (covered in Phase 2).

---

### 1b. Intent-Specific Interview

**Questions adapt to intent type.** Use research findings to inform questions.

#### Trivial
```
Quick confirm: {summarize the obvious fix}
Anything else to consider, or should I proceed?
```

#### Simple
```
1. Scope boundary: Should this include {adjacent concern} or stay focused on {core}?
2. Integration: Any existing code this needs to work with?
```

#### Refactoring
```
1. Behavior preservation: What specific behavior MUST stay identical?
2. Test verification: What command verifies current behavior works?
3. Rollback strategy: If this goes wrong, how do we revert?
4. Propagation: Should changes stay isolated or propagate to callers?
```

#### Build from Scratch
```
I found pattern {X} in {similar file}. Questions:
1. Should new code follow this pattern or deviate? Why?
2. What should explicitly NOT be built? (scope boundaries)
3. MVP vs full vision: What's the minimum useful version?
4. Any preferred libraries or approaches?
```

#### Mid-sized
```
1. Exact outputs: What files/endpoints/UI will this create?
2. Explicit exclusions: What must NOT be included?
3. Hard boundaries: What existing code must NOT be touched?
4. Done criteria: How will we know this is complete?
```

#### Collaborative
```
Let's explore together. Starting point:
- What's the core problem you're trying to solve?
- What have you already tried or considered?
- What feels unclear right now?
```

#### Architecture
```
1. Lifespan: How long should this design last? (months/years)
2. Scale: What load/scale does this need to handle?
3. Constraints: What's absolutely non-negotiable?
4. Integration: What existing systems must this work with?

Note: Oracle consultation is required in Phase 2 for Architecture intent.
```

#### Research
```
1. Goal: What specific question are we trying to answer?
2. Exit criteria: How will we know we've found the answer?
3. Constraints: Any paths we should NOT explore?
4. Time box: How much time should we spend before deciding?
```

---

### 1c. Test Infrastructure Assessment

**Run for ALL intents.** Testing strategy affects plan output.

#### Detect Test Infrastructure

```typescript
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Detect test infrastructure",
  prompt=`Assess test infrastructure in this project.
  Find: test framework (jest/vitest/pytest/etc), test patterns, coverage config, CI integration.
  Return: YES/NO per capability with examples.`
)
```

#### Ask Test Strategy Question

**If infrastructure EXISTS:**
```
I see test infrastructure ({framework}).

Should this work include automated tests?
- **TDD**: Tests written first, then implementation
- **Tests-after**: Tests added after implementation  
- **None**: No unit/integration tests for this work

Regardless of choice, every task includes agent-executed QA scenarios.
```

**If infrastructure DOES NOT exist:**
```
No test infrastructure detected.

Would you like to set up testing as part of this work?
- **YES**: Include test infrastructure setup in the plan
- **NO**: Proceed without unit tests

Either way, agent-executed QA scenarios verify each deliverable.
```

#### Record Decision

Update draft with test strategy:
```markdown
## Test Strategy
- **Infrastructure**: EXISTS / NOT_FOUND
- **Approach**: TDD / TESTS_AFTER / NONE
- **Framework**: {detected or chosen}
```

---

### 1d. Context File Reading

Read these files for additional context (if they exist):
- `mvp.md` — product vision
- `PRD.md` (or similar) — product requirements  
- `memory.md` — past decisions and gotchas
- `.agents/wisdom/{feature}/` — accumulated wisdom

Share relevant findings: "From memory.md, I see a past decision about {X}..."

---

### 1e. Checkpoints

After each major discovery or decision:
- "Here's what I'm seeing — does this match your intent?"
- "I think we should approach it like X because Y. Sound right?"

Keep confirmations SHORT — one sentence, not paragraphs.

Update draft after each checkpoint.

---

### 1f. Clearance Check

**Gate before Phase 2.** Do not proceed until clearance passes.

```
## Phase 1 Clearance Check

**Discussed:**
- [x] Intent: {classified intent}
- [x] Scope: {what's in/out}
- [x] Test strategy: {TDD/Tests-after/None}
- [x] Key constraints: {boundaries}

**Auto-resolved (sensible defaults):**
- {any assumptions made}

**Ready for Phase 2 (Research)?**
```

If anything is unclear, ask before proceeding.
If user confirms, move to Phase 2.

---

## Phase 2: Explore (Research)

Once the direction is clear, delegate all retrieval to explore/librarian agents. Run in parallel (all with `run_in_background=true`).

### 2a. Codebase research → `explore` agent

Invoke the explore agent for internal codebase search. Run in background for parallel execution:

```typescript
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find codebase patterns for {feature}",
  prompt=`
    [CONTEXT]: Building {feature} — need to understand existing codebase patterns
    [GOAL]: Find integration points and patterns to follow
    [DOWNSTREAM]: Will use findings to inform implementation approach
    [REQUEST]: Find:
    - Key integration points in likely directories
    - Naming conventions and patterns used
    - Error handling approaches
    - Test patterns if they exist
    
    Return: file:line references, patterns found, gotchas, integration points.
  `
)
```

The explore agent returns structured findings from the internal codebase.

### 2b. Knowledge base (if Archon connected) → `librarian` agent

The librarian agent has `archonEnabled: true` and can search the Archon knowledge base:

```typescript
task(
  subagent_type="librarian",
  run_in_background=true,
  load_skills=[],
  description="Search knowledge base for {feature} patterns",
  prompt=`
    [CONTEXT]: Building {feature} — need relevant documentation and examples
    [GOAL]: Find authoritative docs and code examples from knowledge base
    [DOWNSTREAM]: Will use findings to inform implementation patterns
    [REQUEST]: Search for:
    - 2-5 keyword queries for key concepts: {keywords}
    - Both documentation and code examples
    - Focus on production patterns, skip tutorials
    
    Return: matched documentation excerpts and code examples with source references.
  `
)
```

The librarian agent automatically uses Archon RAG when connected.

### 2c. External docs (if needed) → `librarian` agent

For external documentation beyond the knowledge base:

```typescript
task(
  subagent_type="librarian",
  run_in_background=true,
  load_skills=[],
  description="Find external docs for {library/API}",
  prompt=`
    [CONTEXT]: Building {feature} with {library/API}
    [GOAL]: Find official documentation and best practices
    [DOWNSTREAM]: Will use findings to implement correctly
    [REQUEST]: Look up:
    - Official documentation for {library/API}
    - Version-specific constraints: {versions}
    - Best practices and common pitfalls
    
    Return: relevant docs, best practices, pitfalls to avoid.
  `
)
```

The librarian agent searches GitHub, Context7, and web sources for documentation.

### 2d. Past plans → `explore` agent

Search completed plans for patterns and lessons learned:

```typescript
task(
  subagent_type="explore",
  run_in_background=true,
  load_skills=[],
  description="Find similar past plans for {feature}",
  prompt=`
    [CONTEXT]: Planning {feature} — want to learn from past work
    [GOAL]: Find similar completed plans and extract reusable patterns
    [DOWNSTREAM]: Will use findings to avoid repeating mistakes
    [REQUEST]: Scan:
    - .agents/features/*/plan.done.md for similar features
    - Look for: prior architectural decisions, reusable patterns, lessons learned
    - Match on: {keywords related to feature}
    
    Return: prior decisions, reusable patterns, gotchas to avoid.
  `
)
```

The explore agent searches the internal codebase including completed plan artifacts.

### 2e. Oracle Consultation (Architecture Intent ONLY)

**REQUIRED when intent = Architecture.** Skip for other intents.

Oracle provides strategic consultation on architecture decisions. This is read-only — Oracle advises, does not implement.

```typescript
task(
  subagent_type="oracle",
  run_in_background=false,  // Wait for Oracle's response
  load_skills=[],
  description="Architecture consultation for {feature}",
  prompt=`
    Architecture consultation request:
    
    **Feature**: {feature name}
    **Intent**: Architecture / System Design
    
    **Context from Phase 1 Interview**:
    - Lifespan requirement: {years}
    - Scale requirement: {load expectations}
    - Non-negotiable constraints: {list}
    - Systems to integrate: {list}
    
    **Research Findings**:
    - Current architecture: {from explore agent}
    - External patterns: {from librarian agent}
    
    **Questions for Oracle**:
    1. Given these constraints, what architectural approach do you recommend?
    2. What are the key tradeoffs we should consider?
    3. What failure modes should we design against?
    4. What would you advise against doing?
    
    Provide strategic guidance. Be specific about tradeoffs.
  `
)
```

**Oracle Response Handling:**
- Incorporate Oracle's recommendations into Phase 3 Analysis
- Note Oracle's warnings in risk assessment
- Reference Oracle's guidance in approach decision

---

### 2f. Synthesize findings

Collect results from all background agents (`background_output(task_id="...")`) and summarize:
- "Research found these patterns..." / "Past plan for {X} used this approach..."
- **If Architecture intent**: "Oracle recommends {approach} because {rationale}. Key warnings: {list}."
- Share key file:line references, patterns, and gotchas before moving to Phase 3

---

## Phase 3: Design (Structured Reasoning)

Phase 3 is where raw discovery turns into architectural decisions. This is the most important phase — every downstream artifact (plan, task briefs, code) depends on the quality of thinking here.

**Do NOT skip sub-phases.** Each produces a structured output block that subsequent phases reference. The model must show its reasoning at each step, not jump from research to conclusions.

### 3a. Synthesize

Take everything from Phase 1 (user intent) + Phase 2 (research findings) and distill it into a clear picture. Print this output block:

```
SYNTHESIS
=========
What we're building:
  {1 paragraph — precise, no fluff. What this feature/spec does and why it matters.}

What we learned from research:
  Codebase findings:
    - {key pattern from explore agent}
    - {integration point discovered}
    - {gotcha or inconsistency found}
  External findings:
    - {relevant docs/best practice from librarian agent}
    - {pitfall or compatibility note}
  Prior plan findings:
    - {pattern from explore agent — what worked in similar features}
    - {lesson or reusable structure}

What the user cares about most:
  {From Phase 1 conversation — the core requirement, not everything}

Constraints:
  - {Technical constraint — language, framework, existing architecture}
  - {Compatibility constraint — must work with existing X}
  - {Time/scope constraint — if applicable}

Unknowns (explicit gaps):
  - {What we still don't know — things research didn't answer}
  - {Assumptions we're making that could be wrong}
```

**Checkpoint**: Share the synthesis with the user. "Here's what I'm working with — anything missing or wrong?"

### 3b. Analyze

Structured analysis before making any decisions. Do NOT propose an approach yet — analyze first.

```
ANALYSIS
========
Dependency Graph:
  {component A} → depends on → {component B} → depends on → {component C}
  {component D} → independent (can be built in any order)
  (Use simple text arrows, not diagrams. List every dependency.)

Critical Path:
  {The sequence of work that determines total effort. What must be done first
   because everything else depends on it.}

Risk Assessment:
  HIGH: {risk description}
    Likelihood: {why this is likely or has high impact}
    Mitigation: {specific strategy to reduce risk}
    Fallback: {what to do if mitigation fails}
  MEDIUM: {risk description}
    Likelihood: {assessment}
    Mitigation: {strategy}
  LOW: {risk description}
    Acceptable because: {why we can live with this}

Failure Modes:
  If {X breaks/fails/is wrong}:
    Blast radius: {what else breaks — contained to one file? Cascading?}
    Detection: {how we'd know — test failure? Runtime error? Silent bug?}
    Rollback: {how to undo — git revert? Feature flag? Manual fix?}
  If {assumption Y is wrong}:
    Impact: {how the plan changes}
    Pivot: {alternative approach we'd take}

Interface Boundaries:
  Inputs: {what goes into this feature — data, config, user input, API calls}
  Outputs: {what comes out — files written, state changes, side effects, API responses}
  Touches: {existing systems/files this interacts with — be specific with file paths}
  Does NOT touch: {explicitly list what's out of scope to prevent scope creep}
```

**Checkpoint**: If risks are HIGH, flag them: "I see a significant risk with {X}. Want to discuss mitigation before I proceed?"

For non-trivial architecture decisions where multiple approaches are viable:
- "This has {N} valid approaches with real tradeoffs. Want to discuss before I pick one?"

### 3c. Decide

Now — and only now — propose the approach. The decision must reference the analysis above, not gut feeling.

```
APPROACH DECISION
=================
Chosen approach:
  {Describe the approach in 2-3 sentences. Be specific — not "use a service" but
   "create AuthService class in src/services/auth.ts with login(), logout(), refresh() methods,
   following the pattern from src/services/user.ts"}

Why this approach:
  - {Reason 1 — tied to a specific finding from the analysis. "The dependency graph shows X
    must be built first, so this approach starts with X."}
  - {Reason 2 — tied to a risk mitigation. "This approach minimizes the HIGH risk identified
    in 3b by isolating the change to a single file."}
  - {Reason 3 — tied to a codebase pattern. "Research found the existing pattern in
    src/services/user.ts:45-62 which this approach extends consistently."}

Rejected alternatives:
  Alternative A: {description}
    Rejected because: {specific reason from analysis — not "it's worse" but "it increases
    coupling between X and Y which the dependency graph shows is already a risk"}
  Alternative B: {description}
    Rejected because: {specific reason}
  (If only one viable approach exists, state: "No viable alternatives identified —
   the constraints from 3b make this the only workable approach because {reason}.")

Key tradeoff accepted:
  {What we're trading off. Every approach trades something. Be explicit.
   Example: "Trading implementation speed for maintainability — the service pattern
   is more code than a direct function call, but follows established conventions
   and is easier to test."}
```

**Checkpoint**: Confirm the direction — "Lock in this approach? Or should we explore {specific alternative} more?"

### 3d. Decompose

Break the chosen approach into tasks. The decomposition must justify each split.

```
TASK DECOMPOSITION
==================
Total tasks: {N}
Split rationale:
  {Why N tasks, not N-1 or N+1. What principle drives the split —
   "one task per target file" is the default heuristic. If deviating, explain why.}

Parallelization Plan:
  Wave 1: Tasks {list} — no dependencies, can start immediately
  Wave 2: Tasks {list} — depends on Wave 1 completing
  Wave 3: Tasks {list} — depends on Wave 2 completing
  Parallel within waves: {which tasks can run simultaneously}

Task 1: {name}
  Target file: {path}
  Why separate: {what boundary this follows — "this is the foundation that other tasks depend on"}
  Depends on: nothing (first task)
  Blocks: Tasks {N, M}
  Wave: 1
  Scope: {1-2 sentences — what this task creates/modifies}

Task 2: {name}
  Target file: {path}
  Why separate: {boundary reasoning — "different file, different concern"}
  Depends on: Task 1 ({specifically what it needs — "the interface defined in Task 1"})
  Blocks: Tasks {N}
  Wave: 2
  Scope: {1-2 sentences}

Task 3: {name}
  Target file: {path}
  Why separate: {boundary reasoning}
  Depends on: Task 1 and/or Task 2 ({specific dependency})
  Blocks: Tasks {N}
  Wave: 2
  Scope: {1-2 sentences}

... (continue for all tasks)

Order rationale:
  {Why this order, not another. Reference the dependency graph from 3b.
   "Task 1 must be first because Tasks 2 and 3 both depend on its output.
   Tasks 2 and 3 are independent of each other but ordered by complexity —
   simpler first to establish patterns."}

Confidence: {X}/10
  Reasoning: {Why this score. What's well-understood vs uncertain.
  Example: "8/10 — Tasks 1-3 follow established patterns and are straightforward.
  Task 4 involves an integration point with the build system that has some uncertainty
  around error handling. If Task 4 proves harder than expected, the blast radius
  is contained to one file."}
```

**Checkpoint**: "Here's the task breakdown — {N} tasks in this order. The key dependency is {X}. Does this look right?"

### 3e. Metis Consultation (Gap Analysis)

**Before presenting the preview**, summon Metis to catch what you might have missed.

Metis is the pre-planning gap analyzer. It identifies hidden assumptions, ambiguities, and potential AI failure points.

```typescript
task(
  subagent_type="metis",
  run_in_background=false,  // Wait for response
  load_skills=[],
  description="Gap analysis for {feature} plan",
  prompt=`
    Review this planning session before I present the preview:
    
    **User's Goal**: 
    {summarize what user wants from Phase 1}
    
    **What We Discussed**:
    {key points from Phase 1 interview}
    
    **My Understanding** (from Synthesis):
    {SYNTHESIS block content}
    
    **Research Findings**:
    {key discoveries from Phase 2}
    
    **Proposed Approach** (from Decide):
    {APPROACH DECISION block content}
    
    **Task Breakdown** (from Decompose):
    {TASK DECOMPOSITION block content}
    
    Please identify:
    1. **Questions I should have asked but didn't** — gaps in discovery
    2. **Guardrails that need to be explicitly set** — scope boundaries missing
    3. **Potential scope creep areas** — where AI might over-build
    4. **Assumptions I'm making that need validation** — implicit assumptions
    5. **Missing acceptance criteria** — how will we know tasks are done
    6. **Edge cases not addressed** — failure modes not covered
    
    Be specific. Reference the task breakdown by task number.
  `
)
```

**Metis Response Handling:**

1. **CRITICAL gaps** (blocks preview):
   - Return to user: "Metis identified a critical gap: {gap}. Let me ask: {question}"
   - Update draft with answer
   - Re-run Metis if needed

2. **MINOR gaps** (fix silently):
   - Incorporate into Phase 4 preview
   - Note in "Guardrails Applied" section

3. **ASSUMPTIONS flagged**:
   - Add to preview as "Assumptions (validate with user)"
   - Ask user to confirm before proceeding

---

### Phase 3 Output Summary

By the end of Phase 3, the following are locked in and available for Phase 4:
- **Synthesis** — distilled understanding of what we're building and why
- **Analysis** — dependency graph, risks with mitigations, failure modes, interface boundaries
- **Approach** — chosen approach with reasoning, rejected alternatives, accepted tradeoff
- **Decomposition** — task list with per-task justification, order rationale, confidence score
- **Metis Review** — gaps identified and addressed, guardrails applied

Phase 4's preview draws directly from these: `Approach` → preview's "Approach" field, `Risks` from analysis → preview's "Risks" field, `Decomposition` → preview's "Estimated tasks" and "Mode" fields, `Metis Review` → preview's "Guardrails" field.

---

## Phase 4: Preview (Approval Gate)

Before writing the full plan, show a **1-page preview**:

```
PLAN PREVIEW: {spec-name}
=============================

What:      {1-line description}
Approach:  {the locked-in approach}
Files:     {create: X, modify: Y}
Key decision: {the main architectural choice and why}
Risks:     {top 1-2 risks}
Tests:     {testing approach from Phase 1}
Estimated tasks: {N tasks}
Mode:      {Task Briefs (N briefs, default) | Master + Sub-Plans (N phases, escape hatch)}

Metis Review:
  Gaps addressed: {list of gaps Metis found that were incorporated}
  Assumptions: {list — ask user to validate}
  Guardrails: {explicit scope boundaries}
```

```
Approve this direction to write the full plan? [y/n/adjust]
```

Only write the plan file after explicit approval.

---

## Phase 5: Write Plan

### Auto-Detect Complexity

After Phases 1-4 (discovery/design), assess complexity and select the output mode:

- **Task Brief Mode** (DEFAULT — use for all standard features): Produces `plan.md` (overview + task index) + one `task-N.md` brief per task. Each brief is a self-contained execution document for one `codex /execute` session. Use this for the vast majority of features — there is no task count upper boundary for this mode.
- **Master + Sub-Plan Mode** (EXCEPTION — escape hatch for genuinely complex features): Use ONLY when the feature has multiple distinct phases with heavy cross-phase dependencies that make a single plan unwieldy. The trigger is architectural complexity, not task count. A feature with 12 straightforward tasks fits comfortably in task brief mode. A feature with 8 tasks across truly independent phases with separate validation gates may warrant master plan mode.

Announce the mode transparently:
- Task Brief: "This has ~6 tasks — I'll write `plan.md` + 6 task briefs. Each brief runs in one `/execute` session."
- Master Plan: "This has {N} tasks across {M} distinct phases with independent validation gates — the cross-phase dependencies make a single plan unwieldy. I'll use the master + sub-plan approach."

---

### Task Brief Mode (Default)

#### 5a. Write plan artifacts directly

**Step 1: Write `plan.md` (overview + task index)**

Every `plan.md` is 700-1000 lines. It is the source of truth and human-readable overview. It contains:

- Feature Description, User Story, Problem Statement, Solution Statement
- Feature Metadata with Slice Guardrails
- Pillar Context (if available): pillar N — name, scope, research findings, PRD requirements
- Context References (codebase files with line numbers, related memories, relevant docs)
- Patterns to Follow (with actual code snippets from the project)
- Implementation Plan (overview of phases/groupings)
- Step-by-Step Tasks (summary level — 3-4 lines per task with ACTION, TARGET, scope description)
- Testing Strategy (overview)
- Validation Commands (all levels of the validation pyramid)
- Acceptance Criteria (Implementation + Runtime, with checkboxes)
- Completion Checklist
- Notes (key decisions, risks, confidence score)
- **TASK INDEX** table at the bottom listing all task briefs with scope and status

**TASK INDEX table format:**
```markdown
## TASK INDEX

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | `task-1.md` | {one-line scope description} | pending | {N created, M modified} |
| 2 | `task-2.md` | {one-line scope description} | pending | {N created, M modified} |
...
```

**Hard requirement:** If `plan.md` is under 700 lines, it is REJECTED. Expand code samples, add more context references, add more pattern detail. Code samples must be copy-pasteable, not summaries.

**Step 2: Write task briefs (`task-N.md`) — one per target file**

Using the task brief structure below as the structural reference, write one task brief for each task:

- Save to `.agents/features/{feature}/task-{N}.md`
- Each brief is **self-contained** — `codex /execute` can run it without reading `plan.md` or any other file
- Each brief targets **700-1000 lines** — this is achieved by pasting all context inline, not by padding
- No advisory sections (no Feature Description, User Story, Problem Statement, Confidence Score — those live in `plan.md`)
- Every line must be operationally useful: steps, exact code, validation commands, acceptance criteria

**Task splitting heuristic**: One task brief = one target file. This is the default granularity. A brief that modifies `planning.md` is one task; a brief that modifies `TASK-BRIEF-TEMPLATE.md` is a separate task. Multi-file briefs are the exception — only when edits are tightly coupled (e.g., renaming in file A requires updating the import in file B). If a brief covers 3+ files, split it unless you can justify why the files can't be changed independently.

**How briefs reach 700 lines — inline content, not padding:**
- **Context References**: Paste the full current content of every section being modified in code blocks (50-150 lines)
- **Patterns to Follow**: Paste complete reference patterns from other files with analysis (30-80 lines)
- **Current/Replace blocks**: Paste the EXACT current content and COMPLETE replacement content — every line, preserving indentation (50-200 lines per step)
- **All sections filled**: Every section from OBJECTIVE through COMPLETION CHECKLIST must be present and substantive. No empty sections, no "N/A" without explanation.

**Hard requirement:** If a task brief is under 700 lines, it is REJECTED. Expand inline content — paste more of the target file's current content, add more pattern snippets, add more validation steps, add more acceptance criteria. If a brief genuinely can't reach 700 lines for a single file, the task is too small — merge it with an adjacent task or add depth (more edge cases, more validation, more context).

**Required sections per task brief:**
- Objective (one sentence — the test for "done")
- Scope (files touched, what's out of scope, dependencies)
- Prior Task Context (what was done in task N-1; "None" for task 1)
- Context References (files to read with line ranges AND full content pasted inline in code blocks)
- Patterns to Follow (complete code snippets from the codebase — NOT optional, NOT summaries)
- Step-by-Step Tasks (each step: IMPLEMENT with exact Current/Replace-with blocks, PATTERN, GOTCHA, VALIDATE)
- Testing Strategy (unit, integration, edge cases)
- **QA Scenarios** (agent-executed verification steps)
- Validation Commands (L1–L5, each level filled or explicitly "N/A" with reason)
- Acceptance Criteria (Implementation + Runtime checkboxes)
- **Parallelization** (Wave N, blocks, blocked-by)
- Handoff Notes (what task N+1 needs to know; omit for last task)
- Completion Checklist

#### QA Scenarios

Every task brief includes agent-executed QA scenarios. These are NOT unit tests — they are verification steps the executing agent performs.

**Format:**
```markdown
## QA Scenarios

### Scenario 1: {Happy Path Name}
**Tool**: Bash / Playwright / Read
**Steps**:
1. {exact command or action}
2. {exact command or action}
**Expected**: {concrete, verifiable result}
**Evidence**: `.agents/features/{feature}/evidence/task-{N}-{slug}.{ext}`

### Scenario 2: {Error Path Name}
**Tool**: Bash
**Steps**:
1. {trigger error condition}
**Expected**: {specific error message or behavior}
**Evidence**: `.agents/features/{feature}/evidence/task-{N}-{slug}.{ext}`
```

**Rules:**
- Every task has at least 2 QA scenarios (happy path + error path)
- Scenarios use specific tools (Bash, Playwright, Read), not vague "verify"
- Expected results are concrete, not "it works"
- Evidence is saved to `.agents/features/{feature}/evidence/`

#### Parallelization

Every task brief specifies parallelization constraints.

**Format:**
```markdown
## Parallelization

- **Wave**: {N} — Tasks in the same wave can run in parallel
- **Can Parallel**: YES / NO
- **Blocks**: {task numbers this task blocks, e.g., "Tasks 4, 5"}
- **Blocked By**: {task numbers this task depends on, e.g., "Task 1"}
```

**Rules:**
- Wave 1 tasks have no dependencies (can start immediately)
- Higher wave numbers depend on lower waves completing
- "Blocks" lists downstream tasks that wait for this one
- "Blocked By" lists upstream tasks this one waits for
- Tasks in the same wave with `Can Parallel: YES` can run simultaneously

**Example:**
```
Task 1: Create base types     — Wave 1, Blocks: 2, 3, 4
Task 2: Implement service     — Wave 2, Blocked By: 1, Blocks: 4
Task 3: Implement handler     — Wave 2, Blocked By: 1, Blocks: 4
Task 4: Integration tests     — Wave 3, Blocked By: 2, 3
```

**Rejection criteria** — a task brief is REJECTED if it:
- Is under 700 lines
- Uses "see lines X-Y" or "read file Z" instead of pasting content inline
- Skips any required section (every section above must be present)
- Has Current/Replace blocks that abbreviate, summarize, or use "..." to skip lines
- Covers 3+ files without explicit justification

---

### Master + Sub-Plan Mode (Escape Hatch)

For genuinely complex features with multiple distinct phases and heavy cross-phase dependencies:

**Step 1: Write Master Plan**
- ~400-600 lines
- Save to `.agents/features/{feature}/plan-master.md`
- Contains: overview, phases, dependencies, cross-phase decisions, risk register
- Includes SUB-PLAN INDEX table

**Step 2: Write Sub-Plans (sequential)**
- 700-1000 lines each
- Save to `.agents/features/{feature}/plan-phase-{N}.md`
- Phase count heuristic: 1 phase per 3-5 tasks, 2-4 phases typical
- Each sub-plan references handoff notes from prior phases
- Later sub-plans include "Handoff Received" section with context from earlier phases

**Phase naming:**
- Phase 1: Foundation/Setup tasks
- Phase 2: Core implementation
- Phase 3: Integration/Testing
- (Adjust based on actual feature structure)

---

## Output

Create the feature directory if it doesn't exist: `.agents/features/{feature}/`

**Task Brief Mode (Default):**
```
.agents/features/{feature}/plan.md         ← overview + task index
.agents/features/{feature}/task-1.md       ← task brief 1
.agents/features/{feature}/task-2.md       ← task brief 2
...
.agents/features/{feature}/task-{N}.md     ← task brief N
```

**Master + Sub-Plan Mode (Escape Hatch):**
```
.agents/features/{feature}/plan-master.md
.agents/features/{feature}/plan-phase-1.md
.agents/features/{feature}/plan-phase-2.md
...
```

### Archon Task Sync (if connected) → `librarian` agent

After writing the plan, invoke the librarian agent to sync tasks with Archon:

```typescript
task(
  subagent_type="librarian",
  run_in_background=false,  // Wait for result
  load_skills=[],
  description="Sync tasks to Archon for {feature}",
  prompt=`
    [CONTEXT]: Plan written for {feature} with {N} task briefs
    [GOAL]: Create Archon tasks for tracking
    [REQUEST]:
    1. Find or create Archon project for this feature
    2. Create one Archon task per task brief
    3. Return task IDs to store in plan metadata
  `
)
```

The librarian agent uses Archon MCP tools when connected.

### Pipeline Handoff Write (required)

After writing the plan (and Archon sync if applicable), overwrite `.agents/context/next-command.md`:

**Task Brief Mode (Default):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /planning
- **Feature**: {feature}
- **Next Command**: codex /execute .agents/features/{feature}/plan.md
- **Task Progress**: 0/{N} complete
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: awaiting-execution
```

**Master + Sub-Plan Mode:**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /planning
- **Feature**: {feature}
- **Next Command**: codex /execute .agents/features/{feature}/plan-master.md
- **Master Plan**: .agents/features/{feature}/plan-master.md
- **Phase Progress**: 0/{M} complete
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: awaiting-execution
```

---

## After Writing

**Task Brief Mode (Default):**
```
Plan written:  .agents/features/{feature}/plan.md
Task briefs:   .agents/features/{feature}/task-1.md
               .agents/features/{feature}/task-2.md
               ...
               .agents/features/{feature}/task-{N}.md
Total:         {N} tasks, {N} briefs (one session per brief)
Confidence: {X}/10 for one-pass success
Key risk: {top risk}
Archon: {synced N tasks / not connected}

Next (hand to Codex):
  codex /execute .agents/features/{feature}/task-1.md
  (then task-2.md, task-3.md... one per session)
```

**Master + Sub-Plan Mode:**
```
Master plan: .agents/features/{feature}/plan-master.md
Sub-plans:   .agents/features/{feature}/plan-phase-1.md
             .agents/features/{feature}/plan-phase-2.md
             .agents/features/{feature}/plan-phase-3.md
Total:       {N} tasks across {M} phases
Confidence:  {X}/10 for one-pass success
Key risk:    {top risk}
Archon:      {synced N tasks / not connected}

Next (hand to Codex):
  codex /execute .agents/features/{feature}/plan-master.md
```

---

## Phase 6: Self-Review

Before presenting to user, perform self-review with gap classification.

### Gap Classification

| Gap Type | Definition | Action |
|----------|------------|--------|
| **CRITICAL** | Blocks execution, user input required | Ask user immediately, do not proceed |
| **MINOR** | Small issue, sensible default exists | Fix silently, note in summary |
| **AMBIGUOUS** | Multiple valid interpretations | Apply default, disclose in summary |

### Self-Review Checklist

Run through this checklist after writing plan artifacts:

```
## Self-Review: {feature}

### Completeness
- [ ] All TODOs have acceptance criteria?
- [ ] All file references exist in codebase?
- [ ] No assumptions without evidence?
- [ ] Guardrails from Metis incorporated?
- [ ] Scope boundaries clearly defined?

### QA Coverage
- [ ] Every task has QA scenarios?
- [ ] QA scenarios include happy path?
- [ ] QA scenarios include error path?
- [ ] Evidence collection paths defined?

### Parallelization
- [ ] Wave assignments are valid?
- [ ] Dependencies correctly mapped?
- [ ] No circular dependencies?

### Gaps Found
- CRITICAL: {list or "None"}
- MINOR: {list or "None"} — {how resolved}
- AMBIGUOUS: {list or "None"} — {default applied}
```

### Gap Resolution

**CRITICAL gaps:**
1. Stop self-review
2. Ask user the blocking question
3. Update draft with answer
4. Re-run self-review

**MINOR gaps:**
1. Fix in place (edit plan.md or task briefs)
2. Note in summary: "Auto-resolved: {gap} → {fix}"

**AMBIGUOUS gaps:**
1. Apply sensible default
2. Note in summary: "Assumption: {assumption}. Override if needed."

---

## Phase 7: Present Summary + Optional Momus Review

After self-review passes (no CRITICAL gaps), present summary and offer high-accuracy review.

### Summary Presentation

```
## Plan Complete: {feature}

**Plan artifacts:**
- `.agents/features/{feature}/plan.md` (overview + task index)
- `.agents/features/{feature}/task-1.md` through `task-{N}.md`

**Key Decisions:**
- {decision 1}: {rationale}
- {decision 2}: {rationale}

**Scope:**
- IN: {what's included}
- OUT: {what's explicitly excluded}

**Guardrails Applied:**
- {guardrail from Metis}
- {guardrail from Metis}

**Auto-Resolved (minor gaps):**
- {gap}: {how resolved}

**Assumptions (validate if needed):**
- {assumption 1}
- {assumption 2}

**Test Strategy:** {TDD / Tests-after / None}
**Confidence:** {X}/10
**Estimated effort:** {N} tasks across {M} waves

---

**Ready to proceed?**
1. **Execute** → `/execute .agents/features/{feature}/plan.md`
2. **High Accuracy Review** → Have Momus rigorously verify every detail first
```

### Momus Review (If Requested)

If user chooses "High Accuracy Review":

```typescript
task(
  subagent_type="momus",
  run_in_background=false,
  load_skills=[],
  description="Plan review for {feature}",
  prompt=`
    Rigorously review this plan for clarity, verifiability, and completeness.
    
    **Plan location:** .agents/features/{feature}/plan.md
    **Task briefs:** .agents/features/{feature}/task-{1..N}.md
    
    **Review Criteria:**
    
    1. **Acceptance Criteria Quality**
       - Every TODO has clear, testable acceptance criteria?
       - Criteria are objective (not "verify it works")?
       - Success/failure is unambiguous?
    
    2. **QA Scenario Quality**
       - Every task has QA scenarios?
       - Scenarios use specific tools (Bash/Playwright/Read)?
       - Expected results are concrete?
       - Evidence paths are defined?
    
    3. **Dependency Integrity**
       - All dependencies explicitly listed?
       - No implicit assumptions between tasks?
       - Wave assignments are valid?
       - No circular dependencies?
    
    4. **Scope Boundedness**
       - Scope is clearly defined?
       - Exclusions are explicit?
       - No open-ended tasks?
       - Guardrails prevent scope creep?
    
    5. **Execution Readiness**
       - Each task is self-contained?
       - Context references are complete?
       - Patterns to follow are specific?
       - Validation commands are provided?
    
    **Verdict:** APPROVE or REJECT
    
    If REJECT, list specific issues to fix:
    - Task {N}: {issue} → {required fix}
  `
)
```

### Momus Iteration

If Momus rejects:
1. Fix the specific issues listed
2. Re-run Momus review
3. Repeat until APPROVE

If Momus approves:
```
Momus review: **APPROVED**

Plan is verified for clarity, verifiability, and completeness.

Ready to execute: `/execute .agents/features/{feature}/plan.md`
```

---

## Cleanup

After user confirms ready to execute:

1. **Delete draft file:**
   ```
   rm .agents/features/{feature}/planning-draft.md
   ```

2. **Keep plan artifacts:**
   - `plan.md` — overview and task index
   - `task-{N}.md` — individual task briefs
   - (or `plan-master.md` + `plan-phase-{N}.md` for complex features)

3. **Write pipeline handoff** (already defined in Phase 5)

4. **Present next step:**
   ```
   Planning complete. Ready to execute.
   
   Next: /execute .agents/features/{feature}/plan.md
   ```

---

## The Task Format

Every task in a plan MUST include at minimum ACTION, TARGET, IMPLEMENT, VALIDATE. Full plans include all fields:

| Field | Purpose | Example |
|-------|---------|---------|
| **ACTION** | What operation | CREATE / UPDATE / ADD / REMOVE / REFACTOR |
| **TARGET** | Specific file path | `src/services/auth.ts` |
| **IMPLEMENT** | Code-level detail | "Class AuthService with methods: login(), logout()" |
| **PATTERN** | Reference pattern | "Follow pattern in `src/services/user.ts:45-62`" |
| **IMPORTS** | Exact imports | Copy-paste ready import statements |
| **GOTCHA** | Known pitfalls | "Must use async/await — the database client is async-only" |
| **VALIDATE** | Verification command | `npm test -- --grep "auth"` |
| **QA** | Agent verification | "Run login flow, verify token returned" |
| **WAVE** | Parallelization | "Wave 2, Blocked By: Task 1" |

Light plans use a reduced format (ACTION, TARGET, IMPLEMENT, VALIDATE minimum). Full plans include QA and WAVE for every task.

---

## Interaction Protocol

- **Be concise.** Short questions, short confirmations. Don't lecture.
- **Listen more than talk.** The user knows what they want — help them articulate it.
- **Share discoveries.** When you find something in the codebase, share it immediately.
- **Confirm, don't assume.** If unsure about intent, ask. Don't guess.
- **Know when to stop discovering.** When direction is clear, move to the plan. Don't over-explore.
- **If user says "I already told you"** — synthesize from their inputs immediately. Don't re-ask.

---

## Notes

- This command replaces automated planning with interactive discovery
- Archon RAG is preferred for knowledge lookup; falls back to local exploration
- The plan must pass the "no-prior-knowledge test" — another session can execute it without context
- Keep the conversation moving — a planning session should take 10-30 minutes depending on complexity

````

### Current File: `.opencode/commands/council.md`

````text
---
description: Run a multi-perspective council discussion on the given topic
model: openai/gpt-5.3-codex
---

# Council

## Pipeline Position

```
Standalone utility — invoke at any point for architecture decisions
```

Provides multi-model perspective on complex decisions. Reads topic from user input. Outputs synthesized recommendation.

## Topic: $ARGUMENTS

---

## How It Works

Council is a Claude-native discussion command. There is no external dispatch tool. Claude presents 3-5 distinct perspectives on the topic, then offers analysis and synthesis.

**RULE — No Pre-Summarize**: Present perspectives FIRST, in full. Do NOT summarize or synthesize before the user has read the perspectives. Present all perspectives, then offer analysis.

---

## Action

1. **Identify 3-5 distinct perspectives** relevant to the topic. Choose perspectives that represent genuinely different viewpoints, not slight variations of the same position. Examples:
   - "Pragmatist vs Purist vs Performance-focused vs Security-focused"
   - "Junior dev vs Senior dev vs Architect vs User"
   - "Short-term vs Long-term vs Risk-averse vs Innovation-first"

2. **Present each perspective in full** using this format:

```
# Council: {topic}

**{N} perspectives**

---

## Perspective 1: {name/role}
{Full response — 150-300 words. Be genuinely distinct. Argue from this viewpoint's values and priorities.}

---

## Perspective 2: {name/role}
{Full response}

---

## Perspective 3: {name/role}
{Full response}

... (all perspectives)

---

## Analysis
- Agreement: {what all perspectives agree on}
- Conflicts: {where perspectives fundamentally disagree and why}
- Key themes: {2-3 recurring themes}

---

## Synthesis
{The most useful takeaway given all perspectives. Which tradeoffs matter most? What would a well-informed decision-maker conclude?}
```

3. **After presenting all perspectives**, offer to explore any perspective in more depth or to analyze a specific conflict.

---

## Rules

- Max 1 council per user question. Never re-run unless user explicitly requests.
- For brainstorming use 3-4 perspectives; for architecture decisions use 4-5.
- Each perspective must argue its position genuinely — not strawman the others.
- The synthesis must not pick a "winner" unless the evidence clearly points to one — instead map the decision to the user's context and priorities.
- If the user wants a second opinion from an actual external model, suggest they run Codex or another CLI tool on the question separately.

````

### Current File: `.opencode/commands/final-review.md`

````text
---
description: Final review gate — summarize all changes, verify acceptance criteria, get human approval before commit
model: openai/gpt-5.3-codex
---

# Final Review: Pre-Commit Approval Gate

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /final-review (this) → /commit → /pr
```

Final approval gate before commit. Reads changed files and review artifacts. Outputs approval decision.

## Purpose

Final checkpoint between `/code-loop` (or `/code-review`) and `/commit`. Aggregates all review findings, shows what changed, verifies acceptance criteria from the plan, and asks for explicit human approval before committing.

This command does NOT fix code. It summarizes, verifies, and asks.

## Usage

```
/final-review [plan-path]
```

- `plan-path` (optional): Path to the plan file (e.g., `.agents/plans/retrieval-trace.md`). If provided, acceptance criteria are pulled from the plan. If omitted, criteria check is skipped and only the summary + diff is shown.

---

## Step 1: Gather Context

Run these commands to understand the current state:

```bash
git status
git diff --stat HEAD
git diff HEAD
git log -5 --oneline
```

Also check for review artifacts:

```bash
ls .agents/reviews/ 2>/dev/null || echo "No code review artifacts"
ls .agents/reports/loops/ 2>/dev/null || echo "No code loop artifacts"
```

---

## Step 2: Change Summary

Present a concise summary of everything that changed:

### Files Changed

| File | Status | Lines +/- |
|------|--------|-----------|
| {path} | {added/modified/deleted} | +X / -Y |

### Change Overview

For each changed file, write 1-2 sentences describing WHAT changed and WHY:

- `path/to/file.py` — {what changed and why}
- `path/to/test.py` — {what changed and why}

---

## Step 3: Validation Results

Run the full validation pyramid using project-configured commands and report results:

### Level 1: Syntax & Style
```bash
{configured lint command}
{configured format check command}
```

### Level 2: Type Safety
```bash
{configured type check command}
```

### Level 3: Tests
```bash
{configured test command}
```

Report the results as a table:

| Check | Status | Details |
|-------|--------|---------|
| Linting | PASS/FAIL | {details if fail} |
| Formatting | PASS/FAIL | {details if fail} |
| Type checking | PASS/FAIL | {details if fail} |
| Tests | PASS/FAIL | X passed, Y failed |

**If any Level 1-3 checks FAIL**: Stop here. Report failures and recommend running `/code-loop` or `/execute` to fix before retrying `/final-review`.

---

## Step 4: Review Findings Summary

If code review artifacts exist in `.agents/reviews/` or `.agents/reports/loops/`, summarize:

### Review History

| Review | Critical | Major | Minor | Status |
|--------|----------|-------|-------|--------|
| Review #1 | X | Y | Z | {Fixed/Open} |
| Review #2 | X | Y | Z | {Fixed/Open} |

### Outstanding Issues

List any remaining issues from reviews that were NOT fixed:

- **{severity}**: `file:line` — {description} — Reason not fixed: {reason}

If no outstanding issues: "All review findings have been addressed."

---

## Step 5: Acceptance Criteria Check

**If plan-path was provided**, read the plan file and locate the `## ACCEPTANCE CRITERIA` section.

For each criterion, verify whether it is met:

### Implementation Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {criterion text} | MET/NOT MET | {how verified} |
| 2 | {criterion text} | MET/NOT MET | {how verified} |

### Runtime Criteria

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | {criterion text} | MET/NOT MET/DEFERRED | {how verified or why deferred} |

**If plan-path was NOT provided**: Skip this section and note "No plan provided — acceptance criteria check skipped."

---

## Step 6: Final Verdict

Summarize the readiness assessment:

```
FINAL REVIEW SUMMARY
====================

Changes:     X files changed, +Y/-Z lines
Tests:       A passed, B failed
Lint/Types:  CLEAN / X issues remaining
Reviews:     N iterations, M issues fixed, P outstanding
Criteria:    X/Y met (Z deferred)

VERDICT:     READY TO COMMIT / NOT READY
```

**READY TO COMMIT** when:
- All validation levels pass (lint, types, tests)
- No Critical or Major review findings outstanding
- All Implementation acceptance criteria met (if plan provided)

**NOT READY** when:
- Any validation level fails
- Critical or Major review findings still open
- Implementation acceptance criteria not met

---

## Step 7: Ask for Approval

**If READY TO COMMIT:**

Ask the user:

```
Ready to commit. Suggested message:

  {type}({scope}): {description}

Proceed with /commit? (yes / modify message / abort)
```

Wait for explicit user response. Do NOT auto-commit.

**If NOT READY:**

Report what needs to be fixed and suggest next action:

```
Not ready to commit. Outstanding issues:

1. {issue}
2. {issue}

Recommended: Run /code-loop to address remaining issues, then retry /final-review.
```

---

## Output

This command produces no persistent artifact. Its output is the conversation itself — the summary and approval decision. The subsequent `/commit` command handles the actual commit and report.

---

## Notes

- This command is read-only: it does NOT modify files, stage changes, or create commits.
- If the user says "yes", they should run `/commit` as the next command.
- If the user wants to modify the commit message, note it and they can pass it to `/commit`.
- Keep the summary concise — the user has already been through `/code-loop` and wants a quick final check, not a deep re-review.

````


## Change Blocks
For each file, apply this frontmatter transformation pattern:

Current:
```markdown
---
description: ...
model: ...
---
```
Replace with:
```markdown
---
description: ...
---
```

No other lines may change.

## Implementation Steps
1. Edit frontmatter in each of 7 files.
2. Remove only `model:` line.
3. Preserve spacing and content body.
4. Run diff checks to confirm frontmatter-only modifications.

## QA Scenarios
1. **Frontmatter check per file**
   - Tool: Read
   - Action: read first 5 lines
   - Expected: `description:` present, `model:` absent
2. **Body preservation check**
   - Tool: Bash + diff
   - Action: compare body before/after
   - Expected: no changes below frontmatter
3. **Scope check**
   - Tool: git status/diff
   - Expected: only the 7 command files changed for this task

## Parallelization
- Parallelizable:
  - frontmatter edits for the 7 files can be prepared independently.
- Sequential required:
  - final diff verification across all files.

## Acceptance Criteria
- [ ] all 7 interactive commands have no `model:` in frontmatter
- [ ] `description:` preserved in all 7 files
- [ ] command body unchanged byte-for-byte

## Validation Commands
```bash
# file-read + diff checks
```

## Rollback
- If body drift detected, restore file and re-apply frontmatter-only edit.

## Task Completion Checklist
- [ ] 7 files updated
- [ ] QA scenarios passed
- [ ] acceptance criteria all met

