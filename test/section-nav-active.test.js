const test = require('node:test');
const assert = require('node:assert/strict');

/** Mirrors resolveSectionNavActiveHref in section-nav.tsx */
function resolveSectionNavActiveHref(pathname, items) {
  const matches = items.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.href.length - a.href.length)[0].href;
}

const plannerSections = [
  { href: '/planner', label: 'Overview' },
  { href: '/planner/track', label: 'Track' },
  { href: '/planner/petitions', label: 'Petitions' },
  { href: '/planner/sheet', label: 'Sheet' },
];

test('section nav picks longest matching href for planner', () => {
  assert.equal(resolveSectionNavActiveHref('/planner/track', plannerSections), '/planner/track');
  assert.equal(resolveSectionNavActiveHref('/planner', plannerSections), '/planner');
  assert.equal(resolveSectionNavActiveHref('/planner/sheet', plannerSections), '/planner/sheet');
});
