'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '../_components/session-context';
import styles from './layout.module.css';

const TABS = [
  { href: '/community', label: 'Q&A' },
  { href: '/community/discussions', label: 'Discussions' },
];

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { user } = useSession();

  const allTabs =
    user?.systemRole === 'admin' ? [...TABS, { href: '/community/tags', label: 'Tags' }] : TABS;

  return (
    <div className={styles.layout}>
      <nav className={styles.tabBar} aria-label="Community sections">
        {allTabs.map((tab) => {
          const active =
            tab.href === '/community'
              ? pathname === '/community' || pathname.startsWith('/community/q/')
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
