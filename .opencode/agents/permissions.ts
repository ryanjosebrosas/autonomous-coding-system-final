// ============================================================================
// PERMISSION CONFIGURATION
// ============================================================================

import type { AgentName } from "./registry"

// ============================================================================
// PERMISSION LEVEL TYPES
// ============================================================================

export type PermissionLevel = "full" | "full-no-task" | "read-only" | "vision-only"

export interface DetailedPermissions {
  // File operations
  readFile: boolean
  writeFile: boolean
  editFile: boolean
  
  // Command operations
  bash: boolean
  grep: boolean
  glob: boolean
  
  // Agent operations
  task: boolean           // Can delegate to other agents
  call_omo_agent: boolean // Can call OMO agent APIs
  
  // LSP operations
  lsp_goto_definition: boolean
  lsp_find_references: boolean
  lsp_symbols: boolean
  lsp_diagnostics: boolean
  
  // MCP operations
  archon_mcp: boolean
  webfetch: boolean
  websearch: boolean
}

// ============================================================================
// PERMISSION PRESETS (EXTENDED)
// ============================================================================

export const PERMISSION_PRESETS: Record<PermissionLevel, DetailedPermissions> = {
  full: {
    readFile: true,
    writeFile: true,
    editFile: true,
    bash: true,
    grep: true,
    glob: true,
    task: true,
    call_omo_agent: true,
    lsp_goto_definition: true,
    lsp_find_references: true,
    lsp_symbols: true,
    lsp_diagnostics: true,
    archon_mcp: true,
    webfetch: true,
    websearch: true,
  },
  
  "full-no-task": {
    readFile: true,
    writeFile: true,
    editFile: true,
    bash: true,
    grep: true,
    glob: true,
    task: false, // BLOCKED: Cannot delegate
    call_omo_agent: false,
    lsp_goto_definition: true,
    lsp_find_references: true,
    lsp_symbols: true,
    lsp_diagnostics: true,
    archon_mcp: true,
    webfetch: true,
    websearch: true,
  },
  
  "read-only": {
    readFile: true,
    writeFile: false,
    editFile: false,
    bash: false,
    grep: true,
    glob: true,
    task: false,
    call_omo_agent: false,
    lsp_goto_definition: true,
    lsp_find_references: true,
    lsp_symbols: true,
    lsp_diagnostics: true,
    archon_mcp: true,
    webfetch: true,
    websearch: true,
  },
  
  "vision-only": {
    readFile: false,
    writeFile: false,
    editFile: false,
    bash: false,
    grep: false,
    glob: false,
    task: false,
    call_omo_agent: false,
    lsp_goto_definition: false,
    lsp_find_references: false,
    lsp_symbols: false,
    lsp_diagnostics: false,
    archon_mcp: false,
    webfetch: false,
    websearch: false,
  },
}

// ============================================================================
// AGENT PERMISSION MAPPING
// ============================================================================

export const AGENT_PERMISSIONS: Record<AgentName, PermissionLevel> = {
  sisyphus: "full",
  hephaestus: "full",
  atlas: "full-no-task", // Can modify but cannot delegate
  prometheus: "read-only",
  oracle: "read-only",
  metis: "read-only",
  momus: "read-only",
  "sisyphus-junior": "full-no-task",
  librarian: "read-only",
  explore: "read-only",
  "multimodal-looker": "vision-only",
}

// ============================================================================
// PERMISSION CHECK FUNCTIONS
// ============================================================================

/**
 * Get the permission level for an agent.
 */
export function getPermissionLevel(agentName: AgentName): PermissionLevel {
  return AGENT_PERMISSIONS[agentName] || "read-only"
}

/**
 * Get detailed permissions for an agent.
 */
export function getPermissions(agentName: AgentName): DetailedPermissions {
  const level = getPermissionLevel(agentName)
  return PERMISSION_PRESETS[level]
}

/**
 * Check if an agent can use a specific tool.
 */
export function canUseTool(agentName: AgentName, toolName: string): boolean {
  const permissions = getPermissions(agentName)
  
  const toolPermissionMap: Record<string, keyof DetailedPermissions> = {
    // File operations
    read: "readFile",
    write: "writeFile",
    edit: "editFile",
    Write: "writeFile",
    Edit: "editFile",
    
    // Command operations
    bash: "bash",
    grep: "grep",
    glob: "glob",
    
    // Agent operations
    task: "task",
    dispatch: "task",
    "call_omo_agent": "call_omo_agent",
    
    // LSP operations
    lsp_goto_definition: "lsp_goto_definition",
    lsp_find_references: "lsp_find_references",
    lsp_symbols: "lsp_symbols",
    lsp_diagnostics: "lsp_diagnostics",
    
    // MCP operations
    archon_health_check: "archon_mcp",
    archon_rag_search_knowledge_base: "archon_mcp",
    archon_find_projects: "archon_mcp",
    webfetch: "webfetch",
    "web-reader_webReader": "webfetch",
    "web-search-prime_webSearchPrime": "websearch",
  }
  
  const permission = toolPermissionMap[toolName]
  if (!permission) return true // Unknown tools default to allowed
  
  return permissions[permission]
}

/**
 * Get list of denied tools for an agent.
 */
export function getDeniedToolsList(agentName: AgentName): string[] {
  const permissions = getPermissions(agentName)
  const denied: string[] = []
  
  if (!permissions.writeFile) denied.push("Write")
  if (!permissions.editFile) denied.push("Edit")
  if (!permissions.bash) denied.push("bash")
  if (!permissions.task) denied.push("task")
  if (!permissions.archon_mcp) denied.push("archon_*")
  if (!permissions.webfetch) denied.push("webfetch", "web-reader_*")
  if (!permissions.websearch) denied.push("web-search-*")
  
  return denied
}

/**
 * Check if agent is read-only.
 */
export function isReadOnly(agentName: AgentName): boolean {
  const permissions = getPermissions(agentName)
  return !permissions.writeFile && !permissions.editFile
}

/**
 * Check if agent can delegate.
 */
export function canDelegate(agentName: AgentName): boolean {
  const permissions = getPermissions(agentName)
  return permissions.task
}

// ============================================================================
// PERMISSION ENFORCEMENT HELPER
// ============================================================================

/**
 * Validate that a tool call is permitted for an agent.
 * Throws an error if permission is denied.
 */
export function enforcePermission(agentName: AgentName, toolName: string): void {
  if (!canUseTool(agentName, toolName)) {
    const level = getPermissionLevel(agentName)
    throw new Error(
      `Agent ${agentName} (${level}) is not permitted to use tool: ${toolName}. ` +
      `Denied tools: ${getDeniedToolsList(agentName).join(", ")}`
    )
  }
}

/**
 * Filter available tools for an agent.
 */
export function filterAvailableTools(
  agentName: AgentName,
  allTools: string[]
): { allowed: string[], denied: string[] } {
  const allowed: string[] = []
  const denied: string[] = []
  
  for (const tool of allTools) {
    if (canUseTool(agentName, tool)) {
      allowed.push(tool)
    } else {
      denied.push(tool)
    }
  }
  
  return { allowed, denied }
}