import type { Metadata } from 'next';
import Link from 'next/link';
import { docsHub, docsNavSections } from '../_content/docs';
import DocsShell from './_components/docs-shell';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Docs · Nibras',
  description: 'Introduction, FAQ, and getting started guide for nibrasplatform.me',
};

export default function DocsHubPage() {
  const sections = docsNavSections.filter((section) => section.href !== '/docs');

  return (
    <DocsShell activeHref="/docs">
      <div className={styles.intro}>
        <h1 className={styles.title}>{docsHub.title}</h1>
        <p className={styles.subtitle}>{docsHub.subtitle}</p>
      </div>

      <ul className={styles.hubCards}>
        {sections.map((section) => (
          <li key={section.href}>
            <Link href={section.href} className={styles.hubCard}>
              <span className={styles.hubCardTitle}>{section.label}</span>
              <span className={styles.hubCardArrow}>→</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className={styles.footnote}>
        For full CLI install steps and troubleshooting, see the{' '}
        <Link href="/instructor/onboarding">CLI setup guide</Link> or the{' '}
        <a
          href="https://github.com/nibras-platform/nibras/blob/main/docs/student-guide.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          student guide on GitHub
        </a>
        .
      </p>
    </DocsShell>
  );
}
