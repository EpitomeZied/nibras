import styles from '../page.module.css';

function IconKey() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  );
}

export default function SecurityTab() {
  return (
    <section className={styles.contentSection}>
      <h2 className={styles.sectionHeading}>Security</h2>
      <p className={styles.sectionSub}>Manage your security settings</p>

      <div className={styles.securityCard}>
        <span className={styles.securityCardIcon}>
          <IconKey />
        </span>
        <div className={styles.securityCardBody}>
          <strong className={styles.securityCardTitle}>Password</strong>
          <p className={styles.securityCardMessage}>
            You signed in with a social account. Password management is not available.
          </p>
        </div>
      </div>
    </section>
  );
}
