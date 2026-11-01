// KAHRELUM methodology migrated to a separate sports-only research product.
// Probability is in percent, not 0–1. Stakes are conditional exposure caps, not orders.
const finiteNumber = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${name} must be a finite number`);
  return value;
};

export function breakEvenPercent(americanOdds) {
  const odds = finiteNumber(americanOdds, 'American odds');
  if (!Number.isInteger(odds) || Math.abs(odds) < 100) throw new RangeError('American odds must be integer >= +100 or <= -100');
  return odds > 0 ? 10000 / (100 + odds) : (-odds * 100) / (100 - odds);
}

export function decimalToAmerican(decimalOdds) {
  finiteNumber(decimalOdds, 'Decimal odds');
  if (decimalOdds <= 1) throw new RangeError('Decimal odds must be greater than one');
  return decimalOdds >= 2 ? Math.round((decimalOdds - 1) * 100) : Math.round(-100 / (decimalOdds - 1));
}

export function classifyBet(winProbabilityPercent, americanOdds, reviewed = false) {
  const p = finiteNumber(winProbabilityPercent, 'Win probability');
  if (p <= 0 || p > 100) throw new RangeError('Win probability must be between 0 and 100');
  if (typeof reviewed !== 'boolean') throw new TypeError('Review flag must be boolean');
  const breakEven = breakEvenPercent(americanOdds);
  const probability = p / 100;
  const netProfitPerDollar = americanOdds > 0 ? americanOdds / 100 : 100 / -americanOdds;
  const expectedRoiPercent = 100 * (probability * netProfitPerDollar - (1 - probability));
  const edgePercentagePoints = p - breakEven;
  const actionable = edgePercentagePoints >= 2 - 1e-10 && expectedRoiPercent >= 3 - 1e-10;
  let tier = 'NO_BET';
  let conditionalStakeCapUsd = 0;
  if (p >= 52.5 && expectedRoiPercent > 0) {
    if (p < 55) tier = (p >= 54.5 && actionable) ? 'FRIENDS_SLIGHT_EDGE' : 'FRIENDS';
    else if (!actionable) tier = 'PRICE_WATCH';
    else if (p < 58) { tier = 'STRONG_OPTIONAL'; conditionalStakeCapUsd = 25; }
    else { tier = 'CERTIFIED'; conditionalStakeCapUsd = 50; }
  }
  return {
    tier, winProbabilityPercent:p, ticketAmericanOdds:americanOdds,
    breakEvenPercent:breakEven, edgePercentagePoints, expectedRoiPercent,
    conditionalStakeCapUsd, stakeUsd:reviewed ? conditionalStakeCapUsd : 0,
    action:conditionalStakeCapUsd > 0 ? (reviewed ? 'REVIEWED_CONDITIONAL_CAP' : 'REVIEW_REQUIRED') : 'INFORMATION_ONLY',
    marketReviewed:reviewed, straightBetsOnly:true,
    message: 'Model probabilities and ROI are estimates; the tier is not an assurance of success or a bet placement.'
  };
}
