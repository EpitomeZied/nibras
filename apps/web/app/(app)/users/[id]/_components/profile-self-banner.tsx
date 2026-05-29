import Link from 'next/link';
import styles from '../page.module.css';

export default function ProfileSelfBanner({ githubAppInstalled }: { githubAppInstalled: boolean }) {
  return (
    <div className={styles.selfBanner}>
      <span>
        GitHub App: <strong>{githubAppInstalled ? 'Installed' : 'Not installed'}</strong>
        {!githubAppInstalled
          ? ' — install to enable automatic submission tracking.'
          : ' — push tracking is active.'}
      </span>
      <Link href="/settings?tab=github" className={styles.sectionLink}>
        {githubAppInstalled ? 'Manage' : 'Install'} →
      </Link>
    </div>
  );
}
