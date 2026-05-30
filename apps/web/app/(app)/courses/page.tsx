'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listMyTrackingCourses, getCourseDetail } from '../../lib/services/course-profile';
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
  enriching?: boolean;
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
      const baseCards: CourseCard[] = list.map((course) => ({ ...course, enriching: true }));
      setCourses(baseCards);
      setLoading(false);

      await Promise.all(
        baseCards.map(async (course) => {
          try {
            const detail = await getCourseDetail(course.id);
            setCourses((prev) =>
              prev.map((item) =>
                item.id === course.id
                  ? {
                      ...item,
                      isPublic: detail.isPublic ?? item.isPublic,
                      videoProgressPercent: detail.videoProgressPercent,
                      publishedAssignmentCount: detail.publishedAssignmentCount,
                      enriching: false,
                    }
                  : item
              )
            );
          } catch {
            setCourses((prev) =>
              prev.map((item) => (item.id === course.id ? { ...item, enriching: false } : item))
            );
          }
        })
      );
    } catch (err) {
      setError(friendlyMessage(err));
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
        {items.map((course) => {
          const lecturePct = course.videoProgressPercent ?? 0;
          return (
            <Link key={course.id} href={`/catalog/${course.id}`} className={styles.card}>
              {course.isPublic && <span className={styles.publicBadge}>Public</span>}
              <h2>{course.title}</h2>
              <p className={styles.meta}>
                {course.courseCode} · {course.termLabel}
              </p>
              <div className={styles.progressWrap}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: course.enriching ? '0%' : `${lecturePct}%` }}
                  />
                </div>
                <div className={styles.stats}>
                  <span>
                    {course.enriching ? 'Loading progress…' : `${lecturePct}% lectures watched`}
                  </span>
                  <span>
                    {course.enriching ? '…' : `${course.publishedAssignmentCount ?? 0} assignments`}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden />
        <span className={styles.heroEyebrow}>Courses</span>
        <h1 className={styles.heroTitle}>My Courses</h1>
        <p className={styles.heroSub}>
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
          You are not enrolled in any courses yet.{' '}
          <Link href="/catalog?tab=courses">Browse the catalog</Link> to join public courses, or ask
          your instructor for an invite link.
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
    </main>
  );
}
