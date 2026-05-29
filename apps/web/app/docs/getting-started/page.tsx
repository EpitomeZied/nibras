import type { Metadata } from 'next';
import Link from 'next/link';
import { docsGettingStarted } from '../../_content/docs';
import DocsShell from '../_components/docs-shell';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Getting Started · Docs · Nibras',
  description: 'Step-by-step guide to sign in, join a course, and submit work with the Nibras CLI',
};

export default function DocsGettingStartedPage() {
  return (
    <DocsShell activeHref="/docs/getting-started">
      <div className={styles.intro}>
        <h1 className={styles.title}>Getting Started</h1>
        <p className={styles.subtitle}>
          From first sign-in to your first verified CLI submission — six steps.
        </p>
      </div>

      <ol className={styles.steps}>
        {docsGettingStarted.map((step) => (
          <li key={step.title} className={styles.step}>
            <h2 className={styles.stepTitle}>{step.title}</h2>
            <p className={styles.stepDesc}>{step.description}</p>
            {step.link ? (
              <Link href={step.link.href} className={styles.stepLink}>
                {step.link.label} →
              </Link>
            ) : null}
          </li>
        ))}
      </ol>

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
