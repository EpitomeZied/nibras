'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './section-nav.module.css';

export type SectionNavItem = {
  href: string;
  label: string;
};

/** Pick the single best-matching tab (longest href wins prefix ties). */
export function resolveSectionNavActiveHref(
  pathname: string,
  items: SectionNavItem[]
): string | null {
  const matches = items.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.href.length - a.href.length)[0].href;
}

export default function SectionNav({
  eyebrow,
  title,
  description,
  items,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: SectionNavItem[];
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeHref = resolveSectionNavActiveHref(pathname, items);

  return (
    <div className={styles.wrap}>
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.copy}>{description}</p>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>

      <nav className={styles.tabs} aria-label={`${title} sections`}>
        {items.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
