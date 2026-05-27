import type { Metadata } from 'next';
import Link from 'next/link';
import NibrasLogo from '../_components/nibras-logo';
import {
  changelogCategoryMeta,
  changelogReleases,
  type ChangelogItem,
} from '../_content/changelog';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Changelog · Nibras',
  description: 'Product updates and release notes for nibrasplatform.me',
};

function ChangelogBullet({ item }: { item: ChangelogItem }) {
  return (
    <li className={styles.bullet}>
      <span>{item.text}</span>
      {item.author ? (
        <>
          {' '}
          <a
            href={`https://github.com/${item.author}`}
            className={styles.author}
            target="_blank"
            rel="noopener noreferrer"
          >
            @{item.author}
          </a>
        </>
      ) : null}
    </li>
  );
}

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

        <ol className={styles.timeline}>
          {changelogReleases.map((release, index) => (
            <li key={`${release.version}-${release.date}`} className={styles.entry}>
              <div className={styles.meta}>
                <time className={styles.date} dateTime={release.date}>
                  {release.date}
                </time>
                <span className={styles.versionBadge}>{release.version}</span>
              </div>

              <div className={styles.rail} aria-hidden="true">
                <span className={styles.marker}>{index === 0 ? '×' : '+'}</span>
                {index < changelogReleases.length - 1 ? <span className={styles.railLine} /> : null}
              </div>

              <div className={styles.content}>
                <h2 className={styles.releaseTitle}>{release.title}</h2>
                {release.categories.map((group) => {
                  const meta = changelogCategoryMeta[group.type];
                  return (
                    <div key={group.type} className={styles.category}>
                      <h3 className={styles.categoryLabel}>
                        <span aria-hidden="true">{meta.icon}</span> {meta.label}
                      </h3>
                      <ul className={styles.bullets}>
                        {group.items.map((item) => (
                          <ChangelogBullet key={item.text} item={item} />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
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
