---
description: Create feature branch, push, and open PR
---

# PR: Delegate to Execution Agent

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop → /commit → /pr (this)
```

## Orchestrator Instructions

### Step 1: Pre-delegation Verification
- Read `.agents/context/next-command.md` to verify pipeline state allows this command
- If state is wrong, report to user and stop

### Step 2: Delegate
```typescript
task(
  category="quick",
  load_skills=["git-master", "pr"],
  description="Create isolated feature branch and open pull request",
  prompt=`
    1. TASK: Prepare and open a pull request for the current feature by isolating relevant commits, creating or selecting the proper feature branch, and invoking gh pr create.
    2. EXPECTED OUTCOME: A PR URL with title/body, branch details, commit scope evidence, and handoff update to pr-open or blocked on failure.
    3. REQUIRED TOOLS: Bash, Read, Glob, Grep.
    4. MUST DO:
       - Verify working tree cleanliness and stop with clear guidance if uncommitted changes exist.
       - Detect feature and commit scope from arguments, handoff, and feature report artifacts before branch operations.
       - Use isolated branch strategy against remote main branch and ensure only intended commits are included.
       - Create PR via gh with structured title/body and report resulting PR URL.
       - Update .agents/context/next-command.md with terminal pr-open status and next-command note referencing PR URL.
    5. MUST NOT DO:
       - Do not force-push.
       - Do not include unrelated commits in the PR branch.
       - Do not leave handoff stale on error; write blocked handoff when PR creation fails.
    6. CONTEXT: This command runs after /commit. Feature artifacts are in .agents/features/{feature}/ and handoff file is .agents/context/next-command.md. Use gh CLI for GitHub operations.
  `
)
```

### Step 3: Post-delegation Verification
- Verify branch isolation details, PR creation result, and handoff transition are present
- Report PR URL and completion state to the user

## Delegation Target
- **Agent**: quick category executor
- **Model source**: category config for `quick`
- **Skills loaded**: `git-master`, `pr`
