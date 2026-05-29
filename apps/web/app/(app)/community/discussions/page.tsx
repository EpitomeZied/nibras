'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';
import CommunityAuthorLink from '../_components/community-author-link';
import EmptyState from '../../_components/widgets/EmptyState';
import Skeleton from '../../_components/widgets/Skeleton';
import MarkdownToolbar from '../../_components/widgets/MarkdownToolbar';
import type { TrackingCourseSummary } from '@nibras/contracts';
import {
  createThread,
  listDiscussionCourses,
  listThreads,
  listThreadsAcrossCourses,
  type CommunityThread,
} from '../../../lib/services/community';
import { useSession } from '../../_components/session-context';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { apiFetch } from '../../../lib/session';
import { stripMarkdown } from '../../../lib/strip-markdown';
import { useDebounce } from '../../../lib/hooks/use-debounce';

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

export default function DiscussionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: sessionLoading } = useSession();
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [courseId, setCourseId] = useState<string | undefined>(
    () => searchParams.get('courseId') ?? undefined
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<DiscussionCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  const [threadOpen, setThreadOpen] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadBody, setThreadBody] = useState('');
  const [threadTags, setThreadTags] = useState('');
  const [threadSubmitting, setThreadSubmitting] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [feedScope, setFeedScope] = useState<'course' | 'all'>('course');
  const [searchQ, setSearchQ] = useState('');
  const debouncedSearchQ = useDebounce(searchQ, 300);
  const threadBodyRef = useRef<HTMLTextAreaElement>(null);

  async function handleThreadSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = threadTitle.trim();
    const body = threadBody.trim();
    if (!title || (feedScope === 'course' && !courseId)) return;
    setThreadSubmitting(true);
    setThreadError(null);
    try {
      const parsedTags = threadTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const targetCourseId = courseId ?? courses[0]?.id;
      if (!targetCourseId) throw new Error('No course selected.');
      const created = await createThread(targetCourseId, {
        title,
        body: body || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });
      setThreadOpen(false);
      setThreadTitle('');
      setThreadBody('');
      setThreadTags('');
      router.push(`/community/discussions/${created.id}`);
    } catch (err) {
      setThreadError(friendlyMessage(err));
    } finally {
      setThreadSubmitting(false);
    }
  }

  const courseNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of courses) {
      map.set(c.id, c.title || c.courseCode);
    }
    return map;
  }, [courses]);

  useEffect(() => {
    if (sessionLoading) return;
    let alive = true;
    setCoursesLoading(true);
    setCoursesError(null);
    void (async () => {
      try {
        if (user) {
          const res = await apiFetch('/v1/tracking/courses', { auth: true });
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as { error?: string };
            throw new Error(body.error || `Failed to load courses (${res.status}).`);
          }
          const list = (await res.json()) as TrackingCourseSummary[];
          if (!alive) return;
          setCourses(
            list.map((c) => ({
              id: c.id,
              title: c.title,
              courseCode: c.courseCode,
            }))
          );
        } else {
          const list = await listDiscussionCourses();
          if (!alive) return;
          setCourses(list);
        }
      } catch (err) {
        if (!alive) return;
        setCourses([]);
        setCoursesError(friendlyMessage(err));
      } finally {
        if (alive) setCoursesLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, sessionLoading]);

  const load = useCallback(async () => {
    if (feedScope === 'course' && !courseId) {
      setThreads([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response =
        feedScope === 'all'
          ? await listThreadsAcrossCourses({ limit: 30, q: debouncedSearchQ || undefined })
          : await listThreads(courseId!, {
              limit: 30,
              q: debouncedSearchQ || undefined,
            });
      setThreads(response.items ?? []);
    } catch (err) {
      setError(friendlyMessage(err));
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [courseId, feedScope, debouncedSearchQ]);

  useEffect(() => {
    const fromUrl = searchParams.get('courseId');
    if (fromUrl && fromUrl !== courseId) {
      setCourseId(fromUrl);
    }
  }, [searchParams, courseId]);

  useEffect(() => {
    if (feedScope === 'all') {
      void load();
      return;
    }
    if (!courseId && courses.length > 0) {
      setCourseId(courses[0].id);
      return;
    }
    void load();
  }, [load, courseId, courses, feedScope]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aTime = a.lastActivityAt ?? a.createdAt;
      const bTime = b.lastActivityAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [threads]);

  useEffect(() => {
    if (!threadOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setThreadOpen(false);
        setThreadError(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [threadOpen]);

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
          <button
            type="button"
            className={styles.startBtn}
            disabled={!courseId}
            onClick={() => setThreadOpen(true)}
          >
            Start a thread
          </button>
        ) : (
          <Link href="/connect" className={styles.startBtn}>
            Sign in to post
          </Link>
        )}
      </header>

      {threadOpen && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Start a thread"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setThreadOpen(false);
              setThreadError(null);
            }
          }}
        >
          <form className={styles.modal} onSubmit={handleThreadSubmit}>
            <h2 className={styles.modalTitle}>Start a thread</h2>
            <p className={styles.modalHint}>
              Threads are scoped to the selected course. Keep the title focused.
            </p>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="thread-title">
                Title
              </label>
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
              <label className={styles.formLabel} htmlFor="thread-body">
                Details (optional)
              </label>
              <MarkdownToolbar textareaRef={threadBodyRef} onChange={setThreadBody} />
              <textarea
                ref={threadBodyRef}
                id="thread-body"
                className={styles.formTextarea}
                value={threadBody}
                onChange={(e) => setThreadBody(e.target.value)}
                placeholder="Add context, links, or questions to kick off the discussion."
                rows={6}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="thread-tags">
                Tags (optional)
              </label>
              <input
                id="thread-tags"
                className={styles.formInput}
                value={threadTags}
                onChange={(e) => setThreadTags(e.target.value)}
                placeholder="e.g. homework, midterm"
              />
            </div>
            {threadError && (
              <p style={{ color: 'var(--danger, #ef4444)', fontSize: 12, margin: 0 }}>
                {threadError}
              </p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setThreadOpen(false);
                  setThreadError(null);
                }}
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
          <div className={styles.coursePicker} role="tablist" aria-label="Feed scope">
            <button
              type="button"
              role="tab"
              aria-selected={feedScope === 'all'}
              className={`${styles.courseChip} ${feedScope === 'all' ? styles.courseChipActive : ''}`}
              onClick={() => setFeedScope('all')}
            >
              All courses
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={feedScope === 'course'}
              className={`${styles.courseChip} ${feedScope === 'course' ? styles.courseChipActive : ''}`}
              onClick={() => setFeedScope('course')}
            >
              Per course
            </button>
          </div>
          <div className={styles.searchWrap} style={{ marginTop: 10 }}>
            <input
              className={styles.formInput}
              placeholder="Search discussions"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
          {feedScope === 'course' && (
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
          )}
        </div>
      )}

      {sessionLoading || coursesLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton variant="card" height={72} count={4} />
        </div>
      ) : coursesError ? (
        <EmptyState
          title="Could not load your courses"
          description={coursesError}
          tone="error"
          action={{
            label: 'Retry',
            onClick: () => {
              setCoursesLoading(true);
              setCoursesError(null);
              void apiFetch('/v1/tracking/courses', { auth: true })
                .then(async (res) => {
                  if (!res.ok) throw new Error(`Failed (${res.status})`);
                  const list = (await res.json()) as TrackingCourseSummary[];
                  setCourses(
                    list.map((c) => ({
                      id: c.id,
                      title: c.title,
                      courseCode: c.courseCode,
                    }))
                  );
                })
                .catch((err) => setCoursesError(friendlyMessage(err)))
                .finally(() => setCoursesLoading(false));
            },
          }}
        />
      ) : !courseId && feedScope === 'course' ? (
        <EmptyState
          title={
            courses.length === 0 ? 'No discussion courses yet' : 'Pick a course to see threads'
          }
          description={
            courses.length === 0
              ? user
                ? 'No active courses are assigned to your year level yet. Check Projects or ask your instructor.'
                : 'No course discussions are available to browse yet. Sign in to post or start a thread.'
              : 'Discussion threads are scoped per course. Choose one above to load its threads.'
          }
          action={
            !user && courses.length === 0
              ? { label: 'Sign in', onClick: () => router.push('/connect') }
              : undefined
          }
        />
      ) : loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton variant="card" height={72} count={4} />
        </div>
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
            <div
              key={thread.id}
              className={`${styles.thread} ${thread.pinned ? styles.threadPinned : ''} ${
                thread.closed ? styles.threadClosed : ''
              }`}
            >
              <div className={styles.body}>
                <Link
                  href={`/community/discussions/${thread.id}`}
                  className={styles.threadMainLink}
                >
                  <div className={styles.threadTitleRow}>
                    <h2 className={styles.threadTitle}>{thread.title}</h2>
                    {thread.pinned && <span className={styles.pinnedTag}>Pinned</span>}
                    {thread.closed && <span className={styles.closedTag}>Closed</span>}
                  </div>
                  {thread.body && <p className={styles.snippet}>{stripMarkdown(thread.body)}</p>}
                </Link>
                <div className={styles.threadMeta}>
                  <CommunityAuthorLink author={thread.author} showAvatar avatarSize={18} />
                  <span>·</span>
                  <span>{formatRelative(thread.lastActivityAt ?? thread.createdAt)}</span>
                  {thread.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                href={`/community/discussions/${thread.id}`}
                className={styles.threadStats}
              >
                <strong>{thread.replyCount}</strong>
                <span>replies</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
