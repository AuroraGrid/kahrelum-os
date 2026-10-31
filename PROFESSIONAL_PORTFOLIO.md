# Hasan Raza Kazmi — Professional Research Portfolio

**Founder, KAHRELUM · Decision Intelligence Systems Architect**  
**Focus:** OSINT and public-source research · AI model evaluation · threat and source monitoring · evidence verification  
**Location:** Sargodha, Pakistan · Remote  
**LinkedIn:** [linkedin.com/in/hasan-raza-kazmi](https://www.linkedin.com/in/hasan-raza-kazmi) · **KAHRELUM:** [kahrelum.com](https://kahrelum.com)

## Profile

I design and operate evidence-to-decision workflows that make sources, uncertainty, counterevidence, methods, and unresolved questions reviewable. My work spans public-source investigations, structured AI evaluation, probabilistic research, and monitoring systems.

For these projects, I define the research question and evidence rules; collect and assess sources; develop or maintain the associated code, datasets, tests, and records; review model-assisted outputs; and publish results with limitations. The projects are owner-led and AI-assisted. Model-generated analysis is not presented as unaided writing, and automated checks are not presented as independent validation.

## Selected work

| Area | Example and my contribution | Evidence, method, and result |
| --- | --- | --- |
| **AI evaluation and evidence verification** | Maintained frozen comparison datasets and scoring records; documented scoring rules, paired comparisons, bootstrap intervals, and custody checks. | [Benchmark methods and results](./BENCHMARKS.md) · [External audit summary](./evidence/EXTERNAL_AUDIT_SUMMARY.md). The audit checked 201/201 manifested files and reproduced registered arithmetic. In RP100 (85 resolved cases), Gemini had the lowest Brier score. In GX50-v2 (45 cases), KAHRELUM had the lowest point estimate, but both primary adjusted intervals include zero. These retrospective, constructor-controlled benchmarks do **not** establish general or commercial model superiority. |
| **Election-model research** | Developed and documented owner-controlled probabilistic research code, historical data handling, election-mechanics checks, and explicit gates for missing or ineligible evidence. | [K-PREDICT v0.6 report](./research/israel-2026-election/K_PREDICT_V06_2026-10-27.md) · [Historical closure v0.4](./research/israel-2026-election/HISTORICAL_CLOSURE_V04_2013.md) · [Model-core validation](./research/israel-2026-election/MODEL_CORE_V01_2026-10-27.md). Historical mechanical reconstructions cover seven elections from 2013–2022; the repository reports 73 represented-list allocations across 840 seats and 65 passing tests for the v0.4 release. The v0.6 report rates the research **PARTIAL**: the genuine vote-share track lacks complete eligible historical inputs, and the retrospective seat-space track does not establish prospective election accuracy or model superiority. |
| **OSINT and election-integrity monitoring** | Maintained append-only, source-graded case records that distinguish official statements, attributed reporting, allegations, denials, missing evidence, and unresolved checkpoints. | [Israel 2026 case index](./research/israel-2026-election/README.md) · [Research and investigations index](./research/README.md). The records preserve cutoff rules and corrections. They demonstrate evidence triage and provenance discipline; they do not establish a confirmed interference finding or validated early-warning performance. |
| **AI accountability research** | Produced AI-assisted public-source research dossiers, separating documented claims from inference and retaining counterevidence and open questions. | [AI accountability research index](./research/README.md), including [AI incident disclosure](./research/ai-incident-disclosure.md), [model-weight security](./research/model-weight-security.md), and [compute governance](./research/anthropic-compute-governance.md). These are research dossiers, not external certifications or unaided-writing samples. |
| **Threat and source monitoring** | Built and documented a monitoring and operating-picture system with source-health and status boundaries. | [Intel Tripwire repository](https://github.com/AuroraGrid/intel-tripwire). Its README identifies it as active development with some capabilities partial; I do not claim unverified feeds or capabilities as operational. |
| **Evidence-record tooling** | Built a public reference for structured claim/source records, counterevidence, confidence, and change conditions. | [RECORD LOCK](https://github.com/AuroraGrid/record-lock). The public repository is explicitly a safe reference version using fictional example data. |
| **Authorized AI behavior testing** | Built a lightweight, inspectable community tool for structured model-behavior tests and probability-style questions. | [AI Red-Team Dashboard](https://github.com/AuroraGrid/ai-red-team-dashboard). Use is limited to models and systems owned by the tester or tested with explicit permission; this is not a claim of independent certification. |

## Methods and tools

- Public-source collection, source attribution, chronology, claim/evidence separation, counterevidence, and uncertainty tracking
- Forecast scoring with Brier score, log loss, calibration diagnostics, paired comparisons, and bootstrap intervals
- Reproducible research code, structured JSON/CSV records, test suites, versioned releases, Git, and GitHub Actions
- AI-assisted analysis with human review, documented limits, and explicit labels for facts, inferences, forecasts, and unverified claims

## Evidence boundaries

- Repository tests establish only the behaviors they exercise; they are not forecast counts.
- Hash verification establishes byte identity against a manifest; it does not prove the truth of the underlying claims.
- Retrospective benchmark results do not substitute for externally controlled prospective validation.
- AI-assisted research is labeled as such. I do not claim sole authorship of model outputs or external validation that the records do not show.
- KAHRELUM is offered for private pilots and prospective validation; published evidence does not establish generally available SaaS readiness.

## Start here

- [KAHRELUM OS overview](./README.md)
- [Research and investigations index](./research/README.md)
- [Evidence and validation](./BENCHMARKS.md)
- [Current release record](./RELEASE_v2.3.4_FINAL.md)
- [Canonical KAHRELUM site and commercial scope](https://kahrelum.com)

