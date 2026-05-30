'use client';

import Link from 'next/link';
import { use, useMemo, useState } from 'react';
import { useFetch } from '../../../../../lib/use-fetch';
import { apiFetch } from '../../../../../lib/session';
import SelectField from '../../../../_components/ui/select-field';
import styles from '../../../instructor.module.css';

const INSTRUCTOR_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
];

const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
];

type Submission = {
  id: string;
  userId: string;
  projectId: string;
  projectKey: string;
  commitSha: string;
  branch: string;
  status: string;
  submissionType: string;
  summary: string;
  createdAt: string;
};

type Project = { id: string; title: string };

export default function CourseSubmissionsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const [statusFilter, setStatusFilter] = useState<string>('needs_review');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'oldest' | 'newest'>('oldest');
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  const { data: projects } = useFetch<Project[]>(`/v1/tracking/courses/${courseId}/projects`);
  const queueUrl = useMemo(() => {
    const params = new URLSearchParams({ courseId });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (projectFilter !== 'all') params.set('projectId', projectFilter);
    return `/v1/tracking/review-queue?${params.toString()}`;
  }, [courseId, statusFilter, projectFilter]);

  const { data, loading, error, reload } = useFetch<{ submissions: Submission[] }>(queueUrl);

  const sorted = useMemo(() => {
    const submissions = data?.submissions ?? [];
    const copy = [...submissions];
    copy.sort((a, b) => {
      const left = new Date(a.createdAt).getTime();
      const right = new Date(b.createdAt).getTime();
      return sortOrder === 'oldest' ? left - right : right - left;
    });
    return copy;
  }, [data?.submissions, sortOrder]);

  const projectOptions = useMemo(
    () => [
      { value: 'all', label: 'All projects' },
      ...(projects ?? []).map((project) => ({ value: project.id, label: project.title })),
    ],
    [projects]
  );

  async function handleExportCsv() {
    setExporting(true);
    try {
      const res = await apiFetch(`/v1/tracking/courses/${courseId}/export.csv`, { auth: true });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course-${courseId}-grades.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('CSV export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  function toggleSelected(submissionId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(submissionId)) next.delete(submissionId);
      else next.add(submissionId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === sorted.length) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(sorted.map((sub) => sub.id)));
  }

  async function handleBulkApprove() {
    if (selectedIds.size === 0) return;
    setBulkWorking(true);
    setBulkMessage(null);
    let approved = 0;
    let failed = 0;
    for (const submissionId of selectedIds) {
      try {
        const reviewRes = await apiFetch(`/v1/tracking/submissions/${submissionId}/review`, {
          auth: true,
        });
        let score: number | null = null;
        if (reviewRes.ok) {
          const review = (await reviewRes.json()) as {
            score: number | null;
            aiCriterionScores?: Array<{ earned: number }> | null;
          };
          score =
            review.score ??
            (review.aiCriterionScores
              ? review.aiCriterionScores.reduce((sum, row) => sum + row.earned, 0)
              : null);
        }
        const res = await apiFetch(`/v1/tracking/submissions/${submissionId}/review`, {
          method: reviewRes.ok ? 'PATCH' : 'POST',
          auth: true,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            status: 'approved',
            score,
            feedback: 'Approved via bulk review.',
            rubric: [],
          }),
        });
        if (res.ok) approved += 1;
        else failed += 1;
      } catch {
        failed += 1;
      }
    }
    setBulkMessage(
      `Bulk review complete: ${approved} approved${failed ? `, ${failed} failed` : ''}.`
    );
    setSelectedIds(new Set());
    await reload();
    setBulkWorking(false);
  }

  function statusClass(status: string) {
    if (status === 'passed') return styles.statusPublished;
    if (status === 'failed') return styles.statusArchived;
    return styles.statusDraft;
  }

  function waitingLabel(createdAt: string): string {
    const minutes = Math.max(0, Math.round((Date.now() - new Date(createdAt).getTime()) / 60000));
    if (minutes < 60) return `${minutes}m waiting`;
    const hours = Math.round(minutes / 60);
    if (hours < 48) return `${hours}h waiting`;
    return `${Math.round(hours / 24)}d waiting`;
  }

  return (
    <div>
      <div className={styles.detailHeader}>
        <div>
          <h2 style={{ margin: 0 }}>Submission Review Queue</h2>
          <p className={styles.muted} style={{ margin: '6px 0 0' }}>
            Filter by project and status, sort by wait time, and bulk-approve low-risk submissions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => void handleExportCsv()}
            disabled={exporting}
            className={styles.btnSecondary}
          >
            {exporting ? 'Exporting…' : '↓ Export CSV'}
          </button>
          <SelectField
            variant="filter"
            selectClassName={styles.btnSecondary}
            value={projectFilter}
            onChange={setProjectFilter}
            options={projectOptions}
            aria-label="Filter by project"
          />
          <SelectField
            variant="filter"
            selectClassName={styles.btnSecondary}
            value={statusFilter}
            onChange={setStatusFilter}
            options={INSTRUCTOR_STATUS_OPTIONS}
            aria-label="Filter by status"
          />
          <SelectField
            variant="filter"
            selectClassName={styles.btnSecondary}
            value={sortOrder}
            onChange={(value) => setSortOrder(value as 'oldest' | 'newest')}
            options={SORT_OPTIONS}
            aria-label="Sort submissions"
          />
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={bulkWorking || selectedIds.size === 0}
            onClick={() => void handleBulkApprove()}
          >
            {bulkWorking ? 'Approving…' : `Bulk approve (${selectedIds.size})`}
          </button>
        </div>
      </div>

      {bulkMessage && <p className={styles.muted}>{bulkMessage}</p>}
      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && (
        <div className={styles.panel} style={{ overflowX: 'auto' }}>
          {sorted.length === 0 ? (
            <p className={styles.muted}>No submissions match this filter.</p>
          ) : (
            <table className={styles.submissionTable}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === sorted.length && sorted.length > 0}
                      onChange={toggleSelectAll}
                      aria-label="Select all submissions"
                    />
                  </th>
                  <th>Project</th>
                  <th>Branch</th>
                  <th>Commit</th>
                  <th>Status</th>
                  <th>Waiting</th>
                  <th>Type</th>
                  <th>Submitted</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sorted.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(sub.id)}
                        onChange={() => toggleSelected(sub.id)}
                        aria-label={`Select submission ${sub.projectKey}`}
                      />
                    </td>
                    <td>
                      <strong>{sub.projectKey}</strong>
                    </td>
                    <td className={styles.mono}>{sub.branch}</td>
                    <td className={styles.mono}>{sub.commitSha.slice(0, 7)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(sub.status)}`}>
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.mono}>{waitingLabel(sub.createdAt)}</td>
                    <td className={styles.muted}>{sub.submissionType}</td>
                    <td className={styles.mono}>
                      {new Date(sub.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <Link
                        href={`/instructor/courses/${courseId}/submissions/${sub.id}/review`}
                        className={styles.btnPrimary}
                        style={{ padding: '6px 14px', fontSize: 13, whiteSpace: 'nowrap' }}
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
