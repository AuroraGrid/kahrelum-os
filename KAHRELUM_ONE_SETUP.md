# KAHRELUM ONE beta setup

The consumer app lives at `/one/`, separate from the commercial landing page and the frozen research/release artifacts. It is a static installable PWA plus same-origin Vercel functions under `/api/one/`.

## Required server settings

Set these as **Production and Preview secrets** in the separate Vercel `kahrelum-os` project before inviting anyone:

- `KAHRELUM_ONE_SESSION_SECRET`: at least 32 random bytes, e.g. output from `openssl rand -hex 32`.
- `KAHRELUM_ONE_INVITE_HASHES`: comma-separated SHA-256 hashes of invite codes. Generate a high-entropy code with `node scripts/make-kahrelum-one-invite.mjs`; send the code only to its intended recipient and keep only its hash in this variable. Codes remain reusable until removed from the variable. Rotate a code by replacing its hash and redeploying.
- `GEMINI_API_KEY`: a server-only key from Google's Gemini API. Never add it to the PWA or a `NEXT_PUBLIC_*` variable. This beta has no rate limiter or persistent per-user quotas; issue invite codes only to trusted testers.

The chat endpoint is disabled when its settings are missing; it does not return a fabricated demo answer. No provider credential is committed to source. For zero-charge testing, use a Google AI Studio key whose project remains on the provider's free tier and has no billing account attached. Provider free quotas, model availability, and policies can change. A key with billing enabled may incur charges after free limits; do not use it for this zero-upfront beta. Requests stop on provider quota errors.

Invite codes are generated with 192 bits of randomness and verified server-side using SHA-256 and timing-safe comparison. Successful redemption creates a seven-day HttpOnly, SameSite=Lax session cookie signed with the server secret. Browser code cannot authorize itself: both session checks and every chat call validate the signature on the server. HTTPS uses Secure cookies. Browser history remains local to that browser and is sent only with each request to preserve the current turn context.

## Deploy

The existing `kahrelum-os` Vercel project is separate from the Firebase commercial site and has no `kahrelum.com` custom domain attached. A Vercel deployment makes this beta available at its Vercel host under `/one/`; it does not put the PWA on the commercial domain. Do not point the root domain or change Firebase hosting as part of this beta. A later custom subdomain can be connected after its DNS is verified.

## Functional checks

`node --test tests/kahrelum-one.test.cjs` exercises invite rejection, code redemption, signed session acceptance/tamper rejection, and chat authorization/provider behavior with a mocked upstream model. `npm` dependencies are not required; tests use the Node built-in test runner and `fetch`.
