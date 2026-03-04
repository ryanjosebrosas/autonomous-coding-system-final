# Model Strategy — Claude + Codex

## Architecture Overview

| Layer | Provider | Handles |
|-------|----------|---------|
| Think / Plan | Claude Opus | Deep reasoning, architecture, /planning, /mvp, /prd, /council |
| Review / Execute-Claude | Claude Sonnet | /code-review, /code-loop, /system-review, /pr, /commit |
| Retrieval / Lightweight | Claude Haiku | /prime, RAG lookups, commit messages, quick checks |
| Code Execution | Codex CLI | /execute — reads task briefs from .agents/features/{feature}/task-{N}.md |

## Claude Model Tiers

### Opus — Thinking & Planning
Use for high-stakes reasoning where quality > speed:
- `/mvp` — product vision discovery
- `/prd` — full product requirements
- `/planning` — feature discovery, synthesis, decomposition
- `/council` — multi-perspective architecture decisions
- Any session where you're making irreversible architectural choices

**Model ID**: `claude-opus-4-6`

### Sonnet — Review & Validation
Use for code review, iterative loops, and structured output:
- `/code-review` — technical review for quality and bugs
- `/code-loop` — review → fix → re-review cycle
- `/system-review` — divergence analysis
- `/pr` — pull request description
- `/final-review` — approval gate

**Model ID**: `claude-sonnet-4-6`

### Haiku — Retrieval & Light Tasks
Use for fast, cheap, repetitive work:
- `/prime` — context loading and stack detection
- Archon RAG queries (search + retrieve)
- `/commit` — commit message generation
- Quick file reads and grep operations

**Model ID**: `claude-haiku-4-5-20251001`

## Execution Handoff

After /planning produces task briefs, hand to Codex:

```
codex /execute .agents/features/{feature}/task-1.md
codex /execute .agents/features/{feature}/task-2.md
...
```

The execution agent is a **swappable slot**. The task brief format (`.agents/features/{feature}/task-{N}.md`) is the universal interface — any CLI agent that can read a markdown file and execute instructions can be used.

## Archon (RAG + Task Tracking)

Archon MCP provides curated knowledge base and task tracking. Available to Claude during planning and review phases. See `.claude/reference/archon-workflow.md`.

| Tool | Purpose |
|------|---------|
| `rag_search_knowledge_base` | Search curated documentation (2-5 keyword queries) |
| `rag_search_code_examples` | Find reference code implementations |
| `rag_read_full_page` | Read full documentation pages |
| `rag_get_available_sources` | List indexed documentation sources |
| `manage_task` / `find_tasks` | Persistent task tracking across sessions |
| `manage_project` / `find_projects` | Project and version management |

**Status**: Optional — all commands degrade gracefully if unavailable.
