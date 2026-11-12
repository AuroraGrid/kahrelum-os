# Release 2: text-only investigation/Insights discoverability and provenance

**Editorial date:** November 12, 2026. **Deployment target:** Firebase Hosting `kahrelum-public-hosting`. **Authorized profile:** `investigations-text-only`. **Scope:** Patch `/investigations.html` and `/insights.html` from a verified live baseline, changing bounded existing discovery material only. No artworks, candidate portraits, social-preview cards, new source documents or unreleased case pages are published.

## Correction: CHIP-01 and Hegseth listings were stale

The two public index pages still described CHIP-01 as last updated November 10, after both detailed Nvidia/Megaspeed pages acquired November 12 source addenda. The new cards record Reuters' November 12 report about Megaspeed's attributed claimed cooperation with BIS inspections and its commissioned legal review. The claims **do not** constitute authenticated U.S. regulator clearance, proven wrongdoing, or a completed inventory audit. Detailed primary and contrary evidence remain in [CHIP-01's November 12 addendum](../chip-01/update-2026-11-12.md).

The Insights index now explicitly describes House Clerk roll call 317, November 10: a 211–204 **referral to the Judiciary Committee**, not House impeachment. The original Hegseth November 9 subjective forecast remains unchanged: 64% impeachment by November 20, 76% by December 31, 45% departure by December 31, and 5% Senate conviction by June 30, 2027. Source [dated evidence addendum](../us-hegseth-2026/2026-11-12-procedural-vote-addendum.md).

## Newly supplied Huang resignation claim: verification status

A user-supplied claim on November 12 stated Huang resigned both board and CEO offices and CFO Colette Kress was appointed interim CEO. **As checked during this November 12 editorial session, no first-party Nvidia resignation/appointment announcement or effective-dated SEC corporate filing was authenticated. Do not publish the supplied claim as fact or score a leadership forecast.** Reuters reported on November 11–12 that Nvidia's board met to consider removing Huang, and that Kress was among *possible* interim successors. The latest independently checked Nvidia official management roster still listed Huang as CEO and Kress as CFO. The leadership forecast 85% CEO retention / 10% voluntary exit / 5% involuntary removal by February 10, 2027 stays frozen and unscored. If an official announcement later arrives, treat it as a **new dated event**, not an earlier confirmed one. Source records:

- Reuters board deliberations: https://www.reuters.com/technology/nvidia-is-preparing-oust-ceo-jensen-huang-wsj-reports-2026-11-11/
- Reuters succession candidates: https://live.euronext.com/en/financial-news/whos-next-ceo-nvidia-top-engineer-and-cfo-favored-candidates
- Nvidia management listing: https://investor.nvidia.com/governance/management-team/default.aspx
- Nvidia November 10 independent counsel statement: https://investor.nvidia.com/news/press-release-details/2026/Statement-from-the-Independent-Members-of-the-NVIDIA-Board/default.aspx

## Preserve investigation historical record and privacy

The source register includes 56 historical case families plus four extension leads, which are not 60 completed public investigations. The existing 12 public-case summaries retain their actual October 31 through November 2, 2026 review dates and original evidence body bytes, corrections, status labels and source links. This November 12 **index publication timestamp is not a fresh 12-case evidence review**. No automatic website source-collection pipeline is authenticated by this release. The old `data-investigations-release="2026-11-02.1"` remains as the historical evidence marker.

Ten public case-detail routes were checked individually during this session and returned HTTP 200 with original findings and cited sources. They can now be linked from one directory without generating or republishing their content:

- https://kahrelum.com/investigations/corp-04
- https://kahrelum.com/investigations/cyber-02
- https://kahrelum.com/investigations/mkt-02
- https://kahrelum.com/investigations/corp-01
- https://kahrelum.com/investigations/corp-02
- https://kahrelum.com/investigations/corp-03
- https://kahrelum.com/investigations/cyber-01
- https://kahrelum.com/investigations/ai-05
- https://kahrelum.com/investigations/geo-01
- https://kahrelum.com/investigations/air-01

**Privacy controls:** COURT-01 and COURT-05 remain NEEDS REDACTION. Their pre-existing detail URLs are deliberately *not* linked from the new directory and their noindex directives are unchanged. Existing draft PR #68 regarding Laura Loomer remains separate, under a deliberate editorial hold. No publication permission is implied by this release.

## Required release and acceptance gates

1. On a new Git branch, tests must first fail (RED), then pass once the canonical text updates and guarded live patching exist (GREEN).
2. The `investigations-text-only` Firebase profile uses current live Hosting inventory and verifies the hash of `/investigations.html` and `/insights.html` before editing. It keeps all original twelve case-card bytes and unrelated live HTML, head metadata, other URLs, image hashes and Hosting config intact.
3. Only `/investigations.html` and `/insights.html` may be changed in a plan; any unexpected file, source change or production drift requires stopping.
4. The full Node integrity suite must pass, followed by guarded Plan → Preview → Promote → exact live readback. Neither a merged PR nor a green CI test alone is proof of publication.

**Evidence correction policy:** New official findings, especially on CEO succession, must be appended with source date, verified event date, and explicit custody limits. Do not alter earlier forecast locks or silently rewrite old editorial dates.
