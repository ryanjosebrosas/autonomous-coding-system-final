# Task 2 of 6: Haiku Commands — prime.md, commit.md

> **Feature**: `claude-command-optimization`
> **Brief Path**: `.agents/features/claude-command-optimization/task-2.md`
> **Plan Overview**: `.agents/features/claude-command-optimization/plan.md`

---

## OBJECTIVE

Create Claude-optimized Haiku-tier command files `.claude/commands/prime.md` (~150 lines) and `.claude/commands/commit.md` (~90 lines) with `model: claude-haiku-4-5-20251001`, trimmed of verbose detection tables while preserving all pipeline semantics, output templates, and handoff writes.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.claude/commands/prime.md` | CREATE | New Claude-optimized Haiku prime command (~150 lines) |
| `.claude/commands/commit.md` | CREATE | New Claude-optimized Haiku commit command (~90 lines) |

**Multi-file justification:** Both files are Haiku-tier commands sharing the same optimization pattern (trim verbose content, no subagent delegation). They are tightly coupled in the plan as Phase 2 and together they remain well under the 3-file limit.

**Out of Scope:**
- `.opencode/commands/prime.md` — source material, must NOT be modified
- `.opencode/commands/commit.md` — source material, must NOT be modified
- Sonnet commands (Tasks 3-5)
- Opus commands (Task 6)
- Any code files (.ts, .js, .py)

**Dependencies:**
- Task 1 must complete first — it removes the `.claude/commands` symlink and creates a real directory at `.claude/commands/`

---

## PRIOR TASK CONTEXT

**Files Changed in Prior Task(s):**
- `.claude/commands/` — changed from symlink (pointing to `.opencode/commands/`) to a real, empty directory

**State Carried Forward:**
- `.claude/commands/` exists as an empty real directory ready for command file creation
- `.opencode/commands/` is completely untouched with all 14 original command files intact
- Claude Code will discover commands from `.claude/commands/` natively when files exist there

**Known Issues or Deferred Items:**
- On Windows, the symlink may have been a junction — Task 1 handled this with fallback logic
- No issues deferred to this task

---

## CONTEXT REFERENCES

> IMPORTANT: Read ALL files listed here before implementing. They are not optional.

### Files to Read

- `.opencode/commands/prime.md` (all 326 lines) — Why: This is the source material for the optimized prime.md. Must understand the full structure to trim correctly.
- `.opencode/commands/commit.md` (all 118 lines) — Why: This is the source material for the optimized commit.md. Must understand the full flow to trim correctly.

### Current Content: prime.md (Full File — 326 lines)

```markdown
---
description: Prime agent with project context and auto-detect tech stack
model: glm-4.7:cloud
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

## Archon Status
{If Archon MCP connected:
- **Connection**: Connected
- **Project**: {project name if found}
- **Active Tasks**: {count of tasks in 'doing' status}
Otherwise: "Archon not connected"}
```
```

**Analysis**: The prime.md file is 326 lines. Roughly 100 lines (30%) are devoted to four detection tables (Package Manifests, Linter Config, Type Checker Config, Test Runner Config) and the Entry Point Detection list. These verbose tables are the primary trim target. The remaining content — Step 0 (dirty state), Step 1 (mode detection), Steps 2A/2B (context loading), Step 3 (config write), Step 3.5 (pending work), Step 4 (report assembly) — is all essential logic that must be preserved. The output report templates (System Mode and Codebase Mode) must be preserved exactly, as downstream commands depend on the format.

### Current Content: commit.md (Full File — 118 lines)

```markdown
---
description: Create git commit with conventional message format
model: glm-4.7:cloud
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

### 5.5. Pipeline Handoff Write (required)

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
```

**Analysis**: The commit.md file is 118 lines. It is already fairly lean. The main trim target is the artifact completion sweep section (steps 3's pre-staging instructions) which can be made more compact — keeping the rule but removing the verbose explanation of what gets renamed. The handoff write sections (both success and failure) are essential and must be preserved exactly. The output report format must also be preserved.

### Patterns to Follow

**Pattern 1: Haiku Frontmatter** (from plan.md Pattern 3):

```markdown
---
description: {description}
model: claude-haiku-4-5-20251001
---

# {Title}

## Pipeline Position
{same as original}

{Trimmed steps — essential logic only, no verbose tables or detection heuristics}
```

- Why this pattern: Haiku IS the cheap model — it does the work directly. No subagent delegation needed. The optimization is about trimming verbose content that wastes Haiku's smaller context window.
- How to apply: Replace `model: glm-4.7:cloud` with `model: claude-haiku-4-5-20251001`. Remove detection tables and replace with compact inline lists. Keep all pipeline semantics.
- Common gotchas: Do NOT remove Pipeline Position, output templates, or handoff writes. Those are pipeline-critical. Only remove verbose detection heuristics and redundant explanatory text.

**Pattern 2: Table-to-Inline-List Compression** (optimization technique):

Before (verbose table — 12 lines):
```markdown
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
```

After (compact inline — 2 lines):
```markdown
**Language detection**: Check for `package.json` (JS/TS), `pyproject.toml` (Python), `Cargo.toml` (Rust), `go.mod` (Go), `Gemfile` (Ruby), `pom.xml`/`build.gradle` (Java), `composer.json` (PHP), `*.csproj` (C#), `mix.exs` (Elixir), `pubspec.yaml` (Dart). Read the manifest to detect framework from dependencies.
```

- Why this pattern: Haiku does not need a formatted table to do file-existence checks. The compact format conveys the same information in fewer tokens.
- How to apply: Apply this compression to all four detection tables (Package Manifests, Linter Config, Type Checker Config, Test Runner Config) and the Entry Point Detection list.
- Common gotchas: Make sure every file/tool/command from the original tables is preserved in the compact format. Do not drop any detection targets.

**Pattern 3: Artifact Sweep Compression** (for commit.md):

Before (verbose — 6 lines):
```markdown
Before staging, run artifact completion sweep (required):
- Scan `.agents/features/*/` for completed artifacts and rename `.md` → `.done.md`:
  - `report.md` → `report.done.md` (execution report — commit means it's final)
  - `review.md` → `review.done.md` (if all findings were addressed in this commit)
  - Any other active artifacts that are fully resolved
- Keep filenames as the source of completion status; do not rely on title edits.
- Only rename artifacts in feature folders relevant to this commit's changes.
```

After (compact — 2 lines):
```markdown
Before staging, sweep `.agents/features/*/` for completed artifacts and rename `.md` → `.done.md` (e.g., `report.md` → `report.done.md`, `review.md` → `review.done.md`). Only rename in feature folders relevant to this commit.
```

- Why this pattern: The rule is preserved but the verbose explanation and sub-bullets are collapsed into a concise instruction.
- How to apply: Replace the multi-line artifact sweep block with the compact version.
- Common gotchas: Do not remove the rule entirely — artifact sweep is a required step in the commit pipeline.

---

## STEP-BY-STEP TASKS

> Execute every step in order. Each step is atomic and independently verifiable.

---

### Step 1: CREATE `.claude/commands/prime.md`

**What**: Create the Claude-optimized Haiku-tier prime command with trimmed detection tables, preserving all pipeline semantics and output templates.

**IMPLEMENT**:

This is a CREATE action — the file does not exist yet. Write the following complete content to `.claude/commands/prime.md`:

```markdown
---
description: Prime agent with project context and auto-detect tech stack
model: claude-haiku-4-5-20251001
---

# Prime: Load Project Context + Stack Detection

## Pipeline Position

```
/prime (this) → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit → /pr
```

First command in any session. Reads project files and git state. Outputs context summary for session.

## Step 0: Dirty State Check

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

```bash
git log -10 --oneline
git status
```

Read if they exist: `memory.md`, `.claude/config.md`

---

## Step 2B: Codebase Mode — Load Context

```bash
git log -10 --oneline
git status
git ls-files
```

Read if they exist: `memory.md`, `.claude/config.md`, entry point file (auto-detect below).

### Auto-Detect Tech Stack

**Language detection**: Check for `package.json` (JS/TS), `pyproject.toml` (Python), `Cargo.toml` (Rust), `go.mod` (Go), `Gemfile` (Ruby), `pom.xml`/`build.gradle` (Java), `composer.json` (PHP), `*.csproj`/`*.sln` (C#), `mix.exs` (Elixir), `pubspec.yaml` (Dart). Read the manifest to detect framework from dependencies.

**Linter detection**: Check for `.eslintrc*`/`eslint.config.*` → `npx eslint .`, `ruff.toml`/`[tool.ruff]` → `ruff check .`, `.rubocop.yml` → `rubocop`, `.golangci.yml` → `golangci-lint run`, `rustfmt.toml` → `cargo fmt --check`, `biome.json` → `npx biome check .`, `.prettierrc*` → `npx prettier --check .`

**Type checker detection**: `tsconfig.json` → `npx tsc --noEmit`, `[tool.mypy]`/`mypy.ini` → `mypy src/`, `sorbet/` → `srb tc`, Rust → `cargo check`, Go → `go vet ./...`

**Test runner detection**: `jest.config.*`/jest in package.json → `npx jest`, `vitest.config.*`/vitest in package.json → `npx vitest run`, `pytest.ini`/`[tool.pytest]`/`conftest.py` → `pytest`, `_test.go` → `go test ./...`, `*_test.rs`/`#[test]` → `cargo test`, `*_spec.rb`/`.rspec` → `rspec`, `*_test.rb`/`test/` → `ruby -Itest test/**/*_test.rb`

**Entry point detection** (check in order): `src/index.ts`, `src/index.js`, `src/main.ts`, `src/main.js`, `src/app.ts`, `src/app.js`, `app/page.tsx`, `src/main.py`, `app/main.py`, `main.py`, `src/main.rs`, `cmd/main.go`, `main.go`, `src/index.rb`, `config.ru`. Read the first found.

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

If `.claude/config.md` already exists, read it and use its values (user overrides take priority).

---

## Step 3.5: Detect Pending Work

Scan for in-progress pipeline state from two sources, merged:

### Source 1: Handoff file

Read `.agents/context/next-command.md` if it exists. Extract:
- **Last Command**, **Feature**, **Next Command**, **Status**
- **Master Plan** / **Phase Progress** (if present)
- **Task Progress** (if present): `N/M complete`

Status values: `awaiting-execution`, `executing-tasks`, `executing-series`, `awaiting-review`, `awaiting-fixes`, `awaiting-re-review`, `ready-to-commit`, `ready-for-pr`, `pr-open`, `blocked`

If the file does not exist or is empty, skip to Source 2.

### Source 2: Artifact scan (fallback + cross-check)

Scan `.agents/features/*/` for non-`.done.md` artifacts:
1. `plan.md` without `plan.done.md` → check for `task-{N}.md` and `task-{N}.done.md` → task brief mode (X/Y) or legacy plan
2. `plan-master.md` without `plan-master.done.md` → check `plan-phase-{N}.done.md` → master plan (phase X/Y)
3. `report.md` without `report.done.md` → report awaiting commit
4. `review.md` without `review.done.md` → review with open findings
5. `review-{N}.md` without matching `.done.md` → code-loop in progress

### Merge logic

- Handoff + artifact agree → use handoff (more specific)
- Handoff + artifact contradict → artifact wins, note "Handoff stale"
- No handoff → artifact only
- Neither → no pending work

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

## Archon Status
{If Archon MCP connected:
- **Connection**: Connected
- **Project**: {project name if found}
- **Active Tasks**: {count of tasks in 'doing' status}
Otherwise: "Archon not connected"}
```
```

**PATTERN**: Plan Pattern 3 (Haiku — no delegation) + Pattern 2 (Table-to-Inline-List Compression)

**IMPORTS**: N/A — markdown file

**GOTCHA**: The nested code fences in the output templates (Step 4) use triple backticks. When creating this file, make sure the markdown renderer does not break the nested fence blocks. Each code fence in the report templates is part of the command output format, not actual code to execute. The executing agent must write the file so that the triple backtick blocks inside Step 4 are literal content, not interpreted as code fences of the task brief itself.

**VALIDATE**:
```bash
# File exists
test -f .claude/commands/prime.md && echo "PASS: prime.md exists" || echo "FAIL: prime.md missing"

# Correct model in frontmatter
grep -q "model: claude-haiku-4-5-20251001" .claude/commands/prime.md && echo "PASS: correct model" || echo "FAIL: wrong model"

# Pipeline Position preserved
grep -q "/prime (this)" .claude/commands/prime.md && echo "PASS: pipeline position" || echo "FAIL: missing pipeline position"

# No verbose detection tables (should NOT contain pipe-delimited table rows)
grep -c "^|" .claude/commands/prime.md
# Expected: 0 (no table rows — all tables replaced with inline lists)

# Line count check (~150 lines target)
wc -l .claude/commands/prime.md
# Expected: 140-170 lines
```

---

### Step 2: CREATE `.claude/commands/commit.md`

**What**: Create the Claude-optimized Haiku-tier commit command with trimmed artifact sweep explanation, preserving all pipeline handoff writes and output format.

**IMPLEMENT**:

This is a CREATE action — the file does not exist yet. Write the following complete content to `.claude/commands/commit.md`:

```markdown
---
description: Create git commit with conventional message format
model: claude-haiku-4-5-20251001
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

- Format: `type(scope): short description` (imperative mood, max 50 chars)
- Types: feat, fix, refactor, docs, test, chore, perf, style, plan
- Optional body: 3 bullet points max — what and why, not how

### 3. Stage and Commit

Before staging, sweep `.agents/features/*/` for completed artifacts and rename `.md` → `.done.md` (e.g., `report.md` → `report.done.md`, `review.md` → `review.done.md`). Only rename in feature folders relevant to this commit.

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

### 5.5. Pipeline Handoff Write (required)

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

**If commit fails** (pre-commit hooks, merge conflict, empty commit):
```markdown
# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /commit (failed)
- **Feature**: {feature}
- **Next Command**: /commit
- **Timestamp**: {ISO 8601 timestamp}
- **Status**: blocked
```
Report the error clearly: what failed, why, and what the user should do to fix it.

### 6. Report Completion

Report: "Committed. Next: `/pr {feature}` to create a pull request."

## Notes

- If no changes to commit, report clearly
- If commit fails (pre-commit hooks), report the error
- Follow the project's commit message conventions
- Do NOT include Co-Authored-By lines in commits
```

**PATTERN**: Plan Pattern 3 (Haiku — no delegation) + Pattern 3 (Artifact Sweep Compression)

**IMPORTS**: N/A — markdown file

**GOTCHA**: The handoff write sections (both success and failure variants) must be preserved EXACTLY. These are read by `/prime` during pending work detection (Step 3.5). Changing the field names or structure will break the pipeline handoff chain. Also, do NOT remove the `$ARGUMENTS` reference in the "Files to Commit" section — Claude Code passes user-provided arguments via this variable.

**VALIDATE**:
```bash
# File exists
test -f .claude/commands/commit.md && echo "PASS: commit.md exists" || echo "FAIL: commit.md missing"

# Correct model in frontmatter
grep -q "model: claude-haiku-4-5-20251001" .claude/commands/commit.md && echo "PASS: correct model" || echo "FAIL: wrong model"

# Pipeline Position preserved
grep -q "/commit (this)" .claude/commands/commit.md && echo "PASS: pipeline position" || echo "FAIL: missing pipeline position"

# Handoff write preserved (check for success handoff)
grep -q "Status: ready-for-pr" .claude/commands/commit.md && echo "PASS: success handoff" || echo "FAIL: missing success handoff"

# Failed handoff preserved
grep -q "Status: blocked" .claude/commands/commit.md && echo "PASS: failure handoff" || echo "FAIL: missing failure handoff"

# $ARGUMENTS preserved
grep -q '$ARGUMENTS' .claude/commands/commit.md && echo "PASS: arguments variable" || echo "FAIL: missing arguments"

# Line count check (~90 lines target)
wc -l .claude/commands/commit.md
# Expected: 85-100 lines
```

---

## TESTING STRATEGY

### Unit Tests

No unit tests — this task creates markdown command files, not executable code. Covered by structural validation (L1) and manual testing (L5).

### Integration Tests

N/A — command files are consumed by Claude Code's native command discovery mechanism. Integration is verified by invoking the commands in Claude Code (Level 5).

### Edge Cases

- **Empty project (System Mode)**: prime.md must still work when no code directories exist — the compact detection lists should gracefully find nothing and fall through to System Mode.
- **No memory.md**: Both commands reference memory.md conditionally. Verify the "if exists" logic is preserved.
- **No .claude/config.md**: prime.md creates it if missing. Verify the config template is preserved exactly.
- **No $ARGUMENTS to commit.md**: The "If no files specified" fallback must be preserved.
- **Commit failure**: The failed handoff write template must be preserved exactly with `Status: blocked`.
- **Nested code fences in prime.md**: The output report templates in Step 4 contain triple backtick blocks inside the command file. The markdown must not break these nested fences.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Both files exist and are non-empty
test -s .claude/commands/prime.md && echo "L1 PASS: prime.md exists and non-empty" || echo "L1 FAIL"
test -s .claude/commands/commit.md && echo "L1 PASS: commit.md exists and non-empty" || echo "L1 FAIL"

# YAML frontmatter present (starts with ---)
head -1 .claude/commands/prime.md | grep -q "^---" && echo "L1 PASS: prime frontmatter" || echo "L1 FAIL"
head -1 .claude/commands/commit.md | grep -q "^---" && echo "L1 PASS: commit frontmatter" || echo "L1 FAIL"
```

### Level 2: Type Safety
N/A — no type-checked code modified. These are markdown files.

### Level 3: Unit Tests
N/A — no unit tests for this task (see Testing Strategy). Markdown command files are not testable via automated unit tests.

### Level 4: Integration Tests
N/A — covered by Level 5 manual validation. Claude Code command discovery is not testable via automated integration tests from the CLI.

### Level 5: Manual Validation

1. Open Claude Code in this project directory
2. Type `/prime` and press Enter
3. Verify the output includes:
   - Current State section with branch and recent commits
   - Tech Stack section with auto-detected language/framework
   - Memory Context section
   - Pending Work section (if applicable)
4. Verify NO verbose detection tables appear in the command prompt expansion (the model should just execute the compact detection logic)
5. Type `/commit` and press Enter (with staged changes or after making a small change)
6. Verify the commit flow:
   - Reviews current state (git status, git diff)
   - Generates a conventional commit message
   - Stages and commits
   - Writes pipeline handoff to `.agents/context/next-command.md`
   - Reports completion with next step suggestion
7. What success looks like: Both commands execute the same workflow as before but the command prompt is smaller (fewer tokens consumed by detection heuristics)
8. What failure looks like: Command fails to detect tech stack, skips pending work detection, or breaks the handoff chain. Check that all sections are present in the output.

### Level 6: Cross-Check

Verify both commands are compatible with the pipeline:
- Check that `/prime` output report format matches what downstream commands expect (specifically, the Pending Work section format)
- Check that `/commit` handoff write format matches what `/prime` reads in Step 3.5 (Source 1: Handoff file)
- Compare the handoff field names in `.claude/commands/commit.md` against the extraction logic in `.claude/commands/prime.md` Step 3.5

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] `.claude/commands/prime.md` exists as a file (not a symlink)
- [ ] `.claude/commands/commit.md` exists as a file (not a symlink)
- [ ] prime.md frontmatter has `model: claude-haiku-4-5-20251001`
- [ ] commit.md frontmatter has `model: claude-haiku-4-5-20251001`
- [ ] prime.md has Pipeline Position section preserved from original
- [ ] commit.md has Pipeline Position section preserved from original
- [ ] prime.md has NO pipe-delimited detection tables (all replaced with inline lists)
- [ ] prime.md preserves Step 0 (dirty state check)
- [ ] prime.md preserves Step 1 (context mode detection)
- [ ] prime.md preserves Steps 2A/2B (context loading)
- [ ] prime.md preserves Step 3 (config write/update) with full config template
- [ ] prime.md preserves Step 3.5 (pending work detection) with Source 1 + Source 2 + merge logic
- [ ] prime.md preserves Step 4 (report assembly) with both System Mode and Codebase Mode templates exactly
- [ ] commit.md preserves all 6 commit process steps
- [ ] commit.md preserves `$ARGUMENTS` variable reference
- [ ] commit.md preserves artifact completion sweep rule (compact form)
- [ ] commit.md preserves success handoff write template with `Status: ready-for-pr`
- [ ] commit.md preserves failure handoff write template with `Status: blocked`
- [ ] commit.md preserves output report format
- [ ] commit.md preserves "Do NOT include Co-Authored-By" rule
- [ ] `.opencode/commands/prime.md` is untouched (326 lines)
- [ ] `.opencode/commands/commit.md` is untouched (118 lines)

### Runtime (verify after testing/deployment)

- [ ] `/prime` in Claude Code produces a context report with all expected sections
- [ ] `/prime` auto-detects tech stack correctly for this project (JS/TS, etc.)
- [ ] `/commit` in Claude Code creates a conventional commit with proper handoff
- [ ] Pipeline handoff chain is not broken (prime reads what commit writes)

---

## HANDOFF NOTES

> What the NEXT task needs to know.

### Files Created/Modified

- `.claude/commands/prime.md` — Haiku-optimized prime command (~150 lines). Detection tables replaced with compact inline lists. All pipeline semantics (steps 0-4, pending work detection, output templates) preserved.
- `.claude/commands/commit.md` — Haiku-optimized commit command (~90 lines). Artifact sweep trimmed to one line. All handoff writes (success + failure) preserved exactly.

### Patterns Established

- **Haiku frontmatter pattern**: `model: claude-haiku-4-5-20251001` in YAML frontmatter. No subagent delegation — Haiku does the work directly.
- **Table-to-inline-list compression**: Verbose detection tables replaced with compact comma-separated inline lists. Every detection target preserved, just formatted more efficiently.
- **Artifact sweep compression**: Multi-line explanations of the sweep rule collapsed to a single-line instruction. Rule preserved, verbosity removed.

### State to Carry Forward

- `.claude/commands/` now contains 2 of 14 planned command files
- Tasks 3-5 (Sonnet tier) will use a DIFFERENT pattern — Phase 0 Haiku subagent delegation. Do not copy the Haiku pattern.
- Task 6 (Opus tier) will also use Phase 0 delegation with extended thinking scaffolding.

### Known Issues or Deferred Items

- The nested code fences in prime.md Step 4 (output report templates) may render oddly in some markdown previewers due to triple backtick nesting. This is cosmetic — Claude Code reads the raw markdown, not rendered HTML.
- No issues deferred to Task 3.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order (Step 1: prime.md, Step 2: commit.md)
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (L1 passed, L2 N/A, L3 N/A, L4 N/A, L5 manual)
- [ ] Manual testing confirms expected behavior (both commands produce correct output)
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files (`.opencode/commands/` untouched)
- [ ] Handoff notes written for Task 3
- [ ] Brief marked done: rename `task-2.md` → `task-2.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **No subagent delegation for Haiku commands**: Haiku IS the cheap model. Delegating from Haiku to Haiku would add overhead with no benefit. The optimization for Haiku-tier commands is trimming, not delegation.
- **Preserve all output templates exactly**: The System Mode and Codebase Mode report templates in prime.md are consumed by the user and referenced by other commands. Changing their format would break expectations.
- **Preserve all handoff writes exactly**: The commit.md handoff writes are machine-parsed by prime.md Step 3.5. Field names (`Last Command`, `Feature`, `Next Command`, `Status`) and status values (`ready-for-pr`, `blocked`) must be exact matches.
- **Compact detection over removal**: Rather than removing detection logic entirely, it is compressed from tables to inline lists. This preserves Haiku's ability to detect any tech stack while using fewer tokens.

### Implementation Notes

- The prime.md line count target is ~150 lines (down from 326). The main savings come from the four detection tables (~100 lines) and minor trimming of explanatory text.
- The commit.md line count target is ~90 lines (down from 118). The savings come from the artifact sweep compression and minor cleanup.
- If the executing agent encounters issues with nested code fences in prime.md, it should use a different fence marker (e.g., four backticks ``````) for the outer blocks. However, the original commands use triple backticks throughout and work fine in Claude Code.
- Both files must use Unix line endings (LF) to be consistent with the rest of the `.claude/` directory.

---

> **Reminder**: Mark this brief done after execution:
> Rename `task-2.md` → `task-2.done.md`
> This signals to `/execute` (via artifact scan) that this task is complete.
