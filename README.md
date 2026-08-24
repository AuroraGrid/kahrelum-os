# KAHRELUM OS

**Evidence-to-decision control plane**

Founder: [Hasan Raza Kazmi](https://github.com/AuroraGrid)

KAHRELUM OS is an **application-layer operating system** for research, AI evaluation, and decision work that must remain traceable and human-approved before action. It is not a kernel OS and not a chatbot product.

## One-line

Separate facts from inference. State what remains unproven. Document constraints and falsifiers. Do not confuse model confidence with accuracy.

## Evidence pipeline

```
Signal intake
  → Source / claim classification
  → Evidence verification (RECORD LOCK)
  → Optional adversarial checks (Red-Team)
  → Human approval gate
  → Auditable action state
```

## Commercial intelligence pipeline

```
SCOUT (find) → BLACKGLASS (attack) → independent verify → KAHRELUM decide
```

Details: [INTELLIGENCE-PIPELINE.md](./INTELLIGENCE-PIPELINE.md)

Operator skills (not public SaaS): `kahrelum-scout`, `kahrelum-blackglass`.

## Modules

| Module | Role | Repo |
| --- | --- | --- |
| **RECORD LOCK** | Evidence verification and controlled publication | [record-lock](https://github.com/AuroraGrid/record-lock) |
| **Intel Tripwire** | Staged operating picture and source health | [intel-tripwire](https://github.com/AuroraGrid/intel-tripwire) |
| **AI Red-Team Dashboard** | Authorized model-behavior testing | [ai-red-team-dashboard](https://github.com/AuroraGrid/ai-red-team-dashboard) |
| **Research & Decision Systems** | Public portfolio surface | [research-decision-systems](https://github.com/AuroraGrid/research-decision-systems) |
| **Command Center** | Priorities, autonomy boundaries, cycle records | Notion (private ops) |

## Layers

| Layer | Responsibility |
| --- | --- |
| Policy | What may run autonomously vs what needs approval |
| Verification | Claims, sources, falsifiers, publication state |
| Operating picture | Live signals and source-health |
| Evaluation | Model behavior under structured test |
| Commercial intel | SCOUT find / BLACKGLASS attack / verify / decide |
| Publication | External surfaces that only show reviewed claims |
| Local runtime | Private inference and tooling (operator-side) |

## What this repo is

Architecture and doctrine only. No private media ops, no credentials, no career CRM.

## What this repo is not

- Not a generic “Agent OS” competitor
- Not a replacement for Linux/Windows
- Not a place for cert-lab coursework or experimental forks

## Links

- Portfolio (current): https://hasan-research-systems.vercel.app/
- Profile README: https://github.com/AuroraGrid/AuroraGrid

## License

Documentation in this repository is provided for transparency of the public architecture. Module repos carry their own licenses.
