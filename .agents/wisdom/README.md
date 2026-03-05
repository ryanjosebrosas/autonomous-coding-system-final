# Wisdom Accumulation System

System for extracting, categorizing, storing, and injecting learnings across task executions.

## Directory Structure

```
.agents/wisdom/{feature}/
├── learnings.md      # Patterns, conventions, successes
├── decisions.md      # Architectural choices + rationales
├── issues.md         # Blockers, gotchas, problems encountered
├── verification.md   # Test results, validation outcomes
└── problems.md       # Unresolved issues, technical debt
```

## Purpose

Wisdom accumulation enables:
1. **Learning from experience**: Each task teaches something
2. **Avoiding repetition**: Don't make the same mistake twice
3. **Pattern consistency**: Follow what worked before
4. **Knowledge transfer**: New sessions inherit past wisdom

---

## Wisdom Categories

### 1. Conventions
Code patterns and styles discovered to work well.

```markdown
## Conventions

### Async Database Calls
- **Pattern**: Always use async/await for database operations
- **Location**: src/db/*.ts
- **Rationale**: Prevents callback hell and improves error handling
- **Example**: 
  ```typescript
  // Good
  const user = await db.users.findOne({ id })
  
  // Bad
  db.users.findOne({ id }, (err, user) => { ... })
  ```

### Error Handling
- **Pattern**: Use typed error classes
- **Location**: src/errors/
- **Rationale**: Enables proper error classification and handling
```

### 2. Successes
What worked well during implementation.

```markdown
## Successes

### Parallel Agent Spawning
- **Approach**: Fire 3-5 explore/librarian agents simultaneously
- **Result**: 70% faster research phase
- **Context**: Planning sessions

### TDD for API Work
- **Approach**: Write tests before implementation
- **Result**: Zero regressions, clean API design
- **Context**: API endpoint development
```

### 3. Failures
What didn't work and why.

```markdown
## Failures

### Nested Promise Chains
- **What Happened**: Memory leak in long-running process
- **Root Cause**: Promises not properly cleaned up
- **Fix**: Refactored to async/await with proper error handling
- **Prevention**: Never nest promises more than 2 levels

### Direct Database Access from Routes
- **What Happened**: Tight coupling made testing impossible
- **Root Cause**: No service layer abstraction
- **Fix**: Introduced repository pattern
- **Prevention**: Always use service layer for data access
```

### 4. Gotchas
Subtle issues to watch for.

```markdown
## Gotchas

### Window Object in SSR
- **Issue**: `window is not defined` during server-side render
- **Detection**: Check execution context before accessing browser APIs
- **Fix**: 
  ```typescript
  if (typeof window !== 'undefined') {
    // Browser-only code
  }
  ```

### Async State Updates
- **Issue**: React state not updated when expected
- **Cause**: Async operations don't block render
- **Fix**: Use proper state management or wait for update
```

---

## Wisdom Flow

### Collection (During Execution)

```
Task Execution → Issue/Success Detected → Extract Wisdom → Categorize → Store
```

### Injection (At Task Start)

```
Task Start → Load Feature Wisdom → Inject into Prompt → Executor Uses Wisdom
```

---

## Wisdom Extraction Sources

1. **Code Review Findings**: Issues found during `/code-loop`
2. **Test Failures**: Patterns that caused tests to fail
3. **Error Messages**: What went wrong and why
4. **Successful Patterns**: What made things work
5. **User Feedback**: Explicit guidance from user
6. **Session Notes**: Observations during work

---

## Storage Format

### learnings.md

```markdown
# Learnings: {feature}

## Session: {timestamp}

### Conventions
- {pattern_1}
- {pattern_2}

### Successes
- {success_1}

### Failures
- {failure_1}

### Gotchas
- {gotcha_1}

---

## Cumulative Wisdom

### Patterns Observed
| Pattern | Context | First Seen | Confidence |
|---------|---------|------------|------------|
| Async DB calls | Database layer | 2026-03-01 | High |
```

### decisions.md

```markdown
# Decisions: {feature}

## {date}: {decision_title}

### Decision
{what was decided}

### Rationale
{why this choice}

### Alternatives Considered
1. {alternative_1}: Rejected because {reason}
2. {alternative_2}: Rejected because {reason}

### Impact
- Affects: {files/modules}
- Dependencies: {related decisions}

### References
- Discussion: {link}
- Implementation: {commit}
```

### issues.md

```markdown
# Issues: {feature}

## Active Issues

### {issue_id}: {title}
- **Status**: Open
- **Severity**: Critical/Major/Minor
- **Context**: {where it was encountered}
- **Description**: {what's wrong}
- **Workaround**: {how to avoid for now}
- **Solution**: {proposed fix}

## Resolved Issues

### {issue_id}: {title}
- **Status**: Resolved
- **Resolution**: {how it was fixed}
- **Date**: {date}
```

---

## Wisdom Querying

When starting a task, query wisdom relevant to the work:

```typescript
// Query by category
wisdom.getByCategory('conventions')

// Query by feature
wisdom.getByFeature('authentication')

// Query by pattern
wisdom.search('database')

// Query recent learnings
wisdom.getRecent(days: 30)
```

---

## Integration Points

### /execute

After task completion:
1. Analyze execution for patterns
2. Extract wisdom from findings
3. Categorize and store

### /prime

At session start:
1. Load feature wisdom
2. Inject into context
3. Display relevant learnings

### /ralph-loop

During iterations:
1. Accumulate wisdom from each pass
2. Inject into next iteration
3. Promote learning over time

---

## Anti-Patterns

### Over-Accumulation
- Don't store trivial findings
- Focus on actionable patterns
- Prune stale wisdom periodically

### Wisdom Silos
- Share wisdom across related features
- Cross-reference when relevant
- Build project-wide knowledge

### Ignoring Wisdom
- Always check before starting work
- Apply relevant learnings
- Update when patterns change