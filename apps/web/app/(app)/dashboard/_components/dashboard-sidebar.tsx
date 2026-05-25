'use client';

import Link from 'next/link';
import type {
  StudentHomeDashboard,
  StudentUpcomingDeadline,
  TrackingActivityEvent,
} from '@nibras/contracts';

type StudentCourseSnapshot = StudentHomeDashboard['courseSnapshots'][number];
import type { AchievementsDashboard } from '../../../lib/services/gamification';
import BadgeCard from '../../_components/widgets/BadgeCard';
import styles from '../page.module.css';
import {
  activityHref,
  deadlineDueLabel,
  deadlineToneClass,
  formatDateTime,
} from './dashboard-utils';
import { EmptyPanel, SectionHeader } from './dashboard-shared';

function ActiveProjectCard({ project }: { project: StudentCourseSnapshot['projects'][number] }) {
  return (
    <Link href={project.href} className={styles.projectMiniCard}>
      <strong>{project.title}</strong>
      <span>{project.completion}% complete</span>
      <span>{project.nextMilestoneTitle || 'No upcoming milestone'}</span>
      {project.minutesRemaining != null && project.minutesRemaining > 0 && (
        <span>{Math.ceil(project.minutesRemaining / 60)}h remaining on current milestone</span>
      )}
    </Link>
  );
}

export default function DashboardSidebar({
  upcomingDeadlines,
  courseSnapshots,
  activity,
  achievements,
}: {
  upcomingDeadlines: StudentUpcomingDeadline[];
  courseSnapshots: StudentCourseSnapshot[];
  activity: TrackingActivityEvent[];
  achievements: AchievementsDashboard | null;
}) {
  const activeProjects = courseSnapshots.flatMap((snapshot) =>
    snapshot.projects.filter(
      (project: StudentCourseSnapshot['projects'][number]) =>
        project.completion < 100 || project.open > 0
    )
  );

  const earnedBadges = (achievements?.badges ?? []).filter((badge) => badge.earnedAt).slice(0, 4);

  return (
    <div className={styles.sidebarStack}>
      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Deadlines"
          title="Upcoming deadlines"
          hint="Milestones due soon across all enrolled courses."
        />
        <div className={styles.deadlineList}>
          {upcomingDeadlines.length === 0 ? (
            <EmptyPanel
              title="No upcoming deadlines"
              body="Published milestones with due dates will appear here."
            />
          ) : (
            upcomingDeadlines.map((deadline) => (
              <Link
                key={deadline.milestoneId}
                href={deadline.href}
                className={`${styles.deadlineRow} ${deadlineToneClass(deadline.dueAt, deadline.status, styles)}`}
              >
                <div>
                  <span className={styles.cardKicker}>{deadline.courseTitle}</span>
                  <h3 className={styles.listTitle}>{deadline.title}</h3>
                  <p className={styles.listBody}>
                    {deadline.projectTitle} • {deadlineDueLabel(deadline.dueAt)}
                  </p>
                </div>
                <span className={styles.statusChip}>{deadline.statusLabel}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Projects"
          title="Active projects"
          hint="Projects that still have open milestones or incomplete progress."
        />
        <div className={styles.projectMiniGrid}>
          {activeProjects.length === 0 ? (
            <EmptyPanel
              title="No active projects"
              body="When projects are published, in-progress work will show here."
            />
          ) : (
            activeProjects.map((project) => (
              <ActiveProjectCard key={project.projectId} project={project} />
            ))
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Activity"
          title="Recent activity"
          hint="Latest events from your courses and submissions."
        />
        <div className={styles.listStack}>
          {activity.length === 0 ? (
            <EmptyPanel
              title="No recent activity"
              body="Submissions, reviews, and course events will appear here."
            />
          ) : (
            activity.slice(0, 12).map((entry) => {
              const href = activityHref(entry);
              const body = (
                <>
                  <div className={styles.listRowHeader}>
                    <h3 className={styles.listTitle}>{entry.action}</h3>
                    <span className={styles.statusChip}>{formatDateTime(entry.createdAt)}</span>
                  </div>
                  <p className={styles.listBody}>{entry.summary}</p>
                </>
              );
              if (href) {
                return (
                  <Link key={entry.id} href={href} className={`${styles.listRow} ${styles.toneNeutral}`}>
                    <div className={styles.listRowMain}>{body}</div>
                  </Link>
                );
              }
              return (
                <article key={entry.id} className={`${styles.listRow} ${styles.toneNeutral}`}>
                  <div className={styles.listRowMain}>{body}</div>
                </article>
              );
            })
          )}
        </div>
      </section>

      <section className={styles.panel}>
        <SectionHeader
          eyebrow="Achievements"
          title="Recent badges"
          hint="Reputation and earned badges from the achievements service."
        />
        {achievements?.reputation && (
          <p className={styles.reputationLine}>
            Reputation: <strong>{achievements.reputation.total}</strong>
            {achievements.reputation.rank != null && (
              <span> • Rank #{achievements.reputation.rank}</span>
            )}
          </p>
        )}
        <div className={styles.badgePreviewGrid}>
          {earnedBadges.length === 0 ? (
            <EmptyPanel
              title="No badges yet"
              body={
                achievements
                  ? 'Complete milestones and challenges to earn your first badge.'
                  : 'Achievements could not be loaded right now.'
              }
            />
          ) : (
            earnedBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                name={badge.name}
                description={badge.description}
                iconUrl={badge.iconUrl}
                rarity={badge.rarity}
                earned
              />
            ))
          )}
        </div>
        <Link href="/achievements" className={styles.inlineAction}>
          View all achievements
        </Link>
      </section>
    </div>
  );
}
