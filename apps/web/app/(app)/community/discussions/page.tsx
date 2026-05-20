'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import EmptyState from '../../_components/widgets/EmptyState';
import { createThread, listThreads, type CommunityThread } from '../../../lib/services/community';
import { useSession } from '../../_components/session-context';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { listCourses, type BackendCourse } from '../../../lib/services/backend-courses';

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

export default function DiscussionsPage() {
  const router = useRouter();
  const { user } = useSession();
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseList, setCourseList] = useState<BackendCourse[]>([]);

  const [threadOpen, setThreadOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadBody, setThreadBody] = useState('');
  const [threadSubmitting, setThreadSubmitting] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  async function handleThreadSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = threadTitle.trim();
    const body = threadBody.trim();
    if (!title || !courseId) return;
    setThreadSubmitting(true);
    setThreadError(null);
    try {
      const created = await createThread(courseId, { title, body: body || undefined });
      setThreadOpen(false);
      setThreadTitle('');
      setThreadBody('');
      router.push(`/community/discussions/${created.id}`);
    } catch (err) {
      setThreadError(friendlyMessage(err));
    } finally {
      setThreadSubmitting(false);
    }
  }

  const courses = useMemo(() => {
    return (user?.memberships ?? []).map((m) => ({ id: m.courseId, role: m.role }));
  }, [user]);

  const courseNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courseList) {
      map.set(c.id, c.title || c.code);
    }
    return map;
  }, [courseList]);

  useEffect(() => {
    void listCourses().then(setCourseList).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!courseId) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await listThreads(courseId, { limit: 30 });
      setThreads(response.items ?? []);
    } catch (err) {
      setError(friendlyMessage(err));
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!courseId && courses.length > 0) {
      setCourseId(courses[0].id);
      return;
    }
    void load();
  }, [load, courseId, courses]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aTime = a.lastActivityAt ?? a.createdAt;
      const bTime = b.lastActivityAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [threads]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Course Discussions</h1>
          <p className={styles.subtitle}>
            Long-form threads scoped to your courses — announcements, study groups, project chatter.
          </p>
        </div>
        {user ? (
          <button type="button" className={styles.startBtn} disabled={!courseId} onClick={() => setThreadOpen(true)}>
            Start a thread
          </button>
        ) : (
          <Link href="/connect" className={styles.startBtn}>
            Sign in to post
          </Link>
        )}
      </header>

      {threadOpen && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-label="Start a thread">
          <form className={styles.modal} onSubmit={handleThreadSubmit}>
            <h2 className={styles.modalTitle}>Start a thread</h2>
            <p className={styles.modalHint}>
              Threads are scoped to the selected course. Keep the title focused.
            </p>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="thread-title">Title</label>
              <input
                id="thread-title"
                className={styles.formInput}
                value={threadTitle}
                onChange={(e) => setThreadTitle(e.target.value)}
                placeholder="What do you want to discuss?"
                maxLength={160}
                autoFocus
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="thread-body">Details (optional)</label>
              <textarea
                id="thread-body"
                className={styles.formTextarea}
                value={threadBody}
                onChange={(e) => setThreadBody(e.target.value)}
                placeholder="Add context, links, or questions to kick off the discussion."
                rows={6}
              />
            </div>
            {threadError && (
              <p style={{ color: 'var(--danger, #ef4444)', fontSize: 12, margin: 0 }}>{threadError}</p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setThreadOpen(false); setThreadError(null); }}
                disabled={threadSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={threadSubmitting || !threadTitle.trim()}
              >
                {threadSubmitting ? 'Posting...' : 'Start thread'}
              </button>
            </div>
          </form>
        </div>
      )}

      {courses.length > 0 && (
        <div className={styles.filters}>
          <div className={styles.coursePicker} role="tablist" aria-label="Course filter">
            {courses.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={courseId === c.id}
                className={`${styles.courseChip} ${courseId === c.id ? styles.courseChipActive : ''}`}
                onClick={() => setCourseId(c.id)}
              >
                {courseNameMap.get(c.id) || c.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {!courseId ? (
        <EmptyState
          title={courses.length === 0 ? 'No courses to discuss' : 'Pick a course to see threads'}
          description={
            courses.length === 0
              ? 'Discussion threads are scoped per course. Enrol in a course to see its threads.'
              : 'Discussion threads are scoped per course. Choose one above to load its threads.'
          }
        />
      ) : loading ? (
        <div style={{ height: 280, borderRadius: 14, background: 'var(--surface)', border: '1px solid var(--border)' }} />
      ) : error ? (
        <EmptyState
          title="Discussions unavailable"
          description={error}
          tone="error"
          action={{ label: 'Retry', onClick: () => void load() }}
        />
      ) : sortedThreads.length === 0 ? (
        <EmptyState
          title="No threads yet"
          description="Be the first to start a discussion in this course."
        />
      ) : (
        <div className={styles.threadList}>
          {sortedThreads.map((thread) => (
            <Link
              key={thread.id}
              href={`/community/discussions/${thread.id}`}
              className={`${styles.thread} ${thread.pinned ? styles.threadPinned : ''} ${
                thread.closed ? styles.threadClosed : ''
              }`}
            >
              <div className={styles.body}>
                <div className={styles.threadTitleRow}>
                  <h2 className={styles.threadTitle}>{thread.title}</h2>
                  {thread.pinned && <span className={styles.pinnedTag}>Pinned</span>}
                  {thread.closed && <span className={styles.closedTag}>Closed</span>}
                </div>
                {thread.body && <p className={styles.snippet}>{thread.body}</p>}
                <div className={styles.threadMeta}>
                  <span>{thread.author.username}</span>
                  <span>·</span>
                  <span>{formatRelative(thread.lastActivityAt ?? thread.createdAt)}</span>
                  {thread.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className={styles.threadStats}>
                <strong>{thread.replyCount}</strong>
                <span>replies</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
