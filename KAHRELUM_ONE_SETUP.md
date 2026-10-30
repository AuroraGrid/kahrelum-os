# KAHRELUM ONE beta setup

The consumer app lives at `/one/`, separate from the commercial landing page and the frozen research/release artifacts. It is a static installable PWA plus same-origin Vercel functions under `/api/one/`.

## Required server settings

The existing Vercel project already has encrypted `ONE_SESSION_SECRET` and `ONE_INVITES_JSON` settings for Preview and Production; the app accepts those names so existing setup is reused. The names and target scopes were checked without decrypting values. `ONE_INVITES_JSON` may be a JSON array of code strings or SHA-256 hashes, or objects with `code`, `inviteCode`, `hash`, `sha256`, `inviteHash`, or `codeHash` fields. Alternatively set these canonical names in the separate Vercel `kahrelum-os` project:

- `KAHRELUM_ONE_SESSION_SECRET`: at least 32 random bytes, e.g. output from `openssl rand -hex 32`. `ONE_SESSION_SECRET` is supported as a fallback.
- `KAHRELUM_ONE_INVITE_HASHES`: comma-separated SHA-256 hashes of invite codes. Generate a high-entropy code with `node scripts/make-kahrelum-one-invite.mjs`; send the code only to its intended recipient and keep only its hash in this variable. Codes remain reusable until removed from the variable and redeploying. `ONE_INVITES_JSON` is supported as a fallback for the formats described above.
- `GEMINI_API_KEY`: a server-only key from a Google AI Studio **Free Tier** project. Do not link a billing account or use a paid API key. Never add it to the PWA or a `NEXT_PUBLIC_*` variable. Free-tier prompts and responses may be used to improve Google products, so the app warns testers not to send sensitive information. This beta has no rate limiter or persistent per-user quotas; issue invite codes only to trusted testers.
- `TAVILY_API_KEY`: a server-only key on Tavily's free Researcher plan. The app sends a query only when the user turns on **KAHRELUM Check → Search live sources**. It uses Tavily basic search (1 credit per request), returns up to five source links, and sends short result excerpts to Gemini. The free Researcher plan has 1,000 credits per month, no credit card is required, and Tavily says requests stop when the free monthly credits are exhausted until reset or upgrade. Do not upgrade or enable pay-as-you-go for this no-billing beta.

The chat endpoint is disabled when its settings are missing; it does not return a fabricated demo answer. Live search is opt-in per message and fails closed if Tavily is missing, unavailable, or out of free credits. There is no paid fallback. No provider credential is committed to source. As of October 30, 2026, `GEMINI_API_KEY` and `TAVILY_API_KEY` are configured as sensitive Vercel environment variables for Preview and Production. Their values are not in the repository. The provider account billing tiers cannot be verified from Vercel; before issuing invite codes, confirm that the Google project has no active billing account and that Tavily remains on Researcher Free. No provider request has been made during setup. Google Search grounding directly through the Gemini API is not used: Google's terms classify it as a Paid Service, even though current pricing pages describe a limited free request allowance for some paid-tier models. Provider free quotas, model availability, and policies can change; do not link billing accounts or choose paid/usage-based tiers for this beta.

The intended no-billing setup uses two separately capped free tiers: Gemini API free-tier text generation and Tavily Researcher free-tier search. The Gemini API pricing table labels eligible free-tier text generation as free of charge; Google requires a billing setup to access paid tiers. Tavily's free plan explicitly requires no credit card and stops requests when its monthly credits are used. Read the current terms before inviting testers because provider plans and privacy conditions can change.

Invite codes are generated with 192 bits of randomness and verified server-side using SHA-256 and timing-safe comparison. Successful redemption creates a seven-day HttpOnly, SameSite=Lax session cookie signed with the server secret. Browser code cannot authorize itself: both session checks and every chat call validate the signature on the server. HTTPS uses Secure cookies. Browser history remains local to that browser and is sent only with each request to preserve the current turn context.

## Deploy

The existing `kahrelum-os` Vercel project is separate from the Firebase commercial site and has no `kahrelum.com` custom domain attached. A Vercel deployment makes this beta available at its Vercel host under `/one/`; it does not put the PWA on the commercial domain. Do not point the root domain or change Firebase hosting as part of this beta. A later custom subdomain can be connected after its DNS is verified.

## Functional checks

`node --test tests/kahrelum-one.test.cjs` exercises invite rejection, code redemption, signed session acceptance/tamper rejection, and chat authorization/provider behavior with a mocked upstream model. `npm` dependencies are not required; tests use the Node built-in test runner and `fetch`.
