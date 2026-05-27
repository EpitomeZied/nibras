import type { Metadata } from 'next';
import Link from 'next/link';
import NibrasLogo from '../_components/nibras-logo';
import { docsFaq, docsGettingStarted, docsIntro, docsNavSections } from '../_content/docs';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Docs · Nibras',
  description: 'Introduction, FAQ, and getting started guide for nibrasplatform.me',
};

export default function DocsPage() {
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
          <h1 className={styles.title}>Documentation</h1>
          <p className={styles.subtitle}>
            Learn what Nibras is for, find answers to common questions, and follow the steps to get
            started on the web and CLI.
          </p>
        </div>

        <nav className={styles.sectionNav} aria-label="On this page">
          {docsNavSections.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.label}
            </a>
          ))}
        </nav>

        <section id="introduction" className={styles.section} aria-labelledby="intro-heading">
          <h2 id="intro-heading" className={styles.sectionTitle}>
            Introduction
          </h2>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>{docsIntro.whyUse.title}</h3>
            {docsIntro.whyUse.paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles.bodyText}>
                {paragraph}
              </p>
            ))}
            <ul className={styles.highlights}>
              {docsIntro.whyUse.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.subsection}>
            <h3 className={styles.subsectionTitle}>{docsIntro.whatCanYouDo.title}</h3>
            <ul className={styles.capabilities}>
              {docsIntro.whatCanYouDo.items.map((item) => (
                <li key={item.title}>
                  <p className={styles.capabilityTitle}>{item.title}</p>
                  <p className={styles.capabilityDesc}>{item.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" className={styles.section} aria-labelledby="faq-heading">
          <h2 id="faq-heading" className={styles.sectionTitle}>
            FAQ
          </h2>
          <div className={styles.faqList}>
            {docsFaq.map((item) => (
              <details key={item.question} className={styles.faqItem}>
                <summary>{item.question}</summary>
                <p className={styles.faqAnswer}>{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="getting-started" className={styles.section} aria-labelledby="start-heading">
          <h2 id="start-heading" className={styles.sectionTitle}>
            Getting Started
          </h2>
          <ol className={styles.steps}>
            {docsGettingStarted.map((step) => (
              <li key={step.title} className={styles.step}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
                {step.link ? (
                  <Link href={step.link.href} className={styles.stepLink}>
                    {step.link.label} →
                  </Link>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

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
      </div>
    </main>
  );
}
