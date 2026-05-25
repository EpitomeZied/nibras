import { serviceFetch } from '../api-clients/service-fetch';
import type {
  CourseGradesRollup,
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
    }>
  >('tracking', '/v1/tracking/courses', { auth: true });
}
