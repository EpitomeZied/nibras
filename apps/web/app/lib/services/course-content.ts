import { serviceFetch } from '../api-clients/service-fetch';
import type {
  CourseSection,
  CourseVideo,
  CreateCourseSectionRequest,
  CreateCourseVideoRequest,
  UpdateCourseSectionRequest,
  UpdateCourseVideoRequest,
  VideoProgressResponse,
} from '@nibras/contracts';

export type { CourseSection, CourseVideo };

export type CourseSectionsResponse = {
  sections: CourseSection[];
};

export async function listCourseSections(courseId: string): Promise<CourseSection[]> {
  const data = await serviceFetch<CourseSectionsResponse>(
    'tracking',
    `/v1/tracking/courses/${courseId}/sections`,
    { auth: true }
  );
  return data.sections;
}

/** Flat list with legacy `order` / `url` fields for catalog player compatibility. */
export type FlatCourseVideo = CourseVideo & {
  order: number;
  url: string;
};

export async function listVideos(courseId: string): Promise<FlatCourseVideo[]> {
  const sections = await listCourseSections(courseId);
  const flat: FlatCourseVideo[] = [];
  for (const section of sections) {
    for (const video of section.videos) {
      flat.push({
        ...video,
        order: video.sortOrder,
        url: video.playbackUrl,
      });
    }
  }
  return flat.sort((a, b) => a.order - b.order);
}

export async function setVideoProgress(
  videoId: string,
  payload: { watched?: boolean; watchedProgress?: number }
): Promise<VideoProgressResponse> {
  return serviceFetch<VideoProgressResponse>(
    'tracking',
    `/v1/tracking/videos/${videoId}/progress`,
    {
      method: 'POST',
      auth: true,
      body: payload as Record<string, unknown>,
    }
  );
}

export async function createCourseSection(
  courseId: string,
  payload: CreateCourseSectionRequest
): Promise<CourseSection> {
  return serviceFetch<CourseSection>('tracking', `/v1/tracking/courses/${courseId}/sections`, {
    method: 'POST',
    auth: true,
    body: payload as Record<string, unknown>,
  });
}

export async function updateCourseSection(
  courseId: string,
  sectionId: string,
  payload: UpdateCourseSectionRequest
): Promise<CourseSection> {
  return serviceFetch<CourseSection>(
    'tracking',
    `/v1/tracking/courses/${courseId}/sections/${sectionId}`,
    {
      method: 'PATCH',
      auth: true,
      body: payload as Record<string, unknown>,
    }
  );
}

export async function deleteCourseSection(courseId: string, sectionId: string): Promise<void> {
  await serviceFetch<{ ok: boolean }>(
    'tracking',
    `/v1/tracking/courses/${courseId}/sections/${sectionId}`,
    { method: 'DELETE', auth: true }
  );
}

export async function createCourseVideo(
  courseId: string,
  sectionId: string,
  payload: CreateCourseVideoRequest
): Promise<CourseVideo> {
  return serviceFetch<CourseVideo>(
    'tracking',
    `/v1/tracking/courses/${courseId}/sections/${sectionId}/videos`,
    {
      method: 'POST',
      auth: true,
      body: payload as Record<string, unknown>,
    }
  );
}

export async function updateCourseVideo(
  courseId: string,
  videoId: string,
  payload: UpdateCourseVideoRequest
): Promise<CourseVideo> {
  return serviceFetch<CourseVideo>(
    'tracking',
    `/v1/tracking/courses/${courseId}/videos/${videoId}`,
    {
      method: 'PATCH',
      auth: true,
      body: payload as Record<string, unknown>,
    }
  );
}

export async function deleteCourseVideo(courseId: string, videoId: string): Promise<void> {
  await serviceFetch<{ ok: boolean }>(
    'tracking',
    `/v1/tracking/courses/${courseId}/videos/${videoId}`,
    { method: 'DELETE', auth: true }
  );
}
