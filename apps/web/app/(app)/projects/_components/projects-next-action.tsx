'use client';

import Link from 'next/link';
import type {
  StudentUpcomingDeadline,
  TrackingMilestone,
  TrackingProjectSummary,
} from '@nibras/contracts';
import type { ProjectGitHubStatus } from '../../../lib/services/project-tracking';
import { dueDateText } from './projects-helpers';
import styles from './projects.module.css';

export default function ProjectsNextAction({
  milestones,
  activeProject,
  teamApplicationRequired,
  hasApplication,
  githubStatus,
  deadlines,
}: {
  milestones: TrackingMilestone[];
  activeProject: TrackingProjectSummary | null;
  teamApplicationRequired: boolean;
  hasApplication: boolean;
  githubStatus: ProjectGitHubStatus;
  deadlines: StudentUpcomingDeadline[];
}) {
  const nextMilestone =
    milestones
      .filter((m) => m.status !== 'approved' && m.status !== 'graded')
      .sort((left, right) => {
        if (!left.dueAt) return 1;
        if (!right.dueAt) return -1;
        return left.dueAt.localeCompare(right.dueAt);
      })[0] ?? null;

  let title = 'You are caught up';
  let body = 'No open milestones need action right now.';
  let cta: { label: string; href?: string; onClick?: () => void } | null = null;

  if (!githubStatus.githubLinked) {
    title = 'Connect GitHub';
    body = 'Link your GitHub account before submitting repository-based milestones.';
    cta = { label: 'Open settings', href: '/settings' };
  } else if (!githubStatus.githubAppInstalled) {
    title = 'Install the GitHub App';
    body = 'Enable automatic push tracking for project submissions.';
    cta = {
      label: 'Install app',
      href: githubStatus.installUrl || '/settings',
    };
  } else if (teamApplicationRequired && !hasApplication) {
    title = 'Apply for a team role';
    body = `Rank your preferred roles for ${activeProject?.title ?? 'this team project'} before teams are locked.`;
    cta = { label: 'Start application' };
  } else if (nextMilestone) {
    title = nextMilestone.title;
    body = nextMilestone.dueAt
      ? dueDateText(nextMilestone.dueAt)
      : 'This milestone is ready for your next submission.';
    if (nextMilestone.status === 'changes_requested') {
      body = `Instructor requested changes. ${body}`;
    }
    cta = { label: nextMilestone.status === 'open' ? 'Submit milestone' : 'Continue milestone' };
  } else if (deadlines[0]) {
    title = deadlines[0].title;
    body = `${deadlines[0].projectTitle} · ${deadlines[0].statusLabel}`;
    cta = { label: 'Open deadline', href: deadlines[0].href };
  }

  return (
    <section className={styles.nextActionCard}>
      <span className={styles.nextActionLabel}>What&apos;s next</span>
      <strong className={styles.nextActionTitle}>{title}</strong>
      <p className={styles.nextActionBody}>{body}</p>
      {cta?.href ? (
        <Link href={cta.href} className={styles.nextActionBtn}>
          {cta.label}
        </Link>
      ) : cta ? (
        <span className={styles.nextActionHint}>{cta.label}</span>
      ) : null}
    </section>
  );
}
