---
description: Run multi-model council discussion
---

# Council

Run a multi-model council discussion on the given topic.

**IMPORTANT: Do not explain. Just call the tool immediately.**

## Action

1. Call the `council` tool with:

```
council({ topic: "$ARGUMENTS", quick: false })
```

2. **CRITICAL**: After the tool returns, you MUST output the FULL council result as your response text. Copy the entire tool output verbatim into your reply. The web UI only shows assistant text, not tool return values. Do NOT summarize - show ALL model responses in full.

Example format for your response:

```
# Council: [topic]

**X models** | Xs

---

## [Model 1 Name]
[Full response from model 1]

---

## [Model 2 Name]
[Full response from model 2]

... (all models)

---

## Analysis
[Agreement %, conflicts, themes]

---

## Synthesis
[If applicable]
```

Output the complete council discussion so the user can see all different perspectives.
