import type { Metadata } from 'next';
import { docsIntro } from '../../_content/docs';
import DocsShell from '../_components/docs-shell';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Introduction · Docs · Nibras',
  description: 'What Nibras is for and what you can do on the platform',
};

export default function DocsIntroductionPage() {
  return (
    <DocsShell activeHref="/docs/introduction">
      <div className={styles.intro}>
        <h1 className={styles.title}>Introduction</h1>
        <p className={styles.subtitle}>
          What Nibras is built for and how students, instructors, and operators use it.
        </p>
      </div>

      <section className={styles.section} aria-labelledby="why-heading">
        <h2 id="why-heading" className={styles.sectionTitle}>
          {docsIntro.whyUse.title}
        </h2>
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
      </section>

      <section className={styles.section} aria-labelledby="capabilities-heading">
        <h2 id="capabilities-heading" className={styles.sectionTitle}>
          {docsIntro.whatCanYouDo.title}
        </h2>
        <ul className={styles.capabilities}>
          {docsIntro.whatCanYouDo.items.map((item) => (
            <li key={item.title}>
              <p className={styles.capabilityTitle}>{item.title}</p>
              <p className={styles.capabilityDesc}>{item.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </DocsShell>
  );
}
