'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

/** Mirrors listBadgesForUser progress logic in gamification/service.ts */
function badgeProgress(raw, threshold, earnedAt) {
  const capped = Math.min(raw, threshold);
  return earnedAt ? threshold : capped;
}

test('earned badge progress equals threshold (100%)', () => {
  assert.equal(badgeProgress(3, 5, '2026-01-01'), 5);
});

test('locked badge progress is capped at threshold', () => {
  assert.equal(badgeProgress(12, 10, undefined), 10);
});

test('locked badge below threshold', () => {
  assert.equal(badgeProgress(2, 5, undefined), 2);
});
