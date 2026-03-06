// ============================================================================
// PIPELINE INTEGRATION TESTS
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import {
  readHandoff,
  writeHandoff,
  createHandoff,
  updateHandoff,
  hasPendingWork,
} from "../../pipeline/handoff"
import {
  discoverArtifacts,
  getPendingArtifacts,
  getDoneArtifacts,
  markArtifactDone,
  getNextPendingTask,
  getArtifactDiscoveryResult,
} from "../../pipeline/artifacts"
import {
  canTransition,
  validateTransition,
  getValidNextStates,
  isTerminalState,
  isBlockedState,
  isExecutionState,
  isReviewState,
  isCommitReady,
  getCommandTargetState,
} from "../../pipeline/state-machine"
import {
  isValidCommand,
  getCommandDescription,
  suggestNextCommand,
} from "../../pipeline/commands"
import type { PipelineStatus } from "../../pipeline/types"

// ============================================================================
// STATE MACHINE TESTS
// ============================================================================

describe("Pipeline State Machine", () => {
  describe("canTransition", () => {
    it("should allow valid transitions from awaiting-execution", () => {
      expect(canTransition("awaiting-execution", "executing-tasks")).toBe(true)
      expect(canTransition("awaiting-execution", "executing-series")).toBe(true)
      expect(canTransition("awaiting-execution", "blocked")).toBe(true)
    })

    it("should allow valid transitions from executing-tasks", () => {
      expect(canTransition("executing-tasks", "awaiting-review")).toBe(true)
      expect(canTransition("executing-tasks", "executing-tasks")).toBe(true)
      expect(canTransition("executing-tasks", "blocked")).toBe(true)
    })

    it("should allow valid transitions from awaiting-review", () => {
      expect(canTransition("awaiting-review", "awaiting-fixes")).toBe(true)
      expect(canTransition("awaiting-review", "ready-to-commit")).toBe(true)
    })

    it("should allow valid transitions from ready-to-commit", () => {
      expect(canTransition("ready-to-commit", "ready-for-pr")).toBe(true)
      expect(canTransition("ready-to-commit", "blocked")).toBe(true)
    })

    it("should reject invalid transitions", () => {
      expect(canTransition("awaiting-execution", "pr-open")).toBe(false)
      expect(canTransition("pr-open", "awaiting-execution")).toBe(false)
      expect(canTransition("ready-for-pr", "awaiting-execution")).toBe(false)
    })

    it("should allow recovery from blocked state", () => {
      expect(canTransition("blocked", "awaiting-execution")).toBe(true)
      expect(canTransition("blocked", "executing-tasks")).toBe(true)
      expect(canTransition("blocked", "awaiting-review")).toBe(true)
    })

    it("should reject all transitions from terminal state", () => {
      expect(canTransition("pr-open", "awaiting-execution")).toBe(false)
      expect(canTransition("pr-open", "blocked")).toBe(false)
    })
  })

  describe("validateTransition", () => {
    it("should return success for valid transition", () => {
      const result = validateTransition("awaiting-execution", "executing-tasks")
      expect(result.success).toBe(true)
      expect(result.from).toBe("awaiting-execution")
      expect(result.to).toBe("executing-tasks")
      expect(result.error).toBeUndefined()
    })

    it("should return failure for invalid transition", () => {
      const result = validateTransition("awaiting-execution", "pr-open")
      expect(result.success).toBe(false)
      expect(result.error).toContain("Invalid transition")
    })
  })

  describe("getValidNextStates", () => {
    it("should return valid next states for awaiting-execution", () => {
      const states = getValidNextStates("awaiting-execution")
      expect(states).toContain("executing-tasks")
      expect(states).toContain("executing-series")
      expect(states).toContain("blocked")
    })

    it("should return empty array for terminal state", () => {
      const states = getValidNextStates("pr-open")
      expect(states).toEqual([])
    })
  })

  describe("isTerminalState", () => {
    it("should identify pr-open as terminal", () => {
      expect(isTerminalState("pr-open")).toBe(true)
    })

    it("should not identify other states as terminal", () => {
      expect(isTerminalState("awaiting-execution")).toBe(false)
      expect(isTerminalState("ready-to-commit")).toBe(false)
    })
  })

  describe("isBlockedState", () => {
    it("should identify blocked state", () => {
      expect(isBlockedState("blocked")).toBe(true)
      expect(isBlockedState("awaiting-execution")).toBe(false)
    })
  })

  describe("isExecutionState", () => {
    it("should identify execution states", () => {
      expect(isExecutionState("executing-tasks")).toBe(true)
      expect(isExecutionState("executing-series")).toBe(true)
      expect(isExecutionState("awaiting-execution")).toBe(false)
    })
  })

  describe("isReviewState", () => {
    it("should identify review states", () => {
      expect(isReviewState("awaiting-review")).toBe(true)
      expect(isReviewState("awaiting-fixes")).toBe(true)
      expect(isReviewState("awaiting-re-review")).toBe(true)
      expect(isReviewState("awaiting-execution")).toBe(false)
    })
  })

  describe("isCommitReady", () => {
    it("should identify commit-ready states", () => {
      expect(isCommitReady("ready-to-commit")).toBe(true)
      expect(isCommitReady("ready-for-pr")).toBe(true)
      expect(isCommitReady("awaiting-review")).toBe(false)
    })
  })

  describe("getCommandTargetState", () => {
    it("should return target state for known commands", () => {
      expect(getCommandTargetState("/planning")).toBe("awaiting-execution")
      expect(getCommandTargetState("/execute")).toBe("executing-tasks")
      expect(getCommandTargetState("/code-loop")).toBe("ready-to-commit")
      expect(getCommandTargetState("/commit")).toBe("ready-for-pr")
    })

    it("should return undefined for unknown commands", () => {
      expect(getCommandTargetState("/unknown")).toBeUndefined()
    })
  })
})

// ============================================================================
// HANDOFF FILE I/O TESTS
// ============================================================================

describe("Handoff File I/O", () => {
  const testDir = join(process.cwd(), ".test-handoff-io")
  const contextDir = join(testDir, ".agents", "context")

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
    mkdirSync(contextDir, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
  })

  describe("readHandoff", () => {
    it("should return null for missing handoff file", () => {
      const handoff = readHandoff(testDir)
      expect(handoff).toBeNull()
    })

    it("should read handoff with basic fields", () => {
      const content = `# Pipeline Handoff
<!-- Auto-updated by pipeline commands. Read by /prime. Do not edit manually. -->

- **Last Command**: /execute
- **Feature**: test-feature
- **Next Command**: /code-loop test-feature
- **Timestamp**: 2026-03-06T12:00:00Z
- **Status**: awaiting-review
`
      writeFileSync(join(contextDir, "next-command.md"), content, "utf-8")

      const handoff = readHandoff(testDir)
      expect(handoff).not.toBeNull()
      expect(handoff?.lastCommand).toBe("/execute")
      expect(handoff?.feature).toBe("test-feature")
      expect(handoff?.nextCommand).toBe("/code-loop test-feature")
      expect(handoff?.status).toBe("awaiting-review")
    })

    it("should read handoff with task progress", () => {
      const content = `# Pipeline Handoff
- **Last Command**: /execute
- **Feature**: test-feature
- **Next Command**: /execute
- **Task Progress**: 2/5 complete
- **Status**: executing-tasks
- **Timestamp**: 2026-03-06T12:00:00Z
`
      writeFileSync(join(contextDir, "next-command.md"), content, "utf-8")

      const handoff = readHandoff(testDir)
      expect(handoff?.taskProgress).toEqual({ completed: 2, total: 5 })
    })

    it("should read handoff with task index", () => {
      const content = `# Pipeline Handoff
- **Last Command**: /planning
- **Feature**: auth-system
- **Next Command**: /execute
- **Status**: awaiting-execution

## Task Index

| Task | Brief Path | Scope | Status | Files |
|------|-----------|-------|--------|-------|
| 1 | \`task-1.md\` | Sync models | done | 1 modified |
| 2 | \`task-2.md\` | Fix config | pending | - |
`
      writeFileSync(join(contextDir, "next-command.md"), content, "utf-8")

      const handoff = readHandoff(testDir)
      expect(handoff?.taskIndex).toBeDefined()
      expect(handoff?.taskIndex?.length).toBe(2)
      expect(handoff?.taskIndex?.[0].task).toBe(1)
      expect(handoff?.taskIndex?.[0].status).toBe("done")
      expect(handoff?.taskIndex?.[1].status).toBe("pending")
    })
  })

  describe("writeHandoff", () => {
    it("should write handoff with basic fields", () => {
      const handoff = createHandoff("auth-system", "/planning", "/execute")
      
      const success = writeHandoff(testDir, handoff)
      expect(success).toBe(true)
      
      const read = readHandoff(testDir)
      expect(read).not.toBeNull()
      expect(read?.feature).toBe("auth-system")
      expect(read?.status).toBe("awaiting-execution")
    })

    it("should create context directory if missing", () => {
      // Remove context dir
      rmSync(contextDir, { recursive: true })
      
      const handoff = createHandoff("test", "/planning", "/execute")
      const success = writeHandoff(testDir, handoff)
      
      expect(success).toBe(true)
      expect(existsSync(join(contextDir, "next-command.md"))).toBe(true)
    })

    it("should update timestamp on write", () => {
      const handoff1 = createHandoff("test", "/planning", "/execute")
      writeHandoff(testDir, handoff1)
      
      const before = readHandoff(testDir)?.timestamp
      
      // Wait a bit
      const start = Date.now()
      while (Date.now() - start < 10) {}
      
      const handoff2 = updateHandoff(handoff1, { status: "executing-tasks" })
      writeHandoff(testDir, handoff2)
      
      const after = readHandoff(testDir)?.timestamp
      
      expect(after).not.toBe(before)
    })
  })

  describe("hasPendingWork", () => {
    it("should return false for null handoff", () => {
      expect(hasPendingWork(null)).toBe(false)
    })

    it("should return false for terminal state", () => {
      const handoff = createHandoff("test", "/pr", "/pr")
      handoff.status = "pr-open"
      expect(hasPendingWork(handoff)).toBe(false)
    })

    it("should return true for non-terminal state", () => {
      const handoff = createHandoff("test", "/planning", "/execute")
      expect(hasPendingWork(handoff)).toBe(true)
    })
  })
})

// ============================================================================
// ARTIFACT DISCOVERY TESTS
// ============================================================================

describe("Artifact Discovery", () => {
  const testDir = join(process.cwd(), ".test-artifacts")
  const feature = "test-feature"

  beforeEach(() => {
    const featureDir = join(testDir, ".agents", "features", feature)
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
    mkdirSync(featureDir, { recursive: true })
    
    // Create test artifacts
    writeFileSync(join(featureDir, "plan.md"), "", "utf-8")
    writeFileSync(join(featureDir, "task-1.md"), "", "utf-8")
    writeFileSync(join(featureDir, "task-2.done.md"), "", "utf-8")
    writeFileSync(join(featureDir, "report.md"), "", "utf-8")
    writeFileSync(join(featureDir, "review.done.md"), "", "utf-8")
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true })
    }
  })

  describe("discoverArtifacts", () => {
    it("should discover all artifacts", () => {
      const artifacts = discoverArtifacts(testDir, feature)
      expect(artifacts.length).toBe(5)
    })

    it("should classify pending artifacts", () => {
      const artifacts = discoverArtifacts(testDir, feature)
      const pending = getPendingArtifacts(artifacts)
      
      expect(pending.length).toBe(3)
      expect(pending.find(a => a.name === "plan")?.status).toBe("pending")
      expect(pending.find(a => a.name === "task-1")?.status).toBe("pending")
      expect(pending.find(a => a.name === "report")?.status).toBe("pending")
    })

    it("should classify done artifacts", () => {
      const artifacts = discoverArtifacts(testDir, feature)
      const done = getDoneArtifacts(artifacts)
      
      expect(done.length).toBe(2)
      expect(done.find(a => a.name === "task-2")?.status).toBe("done")
      expect(done.find(a => a.name === "review")?.status).toBe("done")
    })

    it("should return empty for missing feature", () => {
      const artifacts = discoverArtifacts(testDir, "nonexistent")
      expect(artifacts).toEqual([])
    })
  })

  describe("markArtifactDone", () => {
    it("should mark artifact as done", () => {
      const artifacts = discoverArtifacts(testDir, feature)
      const task1 = artifacts.find(a => a.name === "task-1")!
      
      expect(task1.status).toBe("pending")
      
      const success = markArtifactDone(testDir, task1)
      expect(success).toBe(true)
      
      const updated = discoverArtifacts(testDir, feature)
      const task1Updated = updated.find(a => a.name === "task-1")
      expect(task1Updated?.status).toBe("done")
    })

    it("should not fail if already done", () => {
      const artifacts = discoverArtifacts(testDir, feature)
      const task2 = artifacts.find(a => a.name === "task-2")!
      
      expect(task2.status).toBe("done")
      
      const success = markArtifactDone(testDir, task2)
      expect(success).toBe(true)
    })
  })

  describe("getNextPendingTask", () => {
    it("should return next pending task (not plan)", () => {
      const artifacts = discoverArtifacts(testDir, feature)
      const nextTask = getNextPendingTask(artifacts)
      
      expect(nextTask).toBeDefined()
      // getNextPendingTask returns tasks only (type === "task"), not plans
      expect(nextTask?.name).toBe("task-1") // task-1 is pending, task-2 is done
      expect(nextTask?.type).toBe("task")
    })
  })

  describe("getArtifactDiscoveryResult", () => {
    it("should return comprehensive result", () => {
      const result = getArtifactDiscoveryResult(testDir, feature)
      
      expect(result.feature).toBe(feature)
      expect(result.artifacts.length).toBe(5)
      expect(result.pending.length).toBe(3)
      expect(result.done.length).toBe(2)
    })
  })
})

// ============================================================================
// COMMAND REGISTRY TESTS
// ============================================================================

describe("Command Registry", () => {
  describe("isValidCommand", () => {
    it("should validate known commands", () => {
      expect(isValidCommand("planning")).toBe(true)
      expect(isValidCommand("execute")).toBe(true)
      expect(isValidCommand("code-review")).toBe(true)
      expect(isValidCommand("commit")).toBe(true)
    })

    it("should validate commands with slash prefix", () => {
      expect(isValidCommand("/planning")).toBe(true)
      expect(isValidCommand("/execute")).toBe(true)
    })

    it("should reject unknown commands", () => {
      expect(isValidCommand("unknown")).toBe(false)
      expect(isValidCommand("/unknown")).toBe(false)
    })
  })

  describe("getCommandDescription", () => {
    it("should return description for known commands", () => {
      expect(getCommandDescription("/planning")).toContain("planning")
      expect(getCommandDescription("/execute")).toContain("Execute")
    })

    it("should return unknown for unknown commands", () => {
      expect(getCommandDescription("/unknown")).toBe("Unknown command")
    })
  })

  describe("suggestNextCommand", () => {
    it("should suggest execute for awaiting-execution", () => {
      expect(suggestNextCommand("awaiting-execution")).toBe("/execute")
    })

    it("should suggest code-loop for awaiting-review", () => {
      expect(suggestNextCommand("awaiting-review")).toBe("/code-loop")
    })

    it("should suggest commit for ready-to-commit", () => {
      expect(suggestNextCommand("ready-to-commit")).toBe("/commit")
    })

    it("should suggest pr for ready-for-pr", () => {
      expect(suggestNextCommand("ready-for-pr")).toBe("/pr")
    })

    it("should return null for terminal state", () => {
      expect(suggestNextCommand("pr-open")).toBeNull()
    })

    it("should return null for blocked state", () => {
      expect(suggestNextCommand("blocked")).toBeNull()
    })
  })
})