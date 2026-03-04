Structured plans must cover 4 pillars:
1. **Memory** — discovery conversation (short-term) + `memory.md` (long-term, read at `/prime`, updated at `/commit`)
2. **RAG** — external docs, library references. If Archon MCP available, use `rag_search_knowledge_base()` first.
3. **Prompt Engineering** — be explicit, reduce assumptions
4. **Task Management** — step-by-step task list. If Archon MCP available, sync tasks with `manage_task()`.

### Pillar → Plan Mapping

When filling `.claude/templates/STRUCTURED-PLAN-TEMPLATE.md`, each pillar maps to specific sections:

| Pillar | Plan Section | What to Include |
|--------|-------------|-----------------|
| **Memory** | Related Memories | Past decisions, gotchas from `memory.md` |
| **RAG** | Relevant Documentation, Patterns to Follow | External docs, codebase code examples |
| **Prompt Engineering** | Solution Statement, Implementation Plan | Explicit decisions, step-by-step detail |
| **Task Management** | Step-by-Step Tasks | Atomic tasks with all 7 fields filled |
