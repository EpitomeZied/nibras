'use client';

import Link from 'next/link';
import type {
  DailyTodayResponse,
  StudentHomeDashboard,
  StudentUpcomingDeadline,
} from '@nibras/contracts';
import type { AchievementsDashboard } from '../../../lib/services/gamification';
import { difficultyLabel } from '../../../lib/services/daily-problem';
import { useFetch } from '../../../lib/use-fetch';
import BadgeCard from '../../_components/widgets/BadgeCard';
import styles from '../page.module.css';
import { deadlineDueLabel, deadlineToneClass } from './dashboard-utils';
import { EmptyPanel, SectionHeader } from './dashboard-shared';

type StudentCourseSnapshot = StudentHomeDashboard['courseSnapshots'][number];

function DailyWidget() {
  const { data } = useFetch<DailyTodayResponse>('/v1/daily-problem/today');
  if (!data) return null;

  return (
    <section className={styles.panel}>
      <SectionHeader
        eyebrow="Daily Challenge"
        title="Today's problem"
        hint="Solve one problem every day to build your streak."
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: '1.5rem' }}>&#128293;</span>
        <strong style={{ fontSize: '1.25rem' }}>{data.streak.current}</strong>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #666)' }}>day streak</span>
      </div>
      {data.paused ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #666)' }}>
          Paused until {new Date(data.pausedUntil!).toLocaleDateString()}
        </p>
      ) : data.assignment ? (
        <div style={{ fontSize: '0.8125rem' }}>
          <strong>{data.assignment.problem.title}</strong>
          <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted, #666)' }}>
            {difficultyLabel(data.assignment.problem.difficulty)}
          </span>
          {data.assignment.solved && (
            <span style={{ marginLeft: 8, color: '#16a34a', fontWeight: 600 }}>
              &#10003; Solved
            </span>
          )}
        </div>
      ) : (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #666)' }}>
          No problem assigned today.
        </p>
      )}
      <Link href="/competitions/daily" className={styles.inlineAction}>
        Go to daily problems
      </Link>
    </section>
  );
}

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
  achievements,
}: {
  upcomingDeadlines: StudentUpcomingDeadline[];
  courseSnapshots: StudentCourseSnapshot[];
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
      <DailyWidget />

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
    </div>
  );
}
