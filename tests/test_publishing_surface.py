import struct
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PublishingSurfaceTests(unittest.TestCase):
    def read(self, relative: str) -> str:
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_nfl_social_card_is_exact_open_graph_size(self):
        image = ROOT / "assets" / "kahrelum-sports-intelligence-nfl-social-card.png"
        with image.open("rb") as stream:
            self.assertEqual(stream.read(8), b"\x89PNG\r\n\x1a\n")
            length = struct.unpack(">I", stream.read(4))[0]
            self.assertEqual(stream.read(4), b"IHDR")
            self.assertGreaterEqual(length, 8)
            width, height = struct.unpack(">II", stream.read(8))
        self.assertEqual((width, height), (1200, 630))

    def test_nfl_page_has_large_card_metadata(self):
        page = self.read("nfl/trades.html")
        self.assertIn('property="og:image"', page)
        self.assertIn('content="1200"', page)
        self.assertIn('content="630"', page)
        self.assertIn('name="twitter:card" content="summary_large_image"', page)
        self.assertIn('/assets/kahrelum-sports-intelligence-nfl-social-card.png', page)

    def test_editorial_pages_have_canonical_and_viewport(self):
        routes = {
            "insights.html": "https://kahrelum.com/insights",
            "insights/nfl-brier-accountability.html": "https://kahrelum.com/insights/nfl-brier-accountability",
            "insights/election-forecast-custody.html": "https://kahrelum.com/insights/election-forecast-custody",
            "insights/ai-bots-money-claims.html": "https://kahrelum.com/insights/ai-bots-money-claims",
            "nfl/weekly-brief.html": "https://kahrelum.com/nfl/weekly-brief",
            "sports-interest.html": "https://kahrelum.com/sports-interest",
        }
        for relative, canonical in routes.items():
            with self.subTest(relative=relative):
                page = self.read(relative)
                self.assertIn('name="viewport"', page)
                self.assertIn(f'rel="canonical" href="{canonical}"', page)
                self.assertIn("<main", page)
                self.assertIn("</html>", page)

    def test_ai_article_keeps_product_and_third_party_claims_separate(self):
        page = self.read("insights/ai-bots-money-claims.html")
        self.assertIn("does not allege that Grok or xAI operates an investment scam", page)
        for source in ["x.ai/legal/faq", "x.ai/legal/terms-of-service", "cftc.gov", "investor.gov", "ftc.gov"]:
            self.assertIn(source, page)

    def test_historical_brier_article_preserves_exclusion(self):
        page = self.read("insights/nfl-brier-accountability.html")
        for player, probability, brier in [
            ("Marvin Harrison Jr.", "49%", "0.2601"),
            ("Quenton Nelson", "39%", "0.3721"),
            ("DeForest Buckner", "68%", "0.1024"),
        ]:
            self.assertIn(player, page)
            self.assertIn(probability, page)
            self.assertIn(brier, page)
        self.assertIn("Current certified NFL denominator: zero", page)

    def test_interest_form_has_consent_and_no_checkout(self):
        page = self.read("sports-interest.html")
        self.assertIn('type="email"', page)
        self.assertIn('id="consent"', page)
        self.assertIn("No checkout and no billing", page)
        self.assertNotIn("stripe", page.lower())
        self.assertNotIn("paypal", page.lower())

    def test_guarded_publishing_profile_contains_every_new_surface(self):
        release = self.read("scripts/firebase-overlay-release.cjs")
        wrapper = self.read("scripts/deploy-unified-firebase.ps1")
        self.assertIn("publishing:", release)
        for path in [
            "nfl/weekly-brief.html",
            "insights.html",
            "insights/nfl-brier-accountability.html",
            "insights/election-forecast-custody.html",
            "insights/ai-bots-money-claims.html",
            "sports-interest.html",
            "assets/kahrelum-sports-intelligence-nfl-social-card.png",
        ]:
            self.assertIn(path, release)
        self.assertIn('"publishing"', wrapper)


if __name__ == "__main__":
    unittest.main()
