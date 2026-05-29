import { PrismaClient } from '@prisma/client';
import type {
  UserProfileActivity,
  UserProfileCourseProgress,
  UserProfileGamification,
  UserProfilePublic,
  UserProfileResponse,
  UserProfileStats,
  UserProfileSubmission,
  UserProfileViewerRole,
} from '@nibras/contracts';
import { AppStore, SubmissionRecord } from '../../store';
import { GamificationService } from '../gamification/service';
import { computeLevel } from '../gamification/badges-catalog';
import { ReputationService } from '../reputation/service';

type TargetUser = {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  githubLogin: string;
  systemRole: 'user' | 'admin';
  yearLevel: number;
  createdAt: Date;
};

function githubAvatarUrl(login: string | null | undefined, size = 128): string | undefined {
  const trimmed = login?.trim();
  if (!trimmed) return undefined;
  return `https://avatars.githubusercontent.com/${encodeURIComponent(trimmed)}?s=${size}`;
}

function resolvePrimaryRole(
  systemRole: 'user' | 'admin',
  memberships: Array<{ role: string }>
): 'student' | 'instructor' | 'admin' {
  if (systemRole === 'admin') return 'admin';
  if (memberships.some((m) => m.role === 'instructor' || m.role === 'ta')) {
    return 'instructor';
  }
  return 'student';
}

function mapActivity(
  entries: Array<{ id: string; action: string; summary: string; createdAt: string }>
): UserProfileActivity[] {
  return entries.map((entry) => ({
    id: entry.id,
    type: entry.action,
    title: entry.summary,
    occurredAt: entry.createdAt,
  }));
}

export class UserProfileService {
  private readonly gamification: GamificationService;
  private readonly reputation: ReputationService;

  constructor(private readonly prisma: PrismaClient | null) {
    this.gamification = prisma
      ? new GamificationService(prisma)
      : (null as unknown as GamificationService);
    this.reputation = prisma
      ? new ReputationService(prisma)
      : (null as unknown as ReputationService);
  }

  async loadTargetUser(
    store: AppStore,
    apiBaseUrl: string,
    userId: string
  ): Promise<TargetUser | null> {
    if (this.prisma) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { githubAccount: true },
      });
      if (!user) return null;
      return {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        githubLogin: user.githubAccount?.login ?? user.username,
        systemRole: user.systemRole === 'admin' ? 'admin' : 'user',
        yearLevel: user.yearLevel ?? 1,
        createdAt: user.createdAt,
      };
    }

    const users = await store.listUsers(apiBaseUrl);
    const user = users.find((entry) => entry.id === userId);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName ?? null,
      bio: null,
      githubLogin: user.githubLogin,
      systemRole: user.systemRole === 'admin' ? 'admin' : 'user',
      yearLevel: user.yearLevel ?? 1,
      createdAt: new Date(),
    };
  }

  async buildProfileResponse(
    store: AppStore,
    apiBaseUrl: string,
    targetUserId: string,
    viewerRole: UserProfileViewerRole
  ): Promise<UserProfileResponse | null> {
    const target = await this.loadTargetUser(store, apiBaseUrl, targetUserId);
    if (!target) return null;

    const memberships = await store.listCourseMemberships(apiBaseUrl, targetUserId);
    const profile: UserProfilePublic = {
      id: target.id,
      username: target.username,
      displayName: target.displayName,
      githubLogin: target.githubLogin,
      avatarUrl: githubAvatarUrl(target.githubLogin),
      bio: target.bio,
      primaryRole: resolvePrimaryRole(target.systemRole, memberships),
      yearLevel: target.yearLevel,
      memberSince: target.createdAt.toISOString(),
    };

    const isDetailedViewer = viewerRole === 'instructor' || viewerRole === 'admin';
    const [courseProgress, submissions, gamification, activity] = await Promise.all([
      this.buildCourseProgress(store, apiBaseUrl, targetUserId, viewerRole),
      this.buildSubmissions(store, apiBaseUrl, targetUserId, isDetailedViewer),
      this.buildGamification(targetUserId, viewerRole),
      this.buildActivity(store, apiBaseUrl, targetUserId, isDetailedViewer),
    ]);

    const stats = await this.buildStats(
      store,
      apiBaseUrl,
      targetUserId,
      isDetailedViewer,
      submissions
    );

    return {
      viewerRole,
      profile,
      courseProgress,
      submissions,
      gamification,
      activity,
      stats,
    };
  }

  private async buildCourseProgress(
    store: AppStore,
    apiBaseUrl: string,
    targetUserId: string,
    viewerRole: UserProfileViewerRole
  ): Promise<UserProfileCourseProgress[]> {
    const courses = await store.listTrackingCourses(apiBaseUrl, targetUserId);
    const memberships = await store.listCourseMemberships(apiBaseUrl, targetUserId);
    const membershipByCourse = new Map(memberships.map((m) => [m.courseId, m]));

    const progress: UserProfileCourseProgress[] = [];
    for (const course of courses) {
      const membership = membershipByCourse.get(course.id);
      if (!membership) continue;

      const projects = await store.listTrackingProjects(apiBaseUrl, course.id);
      let totalMilestones = 0;
      let passedMilestones = 0;

      for (const project of projects) {
        const milestones = await store.listTrackingMilestones(apiBaseUrl, project.id);
        totalMilestones += milestones.length;
        for (const milestone of milestones) {
          const submissions = (
            await store.listTrackingMilestoneSubmissions(apiBaseUrl, milestone.id)
          ).filter((s) => s.userId === targetUserId);
          const latest = submissions[0];
          if (latest?.status === 'passed') passedMilestones += 1;
        }
      }

      const completionPercent =
        totalMilestones > 0 ? Math.round((passedMilestones / totalMilestones) * 100) : 0;

      progress.push({
        courseId: course.id,
        title: course.title,
        role: membership.role,
        completionPercent,
        enrolledAt: membership.createdAt ?? null,
        ...(viewerRole === 'instructor' || viewerRole === 'admin'
          ? { totalMilestones, passedMilestones }
          : {}),
      });
    }

    return progress;
  }

  private async buildSubmissions(
    store: AppStore,
    apiBaseUrl: string,
    targetUserId: string,
    includeDetails: boolean
  ): Promise<UserProfileSubmission[]> {
    const limit = includeDetails ? 100 : 20;
    const rows = await store.listUserSubmissions(apiBaseUrl, targetUserId, { limit });

    if (!this.prisma) {
      return rows.map((row) => this.mapSubmission(row, includeDetails));
    }

    const submissionIds = rows.map((row) => row.id);
    const reviews = submissionIds.length
      ? await this.prisma.review.findMany({
          where: { submissionAttemptId: { in: submissionIds } },
          orderBy: { createdAt: 'desc' },
        })
      : [];
    const latestReviewBySubmission = new Map<string, { score: number | null }>();
    for (const review of reviews) {
      if (!latestReviewBySubmission.has(review.submissionAttemptId)) {
        latestReviewBySubmission.set(review.submissionAttemptId, { score: review.score });
      }
    }

    const projects = await this.prisma.project.findMany({
      where: { id: { in: [...new Set(rows.map((row) => row.projectId))] } },
      select: { id: true, name: true, slug: true },
    });
    const projectById = new Map(projects.map((p) => [p.id, p]));

    const attemptCounts = submissionIds.length
      ? await this.prisma.submissionAttempt.groupBy({
          by: ['milestoneId'],
          where: { userId: targetUserId, milestoneId: { not: null } },
          _count: { _all: true },
        })
      : [];
    const attemptsByMilestone = new Map(
      attemptCounts.map((row) => [row.milestoneId, row._count._all])
    );

    return rows.map((row) => {
      const project = projectById.get(row.projectId);
      const review = latestReviewBySubmission.get(row.id);
      const attemptNumber = row.milestoneId
        ? (attemptsByMilestone.get(row.milestoneId) ?? 1)
        : undefined;
      return this.mapSubmission(row, includeDetails, {
        projectTitle: project?.name ?? project?.slug,
        score: includeDetails ? (review?.score ?? null) : undefined,
        attemptNumber: includeDetails ? attemptNumber : undefined,
      });
    });
  }

  private mapSubmission(
    row: SubmissionRecord,
    includeDetails: boolean,
    extras?: { projectTitle?: string; score?: number | null; attemptNumber?: number }
  ): UserProfileSubmission {
    return {
      id: row.id,
      projectKey: row.projectKey,
      projectTitle: extras?.projectTitle,
      milestoneId: row.milestoneId,
      commitSha: row.commitSha,
      repoUrl: row.repoUrl,
      branch: row.branch,
      status: row.status as UserProfileSubmission['status'],
      summary: row.summary || null,
      submissionType: row.submissionType,
      submissionValue: row.submissionValue,
      notes: row.notes,
      submittedAt: row.submittedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      localTestExitCode: row.localTestExitCode,
      ...(includeDetails && extras?.score !== undefined ? { score: extras.score } : {}),
      ...(includeDetails && extras?.attemptNumber !== undefined
        ? { attemptNumber: extras.attemptNumber }
        : {}),
    };
  }

  private async buildGamification(
    targetUserId: string,
    viewerRole: UserProfileViewerRole
  ): Promise<UserProfileGamification | undefined> {
    if (!this.prisma) {
      return {
        reputationTotal: 0,
        earnedBadgeCount: 0,
        badges: [],
      };
    }

    const badges = await this.gamification.listBadgesForUser(targetUserId);
    const earned = badges.filter((badge) => badge.earnedAt);
    const isDetailedViewer = viewerRole === 'instructor' || viewerRole === 'admin';
    const reputation = await this.reputation.getMyReputation(targetUserId, { sync: false });
    const level = computeLevel(reputation.total);

    return {
      reputationTotal: reputation.total,
      levelLabel: `Level ${level}`,
      rank: isDetailedViewer ? reputation.rank : undefined,
      percentile: isDetailedViewer ? reputation.percentile : undefined,
      earnedBadgeCount: earned.length,
      badges: (isDetailedViewer ? badges : earned).map((badge) => ({
        id: badge.id,
        code: badge.code,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        rarity: badge.rarity,
        earnedAt: badge.earnedAt,
        progress: badge.progress,
        threshold: badge.threshold,
      })),
      history: isDetailedViewer ? reputation.history : undefined,
    };
  }

  private async buildActivity(
    store: AppStore,
    apiBaseUrl: string,
    targetUserId: string,
    isDetailedViewer: boolean
  ): Promise<UserProfileActivity[]> {
    const entries = await store.listTrackingActivity(apiBaseUrl, targetUserId);
    const filtered = entries.filter(
      (entry) => entry.actorUserId === targetUserId || !entry.actorUserId
    );
    const slice = isDetailedViewer ? filtered : filtered.slice(0, 10);
    return mapActivity(slice);
  }

  private async buildStats(
    store: AppStore,
    apiBaseUrl: string,
    targetUserId: string,
    isDetailedViewer: boolean,
    submissions: UserProfileSubmission[]
  ): Promise<UserProfileStats> {
    const courses = await store.listTrackingCourses(apiBaseUrl, targetUserId);
    const passedCount = submissions.filter((s) => s.status === 'passed').length;
    const pendingCount = submissions.filter(
      (s) => s.status === 'queued' || s.status === 'running'
    ).length;
    const failedCount = submissions.filter((s) => s.status === 'failed').length;
    const needsReviewCount = submissions.filter((s) => s.status === 'needs_review').length;

    const scored = submissions.filter((s) => s.score != null) as Array<
      UserProfileSubmission & { score: number }
    >;
    const avgScore =
      scored.length > 0
        ? Math.round((scored.reduce((sum, s) => sum + s.score, 0) / scored.length) * 10) / 10
        : null;

    return {
      totalSubmissions: submissions.length,
      passedCount,
      pendingCount,
      coursesEnrolled: courses.length,
      ...(isDetailedViewer ? { failedCount, needsReviewCount, avgScore } : {}),
    };
  }
}
