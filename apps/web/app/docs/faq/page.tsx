import type { Metadata } from 'next';
import { docsFaq, docsFaqHelp } from '../../_content/docs';
import DocsShell from '../_components/docs-shell';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'FAQ · Docs · Nibras',
  description: 'Frequently asked questions about Nibras, the CLI, and GitHub sign-in',
};

export default function DocsFaqPage() {
  return (
    <DocsShell activeHref="/docs/faq">
      <div className={styles.intro}>
        <h1 className={styles.title}>FAQ</h1>
        <p className={styles.subtitle}>
          Common questions about sign-in, the CLI, submissions, and getting help.
        </p>
      </div>

      <div className={styles.faqList}>
        {docsFaq.map((item) => (
          <details key={item.question} className={styles.faqItem}>
            <summary>{item.question}</summary>
            <p className={styles.faqAnswer}>{item.answer}</p>
          </details>
        ))}
      </div>

      <aside className={styles.faqHelp}>
        <h2 className={styles.faqHelpTitle}>{docsFaqHelp.title}</h2>
        <p className={styles.faqHelpText}>{docsFaqHelp.lines[0]}</p>
        <a
          href={docsFaqHelp.issueUrl}
          className={styles.faqHelpLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {docsFaqHelp.lines[1]}
        </a>
      </aside>
    </DocsShell>
  );
}
