import type { Metadata } from 'next';
import Link from 'next/link';
import AuthSignIn from '../_components/auth-sign-in';
import NibrasLogo from '../_components/nibras-logo';
import styles from '../signin.module.css';

export const metadata: Metadata = {
  title: 'Sign in · Nibras',
  description: 'Sign in to Nibras with Google, GitHub, or a magic link sent to your email.',
};

export default function SignInPage() {
  return (
    <main className={styles.page}>
      <div className={`${styles.orb} ${styles.orb1}`} />
      <div className={`${styles.orb} ${styles.orb2}`} />

      <header
        style={{
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '28px 0 32px',
        }}
      >
        <Link href="/" aria-label="Back to home">
          <NibrasLogo variant="inverse" width={100} />
        </Link>
        <Link href="/" className={styles.whatsNewLink}>
          ← Home
        </Link>
      </header>

      <div
        style={{
          width: '100%',
          maxWidth: 440,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          padding: '28px',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#fafafa' }}>
            Sign in
          </h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'rgba(161,161,170,0.9)' }}>
            Use Google, GitHub, or a one-time email link. Magic-link sign-in works for the web
            dashboard; connect GitHub later for CLI submissions.
          </p>
        </div>
        <AuthSignIn
          googleClassName={styles.btnGoogleSignIn}
          githubClassName={styles.btnHeroPrimary}
          magicLinkClassName={styles.btnMagicLink}
          emailInputClassName={styles.magicLinkEmail}
          errorClassName={styles.errorMsg}
          noticeClassName={styles.authNotice}
          githubLabel="Continue with GitHub"
        />
      </div>
    </main>
  );
}
