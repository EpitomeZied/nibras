import {
  DashboardHomeResponse,
  DashboardHomeResponseSchema,
  InstructorDashboardResponse,
  InstructorDashboardResponseSchema,
  StudentProjectsDashboardResponse,
  StudentProjectsDashboardResponseSchema,
  StudentUpcomingDeadline,
  TrackingMilestone,
  TrackingProjectSummary,
} from '@nibras/contracts';
import {
  DashboardHomeRecord,
  MilestoneRecord,
  ProjectRecord,
  ReviewRecord,
  StudentDashboardRecord,
  SubmissionRecord,
} from '../../../store';

function formatDateLabel(value: string | null): string {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function milestoneStatus(
  milestoneId: string,
  submissions: SubmissionRecord[],
  reviews: ReviewRecord[]
): string {
  const latestSubmission = submissions
    .filter((entry) => entry.milestoneId === milestoneId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  if (!latestSubmission) {
    return 'open';
  }
  const latestReview = reviews
    .filter((entry) => entry.submissionId === latestSubmission.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  if (!latestReview) {
    return 'submitted';
  }
  return latestReview.status;
}

function latestSubmissionForMilestone(
  milestoneId: string,
  submissions: SubmissionRecord[]
): SubmissionRecord | null {
  return (
    submissions
      .filter((entry) => entry.milestoneId === milestoneId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
  );
}

function latestReviewForSubmission(
  submissionId: string,
  reviews: ReviewRecord[]
): ReviewRecord | null {
  return (
    reviews
      .filter((entry) => entry.submissionId === submissionId)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null
  );
}

export function presentMilestone(
  milestone: MilestoneRecord,
  submissions: SubmissionRecord[],
  reviews: ReviewRecord[]
): TrackingMilestone {
  const status = milestoneStatus(milestone.id, submissions, reviews);
  const latestSubmission = latestSubmissionForMilestone(milestone.id, submissions);
  const latestReview = latestSubmission
    ? latestReviewForSubmission(latestSubmission.id, reviews)
    : null;
  const reviewFeedback = latestReview?.feedback?.trim() || null;
  return {
    id: milestone.id,
    projectId: milestone.projectId,
    title: milestone.title,
    description: milestone.description,
    order: milestone.order,
    dueAt: milestone.dueAt,
    dueDateLabel: formatDateLabel(milestone.dueAt),
    status,
    statusLabel: statusLabel(status),
    isFinal: milestone.isFinal,
    latestSubmissionId: latestSubmission?.id ?? null,
    verificationStatus: latestSubmission?.status ?? null,
    reviewStatus: latestReview?.status ?? null,
    reviewComment:
      reviewFeedback && reviewFeedback.length > 240
        ? `${reviewFeedback.slice(0, 237)}…`
        : reviewFeedback,
  };
}

export function presentProject(
  project: ProjectRecord,
  options?: { latestReview?: ReviewRecord | null }
): TrackingProjectSummary {
  const rubricTotal = project.rubric.reduce((sum, item) => sum + (item.maxScore || 0), 0);
  const earnedByCriterion = new Map(
    (options?.latestReview?.rubric ?? []).map((item) => [item.criterion, item.earned ?? 0])
  );
  const rubric = project.rubric.map((item) => ({
    ...item,
    earned: earnedByCriterion.has(item.criterion)
      ? earnedByCriterion.get(item.criterion)
      : item.earned,
  }));
  return {
    id: project.id,
    projectKey: project.projectKey,
    courseId: project.courseId || '',
    title: project.title,
    description: project.description,
    status: project.status,
    level: project.level ?? 1,
    deliveryMode: project.deliveryMode,
    templateId: project.templateId,
    teamFormationStatus: project.teamFormationStatus,
    applicationOpenAt: project.applicationOpenAt,
    applicationCloseAt: project.applicationCloseAt,
    teamLockAt: project.teamLockAt,
    teamSize: project.teamSize,
    teamRoles: project.teamRoles,
    teamName: project.teamName,
    assignedRoleLabel: project.assignedRoleLabel,
    gradeWeight: rubricTotal ? `${rubricTotal} pts rubric` : null,
    startDate: null,
    endDate: null,
    instructorName: project.instructorUserId ? 'Course Staff' : null,
    type: project.deliveryMode === 'team' ? 'Team' : 'Individual',
    rubric,
    resources: project.resources,
    team: project.team,
  };
}

function latestGradedReviewForProject(
  milestones: MilestoneRecord[],
  submissionsByMilestone: Record<string, SubmissionRecord[]>,
  reviewsByMilestone: Record<string, ReviewRecord[]>
): ReviewRecord | null {
  let latest: ReviewRecord | null = null;
  for (const milestone of milestones) {
    const submissions = submissionsByMilestone[milestone.id] || [];
    const reviews = reviewsByMilestone[milestone.id] || [];
    for (const submission of submissions) {
      const review = latestReviewForSubmission(submission.id, reviews);
      if (!review || (review.status !== 'graded' && review.status !== 'approved')) continue;
      if (!latest || review.createdAt.localeCompare(latest.createdAt) > 0) {
        latest = review;
      }
    }
  }
  return latest;
}

export function presentStudentDashboard(args: {
  dashboard: StudentDashboardRecord;
  submissionsByMilestone: Record<string, SubmissionRecord[]>;
  reviewsByMilestone: Record<string, ReviewRecord[]>;
  portfolioCourses?: StudentProjectsDashboardResponse['portfolioCourses'];
  courseDeadlines?: StudentUpcomingDeadline[];
}): StudentProjectsDashboardResponse {
  const milestonesByProject = Object.fromEntries(
    Object.entries(args.dashboard.milestonesByProject).map(([projectId, milestones]) => {
      const rendered = milestones.map((milestone) =>
        presentMilestone(
          milestone,
          args.submissionsByMilestone[milestone.id] || [],
          args.reviewsByMilestone[milestone.id] || []
        )
      );
      return [projectId, rendered];
    })
  );

  return StudentProjectsDashboardResponseSchema.parse({
    course: args.dashboard.course,
    memberships: args.dashboard.memberships.map((entry) => ({
      courseId: entry.courseId,
      userId: entry.userId,
      role: entry.role,
      level: entry.level ?? 1,
    })),
    projects: args.dashboard.projects.map((project) =>
      presentProject(project, {
        latestReview: latestGradedReviewForProject(
          args.dashboard.milestonesByProject[project.id] || [],
          args.submissionsByMilestone,
          args.reviewsByMilestone
        ),
      })
    ),
    milestonesByProject,
    activeProjectId: args.dashboard.activeProjectId,
    activity: args.dashboard.activity,
    statsByProject: args.dashboard.statsByProject,
    pageError: args.dashboard.pageError,
    portfolioCourses: args.portfolioCourses,
    courseDeadlines: args.courseDeadlines,
  });
}

export function presentInstructorDashboard(
  value: InstructorDashboardResponse
): InstructorDashboardResponse {
  return InstructorDashboardResponseSchema.parse(value);
}

export function presentHomeDashboard(value: DashboardHomeRecord): DashboardHomeResponse {
  return DashboardHomeResponseSchema.parse(value);
}
