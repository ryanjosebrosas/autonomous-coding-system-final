---
description: Analyze implementation against plan for process improvements
---

# Validation: System Review

Perform a meta-level analysis of how well the implementation followed the plan and identify process improvements.

## Purpose

**System review is NOT code review.** You're not looking for bugs in the code — you're looking for bugs in the process.

**Your job:**

- Analyze plan adherence and divergence patterns
- Identify which divergences were justified vs. problematic
- Surface process improvements that prevent future issues
- Suggest updates to project assets (memory.md, commands, config)

**Philosophy:**

- Good divergence reveals plan limitations → improve planning
- Bad divergence reveals unclear requirements → improve communication
- Repeated issues reveal missing automation → create commands

## Usage

```
/validation/system-review <plan-file> <execution-report>
```

- `$1` — Path to the plan file (e.g., `.agents/plans/auth-plan.md`)
- `$2` — Path to the execution report (e.g., `.agents/reports/auth-report.md`)

## Context & Inputs

You will analyze four key artifacts:

1. **Planning command**: Read `.opencode/commands/planning.md` to understand the planning process
2. **Generated plan**: Read `$1` to understand what the agent was SUPPOSED to do
3. **Execute command**: Read `.opencode/commands/execute.md` to understand the execution process
4. **Execution report**: Read `$2` to understand what the agent ACTUALLY did and why

## Analysis Workflow

### Step 1: Understand the Planned Approach

Read the generated plan ($1) and extract:

- What features were planned?
- What architecture was specified?
- What validation steps were defined?
- What patterns were referenced?

### Step 2: Understand the Actual Implementation

Read the execution report ($2) and extract:

- What was implemented?
- What diverged from the plan?
- What challenges were encountered?
- What was skipped and why?

### Step 3: Classify Each Divergence

For each divergence identified in the execution report, classify as:

**Good Divergence (Justified):**

- Plan assumed something that didn't exist in the codebase
- Better pattern discovered during implementation
- Performance optimization needed
- Security issue discovered that required different approach

**Bad Divergence (Problematic):**

- Ignored explicit constraints in plan
- Created new architecture instead of following existing patterns
- Took shortcuts that introduce tech debt
- Misunderstood requirements

### Step 4: Trace Root Causes

For each problematic divergence, identify the root cause:

- Was the plan unclear? Where, why?
- Was context missing? Where, why?
- Was validation missing? Where, why?
- Was a manual step repeated? Where, why?

### Step 5: Generate Process Improvements

Based on patterns across divergences, suggest:

- **memory.md updates**: Gotchas, patterns, or decisions to remember
- **Plan command updates**: Instructions that need clarification or missing steps
- **Execute command updates**: Validation steps to add to execution checklist
- **Config updates**: Validation commands or paths that need changing
- **New commands**: Manual processes that should be automated

## Output Format

Save your analysis to: `.agents/reports/system-reviews/{feature-name}-review.md`

### Report Structure

#### Meta Information

- **Plan reviewed**: {path to $1}
- **Execution report**: {path to $2}
- **Date**: {current date}

#### Overall Alignment Score: __/10

Scoring guide:
- 10: Perfect adherence, all divergences justified
- 7-9: Minor justified divergences
- 4-6: Mix of justified and problematic divergences
- 1-3: Major problematic divergences

#### Divergence Analysis

For each divergence from the execution report:

```yaml
divergence: [what changed]
planned: [what plan specified]
actual: [what was implemented]
reason: [agent's stated reason from report]
classification: good | bad
justified: yes/no
root_cause: [unclear plan | missing context | missing validation | repeated manual step | other]
fix_target: [which asset to update — memory.md | planning.md | execute.md | config.md | new command]
```

#### Pattern Compliance

Assess adherence to documented patterns:

- [ ] Followed codebase architecture
- [ ] Used documented patterns (from memory.md / project conventions)
- [ ] Applied testing patterns correctly
- [ ] Met validation requirements
- [ ] Stayed within planned scope (no scope creep)

#### System Improvement Actions

Based on analysis, recommend specific actions:

**Update memory.md:**
- [ ] Document {pattern X} discovered during implementation
- [ ] Add gotcha for {Y}
- [ ] Record decision about {Z}

**Update Plan Command (.opencode/commands/planning.md):**
- [ ] Add instruction for {missing step}
- [ ] Clarify {ambiguous instruction}
- [ ] Add validation requirement for {X}

**Update Execute Command (.opencode/commands/execute.md):**
- [ ] Add {validation step} to execution checklist

**Update Config (.opencode/config.md):**
- [ ] Update {validation command}
- [ ] Add {missing path}

**Create New Command:**
- [ ] `/command-name` for {manual process repeated 3+ times}

#### Key Learnings

**What worked well:**
- {specific things that went smoothly}

**What needs improvement:**
- {specific process gaps identified}

**For next implementation:**
- {concrete improvements to try}

## Important

- **Be specific:** Don't say "plan was unclear" — say "plan didn't specify which auth pattern to use for JWT refresh"
- **Focus on patterns:** One-off issues aren't actionable. Look for repeated problems.
- **Action-oriented:** Every finding should have a concrete asset update suggestion
- **Suggest improvements:** Don't just analyze — actually suggest the text to add to memory.md or commands
