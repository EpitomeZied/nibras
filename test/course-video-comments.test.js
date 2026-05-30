const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CourseVideoCommentSchema,
  CourseVideoCommentsResponseSchema,
  CreateCourseVideoCommentRequestSchema,
} = require('@nibras/contracts');

test('CreateCourseVideoCommentRequestSchema requires non-empty body', () => {
  assert.throws(() => CreateCourseVideoCommentRequestSchema.parse({ body: '' }));
  const ok = CreateCourseVideoCommentRequestSchema.parse({ body: 'Great lecture!' });
  assert.equal(ok.body, 'Great lecture!');
});

test('CourseVideoCommentsResponseSchema parses comment list', () => {
  const parsed = CourseVideoCommentsResponseSchema.parse({
    comments: [
      {
        id: 'cmt_1',
        videoId: 'vid_1',
        body: 'Thanks!',
        author: {
          userId: 'user_1',
          username: 'student1',
        },
        createdAt: '2026-05-30T12:00:00.000Z',
      },
    ],
  });
  assert.equal(parsed.comments.length, 1);
  CourseVideoCommentSchema.parse(parsed.comments[0]);
});
