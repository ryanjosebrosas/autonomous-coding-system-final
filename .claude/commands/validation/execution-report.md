---
description: Generate implementation report for system review
---

# Validation: Execution Report

Review and deeply analyze the implementation you just completed. Generates a structured report that feeds into `/system-review` and `/validation/system-review`.

## Usage

```
/validation/execution-report [feature-name]
```

`$ARGUMENTS` — Optional: feature name to use for the report filename. Auto-derived from recent changes if not provided.

## Context

You have just finished implementing a feature. Before moving on, reflect on:

- What you implemented
- How it aligns with the plan
- What challenges you encountered
- What diverged and why

## Step 1: Gather Context

```bash
git status
git diff --stat HEAD
git log -5 --oneline
```

Read the plan file that guided implementation (check `.agents/plans/` for recent plans).
Read `memory.md` for relevant context.

## Step 2: Generate Report

Save to: `.agents/reports/{feature-name}-report.md`

### Report Structure

#### Meta Information

- **Plan file**: {path to plan that guided this implementation}
- **Files added**: {list with full paths}
- **Files modified**: {list with full paths}
- **Lines changed**: +{X} -{Y}
- **Date**: {current date}

#### Validation Results

Run the project-configured validation pyramid and report:

- **Syntax & Linting**: PASS/FAIL {details if failed}
- **Type Checking**: PASS/FAIL {details if failed}
- **Unit Tests**: PASS/FAIL {X passed, Y failed}
- **Integration Tests**: PASS/FAIL {X passed, Y failed}

#### What Went Well

List specific things that worked smoothly:

- {concrete example — e.g., "Plan's code samples for the auth module were copy-pasteable"}
- {concrete example — e.g., "Pattern reference at src/services/user.ts:45 was exactly right"}

#### Challenges Encountered

List specific difficulties:

- {what was difficult and why — e.g., "Type inference failed for generic return types, had to add explicit annotations"}
- {what was difficult and why}

#### Divergences from Plan

For each divergence, document:

**{Divergence Title}**

- **Planned**: {what the plan specified}
- **Actual**: {what was implemented instead}
- **Reason**: {why this divergence occurred}
- **Type**: {Better approach found | Plan assumption wrong | Security concern | Performance issue | Missing context | Other}
- **Impact**: {Low — cosmetic | Medium — different approach, same result | High — architectural change}

If no divergences: "None — implementation matched plan exactly."

#### Skipped Items

List anything from the plan that was not implemented:

- {what was skipped} — Reason: {why it was skipped}

If nothing skipped: "All planned items were implemented."

#### Recommendations

Based on this implementation, what should change for next time?

- **Plan command improvements**: {suggestions for better plans — e.g., "Include more context about the auth middleware chain"}
- **Execute command improvements**: {suggestions for better execution — e.g., "Add step to verify DB migrations before running tests"}
- **Memory.md additions**: {gotchas or decisions to remember — e.g., "The ORM requires explicit flush() before read-after-write"}
- **Config updates**: {any validation commands or paths that need updating}

## Step 3: Offer Next Steps

After saving the report:

```
Execution report saved: .agents/reports/{feature-name}-report.md

Next steps:
- /validation/system-review — meta-analysis of plan vs. implementation
- /code-review or /validation/code-review — review the code changes
- /commit — if validation passes, commit the changes
```

## Notes

- This command is reflective, not corrective — it documents what happened, it doesn't fix things
- The report is consumed by `/system-review` and `/validation/system-review` for process improvement
- Be honest about divergences — they're learning opportunities, not failures
- Keep entries specific and concrete, not generic
