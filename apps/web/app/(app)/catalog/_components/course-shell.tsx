'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { TrackingCourseDetail } from '@nibras/contracts';
import { getCourseDetail } from '../../../lib/services/course-profile';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import styles from './course-shell.module.css';

export type CourseTab = 'overview' | 'lectures' | 'assignments' | 'grades';

type CourseShellContextValue = {
  course: TrackingCourseDetail | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const CourseShellContext = createContext<CourseShellContextValue | null>(null);

export function useCourseShell(): CourseShellContextValue {
  const ctx = useContext(CourseShellContext);
  if (!ctx) {
    throw new Error('useCourseShell must be used within CourseShell');
  }
  return ctx;
}

type Props = {
  courseId: string;
  children: ReactNode;
};

function resolveActiveTab(pathname: string, courseId: string): CourseTab {
  const base = `/catalog/${courseId}`;
  if (pathname.startsWith(`${base}/videos`)) return 'lectures';
  if (pathname.startsWith(`${base}/assignments`)) return 'assignments';
  if (pathname.startsWith(`${base}/grades`)) return 'grades';
  return 'overview';
}

export default function CourseShell({ courseId, children }: Props) {
  const pathname = usePathname() ?? '';
  const activeTab = resolveActiveTab(pathname, courseId);
  const [course, setCourse] = useState<TrackingCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      setCourse(await getCourseDetail(courseId));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const base = `/catalog/${courseId}`;

  const shellValue: CourseShellContextValue = {
    course,
    loading,
    error,
    reload: load,
  };

  return (
    <CourseShellContext.Provider value={shellValue}>
      <div className={styles.page}>
        <Link href="/courses" className={styles.back}>
          ← My courses
        </Link>

        {loading && <div className={styles.skeleton} aria-hidden />}
        {error && (
          <p className={styles.error}>
            {error}{' '}
            <button type="button" onClick={() => void load()}>
              Retry
            </button>
          </p>
        )}

        {course && !loading && (
          <header className={styles.hero}>
            <div className={styles.heroGlow} aria-hidden />
            <div className={styles.heroInner}>
              {course.thumbnailUrl && (
                <img src={course.thumbnailUrl} alt="" className={styles.thumb} />
              )}
              <div className={styles.heroText}>
                <span className={styles.eyebrow}>Course</span>
                <h1 className={styles.title}>{course.title}</h1>
                <p className={styles.meta}>
                  {course.courseCode} · {course.termLabel}
                  {course.isPublic && <span className={styles.publicTag}> · Public</span>}
                </p>
                <div className={styles.stats}>
                  <span>{course.videoProgressPercent ?? 0}% lectures watched</span>
                  <span>{course.publishedAssignmentCount ?? 0} assignments</span>
                  <span>{course.projectCount ?? 0} projects</span>
                </div>
              </div>
            </div>
          </header>
        )}

        <nav className={styles.tabs} aria-label="Course sections">
          <Link
            href={base}
            className={`${styles.tab} ${activeTab === 'overview' ? styles.tabActive : ''}`}
          >
            Overview
          </Link>
          <Link
            href={`${base}/videos`}
            className={`${styles.tab} ${activeTab === 'lectures' ? styles.tabActive : ''}`}
          >
            Lectures
          </Link>
          <Link
            href={`${base}/assignments`}
            className={`${styles.tab} ${activeTab === 'assignments' ? styles.tabActive : ''}`}
          >
            Assignments
          </Link>
          <Link
            href={`${base}/grades`}
            className={`${styles.tab} ${activeTab === 'grades' ? styles.tabActive : ''}`}
          >
            Grades
          </Link>
        </nav>

        <div className={styles.content}>{children}</div>
      </div>
    </CourseShellContext.Provider>
  );
}
