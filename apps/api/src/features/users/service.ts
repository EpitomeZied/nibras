import { PrismaClient } from '@prisma/client';
import type {
  UserProfileActivity,
  UserProfileCompetitionAccount,
  UserProfileCourseProgress,
  UserProfileDailyStreak,
  UserProfileGamification,
  UserProfilePublic,
  UserProfileResponse,
  UserProfileStats,
  UserProfileSubmission,
  UserProfileViewerRole,
  UserSocialLink,
} from '@nibras/contracts';
import { AppStore, ActivityRecord, SubmissionRecord } from '../../store';
import { GamificationService } from '../gamification/service';
import { computeLevel } from '../gamification/badges-catalog';
import { ReputationService } from '../reputation/service';
import { socialLinkDisplayUrl } from './social-links';

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

function normalizeDisplayName(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function clampYearLevel(value: number | null | undefined): number {
  const level = value ?? 1;
  return Math.min(4, Math.max(1, level));
}

function githubAvatarUrl(login: string | null | undefined, size = 128): string | undefined {
  const trimmed = login?.trim();
  if (!trimmed) return undefined;
  const url = `https://avatars.githubusercontent.com/${encodeURIComponent(trimmed)}?s=${size}`;
  try {
    return new URL(url).toString();
  } catch {
    return undefined;
  }
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

function isFullProfileViewer(viewerRole: UserProfileViewerRole): boolean {
  return (
    viewerRole === 'self' || viewerRole === 'instructor' || viewerRole === 'admin'
  );
}

function isDetailedViewer(viewerRole: UserProfileViewerRole): boolean {
  return viewerRole === 'instructor' || viewerRole === 'admin';
}

function activityHref(
  entry: ActivityRecord,
  viewerRole: UserProfileViewerRole
): string | undefined {
  if (entry.submissionId && entry.courseId && isDetailedViewer(viewerRole)) {
    return `/instructor/courses/${entry.courseId}/submissions/${entry.submissionId}/review`;
  }
  if (entry.projectId && entry.courseId) {
    return `/instructor/courses/${entry.courseId}/projects/${entry.projectId}`;
  }
  if (entry.courseId) {
    return `/catalog/${entry.courseId}`;
  }
  return undefined;
}

function mapActivity(
  entries: ActivityRecord[],
  viewerRole: UserProfileViewerRole
): UserProfileActivity[] {
  return entries.map((entry) => ({
    id: entry.id,
    type: entry.action,
    title: entry.summary,
    occurredAt: entry.createdAt,
    href: activityHref(entry, viewerRole),
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

  async loadSocialLinks(userId: string): Promise<UserSocialLink[]> {
    if (!this.prisma) return [];
    const rows = await this.prisma.userSocialLink.findMany({
      where: { userId },
      orderBy: { platform: 'asc' },
    });
    return rows.map((row) => ({
      platform: row.platform as UserSocialLink['platform'],
      value: row.value,
      url: socialLinkDisplayUrl({
        platform: row.platform as UserSocialLink['platform'],
        value: row.value,
      }),
    }));
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
      const githubLogin = user.githubAccount?.login?.trim() || user.username;
      return {
        id: user.id,
        username: user.username,
        displayName: normalizeDisplayName(user.displayName),
        bio: user.bio,
        githubLogin,
        systemRole: user.systemRole === 'admin' ? 'admin' : 'user',
        yearLevel: clampYearLevel(user.yearLevel),
        createdAt: user.createdAt,
      };
    }

    const users = await store.listUsers(apiBaseUrl);
    const user = users.find((entry) => entry.id === userId);
    if (!user) return null;
    const githubLogin = user.githubLogin?.trim() || user.username;
    return {
      id: user.id,
      username: user.username,
      displayName: normalizeDisplayName(user.displayName),
      bio: null,
      githubLogin,
      systemRole: user.systemRole === 'admin' ? 'admin' : 'user',
      yearLevel: clampYearLevel(user.yearLevel),
      createdAt: new Date(),
    };
  }

  async buildSelfSections(
    store: AppStore,
    apiBaseUrl: string,
    targetUserId: string
  ): Promise<{
    profile: UserProfilePublic;
    stats: UserProfileStats;
    courseProgress: UserProfileCourseProgress[];
    submissions: UserProfileSubmission[];
    activity: UserProfileActivity[];
  } | null> {
    const target = await this.loadTargetUser(store, apiBaseUrl, targetUserId);
    if (!target) return null;

    const memberships = await store.listCourseMemberships(apiBaseUrl, targetUserId);
    const socialLinks = await this.loadSocialLinks(targetUserId);
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
      socialLinks,
    };

    const viewerRole: UserProfileViewerRole = 'self';
    const [courseProgress, submissions, activity] = await Promise.all([
      this.buildCourseProgress(store, apiBaseUrl, targetUserId, viewerRole),
      this.buildSubmissions(store, apiBaseUrl, targetUserId, false),
      this.buildActivity(store, apiBaseUrl, targetUserId, viewerRole),
    ]);

    const stats = await this.buildStats(
      store,
      apiBaseUrl,
      targetUserId,
      viewerRole,
      submissions
    );

    return { profile, stats, courseProgress, submissions, activity };
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
    const socialLinks = await this.loadSocialLinks(targetUserId);
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
      socialLinks,
    };

    const fullViewer = isFullProfileViewer(viewerRole);
    const detailedViewer = isDetailedViewer(viewerRole);

    const [dailyStreak, competitionAccounts] = await Promise.all([
      this.buildDailyStreak(targetUserId),
      this.buildCompetitionAccounts(targetUserId),
    ]);

    if (!fullViewer) {
      const gamification = await this.buildGamification(targetUserId, viewerRole);
      const stats = await this.buildLimitedStats(store, apiBaseUrl, targetUserId);
      return {
        viewerRole,
        profile,
        gamification,
        stats,
        dailyStreak,
        competitionAccounts,
      };
    }

    const [courseProgress, submissions, gamification, activity] = await Promise.all([
      this.buildCourseProgress(store, apiBaseUrl, targetUserId, viewerRole),
      this.buildSubmissions(store, apiBaseUrl, targetUserId, detailedViewer),
      this.buildGamification(targetUserId, viewerRole),
      this.buildActivity(store, apiBaseUrl, targetUserId, viewerRole),
    ]);

    const stats = await this.buildStats(
      store,
      apiBaseUrl,
      targetUserId,
      viewerRole,
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
      dailyStreak,
      competitionAccounts,
    };
  }

  private async buildDailyStreak(userId: string): Promise<UserProfileDailyStreak | undefined> {
    if (!this.prisma) return undefined;
    const config = await this.prisma.dailyProblemConfig.findUnique({
      where: { userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        totalCompleted: true,
      },
    });
    if (!config) {
      return { current: 0, longest: 0, totalCompleted: 0 };
    }
    return {
      current: config.currentStreak,
      longest: config.longestStreak,
      totalCompleted: config.totalCompleted,
    };
  }

  private async buildCompetitionAccounts(
    userId: string
  ): Promise<UserProfileCompetitionAccount[] | undefined> {
    if (!this.prisma) return undefined;
    const accounts = await this.prisma.linkedAccount.findMany({
      where: { userId, verificationStatus: 'verified' },
      orderBy: { platform: 'asc' },
    });
    return accounts.map((account) => ({
      platform: account.platform,
      handle: account.handle,
      rating: account.platformRating,
      verified: true,
    }));
  }

  private async buildLimitedStats(
    store: AppStore,
    apiBaseUrl: string,
    targetUserId: string
  ): Promise<UserProfileStats> {
    const courses = await store.listTrackingCourses(apiBaseUrl, targetUserId);
    let passedCount = 0;
    if (this.prisma) {
      passedCount = await this.prisma.submissionAttempt.count({
        where: { userId: targetUserId, status: 'passed' },
      });
    } else {
      const rows = await store.listUserSubmissions(apiBaseUrl, targetUserId, { limit: 200 });
      passedCount = rows.filter((s) => s.status === 'passed').length;
    }
    return {
      totalSubmissions: 0,
      passedCount,
      pendingCount: 0,
      coursesEnrolled: courses.length,
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
      const rawAttemptCount = row.milestoneId
        ? attemptsByMilestone.get(row.milestoneId)
        : undefined;
      const attemptNumber =
        includeDetails && rawAttemptCount != null && rawAttemptCount > 0
          ? rawAttemptCount
          : undefined;
      return this.mapSubmission(row, includeDetails, {
        projectTitle: project?.name ?? project?.slug,
        score: includeDetails ? (review?.score ?? null) : undefined,
        attemptNumber,
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
    const detailedViewer = isDetailedViewer(viewerRole);
    const isSelf = viewerRole === 'self';
    const reputation = await this.reputation.getMyReputation(targetUserId, { sync: false });
    const level = computeLevel(reputation.total);

    let badgeList = earned;
    if (detailedViewer) {
      badgeList = badges;
    } else if (isSelf) {
      badgeList = badges.filter((badge) => badge.earnedAt || (badge.progress ?? 0) > 0);
    }

    return {
      reputationTotal: reputation.total,
      levelLabel: `Level ${level}`,
      rank: detailedViewer ? reputation.rank : undefined,
      percentile: detailedViewer ? reputation.percentile : undefined,
      earnedBadgeCount: earned.length,
      badges: badgeList.map((badge) => ({
        id: badge.id,
        code: badge.code,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        rarity: badge.rarity,
        earnedAt: badge.earnedAt,
        progress: badge.progress,
        threshold: badge.threshold && badge.threshold > 0 ? badge.threshold : undefined,
      })),
      history:
        detailedViewer || isSelf ? reputation.history.slice(0, 10) : undefined,
    };
  }

  private async buildActivity(
    store: AppStore,
    apiBaseUrl: string,
    targetUserId: string,
    viewerRole: UserProfileViewerRole
  ): Promise<UserProfileActivity[]> {
    const entries = await store.listTrackingActivity(apiBaseUrl, targetUserId);
    const filtered = entries.filter(
      (entry) => entry.actorUserId === targetUserId || !entry.actorUserId
    );
    const detailedViewer = isDetailedViewer(viewerRole);
    const slice = detailedViewer ? filtered : filtered.slice(0, 10);
    return mapActivity(slice, viewerRole);
  }

  private async buildStats(
    store: AppStore,
    apiBaseUrl: string,
    targetUserId: string,
    viewerRole: UserProfileViewerRole,
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

    const detailedViewer = isDetailedViewer(viewerRole);
    const isSelf = viewerRole === 'self';

    return {
      totalSubmissions: submissions.length,
      passedCount,
      pendingCount,
      coursesEnrolled: courses.length,
      ...(detailedViewer || isSelf ? { failedCount, needsReviewCount } : {}),
      ...(detailedViewer ? { avgScore } : {}),
    };
  }
}
