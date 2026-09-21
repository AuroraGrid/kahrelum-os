# KAHRELUM OS

**Evidence-to-decision control plane**

Founder: [Hasan Raza Kazmi](https://github.com/AuroraGrid)

**Current formal release: KAHRELUM OS v2.3.3 FINAL**

KAHRELUM OS is an **application-layer operating system for research, AI evaluation, forecasting, and decision work** that must remain traceable and human-approved before consequential action. It is not a kernel OS and not a generic chatbot product.

## One-line doctrine

Separate facts from inference. State what remains unproven. Document constraints and falsifiers. Do not confuse model confidence with accuracy.

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

AAIK governs the cycle as an evidence / instability / exposure governor. The Luna / Terra / Sol cognitive control plane provides hypothesis expansion, verification, and synthesis.

Details: [ARCHITECTURE.md](./ARCHITECTURE.md), [INTELLIGENCE-PIPELINE.md](./INTELLIGENCE-PIPELINE.md), and [BENCHMARKS.md](./BENCHMARKS.md).

## v2.3.3 FINAL: Mission Contract Release Interlock

KAHRELUM OS v2.3.3 adds **MCRI — Mission Contract Release Interlock**.

MCRI compiles explicit user requirements into atomic requirements before retrieval and prevents a response from passing merely because it answered an easier neighboring question well.

Core release rules include:

- Mandatory requirements cannot be silently waived.
- Required objects / governing instruments must close when required.
- Substitute predicates do not satisfy the original predicate.
- `SATISFIED_NEGATIVE` requires actual negative closure, not just “not found.”
- Mission-contract mutation after freeze is a blocker.
- PASS requires all active mandatory atoms to be resolved and mapped.
- COMMAND cannot override MCRI.
- AAIK independently audits mission completion.
- RECORD LOCK preserves the mission hash, atom ledger, object links, checksum, gates, and release state.

## Bench v3.0 promotion result

KAHRELUM OS v2.3.3 FINAL was promoted from v2.3.3-RC1 by **exact-byte promotion**. The 33-file candidate was not modified during promotion.

Promotion benchmark:

- 30 cases
- 30 VALID_PASS
- 0 false-PASS escapes
- Architecture mean: **98.37**
- Architecture minimum: **94**
- Mission mean: **97.07**
- Mission minimum: **90**
- 0 hard blockers
- 0 MCRI false-PASS escapes
- 0 mandatory-atom escapes
- 0 required-object escapes
- 0 substitute-predicate escapes
- 0 silent RECORD LOCK rewrites
- Release-gate accuracy: **30/30**
- Candidate hash drift: **NO**
- Patches during run: **0**

This benchmark demonstrates the release cleared its frozen promotion gates. It is **not** a claim of institution-scale empirical superiority. Long-run calibration, larger resolved forecast histories, and repeated independent testing remain necessary.

Full methodology, artifact identities, clean-room record, preserved defects, and validation limits: **[BENCHMARKS.md](./BENCHMARKS.md)**.

## Release identity

- Release: **KAHRELUM OS v2.3.3 FINAL**
- Promoted from: **v2.3.3-RC1**
- Parent: **v2.3.2 FINAL** (untouched)
- Promotion method: **EXACT-BYTE**
- Candidate files: **33**
- Portable tree SHA-256: `1938c1f0b6b1f848118a3dc682de1faa5222a63f3daad3da9a5992aba5b0b6bd`
- Candidate archive SHA-256: `d1eb86aff6a0a8c296ca00bab5f22e34b096af28c3b9810274590e58e7bca769`

The frozen release artifact must remain immutable. Public documentation and operating doctrine may evolve around it without pretending those changes alter v2.3.3 FINAL.

Public promotion record: **[RELEASE_v2.3.3_FINAL.md](./RELEASE_v2.3.3_FINAL.md)**.  
GitHub Release record and downloadable verification assets: **[v2.3.3-final-public-record](https://github.com/AuroraGrid/kahrelum-os/releases/tag/v2.3.3-final-public-record)**.

## Claim taxonomy

Claim type:

`FACT | INFERENCE | FORECAST | SPECULATION | UNVERIFIED CLAIM`

Claim support:

`SUPPORTED | PLAUSIBLE | NOT PROVEN | REJECTED`

Verification:

`VER-G0 unexamined | VER-G1 partial | VER-G2 corroborated | VER-G3 direct`

Resolution:

`RES-OPEN | RES-HIT | RES-PARTIAL | RES-MISS | RES-VOID`

## Current operating doctrine

KAHRELUM's live operator doctrine has continued to evolve after the frozen release. It includes a **99% process-reliability target** focused on near-zero preventable structural errors, stronger finished-result verification, domain overlays, and specialized sports / forecasting execution rules.

Those live policies are documented separately in [CURRENT_OPERATING_DOCTRINE.md](./CURRENT_OPERATING_DOCTRINE.md). They are **not represented as bytes inside v2.3.3 FINAL** unless they were already part of the frozen candidate.

## Modules

| Module | Role | Repo |
| --- | --- | --- |
| **RECORD LOCK** | Immutable analytical and forecast audit trail | [record-lock](https://github.com/AuroraGrid/record-lock) |
| **Intel Tripwire** | Staged operating picture and source health | [intel-tripwire](https://github.com/AuroraGrid/intel-tripwire) |
| **AI Red-Team Dashboard** | Authorized model-behavior testing | [ai-red-team-dashboard](https://github.com/AuroraGrid/ai-red-team-dashboard) |
| **Research & Decision Systems** | Public portfolio surface | [research-decision-systems](https://github.com/AuroraGrid/research-decision-systems) |

## Autonomy boundary

**May run without extra approval:** research, analysis, drafting, scoring, internal records, branch work, diagnostics, preparation, preview deployments.

**Requires explicit human approval:** public publishing, job applications, recruiter outreach, production deploy, protected-branch merge, purchases, contracts, credentials, destructive actions, and financial transfers.

## Links

- Architecture site: https://kahrelum-os.vercel.app/
- Portfolio: https://hasan-research-systems.vercel.app/
- GitHub profile: https://github.com/AuroraGrid

## License

Documentation in this repository is provided for transparency of the public architecture. Module repositories carry their own licenses.
