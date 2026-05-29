import { PrismaClient } from '@prisma/client';
import type { UserProfileViewerRole } from '@nibras/contracts';
import { AuthenticatedRequest } from '../../../lib/auth';
import { AppStore } from '../../../store';

export type ProfileVisibilityResult =
  | { allowed: false }
  | { allowed: true; viewerRole: UserProfileViewerRole };

export async function resolveProfileVisibility(
  auth: AuthenticatedRequest,
  targetUserId: string,
  store: AppStore,
  apiBaseUrl: string,
  prisma?: PrismaClient
): Promise<ProfileVisibilityResult> {
  if (auth.user.id === targetUserId) {
    return { allowed: true, viewerRole: 'self' };
  }
  if (auth.user.systemRole === 'admin') {
    return { allowed: true, viewerRole: 'admin' };
  }

  const viewerInstructorCourseIds = auth.memberships
    .filter((m) => m.role === 'instructor' || m.role === 'ta')
    .map((m) => m.courseId);

  if (viewerInstructorCourseIds.length > 0) {
    let targetStudentCourseIds: string[];
    if (prisma) {
      const rows = await prisma.courseMembership.findMany({
        where: { userId: targetUserId, role: 'student' },
        select: { courseId: true },
      });
      targetStudentCourseIds = rows.map((row) => row.courseId);
    } else {
      const memberships = await store.listCourseMemberships(apiBaseUrl, targetUserId);
      targetStudentCourseIds = memberships
        .filter((membership) => membership.role === 'student')
        .map((membership) => membership.courseId);
    }

    const hasSharedCourse = targetStudentCourseIds.some((courseId) =>
      viewerInstructorCourseIds.includes(courseId)
    );
    if (hasSharedCourse) {
      return { allowed: true, viewerRole: 'instructor' };
    }
  }

  return { allowed: true, viewerRole: 'authenticated' };
}
