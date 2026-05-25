'use client';

import styles from '../page.module.css';

export default function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className={styles.page}>
      <section className={styles.errorPanel}>
        <span className={styles.heroEyebrow}>Dashboard error</span>
        <h1 className={styles.heroTitle}>The dashboard could not load.</h1>
        <p className={styles.heroSubtitle}>{message}</p>
        <button type="button" onClick={onRetry} className={styles.heroActionPrimary}>
          Retry dashboard
        </button>
      </section>
    </div>
  );
}
