'use client';

import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { TrackingCourseDetail } from '@nibras/contracts';
import SectionNav from '../../_components/section-nav';
import { instructorCourseSections } from '../../_components/workspace-sections';
import { getCourseDetail } from '../../../lib/services/course-profile';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import styles from './instructor-course-shell.module.css';

type InstructorCourseShellContextValue = {
  course: TrackingCourseDetail | null;
  courseId: string;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const InstructorCourseShellContext = createContext<InstructorCourseShellContextValue | null>(null);

export function useInstructorCourseShell(): InstructorCourseShellContextValue {
  const ctx = useContext(InstructorCourseShellContext);
  if (!ctx) {
    throw new Error('useInstructorCourseShell must be used within InstructorCourseShell');
  }
  return ctx;
}

type Props = {
  courseId: string;
  children: ReactNode;
  actions?: ReactNode;
};

export default function InstructorCourseShell({ courseId, children, actions }: Props) {
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

  const title = course ? `${course.courseCode} · ${course.title}` : 'Course';
  const description = course
    ? `${course.termLabel}${course.isActive ? '' : ' · Archived'}`
    : 'Loading course workspace…';

  const shellValue: InstructorCourseShellContextValue = {
    course,
    courseId,
    loading,
    error,
    reload: load,
  };

  return (
    <InstructorCourseShellContext.Provider value={shellValue}>
      <div className={styles.wrap}>
        <Link href="/instructor" className={styles.back}>
          ← Instructor hub
        </Link>

        {error && (
          <p className={styles.error}>
            {error}{' '}
            <button type="button" onClick={() => void load()}>
              Retry
            </button>
          </p>
        )}

        <SectionNav
          eyebrow="Course"
          title={loading && !course ? 'Loading…' : title}
          description={description}
          items={instructorCourseSections(courseId)}
          actions={actions}
        />

        <div className={styles.content}>{children}</div>
      </div>
    </InstructorCourseShellContext.Provider>
  );
}
