# Engineering development and acceptance

This is the public static-site/evidence repository, not the frozen KAHRELUM
runtime archive. Preserve all history and locked records. The Firebase live
site contains additional files not reconstructed by this checkout.

## Reproduce local checks

Baseline verified on Linux, Python 3.12.14 and Node 24.22.1, using only their
standard libraries. These are observed versions, not a claim that other versions
are supported. No dependency installation or credentials are needed for the
commands below. Start from a clean clone and record its exact SHA:

```sh
git status --short
git rev-parse HEAD
python3 --version
node --version
python3 -m unittest discover -s tests -p 'test_*.py' -v
node --test tests/*.test.cjs
python3 scripts/build_nba_player_portraits.py --check
python3 scripts/sports_intelligence.py validate
node --check scripts/firebase-overlay-release.cjs
git diff --check
```

Also execute the canonical-surface check in the existing
`.github/workflows/public-surface-integrity.yml`. The workflow is authoritative
for its own checks; do not silently omit a step when reporting CI equivalence.
Do not run network ingestion or deployment scripts as part of setup.

Serve the static checkout for local browser verification:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/nfl/trades.html` in a browser that can reach that
runtime. Check rendered cards, a player search, team/evidence filters and an
empty result. Inspect visible evidence labels, responsive layout and image
fallbacks. Use desktop and mobile viewports for visual changes. The simple
server uses `.html` paths; it does not reproduce Firebase clean URLs, rewrites,
production-only files, external services or release authorization.

The existing Node DOM tests run client JavaScript in a VM with mocked DOM and
fetch. They do not prove image loading, layout or actual browser interaction.
If the available browser cannot reach the local process, record the connection
failure and keep the working-app criterion blocked. Do not replace it with a
production screenshot or label a different deployment as this branch.

## Six existing owners

| Seat | Engineering responsibility |
| --- | --- |
| COMMAND | Routing, priorities and founder approval receipts |
| OPS | Existing task board, manual status checks, duplicate-routine inventory and incident reviews |
| BLACKGLASS | Independent verification, no self-certification or repair of reviewed code |
| SOURCEGRID | Primary evidence and bounded research for the assigned engineering task |
| BUILDER | Engineering implementation and supervision of authorized cloud-agent runs |
| MISC | Documentation and drafts |

These requirements do not attest to current native bot configuration. Add
engineering instructions to existing roles only after reading and preserving
their saved configuration. Do not duplicate prospecting, investigation,
forecasting or independent LinkedIn workflows.

Reuse the existing OPS board and its TODO, WORKING, BLOCKED, READY FOR REVIEW,
DONE statuses. Add fields to that same row/schema only after inspection:
task ID, owner, acceptance criteria, base/head, PR/run link, four check states
and evidence, app proof, unverified items, approval state, last checked time,
next action, retry count, and measured usage. Never instantiate a replacement
board merely because the current board is inaccessible.

## Boundaries

Use `.cursor/skills/proof-of-work/SKILL.md` for every engineering handoff.
No new recurring schedules are part of this upgrade. Existing SourceGrid
workflow monitoring is separate from engineering PR monitoring; do not clone it.
The five-minute schedule in the repository is pre-existing and year/deadline
gated. Inventory native Grok and ChatGPT/desktop schedules separately; no
cross-platform integration is assumed.

Pushing can trigger deployment hooks. The engineering dry-run branch has an
exact-name Vercel deployment exclusion in `vercel.json`; other branches retain
their prior configuration. Confirm remote status after pushing. Never merge,
promote or run production deploys without founder approval. Use the guarded
Firebase workflow documented in the root README only within separately
authorized release scope.

Rollback of this unmerged upgrade: abandon its isolated branch. If later merged,
review a revert of its specific commits. Do not reset main or delete evidence.

## Source and adaptation

[Lingxi Li's September 10, 2026 guide](https://x.ai/bot/guides/grok-bot-for-engineering)
supports domain ownership, agent supervision, shared PR tracking, executable
feedback, visual proof and incident learning. Our four checks combine its
findings, CI, conflict and subsequent independent-review steps. KAHRELUM retains
founder merge/deploy approval and does not adopt automatic merges, recurring
checks, nightly audits or P0 polling from that example.

[Cursor project-skill documentation](https://cursor.com/help/customization/skills)
documents `.cursor/skills/`. Repository presence does not prove that a particular
Grok worker loaded the skill or can launch a Cursor cloud agent.
