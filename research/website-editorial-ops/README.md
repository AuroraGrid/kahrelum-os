# Website and editorial operations — November 17, 2026

REVIEW CANDIDATE. No merge, Firebase preview/deployment, social publishing, reconnect, retry or outreach was performed.

## Verified defects and fixes

1. Production homepage ended its C7 explanatory sentence with `limitations. until verified.`. The older release3 transform replaced only the middle of the old sentence. The updated transform consumes the complete original sentence and repairs the exact malformed deployed variant. The site-completion transform also recognizes that exact variant. Neither globally removes uncertainty language. The downloaded live homepage was patched locally; comparison proves the only body change is the exact suffix removal. The local desktop/mobile preview retained the C7 statement and had zero page overflow.
2. `research/election-challenge-2026/current-sources/*.json` lacked an LF checkout attribute. On Windows, committed receipt SHA-256 values differed from checkout bytes. Add only `text eol=lf`; no historical receipt or expected hash is edited. Example: VotePredictor committed LF SHA-256 `84be1bbeaa471e2b7943a6790698628dac9948e6fdd79f1bc3ee11c59658a2b0`; CRLF checkout SHA-256 `1d1abaaf7ab7efdd64afbd07382d9a2d53817f13625642934a93e2ed2f010cb3`. Test-first record retained.

## Scope and collision check

Baseline main: 2b24b392cf80a04f421100d4f4e1378421289fc8. Separate worktree/branch `codex/website-editorial-ops`; MQA branch `codex/mqa-001` kept separately. No concurrent writes into either checkout. Existing source and validation worktrees were preserved. Seven existing open PRs were inspected; none claimed this exact homepage correction or MQA-001. Other research/forecast drafts remain untouched.

Maintenance changes `.gitattributes`, `scripts/release3-live-patches.cjs`, `scripts/site-completion.cjs`, a focused test and this evidence directory. MQA changes different files, including its own bounded manual publisher profile. No shared modified implementation file between these two branches. Both must be rechecked against main before any merge because other sessions may advance it.

## Live audit

- Home, /pilot, /assurance, /insights and /investigations/ca-001 returned HTTP 200. Each exposed a 1200×630 PNG and summary_large_image metadata; exact image hashes and metadata are in live-metadata-audit.json.
- /insights/morgan-dollar-quote returned HTTP 404, as expected before approved publication. No existing route collision found.
- Pilot page visibly preserves $750 Fit Check, exactly three historical decisions, $2,500 pilot and eligible 14-day credit. Existing scope/permission/payment prerequisites are visible.
- Live inquiry form was tested using synthetic, non-confidential text. Its preview reflected the workflow, concern and $750 selection. Neither email-launch nor send was activated. Inputs were cleared and placeholder preview restored. Desktop and 390px mobile had zero page overflow.
- Local maintenance preview was verified at desktop width 1396 and mobile width 390; zero horizontal overflow and the malformed suffix absent.
- This is a bounded audit of primary commercial/editorial surfaces, not proof every page or all historical articles are flawless. No broad redesign or unrelated artwork regeneration was submitted.

## Account and publication readback

Substack authenticated as Hasan Raza Kazmi with Dashboard/Customize controls. Visible published records: AIR-02 (Nov 13), CA-001 (Nov 15), watchlist article (Nov 15). No republishing.
X authenticated as @Nospinzone with Edit profile and account menu. Existing AIR-02, CA-001 and watchlist native articles visible. Multiple CA-001 promotional/link posts already exist; no additional promotion generated for that old article.
LinkedIn public profile navigation reached an authentication wall. Authenticated publication status there remains unverified.
Buffer authenticated. Schedule showed one NOT PUBLISHED CA-001 LinkedIn item, dated Nov 15 at 11:15 America/New_York, with explicit lost-authorization error; zero drafts and 21 sent items shown. Queue item was preserved; no connection refresh, retry, deletion, rescheduling or duplicate creation. Home's zero upcoming posts and Schedule's one queued item reconcile as a failed item, not a future scheduled post.
Direct HTTP requests to three Substack article pages returned 403; browser publication listing was readable. Their current share-image metadata is not verified by those HTTP requests. See substack-metadata.json; do not claim a generic-card issue is fixed or still present from old memory.

## Editorial lane and approval backlog

Gold, silver and Bitcoin remain explanatory editorial topics, separate from retrospective AI-assurance evidence. No market prices, current recommendations or FanDuel Predicts comparison were fabricated. A specific market article and its sources/approval were not found in this checkout; no new daily market post was invented to fill that gap.

1. Review/approve the maintenance PR; coordinate the existing scoped release process and live baseline. Existing workflow triggers may deploy after a main merge. This task does not treat draft preparation as deployment approval.
2. Resolve LinkedIn sign-in/Buffer authorization interactively, then check whether the existing failed CA-001 item was already published elsewhere before any separately approved retry. Preserve its content/calendar.
3. Confirm Substack per-article share-card metadata/crop in the editor before asserting full preview readiness. Existing published articles stay intact.
4. Keep MQA-001 assets and adaptations review-only until its independent publication approval. Canonical article first; then separately approved Substack/native X/LinkedIn adaptations. One distinct MQA promotional post maximum in the current packet.
5. Reuse validated artwork and topic-specific evidence; no stale global social-manifest rollback.

## Tests

Five new focused tests: 5 pass. Initial suffix tests: 1 pass / 3 fail; first fix: 3 pass / 1 fail (the generic replaceUnique helper rejected a replacement contained within its old text); final exact-match guard passes. EOL test first failed, then passed after the attribute addition.
Complete suite and exact commands are recorded in VALIDATION.md. Canonical-byte verification is distinct from the initial Windows checkout run.
