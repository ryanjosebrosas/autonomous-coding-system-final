---
description: Prime agent with project context and auto-detect tech stack
---

# Prime: Load Project Context + Stack Detection

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
- `.opencode/config.md`

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
- `.opencode/config.md`
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

If `.opencode/config.md` does not exist, create it from auto-detected values:

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

If `.opencode/config.md` already exists, read it and use its values (user overrides take priority over auto-detection).

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
- `build-loop-continuing` — commit done in `/build` loop, continuing to next spec

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

## Pending Work
{If pending work found in Step 3.5:
- **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
- **[tasks]** {feature} — task {N}/{total} done, next: /execute .agents/features/{feature}/plan.md
- **[plan]** {feature} — legacy plan awaiting execution: /execute .agents/features/{feature}/plan.md
- **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-master.md
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

## Build State
{If .agents/specs/build-state.json exists:
- **Last Spec**: {lastSpec}
- **Completed**: {count}/{total} ({pct}%)
- **Current Pillar**: {currentPillar}
- **Patterns**: {patternsEstablished}
Otherwise: "No build state found. Run /mvp to start a new project."}

## Pending Work
{If pending work found in Step 3.5:
- **[handoff]** {Next Command} ← from last session ({Last Command} → {feature})
- **[tasks]** {feature} — task {N}/{total} done, next: /execute .agents/features/{feature}/plan.md
- **[plan]** {feature} — legacy plan awaiting execution: /execute .agents/features/{feature}/plan.md
- **[master]** {feature} — phase {N}/{total} done, next: /execute .agents/features/{feature}/plan-master.md
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

## Archon Status
{If Archon MCP connected:
- **Connection**: Connected
- **Project**: {project name if found}
- **Active Tasks**: {count of tasks in 'doing' status}
Otherwise: "Archon not connected"}
```
