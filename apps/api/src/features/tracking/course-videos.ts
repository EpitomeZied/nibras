import { FastifyInstance } from 'fastify';
import { PrismaClient, VideoProvider } from '@prisma/client';
import {
  CourseSectionSchema,
  CourseSectionsResponseSchema,
  CourseVideoSchema,
  CreateCourseSectionRequestSchema,
  CreateCourseVideoRequestSchema,
  UpdateCourseSectionRequestSchema,
  UpdateCourseVideoRequestSchema,
  VideoAnalyticsResponseSchema,
  VideoProgressRequestSchema,
  VideoProgressResponseSchema,
} from '@nibras/contracts';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { validateId } from '../../lib/validate';
import { AppStore } from '../../store';
import { requestBaseUrl } from '../../lib/request-base-url';
import { canManageCourse, canViewCourseForRequest } from './policies/access';

type VideoRow = {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  provider: VideoProvider;
  externalId: string | null;
  embedUrl: string | null;
  durationSeconds: number | null;
  sortOrder: number;
  requiresVideoId: string | null;
  linkedProjectId: string | null;
  linkedMilestoneId: string | null;
  section: { id: string; courseId: string; title: string };
  linkedProject?: { id: string; name: string } | null;
};

const YOUTUBE_ID_RE = /^[\w-]{11}$/;

/** Accept bare IDs or common YouTube URL shapes pasted into externalId. */
export function normalizeYouTubeExternalId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (YOUTUBE_ID_RE.test(raw)) return raw;

  try {
    const url = raw.includes('://') ? new URL(raw) : new URL(`https://${raw}`);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return id && YOUTUBE_ID_RE.test(id) ? id : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') {
        const v = url.searchParams.get('v');
        return v && YOUTUBE_ID_RE.test(v) ? v : null;
      }
      const pathId = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1];
      if (pathId) return pathId;
    }
  } catch {
    /* not a URL */
  }

  const fromQuery = raw.match(/(?:^|[?&])v=([\w-]{11})/)?.[1];
  return fromQuery && YOUTUBE_ID_RE.test(fromQuery) ? fromQuery : null;
}

/** Accept bare BV ids or Bilibili page URLs pasted into externalId. */
export function normalizeBilibiliExternalId(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  const fromUrl = raw.match(/(BV[0-9A-Za-z]+)/i);
  if (fromUrl) return fromUrl[1];
  return /^BV[0-9A-Za-z]+$/i.test(raw) ? raw : null;
}

function normalizeExternalId(
  provider: VideoProvider,
  externalId: string | null | undefined
): string | null {
  if (!externalId?.trim()) return null;
  if (provider === 'youtube') return normalizeYouTubeExternalId(externalId);
  if (provider === 'bilibili') return normalizeBilibiliExternalId(externalId);
  return externalId.trim();
}

export function resolvePlaybackUrl(video: {
  provider: VideoProvider;
  externalId: string | null;
  embedUrl: string | null;
}): string {
  if (video.provider === 'youtube') {
    for (const candidate of [video.externalId, video.embedUrl]) {
      if (!candidate?.trim()) continue;
      const id = normalizeYouTubeExternalId(candidate);
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
  }
  if (video.provider === 'bilibili') {
    for (const candidate of [video.externalId, video.embedUrl]) {
      if (!candidate?.trim()) continue;
      const bvid = normalizeBilibiliExternalId(candidate);
      if (bvid) {
        return `https://player.bilibili.com/player.html?bvid=${bvid}&high_quality=1`;
      }
    }
  }
  const embed = video.embedUrl?.trim() ?? '';
  if (embed) return embed;
  return '';
}

export function isVideoPlayable(video: {
  provider: VideoProvider;
  externalId: string | null;
  embedUrl: string | null;
}): boolean {
  return resolvePlaybackUrl(video).length > 0;
}

function resolveThumbnailUrl(video: {
  provider: VideoProvider;
  externalId: string | null;
}): string | undefined {
  if (video.provider === 'youtube' && video.externalId) {
    const id = normalizeYouTubeExternalId(video.externalId);
    if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return undefined;
}

function validateVideoPayload(body: {
  provider: VideoProvider;
  externalId?: string | null;
  embedUrl?: string | null;
}): string | null {
  if (body.provider === 'youtube' || body.provider === 'bilibili') {
    if (!body.externalId?.trim()) {
      return `${body.provider} requires externalId`;
    }
    if (!isVideoPlayable(body as { provider: VideoProvider; externalId: string | null; embedUrl: string | null })) {
      return `Invalid ${body.provider} video id or URL`;
    }
    return null;
  }
  if (!body.embedUrl?.trim()) {
    return `${body.provider} requires embedUrl`;
  }
  if (!isVideoPlayable(body as { provider: VideoProvider; externalId: string | null; embedUrl: string | null })) {
    return `${body.provider} requires a valid playback URL`;
  }
  return null;
}

function presentVideo(
  video: VideoRow,
  progress?: { watched: boolean; watchedProgress: number } | null,
  opts?: { locked?: boolean }
) {
  const playbackUrl = resolvePlaybackUrl(video);
  const playable = playbackUrl.length > 0;
  return CourseVideoSchema.parse({
    id: video.id,
    courseId: video.section.courseId,
    sectionId: video.section.id,
    sectionTitle: video.section.title,
    title: video.title,
    description: video.description ?? undefined,
    provider: video.provider,
    externalId: video.externalId,
    embedUrl: video.embedUrl,
    playbackUrl,
    playable,
    thumbnailUrl: resolveThumbnailUrl(video),
    durationSeconds: video.durationSeconds ?? 0,
    sortOrder: video.sortOrder,
    watched: progress?.watched,
    watchedProgress: progress?.watchedProgress,
    locked: opts?.locked ?? false,
    requiresVideoId: video.requiresVideoId,
    linkedProjectId: video.linkedProjectId,
    linkedMilestoneId: video.linkedMilestoneId,
    linkedProjectTitle: video.linkedProject?.name,
  });
}

async function loadSectionsWithVideos(
  prisma: PrismaClient,
  courseId: string,
  userId: string,
  isManager: boolean
) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: { sequentialVideos: true },
  });
  const sections = await prisma.courseSection.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: {
      videos: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        include: {
          section: { select: { id: true, courseId: true, title: true } },
          linkedProject: { select: { id: true, name: true } },
          progress: {
            where: { userId },
            take: 1,
          },
        },
      },
    },
  });

  const progressByVideoId = new Map<string, { watched: boolean; watchedProgress: number }>();
  for (const section of sections) {
    for (const video of section.videos) {
      const p = video.progress[0];
      if (p) progressByVideoId.set(video.id, p);
    }
  }

  return sections.map((section) =>
    CourseSectionSchema.parse({
      id: section.id,
      courseId: section.courseId,
      title: section.title,
      description: section.description,
      sortOrder: section.sortOrder,
      videos: section.videos.map((video) => {
        let locked = false;
        if (course?.sequentialVideos && !isManager && video.requiresVideoId) {
          const prereq = progressByVideoId.get(video.requiresVideoId);
          locked = !prereq?.watched;
        }
        return presentVideo(
          { ...video, section: video.section, linkedProject: video.linkedProject },
          video.progress[0] ?? null,
          { locked }
        );
      }),
    })
  );
}

async function assertCourseExists(prisma: PrismaClient, courseId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: { id: true },
  });
  return course;
}

export function registerCourseVideoRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  app.get(
    '/v1/tracking/courses/:courseId/sections',
    { schema: { tags: ['tracking'], summary: 'List course sections and lecture videos' } },
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
      const course = await assertCourseExists(prisma, params.courseId);
      if (!course) {
        reply.code(404).send(Errors.notFound('Course not found'));
        return;
      }
      const sections = await loadSectionsWithVideos(
        prisma,
        params.courseId,
        auth.user.id,
        canManageCourse(auth, params.courseId)
      );
      return CourseSectionsResponseSchema.parse({ sections });
    }
  );

  app.post(
    '/v1/tracking/courses/:courseId/sections',
    { schema: { tags: ['tracking'], summary: 'Create a course section (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const body = CreateCourseSectionRequestSchema.parse(request.body ?? {});
      const course = await assertCourseExists(prisma, params.courseId);
      if (!course) {
        reply.code(404).send(Errors.notFound('Course not found'));
        return;
      }
      let sortOrder = body.sortOrder;
      if (sortOrder === undefined) {
        const max = await prisma.courseSection.aggregate({
          where: { courseId: params.courseId },
          _max: { sortOrder: true },
        });
        sortOrder = (max._max.sortOrder ?? -1) + 1;
      }
      const section = await prisma.courseSection.create({
        data: {
          courseId: params.courseId,
          title: body.title,
          description: body.description,
          sortOrder,
        },
      });
      return CourseSectionSchema.parse({
        ...section,
        videos: [],
      });
    }
  );

  app.patch(
    '/v1/tracking/courses/:courseId/sections/:sectionId',
    { schema: { tags: ['tracking'], summary: 'Update a course section (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string; sectionId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!validateId(params.sectionId, reply, 'sectionId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const body = UpdateCourseSectionRequestSchema.parse(request.body ?? {});
      const existing = await prisma.courseSection.findFirst({
        where: { id: params.sectionId, courseId: params.courseId },
      });
      if (!existing) {
        reply.code(404).send(Errors.notFound('Section not found'));
        return;
      }
      const section = await prisma.courseSection.update({
        where: { id: params.sectionId },
        data: {
          title: body.title,
          description: body.description === null ? null : body.description,
          sortOrder: body.sortOrder,
        },
        include: { videos: { orderBy: { sortOrder: 'asc' } } },
      });
      return CourseSectionSchema.parse({
        id: section.id,
        courseId: section.courseId,
        title: section.title,
        description: section.description,
        sortOrder: section.sortOrder,
        videos: section.videos.map((v) =>
          presentVideo({
            ...v,
            section: { id: section.id, courseId: section.courseId, title: section.title },
          })
        ),
      });
    }
  );

  app.delete(
    '/v1/tracking/courses/:courseId/sections/:sectionId',
    { schema: { tags: ['tracking'], summary: 'Delete a course section (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string; sectionId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!validateId(params.sectionId, reply, 'sectionId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const existing = await prisma.courseSection.findFirst({
        where: { id: params.sectionId, courseId: params.courseId },
      });
      if (!existing) {
        reply.code(404).send(Errors.notFound('Section not found'));
        return;
      }
      await prisma.courseSection.delete({ where: { id: params.sectionId } });
      return { ok: true };
    }
  );

  app.post(
    '/v1/tracking/courses/:courseId/sections/:sectionId/videos',
    { schema: { tags: ['tracking'], summary: 'Add a lecture video (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string; sectionId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!validateId(params.sectionId, reply, 'sectionId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const body = CreateCourseVideoRequestSchema.parse(request.body ?? {});
      const normalizedExternalId = normalizeExternalId(body.provider, body.externalId);
      if (
        (body.provider === 'youtube' || body.provider === 'bilibili') &&
        body.externalId?.trim() &&
        !normalizedExternalId
      ) {
        reply.code(400).send(Errors.validation(`Invalid ${body.provider} video id or URL`));
        return;
      }
      const validationError = validateVideoPayload({
        ...body,
        externalId: normalizedExternalId,
      });
      if (validationError) {
        reply.code(400).send(Errors.validation(validationError));
        return;
      }
      const section = await prisma.courseSection.findFirst({
        where: { id: params.sectionId, courseId: params.courseId },
      });
      if (!section) {
        reply.code(404).send(Errors.notFound('Section not found'));
        return;
      }
      let sortOrder = body.sortOrder;
      if (sortOrder === undefined) {
        const max = await prisma.courseVideo.aggregate({
          where: { sectionId: params.sectionId },
          _max: { sortOrder: true },
        });
        sortOrder = (max._max.sortOrder ?? -1) + 1;
      }
      const video = await prisma.courseVideo.create({
        data: {
          sectionId: params.sectionId,
          title: body.title,
          description: body.description,
          provider: body.provider,
          externalId: normalizedExternalId,
          embedUrl: body.embedUrl?.trim() || null,
          durationSeconds: body.durationSeconds ?? null,
          sortOrder,
          requiresVideoId: body.requiresVideoId ?? null,
          linkedProjectId: body.linkedProjectId ?? null,
          linkedMilestoneId: body.linkedMilestoneId ?? null,
        },
        include: {
          section: { select: { id: true, courseId: true, title: true } },
          linkedProject: { select: { id: true, name: true } },
        },
      });
      return presentVideo(video);
    }
  );

  app.patch(
    '/v1/tracking/courses/:courseId/videos/:videoId',
    { schema: { tags: ['tracking'], summary: 'Update a lecture video (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string; videoId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!validateId(params.videoId, reply, 'videoId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const body = UpdateCourseVideoRequestSchema.parse(request.body ?? {});
      const existing = await prisma.courseVideo.findFirst({
        where: { id: params.videoId, section: { courseId: params.courseId } },
        include: { section: { select: { id: true, courseId: true, title: true } } },
      });
      if (!existing) {
        reply.code(404).send(Errors.notFound('Video not found'));
        return;
      }
      const mergedProvider = body.provider ?? existing.provider;
      const mergedExternalRaw =
        body.externalId !== undefined ? body.externalId : existing.externalId;
      const normalizedExternalId = normalizeExternalId(mergedProvider, mergedExternalRaw);
      if (
        (mergedProvider === 'youtube' || mergedProvider === 'bilibili') &&
        mergedExternalRaw?.trim() &&
        !normalizedExternalId
      ) {
        reply.code(400).send(Errors.validation(`Invalid ${mergedProvider} video id or URL`));
        return;
      }
      const merged = {
        provider: mergedProvider,
        externalId: normalizedExternalId,
        embedUrl: body.embedUrl !== undefined ? body.embedUrl : existing.embedUrl,
      };
      const validationError = validateVideoPayload(merged);
      if (validationError) {
        reply.code(400).send(Errors.validation(validationError));
        return;
      }
      if (body.sectionId && body.sectionId !== existing.sectionId) {
        const target = await prisma.courseSection.findFirst({
          where: { id: body.sectionId, courseId: params.courseId },
        });
        if (!target) {
          reply.code(404).send(Errors.notFound('Target section not found'));
          return;
        }
      }
      const video = await prisma.courseVideo.update({
        where: { id: params.videoId },
        data: {
          sectionId: body.sectionId,
          title: body.title,
          description: body.description === null ? null : body.description,
          provider: body.provider,
          externalId:
            body.externalId !== undefined ? normalizedExternalId : undefined,
          embedUrl: body.embedUrl !== undefined ? body.embedUrl?.trim() || null : undefined,
          durationSeconds:
            body.durationSeconds === null ? null : body.durationSeconds ?? undefined,
          sortOrder: body.sortOrder,
          requiresVideoId:
            body.requiresVideoId !== undefined ? body.requiresVideoId : undefined,
          linkedProjectId:
            body.linkedProjectId !== undefined ? body.linkedProjectId : undefined,
          linkedMilestoneId:
            body.linkedMilestoneId !== undefined ? body.linkedMilestoneId : undefined,
        },
        include: {
          section: { select: { id: true, courseId: true, title: true } },
          linkedProject: { select: { id: true, name: true } },
        },
      });
      return presentVideo(video);
    }
  );

  app.get(
    '/v1/tracking/courses/:courseId/videos/analytics',
    { schema: { tags: ['tracking'], summary: 'Video completion analytics (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const enrolledCount = await prisma.courseMembership.count({
        where: { courseId: params.courseId, role: 'student' },
      });
      const videos = await prisma.courseVideo.findMany({
        where: { section: { courseId: params.courseId } },
        include: { section: { select: { title: true } }, progress: true },
        orderBy: { sortOrder: 'asc' },
      });
      const items = videos.map((v) => {
        const watched = v.progress.filter((p) => p.watched);
        const avg =
          v.progress.length > 0
            ? v.progress.reduce((s, p) => s + p.watchedProgress, 0) / v.progress.length
            : 0;
        return {
          videoId: v.id,
          title: v.title,
          sectionTitle: v.section.title,
          enrolledCount,
          watchedCount: watched.length,
          avgWatchedProgress: avg,
        };
      });
      return VideoAnalyticsResponseSchema.parse({ videos: items });
    }
  );

  app.delete(
    '/v1/tracking/courses/:courseId/videos/:videoId',
    { schema: { tags: ['tracking'], summary: 'Delete a lecture video (instructor)' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { courseId: string; videoId: string };
      if (!validateId(params.courseId, reply, 'courseId')) return;
      if (!validateId(params.videoId, reply, 'videoId')) return;
      if (!canManageCourse(auth, params.courseId)) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const existing = await prisma.courseVideo.findFirst({
        where: { id: params.videoId, section: { courseId: params.courseId } },
      });
      if (!existing) {
        reply.code(404).send(Errors.notFound('Video not found'));
        return;
      }
      await prisma.courseVideo.delete({ where: { id: params.videoId } });
      return { ok: true };
    }
  );

  app.post(
    '/v1/tracking/videos/:videoId/progress',
    { schema: { tags: ['tracking'], summary: 'Save lecture watch progress' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const params = request.params as { videoId: string };
      if (!validateId(params.videoId, reply, 'videoId')) return;
      const body = VideoProgressRequestSchema.parse(request.body ?? {});
      const video = await prisma.courseVideo.findUnique({
        where: { id: params.videoId },
        include: { section: { select: { courseId: true } } },
      });
      if (!video) {
        reply.code(404).send(Errors.notFound('Video not found'));
        return;
      }
      const apiBaseUrl = requestBaseUrl(request);
      if (!(await canViewCourseForRequest(store, apiBaseUrl, auth, video.section.courseId))) {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      const watched =
        body.watched ?? (body.watchedProgress !== undefined ? body.watchedProgress >= 1 : false);
      const watchedProgress = body.watchedProgress ?? (watched ? 1 : 0);
      const record = await prisma.videoProgress.upsert({
        where: {
          userId_videoId: { userId: auth.user.id, videoId: params.videoId },
        },
        create: {
          userId: auth.user.id,
          videoId: params.videoId,
          watched,
          watchedProgress,
        },
        update: {
          watched,
          watchedProgress,
        },
      });
      return VideoProgressResponseSchema.parse({
        watched: record.watched,
        watchedProgress: record.watchedProgress,
      });
    }
  );
}
