# KAHRELUM OS — Architecture

**Current formal release: KAHRELUM OS v2.3.4 FINAL**

## Purpose

KAHRELUM is an application-layer **evidence-to-decision control plane** for research, forecasting, AI evaluation, intelligence analysis and decision support where unsupported claims, dropped requirements or unaudited actions are costly.

Governing priority: **truth → clarity → decision value → auditability → efficiency**.

## Canonical pipeline

```
ROUTER → SCOUT → SOURCEGRID → K-ALIGN → IPR
→ BLACKGLASS-I → CRF → COMMAND → BLACKGLASS-II → RECORD LOCK
```

**ROUTER** selects depth and mode.  
**SCOUT** expands candidate claims, weak signals and hypotheses; it discovers, not certifies.  
**SOURCEGRID** maps provenance, independence, quality, freshness, incentives and source recycling.  
**K-ALIGN** tests identity across dates, windows, denominators, definitions, jurisdictions, objects and units.  
**IPR** identifies the variables most capable of changing the decision state next.  
**BLACKGLASS-I** attacks the thesis and searches for disconfirming evidence and hidden dependencies.  
**CRF** constructs coherent probabilities and scenarios.  
**COMMAND** compresses analysis into an action state but cannot override mission-completion failures.  
**BLACKGLASS-II** attacks the proposed action after synthesis.  
**RECORD LOCK** preserves evidence state, forecast/decision, unresolved items, revision conditions and later resolution without hindsight rewriting.

## MCRI — Mission Contract Release Interlock

MCRI compiles explicit requirements into an atomic mission contract. PASS is blocked when mandatory active requirements remain unresolved or unmapped.

Core rules include: mandatory requirements cannot be silently waived; required governing objects must close when required; substitute predicates do not satisfy the original predicate; `SATISFIED_NEGATIVE` requires genuine negative closure; COMMAND cannot override MCRI; RECORD LOCK preserves the mission state.

## Cognitive control plane

**Luna** expands hypotheses and second-order effects without outrunning evidence.  
**Terra** verifies evidence, provenance, constraints, scope and feasibility.  
**Sol** synthesizes judgment, probability, action, uncertainty and revision conditions.  
**AAIK** governs evidence / instability / exposure with `OFF | NORMAL | SPIKE` states.

## Epistemic taxonomy

Claim type: `FACT | INFERENCE | FORECAST | SPECULATION | UNVERIFIED CLAIM`

Claim support: `SUPPORTED | PLAUSIBLE | NOT PROVEN | REJECTED`

Verification: `VER-G0 | VER-G1 | VER-G2 | VER-G3`

Resolution: `RES-OPEN | RES-HIT | RES-PARTIAL | RES-MISS | RES-VOID`

## Current release evidence boundary

The public v2.3.4 release archive is hash-bound at:

`c6caca3290abbee7121fb743fabb1210b59b7536aa46dd6d6874cd02962bc1e1`

The external audit independently verified the audit package and reproduced the registered RP100/GX50 arithmetic. That audit validates arithmetic from supplied frozen files; it does not establish universal/commercial superiority, provider-signed model identity, runtime blindness, historical gold-label correctness against the world, or production reliability.

See [BENCHMARKS.md](./BENCHMARKS.md).

## Historical v2.3.3 boundary

v2.3.3 FINAL remains a preserved historical release with its own exact-byte promotion record. Its 33-file tree/archive hashes must not be presented as v2.3.4 identity.

Public documentation may evolve around frozen releases without silently rewriting their bytes.
