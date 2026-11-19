---
name: proof-of-work
description: Prepare and independently review evidence for a KAHRELUM engineering change, cloud-agent handoff, or pull request before marking it ready for founder review.
---

# Proof of work

Read `docs/engineering/DEVELOPMENT.md` before running commands. Use this skill
on an isolated branch. It is a repository skill, not proof of native bot or
cloud-agent integration. Never claim that reading this file installed a bot skill.

## Preserve authority and scope

1. Obtain the existing OPS task ID, objective, owner, acceptance criteria, exact
   base commit and allowed paths. Reuse its existing board; never create another.
2. Preserve the original configuration, failures, evidence and concurrent work.
   Do not touch the independent Dell or LinkedIn missions. Do not install bots,
   Hermes or OpenBot, or add routines, polling, permissions or credentials.
3. Let COMMAND route work and obtain founder approvals; OPS own board state and
   incident reviews; SOURCEGRID gather sources; BUILDER supervise implementation;
   BLACKGLASS independently verify; MISC maintain documentation and drafts.
4. Keep external messaging, spending, credentials/access changes, destructive
   work, merging and production deployment behind their existing approval gates.
   No success result grants approval. Check deployment hooks before pushing.

## BUILDER evidence packet

- Record task ID, implementation actor/run, base/head SHAs, clean or dirty state,
  exact changed paths, rationale, risk and rollback. Exclude unrelated changes.
- Record OS/runtime versions and reproducible setup/test commands. Run relevant
  tests and the repository baseline described in DEVELOPMENT.md. Save actual
  stdout/stderr, exit codes, counts and times. Prove a relevant negative case
  fails; preserve it separately from the corrected result. Never weaken a test
  to manufacture a pass, and never treat zero tests as success.
- Start the app from the tested checkout. Exercise the affected user flow,
  expected result, error/fallback path and relevant responsive sizes. Record
  URL, SHA, viewport, steps, console/network errors and actual observations.
  Capture before/after screenshots for visual changes; capture the observed
  working app for other app changes. Inspect the image contents. HTTP 200,
  a VM DOM test or a file hash alone is not browser verification.
- Attach logs, screenshots and other proof using durable permitted references
  plus SHA-256. Exclude credentials, personal data and private browser state.
  Keep private evidence off this public repository. If app execution or
  screenshots cannot be obtained, mark those requirements BLOCKED; do not
  manufacture an exception or substitute a structural packet check.
- List every unverified item and blocked criterion with impact, owner and next
  gate. Separate local execution, CI, integration, deployment and native bot
  operation. Report all of them independently.

## BLACKGLASS independent pass

Read original requirements and raw artifacts before BUILDER's conclusions.
Fetch the exact candidate SHA into a separate checkout. Verify the diff and
attachment hashes; rerun relevant tests and negative controls; drive the affected
app independently. Check screenshots against acceptance criteria. Record the
reviewer actor/run and timestamp. Do not implement fixes or certify your own work.
Return precise failures to BUILDER, preserving each failed revision. New changes
invalidate prior review; inspect/retest the resulting SHA. Two repeated identical
failures require a blocker report, not unattended retry loops.

## Four clean checks on the existing OPS row

Record evidence and the evaluated head/base for each check:

1. **Findings:** inspect Bugbot/security comments if available, adjudicate each,
   and resolve legitimate findings. Missing tools are UNVERIFIED, never clean.
2. **CI:** all required jobs succeed on the candidate SHA; no stale, skipped,
   pending, empty or unrelated status may stand in for a required check.
3. **Conflicts:** verify mergeability against current target base. If the base
   changes, recheck conflicts and any affected tests without overwriting work.
4. **Independent review:** BLACKGLASS checks scope, code, app behavior, proof
   and unresolved items on that SHA. Self-review is not acceptance.

Use TODO -> WORKING -> READY FOR REVIEW only when all four are clean and
mandatory acceptance criteria close. Use BLOCKED for missing evidence/access;
return to WORKING when fixes are needed. READY FOR REVIEW means ready for the
founder's decision. DONE requires the originally authorized outcome and receipt;
it never means merged or deployed unless those actions were approved and verified.

Use `python3 scripts/validate_engineering_proof.py PACKET.json --head SHA` for
packet consistency. Its success is **STRUCTURE_VALID**, not certification of
truth, reviewer identity, a working integration, merge permission or deployment.
Attach its output alongside the actual independent review.

## Final handoff

Return outcome, scope, SHA, tests, working-app observations, evidence references,
four-check status, unresolved items, actual usage/cost if available and next gate.
Report unknown cost as unknown; do not activate watchers to fill the gap.
