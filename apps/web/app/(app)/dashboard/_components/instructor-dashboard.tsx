'use client';

import Link from 'next/link';
import type { InstructorHomeDashboard } from '@nibras/contracts';
import styles from '../page.module.css';
import { formatDateTime, formatWaitingTime } from './dashboard-utils';
import { EmptyPanel, SectionHeader } from './dashboard-shared';

type InstructorUrgentQueueItem = InstructorHomeDashboard['urgentQueue'][number];
type InstructorActivityItem = InstructorHomeDashboard['recentActivity'][number];
type InstructorCourseSummary = InstructorHomeDashboard['courseSummaries'][number];

function UrgentQueueRow({ entry }: { entry: InstructorUrgentQueueItem }) {
  return (
    <article className={`${styles.listRow} ${styles.toneWarning}`}>
      <div className={styles.listRowMain}>
        <div className={styles.listRowHeader}>
          <h3 className={styles.listTitle}>{entry.projectTitle}</h3>
          <span className={styles.statusChip}>
            {formatWaitingTime(entry.waitingMinutes)} waiting
          </span>
        </div>
        <p className={styles.listBody}>
          {entry.studentName} • {entry.courseTitle} • submitted {formatDateTime(entry.submittedAt)}
        </p>
      </div>
      <Link href={entry.cta.href} className={styles.inlineAction}>
        {entry.cta.label}
      </Link>
    </article>
  );
}

function ActivityRow({ entry }: { entry: InstructorActivityItem }) {
  const body = `${entry.summary} • ${formatDateTime(entry.createdAt)}`;
  if (entry.href) {
    return (
      <Link href={entry.href} className={`${styles.listRow} ${styles.toneNeutral}`}>
        <div className={styles.listRowMain}>
          <div className={styles.listRowHeader}>
            <h3 className={styles.listTitle}>{entry.courseTitle || 'Instructor activity'}</h3>
            <span className={styles.statusChip}>{entry.action}</span>
          </div>
          <p className={styles.listBody}>{body}</p>
        </div>
      </Link>
    );
  }
  return (
    <article className={`${styles.listRow} ${styles.toneNeutral}`}>
      <div className={styles.listRowMain}>
        <div className={styles.listRowHeader}>
          <h3 className={styles.listTitle}>{entry.courseTitle || 'Instructor activity'}</h3>
          <span className={styles.statusChip}>{entry.action}</span>
        </div>
        <p className={styles.listBody}>{body}</p>
      </div>
    </article>
  );
}

function InstructorCourseCard({ course }: { course: InstructorCourseSummary }) {
  return (
    <Link href={`/instructor/courses/${course.courseId}`} className={styles.courseSummaryCard}>
      <div className={styles.snapshotHeader}>
        <div>
          <span className={styles.cardKicker}>{course.courseCode}</span>
          <h3 className={styles.cardTitle}>{course.title}</h3>
        </div>
        <span className={styles.statusChip}>{course.termLabel}</span>
      </div>
      <div className={styles.statPairGrid}>
        <div className={styles.statPair}>
          <strong>{course.pendingReviewCount}</strong>
          <span>pending review</span>
        </div>
        <div className={styles.statPair}>
          <strong>{course.publishedProjectCount}</strong>
          <span>published projects</span>
        </div>
        <div className={styles.statPair}>
          <strong>{course.memberCount}</strong>
          <span>members</span>
        </div>
      </div>
      <p className={styles.inlineNote}>
        {course.lastActivityAt
          ? `Last activity ${formatDateTime(course.lastActivityAt)}`
          : 'No recent activity recorded'}
      </p>
    </Link>
  );
}

export default function InstructorDashboard({ instructor }: { instructor: InstructorHomeDashboard }) {
  return (
    <div className={styles.dashboardMain}>
      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Queue breakdown"
          title="Pending reviews by course"
          hint="See which courses are driving the review queue."
        />
        <div className={styles.reviewByCourseTable}>
          {instructor.reviewSummary.byCourse.length === 0 ? (
            <EmptyPanel
              title="No pending reviews by course"
              body="The review queue is clear across your courses."
            />
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Pending</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {instructor.reviewSummary.byCourse.map((row) => (
                  <tr key={row.courseId}>
                    <td>{row.courseTitle}</td>
                    <td>
                      <strong>{row.pendingReviewCount}</strong>
                    </td>
                    <td>
                      <Link
                        href={`/instructor/courses/${row.courseId}/submissions`}
                        className={styles.inlineAction}
                      >
                        Open queue
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className={styles.primaryGrid}>
        <section className={styles.panel}>
          <SectionHeader
            eyebrow="Urgent queue"
            title="Oldest pending reviews first"
            hint="This queue is ordered to surface the submissions that have waited the longest."
          />
          <div className={styles.listStack}>
            {instructor.urgentQueue.length === 0 ? (
              <EmptyPanel
                title="No urgent reviews"
                body="The review queue is clear. Activity and course operations remain available below."
              />
            ) : (
              instructor.urgentQueue.map((entry) => (
                <UrgentQueueRow key={entry.submissionId} entry={entry} />
              ))
            )}
          </div>
        </section>

        <section className={styles.panel}>
          <SectionHeader
            eyebrow="Operations"
            title="Fast course moves"
            hint="Common instructor actions stay within one click of the dashboard."
          />
          <div className={styles.cardGrid}>
            {instructor.operations.map((operation) => (
              <Link key={operation.id} href={operation.href} className={styles.operationCard}>
                <span className={styles.cardKicker}>Operation</span>
                <h3 className={styles.cardTitle}>{operation.label}</h3>
                <p className={styles.cardBody}>{operation.description}</p>
              </Link>
            ))}
            <Link href="/instructor/analytics" className={styles.operationCard}>
              <span className={styles.cardKicker}>Analytics</span>
              <h3 className={styles.cardTitle}>Analytics overview</h3>
              <p className={styles.cardBody}>
                Open aggregate charts for submissions, pass rate, and cohort signals.
              </p>
            </Link>
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Recent activity"
          title="What changed recently"
          hint="A compact instructor timeline keeps course movement visible without opening each workspace."
        />
        <div className={styles.listStack}>
          {instructor.recentActivity.length === 0 ? (
            <EmptyPanel
              title="No recent instructor activity"
              body="Publishing, reviews, and course events will surface here once work starts flowing."
            />
          ) : (
            instructor.recentActivity.map((entry) => <ActivityRow key={entry.id} entry={entry} />)
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Courses"
          title="Course operating view"
          hint="Course summaries for review load, members, and last activity."
        />
        <div className={styles.courseSummaryGrid}>
          {instructor.courseSummaries.length === 0 ? (
            <EmptyPanel
              title="No instructor courses available"
              body="Once instructor or TA memberships exist, course-level review and activity summaries will render here."
            />
          ) : (
            instructor.courseSummaries.map((course) => (
              <InstructorCourseCard key={course.courseId} course={course} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
