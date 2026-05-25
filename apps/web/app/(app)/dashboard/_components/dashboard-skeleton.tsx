'use client';

import styles from '../page.module.css';

export default function DashboardSkeleton() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.skeletonBlock} style={{ width: 140, height: 14 }} />
          <div className={styles.skeletonBlock} style={{ width: '52%', height: 44 }} />
          <div className={styles.skeletonBlock} style={{ width: '72%', height: 18 }} />
          <div className={styles.heroActions}>
            <div className={styles.skeletonBlock} style={{ width: 148, height: 46 }} />
            <div className={styles.skeletonBlock} style={{ width: 148, height: 46 }} />
          </div>
        </div>
      </section>

      <section className={styles.statsRow}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={styles.metricCard}>
            <div className={styles.skeletonBlock} style={{ width: 90, height: 12 }} />
            <div className={styles.skeletonBlock} style={{ width: 120, height: 30 }} />
            <div className={styles.skeletonBlock} style={{ width: '85%', height: 12 }} />
          </div>
        ))}
      </section>

      <div className={styles.dashboardLayout}>
        <div className={styles.primaryGrid}>
          <div className={styles.panel}>
            <div className={styles.skeletonColumn}>
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className={styles.skeletonCard} />
              ))}
            </div>
          </div>
          <div className={styles.panel}>
            <div className={styles.skeletonColumn}>
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={styles.skeletonCard} />
              ))}
            </div>
          </div>
        </div>
        <div className={styles.sidebarStack}>
          <div className={styles.panel}>
            <div className={styles.skeletonCard} />
          </div>
        </div>
      </div>
    </div>
  );
}
