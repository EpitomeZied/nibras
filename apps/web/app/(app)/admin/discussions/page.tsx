'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listDiscussionCourses,
  listThreadsAdmin,
  setThreadClosed,
  setThreadModeration,
  setThreadPinned,
  updateThread,
  type AdminDiscussionThread,
  type CommunityThread,
  type ThreadModerationStatus,
} from '../../../lib/services/community';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { useSession } from '../../_components/session-context';
import EmptyState from '../../_components/widgets/EmptyState';
import Skeleton from '../../_components/widgets/Skeleton';
import { useDebounce } from '../../../lib/hooks/use-debounce';
import styles from '../../instructor/instructor.module.css';

type DiscussionCourse = { id: string; title: string; courseCode: string };

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

export default function AdminDiscussionsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const isAdmin = user?.systemRole === 'admin';

  const [threads, setThreads] = useState<AdminDiscussionThread[]>([]);
  const [courses, setCourses] = useState<DiscussionCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const [courseId, setCourseId] = useState('');
  const [status, setStatus] = useState<ThreadModerationStatus | 'all'>('all');
  const [pinnedFilter, setPinnedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [closedFilter, setClosedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [searchQ, setSearchQ] = useState('');
  const debouncedSearchQ = useDebounce(searchQ, 300);

  const [editThread, setEditThread] = useState<AdminDiscussionThread | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editTags, setEditTags] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listThreadsAdmin({
        courseId: courseId || undefined,
        q: debouncedSearchQ || undefined,
        status,
        pinned: pinnedFilter === 'all' ? undefined : pinnedFilter === 'yes',
        closed: closedFilter === 'all' ? undefined : closedFilter === 'yes',
        limit: 50,
      });
      setThreads(result.items);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId, debouncedSearchQ, status, pinnedFilter, closedFilter]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isAdmin) {
      router.replace('/admin');
      return;
    }
    void listDiscussionCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [sessionLoading, isAdmin, router]);

  useEffect(() => {
    if (sessionLoading || !isAdmin) return;
    void load();
  }, [sessionLoading, isAdmin, load]);

  async function runAction(
    threadId: string,
    fn: () => Promise<AdminDiscussionThread | CommunityThread>
  ) {
    setActingId(threadId);
    try {
      const updated = await fn();
      setThreads((prev) => prev.map((t) => (t.id === threadId ? { ...t, ...updated } : t)));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setActingId(null);
    }
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editThread) return;
    const title = editTitle.trim();
    if (!title) return;
    setActingId(editThread.id);
    try {
      const updated = await updateThread(editThread.id, {
        title,
        body: editBody.trim(),
        tags: editTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setThreads((prev) => prev.map((t) => (t.id === editThread.id ? { ...t, ...updated } : t)));
      setEditThread(null);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setActingId(null);
    }
  }

  if (sessionLoading || !isAdmin) return null;

  return (
    <div className={styles.page} style={{ maxWidth: 1100 }}>
      <header className={styles.pageHeader}>
        <div>
          <Link href="/admin" style={{ fontSize: 13 }}>
            ← Admin
          </Link>
          <h1 style={{ margin: '8px 0 4px' }}>Course discussions</h1>
          <p className={styles.subtitle}>
            Browse, pin, close, edit, and moderate discussion threads across all courses.
          </p>
        </div>
      </header>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16,
          alignItems: 'flex-end',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          Course
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, minWidth: 180 }}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.courseCode} — {c.title}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ThreadModerationStatus | 'all')}
            style={{ padding: '6px 10px', borderRadius: 8 }}
          >
            <option value="all">All</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="removed">Removed</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          Pinned
          <select
            value={pinnedFilter}
            onChange={(e) => setPinnedFilter(e.target.value as 'all' | 'yes' | 'no')}
            style={{ padding: '6px 10px', borderRadius: 8 }}
          >
            <option value="all">Any</option>
            <option value="yes">Pinned</option>
            <option value="no">Not pinned</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
          Closed
          <select
            value={closedFilter}
            onChange={(e) => setClosedFilter(e.target.value as 'all' | 'yes' | 'no')}
            style={{ padding: '6px 10px', borderRadius: 8 }}
          >
            <option value="all">Any</option>
            <option value="yes">Closed</option>
            <option value="no">Open</option>
          </select>
        </label>
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            fontSize: 12,
            flex: 1,
            minWidth: 200,
          }}
        >
          Search
          <input
            type="search"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Title or body…"
            style={{ padding: '6px 10px', borderRadius: 8, width: '100%' }}
          />
        </label>
      </div>

      {loading ? (
        <Skeleton variant="card" height={72} count={5} />
      ) : error ? (
        <EmptyState
          title="Could not load threads"
          description={error}
          tone="error"
          action={{ label: 'Retry', onClick: () => void load() }}
        />
      ) : threads.length === 0 ? (
        <EmptyState title="No threads" description="No discussion threads match your filters." />
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {threads.map((thread) => (
            <li
              key={thread.id}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 14,
                background: 'var(--surface)',
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
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <strong>{thread.title}</strong>
                    {thread.pinned && (
                      <span
                        style={{ fontSize: 10, fontWeight: 700, color: 'var(--warning, #f59e0b)' }}
                      >
                        PINNED
                      </span>
                    )}
                    {thread.closed && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>
                        CLOSED
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        color:
                          thread.moderationStatus === 'visible'
                            ? 'var(--primary, #22c55e)'
                            : 'var(--danger, #ef4444)',
                      }}
                    >
                      {thread.moderationStatus}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-muted)' }}>
                    {thread.courseCode ?? thread.courseId}
                    {thread.courseTitle ? ` · ${thread.courseTitle}` : ''} ·{' '}
                    {thread.author.username} ·{' '}
                    {formatRelative(thread.lastActivityAt ?? thread.createdAt)} ·{' '}
                    {thread.replyCount} replies
                  </p>
                </div>
                <div
                  style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'flex-start' }}
                >
                  <Link href={`/community/discussions/${thread.id}`} style={{ fontSize: 12 }}>
                    View
                  </Link>
                  <button
                    type="button"
                    disabled={actingId === thread.id}
                    onClick={() =>
                      void runAction(thread.id, () => setThreadPinned(thread.id, !thread.pinned))
                    }
                  >
                    {thread.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    type="button"
                    disabled={actingId === thread.id}
                    onClick={() =>
                      void runAction(thread.id, () => setThreadClosed(thread.id, !thread.closed))
                    }
                  >
                    {thread.closed ? 'Reopen' : 'Close'}
                  </button>
                  <button
                    type="button"
                    disabled={actingId === thread.id}
                    onClick={() => {
                      setEditThread(thread);
                      setEditTitle(thread.title);
                      setEditBody(thread.body ?? '');
                      setEditTags(thread.tags.join(', '));
                    }}
                  >
                    Edit
                  </button>
                  {thread.moderationStatus !== 'hidden' && (
                    <button
                      type="button"
                      disabled={actingId === thread.id}
                      onClick={() =>
                        void runAction(thread.id, () => setThreadModeration(thread.id, 'hidden'))
                      }
                    >
                      Hide
                    </button>
                  )}
                  {thread.moderationStatus !== 'removed' && (
                    <button
                      type="button"
                      disabled={actingId === thread.id}
                      onClick={() =>
                        void runAction(thread.id, () => setThreadModeration(thread.id, 'removed'))
                      }
                    >
                      Remove
                    </button>
                  )}
                  {thread.moderationStatus !== 'visible' && (
                    <button
                      type="button"
                      disabled={actingId === thread.id}
                      onClick={() =>
                        void runAction(thread.id, () => setThreadModeration(thread.id, 'visible'))
                      }
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editThread && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit thread"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditThread(null);
          }}
        >
          <form
            onSubmit={handleEditSubmit}
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: 20,
              width: '100%',
              maxWidth: 520,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>Edit thread</h2>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              Title
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              Body
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={5}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              Tags (comma-separated)
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setEditThread(null)}>
                Cancel
              </button>
              <button type="submit" disabled={actingId === editThread.id || !editTitle.trim()}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
