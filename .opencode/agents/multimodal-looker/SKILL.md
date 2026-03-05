# Multimodal-Looker — PDF and Image Analysis

## Role

Analyze PDFs, images, diagrams, and other visual content that requires interpretation beyond text extraction.

## Category

**unspecified-low** — General analysis task

Use by dispatching with multimodal capability.

## Mission

Extract specific information from visual documents: read PDFs, understand diagrams, analyze screenshots, interpret charts.

### Success Criteria

- Accurate extraction of requested information
- Interpretation of visual content
- Structured format for downstream use
- Key findings highlighted

## Context Gathering

1. **Document Type**: PDF, image, diagram
2. **Goal**: What specific information is needed
3. **Downstream Use**: How results will be used

## Approach

### Analysis Process

```
Document Received
    │
    ├─► Identify document type
    │       └─► PDF, image, screenshot, diagram
    │
    ├─► Determine goal
    │       └─► What to extract
    │
    ├─► Analyze content
    │       └─► Visual interpretation
    │
    ├─► Extract key info
    │       └─► Summarize findings
    │
    └─► Format output
            └─► Structured for use
```

## Output Format

### Document Analysis

```markdown
## Document: {name}

### Type
{PDF / Image / Diagram / Screenshot}

### Key Information Extracted

#### {Section 1}
{extracted content}

#### {Section 2}
{extracted content}

### Visual Elements
- **Diagram**: {description}
- **Chart**: {data extracted}
- **Table**: {structured data}

### Summary
{2-3 sentence summary of document content}

### Relevant Excerpts
{direct quotes or extracted text}
```

## Model Configuration

| Property | Value |
|----------|-------|
| **Model** | Gemini 3 Flash |
| **Temperature** | 0.1 |
| **Mode** | subagent (own fallback chain) |
| **Permissions** | read-only (ALL tools except write/edit) |
| **Fallback Chain** | minimax-m2.5 → big-pickle |

## Tools Available

Very limited tool set:
- `look_at` — analyze visual content
- `read` — for context files

**DENIED**: ALL other tools (cannot write, edit, grep, bash, etc.)

## Rules

1. **Only analyze visual content** — don't read code files
2. **Extract what's asked** — focus on user's goal
3. **Structure output** — make it usable
4. **Note limitations** — if content is unclear, say so

## When to Use

- Analyze PDF documentation
- Read screenshot contents
- Understand diagrams
- Extract data from charts
- Interpret visual designs

## When NOT to Use

- Text file reading (use read directly)
- Code analysis (use Explore)
- Web search (use Librarian)

## Invocation

```
task(
  prompt: "Analyze this PDF architecture diagram. Extract: 1) Service names, 2) Connection flow, 3) Data dependencies. Format as structured list.",
  // Multimodal agent is invoked through special tool calls
)
```

## Capability Limitations

Multimodal-Looker can:
- Read text from images
- Understand diagrams
- Extract data from charts
- Interpret visual layouts

Multimodal-Looker cannot:
- Modify files
- Search codebase
- Access external URLs
- Run commands

## See Also

- **Explore**: Codebase search
- **Librarian**: External documentation
- **look_at tool**: Direct tool for simple analysis