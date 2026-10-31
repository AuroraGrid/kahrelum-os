import struct
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PublishingSurfaceTests(unittest.TestCase):
    def read(self, relative: str) -> str:
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_nfl_social_card_is_exact_open_graph_size(self):
        for name in [
            "kahrelum-sports-intelligence-nfl-social-card.png",
            "kahrelum-sports-intelligence-social-card.png",
        ]:
            with self.subTest(name=name):
                image = ROOT / "assets" / name
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

    def test_every_sports_operations_route_has_large_social_preview(self):
        for relative in [
            "sports.html", "nfl/trades.html", "nfl/film-room.html",
            "sports/nba.html", "sports/mlb.html", "sports/nhl.html",
        ]:
            with self.subTest(relative=relative):
                page = self.read(relative)
                self.assertIn('property="og:image"', page)
                self.assertIn('property="og:image:width" content="1200"', page)
                self.assertIn('property="og:image:height" content="630"', page)
                self.assertIn('name="twitter:card" content="summary_large_image"', page)
                self.assertIn('name="twitter:image"', page)
                self.assertIn('name="twitter:image:alt"', page)

    def test_editorial_pages_have_canonical_and_viewport(self):
        routes = {
            "insights.html": "https://kahrelum.com/insights",
            "insights/nfl-brier-accountability.html": "https://kahrelum.com/insights/nfl-brier-accountability",
            "insights/election-forecast-custody.html": "https://kahrelum.com/insights/election-forecast-custody",
            "insights/ai-bots-money-claims.html": "https://kahrelum.com/insights/ai-bots-money-claims",
            "nfl/weekly-brief.html": "https://kahrelum.com/nfl/weekly-brief",
            "sports-interest.html": "https://kahrelum.com/sports-interest",
            "sports.html": "https://kahrelum.com/sports",
            "nfl/film-room.html": "https://kahrelum.com/nfl/film-room",
            "sports/nba.html": "https://kahrelum.com/sports/nba",
            "sports/mlb.html": "https://kahrelum.com/sports/mlb",
            "sports/nhl.html": "https://kahrelum.com/sports/nhl",
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
            "assets/kahrelum-sports-intelligence-social-card.png",
            "sports-desk.css",
            "sports.html",
            "sports/module-registry.json",
            "nfl/film-room.html",
            "sports/nba.html",
            "sports/mlb.html",
            "sports/nhl.html",
        ]:
            self.assertIn(path, release)
        self.assertIn('"publishing"', wrapper)

    def test_public_release_hash_panels_are_removed_but_private_custody_remains(self):
        self.assertNotIn("Release identity", self.read("index.html"))
        self.assertNotIn("Release identity", self.read("election-challenge.html"))
        release = self.read("scripts/firebase-overlay-release.cjs")
        self.assertIn("publicReleaseIdentity", release)
        self.assertIn("election-challenge.html", release)

    def test_investigations_names_marion_county_state(self):
        page = self.read("investigations.html")
        self.assertIn("Marion County, Indiana case", page)
        self.assertIn("investigations.html", self.read("scripts/firebase-overlay-release.cjs"))

    def test_sports_desk_uses_flat_editorial_system(self):
        css = self.read("sports-desk.css").lower()
        self.assertNotIn("gradient", css)
        self.assertNotIn("box-shadow", css)
        self.assertIn("border-radius:0", css.replace(" ", ""))
        self.assertIn('font:14px/1.5arial,"helveticaneue",sans-serif', css.replace(" ", "").lower())
        self.assertIn("color-scheme:light", css)
        self.assertIn("--bg:#f4efe6", css)
        self.assertIn("--text:#161411", css)
        self.assertIn("--line:#c8bfae", css)

        for path in (
            "sports.html",
            "nfl/trades.html",
            "nfl/film-room.html",
            "sports/nba.html",
            "sports/mlb.html",
            "sports/nhl.html",
        ):
            self.assertIn('<meta name="theme-color" content="#f4efe6">', self.read(path))

    def test_sports_registry_does_not_overstate_expansion_coverage(self):
        import json

        registry = json.loads(self.read("sports/module-registry.json"))
        modules = {item["id"]: item for item in registry["modules"]}
        self.assertEqual(modules["NFL_TRADE_DEADLINE_2026"]["status"], "OPERATIONAL_REVIEW_GATED")
        self.assertEqual(modules["NFL_TRADE_DEADLINE_2026"]["operationalSources"], 37)
        self.assertEqual(modules["NFL_TRADE_DEADLINE_2026"]["publicRecords"], 124)
        self.assertEqual(modules["NFL_FILM_ROOM"]["status"], "OPERATIONAL_FRAMEWORK_NO_ADMITTED_FILM")
        for module_id in ["NFL_FILM_ROOM", "NBA_TRADES", "MLB_TRANSACTIONS", "NHL_TRANSACTIONS"]:
            with self.subTest(module_id=module_id):
                self.assertEqual(modules[module_id]["operationalSources"], 0)
                self.assertEqual(modules[module_id]["publicRecords"], 0)

    def test_film_room_is_rights_safe_and_does_not_publish_grades(self):
        page = self.read("nfl/film-room.html")
        self.assertIn("0 admitted film packets", page)
        self.assertIn("No copyrighted game film is mirrored", page)
        self.assertIn("no player grade is published", page.lower())
        for player in ["Josh Downs", "Will McDonald IV", "Adetomiwa Adebawore"]:
            self.assertIn(player, page)


if __name__ == "__main__":
    unittest.main()
