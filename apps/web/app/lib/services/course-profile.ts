import { serviceFetch } from '../api-clients/service-fetch';
import type {
  CourseBrowseItem,
  CourseEnrollmentRequest,
  CourseGradesRollup,
  CreateCourseEnrollmentRequest,
  TrackingCourseDetail,
  UpdateCourseProfileRequest,
  VideoAnalyticsResponse,
} from '@nibras/contracts';

export async function getCourseDetail(courseId: string) {
  return serviceFetch<TrackingCourseDetail>('tracking', `/v1/tracking/courses/${courseId}/detail`, {
    auth: true,
  });
}

export async function updateCourseProfile(courseId: string, payload: UpdateCourseProfileRequest) {
  return serviceFetch<TrackingCourseDetail>(
    'tracking',
    `/v1/tracking/courses/${courseId}/profile`,
    { method: 'PATCH', auth: true, body: payload as Record<string, unknown> }
  );
}

export async function getMyCourseGrades(courseId: string) {
  return serviceFetch<CourseGradesRollup>(
    'tracking',
    `/v1/tracking/courses/${courseId}/grades/me`,
    { auth: true }
  );
}

export async function getVideoAnalytics(courseId: string) {
  return serviceFetch<VideoAnalyticsResponse>(
    'tracking',
    `/v1/tracking/courses/${courseId}/videos/analytics`,
    { auth: true }
  );
}

export async function listMyTrackingCourses() {
  return serviceFetch<
    Array<{
      id: string;
      slug: string;
      title: string;
      termLabel: string;
      courseCode: string;
      isActive: boolean;
      isPublic?: boolean;
    }>
  >('tracking', '/v1/tracking/courses', { auth: true });
}

export async function browseCourses() {
  return serviceFetch<CourseBrowseItem[]>('tracking', '/v1/tracking/courses/browse', {
    auth: true,
  });
}

export async function enrollInCourse(courseId: string) {
  return serviceFetch<{ ok: true; courseId: string }>(
    'tracking',
    `/v1/tracking/courses/${courseId}/enroll`,
    { method: 'POST', auth: true }
  );
}

export async function requestCourseAccess(
  courseId: string,
  payload?: CreateCourseEnrollmentRequest
) {
  return serviceFetch<CourseEnrollmentRequest>(
    'tracking',
    `/v1/tracking/courses/${courseId}/enrollment-requests`,
    { method: 'POST', auth: true, body: (payload ?? {}) as Record<string, unknown> }
  );
}

export async function listCourseEnrollmentRequests(courseId: string, status = 'pending') {
  return serviceFetch<CourseEnrollmentRequest[]>(
    'tracking',
    `/v1/tracking/courses/${courseId}/enrollment-requests?status=${status}`,
    { auth: true }
  );
}

export async function approveCourseEnrollmentRequest(courseId: string, requestId: string) {
  return serviceFetch<CourseEnrollmentRequest>(
    'tracking',
    `/v1/tracking/courses/${courseId}/enrollment-requests/${requestId}/approve`,
    { method: 'POST', auth: true }
  );
}

export async function rejectCourseEnrollmentRequest(courseId: string, requestId: string) {
  return serviceFetch<CourseEnrollmentRequest>(
    'tracking',
    `/v1/tracking/courses/${courseId}/enrollment-requests/${requestId}/reject`,
    { method: 'POST', auth: true }
  );
}
