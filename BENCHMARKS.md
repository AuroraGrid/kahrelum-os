# KAHRELUM OS — Evidence & Validation

## Scope

This page records the bounded public evidence for **KAHRELUM OS v2.3.4 FINAL** and preserves the older v2.3.3 promotion record as historical evidence rather than blending the two release identities.

The current external audit tested custody and registered claims from packaged bytes. It did not execute KAHRELUM, rerun benchmark subjects, independently reconstruct historical gold labels, or certify commercial readiness.

## v2.3.4 release identity

- release archive SHA-256: `c6caca3290abbee7121fb743fabb1210b59b7536aa46dd6d6874cd02962bc1e1`
- external-audit package SHA-256: `084f0d1348342e707e1fc953b1337d3a805f9890301fa54ba01983aa1a46876f`
- RP100 canonical digest: `6f389c0c85ace7e81aed599e737190c98968c5b9b04a4d993d9d7a5dbdc47254`
- GX50-v1 canonical digest: `b3374a06c06c1e00e10c9035c5af8f4fc54ad4ee0cd25ba6688fd66abf26eabb`
- GX50-v2 canonical digest: `aa4b116c1d8536c3eee6d984951c6431b31c681b717027fdb93031275324f221`

External audit: **201 manifested files independently SHA-256 checked; 0 mismatches, 0 missing listed files, 0 unmanifested files.**

## RP100

85 resolved forecast cases. Frozen resolution count: **83 YES / 2 NO**.

| Subject | Mean Brier | Mean log loss | ECE |
| --- | ---: | ---: | ---: |
| KAHRELUM | 0.2225929412 | 0.6342017606 | 0.4072941176 |
| GPT-5.6 Sol | 0.3219552941 | 0.9243690136 | 0.4818823529 |
| Gemini 3.1 Pro | **0.1890729412** | **0.5588932706** | **0.3244705882** |

| Pair | Mean Brier diff | W/L/T | CI | vs zero |
| --- | ---: | ---: | --- | --- |
| KAHRELUM − GPT | -0.0993623529 | 53/29/3 | 95% [-0.1441143529, -0.0584045588] | below |
| KAHRELUM − Gemini | +0.0335200000 | 19/62/4 | 95% [0.0052775588, 0.0594447647] | above |
| GPT − Gemini | +0.1328823529 | 5/78/2 | 95% [0.1013456471, 0.1687522059] | above |

Frozen analytical arithmetic:

| Subject | Mean normalized analytical | Registered composite |
| --- | ---: | ---: |
| KAHRELUM | **0.8766666667** | **0.8171109020** |
| GPT-5.6 Sol | 0.8433333333 | 0.7441601569 |
| Gemini 3.1 Pro | 0.8088000000 | 0.8100762353 |

RP100 composite formula: `0.6 × (1 − mean Brier) + 0.4 × analytical`.

**Boundary:** Gemini has the lowest RP100 Brier. KAHRELUM's analytical/composite arithmetic is highest under the frozen rubric and weighting, but the analytical procedure was not independently re-adjudicated and Gemini's analytical encoding is asymmetric. The 83/2 outcome mix is a major generalization/calibration limitation.

## GX50-v2

45 resolved forecast cases, deliberately challenge-set balanced at **22 YES / 23 NO**.

| Subject | Mean Brier | Mean log loss | ECE |
| --- | ---: | ---: | ---: |
| KAHRELUM | **0.1461755556** | **0.4538153298** | 0.1913333333 |
| GPT-5.6 Sol | 0.2044577778 | 0.6040052255 | 0.1933333333 |
| Grok 4.6 | 0.2039288889 | 0.6053677475 | **0.1808888889** |

| Pair | Mean Brier diff | W/L/T | CI | vs zero |
| --- | ---: | ---: | --- | --- |
| KAHRELUM − GPT | -0.0582822222 | 26/17/2 | 97.5% [-0.1256969444, 0.0055116667] | **includes zero** |
| KAHRELUM − Grok | -0.0577533333 | 31/13/1 | 97.5% [-0.1211511944, 0.0001336944] | **includes zero** |
| GPT − Grok | +0.0005288889 | 25/19/1 | 95% [-0.0284802778, 0.0311602778] | includes zero |

Frozen analytical arithmetic:

| Subject | Mean normalized analytical | Registered composite |
| --- | ---: | ---: |
| KAHRELUM | **0.898** | **0.8648683333** |
| GPT-5.6 Sol | 0.792 | 0.7946566667 |
| Grok 4.6 | 0.716 | 0.7760533333 |

GX50 composite formula: `0.75 × (1 − mean Brier) + 0.25 × analytical`.

**Boundary:** KAHRELUM has the lowest GX50-v2 Brier point estimate. Both preregistered primary 97.5% intervals include zero. Do not convert that point-estimate ranking into a statistically supported superiority claim.

## GX50-v1 → v2 correction

Independent comparison found 50/50 IDs shared, 49 case rows byte-identical, and one changed case: `gx50-t-07`. The changed field was `metadata.forecast_horizon`, from `2023-01-18T23:59:59Z` to `2023-01-19T23:59:59Z`. Scoring rules and sealed resolution ledgers were byte-identical; v1 canonical identity was preserved.

This supports correction integrity at the byte/structure level. It does **not** provide host-forensic proof that no one inspected Subject-A contents during correction.

## Statistical-plan compliance

The external audit independently reproduced the registered procedures and found them compliant:

- RP100 A/B: 10,000 bootstrap replicates, seed 1001001, 95% CI;
- RP100 Gemini extension: seeds 1001002 / 1001003; no multiplicity correction was registered;
- GX50-v2: primary comparisons at Bonferroni-adjusted 97.5%, seeds 424242 / 424243; secondary seed 424244 at 95%.

A preserved metadata defect exists in the Gemini-extension plan: the embedded GPT Subject-B hash is 62 hex characters; scoring used the authoritative 64-character response-file hash. It does not change the reproduced Brier results.

## Verified

- delivered external-audit ZIP hash matches expected;
- all 201 manifested files hash-check;
- RP100 and GX50 registered forecast arithmetic reproduces;
- analytical criterion arithmetic re-sums;
- registered bootstrap intervals reproduce;
- statistical-plan execution is compliant;
- no registered numerical claim failed recomputation;
- GX50-v2 changes only the `gx50-t-07` case-row horizon field from v1.

## Unverified / limited

- runtime blindness beyond recorded attestations;
- pretrained historical-outcome knowledge;
- provider-signed model identities;
- original transcript custody for recovered comparator responses;
- GX50-v2 Subject-A runtime binding;
- host-level file-access forensics;
- primary-world re-resolution of historical gold labels;
- independent blinded analytical re-adjudication;
- generalization from constructor-controlled retrospective benchmarks;
- commercial or universal superiority.

## Historical v2.3.3 promotion record

The prior v2.3.3 FINAL record remains preserved: promoted from v2.3.3-RC1 by exact-byte identity; 33-file candidate; Bench v3.0 30/30 VALID_PASS; architecture mean 98.37; mission mean 97.07; 0 hard blockers / false-PASS escapes; no candidate hash drift; 0 mid-run patches.

Historical v2.3.3 portable tree SHA-256:
`1938c1f0b6b1f848118a3dc682de1faa5222a63f3daad3da9a5992aba5b0b6bd`

Historical v2.3.3 archive SHA-256:
`d1eb86aff6a0a8c296ca00bab5f22e34b096af28c3b9810274590e58e7bca769`

These hashes identify **v2.3.3, not v2.3.4**.

## Next evidence-changing test

An externally controlled prospective benchmark with external case control, preregistration, cutoff enforcement, gold-label custody and scoring. The result should be preserved whether KAHRELUM wins, ties or loses.
