---
description: Execute an implementation plan
---

# Execute: Delegate to Execution Agent

## Pipeline Position

```
/prime → /mvp → /prd → /pillars → /decompose → /planning → /execute (this) → /code-review → /code-loop → /commit → /pr
```

## Orchestrator Instructions

### Step 1: Pre-delegation Verification
- Read `.agents/context/next-command.md` to verify pipeline state allows this command
- If state is wrong, report to user and stop

### Step 2: Delegate
```typescript
task(
  subagent_type="hephaestus",
  load_skills=["execute"],
  description="Execute one planned implementation slice from feature artifact",
  prompt=`
    1. TASK: Execute exactly one eligible plan artifact from $ARGUMENTS in .agents/features/, implementing only the current approved slice.
    2. EXPECTED OUTCOME: Code and artifact updates for one slice, execution evidence, report update at .agents/features/{feature}/report.md, and correct handoff update for next command.
    3. REQUIRED TOOLS: Read, Glob, Grep, Bash, Edit, Write.
    4. MUST DO:
       - Enforce hard entry gate: block execution when $ARGUMENTS is missing, invalid, or outside .agents/features/.
       - Detect execution mode (task brief, master phase, or single plan) and run only one task brief or one phase per invocation.
       - Apply implementation exactly to plan requirements, track divergences with classification and root cause, and run required validations for the executed slice.
       - Update execution artifacts, including report content and required .done.md renames for completed artifacts only.
       - Write .agents/context/next-command.md with accurate status and next command based on slice progress.
    5. MUST NOT DO:
       - Do not execute ad-hoc chat intent outside the plan artifact.
       - Do not execute multiple task briefs or multiple phases in one run.
       - Do not skip required validation or artifact completion sweep.
    6. CONTEXT: Plan artifacts and progress files are under .agents/features/{feature}/. Handoff file is .agents/context/next-command.md. Existing workflow depends on one-slice-per-session discipline.
  `
)
```

### Step 3: Post-delegation Verification
- Verify one-slice execution completed with report update, correct artifact renames, and handoff status transition
- Report execution outcome and the exact next command to the user

## Delegation Target
- **Agent**: hephaestus
- **Model source**: agent registry entry for `hephaestus`
- **Skills loaded**: `execute`
