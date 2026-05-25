'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { TrackingCourseDetail } from '@nibras/contracts';
import { getCourseDetail } from '../../../lib/services/course-profile';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import styles from './page.module.css';

export default function CourseHubPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
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

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeleton} />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{error ?? 'Course not found'}</p>
        <button type="button" onClick={() => void load()}>
          Retry
        </button>
      </div>
    );
  }

  const syllabus = course.syllabusJson as Record<string, unknown> | null | undefined;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/courses" className={styles.back}>
          ← My courses
        </Link>
        {course.thumbnailUrl && <img src={course.thumbnailUrl} alt="" className={styles.thumb} />}
        <div>
          <h1 className={styles.title}>{course.title}</h1>
          <p className={styles.meta}>
            {course.courseCode} · {course.termLabel}
            {course.isPublic && <span className={styles.publicTag}> · Public</span>}
          </p>
        </div>
      </header>

      {course.description && <p className={styles.description}>{course.description}</p>}

      {syllabus && (
        <section className={styles.syllabus}>
          {typeof syllabus.schedule === 'string' && (
            <p>
              <strong>Schedule:</strong> {syllabus.schedule}
            </p>
          )}
          {Array.isArray(syllabus.topics) && syllabus.topics.length > 0 && (
            <p>
              <strong>Topics:</strong> {(syllabus.topics as string[]).join(', ')}
            </p>
          )}
          {typeof syllabus.policies === 'string' && (
            <p>
              <strong>Policies:</strong> {syllabus.policies}
            </p>
          )}
        </section>
      )}

      <div className={styles.stats}>
        <span>{course.videoProgressPercent ?? 0}% lectures watched</span>
        <span>{course.publishedAssignmentCount ?? 0} assignments</span>
        <span>{course.projectCount ?? 0} projects</span>
      </div>

      <div className={styles.grid}>
        <Link href={`/catalog/${courseId}/videos`} className={styles.card}>
          <h2>Lectures</h2>
          <p>{course.videoCount ?? 0} videos</p>
        </Link>
        <Link href={`/catalog/${courseId}/assignments`} className={styles.card}>
          <h2>Assignments</h2>
          <p>{course.publishedAssignmentCount ?? 0} published</p>
        </Link>
        <Link href={`/catalog?course=${courseId}`} className={styles.card}>
          <h2>Projects</h2>
          <p>Browse course projects</p>
        </Link>
        <Link href={`/catalog/${courseId}/grades`} className={styles.card}>
          <h2>Grades</h2>
          <p>Projects and assignments</p>
        </Link>
        <Link href={`/community/discussions?courseId=${courseId}`} className={styles.card}>
          <h2>Discussions</h2>
          <p>Course threads</p>
        </Link>
      </div>
    </div>
  );
}
