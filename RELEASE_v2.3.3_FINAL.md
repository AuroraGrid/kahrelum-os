# KAHRELUM OS v2.3.3 FINAL — Public Promotion Record

## Status

**FINAL**

This file is the public promotion record for KAHRELUM OS v2.3.3 FINAL.

It is metadata and documentation. It is **not** the frozen 33-file candidate tree itself.

## Promotion identity

- Release: **KAHRELUM OS v2.3.3 FINAL**
- Promoted from: **KAHRELUM OS v2.3.3-RC1**
- Parent: **KAHRELUM OS v2.3.2 FINAL** (untouched)
- Method: **EXACT-BYTE**
- Implementation modified during promotion: **NO**
- Candidate file count: **33**

### Candidate identity

Portable tree SHA-256:

`1938c1f0b6b1f848118a3dc682de1faa5222a63f3daad3da9a5992aba5b0b6bd`

Candidate archive SHA-256:

`d1eb86aff6a0a8c296ca00bab5f22e34b096af28c3b9810274590e58e7bca769`

Legacy internal digest:

`59c95d991c3ac29904116a7cadc011f520b8010332c311089a073e76badec591`

The legacy digest algorithm was not portably specified and is therefore not treated as the portable identity.

## Promotion benchmark

KAHRELUM BENCH v3.0:

- Cases: 30
- VALID_PASS: 30
- FALSE_PASS_ESCAPE: 0
- Architecture mean: 98.37
- Architecture minimum: 94
- Mission mean: 97.07
- Mission minimum: 90
- Hard blockers: 0
- MCRI false-PASS escapes: 0
- Mandatory atom escapes: 0
- Required object escapes: 0
- Substitute predicate escapes: 0
- Silent RECORD LOCK rewrites: 0
- Release-gate accuracy: 30/30
- Candidate hash drift: NO
- Patches during run: 0
- **PROMOTION_GATE: PASS**

## Sealed identities

- Adjudicator: `9c6b70772dc32a6c991586be016e24ac90a4f2f8f77fcb74bb65f741d5373f39`
- CLEANROOM002 raw: `4e9732873aea7468e293aac06eeb6b67c87da969f0ce89a23aed81abe45a06a7`
- Benchmark master: `4a0ef4fc1d34897a0a6eb00c07cd85da77649ec3498e1b129a038aec399816cd`
- Benchmark lock: `b0bac3469335045dec0f2bd4de003e9068ee2241262f765eba72b837fc5c717d`

## Preserved notes

- V3-04: contradiction listed but not explicitly reconciled.
- V3-26: invalid window comparison rejected; valid counterfactual ratio not explicitly written.
- V3-29: NOT_APPLICABLE ledger / checksum count inconsistency.

These were non-blocking under the frozen gate and remain part of the record.

## GitHub release-object note

Any GitHub release object associated with this public repository is a **public promotion-record pointer**.

The GitHub repository tree is documentation and presentation code; it is not itself the frozen 33-file candidate. A Git tag on this repository must therefore not be interpreted as the cryptographic identity of the candidate artifact.

The candidate identity is the portable tree and archive SHA-256 pair above.

Public GitHub Release record:

[https://github.com/AuroraGrid/kahrelum-os/releases/tag/v2.3.3-final-public-record](https://github.com/AuroraGrid/kahrelum-os/releases/tag/v2.3.3-final-public-record)

The Release includes downloadable SHA-256 and Bench v3 summary assets.

## Validation boundary

The benchmark supports the promotion decision for the frozen candidate.

It does not establish universal open-world robustness, institution-scale superiority, or a forecast-accuracy percentage.

See [BENCHMARKS.md](./BENCHMARKS.md) for the full public evidence framing.
