# NFC East 2026 postgame publication and update rules

Original post-WAS/NYG 1,000,000-draw source is preserved in GitHub commit d29ffcc02433efe3bd184865bd15d075fcfce7de. Never edit or replace that file, its probabilities or the public source JSON.

After each **verified final** game involving NYG, DAL, WAS or PHI:
1. Verify official result, standings, divisional/conference records, player injuries and sources at the cutoff.
2. Rerun and test the versioned simulator, recording new seed and any input-rating or market changes.
3. Append a new timestamped JSON snapshot, *without overwriting* any earlier event probability or scenario source.
4. Add the old-to-new probabilities and exact trigger to the HTML update ledger and index.
5. Regenerate the social image with the new numbers under a versioned filename so cached X/OpenGraph shares update.
6. Publish through the guarded NFC East Firebase profile and verify preview plus live byte readback.

Do not score unresolved events, imply a rerun before execution, or rewrite evidence from earlier games.
