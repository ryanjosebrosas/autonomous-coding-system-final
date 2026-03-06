# Project Configuration
<!-- Auto-detected by /prime on 2026-03-06. Override any value manually. -->
<!-- Run /prime to re-detect and update auto-detected values. -->
<!-- Manual overrides in this file take priority over auto-detection. -->

## Stack
- **Language**: TypeScript
- **Framework**: OpenCode AI Plugin Framework
- **Package Manager**: npm (detected in .opencode/)

## Validation Commands

These commands are used by `/planning`, `/final-review`, `/code-loop`, and other pipeline commands.

- **L1 Lint**: npx eslint .opencode/
- **L1 Format**: npx prettier --check .opencode/
- **L2 Types**: npx tsc --noEmit
- **L3 Unit Tests**: npx vitest run
- **L4 Integration Tests**: npx vitest run .opencode/tests/integration/
- **L5 Manual**: Code review via /code-loop

## Source Directories
- **Source**: .opencode/
- **Tests**: .opencode/**/*.test.ts (pattern, not verified)
- **Config**: .opencode/config/, .claude/config/

## Git
- **Remote**: origin (https://github.com/ryanjosebrosas/autonomous-coding-system-final.git)
- **Main Branch**: master
- **PR Target**: master

## RAG Integration (Optional)

- **RAG Available**: no (Archon MCP not detected)
- **RAG Tool Prefix**: N/A
- **Indexed Sources**: N/A

## Notes

- This is an OpenCode AI coding system framework (meta-framework for AI-assisted development)
- Framework files are in .opencode/, mirrored to .claude/ for Claude Code compatibility
- Validation commands are custom (no standard npm scripts detected)
- L1-L4 validation is performed by /code-loop with model-based code review
- L5 is manual human verification via /final-review
- Project uses the PIV Loop methodology: Plan → Implement → Validate