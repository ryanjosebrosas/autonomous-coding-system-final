# Code Review — strict-orchestrator (Iteration 1)

Date: 2026-03-09
Scope reviewed:
- `.opencode/agents/registry.ts`
- `.opencode/agents/prime-agent/SKILL.md`
- `.opencode/agents/agents.test.ts`
- `.opencode/agents/sisyphus/SKILL.md`
- `.opencode/oh-my-opencode.jsonc`
- `AGENTS.md`

Skipped as requested:
- `.opencode/package-lock.json`
- `.agents/context/next-command.md`
- `.opencode/oh-my-opencode.jsonc.bak.*`
- `.agents/features/strict-orchestrator/*.md` planning artifacts

## Summary

- Critical: 0
- Major: 0
- Minor: 2
- Recommendation: PASS (clean for Critical/Major gate)

## Findings

### Minor 1 — Agent reference table missing prime-agent row

- File: `AGENTS.md:492`
- Evidence: The "Quick Reference Table" includes rows for `sisyphus`, `hephaestus`, `atlas`, `oracle`, `metis`, `momus`, `sisyphus-junior`, `librarian`, `explore`, and `multimodal-looker`, but no row for `prime-agent`.
- Impact: Documentation is out of sync with registry/runtime and can mislead maintainers about available agents.
- Recommended fix: Add a `prime-agent` row (model, mode, permissions, category, purpose) to the Agent Reference quick table.

### Minor 2 — getAllAgentNames test does not explicitly assert prometheus

- File: `.opencode/agents/agents.test.ts:103`
- Evidence: The `getAllAgentNames` test asserts `names.length` is `13` and checks many names, but does not include `expect(names).toContain("prometheus")`.
- Impact: A future regression could remove `prometheus` while preserving total count with another name and still pass this test.
- Recommended fix: Add an explicit assertion for `prometheus` in `getAllAgentNames` test.

## Criteria Check Notes

- `registry.ts` `prime-agent` entry matches `AgentMetadata` shape.
- `prime-agent` permission object includes all 6 required fields (`readFile`, `writeFile`, `editFile`, `bash`, `grep`, `task`).
- `FALLBACK_CHAINS.primeAgent` is present and wired to `AGENT_REGISTRY["prime-agent"].fallbackChain`.
- `AGENT_NAMES` includes `"prime-agent"` and total is 13.
- `agents.test.ts` count assertion is 13.
- `.opencode/agents/prime-agent/SKILL.md` frontmatter has `name`, `description`, `license`, and `compatibility`.
- `.opencode/oh-my-opencode.jsonc` sets `agents.sisyphus.model` to `anthropic/claude-opus-4-6`.
