/* eslint-disable @typescript-eslint/no-namespace */
/**
 * @file api-reference.ts
 * @description Complete TypeScript API reference for the Nibras platform.
 * @version 2.0.0
 *
 * Every endpoint is typed with its HTTP method, path, auth requirements,
 * query parameters, request body, and response shape.
 *
 * Base URL: configured via NIBRAS_API_BASE_URL (default: http://localhost:3001)
 * All authenticated endpoints require either:
 *   - Bearer token header:  Authorization: Bearer <accessToken>
 *   - Session cookie:       nibras-session (web clients)
 *
 * ── Changelog ────────────────────────────────────────────────────────────────
 * v2.0.0 (2026-05-10)
 *   NEW  PATCH /v1/notifications/:id/read         — mark single notification read
 *   NEW  GET   /v1/notifications/preferences       — list per-type opt-in/out prefs
 *   NEW  PATCH /v1/notifications/preferences/:type — toggle a notification type
 *   NEW  GET   /v1/admin/audit-logs               — paginated, filterable audit log
 *   NEW  POST  /v1/admin/submissions/bulk-retry   — re-queue multiple submissions
 *   NEW  GET   /v1/tracking/analytics/instructor  — course analytics for instructors
 *   NEW  GET   /v1/analytics/overview             — cross-course instructor overview
 *   NEW  GET   /v1/analytics/courses              — per-course aggregate summaries
 *   NEW  GET   /v1/analytics/students             — student risk and grade table
 *   NEW  GET   /v1/analytics/engagement           — video engagement aggregates
 *   NEW  DELETE /v1/tracking/submissions/:id      — cancel a queued submission
 *   NEW  POST  /v1/tracking/courses/:id/invites/bulk — bulk invite code generation
 *   UPD  SubmissionStatus: added `cancelled` value
 *   UPD  Milestone: added optional `slug` field (auto-generated from title)
 *   UPD  SSE auth: session token now accepted via ?st= query param
 *   UPD  Worker: aggregate AI confidence threshold enforced for needsReview
 *   UPD  Worker: instructors/TAs notified via notification + email on needs_review
 *   UPD  Email: HTML templates added for all three notification emails
 *   UPD  CLI: `nibras list`, `nibras status`, and `--milestone <slug>` flag
 *   UPD  Web: submission status page uses SSE instead of polling
 *   NEW  Web: instructor analytics page at /instructor/courses/:id/analytics
 *   NEW  Web: admin audit log page at /admin/audit-logs
 *   NEW  Web: admin bulk-retry checkboxes on submissions table
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Re-export all contract types for convenience ─────────────────────────────
export type {
  // Auth / Session
  DeviceStartResponse,
  DevicePollResponse,
  MeResponse,
  PingResponse,
  TokenRefreshResponseSchema,
  GitHubConfigResponse,
  GitHubInstallUrlResponse,
  GitHubInstallationCompleteRequest,
  GitHubInstallationCompleteResponse,
  GitHubRepositoryValidateRequest,
  GitHubRepositoryValidateResponse,
  // Projects
  ProjectManifest,
  ProjectTaskResponse,
  ProjectStarter,
  ProjectSetupResponse,
  SubmissionPrepareRequest,
  SubmissionPrepareResponse,
  LocalTestResultRequest,
  SubmissionStatusResponse,
  // Tracking – courses
  TrackingCourseSummary,
  TrackingMembership,
  CourseMemberSchema,
  CourseInvitePreview,
  CreateCourseInviteResponseSchema,
  // Tracking – projects & milestones
  TrackingProjectSummary,
  TrackingProjectDetail,
  TrackingMilestone,
  ProjectTemplate,
  ProjectTemplateRole,
  ProjectTemplateMilestone,
  CreateTrackingProjectRequest,
  UpdateTrackingProjectRequest,
  CreateMilestoneRequest,
  UpdateMilestoneRequest,
  CreateProjectTemplateRequest,
  UpdateProjectTemplateRequest,
  // Tracking – submissions & reviews
  TrackingSubmission,
  TrackingSubmissionType,
  TrackingReview,
  CreateTrackingSubmissionRequest,
  UpdateTrackingSubmissionRequest,
  CreateReviewRequest,
  ReviewQueueResponse,
  // Tracking – teams
  Team,
  TeamMember,
  TeamMemberBadge,
  TeamFormationRun,
  ProjectRoleApplication,
  ProjectRolePreference,
  CreateProjectRoleApplicationRequest,
  GenerateTeamFormationRequest,
  LockTeamFormationRequest,
  UpdateTeamRequest,
  // Tracking – dashboards
  DashboardHomeResponse,
  DashboardMode,
  StudentHomeDashboard,
  StudentHomeOverallStats,
  StudentUpcomingDeadline,
  InstructorHomeDashboard,
  StudentProjectsDashboardResponse,
  InstructorDashboardResponse,
  TrackingActivityEvent,
  // Programs
  ProgramSummary,
  ProgramVersionSummary,
  ProgramVersionDetail,
  TrackSummary,
  CatalogCourse,
  RequirementGroup,
  RequirementRule,
  StudentProgramPlan,
  ProgramSheetView,
  Petition,
  ProgramApproval,
  TrackRecommendation,
  TrackRecommendationResponse,
  CreateProgramRequest,
  CreateProgramVersionRequest,
  CreateCatalogCourseRequest,
  CreateRequirementGroupRequest,
  UpdateRequirementGroupRequest,
  CreateTrackRequest,
  UpdateTrackRequest,
  SelectTrackRequest,
  UpdateStudentPlanRequest,
  CreatePetitionRequest,
  UpdatePetitionRequest,
  ProgramApprovalRequest,
} from './index.js';

// ─── Shared primitives ────────────────────────────────────────────────────────

/** ISO 8601 datetime string */
export type ISODateString = string;

/** CUID2 identifier */
export type CuidId = string;

/** Standard paginated query parameters */
export interface PaginationQuery {
  /** Max records to return (1–200, default 50) */
  limit?: number;
  /** Records to skip (default 0) */
  offset?: number;
}

/** Standard error response from any endpoint */
export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

/** Response envelope used when X-Total-Count is set */
export interface PaginatedMeta {
  /** Total record count available (from X-Total-Count response header) */
  total: number;
}

// ─── System / Health ──────────────────────────────────────────────────────────

export namespace System {
  /**
   * GET /healthz
   * Kubernetes liveness probe. No auth required.
   * @response 200 "ok"
   */
  export type HealthzResponse = 'ok';

  /**
   * GET /readyz
   * Kubernetes readiness probe — checks DB connectivity. No auth required.
   * @response 200 { status: "ok" } | 503 { status: "error", detail: string }
   */
  export interface ReadyzResponse {
    status: 'ok' | 'error';
    detail?: string;
  }

  /**
   * GET /metrics
   * Prometheus-compatible metrics endpoint. No auth required.
   * @response 200 Plain text metrics in Prometheus exposition format
   */
  export type MetricsResponse = string;

  /**
   * GET /v1/health
   * API health status. No auth required.
   * @response 200 { status: "ok" }
   */
  export interface V1HealthResponse {
    status: 'ok';
  }

  /**
   * GET /v1/ping
   * Ping with auth, GitHub link, and GitHub App status.
   * @auth Optional (richer response when authenticated)
   * @response 200
   */
  export interface PingResponse {
    ok: boolean;
    api: boolean;
    auth: boolean;
    githubLinked: boolean;
    githubAppInstalled: boolean;
  }
}

// ─── Authentication ───────────────────────────────────────────────────────────

export namespace Auth {
  /**
   * POST /v1/device/start
   * Begin GitHub device flow for CLI authentication. No auth required.
   * @response 200
   */
  export interface DeviceStartResponse {
    deviceCode: string;
    userCode: string;
    verificationUri: string;
    verificationUriComplete: string;
    intervalSeconds: number;
    expiresInSeconds: number;
  }

  /**
   * POST /v1/device/poll
   * Poll device flow for authorization result. No auth required.
   * @body { deviceCode: string }
   * @response 200 DevicePollPending | DevicePollSuccess
   */
  export type DevicePollPending = {
    status: 'pending' | 'expired' | 'denied';
  };
  export type DevicePollSuccess = {
    status: 'authorized';
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      username: string;
      email: string;
      githubLogin: string | null;
      githubLinked: boolean;
      githubAppInstalled: boolean;
      systemRole: 'user' | 'admin';
      yearLevel: number;
    };
  };
  export type DevicePollResponse = DevicePollPending | DevicePollSuccess;

  /**
   * POST /v1/device/authorize
   * Authorize a pending device code using the current web session.
   * @auth Required (web session cookie)
   * @body { userCode: string }
   * @response 200 { ok: true }
   */
  export interface DeviceAuthorizeResponse {
    ok: true;
  }

  /**
   * GET /v1/github/oauth/start
   * Redirect to GitHub OAuth — begins web login flow. No auth required.
   * @query { return_to?: string }
   * @response 302 Redirect to GitHub
   */
  export type OAuthStartResponse = never; // redirect

  /**
   * GET /v1/github/oauth/callback
   * GitHub OAuth callback — handled server-side, redirects to app. No auth required.
   * @response 302 Redirect to return_to URL
   */
  export type OAuthCallbackResponse = never; // redirect

  /**
   * POST /v1/auth/refresh
   * Refresh a CLI access token using the refresh token.
   * @body { refreshToken: string }
   * @response 200
   */
  export interface TokenRefreshResponse {
    accessToken: string;
    refreshToken: string;
  }

  /**
   * POST /v1/logout
   * Revoke a CLI session token.
   * @auth Required (Bearer token)
   * @response 200 { ok: true }
   */
  export interface LogoutResponse {
    ok: true;
  }

  /**
   * GET /v1/me
   * Get the currently authenticated CLI user.
   * @auth Required (Bearer token)
   * @response 200
   */
  export interface MeResponse {
    user: {
      id: string;
      username: string;
      email: string;
      githubLogin: string | null;
      githubLinked: boolean;
      githubAppInstalled: boolean;
      systemRole: 'user' | 'admin';
      yearLevel: number;
    };
    apiBaseUrl: string;
    memberships: Array<{
      courseId: string;
      role: 'student' | 'instructor' | 'ta';
      level: number;
    }>;
  }

  /**
   * GET /v1/web/session
   * Get the currently authenticated web user (session cookie).
   * @auth Required (session cookie)
   * @response 200
   */
  export type WebSessionResponse = MeResponse;

  /**
   * POST /v1/web/logout
   * Revoke the current web session cookie.
   * @auth Required (session cookie)
   * @response 200 { ok: true }
   */
  export interface WebLogoutResponse {
    ok: true;
  }

  /**
   * DELETE /v1/me/account
   * Permanently delete the authenticated user's account (GDPR erasure).
   * Anonymises submissions, revokes all tokens, removes personal data.
   * @auth Required (session cookie or Bearer token)
   * @response 200 { ok: true }
   */
  export interface DeleteAccountResponse {
    ok: true;
  }
}

// ─── GitHub Integration ───────────────────────────────────────────────────────

export namespace GitHub {
  /**
   * GET /v1/github/config
   * Get GitHub App configuration status. No auth required.
   * @response 200
   */
  export interface ConfigResponse {
    configured: boolean;
    appName: string | null;
    webBaseUrl: string | null;
  }

  /**
   * GET /v1/github/install-url
   * Get the URL to install the GitHub App.
   * @auth Required
   * @response 200
   */
  export interface InstallUrlResponse {
    installUrl: string;
  }

  /**
   * POST /v1/github/setup/complete
   * Link a GitHub App installation to the authenticated account.
   * @auth Required
   * @body { installationId: string }
   * @response 200
   */
  export interface SetupCompleteResponse {
    githubAppInstalled: boolean;
    installationId: string;
    redirectTo: string;
  }

  /**
   * POST /v1/github/repositories/validate
   * Validate a GitHub repository URL for submission eligibility.
   * @auth Required
   * @body { repoUrl: string }
   * @response 200
   */
  export interface RepositoryValidateResponse {
    repoUrl: string;
    owner: string;
    name: string;
    fullName: string;
    defaultBranch: string;
    visibility: 'public' | 'private';
    permission: string;
  }

  /**
   * POST /v1/github/webhooks
   * Receive GitHub webhook events (push, pull_request).
   * Validates HMAC signature. No user auth — uses webhook secret.
   * @response 200 { ok: true } | 204 (no-op events)
   */
  export interface WebhookResponse {
    ok: boolean;
  }
}

// ─── CLI Projects & Submissions ───────────────────────────────────────────────

export namespace Projects {
  /**
   * GET /v1/projects/:projectKey/manifest
   * Get a project's manifest (test config, buildpack, submission rules).
   * @auth Required (Bearer token)
   * @param projectKey Project identifier string
   * @response 200 ProjectManifest
   */
  export interface ManifestResponse {
    projectKey: string;
    releaseVersion: string;
    apiBaseUrl: string;
    buildpack?: {
      node?: { version: string };
    };
    test?: {
      command: string;
      timeout?: number;
    };
    submission?: {
      allowedPaths?: string[];
      ignorePaths?: string[];
    };
  }

  /**
   * GET /v1/projects/:projectKey/task
   * Get a project's task instructions (markdown).
   * @auth Required (Bearer token)
   * @param projectKey Project identifier string
   * @response 200
   */
  export interface TaskResponse {
    projectKey: string;
    task: string; // Markdown content
  }

  /**
   * GET /v1/projects/:projectKey/starter-bundle
   * Download the project starter kit as a ZIP archive.
   * @auth Required (Bearer token)
   * @param projectKey Project identifier string
   * @response 200 application/zip binary stream
   */
  export type StarterBundleResponse = ReadableStream; // ZIP binary

  /**
   * POST /v1/projects/:projectKey/setup
   * Provision a student GitHub repository for the project.
   * Creates the repo, applies template, returns clone URL.
   * @auth Required (Bearer token)
   * @param projectKey Project identifier string
   * @response 200
   */
  export interface SetupResponse {
    projectKey: string;
    repo: {
      owner: string;
      name: string;
      fullName: string;
      cloneUrl: string;
      defaultBranch: string;
    };
    templateCloneUrl: string | null;
    starter:
      | { type: 'none' }
      | { type: 'bundle'; downloadUrl: string }
      | { type: 'github-template'; templateRepo: string };
    manifest: ManifestResponse;
    task: TaskResponse;
  }

  /**
   * POST /v1/submissions/prepare
   * Create or reuse a submission attempt for a commit.
   * @auth Required (Bearer token)
   * @body
   */
  export interface PrepareSubmissionRequest {
    projectKey: string;
    commitSha: string;
    repoUrl: string;
    branch: string;
  }

  /**
   * @response 200
   */
  export interface PrepareSubmissionResponse {
    submissionId: string;
    status: 'queued' | 'running' | 'passed' | 'failed' | 'needs_review';
  }

  /**
   * POST /v1/submissions/:submissionId/local-test-result
   * Record the result of a local test run before pushing.
   * @auth Required (Bearer token)
   * @param submissionId
   * @body
   */
  export interface LocalTestResultRequest {
    exitCode: number;
    summary: string;
    ranPrevious?: boolean;
  }

  /**
   * GET /v1/submissions/:submissionId
   * Get the current status of a submission attempt.
   * @auth Required (Bearer token)
   * @param submissionId
   * @response 200
   */
  export interface SubmissionStatusResponse {
    submissionId: string;
    projectKey: string;
    status: 'queued' | 'running' | 'passed' | 'failed' | 'needs_review';
    commitSha: string;
    summary: string | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  /**
   * GET /v1/submissions/:submissionId/stream
   * Stream submission status updates as Server-Sent Events (SSE).
   * @auth Required (Bearer token)
   * @param submissionId
   * @response 200 text/event-stream  — events: { status, summary }
   */
  export interface SubmissionStreamEvent {
    status: 'queued' | 'running' | 'passed' | 'failed' | 'needs_review';
    summary: string | null;
  }

  /**
   * GET /v1/me/submissions
   * List all submissions for the authenticated student (paginated).
   * @auth Required
   * @query PaginationQuery
   * @header X-Total-Count – total submission count
   * @response 200 StudentSubmission[]
   */
  export interface StudentSubmission {
    id: CuidId;
    projectKey: string;
    milestoneId: CuidId | null;
    commitSha: string;
    repoUrl: string;
    branch: string;
    status: 'queued' | 'running' | 'passed' | 'failed' | 'needs_review';
    summary: string | null;
    submissionType: 'github' | 'link' | 'text';
    submissionValue: string | null;
    notes: string | null;
    submittedAt: ISODateString | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
    localTestExitCode: number | null;
  }
}

// ─── Tracking – Courses ───────────────────────────────────────────────────────

export namespace TrackingCourses {
  /**
   * GET /v1/tracking/courses
   * List courses the authenticated user is enrolled in or teaches.
   * @auth Required
   * @query PaginationQuery
   * @response 200 TrackingCourseSummary[]
   */
  export interface CourseSummary {
    id: CuidId;
    slug: string;
    title: string;
    termLabel: string;
    courseCode: string;
    isActive: boolean;
  }

  /**
   * POST /v1/tracking/courses
   * Create a new course. Requires admin or instructor system role.
   * @auth Required (admin or instructor)
   * @body
   */
  export interface CreateCourseRequest {
    slug: string;
    title: string;
    termLabel: string;
    courseCode: string;
  }

  /**
   * GET /v1/tracking/courses/:courseId/members
   * List all members of a course. Instructors and TAs only.
   * @auth Required (instructor or ta in course)
   * @param courseId
   * @response 200 CourseMember[]
   */
  export interface CourseMember {
    id: CuidId;
    courseId: CuidId;
    userId: CuidId;
    username: string;
    githubLogin: string;
    role: 'student' | 'instructor' | 'ta';
    level: number;
    createdAt: ISODateString;
  }

  /**
   * POST /v1/tracking/courses/:courseId/members
   * Add a member to a course by GitHub login.
   * @auth Required (instructor or ta in course)
   * @param courseId
   * @body
   */
  export interface AddMemberRequest {
    githubLogin: string;
    role: 'student' | 'instructor' | 'ta';
  }

  /**
   * DELETE /v1/tracking/courses/:courseId/members/:userId
   * Remove a member from a course.
   * @auth Required (instructor in course)
   * @response 200 { ok: true }
   */

  /**
   * PATCH /v1/tracking/courses/:courseId/members/:userId/level
   * Set a student's academic level / year within the course.
   * @auth Required (instructor or ta in course)
   * @body { level: 1 | 2 | 3 | 4 }
   * @response 200 CourseMember
   */

  /**
   * POST /v1/tracking/courses/:courseId/invites
   * Generate a time-limited invite link for the course.
   * @auth Required (instructor or ta)
   * @body { role: 'student' | 'instructor' | 'ta'; expiresInDays?: number }
   * @response 200
   */
  export interface CreateInviteResponse {
    code: string;
    inviteUrl: string;
  }

  /**
   * GET /v1/tracking/invites/:code
   * Preview a course invite (who is it for, what course).
   * No auth required.
   * @param code Invite code
   * @response 200
   */
  export interface InvitePreview {
    code: string;
    courseTitle: string;
    courseCode: string;
    termLabel: string;
    role: 'student' | 'instructor' | 'ta';
    expiresAt: ISODateString | null;
  }

  /**
   * POST /v1/tracking/invites/:code/join
   * Join a course via invite link.
   * @auth Required
   * @param code Invite code
   * @response 200 { membership: CourseMember }
   */
  export interface JoinCourseResponse {
    membership: CourseMember;
  }

  /**
   * GET /v1/tracking/courses/:courseId/export.csv
   * Export all student submission data for the course as a CSV.
   * Columns: githubLogin, username, milestoneTitle, projectKey, status, submittedAt, commitSha.
   * @auth Required (instructor, ta, or admin)
   * @param courseId
   * @response 200 text/csv
   */
  export type ExportCsvResponse = string; // CSV text

  /**
   * GET /v1/tracking/courses/:courseId/templates
   * List reusable project templates for the course.
   * @auth Required (course member)
   * @param courseId
   * @response 200 ProjectTemplate[]
   */

  /**
   * POST /v1/tracking/courses/:courseId/templates
   * Create a new project template in the course.
   * @auth Required (instructor or ta)
   * @param courseId
   * @response 201 ProjectTemplate
   */

  /**
   * GET /v1/tracking/courses/:courseId/projects
   * List all projects in a course (paginated).
   * @auth Required (course member)
   * @param courseId
   * @query PaginationQuery
   * @response 200 TrackingProjectSummary[]
   */

  /**
   * POST /v1/tracking/courses/:courseId/invites/bulk
   * Generate multiple single-use invite codes in one request (max 50).
   * @auth Required (instructor or ta)
   * @param courseId
   * @body
   */
  export interface BulkCreateInvitesRequest {
    count: number; // 1 – 50
    role?: 'student' | 'ta';
    maxUses?: number;
    expiresAt?: ISODateString;
  }

  export interface BulkCreateInvitesResponse {
    invites: Array<{
      id: CuidId;
      code: string;
      role: string;
      maxUses: number | null;
      expiresAt: ISODateString | null;
      createdAt: ISODateString;
    }>;
  }
}

// ─── Tracking – Projects & Milestones ────────────────────────────────────────

export namespace TrackingProjects {
  /**
   * POST /v1/tracking/projects
   * Create a new project in a course.
   * @auth Required (instructor or ta)
   * @body CreateTrackingProjectRequest
   * @response 201 TrackingProjectSummary
   */

  /**
   * GET /v1/tracking/projects/:projectId
   * Get full project details including milestones and template.
   * @auth Required (course member)
   * @param projectId
   * @response 200
   */
  export interface ProjectDetail {
    id: CuidId;
    projectKey: string;
    courseId: CuidId;
    title: string;
    description: string | null;
    status: 'draft' | 'published' | 'archived';
    level: number;
    deliveryMode: 'individual' | 'team';
    templateId: CuidId | null;
    teamFormationStatus: 'not_started' | 'application_open' | 'team_review' | 'teams_locked';
    applicationOpenAt: ISODateString | null;
    applicationCloseAt: ISODateString | null;
    teamLockAt: ISODateString | null;
    teamSize: number | null;
    gradeWeight: number | null;
    startDate: ISODateString | null;
    endDate: ISODateString | null;
    instructorName: string | null;
    milestones: MilestoneSummary[];
    template: ProjectTemplateSummary | null;
  }

  export interface MilestoneSummary {
    id: CuidId;
    projectId: CuidId;
    title: string;
    description: string | null;
    order: number;
    dueAt: ISODateString | null;
    dueDateLabel: string | null;
    status: string;
    statusLabel: string;
    isFinal: boolean;
  }

  export interface ProjectTemplateSummary {
    id: CuidId;
    slug: string;
    title: string;
    deliveryMode: 'individual' | 'team';
  }

  /**
   * PATCH /v1/tracking/projects/:projectId
   * Update a project's metadata.
   * @auth Required (instructor or ta)
   * @param projectId
   * @body Partial<CreateTrackingProjectRequest>
   * @response 200 TrackingProjectSummary
   */

  /**
   * POST /v1/tracking/projects/:projectId/publish
   * Publish a draft project so students can see it.
   * @auth Required (instructor or ta)
   * @param projectId
   * @response 200 { ok: true, status: 'published' }
   */
  export interface PublishResponse {
    ok: true;
    status: 'published';
  }

  /**
   * POST /v1/tracking/projects/:projectId/unpublish
   * Revert a published project to draft status.
   * @auth Required (instructor or ta)
   * @param projectId
   * @response 200 { ok: true, status: 'draft' }
   */
  export interface UnpublishResponse {
    ok: true;
    status: 'draft';
  }

  /**
   * GET /v1/tracking/templates/:templateId
   * Get full template details (roles, milestones, rubric).
   * @auth Required
   * @param templateId
   * @response 200 ProjectTemplate
   */

  /**
   * PATCH /v1/tracking/templates/:templateId
   * Update a project template.
   * @auth Required (instructor or ta)
   * @param templateId
   * @response 200 ProjectTemplate
   */

  /**
   * GET /v1/tracking/projects/:projectId/milestones
   * List all milestones for a project.
   * @auth Required (course member)
   * @param projectId
   * @response 200 MilestoneSummary[]
   */

  /**
   * POST /v1/tracking/projects/:projectId/milestones
   * Create a new milestone in a project.
   * @auth Required (instructor or ta)
   * @param projectId
   * @body CreateMilestoneRequest
   * @response 201 MilestoneSummary
   */

  /**
   * GET /v1/tracking/milestones/:milestoneId
   * Get milestone details with all submission attempts and reviews.
   * @auth Required (instructor or ta)
   * @param milestoneId
   * @response 200
   */
  export interface MilestoneDetail {
    milestone: MilestoneSummary;
    submissions: SubmissionSummary[];
    reviews: ReviewSummary[];
  }

  export interface SubmissionSummary {
    id: CuidId;
    userId: CuidId;
    status: 'queued' | 'running' | 'passed' | 'failed' | 'needs_review';
    submittedAt: ISODateString | null;
    createdAt: ISODateString;
  }

  export interface ReviewSummary {
    id: CuidId;
    submissionId: CuidId;
    status: 'pending' | 'approved' | 'changes_requested' | 'graded';
    score: number | null;
    reviewedAt: ISODateString | null;
  }

  /**
   * PATCH /v1/tracking/milestones/:milestoneId
   * Update a milestone.
   * @auth Required (instructor or ta)
   * @body Partial<CreateMilestoneRequest>
   * @response 200 MilestoneSummary
   */

  /**
   * DELETE /v1/tracking/milestones/:milestoneId
   * Delete a milestone (only if no submissions exist).
   * @auth Required (instructor or ta)
   * @response 200 { ok: true }
   */
}

// ─── Tracking – Submissions & Reviews ────────────────────────────────────────

export namespace TrackingSubmissions {
  /**
   * GET /v1/tracking/milestones/:milestoneId/submissions
   * List all submissions for a milestone (paginated).
   * @auth Required (instructor, ta, or course member for own submissions)
   * @param milestoneId
   * @query PaginationQuery
   * @header X-Total-Count
   * @response 200 Submission[]
   */
  export interface Submission {
    id: CuidId;
    userId: CuidId;
    submittedByUserId: CuidId | null;
    projectId: CuidId;
    projectKey: string;
    milestoneId: CuidId | null;
    teamId: CuidId | null;
    teamName: string | null;
    teamMemberUserIds: CuidId[];
    commitSha: string;
    repoUrl: string;
    branch: string;
    status: 'queued' | 'running' | 'passed' | 'failed' | 'needs_review';
    summary: string | null;
    submissionType: 'github' | 'link' | 'text';
    submissionValue: string | null;
    notes: string | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
    submittedAt: ISODateString | null;
    localTestExitCode: number | null;
  }

  /**
   * POST /v1/tracking/milestones/:milestoneId/submissions
   * Create a new submission for a milestone.
   * @auth Required (student in course)
   * @param milestoneId
   * @body
   */
  export interface CreateSubmissionRequest {
    submissionType: 'github' | 'link' | 'text';
    submissionValue: string;
    notes?: string;
    repoUrl?: string;
    branch?: string;
    commitSha?: string;
  }

  /**
   * GET /v1/tracking/submissions/:submissionId
   * Get a single submission by ID.
   * @auth Required (submitter, team member, or instructor)
   * @param submissionId
   * @response 200 Submission
   */

  /**
   * PATCH /v1/tracking/submissions/:submissionId
   * Update a submission (e.g. change repo, resubmit).
   * Only allowed before the submission is approved/graded.
   * @auth Required (submitter)
   * @param submissionId
   * @body Partial<CreateSubmissionRequest>
   * @response 200 Submission
   */

  /**
   * GET /v1/tracking/submissions/:submissionId/commits
   * Get GitHub push events (deliveries) linked to this submission.
   * @auth Required (submitter, team member, or instructor)
   * @param submissionId
   * @response 200 GithubDelivery[]
   */
  export interface GithubDelivery {
    id: CuidId;
    submissionId: CuidId;
    repoUrl: string;
    eventType: string; // e.g. "push", "pull_request"
    deliveryId: string;
    ref: string; // e.g. "refs/heads/main"
    commitSha: string;
    payload: Record<string, unknown>;
    receivedAt: ISODateString;
  }

  /**
   * GET /v1/tracking/submissions/:submissionId/review
   * Get the instructor review for a submission.
   * @auth Required (submitter, team member, or instructor)
   * @param submissionId
   * @response 200 Review | 404 if no review yet
   */
  export interface Review {
    id: CuidId;
    submissionId: CuidId;
    reviewerUserId: CuidId | null;
    status: 'pending' | 'approved' | 'changes_requested' | 'graded';
    score: number | null;
    feedback: string;
    rubric: Array<{
      criterion: string;
      maxScore: number;
      earned?: number;
    }>;
    reviewedAt: ISODateString | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
    /** AI grading fields (populated when AI grading is enabled) */
    aiConfidence?: number | null;
    aiNeedsReview?: boolean | null;
    aiReasoningSummary?: string | null;
    aiModel?: string | null;
    aiGradedAt?: ISODateString | null;
    aiCriterionScores?: Array<{
      id: string;
      points: number;
      earned: number;
      justification: string;
    }> | null;
    aiEvidenceQuotes?: string[] | null;
  }

  /**
   * POST /v1/tracking/submissions/:submissionId/review
   * Create or update the instructor review for a submission.
   * @auth Required (instructor or ta)
   * @param submissionId
   * @body
   */
  export interface CreateReviewRequest {
    status: 'pending' | 'approved' | 'changes_requested' | 'graded';
    score?: number;
    feedback?: string;
    rubric?: Array<{
      criterion: string;
      maxScore: number;
      earned?: number;
    }>;
  }

  /**
   * GET /v1/tracking/review-queue
   * Get the instructor's pending review queue (paginated, filterable).
   * @auth Required (instructor or ta)
   * @query
   */
  export interface ReviewQueueQuery extends PaginationQuery {
    courseId?: CuidId;
    projectId?: CuidId;
    status?: 'queued' | 'running' | 'passed' | 'failed' | 'needs_review' | 'cancelled';
  }

  /**
   * @response 200
   */
  export interface ReviewQueueResponse {
    submissions: Submission[];
  }

  /**
   * DELETE /v1/tracking/submissions/:submissionId
   * Cancel a submission that is still in the `queued` state.
   * Returns 409 if the submission is already running, passed, failed, or cancelled.
   * @auth Required (submission owner or admin)
   * @param submissionId
   * @response 200 Submission (with status: 'cancelled')
   * @response 409 Cannot cancel a submission that is not queued
   */
}

// ─── Tracking – Team Formation ────────────────────────────────────────────────

export namespace TrackingTeams {
  /**
   * POST /v1/tracking/projects/:projectId/applications
   * Submit or update a role application for a team project.
   * @auth Required (student in course)
   * @param projectId
   * @body
   */
  export interface CreateApplicationRequest {
    statement?: string;
    availabilityNote?: string;
    preferences: Array<{
      templateRoleId: CuidId;
      rank: number;
    }>;
  }

  /**
   * @response 200 ProjectRoleApplication
   */
  export interface RoleApplication {
    id: CuidId;
    projectId: CuidId;
    userId: CuidId;
    statement: string | null;
    availabilityNote: string | null;
    status: 'submitted' | 'withdrawn';
    submittedAt: ISODateString | null;
    updatedAt: ISODateString;
    preferences: Array<{
      templateRoleId: CuidId;
      roleKey: string;
      roleLabel: string;
      rank: number;
    }>;
  }

  /**
   * GET /v1/tracking/projects/:projectId/applications/me
   * Get the current user's role application for a project.
   * @auth Required (student)
   * @param projectId
   * @response 200 RoleApplication | 404 if no application
   */

  /**
   * GET /v1/tracking/projects/:projectId/applications
   * List all applications for a project.
   * @auth Required (instructor or ta)
   * @param projectId
   * @response 200 RoleApplication[]
   */

  /**
   * POST /v1/tracking/projects/:projectId/team-formation/generate
   * Run the team formation algorithm over submitted applications.
   * Returns a non-destructive suggestion set.
   * @auth Required (instructor or ta)
   * @param projectId
   * @body { algorithmVersion?: string }
   * @response 200 TeamFormationRun
   */
  export interface TeamFormationRun {
    id: CuidId;
    projectId: CuidId;
    algorithmVersion: string;
    config: Record<string, unknown>;
    result: {
      suggestions: Array<{
        name: string;
        members: Array<{
          userId: CuidId;
          username: string;
          level: number;
          roleKey: string;
          roleLabel: string;
        }>;
        averageLevel: number;
      }>;
      waitlist: Array<{
        userId: CuidId;
        username: string;
        level: number;
      }>;
    };
    createdByUserId: CuidId;
    createdAt: ISODateString;
  }

  /**
   * POST /v1/tracking/projects/:projectId/team-formation/lock
   * Lock the suggested teams, creating permanent Team records.
   * Once locked, team formation cannot be re-run.
   * @auth Required (instructor or ta)
   * @param projectId
   * @body { formationRunId?: string }
   * @response 200 Team[]
   */

  /**
   * GET /v1/tracking/projects/:projectId/teams
   * List all teams for a project.
   * @auth Required (course member)
   * @param projectId
   * @response 200 Team[]
   */
  export interface Team {
    id: CuidId;
    projectId: CuidId;
    name: string;
    status: 'suggested' | 'locked';
    lockedAt: ISODateString | null;
    members: TeamMember[];
    repo: TeamRepo | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  export interface TeamMember {
    id: CuidId;
    teamId: CuidId;
    userId: CuidId;
    username: string;
    roleKey: string;
    roleLabel: string;
    status: string;
    createdAt: ISODateString;
  }

  export interface TeamRepo {
    id: CuidId;
    teamId: CuidId;
    owner: string;
    name: string;
    githubRepoId: string | null;
    cloneUrl: string | null;
    defaultBranch: string;
    visibility: string;
    installStatus: string;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  /**
   * PATCH /v1/tracking/projects/:projectId/teams/:teamId
   * Update a team's name or member assignments.
   * @auth Required (instructor or ta)
   * @body
   */
  export interface UpdateTeamRequest {
    name?: string;
    members?: Array<{
      userId: CuidId;
      roleKey: string;
      roleLabel: string;
    }>;
  }
}

// ─── Tracking – Dashboards & Analytics ───────────────────────────────────────

export namespace TrackingDashboards {
  /**
   * GET /v1/tracking/dashboard/home
   * Role-aware home dashboard. Returns student or instructor view
   * depending on the `mode` query param and the user's roles.
   * @auth Required
   * @query { mode?: 'student' | 'instructor' }
   * @response 200 DashboardHomeResponse
   */
  export interface HomeResponse {
    availableModes: Array<'student' | 'instructor'>;
    defaultMode: 'student' | 'instructor';
    student?: StudentDashboard;
    instructor?: InstructorDashboard;
  }

  export interface StudentDashboard {
    courses: CourseSummaryItem[];
    selectedCourseId: CuidId | null;
    attentionItems: AttentionItem[];
    courseSnapshots: CourseSnapshot[];
    submissionHealth: SubmissionHealth;
    recentSubmissions: RecentSubmission[];
    blockers: Blocker[];
  }

  export interface AttentionItem {
    id: string;
    kind: string;
    courseId: CuidId;
    courseTitle: string;
    projectId: CuidId;
    projectTitle: string;
    milestoneId: CuidId | null;
    milestoneTitle: string | null;
    submissionId: CuidId | null;
    statusText: string;
    reason: string;
    dueAt: ISODateString | null;
    submittedAt: ISODateString | null;
    reviewedAt: ISODateString | null;
    cta: { label: string; href: string };
  }

  export interface CourseSnapshot {
    courseId: CuidId;
    courseTitle: string;
    completion: number;
    approved: number;
    underReview: number;
    open: number;
    nextMilestones: MilestoneSnapshot[];
    projects: ProjectSnapshot[];
  }

  export interface MilestoneSnapshot {
    milestoneId: CuidId;
    projectId: CuidId;
    projectTitle: string;
    title: string;
    dueAt: ISODateString | null;
    status: string;
    statusLabel: string;
  }

  export interface ProjectSnapshot {
    projectId: CuidId;
    title: string;
    completion: number;
    approved: number;
    underReview: number;
    open: number;
    minutesRemaining: number | null;
    nextMilestoneTitle: string | null;
    href: string;
  }

  export interface SubmissionHealth {
    failedChecks: number;
    needsReview: number;
    awaitingReview: number;
    recentlyPassed: number;
  }

  export interface RecentSubmission {
    id: CuidId;
    projectKey: string;
    projectTitle: string;
    milestoneTitle: string | null;
    status: string;
    statusLabel: string;
    submittedAt: ISODateString | null;
    createdAt: ISODateString;
    href: string;
  }

  export interface Blocker {
    id: string;
    kind: string;
    title: string;
    body: string;
    cta: { label: string; href: string };
  }

  export interface InstructorDashboard {
    reviewSummary: ReviewSummary;
    urgentQueue: UrgentQueueItem[];
    courseSummaries: InstructorCourseSummary[];
    recentActivity: ActivityItem[];
    operations: Operation[];
  }

  export interface ReviewSummary {
    totalAwaitingReview: number;
    oldestWaitingMinutes: number | null;
    submittedLast24Hours: number;
    byCourse: Array<{
      courseId: CuidId;
      courseTitle: string;
      pendingReviewCount: number;
    }>;
  }

  export interface UrgentQueueItem {
    submissionId: CuidId;
    courseId: CuidId;
    courseTitle: string;
    projectId: CuidId;
    projectTitle: string;
    projectKey: string;
    studentName: string;
    status: string;
    submittedAt: ISODateString;
    waitingMinutes: number;
    cta: { label: string; href: string };
  }

  export interface InstructorCourseSummary {
    courseId: CuidId;
    title: string;
    courseCode: string;
    termLabel: string;
    pendingReviewCount: number;
    publishedProjectCount: number;
    memberCount: number;
    lastActivityAt: ISODateString | null;
  }

  export interface ActivityItem {
    id: CuidId;
    action: string;
    summary: string;
    createdAt: ISODateString;
    courseId: CuidId | null;
    courseTitle: string | null;
    href: string | null;
  }

  export interface Operation {
    id: string;
    label: string;
    description: string;
    href: string;
  }

  export interface CourseSummaryItem {
    id: CuidId;
    title: string;
    termLabel: string;
    courseCode: string;
    isActive: boolean;
  }

  /**
   * GET /v1/tracking/dashboard/student
   * Detailed student project dashboard for a specific course.
   * @auth Required (student)
   * @query { courseId?: string }
   * @response 200 StudentProjectsDashboardResponse
   */

  /**
   * GET /v1/tracking/dashboard/instructor
   * Instructor overview dashboard across all courses.
   * @auth Required (instructor or ta)
   * @response 200 InstructorDashboardResponse
   */

  /**
   * GET /v1/tracking/dashboard/course/:courseId
   * Course-level dashboard with full stats for a single course.
   * @auth Required (instructor, ta, or admin)
   * @param courseId
   * @response 200 InstructorDashboardResponse
   */

  /**
   * GET /v1/tracking/analytics/student
   * Per-course, per-project, per-milestone submission analytics
   * for the authenticated student.
   * @auth Required (student)
   * @query { courseId?: string }
   * @response 200
   */
  export interface StudentAnalyticsResponse {
    userId: CuidId;
    analytics: CourseAnalytics[];
  }

  export interface CourseAnalytics {
    courseId: CuidId;
    courseTitle: string;
    projects: ProjectAnalytics[];
  }

  export interface ProjectAnalytics {
    projectId: CuidId;
    projectTitle: string;
    totalMilestones: number;
    submittedMilestones: number;
    passedMilestones: number;
    milestones: MilestoneAnalytics[];
  }

  export interface MilestoneAnalytics {
    milestoneId: CuidId;
    milestoneTitle: string;
    dueAt: ISODateString | null;
    submissionCount: number;
    latestStatus: 'queued' | 'running' | 'passed' | 'failed' | 'needs_review' | null;
    latestSubmittedAt: ISODateString | null;
  }

  /**
   * GET /v1/tracking/activity
   * Activity feed for the current user (recent events in their courses).
   * @auth Required
   * @response 200 ActivityEvent[]
   */
  export interface ActivityEvent {
    id: CuidId;
    actorUserId: CuidId | null;
    courseId: CuidId | null;
    projectId: CuidId | null;
    milestoneId: CuidId | null;
    submissionId: CuidId | null;
    action: string;
    summary: string;
    createdAt: ISODateString;
  }

  /**
   * GET /v1/analytics/overview?range=7d|30d|90d|term|custom&from=&to=
   * Cross-course KPIs, daily series, rising topics, and flagged cohorts.
   * @auth Required (instructor, ta, or admin)
   */
  export interface AnalyticsOverviewResponse {
    kpis: {
      activeStudents: number;
      activeStudentsDelta: number;
      submissionsThisWeek: number;
      submissionsDelta: number;
      passRate: number;
      passRateDelta: number;
      medianGrade: number;
    };
    series: {
      submissions: Array<{ date: string; value: number }>;
      passRate: Array<{ date: string; value: number }>;
    };
    topRisingTopics: Array<{ topic: string; delta: number }>;
    flaggedCohorts: Array<{ cohort: string; reason: string }>;
    meta?: { hasActivity: boolean };
  }

  /**
   * GET /v1/tracking/analytics/instructor?courseId=<required>
   * Per-milestone and per-student submission analytics for an instructor.
   * @auth Required (instructor or ta for the given course)
   * @query { courseId: string }
   * @response 200
   */
  export interface InstructorAnalyticsResponse {
    courseId: CuidId;
    totalStudents: number;
    submissionCount: number;
    passRate: number; // 0–1
    milestones: InstructorMilestoneAnalytics[];
    students: InstructorStudentProgress[];
  }

  export interface InstructorMilestoneAnalytics {
    milestoneId: CuidId;
    milestoneTitle: string;
    projectTitle: string;
    dueAt: ISODateString | null;
    totalSubmissions: number;
    passedCount: number;
    failedCount: number;
    needsReviewCount: number;
    passRate: number; // 0–1
  }

  export interface InstructorStudentProgress {
    userId: CuidId;
    username: string;
    githubLogin: string | null;
    milestoneStatuses: Array<{
      milestoneId: CuidId;
      status: 'passed' | 'failed' | 'needs_review' | 'queued' | 'running' | 'not_submitted';
      submittedAt: ISODateString | null;
    }>;
    passedCount: number;
    totalMilestones: number;
    completionRate: number; // 0–1
  }
}

// ─── Programs ─────────────────────────────────────────────────────────────────

export namespace Programs {
  /**
   * GET /v1/programs
   * List all published academic programs.
   * @auth Required
   * @response 200 ProgramSummary[]
   */
  export interface ProgramSummary {
    id: CuidId;
    slug: string;
    title: string;
    code: string;
    academicYear: string;
    totalUnitRequirement: number;
    status: 'draft' | 'published' | 'archived';
    activeVersionId: CuidId | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  /**
   * POST /v1/programs
   * Create a new academic program. Requires program manager role.
   * @auth Required (program manager)
   * @body
   */
  export interface CreateProgramRequest {
    slug: string;
    title: string;
    code: string;
    academicYear: string;
    totalUnitRequirement?: number;
    status?: 'draft' | 'published' | 'archived';
  }

  /**
   * GET /v1/programs/:programId/versions/:versionId
   * Get the full detail of a program version (tracks, requirements, catalog).
   * @auth Required
   * @param programId
   * @param versionId
   * @response 200 ProgramVersionDetail
   */
  export interface ProgramVersionDetail {
    program: ProgramSummary;
    version: VersionSummary;
    tracks: TrackSummary[];
    catalogCourses: CatalogCourse[];
    requirementGroups: RequirementGroup[];
  }

  export interface VersionSummary {
    id: CuidId;
    programId: CuidId;
    versionLabel: string;
    effectiveFrom: ISODateString | null;
    effectiveTo: ISODateString | null;
    isActive: boolean;
    policyText: string | null;
    trackSelectionMinYear: number | null;
    durationYears: number | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  export interface TrackSummary {
    id: CuidId;
    programVersionId: CuidId;
    slug: string;
    title: string;
    description: string | null;
    selectionYearStart: number | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  export interface CatalogCourse {
    id: CuidId;
    programId: CuidId;
    subjectCode: string;
    catalogNumber: string;
    title: string;
    defaultUnits: number;
    department: string;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  export interface RequirementGroup {
    id: CuidId;
    programVersionId: CuidId;
    trackId: CuidId | null;
    title: string;
    category: 'foundation' | 'core' | 'depth' | 'elective' | 'capstone' | 'policy';
    minUnits: number | null;
    minCourses: number | null;
    notes: string | null;
    sortOrder: number | null;
    noDoubleCount: boolean | null;
    rules?: RequirementRule[];
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  export interface RequirementRule {
    id: CuidId;
    requirementGroupId: CuidId;
    ruleType: 'required' | 'choose_n' | 'elective_pool' | 'track_gate';
    pickCount: number | null;
    note: string | null;
    sortOrder: number | null;
    courses?: Array<{ id: CuidId; requirementRuleId: CuidId; catalogCourseId: CuidId }>;
  }

  /**
   * POST /v1/programs/:programId/versions
   * Create a new version of a program.
   * @auth Required (program manager)
   * @param programId
   * @response 201 VersionSummary
   */

  /**
   * POST /v1/programs/:programId/catalog-courses
   * Add a course to the program's catalog.
   * @auth Required (program manager)
   * @param programId
   * @response 201 CatalogCourse
   */

  /**
   * POST /v1/programs/:programId/requirement-groups
   * Create a requirement group in a program version.
   * @auth Required (program manager)
   * @param programId
   * @response 201 RequirementGroup
   */

  /**
   * PATCH /v1/programs/:programId/requirement-groups/:groupId
   * Update a requirement group.
   * @auth Required (program manager)
   * @param programId
   * @param groupId
   * @response 200 RequirementGroup
   */

  /**
   * POST /v1/programs/:programId/tracks
   * Create a specialization track in a program version.
   * @auth Required (program manager)
   * @param programId
   * @response 201 TrackSummary
   */

  /**
   * PATCH /v1/programs/:programId/tracks/:trackId
   * Update a specialization track.
   * @auth Required (program manager)
   * @response 200 TrackSummary
   */

  // ── Student program endpoints ──────────────────────────────────────────────

  /**
   * POST /v1/programs/:programId/enroll
   * Enroll the authenticated student in a program.
   * @auth Required (student)
   * @param programId
   * @response 200 StudentProgramPlan
   */

  /**
   * GET /v1/programs/student/me
   * Get the current student's full program plan.
   * @auth Required (student)
   * @response 200 StudentProgramPlan
   */
  export interface StudentProgramPlan {
    id: CuidId;
    userId: CuidId;
    program: ProgramSummary;
    version: VersionSummary;
    selectedTrack: TrackSummary | null;
    availableTracks: TrackSummary[];
    status:
      | 'enrolled'
      | 'track_selected'
      | 'submitted_for_advisor'
      | 'advisor_approved'
      | 'department_approved';
    isLocked: boolean;
    canSelectTrack: boolean;
    catalogCourses: CatalogCourse[];
    requirementGroups: RequirementGroup[];
    plannedCourses: PlannedCourse[];
    decisions: RequirementDecision[];
    petitions: Petition[];
    approvals: ProgramApproval[];
    latestSheet: ProgramSheetSnapshot | null;
  }

  export interface PlannedCourse {
    id: CuidId;
    studentProgramId: CuidId;
    catalogCourseId: CuidId;
    plannedYear: number;
    plannedTerm: 'fall' | 'spring';
    sourceType: 'standard' | 'transfer' | 'petition' | 'manual';
    note: string | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  export interface RequirementDecision {
    id: CuidId;
    studentProgramId: CuidId;
    requirementGroupId: CuidId;
    status: 'pending' | 'satisfied' | 'waived' | 'petition_pending';
    sourceType: string | null;
    notes: string | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  export interface Petition {
    id: CuidId;
    studentProgramId: CuidId;
    type: 'transfer_credit' | 'substitution' | 'waiver';
    status: 'pending_advisor' | 'pending_department' | 'approved' | 'rejected';
    justification: string;
    targetRequirementGroupId: CuidId | null;
    submittedByUserId: CuidId;
    reviewerUserId: CuidId | null;
    reviewerNotes: string | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
    courseLinks?: Array<{
      id: CuidId;
      petitionId: CuidId;
      originalCatalogCourseId: CuidId | null;
      substituteCatalogCourseId: CuidId | null;
    }>;
  }

  export interface ProgramApproval {
    id: CuidId;
    studentProgramId: CuidId;
    stage: 'advisor' | 'department';
    status: 'pending' | 'approved' | 'rejected';
    reviewerUserId: CuidId | null;
    notes: string | null;
    decidedAt: ISODateString | null;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  export interface ProgramSheetSnapshot {
    generatedAt: ISODateString;
  }

  /**
   * PATCH /v1/programs/student/me/plan
   * Update the student's planned courses (drag-and-drop planner state).
   * @auth Required (student)
   * @body
   */
  export interface UpdatePlanRequest {
    plannedCourses: Array<{
      catalogCourseId: CuidId;
      plannedYear: number;
      plannedTerm: 'fall' | 'spring';
      sourceType?: 'standard' | 'transfer' | 'petition' | 'manual';
      note?: string;
    }>;
  }

  /**
   * GET /v1/programs/student/me/recommend-track
   * Get track recommendations based on the student's Year 1 planned courses.
   * Score is based on unit overlap with track requirements.
   * @auth Required (student)
   * @response 200
   */
  export interface TrackRecommendationResponse {
    recommendations: TrackRecommendation[];
    year1CourseCount: number;
  }

  export interface TrackRecommendation {
    trackId: CuidId;
    trackTitle: string;
    trackSlug: string;
    trackDescription: string | null;
    matchScore: number; // 0.0–1.0
    matchedUnits: number;
    totalTrackUnits: number;
    matchedCourseCount: number;
    reason: string;
  }

  /**
   * POST /v1/programs/student/me/select-track
   * Select a specialization track for the student's program.
   * @auth Required (student)
   * @body { trackId: string }
   * @response 200 StudentProgramPlan
   */

  /**
   * GET /v1/programs/student/me/sheet
   * Get the printable program sheet view for the current student.
   * @auth Required (student)
   * @response 200 ProgramSheetView
   */
  export interface ProgramSheetView {
    studentProgramId: CuidId;
    student: {
      id: CuidId;
      username: string;
      email: string;
      yearLevel: number;
    };
    program: ProgramSummary;
    version: VersionSummary;
    selectedTrack: TrackSummary | null;
    status: string;
    isLocked: boolean;
    canSelectTrack: boolean;
    generatedAt: ISODateString | null;
    policyText: string | null;
    sections: SheetSection[];
    petitions: Petition[];
    approvals: ProgramApproval[];
  }

  export interface SheetSection {
    requirementGroupId: CuidId;
    title: string;
    category: string;
    minUnits: number;
    minCourses: number;
    notes: string | null;
    matchedCourses: Array<{
      plannedCourseId: CuidId;
      catalogCourseId: CuidId;
      subjectCode: string;
      catalogNumber: string;
      title: string;
      units: number;
      plannedYear: number;
      plannedTerm: 'fall' | 'spring';
      sourceType: string;
    }>;
    usedUnits: number;
    usedCourses: number;
    status: string;
  }

  /**
   * POST /v1/programs/student/me/generate-sheet
   * Generate and snapshot the printable program sheet.
   * @auth Required (student)
   * @response 200 ProgramSheetView
   */

  /**
   * POST /v1/programs/student/me/petitions
   * Submit a petition (transfer credit, substitution, or waiver).
   * @auth Required (student)
   * @body
   */
  export interface CreatePetitionRequest {
    type: 'transfer_credit' | 'substitution' | 'waiver';
    justification: string;
    targetRequirementGroupId?: CuidId;
    originalCatalogCourseId?: CuidId;
    substituteCatalogCourseId?: CuidId;
  }

  /**
   * GET /v1/programs/student/me/petitions
   * List the current student's petitions.
   * @auth Required (student)
   * @response 200 Petition[]
   */

  /**
   * GET /v1/programs/:programId/petitions
   * List all petitions for a program. Program managers only.
   * @auth Required (program manager)
   * @param programId
   * @response 200 Petition[]
   */

  /**
   * PATCH /v1/programs/:programId/petitions/:petitionId
   * Update a petition's status (approve/reject).
   * @auth Required (program manager)
   * @body { status: PetitionStatus; reviewerNotes?: string }
   * @response 200 Petition
   */

  /**
   * POST /v1/programs/:programId/approvals/:studentProgramId/advisor
   * Record advisor approval for a student's program plan.
   * @auth Required (program manager)
   * @body { status: 'approved' | 'rejected'; notes?: string }
   * @response 200 ProgramApproval
   */

  /**
   * POST /v1/programs/:programId/approvals/:studentProgramId/department
   * Record department approval for a student's program plan.
   * @auth Required (program manager)
   * @body { status: 'approved' | 'rejected'; notes?: string }
   * @response 200 ProgramApproval
   */
}

// ─── Notifications ────────────────────────────────────────────────────────────

export namespace Notifications {
  export type NotificationType = 'feedback' | 'passed' | 'failed' | 'review' | string;

  export interface Notification {
    id: CuidId;
    type: NotificationType;
    title: string;
    body: string;
    link: string | null;
    read: boolean;
    createdAt: ISODateString;
  }

  /**
   * GET /v1/notifications
   * List the latest 50 notifications for the authenticated user.
   * @auth Required
   * @response 200
   */
  export interface ListResponse {
    notifications: Notification[];
  }

  /**
   * GET /v1/notifications/count
   * Count unread notifications for the authenticated user.
   * @auth Required
   * @response 200
   */
  export interface CountResponse {
    count: number;
  }

  /**
   * POST /v1/notifications/read-all
   * Mark all notifications as read for the authenticated user.
   * @auth Required
   * @response 200 { ok: true }
   */
  export interface ReadAllResponse {
    ok: true;
  }

  /**
   * PATCH /v1/notifications/:id/read
   * Mark a single notification as read.
   * @auth Required
   * @param id  Notification CUID
   * @response 200 { ok: true }
   * @response 404 Notification not found or belongs to another user
   */
  export interface MarkReadResponse {
    ok: true;
  }

  /**
   * GET /v1/notifications/preferences
   * List all notification type preferences for the authenticated user.
   * Types not present default to enabled (opt-out model).
   * @auth Required
   * @response 200
   */
  export interface PreferencesResponse {
    preferences: NotificationPreference[];
  }

  export interface NotificationPreference {
    id: CuidId;
    userId: CuidId;
    type: string;
    enabled: boolean;
    createdAt: ISODateString;
    updatedAt: ISODateString;
  }

  /**
   * PATCH /v1/notifications/preferences/:type
   * Enable or disable a notification type for the authenticated user.
   * Creates the preference record if it does not exist (upsert).
   * @auth Required
   * @param type  Notification type string, e.g. "feedback", "review_ready"
   * @body { enabled: boolean }
   * @response 200
   */
  export interface UpsertPreferenceResponse {
    preference: NotificationPreference;
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export namespace Admin {
  /**
   * GET /v1/admin/submissions
   * List all submissions platform-wide (filterable).
   * @auth Required (admin)
   * @query
   */
  export type SubmissionStatus =
    | 'queued'
    | 'running'
    | 'passed'
    | 'failed'
    | 'needs_review'
    | 'cancelled';

  export interface SubmissionsQuery {
    status?: SubmissionStatus;
    projectId?: CuidId;
  }

  /**
   * PATCH /v1/admin/submissions/:submissionId/status
   * Override a submission's verification status.
   * @auth Required (admin)
   * @param submissionId
   * @body
   */
  export interface OverrideStatusRequest {
    status: 'passed' | 'failed' | 'needs_review';
    summary?: string;
  }

  /**
   * GET /v1/admin/submissions/:submissionId/logs
   * Retrieve verification logs for a submission.
   * @auth Required (admin)
   * @param submissionId
   * @response 200 { logs: string }
   */
  export interface SubmissionLogsResponse {
    logs: string;
  }

  /**
   * POST /v1/admin/submissions/:submissionId/retry
   * Re-queue a submission for fresh verification.
   * @auth Required (admin)
   * @param submissionId
   * @response 200 { ok: true, status: 'queued' }
   */
  export interface RetryResponse {
    ok: true;
    status: 'queued';
  }

  /**
   * GET /v1/admin/projects
   * List all projects across all courses.
   * @auth Required (admin)
   * @response 200 TrackingProjectSummary[]
   */

  /**
   * DELETE /v1/admin/courses/:courseId
   * Permanently delete a course and all its data.
   * IRREVERSIBLE. Use with caution.
   * @auth Required (admin)
   * @param courseId
   * @response 200 { ok: true }
   */

  /**
   * POST /v1/admin/projects/:projectId/archive
   * Archive a project (students can no longer submit).
   * @auth Required (admin)
   * @param projectId
   * @response 200 { ok: true, status: 'archived' }
   */

  /**
   * GET /v1/admin/users
   * List all platform users.
   * @auth Required (admin)
   * @response 200 UserRecord[]
   */
  export interface UserRecord {
    id: CuidId;
    username: string;
    email: string;
    githubLogin: string | null;
    githubLinked: boolean;
    githubAppInstalled: boolean;
    systemRole: 'user' | 'admin';
    yearLevel: number;
  }

  /**
   * PATCH /v1/admin/users/:userId/role
   * Promote or demote a user's system role.
   * @auth Required (admin)
   * @param userId
   * @body { role: 'user' | 'admin' }
   * @response 200 UserRecord
   */

  /**
   * GET /v1/admin/students
   * List all students with their global year level.
   * @auth Required (admin)
   * @response 200 StudentRecord[]
   */
  export interface StudentRecord {
    userId: CuidId;
    username: string;
    githubLogin: string;
    yearLevel: number;
  }

  /**
   * PATCH /v1/admin/students/:userId/year
   * Set a student's global academic year level (1–4).
   * @auth Required (admin)
   * @param userId
   * @body { yearLevel: 1 | 2 | 3 | 4 }
   * @response 200 StudentRecord
   */

  /**
   * GET /v1/admin/audit-logs
   * Read the platform audit log with optional filters and cursor pagination.
   * @auth Required (admin)
   * @query
   */
  export interface AuditLogsQuery {
    action?: string;
    targetType?: string;
    courseId?: CuidId;
    userId?: CuidId;
    fromDate?: ISODateString;
    toDate?: ISODateString;
    limit?: number; // default 50, max 200
    offset?: number;
  }

  export interface AuditLogEntry {
    id: CuidId;
    action: string;
    targetType: string;
    targetId: string;
    userId: CuidId | null;
    courseId: CuidId | null;
    metadata: Record<string, unknown>;
    createdAt: ISODateString;
  }

  export interface AuditLogsResponse {
    logs: AuditLogEntry[];
    total: number;
  }

  /**
   * POST /v1/admin/submissions/bulk-retry
   * Re-queue multiple submissions for fresh verification in a single call.
   * @auth Required (admin)
   * @body { submissionIds: CuidId[] }
   * @response 200
   */
  export interface BulkRetryRequest {
    submissionIds: CuidId[];
  }

  export interface BulkRetryResponse {
    ok: true;
    queued: number;
    skipped: number;
  }
}

// ─── Endpoint registry (for tooling / codegen) ────────────────────────────────

/**
 * Complete list of all Nibras API endpoints.
 * Grouped by feature. Used for codegen, OpenAPI, and documentation tooling.
 */
export const API_ENDPOINTS = [
  // System
  { method: 'GET', path: '/healthz', auth: false, tag: 'system' },
  { method: 'GET', path: '/readyz', auth: false, tag: 'system' },
  { method: 'GET', path: '/metrics', auth: false, tag: 'system' },
  { method: 'GET', path: '/v1/health', auth: false, tag: 'system' },
  { method: 'GET', path: '/v1/ping', auth: false, tag: 'system' },
  // Auth
  { method: 'POST', path: '/v1/device/start', auth: false, tag: 'auth' },
  { method: 'POST', path: '/v1/device/poll', auth: false, tag: 'auth' },
  { method: 'POST', path: '/v1/device/authorize', auth: true, tag: 'auth' },
  { method: 'GET', path: '/v1/github/oauth/start', auth: false, tag: 'auth' },
  { method: 'GET', path: '/v1/github/oauth/callback', auth: false, tag: 'auth' },
  { method: 'POST', path: '/v1/auth/refresh', auth: false, tag: 'auth' },
  { method: 'POST', path: '/v1/logout', auth: true, tag: 'auth' },
  { method: 'GET', path: '/v1/me', auth: true, tag: 'auth' },
  { method: 'GET', path: '/v1/web/session', auth: true, tag: 'auth' },
  { method: 'POST', path: '/v1/web/logout', auth: true, tag: 'auth' },
  { method: 'DELETE', path: '/v1/me/account', auth: true, tag: 'auth' },
  // GitHub
  { method: 'GET', path: '/v1/github/config', auth: false, tag: 'github' },
  { method: 'GET', path: '/v1/github/install-url', auth: true, tag: 'github' },
  { method: 'POST', path: '/v1/github/setup/complete', auth: true, tag: 'github' },
  { method: 'POST', path: '/v1/github/repositories/validate', auth: true, tag: 'github' },
  { method: 'POST', path: '/v1/github/webhooks', auth: false, tag: 'github' },
  // Projects (CLI)
  { method: 'GET', path: '/v1/projects/:projectKey/manifest', auth: true, tag: 'projects' },
  { method: 'GET', path: '/v1/projects/:projectKey/task', auth: true, tag: 'projects' },
  { method: 'GET', path: '/v1/projects/:projectKey/starter-bundle', auth: true, tag: 'projects' },
  { method: 'POST', path: '/v1/projects/:projectKey/setup', auth: true, tag: 'projects' },
  { method: 'POST', path: '/v1/submissions/prepare', auth: true, tag: 'projects' },
  {
    method: 'POST',
    path: '/v1/submissions/:submissionId/local-test-result',
    auth: true,
    tag: 'projects',
  },
  { method: 'GET', path: '/v1/submissions/:submissionId', auth: true, tag: 'projects' },
  { method: 'GET', path: '/v1/submissions/:submissionId/stream', auth: true, tag: 'projects' },
  { method: 'GET', path: '/v1/me/submissions', auth: true, tag: 'projects' },
  // Tracking – courses
  { method: 'GET', path: '/v1/tracking/courses', auth: true, tag: 'tracking' },
  { method: 'POST', path: '/v1/tracking/courses', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/courses/:courseId/members', auth: true, tag: 'tracking' },
  { method: 'POST', path: '/v1/tracking/courses/:courseId/members', auth: true, tag: 'tracking' },
  {
    method: 'DELETE',
    path: '/v1/tracking/courses/:courseId/members/:userId',
    auth: true,
    tag: 'tracking',
  },
  {
    method: 'PATCH',
    path: '/v1/tracking/courses/:courseId/members/:userId/level',
    auth: true,
    tag: 'tracking',
  },
  { method: 'POST', path: '/v1/tracking/courses/:courseId/invites', auth: true, tag: 'tracking' },
  {
    method: 'POST',
    path: '/v1/tracking/courses/:courseId/invites/bulk',
    auth: true,
    tag: 'tracking',
  },
  { method: 'GET', path: '/v1/tracking/invites/:code', auth: false, tag: 'tracking' },
  { method: 'POST', path: '/v1/tracking/invites/:code/join', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/courses/:courseId/templates', auth: true, tag: 'tracking' },
  { method: 'POST', path: '/v1/tracking/courses/:courseId/templates', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/courses/:courseId/projects', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/courses/:courseId/export.csv', auth: true, tag: 'tracking' },
  // Tracking – projects & milestones
  { method: 'POST', path: '/v1/tracking/projects', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/projects/:projectId', auth: true, tag: 'tracking' },
  { method: 'PATCH', path: '/v1/tracking/projects/:projectId', auth: true, tag: 'tracking' },
  { method: 'POST', path: '/v1/tracking/projects/:projectId/publish', auth: true, tag: 'tracking' },
  {
    method: 'POST',
    path: '/v1/tracking/projects/:projectId/unpublish',
    auth: true,
    tag: 'tracking',
  },
  { method: 'GET', path: '/v1/tracking/templates/:templateId', auth: true, tag: 'tracking' },
  { method: 'PATCH', path: '/v1/tracking/templates/:templateId', auth: true, tag: 'tracking' },
  {
    method: 'GET',
    path: '/v1/tracking/projects/:projectId/milestones',
    auth: true,
    tag: 'tracking',
  },
  {
    method: 'POST',
    path: '/v1/tracking/projects/:projectId/milestones',
    auth: true,
    tag: 'tracking',
  },
  { method: 'GET', path: '/v1/tracking/milestones/:milestoneId', auth: true, tag: 'tracking' },
  { method: 'PATCH', path: '/v1/tracking/milestones/:milestoneId', auth: true, tag: 'tracking' },
  { method: 'DELETE', path: '/v1/tracking/milestones/:milestoneId', auth: true, tag: 'tracking' },
  // Tracking – submissions & reviews
  {
    method: 'GET',
    path: '/v1/tracking/milestones/:milestoneId/submissions',
    auth: true,
    tag: 'tracking',
  },
  {
    method: 'POST',
    path: '/v1/tracking/milestones/:milestoneId/submissions',
    auth: true,
    tag: 'tracking',
  },
  { method: 'GET', path: '/v1/tracking/submissions/:submissionId', auth: true, tag: 'tracking' },
  { method: 'PATCH', path: '/v1/tracking/submissions/:submissionId', auth: true, tag: 'tracking' },
  { method: 'DELETE', path: '/v1/tracking/submissions/:submissionId', auth: true, tag: 'tracking' },
  {
    method: 'GET',
    path: '/v1/tracking/submissions/:submissionId/commits',
    auth: true,
    tag: 'tracking',
  },
  {
    method: 'GET',
    path: '/v1/tracking/submissions/:submissionId/review',
    auth: true,
    tag: 'tracking',
  },
  {
    method: 'POST',
    path: '/v1/tracking/submissions/:submissionId/review',
    auth: true,
    tag: 'tracking',
  },
  { method: 'GET', path: '/v1/tracking/review-queue', auth: true, tag: 'tracking' },
  // Tracking – teams
  {
    method: 'POST',
    path: '/v1/tracking/projects/:projectId/applications',
    auth: true,
    tag: 'tracking',
  },
  {
    method: 'GET',
    path: '/v1/tracking/projects/:projectId/applications/me',
    auth: true,
    tag: 'tracking',
  },
  {
    method: 'GET',
    path: '/v1/tracking/projects/:projectId/applications',
    auth: true,
    tag: 'tracking',
  },
  {
    method: 'POST',
    path: '/v1/tracking/projects/:projectId/team-formation/generate',
    auth: true,
    tag: 'tracking',
  },
  {
    method: 'POST',
    path: '/v1/tracking/projects/:projectId/team-formation/lock',
    auth: true,
    tag: 'tracking',
  },
  { method: 'GET', path: '/v1/tracking/projects/:projectId/teams', auth: true, tag: 'tracking' },
  {
    method: 'PATCH',
    path: '/v1/tracking/projects/:projectId/teams/:teamId',
    auth: true,
    tag: 'tracking',
  },
  // Tracking – dashboards & analytics
  { method: 'GET', path: '/v1/tracking/dashboard/home', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/dashboard/student', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/dashboard/instructor', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/dashboard/course/:courseId', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/analytics/student', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/tracking/analytics/instructor', auth: true, tag: 'tracking' },
  { method: 'GET', path: '/v1/analytics/overview', auth: true, tag: 'analytics' },
  { method: 'GET', path: '/v1/analytics/courses', auth: true, tag: 'analytics' },
  { method: 'GET', path: '/v1/analytics/students', auth: true, tag: 'analytics' },
  { method: 'GET', path: '/v1/analytics/engagement', auth: true, tag: 'analytics' },
  { method: 'GET', path: '/v1/tracking/activity', auth: true, tag: 'tracking' },
  // Programs
  { method: 'GET', path: '/v1/programs', auth: true, tag: 'programs' },
  { method: 'POST', path: '/v1/programs', auth: true, tag: 'programs' },
  {
    method: 'GET',
    path: '/v1/programs/:programId/versions/:versionId',
    auth: true,
    tag: 'programs',
  },
  { method: 'POST', path: '/v1/programs/:programId/versions', auth: true, tag: 'programs' },
  { method: 'POST', path: '/v1/programs/:programId/catalog-courses', auth: true, tag: 'programs' },
  {
    method: 'POST',
    path: '/v1/programs/:programId/requirement-groups',
    auth: true,
    tag: 'programs',
  },
  {
    method: 'PATCH',
    path: '/v1/programs/:programId/requirement-groups/:groupId',
    auth: true,
    tag: 'programs',
  },
  { method: 'POST', path: '/v1/programs/:programId/tracks', auth: true, tag: 'programs' },
  { method: 'PATCH', path: '/v1/programs/:programId/tracks/:trackId', auth: true, tag: 'programs' },
  { method: 'POST', path: '/v1/programs/:programId/enroll', auth: true, tag: 'programs' },
  { method: 'GET', path: '/v1/programs/student/me', auth: true, tag: 'programs' },
  { method: 'PATCH', path: '/v1/programs/student/me/plan', auth: true, tag: 'programs' },
  { method: 'GET', path: '/v1/programs/student/me/recommend-track', auth: true, tag: 'programs' },
  { method: 'POST', path: '/v1/programs/student/me/select-track', auth: true, tag: 'programs' },
  { method: 'GET', path: '/v1/programs/student/me/sheet', auth: true, tag: 'programs' },
  { method: 'POST', path: '/v1/programs/student/me/generate-sheet', auth: true, tag: 'programs' },
  { method: 'POST', path: '/v1/programs/student/me/petitions', auth: true, tag: 'programs' },
  { method: 'GET', path: '/v1/programs/student/me/petitions', auth: true, tag: 'programs' },
  { method: 'GET', path: '/v1/programs/:programId/petitions', auth: true, tag: 'programs' },
  {
    method: 'PATCH',
    path: '/v1/programs/:programId/petitions/:petitionId',
    auth: true,
    tag: 'programs',
  },
  {
    method: 'POST',
    path: '/v1/programs/:programId/approvals/:studentProgramId/advisor',
    auth: true,
    tag: 'programs',
  },
  {
    method: 'POST',
    path: '/v1/programs/:programId/approvals/:studentProgramId/department',
    auth: true,
    tag: 'programs',
  },
  // Notifications
  { method: 'GET', path: '/v1/notifications', auth: true, tag: 'notifications' },
  { method: 'GET', path: '/v1/notifications/count', auth: true, tag: 'notifications' },
  { method: 'POST', path: '/v1/notifications/read-all', auth: true, tag: 'notifications' },
  { method: 'PATCH', path: '/v1/notifications/:id/read', auth: true, tag: 'notifications' },
  { method: 'GET', path: '/v1/notifications/preferences', auth: true, tag: 'notifications' },
  {
    method: 'PATCH',
    path: '/v1/notifications/preferences/:type',
    auth: true,
    tag: 'notifications',
  },
  // Admin
  { method: 'GET', path: '/v1/admin/submissions', auth: true, tag: 'admin' },
  { method: 'PATCH', path: '/v1/admin/submissions/:submissionId/status', auth: true, tag: 'admin' },
  { method: 'GET', path: '/v1/admin/submissions/:submissionId/logs', auth: true, tag: 'admin' },
  { method: 'POST', path: '/v1/admin/submissions/:submissionId/retry', auth: true, tag: 'admin' },
  { method: 'POST', path: '/v1/admin/submissions/bulk-retry', auth: true, tag: 'admin' },
  { method: 'GET', path: '/v1/admin/audit-logs', auth: true, tag: 'admin' },
  { method: 'GET', path: '/v1/admin/projects', auth: true, tag: 'admin' },
  { method: 'DELETE', path: '/v1/admin/courses/:courseId', auth: true, tag: 'admin' },
  { method: 'POST', path: '/v1/admin/projects/:projectId/archive', auth: true, tag: 'admin' },
  { method: 'GET', path: '/v1/admin/users', auth: true, tag: 'admin' },
  { method: 'PATCH', path: '/v1/admin/users/:userId/role', auth: true, tag: 'admin' },
  { method: 'GET', path: '/v1/admin/students', auth: true, tag: 'admin' },
  { method: 'PATCH', path: '/v1/admin/students/:userId/year', auth: true, tag: 'admin' },
] as const;

export type ApiEndpoint = (typeof API_ENDPOINTS)[number];
export type ApiTag = ApiEndpoint['tag'];
export type HttpMethod = ApiEndpoint['method'];
