import test from 'node:test';
import assert from 'node:assert/strict';
import { breakEvenPercent, classifyBet, decimalToAmerican } from '../public/lib/policy.mjs';

test('−110 breaks even at 52.38095%, the profit threshold is not 50.1%', () => {
  assert.ok(Math.abs(breakEvenPercent(-110) - 52.38095238095) < 0.000001);
  assert.equal(classifyBet(52.38, -110, true).tier, 'NO_BET');
});

test('FRIENDS begins at 52.5% and remains informational at −110', () => {
  const r = classifyBet(52.5, -110, true);
  assert.equal(r.tier, 'FRIENDS');
  assert.equal(r.stakeUsd, 0);
  assert.ok(r.expectedRoiPercent > 0);
});

test('slight edge sublabel begins at 54.5% only when price edge and ROI qualify', () => {
  assert.equal(classifyBet(54.49, -110, true).tier, 'FRIENDS');
  assert.equal(classifyBet(54.5, -110, true).tier, 'FRIENDS_SLIGHT_EDGE');
  assert.equal(classifyBet(54.5, -110, true).stakeUsd, 0);
  assert.equal(classifyBet(54.5, -118, true).tier, 'FRIENDS');
});

test('reviewed strong optional 55% and certified 58% at -110 receive $25/$50 caps', () => {
  assert.deepEqual([classifyBet(55, -110, true).tier,classifyBet(55, -110, true).stakeUsd],['STRONG_OPTIONAL',25]);
  assert.deepEqual([classifyBet(58, -110, true).tier,classifyBet(58, -110, true).stakeUsd],['CERTIFIED',50]);
});

test('unreviewed model never gets a positive stake', () => {
  const r = classifyBet(70, -110, false);
  assert.equal(r.tier, 'CERTIFIED');
  assert.equal(r.stakeUsd, 0);
  assert.equal(r.action, 'REVIEW_REQUIRED');
});

test('58% at -150 has negative EV despite high predicted win rate', () => {
  const r = classifyBet(58, -150, true);
  assert.equal(r.tier, 'NO_BET');
  assert.equal(r.stakeUsd, 0);
  assert.ok(r.expectedRoiPercent < 0);
});

test('55% at -120 is price watch, not a $25 recommendation', () => {
  const r = classifyBet(55,-120,true);
  assert.equal(r.tier,'PRICE_WATCH');
  assert.equal(r.stakeUsd,0);
});

test('positive American odds are handled independently', () => {
  assert.ok(Math.abs(breakEvenPercent(110) - 47.619047619) < 0.00001);
  assert.equal(classifyBet(55,110,true).tier,'STRONG_OPTIONAL');
  assert.equal(decimalToAmerican(2.1),110);
  assert.equal(decimalToAmerican(1.909090909),-110);
});

test('reject invalid model probabilities, odds and review signals', () => {
  for (const odds of [0,98,-99,150.4,NaN,'+110',null]) assert.throws(()=>classifyBet(56,odds,true));
  for (const p of [0,-1,101,NaN,null,'56']) assert.throws(()=>classifyBet(p,-110,true));
  assert.throws(()=>classifyBet(55,-110,'true'));
});
