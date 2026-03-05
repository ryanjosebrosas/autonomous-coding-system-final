/**
 * Agent Usage Reminder Hook Constants
 */

/**
 * Hook name for logging.
 */
export const HOOK_NAME = "agent-usage-reminder"

/**
 * Tools that should trigger a reminder about agent usage.
 */
export const TARGET_TOOLS = new Set([
  "explore",
  "librarian",
  "oracle",
  "metis",
  "momus",
  "council",
])

/**
 * Tools that indicate the agent is already using agents.
 */
export const AGENT_TOOLS = new Set([
  "task",
  "dispatch",
  "call_omo_agent",
])

/**
 * Reminder message shown to agents.
 */
export const REMINDER_MESSAGE = `

## <system-reminder>
**Agent Delegation Reminder**

You have access to specialized agents for complex tasks. Consider using them:

- **explore** - Free: Contextual grep for codebase patterns
- **librarian** - Cheap: External docs and OSS implementation search
- **oracle** - Expensive: Architecture decisions and debugging
- **metis** - Expensive: Pre-planning analysis
- **momus** - Expensive: Plan review

**Default Bias: DELEGATE. Work yourself only when it is SUPER SIMPLE.**

Example:
\`\`\`typescript
// Contextual Grep (internal)
task(subagent_type="explore", run_in_background=true, prompt="Find auth patterns")

// Reference Grep (external)
task(subagent_type="librarian", run_in_background=true, prompt="Find Express auth patterns")
\`\`\`
</system-reminder>
`