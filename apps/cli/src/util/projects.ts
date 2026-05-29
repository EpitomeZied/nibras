import { apiRequest } from '@nibras/core';
import { unwrapList } from './output';

type CourseSummary = {
  id: string;
};

export type TrackingProjectRef = {
  id: string;
  projectKey: string;
  title: string;
  courseId: string;
};

type MilestoneSummary = {
  id: string;
  slug?: string | null;
  title: string;
  dueAt: string | null;
  order: number;
  dueDateLabel?: string;
};

export async function listTrackingProjects(): Promise<TrackingProjectRef[]> {
  const courses = unwrapList<CourseSummary>(await apiRequest('/v1/tracking/courses'), 'courses');
  const projects: TrackingProjectRef[] = [];

  for (const course of courses) {
    try {
      const courseProjects = unwrapList<TrackingProjectRef>(
        await apiRequest(`/v1/tracking/courses/${course.id}/projects`),
        'projects'
      );
      projects.push(...courseProjects);
    } catch {
      // Student may not have project visibility for every course.
    }
  }

  return projects;
}

export async function findTrackingProjectByKey(
  projectKey: string
): Promise<TrackingProjectRef | null> {
  const projects = await listTrackingProjects();
  return projects.find((project) => project.projectKey === projectKey) ?? null;
}

export async function listProjectMilestones(projectId: string): Promise<MilestoneSummary[]> {
  return unwrapList<MilestoneSummary>(
    await apiRequest(`/v1/tracking/projects/${projectId}/milestones`),
    'milestones'
  );
}
