const test = require('node:test');
const assert = require('node:assert/strict');
const { CourseBrowseItemSchema } = require('@nibras/contracts');

const baseItem = {
  id: 'course_test',
  slug: 'course-test',
  title: 'Test Course',
  termLabel: 'Year 1',
  courseCode: 'TEST101',
  isActive: true,
  isPublic: true,
  isEnrolled: false,
  enrollmentRequestStatus: 'none',
};

test('CourseBrowseItemSchema accepts null thumbnailUrl', () => {
  const parsed = CourseBrowseItemSchema.parse({
    ...baseItem,
    thumbnailUrl: null,
  });
  assert.equal(parsed.thumbnailUrl, null);
});

test('CourseBrowseItemSchema accepts missing thumbnailUrl', () => {
  const parsed = CourseBrowseItemSchema.parse(baseItem);
  assert.equal(parsed.thumbnailUrl, undefined);
});
