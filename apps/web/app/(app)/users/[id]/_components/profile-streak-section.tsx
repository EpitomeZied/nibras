import Link from 'next/link';
import type { UserProfileDailyStreak } from '@nibras/contracts';
import StatTile from '../../../_components/widgets/StatTile';
import styles from '../page.module.css';

export default function ProfileStreakSection({ streak }: { streak: UserProfileDailyStreak }) {
  return (
    <section className={styles.section} id="profile-streak">
      <div className={styles.sectionHeadingRow}>
        <h2 className={styles.sectionTitle}>Daily problem streak</h2>
        <Link href="/competitions/daily" className={styles.sectionLink}>
          Open daily problem
        </Link>
      </div>
      <div className={styles.summary}>
        <StatTile label="Current streak" value={streak.current} />
        <StatTile label="Longest streak" value={streak.longest} />
        <StatTile label="Completed" value={streak.totalCompleted} />
      </div>
    </section>
  );
}
