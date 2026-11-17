import copy
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('election_admission', ROOT / 'scripts/election_admission.py')
admission = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(admission)
NOW = '2026-10-31T04:40:00Z'


class ElectionAdmissionTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.root = Path(self.directory.name)
        destination = self.root / 'research/election-challenge-2026'
        destination.parent.mkdir(parents=True)
        shutil.copytree(ROOT / 'research/election-challenge-2026', destination)
        self.manifest = admission.load_json(self.root / admission.MANIFEST)

    def tearDown(self):
        self.directory.cleanup()

    def write(self):
        (self.root / admission.MANIFEST).write_text(json.dumps(self.manifest), encoding='utf-8')

    def row(self, provider, chamber='house'):
        return next(p for p in self.manifest['providers'] if p['id'] == provider)[chamber]

    def change_receipt(self, source_id, transform):
        reference = self.manifest['sourceReceipts'][source_id]
        path = self.root / reference['path']
        receipt = admission.load_json(path)
        transform(receipt)
        path.write_text(json.dumps(receipt), encoding='utf-8')
        reference['sha256'] = admission.digest(path.read_bytes())
        self.write()

    def build(self, anchor=None, now=NOW):
        return admission.build_admission(self.root, now=now, anchor=anchor)

    def anchor(self):
        # Controlled verification fixture; it is never written into the live ledger.
        commit = 'a' * 40
        entries, custody = admission.custody_set(self.root)
        base = 'https://github.com/AuroraGrid/kahrelum-os'
        return {'status': 'VERIFIED_PUBLIC_COMMIT', 'commit': commit,
                'committedAtUtc': '2026-10-31T04:30:00Z',
                'verifiedAtUtc': '2026-10-31T04:31:00Z',
                'url': f'{base}/commit/{commit}',
                'immutableManifestUrl': f'{base}/blob/{commit}/{admission.MANIFEST}',
                'verificationMethod': 'GITHUB_COMMIT_AND_IMMUTABLE_FILES',
                'manifestSha256': admission.digest((self.root / admission.MANIFEST).read_bytes()),
                'custodySetSha256': custody, 'verifiedFileCount': len(entries)}

    def test_current_cohort_has_real_ready_records_and_preserves_old_locks(self):
        result = self.build()
        self.assertEqual(result['counts']['providers'], 14)
        self.assertEqual(result['counts']['numericalObservations'], 26)
        self.assertEqual(result['counts']['admissionReady'], 13)
        self.assertEqual(result['counts']['admitted'], 0)
        self.assertEqual(result['counts']['excluded'], 15)
        self.assertEqual(result['historicalStrictCohort']['admittedChamberRecords'], 0)
        self.assertEqual(result['historicalStrictCohort']['originalHouseControlProbability'], 0.91)
        self.assertIsNone(result['outcomes']['winner'])
        self.assertIsNone(result['outcomes']['brierScore'])
        self.assertFalse(result['commonUnderlyingInputCutoff'])

    def test_valid_pre_cutoff_public_anchor_admits_only_reviewed_matches(self):
        result = self.build(self.anchor())
        self.assertEqual(result['counts']['admitted'], 13)
        self.assertEqual(result['counts']['byChamber']['senate']['admitted'], 0)
        self.assertEqual(result['counts']['pendingPublicLock'], 0)
        self.assertTrue(all(p['house']['admitted'] for p in result['providers'] if p['id'] != 'scrutinel'))
        self.assertTrue(all(not p['senate']['admitted'] for p in result['providers']))

    def test_altered_source_receipt_is_detected(self):
        path = self.root / self.manifest['sourceReceipts']['ddhq']['path']
        path.write_text(path.read_text() + ' ', encoding='utf-8')
        with self.assertRaisesRegex(admission.AdmissionError, 'digest mismatch'):
            self.build()

    def test_out_of_window_capture_cannot_be_admitted(self):
        self.change_receipt('ddhq', lambda r: r['capture'].update(completedAtUtc='2026-10-31T05:12:01Z'))
        with self.assertRaisesRegex(admission.AdmissionError, 'outside the bounded window'):
            self.build(now='2026-10-31T06:00:00Z')

    def test_publication_after_capture_is_not_backdated(self):
        self.row('ddhq')['sourcePublishedAtUtc'] = '2026-10-31T06:00:00Z'
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'Publisher timestamp follows capture'):
            self.build()

    def test_conflicting_probability_remains_excluded_even_if_marked_ready(self):
        self.row('scrutinel').update(reviewDecision='READY', eventMatch='MATCH',
                                   reasonCode='MATCHED_PRIMARY_CONTROL_PROBABILITY')
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'Conflicting marginal'):
            self.build()

    def test_51_seats_alone_is_insufficient_for_senate_admission(self):
        self.row('yale', 'senate').update(reviewDecision='READY', eventMatch='MATCH',
                                        reasonCode='MATCHED_PRIMARY_CONTROL_PROBABILITY')
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'candidate-level caucus equivalence'):
            self.build()

    def test_missing_senate_probability_cannot_be_invented_from_a_seat_mean(self):
        self.row('votescope', 'senate').update(reviewDecision='READY', eventMatch='MATCH',
                                             reasonCode='MATCHED_PRIMARY_CONTROL_PROBABILITY')
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'actual chamber probability'):
            self.build()

    def test_probability_cannot_be_replaced_by_seat_statistics(self):
        self.row('votescope')['quantityType'] = 'seat_median'
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'actual chamber probability'):
            self.build()

    def test_mean_median_and_favored_seats_stay_distinct(self):
        result = self.build()
        rows = {p['id']: p for p in result['providers']}
        self.assertEqual(rows['votescope']['house']['seatStatistics'][0]['statistic'], 'count_of_favored_districts')
        self.assertEqual(rows['votescope']['house']['seatStatistics'][1]['statistic'], 'median')
        self.assertEqual(rows['coyntoss']['house']['seatStatistics'][0]['statistic'], 'mean')
        self.assertEqual(rows['coyntoss']['house']['seatStatistics'][1]['statistic'], 'median')
        self.assertFalse(rows['onpoint']['house']['seatErrorScoringEligible'])

    def test_original_lock_cannot_be_replaced_by_new_computed_edition(self):
        self.manifest['historicalStrictCohort']['originalHouseControlProbability'] = 0.9057450487619074
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'Original House lock'):
            self.build()

    def test_senate_50_seat_tie_remains_no(self):
        self.manifest['eventTargets']['senate']['fiftySeatsResolves'] = True
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, '50-seat Senate'):
            self.build()

    def test_denominator_includes_missing_and_excluded_providers(self):
        self.manifest['providers'] = [p for p in self.manifest['providers'] if p['id'] != 'scrutinel']
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'all 14 current'):
            self.build()

    def test_duplicate_provider_cannot_inflate_count(self):
        self.manifest['providers'].append(copy.deepcopy(self.manifest['providers'][0]))
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'exactly once'):
            self.build()

    def test_nonfinite_or_boolean_probability_is_rejected(self):
        for value in (float('nan'), True, 100.1, -0.1):
            self.row('ddhq')['probabilityPercent'] = value
            self.write()
            with self.assertRaisesRegex(admission.AdmissionError, 'Invalid probability'):
                self.build()

    def test_capture_window_does_not_imply_equal_model_input_cutoffs(self):
        self.row('coyntoss')['inputCutoffMatchedToKahrelum'] = True
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'matched model-input cutoff'):
            self.build()

    def test_commit_preceding_capture_cannot_be_used_as_anchor(self):
        anchor = self.anchor()
        anchor['committedAtUtc'] = '2026-10-31T04:00:00Z'
        with self.assertRaisesRegex(admission.AdmissionError, 'precede source capture'):
            self.build(anchor)

    def test_post_cutoff_commit_cannot_create_prospective_admission(self):
        anchor = self.anchor()
        anchor.update(committedAtUtc='2026-11-03T05:00:00Z', verifiedAtUtc='2026-11-03T05:01:00Z')
        with self.assertRaisesRegex(admission.AdmissionError, 'post-cutoff commit'):
            self.build(anchor, now='2026-11-03T05:02:00Z')

    def test_local_hash_is_not_public_verification(self):
        anchor = self.anchor()
        anchor['verificationMethod'] = 'LOCAL_HASH_ONLY'
        with self.assertRaisesRegex(admission.AdmissionError, 'not public publication evidence'):
            self.build(anchor)

    def test_anchor_for_different_manifest_is_rejected(self):
        anchor = self.anchor()
        self.manifest['providers'][0]['notes'].append('A later factual correction')
        self.write()
        with self.assertRaisesRegex(admission.AdmissionError, 'Anchored manifest differs'):
            self.build(anchor)

    def test_tool_capture_cannot_be_relabelled_as_wire_archive(self):
        self.change_receipt('ddhq', lambda r: r['custody'].update(exactHttpWireBytes=True))
        with self.assertRaisesRegex(admission.AdmissionError, 'HTTP-wire custody'):
            self.build()

    def test_explicit_clock_is_required(self):
        with self.assertRaisesRegex(admission.AdmissionError, 'trusted UTC'):
            admission.build_admission(self.root)


if __name__ == '__main__':
    unittest.main()
