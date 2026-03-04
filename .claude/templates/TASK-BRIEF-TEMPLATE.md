# Task Brief Template

> Use this for each individual task brief in a feature.
> Save to `.agents/features/{feature}/task-{N}.md` and fill in every section.
>
> **When to use**: One task brief per target file. Task briefs are the
> default execution format — produced by `/planning` alongside `plan.md`.
>
> **Target Length**: Each task brief should be **700-1000 lines** when filled.
> Each brief is self-contained — an execution agent can run it without reading
> `plan.md` or any other file. All context is pasted inline.
>
> **Self-containment rule**: Every line must be operationally useful.
> No advisory sections (User Story, Problem Statement, Risks, Confidence Score).
> Only: steps, code, validation, and acceptance criteria.
>
> **Granularity rule**: One task brief = one target file. This is the default
> because depth on one file naturally fills 700 lines when you paste full context
> inline, include complete Current/Replace blocks, and fill every section below.
> Multi-file briefs are the exception — only when edits are tightly coupled
> (e.g., renaming something in file A requires updating the import in file B).
>
> **Inline content rule**: All context must be pasted directly into the brief
> in code blocks. Never write "see lines X-Y" or "read file Z" as a substitute
> for pasting the content. The executing model works from the brief alone.
> Line-range references in the "Files to Read" section tell the model what to
> verify — but the brief itself must contain the content needed to implement.
>
> **Rejection criteria** — a brief is REJECTED if it:
> - Is under 700 lines
> - Uses "see lines X-Y" instead of pasting content inline
> - Skips any section below (every section from OBJECTIVE through COMPLETION CHECKLIST is required)
> - Has Current/Replace blocks that abbreviate or summarize instead of pasting exact content
> - Covers 3+ files without explicit justification for why they can't be separate briefs

---

# Task {N} of {M}: {Task Title}

> **Feature**: `{feature-name}`
> **Brief Path**: `.agents/features/{feature}/task-{N}.md`
> **Plan Overview**: `.agents/features/{feature}/plan.md`

---

## OBJECTIVE

> What this task delivers. One precise sentence — the test for "done."

{Single sentence describing the concrete outcome of this task. Example:
"Add task brief generation to `/planning` so it produces `task-N.md` files
alongside `plan.md` as its default output mode."}

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `path/to/file1` | UPDATE | {what changes in this file} |
| `path/to/file2` | CREATE | {new file, what it contains} |
| `path/to/file3` | UPDATE | {what changes in this file} |

**Out of Scope:**
- {What this task intentionally does NOT do}
- {What is handled by a different task brief}
- {Existing behavior that must be preserved unchanged}

**Dependencies:**
- {Task N-1 must complete first — what state this task inherits}
- {Or: "None — this is the first task"}

---

## PRIOR TASK CONTEXT

> What was done in the previous task(s). Provides continuity without requiring
> reading prior task briefs or the full plan.

### For Task 1

This is the first task — no prior work. Start fresh from the codebase state.

### For Task 2+

**Files Changed in Prior Task(s):**
- `path/to/file1` — {what changed, key patterns established}
- `path/to/file2` — {what changed, interface/structure to build on}

**State Carried Forward:**
- {What this task inherits — structures, patterns, decisions}
- {Any partial implementations this task must be aware of}

**Known Issues or Deferred Items:**
- {Any issues from prior tasks this task should handle}
- {Items explicitly deferred to this task}

---

## CONTEXT REFERENCES

> IMPORTANT: Read ALL files listed here before implementing. They are not optional.
> All relevant content MUST be pasted inline in this section or in the Steps below.
> The executing model works from the brief alone — "see lines X-Y" is not enough.

### Files to Read

> List files with line ranges for the executing model to verify against.
> Then paste the actual content inline in code blocks below each reference.
> This is what makes the brief self-contained and worth 700+ lines.

- `path/to/file1` (lines X-Y) — Why: {why this range is critical to understand}
- `path/to/file2` (all {N} lines) — Why: {what to look for / understand}
- `path/to/file3` (lines X-Y) — Why: {specific section relevant to this task}

### Current Content: {File 1 Section Name} (Lines X-Y)

> Paste the exact content from the file in a code block. This is NOT optional.
> The executing model reads this instead of opening the file.

```
{exact content from path/to/file1, lines X-Y — every line, preserving indentation}
```

**Analysis**: {What to notice in this content. What the executing model needs to understand before modifying it.}

### Current Content: {File 2 Section Name} (Lines X-Y)

```
{exact content from path/to/file2, lines X-Y}
```

**Analysis**: {What to notice, what's relevant to this task.}

### Patterns to Follow

> This section is NOT optional. Every task has at least one pattern to follow.
> Include COMPLETE code snippets from the codebase — copy-pasteable, not summaries.
> If the task creates a new file, the pattern is the closest existing analog.
> If the task modifies a file, the pattern is the established style in that file.

**{Pattern Name}** (from `path/to/file:lines`):
```
{actual code snippet from the project — complete, not abbreviated.
 Include enough surrounding context that the executing model understands
 the structure, not just the specific lines being referenced.
 Typical: 20-50 lines per pattern snippet.}
```
- Why this pattern: {why to follow it}
- How to apply: {how this pattern maps to the current task's implementation}
- Common gotchas: {what to watch out for}

**{Pattern Name 2}** (from `path/to/file:lines`):
```
{actual code snippet from the project — complete}
```
- Why this pattern: {explanation}
- How to apply: {mapping to this task}
- Common gotchas: {warnings}

---

## STEP-BY-STEP TASKS

> Execute every step in order. Each step is atomic and independently verifiable.
>
> **Action keywords**: CREATE (new files), UPDATE (modify existing), ADD (insert
> new functionality to an existing section), REMOVE (delete deprecated code),
> REFACTOR (restructure without behavior change)
>
> **Current / Replace with blocks are mandatory for all file edits.**
> - **Current blocks**: Paste the EXACT content from the file — every line,
>   preserving indentation. Never abbreviate, summarize, or use "..." to skip
>   lines. The executing model matches this content to find the edit location.
> - **Replace with blocks**: Paste the COMPLETE new content, ready to paste
>   directly into the file. Include all lines, not just the changed ones.
> - **Context window**: Include 2-3 unchanged lines above and below the edit
>   to anchor the replacement location unambiguously.

---

### Step 1: {ACTION} `{target/file/path}`

**What**: {one sentence describing what this step does}

**IMPLEMENT**:

> {Prose or structured description of what to implement. For file edits,
> include Current / Replace with blocks. For new files, describe the
> full structure. All code must be copy-pasteable.}

Current (lines X-Y of `path/to/file`):
```
{exact current content to replace}
```

Replace with:
```
{exact new content}
```

**PATTERN**: `path/to/reference-file:line-range` — {why this is the reference}

**IMPORTS**: {exact import statements needed, or "N/A"}

**GOTCHA**: {specific pitfall for this step — what will break if done wrong}

**VALIDATE**:
```bash
# Command or manual check to verify this step is correct
{validation command}
```

---

### Step 2: {ACTION} `{target/file/path}`

**What**: {one sentence describing what this step does}

**IMPLEMENT**:

Current (lines X-Y of `path/to/file`):
```
{exact current content to replace}
```

Replace with:
```
{exact new content}
```

**PATTERN**: `path/to/reference-file:line-range` — {why this is the reference}

**IMPORTS**: {exact import statements needed, or "N/A"}

**GOTCHA**: {specific pitfall for this step}

**VALIDATE**:
```bash
{validation command}
```

---

### Step 3: {ACTION} `{target/file/path}`

**What**: {one sentence describing what this step does}

**IMPLEMENT**:

{For a CREATE action — describe full file structure:}

```markdown
# {File Title}

> {Brief description}

## Section 1

{Section content...}

## Section 2

{Section content...}
```

**PATTERN**: `path/to/reference-file:line-range` — {reference}

**IMPORTS**: N/A

**GOTCHA**: {pitfall}

**VALIDATE**:
```bash
{validation command}
```

---

### Step 4: {ACTION} `{target/file/path}`

**What**: {one sentence}

**IMPLEMENT**:

{Implementation detail — include as much specificity as needed.
For structural changes: show before/after. For new sections: show
the complete section content. For logic changes: explain the branch
conditions and what each branch does.}

**PATTERN**: `path/to/reference-file:line-range`

**IMPORTS**: {or N/A}

**GOTCHA**: {pitfall}

**VALIDATE**:
```bash
{validation command}
```

---

### Step 5: {ACTION} `{target/file/path}`

**What**: {one sentence}

**IMPLEMENT**:

{Implementation detail}

**PATTERN**: `path/to/reference-file:line-range`

**IMPORTS**: {or N/A}

**GOTCHA**: {pitfall}

**VALIDATE**:
```bash
{validation command}
```

---

### Step 6: {ACTION} `{target/file/path}`

**What**: {one sentence}

**IMPLEMENT**:

{Implementation detail}

**PATTERN**: `path/to/reference-file:line-range`

**IMPORTS**: {or N/A}

**GOTCHA**: {pitfall}

**VALIDATE**:
```bash
{validation command}
```

---

### Step 7: {ACTION} `{target/file/path}`

**What**: {one sentence}

**IMPLEMENT**:

{Implementation detail}

**PATTERN**: `path/to/reference-file:line-range`

**IMPORTS**: {or N/A}

**GOTCHA**: {pitfall}

**VALIDATE**:
```bash
{validation command}
```

> Add more steps as needed. Target 5-10 steps per task brief.
> If you need more than 10 steps, consider whether this task should be split.

---

## TESTING STRATEGY

> Every brief must include a testing strategy, even for configuration/doc changes.
> For markdown/config changes, manual testing IS the strategy — describe it precisely.

### Unit Tests

{Scope and requirements for this task's unit tests. What specific components to
test. If this task does not have unit tests (e.g., config-only change), state:
"No unit tests — this task modifies {files}. Covered by manual testing in Level 5."}

### Integration Tests

{Scope and requirements. What end-to-end workflows to verify for this task.
If no integration tests apply, state "N/A" and explain.}

### Edge Cases

- {Edge case 1 — what could break? What input or state triggers it?}
- {Edge case 2 — boundary conditions, empty states, or error conditions}
- {Edge case 3 — interaction with other system parts}
- {Edge case 4 — backward compatibility concern if applicable}

---

## VALIDATION COMMANDS

> Execute every level that applies. Full depth is required — one signal is not enough.
> For markdown/config changes: L1 is file existence check, L5 is manual walkthrough.

### Level 1: Syntax & Style
```bash
# File exists and is well-formed
# For markdown: open file and verify structure
# For code: run linter
{command or manual check description}
```

### Level 2: Type Safety
```bash
# Type-check commands
# For markdown-only tasks: N/A — skip this level
{command or "N/A — no type-checked code modified"}
```

### Level 3: Unit Tests
```bash
# Run unit tests covering this task's scope
{test command with grep/filter for this task's tests}
# Or: "N/A — no unit tests for this task (see Testing Strategy)"
```

### Level 4: Integration Tests
```bash
# Integration test commands
{integration test command}
# Or: "N/A — covered by Level 5 manual validation"
```

### Level 5: Manual Validation

> Precise walkthrough. Not "test it" — exact steps that produce evidence.

1. {Step 1 — what to do}
2. {Step 2 — what to observe}
3. {Step 3 — expected output}
4. {What success looks like — be specific}
5. {What failure looks like — what to check if it fails}

### Level 6: Cross-Check (Optional)

{Verify this task's changes integrate correctly with adjacent tasks:
- Read {file changed in Task N-1} and confirm this task's additions are compatible
- Grep for {pattern} across modified files to ensure consistency
- Or: "N/A — this task has no cross-task dependencies"}

---

## ACCEPTANCE CRITERIA

> Implementation items: verify during execution and check off.
> Runtime items: verify during manual testing after execution.
>
> DO NOT check off an item unless you have concrete evidence from this run.

### Implementation (verify during execution)

- [ ] {Criterion 1 — specific, verifiable, tied to a step above}
- [ ] {Criterion 2 — file created/modified as specified}
- [ ] {Criterion 3 — specific functionality implemented}
- [ ] {Criterion 4 — validation commands ran and passed}
- [ ] {Criterion 5 — no regressions in adjacent files}
- [ ] {Criterion 6 — code/content follows specified patterns}

### Runtime (verify after testing/deployment)

- [ ] {Runtime criterion 1 — behavior observable when running the system}
- [ ] {Runtime criterion 2 — integration with other commands/files verified}
- [ ] {Runtime criterion 3 — edge cases handled correctly at runtime}

---

## HANDOFF NOTES

> What the NEXT task needs to know. Written AFTER execution completes.
> These feed into Task N+1's "Prior Task Context" section.

### Files Created/Modified

- `path/to/file1` — {what was created/modified, key patterns used}
- `path/to/file2` — {what was created/modified, interface established}

### Patterns Established

- {Pattern 1 — what pattern was established, where it lives, why}
- {Pattern 2 — what pattern was established}

### State to Carry Forward

- {What state the next task inherits}
- {Structures, interfaces, or conventions the next task should build on}

### Known Issues or Deferred Items

- {Any issues the next task should be aware of}
- {Items explicitly deferred to the next task or to code-loop}

---

## COMPLETION CHECKLIST

> Final gate before marking this brief done. All boxes must be checked.

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written (if task N < M)
- [ ] Brief marked done: rename `task-{N}.md` → `task-{N}.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- {Why this approach over alternatives — specific to this task}
- {Trade-offs accepted and why}
- {Constraints that shaped the implementation}

### Implementation Notes

- {Non-obvious implementation detail worth recording}
- {Context that would help debug if something goes wrong}
- {What to check first if validation fails}

---

> **Reminder**: Mark this brief done after execution:
> Rename `task-{N}.md` → `task-{N}.done.md`
> This signals to `/execute` (via artifact scan) that this task is complete.
