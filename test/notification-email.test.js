'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeNotificationEmail, resolveOutboundEmail } = require('@nibras/contracts');

test('normalizeNotificationEmail accepts Gmail-style addresses', () => {
  assert.equal(normalizeNotificationEmail('  Student@Gmail.COM '), 'student@gmail.com');
  assert.equal(normalizeNotificationEmail('bad'), null);
});

test('resolveOutboundEmail prefers notificationEmail', () => {
  assert.equal(
    resolveOutboundEmail({
      email: 'login@users.noreply.github.com',
      notificationEmail: 'student@gmail.com',
    }),
    'student@gmail.com'
  );
});

test('resolveOutboundEmail skips GitHub noreply when no custom email', () => {
  assert.equal(
    resolveOutboundEmail({
      email: 'login@users.noreply.github.com',
      notificationEmail: null,
    }),
    null
  );
});

test('resolveOutboundEmail uses account email when usable', () => {
  assert.equal(
    resolveOutboundEmail({
      email: 'real@school.edu',
      notificationEmail: null,
    }),
    'real@school.edu'
  );
});
