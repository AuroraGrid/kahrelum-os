# KAHRELUM ONE beta setup

The consumer app lives at `/one/`, separate from the commercial landing page and the frozen research/release artifacts. It is a static installable PWA plus same-origin Vercel functions under `/api/one/`.

## Required server settings

The existing Vercel project already has encrypted `ONE_SESSION_SECRET` and `ONE_INVITES_JSON` settings for Preview and Production; the app accepts those names so existing setup is reused. The names and target scopes were checked without decrypting values. `ONE_INVITES_JSON` may be a JSON array of code strings or SHA-256 hashes, or objects with `code`, `inviteCode`, `hash`, `sha256`, `inviteHash`, or `codeHash` fields. Alternatively set these canonical names in the separate Vercel `kahrelum-os` project:

- `KAHRELUM_ONE_SESSION_SECRET`: at least 32 random bytes, e.g. output from `openssl rand -hex 32`. `ONE_SESSION_SECRET` is supported as a fallback.
- `KAHRELUM_ONE_INVITE_HASHES`: comma-separated SHA-256 hashes of invite codes. Generate a high-entropy code with `node scripts/make-kahrelum-one-invite.mjs`; send the code only to its intended recipient and keep only its hash in this variable. Codes remain reusable until removed from the variable and redeploying. `ONE_INVITES_JSON` is supported as a fallback for the formats described above.
- `GEMINI_API_KEY`: a server-only key from a Google AI Studio Free Tier project. Do not link a billing account or use a paid API key. Never add it to the PWA or a `NEXT_PUBLIC_*` variable. Free-tier prompts and responses may be used to improve Google products, so the app warns testers not to send sensitive information. This beta has no rate limiter or persistent per-user quotas; issue invite codes only to trusted testers.

The chat endpoint is disabled when its settings are missing; it does not return a fabricated demo answer. Live search is opt-in per message and fetches DuckDuckGo's public HTML results page directly, with no search API credential or search billing account. It returns up to five result links and snippets to Gemini. This is best-effort HTML parsing, not a supported search API: DuckDuckGo can throttle the app, present a challenge page, or change its markup. Search fails closed and no model call is made if there are no usable results. Search-result snippets are not full-page fetches and are not independently verified. There is no paid fallback. No provider credential is committed to source. `GEMINI_API_KEY` remains server-only; provider account billing tiers cannot be verified from Vercel, so confirm the Google project has no active billing account before inviting testers. Google Search grounding directly through the Gemini API is not used. Provider policies, model availability, and access conditions can change; do not link billing accounts or choose paid/usage-based tiers for this beta.

The intended no-billing setup uses Gemini API free-tier text generation and DuckDuckGo HTML search. The search side requires no API key, card, or app-specific quota account, but its HTML interface has no uptime or rate-limit guarantee for programmatic use. Google free-tier provider prompts and responses may be used to improve Google products. Read current provider terms before inviting testers.

Invite codes are generated with 192 bits of randomness and verified server-side using SHA-256 and timing-safe comparison. Successful redemption creates a seven-day HttpOnly, SameSite=Lax session cookie signed with the server secret. Browser code cannot authorize itself: both session checks and every chat call validate the signature on the server. HTTPS uses Secure cookies. Browser history remains local to that browser and is sent only with each request to preserve the current turn context.

## Personal memory and instructions

The beta includes a Memory & instructions panel. Custom instructions and up to 15 user-entered memory notes (200 characters each) are stored in origin-scoped browser local storage on the user's device; they are not stored in a server database or synced across devices. The user can edit or clear them from the panel. Chats themselves remain unsaved by KAHRELUM. On each chat request, the current settings are sent to Gemini as bounded personalization context. Search queries sent to DuckDuckGo contain the current question, not the memory bank. Because invite access does not identify an individual account, do not move memory storage server-side until real per-user authentication and isolation exist.

Assistant answers are normalized to remove visible asterisk-style Markdown markers; lists use hyphens or numbering.

## Beta pipeline execution boundary

Everyday chat uses one Gemini request with quiet evidence and uncertainty guidance. The server-side ROUTER sends explicit verification/source requests, or a user-selected KAHRELUM Check, through an ordered beta review: a deterministic route and keyword-only AAIK exposure screen; optional DuckDuckGo SCOUT retrieval; SOURCEGRID mapping by publisher host; a Terra K-ALIGN/IPR pass; a separate Luna/BLACKGLASS-I counterevidence pass; then Sol CRF/COMMAND synthesis with a same-model BLACKGLASS-II self-audit. A SHA-256 response fingerprint is returned, but the preview has no durable RECORD LOCK store.

All three review passes use the same Gemini model and provider. They are sequential responsibilities, not independent model verification and not the frozen KAHRELUM OS v2.3.4 runtime. A Check uses three Gemini requests; opting into live search adds one DuckDuckGo HTML request. The beta uses no paid fallback and fails closed when the model free-tier limit or a search service error prevents completion. Search remains user-opted-in; DuckDuckGo can rate-limit automated requests without warning.

## Deploy

The existing `kahrelum-os` Vercel project is separate from the Firebase commercial site and has no `kahrelum.com` custom domain attached. A Vercel deployment makes this beta available at its Vercel host under `/one/`; it does not put the PWA on the commercial domain. Do not point the root domain or change Firebase hosting as part of this beta. A later custom subdomain can be connected after its DNS is verified.

## Functional checks

`node --test tests/kahrelum-one.test.cjs` exercises invite rejection, code redemption, signed session acceptance/tamper rejection, and chat authorization/provider behavior with mocked upstream responses. `npm` dependencies are not required; tests use the Node built-in test runner and `fetch`.
