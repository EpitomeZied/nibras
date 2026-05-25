'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useFetch } from '../../lib/use-fetch';
import SelectField from '../_components/ui/select-field';
import styles from './submissions.module.css';

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'needs_review', label: 'Needs Review' },
];

type StudentSubmission = {
  id: string;
  projectKey: string;
  milestoneId: string | null;
  commitSha: string;
  repoUrl: string;
  branch: string;
  status: string;
  summary: string;
  submissionType: string;
  submissionValue: string | null;
  notes: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  localTestExitCode: number | null;
};

type MilestoneStat = {
  milestoneId: string;
  milestoneTitle: string;
  dueAt: string | null;
  submissionCount: number;
  latestStatus: string | null;
  latestSubmittedAt: string | null;
};

type ProjectStat = {
  projectId: string;
  projectTitle: string;
  totalMilestones: number;
  submittedMilestones: number;
  passedMilestones: number;
  milestones: MilestoneStat[];
};

type CourseStat = {
  courseId: string;
  courseTitle: string;
  projects: ProjectStat[];
};

type StudentAnalytics = {
  userId: string;
  analytics: CourseStat[];
};

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  running: 'Running',
  passed: 'Passed',
  failed: 'Failed',
  needs_review: 'Needs Review',
};

function getStatusClass(status: string): string {
  if (status === 'passed') return styles.statusPassed;
  if (status === 'failed') return styles.statusFailed;
  if (status === 'needs_review') return styles.statusReview;
  if (status === 'queued' || status === 'running') return styles.statusQueued;
  return styles.statusDefault;
}

export default function SubmissionsPage() {
  const { data, loading, error } = useFetch<StudentSubmission[]>('/v1/me/submissions');
  const { data: analyticsData } = useFetch<StudentAnalytics>('/v1/tracking/analytics/student');
  const [statusFilter, setStatusFilter] = useState('all');

  const submissions = Array.isArray(data) ? data : [];
  const filtered =
    statusFilter === 'all' ? submissions : submissions.filter((s) => s.status === statusFilter);
  const passedCount = submissions.filter((submission) => submission.status === 'passed').length;
  const reviewCount = submissions.filter(
    (submission) => submission.status === 'needs_review'
  ).length;
  const pendingCount = submissions.filter(
    (submission) => submission.status === 'queued' || submission.status === 'running'
  ).length;

  const courseStats = analyticsData?.analytics ?? [];
  const totalCourses = courseStats.length;

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>Submission History</span>
          <h1 className={styles.pageTitle}>
            Review every submission from one structured timeline.
          </h1>
          <p className={styles.pageSub}>
            Track statuses, open details, and jump back into project work without digging through
            scattered milestone screens.
          </p>
        </div>
        <SelectField
          variant="filter"
          selectClassName={styles.filterSelect}
          value={statusFilter}
          onChange={setStatusFilter}
          options={STATUS_FILTER_OPTIONS}
          aria-label="Filter by status"
        />
      </div>

      <div className={styles.summaryCards}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total</span>
          <strong>{submissions.length}</strong>
          <p>Recorded submissions across your active courses.</p>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Passed</span>
          <strong>{passedCount}</strong>
          <p>Submissions that cleared automated checks or review.</p>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Needs Review</span>
          <strong>{reviewCount}</strong>
          <p>Waiting on manual grading or follow-up review.</p>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>In Flight</span>
          <strong>{pendingCount}</strong>
          <p>Queued or currently running verification.</p>
        </article>
      </div>

      {/* ── Analytics section ── */}
      {courseStats.length > 0 && (
        <div className={styles.analyticsSection}>
          <div className={styles.analyticsSectionHead}>
            <p className={styles.analyticsSectionTitle}>Progress by Course</p>
            <span className={styles.analyticsOverview}>
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''} across{' '}
              {totalCourses} course{totalCourses !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={styles.courseGrid}>
            {courseStats.map((course) => {
              const totalMilestones = course.projects.reduce(
                (sum, p) => sum + p.totalMilestones,
                0
              );
              const passedMilestones = course.projects.reduce(
                (sum, p) => sum + p.passedMilestones,
                0
              );
              const submittedMilestones = course.projects.reduce(
                (sum, p) => sum + p.submittedMilestones,
                0
              );
              const pct = totalMilestones > 0 ? (passedMilestones / totalMilestones) * 100 : 0;
              return (
                <div key={course.courseId} className={styles.courseRow}>
                  <div className={styles.courseRowHead}>
                    <span className={styles.courseTitle}>{course.courseTitle}</span>
                    <span className={styles.courseStat}>
                      {passedMilestones} passed · {submittedMilestones} submitted ·{' '}
                      {totalMilestones} total
                    </span>
                  </div>
                  <div className={styles.miniBar} title={`${Math.round(pct)}% passed`}>
                    <div
                      className={styles.miniBarFill}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading && (
        <div className={styles.panel}>
          <p className={styles.muted}>Loading submissions…</p>
        </div>
      )}

      {error && <div className={styles.errorBar}>{error}</div>}

      {!loading && !error && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <p className={styles.panelTitle}>Submission Ledger</p>
              <p className={styles.panelCopy}>
                Filter by outcome, then open the detailed submission record.
              </p>
            </div>
            <span className={styles.panelCount}>{filtered.length} visible</span>
          </div>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyEmoji}>📭</span>
              <h2>No submissions found</h2>
              <p>
                {statusFilter !== 'all'
                  ? 'No submissions match this filter. Try switching to "All statuses".'
                  : 'Submit a milestone from the Projects page to see it here.'}
              </p>
              <Link href="/projects" className={styles.linkBtn}>
                Go to Projects →
              </Link>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub) => (
                    <tr key={sub.id}>
                      <td>
                        <strong>{sub.projectKey}</strong>
                      </td>
                      <td className={styles.typeCell}>{sub.submissionType}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${getStatusClass(sub.status)}`}>
                          {STATUS_LABELS[sub.status] ?? sub.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className={styles.mono}>
                        {new Date(sub.submittedAt || sub.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td>
                        <Link href={`/submissions/${sub.id}`} className={styles.viewBtn}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
