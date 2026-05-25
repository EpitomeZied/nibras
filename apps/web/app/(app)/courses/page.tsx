'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { listMyTrackingCourses } from '../../lib/services/course-profile';
import { getCourseDetail } from '../../lib/services/course-profile';
import { friendlyMessage } from '../../lib/api-clients/errors';
import styles from './page.module.css';

type CourseCard = {
  id: string;
  slug: string;
  title: string;
  termLabel: string;
  courseCode: string;
  isActive: boolean;
  videoProgressPercent?: number;
  publishedAssignmentCount?: number;
};

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listMyTrackingCourses();
      const enriched = await Promise.all(
        list.map(async (c) => {
          try {
            const detail = await getCourseDetail(c.id);
            return {
              ...c,
              videoProgressPercent: detail.videoProgressPercent,
              publishedAssignmentCount: detail.publishedAssignmentCount,
            };
          } catch {
            return { ...c };
          }
        })
      );
      setCourses(enriched);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>My Courses</h1>
        <p className={styles.subtitle}>
          Open a course hub for lectures, assignments, projects, grades, and discussions.
        </p>
      </header>

      {loading && <p className={styles.muted}>Loading courses…</p>}
      {error && (
        <p className={styles.error}>
          {error}{' '}
          <button type="button" onClick={() => void load()}>
            Retry
          </button>
        </p>
      )}

      {!loading && !error && courses.length === 0 && (
        <p className={styles.muted}>
          You are not enrolled in any courses yet. Ask your instructor for an invite link.
        </p>
      )}

      <div className={styles.grid}>
        {courses.map((course) => (
          <Link key={course.id} href={`/catalog/${course.id}`} className={styles.card}>
            <h2>{course.title}</h2>
            <p className={styles.meta}>
              {course.courseCode} · {course.termLabel}
            </p>
            <div className={styles.stats}>
              <span>{course.videoProgressPercent ?? 0}% lectures</span>
              <span>{course.publishedAssignmentCount ?? 0} assignments</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
