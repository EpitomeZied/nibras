'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import {
  listThreads,
  setThreadClosed,
  setThreadPinned,
  type CommunityThread,
} from '../../../../../lib/services/community';
import { friendlyMessage } from '../../../../../lib/api-clients/errors';
import SelectField from '../../../../_components/ui/select-field';
import styles from '../../../instructor.module.css';

function formatRelative(iso?: string): string {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    const diffMs = date.getTime() - Date.now();
    const diffMin = Math.round(diffMs / 60000);
    const diffHr = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr / 24);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHr) < 48) return rtf.format(diffHr, 'hour');
    return rtf.format(diffDay, 'day');
  } catch {
    return iso;
  }
}

export default function InstructorDiscussionsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed' | 'pinned'>('all');
  const [searchQ, setSearchQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listThreads(courseId, {
        q: searchQ.trim() || undefined,
        pinned: filter === 'pinned' ? true : undefined,
        closed: filter === 'open' ? false : filter === 'closed' ? true : undefined,
        limit: 50,
      });
      setThreads(result.items);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId, filter, searchQ]);

  useEffect(() => {
    void load();
  }, [load]);

  async function togglePin(thread: CommunityThread) {
    setActingId(thread.id);
    try {
      await setThreadPinned(thread.id, !thread.pinned);
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setActingId(null);
    }
  }

  async function toggleClosed(thread: CommunityThread) {
    setActingId(thread.id);
    try {
      await setThreadClosed(thread.id, !thread.closed);
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setActingId(null);
    }
  }

  const unanswered = threads.filter((thread) => thread.replyCount === 0 && !thread.closed);

  return (
    <div>
      <div className={styles.detailHeader}>
        <div>
          <h2 style={{ margin: 0 }}>Discussions</h2>
          <p className={styles.muted} style={{ margin: '6px 0 0' }}>
            Moderate course threads — pin announcements, close resolved topics, and review
            unanswered questions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search threads…"
            aria-label="Search threads"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <SelectField
            variant="filter"
            selectClassName={styles.btnSecondary}
            value={filter}
            onChange={(value) => setFilter(value as typeof filter)}
            options={[
              { value: 'all', label: 'All threads' },
              { value: 'open', label: 'Open' },
              { value: 'closed', label: 'Closed' },
              { value: 'pinned', label: 'Pinned' },
            ]}
            aria-label="Filter threads"
          />
        </div>
      </div>

      {loading && <p className={styles.muted}>Loading discussions…</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && unanswered.length > 0 && (
        <div className={styles.panel} style={{ marginBottom: 16 }}>
          <div className={styles.panelHeader}>
            <h2>Unanswered ({unanswered.length})</h2>
          </div>
          <div className={styles.listStack}>
            {unanswered.slice(0, 5).map((thread) => (
              <div key={thread.id} className={styles.projectRow}>
                <Link href={`/community/discussions/${thread.id}`}>{thread.title}</Link>
                <span className={styles.muted}>{formatRelative(thread.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className={styles.panel}>
          {threads.length === 0 ? (
            <p className={styles.muted}>No discussion threads match this filter.</p>
          ) : (
            <table className={styles.submissionTable}>
              <thead>
                <tr>
                  <th>Thread</th>
                  <th>Replies</th>
                  <th>Activity</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {threads.map((thread) => (
                  <tr key={thread.id}>
                    <td>
                      <Link href={`/community/discussions/${thread.id}`}>
                        {thread.pinned ? '📌 ' : ''}
                        {thread.title}
                      </Link>
                      <div className={styles.muted}>@{thread.author.username}</div>
                    </td>
                    <td>{thread.replyCount}</td>
                    <td className={styles.mono}>
                      {formatRelative(thread.lastActivityAt ?? thread.createdAt)}
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${thread.closed ? styles.statusArchived : styles.statusPublished}`}
                      >
                        {thread.closed ? 'Closed' : 'Open'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.threadActions}>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          disabled={actingId === thread.id}
                          onClick={() => void togglePin(thread)}
                        >
                          {thread.pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          disabled={actingId === thread.id}
                          onClick={() => void toggleClosed(thread)}
                        >
                          {thread.closed ? 'Reopen' : 'Close'}
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
