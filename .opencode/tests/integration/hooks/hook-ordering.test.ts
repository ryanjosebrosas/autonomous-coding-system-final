/**
 * Hook Ordering Integration Tests
 * 
 * Tests verify:
 * - Hook tier ordering (continuation → session → tool-guard → transform → skill)
 * - Registry behavior (register, unregister, getEnabledHooks, etc.)
 * - Hooks sorted by tier order and priority
 * - Event type filtering
 */

import { describe, it, expect, beforeEach } from "vitest"
import {
  HOOK_TIER_ORDER,
  getHookTierOrder,
  createHookRegistry,
  type HookName,
  type HookTier,
  type HookDefinition,
  type HookEventType,
} from "../../../hooks/base"

// ============================================================
// MOCK HELPERS
// ============================================================

/**
 * Create a mock hook definition.
 * 
 * Note: Tests use arbitrary mock names (e.g., "hook1", "hook2") to test
 * registry behavior, not specific hooks. We cast to HookName since the
 * registry only needs the string type, not actual hook implementations.
 */
function createMockHook(
  name: string,
  tier: HookTier,
  eventTypes: HookEventType[] = [],
  priority: number = 0,
  enabled: boolean = true
): HookDefinition {
  return {
    name: name as HookName,
    tier,
    description: `Mock hook: ${name}`,
    eventTypes,
    enabled,
    priority,
    handler: async () => ({ handled: true }),
  }
}

/**
 * Helper to safely compare hook names in tests.
 * Mock names are cast to HookName, so we compare as strings.
 */
function expectHookName(actual: HookName, expected: string): void {
  expect(String(actual)).toBe(expected)
}

// ============================================================
// TIER ORDER CONSTANTS TESTS
// ============================================================

describe("Hook Ordering Integration", () => {
  // ============================================================
  // TIER ORDER CONSTANTS
  // ============================================================

  describe("HOOK_TIER_ORDER", () => {
    it("should have continuation tier as priority 1", () => {
      expect(HOOK_TIER_ORDER.continuation).toBe(1)
    })

    it("should have session tier as priority 2", () => {
      expect(HOOK_TIER_ORDER.session).toBe(2)
    })

    it("should have tool-guard tier as priority 3", () => {
      expect(HOOK_TIER_ORDER["tool-guard"]).toBe(3)
    })

    it("should have transform tier as priority 4", () => {
      expect(HOOK_TIER_ORDER.transform).toBe(4)
    })

    it("should have skill tier as priority 5", () => {
      expect(HOOK_TIER_ORDER.skill).toBe(5)
    })

    it("should have exactly 5 tiers", () => {
      const tierCount = Object.keys(HOOK_TIER_ORDER).length
      expect(tierCount).toBe(5)
    })

    it("should have no duplicate priority values", () => {
      const priorities = Object.values(HOOK_TIER_ORDER)
      const uniquePriorities = new Set(priorities)
      expect(priorities.length).toBe(uniquePriorities.size)
    })

    it("should have priorities numbered 1 through 5", () => {
      const priorities = Object.values(HOOK_TIER_ORDER).sort((a, b) => a - b)
      expect(priorities).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe("getHookTierOrder", () => {
    it("should return correct order for continuation", () => {
      expect(getHookTierOrder("continuation")).toBe(1)
    })

    it("should return correct order for session", () => {
      expect(getHookTierOrder("session")).toBe(2)
    })

    it("should return correct order for tool-guard", () => {
      expect(getHookTierOrder("tool-guard")).toBe(3)
    })

    it("should return correct order for transform", () => {
      expect(getHookTierOrder("transform")).toBe(4)
    })

    it("should return correct order for skill", () => {
      expect(getHookTierOrder("skill")).toBe(5)
    })

    it("should return numeric order for all valid tiers", () => {
      const tiers: HookTier[] = ["continuation", "session", "tool-guard", "transform", "skill"]
      
      for (const tier of tiers) {
        const order = getHookTierOrder(tier)
        expect(typeof order).toBe("number")
        expect(order).toBeGreaterThanOrEqual(1)
        expect(order).toBeLessThanOrEqual(5)
      }
    })
  })

  // ============================================================
  // HOOK REGISTRY TESTS
  // ============================================================

  describe("createHookRegistry", () => {
    it("should create registry with all required methods", () => {
      const registry = createHookRegistry()
      
      expect(typeof registry.register).toBe("function")
      expect(typeof registry.unregister).toBe("function")
      expect(typeof registry.getEnabledHooks).toBe("function")
      expect(typeof registry.getHooksByTier).toBe("function")
      expect(typeof registry.getHooksForEvent).toBe("function")
    })

    it("should start with empty enabled hooks", () => {
      const registry = createHookRegistry()
      
      expect(registry.getEnabledHooks()).toEqual([])
    })
  })

  describe("HookRegistry.register", () => {
    it("should register a single hook", () => {
      const registry = createHookRegistry()
      const hook = createMockHook("todo-continuation-enforcer", "continuation", ["session.idle"])
      
      registry.register(hook)
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(1)
      expect(String(hooks[0].name)).toBe("todo-continuation-enforcer")
    })

    it("should register multiple hooks", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("todo-continuation-enforcer", "continuation", ["session.idle"]))
      registry.register(createMockHook("atlas", "continuation", ["session.idle"]))
      registry.register(createMockHook("agent-usage-reminder", "session", ["session.idle"]))
      
      expect(registry.getEnabledHooks().length).toBe(3)
    })

    it("should replace hook with same name", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("todo-continuation-enforcer", "continuation", [], 0))
      registry.register(createMockHook("todo-continuation-enforcer", "session", [], 1))
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(1)
      expect(hooks[0].tier).toBe("session")
      expect(hooks[0].priority).toBe(1)
    })

    it("should register hooks from different tiers", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("hook1", "continuation", []))
      registry.register(createMockHook("hook2", "session", []))
      registry.register(createMockHook("hook3", "tool-guard", []))
      registry.register(createMockHook("hook4", "transform", []))
      registry.register(createMockHook("hook5", "skill", []))
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(5)
      
      // Verify all tiers are present
      const tiers = new Set(hooks.map(h => h.tier))
      expect(tiers.has("continuation")).toBe(true)
      expect(tiers.has("session")).toBe(true)
      expect(tiers.has("tool-guard")).toBe(true)
      expect(tiers.has("transform")).toBe(true)
      expect(tiers.has("skill")).toBe(true)
    })
  })

  describe("HookRegistry.unregister", () => {
    it("should unregister a registered hook", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("todo-continuation-enforcer", "continuation", []))
      registry.unregister("todo-continuation-enforcer")
      
      expect(registry.getEnabledHooks().length).toBe(0)
    })

    it("should not throw when unregistering non-existent hook", () => {
      const registry = createHookRegistry()
      
      expect(() => {
        registry.unregister("non-existent-hook")
      }).not.toThrow()
    })

    it("should only unregister specified hook", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("hook1", "continuation", []))
      registry.register(createMockHook("hook2", "continuation", []))
      registry.register(createMockHook("hook3", "continuation", []))
      
      registry.unregister("hook2")
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(2)
      expect(hooks.find(h => String(h.name) === "hook1")).toBeDefined()
      expect(hooks.find(h => String(h.name) === "hook2")).toBeUndefined()
      expect(hooks.find(h => String(h.name) === "hook3")).toBeDefined()
    })

    it("should allow re-registration after unregister", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("todo-continuation-enforcer", "continuation", [], 0))
      registry.unregister("todo-continuation-enforcer")
      registry.register(createMockHook("todo-continuation-enforcer", "session", [], 1))
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(1)
      expect(hooks[0].tier).toBe("session")
      expect(hooks[0].priority).toBe(1)
    })
  })

  describe("HookRegistry.getEnabledHooks", () => {
    it("should return empty array when no hooks registered", () => {
      const registry = createHookRegistry()
      
      expect(registry.getEnabledHooks()).toEqual([])
    })

    it("should return only enabled hooks", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("enabled-hook", "continuation", [], 0, true))
      registry.register(createMockHook("disabled-hook", "continuation", [], 0, false))
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(1)
      expect(String(hooks[0].name)).toBe("enabled-hook")
    })

    it("should return hooks sorted by tier order", () => {
      const registry = createHookRegistry()
      
      // Register in reverse order
      registry.register(createMockHook("skill-hook", "skill", []))
      registry.register(createMockHook("transform-hook", "transform", []))
      registry.register(createMockHook("tool-guard-hook", "tool-guard", []))
      registry.register(createMockHook("session-hook", "session", []))
      registry.register(createMockHook("continuation-hook", "continuation", []))
      
      const hooks = registry.getEnabledHooks()
      
      expect(hooks[0].tier).toBe("continuation")
      expect(hooks[1].tier).toBe("session")
      expect(hooks[2].tier).toBe("tool-guard")
      expect(hooks[3].tier).toBe("transform")
      expect(hooks[4].tier).toBe("skill")
    })

    it("should sort by priority within same tier", () => {
      const registry = createHookRegistry()
      
      // Register with different priorities within continuation tier
      registry.register(createMockHook("hook-low", "continuation", [], 10))
      registry.register(createMockHook("hook-high", "continuation", [], 1))
      registry.register(createMockHook("hook-mid", "continuation", [], 5))
      
      const hooks = registry.getEnabledHooks()
      
      expect(String(hooks[0].name)).toBe("hook-high")
      expect(String(hooks[1].name)).toBe("hook-mid")
      expect(String(hooks[2].name)).toBe("hook-low")
    })

    it("should sort by tier first, then by priority", () => {
      const registry = createHookRegistry()
      
      // Continuation tier, low priority (but runs first because tier 1)
      registry.register(createMockHook("cont-low", "continuation", [], 100))
      // Session tier, high priority (but runs after continuation because tier 2)
      registry.register(createMockHook("session-high", "session", [], 1))
      // Continuation tier, high priority (runs before cont-low)
      registry.register(createMockHook("cont-high", "continuation", [], 1))
      
      const hooks = registry.getEnabledHooks()
      
      // Continuation hooks first (tier 1)
      expect(String(hooks[0].name)).toBe("cont-high")
      expect(String(hooks[1].name)).toBe("cont-low")
      // Session hooks after (tier 2)
      expect(String(hooks[2].name)).toBe("session-high")
    })

    it("should return new array each time (immutable)", () => {
      const registry = createHookRegistry()
      registry.register(createMockHook("hook", "continuation", []))
      
      const hooks1 = registry.getEnabledHooks()
      const hooks2 = registry.getEnabledHooks()
      
      expect(hooks1).not.toBe(hooks2)
      expect(hooks1).toEqual(hooks2)
    })
  })

  describe("HookRegistry.getHooksByTier", () => {
    it("should return empty array for tier with no hooks", () => {
      const registry = createHookRegistry()
      registry.register(createMockHook("hook", "continuation", []))
      
      const skillHooks = registry.getHooksByTier("skill")
      
      expect(skillHooks).toEqual([])
    })

    it("should return all hooks for specified tier", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("cont1", "continuation", []))
      registry.register(createMockHook("cont2", "continuation", []))
      registry.register(createMockHook("session1", "session", []))
      
      const continuationHooks = registry.getHooksByTier("continuation")
      
      expect(continuationHooks.length).toBe(2)
      expect(continuationHooks.every(h => h.tier === "continuation")).toBe(true)
    })

    it("should return hooks sorted by priority within tier", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("low", "continuation", [], 100))
      registry.register(createMockHook("high", "continuation", [], 1))
      registry.register(createMockHook("mid", "continuation", [], 50))
      
      const continuationHooks = registry.getHooksByTier("continuation")
      
      expect(String(continuationHooks[0].name)).toBe("high")
      expect(String(continuationHooks[1].name)).toBe("mid")
      expect(String(continuationHooks[2].name)).toBe("low")
    })

    it("should only return enabled hooks", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("enabled", "continuation", [], 0, true))
      registry.register(createMockHook("disabled", "continuation", [], 0, false))
      
      const continuationHooks = registry.getHooksByTier("continuation")
      
      expect(continuationHooks.length).toBe(1)
      expect(String(continuationHooks[0].name)).toBe("enabled")
    })

    it("should work for all tier types", () => {
      const registry = createHookRegistry()
      const tiers: HookTier[] = ["continuation", "session", "tool-guard", "transform", "skill"]
      
      for (const tier of tiers) {
        registry.register(createMockHook(`hook-${tier}` as HookName, tier, []))
      }
      
      for (const tier of tiers) {
        const hooks = registry.getHooksByTier(tier)
        expect(hooks.length).toBe(1)
        expect(hooks[0].tier).toBe(tier)
      }
    })
  })

  describe("HookRegistry.getHooksForEvent", () => {
    it("should return empty array when no hooks match event", () => {
      const registry = createHookRegistry()
      registry.register(createMockHook("hook", "continuation", ["session.idle"]))
      
      const hooks = registry.getHooksForEvent("session.error")
      
      expect(hooks).toEqual([])
    })

    it("should return hooks that listen to the event", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("idle-hook", "continuation", ["session.idle"]))
      registry.register(createMockHook("error-hook", "continuation", ["session.error"]))
      registry.register(createMockHook("both-hook", "continuation", ["session.idle", "session.error"]))
      
      const idleHooks = registry.getHooksForEvent("session.idle")
      
      expect(idleHooks.length).toBe(2)
      expect(idleHooks.find(h => String(h.name) === "idle-hook")).toBeDefined()
      expect(idleHooks.find(h => String(h.name) === "both-hook")).toBeDefined()
      expect(idleHooks.find(h => String(h.name) === "error-hook")).toBeUndefined()
    })

    it("should return hooks sorted by tier order", () => {
      const registry = createHookRegistry()
      
      // All listen to session.idle
      registry.register(createMockHook("skill-hook", "skill", ["session.idle"]))
      registry.register(createMockHook("session-hook", "session", ["session.idle"]))
      registry.register(createMockHook("continuation-hook", "continuation", ["session.idle"]))
      
      const hooks = registry.getHooksForEvent("session.idle")
      
      expect(hooks[0].tier).toBe("continuation")
      expect(hooks[1].tier).toBe("session")
      expect(hooks[2].tier).toBe("skill")
    })

    it("should only return enabled hooks", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("enabled", "continuation", ["session.idle"], 0, true))
      registry.register(createMockHook("disabled", "continuation", ["session.idle"], 0, false))
      
      const hooks = registry.getHooksForEvent("session.idle")
      
      expect(hooks.length).toBe(1)
      expect(String(hooks[0].name)).toBe("enabled")
    })

    it("should handle hooks with multiple event types", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("multi-hook", "continuation", [
        "session.idle",
        "session.error",
        "session.deleted",
      ]))
      
      const idleHooks = registry.getHooksForEvent("session.idle")
      const errorHooks = registry.getHooksForEvent("session.error")
      const deletedHooks = registry.getHooksForEvent("session.deleted")
      
      expect(idleHooks.length).toBe(1)
      expect(errorHooks.length).toBe(1)
      expect(deletedHooks.length).toBe(1)
    })

    it("should handle all event types", () => {
      const registry = createHookRegistry()
      const eventTypes: HookEventType[] = [
        "session.idle",
        "session.deleted",
        "session.compacted",
        "session.error",
        "tool.execute.before",
        "tool.execute.after",
        "chat.message",
        "chat.headers",
        "chat.params",
        "event",
      ]
      
      for (const eventType of eventTypes) {
        registry.register(createMockHook(`hook-${eventType}` as HookName, "continuation", [eventType]))
      }
      
      for (const eventType of eventTypes) {
        const hooks = registry.getHooksForEvent(eventType)
        expect(hooks.length).toBe(1)
        expect(hooks[0].eventTypes).toContain(eventType)
      }
    })
  })

  // ============================================================
  // INTEGRATION TESTS
  // ============================================================

  describe("Integration", () => {
    it("should handle complete hook lifecycle", () => {
      const registry = createHookRegistry()
      
      // Register multiple hooks
      registry.register(createMockHook("atlas", "continuation", ["session.idle"], 0))
      registry.register(createMockHook("todo-enforcer", "continuation", ["session.idle"], 1))
      registry.register(createMockHook("session-recovery", "continuation", ["session.error"], 0))
      registry.register(createMockHook("agent-reminder", "session", ["session.idle"], 0))
      registry.register(createMockHook("rules-injector", "tool-guard", ["tool.execute.before"], 0))
      
      // Get all enabled hooks
      const allHooks = registry.getEnabledHooks()
      expect(allHooks.length).toBe(5)
      
      // Get by tier
      const continuationHooks = registry.getHooksByTier("continuation")
      expect(continuationHooks.length).toBe(3)
      
      // The todo-enforcer should come AFTER atlas due to higher priority
      expect(String(continuationHooks[0].name)).toBe("atlas")
      expect(String(continuationHooks[1].name)).toBe("session-recovery")
      expect(String(continuationHooks[2].name)).toBe("todo-enforcer")
      
      // Get by event
      const idleHooks = registry.getHooksForEvent("session.idle")
      expect(idleHooks.length).toBe(3)
      
      // Unregister one
      registry.unregister("todo-enforcer")
      expect(registry.getEnabledHooks().length).toBe(4)
    })

    it("should maintain correct order across operations", () => {
      const registry = createHookRegistry()
      
      // Register in random order
      registry.register(createMockHook("c", "continuation", [], 1))
      registry.register(createMockHook("a", "skill", [], 1))
      registry.register(createMockHook("b", "session", [], 1))
      
      let hooks = registry.getEnabledHooks()
      expect(String(hooks[0].name)).toBe("c") // continuation (tier 1)
      expect(String(hooks[1].name)).toBe("b") // session (tier 2)
      expect(String(hooks[2].name)).toBe("a") // skill (tier 5)
      
      // Add more hooks
      registry.register(createMockHook("d", "tool-guard", [], 1))
      registry.register(createMockHook("e", "transform", [], 1))
      
      hooks = registry.getEnabledHooks()
      expect(String(hooks[0].name)).toBe("c") // continuation
      expect(String(hooks[1].name)).toBe("b") // session
      expect(String(hooks[2].name)).toBe("d") // tool-guard
      expect(String(hooks[3].name)).toBe("e") // transform
      expect(String(hooks[4].name)).toBe("a") // skill
      
      // Unregister middle hook
      registry.unregister("b")
      
      hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(4)
      expect(String(hooks[0].name)).toBe("c")
      expect(String(hooks[1].name)).toBe("d")
      expect(String(hooks[2].name)).toBe("e")
      expect(String(hooks[3].name)).toBe("a")
    })

    it("should handle priority ties within tiers", () => {
      const registry = createHookRegistry()
      
      // Same tier, same priority
      registry.register(createMockHook("hook-a", "continuation", [], 5))
      registry.register(createMockHook("hook-b", "continuation", [], 5))
      registry.register(createMockHook("hook-c", "continuation", [], 5))
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(3)
      
      // All should have same tier
      expect(hooks.every(h => h.tier === "continuation")).toBe(true)
      expect(hooks.every(h => h.priority === 5)).toBe(true)
    })
  })

  // ============================================================
  // PERFORMANCE TESTS
  // ============================================================

  describe("Performance", () => {
    it("should handle many hooks efficiently", () => {
      const registry = createHookRegistry()
      const start = Date.now()
      
      // Register 100 hooks
      for (let i = 0; i < 100; i++) {
        const tier = (["continuation", "session", "tool-guard", "transform", "skill"] as HookTier[])[i % 5]
        registry.register(createMockHook(`hook-${i}` as HookName, tier, [], i))
      }
      
      const hooks = registry.getEnabledHooks()
      const elapsed = Date.now() - start
      
      expect(hooks.length).toBe(100)
      expect(elapsed).toBeLessThan(50) // Should be fast
    })

    it("should sort efficiently despite registration order", () => {
      const registry = createHookRegistry()
      
      // Register in worst-case order (reverse)
      registry.register(createMockHook("skill", "skill", [], 0))
      registry.register(createMockHook("transform", "transform", [], 0))
      registry.register(createMockHook("tool-guard", "tool-guard", [], 0))
      registry.register(createMockHook("session", "session", [], 0))
      registry.register(createMockHook("continuation", "continuation", [], 0))
      
      const start = Date.now()
      const hooks = registry.getEnabledHooks()
      const elapsed = Date.now() - start
      
      expect(hooks[0].tier).toBe("continuation")
      expect(hooks[4].tier).toBe("skill")
      expect(elapsed).toBeLessThan(10)
    })

    it("should handle frequent get operations", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("hook", "continuation", ["session.idle"]))
      
      const start = Date.now()
      
      for (let i = 0; i < 1000; i++) {
        registry.getEnabledHooks()
        registry.getHooksByTier("continuation")
        registry.getHooksForEvent("session.idle")
      }
      
      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(100)
    })
  })

  // ============================================================
  // EDGE CASES
  // ============================================================

  describe("Edge Cases", () => {
    it("should handle hook with empty event types", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("empty-events", "continuation", []))
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(1)
      expect(hooks[0].eventTypes).toEqual([])
      
      // Should not match any event
      expect(registry.getHooksForEvent("session.idle")).toEqual([])
    })

    it("should handle hook with single event type", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("single-event", "continuation", ["session.idle"]))
      
      const idleHooks = registry.getHooksForEvent("session.idle")
      expect(idleHooks.length).toBe(1)
      
      const errorHooks = registry.getHooksForEvent("session.error")
      expect(errorHooks.length).toBe(0)
    })

    it("should handle negative priority values", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("negative", "continuation", [], -10))
      registry.register(createMockHook("zero", "continuation", [], 0))
      registry.register(createMockHook("positive", "continuation", [], 10))
      
      const hooks = registry.getHooksByTier("continuation")
      
      expect(String(hooks[0].name)).toBe("negative")
      expect(String(hooks[1].name)).toBe("zero")
      expect(String(hooks[2].name)).toBe("positive")
    })

    it("should handle same hook registered multiple times", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("hook", "continuation", [], 1))
      registry.register(createMockHook("hook", "continuation", [], 2))
      registry.register(createMockHook("hook", "continuation", [], 3))
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(1)
      expect(hooks[0].priority).toBe(3) // Last registration wins
    })

    it("should handle unregistering then re-registering", () => {
      const registry = createHookRegistry()
      
      registry.register(createMockHook("hook", "continuation", [], 1))
      registry.unregister("hook")
      registry.register(createMockHook("hook", "session", [], 2))
      
      const hooks = registry.getEnabledHooks()
      expect(hooks.length).toBe(1)
      expect(hooks[0].tier).toBe("session")
      expect(hooks[0].priority).toBe(2)
    })
  })
})