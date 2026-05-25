import { AuthenticatedRequest, hasCourseAccess, hasCourseRole } from '../../../lib/auth';
import { AppStore, ProjectRecord, SubmissionRecord } from '../../../store';

export function canViewCourse(auth: AuthenticatedRequest, courseId: string): boolean {
  return hasCourseAccess(auth, courseId);
}

/** Grants browse access to public courses (auto-enrol) and re-checks membership. */
export async function canViewCourseForRequest(
  store: AppStore,
  apiBaseUrl: string,
  auth: AuthenticatedRequest,
  courseId: string
): Promise<boolean> {
  if (auth.user.systemRole === 'admin' || canViewCourse(auth, courseId)) {
    return true;
  }
  await store.ensurePublicCourseStudentAccess(apiBaseUrl, auth.user.id, courseId);
  const memberships = await store.listCourseMemberships(apiBaseUrl, auth.user.id);
  return memberships.some(
    (entry) =>
      entry.courseId === courseId &&
      (entry.role === 'student' || entry.role === 'instructor' || entry.role === 'ta')
  );
}

export function canManageCourse(auth: AuthenticatedRequest, courseId: string): boolean {
  return hasCourseRole(auth, courseId, ['instructor', 'ta']);
}

export function canManageProject(auth: AuthenticatedRequest, project: ProjectRecord): boolean {
  if (!project.courseId) {
    return false;
  }
  return canManageCourse(auth, project.courseId);
}

export function hasAnyInstructorAccess(auth: AuthenticatedRequest): boolean {
  if (auth.user.systemRole === 'admin') {
    return true;
  }
  return auth.memberships.some((entry) => entry.role === 'instructor' || entry.role === 'ta');
}

export function canViewSubmission(
  auth: AuthenticatedRequest,
  project: ProjectRecord | null,
  submission: SubmissionRecord
): boolean {
  if (
    auth.user.systemRole === 'admin' ||
    submission.userId === auth.user.id ||
    submission.submittedByUserId === auth.user.id ||
    submission.teamMemberUserIds.includes(auth.user.id)
  ) {
    return true;
  }
  if (!project) {
    return false;
  }
  return canManageProject(auth, project);
}
