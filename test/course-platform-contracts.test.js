import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AssignmentSubmissionsListSchema,
  CourseAssignmentSchema,
  CreateCourseAssignmentRequestSchema,
  TrackingCourseDetailSchema,
  VideoAnalyticsResponseSchema,
} from '@nibras/contracts';

test('CourseAssignmentSchema parses list item', () => {
  const parsed = CourseAssignmentSchema.parse({
    id: 'a1',
    courseId: 'c1',
    title: 'HW1',
    pointsPossible: 100,
    sortOrder: 0,
    published: true,
    status: 'not_started',
  });
  assert.equal(parsed.title, 'HW1');
});

test('CreateCourseAssignmentRequestSchema requires title', () => {
  assert.throws(() => CreateCourseAssignmentRequestSchema.parse({}));
});

test('TrackingCourseDetailSchema accepts profile fields', () => {
  const parsed = TrackingCourseDetailSchema.parse({
    id: 'c1',
    slug: 'cs101',
    title: 'Intro',
    termLabel: 'Fall',
    courseCode: 'CS101',
    isActive: true,
    sequentialVideos: false,
    videoProgressPercent: 50,
  });
  assert.equal(parsed.videoProgressPercent, 50);
});

test('VideoAnalyticsResponseSchema parses analytics', () => {
  const parsed = VideoAnalyticsResponseSchema.parse({
    videos: [
      {
        videoId: 'v1',
        title: 'L1',
        sectionTitle: 'Week 1',
        enrolledCount: 10,
        watchedCount: 5,
        avgWatchedProgress: 0.5,
      },
    ],
  });
  assert.equal(parsed.videos.length, 1);
});

test('AssignmentSubmissionsListSchema parses instructor queue', () => {
  const parsed = AssignmentSubmissionsListSchema.parse({
    items: [
      {
        id: 's1',
        userId: 'u1',
        username: 'alice',
        submittedAt: '2026-05-01T12:00:00.000Z',
        status: 'submitted',
        contentPreview: 'Hello',
      },
    ],
  });
  assert.equal(parsed.items[0].username, 'alice');
});
