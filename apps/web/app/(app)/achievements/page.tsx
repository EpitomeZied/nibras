'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getReputationLevelLabel } from '@nibras/contracts';
import styles from './page.module.css';
import EmptyState from '../_components/widgets/EmptyState';
import BadgeCard from '../_components/widgets/BadgeCard';
import StatTile from '../_components/widgets/StatTile';
import {
  getAchievementsDashboard,
  clearAchievementsDashboardCache,
  type Badge,
} from '../../lib/services/gamification';
import type { MyReputation } from '../../lib/services/reputation';
import { friendlyMessage } from '../../lib/api-clients/errors';

const TrophyIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 3h8v2a4 4 0 01-8 0V3z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M8 9v3M5 13h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path
      d="M3 4H1.5v1.5A2.5 2.5 0 004 8M13 4h1.5v1.5A2.5 2.5 0 0112 8"
      stroke="currentColor"
      strokeWidth="1.4"
    />
  </svg>
);

const SparkleIcon = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M12 12l-2-2M4 12l2-2M12 4l-2 2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

type CategoryTab =
  | 'all'
  | 'rating'
  | 'onboarding'
  | 'projects'
  | 'community'
  | 'practice'
  | 'competitions'
  | 'meta';

const CATEGORY_TABS: Array<{ id: CategoryTab; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'rating', label: 'Rating' },
  { id: 'projects', label: 'Projects' },
  { id: 'community', label: 'Community' },
  { id: 'practice', label: 'Practice' },
  { id: 'competitions', label: 'Contests' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'meta', label: 'Meta' },
];

function matchesCategory(badge: Badge, tab: CategoryTab): boolean {
  if (tab === 'all') return true;
  return badge.category === tab;
}

function BadgeGrid({ items, earned }: { items: Badge[]; earned: boolean }) {
  return (
    <div className={styles.grid}>
      {items.map((badge) => (
        <BadgeCard
          key={badge.id}
          name={badge.name}
          description={badge.description}
          iconUrl={badge.iconUrl}
          rarity={badge.rarity}
          earned={earned}
          progress={badge.progress}
          threshold={badge.threshold}
        />
      ))}
    </div>
  );
}

export default function AchievementsPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [reputation, setReputation] = useState<MyReputation | null>(null);
  const [newlyAwarded, setNewlyAwarded] = useState<Badge[]>([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [showAllLockedRating, setShowAllLockedRating] = useState(false);

  const load = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const dashboard = await getAchievementsDashboard(force);
      setBadges(dashboard.badges ?? []);
      setReputation(dashboard.reputation ?? null);
      if ((dashboard.newlyAwarded ?? []).length > 0) {
        setNewlyAwarded(dashboard.newlyAwarded);
        setBannerDismissed(false);
      }
    } catch (err) {
      setError(friendlyMessage(err));
      setBadges([]);
      setReputation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearAchievementsDashboardCache();
    void load(true);
  }, [load]);

  const filtered = useMemo(
    () => badges.filter((b) => matchesCategory(b, activeTab)),
    [badges, activeTab]
  );

  const earned = filtered.filter((b) => Boolean(b.earnedAt));
  const locked = filtered.filter((b) => !b.earnedAt);

  const ratingBadges = useMemo(() => badges.filter((b) => b.category === 'rating'), [badges]);
  const cfEarned = ratingBadges.filter((b) => b.code.startsWith('cf-') && b.earnedAt);
  const cfLocked = ratingBadges.filter((b) => b.code.startsWith('cf-') && !b.earnedAt);
  const lcEarned = ratingBadges.filter((b) => b.code.startsWith('lc-') && b.earnedAt);
  const lcLocked = ratingBadges.filter((b) => b.code.startsWith('lc-') && !b.earnedAt);

  const visibleCfLocked =
    activeTab === 'rating' && !showAllLockedRating ? cfLocked.slice(0, 2) : cfLocked;
  const visibleLcLocked =
    activeTab === 'rating' && !showAllLockedRating ? lcLocked.slice(0, 2) : lcLocked;
  const hiddenRatingLocked =
    activeTab === 'rating' &&
    !showAllLockedRating &&
    cfLocked.length + lcLocked.length > visibleCfLocked.length + visibleLcLocked.length;

  const levelLabel = reputation?.total != null ? getReputationLevelLabel(reputation.total) : null;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeleton} aria-hidden="true">
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Couldn't load achievements"
          description={error}
          action={{
            label: 'Retry',
            onClick: () => {
              clearAchievementsDashboardCache();
              void load(true);
            },
          }}
        />
      </div>
    );
  }

  const totalEarned = badges.filter((b) => b.earnedAt).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Achievements</h1>
          <p className={styles.subtitle}>
            Track the badges you&apos;ve earned and the ones still ahead.
            {levelLabel ? ` · ${levelLabel}` : ''}
          </p>
        </div>
      </header>

      {newlyAwarded.length > 0 && !bannerDismissed && (
        <div className={styles.newBadgeBanner} role="status">
          <div>
            <strong>
              {newlyAwarded.length === 1
                ? 'New badge unlocked!'
                : `${newlyAwarded.length} new badges unlocked!`}
            </strong>
            <p>{newlyAwarded.map((b) => b.name).join(', ')}</p>
          </div>
          <button
            type="button"
            className={styles.dismissBtn}
            onClick={() => setBannerDismissed(true)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className={styles.summary}>
        <StatTile
          label="Badges Earned"
          value={totalEarned}
          icon={TrophyIcon}
          caption={`of ${badges.length}`}
        />
        <StatTile
          label="Reputation"
          value={reputation?.total ?? '—'}
          delta={
            reputation?.weeklyDelta
              ? `${reputation.weeklyDelta >= 0 ? '+' : ''}${reputation.weeklyDelta} this week`
              : (levelLabel ?? undefined)
          }
          trend={
            reputation?.weeklyDelta && reputation.weeklyDelta > 0
              ? 'up'
              : reputation?.weeklyDelta && reputation.weeklyDelta < 0
                ? 'down'
                : 'flat'
          }
          icon={SparkleIcon}
        />
        <StatTile
          label="Rank Percentile"
          value={reputation?.percentile != null ? `${reputation.percentile}%` : '—'}
          caption={reputation?.rank ? `#${reputation.rank} overall` : undefined}
        />
        <StatTile
          label="Legendary"
          value={badges.filter((b) => b.rarity === 'legendary' && b.earnedAt).length}
          caption="Rarest unlocks"
        />
      </div>

      <div role="tablist" aria-label="Badge categories" className={styles.tabRow}>
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setShowAllLockedRating(false);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {earned.length === 0 && locked.length === 0 ? (
        <EmptyState
          title="No badges in this category"
          description="Try another tab or keep building reputation to unlock more."
        />
      ) : activeTab === 'rating' ? (
        <>
          {(cfEarned.length > 0 || visibleCfLocked.length > 0) && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Codeforces peak rating</h2>
                <span className={styles.sectionMeta}>
                  {cfEarned.length} / {cfEarned.length + cfLocked.length}
                </span>
              </div>
              {cfEarned.length > 0 && <BadgeGrid items={cfEarned} earned />}
              {visibleCfLocked.length > 0 && <BadgeGrid items={visibleCfLocked} earned={false} />}
            </section>
          )}
          {(lcEarned.length > 0 || visibleLcLocked.length > 0) && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>LeetCode contest rating (peak)</h2>
                <span className={styles.sectionMeta}>
                  {lcEarned.length} / {lcEarned.length + lcLocked.length}
                </span>
              </div>
              {lcEarned.length > 0 && <BadgeGrid items={lcEarned} earned />}
              {visibleLcLocked.length > 0 && <BadgeGrid items={visibleLcLocked} earned={false} />}
            </section>
          )}
          {hiddenRatingLocked && (
            <button
              type="button"
              className={styles.showMoreBtn}
              onClick={() => setShowAllLockedRating(true)}
            >
              Show all locked rating badges
            </button>
          )}
        </>
      ) : (
        <>
          {earned.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Earned</h2>
                <span className={styles.sectionMeta}>{earned.length} unlocked</span>
              </div>
              <BadgeGrid items={earned} earned />
            </section>
          )}
          {locked.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>Locked</h2>
                <span className={styles.sectionMeta}>{locked.length} to go</span>
              </div>
              <BadgeGrid items={locked} earned={false} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
