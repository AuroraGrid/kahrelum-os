# PR 24 — November 17 reconciliation

Merged current main into the draft branch. Resolved the vercel.json conflict by preserving main's clean URLs and all three public API rewrites, then retaining the branch-specific deployment exclusion. No app feature, historical lock or production setting changed.

Focused engineering proof suite: 9 discovered, 8 pass, 1 skipped because Windows could not create symlinks. This is not a full 9/9 execution or native independent acceptance. Existing BUILDER/BLACKGLASS dispatch, board record and independent native acceptance remain unverified. Keep draft and do not deploy.
