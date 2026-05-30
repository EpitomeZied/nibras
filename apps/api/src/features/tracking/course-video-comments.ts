import { FastifyInstance } from 'fastify';
import { CommunityModerationStatus, PrismaClient } from '@prisma/client';
import {
  CommunityAuthorSchema,
  CourseVideoCommentSchema,
  CourseVideoCommentsResponseSchema,
  CreateCourseVideoCommentRequestSchema,
} from '@nibras/contracts';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { validateId } from '../../lib/validate';
import { AppStore } from '../../store';
import { requestBaseUrl } from '../../lib/request-base-url';
import { authorSelect, loadReputationTotals, presentAuthor } from '../community/present';
import { canManageCourse, canViewCourseForRequest } from './policies/access';

export function registerCourseVideoCommentRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/tracking/videos/:videoId/comments',
    { schema: { tags: ['tracking'], summary: 'List comments on a lecture video' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { videoId: string };
      if (!validateId(params.videoId, reply, 'videoId')) return;

      const video = await prisma.courseVideo.findFirst({
        where: { id: params.videoId, section: { course: { deletedAt: null } } },
        select: { id: true, section: { select: { courseId: true } } },
      });
      if (!video) {
        reply.code(404).send(Errors.notFound('Video not found'));
        return;
      }

      const apiBaseUrl = requestBaseUrl(request);
      const courseId = video.section.courseId;
      if (!(await canViewCourseForRequest(store, apiBaseUrl, auth, courseId))) {
        reply.code(403).send(Errors.forbidden());
        return;
      }

      const isManager = canManageCourse(auth, courseId);
      const rows = await prisma.courseVideoComment.findMany({
        where: {
          videoId: params.videoId,
          ...(isManager ? {} : { moderationStatus: CommunityModerationStatus.visible }),
        },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: authorSelect } },
      });

      const reputationByUserId = await loadReputationTotals(
        prisma,
        rows.map((r) => r.authorId)
      );

      const comments = rows.map((row) =>
        CourseVideoCommentSchema.parse({
          id: row.id,
          videoId: row.videoId,
          body: row.body,
          author: CommunityAuthorSchema.parse(presentAuthor(row.author, reputationByUserId)),
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })
      );

      return CourseVideoCommentsResponseSchema.parse({ comments });
    }
  );

  app.post(
    '/v1/tracking/videos/:videoId/comments',
    { schema: { tags: ['tracking'], summary: 'Post a comment on a lecture video' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { videoId: string };
      if (!validateId(params.videoId, reply, 'videoId')) return;

      const body = CreateCourseVideoCommentRequestSchema.parse(request.body ?? {});

      const video = await prisma.courseVideo.findFirst({
        where: { id: params.videoId, section: { course: { deletedAt: null } } },
        select: { id: true, section: { select: { courseId: true } } },
      });
      if (!video) {
        reply.code(404).send(Errors.notFound('Video not found'));
        return;
      }

      const apiBaseUrl = requestBaseUrl(request);
      const courseId = video.section.courseId;
      if (!(await canViewCourseForRequest(store, apiBaseUrl, auth, courseId))) {
        reply.code(403).send(Errors.forbidden());
        return;
      }

      const row = await prisma.courseVideoComment.create({
        data: {
          videoId: params.videoId,
          authorId: auth.user.id,
          body: body.body.trim(),
        },
        include: { author: { select: authorSelect } },
      });

      const reputationByUserId = await loadReputationTotals(prisma, [row.authorId]);

      return CourseVideoCommentSchema.parse({
        id: row.id,
        videoId: row.videoId,
        body: row.body,
        author: CommunityAuthorSchema.parse(presentAuthor(row.author, reputationByUserId)),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      });
    }
  );

  app.delete(
    '/v1/tracking/videos/:videoId/comments/:commentId',
    { schema: { tags: ['tracking'], summary: 'Delete a lecture video comment' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { videoId: string; commentId: string };
      if (!validateId(params.videoId, reply, 'videoId')) return;
      if (!validateId(params.commentId, reply, 'commentId')) return;

      const comment = await prisma.courseVideoComment.findFirst({
        where: { id: params.commentId, videoId: params.videoId },
        include: {
          video: { select: { section: { select: { courseId: true } } } },
        },
      });
      if (!comment) {
        reply.code(404).send(Errors.notFound('Comment not found'));
        return;
      }

      const courseId = comment.video.section.courseId;
      const isAuthor = comment.authorId === auth.user.id;
      const isManager = canManageCourse(auth, courseId);
      if (!isAuthor && !isManager) {
        reply.code(403).send(Errors.forbidden());
        return;
      }

      await prisma.courseVideoComment.delete({ where: { id: params.commentId } });
      return { ok: true };
    }
  );
}
