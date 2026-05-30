'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './hassona-nav.module.css';

const TABS = [
  {
    href: '/tutor',
    label: 'Chat',
    match: (pathname: string) =>
      pathname === '/tutor' ||
      (pathname.startsWith('/tutor/') &&
        !pathname.startsWith('/tutor/insights') &&
        !pathname.startsWith('/tutor/routing') &&
        !pathname.startsWith('/tutor/recommendations')),
  },
  {
    href: '/tutor/insights',
    label: 'Insights',
    match: (pathname: string) => pathname.startsWith('/tutor/insights'),
  },
  {
    href: '/tutor/routing',
    label: 'Learning path',
    match: (pathname: string) => pathname.startsWith('/tutor/routing'),
  },
] as const;

export default function HassonaNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Hassona sections">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
