import type { UserProfileGamification } from '@nibras/contracts';
import BadgeCard from '../../../_components/widgets/BadgeCard';
import StatTile from '../../../_components/widgets/StatTile';
import styles from '../page.module.css';

export default function GamificationSection({
  gamification,
  showDetailed,
}: {
  gamification: UserProfileGamification;
  showDetailed: boolean;
}) {
  const earned = gamification.badges.filter((badge) => badge.earnedAt);
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
              <BadgeCard
                key={badge.id}
                name={badge.name}
                description={badge.description}
                iconUrl={badge.iconUrl}
                rarity={badge.rarity}
                earned
              />
            ))}
          </div>
        </div>
      )}

      {showDetailed && locked.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>In progress</h3>
          <div className={styles.panel}>
            <div className={styles.grid}>
              {locked.slice(0, 12).map((badge) => (
                <BadgeCard
                  key={badge.id}
                  name={badge.name}
                  description={badge.description}
                  iconUrl={badge.iconUrl}
                  rarity={badge.rarity}
                  earned={false}
                  progress={badge.progress}
                  threshold={badge.threshold}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
