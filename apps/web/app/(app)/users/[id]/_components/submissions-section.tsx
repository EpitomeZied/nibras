'use client';

import { useMemo, useState } from 'react';
import type { UserProfileSubmission } from '@nibras/contracts';
import styles from '../page.module.css';

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  running: 'Running',
  passed: 'Passed',
  failed: 'Failed',
  needs_review: 'Needs review',
};

const STATUS_FILTERS = ['all', 'passed', 'failed', 'needs_review', 'queued'] as const;

function statusClass(status: string): string {
  if (status === 'passed') return styles.statusPassed;
  if (status === 'failed') return styles.statusFailed;
  if (status === 'needs_review') return styles.statusReview;
  return styles.statusQueued;
}

export default function SubmissionsSection({
  submissions,
  showScores,
  showFilters,
}: {
  submissions: UserProfileSubmission[];
  showScores: boolean;
  showFilters?: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('all');

  const filtered = useMemo(() => {
    if (!showFilters || statusFilter === 'all') return submissions;
    if (statusFilter === 'queued') {
      return submissions.filter((s) => s.status === 'queued' || s.status === 'running');
    }
    return submissions.filter((s) => s.status === statusFilter);
  }, [submissions, showFilters, statusFilter]);

  if (submissions.length === 0) {
    return <p className={styles.muted}>No submissions yet.</p>;
  }

  return (
    <>
      {showFilters ? (
        <div className={styles.filterRow}>
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`${styles.filterChip} ${statusFilter === filter ? styles.filterChipActive : ''}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter === 'all' ? 'All' : (STATUS_LABELS[filter] ?? filter)}
            </button>
          ))}
        </div>
      ) : null}
      <div className={styles.panel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Project</th>
              <th>Status</th>
              {showScores && <th>Score</th>}
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((submission) => (
              <tr key={submission.id}>
                <td>
                  {submission.projectTitle || submission.projectKey}
                  {submission.attemptNumber != null && submission.attemptNumber > 1
                    ? ` · attempt ${submission.attemptNumber}`
                    : ''}
                </td>
                <td className={statusClass(submission.status)}>
                  {STATUS_LABELS[submission.status] ?? submission.status}
                </td>
                {showScores && <td>{submission.score != null ? submission.score : '—'}</td>}
                <td className={styles.muted}>
                  {submission.submittedAt
                    ? new Date(submission.submittedAt).toLocaleDateString()
                    : new Date(submission.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className={styles.muted} style={{ padding: 16 }}>
            No submissions match this filter.
          </p>
        ) : null}
      </div>
    </>
  );
}
