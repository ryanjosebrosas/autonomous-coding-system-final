# Task 1: Foundation — Replace Symlink with Real Directory

## OBJECTIVE

Remove the `.claude/commands` symlink and create a real directory so Claude-optimized command files can diverge from `.opencode/commands/`.

## SCOPE

- **Files touched**: `.claude/commands/` (symlink → real directory)
- **Out of scope**: `.opencode/commands/`, any command file content (that's Tasks 2-6)
- **Dependencies**: None — this is the first task

## PRIOR TASK CONTEXT

None — first task.

## CONTEXT REFERENCES

### Current State: Symlink

The `.claude/commands` path is currently a symbolic link:

```
.claude/commands → .opencode/commands
```

This means any file created in `.claude/commands/` would actually be created in `.opencode/commands/`. We need to break this link to create a separate directory.

### Directory Structure (current)

```
.claude/
  agents/          ← real directory
  commands         ← SYMLINK → .opencode/commands
  reference/       ← real directory
  sections/        ← real directory
  skills/          ← real directory
  templates/       ← real directory
  config.md        ← real file
  settings.local.json ← real file
```

### Pipeline Code Reference

The pipeline discovery code in `.opencode/pipeline/commands.ts` checks both directories:

```typescript
const OPENCODE_COMMANDS_DIR = ".opencode/commands"
const CLAUDE_COMMANDS_DIR = ".claude/commands"

// Try .opencode/commands first, then .claude/commands
const opencodePath = join(workspaceDir, OPENCODE_COMMANDS_DIR, `${name}.md`)
const claudePath = join(workspaceDir, CLAUDE_COMMANDS_DIR, `${name}.md`)

const methodPath = existsSync(opencodePath) ? opencodePath
                : existsSync(claudePath) ? claudePath
                : null
```

This code checks `.opencode/commands/` FIRST. Since those files still exist, the pipeline code will continue to find them. The `.claude/commands/` files are picked up by Claude Code's native command discovery, which reads from `.claude/commands/` directly.

### Claude Code Command Discovery

Claude Code discovers slash commands from `.claude/commands/` natively. When a user types `/command-name`, Claude Code looks for `.claude/commands/command-name.md` and expands its content as the command prompt.

## PATTERNS TO FOLLOW

### Pattern: Safe Symlink Removal

```bash
# 1. Verify it IS a symlink (don't delete a real directory)
test -L .claude/commands && echo "Is symlink" || echo "NOT symlink — ABORT"

# 2. Read the symlink target for reference
readlink .claude/commands

# 3. Remove the symlink only (not the target)
rm .claude/commands

# 4. Create real directory
mkdir -p .claude/commands

# 5. Verify
test -d .claude/commands && ! test -L .claude/commands && echo "Real dir created" || echo "FAILED"
```

Key safety rules:
- NEVER use `rm -rf` on the symlink — `rm` alone removes a symlink without following it
- Verify it's a symlink BEFORE removing
- Verify the result is a real directory AFTER creating

### Pattern: Verify No Breakage

```bash
# Verify .opencode/commands/ still has all files
ls .opencode/commands/*.md | wc -l
# Should show 14+ files (unchanged)

# Verify .claude/commands/ is now empty real dir
ls -la .claude/commands/
# Should show empty directory
```

## STEP-BY-STEP TASKS

### Step 1: Verify Current State

- **IMPLEMENT**: Run verification commands to confirm the symlink exists and points to .opencode/commands

```bash
# Check if .claude/commands is a symlink
test -L .claude/commands && echo "SYMLINK CONFIRMED" || echo "NOT A SYMLINK — different approach needed"

# Read the target
readlink .claude/commands
# Expected output: .opencode/commands or ../opencode/commands or similar

# Verify target directory exists and has files
ls .opencode/commands/*.md | head -5
```

- **GOTCHA**: On Windows with Git Bash, symlinks may behave differently. Use `test -L` which works in Git Bash. If it's not a symlink (possibly a junction or directory copy on Windows), the removal command changes.
- **VALIDATE**: Output shows "SYMLINK CONFIRMED" and lists .opencode/commands/*.md files

### Step 2: Remove Symlink

- **IMPLEMENT**: Remove the symlink without affecting the target directory

```bash
# Remove symlink (NOT rm -rf — just rm)
rm .claude/commands

# Verify removal
test -e .claude/commands && echo "STILL EXISTS — removal failed" || echo "REMOVED SUCCESSFULLY"
```

- **GOTCHA**: If `.claude/commands` is a Windows junction instead of a Unix symlink, use `rmdir` instead of `rm`. Try `rm` first; if it fails, try:
  ```bash
  # Windows junction fallback
  cmd //c "rmdir .claude\\commands"
  ```
- **VALIDATE**: `test -e .claude/commands` returns false (path doesn't exist)

### Step 3: Create Real Directory

- **IMPLEMENT**: Create the real directory

```bash
# Create directory
mkdir -p .claude/commands

# Verify it's a real directory, not a symlink
test -d .claude/commands && ! test -L .claude/commands && echo "REAL DIR CREATED" || echo "FAILED"

# Show directory listing
ls -la .claude/
```

- **VALIDATE**: Output shows "REAL DIR CREATED" and `.claude/` listing shows `commands/` as a directory (not a symlink)

### Step 4: Verify No Breakage

- **IMPLEMENT**: Confirm `.opencode/commands/` is untouched

```bash
# Count files in .opencode/commands/ (should be unchanged)
ls .opencode/commands/*.md 2>/dev/null | wc -l
# Expected: 14+ files

# List them to confirm
ls .opencode/commands/*.md

# Verify a specific command loads
head -5 .opencode/commands/prime.md
# Should show YAML frontmatter
```

- **GOTCHA**: If the symlink removal somehow affected `.opencode/commands/`, STOP and report. This should never happen (symlink removal doesn't affect target), but verify anyway.
- **VALIDATE**: All .opencode/commands/*.md files still exist with correct content

### Step 5: Verify Claude Code Discovery Path

- **IMPLEMENT**: Confirm Claude Code will look in `.claude/commands/` for command files

```bash
# The directory exists and is ready for command files
echo "Directory ready for Claude-optimized commands"
ls -la .claude/commands/
# Should show empty directory (files will be created in Tasks 2-6)
```

- **VALIDATE**: `.claude/commands/` exists as an empty real directory

## TESTING STRATEGY

### Unit Verification
- Symlink is removed (not a symlink anymore)
- Real directory exists at `.claude/commands/`
- `.opencode/commands/` is completely untouched (all files present)

### Integration Verification
- Claude Code can still discover commands (will fall back to `.opencode/commands/` until `.claude/commands/` files are created in later tasks)

### Edge Cases
- Windows junction vs Unix symlink: handle both removal approaches
- Permission issues: `mkdir -p` should handle this
- Symlink already removed (idempotent): `mkdir -p` handles existing directory

## VALIDATION COMMANDS

```bash
# L1: Symlink removed
! test -L .claude/commands && echo "L1 PASS: Not a symlink" || echo "L1 FAIL: Still a symlink"

# L2: Real directory exists
test -d .claude/commands && echo "L2 PASS: Directory exists" || echo "L2 FAIL: No directory"

# L3: .opencode/commands/ untouched
test -f .opencode/commands/prime.md && echo "L3 PASS: Source intact" || echo "L3 FAIL: Source missing"

# L4: File count in .opencode/commands/
COUNT=$(ls .opencode/commands/*.md 2>/dev/null | wc -l)
echo "L4: $COUNT command files in .opencode/commands/ (should be 14+)"

# L5: Manual — verify Claude Code still works
echo "L5: Run /prime in Claude Code to verify command discovery"
```

## ACCEPTANCE CRITERIA

### Implementation
- [ ] `.claude/commands` is no longer a symlink
- [ ] `.claude/commands/` exists as a real directory
- [ ] `.opencode/commands/` has all original files untouched
- [ ] No files were lost or corrupted during symlink removal

### Runtime
- [ ] Claude Code can still discover commands (falls back to .opencode/commands/ for now)
- [ ] `ls -la .claude/` shows `commands/` as `drwxr-xr-x` (directory, not link)

## HANDOFF NOTES

Task 2 can now create files in `.claude/commands/` — the directory is ready. All subsequent tasks (2-6) create command files in this directory. Tasks 2-6 are independent of each other and can execute in any order.

## COMPLETION CHECKLIST

- [ ] Verified symlink exists before removal
- [ ] Removed symlink safely (not rm -rf)
- [ ] Created real directory
- [ ] Verified .opencode/commands/ untouched
- [ ] All validation commands pass
