'use client';

import Link from 'next/link';
import type { StudentProjectsDashboardResponse } from '@nibras/contracts';
import { EmptyPanel, SectionHeader } from '../../dashboard/_components/dashboard-shared';
import styles from './projects.module.css';

type PortfolioCourse = NonNullable<StudentProjectsDashboardResponse['portfolioCourses']>[number];

export default function ProjectsHub({
  courses,
  onSelectCourse,
}: {
  courses: PortfolioCourse[];
  onSelectCourse: (courseId: string) => void;
}) {
  return (
    <section className={styles.hubSection}>
      <SectionHeader
        eyebrow="Portfolio"
        title="All enrolled courses"
        hint="Pick a course to open its project workspace, milestones, and submissions."
      />
      {courses.length === 0 ? (
        <EmptyPanel
          title="No enrolled courses yet"
          body="Browse the catalog to enroll, or ask your instructor to add you to a course."
        />
      ) : (
        <div className={styles.hubGrid}>
          {courses.map((course) => (
            <button
              key={course.courseId}
              type="button"
              className={styles.hubCard}
              onClick={() => onSelectCourse(course.courseId)}
            >
              <span className={styles.hubCardCode}>{course.courseCode}</span>
              <strong className={styles.hubCardTitle}>{course.title}</strong>
              <span className={styles.hubCardMeta}>{course.termLabel}</span>
              <div className={styles.hubCardStats}>
                <span>{course.completion}% complete</span>
                <span>
                  {course.projectCount} project{course.projectCount === 1 ? '' : 's'}
                </span>
                <span>{course.openMilestones} open</span>
              </div>
              {course.nextDueLabel && (
                <span className={styles.hubCardDue}>Next: {course.nextDueLabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
      <p className={styles.hubFooter}>
        Looking for a new course?{' '}
        <Link href="/catalog" className={styles.inlineLink}>
          Browse catalog
        </Link>
      </p>
    </section>
  );
}
