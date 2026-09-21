# KAHRELUM OS — Evidence & Validation

## Scope

This page documents the public validation record for **KAHRELUM OS v2.3.3 FINAL**.

It separates three different claims:

1. **What the frozen release actually passed.**
2. **What historical testing contributed to hardening.**
3. **What remains unproven.**

The benchmark record is evidence for the release decision. It is not a claim that KAHRELUM has achieved institution-scale superiority or solved forecasting.

---

## Release under test

- Release: **KAHRELUM OS v2.3.3 FINAL**
- Promoted from: **v2.3.3-RC1**
- Parent: **v2.3.2 FINAL** (untouched)
- Promotion method: **EXACT-BYTE**
- Implementation modified during promotion: **NO**
- Candidate file count: **33**
- Portable tree SHA-256: `1938c1f0b6b1f848118a3dc682de1faa5222a63f3daad3da9a5992aba5b0b6bd`
- Candidate archive SHA-256: `d1eb86aff6a0a8c296ca00bab5f22e34b096af28c3b9810274590e58e7bca769`

The public architecture repository is **not** the frozen 33-file candidate tree. Public docs may evolve; the frozen candidate identity above may not.

---

## KAHRELUM BENCH v3.0

Bench v3.0 is the frozen, self-contained promotion benchmark used for v2.3.3 FINAL.

### Design

- 30 total cases
- 20 real-world STATIC cases
- 10 CLOSED_WORLD adversarial cases
- 20 distinct real-world domains
- 0 exact duplicates
- 0 near-duplicates against the preserved Bench v1 / Bench v2 / B5 case families

Design coverage included:

- 12 conjunction cases
- 15 governing-object cases
- 30 SATISFIED_NEGATIVE-capable cases
- 29 substitute-predicate traps
- 10 window / denominator traps
- 10 status-ladder cases
- 5 probability cases
- 13 quantitative cases

### Promotion result

- **VALID_PASS: 30 / 30**
- **FALSE_PASS_ESCAPE: 0**
- **Architecture mean: 98.37**
- **Architecture minimum: 94**
- Architecture cases below 90: **0**
- **Mission mean: 97.07**
- **Mission minimum: 90**
- Mission cases below 85: **0**
- Hard blockers: **0**
- MCRI false-PASS escapes: **0**
- Mandatory atom escapes: **0**
- Required object escapes: **0**
- Substitute predicate escapes: **0**
- Silent RECORD LOCK rewrites: **0**
- Release-gate accuracy: **30 / 30**
- Candidate hash drift: **NO**
- Patches during run: **0**
- **PROMOTION_GATE: PASS**

---

## Frozen promotion gates

The candidate was eligible for promotion only if all frozen gates cleared:

- Architecture mean >= 95
- No architecture case < 90
- Mission mean >= 90
- No mission case < 85
- Hard blockers = 0
- False PASS escapes = 0
- Mandatory atom escapes = 0
- Required object escapes = 0
- Substitute predicate escapes = 0
- Silent RECORD LOCK rewrites = 0
- Candidate hash drift = NO
- Patches during run = 0

The candidate cleared every gate.

---

## Clean-room record

### Cleanroom-001

- 0 / 30 cases executed
- Stopped at Stage 0
- Reason: candidate hash scheme was not portably specified
- Classification: **INVALID_PREEXECUTION / provenance failure**
- Not classified as a candidate analytical failure
- No benchmark contamination

That stop is preserved because provenance failure is itself something the system is supposed to refuse to smooth over.

### Cleanroom-002

- 30 / 30 cases executed
- PASS: 30
- BLOCK: 0
- MCRI blocks: 0
- COMMAND / MCRI conflicts: 0
- Candidate hash drift: NO
- External web used: NO
- Adjudicator bundle accessed by runner: NO
- Self-scoring performed: NO
- Candidate modified: NO
- Benchmark modified: NO
- Patches: 0

---

## Sealed artifact identities

- Adjudicator SHA-256: `9c6b70772dc32a6c991586be016e24ac90a4f2f8f77fcb74bb65f741d5373f39`
- CLEANROOM002 raw SHA-256: `4e9732873aea7468e293aac06eeb6b67c87da969f0ce89a23aed81abe45a06a7`
- Benchmark master SHA-256: `4a0ef4fc1d34897a0a6eb00c07cd85da77649ec3498e1b129a038aec399816cd`
- Benchmark lock SHA-256: `b0bac3469335045dec0f2bd4de003e9068ee2241262f765eba72b837fc5c717d`

These identities establish the preserved benchmark / adjudication record. They do not mean all sealed artifacts are published in this documentation repository.

---

## Historical hardening record

Before Bench v3.0, KAHRELUM accumulated:

- Bench v1: 10 historical cases
- Bench v2: 12 historical cases
- B5: 18 adversarial cases
- Historical / development total: **40 cases**

Bench v3 added 30 new frozen cases.

Shorthand:

> 40 cases hardened it. 30 new clean-room cases tested the hardened system. 70 total cases in the historical + promotion record.

Important limitation: Bench v1 and Bench v2 remain historical families whose exact runnable static provenance was not fully preserved. They were not silently reconstructed or rerun for the v2.3.3 promotion.

Historical B5 testing and MCRI replay remain supplemental hardening evidence. Preserved historical false-PASS records include B5-07, B5-08, B5-11, B5-13, B5-15, and B5-17.

---

## Preserved non-blocking defects

Three Bench v3 adjudication notes were retained rather than patched out of history:

### V3-04
An attendance-number contradiction was listed but not explicitly reconciled.

### V3-26
A window mismatch was correctly rejected, but the valid counterfactual ratio was not explicitly written.

### V3-29
A NOT_APPLICABLE ledger / checksum count inconsistency remained.

None triggered a frozen hard blocker. None is retroactively rewritten.

---

## What the benchmark supports

The evidence supports these narrower claims:

- v2.3.3 RC1 cleared the frozen Bench v3 promotion gates.
- The exact candidate did so without mid-run patches or hash drift.
- The benchmark did not record a false-PASS escape, mandatory-atom escape, required-object escape, substitute-predicate escape, or silent RECORD LOCK rewrite.
- MCRI materially hardened the system against mission-completion failures exposed in earlier testing.

## What it does not support

Bench v3 does **not** prove:

- universal open-world robustness;
- institution-grade superiority;
- 99% forecasting accuracy;
- transfer to every live, hostile, time-varying evidence environment;
- perfect AAIK independence;
- perfect BLACKGLASS-II differentiation;
- long-run calibration.

Those require larger resolved forecast histories, repeated independent benchmark runs, external operators, and more live evidence.

---

## Public release boundary

**KAHRELUM OS v2.3.3 FINAL remains immutable.**

Any later public documentation, site copy, operator doctrine, sports rules, or orchestration policy is layered around the frozen release unless a future implementation candidate is explicitly created and validated.

See:

- [Architecture](./ARCHITECTURE.md)
- [Intelligence pipeline](./INTELLIGENCE-PIPELINE.md)
- [Current operating doctrine](./CURRENT_OPERATING_DOCTRINE.md)
- [v2.3.3 FINAL public promotion record](./RELEASE_v2.3.3_FINAL.md)
