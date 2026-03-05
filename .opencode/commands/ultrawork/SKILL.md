# /ultrawork — Deep Autonomous Work

## Pipeline Position

```
Session → /prime → user says "ultrawork" → /ultrawork (this) → Hephaestus spawn → autonomous completion
```

Keyword-triggered deep work mode. Spawns a Hephaestus agent for autonomous, thorough problem-solving.

## Purpose

Triggers when the user says "ultrawork" in their request. This spawns a deep-autonomy agent (Hephaestus) that works independently, making decisions and executing tasks without constant check-ins.

## Usage

Automatic keyword detection:
```
User: "ultrawork on the authentication system — make it bulletproof"
User: "ultrawork: refactor the data layer for better performance"
User: "I need ultrawork on this complex integration"
```

The keyword "ultrawork" triggers the command automatically.

---

## Step 0: Keyword Detection

After `/prime`, if user message contains "ultrawork" (case-insensitive):

```typescript
if (userMessage.toLowerCase().includes('ultrawork')) {
  // Trigger ultrawork mode
}
```

---

## Step 1: Extract Task Description

Parse the user message to extract:
- **Task**: What needs to be done
- **Scope**: Files/modules mentioned
- **Goal**: Desired outcome

Example parsing:
```
"ultrawork on the authentication system — make it bulletproof"

Task: Improve authentication system
Scope: Authentication module
Goal: Make it bulletproof (robust, secure, error-proof)
```

---

## Step 2: Spawn Hephaestus Agent

Hephaestus is the deep autonomous worker. Configure it for maximum autonomy:

```typescript
task(
  category: "unspecified-high",
  load_skills: ["git-master", "code-review"], // Add relevant skills
  prompt: `You are Hephaestus — the deep autonomous worker.

[CONTEXT]: User requested ultrawork on: {task_description}

[GOAL]: {goal}
- This is autonomous work mode — make decisions independently
- You have full autonomy to explore, plan, and implement
- Report progress periodically but do not ask permission for each step

[DOWNSTREAM]: When complete:
- Summarize what was done
- List files modified
- Note any decisions made
- Include verification evidence

[AUTONOMY CONSTRAINTS]:
- You CAN modify files, run commands, make architectural decisions
- You MUST stay within the described scope
- You MUST use git-master skill for version control
- You MUST run validation after changes
- You MAY spawn subagents if needed (explore, librarian for research)
- You SHOULD follow existing codebase patterns

[REQUEST]:
1. Research the current state (use explore/librarian if needed)
2. Formulate a complete plan
3. Execute the plan autonomously
4. Verify your work
5. Report results with evidence

Working directory: {workspace_path}
Feature/area: {scope}

Begin autonomous execution.`,
  run_in_background: false
)
```

---

## Step 3: Configurable Autonomy Levels

Hephaestus can work at different autonomy levels:

### Level 1: Standard Autonomy

- Make tactical decisions independently
- Follow existing patterns
- Report progress periodically
- Ask only for architectural changes

### Level 2: High Autonomy

- Make architectural decisions independently
- Refactor as needed
- Optimize without asking
- Report at completion

### Level 3: Maximum Autonomy (Default for "ultrawork")

- Full decision-making power
- Can introduce new dependencies
- Can restructure code
- Only blocked on breaking changes to public APIs
- Reports only at completion or blocking issues

---

## Step 4: Hephaestus Execution Pattern

The spawned Hephaestus agent follows this pattern:

### 4a. Research Phase (Parallel Background)

```typescript
// Hephaestus spawns subagents in PARALLEL for research
task(subagent_type="explore", run_in_background=true, prompt="Find current {scope} implementation...")
task(subagent_type="librarian", run_in_background=true, prompt="Find {technology} best practices...")

// Wait for both results before proceeding
// Background exploration allows Hephaestus to gather context quickly
```

### 4b. Planning Phase (Internal)

Hephaestus creates its own mental model:
- What needs to change
- What patterns to follow
- What order to execute
- What risks to mitigate

### 4c. Execution Phase

```typescript
// Make changes directly
Edit(file_path, old_string, new_string)

// Validate changes
bash(validation_command)

// Run tests
bash(test_command)
```

### 4d. Verification Phase

- Run linting
- Run type checking
- Run tests
- Check for edge cases
- Verify the goal was achieved

### 4e. Report Phase

```
## Ultrawork Complete: {task}

**Changes Made**:
- {file_1}: {what changed}
- {file_2}: {what changed}

**Decisions Made**:
- {decision_1}: {rationale}
- {decision_2}: {rationale}

**Verification**:
- Lint: PASS
- Types: PASS
- Tests: PASS (all {count} tests)

**Evidence**:
- {evidence_1}
- {evidence_2}

**Next Steps** (optional):
- {recommendation_1}
```

---

## Step 5: Session Handoff

When Hephaestus completes:

```markdown
# Pipeline Handoff

- **Last Command**: /ultrawork
- **Task**: {task_description}
- **Status**: completed
- **Files Modified**: {count}
- **Evidence**: {evidence_path}
- **Timestamp**: {ISO 8601}
- **Next Command**: /code-loop (if review needed) or /commit (if ready)
```

---

## Hephaestus Characteristics

| Property | Value |
|----------|-------|
| **Model** | GPT-5.3 Codex |
| **Mode** | all (full file access) |
| **Temperature** | 0.1 (cold for precision) |
| **Autonomy** | Maximum |
| **Skills** | git-master, code-review (context-dependent) |
| **Fallback** | Claude Opus 4.6 |

---

## When Ultrawork Triggers

### Should Trigger

User says:
- "ultrawork on X"
- "I need ultrawork for"
- "Use ultrawork to"
- "ultrawork: [description]"

### Should NOT Trigger

User says:
- "exactly work on X" (different phrase)
- "ultra work" (space between)
- Word is part of another phrase

Detection pattern:
```typescript
/\bultrawork\b/i.test(userMessage)
```

---

## Notes

- Ultrawork is for complex, self-contained tasks
- Not suitable for tasks requiring frequent user input
- Hephaestus can spawn subagents for research
- Maximum autonomy means minimal interrupts
- Reports at completion or blocking issues only
- Uses git-master skill for safe version control