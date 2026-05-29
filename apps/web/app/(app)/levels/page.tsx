'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  REPUTATION_TIERS,
  getReputationLevelProgress,
} from '@nibras/contracts';
import styles from './page.module.css';
import EmptyState from '../_components/widgets/EmptyState';
import { getMyReputation, type MyReputation } from '../../lib/services/reputation';
import { friendlyMessage } from '../../lib/api-clients/errors';

export default function LevelsPage() {
  const [reputation, setReputation] = useState<MyReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (sync = false) => {
    setLoading(true);
    setError(null);
    try {
      setReputation(await getMyReputation({ sync }));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const total = reputation?.total ?? 0;
  const progress = useMemo(() => getReputationLevelProgress(total), [total]);
  const currentTier =
    REPUTATION_TIERS.find((tier) => tier.tier === progress.level) ?? REPUTATION_TIERS[0];
  const nextTier = progress.nextThreshold
    ? (REPUTATION_TIERS.find((tier) => tier.threshold === progress.nextThreshold) ?? null)
    : null;
  const pct = Math.round(progress.progressInLevel * 100);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Levels</h1>
        <p className={styles.subtitle}>
          Climb through tiers by earning reputation, completing milestones, and helping peers.
        </p>
      </header>

      <div className={styles.summaryCard}>
        {loading ? (
          <div style={{ height: 160 }} aria-hidden="true" />
        ) : error || !reputation ? (
          <EmptyState
            title="Level data not loaded"
            description={error ?? 'Sign in and wait for the platform to compute your tier.'}
            tone={error ? 'error' : 'default'}
            action={error ? { label: 'Retry', onClick: () => void load(true) } : undefined}
          />
        ) : (
          <>
            <div className={styles.currentTier}>
              <span className={styles.currentBadge} style={{ background: currentTier.color }}>
                {currentTier.tier}
              </span>
              <div className={styles.currentText}>
                <strong>{currentTier.label}</strong>
                <span>{total.toLocaleString()} reputation</span>
              </div>
            </div>
            <div className={styles.progressBlock}>
              <div className={styles.progressMeta}>
                <span>{nextTier ? `Next: ${nextTier.label}` : 'Max tier reached'}</span>
                <span>
                  {nextTier
                    ? `${(nextTier.threshold - total).toLocaleString()} to go`
                    : 'Legendary status'}
                </span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${pct}%` }} />
              </div>
            </div>
          </>
        )}
      </div>

      <section className={styles.tiers}>
        <h2 className={styles.sectionTitle}>All tiers</h2>
        <ul className={styles.tierList}>
          {REPUTATION_TIERS.map((tier) => {
            const isCurrent = tier.tier === currentTier.tier && !!reputation;
            const isUnlocked = !!reputation && total >= tier.threshold;
            return (
              <li
                key={tier.tier}
                className={`${styles.tierRow} ${isCurrent ? styles.tierRowActive : ''}`}
              >
                <span className={styles.tierBadge} style={{ background: tier.color }}>
                  {tier.tier}
                </span>
                <div className={styles.tierBody}>
                  <strong>{tier.label}</strong>
                  <span>{tier.threshold.toLocaleString()} points</span>
                </div>
                <span
                  className={`${styles.tierState} ${
                    isCurrent
                      ? styles.statusCurrent
                      : isUnlocked
                        ? styles.statusUnlocked
                        : styles.statusLocked
                  }`}
                >
                  {isCurrent ? 'Current' : isUnlocked ? 'Unlocked' : 'Locked'}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
