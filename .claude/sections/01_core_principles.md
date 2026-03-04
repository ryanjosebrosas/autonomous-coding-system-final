**ARCHITECTURE — Claude Plans, Codex Executes** — Claude (this session) handles ONLY planning, architecture, orchestration, review, commit, and PR. ALL implementation (file edits, code writing, refactoring) is handed to Codex CLI via `codex /execute {task-brief-path}`. Claude does NOT use Edit/Write tools on project source files directly — that is Codex's job. The execution agent is a **swappable slot** — currently Codex CLI, but any CLI agent that can read a task brief and execute instructions can fill this role.

**Violation examples** (all FORBIDDEN):
- Claude using Edit/Write tools on .ts, .py, .md config, or any project source file
- Claude writing code in a response and asking the user to apply it
- Proceeding to execution without a `/planning`-generated task brief in `.agents/features/`

**Valid implementation path**: Plan in `.agents/features/{feature}/` → hand to Codex: `codex /execute .agents/features/{feature}/task-{N}.md` → Codex edits via its own tools → Claude reviews via `/code-review`

**HARD RULE — /planning Before ALL Implementation** — EVERY feature, fix, or non-trivial change MUST go through `/planning` first. The plan MUST be reviewed and approved by the user before ANY implementation begins. No exceptions. No "quick fixes." No "I'll just do this one thing." The sequence is ALWAYS: `/planning` → user reviews plan → user approves → `codex /execute`. Jumping straight to code is a VIOLATION even if the task seems simple. If you catch yourself about to edit a file without an approved plan in `.agents/features/`, STOP and run `/planning` first.

**Violation examples** (all FORBIDDEN):
- Starting to code before running `/planning`
- Running `/planning` and proceeding to `codex /execute` without user review/approval
- Saying "this is simple enough to do inline" and skipping the plan
- Creating a todo list of code changes and implementing them directly
- Using Edit/Write tools on source files without an approved plan artifact

**MODEL TIERS — Use the right Claude model for the task:**
- **Opus** (`claude-opus-4-6`) → thinking & planning: `/mvp`, `/prd`, `/planning`, `/council`, architecture decisions
- **Sonnet** (`claude-sonnet-4-6`) → review & validation: `/code-review`, `/code-loop`, `/system-review`, `/pr`, `/final-review`
- **Haiku** (`claude-haiku-4-5-20251001`) → retrieval & light tasks: `/prime`, RAG queries, `/commit`, quick checks
- **Codex CLI** → execution: `codex /execute {task-brief-path}`

**YAGNI** — Only implement what's needed. No premature optimization.
**KISS** — Prefer simple, readable solutions over clever abstractions.
**DRY** — Extract common patterns; balance with YAGNI.
**Limit AI Assumptions** — Be explicit in plans and prompts. Less guessing = better output.
**Always Be Priming (ABP)** — Start every session with /prime. Context is everything.
