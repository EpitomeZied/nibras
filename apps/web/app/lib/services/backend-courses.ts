import type { CourseAssignment, CourseAssignmentDetail } from '@nibras/contracts';
import { listMyTrackingCourses } from './course-profile';

export type BackendCourse = {
  id: string;
  code: string;
  title: string;
  instructor?: string;
  description?: string;
  thumbnailUrl?: string;
  videoCount?: number;
  assignmentCount?: number;
  progress?: number;
};

export type CourseVideo = {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  durationSeconds: number;
  url: string;
  thumbnailUrl?: string;
  watched?: boolean;
  watchedProgress?: number;
  order: number;
};

export type BackendAssignment = CourseAssignment;
export type AssignmentDetail = CourseAssignmentDetail;

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  submittedAt: string;
  status: CourseAssignment['status'];
  score?: number;
  feedback?: string;
};

// ── Courses (tracking) ──────────────────────────────────────────────────────
export async function listCourses(): Promise<BackendCourse[]> {
  const courses = await listMyTrackingCourses();
  return courses.map((c) => ({
    id: c.id,
    code: c.courseCode,
    title: c.title,
  }));
}

export async function getCourse(courseId: string): Promise<BackendCourse> {
  const { getCourseDetail } = await import('./course-profile');
  const detail = await getCourseDetail(courseId);
  return {
    id: detail.id,
    code: detail.courseCode,
    title: detail.title,
    description: detail.description,
    thumbnailUrl: detail.thumbnailUrl ?? undefined,
    videoCount: detail.videoCount,
    assignmentCount: detail.publishedAssignmentCount,
    progress: detail.videoProgressPercent,
  };
}

// ── Videos (tracking API — see course-content.ts) ───────────────────────────
export {
  listCourseSections,
  listVideos,
  setVideoProgress,
  createCourseSection,
  updateCourseSection,
  deleteCourseSection,
  createCourseVideo,
  updateCourseVideo,
  deleteCourseVideo,
} from './course-content';
export type { CourseSection } from './course-content';

// ── Assignments (tracking API) ──────────────────────────────────────────────
export {
  listCourseAssignments as listAssignments,
  getCourseAssignment as getAssignmentById,
  submitCourseAssignment as submitAssignment,
} from './course-assignments';

export {
  getCourseDetail,
  updateCourseProfile,
  getMyCourseGrades,
  getVideoAnalytics,
  listMyTrackingCourses,
} from './course-profile';
