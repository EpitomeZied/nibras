const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeYouTubeExternalId,
  normalizeBilibiliExternalId,
  resolvePlaybackUrl,
  isVideoPlayable,
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
