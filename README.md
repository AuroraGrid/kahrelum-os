# KAHRELUM OS

**Evidence-to-decision control plane**

Founder: [Hasan Raza Kazmi](https://github.com/AuroraGrid)

**Current formal release: KAHRELUM OS v2.3.4 FINAL**

KAHRELUM OS is an application-layer system for research, forecasting, AI evaluation and decision support. It separates fact from inference, attacks conclusions before acting, preserves uncertainty, and is designed to block rather than manufacture an answer when the evidence does not close.

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

## Next validation target

The evidence-changing next step is an **externally controlled prospective benchmark**. KAHRELUM is seeking partners willing to control case selection, cutoff dates, preregistration, resolution criteria, gold outcomes and scoring.

The point is not to design a test KAHRELUM is supposed to win. The point is to create a result that is credible either way.

## Claim discipline

`FACT | INFERENCE | FORECAST | SPECULATION | UNVERIFIED CLAIM`

`SUPPORTED | PLAUSIBLE | NOT PROVEN | REJECTED`

## Links

- Public site: https://kahrelum-os.vercel.app/
- Evidence: [BENCHMARKS.md](./BENCHMARKS.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Historical v2.3.3 release record: [RELEASE_v2.3.3_FINAL.md](./RELEASE_v2.3.3_FINAL.md)
- Portfolio: https://hasan-research-systems.vercel.app/

## License

Documentation in this repository is provided for transparency of the public architecture. Module repositories carry their own licenses.
