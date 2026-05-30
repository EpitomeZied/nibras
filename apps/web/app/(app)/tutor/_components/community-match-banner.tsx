'use client';

import Link from 'next/link';
import styles from './community-match-banner.module.css';

type CommunityMatchBannerProps = {
  questionId: string;
  question: string;
  matchScore: number;
  onDismiss?: () => void;
};

export default function CommunityMatchBanner({
  questionId,
  question,
  matchScore,
  onDismiss,
}: CommunityMatchBannerProps) {
  const percent = Math.round(matchScore * 100);

  return (
    <div className={styles.banner}>
      <div className={styles.body}>
        <span className={styles.eyebrow}>Similar community question</span>
        <p className={styles.question}>{question}</p>
        <span className={styles.score}>{percent}% match</span>
      </div>
      <div className={styles.actions}>
        <Link href={`/community/q/${questionId}`} className={styles.link}>
          View discussion
        </Link>
        {onDismiss && (
          <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
            &times;
          </button>
        )}
      </div>
    </div>
  );
}
