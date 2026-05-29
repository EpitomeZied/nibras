import type { UserProfileCourseProgress } from '@nibras/contracts';
import styles from '../page.module.css';

export default function CourseProgressSection({
  courses,
}: {
  courses: UserProfileCourseProgress[];
}) {
  if (courses.length === 0) {
    return <p className={styles.muted}>No course enrollments yet.</p>;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.progressList}>
        {courses.map((course) => (
          <div key={course.courseId} className={styles.progressRow}>
            <div>
              <strong>{course.title}</strong>
              <div className={styles.progressMeta}>
                {course.role} · {course.completionPercent}% complete
                {course.totalMilestones != null
                  ? ` · ${course.passedMilestones ?? 0}/${course.totalMilestones} milestones`
                  : ''}
              </div>
            </div>
            <div className={styles.progressBar} aria-hidden="true">
              <div
                className={styles.progressFill}
                style={{ width: `${course.completionPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
