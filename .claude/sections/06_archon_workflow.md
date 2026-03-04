# Archon Integration

If Archon MCP is connected, use it for knowledge management, RAG search, and task tracking.

## RAG Workflow (Research Before Implementation)

### Searching Documentation

1. **Get sources** → `rag_get_available_sources()` - Returns list with id, title, url
2. **Find source ID** → Match to documentation
3. **Search** → `rag_search_knowledge_base(query="vector functions", source_id="src_abc123")`

**CRITICAL**: Keep queries SHORT (2-5 keywords only). Vector search works best with concise queries.

### General Research

```python
# Search knowledge base (2-5 keywords only!)
rag_search_knowledge_base(query="authentication JWT", match_count=5)

# Find code examples
rag_search_code_examples(query="React hooks", match_count=3)

# Read full page content
rag_read_full_page(page_id="...")  # or url="https://..."
```

## Task Tracking (Optional)

If connected, sync plan tasks to Archon for visibility:

```python
# Create project for feature
manage_project("create", title="feature-name", description="...")

# Create tasks from plan
manage_task("create", project_id="proj-123", title="Task name", description="...", task_order=10)

# Update task status as you work
manage_task("update", task_id="task-123", status="doing")
manage_task("update", task_id="task-123", status="done")
```

**Task Status Flow**: `todo` → `doing` → `review` → `done`

## RAG Query Optimization

Good queries (2-5 keywords):
- `rag_search_knowledge_base(query="vector search pgvector")`
- `rag_search_code_examples(query="React useState")`

Bad queries (too long):
- `rag_search_knowledge_base(query="how to implement vector search with pgvector in PostgreSQL...")`

## If Archon Not Connected

Proceed without it. Archon is an enhancement, not a requirement. Use local codebase exploration (Glob, Grep, Read) and WebFetch for documentation.
