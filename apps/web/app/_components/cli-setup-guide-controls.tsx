'use client';

import Link from 'next/link';
import styles from './cli-setup-guide-controls.module.css';

export type CliGuideViewMode = 'instructor' | 'student';

function IconInstructor() {
  return (
    <svg
      className={styles.viewSegmentIcon}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 10v6M2 10l10-6 10 6-10 6-10-6z" />
      <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
    </svg>
  );
}

function IconStudent() {
  return (
    <svg
      className={styles.viewSegmentIcon}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="7" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  );
}

type SegmentProps = {
  mode: CliGuideViewMode;
  label: string;
  active: boolean;
  interactive: boolean;
  onSelect?: (mode: CliGuideViewMode) => void;
  href?: string;
};

function ViewSegment({ mode, label, active, interactive, onSelect, href }: SegmentProps) {
  const className = [
    styles.viewSegment,
    active ? styles.viewSegmentActive : '',
    !interactive ? styles.viewSegmentStatic : '',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {mode === 'instructor' ? <IconInstructor /> : <IconStudent />}
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? 'page' : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-pressed={active}
      onClick={() => onSelect?.(mode)}
    >
      {content}
    </button>
  );
}

export type CliSetupGuideControlsProps = {
  badgeLabel?: string;
  badgeDone?: boolean;
  progressLabel?: string | null;
  viewMode?: CliGuideViewMode;
  onViewModeChange?: (mode: CliGuideViewMode) => void;
  /** Show instructor/student switch (instructors only on onboarding). */
  showViewSwitch?: boolean;
  /** Link segments to onboarding URLs (landing page). */
  linkBasePath?: string;
  className?: string;
};

export default function CliSetupGuideControls({
  badgeLabel = 'CLI Setup Guide',
  badgeDone = false,
  progressLabel = null,
  viewMode = 'instructor',
  onViewModeChange,
  showViewSwitch = true,
  linkBasePath,
  className,
}: CliSetupGuideControlsProps) {
  const interactive = Boolean(onViewModeChange) && !linkBasePath;
  const base = linkBasePath ?? '/instructor/onboarding';

  return (
    <div className={[styles.row, className].filter(Boolean).join(' ')}>
      <div className={styles.rowStart}>
        <span
          className={[styles.badge, badgeDone ? styles.badgeDone : ''].filter(Boolean).join(' ')}
        >
          {badgeLabel}
        </span>
        {progressLabel ? <span className={styles.progressPill}>{progressLabel}</span> : null}
      </div>

      {showViewSwitch ? (
        <div className={styles.viewSwitch} role="group" aria-label="Guide audience">
          <ViewSegment
            mode="instructor"
            label="Instructor"
            active={viewMode === 'instructor'}
            interactive={interactive}
            onSelect={onViewModeChange}
            href={linkBasePath ? `${base}?mode=instructor` : undefined}
          />
          <ViewSegment
            mode="student"
            label="Student"
            active={viewMode === 'student'}
            interactive={interactive}
            onSelect={onViewModeChange}
            href={linkBasePath ? `${base}?mode=student` : undefined}
          />
        </div>
      ) : (
        <div className={styles.viewSwitch} role="group" aria-label="Guide audience">
          <ViewSegment mode="student" label="Student guide" active interactive={false} />
        </div>
      )}
    </div>
  );
}
