import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { AppStore } from '../../store';
import {
  canManageCourse,
  canViewCourseForRequest,
  hasAnyInstructorAccess,
} from '../tracking/policies/access';

export async function assertCourseView(
  store: AppStore,
  apiBaseUrl: string,
  auth: AuthenticatedRequest,
  courseId: string,
  reply: FastifyReply
): Promise<boolean> {
  const allowed = await canViewCourseForRequest(store, apiBaseUrl, auth, courseId);
  if (!allowed) {
    reply.code(403).send(Errors.forbidden());
    return false;
  }
  return true;
}

export function assertCourseManage(
  auth: AuthenticatedRequest,
  courseId: string,
  reply: FastifyReply
): boolean {
  if (!canManageCourse(auth, courseId)) {
    reply.code(403).send(Errors.forbidden());
    return false;
  }
  return true;
}

export function canAcceptAnswer(
  auth: AuthenticatedRequest,
  questionAuthorId: string
): boolean {
  if (auth.user.systemRole === 'admin') return true;
  if (questionAuthorId === auth.user.id) return true;
  return hasAnyInstructorAccess(auth);
}
