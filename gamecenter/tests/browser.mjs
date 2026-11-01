// Local UI checks. Synthetic responses below are TEST ONLY; not provider validation.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const server = spawn(process.execPath, ["scripts/dev.mjs"], {
  env: { ...process.env, PORT: "8878" },
  stdio: ["ignore", "pipe", "pipe"],
});
await once(server.stdout, "data");
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require(
    process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES + "/playwright",
  ));
}
let launch = {
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
};
if (process.env.CHROMIUM_EXECUTABLE)
  launch.executablePath = process.env.CHROMIUM_EXECUTABLE;
const browser = await chromium.launch(launch);
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await fs.mkdir("test-results", { recursive: true });
const results = [];
try {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      "http://127.0.0.1:8878/?season=2026&type=REG&week=8&game=2026-REG-8-TEN-CIN",
    );
    await page
      .getByText("13 saved forecast matchups.", { exact: false })
      .waitFor();
    await page.getByRole("button", { name: "Predict", exact: true }).click();
    await page.getByText("82.5%", { exact: true }).waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "overflow at " + width,
    );
    assert.equal(await page.locator("table").count(), 0);
    await page.screenshot({
      path: `test-results/archive-${width}.png`,
      fullPage: true,
    });
    results.push(`Archive layout ${width}px: pass`);
  }
  const keys = await page
    .locator("[data-game]")
    .evaluateAll((nodes) => nodes.map((n) => n.dataset.game));
  assert.equal(keys.length, 13);
  for (const key of keys) {
    await page.locator(`[data-game="${key}"]`).click();
    assert.equal(new URL(page.url()).searchParams.get("game"), key);
    await page.getByRole("button", { name: "Highlights", exact: true }).click();
    await page
      .getByRole("heading", {
        name: "No playable highlights available",
        exact: true,
      })
      .waitFor();
    assert.equal(
      await page.locator("#tabBody a, #tabBody iframe, #tabBody video").count(),
      0,
    );
    await page.getByRole("button", { name: "Stats", exact: true }).click();
    await page
      .getByRole("heading", { name: "No reported statistics available" })
      .waitFor();
    await page.getByRole("button", { name: "Game", exact: true }).click();
  }
  results.push("All 13 game routes, tabs and strict empty Highlights: pass");
  await page.locator('[data-game="2026-REG-8-TEN-CIN"]').click();
  await page.locator('[data-favorite="2026-REG-8-TEN-CIN"]').click();
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  assert.equal(await page.locator("[data-game]").count(), 1);
  await page.getByRole("button", { name: "Favorites", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search teams" }).fill("Bengals");
  assert.equal(await page.locator("[data-game]").count(), 1);
  await page.getByRole("searchbox", { name: "Search teams" }).fill("");
  results.push("Favorites and team search: pass");
  await page.getByRole("button", { name: "Share game", exact: true }).click();
  const shared = await page
    .getByRole("textbox", { name: "Direct game link" })
    .inputValue();
  assert.equal(new URL(shared).searchParams.get("game"), "2026-REG-8-TEN-CIN");
  const wa = await page
    .getByRole("link", { name: "WhatsApp", exact: true })
    .getAttribute("href");
  assert.ok(decodeURIComponent(wa).includes(shared));
  await page.getByRole("button", { name: "Close", exact: true }).click();
  results.push("Share dialog and WhatsApp link preserve exact game: pass");
  await page.goto(shared);
  await page
    .getByText("13 saved forecast matchups.", { exact: false })
    .waitFor();
  assert.equal(
    await page
      .locator('[data-game="2026-REG-8-TEN-CIN"]')
      .getAttribute("aria-current"),
    "true",
  );
  await page.getByRole("button", { name: "Next week" }).click();
  await page
    .getByRole("heading", { name: "No game available", exact: true })
    .waitFor();
  assert.equal(await page.locator("[data-game]").count(), 0);
  await page.getByRole("button", { name: "Previous week" }).click();
  await page
    .getByText("13 saved forecast matchups.", { exact: false })
    .waitFor();
  results.push(
    "Week navigation uses distinct data, no recycled forecasts: pass",
  );
  await page.getByRole("button", { name: "Fantasy", exact: true }).click();
  await page.getByRole("heading", { name: "Your fantasy impact" }).waitFor();
  assert.equal(await page.locator(".league").count(), 0);
  assert.equal(await page.locator(".platform").count(), 5);
  results.push(
    "Unauthenticated fantasy view contains no private leagues: pass",
  );
  // Verify a live-shaped TEST fixture renders observed values, remains separate
  // from forecasts, and exposes stale/error state after source failure.
  await page.route("**/api/game?**", async (route) => {
    const d = await (await route.fetch()).json();
    d.game.status = "inprogress";
    d.game.homeScore = 7;
    d.game.awayScore = 3;
    d.game.period = 1;
    d.game.clock = "6:20";
    d.game.source = {
      name: "TEST FIXTURE",
      fetchedAt: new Date().toISOString(),
      updatedAt: null,
      staleAfterSeconds: 120,
    };
    d.game.situation = {
      possession: "CIN",
      down: 2,
      distance: 7,
      yardline: 35,
      territory: "TEN",
    };
    d.plays = [
      {
        id: "test-play",
        period: 1,
        clock: "6:20",
        text: "TEST FIXTURE: completed pass.",
      },
    ];
    d.playerStats = [
      {
        id: "test-player",
        name: "Test Player",
        team: "CIN",
        category: "passing",
        stats: [{ metric: "yards", value: 88 }],
      },
    ];
    d.teamStats = [];
    d.errors = [];
    d.sources = { pbp: d.game.source, statistics: d.game.source };
    await route.fulfill({ json: d });
  });
  await page.locator('[data-game="2026-REG-8-TEN-CIN"]').click();
  await page.getByRole("button", { name: "Game", exact: true }).click();
  await page
    .getByText("TEST FIXTURE: completed pass.", { exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Stats", exact: true }).click();
  await page.getByRole("heading", { name: "Test Player" }).waitFor();
  await page.getByRole("button", { name: "Predict", exact: true }).click();
  await page.getByText("82.5%", { exact: true }).waitFor();
  await page.getByText("29", { exact: true }).waitFor();
  results.push(
    "Synthetic live scores/plays/stats render separately from frozen predictions: pass",
  );
  await page.unroute("**/api/game?**");
  await page.route("**/api/game?**", (r) =>
    r.fulfill({
      status: 502,
      json: { error: "TEST_OUTAGE", message: "TEST outage" },
    }),
  );
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByRole("button", { name: "Game", exact: true }).click();
  await page.getByText("TEST outage", { exact: true }).waitFor();
  results.push(
    "Selected source failures displayed without invented recovery: pass",
  );
  assert.deepEqual(errors, []);
  results.push("No JavaScript page errors: pass");
  await fs.writeFile(
    "test-results/browser-report.json",
    JSON.stringify(
      {
        scope:
          "LOCAL TESTS ONLY. No real-provider or production video validation.",
        results,
      },
      null,
      2,
    ),
  );
  console.log(results.join("\n"));
} finally {
  await browser.close();
  server.kill();
}
