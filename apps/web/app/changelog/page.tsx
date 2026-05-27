import type { Metadata } from 'next';
import Link from 'next/link';
import NibrasLogo from '../_components/nibras-logo';
import { changelogReleases } from '../_content/changelog';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Changelog · Nibras',
  description: 'Product updates and release notes for nibrasplatform.me',
};

export default function ChangelogPage() {
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
        <div className={styles.intro}>
          <h1 className={styles.title}>Changelog</h1>
          <p className={styles.subtitle}>
            Product updates and release notes for the nibras web platform and related services.
          </p>
        </div>

        <ol className={styles.releases}>
          {changelogReleases.map((release) => (
            <li key={release.version} className={styles.release}>
              <div className={styles.releaseHeader}>
                <h2 className={styles.version}>{release.version}</h2>
                <span className={styles.date}>{release.date}</span>
              </div>
              {release.summary ? <p className={styles.summary}>{release.summary}</p> : null}
              <ul className={styles.items}>
                {release.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <p className={styles.footnote}>
          CLI release tags and install instructions are published on{' '}
          <a
            href="https://github.com/nibras-platform/nibras/releases"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Releases
          </a>
          .
        </p>
      </div>
    </main>
  );
}
