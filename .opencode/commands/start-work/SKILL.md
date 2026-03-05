# /start-work — Execution Trigger

## Pipeline Position

```
/prime → /mvp → /prd → /prometheus → /start-work (this) → Atlas execution → /code-loop → /commit → /pr
```

Reads plan from `.agents/features/{feature}/plan.md`, switches to Atlas mode, and begins execution.

## Purpose

The execution trigger that reads a Prometheus-generated plan and switches to execution mode. It's the bridge between planning (Prometheus) and doing (Atlas/Hephaestus execution agents).

## Usage

```
/start-work {feature-name}
```

- `$ARGUMENTS` — Feature name matching a plan in `.agents/features/`

---

## Step 0: Plan Discovery

### Check for Plan File

Look for: `.agents/features/{feature-name}.md`

**If not found:**
1. Check for `.agents/features/{feature}/plan.md` (legacy planning system)
2. If neither found: Report error and suggest `/prometheus {feature}` first

**If found:**
1. Read plan file fully
2. Extract TODO count, dependencies, and acceptance criteria
3. Proceed to Step 1

---

## Step 1: Load Plan Context

### Read Plan File

```typescript
const plan = read(".agents/features/{feature}/plan.md")
```

### Extract Key Information

- **Core Objective**: What we're building
- **Deliverables**: Concrete outputs expected
- **TODO Count**: How many tasks
- **Dependencies**: Task dependencies for ordering
- **Test Strategy**: TDD, tests-after, or none
- **Verification Commands**: Commands to run

### Display Plan Summary

```
## Starting Work: {feature}

**Objective**: {core objective}
**Deliverables**: {count} items
**TODOs**: {count} tasks
**Test Strategy**: {TDD | Tests-after | None}
**Parallel Waves**: {count} waves

**Critical Path**: Task {n} → Task {m} → Task {p}

Ready to begin execution?
- **YES**: Proceed to Step 2
- **VIEW PLAN**: Show full plan before starting
- **ADJUST**: Make modifications first
```

---

## Step 2: Boulder State Initialization

### Create Boulder State

The boulder represents persistent work state that survives across sessions.

Create: `.agents/boulders/{feature}.json`

```json
{
  "planFile": ".agents/features/{feature}/plan.md",
  "feature": "{feature}",
  "started": "{ISO timestamp}",
  "currentWave": 1,
  "todos": [
    {
      "id": 1,
      "title": "Task title",
      "status": "pending",
      "parallelGroup": 1
    }
  ],
  "completedTodos": [],
  "failedTodos": [],
  "retries": {},
  "wisdom": {
    "learnings": [],
    "decisions": [],
    "gotchas": []
  },
  "evidence": []
}
```

### Boulder State Fields

| Field | Purpose |
|-------|---------|
| `planFile` | Reference to source plan |
| `feature` | Feature name for logging |
| `started` | When execution began |
| `currentWave` | Which parallel wave is active |
| `todos` | Remaining tasks (pending status) |
| `completedTodos` | Successfully finished tasks |
| `failedTodos` | Failed tasks with error info |
| `retries` | Retry count per task |
| `wisdom` | Learnings accumulated during execution |
| `evidence` | Evidence file references |

---

## Step 3: Execute Tasks

### Parallel Wave Execution

Tasks in the same `parallel_group` can run concurrently.

For each wave:

1. **Mark wave as active**: Update boulder state
2. **Spawn agents in parallel**:
   ```typescript
   // For each task in wave
   task(
     category: "{task_category}",
     load_skills: ["{skill-1}", "{skill-2}"],
     prompt: `{task description with references}`,
     run_in_background: true
   )
   ```
3. **Wait for all agents**: Collect results
4. **Verify acceptance criteria**: Run QA scenarios
5. **Collect evidence**: Save to `.agents/features/{feature}/evidence/`
6. **Update boulder state**: Mark complete or failed

### Task Execution Pattern

For each task in the plan:

```typescript
// 1. Spawn agent with category + skills
const result = task(
  category: task.recommended_category,
  load_skills: task.recommended_skills,
  prompt: `
    [CONTEXT]: You are implementing task {n} of {feature}.
    [GOAL]: {task.what_to_do}
    [DOWNSTREAM]: This enables {dependent_tasks}
    [REQUEST]: Implement following the pattern from {reference}
    
    Must NOT do:
    - {exclusions}
    
    Acceptance Criteria:
    - {criteria_1}
    - {criteria_2}
    
    QA Scenarios to run after implementation:
    {scenarios}
  `,
  run_in_background: isInWave
)

// 2. Verify with QA scenarios
for (const scenario of task.qa_scenarios) {
  runQAScenario(scenario)
}

// 3. Collect evidence
evidence_files.push(saveEvidence())

// 4. Update boulder
boulder.completedTodos.push(task)
boulder.todos = boulder.todos.filter(t => t.id !== task.id)
writeBoulder(boulder)
```

### QA Scenario Execution

Each task has QA scenarios defined. Execute them:

**For Playwright (UI):**
```typescript
skill(name="playwright")
// Navigate, interact, assert DOM, screenshot
// Save to .agents/features/{feature}/evidence/task-N-scenario.png
```

**For CLI/TUI:**
```typescript
interactive_bash(tmux_command="...")
// Run command, send keystrokes, validate output
// Save to .agents/features/{feature}/evidence/task-N-scenario.log
```

**For API:**
```typescript
bash(command="curl ...")
// Send request, assert status + response
// Save to .agents/features/{feature}/evidence/task-N-scenario.json
```

### Handle Failures

If a task fails:

1. **Record in boulder**: Add to `failedTodos`
2. **Increment retry count**: `retries[task_id]++`
3. **Assess error**: Is it fixable?
   - **Fixable**: Retry the task
   - **Unfixable**: Stop and report
4. **Maximum retries**: 3 attempts per task

---

## Step 4: Wisdom Extraction

After each successful task, extract learnings:

```typescript
// Extract from task execution
wisdom.learnings.push({
  task: task_id,
  pattern: "What worked",
  success: "Why it succeeded"
})

wisdom.gotchas.push({
  task: task_id,
  issue: "What almost broke",
  resolution: "How we fixed it"
})

// Update boulder
writeBoulder(boulder)
```

---

## Step 5: Continue Until Complete

### Loop Until All Tasks Done

```
while (boulder.todos.length > 0 && !hasUnfixableFailure) {
  currentWave = getNextWave()
  
  for (task in currentWave.tasks) {
    executeTask(task)
  }
  
  collectResults()
  updateBoulder()
  
  if (waveFailed) {
    handleFailures()
  }
}
```

### Session Handoff

If context window is exhausted:

1. Save current state to boulder
2. Write handoff:
   ```markdown
   # Pipeline Handoff

   - **Last Command**: /start-work ({completed}/{total} tasks)
   - **Feature**: {feature}
   - **Boulder**: .agents/boulders/{feature}.json
   - **Next Command**: /start-work {feature} --continue
   - **Progress**: Wave {n} of {m}
   - **Status**: executing
   ```
3. End session

### Session Recovery

On restart:

1. Read boulder state
2. Display progress: "Resuming {feature}: {completed}/{total} tasks complete"
3. Continue from `currentWave`

---

## Step 6: Final Verification Wave

After all TODOs complete, run the final 4-agent verification:

```typescript
// All 4 run in PARALLEL
task(subagent_type="oracle", prompt="Plan compliance audit...", run_in_background=true)
task(category="unspecified-high", prompt="Code quality review...", run_in_background=true)
task(category="unspecified-high", prompt="Manual QA...", run_in_background=true)
task(category="deep", prompt="Scope fidelity check...", run_in_background=true)
```

**All 4 must APPROVE.** Any rejection → fix → re-run that agent.

---

## Step 7: Completion

When all tasks pass:

1. **Archive boulder**: `.agents/boulders/{feature}.json` → `.agents/boulders/{feature}.done.json`
2. **Archive plan**: `.agents/features/{feature}/plan.md` → `.agents/features/{feature}.done.md`
3. **Write execution report**: `.agents/features/{feature}/report.md`
4. **Write wisdom file**: `.agents/wisdom/{feature}/learnings.md`

### Completion Report

```
## Work Complete: {feature}

**Duration**: {start} to {end}
**Tasks**: {completed}/{total}
**Waves**: {count}
**Retries**: {count}
**Evidence**: {count} files

**Wisdom Captured**:
- {learning_1}
- {learning_2}

**Next Steps**:
- Run `/code-loop {feature}` for review
- Or `/commit` if ready
```

---

## Pipeline Handoff Write

```markdown
# Pipeline Handoff

- **Last Command**: /start-work
- **Feature**: {feature}
- **Next Command**: /code-loop {feature}
- **Report**: .agents/features/{feature}/report.md
- **Timestamp**: {ISO 8601}
- **Status**: awaiting-review
```

---

## Boulder State Management

### State Transitions

```
pending → in_progress → completed | failed
                    ↑——— retry (max 3) ———┘
```

### State Persistence

The boulder file is written after EVERY task completion:

```typescript
function updateBoulder(boulder: BoulderState, taskId: number, status: 'completed' | 'failed', evidence?: string[]) {
  if (status === 'completed') {
    boulder.completedTodos.push(taskId)
  } else {
    boulder.failedTodos.push({ id: taskId, error: lastError })
  }
  
  boulder.todos = boulder.todos.filter(t => t.id !== taskId)
  writeFileSync(boulderPath, JSON.stringify(boulder, null, 2))
}
```

This ensures session recovery is always possible.

---

## Continue Flag

### Usage

```
/start-work {feature} --continue
```

When resuming:
1. Read boulder state
2. Check which tasks are pending
3. Determine current wave
4. Continue execution from that point

---

## Notes

- Boulder state is the source of truth for progress
- Parallel execution maximizes throughput
- Wisdom extraction happens during execution, not after
- Evidence files are mandatory for verification
- Session recovery via boulder file is automatic