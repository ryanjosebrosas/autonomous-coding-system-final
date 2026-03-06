# Task 3: Verify Model Switching

## Objective

Verify that command model switching works correctly after the format fix.

## Test Procedure

### Test 1: Check `/prime` Model

1. Start a new OpenCode session
2. Run `/prime`
3. Observe which model executes the command

**Expected:** Command runs on `ollama/glm-4.7:cloud`, not the session's primary model (Opus)

**How to verify:**
- OpenCode TUI shows the active model in the status bar
- The response style/latency should differ from Opus
- Check OpenCode logs if available

### Test 2: Check Model Field Parsing

Run this command to verify all model fields are correctly formatted:

```bash
# List all model fields in commands
grep "^model:" .opencode/commands/*.md
```

**Expected output:**
```
.opencode/commands/code-loop.md:model: ollama/deepseek-v3.1:671b-cloud
.opencode/commands/code-review-fix.md:model: ollama/deepseek-v3.1:671b-cloud
.opencode/commands/code-review.md:model: ollama/deepseek-v3.1:671b-cloud
.opencode/commands/commit.md:model: ollama/glm-4.7:cloud
.opencode/commands/council.md:model: openai/gpt-5.3-codex
.opencode/commands/decompose.md:model: openai/gpt-5.3-codex
.opencode/commands/final-review.md:model: ollama/deepseek-v3.1:671b-cloud
.opencode/commands/mvp.md:model: openai/gpt-5.3-codex
.opencode/commands/pillars.md:model: openai/gpt-5.3-codex
.opencode/commands/planning.md:model: openai/gpt-5.3-codex
.opencode/commands/pr.md:model: ollama/deepseek-v3.1:671b-cloud
.opencode/commands/prd.md:model: openai/gpt-5.3-codex
.opencode/commands/prime.md:model: ollama/glm-4.7:cloud
.opencode/commands/system-review.md:model: ollama/deepseek-v3.1:671b-cloud
```

### Test 3: Verify execute.md Has No Model

```bash
grep "^model:" .opencode/commands/execute.md
```

**Expected:** No output (execute.md should not have a model field)

### Test 4: Verify Deleted Directories

```bash
ls -la .claude/ .codex/ 2>&1
```

**Expected:** Both commands return "No such file or directory"

## Success Criteria

- [ ] All 14 command files have `provider/model` format
- [ ] `execute.md` has no model field
- [ ] `/prime` executes on `ollama/glm-4.7:cloud`
- [ ] `.claude/` and `.codex/` directories do not exist

## Troubleshooting

If model switching still doesn't work:

1. **Check OpenCode version:** `opencode --version` (should be 1.2.19+)
2. **Check model availability:** The model must be configured in OpenCode's provider settings
3. **Check provider name:** `ollama` must be a valid provider in OpenCode config
4. **Restart OpenCode:** Model changes may require session restart

## MUST DO

- Run all verification commands
- Confirm `/prime` runs on the specified model
- Document any failures with exact error messages

## MUST NOT DO

- Do NOT assume success without verification
- Do NOT skip the live `/prime` test
- Do NOT modify any files during verification (read-only task)
