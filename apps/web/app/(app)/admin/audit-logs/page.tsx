'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFetch } from '../../../lib/use-fetch';
import styles from '../../instructor/instructor.module.css';

type AuditLog = {
  id: string;
  userId: string | null;
  courseId: string | null;
  projectId: string | null;
  milestoneId: string | null;
  submissionAttemptId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  payload: unknown;
  createdAt: string;
};

type AuditLogsResponse = {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
};

/* ── Human-readable action labels ─────────────────────────────────────────── */
const ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  'user.signed_in':        { label: 'User signed in',                icon: '🔑', color: '#818cf8' },
  'user.roleChanged':      { label: 'User role changed',             icon: '🛡️', color: '#f59e0b' },
  'user.accountDeleted':   { label: 'User account deleted',          icon: '🗑️', color: '#f87171' },
  'installation.linked':   { label: 'GitHub App installation linked',icon: '🔗', color: '#34d399' },
  'member.added':          { label: 'Member added to course',        icon: '➕', color: '#34d399' },
  'member.removed':        { label: 'Member removed from course',    icon: '➖', color: '#f87171' },
  'member.year_synced':    { label: 'Member academic year synced',   icon: '🔄', color: '#38bdf8' },
  'project.created':       { label: 'Project created',               icon: '📁', color: '#34d399' },
  'project.updated':       { label: 'Project updated',               icon: '✏️', color: '#f59e0b' },
  'template.created':      { label: 'Template created',              icon: '📋', color: '#34d399' },
  'template.updated':      { label: 'Template updated',              icon: '✏️', color: '#f59e0b' },
  'teams.locked':          { label: 'Team formation locked',         icon: '🔒', color: '#f87171' },
  'team.updated':          { label: 'Team updated',                  icon: '👥', color: '#f59e0b' },
  'milestone.created':     { label: 'Milestone created',             icon: '🏁', color: '#34d399' },
  'milestone.updated':     { label: 'Milestone updated',             icon: '✏️', color: '#f59e0b' },
  'milestone.deleted':     { label: 'Milestone deleted',             icon: '🗑️', color: '#f87171' },
  'submission.created':    { label: 'Submission created',            icon: '📤', color: '#34d399' },
  'submission.updated':    { label: 'Submission updated',            icon: '✏️', color: '#f59e0b' },
  'submission.overridden': { label: 'Submission score overridden',   icon: '⚙️', color: '#f59e0b' },
  'review.created':        { label: 'Review submitted',              icon: '💬', color: '#818cf8' },
};

function formatAction(raw: string): { label: string; icon: string; color: string } {
  return (
    ACTION_LABELS[raw] ?? {
      // Fallback: convert "foo.bar_baz" → "Foo bar baz"
      label: raw
        .replace(/\./g, ' · ')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: '📌',
      color: 'var(--text-muted, #a1a1aa)',
    }
  );
}

/* ── Target type badge colors ─────────────────────────────────────────────── */
const TARGET_COLORS: Record<string, string> = {
  USER:          '#818cf8',
  COURSE:        '#34d399',
  PROJECT:       '#38bdf8',
  TEMPLATE:      '#f59e0b',
  MILESTONE:     '#fb923c',
  SUBMISSION:    '#a3e635',
  REVIEW:        '#c084fc',
  TEAM:          '#f472b6',
  GITHUBACCOUNT: '#e2e8f0',
  INVITE:        '#fbbf24',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function shortId(id: string | null, len = 10): string {
  if (!id) return '—';
  return id.length > len ? `${id.slice(0, len)}…` : id;
}

export default function AuditLogsPage() {
  const [action, setAction] = useState('');
  const [targetType, setTargetType] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const queryParts: string[] = [`limit=${limit}`, `offset=${offset}`];
  if (action.trim()) queryParts.push(`action=${encodeURIComponent(action.trim())}`);
  if (targetType) queryParts.push(`targetType=${encodeURIComponent(targetType)}`);
  if (fromDate) queryParts.push(`fromDate=${encodeURIComponent(fromDate)}`);
  if (toDate) queryParts.push(`toDate=${encodeURIComponent(toDate)}`);

  const { data, loading, error } = useFetch<AuditLogsResponse>(
    `/v1/admin/audit-logs?${queryParts.join('&')}`
  );

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  function applyFilters() {
    setOffset(0);
  }

  const TARGET_TYPES = [
    '',
    'course',
    'project',
    'milestone',
    'submission',
    'user',
    'invite',
    'review',
    'team',
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/admin">Admin</Link> / Audit Logs
          </p>
          <h1>Audit Logs</h1>
          <p className={styles.subtitle}>System-wide action history.</p>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className={styles.panel} style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
            alignItems: 'end',
          }}
        >
          <div className={styles.formGroup}>
            <label>Action</label>
            <input
              type="text"
              placeholder="e.g. course.created"
              value={action}
              onChange={(e) => setAction(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Target Type</label>
            <select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t || 'All types'}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>From Date</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label>To Date</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <button type="button" className={styles.btnPrimary} onClick={applyFilters}>
            Apply
          </button>
        </div>
      </div>

      {loading && <p className={styles.muted}>Loading audit logs…</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && (
        <>
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Results</h2>
              <span className={styles.muted}>{total} total entries</span>
            </div>

            {logs.length === 0 ? (
              <p className={styles.muted}>No audit log entries found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.submissionTable}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Target</th>
                      <th>Target ID</th>
                      <th>User ID</th>
                      <th>Course ID</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const meta = formatAction(log.action);
                      const targetColor =
                        TARGET_COLORS[log.targetType?.toUpperCase()] ??
                        'rgba(255,255,255,0.5)';
                      return (
                        <tr key={log.id}>
                          {/* ── Event (icon + human label + raw code) ── */}
                          <td style={{ minWidth: 220 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span
                                style={{
                                  fontSize: 16,
                                  lineHeight: 1,
                                  flexShrink: 0,
                                }}
                                aria-hidden="true"
                              >
                                {meta.icon}
                              </span>
                              <div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: meta.color,
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {meta.label}
                                </div>
                                <code
                                  style={{
                                    fontSize: 10,
                                    opacity: 0.45,
                                    letterSpacing: '0.02em',
                                  }}
                                >
                                  {log.action}
                                </code>
                              </div>
                            </div>
                          </td>

                          {/* ── Target type badge ── */}
                          <td>
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.07em',
                                padding: '2px 8px',
                                borderRadius: 999,
                                background: `${targetColor}18`,
                                border: `1px solid ${targetColor}40`,
                                color: targetColor,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {log.targetType}
                            </span>
                          </td>

                          <td>
                            <code style={{ fontSize: 11, opacity: 0.6 }}>
                              {shortId(log.targetId)}
                            </code>
                          </td>
                          <td>
                            <code style={{ fontSize: 11, opacity: 0.6 }}>
                              {shortId(log.userId, 8)}
                            </code>
                          </td>
                          <td>
                            <code style={{ fontSize: 11, opacity: 0.6 }}>
                              {shortId(log.courseId, 8)}
                            </code>
                          </td>
                          <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                            {formatDate(log.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Pagination ──────────────────────────────────────────── */}
          {(hasPrev || hasNext) && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={!hasPrev}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                ← Previous
              </button>
              <span className={styles.muted} style={{ fontSize: 13 }}>
                {offset + 1}–{Math.min(offset + limit, total)} of {total}
              </span>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={!hasNext}
                onClick={() => setOffset(offset + limit)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
