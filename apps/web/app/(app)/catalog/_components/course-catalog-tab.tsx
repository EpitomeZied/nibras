'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CourseBrowseItem } from '@nibras/contracts';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import {
  browseCourses,
  enrollInCourse,
  requestCourseAccess,
} from '../../../lib/services/course-profile';
import { useSession } from '../../_components/session-context';
import s from '../page.module.css';

type CourseFilter = 'all' | 'public' | 'my-year' | 'enrolled';

function promptInviteCode(router: ReturnType<typeof useRouter>) {
  const code = window.prompt('Enter your invite code');
  if (code?.trim()) {
    router.push(`/join/${encodeURIComponent(code.trim())}`);
  }
}

export default function CourseCatalogTab() {
  const router = useRouter();
  const { user, refreshSession } = useSession();
  const [courses, setCourses] = useState<CourseBrowseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CourseFilter>('all');
  const [search, setSearch] = useState('');
  const [actionCourseId, setActionCourseId] = useState<string | null>(null);
  const [requestTarget, setRequestTarget] = useState<CourseBrowseItem | null>(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const yearLevel = user?.yearLevel ?? 1;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCourses(await browseCourses());
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((course) => {
      if (filter === 'public' && !course.isPublic) return false;
      if (filter === 'enrolled' && !course.isEnrolled) return false;
      if (filter === 'my-year' && !course.termLabel.startsWith(`Year ${yearLevel}`)) return false;
      if (!q) return true;
      return (
        course.title.toLowerCase().includes(q) ||
        course.courseCode.toLowerCase().includes(q) ||
        course.termLabel.toLowerCase().includes(q) ||
        (course.description ?? '').toLowerCase().includes(q)
      );
    });
  }, [courses, filter, search, yearLevel]);

  async function handleJoin(courseId: string) {
    setActionCourseId(courseId);
    try {
      await enrollInCourse(courseId);
      await refreshSession();
      router.push(`/catalog/${courseId}`);
    } catch (err) {
      setToast(friendlyMessage(err));
      setTimeout(() => setToast(''), 5000);
    } finally {
      setActionCourseId(null);
    }
  }

  async function handleRequestSubmit() {
    if (!requestTarget) return;
    setRequestSubmitting(true);
    try {
      await requestCourseAccess(requestTarget.id, {
        message: requestMessage.trim() || undefined,
      });
      setRequestTarget(null);
      setRequestMessage('');
      setToast('Access request sent. Your instructor will review it.');
      setTimeout(() => setToast(''), 5000);
      await load();
    } catch (err) {
      setToast(friendlyMessage(err));
      setTimeout(() => setToast(''), 5000);
    } finally {
      setRequestSubmitting(false);
    }
  }

  return (
    <>
      {toast && <div className={s.toast}>{toast}</div>}

      <p className={s.tabIntro}>
        Browse courses you can join or request access to. Public courses open instantly; private
        courses need instructor approval.
      </p>

      <div className={s.courseToolbar}>
        <div className={s.filterPills} role="group" aria-label="Course filters">
          {(
            [
              ['all', 'All'],
              ['public', 'Public'],
              ['my-year', 'My year'],
              ['enrolled', 'Enrolled'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? `${s.filterPill} ${s.filterPillActive}` : s.filterPill}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          className={s.courseSearch}
          placeholder="Search by title, code, or term…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search courses"
        />
      </div>

      {error && (
        <div className={s.errorBar} role="alert">
          {error}{' '}
          <button type="button" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className={s.cardGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={s.skeletonCard}>
              <span className={s.skeletonLine} style={{ width: '50%', height: 18 }} aria-hidden />
              <span className={s.skeletonLine} style={{ width: '35%', height: 12 }} aria-hidden />
              <span className={s.skeletonLine} style={{ width: '100%', height: 12 }} aria-hidden />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={s.emptyState}>
          <span className={s.emptyEmoji} aria-hidden>
            🎓
          </span>
          <h2 className={s.emptyTitle}>No courses found</h2>
          <p className={s.emptyBody}>
            {courses.length === 0
              ? 'No courses are available for discovery yet.'
              : 'Try a different filter or search term.'}
          </p>
          <button
            type="button"
            className={s.inviteLinkBtn}
            onClick={() => promptInviteCode(router)}
          >
            Have an invite code?
          </button>
        </div>
      ) : (
        <>
          <p className={s.resultsCount}>
            {filtered.length} course{filtered.length !== 1 ? 's' : ''} found
          </p>
          <div className={s.cardGrid}>
            {filtered.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                busy={actionCourseId === course.id}
                onJoin={() => void handleJoin(course.id)}
                onRequest={() => setRequestTarget(course)}
                onOpen={() => router.push(`/catalog/${course.id}`)}
              />
            ))}
          </div>
          <p className={s.inviteFooter}>
            <button
              type="button"
              className={s.inviteLinkBtn}
              onClick={() => promptInviteCode(router)}
            >
              Have an invite code?
            </button>
          </p>
        </>
      )}

      {requestTarget && (
        <div className={s.modalBackdrop} role="presentation" onClick={() => setRequestTarget(null)}>
          <div
            className={s.modal}
            role="dialog"
            aria-labelledby="request-access-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="request-access-title" className={s.modalTitle}>
              Request access
            </h2>
            <p className={s.modalSub}>
              {requestTarget.title} ({requestTarget.courseCode}) is private. Send an optional
              message to the instructor.
            </p>
            <textarea
              className={s.modalTextarea}
              rows={4}
              maxLength={500}
              placeholder="Why do you want to join this course? (optional)"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
            />
            <div className={s.modalActions}>
              <button
                type="button"
                className={s.ctaDisabled}
                style={{ cursor: 'pointer', opacity: 1 }}
                onClick={() => setRequestTarget(null)}
                disabled={requestSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={s.ctaPrimary}
                onClick={() => void handleRequestSubmit()}
                disabled={requestSubmitting}
              >
                {requestSubmitting ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CourseCard({
  course,
  busy,
  onJoin,
  onRequest,
  onOpen,
}: {
  course: CourseBrowseItem;
  busy: boolean;
  onJoin: () => void;
  onRequest: () => void;
  onOpen: () => void;
}) {
  const pending = course.enrollmentRequestStatus === 'pending';
  const rejected = course.enrollmentRequestStatus === 'rejected';

  return (
    <article className={s.card}>
      <div className={s.badgeRow}>
        <span className={`${s.badge} ${s.badgeCourse}`}>{course.courseCode}</span>
        {course.isPublic && <span className={`${s.badge} ${s.badgePublic}`}>Public</span>}
        {course.isEnrolled && <span className={`${s.badge} ${s.badgeEnrolled}`}>Enrolled</span>}
        {pending && <span className={`${s.badge} ${s.badgePending}`}>Request pending</span>}
      </div>

      <div>
        <h3 className={s.cardTitle}>{course.title}</h3>
        <p className={s.cardCourseName}>{course.termLabel}</p>
        {course.description && <p className={s.cardDesc}>{course.description}</p>}
      </div>

      <div className={s.cardCta}>
        {course.isEnrolled ? (
          <button type="button" className={s.ctaPrimary} onClick={onOpen}>
            Open course →
          </button>
        ) : course.isPublic ? (
          <button type="button" className={s.ctaPrimary} onClick={onJoin} disabled={busy}>
            {busy ? 'Joining…' : 'Join course'}
          </button>
        ) : pending ? (
          <button type="button" disabled className={s.ctaDisabled}>
            Request pending
          </button>
        ) : (
          <button type="button" className={s.ctaPrimary} onClick={onRequest}>
            {rejected ? 'Request again' : 'Request access'}
          </button>
        )}
      </div>
    </article>
  );
}
