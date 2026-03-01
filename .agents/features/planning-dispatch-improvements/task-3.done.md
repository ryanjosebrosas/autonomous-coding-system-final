# Task 3 of 4: Create plan-writer Sub-Agent

> **Feature**: `planning-dispatch-improvements`
> **Brief Path**: `.agents/features/planning-dispatch-improvements/task-3.md`
> **Plan Overview**: `.agents/features/planning-dispatch-improvements/plan.md`

---

## OBJECTIVE

Create a dedicated `plan-writer` sub-agent in `.opencode/agents/plan-writer.md` that specializes in writing plan artifacts (`plan.md` and `task-N.md` briefs) following the established templates and quality criteria.

---

## SCOPE

**Files This Task Touches:**

| File | Action | What Changes |
|------|--------|-------------|
| `.opencode/agents/plan-writer.md` | CREATE | New sub-agent definition (~150 lines) |
| `.opencode/agents/README.md` | UPDATE | Add plan-writer to the agent registry |

**Out of Scope:**
- How `/planning` invokes the plan-writer — handled in Task 4
- The plan.md template structure — already defined in planning.md Phase 5
- The task brief template — already exists at `.opencode/templates/TASK-BRIEF-TEMPLATE.md`
- The Phase 3 structured reasoning — handled in Task 2

**Dependencies:**
- None for agent creation — the agent can be created independently
- Task 4 depends on this task (Phase 5 references the plan-writer agent)

---

## PRIOR TASK CONTEXT

**Files Changed in Task 1:**
- `.opencode/tools/dispatch.ts` — Wired no-timeout for planning/execution. Ensures the plan-writer agent sessions aren't killed by timeout.

**Files Changed in Task 2:**
- `.opencode/commands/planning.md` — Phase 3 expanded to Synthesize→Analyze→Decide→Decompose. The plan-writer agent receives the Phase 3 output as structured context in its prompt.
- `.opencode/commands/build.md` — Removed `timeout: 900` from planning dispatch.

**State Carried Forward:**
- The Phase 3 output format (SYNTHESIS, ANALYSIS, APPROACH DECISION, TASK DECOMPOSITION) is the structured context that gets passed to the plan-writer agent's prompt
- The plan-writer agent must understand this format to produce artifacts that are consistent with the reasoning

**Known Issues or Deferred Items:**
- None from prior tasks that affect this task

---

## CONTEXT REFERENCES

### Files to Read

- `.opencode/agents/code-review.md` (all 100 lines) — Why: Pattern for agent definition structure
- `.opencode/agents/planning-research.md` (all 69 lines) — Why: Pattern for planning-related agent
- `.opencode/agents/README.md` (all 36 lines) — Why: Registry to update
- `.opencode/templates/TASK-BRIEF-TEMPLATE.md` (lines 1-35) — Why: The template the agent reads at runtime — understand the header/rules section
- `.opencode/commands/planning.md` (lines 246-317) — Why: Phase 5 plan.md and task brief requirements — what the agent must produce

### Current Content: code-review.md (Full File — 100 lines)

```markdown
# Code Review Agent

Comprehensive code review agent covering type safety, security, architecture, performance, and quality.

## Purpose

Review code changes for bugs, security issues, architecture violations, and quality problems. Reports findings at three severity levels — does NOT implement fixes.

## Review Dimensions

### 1. Type Safety
- Missing type hints / annotations
- Unsafe type casts or coercions
- Nullable value handling (missing null checks)
- Generic type misuse
- Type narrowing gaps

### 2. Security
- SQL injection, XSS, command injection
- Hardcoded secrets, API keys, passwords
- Insecure data handling (PII exposure, unencrypted storage)
- Missing input validation / sanitization
- Authentication / authorization gaps
- Insecure dependencies

### 3. Architecture
- Layer boundary violations (e.g., UI calling DB directly)
- Tight coupling between modules
- Dependency direction violations
- Convention drift from established patterns
- Missing abstractions or unnecessary abstractions
- SOLID principle violations

### 4. Performance
- N+1 query patterns
- O(n^2) or worse algorithms where O(n) is possible
- Memory leaks (unclosed resources, growing collections)
- Unnecessary computation (redundant loops, repeated calculations)
- Missing caching where appropriate
- Blocking operations in async contexts

### 5. Code Quality
- DRY violations (duplicated logic)
- Unclear naming (variables, functions, types)
- Missing or misleading comments
- Overly complex functions (high cyclomatic complexity)
- Missing error handling
- Dead code

## Severity Levels

### Critical (blocks commit)
- Security vulnerabilities
- Logic errors that will cause runtime failures
- Type safety issues that bypass compile-time checks
- Data corruption risks

### Major (fix soon)
- Performance issues with measurable impact
- Architecture violations that increase maintenance cost
- Error handling gaps that could cause silent failures
- Missing tests for critical paths

### Minor (consider fixing)
- Code quality improvements
- Naming suggestions
- Documentation gaps
- Style inconsistencies

## Output Format

```
CODE REVIEW: {scope}
================================

Critical (blocks commit):
- `file:line` — {issue}
  Why: {explanation}
  Fix: {suggestion}

Major (fix soon):
- `file:line` — {issue}
  Why: {explanation}
  Fix: {suggestion}

Minor (consider):
- `file:line` — {issue}

Summary: {X} critical, {Y} major, {Z} minor
Recommendation: {PASS / FIX CRITICAL / FIX MAJOR}
```

## Rules

- Always include `file:line` references for every finding
- Distinguish between "this is definitely a bug" (Critical) and "this could be improved" (Minor)
- Don't flag pre-existing issues unless they were made worse by the current change
- Don't flag intentional patterns — if the codebase consistently does X, don't complain about X
- Be specific about fixes — "add null check" not "handle edge cases"
- If you find 0 issues, say so clearly — don't inflate findings
```

**Analysis**: Structure pattern: Purpose → Dimensions/Sections (domain knowledge) → Output Format → Rules. The plan-writer agent follows this same structure: Purpose → Artifact Types → Quality Criteria → Writing Process → Output (files) → Rules.

### Current Content: planning-research.md (Full File — 69 lines)

```markdown
# Planning Research Agent

Knowledge base search and completed plan reference agent for `/planning`.

## Purpose

Search the Archon RAG knowledge base and scan completed plans in `.agents/features/` to provide
research context for planning sessions. Returns structured findings that inform plan design
without consuming main conversation context.

## Capabilities

- **RAG knowledge search**: Query Archon RAG for architecture patterns, code examples, and best practices
- **Completed plan mining**: Scan `.agents/features/*/plan.done.md` and `.agents/features/*/task-{N}.done.md` for reusable patterns, task structures, and lessons learned
- **Pattern synthesis**: Combine RAG and plan findings into actionable planning context

## Instructions

When invoked with a feature description:

1. **Search Archon RAG** (if available):
   - `rag_search_knowledge_base(query="{2-5 keyword query}", match_count=5)` for architecture patterns
   - `rag_search_code_examples(query="{2-5 keyword query}", match_count=3)` for similar implementations
   - Read top hits in full with `rag_read_full_page()` for detailed context
   - If Archon unavailable, skip this step and note "RAG not available"

2. **Scan completed plans**:
   - Use Glob to find `.agents/features/*/plan.done.md` files
   - Also scan `.agents/features/*/task-{N}.done.md` files for task-level patterns and implementation detail
   - Read each completed plan's Feature Description, Solution Statement, and Patterns to Follow sections
   - From completed task briefs, read the Step-by-Step Tasks and Handoff Notes sections for implementation patterns
   - Identify plans/briefs that share similar technologies, patterns, or architectural concerns
   - Extract reusable task structures and lessons from Notes sections

3. **Synthesize findings**:
   - Combine RAG results with plan references
   - Prioritize findings most relevant to the current feature
   - Flag any conflicting patterns between RAG docs and actual plan implementations

## Output Format

```
## Planning Research: {feature topic}

### RAG Findings
- **{Pattern/topic}**: {summary} (Source: {url or document title})

### Completed Plan References
- **{feature-name}/plan.done.md**: {what's relevant}
- **{feature-name}/task-{N}.done.md**: {task-level pattern}

### Recommended Patterns
- {Pattern to follow with source reference}

### Warnings
- {Any conflicts, deprecated patterns, or lessons from past plans}
```

## Rules

- Never modify files — this is a read-only research agent
- Keep RAG queries SHORT (2-5 keywords) for best vector search results
- Only reference completed artifacts (`.done.md`) — active plans and task briefs are in-progress and unreliable
- If both RAG and completed plans are empty, return "No prior research available" — don't fabricate
- Always cite sources (RAG page URLs or plan file paths)
```

**Analysis**: This is the read-side counterpart to the plan-writer. Similar structure: Purpose → Capabilities → Instructions → Output Format → Rules. The plan-writer follows this pattern but for write operations.

### Current Content: README.md (Full File — 36 lines)

```markdown
# Custom Subagents

Subagents for parallel research, code review, and specialist tasks.

## Research Agents

| Agent | Purpose |
|-------|---------|
| `research-codebase` | Parallel codebase exploration: finds files, extracts patterns, reports findings |
| `research-external` | Documentation search, best practices, version compatibility checks |

## Code Review Agent

| Agent | What It Covers |
|-------|---------------|
| `code-review` | Comprehensive review: type safety, security, architecture, performance, code quality |

The code review agent covers all dimensions in a single pass. When dispatch is available, multiple instances can run in parallel with different focus areas.

## Usage

Agents are invoked via the Task tool by the main agent, or can be @mentioned directly:
```
@research-codebase find all authentication-related code
@research-external what are the best practices for JWT token refresh?
@code-review review the changes in src/auth/
```

## Creating New Agents

Create new markdown files in `.opencode/agents/` following the existing format:
- Purpose statement
- Capabilities list
- Instructions for invocation
- Output format
- Rules/constraints
```

**Analysis**: Need to add a "Plan Writing Agent" section to the registry. Follows the same table pattern as Research Agents and Code Review Agent.

### Current Content: TASK-BRIEF-TEMPLATE.md Header (Lines 1-35)

```markdown
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
```

**Analysis**: This is what the plan-writer agent reads at runtime. The agent definition should NOT duplicate this content — it should instruct the agent to read this file and follow it. The agent definition focuses on the writing process and quality verification, not the template structure.

### Current Content: planning.md Phase 5 Requirements (Lines 246-317)

```markdown
### Task Brief Mode (Default)

**Step 1: Write `plan.md` (overview + task index)**

Every `plan.md` is 700-1000 lines. It is the source of truth and human-readable overview. It contains:

- Feature Description, User Story, Problem Statement, Solution Statement
- Feature Metadata with Slice Guardrails
- Pillar Context (if available): pillar N — name, scope, research findings, PRD requirements
- Context References (codebase files with line numbers, related memories, relevant docs)
- Patterns to Follow (with actual code snippets from the project)
- Implementation Plan (overview of phases/groupings)
- Step-by-Step Tasks (summary level — 3-4 lines per task with ACTION, TARGET, scope description)
- Testing Strategy (overview)
- Validation Commands (all levels of the validation pyramid)
- Acceptance Criteria (Implementation + Runtime, with checkboxes)
- Completion Checklist
- Notes (key decisions, risks, confidence score)
- **TASK INDEX** table at the bottom listing all task briefs with scope and status

...

**Step 2: Write task briefs (`task-N.md`) — one per target file**

Using `.opencode/templates/TASK-BRIEF-TEMPLATE.md` as the structural reference, write one task brief for each task:

- Save to `.agents/features/{feature}/task-{N}.md`
- Each brief is **self-contained** — `/execute` can run it without reading `plan.md` or any other file
- Each brief targets **700-1000 lines** — this is achieved by pasting all context inline, not by padding
- No advisory sections (no Feature Description, User Story, Problem Statement, Confidence Score — those live in `plan.md`)
- Every line must be operationally useful: steps, exact code, validation commands, acceptance criteria

**Task splitting heuristic**: One task brief = one target file...

**How briefs reach 700 lines — inline content, not padding:**
- **Context References**: Paste the full current content of every section being modified in code blocks (50-150 lines)
- **Patterns to Follow**: Paste complete reference patterns from other files with analysis (30-80 lines)
- **Current/Replace blocks**: Paste the EXACT current content and COMPLETE replacement content — every line, preserving indentation (50-200 lines per step)
- **All sections filled**: Every section from OBJECTIVE through COMPLETION CHECKLIST must be present and substantive. No empty sections, no "N/A" without explanation.

**Hard requirement:** If a task brief is under 700 lines, it is REJECTED...

**Required sections per task brief:**
- Objective, Scope, Prior Task Context, Context References, Patterns to Follow
- Step-by-Step Tasks, Testing Strategy, Validation Commands (L1-L5)
- Acceptance Criteria, Handoff Notes, Completion Checklist

**Rejection criteria** — a task brief is REJECTED if it:
- Is under 700 lines
- Uses "see lines X-Y" or "read file Z" instead of pasting content inline
- Skips any required section
- Has Current/Replace blocks that abbreviate, summarize, or use "..." to skip lines
- Covers 3+ files without explicit justification
```

**Analysis**: This is the quality criteria the plan-writer agent must internalize. The agent definition references these requirements and instructs the agent to self-validate against them before finishing each artifact.

### Patterns to Follow

**Agent definition structure** (from `code-review.md`):

```markdown
# {Agent Name}

{One-line description}

## Purpose

{What it does. What it produces. What it does NOT do.}

## {Domain-Specific Sections}

{Structured knowledge the agent needs for its task}

## Output Format

{Exact format of output — for plan-writer, this is file writes}

## Rules

{Hard constraints, rejection criteria}
```

- Why this pattern: All existing agents follow Purpose → Domain Sections → Output → Rules.
- How to apply: Plan-writer follows the same skeleton but with: Artifact Types (plan.md vs task briefs), Writing Process (how to write each artifact), Quality Criteria (700-line requirement, inline content), Self-Validation (what to check before declaring done).
- Common gotchas: Don't duplicate the full TASK-BRIEF-TEMPLATE.md content — reference it as a runtime read. Don't duplicate the planning.md Phase 5 requirements — summarize the key rules.

---

## STEP-BY-STEP TASKS

---

### Step 1: CREATE `.opencode/agents/plan-writer.md`

**What**: Create the plan-writer agent definition following the established agent pattern.

**IMPLEMENT**:

Create new file `.opencode/agents/plan-writer.md` with the following content:

```markdown
# Plan Writer Agent

Specialized agent for writing plan artifacts (plan.md and task brief files) from structured planning context.

## Purpose

Write plan artifacts for a feature based on structured context received from `/planning` Phase 3 (Synthesize, Analyze, Decide, Decompose). Produces two types of artifacts:
1. `plan.md` — feature overview + task index (700-1000 lines)
2. `task-N.md` — individual task briefs (700-1000 lines each)

Each invocation writes ONE artifact. The calling agent dispatches the plan-writer once for `plan.md`, then once per task brief.

This agent does NOT:
- Do discovery or research (that's Phase 1-2)
- Make design decisions (that's Phase 3)
- Execute code or run commands (that's `/execute`)
- Approve plans (that's Phase 4)

## Required Setup

Before writing any artifact, read these files:
1. `.opencode/templates/TASK-BRIEF-TEMPLATE.md` — structural reference for task briefs
2. All target files referenced in the context (use Read tool to get current content for inline pasting)

## Artifact Types

### plan.md (Feature Overview + Task Index)

700-1000 lines. Contains:
- Feature Description, User Story, Problem Statement, Solution Statement
- Feature Metadata with Slice Guardrails
- Pillar Context (if available)
- Context References (codebase files with line numbers AND code snippets pasted inline)
- Patterns to Follow (complete code snippets from the project, not summaries)
- Implementation Plan (overview of phases/groupings)
- Step-by-Step Tasks (summary: 3-4 lines per task with ACTION, TARGET, scope)
- Testing Strategy (overview)
- Validation Commands (L1-L5, each level filled or N/A with reason)
- Acceptance Criteria (Implementation + Runtime checkboxes)
- Completion Checklist
- Notes (key decisions, risks, confidence score)
- **TASK INDEX** table listing all task briefs with scope and status

### task-N.md (Individual Task Brief)

700-1000 lines. Self-contained — an execution agent runs it without reading plan.md.

Required sections (every section mandatory, no exceptions):
- OBJECTIVE — one sentence, the test for "done"
- SCOPE — files touched, out of scope, dependencies
- PRIOR TASK CONTEXT — what task N-1 did (or "None" for task 1)
- CONTEXT REFERENCES — files to read with line ranges AND full content pasted inline in code blocks
- PATTERNS TO FOLLOW — complete code snippets from codebase (not summaries, not references)
- STEP-BY-STEP TASKS — each step: IMPLEMENT with Current/Replace blocks, PATTERN, GOTCHA, VALIDATE
- TESTING STRATEGY — unit, integration, edge cases
- VALIDATION COMMANDS — L1 through L5, each filled or N/A with reason
- ACCEPTANCE CRITERIA — Implementation + Runtime checkboxes
- HANDOFF NOTES — what task N+1 needs (omit for last task)
- COMPLETION CHECKLIST

## Writing Process

### For plan.md:

1. Read the structured context from the prompt (Phase 3 output: SYNTHESIS, ANALYSIS, APPROACH DECISION, TASK DECOMPOSITION)
2. Read all target files referenced in the context (use Read tool)
3. Write the plan.md file following the structure above
4. Include code snippets pasted inline — every Context Reference and Pattern must have actual code
5. The TASK INDEX table must list every task brief with: task number, brief path, one-line scope, status (pending), file count
6. Save to `.agents/features/{feature}/plan.md`

### For task-N.md:

1. Read the structured context from the prompt (Phase 3 output + plan.md overview + prior task handoff notes if N > 1)
2. Read `.opencode/templates/TASK-BRIEF-TEMPLATE.md` for structural reference
3. Read the target file(s) for this task (use Read tool to get current content)
4. Read pattern reference files mentioned in the context
5. Write the task brief following every section from the template
6. Paste ALL content inline — current file content, replacement content, pattern snippets
7. Current/Replace blocks must be EXACT — every line, preserving indentation, no abbreviation
8. Save to `.agents/features/{feature}/task-{N}.md`

## Quality Criteria

### The 700-Line Requirement

Both plan.md and task briefs must be 700-1000 lines. This is NOT padding — it's depth:
- Context References: Paste full current content of modified sections (50-150 lines per file)
- Patterns to Follow: Complete reference patterns with analysis (30-80 lines per pattern)
- Current/Replace blocks: EXACT current content and COMPLETE replacement (50-200 lines per step)
- All sections filled: Every required section present and substantive

### How to Reach 700 Lines (Inline Content, Not Padding)

The line count comes from pasting real content, not from verbose descriptions:
- Read the target file and paste the relevant sections in code blocks under Context References
- Read pattern reference files and paste complete snippets (20-50 lines each) under Patterns to Follow
- For each implementation step, paste the exact current content in a "Current" code block and the complete replacement in a "Replace with" code block
- Fill every section — if a section genuinely doesn't apply, write "N/A" with a one-sentence explanation, not just "N/A"

### Rejection Criteria

An artifact is REJECTED if it:
- Is under 700 lines
- Uses "see lines X-Y" or "read file Z" instead of pasting content inline
- Skips any required section
- Has Current/Replace blocks that abbreviate, summarize, or use "..." to skip lines
- Has task briefs covering 3+ files without explicit justification
- Has Patterns to Follow that are descriptions instead of actual code snippets
- Has Context References without pasted code blocks

## Self-Validation

Before declaring an artifact complete, verify:

1. **Line count**: Count the lines. If under 700, go back and expand — paste more current file content, add more pattern snippets, add more validation steps.
2. **Inline content**: Search for "see lines" or "read file" or "refer to" — if found, replace with actual pasted content.
3. **Section completeness**: Check every required section is present and filled (not empty, not just "N/A" without reason).
4. **Current/Replace accuracy**: For every Current block, verify the content matches the actual file by re-reading the file.
5. **Cross-brief consistency** (for task briefs): If this is task N > 1, verify the Prior Task Context section accurately describes what task N-1 does, and the Handoff Notes from task N-1 are reflected.

## Output

The agent writes files directly to disk using the Write tool:
- `plan.md` → `.agents/features/{feature}/plan.md`
- `task-N.md` → `.agents/features/{feature}/task-{N}.md`

After writing, report:
```
PLAN-WRITER COMPLETE
====================
Artifact: {plan.md | task-N.md}
Path: {file path}
Lines: {line count}
Sections: {all present | missing: {list}}
Status: {PASS | REJECTED: {reason}}
```

## Rules

- Read ALL target files before writing — never guess at file content
- Read `.opencode/templates/TASK-BRIEF-TEMPLATE.md` before writing any task brief
- Paste content inline — never use "see lines X-Y" as a substitute
- Current/Replace blocks must be EXACT — every line, preserving indentation
- One artifact per invocation — do not write multiple briefs in one session
- Never skip sections — every required section must be present and substantive
- Never pad with verbose descriptions — depth comes from inline code content
- If a target file doesn't exist yet (CREATE action), describe the full file structure instead of Current/Replace blocks
- Self-validate before reporting complete — check line count, inline content, section completeness
- Report the completion status honestly — if the artifact doesn't meet criteria, say so
```

**PATTERN**: `code-review.md` — Purpose → Domain Sections → Output Format → Rules structure

**IMPORTS**: N/A — this is a markdown agent definition

**GOTCHA**: The agent must NOT embed the TASK-BRIEF-TEMPLATE.md content. It references it as a runtime read. This keeps the template as single-source-of-truth — if the template changes, the agent automatically uses the updated version.

**VALIDATE**:
```bash
# Verify file exists and has the expected structure
head -5 .opencode/agents/plan-writer.md
grep "^## " .opencode/agents/plan-writer.md
wc -l .opencode/agents/plan-writer.md
```

---

### Step 2: UPDATE `.opencode/agents/README.md` — Add plan-writer to registry

**What**: Add the plan-writer agent to the agent registry.

**IMPLEMENT**:

Current (lines 1-36 of `.opencode/agents/README.md`):
```markdown
# Custom Subagents

Subagents for parallel research, code review, and specialist tasks.

## Research Agents

| Agent | Purpose |
|-------|---------|
| `research-codebase` | Parallel codebase exploration: finds files, extracts patterns, reports findings |
| `research-external` | Documentation search, best practices, version compatibility checks |

## Code Review Agent

| Agent | What It Covers |
|-------|---------------|
| `code-review` | Comprehensive review: type safety, security, architecture, performance, code quality |

The code review agent covers all dimensions in a single pass. When dispatch is available, multiple instances can run in parallel with different focus areas.

## Usage

Agents are invoked via the Task tool by the main agent, or can be @mentioned directly:
```
@research-codebase find all authentication-related code
@research-external what are the best practices for JWT token refresh?
@code-review review the changes in src/auth/
```

## Creating New Agents

Create new markdown files in `.opencode/agents/` following the existing format:
- Purpose statement
- Capabilities list
- Instructions for invocation
- Output format
- Rules/constraints
```

Replace with:
```markdown
# Custom Subagents

Subagents for parallel research, code review, plan writing, and specialist tasks.

## Research Agents

| Agent | Purpose |
|-------|---------|
| `research-codebase` | Parallel codebase exploration: finds files, extracts patterns, reports findings |
| `research-external` | Documentation search, best practices, version compatibility checks |
| `planning-research` | Knowledge base search and completed plan reference for planning context |

## Code Review Agent

| Agent | What It Covers |
|-------|---------------|
| `code-review` | Comprehensive review: type safety, security, architecture, performance, code quality |

The code review agent covers all dimensions in a single pass. When dispatch is available, multiple instances can run in parallel with different focus areas.

## Plan Writing Agent

| Agent | What It Produces |
|-------|-----------------|
| `plan-writer` | Plan artifacts: `plan.md` (700-1000 lines) and `task-N.md` briefs (700-1000 lines each) |

The plan-writer agent is invoked by `/planning` Phase 5 to offload the heavyweight writing. It receives structured context from Phase 3 (Synthesize, Analyze, Decide, Decompose) and produces one artifact per invocation. It reads `.opencode/templates/TASK-BRIEF-TEMPLATE.md` at runtime for structural reference.

## Usage

Agents are invoked via the Task tool by the main agent, or can be @mentioned directly:
```
@research-codebase find all authentication-related code
@research-external what are the best practices for JWT token refresh?
@planning-research search for patterns related to authentication
@code-review review the changes in src/auth/
@plan-writer write task-3.md for feature auth-system
```

## Creating New Agents

Create new markdown files in `.opencode/agents/` following the existing format:
- Purpose statement
- Capabilities list
- Instructions for invocation
- Output format
- Rules/constraints
```

**PATTERN**: Existing README table sections — each agent type gets a section with a table and optional description paragraph.

**IMPORTS**: N/A

**GOTCHA**: Added `planning-research` to the Research Agents table — it was missing from the registry despite existing as an agent file. This is a cleanup, not part of the plan-writer feature, but it's the right time to fix it since we're editing the file.

**VALIDATE**:
```bash
# Verify all agents are listed
grep "plan-writer\|planning-research\|code-review\|research-codebase\|research-external" .opencode/agents/README.md
```

---

### Step 3: VERIFY Agent Invocation Compatibility

**What**: Verify the plan-writer agent can be invoked via the Task tool with `subagent_type: "plan-writer"`.

**IMPLEMENT**:

No code changes. Verification:

The Task tool invokes agents by `subagent_type` which maps to the agent filename (without `.md`). Agent files in `.opencode/agents/` are automatically available:

- `code-review.md` → `subagent_type: "code-review"`
- `research-codebase.md` → `subagent_type: "research-codebase"`
- `plan-writer.md` → `subagent_type: "plan-writer"`

The invocation from `/planning` Phase 5 (Task 4) will be:

```
Task tool call:
  subagent_type: "plan-writer"
  prompt: "Write plan.md for feature {feature}.
  
  Feature directory: .agents/features/{feature}/
  
  PHASE 3 CONTEXT:
  {structured output from Phase 3}
  
  Write the plan.md file following the agent instructions."
```

The agent reads its own instructions from `.opencode/agents/plan-writer.md`, then follows the Writing Process section.

**PATTERN**: Phase 2 sub-agent invocation — `subagent_type: "explore"` for research agents

**IMPORTS**: N/A

**GOTCHA**: The `subagent_type` value must match the filename exactly (minus `.md`). `plan-writer.md` → `"plan-writer"`. Hyphenated names work — `research-codebase` and `research-external` are precedent.

**VALIDATE**:
```bash
# Verify the agent file name matches the expected subagent_type
ls .opencode/agents/plan-writer.md
```

---

### Step 4: VERIFY Agent Has File Access

**What**: Verify the plan-writer agent has Read and Write tool access to fulfill its purpose.

**IMPLEMENT**:

No code changes. Analysis:

The plan-writer agent needs:
1. **Read** — to read target files for inline content pasting, and to read TASK-BRIEF-TEMPLATE.md
2. **Write** — to write plan.md and task-N.md files to disk
3. **Glob** — to find files referenced in the context

When invoked via Task tool with `subagent_type: "plan-writer"`, the agent runs as a `general` type agent (since `plan-writer` is a custom agent, not a built-in type). The `general` agent type has full tool access: Read, Write, Edit, Glob, Grep, Bash.

This is confirmed by how `code-review` works — it reads files to review them, even though it's a custom agent invoked via Task tool.

**PATTERN**: `code-review.md` — uses Read tool to examine files during review

**IMPORTS**: N/A

**GOTCHA**: The agent must not use Edit tool for creating new files — it should use Write tool. Edit is for modifying existing files. The plan-writer creates new files (plan.md, task-N.md), so Write is the correct tool.

**VALIDATE**:
```bash
# Verify no issues — this is a design verification, not a code check
echo "Plan-writer agent has general agent type with full tool access"
```

---

### Step 5: VERIFY Self-Validation Is Actionable

**What**: Review the self-validation checklist in the agent definition to ensure it's concrete and not aspirational.

**IMPLEMENT**:

No code changes. Review of the Self-Validation section:

1. **Line count** — "Count the lines. If under 700, go back and expand." This is actionable — the agent can use bash `wc -l` or count manually. Verified: actionable.

2. **Inline content** — "Search for 'see lines' or 'read file' or 'refer to'." This is a concrete grep-able check. The agent can use Grep tool. Verified: actionable.

3. **Section completeness** — "Check every required section is present and filled." The required sections are listed in the Artifact Types section. The agent can verify by reading back the file and checking for section headers. Verified: actionable.

4. **Current/Replace accuracy** — "For every Current block, verify the content matches the actual file by re-reading the file." This is the most important check — prevents hallucinated file content. The agent reads the file, then compares with what it pasted. Verified: actionable.

5. **Cross-brief consistency** — "Verify the Prior Task Context section accurately describes what task N-1 does." The agent reads task N-1's brief to verify. Verified: actionable, but only possible when writing briefs sequentially (which is the design — one brief per invocation, called sequentially).

All 5 checks are concrete, tool-supported actions. No aspirational language.

**PATTERN**: N/A — verification step

**IMPORTS**: N/A

**GOTCHA**: Self-validation adds time to each invocation. For a 6-task feature, that's 7 invocations (1 plan + 6 briefs) each with self-validation. This is acceptable — quality over speed for planning artifacts.

**VALIDATE**:
```bash
# Verify self-validation section exists and has 5 numbered checks
grep -c "^[0-9]\." .opencode/agents/plan-writer.md
```

---

## TESTING STRATEGY

### Unit Tests

No unit tests — this task creates a markdown agent definition. Covered by manual testing in Level 5.

### Integration Tests

N/A — integration tested via Task 4 (Phase 5 offload) which invokes the agent.

### Edge Cases

- **Agent invoked without structured context**: Should still work — reads the feature description from the prompt and produces artifacts. Quality may be lower without Phase 3 output, but the agent doesn't crash.
- **Target files don't exist yet**: For CREATE tasks, the agent describes the full file structure instead of Current/Replace blocks. The agent instructions cover this case.
- **Very large feature (10+ tasks)**: Each invocation writes one brief, so 10 invocations. Each is independent. No context overflow.
- **Prior task brief doesn't exist yet**: For task 1, Prior Task Context is "None — first task." For task N > 1, the agent reads the prior brief from disk. If it doesn't exist yet (briefs written out of order), the agent notes "Prior brief not yet written" and proceeds with available context.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
```bash
# Verify file exists and is well-formed markdown
head -5 .opencode/agents/plan-writer.md
wc -l .opencode/agents/plan-writer.md
```

### Level 2: Type Safety
N/A — no type-checked code modified.

### Level 3: Unit Tests
N/A — no unit test framework for agent markdown files.

### Level 4: Integration Tests
N/A — covered by Task 4 integration.

### Level 5: Manual Validation

1. Open `.opencode/agents/plan-writer.md` and verify:
   - Purpose section clearly states what the agent does and does NOT do
   - Required Setup instructs reading TASK-BRIEF-TEMPLATE.md
   - Artifact Types covers both plan.md and task-N.md with required sections
   - Writing Process has step-by-step instructions for both artifact types
   - Quality Criteria includes the 700-line requirement with how-to-reach-it guidance
   - Rejection Criteria lists all rejection conditions
   - Self-Validation has 5 concrete, actionable checks
   - Rules section has hard constraints
   - Output section has completion report format
2. Open `.opencode/agents/README.md` and verify:
   - Plan Writing Agent section exists with table entry for `plan-writer`
   - `planning-research` added to Research Agents table
   - Usage examples include `@plan-writer`
3. Verify the agent definition does NOT embed TASK-BRIEF-TEMPLATE.md content — it references it as a runtime read
4. Verify the agent definition is ~150 lines (lean, not bloated)

---

## ACCEPTANCE CRITERIA

### Implementation (verify during execution)

- [ ] `.opencode/agents/plan-writer.md` created
- [ ] Agent has Purpose section stating what it does and does NOT do
- [ ] Agent has Required Setup section (read template before writing)
- [ ] Agent has Artifact Types section covering plan.md and task-N.md
- [ ] Agent has Writing Process with step-by-step instructions
- [ ] Agent has Quality Criteria with 700-line requirement and how-to-reach-it
- [ ] Agent has Rejection Criteria matching planning.md Phase 5 criteria
- [ ] Agent has Self-Validation with 5 actionable checks
- [ ] Agent has Output section with completion report format
- [ ] Agent has Rules section with hard constraints
- [ ] Agent does NOT embed TASK-BRIEF-TEMPLATE.md (references as runtime read)
- [ ] README.md updated with Plan Writing Agent section
- [ ] README.md includes `planning-research` in Research Agents table (cleanup)

### Runtime (verify after testing)

- [ ] Agent can be invoked via Task tool with `subagent_type: "plan-writer"`
- [ ] Agent reads TASK-BRIEF-TEMPLATE.md at runtime
- [ ] Agent writes files to correct paths
- [ ] Agent self-validates and reports status

---

## HANDOFF NOTES

### Files Created/Modified

- `.opencode/agents/plan-writer.md` — New dedicated agent for plan artifact writing (~150 lines)
- `.opencode/agents/README.md` — Updated with plan-writer entry and planning-research cleanup

### Patterns Established

- **Dedicated writing agent**: The plan-writer is the write-side counterpart to research agents (read-side). This pattern can be extended — e.g., a `code-writer` agent for `/execute` in the future.
- **Runtime template reading**: Agent definitions reference templates as runtime reads, not embedded content. This keeps templates single-source-of-truth.
- **Self-validation in agents**: Agents that produce artifacts include a self-validation checklist. This is a new pattern not present in existing agents (code-review doesn't self-validate because it produces findings, not files).

### State to Carry Forward

- The plan-writer agent exists and is ready for invocation
- Task 4 modifies planning.md Phase 5 to use this agent via Task tool calls

### Known Issues or Deferred Items

- The agent's effectiveness depends on model quality — weaker models may produce shallow artifacts even with comprehensive instructions. The self-validation checklist mitigates this but can't guarantee depth.
- Future improvement: add a validation step where the calling agent reads back the written file and checks line count, rejecting and re-invoking if under 700 lines.

---

## COMPLETION CHECKLIST

- [ ] All steps completed in order
- [ ] Each step's VALIDATE command executed and passed
- [ ] All validation levels run (or explicitly N/A with reason)
- [ ] Manual testing confirms expected behavior
- [ ] Implementation acceptance criteria all checked
- [ ] No regressions in adjacent files
- [ ] Handoff notes written
- [ ] Brief marked done: rename `task-3.md` → `task-3.done.md`

---

## NOTES

### Key Design Decisions (This Task)

- **Agent is ~150 lines, not 600+**: The agent knows the structure and rules but doesn't embed the full template. This keeps it maintainable and the template as single-source-of-truth.
- **One artifact per invocation**: Each invocation writes one file. This keeps each session focused, prevents context overflow, and allows the calling agent to verify each artifact before proceeding to the next.
- **Self-validation is mandatory, not optional**: The agent must check its own output before reporting complete. This catches the most common failure mode (under 700 lines, missing inline content) at the source rather than requiring the calling agent to detect and re-invoke.
- **No plan approval in the agent**: The plan-writer writes what it's told to write. Plan approval happens in Phase 4 before the plan-writer is ever invoked. The agent doesn't second-guess the approach.

### Implementation Notes

- The agent filename `plan-writer.md` maps to `subagent_type: "plan-writer"` for Task tool invocation
- The agent uses Write tool (not Edit) for creating new files — Edit is for modifying existing files
- Cross-brief consistency checking works because briefs are written sequentially (one per invocation, called in order). If the calling agent invokes briefs in parallel (future optimization), cross-brief checking would need to be removed or adapted.
