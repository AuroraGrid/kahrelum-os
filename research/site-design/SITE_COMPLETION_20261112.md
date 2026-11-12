# KAHRELUM | Consolidated site completion · November 12, 2026

**Mission:** This is one integrated repair pass for all source-supported issues remaining after Releases 1–3, AI Discovery and AI Visibility. The entire public site is larger than the pages scoped for editorial changes; this release explicitly distinguishes observed defects from scanner heuristics and third-party platform constraints.

## Source-verified repairs

- Correct the stale 19-character /insights search title and matching social titles without changing historical article cards or artwork.
- Give the NFL deadline audit a dated how-to-read section. Seventeen source-linked in-season transactions, a 123-player fixed-cohort Brier result **worse than all-NO**, and the unresolved six-trade FC1 are separate outcomes. Original November 5 tracker remains archived, and old probabilities remain unchanged.
- Give the /election-data/ directory human-readable explanations of unofficial U.S. race calls, original forecast locks, the dated Israeli C7 official-result audit, and why external comparators must not be misrepresented as native KAHRELUM predictions.
- Remove the precise stale footer sentence about official Israeli results still being pending **only if present on the currently authenticated live homepage**. If no such sentence survives, homepage remains unchanged. The source index already contains the C7 completion section.
- Add `<lastmod>` only to these actually modified public HTML pages. Do **not** stamp every archived case today; a sitemap timestamp is an actual page edit, not proof of new evidence verification.

## Explicit Firebase Hosting protocol change

The previous publisher deliberately preserved Hosting config, so headers and HTTP semantics could not be fixed by HTML patches. This release makes one narrow, schema-validated delta to the **REST VersionConfig**: add exact-path `Content-Type: text/markdown; charset=utf-8` and a canonical `Link: <https://kahrelum.com/...>; rel="canonical"` response header to 13 existing Markdown files. It **does not** modify any redirects, rewrites, old headers, cleanUrls or access controls, and does not assert that static Hosting can vary HTML versus Markdown based on an Accept request header.

The preview must have exactly these headers on publicly fetched Markdown routes, keep all existing other Hosting config identical, and match the intended file map. Production promotion refuses if the live version changed after preview, if the exact expected config hash changed, or if the deployed response headers differ. This is intentional configuration change, not a broad overwrite.

## Functional QA

Before production promotion, a headless Chrome smoke test visits four commercial/editorial routes at **320, 390, 768 and 1280 pixels**, checks navigation and unique H1, scroll overflow and the buyer inquiry's locally previewable form and labels. No test ever submits the form, sends email, reaches private records or changes any user's state. These are lab viewport checks, **not** Google Core Web Vitals real-user measurements, and do not establish Google ranking.

## False positives and legitimate constraints

The external AI-agent scanner scored **68/100**, with `llms.txt` 100/100 and 20/55 sitemap lastmod dates before this work. The scanner repeated missing-JSON-LD and missing-MD claims even on pages where production Github-verified JSON-LD and explicit alternate links exist. Do not copy a scanner warning as a fact. Real static-file HTTP response header semantics **are** actionable and are treated here. Lack of Accept header content negotiation on static Hosting remains outside this source-bound change; implementing it requires an edge/function service and a separate infrastructure and security review.

Site-wide image-alt warnings caused by deliberately text-only articles are not proof of failed accessibility, and prior work deliberately excluded picture changes. We do not create decorative photos simply to increase an SEO score. The historical source case archives, candidate portraits, OG images, election/forecast locks and NFL evidence records remain immutable.

## Rollout contract

- Branch-owned tests first (red), functional code then full Node/public-surface CI.
- One guarded `site-completion` profile in authenticated Firebase project `kahrelum-public-hosting`: four bounded public HTML patches, XML sitemap and 13 exact Markdown-header entries.
- Allowed Hosting file changes are **only** index.html (if obsolete line survives), insights.html, nfl/deadline-watch-2026.html, election-data/index.html, and sitemap.xml. All other 9,000+ live file hashes must remain identical.
- Guarded Plan -> Preview -> real Chrome mobile/desktop QA -> Promote -> exact file-map/config/HTML/header production readback, with public GitHub Actions receipts.
- If any step fails, production remains on the earlier version. Never describe a Git merge as a successful deployment.

## Remaining external dependencies to report honestly

Only Google's Search Console can verify crawl status, indexing, canonical selection, and request recrawls; an updated sitemap does not guarantee its search results change. Core Web Vitals such as field INP and real-user LCP require CrUX/PageSpeed field data or supported performance tooling; headless layout checks are not substitutes. KAHRELUM's optional future secure server-submitted buyer form requires architecture, privacy and consent review and is not impersonated by the existing user-reviewed email composer. User-configured cloud browser credits may be unavailable, independent of our GitHub Actions browser test.

## Real-browser QA correction, same coordinated release

The initial production promotion was blocked by the headless Chrome preview test on November 12: homepage 320px viewport overflowed horizontally by **68px**. Firebase preview configuration and source file-map checks had passed; this is a genuine client-rendering defect rather than a source-file problem. The new shared CSS wraps multi-column tables in their own accessible horizontal scroll container, preserving text/cells and removing page-wide scroll. The Chrome test now logs the overflowing elements by tag, class, and bounding rectangle if any other route still fails. The old production version remains live until the full responsive QA and Markdown-header tests pass on the replacement preview. No tests are removed, and the initial blocked attempt is preserved in the Actions history.
