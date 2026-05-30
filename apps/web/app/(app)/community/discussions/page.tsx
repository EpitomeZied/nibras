'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';
import CommunityAuthorLink from '../_components/community-author-link';
import CommunityVerseFooter from '../_components/community-verse-footer';
import EmptyState from '../../_components/widgets/EmptyState';
import Skeleton from '../../_components/widgets/Skeleton';
import MarkdownToolbar from '../../_components/widgets/MarkdownToolbar';
import type { TrackingCourseSummary } from '@nibras/contracts';
import {
  canModerateDiscussion,
  createThread,
  listDiscussionCourses,
  listThreads,
  listThreadsAcrossCourses,
  setThreadClosed,
  setThreadPinned,
  type CommunityThread,
} from '../../../lib/services/community';
import { useSession } from '../../_components/session-context';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { apiFetch } from '../../../lib/session';
import { stripMarkdown } from '../../../lib/strip-markdown';
import { useDebounce } from '../../../lib/hooks/use-debounce';

type DiscussionCourse = { id: string; title: string; courseCode: string };
type StatusFilter = 'all' | 'open' | 'unanswered';

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'unanswered', label: 'Unanswered' },
];

const PAGE_LIMIT = 30;

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

function statusFilterLabel(value: StatusFilter): string {
  return STATUS_FILTERS.find((s) => s.value === value)?.label ?? value;
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
  const [threadModalCourseId, setThreadModalCourseId] = useState<string>('');
  const [threadSubmitting, setThreadSubmitting] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [feedScope, setFeedScope] = useState<'course' | 'all'>('course');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQ, setSearchQ] = useState('');
  const debouncedSearchQ = useDebounce(searchQ, 300);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const threadBodyRef = useRef<HTMLTextAreaElement>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  const activeCourseId = courseId ?? courses[0]?.id;
  const showModalCoursePicker = feedScope === 'all' || !courseId;
  const canStartThread = courses.length > 0;

  function openThreadModal() {
    setThreadModalCourseId(courseId ?? courses[0]?.id ?? '');
    setThreadOpen(true);
  }

  async function handleListPinToggle(thread: CommunityThread, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setModeratingId(thread.id);
    const nextPinned = !thread.pinned;
    setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, pinned: nextPinned } : t)));
    try {
      const updated = await setThreadPinned(thread.id, nextPinned);
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? updated : t)));
    } catch (err) {
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, pinned: thread.pinned } : t))
      );
      setError(friendlyMessage(err));
    } finally {
      setModeratingId(null);
    }
  }

  async function handleListCloseToggle(thread: CommunityThread, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setModeratingId(thread.id);
    const nextClosed = !thread.closed;
    setThreads((prev) => prev.map((t) => (t.id === thread.id ? { ...t, closed: nextClosed } : t)));
    try {
      const updated = await setThreadClosed(thread.id, nextClosed);
      setThreads((prev) => prev.map((t) => (t.id === thread.id ? updated : t)));
    } catch (err) {
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, closed: thread.closed } : t))
      );
      setError(friendlyMessage(err));
    } finally {
      setModeratingId(null);
    }
  }

  async function handleThreadSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = threadTitle.trim();
    const body = threadBody.trim();
    const targetCourseId = showModalCoursePicker
      ? threadModalCourseId
      : (courseId ?? courses[0]?.id);
    if (!title || !targetCourseId) return;
    setThreadSubmitting(true);
    setThreadError(null);
    try {
      const parsedTags = threadTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const created = await createThread(targetCourseId, {
        title,
        body: body || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });
      setThreadOpen(false);
      setThreadTitle('');
      setThreadBody('');
      setThreadTags('');
      setThreadModalCourseId('');
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
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response =
        feedScope === 'all'
          ? await listThreadsAcrossCourses({
              limit: PAGE_LIMIT,
              page,
              q: debouncedSearchQ || undefined,
            })
          : await listThreads(courseId!, {
              limit: PAGE_LIMIT,
              page,
              q: debouncedSearchQ || undefined,
            });
      setThreads(response.items ?? []);
      const total = response.total ?? 0;
      const limit = response.limit ?? PAGE_LIMIT;
      setTotalPages(Math.max(1, Math.ceil(total / limit)));
    } catch (err) {
      setError(friendlyMessage(err));
      setThreads([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [courseId, feedScope, debouncedSearchQ, page]);

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

  useEffect(() => {
    setPage(1);
  }, [feedScope, courseId, debouncedSearchQ]);

  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aTime = a.lastActivityAt ?? a.createdAt;
      const bTime = b.lastActivityAt ?? b.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [threads]);

  const displayedThreads = useMemo(() => {
    if (statusFilter === 'open') {
      return sortedThreads.filter((t) => !t.closed);
    }
    if (statusFilter === 'unanswered') {
      return sortedThreads.filter((t) => t.replyCount === 0);
    }
    return sortedThreads;
  }, [sortedThreads, statusFilter]);

  const hasActiveFilters =
    searchQ.trim().length > 0 ||
    (feedScope === 'course' && courseId != null) ||
    statusFilter !== 'all';

  function clearAllFilters() {
    setSearchQ('');
    setStatusFilter('all');
    if (feedScope === 'course' && courses.length > 0) {
      setCourseId(courses[0].id);
    }
  }

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
            disabled={!canStartThread}
            onClick={openThreadModal}
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
            {showModalCoursePicker && courses.length > 0 && (
              <div className={styles.formRow}>
                <label className={styles.formLabel} htmlFor="thread-course">
                  Course
                </label>
                <select
                  id="thread-course"
                  className={styles.formSelect}
                  value={threadModalCourseId}
                  onChange={(e) => setThreadModalCourseId(e.target.value)}
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {courseNameMap.get(c.id) || c.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                autoFocus={!showModalCoursePicker}
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
                disabled={
                  threadSubmitting ||
                  !threadTitle.trim() ||
                  (showModalCoursePicker && !threadModalCourseId)
                }
              >
                {threadSubmitting ? 'Posting...' : 'Start thread'}
              </button>
            </div>
          </form>
        </div>
      )}

      {courses.length > 0 && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
                <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                className={styles.searchInput}
                placeholder="Search discussions"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
              />
            </div>
            <div className={styles.toolbarRight}>
              <div role="tablist" aria-label="Feed scope" className={styles.tabs}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={feedScope === 'all'}
                  className={`${styles.tab} ${feedScope === 'all' ? styles.tabActive : ''}`}
                  onClick={() => setFeedScope('all')}
                >
                  All courses
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={feedScope === 'course'}
                  className={`${styles.tab} ${feedScope === 'course' ? styles.tabActive : ''}`}
                  onClick={() => setFeedScope('course')}
                >
                  Per course
                </button>
              </div>
              <div role="tablist" aria-label="Status filter" className={styles.tabs}>
                {STATUS_FILTERS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="tab"
                    aria-selected={statusFilter === s.value}
                    className={`${styles.tab} ${statusFilter === s.value ? styles.tabActive : ''}`}
                    onClick={() => setStatusFilter(s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {feedScope === 'course' && (
            <div className={styles.courseFilter} role="tablist" aria-label="Course filter">
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

          {hasActiveFilters && (
            <div className={styles.activeFilters}>
              {searchQ.trim() && (
                <span className={styles.activeFilterPill}>
                  search: <strong>{searchQ.trim()}</strong>
                  <button type="button" aria-label="Clear search" onClick={() => setSearchQ('')}>
                    ×
                  </button>
                </span>
              )}
              {feedScope === 'course' && courseId && (
                <span className={styles.activeFilterPill}>
                  course: <strong>{courseNameMap.get(courseId) ?? courseId}</strong>
                  <button
                    type="button"
                    aria-label="Clear course filter"
                    onClick={() => {
                      if (courses.length > 0) setCourseId(courses[0].id);
                    }}
                  >
                    ×
                  </button>
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className={styles.activeFilterPill}>
                  status: <strong>{statusFilterLabel(statusFilter)}</strong>
                  <button
                    type="button"
                    aria-label="Clear status filter"
                    onClick={() => setStatusFilter('all')}
                  >
                    ×
                  </button>
                </span>
              )}
              <button type="button" className={styles.clearAllBtn} onClick={clearAllFilters}>
                Clear all
              </button>
            </div>
          )}
        </>
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
      ) : displayedThreads.length === 0 ? (
        <EmptyState
          title={statusFilter !== 'all' ? 'No threads match' : 'No threads yet'}
          description={
            statusFilter !== 'all'
              ? 'Try a different status filter or clear your search.'
              : 'Be the first to start a discussion in this course.'
          }
        />
      ) : (
        <div className={styles.threadList}>
          {displayedThreads.map((thread) => (
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
                <div className={styles.metaRow}>
                  <span className={styles.stat}>
                    <strong>{thread.replyCount}</strong> replies
                  </span>
                  {feedScope === 'all' && thread.courseId && (
                    <span className={styles.courseBadge}>
                      {courseNameMap.get(thread.courseId) ?? thread.courseTitle ?? thread.courseCode ?? 'Course'}
                    </span>
                  )}
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
              {canModerateDiscussion(user, thread.courseId ?? activeCourseId) && (
                <div className={styles.threadAside}>
                  <div className={styles.threadModActions}>
                    <button
                      type="button"
                      className={styles.modBtn}
                      disabled={moderatingId === thread.id}
                      title={thread.pinned ? 'Unpin' : 'Pin'}
                      onClick={(e) => void handleListPinToggle(thread, e)}
                    >
                      {thread.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      type="button"
                      className={styles.modBtn}
                      disabled={moderatingId === thread.id}
                      title={thread.closed ? 'Reopen' : 'Close'}
                      onClick={(e) => void handleListCloseToggle(thread, e)}
                    >
                      {thread.closed ? 'Open' : 'Close'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && !loading && !error && displayedThreads.length > 0 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.cancelBtn}
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            &larr; Previous
          </button>
          <span className={styles.paginationLabel}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.cancelBtn}
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next &rarr;
          </button>
        </div>
      )}

      <CommunityVerseFooter />
    </div>
  );
}
