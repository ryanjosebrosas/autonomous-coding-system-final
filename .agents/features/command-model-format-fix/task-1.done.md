# Task 1: Update Command Model Formats

## Objective

Update all `.opencode/commands/*.md` files to use the correct `provider/model` format in their frontmatter `model:` field.

## Files to Modify

### Group 1: GLM-4.7 Commands (Haiku tier)

**File: `.opencode/commands/prime.md`**
```yaml
# CURRENT (line 3):
model: glm-4.7:cloud

# CHANGE TO:
model: ollama/glm-4.7:cloud
```

**File: `.opencode/commands/commit.md`**
```yaml
# CURRENT:
model: glm-4.7:cloud

# CHANGE TO:
model: ollama/glm-4.7:cloud
```

### Group 2: DeepSeek Commands (Sonnet tier)

**File: `.opencode/commands/code-loop.md`**
```yaml
# CURRENT:
model: deepseek-v3.1:671b-cloud

# CHANGE TO:
model: ollama/deepseek-v3.1:671b-cloud
```

**File: `.opencode/commands/code-review.md`**
```yaml
# CURRENT:
model: deepseek-v3.1:671b-cloud

# CHANGE TO:
model: ollama/deepseek-v3.1:671b-cloud
```

**File: `.opencode/commands/code-review-fix.md`**
```yaml
# CURRENT:
model: deepseek-v3.1:671b-cloud

# CHANGE TO:
model: ollama/deepseek-v3.1:671b-cloud
```

**File: `.opencode/commands/final-review.md`**
```yaml
# CURRENT:
model: deepseek-v3.1:671b-cloud

# CHANGE TO:
model: ollama/deepseek-v3.1:671b-cloud
```

**File: `.opencode/commands/pr.md`**
```yaml
# CURRENT:
model: deepseek-v3.1:671b-cloud

# CHANGE TO:
model: ollama/deepseek-v3.1:671b-cloud
```

**File: `.opencode/commands/system-review.md`**
```yaml
# CURRENT:
model: deepseek-v3.1:671b-cloud

# CHANGE TO:
model: ollama/deepseek-v3.1:671b-cloud
```

### Group 3: GPT-5.3 Commands (Opus tier)

**File: `.opencode/commands/planning.md`**
```yaml
# CURRENT:
model: gpt-5.3-codex

# CHANGE TO:
model: openai/gpt-5.3-codex
```

**File: `.opencode/commands/council.md`**
```yaml
# CURRENT:
model: gpt-5.3-codex

# CHANGE TO:
model: openai/gpt-5.3-codex
```

**File: `.opencode/commands/decompose.md`**
```yaml
# CURRENT:
model: gpt-5.3-codex

# CHANGE TO:
model: openai/gpt-5.3-codex
```

**File: `.opencode/commands/mvp.md`**
```yaml
# CURRENT:
model: gpt-5.3-codex

# CHANGE TO:
model: openai/gpt-5.3-codex
```

**File: `.opencode/commands/pillars.md`**
```yaml
# CURRENT:
model: gpt-5.3-codex

# CHANGE TO:
model: openai/gpt-5.3-codex
```

**File: `.opencode/commands/prd.md`**
```yaml
# CURRENT:
model: gpt-5.3-codex

# CHANGE TO:
model: openai/gpt-5.3-codex
```

## Files NOT to Modify

**File: `.opencode/commands/execute.md`**
- Has NO `model:` field (intentional - runs on current session model)
- DO NOT add a model field

## Implementation Steps

1. For each file listed above, open the file
2. Find the frontmatter block (between `---` markers at top of file)
3. Locate the `model:` line
4. Add the provider prefix as specified
5. Save the file

## Verification

After all edits:
```bash
# Check all model fields have provider prefix
grep -r "^model:" .opencode/commands/ | grep -v "ollama/" | grep -v "openai/"
```

Expected output: empty (no matches means all models have provider prefix)

## MUST DO

- Add `ollama/` prefix to all `glm-4.7:cloud` and `deepseek-v3.1:671b-cloud` models
- Add `openai/` prefix to all `gpt-5.3-codex` models
- Keep the rest of the frontmatter unchanged
- Do NOT modify anything outside the frontmatter block

## MUST NOT DO

- Do NOT modify `execute.md` (it intentionally has no model field)
- Do NOT change any other frontmatter fields (description, etc.)
- Do NOT modify the command body content
- Do NOT add provider field separately (only modify the model line)
