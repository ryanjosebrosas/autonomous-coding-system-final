---
description: Create git commit with conventional message format
---

# Commit: Delegate to Execution Agent

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit (this) → /pr
```

## Orchestrator Instructions

### Step 1: Pre-delegation Verification
- Read `.agents/context/next-command.md` to verify pipeline state allows this command
- If state is wrong, report to user and stop

### Step 2: Delegate
```typescript
task(
  category="quick",
  load_skills=["git-master", "commit"],
  description="Create scoped conventional commit for current feature",
  prompt=`
    1. TASK: Create a conventional commit for the current feature scope using $ARGUMENTS when provided, or infer a safe scoped file set when not provided.
    2. EXPECTED OUTCOME: One successful git commit with clear message, post-commit verification output, and handoff update to ready-for-pr.
    3. REQUIRED TOOLS: Bash, Read, Glob, Grep.
    4. MUST DO:
       - Review git status and diff before staging, then stage only relevant files (never broad staging of unrelated files).
       - Generate commit message in conventional format with meaningful scope aligned to changed feature.
       - Run artifact completion sweep for relevant .agents feature artifacts that are fully complete.
       - After commit, verify with git log -1 and git show --stat.
       - Update .agents/context/next-command.md with status ready-for-pr and next command /pr {feature}.
    5. MUST NOT DO:
       - Do not use destructive git commands or history rewriting.
       - Do not include unrelated files in the commit.
       - Do not add Co-Authored-By trailers.
    6. CONTEXT: Commit command sits after /code-loop and before /pr in the pipeline. Feature context should come from commit scope, prior handoff, or latest feature report if needed.
  `
)
```

### Step 3: Post-delegation Verification
- Verify commit hash, message, staged file scope, and handoff update are present
- Report commit result and next `/pr` action to the user

## Delegation Target
- **Agent**: quick category executor
- **Model source**: category config for `quick`
- **Skills loaded**: `git-master`, `commit`
