# PR 9 — November 17 reconciliation

Reconciled with main without conflicts. Eight focused tests pass, including mocked invite/session enforcement and search-to-model behavior. These do not verify deployed invite redemption, live Gemini behavior, billing, or usable live search.

Existing live-search challenge limitation remains unresolved. No valid-invite backend test was executed; no beta production deployment. Keep preview-only. Existing commercial Firebase site and historic research records are preserved.

## November 17 deployed-route check

The current preview deployment for candidate 28fb4379 rendered the commercial concept overview at /one/, rather than the invite PWA. This contradicted the earlier preview claim. Vercel cleanUrls allows one.html to shadow the directory route. An explicit temporary /one -> /one/index redirect now selects the PWA entry within its existing service-worker scope. Preview readback is required after build; live invite/search/Gemini and billing gates remain separate and unverified. No secrets were retrieved and no Gemini request was made.
