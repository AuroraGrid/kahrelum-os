"""Guard authenticated SourceGrid-to-Firebase promotion and prevent fake freshness."""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]

class FirebaseAutopublishTests(unittest.TestCase):
    def test_sourcegrid_publisher_is_in_same_workflow_after_bot_push(self):
        text=(ROOT / '.github/workflows/sports-intelligence-sourcegrid.yml').read_text()
        self.assertIn('id: source_commit', text)
        self.assertIn('git push origin "HEAD:${SOURCEGRID_REF}"', text)
        self.assertIn('id: firebase_publish', text)
        self.assertLess(text.index('id: source_commit'),text.index('id: firebase_publish'))
        self.assertIn('--preview --profile nfl-sourcegrid-data',text)
        self.assertIn('--promote --profile nfl-sourcegrid-data',text)
        self.assertIn('KAHRELUM_FIREBASE_SERVICE_ACCOUNT_JSON',text)
        self.assertIn('GOOGLE_APPLICATION_CREDENTIALS',text)
        self.assertIn('FIREBASE_TOOLS_ROOT',text)
        self.assertIn("github.ref == 'refs/heads/main'",text)
        self.assertIn('steps.source_commit.outputs.changed',text)
        self.assertNotIn('firebase deploy --only hosting',text)

    def test_no_secret_means_explicit_skip_not_fake_success(self):
        text=(ROOT / '.github/workflows/sports-intelligence-sourcegrid.yml').read_text()
        self.assertIn('Automatic Firebase publish SKIPPED',text)
        self.assertIn('steps.source_commit.outputs.changed',text)
        self.assertIn('Publish public status on approval only',text)
        self.assertIn('firebase-tools@15.34.2',text)

    def test_generated_data_update_retains_historical_forecast_gates(self):
        script=(ROOT / 'scripts/firebase-overlay-release.cjs').read_text()
        self.assertIn("profileName === 'nfl-sourcegrid-data'",script)
        self.assertIn('SourceGrid update attempted to erase or rewrite a historical forecast record',script)
        self.assertIn('SourceGrid may not authorize automated third-party publication',script)
        self.assertIn('Preview requires a clean Git working tree',script)
        self.assertIn('Production file-map readback differs',script)

if __name__=='__main__':
    unittest.main()
