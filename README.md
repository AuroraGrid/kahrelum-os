# KAHRELUM OS

**New technical research:** [K-PREDICT v0.6: probabilistic election modeling and honest historical evaluation](./research/israel-2026-election/K_PREDICT_V06_2026-10-27.md). Retrospective evidence; overall PARTIAL; no established model superiority or KAHRELUM live 2026 election-outcome forecast.


**NFL Sports Intelligence Desk (2026 research launch):** [Public trade board source](./nfl/trades.html) · [Machine-readable research snapshot](./nfl/trade-board.json) · [Evidence and forecast integrity](./research/nfl-2026-trade-deadline/README.md). The `/nfl/trades` Firebase route is only live after a verified guarded deployment.

**Evidence-to-decision control plane**

Founder: [Hasan Raza Kazmi](https://github.com/AuroraGrid)

**Canonical public site: https://kahrelum.com**

**Commercial entry:** [Independent historical AI decision review — fixed scope and pricing](https://kahrelum.com/pilot#request). We check whether evidence and rules available *before* an agent action supported the decision, and return an inspectable case record. Public options: $750 for three historical cases / $2,500 for up to ten; operator-assisted, no production access or guaranteed performance, and existing recipient-specific quotes remain intact. [Commercial scope and handling](./PILOT.md).



**Current formal release: KAHRELUM OS v2.3.4 FINAL**

KAHRELUM OS is an application-layer system for research, forecasting, AI evaluation and decision support. It separates fact from inference, attacks conclusions before acting, preserves uncertainty, and is designed to block rather than manufacture an answer when the evidence does not close.

## Public repository scope

This repository is KAHRELUM's canonical **public architecture, evidence, and release-record surface**. It is not the frozen runtime archive. Runtime releases are identified by exact SHA-256 and their public release records; the HTML/Markdown tree should not be treated as a substitute for those frozen bytes.

Current release record: [KAHRELUM OS v2.3.4 FINAL](./RELEASE_v2.3.4_FINAL.md).

## Firebase Hosting releases

`kahrelum.com` is served by the existing Firebase Hosting site `kahrelum-public-hosting`. The repository is an overlay source: the live Firebase version also contains election snapshots, API payloads and public assets that are not reconstructed from this GitHub root.

Use the guarded release wrapper from an authenticated deployment workstation:

```powershell
.\scripts\deploy-unified-firebase.ps1 -Plan
.\scripts\deploy-unified-firebase.ps1 -Preview
.\scripts\deploy-unified-firebase.ps1 -Promote
```

`-Plan` is read-only. `-Preview` starts from Firebase's current finalized live version, preserves every existing file hash and Hosting rule, applies only the governed repository overlay, and verifies the preview. `-Promote` releases that exact preview version only when production still matches the version used to build it. A concurrent production change invalidates the receipt and requires a new preview.

The former `-FirebaseRoot ... -Deploy` directory workflow is intentionally blocked because a stale local directory can delete production-only files. Preview receipts are local, ignored files under `.firebase-deploy/`; they contain file hashes and release metadata, not credentials.

## Research & investigations

KAHRELUM now includes a public **AI accountability research portfolio** demonstrating documentary research, claim/evidence separation, counterevidence, uncertainty, falsifiers, and open reporting questions.

- [Research & Investigations index](./research/README.md)
- [Anthropic's compute commitments create a governance stress test](./research/anthropic-compute-governance.md)
- [Disclosure by choice or disclosure by law?](./research/ai-incident-disclosure.md)
- [Model-weight security: what lawmakers ask, and what frontier labs disclose](./research/model-weight-security.md)
- [Israel 2026 Knesset election: frozen pre-poll audit and prospective count checkpoints](./research/israel-2026-election/README.md) — Case `KAH-IL26-PROSPECTIVE-001`; C0 locked Oct 26; third-party comparator, original scoring protocol and live-stage append-only rules; **final result pending**.
- [AI Driving Test: two-attempt operator skills assessment](./research/ai-driving-test-2026-10-27.md) — Informal, AI-graded simulation: **86/100 first attempt, 100/100 retake, 186/200 = 93% combined**. Contains full fault ledger, controlled autonomy decisions, and explicit non-independent verification boundaries. **Not a prediction-accuracy or external-certification claim.**

These are public-source research dossiers produced through an AI-assisted KAHRELUM workflow. They are labeled accordingly and are not represented as unaided writing samples where an employer or publication requires work created without AI assistance.

## Current evidence status

External-audit package SHA-256:

`084f0d1348342e707e1fc953b1337d3a805f9890301fa54ba01983aa1a46876f`

The external adversarial audit found:

- outer package SHA-256: **VERIFIED**
- internal manifest: **201 / 201 files verified; 0 mismatches**
- RP100 registered arithmetic: **REPRODUCED**
- GX50-v2 registered arithmetic: **REPRODUCED**
- scoring mismatches: **NONE**
- registered statistical-plan execution: **COMPLIANT**
- critical numerical-reproduction defects: **NONE**

This does **not** establish universal/commercial superiority, provider-signed model identity, operational reliability, or perfect runtime blindness.

## Benchmark snapshot

### RP100 — 85 resolved forecast cases

| Subject | Mean Brier |
| --- | ---: |
| Gemini 3.1 Pro | **0.189073** |
| KAHRELUM | 0.222593 |
| GPT-5.6 Sol | 0.321955 |

KAHRELUM vs GPT paired Brier difference: **-0.099362**, preregistered 95% CI **[-0.144114, -0.058405]**.

Gemini had the lowest RP100 Brier. KAHRELUM had the highest frozen RP100 analytical score (**0.876667**) and registered 60/40 composite (**0.817111**); those analytical/composite results are rubric- and encoding-conditional.

### GX50-v2 — 45 resolved forecast cases

| Subject | Mean Brier |
| --- | ---: |
| KAHRELUM | **0.146176** |
| Grok 4.6 | 0.203929 |
| GPT-5.6 Sol | 0.204458 |

KAHRELUM had the lowest GX50-v2 Brier point estimate. Both preregistered primary 97.5% bootstrap intervals **include zero**, so this is not presented as statistically supported superiority.

## Canonical pipeline

```
ROUTER → SCOUT → SOURCEGRID → K-ALIGN → IPR
→ BLACKGLASS-I → CRF → COMMAND → BLACKGLASS-II → RECORD LOCK
```

AAIK governs evidence / instability / exposure. MCRI compiles explicit requirements into a mission contract and blocks PASS when mandatory requirements remain unresolved.

Details: [ARCHITECTURE.md](./ARCHITECTURE.md), [INTELLIGENCE-PIPELINE.md](./INTELLIGENCE-PIPELINE.md), and [BENCHMARKS.md](./BENCHMARKS.md).

## v2.3.4 identity

- release archive SHA-256: `c6caca3290abbee7121fb743fabb1210b59b7536aa46dd6d6874cd02962bc1e1`
- external-audit package SHA-256: `084f0d1348342e707e1fc953b1337d3a805f9890301fa54ba01983aa1a46876f`
- RP100 canonical digest: `6f389c0c85ace7e81aed599e737190c98968c5b9b04a4d993d9d7a5dbdc47254`
- GX50-v2 canonical digest: `aa4b116c1d8536c3eee6d984951c6431b31c681b717027fdb93031275324f221`

The older v2.3.3 FINAL promotion record remains preserved as historical evidence. Its hashes are **not** reused as v2.3.4 identity.

## Known limitations

- retrospective constructor-controlled benchmarks;
- RP100 outcome imbalance: 83 YES / 2 NO;
- GX50 challenge-set design: 22 YES / 23 NO;
- both GX50 primary adjusted intervals include zero;
- recovered comparator responses without hash-bound raw source transcripts;
- no packaged GX50-v2 Subject-A execution record;
- no provider-signed model-identity attestations;
- no host-level correction access log;
- analytical rankings were not independently re-adjudicated;
- same-day / same-operator program.

## Current commercial status

**Private Pilot / Prospective Validation**

KAHRELUM is currently available for externally controlled pilots rather than being presented as a generally available SaaS product.

Four initial pilot surfaces:

- **Forecasting** — unresolved questions, probabilities, calibration and resolution.
- **Decision intelligence** — evidence → adversarial challenge → probability → action.
- **AI evaluation** — frozen side-by-side evaluations under a declared protocol.
- **Research assurance** — test whether unsupported conclusions are blocked before release.

[Request a pilot](./PILOT.md) · [External audit summary](./evidence/EXTERNAL_AUDIT_SUMMARY.md) · [Prospective validation protocol](./evidence/PROSPECTIVE_VALIDATION_PROTOCOL.md)

## Next validation target

The evidence-changing next step is an **externally controlled prospective benchmark**. KAHRELUM is seeking partners willing to control case selection, cutoff dates, preregistration, resolution criteria, gold outcomes and scoring.

The point is not to design a test KAHRELUM is supposed to win. The point is to create a result that is credible either way.

## Claim discipline

`FACT | INFERENCE | FORECAST | SPECULATION | UNVERIFIED CLAIM`

`SUPPORTED | PLAUSIBLE | NOT PROVEN | REJECTED`

## Links

- Canonical public site: https://kahrelum.com
- LinkedIn: https://www.linkedin.com/in/hasan-raza-kazmi-a756b4407/
- Evidence: [BENCHMARKS.md](./BENCHMARKS.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Research & Investigations: [research/README.md](./research/README.md)
- Current v2.3.4 release record: [RELEASE_v2.3.4_FINAL.md](./RELEASE_v2.3.4_FINAL.md)
- Historical v2.3.3 release record: [RELEASE_v2.3.3_FINAL.md](./RELEASE_v2.3.3_FINAL.md)

## License

Documentation in this repository is provided for transparency of the public architecture. Module repositories carry their own licenses.


### Prospective Israel 2026 election case: engineering model audit

- [**Technical model-core validation, October 27**](./research/israel-2026-election/MODEL_CORE_V01_2026-10-27.md) (independently implemented vote-to-seat arithmetic, 15 passing tests, source digest and limitations; no proprietary forward outcome call). See the [living case index](./research/israel-2026-election/README.md) for C0 and preregistered checkpoints.


### Israel 2015–2022: extended mechanical validation (v0.2)

- [**Six-election independent seat-mechanics test and provisional archived-poll audit**](./research/israel-2026-election/HISTORICAL_VALIDATION_V02_2026-10-27.md): all 61 represented historical party lists, 720 reconstructed seats, zero mechanical seat mismatch and 33 automated tests; 18 retrospective third-party poll snapshots scored separately. **No proprietary election-outcome forecast or calibrated winner probability claimed.** [Full case and registered checkpoints](./research/israel-2026-election/README.md).


### Prospective Israel 2026 | Pre-opening source-audit release v0.3

- [**Reproducible nine-poll, 13-list pre-election source audit**](./research/israel-2026-election/PREOPEN_SOURCE_AUDIT_V03_2026-10-27.md): verified 53/53 automated engineering tests, source discrepancies, missing-vs-zero controls, correlated pollster notes and official-count safeguards. **This is not KAHRELUM's own party-seat electoral prediction or calibrated probabilities**. Original C0 and scoring rules retained unchanged; the [ongoing case](./research/israel-2026-election/README.md) remains unresolved.


### Final Israel historical extension: 2013–2022 (KAHRELUM v0.4)

- [**Seven-election mechanical reconstruction and retrospective source audit, closed at 2013**](./research/israel-2026-election/HISTORICAL_CLOSURE_V04_2013.md). The independently implemented owner code reproduces all 73 represented list-seat allocations across 840 seats, with 65 tests passing. The 2013 election used a **2% threshold**, unlike later 3.25% elections. Twenty-one third-party archival poll seat maps were scored descriptively, **not as KAHRELUM's proprietary historical forecasts**. The pre-2026 archive covers no elections earlier than 2013. [Case index](./research/israel-2026-election/README.md).


### KAHRELUM Israel v0.5 | Source-risk modeling and negative-result publication

- [**Full technical report and limitation-locked source-risk model**](./research/israel-2026-election/SOURCE_RISK_MODEL_V05_2026-10-27.md). An owner-controlled code release passes **118/118 local tests** and implements pseudo-chronological **probabilities about third-party polling errors**. It **does not estimate which Israeli political party will win or how many seats it will take**. The measured retrospective mean Brier is **0.305392** versus uninformative **0.250000**, so **no predictive-skill advantage** is claimed. Earlier seven historical mechanical reconstructions, C0 original and fixed election monitoring protocol remain preserved. [Case details](./research/israel-2026-election/README.md).
