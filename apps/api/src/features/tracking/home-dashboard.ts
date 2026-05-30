import type {
  ActivityRecord,
  CourseMembershipRecord,
  CourseRecord,
  DashboardHomeRecord,
  DashboardModeRecord,
  InstructorCourseSummaryRecord,
  InstructorHomeDashboardRecord,
  InstructorRecentActivityItemRecord,
  InstructorReviewSummaryRecord,
  InstructorUrgentQueueItemRecord,
  MilestoneRecord,
  ProjectRecord,
  ReviewRecord,
  StudentCourseMilestoneSnapshotRecord,
  StudentCourseSnapshotRecord,
  StudentDashboardRecord,
  StudentHomeAttentionItemRecord,
  StudentHomeBlockerRecord,
  StudentHomeDashboardRecord,
  StudentHomeOverallStatsRecord,
  StudentUpcomingDeadlineRecord,
  StudentHomeRecentSubmissionRecord,
  SubmissionRecord,
  UserRecord,
} from '../../store';

function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function diffMinutes(value: string): number {
  const minutes = (new Date(value).getTime() - Date.now()) / 60_000;
  return minutes >= 0 ? Math.ceil(minutes) : Math.floor(minutes);
}

function ageMinutes(value: string): number {
  return Math.max(0, Math.ceil((Date.now() - new Date(value).getTime()) / 60_000));
}

function resolveAvailableModes(
  user: UserRecord,
  memberships: CourseMembershipRecord[]
): DashboardModeRecord[] {
  const hasStudent = memberships.some((entry) => entry.role === 'student');
  const hasInstructor =
    user.systemRole === 'admin' ||
    memberships.some((entry) => entry.role === 'instructor' || entry.role === 'ta');

  if (hasInstructor && hasStudent) return ['instructor', 'student'];
  if (hasInstructor) return ['instructor'];
  return ['student'];
}

function resolveMilestoneStatus(
  milestoneId: string,
  submissions: SubmissionRecord[],
  reviewsBySubmission: Record<string, ReviewRecord | null>
): string {
  const latestSubmission = submissions
    .filter((entry) => entry.milestoneId === milestoneId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  if (!latestSubmission) return 'open';

  const latestReview = reviewsBySubmission[latestSubmission.id];
  if (!latestReview)
    return latestSubmission.status === 'needs_review' ? 'needs_review' : 'submitted';
  if (latestReview.status === 'graded') return 'graded';
  if (latestReview.status === 'approved') return 'approved';
  if (latestReview.status === 'changes_requested') return 'changes_requested';
  return 'submitted';
}

type StudentSnapshotInput = {
  snapshot: StudentDashboardRecord;
  submissions: SubmissionRecord[];
  reviewsBySubmission: Record<string, ReviewRecord | null>;
};

function buildStudentCourseSnapshot({
  snapshot,
  submissions,
  reviewsBySubmission,
}: StudentSnapshotInput): StudentCourseSnapshotRecord {
  const projects = snapshot.projects.map((project) => {
    const stats = snapshot.statsByProject[project.id] || {
      approved: 0,
      underReview: 0,
      completion: 0,
      total: 0,
      minutesRemaining: 0,
    };
    const milestones = (snapshot.milestonesByProject[project.id] || []).map((milestone) => ({
      ...milestone,
      status: resolveMilestoneStatus(milestone.id, submissions, reviewsBySubmission),
    }));
    const nextMilestone =
      milestones
        .filter((entry) => entry.status !== 'approved' && entry.status !== 'graded')
        .sort((left, right) => {
          if (!left.dueAt) return 1;
          if (!right.dueAt) return -1;
          return left.dueAt.localeCompare(right.dueAt);
        })[0] || null;
    return {
      projectId: project.id,
      title: project.title,
      completion: stats.completion,
      approved: stats.approved,
      underReview: stats.underReview,
      open: Math.max(0, stats.total - stats.approved - stats.underReview),
      minutesRemaining:
        stats.minutesRemaining > 0 && Number.isFinite(stats.minutesRemaining)
          ? stats.minutesRemaining
          : null,
      nextMilestoneTitle: nextMilestone?.title || null,
      href: `/projects?courseId=${snapshot.course?.id || project.courseId}&projectId=${project.id}`,
    };
  });

  const allMilestones: StudentCourseMilestoneSnapshotRecord[] = snapshot.projects.flatMap(
    (project) =>
      (snapshot.milestonesByProject[project.id] || [])
        .map((milestone) => {
          const status = resolveMilestoneStatus(milestone.id, submissions, reviewsBySubmission);
          return {
            milestoneId: milestone.id,
            projectId: project.id,
            projectTitle: project.title,
            title: milestone.title,
            dueAt: milestone.dueAt,
            status,
            statusLabel: statusLabel(status),
          };
        })
        .sort((left, right) => {
          if (!left.dueAt) return 1;
          if (!right.dueAt) return -1;
          return left.dueAt.localeCompare(right.dueAt);
        })
  );

  const aggregate = projects.reduce(
    (acc, project) => {
      acc.approved += project.approved;
      acc.underReview += project.underReview;
      acc.open += project.open;
      return acc;
    },
    { approved: 0, underReview: 0, open: 0 }
  );
  const totalMilestones = aggregate.approved + aggregate.underReview + aggregate.open;

  return {
    courseId: snapshot.course?.id || '',
    courseTitle: snapshot.course?.title || 'No course selected',
    completion: totalMilestones ? Math.round((aggregate.approved / totalMilestones) * 100) : 0,
    approved: aggregate.approved,
    underReview: aggregate.underReview,
    open: aggregate.open,
    nextMilestones: allMilestones.filter((entry) => entry.status !== 'approved').slice(0, 5),
    projects,
  };
}

function buildStudentAttentionItems(args: {
  snapshots: StudentDashboardRecord[];
  submissions: SubmissionRecord[];
  reviewsBySubmission: Record<string, ReviewRecord | null>;
}): StudentHomeAttentionItemRecord[] {
  const courseById = new Map<string, CourseRecord>();
  const projectById = new Map<string, ProjectRecord>();
  const milestoneById = new Map<string, MilestoneRecord>();

  for (const snapshot of args.snapshots) {
    if (snapshot.course) courseById.set(snapshot.course.id, snapshot.course);
    for (const project of snapshot.projects) {
      projectById.set(project.id, project);
      for (const milestone of snapshot.milestonesByProject[project.id] || []) {
        milestoneById.set(milestone.id, milestone);
      }
    }
  }

  const items: StudentHomeAttentionItemRecord[] = [];
  const seen = new Set<string>();

  const pushItem = (item: StudentHomeAttentionItemRecord | null) => {
    if (!item || seen.has(item.id) || items.length >= 8) return;
    seen.add(item.id);
    items.push(item);
  };

  const reviewSorted = [...args.submissions]
    .filter((submission) => args.reviewsBySubmission[submission.id]?.status === 'changes_requested')
    .sort((left, right) => {
      const leftReview = args.reviewsBySubmission[left.id];
      const rightReview = args.reviewsBySubmission[right.id];
      return (rightReview?.reviewedAt || rightReview?.createdAt || '').localeCompare(
        leftReview?.reviewedAt || leftReview?.createdAt || ''
      );
    });

  pushItem(
    reviewSorted[0]
      ? (() => {
          const submission = reviewSorted[0];
          const review = args.reviewsBySubmission[submission.id];
          const project = projectById.get(submission.projectId);
          const milestone = submission.milestoneId
            ? milestoneById.get(submission.milestoneId)
            : null;
          const course = project?.courseId ? courseById.get(project.courseId) : null;
          if (!project || !course) return null;
          return {
            id: `changes-${submission.id}`,
            kind: 'changes_requested',
            courseId: course.id,
            courseTitle: course.title,
            projectId: project.id,
            projectTitle: project.title,
            milestoneId: milestone?.id || null,
            milestoneTitle: milestone?.title || null,
            submissionId: submission.id,
            statusText: 'Changes requested',
            reason: 'Instructor requested changes on your latest submission.',
            dueAt: milestone?.dueAt || null,
            submittedAt: submission.submittedAt,
            reviewedAt: review?.reviewedAt || review?.createdAt || null,
            cta: { label: 'Resubmit', href: `/submissions/${submission.id}` },
          };
        })()
      : null
  );

  const failedSorted = [...args.submissions]
    .filter(
      (submission) =>
        submission.status === 'failed' &&
        args.reviewsBySubmission[submission.id]?.status !== 'changes_requested'
    )
    .sort((left, right) =>
      (right.submittedAt || right.createdAt).localeCompare(left.submittedAt || left.createdAt)
    );

  pushItem(
    failedSorted[0]
      ? (() => {
          const submission = failedSorted[0];
          const project = projectById.get(submission.projectId);
          const milestone = submission.milestoneId
            ? milestoneById.get(submission.milestoneId)
            : null;
          const course = project?.courseId ? courseById.get(project.courseId) : null;
          if (!project || !course) return null;
          return {
            id: `failed-${submission.id}`,
            kind: 'failed_submission',
            courseId: course.id,
            courseTitle: course.title,
            projectId: project.id,
            projectTitle: project.title,
            milestoneId: milestone?.id || null,
            milestoneTitle: milestone?.title || null,
            submissionId: submission.id,
            statusText: 'Failed',
            reason: 'Your latest submission needs fixes before it can pass.',
            dueAt: milestone?.dueAt || null,
            submittedAt: submission.submittedAt,
            reviewedAt: null,
            cta: { label: 'Resubmit', href: `/submissions/${submission.id}` },
          };
        })()
      : null
  );

  const needsReviewSorted = [...args.submissions]
    .filter((submission) => submission.status === 'needs_review')
    .sort((left, right) =>
      (right.submittedAt || right.createdAt).localeCompare(left.submittedAt || left.createdAt)
    );

  pushItem(
    needsReviewSorted[0]
      ? (() => {
          const submission = needsReviewSorted[0];
          const project = projectById.get(submission.projectId);
          const milestone = submission.milestoneId
            ? milestoneById.get(submission.milestoneId)
            : null;
          const course = project?.courseId ? courseById.get(project.courseId) : null;
          if (!project || !course) return null;
          return {
            id: `review-${submission.id}`,
            kind: 'needs_review',
            courseId: course.id,
            courseTitle: course.title,
            projectId: project.id,
            projectTitle: project.title,
            milestoneId: milestone?.id || null,
            milestoneTitle: milestone?.title || null,
            submissionId: submission.id,
            statusText: 'Needs review',
            reason: 'Your latest submission is waiting for review.',
            dueAt: milestone?.dueAt || null,
            submittedAt: submission.submittedAt,
            reviewedAt: null,
            cta: { label: 'View submission', href: `/submissions/${submission.id}` },
          };
        })()
      : null
  );

  const allMilestones = args.snapshots.flatMap((snapshot) =>
    snapshot.projects.flatMap((project) =>
      (snapshot.milestonesByProject[project.id] || []).map((milestone) => ({
        course: snapshot.course,
        project,
        milestone,
        status: resolveMilestoneStatus(milestone.id, args.submissions, args.reviewsBySubmission),
      }))
    )
  );

  const dueWithin24 = allMilestones
    .filter(
      (entry) =>
        entry.course &&
        entry.milestone.dueAt &&
        !['approved', 'graded'].includes(entry.status) &&
        diffMinutes(entry.milestone.dueAt) >= 0 &&
        diffMinutes(entry.milestone.dueAt) <= 24 * 60
    )
    .sort((left, right) => (left.milestone.dueAt || '').localeCompare(right.milestone.dueAt || ''));

  pushItem(
    dueWithin24[0]
      ? {
          id: `due-${dueWithin24[0].milestone.id}`,
          kind: 'due_soon',
          courseId: dueWithin24[0].course!.id,
          courseTitle: dueWithin24[0].course!.title,
          projectId: dueWithin24[0].project.id,
          projectTitle: dueWithin24[0].project.title,
          milestoneId: dueWithin24[0].milestone.id,
          milestoneTitle: dueWithin24[0].milestone.title,
          submissionId: null,
          statusText: 'Due soon',
          reason: 'This milestone is due within the next 24 hours.',
          dueAt: dueWithin24[0].milestone.dueAt,
          submittedAt: null,
          reviewedAt: null,
          cta: {
            label: 'Open project',
            href: `/projects?courseId=${dueWithin24[0].course!.id}`,
          },
        }
      : null
  );

  if (items.length < 8) {
    const dueWithin72 = allMilestones
      .filter(
        (entry) =>
          entry.course &&
          entry.milestone.dueAt &&
          !['approved', 'graded'].includes(entry.status) &&
          diffMinutes(entry.milestone.dueAt) > 24 * 60 &&
          diffMinutes(entry.milestone.dueAt) <= 72 * 60
      )
      .sort((left, right) =>
        (left.milestone.dueAt || '').localeCompare(right.milestone.dueAt || '')
      );
    pushItem(
      dueWithin72[0]
        ? {
            id: `due-${dueWithin72[0].milestone.id}`,
            kind: 'due_soon',
            courseId: dueWithin72[0].course!.id,
            courseTitle: dueWithin72[0].course!.title,
            projectId: dueWithin72[0].project.id,
            projectTitle: dueWithin72[0].project.title,
            milestoneId: dueWithin72[0].milestone.id,
            milestoneTitle: dueWithin72[0].milestone.title,
            submissionId: null,
            statusText: 'Upcoming',
            reason: 'This milestone is due within the next 72 hours.',
            dueAt: dueWithin72[0].milestone.dueAt,
            submittedAt: null,
            reviewedAt: null,
            cta: {
              label: 'Open project',
              href: `/projects?courseId=${dueWithin72[0].course!.id}`,
            },
          }
        : null
    );
  }

  return items.slice(0, 8);
}

function buildStudentUpcomingDeadlines(args: {
  snapshots: StudentDashboardRecord[];
  submissions: SubmissionRecord[];
  reviewsBySubmission: Record<string, ReviewRecord | null>;
}): StudentUpcomingDeadlineRecord[] {
  const deadlines: StudentUpcomingDeadlineRecord[] = [];

  for (const snapshot of args.snapshots) {
    const courseId = snapshot.course?.id || '';
    const courseTitle = snapshot.course?.title || 'Course';
    for (const project of snapshot.projects) {
      for (const milestone of snapshot.milestonesByProject[project.id] || []) {
        const status = resolveMilestoneStatus(milestone.id, args.submissions, args.reviewsBySubmission);
        if (status === 'approved' || status === 'graded') continue;
        deadlines.push({
          milestoneId: milestone.id,
          courseId,
          courseTitle,
          projectId: project.id,
          projectTitle: project.title,
          title: milestone.title,
          dueAt: milestone.dueAt,
          status,
          statusLabel: statusLabel(status),
          href: `/projects?courseId=${courseId || project.courseId}&projectId=${project.id}#milestone-${milestone.id}`,
        });
      }
    }
  }

  return deadlines
    .sort((left, right) => {
      if (!left.dueAt && !right.dueAt) return 0;
      if (!left.dueAt) return 1;
      if (!right.dueAt) return -1;
      return left.dueAt.localeCompare(right.dueAt);
    })
    .slice(0, 10);
}

function buildStudentOverallStats(
  courses: CourseRecord[],
  courseSnapshots: StudentCourseSnapshotRecord[]
): StudentHomeOverallStatsRecord {
  let milestonesApproved = 0;
  let milestonesTotal = 0;
  let activeProjectCount = 0;
  let weightedCompletion = 0;
  let weightTotal = 0;

  for (const snapshot of courseSnapshots) {
    const courseTotal = snapshot.approved + snapshot.underReview + snapshot.open;
    milestonesApproved += snapshot.approved;
    milestonesTotal += courseTotal;
    weightedCompletion += snapshot.completion * Math.max(courseTotal, 1);
    weightTotal += Math.max(courseTotal, 1);
    for (const project of snapshot.projects) {
      if (project.completion < 100 || project.open > 0) {
        activeProjectCount += 1;
      }
    }
  }

  return {
    coursesEnrolled: courses.length,
    overallCompletionPercent: weightTotal
      ? Math.round(weightedCompletion / weightTotal)
      : 0,
    milestonesApproved,
    milestonesTotal,
    activeProjectCount,
  };
}

export function buildStudentHomeDashboard(args: {
  user: UserRecord;
  courses: CourseRecord[];
  snapshots: StudentDashboardRecord[];
  submissions: SubmissionRecord[];
  reviewsBySubmission: Record<string, ReviewRecord | null>;
}): StudentHomeDashboardRecord {
  const courseSnapshots = args.snapshots.map((snapshot) =>
    buildStudentCourseSnapshot({
      snapshot,
      submissions: args.submissions,
      reviewsBySubmission: args.reviewsBySubmission,
    })
  );
  const selectedCourseId = args.courses[0]?.id || null;
  const selectedSnapshot =
    courseSnapshots.find((snapshot) => snapshot.courseId === selectedCourseId) || null;

  const milestoneTitleById = new Map<string, string>();
  const projectTitleById = new Map<string, string>();
  for (const snapshot of args.snapshots) {
    for (const project of snapshot.projects) {
      projectTitleById.set(project.id, project.title);
      for (const milestone of snapshot.milestonesByProject[project.id] || []) {
        milestoneTitleById.set(milestone.id, milestone.title);
      }
    }
  }

  const recentSubmissions: StudentHomeRecentSubmissionRecord[] = [...args.submissions]
    .sort((left, right) =>
      (right.submittedAt || right.createdAt).localeCompare(left.submittedAt || left.createdAt)
    )
    .slice(0, 12)
    .map((submission) => ({
      id: submission.id,
      projectKey: submission.projectKey,
      projectTitle: projectTitleById.get(submission.projectId) || submission.projectKey,
      milestoneTitle: submission.milestoneId
        ? milestoneTitleById.get(submission.milestoneId) || null
        : null,
      status: submission.status,
      statusLabel: statusLabel(submission.status),
      submittedAt: submission.submittedAt,
      createdAt: submission.createdAt,
      href: `/submissions/${submission.id}`,
    }));

  const blockers: StudentHomeBlockerRecord[] = [];
  if (!args.user.githubLinked) {
    blockers.push({
      id: 'github-not-linked',
      kind: 'github_not_linked',
      title: 'Connect GitHub first',
      body: 'Link your GitHub account to unlock repo-based submissions and tracking.',
      cta: { label: 'Open settings', href: '/settings' },
    });
  } else if (!args.user.githubAppInstalled) {
    blockers.push({
      id: 'github-app-not-installed',
      kind: 'github_app_not_installed',
      title: 'Install the GitHub App',
      body: 'Automatic push tracking is off until the Nibras GitHub App is installed.',
      cta: { label: 'Open settings', href: '/settings' },
    });
  }
  if (args.courses.length === 0) {
    blockers.push({
      id: 'no-memberships',
      kind: 'no_memberships',
      title: 'No course membership found',
      body: 'You are signed in, but there are no student course memberships on this account yet.',
      cta: { label: 'Open settings', href: '/settings' },
    });
  } else if (selectedSnapshot && selectedSnapshot.projects.length === 0) {
    blockers.push({
      id: `no-projects-${selectedSnapshot.courseId}`,
      kind: 'no_published_projects',
      title: 'No published projects yet',
      body: 'This course is active, but nothing is published for you to work on yet.',
      cta: { label: 'Open projects', href: `/projects?courseId=${selectedSnapshot.courseId}` },
    });
  }

  return {
    courses: args.courses,
    selectedCourseId,
    attentionItems: buildStudentAttentionItems({
      snapshots: args.snapshots,
      submissions: args.submissions,
      reviewsBySubmission: args.reviewsBySubmission,
    }),
    courseSnapshots,
    submissionHealth: {
      failedChecks: args.submissions.filter((entry) => entry.status === 'failed').length,
      needsReview: args.submissions.filter((entry) => entry.status === 'needs_review').length,
      awaitingReview: args.submissions.filter(
        (entry) => entry.status === 'queued' || entry.status === 'running'
      ).length,
      recentlyPassed: args.submissions.filter(
        (entry) =>
          entry.status === 'passed' &&
          ageMinutes(entry.submittedAt || entry.createdAt) <= 7 * 24 * 60
      ).length,
    },
    recentSubmissions,
    blockers,
    overallStats: buildStudentOverallStats(args.courses, courseSnapshots),
    upcomingDeadlines: buildStudentUpcomingDeadlines({
      snapshots: args.snapshots,
      submissions: args.submissions,
      reviewsBySubmission: args.reviewsBySubmission,
    }),
  };
}

export function buildStudentProjectPortfolio(
  courses: CourseRecord[],
  snapshots: StudentCourseSnapshotRecord[]
): Array<{
  courseId: string;
  courseCode: string;
  title: string;
  termLabel: string;
  completion: number;
  projectCount: number;
  openMilestones: number;
  nextDueAt: string | null;
  nextDueLabel: string | null;
}> {
  const courseById = new Map(courses.map((course) => [course.id, course]));
  return snapshots.map((snapshot) => {
    const course = courseById.get(snapshot.courseId);
    const nextDue = snapshot.nextMilestones.find((entry) => entry.dueAt) ?? null;
    return {
      courseId: snapshot.courseId,
      courseCode: course?.courseCode || '',
      title: snapshot.courseTitle,
      termLabel: course?.termLabel || '',
      completion: snapshot.completion,
      projectCount: snapshot.projects.length,
      openMilestones: snapshot.open,
      nextDueAt: nextDue?.dueAt ?? null,
      nextDueLabel: nextDue?.title ?? null,
    };
  });
}

export function buildInstructorHomeDashboard(args: {
  courses: CourseRecord[];
  reviewQueue: SubmissionRecord[];
  activities: ActivityRecord[];
  projectTitleById: Record<string, string>;
  courseIdByProjectId: Record<string, string>;
  courseTitleById: Record<string, string>;
  studentNameById: Record<string, string>;
  memberCountsByCourse: Record<string, number>;
  publishedProjectCountsByCourse: Record<string, number>;
}): InstructorHomeDashboardRecord {
  const pendingQueue = [...args.reviewQueue]
    .filter((entry) => entry.status === 'needs_review')
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  const pendingByCourse = pendingQueue.reduce<Record<string, number>>((acc, submission) => {
    const key = args.courseIdByProjectId[submission.projectId] || '';
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const oldestWaitingMinutes = pendingQueue[0] ? ageMinutes(pendingQueue[0].createdAt) : null;
  const reviewSummary: InstructorReviewSummaryRecord = {
    totalAwaitingReview: pendingQueue.length,
    oldestWaitingMinutes,
    submittedLast24Hours: pendingQueue.filter((entry) => ageMinutes(entry.createdAt) <= 24 * 60)
      .length,
    byCourse: args.courses
      .map((course) => ({
        courseId: course.id,
        courseTitle: course.title,
        pendingReviewCount: pendingByCourse[course.id] || 0,
      }))
      .filter((entry) => entry.pendingReviewCount > 0)
      .sort((left, right) => right.pendingReviewCount - left.pendingReviewCount),
  };

  const coursePendingMap = new Map<string, SubmissionRecord[]>();
  for (const submission of pendingQueue) {
    const course = args.courses.find(
      (entry) => entry.id === args.courseIdByProjectId[submission.projectId]
    );
    if (!course) continue;
    const list = coursePendingMap.get(course.id) || [];
    list.push(submission);
    coursePendingMap.set(course.id, list);
  }

  const urgentQueue: InstructorUrgentQueueItemRecord[] = pendingQueue.slice(0, 12).map((entry) => {
    const course =
      args.courses.find(
        (courseRecord) => courseRecord.id === args.courseIdByProjectId[entry.projectId]
      ) || args.courses[0];
    return {
      submissionId: entry.id,
      courseId: course?.id || '',
      courseTitle: course?.title || 'Unknown course',
      projectId: entry.projectId,
      projectTitle: args.projectTitleById[entry.projectId] || entry.projectKey,
      projectKey: entry.projectKey,
      studentName: args.studentNameById[entry.userId] || 'Student',
      status: entry.status,
      submittedAt: entry.submittedAt || entry.createdAt,
      waitingMinutes: ageMinutes(entry.createdAt),
      cta: {
        label: 'Open submissions',
        href: course ? `/instructor/courses/${course.id}/submissions` : '/instructor',
      },
    };
  });

  const lastActivityByCourse = args.activities.reduce<Record<string, string>>((acc, entry) => {
    if (!entry.courseId) return acc;
    if (!acc[entry.courseId] || acc[entry.courseId] < entry.createdAt) {
      acc[entry.courseId] = entry.createdAt;
    }
    return acc;
  }, {});

  const courseSummaries: InstructorCourseSummaryRecord[] = args.courses
    .map((course) => {
      const pending = coursePendingMap.get(course.id) || [];
      return {
        courseId: course.id,
        title: course.title,
        courseCode: course.courseCode,
        termLabel: course.termLabel,
        pendingReviewCount: pending.length,
        publishedProjectCount: args.publishedProjectCountsByCourse[course.id] || 0,
        memberCount: args.memberCountsByCourse[course.id] || 0,
        lastActivityAt: lastActivityByCourse[course.id] || null,
      };
    })
    .sort((left, right) => {
      const leftHasPending = left.pendingReviewCount > 0;
      const rightHasPending = right.pendingReviewCount > 0;
      if (leftHasPending && rightHasPending) {
        const leftOldest = coursePendingMap.get(left.courseId)?.[0]?.createdAt || '';
        const rightOldest = coursePendingMap.get(right.courseId)?.[0]?.createdAt || '';
        if (leftOldest !== rightOldest) return leftOldest.localeCompare(rightOldest);
        return right.pendingReviewCount - left.pendingReviewCount;
      }
      if (leftHasPending !== rightHasPending) return leftHasPending ? -1 : 1;
      if (left.lastActivityAt && right.lastActivityAt) {
        return left.lastActivityAt.localeCompare(right.lastActivityAt);
      }
      if (left.lastActivityAt !== right.lastActivityAt) return left.lastActivityAt ? 1 : -1;
      return right.publishedProjectCount - left.publishedProjectCount;
    });

  const recentActivity: InstructorRecentActivityItemRecord[] = args.activities
    .slice(0, 15)
    .map((entry) => ({
      id: entry.id,
      action: entry.action,
      summary: entry.summary,
      createdAt: entry.createdAt,
      courseId: entry.courseId,
      courseTitle: entry.courseId ? args.courseTitleById[entry.courseId] || null : null,
      href: entry.courseId
        ? entry.submissionId
          ? `/instructor/courses/${entry.courseId}/submissions`
          : `/instructor/courses/${entry.courseId}`
        : '/instructor',
    }));

  const firstCourse = courseSummaries[0];
  const operations = [
    {
      id: 'new-course',
      label: 'New course',
      description: 'Create a new course and publish the first project.',
      href: '/instructor/courses/new',
    },
    {
      id: 'invite',
      label: 'Create invite',
      description: 'Generate a student or TA invite link for a course.',
      href: firstCourse ? `/instructor/courses/${firstCourse.courseId}/members` : '/instructor',
    },
    {
      id: 'export',
      label: 'Export grades',
      description: 'Download the latest course submission data as CSV.',
      href: firstCourse ? `/v1/tracking/courses/${firstCourse.courseId}/export.csv` : '/instructor',
    },
    {
      id: 'cli-guide',
      label: 'CLI setup guide',
      description: 'Share the setup flow with students and course staff.',
      href: '/instructor/onboarding',
    },
  ];

  return {
    reviewSummary,
    urgentQueue,
    courseSummaries,
    recentActivity,
    operations,
  };
}

export function buildDashboardHomeRecord(args: {
  user: UserRecord;
  memberships: CourseMembershipRecord[];
  requestedMode?: DashboardModeRecord;
  student?: StudentHomeDashboardRecord;
  instructor?: InstructorHomeDashboardRecord;
}): DashboardHomeRecord {
  const availableModes = resolveAvailableModes(args.user, args.memberships);
  const defaultMode =
    args.requestedMode && availableModes.includes(args.requestedMode)
      ? args.requestedMode
      : availableModes.includes('instructor')
        ? 'instructor'
        : 'student';

  return {
    availableModes,
    defaultMode,
    ...(availableModes.includes('student') && args.student ? { student: args.student } : {}),
    ...(availableModes.includes('instructor') && args.instructor
      ? { instructor: args.instructor }
      : {}),
  };
}
