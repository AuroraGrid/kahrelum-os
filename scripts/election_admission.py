#!/usr/bin/env python3
"""Validate and publish a bounded prospective election observation cohort.

This does not fetch forecasts, infer missing probabilities, resolve elections, or
rewrite the original locks. Human source review is retained in the manifest;
this gate checks custody, timing, event agreement and publication evidence.
"""

import argparse
import copy
import hashlib
import json
import math
import re
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = Path('research/election-challenge-2026/cohort-manifest.json')
OUTPUT = Path('election/comparator-admission.json')
ROSTER = ('ddhq', '99chambers', 'callthemap', 'coyntoss', 'scrutinel',
          'votescope', 'electindex', 'datum', 'fred', 'yale', 'dave',
          'onpoint', 'votepredictor', 'midterm')
TARGETS = {
    'house': ('US_HOUSE_2026_DEMOCRATIC_CONTROL_218', 218, 435),
    'senate': ('US_SENATE_2026_DEMOCRATIC_CAUCUS_CONTROL_51', 51, 100),
}
SHA256 = re.compile(r'^[0-9a-f]{64}$')
COMMIT = re.compile(r'^[0-9a-f]{40}$')


class AdmissionError(ValueError):
    """An observation cannot pass the documented admission gate."""


def require(condition, message):
    if not condition:
        raise AdmissionError(message)


def parse_time(value):
    require(isinstance(value, str), 'A UTC timestamp is required')
    try:
        parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError as exc:
        raise AdmissionError(f'Invalid timestamp: {value}') from exc
    require(parsed.tzinfo is not None, f'Timestamp has no timezone: {value}')
    return parsed.astimezone(timezone.utc)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':')).encode('utf-8')


def safe_path(root, path):
    root = Path(root).resolve()
    result = (root / path).resolve()
    require(result.is_relative_to(root), f'Path escapes repository: {path}')
    return result


def load_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def custody_set(root, manifest_path=MANIFEST):
    """Digest the immutable manifest and every factual receipt it references."""
    root = Path(root)
    path = safe_path(root, manifest_path)
    manifest = load_json(path)
    entries = [{'path': str(manifest_path), 'sha256': digest(path.read_bytes())}]
    entries.extend({'path': source['path'], 'sha256': source['sha256']}
                   for source in manifest['sourceReceipts'].values())
    entries.sort(key=lambda x: x['path'])
    return entries, digest(canonical(entries))


def validate_manifest(manifest, root, raw_captures=None):
    """Check all records, including excluded and missing chamber slots."""
    root = Path(root)
    require(manifest.get('schemaVersion') == '1.0.0', 'Unknown manifest schema')
    require(manifest.get('comparisonBasis') ==
            'PUBLIC_INFORMATION_AVAILABLE_IN_ONE_CAPTURE_WINDOW',
            'This gate cannot certify a common underlying input cutoff')
    start = parse_time(manifest['captureWindow']['startAtUtc'])
    end = parse_time(manifest['captureWindow']['endAtUtc'])
    cutoff = parse_time(manifest['electionCutoffUtc'])
    require(0 < (end - start).total_seconds() <= 3600,
            'Capture window must be positive and at most one hour')
    require(end < cutoff, 'Capture window must end before the election cutoff')
    historical = manifest['historicalStrictCohort']
    require(historical['status'] == 'UNCHANGED' and
            historical['admittedChamberRecords'] == 0,
            'The historical strict cohort must remain unchanged')
    require(historical['originalHouseControlProbability'] == 0.91,
            'Original House lock was changed')
    require(historical['originalSenateControlProbability'] == 0.46090647437793264,
            'Original Senate lock was changed')
    require(manifest['eventTargets']['senate']['fiftySeatsResolves'] is False,
            'A 50-seat Senate must resolve NO under the original lock')

    receipts = {}
    for sid, reference in manifest['sourceReceipts'].items():
        file = safe_path(root, reference['path'])
        require(file.is_file(), f'Missing source receipt: {sid}')
        require(SHA256.fullmatch(reference['sha256']) is not None,
                f'Invalid receipt digest: {sid}')
        require(digest(file.read_bytes()) == reference['sha256'],
                f'Source receipt digest mismatch: {sid}')
        receipt = load_json(file)
        require(receipt['sourceId'] == sid and receipt['primarySource'] is True,
                f'Source identity or primary status missing: {sid}')
        require(receipt['sourceUrl'].startswith('https://'),
                f'Source URL is not public HTTPS: {sid}')
        captured_start = parse_time(receipt['capture']['startedAtUtc'])
        captured_end = parse_time(receipt['capture']['completedAtUtc'])
        require(start <= captured_start <= captured_end <= end,
                f'Source capture is outside the bounded window: {sid}')
        require(captured_end < cutoff, f'Post-cutoff source: {sid}')
        custody = receipt['custody']
        require(SHA256.fullmatch(custody['sha256']) is not None and
                isinstance(custody['utf8Bytes'], int) and custody['utf8Bytes'] > 0,
                f'Missing source representation digest or size: {sid}')
        require(custody['exactHttpWireBytes'] is False,
                f'Tool captures must not be relabeled as HTTP-wire custody: {sid}')
        if raw_captures is not None:
            raw = load_json(Path(raw_captures) / (sid + '.json'))
            body_key = 'rawHtml' if 'rawHtml' in raw else 'content'
            body = raw[body_key].encode('utf-8')
            require(digest(body) == custody['sha256'] and
                    len(body) == custody['utf8Bytes'],
                    f'Working raw representation digest mismatch: {sid}')
            for evidence in receipt['evidenceExcerpts']:
                representation = raw[evidence['representation']]
                offset = evidence['characterOffset']
                require(representation[offset:].startswith(evidence['exactText']),
                        f'Exact evidence no longer matches source: {sid}')
        receipts[sid] = receipt

    providers = manifest['providers']
    ids = [provider['id'] for provider in providers]
    require(len(ids) == len(set(ids)) and set(ids) == set(ROSTER),
            'The cohort must retain all 14 current numerical providers exactly once')
    for provider in providers:
        for chamber, (target_id, threshold, seats) in TARGETS.items():
            row = provider[chamber]
            probability = row['probabilityPercent']
            require(row['comparisonTargetId'] == target_id and
                    row['threshold'] == threshold,
                    f'Wrong target: {provider["id"]}/{chamber}')
            target = manifest['eventTargets'][chamber]
            require(target['id'] == target_id and target['threshold'] == threshold
                    and target['chamberSeats'] == seats, 'Target specification changed')
            if probability is not None:
                require(isinstance(probability, (float, int)) and
                        not isinstance(probability, bool) and math.isfinite(probability)
                        and 0 <= probability <= 100,
                        f'Invalid probability: {provider["id"]}/{chamber}')
            require(row['sourceIds'] and all(sid in receipts for sid in row['sourceIds']),
                    f'Missing evidence linkage: {provider["id"]}/{chamber}')
            published = row.get('sourcePublishedAtUtc')
            if published:
                # The forecast's edition must predate its first forecast capture.
                source_id = row['sourceIds'][0]
                observed = parse_time(receipts[source_id]['capture']['completedAtUtc'])
                require(parse_time(published) <= observed,
                        f'Publisher timestamp follows capture: {provider["id"]}/{chamber}')
            require(row['reasonCode'] and row['reason'], 'Missing admission/exclusion reason')
            require(row['seatErrorScoringEligible'] is False,
                    'Probability admission cannot silently admit seat-error comparisons')
            require(row['inputCutoffMatchedToKahrelum'] is False,
                    'A common capture window is not a matched model-input cutoff')
            if row['reviewDecision'] == 'READY':
                require(probability is not None and row['quantityType'] ==
                        'chamber_control_probability',
                        'A ready record needs an actual chamber probability')
                require(row['eventMatch'] == 'MATCH',
                        'An unresolved or different event cannot be ready')
                require(not row['conflictingProbabilitiesPercent'],
                        'Conflicting marginal probabilities must remain excluded')
                require(row['reasonCode'] == 'MATCHED_PRIMARY_CONTROL_PROBABILITY',
                        'A ready record still carries an exclusion reason')
                if chamber == 'senate':
                    alignment = row.get('independentAlignmentReview', {})
                    require(alignment.get('status') == 'VERIFIED_MATCH' and
                            alignment.get('candidateMappingSourceIds') and
                            all(sid in receipts for sid in alignment['candidateMappingSourceIds']),
                            'Senate admission requires explicit candidate-level caucus equivalence')
            else:
                require(row['reviewDecision'] == 'EXCLUDE', 'Unknown review decision')
    return receipts


def validate_anchor(anchor, manifest, root, now, manifest_path=MANIFEST):
    """Validate a receipt created after checking the public GitHub commit.

Remote verification is performed by the publishing operator via GitHub. This
function deliberately cannot manufacture that evidence from a local hash.
"""
    entries, custody_digest = custody_set(root, manifest_path)
    require(anchor.get('status') == 'VERIFIED_PUBLIC_COMMIT',
            'Public anchor has not been verified')
    commit = anchor.get('commit', '')
    require(COMMIT.fullmatch(commit) is not None, 'Public commit must be a full Git SHA')
    base = 'https://github.com/AuroraGrid/kahrelum-os'
    require(anchor.get('url') == f'{base}/commit/{commit}', 'Wrong public commit URL')
    require(anchor.get('immutableManifestUrl') ==
            f'{base}/blob/{commit}/{manifest_path}', 'Wrong immutable manifest URL')
    require(anchor.get('verificationMethod') == 'GITHUB_COMMIT_AND_IMMUTABLE_FILES',
            'A local or self-attested timestamp is not public publication evidence')
    require(anchor.get('manifestSha256') ==
            digest(safe_path(root, manifest_path).read_bytes()), 'Anchored manifest differs')
    require(anchor.get('custodySetSha256') == custody_digest, 'Anchored custody set differs')
    require(anchor.get('verifiedFileCount') == len(entries), 'Anchor did not cover every receipt')
    committed = parse_time(anchor['committedAtUtc'])
    verified = parse_time(anchor['verifiedAtUtc'])
    last_capture = max(parse_time(load_json(safe_path(root, ref['path']))['capture']['completedAtUtc'])
                       for ref in manifest['sourceReceipts'].values())
    require(last_capture <= committed <= verified <= now,
            'Public anchor cannot precede source capture or follow the supplied clock')
    require(committed < parse_time(manifest['electionCutoffUtc']),
            'A post-cutoff commit cannot create a prospective lock')
    return copy.deepcopy(anchor)


def build_admission(root=ROOT, manifest_path=MANIFEST, now=None,
                    anchor=None, raw_captures=None):
    require(now is not None, 'An explicit trusted UTC --now is required')
    now_dt = parse_time(now)
    manifest = load_json(safe_path(root, manifest_path))
    receipts = validate_manifest(manifest, root, raw_captures)
    require(now_dt >= max(parse_time(r['capture']['completedAtUtc']) for r in receipts.values()),
            'Generation time precedes capture completion')
    entries, custody_digest = custody_set(root, manifest_path)
    public_lock = (validate_anchor(anchor, manifest, root, now_dt, manifest_path)
                   if anchor else {'status': 'PENDING_PUBLIC_COMMIT',
                                   'requiredCustodySetSha256': custody_digest,
                                   'requiredFileCount': len(entries)})
    locked = public_lock['status'] == 'VERIFIED_PUBLIC_COMMIT'
    providers = copy.deepcopy(manifest['providers'])
    counts = {'providers': len(providers), 'sourceCaptures': len(receipts),
              'chamberSlots': 2 * len(providers), 'numericalObservations': 0,
              'admissionReady': 0, 'admitted': 0, 'excluded': 0,
              'pendingPublicLock': 0, 'byChamber': {}}
    for chamber in TARGETS:
        totals = {'providerSlots': len(providers), 'numericalObservations': 0,
                  'admissionReady': 0, 'admitted': 0, 'excluded': 0,
                  'pendingPublicLock': 0}
        for provider in providers:
            row = provider[chamber]
            ready = row['reviewDecision'] == 'READY'
            admitted = ready and locked
            row['probability'] = (row['probabilityPercent'] / 100
                                  if row['probabilityPercent'] is not None else None)
            row['admissionReady'] = ready
            row['admitted'] = admitted
            row['status'] = ('ADMITTED_PROSPECTIVE' if admitted else
                             'READY_PENDING_PUBLIC_LOCK' if ready else 'EXCLUDED')
            row['sourceUrls'] = [receipts[sid]['sourceUrl'] for sid in row['sourceIds']]
            row['receiptPaths'] = [manifest['sourceReceipts'][sid]['path'] for sid in row['sourceIds']]
            row['observedNotBeforeUtc'] = min(receipts[sid]['capture']['startedAtUtc']
                                              for sid in row['sourceIds'])
            row['observedNotAfterUtc'] = max(receipts[sid]['capture']['completedAtUtc']
                                             for sid in row['sourceIds'])
            row['outcomeStatus'] = 'UNRESOLVED'
            row['brierScore'] = None
            totals['numericalObservations'] += row['probability'] is not None
            totals['admissionReady'] += ready
            totals['admitted'] += admitted
            totals['excluded'] += not ready
            totals['pendingPublicLock'] += ready and not locked
        counts['byChamber'][chamber] = totals
        for key in totals:
            if key != 'providerSlots':
                counts[key] += totals[key]
    return {'schemaVersion': '1.0.0', 'cohortId': manifest['cohortId'],
            'label': manifest['label'], 'generatedAtUtc': now,
            'status': 'PROSPECTIVE_COHORT_LOCKED' if locked else 'READY_FOR_PUBLIC_LOCK',
            'comparisonBasis': manifest['comparisonBasis'],
            'captureWindow': manifest['captureWindow'],
            'electionCutoffUtc': manifest['electionCutoffUtc'],
            'commonUnderlyingInputCutoff': False,
            'historicalStrictCohort': manifest['historicalStrictCohort'],
            'kahrelumReference': manifest['kahrelumReference'],
            'eventTargets': manifest['eventTargets'], 'counts': counts,
            'publicLock': public_lock,
            'custody': {'manifestPath': str(manifest_path),
                        'manifestSha256': digest(safe_path(root, manifest_path).read_bytes()),
                        'custodySetSha256': custody_digest, 'files': entries,
                        'grade': 'IMMUTABLE_FACTUAL_RECEIPTS_WITH_TOOL_REPRESENTATION_DIGESTS',
                        'exactHttpWireArchive': False},
            'admissionRules': manifest['admissionRules'],
            'limitations': manifest['limitations'], 'providers': providers,
            'outcomes': {'status': 'UNRESOLVED', 'resolvedCount': 0,
                         'brierScore': None, 'winner': None}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['build', 'validate', 'custody'])
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--manifest', type=Path, default=MANIFEST)
    parser.add_argument('--output', type=Path, default=OUTPUT)
    parser.add_argument('--now', help='Explicit trusted UTC session clock, never a guessed timestamp')
    parser.add_argument('--anchor-file', type=Path,
                        help='Receipt from verified public commit and immutable-file checks')
    parser.add_argument('--raw-captures', type=Path,
                        help='Optional working tool captures for independent hash/excerpt checks')
    args = parser.parse_args()
    if args.command == 'custody':
        entries, value = custody_set(args.root, args.manifest)
        validate_manifest(load_json(safe_path(args.root, args.manifest)), args.root,
                          args.raw_captures)
        print(json.dumps({'files': entries, 'custodySetSha256': value}, indent=2))
        return
    anchor = load_json(args.anchor_file) if args.anchor_file else None
    result = build_admission(args.root, args.manifest, args.now, anchor, args.raw_captures)
    if args.command == 'build':
        output = safe_path(args.root, args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'status': result['status'], 'counts': result['counts'],
                      'custodySetSha256': result['custody']['custodySetSha256']}, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (AdmissionError, KeyError, OSError, json.JSONDecodeError) as error:
        raise SystemExit(f'Admission failed: {error}')
