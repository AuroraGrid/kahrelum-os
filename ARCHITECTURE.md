# KAHRELUM OS — Architecture

**Current formal release: KAHRELUM OS v2.3.3 FINAL**

## Purpose

KAHRELUM is an application-layer **evidence-to-decision control plane** for research, forecasting, AI evaluation, intelligence analysis, and decision support where unsupported claims, dropped requirements, or unaudited actions are costly.

Its governing priority order is:

1. Truth
2. Clarity
3. Decision value
4. Auditability
5. Efficiency

## Canonical pipeline

```
ROUTER
→ SCOUT
→ SOURCEGRID
→ K-ALIGN
→ IPR
→ BLACKGLASS-I
→ CRF
→ COMMAND
→ BLACKGLASS-II
→ RECORD LOCK
```

### ROUTER
Selects task depth and analytical mode. Routing should vary with consequence, uncertainty, evidence instability, and mission complexity rather than defaulting every task to maximal depth.

### SCOUT
Expands the search space: candidate claims, weak signals, actors, dependencies, hypotheses, and potentially decision-relevant evidence. SCOUT discovers; it does not certify.

### SOURCEGRID
Builds the evidence map. It tracks provenance, independence, source quality, freshness, incentives, and source recycling rather than counting links as independent confirmations.

### K-ALIGN
Checks whether dates, windows, denominators, definitions, jurisdictions, status levels, objects, and units actually align. “Close enough” does not satisfy identity-sensitive requirements.

### IPR
Inflection Point Research identifies the variables most capable of changing the probability distribution or decision state next.

### BLACKGLASS-I
Adversarially attacks the analytical thesis. It searches for disconfirming evidence, dependency errors, base-rate neglect, wrong denominators, hidden assumptions, alternative mechanisms, and thesis fragility. BLACKGLASS attacks; it does not rescue.

### CRF
Constructs coherent probabilities and scenarios. It distinguishes real-world event probability from contract / resolution probability where those differ and requires scenario partitions to remain mathematically coherent.

### COMMAND
Compresses analysis into an action state such as MONITOR, WAIT, REJECT, INVESTIGATE, HEDGE, TRADE, PUBLISH, ESCALATE, or PREPARE.

COMMAND does **not** have authority to override mission-completion failures.

### BLACKGLASS-II
Attacks the proposed decision after synthesis. A sound thesis can still produce a bad action because of price, timing, exposure, implementation risk, or unresolved dependencies.

### RECORD LOCK
Preserves what was known, what was inferred, the forecast / decision, unresolved information, revision conditions, and later resolution without silently rewriting prior records.

## MCRI — Mission Contract Release Interlock

MCRI is the release interlock introduced in the v2.3.3 line.

Before retrieval, explicit user requirements compile into an atomic mission contract. PASS is blocked when mandatory active atoms remain unresolved or unmapped.

Core rules:

- Mandatory requirements cannot be waived because they appear “non-deciding.”
- Required objects or governing instruments must close where the mission requires them.
- Substitute predicates do not satisfy the original predicate.
- `SATISFIED_NEGATIVE` requires genuine negative closure.
- Mission-contract mutation after freeze is a blocker.
- COMMAND cannot override MCRI.
- AAIK audits the mission-completion gate.
- RECORD LOCK preserves mission hash, requirement ledger, object links, checksum, gates, and release state.

## Cognitive control plane

### Luna
Expands hypotheses, weak signals, and second-order effects without outrunning evidence.

### Terra
Verifies evidence, provenance, constraints, scope, and real-world feasibility.

### Sol
Synthesizes judgment, probability, action, uncertainty, and revision conditions.

### AAIK
Evidence / instability / exposure governor.

States:

`OFF | NORMAL | SPIKE`

Canonical SPIKE behavior:

- apply a probability haircut of 10 percentage points, clamped to valid bounds;
- reject pure T4/T5 foundations for consequential claims;
- downsize high-exposure action states such as TRADE / PUBLISH / ESCALATE toward HEDGE until evidence stabilizes.

## Source hierarchy

- **SRC-T1** — primary / raw
- **SRC-T2** — official / formal
- **SRC-T3** — strong original reporting
- **SRC-T4** — expert / secondary
- **SRC-T5** — social / rumor / opaque

Tier does not equal truth. KAHRELUM also evaluates proximity, authenticity, independence, incentives, and freshness.

## Epistemic taxonomy

Claim type:

`FACT | INFERENCE | FORECAST | SPECULATION | UNVERIFIED CLAIM`

Claim support:

`SUPPORTED | PLAUSIBLE | NOT PROVEN | REJECTED`

Verification:

`VER-G0 | VER-G1 | VER-G2 | VER-G3`

Resolution:

`RES-OPEN | RES-HIT | RES-PARTIAL | RES-MISS | RES-VOID`

## Pathway gates

- GATE-G0 — Blocked
- GATE-G1 — Latent
- GATE-G2 — Forming
- GATE-G3 — Credible Pathway
- GATE-G4 — Trigger-Ready
- GATE-G5 — Activated

G5 means a pathway is underway; it does not guarantee completion.

## Release boundary

The 33-file KAHRELUM OS v2.3.3 FINAL candidate was promoted by exact-byte identity. Documentation may describe the release and later operator practice, but the frozen artifact must not be silently rewritten.

## Known v2.3.3 backlog

The post-release audit preserved several non-blocking future-version items rather than patching FINAL:

- stronger explicit intra-extract contradiction reconciliation;
- explicit counterfactual-completeness atoms;
- clearer NOT_APPLICABLE ledger / checksum semantics;
- more demonstrable independent AAIK recomputation;
- a more differentiated BLACKGLASS-II attack;
- visible coverage status on material negatives;
- inspectable SOURCEGRID / validation stubs in strict benchmark mode;
- meaningful FAST vs DEEP routing.

These are backlog items, not retroactive edits to v2.3.3 FINAL.
