---
description: Prime agent with project context and auto-detect tech stack
---

# Prime: Delegate to Execution Agent

## Pipeline Position

```
/prime (this) → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit → /pr
```

## Orchestrator Instructions

### Step 1: Pre-delegation Verification
- Read `.agents/context/next-command.md` to verify pipeline state allows this command
- If state is wrong, report to user and stop

### Step 2: Delegate
```typescript
task(
  subagent_type="prime-agent",
  load_skills=["prime"],
  description="Prime session context and detect next pipeline action",
  prompt=`
    1. TASK: Run the full /prime context loading workflow for the current repository and return a concise context report with actionable next command guidance.
    2. EXPECTED OUTCOME: A complete prime output covering git state, context mode, stack/tooling detection, pending work resolution, memory context, and recommended next command.
    3. REQUIRED TOOLS: Read, Glob, Grep, Bash.
    4. MUST DO:
       - Run dirty-state check first with git status --short and report clean vs dirty clearly.
       - Detect context mode (Codebase vs System Mode) by scanning common source directories.
       - Auto-detect tech stack from package manifests and detect linter, type checker, and test runner commands from project config files.
       - Merge pending-work detection using both .agents/context/next-command.md and artifact scan under .agents/features/, preferring handoff unless stale.
       - Load memory context from memory.md when present and include optional supermemory context when available, while failing silently if supermemory is unavailable.
    5. MUST NOT DO:
       - Do not modify repository files.
       - Do not execute write actions, commits, or branch operations.
       - Do not skip pending-work reconciliation when handoff and artifacts differ.
    6. CONTEXT: Base directory is the active project root. Handoff file path is .agents/context/next-command.md. Feature artifacts are under .agents/features/. Prime-agent has read and bash read-only permissions for discovery.
  `
)
```

### Step 3: Post-delegation Verification
- Verify the response includes dirty-state result, mode detection, stack detection, pending work summary, memory context, and a concrete next command
- Report the verified prime result to the user

## Delegation Target
- **Agent**: prime-agent
- **Model source**: agent registry entry for `prime-agent`
- **Skills loaded**: `prime`
