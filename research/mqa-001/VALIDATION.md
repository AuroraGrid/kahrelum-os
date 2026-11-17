# MQA-001 validation record

## Result

46 focused tests pass: 40 decision-control tests and 6 publication/custody checks. Full Node regression suite: 323 pass, 0 fail. Eight reproducible synthetic scenarios: 7 HOLD, 1 READY_FOR_COMPARISON. No external AI-model run, customer case or provider superiority measurement.

Python suite: 141 pass, 0 failures in an isolated canonical-byte verification tree. Initial native Windows checkout run: 140 pass / 1 failure due to existing current-sources JSON receipt CRLF conversion. A first isolated run still had converted receipt bytes and failed; restoring the original Git blobs for that directory in the verification copy produced the passing run. No original receipt, expected historical hash or forecast lock was changed. Workstream A adds a narrowly scoped LF checkout attribute to prevent recurrence.

## Commands and preparation

```
node --test --test-reporter=tap tests/mqa001*.test.cjs
node research/mqa-001/run-scenarios.mjs
python3 scripts/build-kahrelum-editorial-social.py
node --test --test-reporter=tap tests/*.test.cjs
python -m unittest discover -s tests
node --check scripts/firebase-overlay-release.cjs
python scripts/render-mqa-social.py
```

Use the existing workspace test-env Python environment (CairoSVG 2.8.2) on PATH for Node tests that spawn python3. Build the eight existing NFL social test fixtures as CI requires; they are not part of this PR. Thirteen public Markdown mirror checkout files were normalized to LF for existing newline-sensitive tests; Git content did not change. The two explicitly CRLF historical Israeli locks retain their original declared bytes.

Initial full Node run: 308/317 passed; failures included missing CairoSVG/generated fixtures and four Markdown CRLF assertions. After environment/build preparation: 313/317. After checkout-only Markdown normalization: 317/317. Six new publication tests then increased the final total to 323. Failures were investigated, not hidden by skipping tests.

## Custody, SEO and layout

- 12 protected raw-file hashes unchanged: protected-before.json equals protected-after.json. Portable test separately checks normalized content against exact Git blob hashes in protected-git-baseline.json.
- 36 existing Insights hrefs retained; none removed. New clean URL was HTTP 404 on production before publication, so no existing route was replaced.
- Canonical/OG URL agreement, Article JSON-LD, large Twitter card, alt text and intrinsic image sizes checked. All 16 local href/src targets resolve to existing files; primary external sources were reviewed through HTTP/web/browser as recorded.
- Browser QA: main H1 unique, no broken main image, no page horizontal overflow across four observed widths; 320px and 390px mobile exact. Keyboard Enter opens the mobile menu with visible focus. Actual desktop CSS widths reflect user's browser zoom; see browser-qa.json rather than calling them exact 1280px.
- Original artwork visually inspected, no clipped headline or fabricated market chart. Assets: website/X link 1200×630; LinkedIn 1200×627; Substack 1456×1048; native X Article 1500×600. Current KAHRELUM paper/ink/purple/green/gold colors reused. Exact bytes and dimensions in asset-manifest.json. Platform crop/readback remains pending until approved upload.
- No source photos copied. No licensing claim about a third-party image is needed for the original geometry/typography.

## Publication blockers

Original ZIP/18 files, original 15-test baseline and transcript remain unrecovered. Approval must accept this explicitly labeled reconstruction, or provide originals for a separate reconciliation. The actual $42 offer remains HOLD. Final merge, deployment, platform publication and outreach require separate approval. Review live shared indexes for concurrent changes before release. No Firebase preview quota consumed; local preview is not a public release.

Detailed initial/final full-suite logs are retained in the parent workspace evidence directory; focused red/green logs, synthetic outputs, source hashes and QA summaries are committed here. Current working-tree SHA is stated in the PR and final handoff rather than embedded self-referentially in this file.
