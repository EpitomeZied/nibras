'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  isConsecutiveDay,
  difficultyLabel,
  difficultyTiersToPref,
  difficultyPrefToTiers,
  msUntilMidnight,
} = require('../packages/daily-problem/dist/streak');

test('isConsecutiveDay detects adjacent calendar days', () => {
  assert.equal(isConsecutiveDay('2026-05-01', '2026-05-02'), true);
  assert.equal(isConsecutiveDay('2026-05-01', '2026-05-03'), false);
});

test('difficultyLabel maps rating bands', () => {
  assert.equal(difficultyLabel(800), 'Easy');
  assert.equal(difficultyLabel(1500), 'Medium');
  assert.equal(difficultyLabel(2000), 'Hard');
});

test('difficulty tier prefs round-trip', () => {
  const pref = difficultyTiersToPref(['easy', 'hard']);
  assert.deepEqual(pref, [1000, 3000]);
  assert.deepEqual(difficultyPrefToTiers(pref).sort(), ['easy', 'hard']);
});

test('msUntilMidnight returns non-negative milliseconds', () => {
  const ms = msUntilMidnight('UTC');
  assert.ok(ms >= 0);
  assert.ok(ms <= 24 * 60 * 60 * 1000);
});
