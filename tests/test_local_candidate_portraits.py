import copy
import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('candidate_portraits', ROOT / 'scripts/build_candidate_portraits.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class LocalPortraitTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        def read(name):
            return json.loads((ROOT / name).read_text(encoding='utf-8'))
        cls.current = read('election/current-projections.json')
        cls.ledger = read('election/candidate-portraits.json')
        cls.catalog = read('research/candidate-portraits/local-sources-2026-11-02.json')
        cls.identities = read('research/candidate-portraits/primary-identities-2026-11-02.json')
        cls.previous = [r for r in cls.ledger['records'] if r.get('identityType') != 'FEC_LOCAL_COMMONS']

    def review(self, catalog):
        return builder.reviewed_local(self.current, catalog, self.previous)

    def test_five_local_photos_have_exact_fec_bindings_and_creator_credit(self):
        rows = self.review(self.catalog)
        self.assertEqual({r['candidateName'] for r in rows},
                         {'Derek Merrin', 'Paige Cognetti', 'Jonathan Nez', 'Josh Turek', 'Christina Bohannan'})
        self.assertTrue(all(r['identityId'] == r['fecCandidateId'] and r['attribution'] for r in rows))
        self.assertIn('Liz Roll', next(r for r in rows if r['candidateName'] == 'Paige Cognetti')['creditNote'])

    def test_wrong_identity_rights_source_or_image_is_rejected(self):
        for field, value in [('contestId', 'OH-8'), ('candidateName', 'Another Person'),
                             ('identityId', 'H4OH09168'), ('license', 'CC BY-SA 4.0'),
                             ('attribution', ''), ('photoSubjectName', 'Someone Else'),
                             ('commonsRevisionId', 1), ('sourceUrl', 'https://example.com'),
                             ('imageSha256', '0' * 64), ('imageBytes', 1)]:
            changed = copy.deepcopy(self.catalog)
            changed['records'][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.review(changed)

    def test_no_duplicate_or_replacement_is_allowed(self):
        duplicate = copy.deepcopy(self.catalog)
        duplicate['records'].append(duplicate['records'][0])
        with self.assertRaises(ValueError):
            self.review(duplicate)
        with self.assertRaises(ValueError):
            builder.reviewed_local(self.current, self.catalog, self.ledger['records'])

    def test_iowa_permission_cannot_be_replaced_by_a_blanket_pd_claim(self):
        for field, value in [('license', 'Public domain'), ('permissionTicket', '1'),
                             ('licenseUrl', 'https://creativecommons.org/publicdomain/zero/1.0/'),
                             ('attribution', 'Wikimedia Commons')]:
            changed = copy.deepcopy(self.catalog)
            changed['records'][3][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.review(changed)

    def test_capture_digest_and_path_traversal_are_rejected(self):
        for capture in [{'path': self.catalog['records'][0]['sourceCapture']['path'], 'sha256': '0'*64},
                        {'path': 'research/candidate-portraits/review-2026-11-02/../README.md', 'sha256': '0'*64}]:
            changed = copy.deepcopy(self.catalog)
            changed['records'][0]['sourceCapture'] = capture
            with self.assertRaises(ValueError):
                self.review(changed)

    def test_fec_district_party_and_undocumented_alias_fail_closed(self):
        for name, field, value in [('Derek Merrin', 'sourceSeat', 'Ohio House District 8'),
                                  ('Derek Merrin', 'sourceParty', 'DEMOCRATIC PARTY'),
                                  ('Josh Turek', 'documentedAliasCommittee', '')]:
            identities = copy.deepcopy(self.identities)
            next(r for r in identities['records'] if r['candidateName'] == name)[field] = value
            photo = next(r for r in self.catalog['records'] if r['candidateName'] == name)
            with self.subTest(field=field), patch.object(builder.json, 'loads', return_value=identities), self.assertRaises(ValueError):
                builder.primary_identity(photo)


if __name__ == '__main__':
    unittest.main()
