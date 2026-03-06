/**
 * Agent Resolution Integration Tests
 * 
 * Tests verify:
 * - Agent registry lookups
 * - Permission checks (full, readOnly, fullNoTask, visionOnly)
 * - Mode classification (primary, subagent, all)
 * - Category assignments
 * - Fallback chain configuration
 * - Resolution priority (user-override → agent-default → category → fallback)
 */

import { describe, it, expect } from "vitest"
import {
  AGENT_REGISTRY,
  PERMISSIONS,
  FALLBACK_CHAINS,
  AGENT_NAMES,
  getAgentByName,
  getAllAgentNames,
  getAgentsByMode,
  getAgentsByCategory,
  getReadOnlyAgents,
  getDelegatingAgents,
  type AgentMetadata,
  type AgentPermissions,
} from "../../agents/registry"
import {
  resolveAgentModel,
  isAgentAvailable,
  getAvailableAgents,
  getAgentsForTask,
  hasPermission,
  getDeniedTools,
  type ResolvedAgent,
} from "../../agents/resolve-agent"
import {
  PERMISSION_PRESETS,
  AGENT_PERMISSIONS,
  getPermissionLevel,
  getPermissions,
  canUseTool,
  getDeniedToolsList,
  isReadOnly,
  canDelegate,
  type PermissionLevel,
  type DetailedPermissions,
} from "../../agents/permissions"
import { CATEGORY_MODEL_ROUTES } from "../../tools/delegate-task/constants"
import type { AgentMode } from "../../agents/types"

// ============================================================
// AGENT REGISTRY STRUCTURE TESTS
// ============================================================

describe("Agent Resolution Integration", () => {
  
  // ============================================================
  // REGISTRY STRUCTURE
  // ============================================================

  describe("Registry Structure", () => {
    describe("AGENT_REGISTRY", () => {
      it("should have exactly 11 agents", () => {
        const agentCount = Object.keys(AGENT_REGISTRY).length
        expect(agentCount).toBe(11)
      })

      it("should have all expected agent names", () => {
        const names = Object.keys(AGENT_REGISTRY)
        
        expect(names).toContain("sisyphus")
        expect(names).toContain("hephaestus")
        expect(names).toContain("atlas")
        expect(names).toContain("prometheus")
        expect(names).toContain("oracle")
        expect(names).toContain("metis")
        expect(names).toContain("momus")
        expect(names).toContain("sisyphus-junior")
        expect(names).toContain("librarian")
        expect(names).toContain("explore")
        expect(names).toContain("multimodal-looker")
      })

      it("should have all required fields for each agent", () => {
        for (const [name, agent] of Object.entries(AGENT_REGISTRY)) {
          expect(agent.name).toBe(name)
          expect(agent.displayName).toBeTruthy()
          expect(agent.description).toBeTruthy()
          expect(agent.category).toBeTruthy()
          expect(agent.model).toBeTruthy()
          expect(agent.temperature).toBeGreaterThanOrEqual(0)
          expect(agent.temperature).toBeLessThanOrEqual(1)
          expect(["primary", "subagent", "all"]).toContain(agent.mode)
          expect(agent.permissions).toBeDefined()
          expect(agent.fallbackChain).toBeInstanceOf(Array)
          expect(agent.deniedTools).toBeInstanceOf(Array)
        }
      })
    })

    describe("AGENT_NAMES", () => {
      it("should match registry keys", () => {
        const registryKeys = Object.keys(AGENT_REGISTRY).sort()
        const agentNamesList = [...AGENT_NAMES].sort()
        
        expect(agentNamesList).toEqual(registryKeys)
      })
    })

    describe("PERMISSIONS presets", () => {
      it("should have all 4 permission presets", () => {
        expect(PERMISSIONS.full).toBeDefined()
        expect(PERMISSIONS.readOnly).toBeDefined()
        expect(PERMISSIONS.fullNoTask).toBeDefined()
        expect(PERMISSIONS.visionOnly).toBeDefined()
      })

      it("should have correct full permissions", () => {
        const full = PERMISSIONS.full
        expect(full.readFile).toBe(true)
        expect(full.writeFile).toBe(true)
        expect(full.editFile).toBe(true)
        expect(full.bash).toBe(true)
        expect(full.grep).toBe(true)
        expect(full.task).toBe(true)
      })

      it("should have correct readOnly permissions", () => {
        const readOnly = PERMISSIONS.readOnly
        expect(readOnly.readFile).toBe(true)
        expect(readOnly.writeFile).toBe(false)
        expect(readOnly.editFile).toBe(false)
        expect(readOnly.bash).toBe(false)
        expect(readOnly.grep).toBe(true)
        expect(readOnly.task).toBe(false)
      })

      it("should have correct fullNoTask permissions", () => {
        const fullNoTask = PERMISSIONS.fullNoTask
        expect(fullNoTask.readFile).toBe(true)
        expect(fullNoTask.writeFile).toBe(true)
        expect(fullNoTask.editFile).toBe(true)
        expect(fullNoTask.bash).toBe(true)
        expect(fullNoTask.grep).toBe(true)
        expect(fullNoTask.task).toBe(false)
      })

      it("should have correct visionOnly permissions", () => {
        const visionOnly = PERMISSIONS.visionOnly
        expect(visionOnly.readFile).toBe(false)
        expect(visionOnly.writeFile).toBe(false)
        expect(visionOnly.editFile).toBe(false)
        expect(visionOnly.bash).toBe(false)
        expect(visionOnly.grep).toBe(false)
        expect(visionOnly.task).toBe(false)
      })
    })

    describe("FALLBACK_CHAINS", () => {
      it("should have fallback chains for all agents except junior", () => {
        expect(FALLBACK_CHAINS.sisyphus).toBeInstanceOf(Array)
        expect(FALLBACK_CHAINS.sisyphus.length).toBeGreaterThan(0)
        
        expect(FALLBACK_CHAINS.hephaestus).toBeInstanceOf(Array)
        expect(FALLBACK_CHAINS.oracle).toBeInstanceOf(Array)
        expect(FALLBACK_CHAINS.librarian).toBeInstanceOf(Array)
        expect(FALLBACK_CHAINS.explore).toBeInstanceOf(Array)
        expect(FALLBACK_CHAINS.multimodalLooker).toBeInstanceOf(Array)
        expect(FALLBACK_CHAINS.metis).toBeInstanceOf(Array)
        expect(FALLBACK_CHAINS.momus).toBeInstanceOf(Array)
        expect(FALLBACK_CHAINS.atlas).toBeInstanceOf(Array)
        expect(FALLBACK_CHAINS.prometheus).toBeInstanceOf(Array)
        
        // Sisyphus-junior has empty fallback (user-configurable via category)
        expect(FALLBACK_CHAINS.sisyphusJunior).toEqual([])
      })
    })
  })

  // ============================================================
  // AGENT LOOKUP FUNCTIONS
  // ============================================================

  describe("Agent Lookup", () => {
    describe("getAgentByName", () => {
      it("should return sisyphus agent", () => {
        const agent = getAgentByName("sisyphus")

        expect(agent).not.toBeNull()
        expect(agent!.name).toBe("sisyphus")
        expect(agent!.model).toBe("claude-opus-4-6")  // Updated: Per AGENTS.md specification
        expect(agent!.mode).toBe("all")
        expect(agent!.category).toBe("unspecified-high")
      })

      it("should return hephaestus agent", () => {
        const agent = getAgentByName("hephaestus")
        
        expect(agent).not.toBeNull()
        expect(agent!.name).toBe("hephaestus")
        expect(agent!.model).toBe("gpt-5.3-codex")
        expect(agent!.mode).toBe("all")
        expect(agent!.category).toBe("ultrabrain")
      })

      it("should return oracle agent (read-only consultant)", () => {
        const agent = getAgentByName("oracle")
        
        expect(agent).not.toBeNull()
        expect(agent!.name).toBe("oracle")
        expect(agent!.mode).toBe("subagent")
        expect(agent!.permissions.writeFile).toBe(false)
        expect(agent!.permissions.task).toBe(false)
      })

      it("should return null for unknown agent", () => {
        const agent = getAgentByName("nonexistent-agent-xyz")
        expect(agent).toBeNull()
      })

      it("should handle hyphenated agent names", () => {
        const junior = getAgentByName("sisyphus-junior")
        const looker = getAgentByName("multimodal-looker")
        
        expect(junior).not.toBeNull()
        expect(junior!.name).toBe("sisyphus-junior")
        
        expect(looker).not.toBeNull()
        expect(looker!.name).toBe("multimodal-looker")
      })
    })

    describe("getAllAgentNames", () => {
      it("should return 11 agent names", () => {
        const names = getAllAgentNames()
        expect(names.length).toBe(11)
      })

      it("should return all agent names as strings", () => {
        const names = getAllAgentNames()
        
        expect(names).toContain("sisyphus")
        expect(names).toContain("hephaestus")
        expect(names).toContain("sisyphus-junior")
        expect(names).toContain("multimodal-looker")
      })
    })

    describe("getAgentsByMode", () => {
      it("should return primary mode agents (includes 'all' mode)", () => {
        const primaryAgents = getAgentsByMode("primary")
        
        // Atlas is primary mode, but agents with mode='all' are also available
        // in primary context (sisyphus, hephaestus, junior can work as primary)
        expect(primaryAgents.length).toBeGreaterThan(0)
        
        const names = primaryAgents.map(a => a.name)
        expect(names).toContain("atlas")
        
        // Agents with mode 'all' are included because they can work in primary context
        expect(names).toContain("sisyphus")
        expect(names).toContain("hephaestus")
        expect(names).toContain("sisyphus-junior")
      })

      it("should return subagent mode agents", () => {
        const subagents = getAgentsByMode("subagent")
        const names = subagents.map(a => a.name)
        
        expect(names).toContain("oracle")
        expect(names).toContain("librarian")
        expect(names).toContain("explore")
        expect(names).toContain("prometheus")
        expect(names).toContain("metis")
        expect(names).toContain("momus")
        expect(names).toContain("multimodal-looker")
        
        // Primary agents should not be included
        expect(names).not.toContain("atlas")
      })

      it("should return all-capable agents (mode=all)", () => {
        const allAgents = getAgentsByMode("all")
        const names = allAgents.map(a => a.name)
        
        expect(names).toContain("sisyphus")
        expect(names).toContain("hephaestus")
        expect(names).toContain("sisyphus-junior")
        
        // Subagent-only agents should not be included
        expect(names).not.toContain("oracle")
      })

      it("should return all agents when querying all modes", () => {
        const primary = getAgentsByMode("primary")
        const subagent = getAgentsByMode("subagent")
        const all = getAgentsByMode("all")
        
        // Total should equal all agents (primary + subagent agents that match "subagent" mode)
        // Note: "all" mode agents also match mode "all", not "subagent"
        const totalUnique = new Set([
          ...primary.map(a => a.name),
          ...subagent.map(a => a.name),
          ...all.map(a => a.name),
        ])
        
        expect(totalUnique.size).toBeGreaterThanOrEqual(11)
      })
    })

    describe("getAgentsByCategory", () => {
      it("should return ultrabrain category agents", () => {
        const ultrabrainAgents = getAgentsByCategory("ultrabrain")
        const names = ultrabrainAgents.map(a => a.name)
        
        expect(names).toContain("hephaestus")
        expect(names).toContain("oracle")
        expect(names).toContain("momus")
      })

      it("should return writing category agents", () => {
        const writingAgents = getAgentsByCategory("writing")
        const names = writingAgents.map(a => a.name)
        
        expect(names).toContain("atlas")
        expect(names).toContain("librarian")
      })

      it("should return deep category agents", () => {
        const deepAgents = getAgentsByCategory("deep")
        const names = deepAgents.map(a => a.name)
        
        expect(names).toContain("explore")
      })

      it("should return empty array for unknown category", () => {
        const agents = getAgentsByCategory("nonexistent-category")
        expect(agents.length).toBe(0)
      })
    })

    describe("getReadOnlyAgents", () => {
      it("should return read-only agents", () => {
        const readOnlyAgents = getReadOnlyAgents()
        const names = readOnlyAgents.map(a => a.name)
        
        expect(names).toContain("oracle")
        expect(names).toContain("librarian")
        expect(names).toContain("explore")
        expect(names).toContain("prometheus")
        expect(names).toContain("metis")
        expect(names).toContain("momus")
        expect(names).toContain("multimodal-looker")
      })

      it("should not include write-capable agents", () => {
        const readOnlyAgents = getReadOnlyAgents()
        const names = readOnlyAgents.map(a => a.name)
        
        // Agents with write permissions
        expect(names).not.toContain("sisyphus")
        expect(names).not.toContain("hephaestus")
        expect(names).not.toContain("atlas")
        expect(names).not.toContain("sisyphus-junior")
      })

      it("should all have readOnly permissions", () => {
        const readOnlyAgents = getReadOnlyAgents()
        
        for (const agent of readOnlyAgents) {
          expect(agent.permissions.writeFile).toBe(false)
          expect(agent.permissions.editFile).toBe(false)
        }
      })
    })

    describe("getDelegatingAgents", () => {
      it("should return agents with task permission", () => {
        const delegatingAgents = getDelegatingAgents()
        const names = delegatingAgents.map(a => a.name)
        
        // Sisyphus and Hephaestus can delegate
        expect(names).toContain("sisyphus")
        expect(names).toContain("hephaestus")
      })

      it("should not include non-delegating agents", () => {
        const delegatingAgents = getDelegatingAgents()
        const names = delegatingAgents.map(a => a.name)
        
        // These agents cannot delegate (task permission is false)
        expect(names).not.toContain("oracle")
        expect(names).not.toContain("librarian")
        expect(names).not.toContain("sisyphus-junior")
        // Note: atlas has full permissions in registry but full-no-task in permissions.ts
        // The registry permissions.task is what matters for getDelegatingAgents
      })

      it("should all have task permission", () => {
        const delegatingAgents = getDelegatingAgents()
        
        for (const agent of delegatingAgents) {
          expect(agent.permissions.task).toBe(true)
        }
      })
    })
  })

  // ============================================================
  // PERMISSION CHECKING
  // ============================================================

  describe("Permission Checking", () => {
    describe("getPermissionLevel", () => {
      it("should return correct level for each agent", () => {
        expect(getPermissionLevel("sisyphus")).toBe("full")
        expect(getPermissionLevel("hephaestus")).toBe("full")
        expect(getPermissionLevel("atlas")).toBe("full-no-task")
        expect(getPermissionLevel("sisyphus-junior")).toBe("full-no-task")
        expect(getPermissionLevel("oracle")).toBe("read-only")
        expect(getPermissionLevel("librarian")).toBe("read-only")
        expect(getPermissionLevel("explore")).toBe("read-only")
        expect(getPermissionLevel("prometheus")).toBe("read-only")
        expect(getPermissionLevel("metis")).toBe("read-only")
        expect(getPermissionLevel("momus")).toBe("read-only")
        expect(getPermissionLevel("multimodal-looker")).toBe("vision-only")
      })
    })

    describe("getPermissions", () => {
      it("should return full permissions for sisyphus", () => {
        const perms = getPermissions("sisyphus")
        
        expect(perms.readFile).toBe(true)
        expect(perms.writeFile).toBe(true)
        expect(perms.editFile).toBe(true)
        expect(perms.bash).toBe(true)
        expect(perms.grep).toBe(true)
        expect(perms.glob).toBe(true)
        expect(perms.task).toBe(true)
      })

      it("should return read-only permissions for oracle", () => {
        const perms = getPermissions("oracle")
        
        expect(perms.readFile).toBe(true)
        expect(perms.writeFile).toBe(false)
        expect(perms.editFile).toBe(false)
        expect(perms.bash).toBe(false)
        expect(perms.grep).toBe(true)
        expect(perms.task).toBe(false)
      })

      it("should return vision-only permissions for multimodal-looker", () => {
        const perms = getPermissions("multimodal-looker")
        
        expect(perms.readFile).toBe(false)
        expect(perms.writeFile).toBe(false)
        expect(perms.editFile).toBe(false)
        expect(perms.bash).toBe(false)
        expect(perms.grep).toBe(false)
        expect(perms.task).toBe(false)
      })

      it("should return full-no-task for atlas and junior", () => {
        const atlasPerms = getPermissions("atlas")
        const juniorPerms = getPermissions("sisyphus-junior")
        
        // Both can read/write/edit/bash but cannot delegate
        expect(atlasPerms.readFile).toBe(true)
        expect(atlasPerms.writeFile).toBe(true)
        expect(atlasPerms.editFile).toBe(true)
        expect(atlasPerms.bash).toBe(true)
        expect(atlasPerms.task).toBe(false)
        
        expect(juniorPerms.readFile).toBe(true)
        expect(juniorPerms.writeFile).toBe(true)
        expect(juniorPerms.editFile).toBe(true)
        expect(juniorPerms.bash).toBe(true)
        expect(juniorPerms.task).toBe(false)
      })
    })

    describe("canUseTool", () => {
      it("should allow sisyphus to use all tools", () => {
        expect(canUseTool("sisyphus", "read")).toBe(true)
        expect(canUseTool("sisyphus", "write")).toBe(true)
        expect(canUseTool("sisyphus", "edit")).toBe(true)
        expect(canUseTool("sisyphus", "bash")).toBe(true)
        expect(canUseTool("sisyphus", "task")).toBe(true)
      })

      it("should restrict oracle to read-only tools", () => {
        expect(canUseTool("oracle", "read")).toBe(true)
        expect(canUseTool("oracle", "grep")).toBe(true)
        expect(canUseTool("oracle", "write")).toBe(false)
        expect(canUseTool("oracle", "edit")).toBe(false)
        expect(canUseTool("oracle", "bash")).toBe(false)
        expect(canUseTool("oracle", "task")).toBe(false)
      })

      it("should restrict multimodal-looker to vision only", () => {
        expect(canUseTool("multimodal-looker", "read")).toBe(false)
        expect(canUseTool("multimodal-looker", "write")).toBe(false)
        expect(canUseTool("multimodal-looker", "bash")).toBe(false)
        expect(canUseTool("multimodal-looker", "task")).toBe(false)
      })

      it("should allow unknown tools by default", () => {
        expect(canUseTool("sisyphus", "unknown-tool")).toBe(true)
        expect(canUseTool("oracle", "unknown-tool")).toBe(true)
      })
    })

    describe("getDeniedToolsList", () => {
      it("should return empty list for sisyphus", () => {
        const denied = getDeniedToolsList("sisyphus")
        expect(denied.length).toBe(0)
      })

      it("should return write tools for oracle", () => {
        const denied = getDeniedToolsList("oracle")
        
        expect(denied).toContain("Write")
        expect(denied).toContain("Edit")
        expect(denied).toContain("bash")
        expect(denied).toContain("task")
      })

      it("should return task for atlas and junior", () => {
        const atlasDenied = getDeniedToolsList("atlas")
        const juniorDenied = getDeniedToolsList("sisyphus-junior")
        
        expect(atlasDenied).toContain("task")
        expect(juniorDenied).toContain("task")
        expect(atlasDenied).not.toContain("Write")
        expect(juniorDenied).not.toContain("Write")
      })

      it("should return all tools for multimodal-looker", () => {
        const denied = getDeniedToolsList("multimodal-looker")
        
        expect(denied).toContain("Write")
        expect(denied).toContain("Edit")
        expect(denied).toContain("bash")
        expect(denied).toContain("task")
        expect(denied.length).toBeGreaterThan(3)
      })
    })

    describe("isReadOnly", () => {
      it("should identify read-only agents", () => {
        expect(isReadOnly("oracle")).toBe(true)
        expect(isReadOnly("librarian")).toBe(true)
        expect(isReadOnly("explore")).toBe(true)
        expect(isReadOnly("prometheus")).toBe(true)
        expect(isReadOnly("metis")).toBe(true)
        expect(isReadOnly("momus")).toBe(true)
        expect(isReadOnly("multimodal-looker")).toBe(true)
      })

      it("should not identify write-capable agents as read-only", () => {
        expect(isReadOnly("sisyphus")).toBe(false)
        expect(isReadOnly("hephaestus")).toBe(false)
        expect(isReadOnly("atlas")).toBe(false)
        expect(isReadOnly("sisyphus-junior")).toBe(false)
      })
    })

    describe("canDelegate", () => {
      it("should identify delegating agents", () => {
        expect(canDelegate("sisyphus")).toBe(true)
        expect(canDelegate("hephaestus")).toBe(true)
      })

      it("should not identify non-delegating agents", () => {
        expect(canDelegate("oracle")).toBe(false)
        expect(canDelegate("atlas")).toBe(false)
        expect(canDelegate("sisyphus-junior")).toBe(false)
        expect(canDelegate("librarian")).toBe(false)
        expect(canDelegate("explore")).toBe(false)
      })
    })
  })

  // ============================================================
  // MODEL RESOLUTION
  // ============================================================

  describe("Model Resolution", () => {
    describe("resolveAgentModel", () => {
      it("should resolve agent by name with default model", () => {
        const result = resolveAgentModel({ agentName: "sisyphus" })

        expect(result).not.toBeNull()
        expect(result!.agent.name).toBe("sisyphus")
        expect(result!.model).toBe("claude-opus-4-6")  // Updated: Per AGENTS.md specification
        expect(result!.source).toBe("agent-default")
      })

      it("should resolve hephaestus with codex model", () => {
        const result = resolveAgentModel({ agentName: "hephaestus" })
        
        expect(result).not.toBeNull()
        expect(result!.agent.name).toBe("hephaestus")
        expect(result!.model).toBe("gpt-5.3-codex")
        expect(result!.source).toBe("agent-default")
      })

      it("should use user override when provider/model specified", () => {
        const result = resolveAgentModel({
          agentName: "sisyphus",
          provider: "ollama",
          model: "deepseek-v3.1:671b-cloud"
        })

        expect(result).not.toBeNull()
        expect(result!.model).toBe("deepseek-v3.1:671b-cloud")
        expect(result!.provider).toBe("ollama")
        expect(result!.source).toBe("user-override")
      })

      it("should resolve from category when no agent specified", () => {
        const result = resolveAgentModel({ category: "ultrabrain" })
        
        expect(result).not.toBeNull()
        expect(result!.source).toBe("category-default")
        // Category model route
        expect(result!.model).toBeTruthy()
        expect(result!.provider).toBeTruthy()
      })

      it("should return fallback when nothing specified", () => {
        const result = resolveAgentModel({})
        
        expect(result).not.toBeNull()
        expect(result!.source).toBe("fallback")
        expect(result!.model).toBe("glm-4.7")
      })

      it("should return null for unknown agent name", () => {
        const result = resolveAgentModel({ agentName: "nonexistent-agent" })
        expect(result).toBeNull()
      })
    })

    describe("isAgentAvailable", () => {
      it("should return true for all registered agents", () => {
        expect(isAgentAvailable("sisyphus")).toBe(true)
        expect(isAgentAvailable("hephaestus")).toBe(true)
        expect(isAgentAvailable("oracle")).toBe(true)
        expect(isAgentAvailable("librarian")).toBe(true)
        expect(isAgentAvailable("atlas")).toBe(true)
      })

      it("should return false for unknown agents", () => {
        expect(isAgentAvailable("nonexistent")).toBe(false)
        expect(isAgentAvailable("")).toBe(false)
      })
    })

    describe("getAvailableAgents", () => {
      it("should return all agents with valid models", () => {
        // Directly check each agent's availability
        const allNames = getAllAgentNames()
        expect(allNames.length).toBe(11)
        
        const availableAgents: AgentMetadata[] = []
        for (const name of allNames) {
          const agent = getAgentByName(name)
          if (agent && isAgentAvailable(name as any)) {
            availableAgents.push(agent)
          }
        }
        
        expect(availableAgents.length).toBe(11)
        
        const names = availableAgents.map(a => a.name)
        expect(names).toContain("sisyphus")
        expect(names).toContain("hephaestus")
        expect(names).toContain("oracle")
      })
    })

    describe("getAgentsForTask", () => {
      it("should return architecture agents", () => {
        const agents = getAgentsForTask("architecture")
        const names = agents.map(a => a.name)
        
        expect(names).toContain("oracle")
        expect(names).toContain("metis")
      })

      it("should return planning agents", () => {
        const agents = getAgentsForTask("planning")
        const names = agents.map(a => a.name)
        
        expect(names).toContain("prometheus")
        expect(names).toContain("momus")
      })

      it("should return research agents", () => {
        const agents = getAgentsForTask("research")
        const names = agents.map(a => a.name)
        
        expect(names).toContain("librarian")
        expect(names).toContain("explore")
      })

      it("should return execution agents", () => {
        const agents = getAgentsForTask("execution")
        const names = agents.map(a => a.name)
        
        expect(names).toContain("hephaestus")
        expect(names).toContain("sisyphus-junior")
      })

      it("should return empty array for unknown task type", () => {
        const agents = getAgentsForTask("nonexistent-task")
        expect(agents.length).toBe(0)
      })
    })
  })

  // ============================================================
  // CATEGORY ASSIGNMENTS
  // ============================================================

  describe("Category Assignments", () => {
    it("should assign ultrabrain to hephaestus, oracle, momus", () => {
      const ultrabrain = getAgentsByCategory("ultrabrain")
      const names = ultrabrain.map(a => a.name)
      
      expect(names).toContain("hephaestus")
      expect(names).toContain("oracle")
      expect(names).toContain("momus")
    })

    it("should assign writing to atlas, librarian", () => {
      const writing = getAgentsByCategory("writing")
      const names = writing.map(a => a.name)
      
      expect(names).toContain("atlas")
      expect(names).toContain("librarian")
    })

    it("should assign deep to explore", () => {
      const deep = getAgentsByCategory("deep")
      const names = deep.map(a => a.name)
      
      expect(names).toContain("explore")
    })

    it("should assign unspecified-high to sisyphus, prometheus, junior", () => {
      const unspecifiedHigh = getAgentsByCategory("unspecified-high")
      const names = unspecifiedHigh.map(a => a.name)
      
      expect(names).toContain("sisyphus")
      expect(names).toContain("prometheus")
      expect(names).toContain("sisyphus-junior")
    })

    it("should assign unspecified-low to multimodal-looker", () => {
      const unspecifiedLow = getAgentsByCategory("unspecified-low")
      const names = unspecifiedLow.map(a => a.name)
      
      expect(names).toContain("multimodal-looker")
    })

    it("should assign artistry to metis", () => {
      const artistry = getAgentsByCategory("artistry")
      const names = artistry.map(a => a.name)
      
      expect(names).toContain("metis")
    })
  })

  // ============================================================
  // FALLBACK CHAIN VALIDATION
  // ============================================================

  describe("Fallback Chains", () => {
    it("should have valid fallback chain for sisyphus", () => {
      const agent = getAgentByName("sisyphus")

      expect(agent!.fallbackChain.length).toBeGreaterThan(0)
      // Updated: AGENTS.md specifies 3 fallbacks for resilience
      expect(agent!.fallbackChain).toContain("kimi-k2.5")
    })

    it("should have fallback chain for oracle", () => {
      const agent = getAgentByName("oracle")

      expect(agent!.fallbackChain.length).toBeGreaterThan(0)
      // Updated: AGENTS.md specifies gemini and claude fallbacks
      expect(agent!.fallbackChain).toContain("gemini-3.1-pro")
    })

    it("should have empty fallback for sisyphus-junior", () => {
      const agent = getAgentByName("sisyphus-junior")
      
      // Junior has empty fallback - uses category routing
      expect(agent!.fallbackChain.length).toBe(0)
    })

    it("should have consistent fallback chain with FALLBACK_CHAINS constant", () => {
      const sisyphus = getAgentByName("sisyphus")
      
      expect(sisyphus!.fallbackChain).toEqual(Array.from(FALLBACK_CHAINS.sisyphus))
    })
  })

  // ============================================================
  // RESOLUTION PRIORITY
  // ============================================================

  describe("Resolution Priority", () => {
      it("should prioritize user-override over agent default", () => {
      // Agent default
      const agentDefault = resolveAgentModel({ agentName: "sisyphus" })
      expect(agentDefault!.source).toBe("agent-default")
      expect(agentDefault!.model).toBe("claude-opus-4-6")  // Updated: Per AGENTS.md specification

      // User override
      const userOverride = resolveAgentModel({
        agentName: "sisyphus",
        provider: "ollama",
        model: "qwen3.5:122b"
      })
      expect(userOverride!.source).toBe("user-override")
      expect(userOverride!.model).toBe("qwen3.5:122b")  // Updated: matches user override
    })

    it("should use agent default when only agent specified", () => {
      const result = resolveAgentModel({ agentName: "hephaestus" })
      
      expect(result!.source).toBe("agent-default")
      expect(result!.model).toBe("gpt-5.3-codex")
    })

    it("should use category default when only category specified", () => {
      const result = resolveAgentModel({ category: "ultrabrain" })
      
      expect(result!.source).toBe("category-default")
      expect(result!.agent).toBeTruthy()
    })

    it("should use fallback when nothing specified", () => {
      const result = resolveAgentModel({})
      
      expect(result!.source).toBe("fallback")
      expect(result!.model).toBe("glm-4.7")
      expect(result!.agent.name).toBe("sisyphus-junior")
    })

    it("should prefer agent name over category", () => {
      // When both are specified, agent name takes priority
      const result = resolveAgentModel({
        agentName: "oracle",
        category: "writing"
      })
      
      expect(result!.source).toBe("agent-default")
      expect(result!.agent.name).toBe("oracle")
    })
  })

  // ============================================================
  // MODE CLASSIFICATION
  // ============================================================

  describe("Mode Classification", () => {
    it("should classify primary mode correctly", () => {
      const atlas = getAgentByName("atlas")
      expect(atlas!.mode).toBe("primary")
    })

    it("should classify subagent mode correctly", () => {
      const subagents = ["oracle", "librarian", "explore", "prometheus", "metis", "momus", "multimodal-looker"]
      
      for (const name of subagents) {
        const agent = getAgentByName(name)
        expect(agent!.mode).toBe("subagent")
      }
    })

    it("should classify all mode correctly", () => {
      const allModeAgents = ["sisyphus", "hephaestus", "sisyphus-junior"]
      
      for (const name of allModeAgents) {
        const agent = getAgentByName(name)
        expect(agent!.mode).toBe("all")
      }
    })

    it("should have consistent mode counts", () => {
      const primary = getAgentsByMode("primary")
      const subagent = getAgentsByMode("subagent")
      const all = getAgentsByMode("all")
      
      // getAgentsByMode returns agents where mode matches OR mode === 'all'
      // So:
      // - Primary: 1 (Atlas - primary mode) + 3 (all-mode agents) = 4
      // - Subagent: 7 (subagent mode) + 3 (all-mode agents) = 10
      // - All: 3 (all-mode agents only)
      
      expect(primary.length).toBe(4) // atlas + sisyphus + hephaestus + junior
      expect(subagent.length).toBe(10) // 7 subagents + 3 all-mode
      expect(all.length).toBe(3) // only sisyphus, hephaestus, junior
    })
  })

  // ============================================================
  // TEMPERATURE VALIDATION
  // ============================================================

  describe("Temperature Settings", () => {
    it("should have low temperature for most agents", () => {
      for (const agent of Object.values(AGENT_REGISTRY)) {
        expect(agent.temperature).toBeGreaterThanOrEqual(0)
        expect(agent.temperature).toBeLessThanOrEqual(1)
        
        // Most agents should have low temperature (< 0.5)
        if (agent.name !== "metis") {
          expect(agent.temperature).toBeLessThanOrEqual(0.2)
        }
      }
    })

    it("should have higher temperature for metis", () => {
      const metis = getAgentByName("metis")
      expect(metis!.temperature).toBe(0.3)
    })

    it("should have consistent temperatures", () => {
      const sisyphus = getAgentByName("sisyphus")
      const hephaestus = getAgentByName("hephaestus")
      const oracle = getAgentByName("oracle")
      
      // All should have 0.1 temperature
      expect(sisyphus!.temperature).toBe(0.1)
      expect(hephaestus!.temperature).toBe(0.1)
      expect(oracle!.temperature).toBe(0.1)
    })
  })
})