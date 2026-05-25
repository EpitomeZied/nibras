'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { TrackingCourseSummary } from '@nibras/contracts';
import styles from '../page.module.css';

export default function CourseSwitcher({
  courses,
  selectedCourseId,
}: {
  courses: TrackingCourseSummary[];
  selectedCourseId: string | null;
}) {
  const router = useRouter();

  if (courses.length === 0) return null;

  return (
    <section className={styles.courseSwitcher}>
      <div className={styles.courseSwitcherCopy}>
        <span className={styles.panelEyebrow}>Courses</span>
        <p className={styles.courseSwitcherHint}>
          Focus a course or jump straight into its project workspace.
        </p>
      </div>
      <div className={styles.courseSwitcherActions}>
        <select
          className={styles.courseSelect}
          value={selectedCourseId || ''}
          aria-label="Select course"
          onChange={(event) => {
            const courseId = event.target.value;
            if (courseId) router.push(`/projects?courseId=${courseId}`);
          }}
        >
          <option value="">All courses</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.courseCode} — {course.title}
            </option>
          ))}
        </select>
        {selectedCourseId && (
          <Link href={`/projects?courseId=${selectedCourseId}`} className={styles.inlineAction}>
            Open projects
          </Link>
        )}
      </div>
    </section>
  );
}
