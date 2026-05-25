'use client';

import type { DashboardHomeResponse, DashboardMode } from '@nibras/contracts';
import type { AchievementsDashboard } from '../../../lib/services/gamification';
import styles from '../page.module.css';
import { formatWaitingTime } from './dashboard-utils';

function metricTone(mode: DashboardMode, index: number): string {
  if (mode === 'student') {
    return [styles.metricDanger, styles.metricWarning, styles.metricWarning, styles.metricSuccess][
      index % 4
    ];
  }
  return [styles.metricDanger, styles.metricWarning, styles.metricSuccess, styles.metricNeutral][
    index % 4
  ];
}

type MetricItem = { label: string; value: string; meta: string };

export default function DashboardMetrics({
  activeMode,
  dashboard,
  achievements,
}: {
  activeMode: DashboardMode;
  dashboard: DashboardHomeResponse;
  achievements: AchievementsDashboard | null;
}) {
  let items: MetricItem[] = [];

  if (activeMode === 'student' && dashboard.student) {
    const student = dashboard.student;
    const stats = student.overallStats;
    items = [
      {
        label: 'Overall progress',
        value: `${stats.overallCompletionPercent}%`,
        meta: 'Weighted across enrolled courses',
      },
      {
        label: 'Courses enrolled',
        value: String(stats.coursesEnrolled),
        meta: 'Active student memberships',
      },
      {
        label: 'Milestones done',
        value: `${stats.milestonesApproved}/${stats.milestonesTotal}`,
        meta: 'Approved vs total milestones',
      },
      {
        label: 'Reputation',
        value:
          achievements?.reputation?.total != null ? String(achievements.reputation.total) : '—',
        meta: achievements ? 'Gamification score' : 'Achievements service unavailable',
      },
    ];
  } else if (dashboard.instructor) {
    const instructor = dashboard.instructor;
    items = [
      {
        label: 'Awaiting review',
        value: String(instructor.reviewSummary.totalAwaitingReview),
        meta: 'Total pending instructor queue',
      },
      {
        label: 'Oldest wait',
        value: formatWaitingTime(instructor.reviewSummary.oldestWaitingMinutes),
        meta: 'Longest outstanding submission',
      },
      {
        label: 'Submitted 24h',
        value: String(instructor.reviewSummary.submittedLast24Hours),
        meta: 'New review demand',
      },
      {
        label: 'Courses in queue',
        value: String(instructor.reviewSummary.byCourse.length),
        meta: 'Courses with pending review',
      },
    ];
  }

  return (
    <section className={styles.statsRow}>
      {items.map((item, index) => (
        <article
          key={item.label}
          className={`${styles.metricCard} ${metricTone(activeMode, index)}`}
        >
          <span className={styles.metricLabel}>{item.label}</span>
          <strong className={styles.metricValue}>{item.value}</strong>
          <span className={styles.metricMeta}>{item.meta}</span>
        </article>
      ))}
    </section>
  );
}
