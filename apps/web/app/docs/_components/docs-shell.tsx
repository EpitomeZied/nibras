import Link from 'next/link';
import NibrasLogo from '../../_components/nibras-logo';
import { docsNavSections } from '../../_content/docs';
import styles from '../page.module.css';

export default function DocsShell({
  children,
  activeHref,
}: {
  children: React.ReactNode;
  activeHref: string;
}) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" aria-label="Back to home">
          <NibrasLogo variant="inverse" width={110} />
        </Link>
        <Link href="/" className={styles.backLink}>
          ← Back to home
        </Link>
      </header>

      <div className={styles.main}>
        <nav className={styles.sectionNav} aria-label="Documentation">
          {docsNavSections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className={section.href === activeHref ? styles.navActive : undefined}
              aria-current={section.href === activeHref ? 'page' : undefined}
            >
              {section.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </main>
  );
}
