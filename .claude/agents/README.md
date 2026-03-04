# Custom Subagents

Subagents for parallel research, code review, plan writing, and specialist tasks.

## Research Agents

| Agent | Purpose |
|-------|---------|
| `research-codebase` | Parallel codebase exploration: finds files, extracts patterns, reports findings |
| `research-external` | Documentation search, best practices, version compatibility checks |
| `planning-research` | Knowledge base search and completed plan reference for planning context |

## Code Review Agent

| Agent | What It Covers |
|-------|---------------|
| `code-review` | Comprehensive review: type safety, security, architecture, performance, code quality |

The code review agent covers all dimensions in a single pass. When dispatch is available, multiple instances can run in parallel with different focus areas.

## Plan Writing Agent

| Agent | What It Produces |
|-------|-----------------|
| `plan-writer` | Plan artifacts: `plan.md` (700-1000 lines) and `task-N.md` briefs (700-1000 lines each) |

The plan-writer agent is invoked by `/planning` Phase 5 to offload the heavyweight writing. It receives structured context from Phase 3 (Synthesize, Analyze, Decide, Decompose) and produces one artifact per invocation. It reads `.opencode/templates/TASK-BRIEF-TEMPLATE.md` at runtime for structural reference.

## Usage

Agents are invoked via the Task tool by the main agent, or can be @mentioned directly:
```
@research-codebase find all authentication-related code
@research-external what are the best practices for JWT token refresh?
@planning-research search for patterns related to authentication
@code-review review the changes in src/auth/
@plan-writer write task-3.md for feature auth-system
```

## Creating New Agents

Create new markdown files in `.opencode/agents/` following the existing format:
- Purpose statement
- Capabilities list
- Instructions for invocation
- Output format
- Rules/constraints
