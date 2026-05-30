'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  mergeNibras75Status,
  matchesNibras75Query,
  sortNibras75Rows,
} = require('../apps/api/dist/features/competitions/practice/nibras75/nibras75-client');

const sampleEntry = {
  rank: 1,
  slug: 'two-sum',
  title: 'Two Sum',
  difficulty: 'Easy',
  description: 'Find two numbers.',
  tags: ['array', 'hash-table'],
  askedByCount: 51,
};

test('mergeNibras75Status prefers database progress over LeetCode', () => {
  const db = new Map([['two-sum', { solved: false, attempted: true }]]);
  const lc = new Map([['two-sum', { solved: true, attempted: true }]]);
  const merged = mergeNibras75Status('two-sum', db, lc);
  assert.equal(merged.solved, false);
  assert.equal(merged.userMarked, true);
});

test('mergeNibras75Status falls back to LeetCode when no db row', () => {
  const db = new Map();
  const lc = new Map([['two-sum', { solved: true, attempted: true }]]);
  const merged = mergeNibras75Status('two-sum', db, lc);
  assert.equal(merged.solved, true);
  assert.equal(merged.userMarked, false);
});

test('matchesNibras75Query filters by tag and company', () => {
  assert.equal(matchesNibras75Query(sampleEntry, { tag: 'array' }, ['google']), true);
  assert.equal(matchesNibras75Query(sampleEntry, { tag: 'graph' }, ['google']), false);
  assert.equal(matchesNibras75Query(sampleEntry, { company: 'google' }, ['google']), true);
  assert.equal(matchesNibras75Query(sampleEntry, { company: 'meta' }, ['google']), false);
});

test('sortNibras75Rows orders by askedByCount', () => {
  const rows = [
    {
      rank: 2,
      problemId: 'b',
      name: 'B',
      url: '',
      difficulty: 'Easy',
      description: '',
      tags: [],
      askedByCount: 10,
      companies: [],
      solved: false,
      attempted: false,
      userMarked: false,
    },
    {
      rank: 1,
      problemId: 'a',
      name: 'A',
      url: '',
      difficulty: 'Hard',
      description: '',
      tags: [],
      askedByCount: 50,
      companies: [],
      solved: false,
      attempted: false,
      userMarked: false,
    },
  ];
  const sorted = sortNibras75Rows(rows, 'askedByCount');
  assert.equal(sorted[0].problemId, 'a');
});
