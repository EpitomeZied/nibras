import { serviceFetch } from '../api-clients/service-fetch';
import type {
  AssignmentSubmissionsList,
  CourseAssignment,
  CourseAssignmentDetail,
  CreateCourseAssignmentRequest,
  GradeAssignmentRequest,
  SubmitAssignmentRequest,
  UpdateCourseAssignmentRequest,
  AssignmentSubmissionResponse,
} from '@nibras/contracts';

export type { CourseAssignment, CourseAssignmentDetail };

export async function listCourseAssignments(courseId: string) {
  return serviceFetch<CourseAssignment[]>(
    'tracking',
    `/v1/tracking/courses/${courseId}/assignments`,
    { auth: true }
  );
}

export async function getCourseAssignment(assignmentId: string) {
  return serviceFetch<CourseAssignmentDetail>(
    'tracking',
    `/v1/tracking/assignments/${assignmentId}`,
    { auth: true }
  );
}

export async function listAssignmentSubmissions(assignmentId: string) {
  return serviceFetch<AssignmentSubmissionsList>(
    'tracking',
    `/v1/tracking/assignments/${assignmentId}/submissions`,
    { auth: true }
  );
}

export async function createCourseAssignment(
  courseId: string,
  payload: CreateCourseAssignmentRequest
) {
  return serviceFetch<CourseAssignment>(
    'tracking',
    `/v1/tracking/courses/${courseId}/assignments`,
    { method: 'POST', auth: true, body: payload as Record<string, unknown> }
  );
}

export async function updateCourseAssignment(
  courseId: string,
  assignmentId: string,
  payload: UpdateCourseAssignmentRequest
) {
  return serviceFetch<CourseAssignment>(
    'tracking',
    `/v1/tracking/courses/${courseId}/assignments/${assignmentId}`,
    { method: 'PATCH', auth: true, body: payload as Record<string, unknown> }
  );
}

export async function deleteCourseAssignment(courseId: string, assignmentId: string) {
  await serviceFetch<{ ok: boolean }>(
    'tracking',
    `/v1/tracking/courses/${courseId}/assignments/${assignmentId}`,
    { method: 'DELETE', auth: true }
  );
}

export async function submitCourseAssignment(
  assignmentId: string,
  payload: SubmitAssignmentRequest
) {
  return serviceFetch<AssignmentSubmissionResponse>(
    'tracking',
    `/v1/tracking/assignments/${assignmentId}/submit`,
    { method: 'POST', auth: true, body: payload as Record<string, unknown> }
  );
}

export async function gradeCourseAssignment(assignmentId: string, payload: GradeAssignmentRequest) {
  return serviceFetch<AssignmentSubmissionResponse>(
    'tracking',
    `/v1/tracking/assignments/${assignmentId}/grade`,
    { method: 'POST', auth: true, body: payload as Record<string, unknown> }
  );
}
