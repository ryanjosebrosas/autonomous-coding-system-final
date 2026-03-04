> On-demand guide. Loaded by /execute, /planning, and task management commands.

# Archon Integration & Workflow

Archon MCP server provides knowledge management (RAG), task tracking, and project organization. It is optional — all commands degrade gracefully if unavailable.

## RAG Workflow (Research Before Implementation)

### Searching Specific Documentation

1. **Get sources** → `rag_get_available_sources()` - Returns list with id, title, url
2. **Find source ID** → Match to documentation (e.g., "Framework docs" → "src_abc123")
3. **Search** → `rag_search_knowledge_base(query="vector functions", source_id="src_abc123")`

**CRITICAL**: Keep queries SHORT (2-5 keywords only). Vector search works best with concise queries.

### General Research

```python
# Search knowledge base (2-5 keywords only!)
rag_search_knowledge_base(query="authentication JWT", match_count=5)

# Find code examples
rag_search_code_examples(query="React hooks", match_count=3)

# List all pages for a source
rag_list_pages_for_source(source_id="src_abc123")

# Read full page content
rag_read_full_page(page_id="...")  # or url="https://..."
```

---

## Project Workflows

### New Project

```python
# 1. Create project
manage_project("create", title="My Feature", description="...")

# 2. Create tasks (granular for feature-specific, high-level for codebase-wide)
manage_task("create",
    project_id="proj-123",
    title="Setup environment",
    description="...",
    task_order=10,  # Higher = higher priority
    assignee="User"  # or "Archon" or custom agent name
)
```

### Existing Project

```python
# 1. Find project
find_projects(query="auth")  # or find_projects() to list all

# 2. Get project tasks
find_tasks(filter_by="project", filter_value="proj-123")

# 3. Continue work or create new tasks
```

---

## Task Granularity Guidelines

**For Feature-Specific Projects** (project = single feature):
Create granular implementation tasks:
- "Set up development environment"
- "Install required dependencies"
- "Create database schema"
- "Implement API endpoints"
- "Write unit tests"

**For Codebase-Wide Projects** (project = entire application):
Create feature-level tasks:
- "Implement user authentication feature"
- "Add payment processing system"

**Default**: Each task = 30 minutes to 4 hours of work.

---

## Tool Reference

### Projects
- `find_projects(query="...")` - Search projects
- `find_projects(project_id="...")` - Get specific project
- `manage_project("create"/"update"/"delete", ...)` - Manage projects

### Tasks
- `find_tasks(query="...")` - Search tasks by keyword
- `find_tasks(task_id="...")` - Get specific task
- `find_tasks(filter_by="status"/"project"/"assignee", filter_value="...")` - Filter tasks
- `manage_task("create"/"update"/"delete", ...)` - Manage tasks

**Task Status Flow**: `todo` → `doing` → `review` → `done`

**CRITICAL**: Only ONE task in "doing" status at a time.

### Knowledge Base
- `rag_get_available_sources()` - List all indexed sources
- `rag_search_knowledge_base(query="...", source_id="...", match_count=5)` - Search docs
- `rag_search_code_examples(query="...", match_count=3)` - Find code examples
- `rag_list_pages_for_source(source_id="...")` - List pages in source
- `rag_read_full_page(page_id="..." or url="...")` - Get full page content

### Documents
- `find_documents(project_id="...", query="...")` - Search project documents
- `manage_document("create"/"update"/"delete", project_id="...", ...)` - Manage docs

**Document types**: `spec`, `design`, `note`, `prp`, `api`, `guide`

---

## Integration with PIV Loop Commands

### /planning Command Integration

**Phase 1.5 - Create Archon Project** (if available):
```python
manage_project("create",
    title="{feature-name}",
    description="{Feature Description from plan}"
)
```

**Phase 3b - Archon RAG Research**:
```python
# Search with SHORT queries (2-5 keywords)
rag_search_knowledge_base(query="React hooks", source_id="src_reactdocs", match_count=5)
rag_search_code_examples(query="authentication JWT", match_count=3)
```

**Phase 5 - Create Tasks in Archon**:
```python
for task in plan_tasks:
    manage_task("create",
        project_id=project_id,
        title=task.title,
        description=task.implement_section,
        task_order=task.priority
    )
```

### /execute Command Integration (Codex reads this)

**Step 1.5 - Initialize Archon Tasks** (if available):
```python
# Create project if not exists
manage_project("create", title="...", description="...")
# Create tasks in Archon with proper ordering
```

**Step 2a.5 - Update Task Status** (per task):
```python
# Start work: manage_task("update", task_id=task_id, status="doing")
# CRITICAL: Only ONE task in "doing" at a time
```

### /commit Command Integration

**After successful commit** (if available):
```python
manage_project("update",
    project_id=project_id,
    description="Feature complete, committed: {commit_hash}"
)
```

---

## Best Practices

### RAG Query Optimization
Good queries (2-5 keywords):
- `rag_search_knowledge_base(query="vector search pgvector")`
- `rag_search_code_examples(query="React useState")`
- `rag_search_knowledge_base(query="authentication JWT")`

Bad queries (too long):
- `rag_search_knowledge_base(query="how to implement vector search with pgvector...")`

### Task Management
- **One task in "doing"** - Prevents parallel work confusion
- **Use "review" status** - Signals work complete, awaiting validation
- **Granular tasks** - Each task = 30 min to 4 hours max
- **Higher task_order = higher priority** - Dependency-based ordering

---

## Health & Session Info

```python
# Check Archon server health
health_check()

# Get session information
session_info()
```
