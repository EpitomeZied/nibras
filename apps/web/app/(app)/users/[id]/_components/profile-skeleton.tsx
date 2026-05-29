import styles from '../page.module.css';

export default function ProfileSkeleton() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Loading profile">
      <div className={styles.headerCard}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonAvatar}`} />
        <div className={styles.headerText}>
          <div className={`${styles.skeletonBlock} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonLine}`} />
          <div className={`${styles.skeletonBlock} ${styles.skeletonChip}`} />
        </div>
      </div>
      <div className={styles.summary}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${styles.skeletonBlock} ${styles.skeletonStat}`} />
        ))}
      </div>
      <div className={`${styles.skeletonBlock} ${styles.skeletonPanel}`} />
    </div>
  );
}
