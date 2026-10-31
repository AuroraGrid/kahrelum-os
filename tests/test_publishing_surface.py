import hashlib
import json
import struct
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PublishingSurfaceTests(unittest.TestCase):
    def read(self, relative: str) -> str:
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_every_canonical_page_has_a_distinct_exact_size_social_card(self):
        manifest = json.loads(self.read("assets/social-manifest.json"))
        cards = manifest["cards"]
        self.assertEqual(manifest["schema"], "KAHRELUM_SOCIAL_CARDS_v1.0")
        self.assertEqual(len(cards), 27)
        self.assertEqual(len({card["route"] for card in cards}), len(cards))
        self.assertEqual(len({card["image"] for card in cards}), len(cards))
        for card in cards:
            with self.subTest(route=card["route"]):
                image = ROOT / card["image"]
                with image.open("rb") as stream:
                    self.assertEqual(stream.read(8), b"\x89PNG\r\n\x1a\n")
                    length = struct.unpack(">I", stream.read(4))[0]
                    self.assertEqual(stream.read(4), b"IHDR")
                    self.assertGreaterEqual(length, 8)
                    width, height = struct.unpack(">II", stream.read(8))
                self.assertEqual((width, height), (1200, 630))
                self.assertEqual(hashlib.sha256(image.read_bytes()).hexdigest(), card["sha256"])
                if card.get("productionManaged"):
                    self.assertIsNone(card["sourceHtml"])
                    self.assertIn(card["route"], {"/pilot", "/demo", "/sample", "/connect", "/hasan"})
                    continue
                page = self.read(card["sourceHtml"])
                absolute_image = f'https://kahrelum.com/{card["image"]}'
                self.assertIn(f'property="og:image" content="{absolute_image}"', page)
                self.assertIn(f'name="twitter:image" content="{absolute_image}"', page)
                for field in ("og:type", "og:url", "og:title", "og:description"):
                    self.assertEqual(page.count(f'property="{field}"'), 1)

    def test_nfl_page_has_large_card_metadata(self):
        page = self.read("nfl/trades.html")
        self.assertIn('property="og:image"', page)
        self.assertIn('content="1200"', page)
        self.assertIn('content="630"', page)
        self.assertIn('name="twitter:card" content="summary_large_image"', page)
        self.assertIn('/assets/social/og-nfl-trades.png', page)

    def test_production_managed_legacy_routes_have_guarded_social_overlays(self):
        release = self.read("scripts/firebase-overlay-release.cjs")
        for route, image in {
            "/pilot": "og-pilot.png",
            "/demo": "og-demo.png",
            "/sample": "og-sample.png",
            "/connect": "og-connect.png",
            "/hasan": "og-hasan.png",
        }.items():
            with self.subTest(route=route):
                self.assertIn(f"'{route}'", release)
                self.assertIn(image, release)
        self.assertIn("patchLegacySocial: true", release)
        self.assertIn("replaceLegacySocialMetadata", release)
        self.assertIn("verifiedLiveFile(live, spec.hostingPath, route)", release)

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

    def test_nfl_desk_refreshes_data_and_keeps_publication_dates_separate(self):
        page = self.read("nfl/trades.html")
        script = self.read("nfl/trades.js")
        workflow = self.read(".github/workflows/sports-intelligence-sourcegrid.yml")
        self.assertNotIn('http-equiv="refresh"', page)
        self.assertIn('src="/nfl/trades.js?', page)
        self.assertIn('cron: "3-58/5 * 31 10 *"', workflow)
        self.assertIn('cron: "3-58/5 * 1-10 11 *"', workflow)
        self.assertIn('nfl/forecast-ledger.json nfl/desk-live.json', workflow)
        self.assertIn('id="activityRows"', page)
        self.assertIn('id="refreshDesk"', page)
        self.assertIn('currentForecasts', script)
        self.assertIn('sourcePublishedAt', script)
        self.assertIn('latestEditorialPublicationAt', script)
        self.assertIn('Source headline · unreviewed', script)
        self.assertIn('60000', script)
        self.assertIn('document.hidden', script)
        self.assertIn('deployed fallback', script)

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
        self.assertIn("replaceHomepageSocialMetadata", release)
        self.assertIn("assets/social/og-home.png", release)
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
            "sports-article.css",
            "sports.html",
            "sports/module-registry.json",
            "nfl/film-room.html",
            "sports/nba.html",
            "sports/mlb.html",
            "sports/nhl.html",
        ]:
            self.assertIn(path, release)
        self.assertIn('"publishing"', wrapper)
        homepage_fragment = self.read("hosting/homepage-divisions.html")
        for route in ("/sports", "/nfl/trades", "/nfl/film-room"):
            self.assertIn(f'href="{route}"', homepage_fragment)

        for route in (
            "/election-live",
            "/election-count",
            "/election-method",
            "/election-showdown",
            "/election-comparison",
        ):
            self.assertIn(f"'{route}'", release)

    def test_public_release_hash_panels_are_removed_but_private_custody_remains(self):
        self.assertNotIn("Release identity", self.read("index.html"))
        self.assertNotIn("Release identity", self.read("election-challenge.html"))
        release = self.read("scripts/firebase-overlay-release.cjs")
        self.assertIn("publicReleaseIdentity", release)
        self.assertIn("election-challenge.html", release)

    def test_election_challenge_maps_fresh_full_federal_projection(self):
        import json

        page = self.read("election-challenge.html")
        script = self.read("election-challenge-map.js")
        release = self.read("scripts/firebase-overlay-release.cjs")
        house = json.loads(self.read("election/house-forecast-lock.json"))
        current = json.loads(self.read("election/current-projections.json"))
        seats = json.loads(self.read("election/seat-projections.json"))
        challengers = json.loads(self.read("election/challenger-source-checks.json"))
        geography = json.loads(self.read("assets/us-states-map.json"))
        portraits = json.loads(self.read("election/candidate-portraits.json"))
        self.assertEqual(len(house["competitive_districts"]), 81)
        self.assertEqual(current["status"], "FRESH_EXECUTION_LATEST_ACCESSIBLE_SOURCE_EDITIONS")
        self.assertEqual(current["house"]["raceCount"], 435)
        self.assertEqual(current["senate"]["raceCount"], 35)
        self.assertEqual(current["coverage"]["totalRaces"], 470)
        self.assertEqual(current["coverage"]["racesWithSourceListedCandidates"], 470)
        self.assertGreater(current["coverage"]["sourceListedCandidateRecords"], 0)
        self.assertEqual(current["coverage"]["admittedPortraits"], 0)
        self.assertEqual(current["sources"]["house"]["publisherEdition"], "October 23, 2026")
        self.assertEqual(current["sources"]["senate"]["publisherEdition"], "October 20, 2026")
        self.assertRegex(current["sources"]["house"]["sha256"], r"^[a-f0-9]{64}$")
        self.assertRegex(current["sources"]["senate"]["sha256"], r"^[a-f0-9]{64}$")
        self.assertIn('id="challengeUsMap"', page)
        self.assertIn('class="us-geo-map"', page)
        self.assertIn('id="mapStateJump"', page)
        self.assertIn('id="raceList"', page)
        self.assertIn('id="raceSearchSuggestions"', page)
        self.assertIn('id="loadMoreRaces"', page)
        self.assertIn('id="seatTracker"', page)
        self.assertIn('id="seatComparisonChart"', page)
        self.assertIn("census.gov/data/tables/2020/dec/2020-apportionment-data.html", page)
        self.assertIn("Candidate and portrait boundary", page)
        self.assertIn("Photo not yet verified", script)
        self.assertIn("/election/current-projections.json", script)
        self.assertIn("/election/challenger-source-checks.json", script)
        self.assertIn("/assets/us-states-map.json", script)
        self.assertIn("/election/candidate-portraits.json", script)
        self.assertIn("populateSearchSuggestions", script)
        self.assertIn("setMapChamber", script)
        self.assertIn("state-shape", script)
        self.assertIn("races.length !== 470", script)
        self.assertIn("current.house.raceCount !== 435", script)
        self.assertIn("current.senate.raceCount !== 35", script)
        self.assertIn('class="nominee-photo"', script)
        self.assertIn("portrait.status !== 'ADMITTED'", script)
        self.assertEqual(seats["house"]["kahrelum"]["democraticSeats"], 228.02)
        self.assertAlmostEqual(seats["senate"]["kahrelum"]["democraticSeats"], 50.229989536494045)
        self.assertEqual(seats["comparisonStatus"], "DESCRIPTIVE_ONLY_UNMATCHED_CUTOFFS_AND_SEAT_TYPES")
        canonical_challenger_bytes = self.read("election/challenger-source-checks.json").replace("\r\n", "\n").replace("\n", "\r\n").encode("utf-8")
        self.assertEqual(seats["sourceObservationFileSha256"], hashlib.sha256(canonical_challenger_bytes).hexdigest())
        self.assertEqual(challengers["status"], "VERIFIED_NUMERICAL_PROVIDERS_ONLY")
        self.assertEqual(challengers["challengersChecked"], 14)
        self.assertEqual(challengers["challengersWithAtLeastOneVerifiedControlProbability"], 14)
        self.assertEqual(challengers["unpricedChallengers"], 0)
        self.assertEqual(len(challengers["records"]), 15)
        priced = [row for row in challengers["records"] if row["houseDemocraticControlPct"] is not None or row["senateDemocraticControlPct"] is not None]
        unpriced = [row for row in challengers["records"] if row["houseDemocraticControlPct"] is None and row["senateDemocraticControlPct"] is None]
        self.assertEqual(challengers["records"], priced)
        self.assertEqual(unpriced, [])
        ddhq = next(row for row in challengers["records"] if row["provider"] == "Decision Desk HQ")
        self.assertEqual((ddhq["houseDemocraticControlPct"], ddhq["senateDemocraticControlPct"]), (82.0, 62.0))
        chambers = next(row for row in challengers["records"] if row["provider"] == "99chambers")
        self.assertEqual((chambers["houseDemocraticControlPct"], chambers["senateDemocraticControlPct"]), (98.0, 80.0))
        self.assertEqual((chambers["houseDemocraticSeats"], chambers["senateDemocraticSeats"]), (241.3, 52.5))
        scrutinel = next(row for row in challengers["records"] if row["provider"] == "Scrutinel")
        self.assertEqual((scrutinel["houseDemocraticControlPct"], scrutinel["senateDemocraticControlPct"]), (93.0, 70.0))
        callthemap = next(row for row in challengers["records"] if row["provider"] == "CalltheMap")
        self.assertEqual((callthemap["senateDemocraticControlPct"], callthemap["senateDemocraticSeats"]), (60.0, 51.4))
        new_numeric = {row["provider"]: row for row in challengers["records"] if row["provider"] in {"Dave Manuel", "On Point Politics", "VotePredictor", "Midterm Forecast"}}
        self.assertEqual(set(new_numeric), {"Dave Manuel", "On Point Politics", "VotePredictor", "Midterm Forecast"})
        self.assertEqual((new_numeric["Dave Manuel"]["houseDemocraticControlPct"], new_numeric["Dave Manuel"]["senateDemocraticControlPct"]), (94.0, 70.0))
        self.assertEqual((new_numeric["On Point Politics"]["houseDemocraticControlPct"], new_numeric["On Point Politics"]["senateDemocraticControlPct"]), (97.0, 86.0))
        self.assertEqual((new_numeric["On Point Politics"]["houseDemocraticSeats"], new_numeric["On Point Politics"]["senateDemocraticSeats"]), (249.0, 54.2))
        self.assertEqual((new_numeric["VotePredictor"]["houseDemocraticControlPct"], new_numeric["VotePredictor"]["senateDemocraticControlPct"]), (76.0, None))
        self.assertEqual((new_numeric["Midterm Forecast"]["houseDemocraticControlPct"], new_numeric["Midterm Forecast"]["senateDemocraticControlPct"]), (91.0, 71.0))
        datum = next(row for row in challengers["records"] if row["provider"] == "Datum Signals")
        self.assertEqual((datum["houseDemocraticControlPct"], datum["senateDemocraticControlPct"]), (70.0, 63.0))
        self.assertFalse({"The Economist", "Silver Bulletin", "Sam Brown", "Jon Elder"} & {row["provider"] for row in challengers["records"]})
        self.assertEqual(geography["schema"], "KAHRELUM_US_STATES_MAP_v1.0")
        self.assertEqual(geography["license"], "Unlicense / public domain dedication")
        self.assertEqual(len(geography["locations"]), 50)
        self.assertEqual({item["id"] for item in geography["locations"]}, {item["state"].lower() for item in current["house"]["districts"]})
        self.assertEqual(portraits["schema"], "KAHRELUM_CANDIDATE_PORTRAITS_v1.0")
        self.assertGreater(len(portraits["records"]), 300)
        self.assertEqual(len({row["sourceCandidateId"] for row in portraits["records"]}), len(portraits["records"]))
        for path in (
            "election-challenge-map.css",
            "election-challenge-map.js",
            "assets/us-states-map.json",
            "election/candidate-portraits.json",
            "election/house-forecast-lock.json",
            "election/senate-forecast-lock.json",
            "election/senate-ratings-source.json",
            "election/current-projections.json",
            "election/challenger-source-checks.json",
            "election/seat-projections.json",
        ):
            self.assertIn(path, release)

        refresh = self.read("scripts/refresh-election-projections.py")
        self.assertIn("EXPECTED_HOUSE_RACES = 435", refresh)
        self.assertIn("EXPECTED_SENATE_RACES = 35", refresh)

    def test_investigations_names_marion_county_state(self):
        page = self.read("investigations.html")
        self.assertIn("Marion County, Indiana case", page)
        self.assertIn("investigations.html", self.read("scripts/firebase-overlay-release.cjs"))

    def test_election_map_uses_conventional_party_colors_and_accessible_controls(self):
        css = self.read("election-challenge-map.css").lower()
        script = self.read("election-challenge-map.js")
        page = self.read("election-challenge.html")
        self.assertIn("--party-dem:#2563eb", css)
        self.assertIn("--party-rep:#dc2626", css)
        self.assertIn(".chamber-seat-bar .democratic", css)
        self.assertIn(".chamber-seat-bar .republican", css)
        self.assertIn(".probability-track .democratic", css)
        self.assertIn(".probability-track .republican", css)
        self.assertIn("event.key === 'Enter' || event.key === ' '", script)
        self.assertIn('role="group" aria-label="Map chamber"', page)
        self.assertIn("Suggestions include every source-listed candidate", page)
        self.assertIn('/election-challenge-map.css?v=', page)
        self.assertIn('/election-challenge-map.js?v=', page)
        self.assertIn("cache: 'no-store'", script)
        self.assertIn("ASSET_VERSION", script)

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

    def test_sports_articles_follow_paper_palette(self):
        shared_css = self.read("insights.css").lower()
        analysis_css = self.read("sports-article.css").lower()
        analysis = self.read("nfl/analysis.html")
        release = self.read("scripts/firebase-overlay-release.cjs")
        self.assertIn("color-scheme:light", shared_css)
        self.assertIn("--bg:#f4efe6", shared_css)
        self.assertNotIn("gradient", shared_css)
        self.assertIn("color-scheme:light", analysis_css)
        self.assertIn('href="/sports-article.css"', analysis)
        self.assertIn('name="twitter:card" content="summary_large_image"', analysis)
        self.assertIn('property="og:image"', analysis)
        publishing_profile = release.split("publishing:", 1)[1].split("],", 1)[0]
        self.assertIn("nfl/analysis.html", publishing_profile)

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
