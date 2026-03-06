# Task 7: Update config.md with Validation Commands

## Task Metadata

- **ACTION**: UPDATE
- **TARGET**: `.claude/config.md`
- **FEATURE**: type-safety-fixes
- **ESTIMATED TIME**: 5 minutes

## Problem

`.claude/config.md` has placeholder validation commands. Need to update with actual commands that work.

## Solution

Replace all validation command placeholders with real commands.

## Implementation Steps

### Step 1: Update validation commands section

In `.claude/config.md`, find the `## Validation Commands` section and replace:

```markdown
## Validation Commands

These commands are used by `/planning`, `/final-review`, `/code-loop`, and other pipeline commands.

- **L1 Lint**: npx eslint .opencode/
- **L1 Format**: npx prettier --check .opencode/
- **L2 Types**: npx tsc --noEmit
- **L3 Unit Tests**: npx vitest run
- **L4 Integration Tests**: npx vitest run .opencode/tests/integration/
- **L5 Manual**: Code review via /code-loop
```

### Step 2: Update Source Directories if needed

Verify the source directories are correct:

```markdown
## Source Directories
- **Source**: .opencode/
- **Tests**: .opencode/**/*.test.ts
- **Config**: .opencode/config/, .claude/config/
```

### Step 3: Update RAG section (no change needed)

The RAG section shows "not detected" which is correct:

```markdown
## RAG Integration (Optional)

- **RAG Available**: no (Archon MCP not detected)
- **RAG Tool Prefix**: N/A
- **Indexed Sources**: N/A
```

### Step 4: Verify Notes section

Ensure notes accurately describe the project:

```markdown
## Notes

- This is an OpenCode AI coding system framework (meta-framework for AI-assisted development)
- Framework files are in .opencode/, mirrored to .claude/ for Claude Code compatibility
- Tests support both `bun test` and `npx vitest run`
- L1-L4 validation is performed by npm scripts
- L5 is manual human verification via /final-review
- Project uses the PIV Loop methodology: Plan → Implement → Validate
```

## Files to Modify

1. `.claude/config.md` — Update validation commands with real commands

## Pattern to Follow

```markdown
## Validation Commands

- **L1 Lint**: <command> — <description>
- **L1 Format**: <command> — <description>
- **L2 Types**: <command> — <description>
- **L3 Unit Tests**: <command> — <description>
- **L4 Integration Tests**: <command> — <description>
- **L5 Manual**: <description>
```

## Gotchas

- Commands must work from `.opencode/` directory
- Use `npx` to ensure tools are available
- Integration tests path must be correct
- Don't set L1/L2 if no config exists - but we're adding them in this feature

## Validation

```bash
# Verify each command works:
cd .opencode
npx eslint . --max-warnings 100  # Allow warnings for now
npx prettier --check .
npx tsc --noEmit
npx vitest run --passWithNoTests
```

Should show: All commands execute without errors

## Success Criteria

- `.claude/config.md` has all L1-L5 validation commands filled
- Each command is correct and executable
- Notes section accurately describes the project
- File formatting matches existing style