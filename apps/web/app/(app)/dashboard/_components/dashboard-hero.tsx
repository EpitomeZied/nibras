'use client';

import Link from 'next/link';
import type {
  DashboardHomeResponse,
  DashboardMode,
  InstructorHomeDashboard,
  StudentHomeDashboard,
} from '@nibras/contracts';
import { getGreeting } from '../../../lib/utils';
import styles from '../page.module.css';
import {
  actionSummaryLabel,
  getDisplayName,
  uniqueActions,
  type DashboardAction,
} from './dashboard-utils';

type DashboardUser = { username?: string | null; displayName?: string | null } | null;

function getStudentHeroActions(student: StudentHomeDashboard): DashboardAction[] {
  return uniqueActions([
    student.blockers[0]?.cta,
    student.attentionItems[0]?.cta,
    student.attentionItems[1]?.cta,
    student.courseSnapshots[0]?.projects[0]
      ? { label: 'Open projects', href: student.courseSnapshots[0].projects[0].href }
      : { label: 'Open projects', href: '/projects' },
  ]).slice(0, 2);
}

function getInstructorHeroActions(instructor: InstructorHomeDashboard): DashboardAction[] {
  return uniqueActions([
    instructor.urgentQueue[0]?.cta,
    instructor.operations[0]
      ? { label: instructor.operations[0].label, href: instructor.operations[0].href }
      : null,
    instructor.operations[1]
      ? { label: instructor.operations[1].label, href: instructor.operations[1].href }
      : null,
  ]).slice(0, 2);
}

function studentHeroSummary(student: StudentHomeDashboard): string {
  const attentionCount = student.attentionItems.length;
  const blockerCount = student.blockers.length;
  const courseCount = student.courses.length;
  if (blockerCount > 0) {
    return `${blockerCount} blocker${blockerCount === 1 ? '' : 's'} need attention across ${courseCount} course${courseCount === 1 ? '' : 's'}.`;
  }
  if (attentionCount > 0) {
    return `${attentionCount} active item${attentionCount === 1 ? '' : 's'} are ready for your next move.`;
  }
  return `You are enrolled in ${courseCount} course${courseCount === 1 ? '' : 's'} and the workspace is clear.`;
}

function instructorHeroSummary(instructor: InstructorHomeDashboard): string {
  const pendingCourses = instructor.reviewSummary.byCourse.length;
  const awaiting = instructor.reviewSummary.totalAwaitingReview;
  if (awaiting > 0) {
    return `${awaiting} submission${awaiting === 1 ? '' : 's'} are waiting across ${pendingCourses} course${pendingCourses === 1 ? '' : 's'}.`;
  }
  return 'No urgent review queue right now. Use the operations board to keep courses moving.';
}

export default function DashboardHero({
  dashboard,
  activeMode,
  user,
  onModeChange,
}: {
  dashboard: DashboardHomeResponse;
  activeMode: DashboardMode;
  user: DashboardUser;
  onModeChange: (mode: DashboardMode) => void;
}) {
  const student = dashboard.student;
  const instructor = dashboard.instructor;
  const actions =
    activeMode === 'student' && student
      ? getStudentHeroActions(student)
      : instructor
        ? getInstructorHeroActions(instructor)
        : [];
  const summary =
    activeMode === 'student' && student
      ? studentHeroSummary(student)
      : instructor
        ? instructorHeroSummary(instructor)
        : 'Dashboard data is unavailable right now.';

  return (
    <section className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true" />
      <div className={styles.heroContent}>
        <div className={styles.heroHeader}>
          <div className={styles.heroCopy}>
            <span className={styles.heroEyebrow}>{actionSummaryLabel(activeMode)}</span>
            <h1 className={styles.heroTitle}>
              {getGreeting()}, {getDisplayName(user?.username, user?.displayName)}
            </h1>
            <p className={styles.heroSubtitle}>{summary}</p>
          </div>
          {dashboard.availableModes.length > 1 && (
            <div className={styles.modeSwitch} role="tablist" aria-label="Dashboard mode switch">
              {dashboard.availableModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onModeChange(mode)}
                  className={`${styles.modeButton} ${
                    mode === activeMode ? styles.modeButtonActive : ''
                  }`}
                  aria-pressed={mode === activeMode}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className={styles.heroActions}>
          {actions.map((action, index) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={index === 0 ? styles.heroActionPrimary : styles.heroActionSecondary}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
