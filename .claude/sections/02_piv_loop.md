```
PLAN → IMPLEMENT → VALIDATE → (iterate)
```

### Granularity Principle

Multiple small PIV loops — one feature slice per loop, built completely before moving on.
Complex features (10+ tasks): `/planning` auto-decomposes into task briefs, one brief per session.

### Planning (Layer 1 + Layer 2)

**Layer 1 — Project Planning** (done once):
- PRD (what to build), AGENTS.md / CLAUDE.md (how to build)

**Layer 2 — Task Planning** (done for every feature):
1. **Discovery** — conversation with the user to explore ideas and research the codebase
2. **Structured Plan** — turn conversation into a markdown document
   - Save to: `.agents/features/{feature}/plan.md`
   - Apply the 4 pillars of Context Engineering (see `sections/03_context_engineering.md`)

**Do NOT** take your PRD and use it as a structured plan. Break it into granular Layer 2 plans — one per PIV loop.

### Implementation
- Hand task brief to Codex: `codex /execute .agents/features/{feature}/task-{N}.md`
  (then task-2.md, task-3.md... one per session)
- The execution agent is a **swappable slot** — currently Codex CLI, could be any CLI agent that reads the task brief
- Trust but verify
- **MANDATORY**: Never execute implementation work without a `/planning` artifact in `.agents/features/`
- **MANDATORY**: The plan MUST be reviewed and approved by the user before handing to Codex. No silent auto-approval. Present the plan, wait for explicit user approval, then proceed.
- If tempted to skip planning for a "simple" change — STOP. Run `/planning` anyway. The process exists to catch what you think is simple but isn't.

### Validation
- AI: tests + linting. Human: code review + manual testing.
- 5-level pyramid: Syntax → Types → Unit → Integration → Human.
- Small issues → fix prompts. Major issues → revert to save point, tweak plan, retry.
