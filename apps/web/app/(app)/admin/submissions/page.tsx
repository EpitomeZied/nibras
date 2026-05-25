'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '../../../lib/session';
import { useFetch } from '../../../lib/use-fetch';
import SelectField from '../../_components/ui/select-field';
import styles from '../../instructor/instructor.module.css';

const ADMIN_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'needs_review', label: 'Needs review' },
];

type Submission = {
  id: string;
  projectKey: string;
  commitSha: string;
  branch: string;
  status: string;
  summary: string;
  submissionType: string;
  createdAt: string;
  updatedAt: string;
};

const OVERRIDE_STATUSES = ['passed', 'failed', 'needs_review'] as const;

export default function AdminSubmissionsPage() {
  const { data, loading, error } = useFetch<{ submissions: Submission[] }>('/v1/admin/submissions');
  const [localSubmissions, setLocalSubmissions] = useState<Submission[] | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [overriding, setOverriding] = useState<string | null>(null);
  const [overrideValues, setOverrideValues] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkRetrying, setBulkRetrying] = useState(false);

  const submissions = localSubmissions ?? data?.submissions ?? [];

  const filtered =
    statusFilter === 'all' ? submissions : submissions.filter((sub) => sub.status === statusFilter);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((sub) => selectedIds.has(sub.id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((sub) => sub.id)));
    }
  }

  async function handleOverride(submissionId: string) {
    const newStatus = overrideValues[submissionId];
    if (!newStatus) return;
    setOverriding(submissionId);
    try {
      const res = await apiFetch(`/v1/admin/submissions/${submissionId}/status`, {
        method: 'PATCH',
        auth: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Override failed.');
      }
      setLocalSubmissions(
        submissions.map((sub) => (sub.id === submissionId ? { ...sub, status: newStatus } : sub))
      );
      setOverrideValues((prev) => {
        const next = { ...prev };
        delete next[submissionId];
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Override failed.');
    } finally {
      setOverriding(null);
    }
  }

  async function handleBulkRetry() {
    if (selectedIds.size === 0) return;
    setBulkRetrying(true);
    try {
      const res = await apiFetch('/v1/admin/submissions/bulk-retry', {
        method: 'POST',
        auth: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ submissionIds: [...selectedIds] }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || 'Bulk retry failed.');
      }
      setLocalSubmissions(
        submissions.map((sub) => (selectedIds.has(sub.id) ? { ...sub, status: 'queued' } : sub))
      );
      setSelectedIds(new Set());
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Bulk retry failed.');
    } finally {
      setBulkRetrying(false);
    }
  }

  function statusClass(status: string) {
    if (status === 'passed') return styles.statusPublished;
    if (status === 'failed') return styles.statusArchived;
    return styles.statusDraft;
  }

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Admin</Link> / Submissions
          </p>
          <h1>All Submissions</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedIds.size > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={styles.muted} style={{ fontSize: '13px' }}>
                {selectedIds.size} selected
              </span>
              <button
                className={styles.btnPrimary}
                disabled={bulkRetrying}
                onClick={() => void handleBulkRetry()}
              >
                {bulkRetrying ? 'Retrying…' : 'Retry selected'}
              </button>
            </div>
          )}
          <SelectField
            variant="filter"
            selectClassName={styles.btnSecondary}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setSelectedIds(new Set());
            }}
            options={ADMIN_STATUS_OPTIONS}
            aria-label="Filter by status"
          />
        </div>
      </div>

      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && (
        <div className={styles.panel} style={{ overflowX: 'auto' }}>
          {filtered.length === 0 ? (
            <p className={styles.muted}>No submissions match this filter.</p>
          ) : (
            <table className={styles.submissionTable}>
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th>Project</th>
                  <th>Commit</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Override</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(sub.id)}
                        onChange={() => toggleOne(sub.id)}
                        aria-label={`Select submission ${sub.id}`}
                      />
                    </td>
                    <td>
                      <strong>{sub.projectKey}</strong>
                    </td>
                    <td className={styles.mono}>{sub.commitSha.slice(0, 7)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(sub.status)}`}>
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={styles.mono}>
                      {new Date(sub.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <SelectField
                          variant="filter"
                          value={overrideValues[sub.id] || ''}
                          onChange={(value) =>
                            setOverrideValues((prev) => ({ ...prev, [sub.id]: value }))
                          }
                          options={[
                            { value: '', label: 'Select…' },
                            ...OVERRIDE_STATUSES.map((s) => ({
                              value: s,
                              label: s.replace('_', ' '),
                            })),
                          ]}
                          aria-label={`Override status for ${sub.id}`}
                        />
                        <button
                          className={styles.btnPrimary}
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          disabled={!overrideValues[sub.id] || overriding === sub.id}
                          onClick={() => void handleOverride(sub.id)}
                        >
                          {overriding === sub.id ? '…' : 'Save'}
                        </button>
                      </div>
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
