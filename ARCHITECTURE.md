# KAHRELUM OS — Architecture

## Intent

Provide a **control plane** for work where wrong or unverified claims are costly: research operations, AI evaluation, evidence publication, and decision support.

## Core loop

1. **Intake** — signals, documents, model outputs, OSINT, tickets.
2. **Classify** — fact vs inference vs forecast vs opinion; source class.
3. **Verify** — RECORD LOCK path: support, counterargument, revision conditions.
4. **Stress** — optional red-team / adversarial pass on high-impact claims.
5. **Gate** — human approval for publication, deployment, outbound contact, spend.
6. **Act / record** — action state + audit trail; failures and blockers logged.

## Autonomy boundary (default)

**May run without extra approval:** research, analysis, drafting, scoring, internal records, branch work, diagnostics, preparation.

**Requires human approval:** public publishing, job applications, recruiter outreach, production deploy, protected-branch merge, purchases, contracts, credentials, destructive actions, financial transfers.

## Module boundaries

- **RECORD LOCK** owns claim lifecycle and publication readiness.
- **Intel Tripwire** owns staged operating picture and source health, not final publication truth.
- **Red-Team Dashboard** owns authorized evaluation protocols, not production inference for end users.
- **Portfolio** is a publication surface, not the control plane itself.
- **Command Center** (private) owns priority queue and cycle discipline.

## Non-goals

- Autonomous execution without audit
- Confusing model confidence with accuracy
- Absorbing every personal project under the OS brand
