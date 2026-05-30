const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeYouTubeExternalId,
  normalizeBilibiliExternalId,
  resolvePlaybackUrl,
  resolveThumbnailUrl,
  isVideoPlayable,
  parseCourseVideoResources,
} = require('../apps/api/dist/features/tracking/course-videos');
const { CourseVideoSchema } = require('@nibras/contracts');

test('normalizeYouTubeExternalId accepts bare id', () => {
  assert.equal(normalizeYouTubeExternalId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('normalizeYouTubeExternalId extracts from watch URL', () => {
  assert.equal(
    normalizeYouTubeExternalId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ'
  );
  assert.equal(normalizeYouTubeExternalId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

test('normalizeBilibiliExternalId extracts BV id from URL', () => {
  assert.equal(
    normalizeBilibiliExternalId('https://www.bilibili.com/video/BV1xx411c7mD'),
    'BV1xx411c7mD'
  );
});

test('resolveThumbnailUrl uses i.ytimg.com (CSP-allowed CDN)', () => {
  assert.equal(
    resolveThumbnailUrl({
      provider: 'youtube',
      externalId: 'dQw4w9WgXcQ',
    }),
    'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
  );
  assert.equal(
    resolveThumbnailUrl({
      provider: 'youtube',
      externalId: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    }),
    'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
  );
  assert.equal(
    resolveThumbnailUrl({
      provider: 'mp4',
      externalId: null,
    }),
    undefined
  );
});

test('resolvePlaybackUrl builds youtube-nocookie embed for pasted URLs', () => {
  assert.equal(
    resolvePlaybackUrl({
      provider: 'youtube',
      externalId: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      embedUrl: null,
    }),
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'
  );
});

test('resolvePlaybackUrl falls back to embedUrl for mp4', () => {
  assert.equal(
    resolvePlaybackUrl({
      provider: 'mp4',
      externalId: null,
      embedUrl: 'https://cdn.example.com/lecture.mp4',
    }),
    'https://cdn.example.com/lecture.mp4'
  );
});

test('isVideoPlayable is false when no valid source', () => {
  assert.equal(
    isVideoPlayable({
      provider: 'youtube',
      externalId: 'not-a-valid-id',
      embedUrl: null,
    }),
    false
  );
  assert.equal(resolvePlaybackUrl({
    provider: 'youtube',
    externalId: 'not-a-valid-id',
    embedUrl: null,
  }), '');
});

test('parseCourseVideoResources validates label/url pairs', () => {
  const parsed = parseCourseVideoResources([
    { label: 'Slides', url: 'https://example.com/slides.pdf' },
    { label: 'Bad', url: 'not-a-url' },
  ]);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].label, 'Slides');
});

test('CourseVideoSchema accepts resources array', () => {
  const video = CourseVideoSchema.parse({
    id: 'vid_1',
    courseId: 'course_1',
    sectionId: 'sec_1',
    sectionTitle: 'Week 1',
    title: 'Intro',
    provider: 'youtube',
    playbackUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    sortOrder: 0,
    resources: [{ label: 'Slides', url: 'https://example.com/slides.pdf' }],
  });
  assert.equal(video.resources?.length, 1);
});
