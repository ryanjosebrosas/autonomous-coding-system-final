# Distilled Task Briefs — Task 1/7
<!-- Source: .agents/features/distilled-task-briefs/plan.md -->
<!-- Scope: Create the TASK-BRIEF-TEMPLATE.md template file -->
<!-- Prior: None — this is the first task -->

## Objective

Create `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — the template that defines the structure of every `task-N.md` file produced by `/planning`. This template is the foundation for the entire distilled task brief system. Every section in the template must be operationally consumed during `/execute` — no advisory or context-only sections allowed.

## Scope

- **Do**: Create one new template file defining the task brief structure
- **Don't**: Modify any existing commands or templates (those are tasks 2-7)
- **Depends on**: Nothing — this is the first task

## Files to Read Before Starting

Read these files to understand the existing template patterns and inform the new template design:

- `.opencode/templates/SUB-PLAN-TEMPLATE.md` (all 278 lines) — Closest analog to the task brief. Has Prior Phase Summary, Phase Scope, Context References, Step-by-Step Tasks, Testing Strategy, Validation Commands, Phase Acceptance Criteria, Handoff Notes, Completion Checklist, Phase Notes. The task brief template should follow this structural rhythm but strip advisory sections.

- `.opencode/templates/STRUCTURED-PLAN-TEMPLATE.md` (all 291 lines) — The current single plan template. Shows the full section set including advisory sections (Feature Description, User Story, Problem Statement, Solution Statement, Feature Metadata) that the task brief deliberately OMITS. Also shows the 7-field task format (ACTION, TARGET, IMPLEMENT, PATTERN, IMPORTS, GOTCHA, VALIDATE) that the task brief KEEPS.

- `.opencode/templates/MASTER-PLAN-TEMPLATE.md` (lines 241-249) — The SUB-PLAN INDEX table pattern. The task brief's relationship to plan.md mirrors a sub-plan's relationship to a master plan.

- `.opencode/commands/execute.md` (lines 84-101) — How `/execute` consumes tasks. Understanding what fields are operationally used during execution ensures the template includes everything the executor needs.

- `.opencode/commands/execute.md` (lines 184-258) — How the self-review step works. The task brief's Acceptance Criteria and Completion Checklist feed directly into this step.

---

## Steps

### Step 1: CREATE `.opencode/templates/TASK-BRIEF-TEMPLATE.md`

**What:**
Create the task brief template file. This template defines the structure that every `task-N.md` file must follow. The key design principle is: **every section is operationally consumed during `/execute`**. No advisory, background, or context-only sections.

The template has these sections (in order):

1. **Header block** — Feature name, task number, source plan path, scope, prior tasks completed
2. **Objective** — 2-3 sentences: what this task accomplishes and why (consumed by Step 1 "Read and Understand")
3. **Scope** — In/out/depends-on boundaries (consumed by slice gate check)
4. **Files to Read Before Starting** — Exact file paths with line ranges (consumed by Step 1, tells executor what to read before implementing)
5. **Steps** — The core execution content. Each step uses the 7-field task format (ACTION, TARGET, IMPLEMENT, PATTERN, IMPORTS, GOTCHA, VALIDATE). Steps include full code blocks — copy-paste ready. (Consumed by Step 2 "Execute Tasks in Order")
6. **Tests** — Test files to create with test code (consumed by Step 3 "Implement Testing Strategy")
7. **Validation Commands** — L1-L5 pyramid (consumed by Step 4 "Run Validation Commands")
8. **Acceptance Criteria** — Implementation + Runtime checkboxes (consumed by Step 5b "Acceptance criteria cross-check" and Step 6 "Update Plan Checkboxes")
9. **Handoff** — What the next task brief needs to know: files changed, state created, patterns set (consumed by next task-N+1.md's "Prior" section and by execute.md Step 2.6 task completion)
10. **Completion Checklist** — Final verification checkboxes (consumed by Step 6 "Update Plan Checkboxes")

**Code:**

The full template content follows. Write this EXACTLY to `.opencode/templates/TASK-BRIEF-TEMPLATE.md`:

```markdown
# Task Brief Template

> Use this template for each task brief produced by `/planning`.
> Save to `.agents/features/{feature}/task-{N}.md` and fill in every section.
>
> **When to use**: One task brief per unit of work in the default planning mode.
> The overview plan (`plan.md`) defines the feature context and task index.
>
> **Target Length**: This task brief should be **700-1000 lines** when filled.
> Each brief is self-contained — the executing agent should NOT need to read
> `plan.md` or other task briefs to execute this task. Prior task context is
> provided in the Prior Tasks section below.
>
> **Design Principle**: Every section in this template is operationally consumed
> during `/execute`. No advisory, background, or context-only sections.
> If a section doesn't directly drive an execution step, it doesn't belong here.
>
> **What goes in plan.md vs task-N.md**:
> - `plan.md`: Feature description, user story, problem/solution, design decisions,
>   risks, confidence score, shared context references, task index table
> - `task-N.md`: Steps, code blocks, validation, acceptance criteria — everything
>   the executor needs to implement ONE unit of work
>
> **Relationship to plan.md**: Each task brief corresponds to one row in the
> plan.md TASK INDEX table. The plan.md is the overview; task briefs are the
> execution documents.

---

# Feature: {Feature Name} — Task {N}/{Total}

> **Source Plan**: `.agents/features/{feature}/plan.md`
> **This Task**: Task {N} — {Task Name}
> **Brief Path**: `.agents/features/{feature}/task-{N}.md`

---

## PRIOR TASKS

> What was done in the previous task(s). Provides continuity without requiring
> the execution agent to read prior task briefs.

### For Task 1

This is the first task — no prior work. Start fresh.

### For Task 2+

**Files Changed in Prior Task(s):**
- `path/to/file1` — {what was changed}
- `path/to/file2` — {what was changed}

**Key Outcomes from Prior Task(s):**
- {Outcome 1 — what was delivered}
- {Outcome 2 — what was delivered}

**State Carried Forward:**
- {What this task inherits from prior tasks}
- {Any patterns, structures, or state to build on}

**Known Issues or Deferred Items:**
- {Any issues from prior tasks this task should be aware of}
- {Items intentionally deferred to this task}

---

## OBJECTIVE

{2-3 sentences: what this task accomplishes and why it matters. Be specific —
this is consumed by `/execute` Step 1 "Read and Understand" to orient the
executor before implementation begins.}

---

## SCOPE

**What This Task Delivers:**

{1-2 sentences describing the scope of this specific task.}

**Files This Task Touches:**
- `path/to/file1` — {what changes: create/modify/delete}
- `path/to/file2` — {what changes: create/modify/delete}
- `path/to/new_file` — {new file to create}

**Dependencies:**
- {Task N-1 must complete first / None if Task 1}

**Out of Scope for This Task:**
- {What this task intentionally does NOT do}
- {What is deferred to later tasks}

---

## FILES TO READ BEFORE STARTING

> The execution agent MUST read these files before implementing.
> These are file:line references — the executor reads them directly.
> Do NOT inline the file contents here; the executor has Read tool access.

- `path/to/file` (lines X-Y) — Why: {what pattern or context to learn from this file}
- `path/to/file` (lines X-Y) — Why: {what integration point exists here}
- `path/to/test` — Why: {test pattern to follow}

### Patterns to Follow

> Reference patterns from the codebase as file:line pointers.
> Include a brief code snippet ONLY when the pattern is non-obvious
> or when copy-paste fidelity is critical.

**{Pattern Name}** — See `path/to/file:lines`
- What to match: {1-sentence description of the pattern}
- Gotcha: {1-sentence warning if applicable}

**{Pattern Name}** — See `path/to/file:lines`
- What to match: {1-sentence description of the pattern}
- Gotcha: {1-sentence warning if applicable}

---

## STEP-BY-STEP TASKS

> Execute every step in order, top to bottom. Each step is atomic and
> independently testable.
>
> **Action keywords**: CREATE (new files), UPDATE (modify existing),
> ADD (insert new functionality), REMOVE (delete deprecated code),
> REFACTOR (restructure without changing behavior),
> MIRROR (copy pattern from elsewhere)
>
> **Tip**: For text-centric changes (templates, commands, configs), include
> exact **Current** / **Replace with** content blocks in IMPLEMENT.
> This eliminates ambiguity and achieves higher plan-to-implementation
> fidelity than prose descriptions.

### Step 1: {ACTION} `{target_file_path}`

- **IMPLEMENT**: {what to implement — code-level detail. For text-centric files,
  include exact Current/Replace blocks. For code files, include full implementation.}

  **Current** (lines X-Y of `{file}`):
  ```
  {exact current content to be replaced}
  ```

  **Replace with:**
  ```
  {exact replacement content — copy-paste ready}
  ```

- **PATTERN**: {reference to codebase pattern — `file:line_range`}
- **IMPORTS**: {exact imports needed, copy-paste ready — or "N/A" for non-code files}
- **GOTCHA**: {known pitfalls and how to avoid them}
- **VALIDATE**: `{executable command to verify this step worked}`

### Step 2: {ACTION} `{target_file_path}`

- **IMPLEMENT**: {what to implement — code-level detail}

  **Current** (lines X-Y of `{file}`):
  ```
  {exact current content to be replaced}
  ```

  **Replace with:**
  ```
  {exact replacement content — copy-paste ready}
  ```

- **PATTERN**: {reference to codebase pattern — `file:line_range`}
- **IMPORTS**: {exact imports needed, copy-paste ready — or "N/A"}
- **GOTCHA**: {known pitfalls and how to avoid them}
- **VALIDATE**: `{executable command to verify this step worked}`

### Step 3: {ACTION} `{target_file_path}`

- **IMPLEMENT**: {what to implement — code-level detail}

  **Current** (lines X-Y of `{file}`):
  ```
  {exact current content to be replaced}
  ```

  **Replace with:**
  ```
  {exact replacement content — copy-paste ready}
  ```

- **PATTERN**: {reference to codebase pattern — `file:line_range`}
- **IMPORTS**: {exact imports needed, copy-paste ready — or "N/A"}
- **GOTCHA**: {known pitfalls and how to avoid them}
- **VALIDATE**: `{executable command to verify this step worked}`

{Continue for all steps in this task... Typical: 1-5 steps per task brief.
Each step should target one file or one logical change.}

---

## TESTING

> Test files to create or update for this task. Include full test code.

### Test File: `{path/to/test_file}`

{Description of what this test file covers.}

**Tests to implement:**

1. **{test_name}** — {what it verifies}
   ```{lang}
   {full test code — copy-paste ready}
   ```

2. **{test_name}** — {what it verifies}
   ```{lang}
   {full test code — copy-paste ready}
   ```

3. **{test_name}** — {what it verifies}
   ```{lang}
   {full test code — copy-paste ready}
   ```

{If no tests for this task: "No tests required — this task modifies
configuration/documentation files only."}

---

## VALIDATION COMMANDS

> Execute every command to ensure zero regressions.
> Use project-configured commands from `.opencode/config.md`.

### Level 1: Syntax & Style
```
{linting and formatting commands}
```

### Level 2: Type Safety
```
{type-check commands — or "N/A" if not applicable}
```

### Level 3: Unit Tests
```
{unit test commands — specific to this task's tests}
```

### Level 4: Integration Tests
```
{integration test commands — or "N/A" if not applicable}
```

### Level 5: Manual Validation

{Task-specific manual testing steps. For command/template changes:
"Read the modified file and verify structural correctness."
For code changes: specific API calls, UI checks, CLI commands.}

---

## ACCEPTANCE CRITERIA

> Split into **Implementation** (verifiable during `/execute`) and **Runtime**
> (verifiable only after running the code). Check off Implementation items
> during execution. Leave Runtime items for manual testing.

### Implementation (verify during execution)

- [ ] {Specific, verifiable criterion 1}
- [ ] {Specific, verifiable criterion 2}
- [ ] {Specific, verifiable criterion 3}
- [ ] All validation commands pass with zero errors
- [ ] Code follows project conventions and patterns

### Runtime (verify after testing/deployment)

- [ ] {Runtime verification criterion 1}
- [ ] {Runtime verification criterion 2}
- [ ] No regressions in existing functionality

---

## HANDOFF

> What task-{N+1} needs to know. This feeds into the next task brief's
> "Prior Tasks" section. Also consumed by `/execute` Step 2.6 for
> writing the pipeline handoff.

### Files Created/Modified

- `path/to/file1` — {what was created/modified, key patterns used}
- `path/to/file2` — {what was created/modified, key patterns used}

### Patterns Established

- {Pattern 1 — what pattern was established, where it lives}
- {Pattern 2 — what pattern was established, where it lives}

### State to Carry Forward

- {What state the next task inherits}
- {Any structures or interfaces the next task should build on}

### Known Issues or Deferred Items

- {Any issues the next task should be aware of}
- {Items intentionally deferred to the next task}

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step validation passed
- [ ] All validation commands executed successfully
- [ ] Tests pass (if applicable)
- [ ] No linting or type checking errors
- [ ] Manual validation confirms task works
- [ ] Acceptance criteria all met
- [ ] Handoff notes completed for next task
```

**Gotchas:**
- The template header comment block (lines 1-24) is critical — it explains the design principles to the `/planning` agent that fills the template. Don't shorten it.
- The "For Task 1" / "For Task 2+" conditional in PRIOR TASKS mirrors the same pattern in SUB-PLAN-TEMPLATE.md.
- The STEP-BY-STEP TASKS section includes Current/Replace blocks as the recommended format for text-centric changes. This achieves high fidelity for markdown command files.
- The HANDOFF section structure matches SUB-PLAN-TEMPLATE.md's HANDOFF NOTES exactly — same four subsections.

**Validate:**
Verify the file exists and has the correct structure:
```bash
# Check file exists
ls .opencode/templates/TASK-BRIEF-TEMPLATE.md

# Check key sections are present
grep -c "## PRIOR TASKS\|## OBJECTIVE\|## SCOPE\|## FILES TO READ\|## STEP-BY-STEP\|## TESTING\|## VALIDATION\|## ACCEPTANCE\|## HANDOFF\|## COMPLETION" .opencode/templates/TASK-BRIEF-TEMPLATE.md
# Expected: 10 section headers
```

---

## TESTING

No tests required — this task creates a documentation template file only. Validation is structural (correct sections present, correct format).

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```
# Verify markdown is well-formed (manual check)
# No automated linter for this project's markdown files
```

### Level 2: Type Safety
```
N/A — markdown template file, no type checking applicable
```

### Level 3: Unit Tests
```
N/A — no code to test
```

### Level 4: Integration Tests
```
N/A — template correctness verified when /planning uses it in a later session
```

### Level 5: Manual Validation

Read the created file and verify:
1. All 10 required sections are present: PRIOR TASKS, OBJECTIVE, SCOPE, FILES TO READ, STEP-BY-STEP TASKS, TESTING, VALIDATION COMMANDS, ACCEPTANCE CRITERIA, HANDOFF, COMPLETION CHECKLIST
2. The header comment block explains the design principles clearly
3. The template is self-documenting — a `/planning` agent can fill it without additional instructions
4. The 7-field task format (ACTION, TARGET, IMPLEMENT, PATTERN, IMPORTS, GOTCHA, VALIDATE) is present in the STEP-BY-STEP section
5. Current/Replace blocks are shown as the recommended format for text-centric changes
6. No advisory sections (Feature Description, User Story, Problem Statement, Solution Statement, Feature Metadata, Notes, Risks, Confidence Score) are present — these belong in plan.md only

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] File `.opencode/templates/TASK-BRIEF-TEMPLATE.md` exists
- [ ] Template contains all 10 required sections
- [ ] Template includes the 7-field task format
- [ ] Template includes Current/Replace block examples
- [ ] Template header comment explains design principles (every section operationally consumed)
- [ ] Template explicitly states what goes in plan.md vs task-N.md
- [ ] No advisory sections present in the template
- [ ] All validation commands pass with zero errors

### Runtime (verify after testing/deployment)

- [ ] `/planning` can fill this template to produce a valid task brief
- [ ] `/execute` can consume a filled task brief and execute all steps
- [ ] No regressions in existing template usage

---

## HANDOFF

### Files Created/Modified

- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — New template file (the foundation for task-N.md generation)

### Patterns Established

- Task brief template structure: PRIOR TASKS → OBJECTIVE → SCOPE → FILES TO READ → STEPS → TESTING → VALIDATION → ACCEPTANCE → HANDOFF → COMPLETION
- Template is self-contained by design — no dependency on plan.md during execution
- Current/Replace blocks as the recommended implementation format for text-centric changes

### State to Carry Forward

- The template file exists at `.opencode/templates/TASK-BRIEF-TEMPLATE.md`
- Task 2 (planning.md update) will reference this template when generating task briefs
- Task 3 (execute.md update) will consume files structured according to this template

### Known Issues or Deferred Items

- None — template is complete and ready for use

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step validation passed
- [ ] All validation commands executed successfully
- [ ] Tests pass (N/A — no code tests)
- [ ] No linting or type checking errors (N/A — markdown only)
- [ ] Manual validation confirms template structure is correct
- [ ] Acceptance criteria all met
- [ ] Handoff notes completed for next task
