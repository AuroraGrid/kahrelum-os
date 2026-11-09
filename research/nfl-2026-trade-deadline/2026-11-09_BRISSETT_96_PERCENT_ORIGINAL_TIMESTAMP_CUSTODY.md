# KAHRELUM SOURCEGRID | Jacoby Brissett 96% original forecast timestamp custody

**Record class:** APPEND-ONLY reconciliation, recorded November 9, 2026. This record does **not** backdate a forecast, overwrite the original, claim that a deal had not yet been reported, or issue a new forecast. The GitHub commit that adds *this* file is the timestamp of this audit reconciliation; it is not the original forecast timestamp.

## Original public 96% record (preserve exactly)

- **Subject:** Jacoby Brissett (Arizona Cardinals quarterback), trade to any NFL team officially completed by Tuesday, November 10, 2026, 16:00 America/New_York.
- **Original documented probability:** **p = 0.96 (96%)**.
- **Original source file:** `research/nfl-2026-trade-deadline/2026-11-04_BRISSETT_RAVENS_FINALIZING_PENDING_BAGENT_V4.md`.
- **Original GitHub commit:** `597f07fad1d0e810155f56732106299555989ead`.
- **Original public commit link:** https://github.com/AuroraGrid/kahrelum-os/commit/597f07fad1d0e810155f56732106299555989ead
- **Commit author/committer timestamp:** **2026-11-04T20:45:50Z = November 4, 2026 at 15:45:50 EST (New York)**. This is the earliest independently inspectable *public repo record located* for the numeric 96% version. Do not confuse it with the file's stated research cutoff **15:43:34 EST**, which is not the independent public lock time.
- **Contemporaneous status:** `REPORTED_FINALIZING / PENDING_CONFIRMATION`. ESPN Adam Schefter and NFL Network Ian Rapoport had already been cited for a pending deal to Baltimore. Baltimore's team article was published November 4 at **15:13 EST**, approximately 32 minutes 50 seconds *before* the 96% public commit. Thus this is **pre-official-completion** but **post-insider-report**, **not** a documented pre-news discovery.
- **Provenance caveat:** GitHub public commit object with available timestamp and content hash; commit signature was unsigned (GitHub `verification.verified=false`). A timestamp visible in a commit is not an independent signed time authority or proof of private conversations before that commit.

## Successive versions and resolution (do not overwrite)

1. **Nov 4, 15:45:50 EST:** 96% initial prospective public version, commit `597f07fad1d0e810155f56732106299555989ead`.
2. **Nov 5, 11:02:02 EST:** revised **98%** after additional salary-conversion reporting, commit `effc59156994e1f9eec59406458e8bd794262f77`; 96% remains intact in the first commit.
3. **Nov 6, 08:37:10 EST:** 98% remained pending official completion, commit `4d11183febcf676090ea81de84fdad4136a54ffc`.
4. **Nov 6, 11:00 EST:** Baltimore first-party completed-trade announcement, https://www.baltimoreravens.com/news/jacoby-brissett-ravens-trade-cardinals-finalize-2026 .
5. **Nov 6, 11:56:01 EST:** KAHRELUM confirmation/resolution receipt, commit `2ccf8632edb09e90489b2887046f2fbb8cad32d8`.

## User correction and scoring discipline

- On November 9 the user clarified that the **original Brissett call was 96%, not 98%**. The public repo history independently supports both as **chronological versions**: 96% first, then 98% later. Neither is erased.
- A 96% pre-completion probability that later resolved YES has a single-event Brier contribution `(0.96 - 1)^2 = 0.0016` if evaluated within a clearly stated *post-report/pre-completion* fixed-cutoff cohort. The later 98% version has contribution `0.0004` under its own evaluation cutoff. **Do not double-count these as independent event predictions.**
- Do not claim the Nov 4 96% was issued before the first insider report.
- Do not conflate this player-specific completed-trade event with a new prediction of how many other trades will occur by the 2026 NFL deadline. **No new trade-volume prediction has been made or locked.**
- Historical user-listed calls: Marvin Harrison Jr., Quenton Nelson, and Jacoby Brissett. DeForest Buckner is excluded from that three-call user attribution. Custody for Harrison/Nelson is separately unresolved.

**Control:** Preserve original commit and SHA unmodified, keep the version chain and qualifications, and treat any later changes as new append-only evidence.
