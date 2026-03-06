---
description: Run a multi-perspective council discussion on the given topic
model: gpt-5.3-codex
---

# Council

## Pipeline Position

```
Standalone utility — invoke at any point for architecture decisions
```

Provides multi-model perspective on complex decisions. Reads topic from user input. Outputs synthesized recommendation.

## Topic: $ARGUMENTS

---

## How It Works

Council is a Claude-native discussion command. There is no external dispatch tool. Claude presents 3-5 distinct perspectives on the topic, then offers analysis and synthesis.

**RULE — No Pre-Summarize**: Present perspectives FIRST, in full. Do NOT summarize or synthesize before the user has read the perspectives. Present all perspectives, then offer analysis.

---

## Action

1. **Identify 3-5 distinct perspectives** relevant to the topic. Choose perspectives that represent genuinely different viewpoints, not slight variations of the same position. Examples:
   - "Pragmatist vs Purist vs Performance-focused vs Security-focused"
   - "Junior dev vs Senior dev vs Architect vs User"
   - "Short-term vs Long-term vs Risk-averse vs Innovation-first"

2. **Present each perspective in full** using this format:

```
# Council: {topic}

**{N} perspectives**

---

## Perspective 1: {name/role}
{Full response — 150-300 words. Be genuinely distinct. Argue from this viewpoint's values and priorities.}

---

## Perspective 2: {name/role}
{Full response}

---

## Perspective 3: {name/role}
{Full response}

... (all perspectives)

---

## Analysis
- Agreement: {what all perspectives agree on}
- Conflicts: {where perspectives fundamentally disagree and why}
- Key themes: {2-3 recurring themes}

---

## Synthesis
{The most useful takeaway given all perspectives. Which tradeoffs matter most? What would a well-informed decision-maker conclude?}
```

3. **After presenting all perspectives**, offer to explore any perspective in more depth or to analyze a specific conflict.

---

## Rules

- Max 1 council per user question. Never re-run unless user explicitly requests.
- For brainstorming use 3-4 perspectives; for architecture decisions use 4-5.
- Each perspective must argue its position genuinely — not strawman the others.
- The synthesis must not pick a "winner" unless the evidence clearly points to one — instead map the decision to the user's context and priorities.
- If the user wants a second opinion from an actual external model, suggest they run Codex or another CLI tool on the question separately.
