# AI Discovery + SEO targeted release | 2026-11-12

**Purpose:** improve AI crawler readability and source-bound on-page SEO without a website redesign, artwork changes, new customer-data collection, or retrospective editing of research.

## Based on the new November 12 audit

- Independent Agent Ready scan: 66/100 across five sampled pages, `llms.txt` 100/100, sitemap modification dates present for 15 of 55 entries. Not a measured total-site AI readiness score.
- On-page SEO: homepage and pilot 96/100; assurance, NFL, election-data 88/100; investigations, forecasting and Nvidia 92/100; Hegseth 96/100. Automated assessments may mistake legitimate text-only pages for missing image alt tags or miss existing structured data injected at Firebase publication.
- Public `AGENTS.md` and `llms.txt` are read-only instruction/discovery resources. They are **not** an installable privileged agent, a promise of real-time tools, or permission to access client files.
- Site version baseline: current `main` at the branch's starting SHA. This release does not change historic evidence dates or scores.

## Changes

- Exact, route-canonical `Service` for /assurance; `CollectionPage` for /investigations and /forecasting; `SoftwareApplication` for /evidence-scorecard. None asserts a fictitious company address, reviews, awards, certification, or guarantee.
- Four Markdown reference pages under `/ai-discovery/` with frontmatter, canonical links, bounded claims and a Sitemap section. Pages disclose they are summaries, **not newly authenticated source evidence**.
- Four HTML documents acquire `rel=alternate type=text/markdown` and `rel=describedby` references, while preserving existing Open Graph images. `AGENTS.md`, `llms.txt`, and `sitemap.md` point to the new materials.
- The assurance and pilot FAQ transparently distinguishes the $750 Fit Check from the $2,500 Founding Pilot, de-identified permissioned inputs, no production access, conditional delivery targets and a manually sent email inquiry. Never pretend the site sends or stores a message automatically.
- XML sitemap receives exact `lastmod=2026-11-12` for these changed canonical pages only. Missing historic dates elsewhere stay missing until authenticated.
- No content-negotiation response headers or special server-wide Markdown MIME type claim. Static links expose files, but not an API contract.

## Safety and deployment

The Firebase `ai-discovery-seo` profile reads the currently deployed HTML and verifies its Hosting SHA before adding only approved head metadata and FAQ section. Its isolated allowed paths are five HTML files, four public Markdown mirrors, three public discovery text documents and the XML sitemap. Homepage, API, historical case cards, frozen election and NFL forecasts, social image files, CSS/JS and source records remain untouched.

- Test-driven work: red test first, then implementation, full integrity CI and a guarded GitHub PR.
- Publisher must produce Plan, Preview, Promote and exact production readback. GitHub merge alone is insufficient.
- Accurate crawler change does not guarantee Google indexing or a score increase. Search Console and mobile Core Web Vitals require separately verified measurements.
