import { serviceFetch } from '../api-clients/service-fetch';
import type {
  CreateProjectRoleApplicationRequest,
  CreateTrackingSubmissionRequest,
  ProjectRoleApplication,
  StudentProjectsDashboardResponse,
  Team,
  TrackingCourseSummary,
} from '@nibras/contracts';

export type ProjectGitHubStatus = {
  available: boolean;
  githubLinked: boolean;
  githubAppInstalled: boolean;
  githubLogin: string;
  installUrl: string;
  statusMessage: string;
};

export async function fetchStudentProjectsDashboard(
  courseId?: string | null
): Promise<StudentProjectsDashboardResponse> {
  const query = courseId ? { courseId } : undefined;
  return serviceFetch<StudentProjectsDashboardResponse>(
    'tracking',
    '/v1/tracking/dashboard/student',
    {
      auth: true,
      query,
    }
  );
}

export async function listTrackingCourses(): Promise<TrackingCourseSummary[]> {
  return serviceFetch<TrackingCourseSummary[]>('tracking', '/v1/tracking/courses', {
    auth: true,
  });
}

export async function fetchProjectGitHubStatus(): Promise<ProjectGitHubStatus> {
  try {
    const session = await serviceFetch<{
      user?: { githubLinked?: boolean; githubAppInstalled?: boolean; githubLogin?: string | null };
    }>('tracking', '/v1/web/session', { auth: true });
    const user = session.user || {};
    const githubLinked = Boolean(user.githubLinked);
    const githubAppInstalled = Boolean(user.githubAppInstalled);
    const githubLogin = user.githubLogin || '';

    if (!githubLinked || githubAppInstalled) {
      return {
        available: true,
        githubLinked,
        githubAppInstalled,
        githubLogin,
        installUrl: '',
        statusMessage: '',
      };
    }

    try {
      const installPayload = await serviceFetch<{ installUrl?: string }>(
        'tracking',
        '/v1/github/install-url',
        { auth: true }
      );
      return {
        available: true,
        githubLinked,
        githubAppInstalled,
        githubLogin,
        installUrl: installPayload.installUrl || '',
        statusMessage: '',
      };
    } catch (error) {
      return {
        available: true,
        githubLinked,
        githubAppInstalled,
        githubLogin,
        installUrl: '',
        statusMessage:
          error instanceof Error
            ? error.message
            : 'GitHub App install link is temporarily unavailable.',
      };
    }
  } catch (error) {
    return {
      available: false,
      githubLinked: false,
      githubAppInstalled: false,
      githubLogin: '',
      installUrl: '',
      statusMessage:
        error instanceof Error ? error.message : 'GitHub status is temporarily unavailable.',
    };
  }
}

export async function fetchMyTeamApplication(
  projectId: string
): Promise<ProjectRoleApplication | null> {
  return serviceFetch<ProjectRoleApplication | null>(
    'tracking',
    `/v1/tracking/projects/${projectId}/applications/me`,
    { auth: true }
  );
}

export async function listProjectTeams(projectId: string): Promise<Team[]> {
  return serviceFetch<Team[]>('tracking', `/v1/tracking/projects/${projectId}/teams`, {
    auth: true,
  });
}

export async function submitMilestoneTracking(
  milestoneId: string,
  payload: CreateTrackingSubmissionRequest
): Promise<void> {
  await serviceFetch('tracking', `/v1/tracking/milestones/${milestoneId}/submissions`, {
    auth: true,
    method: 'POST',
    body: payload,
  });
}

export async function submitTeamApplication(
  projectId: string,
  payload: CreateProjectRoleApplicationRequest
): Promise<void> {
  await serviceFetch('tracking', `/v1/tracking/projects/${projectId}/applications`, {
    auth: true,
    method: 'POST',
    body: payload,
  });
}
