import type { UserProfileGamification } from '@nibras/contracts';
import BadgeCard from '../../../_components/widgets/BadgeCard';
import StatTile from '../../../_components/widgets/StatTile';
import styles from '../page.module.css';

export default function GamificationSection({
  gamification,
  showDetailed,
  onBadgeClick,
}: {
  gamification: UserProfileGamification;
  showDetailed: boolean;
  onBadgeClick?: (badge: UserProfileGamification['badges'][number]) => void;
}) {
  const earned = gamification.badges.filter((badge) => badge.earnedAt);
  const inProgress = !showDetailed
    ? gamification.badges.filter((badge) => !badge.earnedAt && (badge.progress ?? 0) > 0)
    : [];
  const locked = showDetailed ? gamification.badges.filter((badge) => !badge.earnedAt) : [];

  return (
    <>
      <div className={styles.summary}>
        <StatTile
          label="Reputation"
          value={gamification.reputationTotal}
          caption={gamification.levelLabel}
        />
        <StatTile label="Badges earned" value={gamification.earnedBadgeCount} />
        {showDetailed && gamification.rank != null && (
          <StatTile
            label="Rank"
            value={`#${gamification.rank}`}
            caption={
              gamification.percentile != null
                ? `${gamification.percentile}th percentile`
                : undefined
            }
          />
        )}
      </div>

      {earned.length > 0 && (
        <div className={styles.panel}>
          <div className={styles.grid}>
            {earned.map((badge) => (
              <button
                key={badge.id}
                type="button"
                className={styles.badgeButton}
                onClick={() => onBadgeClick?.(badge)}
              >
                <BadgeCard
                  name={badge.name}
                  description={badge.description}
                  iconUrl={badge.iconUrl}
                  rarity={badge.rarity}
                  earned
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {!showDetailed && inProgress.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>In progress</h3>
          <div className={styles.panel}>
            <div className={styles.grid}>
              {inProgress.map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  className={styles.badgeButton}
                  onClick={() => onBadgeClick?.(badge)}
                >
                  <BadgeCard
                    name={badge.name}
                    description={badge.description}
                    iconUrl={badge.iconUrl}
                    rarity={badge.rarity}
                    earned={false}
                    progress={badge.progress}
                    threshold={badge.threshold}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showDetailed && locked.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>In progress</h3>
          <div className={styles.panel}>
            <div className={styles.grid}>
              {locked.slice(0, 12).map((badge) => (
                <button
                  key={badge.id}
                  type="button"
                  className={styles.badgeButton}
                  onClick={() => onBadgeClick?.(badge)}
                >
                  <BadgeCard
                    name={badge.name}
                    description={badge.description}
                    iconUrl={badge.iconUrl}
                    rarity={badge.rarity}
                    earned={false}
                    progress={badge.progress}
                    threshold={badge.threshold}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
