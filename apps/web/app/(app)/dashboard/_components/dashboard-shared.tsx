'use client';

import styles from '../page.module.css';

export function SectionHeader({
  eyebrow,
  title,
  hint,
}: {
  eyebrow: string;
  title: string;
  hint: string;
}) {
  return (
    <header className={styles.panelHeader}>
      <div className={styles.panelHeaderCopy}>
        <span className={styles.panelEyebrow}>{eyebrow}</span>
        <h2 className={styles.panelTitle}>{title}</h2>
      </div>
      <p className={styles.panelHint}>{hint}</p>
    </header>
  );
}

export function EmptyPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className={styles.emptyState}>
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyBody}>{body}</p>
    </div>
  );
}
