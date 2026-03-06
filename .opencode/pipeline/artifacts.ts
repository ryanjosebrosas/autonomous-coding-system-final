// ============================================================================
// PIPELINE ARTIFACT DISCOVERY
// ============================================================================

import { readdirSync, existsSync, renameSync } from "node:fs"
import { join } from "node:path"
import type { ArtifactInfo, ArtifactType, ArtifactDiscoveryResult } from "./types"

const ARTIFACTS_DIR = ".agents/features"

/**
 * Artifact naming patterns.
 * 
 * Each pattern maps to an artifact type and determines completion status
 * based on whether the file ends with `.done.md`.
 */
const ARTIFACT_PATTERNS: Array<{
  pattern: RegExp
  type: ArtifactType
}> = [
  { pattern: /^plan-master$/, type: "plan-master" },
  { pattern: /^plan$/, type: "plan" },
  { pattern: /^plan-phase-(\d+)$/, type: "plan-phase" },
  { pattern: /^task-(\d+)$/, type: "task" },
  { pattern: /^report$/, type: "report" },
  { pattern: /^review$/, type: "review" },
  { pattern: /^review-(\d+)$/, type: "review" },
  { pattern: /^loop-report-(\d+)$/, type: "loop-report" },
  { pattern: /^fixes-(\d+)$/, type: "fixes" },
  { pattern: /^checkpoint-(\d+)$/, type: "checkpoint" },
]

/**
 * Discover all artifacts for a feature.
 */
export function discoverArtifacts(workspaceDir: string, feature: string): ArtifactInfo[] {
  const featureDir = join(workspaceDir, ARTIFACTS_DIR, feature)
  
  if (!existsSync(featureDir)) {
    return []
  }
  
  const entries: ArtifactInfo[] = []
  
  try {
    const files = readdirSync(featureDir, { withFileTypes: true })
    
    for (const file of files) {
      if (!file.isFile()) continue
      
      // Only process .md files
      if (!file.name.endsWith(".md") && !file.name.endsWith(".done.md")) continue
      
      const artifact = parseArtifactName(file.name, feature, workspaceDir)
      if (artifact) {
        entries.push(artifact)
      }
    }
  } catch (error) {
    console.error(`[pipeline] Failed to discover artifacts for ${feature}:`, error)
    return []
  }
  
  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get pending artifacts (status: "pending").
 */
export function getPendingArtifacts(artifacts: ArtifactInfo[]): ArtifactInfo[] {
  return artifacts.filter(a => a.status === "pending")
}

/**
 * Get completed artifacts (status: "done").
 */
export function getDoneArtifacts(artifacts: ArtifactInfo[]): ArtifactInfo[] {
  return artifacts.filter(a => a.status === "done")
}

/**
 * Mark an artifact as done by renaming from `.md` to `.done.md`.
 * 
 * Returns true if successful, false otherwise.
 */
export function markArtifactDone(workspaceDir: string, artifact: ArtifactInfo): boolean {
  // If already done, nothing to do
  if (artifact.status === "done") {
    return true
  }
  
  const sourcePath = join(workspaceDir, artifact.path)
  const donePath = sourcePath.replace(/\.md$/, ".done.md")
  
  // Check if source exists
  if (!existsSync(sourcePath)) {
    console.error(`[pipeline] Artifact not found: ${sourcePath}`)
    return false
  }
  
  // Check if .done.md already exists (shouldn't happen, but handle gracefully)
  if (existsSync(donePath)) {
    console.warn(`[pipeline] Artifact already marked done: ${donePath}`)
    return true
  }
  
  try {
    renameSync(sourcePath, donePath)
    return true
  } catch (error) {
    console.error(`[pipeline] Failed to mark artifact done:`, error)
    return false
  }
}

/**
 * Mark an artifact as pending by renaming from `.done.md` to `.md`.
 * 
 * Returns true if successful, false otherwise.
 */
export function markArtifactPending(workspaceDir: string, artifact: ArtifactInfo): boolean {
  // If already pending, nothing to do
  if (artifact.status === "pending") {
    return true
  }
  
  const donePath = join(workspaceDir, artifact.path)
  const pendingPath = donePath.replace(/\.done\.md$/, ".md")
  
  // Check if .done.md exists
  if (!existsSync(donePath)) {
    console.error(`[pipeline] Done artifact not found: ${donePath}`)
    return false
  }
  
  try {
    renameSync(donePath, pendingPath)
    return true
  } catch (error) {
    console.error(`[pipeline] Failed to mark artifact pending:`, error)
    return false
  }
}

/**
 * Get the next pending task artifact.
 */
export function getNextPendingTask(artifacts: ArtifactInfo[]): ArtifactInfo | undefined {
  const pending = getPendingArtifacts(artifacts)
  const tasks = pending.filter(a => a.type === "task")
  
  // Sort by task number
  tasks.sort((a, b) => {
    const numA = extractTaskNumber(a.name)
    const numB = extractTaskNumber(b.name)
    return numA - numB
  })
  
  return tasks[0]
}

/**
 * Parse an artifact name from a filename.
 */
function parseArtifactName(
  filename: string, 
  feature: string, 
  _workspaceDir: string
): ArtifactInfo | null {
  // Determine if this is a .done.md file
  const isDone = filename.endsWith(".done.md")
  
  // Extract base name
  const baseName = isDone 
    ? filename.replace(/\.done\.md$/, "") 
    : filename.replace(/\.md$/, "")
  
  // Match against patterns
  for (const { pattern, type } of ARTIFACT_PATTERNS) {
    if (pattern.test(baseName)) {
      return {
        path: join(ARTIFACTS_DIR, feature, filename),
        name: baseName,
        type,
        status: isDone ? "done" : "pending",
        feature,
      }
    }
  }
  
  // Unknown artifact type
  return null
}

/**
 * Extract task number from task name.
 * 
 * Input: "task-1" 
 * Output: 1
 */
function extractTaskNumber(name: string): number {
  const match = name.match(/task-(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Get comprehensive artifact discovery result for a feature.
 */
export function getArtifactDiscoveryResult(
  workspaceDir: string,
  feature: string
): ArtifactDiscoveryResult {
  const artifacts = discoverArtifacts(workspaceDir, feature)
  const pending = getPendingArtifacts(artifacts)
  const done = getDoneArtifacts(artifacts)
  const nextTask = getNextPendingTask(artifacts)
  
  return {
    feature,
    artifacts,
    pending,
    done,
    nextTask,
  }
}

/**
 * Check if all required artifacts for a phase are complete.
 */
export function isPhaseComplete(
  workspaceDir: string,
  feature: string,
  requiredArtifacts: string[]
): boolean {
  const artifacts = discoverArtifacts(workspaceDir, feature)
  const doneNames = new Set(getDoneArtifacts(artifacts).map(a => a.name))
  
  return requiredArtifacts.every(name => doneNames.has(name))
}

/**
 * Get the highest task number from task artifacts.
 */
export function getHighestTaskNumber(artifacts: ArtifactInfo[]): number {
  const tasks = artifacts.filter(a => a.type === "task")
  if (tasks.length === 0) return 0
  
  return Math.max(...tasks.map(t => extractTaskNumber(t.name)))
}

/**
 * Get the next phase number from plan-phase artifacts.
 */
export function getNextPhaseNumber(artifacts: ArtifactInfo[]): number {
  const phases = artifacts.filter(a => a.type === "plan-phase")
  if (phases.length === 0) return 1
  
  const donePhases = getDoneArtifacts(phases)
  if (donePhases.length === 0) return 1
  
  return Math.max(...donePhases.map(p => extractPhaseNumber(p.name))) + 1
}

/**
 * Extract phase number from plan-phase name.
 * 
 * Input: "plan-phase-1"
 * Output: 1
 */
function extractPhaseNumber(name: string): number {
  const match = name.match(/plan-phase-(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Find the first incomplete artifact by type priority.
 * 
 * Priority order: plan > plan-master > task-N > report > review
 */
export function findFirstIncompleteArtifact(
  workspaceDir: string,
  feature: string
): ArtifactInfo | undefined {
  const result = getArtifactDiscoveryResult(workspaceDir, feature)
  
  // Check plan first
  const planPending = result.pending.find(a => a.type === "plan")
  if (planPending) return planPending
  
  // Then plan-master
  const planMasterPending = result.pending.find(a => a.type === "plan-master")
  if (planMasterPending) return planMasterPending
  
  // Then tasks in order
  if (result.nextTask) return result.nextTask
  
  // Then reports
  const reportPending = result.pending.find(a => a.type === "report")
  if (reportPending) return reportPending
  
  // Then reviews
  const reviewPending = result.pending.find(a => a.type === "review")
  if (reviewPending) return reviewPending
  
  // Return first pending if nothing else
  return result.pending[0]
}