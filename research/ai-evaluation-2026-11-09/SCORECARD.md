# KAHRELUM | Synthetic AI intelligence evaluation: Run 001

**Date:** 9 November 2026 (UTC)  
**Source:** 15 author-created Q&A items, 3 synthetic scenario families  
**Candidate:** Parallel web_research, medium effort, one independent provider invocation per scenario  
**Assessor:** GPT-6 rubric application; no human review or externally authenticated model identity  
**Method:** Candidate prompts excluded reference answers and rubric anchors. This does not prove third-party-certified blindness or model independence.

## Result: 138/150 = 92.0% (author-defined practice scale)

| Case | Raw points | Maximum |
|---|---:|---:|
| AML | 45 | 50 |
| NATO | 46 | 50 |
| HUM | 47 | 50 |

**Critical integrity failures observed:** 0 in this single run.  
**Interpretation:** STRONG under author-defined practice threshold (85+). This is **not** micro1 certification, external validation, an estimate of real-world reliability, or proof of superior performance. Three scenario families are too small and authored with visible expected answers; this is an illustrative work sample only.

## Complete item-level scores

| Task | Core | Source | Time | Unknowns | Falsifier | Total |
|---|---:|---:|---:|---:|---:|---:|
| AML-01 | 2 | 2 | 2 | 2 | 2 | 10 |
| AML-02 | 2 | 1 | 2 | 1 | 2 | 8 |
| AML-03 | 2 | 2 | 2 | 2 | 1 | 9 |
| AML-04 | 2 | 2 | 2 | 1 | 2 | 9 |
| AML-05 | 2 | 1 | 2 | 2 | 2 | 9 |
| NATO-01 | 2 | 1 | 1 | 2 | 2 | 8 |
| NATO-02 | 2 | 2 | 2 | 2 | 1 | 9 |
| NATO-03 | 2 | 2 | 2 | 2 | 1 | 9 |
| NATO-04 | 2 | 2 | 2 | 2 | 2 | 10 |
| NATO-05 | 2 | 2 | 2 | 2 | 2 | 10 |
| HUM-01 | 2 | 2 | 2 | 2 | 2 | 10 |
| HUM-02 | 2 | 2 | 2 | 2 | 2 | 10 |
| HUM-03 | 2 | 1 | 2 | 2 | 1 | 8 |
| HUM-04 | 2 | 1 | 2 | 2 | 2 | 9 |
| HUM-05 | 2 | 2 | 2 | 2 | 2 | 10 |

## Deductions and adjudication notes

**AML-02 (8/10):** E2 customer explanation was not cited; one sentence says E6 "proves no earlier availability" although the record only lacks evidence of prior availability. Correct later qualification avoids a critical flag.

**AML-03 (9/10):** Correctly distinguishes E4 assistant text, E5 status and R1 authority. Next check requests original record but not explicit decision-time availability/access history.

**AML-04 (9/10):** E7/E8 vs E9 and times correctly distinguished. Does not explicitly say B/C are variants of one authored fixture rather than independent cases.

**AML-05 (9/10):** FinCEN FAQ Q4 applied correctly and no legal claim invented; does not cite fictional P3 by its explicit rule ID.

**NATO-01 (8/10):** Correct NATO threshold/consent, but evidence explanation omits N2 utility notice and timing does not expressly exclude later N7.

**NATO-02 (9/10):** Correct treaty/no fixed 24-hour military deployment. Next check seeks universal instrument rather than a dated nation-specific deployment authorization.

**NATO-03 (9/10):** Correctly excludes post-cutoff N7 and treats N1/N8 as dependent; follow-up lacks explicit versioning of later evidence.

**HUM-03 (8/10):** Four neutral questions and open recall provided, but control proposed only as generic "independent records or people" without specifically naming W2/W3 or a concrete test.

**HUM-04 (9/10):** Four competing explanations and checks; no explicit reference to S7 in this item and some hypotheses overlap. Deception is not inferred from gaze.

## Primary evidence and repeatability

- **Original keyed dataset SHA-256:** `afa344204d4cfc789da9eb6c36349c47f20eec4ef21ddf03095287ec8d536c0a`
- **Original question-only dataset SHA-256:** `4a83c85f8c9da268c5f9aa89ecb9dc1c01b7054643bea9cf70c56206fe0b5746`
- **No prior reference answers passed to answer-generation model.** One request per scenario contained its five questions; responses were retained verbatim.
- **Run outputs:**
  - [AML raw prompt and provider output](https://github.com/AuroraGrid/kahrelum-os/blob/main/research/ai-evaluation-2026-11-09/raw/aml-parallel-response.json)
  - [NATO raw prompt and provider output](https://github.com/AuroraGrid/kahrelum-os/blob/main/research/ai-evaluation-2026-11-09/raw/nato-parallel-response.json)
  - [HUM raw prompt and provider output](https://github.com/AuroraGrid/kahrelum-os/blob/main/research/ai-evaluation-2026-11-09/raw/hum-parallel-response.json)
- **No held-out data:** Original questions, reference answers and grading anchors were authored together in the source v1.0; therefore new benchmark contamination and external generalization are unknown.
- **No published pass/fail claims for an employer:** A numeric rubric score here does not establish job readiness, occupational qualification or micro1 vetting.
- **No real incident findings:** AML, NATO and HUMINT events are fictional training exercises; public sources are governing context only.

## Public source documents
- S1: [FinCEN 2025 SAR FAQs Question 4](https://www.fincen.gov/system/files/2025-10/SAR-FAQs-October-2025.pdf)
- S2: [North Atlantic Treaty Articles 4 and 5](https://www.nato.int/en/about-us/official-texts-and-resources/official-texts/1949/04/04/the-north-atlantic-treaty)
- S3: [NATO Collective defence and Article 5](https://www.nato.int/en/what-we-do/introduction-to-nato/collective-defence-and-article-5)
- S4: [NATO Cyber defence](https://www.nato.int/en/what-we-do/deterrence-and-defence/cyber-defence)
- S5: [College of Policing Investigative interviewing](https://www.college.police.uk/app/investigation/investigative-interviewing/investigative-interviewing)
- S6: [NIJ Eyewitness Evidence Guide](https://nij.ojp.gov/library/publications/eyewitness-evidence-guide-law-enforcement)
- S7: [National Academies The Polygraph and Lie Detection, ch. 6](https://www.nationalacademies.org/read/10420/chapter/8)

## Required next validation

Obtain a second model and blinded independent human adjudicator, use new unseen scenarios not authored alongside the answer keys, record sampling method/model versions/decoding settings, and compute inter-grader agreement. Preserve raw outputs and revisions; do not backdate later records.