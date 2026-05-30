'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { TrackingMilestone } from '@nibras/contracts';
import {
  dueDateColor,
  dueDateText,
  statusColor,
  statusIcon,
  verificationLabel,
} from './projects-helpers';
import { minutesUntil } from '../../../lib/utils';
import styles from './projects.module.css';

export default function MilestoneCard({
  milestone,
  actionMode,
  onSubmit,
}: {
  milestone: TrackingMilestone;
  actionMode: 'submit' | 'apply';
  onSubmit: (m: TrackingMilestone) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const minutes = minutesUntil(milestone.dueAt);
  const isApproved = milestone.status === 'approved' || milestone.status === 'graded';
  const isChangesRequested = milestone.status === 'changes_requested';
  const isSubmitted =
    milestone.status === 'submitted' || milestone.status === 'under_review' || isChangesRequested;
  const canSubmit = !isApproved;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== `#milestone-${milestone.id}`) return;
    rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setOpen(true);
  }, [milestone.id]);

  return (
    <article
      ref={rootRef}
      id={`milestone-${milestone.id}`}
      className={`${styles.milestone} ${isApproved ? styles.milestoneApproved : ''}`}
    >
      <div className={`${styles.milestoneMarker} ${statusColor(milestone.status)}`}>
        <span className={styles.milestoneIcon}>{statusIcon(milestone.status)}</span>
      </div>

      <div className={styles.milestoneContent}>
        <button
          type="button"
          className={styles.milestoneHeader}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <div className={styles.milestoneHeaderLeft}>
            <div className={styles.milestoneTitleRow}>
              <strong className={styles.milestoneTitle}>{milestone.title}</strong>
              {milestone.isFinal && <span className={styles.finalBadge}>Final</span>}
              <span className={`${styles.statusPill} ${statusColor(milestone.status)}`}>
                {milestone.statusLabel}
              </span>
            </div>
            {(milestone.verificationStatus || milestone.reviewStatus) && (
              <div className={styles.milestoneChipRow}>
                {milestone.verificationStatus && (
                  <span className={styles.metaChip}>
                    <span className={styles.metaChipLabel}>Check</span>
                    {verificationLabel(milestone.verificationStatus)}
                  </span>
                )}
                {milestone.reviewStatus && (
                  <span className={styles.metaChip}>
                    <span className={styles.metaChipLabel}>Review</span>
                    {verificationLabel(milestone.reviewStatus)}
                  </span>
                )}
              </div>
            )}
            {milestone.dueAt && (
              <span
                className={`${styles.dueDate} ${dueDateColor(milestone.dueAt, milestone.status)}`}
              >
                {dueDateText(milestone.dueAt)}
                {minutes !== null && minutes < 0 && !isApproved ? ' ⚠' : ''}
              </span>
            )}
          </div>
          <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>▾</span>
        </button>

        {!open && milestone.description && (
          <p className={styles.milestonePeek}>
            {milestone.description.length > 90
              ? `${milestone.description.slice(0, 90)}…`
              : milestone.description}
          </p>
        )}

        {open && (
          <div className={styles.milestoneBody}>
            {milestone.description && (
              <p className={styles.milestoneDesc}>{milestone.description}</p>
            )}
            {milestone.reviewComment && (
              <p className={styles.reviewComment}>
                <strong>Instructor feedback:</strong> {milestone.reviewComment}
              </p>
            )}
            <div className={styles.milestoneActions}>
              {milestone.latestSubmissionId && (
                <Link
                  href={`/submissions/${milestone.latestSubmissionId}`}
                  className={styles.submissionLink}
                >
                  View submission →
                </Link>
              )}
              {canSubmit && (
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={() => onSubmit(milestone)}
                >
                  {actionMode === 'apply'
                    ? 'Apply for Team'
                    : isSubmitted
                      ? isChangesRequested
                        ? '↩ Address feedback'
                        : '↩ Resubmit'
                      : '↑ Submit'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
