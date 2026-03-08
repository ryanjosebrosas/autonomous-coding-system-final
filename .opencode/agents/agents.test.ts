// ============================================================================
// AGENT TESTS
// ============================================================================

import { describe, it, expect } from "vitest"
import { readFileSync } from "fs"
import { join } from "path"
import { getAgentByName, getAllAgentNames, getAgentsByMode, getAgentsByCategory, AGENT_REGISTRY } from "./registry"
import { resolveAgentModel, isAgentAvailable, hasPermission } from "./resolve-agent"
import { getPermissionLevel, getPermissions, canUseTool } from "./permissions"

// ============================================================================
// EXPECTED MODEL ASSIGNMENTS
// Source of truth: oh-my-opencode.jsonc (user overrides) + registry defaults
// ============================================================================

/**
 * Expected effective model for each agent.
 * oh-my-opencode.jsonc overrides take priority over registry defaults.
 */
const EXPECTED_AGENT_MODELS: Record<string, string> = {
  // Overridden in oh-my-opencode.jsonc
  sisyphus: "anthropic/claude-opus-4-6",
  hephaestus: "openai/gpt-5.3-codex",
  oracle: "anthropic/claude-opus-4-6",
  metis: "anthropic/claude-sonnet-4-6",
  momus: "anthropic/claude-opus-4-6",
  librarian: "ollama/glm-5:cloud",
  explore: "ollama/glm-5:cloud",
  atlas: "ollama/glm-5:cloud",
  // Registry defaults (not in oh-my-opencode.jsonc)
  "sisyphus-junior": "gpt-5.3-codex",  // registry default
  "multimodal-looker": "ollama-cloud/gemini-3-flash-preview", // registry default
}

/**
 * Expected category model assignments from oh-my-opencode.jsonc.
 */
const EXPECTED_CATEGORY_MODELS: Record<string, { model: string; provider: string }> = {
  "visual-engineering": { model: "openai/gpt-5.3-codex", provider: "openai" },
  "ultrabrain":         { model: "openai/gpt-5.3-codex", provider: "openai" },
  "artistry":           { model: "openai/gpt-5.3-codex", provider: "openai" },
  "quick":              { model: "openai/gpt-5.3-codex", provider: "openai" },
  "deep":               { model: "openai/gpt-5.3-codex", provider: "openai" },
  "unspecified-low":    { model: "openai/gpt-5.3-codex", provider: "openai" },
  "unspecified-high":   { model: "openai/gpt-5.3-codex", provider: "openai" },
  "writing":            { model: "openai/gpt-5.3-codex", provider: "openai" },
}

// ============================================================================
// HELPER: load oh-my-opencode.jsonc (strip comments for JSON.parse)
// ============================================================================

function loadOhMyOpenCodeConfig(): {
  agents: Record<string, { model: string }>
  categories: Record<string, { model: string; provider: string }>
} {
  const configPath = join(__dirname, "../oh-my-opencode.jsonc")
  const raw = readFileSync(configPath, "utf-8")
  // Strip single-line comments (// ...) — JSONC isn't valid JSON
  const stripped = raw.replace(/\/\/[^\n]*/g, "")
  return JSON.parse(stripped)
}

// ============================================================================
// AGENT REGISTRY TESTS
// ============================================================================

describe("Agent Registry", () => {
  describe("getAgentByName", () => {
    it("should return agent metadata for valid names", () => {
      expect(getAgentByName("sisyphus")).toBeDefined()
      expect(getAgentByName("oracle")).toBeDefined()
      expect(getAgentByName("librarian")).toBeDefined()
      expect(getAgentByName("metis")).toBeDefined()
    })

    it("should return null for invalid names", () => {
      expect(getAgentByName("nonexistent")).toBeNull()
      expect(getAgentByName("")).toBeNull()
    })

    it("should return correct properties for sisyphus", () => {
      const sisyphus = getAgentByName("sisyphus")
      expect(sisyphus?.category).toBe("unspecified-high")
      expect(sisyphus?.model).toContain("sonnet")
      expect(sisyphus?.mode).toBe("all")
    })

    it("should return correct properties for metis", () => {
      const metis = getAgentByName("metis")
      expect(metis?.name).toBe("metis")
      expect(metis?.mode).toBe("subagent")
      expect(metis?.permissions.writeFile).toBe(false)
      expect(metis?.permissions.editFile).toBe(false)
    })
  })

  describe("getAllAgentNames", () => {
    it("should return all registered agent names", () => {
      const names = getAllAgentNames()
      expect(names.length).toBe(13)
      expect(names).toContain("sisyphus")
      expect(names).toContain("hephaestus")
      expect(names).toContain("oracle")
      expect(names).toContain("metis")
      expect(names).toContain("momus")
      expect(names).toContain("atlas")
      expect(names).toContain("prometheus")
      expect(names).toContain("sisyphus-junior")
      expect(names).toContain("librarian")
      expect(names).toContain("explore")
      expect(names).toContain("tmux-master")
      expect(names).toContain("prime-agent")
      expect(names).toContain("multimodal-looker")
    })
  })

  describe("getAgentsByMode", () => {
    it("should return subagent mode agents (including 'all' mode)", () => {
      const subagents = getAgentsByMode("subagent")
      expect(subagents.length).toBeGreaterThan(0)
      expect(subagents.every(a => a.mode === "subagent" || a.mode === "all")).toBe(true)
    })

    it("should return primary mode agents — Atlas only", () => {
      // Atlas is the only pure 'primary' mode agent
      const primaryOnly = Object.values(AGENT_REGISTRY).filter(a => a.mode === "primary")
      expect(primaryOnly.length).toBe(1)
      expect(primaryOnly[0].name).toBe("atlas")
    })
  })

  describe("getAgentsByCategory", () => {
    it("should return ultrabrain agents (hephaestus, oracle, momus)", () => {
      const ultrabrain = getAgentsByCategory("ultrabrain")
      const names = ultrabrain.map(a => a.name)
      expect(names).toContain("hephaestus")
      expect(names).toContain("oracle")
      expect(names).toContain("momus")
    })

    it("should return empty array for unknown category", () => {
      expect(getAgentsByCategory("unknown")).toEqual([])
    })
  })
})

// ============================================================================
// AGENT RESOLUTION TESTS
// ============================================================================

describe("Agent Resolution", () => {
  describe("resolveAgentModel", () => {
    it("should resolve agent with default model", () => {
      const result = resolveAgentModel({ agentName: "sisyphus" })
      expect(result).not.toBeNull()
      expect(result?.agent.name).toBe("sisyphus")
      expect(result?.source).toBe("agent-default")
    })

    it("should use user override when provided", () => {
      const result = resolveAgentModel({
        agentName: "sisyphus",
        provider: "ollama",
        model: "deepseek-v3.1:671b-cloud",
      })
      expect(result?.source).toBe("user-override")
      expect(result?.model).toBe("deepseek-v3.1:671b-cloud")
    })

    it("should use category default when specified", () => {
      const result = resolveAgentModel({ category: "ultrabrain" })
      expect(result?.source).toBe("category-default")
    })
  })

  describe("isAgentAvailable", () => {
    it("should return true for all registered agents", () => {
      expect(isAgentAvailable("sisyphus")).toBe(true)
      expect(isAgentAvailable("oracle")).toBe(true)
      expect(isAgentAvailable("librarian")).toBe(true)
      expect(isAgentAvailable("metis")).toBe(true)
    })

    it("should return false for unknown agents", () => {
      expect(isAgentAvailable("unknown" as any)).toBe(false)
    })
  })

  describe("hasPermission", () => {
    it("should enforce write permissions by agent preset", () => {
      expect(hasPermission("sisyphus", "write")).toBe(false)
      expect(hasPermission("hephaestus", "edit")).toBe(true)
    })

    it("should deny read-only agents from writing", () => {
      expect(hasPermission("oracle", "write")).toBe(false)
      expect(hasPermission("librarian", "edit")).toBe(false)
      expect(hasPermission("momus", "bash")).toBe(false)
      expect(hasPermission("metis", "write")).toBe(false)
      expect(hasPermission("metis", "edit")).toBe(false)
    })

    it("should deny task tool for constrained agents", () => {
      expect(hasPermission("sisyphus-junior", "task")).toBe(false)
      expect(hasPermission("atlas", "task")).toBe(false)
      expect(hasPermission("metis", "task")).toBe(false)
    })
  })
})

// ============================================================================
// PERMISSIONS TESTS
// ============================================================================

describe("Permissions", () => {
  describe("getPermissionLevel", () => {
    it("should return full for Sisyphus", () => {
      expect(getPermissionLevel("sisyphus")).toBe("full")
    })

    it("should return read-only for Oracle", () => {
      expect(getPermissionLevel("oracle")).toBe("read-only")
    })

    it("should return read-only for Metis", () => {
      expect(getPermissionLevel("metis")).toBe("read-only")
    })

    it("should return full-no-task for Atlas", () => {
      expect(getPermissionLevel("atlas")).toBe("full-no-task")
    })

    it("should return vision-only for Multimodal-Looker", () => {
      expect(getPermissionLevel("multimodal-looker")).toBe("vision-only")
    })
  })

  describe("getPermissions", () => {
    it("should return full permissions", () => {
      const perm = getPermissions("sisyphus")
      expect(perm.readFile).toBe(true)
      expect(perm.writeFile).toBe(true)
      expect(perm.editFile).toBe(true)
      expect(perm.bash).toBe(true)
      expect(perm.task).toBe(true)
    })

    it("should return read-only permissions", () => {
      const perm = getPermissions("oracle")
      expect(perm.readFile).toBe(true)
      expect(perm.writeFile).toBe(false)
      expect(perm.editFile).toBe(false)
      expect(perm.bash).toBe(false)
      expect(perm.task).toBe(false)
    })
  })

  describe("canUseTool", () => {
    it("should allow read operations for all agents", () => {
      expect(canUseTool("sisyphus", "read")).toBe(true)
      expect(canUseTool("oracle", "read")).toBe(true)
      expect(canUseTool("metis", "read")).toBe(true)
    })

    it("should deny write operations for read-only agents", () => {
      expect(canUseTool("oracle", "write")).toBe(false)
      expect(canUseTool("oracle", "edit")).toBe(false)
      expect(canUseTool("metis", "write")).toBe(false)
      expect(canUseTool("metis", "edit")).toBe(false)
    })
  })
})

// ============================================================================
// OH-MY-OPENCODE.JSONC MODEL VERIFICATION TESTS
// Verifies that the config file matches expected model assignments.
// This catches silent model drift from migrations or manual edits.
// ============================================================================

describe("oh-my-opencode.jsonc — Model Verification", () => {
  let config: ReturnType<typeof loadOhMyOpenCodeConfig>

  beforeAll(() => {
    config = loadOhMyOpenCodeConfig()
  })

  describe("Agent model overrides", () => {
    const overriddenAgents = [
      "sisyphus", "hephaestus", "oracle", "metis",
      "momus", "librarian", "explore", "atlas",
    ]

    for (const agentName of overriddenAgents) {
      it(`${agentName} should use model: ${EXPECTED_AGENT_MODELS[agentName]}`, () => {
        const configured = config.agents[agentName]?.model
        expect(configured, `Agent '${agentName}' missing from oh-my-opencode.jsonc`).toBeDefined()
        expect(configured).toBe(EXPECTED_AGENT_MODELS[agentName])
      })
    }
  })

  describe("Category model assignments", () => {
    for (const [category, expected] of Object.entries(EXPECTED_CATEGORY_MODELS)) {
      it(`category '${category}' should use model: ${expected.provider}/${expected.model}`, () => {
        const configured = config.categories[category]
        expect(configured, `Category '${category}' missing from oh-my-opencode.jsonc`).toBeDefined()
        expect(configured.model).toBe(expected.model)
        expect(configured.provider).toBe(expected.provider)
      })
    }
  })

  describe("Registry vs config consistency", () => {
    it("registry model for momus should contain 'opus'", () => {
      const momus = getAgentByName("momus")
      expect(momus?.model).toContain("opus")
    })

    it("sisyphus override should match registry model", () => {
      const configured = config.agents["sisyphus"]?.model
      expect(configured).toBe("anthropic/claude-opus-4-6")
    })

    it("oracle and momus should be on claude-opus-4-6 (migrated from 4-5)", () => {
      expect(config.agents["oracle"]?.model).toBe("anthropic/claude-opus-4-6")
      expect(config.agents["momus"]?.model).toBe("anthropic/claude-opus-4-6")
    })

    it("utility agents (librarian, explore, atlas) should all use glm-5:cloud", () => {
      for (const agent of ["librarian", "explore", "atlas"]) {
        expect(config.agents[agent]?.model).toBe("ollama/glm-5:cloud")
      }
    })

    it("all category overrides should use openai provider", () => {
      for (const [category, cfg] of Object.entries(config.categories)) {
        expect(cfg.provider, `Category '${category}' has wrong provider`).toBe("openai")
      }
    })

    it("_migrations should record the opus 4-5 → 4-6 upgrade", () => {
      const migrations = (config as any)._migrations as string[] | undefined
      expect(migrations).toBeDefined()
      expect(migrations?.some(m => m.includes("claude-opus-4-5") && m.includes("claude-opus-4-6"))).toBe(true)
    })
  })
})
