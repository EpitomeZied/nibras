const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeYouTubeExternalId,
  normalizeBilibiliExternalId,
  resolvePlaybackUrl,
} = require('../apps/api/dist/features/tracking/course-videos');

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
