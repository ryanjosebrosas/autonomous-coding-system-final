# Task 3 — Convert Autonomous Commands to Delegation Stubs

## Task Metadata
- Feature: strict-orchestrator
- Wave: 2
- Depends on: Tasks 1 and 2
- Objective: Replace heavyweight autonomous command bodies with strict delegation stubs.

## Objective
Convert these commands:
- `.opencode/commands/prime.md`
- `.opencode/commands/execute.md`
- `.opencode/commands/code-loop.md`
- `.opencode/commands/commit.md`
- `.opencode/commands/pr.md`

Each stub must contain:
1. Pipeline Position
2. Orchestrator Instructions
   - Step 1 Pre-delegation verification
   - Step 2 Delegate (`task(...)` with full 6-section prompt)
   - Step 3 Post-delegation verification
3. Delegation Target

## Locked Mapping
| Command | Delegation | Skills |
|---|---|---|
| /prime | `task(subagent_type="prime-agent", load_skills=["prime"])` | prime |
| /execute | `task(subagent_type="hephaestus", load_skills=["execute"])` | execute |
| /code-loop | `task(subagent_type="hephaestus", load_skills=["code-loop"])` | code-loop |
| /commit | `task(category="quick", load_skills=["git-master", "commit"])` | git-master, commit |
| /pr | `task(category="quick", load_skills=["git-master", "pr"])` | git-master, pr |

## Current Content Baseline (Inline)
### Current File: `.opencode/commands/prime.md`

````text
---
description: Prime agent with project context and auto-detect tech stack
model: ollama/glm-5:cloud
---

# Prime: Load Project Context + Stack Detection

## Pipeline Position

```
/prime (this) → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit → /pr
```

First command in any session. Reads project files and git state. Outputs context summary for session.

Quick context load with automatic tech stack detection. No agents, no bloat. Direct commands and file reads.

## Step 0: Dirty State Check

Before loading context, check for uncommitted changes:

```bash
git status --short
```

**If dirty (files shown):**
```
WARNING: Uncommitted changes detected

{list files from git status --short}

Review these changes before proceeding. Run /commit to save progress, or /prime again to continue.
```

**If clean:** Proceed to Step 1.

---

## Step 0.5: Query Supermemory

Before loading project context, query supermemory for relevant memories from past sessions.

Use the supermemory MCP tool if available, or fall back to the REST API:

**REST API (fallback)**:
```bash
# Read API key
cat ~/.config/opencode/supermemory.jsonc
# Then query:
curl -s -X POST https://api.supermemory.ai/v4/memories/search \
  -H "Authorization: Bearer {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"query": "project context preferences workflow", "containerTag": "opencode_user", "limit": 5}'
```

**If memories found**: Summarize relevant ones in a "Supermemory Context" section at the end of the Step 4 report (preferences, past decisions, gotchas from prior sessions).

**If supermemory is unavailable or returns no results**: Skip silently — do not report an error.

---

## Step 1: Detect Context Mode

Check for code directories using Glob:

```
{src,app,frontend,backend,lib,api,server,client,cmd,pkg,internal}/**
```

**If ANY files found** → **Codebase Mode** (go to Step 2B)
**If no files found** → **System Mode** (go to Step 2A)

---

## Step 2A: System Mode — Load Context

Run these commands directly:

```bash
git log -10 --oneline
git status
```

Read these files if they exist:
- `memory.md`
- `.claude/config.md`

---

## Step 2B: Codebase Mode — Load Context

Run these commands directly:

```bash
git log -10 --oneline
git status
git ls-files
```

Read these files if they exist:
- `memory.md`
- `.claude/config.md`
- Entry point file (auto-detect)

### Auto-Detect Tech Stack

Detect the project's language, framework, and tooling by checking for these files:

#### Package Manifests (detect language + dependencies)

| File | Language | Framework Detection |
|------|----------|-------------------|
| `package.json` | JavaScript/TypeScript | Check deps for react, next, express, fastify, etc. |
| `pyproject.toml` | Python | Check deps for fastapi, django, flask, etc. |
| `Cargo.toml` | Rust | Check deps for actix, axum, rocket, etc. |
| `go.mod` | Go | Check imports for gin, echo, fiber, etc. |
| `Gemfile` | Ruby | Check deps for rails, sinatra, etc. |
| `pom.xml` / `build.gradle` | Java/Kotlin | Check deps for spring, quarkus, etc. |
| `composer.json` | PHP | Check deps for laravel, symfony, etc. |
| `*.csproj` / `*.sln` | C#/.NET | Check for ASP.NET, Blazor, etc. |
| `mix.exs` | Elixir | Check deps for phoenix, etc. |
| `pubspec.yaml` | Dart/Flutter | Check deps for flutter, etc. |

#### Linter Config (detect L1 validation command)

| File | Linter | Command |
|------|--------|---------|
| `.eslintrc*` / `eslint.config.*` | ESLint | `npx eslint .` |
| `ruff.toml` / `[tool.ruff]` in pyproject.toml | Ruff | `ruff check .` |
| `.rubocop.yml` | RuboCop | `rubocop` |
| `.golangci.yml` | golangci-lint | `golangci-lint run` |
| `rustfmt.toml` / `.rustfmt.toml` | rustfmt | `cargo fmt --check` |
| `biome.json` | Biome | `npx biome check .` |
| `.prettierrc*` | Prettier | `npx prettier --check .` |

#### Type Checker Config (detect L2 validation command)

| File / Signal | Type Checker | Command |
|--------------|-------------|---------|
| `tsconfig.json` | TypeScript | `npx tsc --noEmit` |
| `[tool.mypy]` or `mypy.ini` | mypy | `mypy src/` |
| `sorbet/` directory | Sorbet | `srb tc` |
| Rust (any) | rustc | `cargo check` |
| Go (any) | go vet | `go vet ./...` |

#### Test Runner Config (detect L3/L4 validation commands)

| File / Signal | Test Runner | Command |
|--------------|------------|---------|
| `jest.config.*` or jest in package.json | Jest | `npx jest` |
| `vitest.config.*` or vitest in package.json | Vitest | `npx vitest run` |
| `pytest.ini` / `[tool.pytest]` / `conftest.py` | pytest | `pytest` |
| `_test.go` files | go test | `go test ./...` |
| `*_test.rs` / `#[test]` | cargo test | `cargo test` |
| `*_spec.rb` / `.rspec` | RSpec | `rspec` |
| `*_test.rb` / `test/` | Minitest | `ruby -Itest test/**/*_test.rb` |

#### Entry Point Detection

Check in order:
1. `src/index.ts` / `src/index.js` / `src/main.ts` / `src/main.js`
2. `src/app.ts` / `src/app.js` / `app/page.tsx` (Next.js)
3. `src/main.py` / `app/main.py` / `main.py`
4. `src/main.rs` / `cmd/main.go` / `main.go`
5. `src/index.rb` / `config.ru` (Ruby)

Read the first entry point found for project overview.

---

## Step 3: Write/Update Config

If `.claude/config.md` does not exist, create it from auto-detected values:

```markdown
# Project Configuration
<!-- Auto-detected by /prime on {date}. Override any value manually. -->

## Stack
- **Language**: {detected}
- **Framework**: {detected}
- **Package Manager**: {npm/yarn/pnpm/pip/cargo/go/bundle/etc.}

## Validation Commands
- **L1 Lint**: {detected lint command}
- **L1 Format**: {detected format check command}
- **L2 Types**: {detected type check command}
- **L3 Unit Tests**: {detected test command}
- **L4 Integration Tests**: {detected test command with integration marker}
- **L5 Manual**: {describe or "N/A"}

## Source Directories
- **Source**: {src/ | app/ | lib/ | etc.}
- **Tests**: {tests/ | test/ | __tests__/ | *_test.go | etc.}
- **Config**: {config/ | etc.}

## Git
- **Remote**: {auto-detected from git remote -v}
- **Main Branch**: {main | master | auto-detected}
- **PR Target**: {same as main branch}
```

If `.claude/config.md` already exists, read it and use its values (user overrides take priority over auto-detection).

---

## Step 3.5: Detect Pending Work

Scan for in-progress pipeline state. Two sources, merged:

### Source 1: Handoff file

Read `.agents/context/next-command.md` if it exists. Extract:
- **Last Command**: the command that last ran
- **Feature**: the active feature name
- **Next Command**: what should run next
- **Status**: pipeline state
- **Master Plan** and **Phase Progress** (if present): multi-phase tracking
- **Task Progress** (if present): `N/M complete` — task brief mode tracking

Recognized status values:
- `awaiting-execution` — plan written, no execution started
- `executing-tasks` — task brief mode in progress (some briefs done)
- `executing-series` — master plan phase mode in progress
- `awaiting-review` — all execution done, awaiting `/code-loop`
- `awaiting-fixes` — code review found issues, awaiting `/code-review-fix`
- `awaiting-re-review` — fixes applied, awaiting re-review via `/code-review`
- `ready-to-commit` — review complete, awaiting `/commit`
- `ready-for-pr` — committed, awaiting `/pr`
- `pr-open` — PR created, pipeline complete (informational)
- `blocked` — manual intervention required

If the file does not exist or is empty, skip to Source 2.

### Source 2: Artifact scan (fallback + cross-check)

Scan `.agents/features/*/` for non-`.done.md` artifacts. For each feature directory:

1. If `plan.md` exists AND `plan.done.md` does NOT exist:
   - If `task-{N}.md` files exist (any N) → check which `task-{N}.done.md` exist → **task brief mode in progress (task X/Y)**
   - If NO `task-{N}.md` files exist → **legacy plan awaiting execution**
2. If `plan-master.md` exists AND `plan-master.done.md` does NOT exist → check which `plan-phase-{N}.done.md` files exist to determine current phase → **master plan in progress (phase X/Y)**
3. If `report.md` exists AND `report.done.md` does NOT exist → **report awaiting commit**
4. If `review.md` exists AND `review.done.md` does NOT exist → **review with open findings**
5. If `review-{N}.md` exists (any N) without matching `.done.md` → **code-loop review in progress**

### Merge logic

- If the handoff file exists AND artifact scan confirms the same state → use handoff (more specific, has exact next command)
- If the handoff file exists BUT artifact scan contradicts it (e.g., handoff says "awaiting-execution" but `plan.done.md` exists) → the handoff is stale. Use artifact scan state and note "Handoff stale — overridden by artifact state"
- If no handoff file exists → use artifact scan only
- If neither source finds pending work → no pending work section shown

---

## Step 4: Assemble Report

**System Mode** — Present:

```
## Current State
- **Branch**: {current branch name}
- **Status**: {clean/dirty, summary of changes if any}
- **Recent Work**: {list each of the last 10 commits as "- `hash` message"}

## Memory Context
{If memory.md exists:
- **Last Session**: {most recent date from Session Notes}
- **Key Decisions**: {bullet list from Key Decisions section}
- **Active Patterns**: {from Architecture Patterns section}
- **Gotchas**: {from Gotchas section}
- **Memory Health**: {if last session date is >7 days ago, warn "Stale — last updated {date}". Otherwise "Fresh"}
Otherwise: "No memory.md found"}

## Supermemory Context
{If memories found in Step 0.5:
- {bullet list of relevant memories — preferences, past decisions, gotchas}
Otherwise: omit this section}

## Pending Work
{If pending work found in Step 3.5:
- **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
- **[tasks]** {feature} — task {N}/{total} done, next: `codex /execute .agents/features/{feature}/plan.md`
- **[plan]** {feature} — legacy plan awaiting execution: `codex /execute .agents/features/{feature}/plan.md`
- **[master]** {feature} — phase {N}/{total} done, next: `codex /execute .agents/features/{feature}/plan-master.md`
- **[fixes]** {feature} — review found issues: /code-review-fix .agents/features/{feature}/review.md critical+major
- **[re-review]** {feature} — fixes applied, verify: /code-review --feature {feature}
- **[report]** {feature} — execution done, awaiting commit: /commit
- **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
- **[commit]** {feature} — ready to commit: /commit
- **[pr]** {feature} — committed, create PR: /pr {feature}
- **[done]** {feature} — PR open at {pr-url} (pipeline complete)
- **[blocked]** {feature} — blocked: {reason from Next Command field}
(Show only lines that apply. Handoff line first if present.)
Otherwise: "No pending work found."}
```

---

**Codebase Mode** — Present:

```
## Current State
- **Branch**: {current branch name}
- **Status**: {clean/dirty, summary of changes if any}
- **Recent Work**: {list each of the last 10 commits as "- `hash` message"}

## Tech Stack (Auto-Detected)
- **Language**: {language and version}
- **Framework**: {framework and version}
- **Key Dependencies**: {top 5 with versions}
- **Linter**: {tool} → `{command}`
- **Type Checker**: {tool} → `{command}`
- **Test Runner**: {tool} → `{command}`

## Project Overview
{If README.md exists:
- **Purpose**: {what this project does — 1 sentence}
- **Key Capabilities**: {main features — comma-separated list}
Otherwise: "No README.md found"}

## Memory Context
{If memory.md exists:
- **Last Session**: {most recent date from Session Notes}
- **Key Decisions**: {bullet list from Key Decisions section}
- **Active Patterns**: {from Architecture Patterns section}
- **Gotchas**: {from Gotchas section}
- **Memory Health**: {if last session date is >7 days ago, warn "Stale — last updated {date}". Otherwise "Fresh"}
Otherwise: "No memory.md found"}

## Pending Work
{If pending work found in Step 3.5:
- **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
- **[tasks]** {feature} — task {N}/{total} done, next: `codex /execute .agents/features/{feature}/plan.md`
- **[plan]** {feature} — legacy plan awaiting execution: `codex /execute .agents/features/{feature}/plan.md`
- **[master]** {feature} — phase {N}/{total} done, next: `codex /execute .agents/features/{feature}/plan-master.md`
- **[fixes]** {feature} — review found issues: /code-review-fix .agents/features/{feature}/review.md critical+major
- **[re-review]** {feature} — fixes applied, verify: /code-review --feature {feature}
- **[report]** {feature} — execution done, awaiting commit: /commit
- **[review]** {feature} — review has open findings: /code-review-fix .agents/features/{feature}/review.md
- **[commit]** {feature} — ready to commit: /commit
- **[pr]** {feature} — committed, create PR: /pr {feature}
- **[done]** {feature} — PR open at {pr-url} (pipeline complete)
- **[blocked]** {feature} — blocked: {reason from Next Command field}
(Show only lines that apply. Handoff line first if present.)
Otherwise: "No pending work found."}

## Supermemory Context
{If memories found in Step 0.5:
- {bullet list of relevant memories — preferences, past decisions, gotchas}
Otherwise: omit this section}

## Archon Status
{If Archon MCP connected:
- **Connection**: Connected
- **Project**: {project name if found}
- **Active Tasks**: {count of tasks in 'doing' status}
Otherwise: "Archon not connected"}
```

````

### Current File: `.opencode/commands/execute.md`

````text
---
description: Execute an implementation plan
---

# Execute: Implement from Plan

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute (this) → /code-review → /code-loop → /commit → /pr
```

Implements planned tasks. Reads plan from `.agents/features/{feature}/plan.md`. Outputs modified files.

## Hard Entry Gate (Non-Skippable)

`/execute` is plan-bound only.

Before any implementation or validation work:

1. Verify `$ARGUMENTS` is provided and points to an existing markdown file under `.agents/features/`.
2. Verify the input is a planning artifact (feature plan / sub-plan / plan overview), not an ad-hoc prompt.
3. If either check fails, stop immediately and report:
   - `Blocked: /execute requires a /planning-generated plan file in .agents/features/{feature}/. Run /planning first.`

Never execute code changes directly from chat intent without a plan artifact.

## Plan to Execute

Read plan file: `$ARGUMENTS`

## Execution Instructions

Lean mode (default):
- Do not create extra documentation files during execution unless explicitly required by the plan.
- Required artifact from execution is the report at `.agents/features/{feature}/report.md`.
- Keep execution focused on code changes, not documentation.

Slice gate (required):
- Execute only the current approved slice plan.
- Do not begin implementation for a new slice while unresolved Critical/Major code-review findings remain for the current slice.

Incremental execution guardrails (required):
- Deliver one concrete outcome per run.
- Keep changes narrowly scoped and avoid mixing unrelated domains in one pass.
- If execution expands beyond a small slice, stop and split remaining work into a follow-up plan.

### 0.5. Detect Plan Type

Read the plan file.

**If file path contains `plan-master.md`**: This is a multi-phase feature. Execute ONE phase per session:
1. Extract phase sub-plan paths from the SUB-PLAN INDEX table at the bottom of the master plan
2. Scan `.agents/features/{feature}/` for `plan-phase-{N}.done.md` files to determine which phases are complete
3. Identify the next undone phase (lowest N without a matching `.done.md`)
4. **If ALL phases are done** → report "All {total} phases complete. Feature ready for `/code-loop {feature}`." Write handoff with **Status** `awaiting-review` and **Next Command** `/code-loop {feature}`. Rename `plan-master.md` → `plan-master.done.md`. **Stop — do not execute anything.**
5. **If a next phase exists** → report "Master plan: phase {N}/{total}. Executing plan-phase-{N}.md in this session."
   - Read SHARED CONTEXT REFERENCES from the master plan
   - If a previous phase exists (`plan-phase-{N-1}.done.md`), read its HANDOFF NOTES section for continuity context
   - Proceed to execute ONLY `plan-phase-{N}.md` as a single sub-plan (Step 1 onward). After execution completes, proceed to Step 2.5 for phase completion.

**If file path is a single phase file (`-phase-{N}.md`)**: Execute as a single sub-plan (normal mode, but note it's part of a larger feature). If `plan-master.md` exists in the same directory, read its SHARED CONTEXT REFERENCES for additional context. After execution completes, proceed to Step 2.5 for phase completion.

**If file contains `<!-- PLAN-SERIES -->`**: Treat as master plan — extract sub-plan paths from PLAN INDEX and apply the same one-phase-per-session logic above.

**If file path ends with `plan.md` (task brief mode — default)**: Check for task brief files:
1. Scan `.agents/features/{feature}/` for `task-{N}.md` files (any N)
2. **If `task-{N}.md` files exist** → Task Brief Mode. Execute ONE brief per session:
   a. Scan for `task-{N}.done.md` files to determine which briefs are complete
   b. Identify the next undone brief (lowest N without a matching `.done.md`)
   c. **If ALL briefs are done** → report "All {total} task briefs complete. Feature ready for `/code-loop {feature}`." Write handoff with **Status** `awaiting-review` and **Next Command** `/code-loop {feature}`. Rename `plan.md` → `plan.done.md`. **Stop — do not execute anything.**
   d. **If a next brief exists** → report "Task brief mode: task {N}/{total}. Executing task-{N}.md in this session."
      - Read the PRIOR TASK CONTEXT section from `task-{N}.md` (if task N > 1, it contains context from task N-1)
      - Proceed to execute ONLY `task-{N}.md` as the plan (Step 1 onward, treating the brief as the plan). After execution completes, proceed to Step 2.6 for task completion.
3. **If NO `task-{N}.md` files exist** → Legacy single plan mode. Proceed normally (the entire `plan.md` is the execution guide). Skip Steps 2.5 and 2.6.

**If no marker and not plan.md**: Standard single plan — proceed normally, skip Steps 2.5 and 2.6.

### 1. Read and Understand

- **In task brief mode**: Read the ENTIRE task brief (`task-{N}.md`) — all steps, validation commands, acceptance criteria. The task brief is self-contained; you do NOT need to re-read `plan.md` during execution.
- **In legacy single plan or phase mode**: Read the ENTIRE plan carefully — all tasks, dependencies, validation commands, testing strategy.
- Check `memory.md` for gotchas related to this feature area
- **Derive feature name** from the plan path: extract the feature directory name from `.agents/features/{feature}/`.
    Example: `.agents/features/user-auth/plan.md` → `user-auth`. For plan series: `.agents/features/big-feature/plan-master.md` → `big-feature`.
    Store this — you'll use it for all artifact paths within `.agents/features/{feature}/`.

### 1.5. RAG Knowledge Retrieval (Optional)

If Archon MCP is available:
- `rag_search_knowledge_base(query="...", match_count=5)` — relevant documentation (2-5 keywords)
- `rag_search_code_examples(query="...", match_count=3)` — similar patterns

If no Archon/RAG available, proceed with the plan as written — plans are designed to be self-contained.

### 1.6. Archon Task Status (if connected)

If Archon MCP is connected and plan has Archon task IDs in metadata:
- Call `manage_task("update", task_id="...", status="doing")` for the first task
- Update status as you progress through tasks

### 2. Execute Tasks in Order

For EACH task in "Step by Step Tasks":

**a.** Read the task and any existing files being modified.

**b.** Implement the task following specifications exactly. Maintain consistency with existing patterns.

**c.** Verify: check syntax, imports, types after each change.

**d.** Track divergences (if implementation differs from plan):
   - Note what changed and why
   - Classify as Good or Bad divergence (see Divergence Classification below)
   - Document in execution report

**e.** If Archon connected: `manage_task("update", task_id="...", status="done")` for completed task.

**f.** Move to the next task.

---

### Divergence Classification (During Execution)

When implementation deviates from the plan, classify immediately:

**Good Divergence (Justified) ✅** — Plan limitations discovered:
- Plan assumed something that didn't exist in the codebase
- Better pattern discovered during implementation
- Performance or security issue required different approach
- Technical constraint not known at planning time

**Bad Divergence (Problematic) ❌** — Execution issues:
- Ignored explicit constraints in plan
- Created new architecture instead of following existing patterns
- Took shortcuts introducing technical debt
- Misunderstood requirements or plan instructions

**Root Cause Categories:**
- `unclear plan` — Plan didn't specify X clearly
- `missing context` — Didn't know about Y during planning
- `missing validation` — No test/check for Z
- `manual step repeated` — Did manually what should be automated

**Track each divergence for the execution report** — don't rely on memory.



### 2.5. Phase Completion (for master plan / plan series phases)

After executing a single phase sub-plan (routed here from Step 0.5), complete the phase:

1. Let the existing completion sweep (Step 6.6) handle renaming `plan-phase-{N}.md` → `plan-phase-{N}.done.md`
2. Determine phase progress: count `.done.md` phase files vs total phases from the master plan's SUB-PLAN INDEX
3. **If more phases remain:** Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (phase {N} of {total})
   - **Feature**: {feature}
   - **Next Command**: /execute .agents/features/{feature}/plan-master.md
   - **Master Plan**: .agents/features/{feature}/plan-master.md
   - **Phase Progress**: {N}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: executing-series
   ```
   Report: "Phase {N}/{total} complete. Next session: `/prime` → `/execute .agents/features/{feature}/plan-master.md` to continue with phase {N+1}."
   **End session.** Do NOT continue to the next phase — each phase gets a fresh context window.

4. **If ALL phases done** — rename `plan-master.md` → `plan-master.done.md`. Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (phase {total} of {total})
   - **Feature**: {feature}
   - **Next Command**: /code-loop {feature}
   - **Master Plan**: .agents/features/{feature}/plan-master.done.md
   - **Phase Progress**: {total}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: awaiting-review
   ```
   Report: "All {total} phases complete. Feature ready for review. Next session: `/prime` → `/code-loop {feature}`."

5. **If phase execution failed** — do NOT rename the phase file (no `.done.md`). Write handoff with **Status**: `blocked` and **Next Command**: `[manual intervention — phase {N} failed]`. Report the failure and stop.

**Key rule**: `/execute` with a master plan executes exactly one phase per invocation — one phase per session. The next session picks up the next phase via `/prime` → handoff.

### 2.6. Task Brief Completion (for task brief mode)

After executing a single task brief (routed here from Step 0.5), complete the task:

1. Let the existing completion sweep (Step 6.6) handle renaming `task-{N}.md` → `task-{N}.done.md`
2. Determine task progress: count `.done.md` task files vs total tasks from `plan.md`'s TASK INDEX table
3. **If more tasks remain:** Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (task {N} of {total})
   - **Feature**: {feature}
   - **Next Command**: /execute .agents/features/{feature}/plan.md
   - **Task Progress**: {N}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: executing-tasks
   ```
   Report: "Task {N}/{total} complete. Next session: `/prime` → `/execute .agents/features/{feature}/plan.md` to continue with task {N+1}."
   **End session.** Do NOT continue to the next task brief — each brief gets a fresh context window.

4. **If ALL tasks done** — rename `plan.md` → `plan.done.md`. Write handoff:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /execute (task {total} of {total})
   - **Feature**: {feature}
   - **Next Command**: /code-loop {feature}
   - **Task Progress**: {total}/{total} complete
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: awaiting-review
   ```
   Report: "All {total} task briefs complete. Feature ready for review. Next session: `/prime` → `/code-loop {feature}`."

5. **If task execution failed** — do NOT rename the task file (no `.done.md`). Write handoff with **Status**: `blocked` and **Next Command**: `[manual intervention — task {N} failed]`. Report the failure and stop.

**Key rule**: `/execute` with task briefs executes exactly one brief per invocation — one brief per session. The next session auto-detects the next undone brief via artifact scan.

### 3. Implement Testing Strategy

Create all test files specified in the plan. Implement test cases. Ensure edge case coverage.

### 4. Run Validation Commands

Execute ALL validation commands from the plan in order. Fix failures before continuing.

Validation policy (non-skippable):
- Every execution loop must run full validation depth for the current slice.
- Minimum expected pyramid: syntax/style → type safety → unit tests → integration tests → manual verification.
- Do not treat single checks as sufficient proof of completion.
- Use project-configured commands from `.claude/config.md` or auto-detected by `/prime`.

### 5. Self-Review (Plan Cross-Check)

Before writing the report, re-read the plan file and systematically verify every commitment was met. This is not a rubber stamp — genuinely question whether each item was done.

**5a. Task-by-task cross-check:**

Re-read the plan's STEP-BY-STEP TASKS section. For each task, verify:
- Was the ACTION performed on the correct TARGET file?
- Does the implementation match what IMPLEMENT specified?
- Was the VALIDATE command run and did it pass?
- If anything diverged, was it tracked as a divergence in Step 2d?

Record a status for each task:
- **Done** — implemented as planned
- **Done (diverged)** — implemented differently, divergence already tracked
- **Skipped** — not implemented, with reason
- **Partial** — partially implemented, with what's missing

**5b. Acceptance criteria cross-check:**

Re-read the plan's ACCEPTANCE CRITERIA section (both Implementation and Runtime). For each criterion:
- Is there concrete evidence from this run that proves it's met?
- If a criterion cannot be verified yet (e.g., runtime-only), mark as "deferred to runtime"
- If a criterion was NOT met, flag it — do NOT mark it `[x]` in Step 6

**5c. File inventory check:**

Compare what was actually created/modified against the plan:
- Were all "New Files to Create" actually created?
- Were all files in "Expected Files Touched" actually touched?
- Were any files changed that the plan did NOT mention? (flag as unplanned)

**5d. Implementation summary:**

Produce a concise summary using this exact format:

~~~
SELF-REVIEW SUMMARY
====================
Tasks:      {completed}/{total} ({skipped} skipped, {diverged} diverged)
Files:      {added} added, {modified} modified ({unplanned} unplanned)
Acceptance: {met}/{total} implementation criteria met ({deferred} deferred to runtime)
Validation: L1 {pass/fail} | L2 {pass/fail} | L3 {pass/fail} | L4 {pass/fail} | L5 {pass/fail}
Gaps:       {list any gaps, or "None"}
Verdict:    {COMPLETE | INCOMPLETE — see gaps above}
~~~

**Example (filled out):**
~~~
SELF-REVIEW SUMMARY
====================
Tasks:      7/7 (0 skipped, 1 diverged)
Files:      6 added, 0 modified (0 unplanned)
Acceptance: 6/6 implementation criteria met (2 deferred to runtime)
Validation: L1 PASS | L2 PASS | L3 PASS | L4 N/A | L5 PASS
Gaps:       None
Verdict:    COMPLETE
~~~

Display this summary inline to the user before writing the report.

**If verdict is INCOMPLETE:**
- List each gap with its source (task number, criterion, or file)
- For each gap, decide: fix now (return to Step 2) or accept and document as skipped
- Do NOT proceed to Step 6 until all gaps are resolved or explicitly accepted as skips
- If returning to fix, re-run the self-review after the fix

**If verdict is COMPLETE:**
- Proceed to Step 6
- The summary data feeds directly into the execution report sections:
  - Task statuses → "Completed Tasks" section
  - Divergences → "Divergences from Plan" section
  - Skipped items → "Skipped Items" section
  - File inventory → "Meta Information" section (files added/modified)

**Series Mode note:** In Master + Sub-Plan execution, run this self-review after EACH phase sub-plan, not just at the end. Each phase gets its own summary. The final phase summary covers the whole feature.

### 6. Update Plan Checkboxes

Mandatory after successful execution:
- Update the executed plan file in place.
- In `ACCEPTANCE CRITERIA` and `COMPLETION CHECKLIST`, convert completed items from `- [ ]` to `- [x]`.
- Leave unmet items unchecked and append a short blocker note on that line.
- Never mark an item `- [x]` unless validation evidence exists in this run.

### 6.5 Update .agents Index (if present)

If `.agents/INDEX.md` exists, update plan status entry:
- Mark executed plan as done with strike + done tag:
  - `[done] ~~{feature}/plan.md~~`
- Add reference to execution report path: `.agents/features/{feature}/report.md`
- Do not create `.agents/INDEX.md` if it does not exist.

### 6.6. Execution Report

After successful execution, save the execution report:
- **Path**: `.agents/features/{feature}/report.md`

**Multi-task mode (task briefs):** If this is one of multiple task briefs:
- **First task (task 1):** Create `report.md` with the full template header (Meta Information through Ready for Commit), then add a `## Task 1: {task title}` section with this task's details (completed tasks, divergences, validation results).
- **Subsequent tasks (task 2+):** Read the existing `report.md`, append a new `## Task {N}: {task title}` section with this task's details. Update the Meta Information totals (cumulative files added/modified, cumulative lines changed). Do NOT overwrite previous task sections.
- **Final task:** After appending the last task section, update the top-level Self-Review Summary and Ready for Commit sections with cumulative totals.

**Single plan / single phase:** Write the full report as a single document (no per-task sections needed).

**Required sections:**
- Meta Information (plan file, files added/modified, lines changed)
- Completed Tasks (count/total with status)
- Divergences from Plan (with Good/Bad classification + root cause for each)
- Skipped Items (what from plan was not implemented + why)
- Validation Results (L1-L5 pass/fail with output)
- Tests Added (files created, pass/fail status)
- Issues & Notes (challenges, recommendations)
- Ready for Commit (yes/no + blockers)

Completion sweep (required):
- Before finishing `/execute`, rename completed artifacts within `.agents/features/{feature}/`:
  - `task-{N}.md` → `task-{N}.done.md` (completed task brief)
  - `plan.md` → `plan.done.md` (only when ALL task briefs done, OR legacy single plan fully executed)
  - `plan-phase-{N}.md` → `plan-phase-{N}.done.md` (for each completed phase)
  - `plan-master.md` → `plan-master.done.md` (only when ALL phases are done)
  - `review.md` → `review.done.md` (if a review exists and all findings were addressed)
  - `review-{N}.md` → `review-{N}.done.md` (code-loop reviews)
  - `loop-report-{N}.md` → `loop-report-{N}.done.md` (code-loop reports)
- Never leave a completed artifact without the `.done.md` suffix.

### 6.7. Pipeline Handoff Write (required)

After completion sweep, overwrite `.agents/context/next-command.md`.

**If this was the final task brief or a legacy single plan (all done):**
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /execute
- **Feature**: {feature}
- **Next Command**: /code-loop {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: awaiting-review
```

**If more task briefs remain:** The task brief handoff (Step 2.6, item 3) already handled it with `executing-tasks` status. Do not overwrite it here.

**If this was the last phase of a master plan:** Use the `awaiting-review` format above. If more phases remain, the series mode handoff (Step 2.5, item 7) already handled it.

## Output Report

The execution report was saved in Step 6.6 to: `.agents/features/{feature}/report.md`

Also display the report inline for the user. The saved file is consumed by `/system-review` and `/commit`.

**Do NOT re-write the report here** — Step 6.6 already handled it. This section is for inline display only.

---

### Meta Information

- **Plan file**: {path to the plan that guided this implementation}
- **Plan checkboxes updated**: {yes/no}
- **Files added**: {list with full paths, or "None"}
- **Files modified**: {list with full paths}
- **RAG used**: {yes — describe what was looked up / no — plan was self-contained}
- **Archon tasks updated**: {yes — N tasks marked done / no — not connected}
- **Execution agent**: Codex CLI (or specify if different agent was used)

### Completed Tasks

For each task in the plan:
- Task N: {brief description} — {completed / skipped with reason}

### Divergences from Plan

For each divergence (if any):
- **What**: {what changed from the plan}
- **Planned**: {what the plan specified}
- **Actual**: {what was implemented instead}
- **Reason**: {why the divergence occurred}
- **Classification**: Good ✅ / Bad ❌
- **Root Cause**: {unclear plan | missing context | missing validation | manual step repeated | other}

If no divergences: "None — implementation matched plan exactly."

### Skipped Items

List anything from the plan that was NOT implemented:
- **{Item}**: {what was skipped}
  - **Reason**: {why it was skipped}

If none: "None — all planned items implemented."

### Validation Results

```bash
# Output from each validation command run in Step 4
```

### Tests Added

- {test files created, number of test cases, pass/fail status}
- If no tests: "No tests specified in plan."

### Issues & Notes

- {any issues not addressed in the plan}
- {challenges encountered during implementation}
- {recommendations for plan or process improvements}
- If none: "No issues encountered."

### Ready for Commit

- All changes complete: {yes/no}
- All validations pass: {yes/no}
- Ready for `/commit`: {yes/no — if no, explain what's blocking}

````

### Current File: `.opencode/commands/code-loop.md`

````text
---
description: Automated review → fix → review loop until clean
model: openai/gpt-5.3-codex
---

# Code Loop: Automated Fix Loop

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop (this) → /commit → /pr
```

Automated review-fix cycle. Reads review artifacts. Outputs clean code ready for commit.

## Purpose

Automates the fix loop workflow:
```
/code-review → /code-review-fix (review artifact) → validation → /code-review
```

Runs until all issues are fixed or unfixable error detected.

**Next step after clean exit:** Run `/commit` to commit changes, then `/pr` to create a pull request.

Slice completion rule:
- A slice is considered complete only when code review returns no Critical/Major issues (or user explicitly accepts remaining minor issues).
- Start the next slice only after this completion condition.

Incremental rule:
- Keep each loop focused on one concrete outcome.
- If fixes spread into unrelated domains, stop and split into a follow-up loop/plan.

## Usage

```
/code-loop [feature-name]
```

- `feature-name` (optional): Used for report file. If omitted, read `.agents/context/next-command.md` for the active feature name.

---

## Pre-Loop: RAG Context Load (Optional)

Before starting the review loop, gather relevant documentation context:

**If RAG knowledge base MCP is available:**
1. Search for relevant patterns based on the feature/files being reviewed (2-5 keyword queries)
2. Search for reference implementations of similar patterns
3. Pass context to code-review steps so reviews can cross-reference against documentation

**If RAG unavailable:** Proceed without RAG context — the review steps have their own exploration capabilities.

---



---

## Fix Loop

### Checkpoint System (Context Compaction)

At the start of EACH iteration, save progress checkpoint:
```markdown
**Checkpoint {N}** - {timestamp}
- Issues remaining: X (Critical: Y, Major: Z)
- Last fix: {what was fixed}
- Validation: {lint/test results}
```

**Why:** If context compacts or session interrupts, work can be recovered from last checkpoint.

### Iteration 1-N

1. **Run `/code-review`**
   - Save to: `.agents/features/{feature}/review-{N}.md`

2. **Check findings:**
   - **If 0 issues:** → Exit loop, go to commit
   - **If only Minor issues:** → Ask user: "Fix minor issues or skip to commit?"
   - **If Critical/Major issues:** → Continue to fix step

 3. **Fix issues with `/code-review-fix` (primary path)**

    Run the dedicated fix command on the review artifact:
    ```
    /code-review-fix .agents/features/{feature}/review-{N}.md critical+major
    ```

    Where scope is:
    - `critical+major` — Fix Critical and Major only (default for loop)
    - `all` — Fix all issues including Minor
    - `critical` — Fix Critical only
    - `{file-path}` — Fix issues only in specified file(s)

    `/code-review-fix` handles: reading the review, fixing by severity order, running validation after each fix. After this fix pass succeeds, mark the source review file `.done.md`.



 4. **Run full validation for this slice:**
   - Run lint/style checks (project-configured)
   - Run type safety checks (project-configured)
   - Run unit tests (project-configured)
   - Run integration tests (project-configured)
   - Run manual verification steps from the active plan

 5. **Check for unfixable errors:**
   - Command not found → Stop, report missing tool
   - Dependency errors → Stop, report missing dependencies
   - Syntax errors blocking analysis → Stop, report file:line
   - If no unfixable errors → Continue to next iteration

### Loop Exit Conditions

| Condition | Action |
|-----------|--------|
| 0 issues + validation passes | → Hand off to `/commit` |
| Only Minor issues | → Ask user: fix or defer? |
| Unfixable error detected | → Stop, report what's blocking |

### Escape Hatch: `/planning` → `/execute` for Architectural Fixes

If `/code-review-fix` cannot handle the fix (architectural changes, multi-file refactors, complex logic rewrites):

1. **Create fix plan via `/planning`**
   - Input: latest review artifact `.agents/features/{feature}/review-{N}.md`
   - Output: `.agents/features/{feature}/fixes-{N}.md`
   - The fix plan must define a single bounded fix slice (Critical/Major first)

2. **Run `/execute` with the fix plan**
   - Input: `.agents/features/{feature}/fixes-{N}.md`
   - After this fix pass succeeds, mark the source review file `.done.md`

**When to escalate to `/planning` → `/execute`**: Fix requires changes to 5+ files, introduces new abstractions, or changes API surfaces.
**When to stay with `/code-review-fix`**: Everything else — null checks, imports, naming, type fixes, missing error handling, test fixes.

### User Interruption Handling

**If user presses Ctrl+C during iteration:**
1. Save current checkpoint to `.agents/features/{feature}/interrupted-{N}.md`
2. Report progress and remaining issues
3. Clean exit (no partial commits)

**If context compacts (session memory limit):**
1. Last checkpoint is already saved (from checkpoint system)
2. Next iteration reads checkpoint and continues
3. Report: "Resumed from checkpoint {N}"

---

## Handoff (When Loop Exits Clean)

1. **Report completion:**
   ```
   Code loop complete

   Iterations: N
   Issues fixed: X (Critical: Y, Major: Z, Minor: W)
   Status: Ready for /commit
   ```

2. Tell the user to run `/commit` when ready. The user reviews the output and commits when satisfied.

3. **Pipeline Handoff Write** (required): Overwrite `.agents/context/next-command.md`:
   ```markdown
   # Pipeline Handoff
   <!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

   - **Last Command**: /code-loop
   - **Feature**: {feature}
   - **Next Command**: /commit
   - **Timestamp**: {ISO 8601 timestamp}
   - **Status**: ready-to-commit
   ```

---

## Output Report

Working filename: `.agents/features/{feature}/loop-report-{N}.md`

Write the loop report to the working filename as the loop progresses. Do NOT use `.done.md` until the completion sweep.

Done marker rule:
- Mark done status in filenames only by appending `.done` before `.md`.
- Do not modify markdown H1/title text just to indicate completion.
- On clean exit (0 issues or user accepts), perform a **completion sweep** as the final step before commit:
  1. Rename the loop report: `.agents/features/{feature}/loop-report-{N}.md` → `.agents/features/{feature}/loop-report-{N}.done.md`
  2. Rename the last review file: `.agents/features/{feature}/review-{N}.md` → `.agents/features/{feature}/review-{N}.done.md`
  3. Rename any fix plan artifacts that were fully applied: `.agents/features/{feature}/fixes-{N}.md` → `.agents/features/{feature}/fixes-{N}.done.md`
- On interrupted/stopped exit, leave filenames as `.md` (not done).

### Loop Summary

- **Feature**: {feature-name}
- **Iterations**: N
- **Final Status**: Clean / Stopped (unfixable error) / Stopped (user interrupt) / Stopped (user choice)

### Issues Fixed by Iteration

| Iteration | Critical | Major | Minor | Total |
|-----------|----------|-------|-------|-------|
| 1 | X | Y | Z | T |
| 2 | X | Y | Z | T |
| N (final) | X | Y | Z | T |

### Checkpoints Saved

- `.agents/features/{feature}/checkpoint-1.md` — Iteration 1 progress
- ...
- **If interrupted:** `.agents/features/{feature}/interrupted-{N}.md` — Resume point

### Validation Results

```bash
# Output from lint/typecheck/tests
```

---

## Error Handling

**Distinguish Fixable vs Unfixable Errors:**

**Fixable (continue loop):**
- Code review finds issues → `/code-review-fix` fixes them
- Lint errors → `/code-review-fix` fixes formatting
- Type errors (simple) → `/code-review-fix` adds type annotations
- Test failures → `/code-review-fix` fixes logic

**Unfixable (stop loop, report to user):**
- Command not found (lint tool not installed)
- Missing dependencies (package install needed)
- Syntax errors preventing parsing
- Circular dependencies requiring refactor
- Missing files or broken imports
- Architecture-level changes needed

**If `/code-review` fails:** Retry once. If still fails: Stop, report error.
**If `/code-review-fix` fails:** Report which issues couldn't be fixed. If unfixable: Stop. If temporary: Continue.
**If `/commit` fails:** Report error (pre-commit hook?). Don't retry automatically.
**If user interrupts (Ctrl+C):** Save checkpoint, report progress, clean exit.

````

### Current File: `.opencode/commands/commit.md`

````text
---
description: Create git commit with conventional message format
model: ollama/glm-5:cloud
---

# Commit: Create Git Commit

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit (this) → /pr
```

Commits completed work. Reads changed files from git status. Outputs commit hash and feeds `/pr`.

## Files to Commit

Files specified: $ARGUMENTS

(If no files specified, stage and commit only files relevant to the current spec. Never use `git add -A`.)

## Commit Process

### 1. Review Current State

```bash
git status
git diff HEAD
```

If staging specific files: `git diff HEAD -- $ARGUMENTS`

### 2. Generate Commit Message

Generate the commit message directly:
- Format: `type(scope): short description` (imperative mood, max 50 chars)
- Types: feat, fix, refactor, docs, test, chore, perf, style, plan
- Optional body: 3 bullet points max — what and why, not how

### 3. Stage and Commit

Before staging, run artifact completion sweep (required):
- Scan `.agents/features/*/` for completed artifacts and rename `.md` → `.done.md`:
  - `report.md` → `report.done.md` (execution report — commit means it's final)
  - `review.md` → `review.done.md` (if all findings were addressed in this commit)
  - Any other active artifacts that are fully resolved
- Keep filenames as the source of completion status; do not rely on title edits.
- Only rename artifacts in feature folders relevant to this commit's changes.

```bash
git add $ARGUMENTS  # or git add -- src/ tests/ if no files specified (scoped to relevant files)
git commit -m "{generated message}"
```

### 4. Confirm Success

```bash
git log -1 --oneline
git show --stat
```

## Output Report

**Commit Hash**: [hash]
**Message**: [full message]
**Files**: [list with change stats]
**Summary**: X files changed, Y insertions(+), Z deletions(-)

**Next**: Push to remote (`git push`) or continue development.

### 5. Update Memory (if memory.md exists)

Append to memory.md: session note, any lessons/gotchas/decisions discovered. Keep entries 1-2 lines each. Don't repeat existing entries. Skip if memory.md doesn't exist.

### 5.5. Save to Supermemory (if applicable)

After a successful commit, save a memory of what was done and any lessons learned:

**REST API**:
```bash
# Read API key
cat ~/.config/opencode/supermemory.jsonc
# Then save:
curl -s -X POST https://api.supermemory.ai/v4/memories \
  -H "Authorization: Bearer {api_key}" \
  -H "Content-Type: application/json" \
  -d '{"memories":[{"content":"{feature} committed: {commit message}. {any gotchas or lessons from this session, 1-2 sentences max}"}],"containerTag":"opencode_user"}'
```

Only save if there is something genuinely useful to remember (decisions made, gotchas encountered, non-obvious patterns used). Skip if the commit is routine and adds no new information.

**If supermemory is unavailable**: Skip silently.

### 5.6. Pipeline Handoff Write (required)

After successful commit, overwrite `.agents/context/next-command.md`:

```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /commit
- **Feature**: {feature, from commit scope or .agents/context/next-command.md}
- **Next Command**: /pr {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: ready-for-pr
```

Derive `{feature}` from: (1) the commit scope (e.g., `feat(auth): ...` → `auth`), (2) the previous handoff file's Feature field, or (3) the most recent `.agents/features/*/report.md`.



**If commit fails** (e.g., pre-commit hooks, merge conflict, empty commit): Write handoff with the previous feature name preserved:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /commit (failed)
- **Feature**: {feature}
- **Next Command**: /commit
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```
Report the error clearly: what failed, why, and what the user should do to fix it. Do NOT leave the handoff stale from the previous command.

### 6. Report Completion

Report the commit details and suggest next steps:
- "Committed. Next: `/pr {feature}` to create a pull request."

## Notes

- If no changes to commit, report clearly
- If commit fails (pre-commit hooks), report the error
- Follow the project's commit message conventions
- Do NOT include Co-Authored-By lines in commits

````

### Current File: `.opencode/commands/pr.md`

````text
---
description: Create feature branch, push, and open PR
model: openai/gpt-5.3-codex
---

# PR: Create Branch and Pull Request

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit → /pr (this)
```

Creates pull request for committed work. Reads commit history from git. Outputs PR URL.

## Arguments

`$ARGUMENTS` — Optional: feature name for the branch (e.g., `supabase-provider`), or PR title override

(If no arguments, derive branch name from the latest commit message)

## Prerequisites

- Commit must already exist (run `/commit` first)
- If working tree is dirty, report and exit

---

## Step 1: Gather Context

```bash
git status
git log -5 --oneline
git remote -v
git branch --show-current
```

**If working tree is dirty (uncommitted changes):**
- Report: "Uncommitted changes detected. Run `/commit` first."
- Exit — do NOT commit automatically.

---

## Step 2: Determine Branch Name and Scope

Each PR gets its own branch. The branch name should reflect the specific feature/fix, not a long-lived epic branch.

**Branch naming convention**: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`

> Note: `FEATURE_NAME` is resolved in Step 2a below — read the full step before deriving the branch name.

Derive the branch name:
1. If `$ARGUMENTS` contains a feature name → use it directly (e.g., `feat/supabase-provider`)
2. If `FEATURE_NAME` detected from report (Step 2a below) → use it: `feat/{FEATURE_NAME}` (or `fix/` / `chore/` based on the commit type of `PR_COMMITS`)
3. Otherwise → derive from the latest commit message:
   - `feat(memory): add Supabase provider` → `feat/supabase-provider`
   - `fix(rerank): handle empty results` → `fix/rerank-empty-results`

---

**Auto-detect feature and scope commits from execution report:**

**Step 2a — Identify the feature:**
1. If `$ARGUMENTS` is a feature slug (e.g., `/pr build-batch-dispatch-wiring`) → `FEATURE_NAME = $ARGUMENTS`
2. Otherwise → find the most recently modified report file:
   - Unix: `ls -t .agents/features/*/report.md .agents/features/*/report.done.md 2>/dev/null | head -1`
   - Windows: check each path in `.agents/features/*/report.md` and `.agents/features/*/report.done.md` directly, use the one with the latest modification time
   - Extract `FEATURE_NAME` from the result: the directory segment between `features/` and the filename.
     Example: `.agents/features/build-batch-dispatch-wiring/report.done.md` → `FEATURE_NAME = build-batch-dispatch-wiring`
3. If no report found → `FEATURE_NAME = null`, skip to fallback at end of Step 2c.

**Step 2b — Locate report and parse files touched:**

Try each path in order, use the first that exists:
```
.agents/features/{FEATURE_NAME}/report.md        ← canonical active
.agents/features/{FEATURE_NAME}/report.done.md   ← canonical done
.agents/reports/{FEATURE_NAME}-report.md         ← legacy active
.agents/reports/{FEATURE_NAME}-report.done.md    ← legacy done
```

Store the found path as `REPORT_PATH`.

From the `## Meta Information` section of `REPORT_PATH`, parse:
- Lines matching `- **Files modified**: {value}` — extract `{value}`
- Lines matching `- **Files added**: {value}` — extract `{value}`
- If `{value}` is exactly `None` → skip that line
- Otherwise: split `{value}` on `,` → for each item: trim whitespace → strip surrounding backticks → add to list
- Stop parsing at the next `##` header

Collect all resulting paths into `FEATURE_FILES`.

**Step 2c — Intersect with unpushed commits:**

```bash
# Find unpushed commits that touched the feature's files only
git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline -- {FEATURE_FILES}
```

Store the SHA list as `PR_COMMITS` (oldest first).

**If `PR_COMMITS` is empty** (feature already pushed, or files not in git log):
Report: "No unpushed commits found touching `{FEATURE_FILES}` — feature may already be pushed."
Fall back to full unpushed list:
```bash
git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline
```
Ask user to confirm which commits to include.

**If `REPORT_PATH` not found or `FEATURE_FILES` is empty** (no report, or both lines were `None`):
Report: "No execution report found for `{FEATURE_NAME}`. Showing all unpushed commits."
Fall back to:
```bash
git log {REMOTE}/{MAIN_BRANCH}..HEAD --oneline
```

**Display detection result before proceeding** (always show, even in fallback):
```
Feature detected:  {FEATURE_NAME}   (or "unknown" if null)
Report:            {REPORT_PATH}    (or "not found")
Files touched:     {FEATURE_FILES}  (or "none detected")
Commits selected:  {PR_COMMITS}

Proceeding with {N} commit(s) → {branch-name}
Abort with Ctrl+C if this scope is wrong.
```

---

## Step 3: Detect Remote and Main Branch

Auto-detect from git config (no hardcoded values):

```bash
# Detect remote name (prefer 'origin', fall back to first remote)
git remote | head -1

# Detect main branch
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || echo "main"

# Fetch to ensure remote refs are current
git fetch {REMOTE}
```

Store:
- `REMOTE` — the remote name (usually `origin`)
- `MAIN_BRANCH` — the main branch name (usually `main` or `master`)
- `BASE_SHA` — the current tip of `{REMOTE}/{MAIN_BRANCH}`

If `.claude/config.md` specifies these values, use those instead.

---

## Step 4: Create Isolated Feature Branch and Push

**Critical:** The feature branch must contain ONLY the PR's commits — not the full local history.

```bash
# 1. Branch from remote main (not local HEAD) — clean base with no extra commits
git checkout -b <branch-name> {REMOTE}/{MAIN_BRANCH}

# 2. Cherry-pick only the selected feature commits (oldest first)
git cherry-pick <commit-sha-1> <commit-sha-2> ...   # PR_COMMITS, oldest→newest

# 3. Push only this branch
git push {REMOTE} <branch-name> -u

# 4. Return to original branch
git checkout <original-branch>
```

**If cherry-pick conflicts:**
- Report which commit conflicted and which files
- Do NOT auto-resolve — stop and surface to user

**If branch name already exists on remote:**
- Report: "Branch `<name>` already exists on remote."
- Ask: create with a suffix (e.g., `feat/supabase-provider-2`), or use existing?

**Result:** The feature branch on remote contains exactly `PR_COMMITS` on top of `{REMOTE}/{MAIN_BRANCH}` — nothing else.

---

## Step 5: Generate PR Title and Body

```bash
# Gather context — scoped to the feature branch only (not local master)
git log --oneline {REMOTE}/{MAIN_BRANCH}...<branch-name>
git diff {REMOTE}/{MAIN_BRANCH}...<branch-name> --stat
git diff {REMOTE}/{MAIN_BRANCH}...<branch-name>
```

Also read (if they exist) for richer PR body context:
- `{REPORT_PATH}` — execution report (already resolved in Step 2b; contains validation results, files changed, task summary)
- `.agents/features/{FEATURE_NAME}/review.done.md` — code review findings addressed this loop
- `.agents/reviews/{FEATURE_NAME}*.done.md` — legacy review location fallback

Generate the PR title and body directly:

**Title format:** `type(scope): description` (conventional commit format, max 72 chars)

**Body format:**
```markdown
## What
- {2-4 bullets: what changed, specific and concrete}

## Why
{1-2 sentences: why this was needed}

## Changes
{Files changed grouped by area with 1-line description each}

## Testing
{Test results, validation commands run, pass/fail}

## Notes
{Breaking changes, migration steps, known skips — or "None"}
```

---

## Step 6: Create Pull Request

```bash
gh pr create \
  --base {MAIN_BRANCH} \
  --head <branch-name> \
  --title "<pr-title>" \
  --body "$(cat <<'EOF'
{generated PR body}
EOF
)"
```

If `gh` CLI is not available or not authenticated:
- Report: "GitHub CLI not available. Install with `gh auth login` or create PR manually."
- Provide the branch name and suggested title/body for manual creation.

---

## Step 7: Report Completion

```
PR Created
==========

Branch:  <branch-name> (new, from <original-branch>)
PR:      <pr-url>
Title:   <pr-title>
Base:    {MAIN_BRANCH}
Commits: <N> commits
Current: Back on <original-branch>

Next: Wait for review, then merge or address feedback.
```

### Pipeline Handoff Write (required)

After PR creation, overwrite `.agents/context/next-command.md`:

```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /pr
- **Feature**: {feature}
- **Next Command**: [pipeline complete — PR open at {pr-url}]
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: pr-open
```

This is a terminal handoff — the pipeline is complete for this feature. `/prime` will show this as informational ("Last feature PR'd: {feature}") rather than actionable.

**If PR creation fails** (e.g., `gh` not authenticated, network error, cherry-pick conflict, branch already exists): Write handoff preserving the feature context:
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /pr (failed)
- **Feature**: {feature}
- **Next Command**: /pr {feature}
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```
Report the error clearly: what failed (cherry-pick conflict? auth? network?), what the user should do (resolve conflict, run `gh auth login`, retry). Clean up any partial state (delete local feature branch if push failed).

---

## Notes

- **One PR per feature/slice** — each `/pr` creates a fresh branch, not extending a prior PR
- **Branch from `{REMOTE}/{MAIN_BRANCH}`, not from local HEAD** — this is the key isolation guarantee; cherry-pick brings only the selected commits
- Always auto-detect remote and main branch — no hardcoded repos
- After PR creation, return to the original branch so work can continue
- If `gh` CLI is not authenticated, report and suggest `gh auth login`
- Do NOT force-push unless explicitly asked
- If the current branch IS already a clean feature branch (branched from remote main with only relevant commits), skip Steps 2-4 and push + PR directly
- **Never push local master/main to remote** — always use an isolated feature branch for PRs

````


## Delegation Stub Template (Mandatory)
```markdown
---
description: <keep existing description>
---

# <Command>: Delegate to Execution Agent

## Pipeline Position
(keep diagram)

## Orchestrator Instructions

### Step 1: Pre-delegation Verification
- verify `.agents/context/next-command.md` status allows command

### Step 2: Delegate
```typescript
task(
  subagent_type|category="...",
  load_skills=[...],
  description="...",
  prompt=`
    1. TASK: ...
    2. EXPECTED OUTCOME: ...
    3. REQUIRED TOOLS: ...
    4. MUST DO: ...
    5. MUST NOT DO: ...
    6. CONTEXT: ...
  `
)
```

### Step 3: Post-delegation Verification
- verify command-specific outcome and report

## Delegation Target
- Agent/category
- Model source
- Skills loaded
```

## Prime Specific Risk Handling
Because `.opencode/skills/prime/SKILL.md` provides methodology but not full workflow steps, `/prime` delegation prompt must explicitly include:
- dirty-state check
- context mode detection
- stack detection
- handoff + artifact merge logic
- memory + optional supermemory summary

## Implementation Steps
1. Rewrite `/prime` to delegation stub using `prime-agent`.
2. Rewrite `/execute` to delegation stub using `hephaestus + execute`.
3. Rewrite `/code-loop` to delegation stub using `hephaestus + code-loop`.
4. Rewrite `/commit` to delegation stub using quick category + `git-master`, `commit`.
5. Rewrite `/pr` to delegation stub using quick category + `git-master`, `pr`.
6. Ensure no `model:` frontmatter remains in converted command files.

## QA Scenarios
1. **Frontmatter model removal check**
   - Tool: Read
   - Action: inspect first 5 lines of each converted command
   - Expected: contains `description:` only, no `model:`
2. **Delegation call check**
   - Tool: Read
   - Action: verify each file contains `task(` and correct mapping
   - Expected:
     - `/prime` uses `subagent_type="prime-agent"`
     - `/execute` uses `subagent_type="hephaestus"` + `load_skills=["execute"]`
     - `/code-loop` uses `subagent_type="hephaestus"` + `load_skills=["code-loop"]`
     - `/commit` uses `category="quick"` + `load_skills=["git-master", "commit"]`
     - `/pr` uses `category="quick"` + `load_skills=["git-master", "pr"]`
3. **Section completeness check**
   - Tool: Read
   - Action: verify each command has pre/delegate/post sections
   - Expected: all sections present

## Parallelization
- Parallelizable:
  - draft stubs for 5 commands independently.
- Sequential required:
  - final consistency pass across all 5 files for mapping alignment.

## Acceptance Criteria
- [ ] 5 command files converted to delegation stubs
- [ ] no `model:` in frontmatter of converted commands
- [ ] each stub has pre-verification, delegate task(), post-verification
- [ ] skills and target mappings match locked table
- [ ] original full workflows removed from command files

## Validation Commands
```bash
# read/grep based verification
```

## Rollback
- If any mapping is wrong, correct that command file only.
- Keep changes isolated to the 5 target command files.

## Task Completion Checklist
- [ ] all 5 stubs written
- [ ] QA scenarios passed
- [ ] acceptance criteria all met

