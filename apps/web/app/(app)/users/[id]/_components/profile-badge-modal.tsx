'use client';

import type { UserProfileGamification } from '@nibras/contracts';
import styles from '../page.module.css';

type Badge = UserProfileGamification['badges'][number];

export default function ProfileBadgeModal({
  badge,
  onClose,
}: {
  badge: Badge | null;
  onClose: () => void;
}) {
  if (!badge) return null;

  return (
    <div className={styles.modalOverlay} role="presentation" onClick={onClose}>
      <div
        className={styles.modalCard}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
          ×
        </button>
        <h3 id="badge-modal-title" className={styles.modalTitle}>
          {badge.name}
        </h3>
        {badge.description ? <p className={styles.modalBody}>{badge.description}</p> : null}
        {badge.earnedAt ? (
          <p className={styles.muted}>Earned {new Date(badge.earnedAt).toLocaleDateString()}</p>
        ) : badge.progress != null && badge.threshold != null ? (
          <p className={styles.muted}>
            Progress: {badge.progress} / {badge.threshold}
          </p>
        ) : (
          <p className={styles.muted}>Not earned yet</p>
        )}
      </div>
    </div>
  );
}
