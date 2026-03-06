// ============================================================================
// AGENT TESTS
// ============================================================================

import { describe, it, expect } from "vitest"
import { getAgentByName, getAllAgentNames, getAgentsByMode, getAgentsByCategory } from "./registry"
import { resolveAgentModel, isAgentAvailable, hasPermission } from "./resolve-agent"
import { getPermissionLevel, getPermissions, canUseTool } from "./permissions"

describe("Agent Registry", () => {
  describe("getAgentByName", () => {
    it("should return agent metadata for valid names", () => {
      expect(getAgentByName("sisyphus")).toBeDefined()
      expect(getAgentByName("oracle")).toBeDefined()
      expect(getAgentByName("librarian")).toBeDefined()
    })

    it("should return null for invalid names", () => {
      expect(getAgentByName("nonexistent")).toBeNull()
      expect(getAgentByName("")).toBeNull()
    })

    it("should return correct properties", () => {
      const sisyphus = getAgentByName("sisyphus")
      expect(sisyphus?.category).toBe("unspecified-high")
      expect(sisyphus?.model).toContain("opus")
      expect(sisyphus?.mode).toBe("all")
    })
  })

  describe("getAllAgentNames", () => {
    it("should return all 11 agent names", () => {
      const names = getAllAgentNames()
      expect(names.length).toBe(11)
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
      expect(names).toContain("multimodal-looker")
    })
  })

  describe("getAgentsByMode", () => {
    it("should return subagent mode agents", () => {
      const subagents = getAgentsByMode("subagent")
      expect(subagents.length).toBeGreaterThan(0)
      expect(subagents.every(a => a.mode === "subagent" || a.mode === "all")).toBe(true)
    })

    it("should return primary mode agents", () => {
      const primary = getAgentsByMode("primary")
      expect(primary.length).toBe(1) // Only Atlas
      expect(primary[0].name).toBe("atlas")
    })
  })

  describe("getAgentsByCategory", () => {
    it("should return ultrabrain agents", () => {
      const ultrabrain = getAgentsByCategory("ultrabrain")
      expect(ultrabrain.length).toBe(2) // hephaestus, oracle
      expect(ultrabrain.map(a => a.name)).toContain("hephaestus")
    })

    it("should return empty array for unknown category", () => {
      expect(getAgentsByCategory("unknown")).toEqual([])
    })
  })
})

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
      const result = resolveAgentModel({ category: "visual-engineering" })
      expect(result?.source).toBe("category-default")
    })
  })

  describe("isAgentAvailable", () => {
    it("should return true for all registered agents", () => {
      expect(isAgentAvailable("sisyphus")).toBe(true)
      expect(isAgentAvailable("oracle")).toBe(true)
      expect(isAgentAvailable("librarian")).toBe(true)
    })

    it("should return false for unknown agents", () => {
      expect(isAgentAvailable("unknown" as any)).toBe(false)
    })
  })

  describe("hasPermission", () => {
    it("should allow full agents to write", () => {
      expect(hasPermission("sisyphus", "write")).toBe(true)
      expect(hasPermission("hephaestus", "edit")).toBe(true)
    })

    it("should deny read-only agents from writing", () => {
      expect(hasPermission("oracle", "write")).toBe(false)
      expect(hasPermission("librarian", "edit")).toBe(false)
      expect(hasPermission("momus", "bash")).toBe(false)
    })

    it("should deny task tool for constrained agents", () => {
      expect(hasPermission("sisyphus-junior", "task")).toBe(false)
      expect(hasPermission("atlas", "task")).toBe(false)
    })
  })
})

describe("Permissions", () => {
  describe("getPermissionLevel", () => {
    it("should return full for Sisyphus", () => {
      expect(getPermissionLevel("sisyphus")).toBe("full")
    })

    it("should return read-only for Oracle", () => {
      expect(getPermissionLevel("oracle")).toBe("read-only")
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
    })

    it("should deny write operations for read-only agents", () => {
      expect(canUseTool("oracle", "write")).toBe(false)
      expect(canUseTool("oracle", "edit")).toBe(false)
    })
  })
})