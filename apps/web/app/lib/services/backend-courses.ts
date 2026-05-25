import { serviceFetch, serviceFetchOptional } from '../api-clients/service-fetch';

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

export type BackendAssignment = {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueAt?: string;
  pointsPossible: number;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'late';
  score?: number;
};

export type AssignmentDetail = BackendAssignment & {
  content?: string;
  resources?: Array<{ title: string; url: string }>;
  rubric?: Array<{ criterion: string; weight: number; description?: string }>;
};

export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  submittedAt: string;
  status: BackendAssignment['status'];
  score?: number;
  feedback?: string;
};

// ── Courses ─────────────────────────────────────────────────────────────────
export async function listCourses() {
  return serviceFetch<BackendCourse[]>('admin', '/v1/courses', { auth: true });
}

export async function getCourse(courseId: string) {
  return serviceFetch<BackendCourse>('admin', `/v1/courses/${courseId}`, { auth: true });
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

// ── Assignments ─────────────────────────────────────────────────────────────
export async function listAssignments(courseId: string) {
  return serviceFetch<BackendAssignment[]>('admin', `/v1/assignments/course/${courseId}`, {
    auth: true,
  });
}

export async function getAssignmentById(assignmentId: string) {
  return serviceFetch<AssignmentDetail>('admin', `/v1/assignments/${assignmentId}`, {
    auth: true,
  });
}

// Invented by the port. UI hides the submit form when this is unavailable.
export async function submitAssignment(
  assignmentId: string,
  payload: { content: string; resources?: Array<{ title: string; url: string }> }
): Promise<AssignmentSubmission | null> {
  return serviceFetchOptional<AssignmentSubmission>(
    'admin',
    `/v1/assignments/${assignmentId}/submit`,
    {
      method: 'POST',
      auth: true,
      body: payload as Record<string, unknown>,
    }
  );
}
