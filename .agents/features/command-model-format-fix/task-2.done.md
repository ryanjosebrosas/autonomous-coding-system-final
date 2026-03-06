# Task 2: Delete Redundant Directories

## Objective

Remove `.claude/` and `.codex/` directories as they are redundant mirrors of `.opencode/` content.

## Context

These directories were created during framework development but are now redundant:
- `.claude/commands/` duplicates `.opencode/commands/`
- `.claude/skills/` duplicates `.opencode/skills/`
- `.codex/agents/` duplicates `.opencode/agents/`
- `.codex/skills/` duplicates `.opencode/skills/`

OpenCode reads from `.opencode/` as the source of truth.

## Directories to Delete

### Directory 1: `.claude/`

Current contents:
```
.claude/
├── agents/
├── commands/
├── config.md
├── reference/
├── sections/
├── settings.local.json
├── skills/
└── templates/
```

### Directory 2: `.codex/`

Current contents:
```
.codex/
├── agents/
└── skills/
```

## Implementation Steps

1. Delete `.claude/` directory recursively:
   ```bash
   rm -rf .claude/
   ```

2. Delete `.codex/` directory recursively:
   ```bash
   rm -rf .codex/
   ```

3. Verify deletion:
   ```bash
   ls -la .claude/ .codex/ 2>&1
   # Expected: "No such file or directory" for both
   ```

## Pre-Deletion Verification

Before deleting, confirm no unique content exists in these directories that isn't in `.opencode/`:

```bash
# Check if .claude/commands/ has any files not in .opencode/commands/
diff <(ls .claude/commands/ 2>/dev/null | sort) <(ls .opencode/commands/ | sort)

# Check if .codex/ has any unique content
ls -la .codex/
```

## MUST DO

- Delete entire `.claude/` directory tree
- Delete entire `.codex/` directory tree
- Verify both directories are gone after deletion

## MUST NOT DO

- Do NOT delete `.opencode/` (this is the source of truth)
- Do NOT backup to a different location (git history preserves if needed)
- Do NOT modify any files before deletion (just delete)
