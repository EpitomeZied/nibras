'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { listReportsAdmin, reviewReport, type AdminReport } from '../../../lib/services/community';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { useSession } from '../../_components/session-context';
import { useRouter } from 'next/navigation';
import EmptyState from '../../_components/widgets/EmptyState';
import Skeleton from '../../_components/widgets/Skeleton';

function contentLink(report: AdminReport): string {
  switch (report.targetType) {
    case 'question':
      return `/community/q/${report.targetId}`;
    case 'answer':
      return `/community/q/${report.targetId}`;
    case 'thread':
      return `/community/discussions/${report.targetId}`;
    case 'post':
      return `/community/discussions/${report.targetId}`;
    default:
      return '/community';
  }
}

export default function AdminCommunityPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const isAdmin = user?.systemRole === 'admin';
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReports(await listReportsAdmin('pending'));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isAdmin) {
      router.replace('/admin');
      return;
    }
    void load();
  }, [sessionLoading, isAdmin, load, router]);

  async function handleAction(reportId: string, action: 'dismiss' | 'hide' | 'remove') {
    setActingId(reportId);
    try {
      await reviewReport(reportId, action);
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setActingId(null);
    }
  }

  if (sessionLoading || !isAdmin) return null;

  return (
    <div style={{ maxWidth: 900 }}>
      <header style={{ marginBottom: 20 }}>
        <Link href="/admin" style={{ fontSize: 13 }}>
          ← Admin
        </Link>
        <h1 style={{ margin: '8px 0 4px' }}>Community moderation</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14 }}>
          Review flagged content and hide or remove violations.
        </p>
      </header>

      {loading ? (
        <Skeleton variant="card" height={80} count={4} />
      ) : error ? (
        <EmptyState
          title="Could not load reports"
          description={error}
          tone="error"
          action={{ label: 'Retry', onClick: () => void load() }}
        />
      ) : reports.length === 0 ? (
        <EmptyState title="Queue is clear" description="No pending community reports." />
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {reports.map((report) => (
            <li
              key={report.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <strong>{report.targetType}</strong>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 13 }}>
                    by {report.reporter.username}
                  </span>
                  <p style={{ margin: '8px 0 0', fontSize: 14 }}>{report.reason}</p>
                  {report.details && (
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                      {report.details}
                    </p>
                  )}
                </div>
                <div
                  style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}
                >
                  <Link href={contentLink(report)} style={{ fontSize: 13 }}>
                    View
                  </Link>
                  <button
                    type="button"
                    disabled={actingId === report.id}
                    onClick={() => void handleAction(report.id, 'dismiss')}
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    disabled={actingId === report.id}
                    onClick={() => void handleAction(report.id, 'hide')}
                  >
                    Hide
                  </button>
                  <button
                    type="button"
                    disabled={actingId === report.id}
                    onClick={() => void handleAction(report.id, 'remove')}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
