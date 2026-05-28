import { FastifyInstance } from 'fastify';
import {
  CommunityModerationStatus,
  CommunityReportStatus,
  CommunityReportTargetType,
  PrismaClient,
} from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { requestBaseUrl } from '../../lib/request-base-url';
import { AppStore } from '../../store';
import { canManageCourse } from '../tracking/policies/access';
import { authorSelect, loadReputationTotals, presentAuthor, presentThread } from './present';
import {
  findPendingReport,
  setTargetModerationStatus,
  targetExists,
  visibleContentFilter,
} from './moderation';

export function registerCommunityV2Routes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  // ── Reports / moderation queue ───────────────────────────────────────────

  app.post(
    '/v1/community/reports',
    { schema: { tags: ['community'], summary: 'Report community content' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as {
        targetType?: string;
        targetId?: string;
        reason?: string;
        details?: string;
      };
      if (!body.targetType || !body.targetId || !body.reason?.trim()) {
        reply.code(400).send(Errors.validation('targetType, targetId, and reason are required.'));
        return;
      }
      const validTypes = Object.values(CommunityReportTargetType);
      if (!validTypes.includes(body.targetType as CommunityReportTargetType)) {
        reply.code(400).send(Errors.validation('Invalid targetType.'));
        return;
      }
      const targetType = body.targetType as CommunityReportTargetType;
      if (!(await targetExists(prisma, targetType, body.targetId))) {
        reply.code(404).send(Errors.notFound('Content'));
        return;
      }
      const existing = await findPendingReport(prisma, auth.user.id, targetType, body.targetId);
      if (existing) {
        reply.code(409).send(Errors.validation('You already have a pending report for this content.'));
        return;
      }
      const report = await prisma.communityReport.create({
        data: {
          reporterId: auth.user.id,
          targetType,
          targetId: body.targetId,
          reason: body.reason.trim(),
          details: body.details?.trim() || undefined,
        },
      });
      reply.code(201);
      return { report: { ...report, _id: report.id } };
    }
  );

  app.get(
    '/v1/community/reports',
    { schema: { tags: ['community'], summary: 'List community reports (admin)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      if (auth.user.systemRole !== 'admin') {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const query = request.query as { status?: string; page?: string; limit?: string };
      const status: CommunityReportStatus =
        query.status === 'dismissed'
          ? CommunityReportStatus.dismissed
          : query.status === 'actioned'
            ? CommunityReportStatus.actioned
            : CommunityReportStatus.pending;
      const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '30', 10) || 30));
      const skip = (page - 1) * limit;
      const where = { status };
      const [reports, total] = await Promise.all([
        prisma.communityReport.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            reporter: { select: authorSelect },
          },
        }),
        prisma.communityReport.count({ where }),
      ]);
      return {
        reports: reports.map((r) => ({
          ...r,
          _id: r.id,
          reporter: presentAuthor(r.reporter),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }
  );

  app.patch(
    '/v1/community/reports/:reportId',
    { schema: { tags: ['community'], summary: 'Review a community report (admin)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      if (auth.user.systemRole !== 'admin') {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const { reportId } = request.params as { reportId: string };
      const body = request.body as { action?: string };
      const action = body.action?.trim();
      if (!action || !['dismiss', 'hide', 'remove'].includes(action)) {
        reply.code(400).send(Errors.validation('action must be dismiss, hide, or remove.'));
        return;
      }
      const report = await prisma.communityReport.findUnique({ where: { id: reportId } });
      if (!report) {
        reply.code(404).send(Errors.notFound('Report'));
        return;
      }
      if (report.status !== CommunityReportStatus.pending) {
        reply.code(400).send(Errors.validation('Report has already been reviewed.'));
        return;
      }
      const now = new Date();
      if (action === 'dismiss') {
        await prisma.communityReport.update({
          where: { id: reportId },
          data: {
            status: CommunityReportStatus.dismissed,
            resolution: 'dismiss',
            reviewedById: auth.user.id,
            reviewedAt: now,
          },
        });
      } else {
        const status =
          action === 'hide'
            ? CommunityModerationStatus.hidden
            : CommunityModerationStatus.removed;
        await setTargetModerationStatus(prisma, report.targetType, report.targetId, status);
        await prisma.communityReport.update({
          where: { id: reportId },
          data: {
            status: CommunityReportStatus.actioned,
            resolution: action,
            reviewedById: auth.user.id,
            reviewedAt: now,
          },
        });
        if (report.reporterId !== auth.user.id) {
          void store.createNotification(requestBaseUrl(request), report.reporterId, {
            type: 'community_moderation',
            title: 'Report reviewed',
            body: `Your report was reviewed and action was taken (${action}).`,
            link: '/community',
          });
        }
      }
      return { reviewed: true, action };
    }
  );

  // ── Question bookmarks ───────────────────────────────────────────────────

  app.get(
    '/v1/community/bookmarks',
    { schema: { tags: ['community'], summary: 'List bookmarked question ids' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const rows = await prisma.communityQuestionBookmark.findMany({
        where: { userId: auth.user.id },
        select: { questionId: true },
        orderBy: { createdAt: 'desc' },
      });
      return { questionIds: rows.map((r) => r.questionId) };
    }
  );

  app.post(
    '/v1/community/questions/:questionId/bookmark',
    { schema: { tags: ['community'], summary: 'Bookmark a question' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { questionId } = request.params as { questionId: string };
      const question = await prisma.communityQuestion.findFirst({
        where: {
          id: questionId,
          moderationStatus: CommunityModerationStatus.visible,
        },
      });
      if (!question) {
        reply.code(404).send(Errors.notFound('Question'));
        return;
      }
      await prisma.communityQuestionBookmark.upsert({
        where: { userId_questionId: { userId: auth.user.id, questionId } },
        create: { userId: auth.user.id, questionId },
        update: {},
      });
      return { bookmarked: true };
    }
  );

  app.delete(
    '/v1/community/questions/:questionId/bookmark',
    { schema: { tags: ['community'], summary: 'Remove question bookmark' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { questionId } = request.params as { questionId: string };
      await prisma.communityQuestionBookmark.deleteMany({
        where: { userId: auth.user.id, questionId },
      });
      return { bookmarked: false };
    }
  );

  // ── Global thread feed ───────────────────────────────────────────────────

  app.get(
    '/v1/community/threads/me',
    { schema: { tags: ['community'], summary: 'List threads across enrolled courses' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const query = request.query as { q?: string; page?: string; limit?: string };
      const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '30', 10) || 30));
      const skip = (page - 1) * limit;
      const courseIds = [
        ...new Set(
          auth.memberships
            .filter((m) => ['student', 'instructor', 'ta'].includes(m.role))
            .map((m) => m.courseId)
        ),
      ];
      if (courseIds.length === 0) {
        return { items: [], total: 0, page, limit };
      }
      const where: Record<string, unknown> = {
        courseId: { in: courseIds },
        ...visibleContentFilter(auth, false),
      };
      if (query.q) {
        where.OR = [
          { title: { contains: query.q, mode: 'insensitive' } },
          { body: { contains: query.q, mode: 'insensitive' } },
        ];
      }
      const [threads, total] = await Promise.all([
        prisma.communityThread.findMany({
          where,
          orderBy: [{ pinned: 'desc' }, { lastActivityAt: 'desc' }],
          skip,
          take: limit,
          include: { author: { select: authorSelect } },
        }),
        prisma.communityThread.count({ where }),
      ]);
      const reputationByUserId = await loadReputationTotals(
        prisma,
        threads.map((t) => t.author.id)
      );
      return {
        items: threads.map((t) => presentThread(t, reputationByUserId)),
        total,
        page,
        limit,
      };
    }
  );

  // ── Edit / soft-delete ───────────────────────────────────────────────────

  app.patch(
    '/v1/community/questions/:questionId',
    { schema: { tags: ['community'], summary: 'Edit a community question' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { questionId } = request.params as { questionId: string };
      const body = request.body as { title?: string; body?: string; tags?: string[] };
      const question = await prisma.communityQuestion.findUnique({ where: { id: questionId } });
      if (!question || question.moderationStatus !== CommunityModerationStatus.visible) {
        reply.code(404).send(Errors.notFound('Question'));
        return;
      }
      if (question.authorId !== auth.user.id && auth.user.systemRole !== 'admin') {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const data: Record<string, unknown> = { updatedAt: new Date() };
      if (body.title?.trim()) data.title = body.title.trim();
      if (body.body?.trim()) data.body = body.body.trim();
      if (body.tags) data.tags = body.tags;
      const updated = await prisma.communityQuestion.update({
        where: { id: questionId },
        data,
        include: { author: { select: authorSelect } },
      });
      return { question: { ...updated, _id: updated.id } };
    }
  );

  app.delete(
    '/v1/community/questions/:questionId',
    { schema: { tags: ['community'], summary: 'Remove a community question' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { questionId } = request.params as { questionId: string };
      const question = await prisma.communityQuestion.findUnique({ where: { id: questionId } });
      if (!question) {
        reply.code(404).send(Errors.notFound('Question'));
        return;
      }
      if (question.authorId !== auth.user.id && auth.user.systemRole !== 'admin') {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      await prisma.communityQuestion.update({
        where: { id: questionId },
        data: { moderationStatus: CommunityModerationStatus.removed },
      });
      return { deleted: true };
    }
  );

  app.patch(
    '/v1/community/answers/:answerId',
    { schema: { tags: ['community'], summary: 'Edit an answer' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { answerId } = request.params as { answerId: string };
      const body = request.body as { body?: string };
      if (!body.body?.trim()) {
        reply.code(400).send(Errors.validation('body is required.'));
        return;
      }
      const answer = await prisma.communityAnswer.findUnique({ where: { id: answerId } });
      if (!answer || answer.moderationStatus !== CommunityModerationStatus.visible) {
        reply.code(404).send(Errors.notFound('Answer'));
        return;
      }
      if (answer.authorId !== auth.user.id && auth.user.systemRole !== 'admin') {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const updated = await prisma.communityAnswer.update({
        where: { id: answerId },
        data: { body: body.body.trim(), updatedAt: new Date() },
        include: { author: { select: authorSelect } },
      });
      return { answer: { ...updated, _id: updated.id } };
    }
  );

  app.delete(
    '/v1/community/answers/:answerId',
    { schema: { tags: ['community'], summary: 'Remove an answer' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { answerId } = request.params as { answerId: string };
      const answer = await prisma.communityAnswer.findUnique({ where: { id: answerId } });
      if (!answer) {
        reply.code(404).send(Errors.notFound('Answer'));
        return;
      }
      if (answer.authorId !== auth.user.id && auth.user.systemRole !== 'admin') {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      await prisma.communityAnswer.update({
        where: { id: answerId },
        data: { moderationStatus: CommunityModerationStatus.removed },
      });
      return { deleted: true };
    }
  );

  app.patch(
    '/v1/community/posts/:postId',
    { schema: { tags: ['community'], summary: 'Edit a discussion post' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { postId } = request.params as { postId: string };
      const body = request.body as { body?: string };
      if (!body.body?.trim()) {
        reply.code(400).send(Errors.validation('body is required.'));
        return;
      }
      const post = await prisma.communityPost.findUnique({
        where: { id: postId },
        include: { thread: true },
      });
      if (!post || post.moderationStatus !== CommunityModerationStatus.visible) {
        reply.code(404).send(Errors.notFound('Post'));
        return;
      }
      const canEdit =
        post.authorId === auth.user.id ||
        auth.user.systemRole === 'admin' ||
        canManageCourse(auth, post.thread.courseId);
      if (!canEdit) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const updated = await prisma.communityPost.update({
        where: { id: postId },
        data: { body: body.body.trim(), updatedAt: new Date() },
        include: { author: { select: authorSelect } },
      });
      return { post: { ...updated, _id: updated.id } };
    }
  );

  app.delete(
    '/v1/community/posts/:postId',
    { schema: { tags: ['community'], summary: 'Remove a discussion post' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { postId } = request.params as { postId: string };
      const post = await prisma.communityPost.findUnique({
        where: { id: postId },
        include: { thread: true },
      });
      if (!post) {
        reply.code(404).send(Errors.notFound('Post'));
        return;
      }
      const canDelete =
        post.authorId === auth.user.id ||
        auth.user.systemRole === 'admin' ||
        canManageCourse(auth, post.thread.courseId);
      if (!canDelete) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      await prisma.communityPost.update({
        where: { id: postId },
        data: { moderationStatus: CommunityModerationStatus.removed },
      });
      return { deleted: true };
    }
  );

  app.patch(
    '/v1/community/threads/:threadId/content',
    { schema: { tags: ['community'], summary: 'Edit a discussion thread' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { threadId } = request.params as { threadId: string };
      const body = request.body as { title?: string; body?: string; tags?: string[] };
      const thread = await prisma.communityThread.findUnique({ where: { id: threadId } });
      if (!thread || thread.moderationStatus !== CommunityModerationStatus.visible) {
        reply.code(404).send(Errors.notFound('Thread'));
        return;
      }
      const canEdit =
        thread.authorId === auth.user.id ||
        auth.user.systemRole === 'admin' ||
        canManageCourse(auth, thread.courseId);
      if (!canEdit) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const data: Record<string, unknown> = { updatedAt: new Date() };
      if (body.title?.trim()) data.title = body.title.trim();
      if (body.body !== undefined) data.body = body.body.trim();
      if (body.tags) data.tags = body.tags;
      const updated = await prisma.communityThread.update({
        where: { id: threadId },
        data,
        include: { author: { select: authorSelect } },
      });
      const reputationByUserId = await loadReputationTotals(prisma, [updated.author.id]);
      return presentThread(updated, reputationByUserId);
    }
  );
}
