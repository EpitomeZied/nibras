'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import CourseShell, { useCourseShell } from '../_components/course-shell';
import styles from './page.module.css';

function CourseOverviewContent() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  const { course, loading, error } = useCourseShell();

  if (loading) {
    return <div className={styles.skeleton} />;
  }

  if (error || !course) {
    return <p className={styles.error}>{error ?? 'Course not found'}</p>;
  }

  const syllabus = course.syllabusJson as Record<string, unknown> | null | undefined;

  return (
    <>
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
    </>
  );
}

export default function CourseHubPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';

  return (
    <CourseShell courseId={courseId}>
      <CourseOverviewContent />
    </CourseShell>
  );
}
