'use client';

import Link from 'next/link';
import type { StudentHomeDashboard } from '@nibras/contracts';
import { formatShortDate } from '../../../lib/utils';
import styles from '../page.module.css';
import { formatDateTime } from './dashboard-utils';
import { EmptyPanel, SectionHeader } from './dashboard-shared';

type StudentBlocker = StudentHomeDashboard['blockers'][number];
type StudentAttentionItem = StudentHomeDashboard['attentionItems'][number];
type StudentSubmission = StudentHomeDashboard['recentSubmissions'][number];
type StudentCourseSnapshot = StudentHomeDashboard['courseSnapshots'][number];

function blockerTone(kind: StudentBlocker['kind']): string {
  return kind === 'no_published_projects' ? styles.toneWarning : styles.toneDanger;
}

function attentionTone(kind: StudentAttentionItem['kind']): string {
  if (kind === 'failed_submission' || kind === 'changes_requested') return styles.toneDanger;
  if (kind === 'due_soon' || kind === 'needs_review') return styles.toneWarning;
  return styles.toneSuccess;
}

function statusTone(status: string): string {
  if (status === 'failed' || status === 'changes_requested') return styles.toneDanger;
  if (status === 'needs_review' || status === 'queued' || status === 'running') {
    return styles.toneWarning;
  }
  if (status === 'passed' || status === 'approved' || status === 'graded') {
    return styles.toneSuccess;
  }
  return styles.toneNeutral;
}

function SubmissionRow({ submission }: { submission: StudentSubmission }) {
  return (
    <article className={`${styles.listRow} ${statusTone(submission.status)}`}>
      <div className={styles.listRowMain}>
        <div className={styles.listRowHeader}>
          <h3 className={styles.listTitle}>{submission.projectTitle}</h3>
          <span className={styles.statusChip}>{submission.statusLabel}</span>
        </div>
        <p className={styles.listBody}>
          {submission.milestoneTitle || submission.projectKey} •{' '}
          {formatDateTime(submission.submittedAt || submission.createdAt)}
        </p>
      </div>
      <Link href={submission.href} className={styles.inlineAction}>
        Open
      </Link>
    </article>
  );
}

function CourseSnapshotCard({ snapshot }: { snapshot: StudentCourseSnapshot }) {
  return (
    <article className={styles.snapshotCard}>
      <div className={styles.snapshotHeader}>
        <div>
          <span className={styles.cardKicker}>Course snapshot</span>
          <h3 className={styles.cardTitle}>{snapshot.courseTitle}</h3>
        </div>
        <div className={styles.snapshotCompletion}>
          <strong>{snapshot.completion}%</strong>
          <span>complete</span>
        </div>
      </div>
      <div className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressFill} style={{ width: `${snapshot.completion}%` }} />
      </div>
      <div className={styles.statPairGrid}>
        <div className={styles.statPair}>
          <strong>{snapshot.approved}</strong>
          <span>approved</span>
        </div>
        <div className={styles.statPair}>
          <strong>{snapshot.underReview}</strong>
          <span>under review</span>
        </div>
        <div className={styles.statPair}>
          <strong>{snapshot.open}</strong>
          <span>open</span>
        </div>
      </div>
      <div className={styles.snapshotSection}>
        <span className={styles.sectionLabel}>Next milestones</span>
        {snapshot.nextMilestones.length === 0 ? (
          <p className={styles.inlineNote}>
            No milestone deadlines are queued for this course yet.
          </p>
        ) : (
          <div className={styles.miniList}>
            {snapshot.nextMilestones.map((milestone) => (
              <div key={milestone.milestoneId} className={styles.miniListItem}>
                <div>
                  <strong>{milestone.title}</strong>
                  <span>{milestone.projectTitle}</span>
                </div>
                <span>{milestone.dueAt ? formatShortDate(milestone.dueAt) : 'No due date'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.snapshotSection}>
        <span className={styles.sectionLabel}>Projects</span>
        <div className={styles.projectMiniGrid}>
          {snapshot.projects.map((project) => (
            <Link key={project.projectId} href={project.href} className={styles.projectMiniCard}>
              <strong>{project.title}</strong>
              <span>{project.completion}% complete</span>
              <span>{project.nextMilestoneTitle || 'No upcoming milestone selected'}</span>
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function StudentDashboard({ student }: { student: StudentHomeDashboard }) {
  return (
    <div className={styles.dashboardMain}>
      <div className={styles.primaryGrid}>
        <section className={styles.panel}>
          <SectionHeader
            eyebrow="Blockers"
            title="What needs unblocking"
            hint="Surface the actions that keep project progress from stalling."
          />
          <div className={styles.cardGrid}>
            {student.blockers.length === 0 ? (
              <EmptyPanel
                title="No blockers right now"
                body="GitHub links, course memberships, and project publication are all in a healthy state."
              />
            ) : (
              student.blockers.map((blocker) => (
                <article
                  key={blocker.id}
                  className={`${styles.actionCard} ${blockerTone(blocker.kind)}`}
                >
                  <span className={styles.cardKicker}>Blocker</span>
                  <h3 className={styles.cardTitle}>{blocker.title}</h3>
                  <p className={styles.cardBody}>{blocker.body}</p>
                  <Link href={blocker.cta.href} className={styles.cardAction}>
                    {blocker.cta.label}
                  </Link>
                </article>
              ))
            )}
          </div>
        </section>

        <section className={styles.panel}>
          <SectionHeader
            eyebrow="Attention"
            title="Next high-value moves"
            hint="The most important student actions are grouped here before you drill into projects."
          />
          <div className={styles.listStack}>
            {student.attentionItems.length === 0 ? (
              <EmptyPanel
                title="No urgent attention items"
                body="Recent submissions and milestone activity are stable across your current workload."
              />
            ) : (
              student.attentionItems.map((item) => (
                <article key={item.id} className={`${styles.listCard} ${attentionTone(item.kind)}`}>
                  <div className={styles.listCardHeader}>
                    <div>
                      <span className={styles.cardKicker}>{item.courseTitle}</span>
                      <h3 className={styles.listTitle}>{item.projectTitle}</h3>
                    </div>
                    <span className={styles.statusChip}>{item.statusText}</span>
                  </div>
                  <p className={styles.listBody}>{item.reason}</p>
                  <div className={styles.metaRow}>
                    <span>{item.milestoneTitle || 'General project update'}</span>
                    <span>{item.dueAt ? `Due ${formatShortDate(item.dueAt)}` : 'No due date'}</span>
                  </div>
                  <Link href={item.cta.href} className={styles.inlineAction}>
                    {item.cta.label}
                  </Link>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Progress"
          title="Learning progress"
          hint="Completion across each enrolled course."
        />
        <div className={styles.progressList}>
          {student.courseSnapshots.length === 0 ? (
            <EmptyPanel
              title="No course progress yet"
              body="Enroll in courses with published projects to see progress bars here."
            />
          ) : (
            student.courseSnapshots.map((snapshot) => (
              <div key={snapshot.courseId} className={styles.progressRow}>
                <div className={styles.progressRowHeader}>
                  <strong>{snapshot.courseTitle}</strong>
                  <span>{snapshot.completion}%</span>
                </div>
                <div className={styles.progressTrack} aria-hidden="true">
                  <span
                    className={styles.progressFill}
                    style={{ width: `${snapshot.completion}%` }}
                  />
                </div>
                <p className={styles.inlineNote}>
                  {snapshot.approved} approved • {snapshot.underReview} under review •{' '}
                  {snapshot.open} open
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Recent submissions"
          title="Latest delivery signal"
          hint="Submission status stays visible without leaving the dashboard."
        />
        <div className={styles.listStack}>
          {student.recentSubmissions.length === 0 ? (
            <EmptyPanel
              title="No recent submissions yet"
              body="Once you start submitting milestones, the latest statuses and links will appear here."
            />
          ) : (
            student.recentSubmissions.map((submission) => (
              <SubmissionRow key={submission.id} submission={submission} />
            ))
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Courses"
          title="Course progress snapshots"
          hint="Detailed per-course milestone and project breakdown."
        />
        <div className={styles.snapshotGrid}>
          {student.courseSnapshots.length === 0 ? (
            <EmptyPanel
              title="No active course snapshots"
              body="When projects are published in your courses, progress and milestone timing will show up here."
            />
          ) : (
            student.courseSnapshots.map((snapshot) => (
              <CourseSnapshotCard key={snapshot.courseId} snapshot={snapshot} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
