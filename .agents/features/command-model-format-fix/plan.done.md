# Feature: Command Model Format Fix

## Problem Statement

When running `/prime`, the command executes on the current session's model (Claude Opus) instead of switching to the model specified in the command's frontmatter (`model: glm-4.7:cloud`). 

**Root Cause Analysis:**
1. OpenCode v1.2.19 **does support** the `model:` frontmatter field for model switching (confirmed via librarian research of PR #2448)
2. However, OpenCode expects the model format to include a provider prefix: `provider/model` (e.g., `ollama/glm-4.7:cloud`)
3. Current command files use bare model names without provider prefix (e.g., `model: glm-4.7:cloud`)
4. The `categories.json` file shows the correct pattern: `"model": "glm-4.7:cloud"` + `"provider": "ollama"` as separate fields
5. Command frontmatter only has a single `model:` field, so it needs the combined format

**Additional Cleanup:**
- `.claude/` directory is redundant (duplicates `.opencode/commands/`)
- `.codex/` directory is redundant (duplicates `.opencode/skills/` and `.opencode/agents/`)

## Solution

1. Update all command frontmatter `model:` fields to use `provider/model` format
2. Delete `.claude/` and `.codex/` directories

## Model Mapping

Based on `categories.json`, here are the provider mappings:

| Current Format | Provider | Correct Format |
|---------------|----------|----------------|
| `glm-4.7:cloud` | ollama | `ollama/glm-4.7:cloud` |
| `deepseek-v3.1:671b-cloud` | ollama | `ollama/deepseek-v3.1:671b-cloud` |
| `gpt-5.3-codex` | openai | `openai/gpt-5.3-codex` |
| `kimi-k2.5:cloud` | ollama | `ollama/kimi-k2.5:cloud` |

## Commands to Update

| Command File | Current Model | New Model |
|-------------|--------------|-----------|
| `prime.md` | `glm-4.7:cloud` | `ollama/glm-4.7:cloud` |
| `commit.md` | `glm-4.7:cloud` | `ollama/glm-4.7:cloud` |
| `code-loop.md` | `deepseek-v3.1:671b-cloud` | `ollama/deepseek-v3.1:671b-cloud` |
| `code-review.md` | `deepseek-v3.1:671b-cloud` | `ollama/deepseek-v3.1:671b-cloud` |
| `code-review-fix.md` | `deepseek-v3.1:671b-cloud` | `ollama/deepseek-v3.1:671b-cloud` |
| `final-review.md` | `deepseek-v3.1:671b-cloud` | `ollama/deepseek-v3.1:671b-cloud` |
| `pr.md` | `deepseek-v3.1:671b-cloud` | `ollama/deepseek-v3.1:671b-cloud` |
| `system-review.md` | `deepseek-v3.1:671b-cloud` | `ollama/deepseek-v3.1:671b-cloud` |
| `planning.md` | `gpt-5.3-codex` | `openai/gpt-5.3-codex` |
| `council.md` | `gpt-5.3-codex` | `openai/gpt-5.3-codex` |
| `decompose.md` | `gpt-5.3-codex` | `openai/gpt-5.3-codex` |
| `mvp.md` | `gpt-5.3-codex` | `openai/gpt-5.3-codex` |
| `pillars.md` | `gpt-5.3-codex` | `openai/gpt-5.3-codex` |
| `prd.md` | `gpt-5.3-codex` | `openai/gpt-5.3-codex` |
| `execute.md` | (none) | (unchanged - intentional) |

## Task Briefs

### Task 1: Update Command Model Formats
- File: `.agents/features/command-model-format-fix/task-1.md`
- Scope: Update all 14 command files with provider prefix

### Task 2: Delete Redundant Directories
- File: `.agents/features/command-model-format-fix/task-2.md`
- Scope: Remove `.claude/` and `.codex/` directories

### Task 3: Verify Model Switching
- File: `.agents/features/command-model-format-fix/task-3.md`
- Scope: Test that `/prime` runs on the correct model

## Acceptance Criteria

- [ ] All 14 command files have `model:` field with `provider/model` format
- [ ] `/prime` runs on `ollama/glm-4.7:cloud` instead of current session model
- [ ] `.claude/` directory deleted
- [ ] `.codex/` directory deleted
- [ ] No broken references to deleted directories
