---
description: Create a full Product Requirements Document with architecture, tech specs, and backend design
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
/mvp (big idea) → /prd (full spec) → /pillars (layers) → /decompose (build order) → /build next → /ship
```

This is Step 2. Reads `mvp.md` as primary input. Output feeds `/pillars` and `/decompose`.

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

Do NOT write the PRD until the user confirms.

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

Break the build into 3-4 phases aligned with the pillar structure that `/pillars` will produce.

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

- Full PRD: all sections, full detail
- Lightweight PRD: Sections 1-6, 11-12 only — skip detailed API spec, backend design depth, appendix
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

Next: /pillars — analyze the PRD and identify infrastructure layers.
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
- The backend design section (Section 8) is what makes a PRD useful for `/decompose` — vague service descriptions produce vague specs
- Tech stack in Section 7 must be concrete: specific languages, frameworks, and versions — not "modern web stack"
- Implementation phases in Section 12 should map to what `/pillars` will later call "pillars" — they're the same structure, just less formal
- For existing codebases: scan the repo first, extract actual patterns and stack from the code rather than inventing
