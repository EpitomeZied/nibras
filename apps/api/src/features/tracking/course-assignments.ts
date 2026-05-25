import { FastifyInstance } from 'fastify';
import {
  AssignmentDisplayStatus,
  AssignmentSubmissionResponseSchema,
  AssignmentSubmissionsListSchema,
  CourseAssignmentDetailSchema,
  CourseAssignmentSchema,
  CreateCourseAssignmentRequestSchema,
  GradeAssignmentRequestSchema,
  SubmitAssignmentRequestSchema,
  UpdateCourseAssignmentRequestSchema,
} from '@nibras/contracts';
import { AssignmentSubmissionStatus, PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { requestBaseUrl } from '../../lib/request-base-url';
import { validateId } from '../../lib/validate';
import { AppStore } from '../../store';
import { canManageCourse, canViewCourseForRequest } from './policies/access';

type ResourceLink = { title: string; url: string };

function computeDisplayStatus(
  submission: { status: AssignmentSubmissionStatus; submittedAt: Date | null } | null,
  dueAt: Date | null,
  now = new Date()
): AssignmentDisplayStatus {
  if (!submission || submission.status === 'draft') {
    if (dueAt && dueAt < now) return 'late';
    return 'not_started';
  }
  if (submission.status === 'graded') return 'graded';
  if (submission.status === 'submitted') {
    if (dueAt && submission.submittedAt && submission.submittedAt > dueAt) return 'late';
    return 'submitted';
  }
  if (dueAt && dueAt < now) return 'late';
  return 'in_progress';
}

function presentAssignment(
  row: {
    id: string;
    courseId: string;
    title: string;
    description: string;
    content: string;
    dueAt: Date | null;
    pointsPossible: number;
    sortOrder: number;
    published: boolean;
  },
  submission?: {
    status: AssignmentSubmissionStatus;
    score: number | null;
    feedback: string | null;
    submittedAt: Date | null;
    content: string;
    resourcesJson: unknown;
  } | null,
  includeDetail = false
) {
  const status = computeDisplayStatus(submission ?? null, row.dueAt);
  const base = {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    description: row.description || undefined,
    content: includeDetail ? row.content : undefined,
    dueAt: row.dueAt?.toISOString() ?? null,
    pointsPossible: row.pointsPossible,
    sortOrder: row.sortOrder,
    published: row.published,
    status,
    score: submission?.score ?? undefined,
    feedback: includeDetail ? (submission?.feedback ?? undefined) : undefined,
  };
  if (includeDetail) {
    const resources = Array.isArray(submission?.resourcesJson)
      ? (submission!.resourcesJson as ResourceLink[])
      : [];
    return CourseAssignmentDetailSchema.parse({
      ...base,
      resources,
    });
  }
  return CourseAssignmentSchema.parse(base);
}

async function assertCourseExists(prisma: PrismaClient, courseId: string) {
  return prisma.course.findFirst({ where: { id: courseId, deletedAt: null }, select: { id: true } });
}

export function registerCourseAssignmentRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/tracking/courses/:courseId/assignments',
    { schema: { tags: ['tracking'], summary: 'List course assignments' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      const apiBaseUrl = requestBaseUrl(request);
      if (!(await canViewCourseForRequest(store, apiBaseUrl, auth, params.courseId))) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const isManager = canManageCourse(auth, params.courseId);
      const rows = await prisma.courseAssignment.findMany({
        where: {
          courseId: params.courseId,
          ...(isManager ? {} : { published: true }),
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      const submissionByAssignment = new Map<
        string,
        {
          status: AssignmentSubmissionStatus;
          score: number | null;
          feedback: string | null;
          submittedAt: Date | null;
          content: string;
          resourcesJson: unknown;
        }
      >();
      if (rows.length > 0) {
        const subs = await prisma.assignmentSubmission.findMany({
          where: {
            userId: auth.user.id,
            assignmentId: { in: rows.map((r) => r.id) },
          },
        });
        for (const sub of subs) {
          submissionByAssignment.set(sub.assignmentId, sub);
        }
      }
      return rows.map((row) => presentAssignment(row, submissionByAssignment.get(row.id) ?? null));
    }
  );

  app.post(
    '/v1/tracking/courses/:courseId/assignments',
    { schema: { tags: ['tracking'], summary: 'Create assignment (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const body = CreateCourseAssignmentRequestSchema.parse(request.body ?? {});
      if (!(await assertCourseExists(prisma, params.courseId))) {
        reply.code(404).send(Errors.notFound('Course'));
        return;
      }
      let sortOrder = body.sortOrder;
      if (sortOrder === undefined) {
        const max = await prisma.courseAssignment.aggregate({
          where: { courseId: params.courseId },
          _max: { sortOrder: true },
        });
        sortOrder = (max._max.sortOrder ?? -1) + 1;
      }
      const row = await prisma.courseAssignment.create({
        data: {
          courseId: params.courseId,
          title: body.title,
          description: body.description ?? '',
          content: body.content ?? '',
          dueAt: body.dueAt ? new Date(body.dueAt) : null,
          pointsPossible: body.pointsPossible ?? 100,
          sortOrder,
          published: body.published ?? true,
        },
      });
      reply.code(201);
      return presentAssignment(row, null);
    }
  );

  app.patch(
    '/v1/tracking/courses/:courseId/assignments/:assignmentId',
    { schema: { tags: ['tracking'], summary: 'Update assignment (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string; assignmentId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!validateId(params.assignmentId, reply, 'assignmentId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const body = UpdateCourseAssignmentRequestSchema.parse(request.body ?? {});
      const existing = await prisma.courseAssignment.findFirst({
        where: { id: params.assignmentId, courseId: params.courseId },
      });
      if (!existing) {
        reply.code(404).send(Errors.notFound('Assignment'));
        return;
      }
      const row = await prisma.courseAssignment.update({
        where: { id: params.assignmentId },
        data: {
          title: body.title,
          description: body.description,
          content: body.content,
          dueAt: body.dueAt === null ? null : body.dueAt ? new Date(body.dueAt) : undefined,
          pointsPossible: body.pointsPossible,
          sortOrder: body.sortOrder,
          published: body.published,
        },
      });
      return presentAssignment(row, null);
    }
  );

  app.delete(
    '/v1/tracking/courses/:courseId/assignments/:assignmentId',
    { schema: { tags: ['tracking'], summary: 'Delete assignment (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string; assignmentId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!validateId(params.assignmentId, reply, 'assignmentId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const existing = await prisma.courseAssignment.findFirst({
        where: { id: params.assignmentId, courseId: params.courseId },
      });
      if (!existing) {
        reply.code(404).send(Errors.notFound('Assignment'));
        return;
      }
      await prisma.courseAssignment.delete({ where: { id: params.assignmentId } });
      return { ok: true };
    }
  );

  app.get(
    '/v1/tracking/assignments/:assignmentId',
    { schema: { tags: ['tracking'], summary: 'Get assignment detail' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { assignmentId: string };
      if (!validateId(params.assignmentId, reply, 'assignmentId')) return;
      const row = await prisma.courseAssignment.findUnique({
        where: { id: params.assignmentId },
      });
      if (!row) {
        reply.code(404).send(Errors.notFound('Assignment'));
        return;
      }
      const apiBaseUrl = requestBaseUrl(request);
      if (!(await canViewCourseForRequest(store, apiBaseUrl, auth, row.courseId))) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      if (!row.published && !canManageCourse(auth, row.courseId)) {
        reply.code(404).send(Errors.notFound('Assignment'));
        return;
      }
      const submission = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_userId: {
            assignmentId: params.assignmentId,
            userId: auth.user.id,
          },
        },
      });
      return presentAssignment(row, submission, true);
    }
  );

  app.get(
    '/v1/tracking/assignments/:assignmentId/submissions',
    { schema: { tags: ['tracking'], summary: 'List assignment submissions (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { assignmentId: string };
      if (!validateId(params.assignmentId, reply, 'assignmentId')) return;
      const row = await prisma.courseAssignment.findUnique({
        where: { id: params.assignmentId },
      });
      if (!row) {
        reply.code(404).send(Errors.notFound('Assignment'));
        return;
      }
      if (!canManageCourse(auth, row.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const subs = await prisma.assignmentSubmission.findMany({
        where: {
          assignmentId: params.assignmentId,
          status: { in: ['submitted', 'graded'] },
        },
        include: {
          user: { select: { id: true, username: true } },
        },
        orderBy: { submittedAt: 'desc' },
      });
      const items = subs.map((sub) => ({
        id: sub.id,
        userId: sub.userId,
        username: sub.user.username ?? undefined,
        submittedAt: sub.submittedAt?.toISOString() ?? null,
        status: computeDisplayStatus(sub, row.dueAt),
        score: sub.score ?? undefined,
        contentPreview: sub.content.slice(0, 200),
      }));
      return AssignmentSubmissionsListSchema.parse({ items });
    }
  );

  app.post(
    '/v1/tracking/assignments/:assignmentId/submit',
    { schema: { tags: ['tracking'], summary: 'Submit assignment' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { assignmentId: string };
      if (!validateId(params.assignmentId, reply, 'assignmentId')) return;
      const body = SubmitAssignmentRequestSchema.parse(request.body ?? {});
      const row = await prisma.courseAssignment.findUnique({
        where: { id: params.assignmentId },
      });
      if (!row || !row.published) {
        reply.code(404).send(Errors.notFound('Assignment'));
        return;
      }
      const apiBaseUrl = requestBaseUrl(request);
      if (!(await canViewCourseForRequest(store, apiBaseUrl, auth, row.courseId))) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const now = new Date();
      const record = await prisma.assignmentSubmission.upsert({
        where: {
          assignmentId_userId: {
            assignmentId: params.assignmentId,
            userId: auth.user.id,
          },
        },
        create: {
          assignmentId: params.assignmentId,
          userId: auth.user.id,
          content: body.content,
          resourcesJson: body.resources ?? [],
          status: 'submitted',
          submittedAt: now,
        },
        update: {
          content: body.content,
          resourcesJson: body.resources ?? [],
          status: 'submitted',
          submittedAt: now,
        },
      });
      const status = computeDisplayStatus(record, row.dueAt);
      return AssignmentSubmissionResponseSchema.parse({
        id: record.id,
        assignmentId: record.assignmentId,
        submittedAt: record.submittedAt!.toISOString(),
        status,
        score: record.score ?? undefined,
        feedback: record.feedback ?? undefined,
      });
    }
  );

  app.post(
    '/v1/tracking/assignments/:assignmentId/grade',
    { schema: { tags: ['tracking'], summary: 'Grade assignment (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { assignmentId: string };
      if (!validateId(params.assignmentId, reply, 'assignmentId')) return;
      const body = GradeAssignmentRequestSchema.parse(request.body ?? {});
      const row = await prisma.courseAssignment.findUnique({
        where: { id: params.assignmentId },
      });
      if (!row) {
        reply.code(404).send(Errors.notFound('Assignment'));
        return;
      }
      if (!canManageCourse(auth, row.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const existing = await prisma.assignmentSubmission.findUnique({
        where: {
          assignmentId_userId: {
            assignmentId: params.assignmentId,
            userId: body.userId,
          },
        },
      });
      if (!existing || existing.status === 'draft') {
        reply.code(404).send(Errors.notFound('Submission'));
        return;
      }
      const record = await prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: {
          status: 'graded',
          score: body.score,
          feedback: body.feedback ?? null,
        },
      });
      const status = computeDisplayStatus(record, row.dueAt);
      return AssignmentSubmissionResponseSchema.parse({
        id: record.id,
        assignmentId: record.assignmentId,
        submittedAt: (record.submittedAt ?? record.updatedAt).toISOString(),
        status,
        score: record.score ?? undefined,
        feedback: record.feedback ?? undefined,
      });
    }
  );
}
