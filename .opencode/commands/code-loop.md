---
description: Automated review → fix → review loop until clean
---

# Code Loop: Delegate to Execution Agent

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute → /code-review → /code-loop (this) → /commit → /pr
```

## Orchestrator Instructions

### Step 1: Pre-delegation Verification
- Read `.agents/context/next-command.md` to verify pipeline state allows this command
- If state is wrong, report to user and stop

### Step 2: Delegate
```typescript
task(
  subagent_type="hephaestus",
  load_skills=["code-loop"],
  description="Run automated review-fix loop to clean state",
  prompt=`
    1. TASK: Run the code-loop workflow for the target feature until the loop reaches a clean handoff state or a documented blocked state.
    2. EXPECTED OUTCOME: Updated review and loop artifacts, validation evidence, and handoff update to ready-to-commit when no blocking issues remain.
    3. REQUIRED TOOLS: Read, Glob, Grep, Bash, Edit, Write.
    4. MUST DO:
       - Resolve feature context from $ARGUMENTS or .agents/context/next-command.md when argument is omitted.
       - Run iterative review and fix cycles with severity-first handling (Critical then Major), including validation each loop.
       - Persist loop artifacts under .agents/features/{feature}/ with correct .done.md completion sweep when loop exits clean.
       - Write .agents/context/next-command.md with status ready-to-commit and next command /commit on clean exit.
       - If blocked, report exact blocker and write blocked handoff state preserving feature context.
    5. MUST NOT DO:
       - Do not skip validation between fix iterations.
       - Do not claim clean exit when Critical or Major findings remain.
       - Do not perform git commit or PR actions inside this command.
    6. CONTEXT: Loop artifacts live in .agents/features/{feature}/. Pipeline handoff file is .agents/context/next-command.md. This command is the quality gate before /commit.
  `
)
```

### Step 3: Post-delegation Verification
- Verify loop output includes final issue status, artifact updates, and a valid handoff transition
- Report whether the feature is ready for `/commit` or blocked with reason

## Delegation Target
- **Agent**: hephaestus
- **Model source**: agent registry entry for `hephaestus`
- **Skills loaded**: `code-loop`
