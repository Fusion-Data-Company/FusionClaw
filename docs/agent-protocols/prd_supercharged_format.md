---
name: PRD Supercharged Format — Rob's PRD spec
description: Supersedes the default prd-generator skill format. When Rob asks for a PRD, this is the format used. Built around a discovery-agent → synthesis → execution → watchdog architecture so the PRD itself contains everything the execution session needs to do maximum verified work. Living spec — refined over time as Rob teaches new patterns.
type: project
originSessionId: 873c8513-c34d-4abc-8c15-b87d084c10da
---
# PRD SUPERCHARGED FORMAT (v1)

## Why this format exists

Rob's complaint about the default prd-generator skill: it produces shallow, single-stage PRDs that look like requirements documents but don't actually accelerate execution. They list features, they don't point the executing agent at concrete things to fix or build.

Rob's insight that drives this format: **the bottleneck isn't fixing — it's discovering what to fix.** A fixing agent can repair anything you point it at. The skill that needs supercharging is *finding the right things to point at*. So the PRD process must be front-loaded with discovery, and the PRD itself becomes a synthesis of discovery findings, organized into verifiable phases.

## The architecture

```
DISCOVERY LAYER         →  PLANNING LAYER     →  EXECUTION LAYER  →  VERIFICATION LAYER
(analytical agents)        (PRD synthesis)        (fixing agent)      (watchdog)

Spawn N agents in           Take findings,        Fix what's          Confirm fixes
parallel, each with a       dedupe, prioritize,   pointed at —        via multi-axis
specific hunt brief.        phase them.           file:line:fix.      scoring ≥90%.
Each returns evidence-      Each task in PRD
backed findings.            traces back to a
                            finding.
```

This is not optional structure — every PRD generated under this format runs all four layers. The discovery layer is what the default skill is missing.

## When to use this format

Whenever Rob asks for a PRD, regardless of whether he says the word "supercharged." The default behavior of the prd-generator skill is overridden by this spec.

The only time to fall back to a simpler format is when Rob explicitly says "give me a quick one-pager" or "I just need bullets." Default to the supercharged version otherwise.

---

## STEP 1 — DISCOVERY (before writing a single section of the PRD)

Before drafting any PRD content, identify which discovery agents are relevant to the project and dispatch them. **Skipping this step produces the default-quality PRDs Rob is tired of receiving.**

### Discovery agent dispatch checklist

For any project of meaningful scope (anything beyond a single component / single feature), spawn at minimum:

- **Code Quality Hunter** — find dated patterns, raw HTML, design token violations
- **Bug Hunter** — find runtime bugs, console errors, broken handlers
- **UX Gap Auditor** — compare current state to a reference (Rob's existing apps, competitor apps, design intent)
- **Substance Gap Detector** — find blueprint-lock-template indicators (fake data, dead handlers, hollow modals)
- **Documentation Reality Agent** — find doc rot
- **Module Audit Agent** (one per page/module) — find per-page issues with a checklist
- **API Contract Auditor** — find auth gaps, response inconsistencies, missing validation
- **Integration Reality Agent** — find claims that don't match runtime
- **Security Discovery Agent** — find secrets, auth bypasses, injection risks
- **Performance Discovery Agent** — find slow renders, bundle bloat, N+1 queries

**Use the templates in `memory/discovery_agent_templates.md` to brief each one.**

### Spawn rules

- **Spawn in parallel** wherever possible (multiple Agent calls in one tool-use block)
- **Each agent gets the watchdog brief loaded too** — they reject the same anti-patterns the watchdog rejects
- **Each agent returns a structured findings report** in the format defined by its template
- **Findings have evidence** — file:line, screenshot, console output, repro steps. No findings without evidence.

### When discovery is finished

You have a pile of findings reports — possibly 50–200 individual findings across all agents. Synthesis is next.

---

## STEP 2 — SYNTHESIS (turn findings into a PRD)

### Deduplicate

Multiple agents may surface the same issue from different angles. Merge:
- Code Quality Hunter says "raw `<div>` instead of GlassCard on /employees header"
- UX Gap Auditor says "/employees page header looks unfinished"
- Module Audit Agent (employees) says "header rendering inconsistent with theinsuranceschool reference"

These are one finding. Merge.

### Prioritize

Use a P0–P3 rubric, applied per finding:
- **P0** — blocks shipping or causes data loss / security incident
- **P1** — visible to users in the first 10 minutes; first impression breaker
- **P2** — visible eventually; trust erosion if unfixed
- **P3** — internal quality only; defer if needed

### Group into phases

Findings in the same area or with shared dependencies group into one phase. Naming convention:
- **Phase 0** is always **Stabilization** — verify what already exists, fix anything broken
- Phases 1–N are feature/quality phases ordered by dependency
- Final phases are launch/post-launch

Each phase has a goal, scope, out-of-scope, user stories, acceptance criteria, technical spec, watchdog verification axes, risks. **Each acceptance criterion traces back to a discovery finding.**

---

## STEP 3 — PRD SECTIONS

Every PRD generated under this format includes these sections, in this order. The default skill's 12 sections are the core; sections 13–20 are the supercharge.

### Core (always present)
1. Executive Summary
2. Project Overview & Positioning
3. Users & Use Cases
4. Functional Requirements
5. Technical Architecture
6. UI/UX Considerations
7. Integration Requirements
8. Security & Compliance
9. Deployment Strategy
10. Timeline & Milestones (NO day estimates — gates instead)
11. Success Metrics
12. Open Questions & Risks

### Supercharge (always present, this is what makes it Rob's format)
13. **Current State Assessment (HONEST)** — confidence rated per item, not aspirational
14. **Substance Gap** vs. reference (competitor / Rob's existing apps / design intent)
15. **Phased Delivery Plan** — full per-phase detail (see structure below)
16. **Watchdog Verification Protocol** — bound to the watchdog brief
17. **Subagent & Team Plan** — which agents handle what (see structure below)
18. **Session Continuity Plan** — how future sessions resume the PRD
19. **Confidence Ledger** — per-section self-rating
20. **Discovery Findings Index** — pointer back to the discovery reports the PRD synthesized

### Per-phase structure (§15 — every phase has these)

```
PHASE N — [name]

Goal. (one paragraph)
Status. (Not Started / In Progress / Complete / Blocked)
Depth. (Full / Medium / Outline)

Scope.
- (bullets)

Out of scope.
- (bullets — what is NOT in this phase)

User stories.
- As [persona], I [action] so I [outcome]. (3–7)

Acceptance criteria.
- [ ] (testable, watchdog-verifiable)

Technical spec.
(architecture, libraries, patterns)

Files affected.
(specific paths)

Dependencies.
(other phases, external prerequisites)

Watchdog verification axes.
- Axis A — [what to verify] — [how to verify]
- Axis B — ...
(at minimum 3, ideally 4–6)

Risks.
| # | Risk | Probability | Impact | Mitigation |

Estimated effort.
(NOT in days — in watchdog confidence-axis count + dependency depth)
```

### Section 17 — Subagent & Team Plan structure

For each phase, the PRD specifies which agents to spawn during execution:

```
PHASE N AGENT PLAN

Discovery agents (already run during PRD synthesis — re-run if findings stale):
- [Code Quality Hunter] — scope: [files]
- [Bug Hunter] — scope: [routes]
- ...

Execution agents (spawn during phase work):
- [Frontend Architect] — handles UI work
- [Backend Engineer] — handles API + schema
- [Visual Creative Director] — handles brand assets
- (for FDC projects, see anthropic-skills:agent-teams)

Verification agent (always):
- Watchdog spawned per memory/watchdog_briefing.md, with phase-specific axes
```

### Section 19 — Confidence Ledger

Every PRD ends with a self-assessment table:

| Section | Confidence | Reason |
|---|---|---|
| 1. Executive Summary | NN% | (one line) |
| ... | NN% | ... |

**Overall PRD confidence:** NN% — (explanation)

The watchdog can flag any section where confidence > evidence supports.

---

## STEP 4 — EXECUTION HANDOFF

The executing agent (the one that actually fixes things) reads the PRD and operates phase-by-phase. For each phase:

1. Re-spawn discovery agents if findings are >24h stale
2. Execute the phase scope, file by file
3. Spawn the watchdog with the phase's verification axes
4. Watchdog reports verbatim; if confidence ≥90% on every axis, mark phase complete
5. If verdict is NOT YET (anything less than ≥90%), close the gap or update PRD acceptance criteria honestly. Never ship at less than full verification.

---

## Anti-patterns to reject (this is what watchdog watches PRDs themselves for)

1. **Phases without acceptance criteria** — PRD is a wish list, not a plan.
2. **Acceptance criteria that aren't testable** — "Make it look professional" fails the watchdog.
3. **Watchdog axes that all read the same file** — single-axis scoring in disguise.
4. **Confidence numbers without justification** — "85%" with no reason is just confidence theater.
5. **"Phase 8: Marketing" with one bullet** — outline placeholders are fine, but they must be marked **[OUTLINE — DEEPEN IN SESSION N+]** explicitly.
6. **Day estimates** — Rob doesn't trust them and neither should the PRD. Use gates and dependencies instead.
7. **Skipping discovery** — producing a PRD without first running discovery agents is the default-skill failure mode this format exists to prevent.

---

## Output files

For every PRD generated:

1. **`docs/PRD-{name}.md`** — the human-readable PRD (this format)
2. **`docs/PRD-{name}.json`** — RALPH WIGGINS structured output (defer to next session if writing both at once would burn context)
3. **`docs/PRD-{name}-discovery/`** — directory of discovery agent reports the PRD synthesized
4. Watchdog briefing reference embedded in §16 — point at `memory/watchdog_briefing.md`

---

## Living spec — how this gets refined

This file is rewritten / extended as Rob teaches new patterns. Triggers for refinement:

- Rob calls out a PRD anti-pattern → add to "Anti-patterns to reject"
- Rob describes a new agent type he wants → add to discovery dispatch checklist + add template to discovery_agent_templates.md
- Rob clarifies severity rubric or confidence-rating preferences → update those sections
- A PRD generated under this format gets criticized → trace the criticism, find the format gap, fix here

Don't update silently — flag the change in the response so Rob can audit it.
