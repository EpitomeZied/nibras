'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  UserProfileActivity,
  UserProfileCourseProgress,
  UserProfilePublic,
  UserProfileStats,
  UserProfileSubmission,
} from '@nibras/contracts';
import { getReputationLevelLabel } from '@nibras/contracts';
import styles from './page.module.css';
import profileStyles from '../_components/profile-layout.module.css';
import EmptyState from '../_components/widgets/EmptyState';
import BadgeCard from '../_components/widgets/BadgeCard';
import StatTile from '../_components/widgets/StatTile';
import ProfileHeader from '../users/[id]/_components/profile-header';
import CourseProgressSection from '../users/[id]/_components/course-progress-section';
import SubmissionsSection from '../users/[id]/_components/submissions-section';
import {
  getAchievementsDashboard,
  clearAchievementsDashboardCache,
  peekAchievementsDashboardCache,
  type Badge,
  type AchievementsDashboard,
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
    <div className={profileStyles.grid}>
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

function applyDashboard(
  dashboard: AchievementsDashboard,
  setters: {
    setProfile: (v: UserProfilePublic | null) => void;
    setStats: (v: UserProfileStats | null) => void;
    setCourseProgress: (v: UserProfileCourseProgress[]) => void;
    setSubmissions: (v: UserProfileSubmission[]) => void;
    setActivity: (v: UserProfileActivity[]) => void;
    setBadges: (v: Badge[]) => void;
    setReputation: (v: MyReputation | null) => void;
    setNewlyAwarded: (v: Badge[]) => void;
    setBannerDismissed: (v: boolean) => void;
  }
) {
  setters.setProfile(dashboard.profile ?? null);
  setters.setStats(dashboard.stats ?? null);
  setters.setCourseProgress(dashboard.courseProgress ?? []);
  setters.setSubmissions(dashboard.submissions ?? []);
  setters.setActivity(dashboard.activity ?? []);
  setters.setBadges(dashboard.badges ?? []);
  setters.setReputation(dashboard.reputation ?? null);
  if ((dashboard.newlyAwarded ?? []).length > 0) {
    setters.setNewlyAwarded(dashboard.newlyAwarded);
    setters.setBannerDismissed(false);
  }
}

export default function AchievementsPage() {
  const cached = peekAchievementsDashboardCache();
  const [profile, setProfile] = useState<UserProfilePublic | null>(cached?.profile ?? null);
  const [stats, setStats] = useState<UserProfileStats | null>(cached?.stats ?? null);
  const [courseProgress, setCourseProgress] = useState<UserProfileCourseProgress[]>(
    cached?.courseProgress ?? []
  );
  const [submissions, setSubmissions] = useState<UserProfileSubmission[]>(
    cached?.submissions ?? []
  );
  const [activity, setActivity] = useState<UserProfileActivity[]>(cached?.activity ?? []);
  const [badges, setBadges] = useState<Badge[]>(cached?.badges ?? []);
  const [reputation, setReputation] = useState<MyReputation | null>(cached?.reputation ?? null);
  const [newlyAwarded, setNewlyAwarded] = useState<Badge[]>(cached?.newlyAwarded ?? []);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  const [showAllLockedRating, setShowAllLockedRating] = useState(false);

  const setters = useMemo(
    () => ({
      setProfile,
      setStats,
      setCourseProgress,
      setSubmissions,
      setActivity,
      setBadges,
      setReputation,
      setNewlyAwarded,
      setBannerDismissed,
    }),
    []
  );

  const load = useCallback(
    async (force = false, sync = false) => {
      const hasData = Boolean(peekAchievementsDashboardCache() || badges.length > 0);
      if (hasData && !force) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const dashboard = await getAchievementsDashboard(force, { sync });
        applyDashboard(dashboard, setters);
      } catch (err) {
        setError(friendlyMessage(err));
        if (!hasData) {
          setBadges([]);
          setReputation(null);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [badges.length, setters]
  );

  useEffect(() => {
    void load(false);
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
  const totalEarned = badges.filter((b) => b.earnedAt).length;

  if (loading) {
    return (
      <div className={profileStyles.page}>
        <div className={styles.skeleton} aria-hidden="true">
          <div className={styles.skeletonHeader} />
          <div className={styles.skeletonStats} />
          <div className={styles.skeletonGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && badges.length === 0) {
    return (
      <div className={profileStyles.page}>
        <EmptyState
          title="Couldn't load achievements"
          description={error}
          action={{
            label: 'Retry',
            onClick: () => {
              clearAchievementsDashboardCache();
              void load(true, true);
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className={profileStyles.page}>
      {profile && (
        <div className={profileStyles.headerActions}>
          <ProfileHeader profile={profile} />
          <Link href={`/users/${profile.id}`} className={profileStyles.profileLink}>
            View public profile
          </Link>
        </div>
      )}

      {refreshing && <p className={profileStyles.muted}>Refreshing…</p>}

      {stats && (
        <div className={profileStyles.summary}>
          <StatTile label="Passed" value={stats.passedCount} />
          <StatTile label="Courses" value={stats.coursesEnrolled} />
          <StatTile label="Submissions" value={stats.totalSubmissions} />
        </div>
      )}

      {courseProgress.length > 0 && (
        <section className={profileStyles.section}>
          <h2 className={profileStyles.sectionTitle}>Course progress</h2>
          <CourseProgressSection courses={courseProgress} />
        </section>
      )}

      {submissions.length > 0 && (
        <section className={profileStyles.section}>
          <h2 className={profileStyles.sectionTitle}>Recent submissions</h2>
          <SubmissionsSection submissions={submissions} showScores={false} />
        </section>
      )}

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

      <section className={profileStyles.section}>
        <h2 className={profileStyles.sectionTitle}>Badges & reputation</h2>

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
              <div className={styles.badgeBlock}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.badgeSectionTitle}>Codeforces peak rating</h3>
                  <span className={styles.sectionMeta}>
                    {cfEarned.length} / {cfEarned.length + cfLocked.length}
                  </span>
                </div>
                <div className={profileStyles.panel}>
                  {cfEarned.length > 0 && <BadgeGrid items={cfEarned} earned />}
                  {visibleCfLocked.length > 0 && (
                    <BadgeGrid items={visibleCfLocked} earned={false} />
                  )}
                </div>
              </div>
            )}
            {(lcEarned.length > 0 || visibleLcLocked.length > 0) && (
              <div className={styles.badgeBlock}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.badgeSectionTitle}>LeetCode contest rating (peak)</h3>
                  <span className={styles.sectionMeta}>
                    {lcEarned.length} / {lcEarned.length + lcLocked.length}
                  </span>
                </div>
                <div className={profileStyles.panel}>
                  {lcEarned.length > 0 && <BadgeGrid items={lcEarned} earned />}
                  {visibleLcLocked.length > 0 && (
                    <BadgeGrid items={visibleLcLocked} earned={false} />
                  )}
                </div>
              </div>
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
              <div className={styles.badgeBlock}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.badgeSectionTitle}>Earned</h3>
                  <span className={styles.sectionMeta}>{earned.length} unlocked</span>
                </div>
                <div className={profileStyles.panel}>
                  <BadgeGrid items={earned} earned />
                </div>
              </div>
            )}
            {locked.length > 0 && (
              <div className={styles.badgeBlock}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.badgeSectionTitle}>Locked</h3>
                  <span className={styles.sectionMeta}>{locked.length} to go</span>
                </div>
                <div className={profileStyles.panel}>
                  <BadgeGrid items={locked} earned={false} />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {activity.length > 0 && (
        <section className={profileStyles.section}>
          <h2 className={profileStyles.sectionTitle}>Recent activity</h2>
          <div className={profileStyles.panel}>
            <ul
              className={profileStyles.progressList}
              style={{ listStyle: 'none', margin: 0, padding: 0 }}
            >
              {activity.map((item) => (
                <li key={item.id} className={profileStyles.progressRow}>
                  <div>
                    <strong>{item.title}</strong>
                    {item.subtitle && (
                      <div className={profileStyles.progressMeta}>{item.subtitle}</div>
                    )}
                  </div>
                  <span className={profileStyles.muted}>
                    {new Date(item.occurredAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {reputation?.history && reputation.history.length > 0 && (
        <section className={profileStyles.section}>
          <h2 className={profileStyles.sectionTitle}>Reputation history</h2>
          <div className={profileStyles.panel}>
            <ul
              className={profileStyles.progressList}
              style={{ listStyle: 'none', margin: 0, padding: 0 }}
            >
              {reputation.history.slice(0, 10).map((item) => (
                <li key={item.id} className={profileStyles.progressRow}>
                  <div>
                    <strong>{item.reason}</strong>
                    {item.detail && (
                      <div className={profileStyles.progressMeta}>{item.detail}</div>
                    )}
                  </div>
                  <span className={profileStyles.muted}>
                    {item.delta >= 0 ? '+' : ''}
                    {item.delta} · {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
