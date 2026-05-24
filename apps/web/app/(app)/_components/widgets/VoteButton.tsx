'use client';

import { useEffect, useState } from 'react';
import styles from './VoteButton.module.css';

export type VoteState = -1 | 0 | 1;
export type VoteDirection = -1 | 1;

export type VoteButtonProps = {
  score: number;
  myVote?: VoteState;
  onVote: (
    direction: VoteDirection
  ) =>
    | Promise<{ score: number; myVote: VoteState }>
    | { score: number; myVote: VoteState }
    | Promise<void>
    | void;
  disabled?: boolean;
  requireAuth?: boolean;
  onAuthRequired?: () => void;
  size?: 'sm' | 'md';
  ariaLabel?: string;
};

export default function VoteButton({
  score,
  myVote = 0,
  onVote,
  disabled = false,
  requireAuth = false,
  onAuthRequired,
  size = 'md',
  ariaLabel = 'Vote',
}: VoteButtonProps) {
  const [localScore, setLocalScore] = useState(score);
  const [localVote, setLocalVote] = useState<VoteState>(myVote);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setLocalScore(score);
  }, [score]);

  useEffect(() => {
    setLocalVote(myVote);
  }, [myVote]);

  async function cast(direction: VoteDirection) {
    if (disabled || pending) return;
    if (requireAuth) {
      onAuthRequired?.();
      return;
    }
    const next: VoteState = localVote === direction ? 0 : direction;
    const previousVote = localVote;
    const previousScore = localScore;
    const optimisticScore = localScore - previousVote + next;
    setLocalVote(next);
    setLocalScore(optimisticScore);
    setPending(true);
    try {
      const result = await onVote(direction);
      if (result && typeof result === 'object' && 'score' in result) {
        setLocalScore(result.score);
        setLocalVote(result.myVote);
      }
    } catch {
      setLocalVote(previousVote);
      setLocalScore(previousScore);
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={`${styles.wrapper} ${size === 'sm' ? styles.sm : ''}`}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className={`${styles.btn} ${localVote === 1 ? styles.btnActiveUp : ''}`}
        onClick={() => void cast(1)}
        disabled={disabled || pending}
        aria-label="Upvote"
        aria-pressed={localVote === 1}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M3 9l4-5 4 5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <strong className={styles.score} aria-live="polite">
        {localScore}
      </strong>
      <button
        type="button"
        className={`${styles.btn} ${localVote === -1 ? styles.btnActiveDown : ''}`}
        onClick={() => void cast(-1)}
        disabled={disabled || pending}
        aria-label="Downvote"
        aria-pressed={localVote === -1}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M3 5l4 5 4-5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
