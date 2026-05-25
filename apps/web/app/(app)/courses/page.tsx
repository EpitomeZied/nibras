'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  isPublic?: boolean;
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
              isPublic: detail.isPublic ?? c.isPublic,
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

  const { enrolledCourses, publicCourses } = useMemo(() => {
    const enrolled: CourseCard[] = [];
    const pub: CourseCard[] = [];
    for (const course of courses) {
      if (course.isPublic) pub.push(course);
      else enrolled.push(course);
    }
    return { enrolledCourses: enrolled, publicCourses: pub };
  }, [courses]);

  function renderGrid(items: CourseCard[]) {
    return (
      <div className={styles.grid}>
        {items.map((course) => (
          <Link key={course.id} href={`/catalog/${course.id}`} className={styles.card}>
            {course.isPublic && <span className={styles.publicBadge}>Public</span>}
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
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>My Courses</h1>
        <p className={styles.subtitle}>
          Open a course hub for lectures, assignments, projects, grades, and discussions. Public
          courses are open to all students without an invite.
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
          You are not enrolled in any courses yet. Ask your instructor for an invite link, or browse
          public courses once they are published.
        </p>
      )}

      {!loading && !error && enrolledCourses.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Enrolled</h2>
          {renderGrid(enrolledCourses)}
        </section>
      )}

      {!loading && !error && publicCourses.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Public catalog</h2>
          <p className={styles.sectionSub}>
            Open courses anyone can browse — lectures, assignments, and projects.
          </p>
          {renderGrid(publicCourses)}
        </section>
      )}
    </div>
  );
}
