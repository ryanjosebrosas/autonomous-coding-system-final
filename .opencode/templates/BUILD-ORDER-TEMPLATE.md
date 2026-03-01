# Build Order — {Project Name}

Generated: {date}
Status: 0/{total} complete

---

## Layer 0: Foundations

- [ ] `01` **{spec-name}** ({light|standard|heavy}) — {1-line purpose}
  - depends: none
  - touches: {files created/modified}
  - acceptance: {concrete test that proves it works}

- [ ] `02` **{spec-name}** ({light|standard|heavy}) — {1-line purpose}
  - depends: 01
  - touches: {files}
  - acceptance: {test}

## Layer 1: Data

- [ ] `03` **{spec-name}** ({light|standard|heavy}) — {1-line purpose}
  - depends: 01, 02
  - touches: {files}
  - acceptance: {test}

## Layer 2: Services

- [ ] `04` **{spec-name}** ({light|standard|heavy}) — {1-line purpose}
  - depends: 02, 03
  - touches: {files}
  - acceptance: {test}

## Layer 3: Interface

- [ ] `05` **{spec-name}** ({light|standard|heavy}) — {1-line purpose}
  - depends: 04
  - touches: {files}
  - acceptance: {test}

## Layer 4: Integration

- [ ] `06` **{spec-name}** ({light|standard|heavy}) — {1-line purpose}
  - depends: 04, 05
  - touches: {files}
  - acceptance: {test}

---

## Complexity Guide

**Every spec gets a 700-1000 line plan regardless of depth.** The depth tag controls the review tier in `/build` Step 7, not plan size.

| Tag | Review Tier | When |
|-----|------------|------|
| `light` | T1-T2 (3 free models) | Scaffolding, config, simple CRUD, well-known patterns |
| `standard` | T1-T3 + consensus (5 free models) | Services, integrations, moderate business logic |
| `heavy` | Full T1-T4 + T5 (5 free + 2 paid) | Core algorithms, AI/ML, complex orchestration |

## Spec Format Reference

Each spec must have:
- **Number** — Sequential, determines default build order within a layer
- **Name** — Short kebab-case identifier
- **Depth tag** — light, standard, or heavy
- **Purpose** — One line describing what this spec delivers
- **depends** — List of spec numbers that must be `[x]` before this can start
- **touches** — Files this spec will create or modify (helps detect conflicts)
- **acceptance** — Concrete, verifiable test that proves the spec is complete
