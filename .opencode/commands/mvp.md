---
description: Define or refine the product MVP vision through interactive big-idea discovery
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
