'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';

const TABS = [
  { href: '/achievements', label: 'Badges', match: (p: string) => p === '/achievements' },
  {
    href: '/achievements/leaderboard',
    label: 'Leaderboard',
    match: (p: string) => p.startsWith('/achievements/leaderboard'),
  },
  {
    href: '/achievements/reputation',
    label: 'Reputation',
    match: (p: string) => p.startsWith('/achievements/reputation'),
  },
  { href: '/levels', label: 'Levels', match: (p: string) => p === '/levels' },
];

export default function AchievementsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  return (
    <div className={styles.layout}>
      <nav className={styles.tabBar} aria-label="Achievements sections">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${tab.match(pathname) ? styles.tabActive : ''}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
