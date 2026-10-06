# Model-weight security: what lawmakers ask, and what frontier labs disclose

**KAHRELUM Research Dossier — October 2026**  
**Research question:** How much can the public actually verify about the security of frontier-model weights?

## Executive finding

Model weights are increasingly treated as national-security assets, but external verification remains structurally difficult.

In May 2026, U.S. senators asked nine major AI companies to explain how they detect foreign espionage, manage insider threats, protect sensitive model information, and notify the government about security threats. OpenAI and Anthropic both publicly describe weight-security programs. Anthropic goes further than most by publishing risk reports and concrete classes of controls.

The problem is that the strongest evidence needed to verify those claims cannot safely be fully public. Detailed network architecture, access paths, logging systems, and red-team findings would themselves create security risk.

The accountability challenge is therefore not "publish everything." It is to create a credible chain of independent assurance between confidential technical evidence and public trust.

## Congressional demand

### FACT 1 — Lawmakers are treating frontier-model theft as a national-security issue

On May 1, 2026, Senate Judiciary Committee Chairman Chuck Grassley and Senator Jim Banks announced letters to OpenAI, Anthropic, Google, xAI, Meta, Microsoft, Amazon, Safe Superintelligence, and Thinking Machines Lab.

The senators asked the companies to describe efforts to:

- detect and guard against Chinese espionage,
- manage insider threats,
- secure sensitive AI model information,
- and notify the U.S. government in the event of a security threat.

Source: U.S. Senate Judiciary Committee, ["Grassley, Banks Press American AI Companies on Chinese Espionage Safeguards"](https://www.judiciary.senate.gov/press/rep/releases/grassley-banks-press-american-ai-companies-on-chinese-espionage-safeguards).

## What OpenAI publicly says

### FACT 2 — OpenAI keeps its most capable model weights controlled rather than broadly distributing them

OpenAI has said its most powerful models are deployed as services and that it does not distribute those weights outside OpenAI and Microsoft. It describes third-party audits, penetration testing, bug bounty programs, and technical, administrative, and organizational security controls.

Source: OpenAI, ["Our Approach to Frontier Risk"](https://openai.com/global-affairs/our-approach-to-frontier-risk/).

OpenAI's 2026 Frontier Governance Framework also lists security-risk management and incident response among the areas covered by its governance program.

Source: OpenAI, ["OpenAI's Frontier Governance Framework"](https://openai.com/index/openai-frontier-governance-framework/).

## What Anthropic publicly says

### FACT 3 — Anthropic publishes unusually specific categories of weight-security control

Anthropic says its ASL-3 security standard uses more than 100 controls focused on protecting model weights from sophisticated non-state actors. Publicly described examples include:

- two-party authorization for weight access,
- enhanced change-management controls,
- endpoint allowlisting,
- and egress-bandwidth restrictions intended to make large-scale exfiltration harder.

Source: Anthropic, ["Activating AI Safety Level 3 protections"](https://www.anthropic.com/news/activating-asl3-protections).

Anthropic's February 2026 Risk Report says its threat modeling covers endpoint compromise, supply-chain attacks, physical attacks, cloud compromise, privilege escalation, and data exfiltration.

Source: Anthropic, [February 2026 Risk Report](https://www-cdn.anthropic.com/097c63b5fe7dd8b14866e1f15bb1910ec713658a.pdf).

Anthropic also says its public compliance framework covers protection of model weights and safety-incident response.

Source: Anthropic, ["Transparency Hub"](https://www.anthropic.com/transparency/voluntary-commitments).

## A revealing limitation

### FACT 4 — Publicly described security standards have threat-model boundaries

Anthropic's published ASL-3 material distinguishes between actors its controls are designed to address and more capable threats that may remain out of scope.

That distinction is important. "Secure" is not a binary property. A system can be well defended against criminals and corporate espionage while still being exposed to the strongest state-level actors.

Anthropic's own research on confidential inference cites higher security levels intended for state-sponsored and top-tier nation-state threats.

Source: Anthropic, ["Confidential Inference via Trusted Virtual Machines"](https://www.anthropic.com/research/confidential-inference-trusted-vms).

## The verification problem

### INFERENCE

Public transparency alone cannot establish whether frontier weights are adequately protected.

A company can truthfully disclose categories of controls while outsiders remain unable to judge:

- implementation quality,
- coverage gaps,
- exception processes,
- standing privileged access,
- insider-risk monitoring,
- cloud-provider dependencies,
- incident-detection latency,
- or the results of the strongest penetration tests.

Publishing all of those details would be dangerous. The solution is not radical public disclosure. It is **independent confidential verification with public attestations that are specific enough to matter**.

## What a credible assurance chain could look like

### Layer 1 — Company evidence

The developer maintains detailed internal evidence: architecture, controls, access logs, exceptions, penetration-test results, red-team findings, and incident records.

### Layer 2 — Independent evaluator

A qualified third party receives enough access to test the system rather than merely review a policy document.

OpenAI itself has argued that third-party assessors should receive deep access across training, evaluation, and deployment so they can challenge safety claims and reach independent conclusions.

Source: OpenAI, ["Priorities and principles for effective third party assessments"](https://openai.com/index/priorities-principles-third-party-assessments/).

### Layer 3 — Government assurance

A designated national-security or AI-safety authority receives the highest-sensitivity information that cannot safely be made public.

Anthropic's policy proposals explicitly support sharing model-security details with a designated agency on request.

Source: Anthropic, ["Policy on the AI Exponential"](https://www.anthropic.com/policy-on-the-ai-exponential).

### Layer 4 — Public attestation

The public gets a constrained but decision-useful report:

- threat level assessed,
- scope of systems reviewed,
- classes of tests performed,
- material deficiencies found,
- whether deficiencies were remediated,
- exceptions or unresolved risks,
- and date of the next review.

This is more informative than "we take security seriously" without exposing exploit paths.

## Counterevidence

There are legitimate reasons not to disclose more.

- Detailed controls can help attackers map defenses.
- Government reporting can itself create new sensitive repositories.
- Independent assessors can become high-value targets.
- Some security properties cannot be proven by a point-in-time audit.

These constraints argue for careful assurance design, not for abandoning external verification.

## Update triggers

The assessment should be revisited if:

1. Congress or an agency publishes company responses to the May 2026 letters.
2. A frontier lab discloses a material model-weight theft or attempted exfiltration.
3. A regulator creates a formal confidential model-security audit regime.
4. Independent assessors publish sufficiently detailed attestations for OpenAI, Anthropic, or peers.
5. Frontier developers begin using cryptographic or hardware-backed mechanisms that materially reduce reliance on organizational controls alone.

## Reporting questions

For OpenAI and Anthropic:

- Which threat actors are your current weight-security controls designed to defeat?
- Which threat classes remain outside the design target?
- How often do independent teams test full end-to-end exfiltration paths?
- How many people or automated identities can obtain standing access to weight-bearing systems?
- What event would trigger immediate government notification?
- Have 2026 security reviews identified material deficiencies that were not public?

For lawmakers:

- Will company responses to the May letters be made public in redacted form?
- What minimum model-security standard should apply to systems above defined capability thresholds?
- Which agency should receive confidential evidence and audit results?

## Assessment

**FACT:** Congress is asking frontier labs for stronger evidence about espionage, insider threats, model security, and government notification.

**FACT:** OpenAI and Anthropic publicly describe meaningful weight-security programs; Anthropic provides unusually detailed public controls and risk reporting.

**INFERENCE:** The public still lacks enough evidence to independently verify the strongest security claims.

**POLICY IMPLICATION:** A confidential independent-assessment layer is the most plausible bridge between necessary secrecy and democratic accountability.

---

### Core sources

- Senate Judiciary Committee: https://www.judiciary.senate.gov/press/rep/releases/grassley-banks-press-american-ai-companies-on-chinese-espionage-safeguards
- OpenAI frontier risk: https://openai.com/global-affairs/our-approach-to-frontier-risk/
- OpenAI Frontier Governance Framework: https://openai.com/index/openai-frontier-governance-framework/
- OpenAI third-party assessments: https://openai.com/index/priorities-principles-third-party-assessments/
- Anthropic ASL-3: https://www.anthropic.com/news/activating-asl3-protections
- Anthropic Transparency Hub: https://www.anthropic.com/transparency/voluntary-commitments
- Anthropic policy: https://www.anthropic.com/policy-on-the-ai-exponential
