# Changelog

## 2026-09-30 — v2.3.4 public evidence synchronization

Updated the public documentation and Vercel site to match the frozen **KAHRELUM OS v2.3.4 FINAL** external-audit record.

This is a documentation / presentation synchronization. It does not alter the frozen v2.3.4 release artifact.

### v2.3.4 identities

- release archive SHA-256: `c6caca3290abbee7121fb743fabb1210b59b7536aa46dd6d6874cd02962bc1e1`
- external-audit package SHA-256: `084f0d1348342e707e1fc953b1337d3a805f9890301fa54ba01983aa1a46876f`
- RP100 canonical: `6f389c0c85ace7e81aed599e737190c98968c5b9b04a4d993d9d7a5dbdc47254`
- GX50-v2 canonical: `aa4b116c1d8536c3eee6d984951c6431b31c681b717027fdb93031275324f221`

### External-audit closeout

- package SHA verified: YES
- internal manifest verified: YES
- RP100 reproduction: YES
- GX50 reproduction: YES
- scoring mismatches: NONE
- statistical-plan compliance: YES
- critical defects in package identity / registered numerical reproduction: NONE

The public surface also preserves the audit's limitations: Gemini leads RP100 Brier; KAHRELUM leads GX50-v2 Brier by point estimate but both primary 97.5% CIs include zero; retrospective, custody and independence limitations remain.

## 2026-09-21 — v2.3.3 public-surface synchronization

The v2.3.3 FINAL release record remains preserved as historical evidence.

- promoted from v2.3.3-RC1
- promotion method: EXACT-BYTE
- candidate files: 33
- portable tree SHA-256: `1938c1f0b6b1f848118a3dc682de1faa5222a63f3daad3da9a5992aba5b0b6bd`
- candidate archive SHA-256: `d1eb86aff6a0a8c296ca00bab5f22e34b096af28c3b9810274590e58e7bca769`
- Bench v3.0: 30/30 VALID_PASS; 0 hard blockers; no candidate hash drift; 0 mid-run patches

Those hashes identify v2.3.3 and are not v2.3.4 identities.
