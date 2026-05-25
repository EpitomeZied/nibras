import { CourseRole, PrismaClient, SubmissionStatus, SystemRole } from '@prisma/client';
import type { AuthenticatedRequest } from '../../lib/auth';
import { apiError } from '../../lib/errors';

export type AnalyticsRangeParam = '7d' | '30d' | '90d' | 'term' | 'custom';

export type AnalyticsQuery = {
  range?: string;
  from?: string;
  to?: string;
  cohort?: string;
  risk?: string;
  courseId?: string;
};

export type ResolvedDateRange = {
  start: Date;
  end: Date;
  priorStart: Date;
  priorEnd: Date;
  dayCount: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DECIDED_STATUSES: SubmissionStatus[] = ['passed', 'failed', 'needs_review'];

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setUTCHours(23, 59, 59, 999);
  return out;
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function delta(current: number, prior: number): number {
  return current - prior;
}

function submissionTimestamp(row: { submittedAt: Date | null; createdAt: Date }): Date {
  return row.submittedAt ?? row.createdAt;
}

export async function resolveManagedCourseIds(
  auth: AuthenticatedRequest,
  prisma: PrismaClient
): Promise<string[]> {
  if (auth.user.systemRole === SystemRole.admin) {
    const courses = await prisma.course.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true },
    });
    return courses.map((c) => c.id);
  }
  return auth.memberships
    .filter((m) => m.role === 'instructor' || m.role === 'ta')
    .map((m) => m.courseId);
}

export async function resolveTermCourseIds(
  prisma: PrismaClient,
  managedCourseIds: string[]
): Promise<{ termLabel: string; courseIds: string[] }> {
  if (managedCourseIds.length === 0) {
    return { termLabel: '', courseIds: [] };
  }
  const courses = await prisma.course.findMany({
    where: { id: { in: managedCourseIds }, deletedAt: null },
    select: { id: true, termLabel: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
  const termLabel = courses[0]?.termLabel ?? '';
  const courseIds = courses.filter((c) => c.termLabel === termLabel).map((c) => c.id);
  return { termLabel, courseIds };
}

export async function resolveDateRange(
  query: AnalyticsQuery,
  scopedCourseIds: string[],
  prisma: PrismaClient
): Promise<{ range: ResolvedDateRange; courseIds: string[] } | { error: ReturnType<typeof apiError> }> {
  const end = endOfDay(new Date());
  let start: Date;
  let courseIds = scopedCourseIds;

  const range = (query.range ?? '30d') as AnalyticsRangeParam;

  if (range === 'custom') {
    if (!query.from || !query.to) {
      return { error: apiError('VALIDATION_ERROR', 'from and to are required for custom range.') };
    }
    start = startOfDay(new Date(query.from));
    const customEnd = endOfDay(new Date(query.to));
    if (Number.isNaN(start.getTime()) || Number.isNaN(customEnd.getTime()) || start > customEnd) {
      return { error: apiError('VALIDATION_ERROR', 'Invalid custom date range.') };
    }
    const dayCount = Math.max(1, Math.ceil((customEnd.getTime() - start.getTime()) / DAY_MS) + 1);
    const span = customEnd.getTime() - start.getTime();
    const priorEnd = new Date(start.getTime() - DAY_MS);
    const priorStart = new Date(priorEnd.getTime() - span);
    return {
      range: {
        start,
        end: customEnd,
        priorStart: startOfDay(priorStart),
        priorEnd: endOfDay(priorEnd),
        dayCount,
      },
      courseIds,
    };
  }

  if (range === 'term') {
    const termScope = await resolveTermCourseIds(prisma, scopedCourseIds);
    courseIds = termScope.courseIds;
    start = startOfDay(addDays(end, -89));
  } else {
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    start = startOfDay(addDays(end, -(days - 1)));
  }

  const dayCount =
    range === 'term'
      ? 90
      : range === '7d'
        ? 7
        : range === '90d'
          ? 90
          : 30;
  const span = end.getTime() - start.getTime();
  const priorEnd = endOfDay(addDays(start, -1));
  const priorStart = startOfDay(new Date(priorEnd.getTime() - span));

  return {
    range: { start, end, priorStart, priorEnd, dayCount },
    courseIds,
  };
}

function fillDailyCounts(
  dayCount: number,
  end: Date,
  buckets: Map<string, number>
): Array<{ date: string; value: number }> {
  const series: Array<{ date: string; value: number }> = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const key = toDateKey(addDays(end, -i));
    series.push({ date: key, value: buckets.get(key) ?? 0 });
  }
  return series;
}

async function loadScopedSubmissions(
  prisma: PrismaClient,
  courseIds: string[],
  start: Date,
  end: Date
) {
  if (courseIds.length === 0) return [];
  return prisma.submissionAttempt.findMany({
    where: {
      project: { courseId: { in: courseIds } },
      OR: [
        { submittedAt: { gte: start, lte: end } },
        { submittedAt: null, createdAt: { gte: start, lte: end } },
      ],
    },
    select: {
      id: true,
      userId: true,
      status: true,
      submittedAt: true,
      createdAt: true,
      milestoneId: true,
      project: { select: { id: true, name: true, courseId: true } },
      milestone: { select: { title: true } },
    },
  });
}

async function loadPriorSubmissions(
  prisma: PrismaClient,
  courseIds: string[],
  priorStart: Date,
  priorEnd: Date
) {
  if (courseIds.length === 0) return [];
  return prisma.submissionAttempt.findMany({
    where: {
      project: { courseId: { in: courseIds } },
      OR: [
        { submittedAt: { gte: priorStart, lte: priorEnd } },
        { submittedAt: null, createdAt: { gte: priorStart, lte: priorEnd } },
      ],
    },
    select: { id: true, userId: true, status: true },
  });
}

async function loadReviewScores(
  prisma: PrismaClient,
  courseIds: string[],
  start: Date,
  end: Date
): Promise<number[]> {
  if (courseIds.length === 0) return [];
  const reviews = await prisma.review.findMany({
    where: {
      score: { not: null },
      reviewedAt: { gte: start, lte: end },
      submissionAttempt: { project: { courseId: { in: courseIds } } },
    },
    select: { score: true },
  });
  return reviews.map((r) => r.score!).filter((s) => Number.isFinite(s));
}

async function countActiveStudents(
  prisma: PrismaClient,
  courseIds: string[],
  start: Date,
  end: Date
): Promise<number> {
  if (courseIds.length === 0) return 0;
  const [submissionUsers, videoUsers] = await Promise.all([
    prisma.submissionAttempt.findMany({
      where: {
        project: { courseId: { in: courseIds } },
        OR: [
          { submittedAt: { gte: start, lte: end } },
          { submittedAt: null, createdAt: { gte: start, lte: end } },
        ],
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.videoProgress.findMany({
      where: {
        updatedAt: { gte: start, lte: end },
        video: { section: { courseId: { in: courseIds } } },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);
  const active = new Set<string>();
  for (const row of submissionUsers) active.add(row.userId);
  for (const row of videoUsers) active.add(row.userId);
  const memberships = await prisma.courseMembership.findMany({
    where: { courseId: { in: courseIds }, role: CourseRole.student, userId: { in: [...active] } },
    select: { userId: true },
  });
  return new Set(memberships.map((m) => m.userId)).size;
}

function computePassRate(submissions: Array<{ status: SubmissionStatus }>): number {
  const decided = submissions.filter((s) => DECIDED_STATUSES.includes(s.status));
  if (decided.length === 0) return 0;
  const passed = decided.filter((s) => s.status === 'passed').length;
  return passed / decided.length;
}

export async function buildOverview(
  prisma: PrismaClient,
  courseIds: string[],
  range: ResolvedDateRange
) {
  const [submissions, priorSubmissions, reviewScores] = await Promise.all([
    loadScopedSubmissions(prisma, courseIds, range.start, range.end),
    loadPriorSubmissions(prisma, courseIds, range.priorStart, range.priorEnd),
    loadReviewScores(prisma, courseIds, range.start, range.end),
  ]);

  const weekStart = startOfDay(addDays(range.end, -6));
  const priorWeekStart = startOfDay(addDays(weekStart, -7));
  const priorWeekEnd = endOfDay(addDays(weekStart, -1));

  const submissionsThisWeek = submissions.filter(
    (s) => submissionTimestamp(s) >= weekStart && submissionTimestamp(s) <= range.end
  ).length;
  const priorWeekSubmissions = (
    await loadScopedSubmissions(prisma, courseIds, priorWeekStart, priorWeekEnd)
  ).length;

  const [activeStudents, priorActiveStudents] = await Promise.all([
    countActiveStudents(prisma, courseIds, range.start, range.end),
    countActiveStudents(prisma, courseIds, range.priorStart, range.priorEnd),
  ]);

  const passRate = computePassRate(submissions);
  const priorPassRate = computePassRate(priorSubmissions);

  const submissionBuckets = new Map<string, number>();
  const passBuckets = new Map<string, { passed: number; total: number }>();

  for (const sub of submissions) {
    const key = toDateKey(submissionTimestamp(sub));
    submissionBuckets.set(key, (submissionBuckets.get(key) ?? 0) + 1);
    if (DECIDED_STATUSES.includes(sub.status)) {
      const bucket = passBuckets.get(key) ?? { passed: 0, total: 0 };
      bucket.total += 1;
      if (sub.status === 'passed') bucket.passed += 1;
      passBuckets.set(key, bucket);
    }
  }

  const passRateSeries = fillDailyCounts(range.dayCount, range.end, new Map());
  const submissionsSeries = fillDailyCounts(range.dayCount, range.end, submissionBuckets);
  for (let i = 0; i < passRateSeries.length; i++) {
    const key = passRateSeries[i]!.date;
    const bucket = passBuckets.get(key);
    passRateSeries[i] = {
      date: key,
      value: bucket && bucket.total > 0 ? bucket.passed / bucket.total : 0,
    };
  }

  // Rising topics: milestone/project titles with delta (second half vs first half of range)
  const midpoint = new Date((range.start.getTime() + range.end.getTime()) / 2);
  const topicCounts = new Map<string, { first: number; second: number }>();
  for (const sub of submissions) {
    const label = sub.milestone?.title || sub.project.name;
    const ts = submissionTimestamp(sub);
    const entry = topicCounts.get(label) ?? { first: 0, second: 0 };
    if (ts < midpoint) entry.first += 1;
    else entry.second += 1;
    topicCounts.set(label, entry);
  }
  const topRisingTopics = [...topicCounts.entries()]
    .map(([topic, counts]) => ({ topic, delta: counts.second - counts.first }))
    .filter((t) => t.delta !== 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 8);

  const flaggedCohorts: Array<{ cohort: string; reason: string }> = [];
  if (courseIds.length > 0) {
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, courseCode: true, termLabel: true },
    });
    for (const course of courses) {
      const courseSubs = submissions.filter((s) => s.project.courseId === course.id);
      const rate = computePassRate(courseSubs);
      if (courseSubs.length >= 3 && rate < 0.5) {
        flaggedCohorts.push({
          cohort: `${course.courseCode} (${course.termLabel})`,
          reason: `Pass rate ${Math.round(rate * 100)}% in selected period`,
        });
      }
    }
  }

  const hasActivity =
    submissions.length > 0 ||
    activeStudents > 0 ||
    reviewScores.length > 0 ||
    topRisingTopics.length > 0;

  return {
    kpis: {
      activeStudents,
      activeStudentsDelta: delta(activeStudents, priorActiveStudents),
      submissionsThisWeek,
      submissionsDelta: delta(submissionsThisWeek, priorWeekSubmissions),
      passRate,
      passRateDelta: passRate - priorPassRate,
      medianGrade: median(reviewScores),
    },
    series: {
      submissions: submissionsSeries,
      passRate: passRateSeries,
    },
    topRisingTopics,
    flaggedCohorts: flaggedCohorts.slice(0, 8),
    meta: { hasActivity },
  };
}

export async function buildCourseSummaries(
  prisma: PrismaClient,
  courseIds: string[],
  range: ResolvedDateRange
) {
  if (courseIds.length === 0) return [];

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds }, deletedAt: null },
    select: { id: true, courseCode: true, title: true },
    orderBy: { courseCode: 'asc' },
  });

  const weekStart = startOfDay(addDays(range.end, -6));

  return Promise.all(
    courses.map(async (course) => {
      const enrolled = await prisma.courseMembership.count({
        where: { courseId: course.id, role: CourseRole.student },
      });

      const projects = await prisma.project.findMany({
        where: { courseId: course.id },
        include: { milestones: { select: { id: true } } },
      });
      const milestoneIds = projects.flatMap((p) => p.milestones.map((m) => m.id));
      const totalMilestones = milestoneIds.length;

      const submissions = await prisma.submissionAttempt.findMany({
        where: {
          project: { courseId: course.id },
          OR: [
            { submittedAt: { gte: range.start, lte: range.end } },
            { submittedAt: null, createdAt: { gte: range.start, lte: range.end } },
          ],
        },
        select: { userId: true, status: true, milestoneId: true },
      });

      const activeInWeek = await prisma.submissionAttempt.findMany({
        where: {
          project: { courseId: course.id },
          OR: [
            { submittedAt: { gte: weekStart, lte: range.end } },
            { submittedAt: null, createdAt: { gte: weekStart, lte: range.end } },
          ],
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      const videoActive = await prisma.videoProgress.findMany({
        where: {
          updatedAt: { gte: weekStart, lte: range.end },
          video: { section: { courseId: course.id } },
        },
        select: { userId: true },
        distinct: ['userId'],
      });
      const weeklyActive = new Set([
        ...activeInWeek.map((r) => r.userId),
        ...videoActive.map((r) => r.userId),
      ]).size;

      const passedPairs = await prisma.submissionAttempt.findMany({
        where: {
          project: { courseId: course.id },
          status: 'passed',
          milestoneId: { not: null },
        },
        select: { userId: true, milestoneId: true },
        distinct: ['userId', 'milestoneId'],
      });

      const students = await prisma.courseMembership.findMany({
        where: { courseId: course.id, role: CourseRole.student },
        select: { userId: true },
      });
      const studentCount = students.length;
      const totalPossible = studentCount * totalMilestones;
      const completionRate =
        totalPossible > 0 ? passedPairs.length / totalPossible : 0;

      const reviews = await prisma.review.findMany({
        where: {
          score: { not: null },
          reviewedAt: { gte: range.start, lte: range.end },
          submissionAttempt: { project: { courseId: course.id } },
        },
        select: { score: true },
      });
      const scores = reviews.map((r) => r.score!).filter(Number.isFinite);
      const averageGrade =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      return {
        courseId: course.id,
        code: course.courseCode,
        title: course.title,
        enrolled: studentCount,
        activeWeekly: weeklyActive,
        completionRate,
        averageGrade,
        passRate: computePassRate(submissions),
      };
    })
  );
}

function classifyRisk(passRate: number, daysSinceActivity: number): 'low' | 'medium' | 'high' {
  if (passRate < 0.4 || daysSinceActivity > 14) return 'high';
  if (passRate < 0.65 || daysSinceActivity > 7) return 'medium';
  return 'low';
}

export async function buildStudents(
  prisma: PrismaClient,
  courseIds: string[],
  range: ResolvedDateRange,
  filters: { cohort?: string; risk?: string }
) {
  if (courseIds.length === 0) return { rows: [], total: 0 };

  const memberships = await prisma.courseMembership.findMany({
    where: { courseId: { in: courseIds }, role: CourseRole.student },
    include: {
      user: { select: { id: true, username: true, email: true } },
      course: { select: { termLabel: true, courseCode: true } },
    },
  });

  const studentMap = new Map<
    string,
    {
      studentId: string;
      username: string;
      email?: string;
      cohort?: string;
      courseIds: Set<string>;
    }
  >();

  for (const m of memberships) {
    const existing = studentMap.get(m.userId);
    const cohort = m.course.termLabel;
    if (!existing) {
      studentMap.set(m.userId, {
        studentId: m.userId,
        username: m.user.username,
        email: m.user.email ?? undefined,
        cohort,
        courseIds: new Set([m.courseId]),
      });
    } else {
      existing.courseIds.add(m.courseId);
      if (!existing.cohort) existing.cohort = cohort;
    }
  }

  const now = range.end;
  const trendDays = Math.min(8, range.dayCount);
  const trendStart = startOfDay(addDays(now, -(trendDays - 1)));

  const rows = await Promise.all(
    [...studentMap.values()].map(async (student) => {
      const ids = [...student.courseIds];

      const submissions = await prisma.submissionAttempt.findMany({
        where: {
          userId: student.studentId,
          project: { courseId: { in: ids } },
          OR: [
            { submittedAt: { gte: range.start, lte: range.end } },
            { submittedAt: null, createdAt: { gte: range.start, lte: range.end } },
          ],
        },
        select: { status: true, submittedAt: true, createdAt: true },
      });

      const allTimeSubs = await prisma.submissionAttempt.findMany({
        where: { userId: student.studentId, project: { courseId: { in: ids } } },
        select: { submittedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      const lastActivity = allTimeSubs[0]
        ? submissionTimestamp(allTimeSubs[0])
        : null;
      const daysSinceActivity = lastActivity
        ? Math.floor((now.getTime() - lastActivity.getTime()) / DAY_MS)
        : 999;

      const passRate = computePassRate(submissions);

      const reviews = await prisma.review.findMany({
        where: {
          score: { not: null },
          reviewedAt: { gte: range.start, lte: range.end },
          submissionAttempt: {
            userId: student.studentId,
            project: { courseId: { in: ids } },
          },
        },
        select: { score: true, reviewedAt: true },
      });
      const scores = reviews.map((r) => r.score!).filter(Number.isFinite);
      const averageGrade =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      const weekStart = startOfDay(addDays(now, -6));
      const videoRows = await prisma.videoProgress.findMany({
        where: {
          userId: student.studentId,
          updatedAt: { gte: weekStart, lte: now },
          video: { section: { courseId: { in: ids } } },
        },
        include: {
          video: { select: { durationSeconds: true } },
        },
      });
      let hoursWeekly = 0;
      for (const vp of videoRows) {
        const dur = vp.video.durationSeconds ?? 0;
        hoursWeekly += (dur * vp.watchedProgress) / 3600;
      }

      const trendBuckets = new Map<string, number[]>();
      for (let i = 0; i < trendDays; i++) {
        trendBuckets.set(toDateKey(addDays(trendStart, i)), []);
      }
      for (const r of reviews) {
        if (!r.reviewedAt || r.score == null) continue;
        const key = toDateKey(r.reviewedAt);
        if (trendBuckets.has(key)) trendBuckets.get(key)!.push(r.score);
      }
      const trendSeries = [...trendBuckets.keys()]
        .sort()
        .map((key) => {
          const vals = trendBuckets.get(key)!;
          return vals.length > 0
            ? vals.reduce((a, b) => a + b, 0) / vals.length
            : averageGrade;
        });

      const riskLevel = classifyRisk(passRate, daysSinceActivity);
      const trend =
        trendSeries.length >= 2
          ? trendSeries[trendSeries.length - 1]! - trendSeries[0]!
          : 0;

      return {
        studentId: student.studentId,
        username: student.username,
        email: student.email,
        cohort: student.cohort,
        hoursWeekly,
        averageGrade,
        riskLevel,
        trend,
        trendSeries,
      };
    })
  );

  let filtered = rows;
  if (filters.cohort) {
    filtered = filtered.filter((r) => r.cohort === filters.cohort);
  }
  if (filters.risk && ['low', 'medium', 'high'].includes(filters.risk)) {
    filtered = filtered.filter((r) => r.riskLevel === filters.risk);
  }

  filtered.sort((a, b) => {
    const riskOrder = { high: 0, medium: 1, low: 2 };
    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
  });

  return { rows: filtered, total: filtered.length };
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export async function buildEngagement(
  prisma: PrismaClient,
  courseIds: string[],
  range: ResolvedDateRange
) {
  if (courseIds.length === 0) {
    return {
      totalHours: 0,
      averageSession: 0,
      retentionWeekly: 0,
      byDay: WEEKDAY_LABELS.map((bucket) => ({ bucket, hours: 0, sessions: 0 })),
      byCourse: [],
    };
  }

  const progress = await prisma.videoProgress.findMany({
    where: {
      updatedAt: { gte: range.start, lte: range.end },
      video: { section: { courseId: { in: courseIds } } },
    },
    include: {
      video: {
        select: {
          durationSeconds: true,
          section: { select: { courseId: true } },
        },
      },
    },
  });

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, courseCode: true },
  });
  const courseCodeById = new Map(courses.map((c) => [c.id, c.courseCode]));

  let totalHours = 0;
  const byWeekday = new Map<number, { hours: number; sessions: number }>();
  const byCourseHours = new Map<string, number>();
  const studentDays = new Map<string, Set<string>>();

  for (const row of progress) {
    const dur = row.video.durationSeconds ?? 0;
    const hours = (dur * row.watchedProgress) / 3600;
    if (hours <= 0) continue;
    totalHours += hours;
    const courseId = row.video.section.courseId;
    byCourseHours.set(courseId, (byCourseHours.get(courseId) ?? 0) + hours);

    const dow = row.updatedAt.getUTCDay();
    const wd = byWeekday.get(dow) ?? { hours: 0, sessions: 0 };
    wd.hours += hours;
    wd.sessions += 1;
    byWeekday.set(dow, wd);

    const dayKey = toDateKey(row.updatedAt);
    if (!studentDays.has(row.userId)) studentDays.set(row.userId, new Set());
    studentDays.get(row.userId)!.add(dayKey);
  }

  const sessionLengths: number[] = [];
  for (const days of studentDays.values()) {
    sessionLengths.push(days.size);
  }
  const averageSession =
    sessionLengths.length > 0
      ? (totalHours * 60) / sessionLengths.reduce((a, b) => a + b, 0)
      : 0;

  const currentWeekStart = startOfDay(addDays(range.end, -6));
  const priorWeekStart = startOfDay(addDays(currentWeekStart, -7));
  const priorWeekEnd = endOfDay(addDays(currentWeekStart, -1));

  const [currentWeekUsers, priorWeekUsers] = await Promise.all([
    prisma.videoProgress.findMany({
      where: {
        updatedAt: { gte: currentWeekStart, lte: range.end },
        video: { section: { courseId: { in: courseIds } } },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.videoProgress.findMany({
      where: {
        updatedAt: { gte: priorWeekStart, lte: priorWeekEnd },
        video: { section: { courseId: { in: courseIds } } },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);
  const currentSet = new Set(currentWeekUsers.map((r) => r.userId));
  const priorSet = new Set(priorWeekUsers.map((r) => r.userId));
  let retained = 0;
  for (const id of currentSet) {
    if (priorSet.has(id)) retained += 1;
  }
  const retentionWeekly = priorSet.size > 0 ? retained / priorSet.size : 0;

  const byDay = WEEKDAY_LABELS.map((bucket, idx) => {
    const wd = byWeekday.get(idx) ?? { hours: 0, sessions: 0 };
    return { bucket, hours: Math.round(wd.hours * 10) / 10, sessions: wd.sessions };
  });

  const byCourse = [...byCourseHours.entries()]
    .map(([courseId, hours]) => ({
      courseId,
      code: courseCodeById.get(courseId) ?? courseId,
      hours: Math.round(hours * 10) / 10,
    }))
    .sort((a, b) => b.hours - a.hours);

  return {
    totalHours: Math.round(totalHours * 10) / 10,
    averageSession: Math.round(averageSession * 10) / 10,
    retentionWeekly,
    byDay,
    byCourse,
  };
}

export function assertInstructorAccess(auth: AuthenticatedRequest): boolean {
  if (auth.user.systemRole === SystemRole.admin) return true;
  return auth.memberships.some((m) => m.role === 'instructor' || m.role === 'ta');
}
