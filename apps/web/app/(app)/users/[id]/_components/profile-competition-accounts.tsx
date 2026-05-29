import type { UserProfileCompetitionAccount } from '@nibras/contracts';
import styles from '../page.module.css';

const PLATFORM_LABELS: Record<string, string> = {
  codeforces: 'Codeforces',
  leetcode: 'LeetCode',
  atcoder: 'AtCoder',
  codechef: 'CodeChef',
  uhunt: 'uHunt',
};

export default function ProfileCompetitionAccounts({
  accounts,
}: {
  accounts: UserProfileCompetitionAccount[];
}) {
  if (accounts.length === 0) return null;

  return (
    <section className={styles.section} id="profile-platforms">
      <h2 className={styles.sectionTitle}>Competition platforms</h2>
      <div className={styles.chipRow}>
        {accounts.map((account) => (
          <span key={`${account.platform}-${account.handle}`} className={styles.platformChip}>
            {PLATFORM_LABELS[account.platform] ?? account.platform} · @{account.handle}
            {account.rating != null ? ` · ${account.rating}` : ''}
          </span>
        ))}
      </div>
    </section>
  );
}
