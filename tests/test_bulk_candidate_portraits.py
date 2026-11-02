import copy
import hashlib
import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('bulk_portraits', ROOT / 'scripts/portrait_bulk_evidence.py')
bulk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bulk)


class BulkPortraitEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = json.loads((ROOT / 'research/candidate-portraits/remaining-2026-11-02/admitted-sources.json').read_text())
        cls.current = json.loads((ROOT / 'election/current-projections.json').read_text())
        cls.ledger = json.loads((ROOT / 'election/candidate-portraits.json').read_text())
        cls.previous = [r for r in cls.ledger['records'] if r.get('identityType') != 'FEC_BULK_COMMONS']

    def test_all_previous_429_records_are_unchanged(self):
        manifest = json.loads((ROOT / 'research/candidate-portraits/remaining-2026-11-02/baseline-preservation.json').read_text())
        raw = json.dumps(self.previous, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()
        self.assertEqual(len(self.previous), 429)
        self.assertEqual(hashlib.sha256(raw).hexdigest(), manifest['admittedRecordsSha256'])

    def test_all_new_photos_validate_and_511_decisions_are_accounted_for(self):
        rows = bulk.review(self.current, self.catalog, self.previous)
        self.assertEqual(len(rows), 112)
        original_unresolved = [{k: v for k, v in r.items() if k not in {'originalReason', 'reviewNote', 'primaryIdentityStatus'}}
                               for r in self.ledger['unresolved']]
        for r in original_unresolved:
            r['reason'] = 'IDENTITY_NOT_VERIFIED'
        self.assertEqual(bulk.unresolved_review(self.catalog, original_unresolved), self.ledger['unresolved'])
        self.assertEqual(len(rows) + len(original_unresolved), 511)

    def test_wrong_seat_identity_rights_and_bytes_are_rejected(self):
        for key, value in [('candidateName', 'Someone Else'), ('state', 'ZZ'), ('party', 'I'),
                           ('contestId', 'AL-3'), ('fecCandidateId', 'H6AL99999'),
                           ('identitySourceSha256', '0'*64), ('commonsRevisionId', 1),
                           ('license', 'Fair use'), ('licenseUrl', 'https://example.com/'),
                           ('attribution', ''), ('imageSha256', '0'*64), ('imageBytes', 1),
                           ('width', 999), ('publicDomainTemplate', 'PD-text')]:
            c = copy.deepcopy(self.catalog)
            c['records'] = [c['records'][0]]
            c['records'][0][key] = value
            with self.subTest(key=key), self.assertRaises(ValueError):
                bulk.review(self.current, c, self.previous)

    def test_duplicate_or_replacement_fails_closed(self):
        c = copy.deepcopy(self.catalog)
        c['records'].append(c['records'][0])
        with self.assertRaises(ValueError):
            bulk.review(self.current, c, self.previous)
        with self.assertRaises(ValueError):
            bulk.review(self.current, self.catalog, self.ledger['records'])

    def test_aliases_require_the_captured_committee_or_government_statement(self):
        for sid in ['19129', '21446', '19166', '16266', '19262']:
            c = copy.deepcopy(self.catalog)
            c['identityAliases'][sid]['evidenceTerms'] = ['a statement absent from the source']
            with self.subTest(sid=sid), self.assertRaises(ValueError):
                bulk.review(self.current, c, self.previous)

    def test_pending_permission_cannot_be_overridden_by_a_cc_label(self):
        real_capture = bulk.capture
        def pending(meta):
            result = real_capture(meta)
            if 'response' in result and 'query' in result['response']:
                for page in result['response']['query'].get('pages', {}).values():
                    page['revisions'][0]['slots']['main']['*'] += '\n{{Permission pending}}'
            return result
        with patch.object(bulk, 'capture', side_effect=pending), self.assertRaises(ValueError):
            bulk.review(self.current, self.catalog, self.previous)

    def test_capture_paths_and_audit_hashes_are_bound(self):
        for key in ['candidateMaster', 'committeeMaster', 'reviewAudit']:
            c = copy.deepcopy(self.catalog)
            c[key]['path'] = 'research/candidate-portraits/remaining-2026-11-02/../../README.md'
            with self.subTest(key=key), self.assertRaises(ValueError):
                if key == 'reviewAudit':
                    bulk.unresolved_review(c, [])
                else:
                    bulk.review(self.current, c, self.previous)


if __name__ == '__main__':
    unittest.main()
