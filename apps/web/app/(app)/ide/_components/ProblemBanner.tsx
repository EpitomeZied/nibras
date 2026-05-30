'use client';

import Link from 'next/link';
import type { IdeProblemContext } from '../_content/problem-context';
import { buildTutorAskHref } from '../../tutor/_content/tutor-context';
import styles from '../page.module.css';

type ProblemBannerProps = {
  context: IdeProblemContext;
  onDismiss: () => void;
};

export default function ProblemBanner({ context, onDismiss }: ProblemBannerProps) {
  const backHref =
    context.source === 'nibras75' ? '/competitions/nibras-75' : '/competitions/daily';

  return (
    <div className={styles.problemBanner}>
      <div className={styles.problemBannerBody}>
        <span className={styles.problemBannerLabel}>
          {context.source === 'nibras75' ? 'Nibras 75' : 'Daily problem'}
        </span>
        <h2 className={styles.problemBannerTitle}>{context.title}</h2>
        <p className={styles.problemBannerDesc}>{context.description}</p>
      </div>
      <div className={styles.problemBannerActions}>
        <Link
          href={buildTutorAskHref({
            problem: context.slug,
            problemSource: context.source,
            prompt: `I'm stuck on "${context.title}". Can you give me a hint without spoiling the solution?`,
          })}
          className={styles.secondaryButton}
        >
          Ask Hassona
        </Link>
        <Link href={backHref} className={styles.secondaryButton}>
          Back to list
        </Link>
        <button type="button" className={styles.secondaryButton} onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
