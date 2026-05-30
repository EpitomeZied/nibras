'use client';

import Link from 'next/link';
import type {
  StudentProjectsDashboardResponse,
  StudentUpcomingDeadline,
  TrackingMembership,
  TrackingProjectSummary,
} from '@nibras/contracts';
import { EmptyPanel, SectionHeader } from '../../dashboard/_components/dashboard-shared';
import { deadlineDueLabel, deadlineToneClass } from '../../dashboard/_components/dashboard-utils';
import { getLevelBadgeSuffix, getLevelLabel, LEVEL_NAMES, MAX_LEVEL } from '../../../lib/levels';
import dashboardPageStyles from '../../dashboard/page.module.css';
import { formatHoursMinutes } from '../../../lib/utils';
import { activityHref } from '../../dashboard/_components/dashboard-utils';
import { formatActivityTime } from './projects-helpers';
import styles from './projects.module.css';

export default function ProjectsRightRail({
  studentLevel,
  activeProject,
  activeStats,
  memberships,
  activity,
  deadlines,
}: {
  studentLevel: number;
  activeProject: TrackingProjectSummary | null;
  activeStats: StudentProjectsDashboardResponse['statsByProject'][string] | null;
  memberships: TrackingMembership[];
  activity: StudentProjectsDashboardResponse['activity'];
  deadlines: StudentUpcomingDeadline[];
}) {
  const approved = activeStats?.approved ?? 0;
  const underReview = activeStats?.underReview ?? 0;
  const total = activeStats?.total ?? 0;
  const open = Math.max(0, total - approved - underReview);
  const pctApproved = total > 0 ? (approved / total) * 100 : 0;
  const pctReview = total > 0 ? (underReview / total) * 100 : 0;
  const pctOpen = total > 0 ? (open / total) * 100 : 0;
  const courseMembership = memberships.find((m) => m.courseId === activeProject?.courseId);

  return (
    <div className={styles.rightCol}>
      {courseMembership && (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Enrollment</h2>
          </div>
          <p className={styles.membershipLine}>
            Role: <strong>{courseMembership.role}</strong> · Level{' '}
            {getLevelLabel(courseMembership.level)}
          </p>
        </section>
      )}

      <div className={styles.standingPanel}>
        <div className={styles.standingHead}>
          <h2 className={styles.standingTitle}>Academic Standing</h2>
          <span
            className={`${styles.standingBadge} ${styles[`levelBadge${getLevelBadgeSuffix(studentLevel)}`] ?? ''}`}
          >
            {getLevelLabel(studentLevel)}
          </span>
        </div>
        <div className={styles.levelJourney}>
          {[1, 2, 3, 4].map((lvl) => {
            const isDone = lvl < studentLevel;
            const isActive = lvl === studentLevel;
            const stepClass = isDone
              ? styles.journeyDone
              : isActive
                ? styles.journeyActive
                : styles.journeyLocked;
            return (
              <div key={lvl} className={`${styles.journeyStep} ${stepClass}`}>
                <div className={styles.journeyDot}>{isDone ? '✓' : lvl}</div>
                <div className={styles.journeyLabel}>
                  <span className={styles.journeyLabelYear}>Yr {lvl}</span>
                  {LEVEL_NAMES[lvl]}
                </div>
              </div>
            );
          })}
        </div>
        <p className={styles.standingHint}>
          {studentLevel < MAX_LEVEL
            ? `Complete all ${getLevelLabel(studentLevel)} projects to advance to ${getLevelLabel(studentLevel + 1)}.`
            : 'You have reached Senior standing. Congratulations!'}
        </p>
      </div>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Deadlines"
          title="Upcoming in this course"
          hint="Milestones due soon for the selected course."
        />
        <div className={styles.deadlineList}>
          {deadlines.length === 0 ? (
            <EmptyPanel
              title="No upcoming deadlines"
              body="Published milestones with due dates will appear here."
            />
          ) : (
            deadlines.slice(0, 6).map((deadline) => (
              <Link
                key={deadline.milestoneId}
                href={deadline.href}
                className={`${styles.deadlineRow} ${deadlineToneClass(deadline.dueAt, deadline.status, dashboardPageStyles)}`}
              >
                <div>
                  <span className={styles.deadlineKicker}>{deadline.projectTitle}</span>
                  <h3 className={styles.deadlineTitle}>{deadline.title}</h3>
                  <p className={styles.deadlineMeta}>{deadlineDueLabel(deadline.dueAt)}</p>
                </div>
                <span className={styles.statusPill}>{deadline.statusLabel}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Progress</h2>
          <span className={styles.pctBig}>{activeStats?.completion ?? 0}%</span>
        </div>
        <div className={styles.segBar}>
          {pctApproved > 0 && (
            <div
              className={`${styles.seg} ${styles.segGreen}`}
              style={{ width: `${pctApproved}%` }}
              title={`Approved: ${approved}`}
            />
          )}
          {pctReview > 0 && (
            <div
              className={`${styles.seg} ${styles.segPurple}`}
              style={{ width: `${pctReview}%` }}
              title={`In review: ${underReview}`}
            />
          )}
          {pctOpen > 0 && (
            <div
              className={`${styles.seg} ${styles.segGray}`}
              style={{ width: `${pctOpen}%` }}
              title={`Open: ${open}`}
            />
          )}
          {total === 0 && <div className={styles.seg} style={{ width: '100%' }} />}
        </div>
        <div className={styles.segLegend}>
          <span>
            <span className={styles.dot} style={{ background: 'var(--success)' }} />
            Approved ({approved})
          </span>
          <span>
            <span className={styles.dot} style={{ background: 'var(--purple)' }} />
            Review ({underReview})
          </span>
          <span>
            <span className={styles.dot} style={{ background: 'var(--surface-muted)' }} />
            Open ({open})
          </span>
        </div>
        <dl className={styles.statGrid}>
          <div>
            <dt>Time Remaining</dt>
            <dd>{activeStats ? formatHoursMinutes(activeStats.minutesRemaining) : '—'}</dd>
          </div>
          <div>
            <dt>Approved</dt>
            <dd>
              {approved} / {total}
            </dd>
          </div>
          <div>
            <dt>In Review</dt>
            <dd>{underReview}</dd>
          </div>
          <div>
            <dt>Open</dt>
            <dd>{open}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Activity"
          title="Recent updates"
          hint="Submissions, reviews, and project events in this course."
        />
        <div className={styles.activityList}>
          {activity.length === 0 ? (
            <EmptyPanel
              title="No recent activity"
              body="Events will appear here as you submit milestones and receive reviews."
            />
          ) : (
            activity.slice(0, 8).map((event) => {
              const href = activityHref(event);
              const row = (
                <>
                  <span className={styles.activitySummary}>{event.summary}</span>
                  <span className={styles.activityTime}>{formatActivityTime(event.createdAt)}</span>
                </>
              );
              return href ? (
                <Link key={event.id} href={href} className={styles.activityRow}>
                  {row}
                </Link>
              ) : (
                <div key={event.id} className={styles.activityRow}>
                  {row}
                </div>
              );
            })
          )}
        </div>
      </section>

      {activeProject?.rubric && activeProject.rubric.length > 0 && (
        <section className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.panelTitle}>Grading Breakdown</h2>
          </div>
          <div className={styles.rubricList}>
            {activeProject.rubric.map((item) => {
              const rubricTotal = activeProject.rubric.reduce((s, r) => s + r.maxScore, 0) || 1;
              const earned = item.earned ?? 0;
              const hasEarned = item.earned != null;
              const w = hasEarned
                ? Math.round((earned / item.maxScore) * 100)
                : Math.round((item.maxScore / rubricTotal) * 100);
              return (
                <div key={item.criterion} className={styles.rubricRow}>
                  <div className={styles.rubricInfo}>
                    <span className={styles.rubricCriterion}>{item.criterion}</span>
                    <div className={styles.rubricTrack}>
                      <div
                        className={`${styles.rubricFill} ${hasEarned ? styles.rubricFillEarned : ''}`}
                        style={{ width: `${Math.min(100, w)}%` }}
                      />
                    </div>
                  </div>
                  <strong className={styles.rubricPct}>
                    {hasEarned ? `${earned}/${item.maxScore}` : `${w}% weight`}
                  </strong>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>Resources</h2>
        </div>
        {activeProject?.resources?.length ? (
          <div className={styles.resourceList}>
            {activeProject.resources.map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className={styles.resourceLink}
              >
                <span className={styles.resourceIcon}>🔗</span>
                <span>{r.label}</span>
                <span className={styles.resourceArrow}>→</span>
              </a>
            ))}
          </div>
        ) : (
          <p className={styles.noResources}>No resources linked for this project.</p>
        )}
      </section>
    </div>
  );
}
