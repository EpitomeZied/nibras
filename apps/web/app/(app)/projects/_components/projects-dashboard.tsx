'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type {
  CreateProjectRoleApplicationRequest,
  CreateTrackingSubmissionRequest,
  ProjectRoleApplication,
  StudentProjectsDashboardResponse,
  Team,
  TrackingCourseSummary,
  TrackingMilestone,
  TrackingProjectSummary,
} from '@nibras/contracts';
import { prefs } from '../../../lib/prefs';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import {
  fetchMyTeamApplication,
  fetchProjectGitHubStatus,
  fetchStudentProjectsDashboard,
  listProjectTeams,
  listTrackingCourses,
  submitMilestoneTracking,
  submitTeamApplication,
  type ProjectGitHubStatus,
} from '../../../lib/services/project-tracking';
import { getLevelBadgeSuffix, getLevelLabel, getLevelName } from '../../../lib/levels';
import { useSession } from '../../_components/session-context';
import SelectField from '../../_components/ui/select-field';
import MilestoneCard from './milestone-card';
import ProjectsHub from './projects-hub';
import ProjectsNextAction from './projects-next-action';
import ProjectsRightRail from './projects-right-rail';
import {
  useMilestoneFilters,
  useProjectSearch,
  type MilestoneStatusFilter,
} from '../_hooks/use-student-projects-dashboard';
import { statusColor } from './projects-helpers';
import SubmissionModal from './submission-modal';
import TeamApplicationModal from './team-application-modal';
import styles from './projects.module.css';

function Skeleton({ w = '100%', h = 14, r = 6 }: { w?: string; h?: number; r?: number }) {
  return (
    <span
      className={styles.skeleton}
      style={{ width: w, height: h, borderRadius: r, display: 'block' }}
      aria-hidden="true"
    />
  );
}

export default function ProjectsDashboard({
  initialCourseId = null,
  initialProjectId = null,
  initialView = null,
}: {
  initialCourseId?: string | null;
  initialProjectId?: string | null;
  initialView?: string | null;
}) {
  const { user: sessionUser } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseIdFromUrl =
    searchParams.get('courseId') || searchParams.get('course') || initialCourseId;
  const projectIdFromUrl = searchParams.get('projectId') || initialProjectId;

  const hubMode =
    initialView === 'hub' ||
    searchParams.get('view') === 'hub' ||
    (!courseIdFromUrl && searchParams.get('view') !== 'workspace');

  const [dashboard, setDashboard] = useState<StudentProjectsDashboardResponse | null>(null);
  const [courses, setCourses] = useState<TrackingCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [selectionReady, setSelectionReady] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<TrackingMilestone | null>(null);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [activeApplication, setActiveApplication] = useState<ProjectRoleApplication | null>(null);
  const [activeTeams, setActiveTeams] = useState<Team[]>([]);
  const [applicationSubmitting, setApplicationSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MilestoneStatusFilter>('all');
  const [githubStatus, setGitHubStatus] = useState<ProjectGitHubStatus>({
    available: false,
    githubLinked: false,
    githubAppInstalled: false,
    githubLogin: '',
    installUrl: '',
    statusMessage: 'GitHub status is temporarily unavailable.',
  });

  function replaceSelectionQuery(
    courseId: string | null,
    projectId: string | null,
    view?: 'hub' | 'workspace' | null
  ) {
    const params = new URLSearchParams(searchParams.toString());
    if (courseId) {
      params.set('courseId', courseId);
      params.delete('course');
    } else {
      params.delete('courseId');
      params.delete('course');
    }
    if (projectId) {
      params.set('projectId', projectId);
    } else {
      params.delete('projectId');
    }
    if (view === 'hub') {
      params.set('view', 'hub');
    } else if (view === 'workspace') {
      params.set('view', 'workspace');
    } else if (view === null) {
      params.delete('view');
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function syncCourseSelection(courseId: string | null) {
    prefs.setSelectedCourseId(courseId);
    replaceSelectionQuery(courseId, null, courseId ? 'workspace' : 'hub');
  }

  function syncProjectSelection(projectId: string) {
    setSelectedProjectId(projectId);
    replaceSelectionQuery(activeCourseId ?? dashboard?.course?.id ?? null, projectId, 'workspace');
  }

  function openHubView() {
    setActiveCourseId(null);
    replaceSelectionQuery(null, null, 'hub');
    void loadDashboard(null, true);
  }

  async function loadDashboard(courseId?: string | null, portfolioOnly = false) {
    setLoading(true);
    setError('');
    try {
      const [payload, nextCourses, nextGitHubStatus] = await Promise.all([
        fetchStudentProjectsDashboard(portfolioOnly ? null : courseId, {
          includePortfolio: portfolioOnly,
          includeDeadlines: !portfolioOnly,
        }),
        listTrackingCourses(),
        fetchProjectGitHubStatus(),
      ]);
      const preferredProjectId = projectIdFromUrl || initialProjectId;
      setDashboard(payload);
      setCourses(nextCourses);
      setGitHubStatus(nextGitHubStatus);
      if (!portfolioOnly) {
        setSelectedProjectId((current) =>
          preferredProjectId && payload.projects.some((p) => p.id === preferredProjectId)
            ? preferredProjectId
            : payload.projects.some((p) => p.id === current)
              ? current
              : (payload.activeProjectId ?? payload.projects[0]?.id ?? '')
        );
        const resolvedCourseId = payload.course?.id ?? nextCourses[0]?.id ?? null;
        if (resolvedCourseId !== activeCourseId) {
          setActiveCourseId(resolvedCourseId);
        }
        if (resolvedCourseId && resolvedCourseId !== courseIdFromUrl) {
          syncCourseSelection(resolvedCourseId);
        } else if (resolvedCourseId) {
          prefs.setSelectedCourseId(resolvedCourseId);
        }
      }
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hubMode) {
      setActiveCourseId(null);
      setSelectionReady(true);
      return;
    }
    const preferredCourseId = courseIdFromUrl || prefs.getSelectedCourseId();
    setActiveCourseId(preferredCourseId || null);
    setSelectionReady(true);
  }, [courseIdFromUrl, hubMode]);

  useEffect(() => {
    if (!selectionReady) return;
    void loadDashboard(activeCourseId, hubMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCourseId, selectionReady, hubMode]);

  const activeProject = useMemo<TrackingProjectSummary | null>(
    () =>
      dashboard?.projects.find((p) => p.id === selectedProjectId) ?? dashboard?.projects[0] ?? null,
    [dashboard, selectedProjectId]
  );

  const rawMilestones =
    activeProject && dashboard ? (dashboard.milestonesByProject[activeProject.id] ?? []) : [];
  const activeMilestones = useMilestoneFilters(rawMilestones, searchQuery, statusFilter);
  const filteredProjects = useProjectSearch(dashboard, searchQuery);

  const activeStats = useMemo(
    () =>
      activeProject && dashboard ? (dashboard.statsByProject[activeProject.id] ?? null) : null,
    [dashboard, activeProject]
  );

  const finalMilestone = activeMilestones.find((m) => m.isFinal) ?? null;
  const teamApplicationRequired =
    activeProject?.deliveryMode === 'team' && activeProject.teamFormationStatus !== 'teams_locked';
  const teamWorkflowState =
    activeProject?.deliveryMode !== 'team'
      ? null
      : activeProject.teamFormationStatus === 'teams_locked'
        ? 'locked'
        : activeApplication
          ? 'applied'
          : 'needs_application';

  function courseLabel(course: TrackingCourseSummary): string {
    return `${course.courseCode} · ${course.title}`;
  }

  const selectedCourse =
    courses.find((course) => course.id === (activeCourseId ?? dashboard?.course?.id ?? '')) ??
    dashboard?.course ??
    null;

  function openSubmit(milestone: TrackingMilestone) {
    if (teamApplicationRequired) {
      setApplicationOpen(true);
      setApplicationError('');
      return;
    }
    setActiveMilestone(milestone);
    setSubmitError('');
  }

  async function loadTeamState(projectId: string | null) {
    if (!projectId) {
      setActiveApplication(null);
      setActiveTeams([]);
      return;
    }
    try {
      const [application, teams] = await Promise.all([
        fetchMyTeamApplication(projectId),
        listProjectTeams(projectId),
      ]);
      setActiveApplication(application);
      setActiveTeams(teams);
    } catch {
      setActiveApplication(null);
      setActiveTeams([]);
    }
  }

  useEffect(() => {
    void loadTeamState(activeProject?.id ?? null);
  }, [activeProject?.id]);

  async function submitMilestone(payload: CreateTrackingSubmissionRequest) {
    if (!activeMilestone) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitMilestoneTracking(activeMilestone.id, payload);
      setActiveMilestone(null);
      setToast('✅ Milestone submitted successfully!');
      setTimeout(() => setToast(''), 4000);
      await loadDashboard(dashboard?.course?.id ?? null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitApplication(payload: CreateProjectRoleApplicationRequest) {
    if (!activeProject) return;
    setApplicationSubmitting(true);
    setApplicationError('');
    try {
      await submitTeamApplication(activeProject.id, payload);
      setApplicationOpen(false);
      await loadTeamState(activeProject.id);
      setToast('✅ Team application saved.');
      setTimeout(() => setToast(''), 4000);
      await loadDashboard(dashboard?.course?.id ?? null);
    } catch (error) {
      setApplicationError(error instanceof Error ? error.message : String(error));
    } finally {
      setApplicationSubmitting(false);
    }
  }

  const studentLevel = sessionUser?.yearLevel ?? 1;
  const approved = activeStats?.approved ?? 0;
  const underReview = activeStats?.underReview ?? 0;
  const total = activeStats?.total ?? 0;
  const portfolioCourses = dashboard?.portfolioCourses ?? [];
  const courseDeadlines = dashboard?.courseDeadlines ?? [];
  const showWorkspace =
    !hubMode && !loading && !dashboard?.pageError && (dashboard?.projects.length ?? 0) > 0;
  const showEmptyWorkspace =
    !hubMode && !loading && !dashboard?.pageError && (dashboard?.projects.length ?? 0) === 0;

  return (
    <main className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderText}>
          <p className={styles.eyebrow}>
            {hubMode
              ? 'Project portfolio'
              : dashboard?.course
                ? `${dashboard.course.courseCode} · ${dashboard.course.termLabel}`
                : 'Project Tracking'}
          </p>
          <h1 className={styles.pageTitle}>
            {loading ? (
              <Skeleton w="260px" h={32} />
            ) : hubMode ? (
              'Projects'
            ) : (
              (dashboard?.course?.title ?? 'Projects')
            )}
          </h1>
          <p className={styles.pageSub}>
            {loading
              ? null
              : hubMode
                ? 'See progress across all enrolled courses, then open a workspace.'
                : 'Track milestones, submit work, and monitor your progress.'}
          </p>
        </div>

        <div className={styles.pageHeaderRight}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${hubMode ? styles.viewToggleBtnActive : ''}`}
              onClick={openHubView}
            >
              All courses
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${!hubMode ? styles.viewToggleBtnActive : ''}`}
              onClick={() => {
                const nextId = activeCourseId || dashboard?.course?.id || courses[0]?.id || null;
                if (nextId) syncCourseSelection(nextId);
              }}
              disabled={courses.length === 0}
            >
              Workspace
            </button>
          </div>
          {!hubMode && courses.length > 0 && (
            <SelectField
              variant="rich"
              className={styles.courseSwitcher}
              label="Course"
              hint={courses.length > 1 ? `${courses.length} available` : 'Current workspace'}
              aria-label="Choose course"
              value={activeCourseId ?? dashboard?.course?.id ?? ''}
              onChange={(nextId) => {
                setActiveCourseId(nextId || null);
                syncCourseSelection(nextId || null);
              }}
              disabled={loading || courses.length <= 1}
              options={courses.map((course) => ({
                value: course.id,
                label: courseLabel(course),
              }))}
              richPreview={
                selectedCourse
                  ? {
                      badge: selectedCourse.courseCode ?? 'Course',
                      title: selectedCourse.title ?? 'Select a course',
                      meta: selectedCourse.termLabel ?? 'Choose the course you want to work in',
                    }
                  : {
                      badge: 'Course',
                      title: 'Select a course',
                      meta: 'Choose the course you want to work in',
                    }
              }
            />
          )}
          {!hubMode && (
            <div className={styles.pageHeaderStats}>
              <div className={styles.headerStat}>
                <span>{loading ? '—' : approved}</span>
                <label>Approved</label>
              </div>
              <div className={styles.headerStatDivider} />
              <div className={styles.headerStat}>
                <span>{loading ? '—' : underReview}</span>
                <label>In Review</label>
              </div>
              <div className={styles.headerStatDivider} />
              <div className={styles.headerStat}>
                <span style={{ color: 'var(--primary-strong)' }}>
                  {loading ? '—' : `${activeStats?.completion ?? 0}%`}
                </span>
                <label>Complete</label>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <div className={styles.errorBar}>{error}</div>}

      {loading && (
        <div className={styles.loadingGrid}>
          <div className={styles.skeletonPanel}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeletonMilestone}>
                <Skeleton w="28px" h={28} r={999} />
                <div style={{ flex: 1, display: 'grid', gap: 8 }}>
                  <Skeleton w="55%" h={14} />
                  <Skeleton w="35%" h={11} />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.skeletonPanel}>
            <Skeleton w="100%" h={80} r={12} />
            <Skeleton w="100%" h={14} />
            <Skeleton w="100%" h={14} />
          </div>
        </div>
      )}

      {!loading && hubMode && (
        <ProjectsHub
          courses={portfolioCourses}
          onSelectCourse={(courseId) => {
            setActiveCourseId(courseId);
            syncCourseSelection(courseId);
          }}
        />
      )}

      {!loading && dashboard?.pageError && (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>📋</span>
          <h2>Nothing published yet</h2>
          <p>{dashboard.pageError}</p>
          <div className={styles.emptyActions}>
            <Link
              href="/catalog"
              className={`${styles.emptyActionBtn} ${styles.emptyActionBtnPrimary}`}
            >
              Browse catalog
            </Link>
            <button type="button" className={styles.emptyActionBtn} onClick={openHubView}>
              All courses
            </button>
          </div>
        </div>
      )}

      {showEmptyWorkspace && (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>📂</span>
          <h2>No projects in this course</h2>
          <p>
            Your instructor has not published projects here yet, or you may need a different course.
          </p>
          <div className={styles.emptyActions}>
            <button type="button" className={styles.emptyActionBtn} onClick={openHubView}>
              All courses
            </button>
            <Link href="/catalog" className={styles.emptyActionBtn}>
              Browse catalog
            </Link>
          </div>
        </div>
      )}

      {showWorkspace && (
        <>
          <div className={styles.toolbarRow}>
            <div className={styles.filterRow}>
              <input
                type="search"
                className={styles.searchInput}
                placeholder="Search projects and milestones…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search projects and milestones"
              />
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MilestoneStatusFilter)}
                aria-label="Filter milestones by status"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="review">In review</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <Link href="/submissions" className={styles.inlineLink}>
              Submission history →
            </Link>
          </div>

          <div className={styles.projectTabs}>
            {filteredProjects.map((project) => {
              const stats = dashboard!.statsByProject[project.id];
              const pct = stats?.completion ?? 0;
              const isActive = project.id === activeProject?.id;
              const projectLevel = project.level ?? 1;
              const isLocked = projectLevel > studentLevel;
              const badgeSuffix = getLevelBadgeSuffix(projectLevel);
              return (
                <button
                  key={project.id}
                  type="button"
                  className={`${styles.projectTab} ${isActive ? styles.projectTabActive : ''} ${isLocked ? styles.projectTabLocked : ''}`}
                  onClick={() => {
                    if (!isLocked) syncProjectSelection(project.id);
                  }}
                  disabled={isLocked}
                  title={
                    isLocked
                      ? `Complete all ${getLevelLabel(projectLevel - 1)} projects to unlock`
                      : undefined
                  }
                >
                  <div className={styles.tabTop}>
                    <strong className={styles.tabTitle}>
                      {isLocked && (
                        <span aria-hidden="true" style={{ marginRight: 4 }}>
                          🔒
                        </span>
                      )}
                      {project.title}
                    </strong>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span
                        className={`${styles.levelBadge} ${styles[`levelBadge${badgeSuffix}`] ?? ''}`}
                      >
                        {getLevelName(projectLevel)}
                      </span>
                      <span className={`${styles.tabStatus} ${statusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <span className={styles.tabMeta}>
                    {(dashboard!.milestonesByProject[project.id]?.length ?? 0) + ' milestone'}
                    {(dashboard!.milestonesByProject[project.id]?.length ?? 0) !== 1 ? 's' : ''}
                  </span>
                  {isLocked && (
                    <span className={styles.lockedHint}>
                      Unlock after completing {getLevelLabel(projectLevel - 1)}
                    </span>
                  )}
                  <div className={styles.tabProgress}>
                    <div className={styles.tabProgressTrack}>
                      <div className={styles.tabProgressFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span
                      className={styles.tabPct}
                      style={pct > 0 ? { color: 'var(--success)' } : undefined}
                    >
                      {pct}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className={styles.mainGrid}>
            <div className={styles.leftCol}>
              <ProjectsNextAction
                milestones={dashboard!.milestonesByProject[activeProject?.id ?? ''] ?? []}
                activeProject={activeProject}
                teamApplicationRequired={Boolean(teamApplicationRequired)}
                hasApplication={Boolean(activeApplication)}
                githubStatus={githubStatus}
                deadlines={courseDeadlines}
              />

              <div className={styles.overviewStrip}>
                <span
                  className={`${styles.overviewStatus} ${statusColor(activeProject?.status ?? 'open')}`}
                >
                  {activeProject?.status ?? 'draft'}
                </span>
                {activeProject?.startDate && activeProject?.endDate && (
                  <p className={styles.projectDates}>
                    {activeProject.startDate} – {activeProject.endDate}
                  </p>
                )}
                {activeProject?.description && (
                  <p className={styles.overviewDesc}>{activeProject.description}</p>
                )}
                {activeProject?.deliveryMode === 'team' && (
                  <div className={styles.overviewMeta}>
                    <span className={styles.metaChip}>
                      <span className={styles.metaChipLabel}>Formation</span>
                      {activeProject.teamFormationStatus.replace(/_/g, ' ')}
                    </span>
                    {activeProject.teamName && (
                      <span className={styles.metaChip}>
                        <span className={styles.metaChipLabel}>Team</span>
                        {activeProject.teamName}
                      </span>
                    )}
                    {activeProject.assignedRoleLabel && (
                      <span className={styles.metaChip}>
                        <span className={styles.metaChipLabel}>Role</span>
                        {activeProject.assignedRoleLabel}
                      </span>
                    )}
                  </div>
                )}
                <div className={styles.overviewMeta}>
                  {activeProject?.gradeWeight && (
                    <span className={styles.metaChip}>
                      <span className={styles.metaChipLabel}>Weight</span>
                      {activeProject.gradeWeight}
                    </span>
                  )}
                  {activeProject?.type && (
                    <span className={styles.metaChip}>
                      <span className={styles.metaChipLabel}>Type</span>
                      {activeProject.type}
                    </span>
                  )}
                  {activeProject?.instructorName && (
                    <span className={styles.metaChip}>
                      <span className={styles.metaChipLabel}>Instructor</span>
                      {activeProject.instructorName}
                    </span>
                  )}
                </div>
                {activeProject?.deliveryMode === 'team' && activeProject.team.length > 0 && (
                  <div className={styles.segLegend}>
                    {activeProject.team.map((member) => (
                      <span key={member.userId}>
                        <span className={styles.dot} style={{ background: member.color }} />
                        {member.name}
                        {member.roleLabel ? ` · ${member.roleLabel}` : ''}
                      </span>
                    ))}
                  </div>
                )}
                {activeProject?.deliveryMode === 'team' &&
                  activeProject.team.length === 0 &&
                  activeTeams.length > 0 && (
                    <p className={styles.overviewDesc}>
                      Teams are locked. Your visible team workspace is ready.
                    </p>
                  )}
                {activeProject?.deliveryMode === 'team' && (
                  <div className={styles.teamWorkflowCard}>
                    <div>
                      <span className={styles.teamWorkflowLabel}>Team workflow</span>
                      <strong>
                        {teamWorkflowState === 'locked'
                          ? 'Teams locked'
                          : teamWorkflowState === 'applied'
                            ? 'Application submitted'
                            : 'Application required'}
                      </strong>
                      <p>
                        {teamWorkflowState === 'locked'
                          ? 'Your team is finalized. Continue with the shared submission workflow.'
                          : teamWorkflowState === 'applied'
                            ? 'Your ranked roles are on file. You can update them until instructors lock formation.'
                            : 'Rank your preferred roles before the instructor generates and locks teams.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={[
                        styles.teamWorkflowStatus,
                        teamWorkflowState === 'locked'
                          ? styles.teamWorkflowStatusLocked
                          : teamWorkflowState === 'applied'
                            ? styles.teamWorkflowStatusApplied
                            : styles.teamWorkflowStatusPending,
                      ].join(' ')}
                      onClick={() => teamWorkflowState !== 'locked' && setApplicationOpen(true)}
                    >
                      {teamWorkflowState === 'locked'
                        ? 'Teams locked'
                        : teamWorkflowState === 'applied'
                          ? 'Applied ✓'
                          : 'Apply now'}
                    </button>
                  </div>
                )}
              </div>

              <section className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Milestones</h2>
                  <span className={styles.panelCount}>
                    {approved} / {total} complete
                  </span>
                </div>
                {activeMilestones.length === 0 ? (
                  <div className={styles.emptyState}>
                    <span className={styles.emptyEmoji}>🗂️</span>
                    <p>No milestones match your filters.</p>
                  </div>
                ) : (
                  <div className={styles.milestoneList}>
                    {activeMilestones.map((m) => (
                      <MilestoneCard
                        key={m.id}
                        milestone={m}
                        actionMode={teamApplicationRequired ? 'apply' : 'submit'}
                        onSubmit={openSubmit}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className={styles.panel}>
                <div className={styles.panelHead}>
                  <h2 className={styles.panelTitle}>Final Submission</h2>
                  {finalMilestone && (
                    <span className={`${styles.statusPill} ${statusColor(finalMilestone.status)}`}>
                      {finalMilestone.statusLabel}
                    </span>
                  )}
                </div>
                <div className={styles.finalBox}>
                  <p className={styles.finalDesc}>
                    {teamApplicationRequired
                      ? activeApplication
                        ? 'Your application is saved. Update your ranked preferences any time before the team roster is locked.'
                        : 'Start the team workflow by ranking preferred roles and describing how you can contribute.'
                      : (finalMilestone?.description ??
                        'Submit the final repository state and write-up for instructor review.')}
                  </p>
                  <button
                    type="button"
                    className={`${styles.submitBtnLg} ${!finalMilestone ? styles.submitBtnDisabled : ''}`}
                    disabled={!finalMilestone && !teamApplicationRequired}
                    onClick={() =>
                      teamApplicationRequired
                        ? setApplicationOpen(true)
                        : finalMilestone && openSubmit(finalMilestone)
                    }
                  >
                    {teamApplicationRequired
                      ? activeApplication
                        ? '✎ Update Team Application'
                        : '🧩 Apply for Team Roles'
                      : !finalMilestone
                        ? '🔒 No final milestone configured'
                        : finalMilestone.status === 'approved' || finalMilestone.status === 'graded'
                          ? '✓ Final Project Approved'
                          : finalMilestone.status === 'submitted' ||
                              finalMilestone.status === 'under_review' ||
                              finalMilestone.status === 'changes_requested'
                            ? '↩ Resubmit Final Project'
                            : '📤 Submit Final Project'}
                  </button>
                </div>
              </section>
            </div>

            <ProjectsRightRail
              studentLevel={studentLevel}
              activeProject={activeProject}
              activeStats={activeStats}
              memberships={dashboard!.memberships}
              activity={dashboard!.activity}
              deadlines={courseDeadlines}
            />
          </div>
        </>
      )}

      {activeMilestone && (
        <SubmissionModal
          milestone={activeMilestone}
          githubStatus={githubStatus}
          submitting={submitting}
          submitError={submitError}
          onClose={() => setActiveMilestone(null)}
          onSubmit={submitMilestone}
        />
      )}
      {applicationOpen && activeProject && (
        <TeamApplicationModal
          project={activeProject}
          application={activeApplication}
          submitting={applicationSubmitting}
          submitError={applicationError}
          onClose={() => setApplicationOpen(false)}
          onSubmit={submitApplication}
        />
      )}
    </main>
  );
}
