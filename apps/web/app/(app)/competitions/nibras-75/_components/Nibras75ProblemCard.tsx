'use client';

import Link from 'next/link';
import CompanyIcons from './CompanyIcons';
import { buildIdeProblemUrl } from '../../../ide/_content/ide-links';
import { buildTutorAskHref } from '../../../tutor/_content/tutor-context';
import type { Nibras75Problem, Nibras75Workspace } from '../../../../lib/services/competitions';
import { difficultyClass, workspaceProblemUrl } from './nibras75-utils';
import styles from '../page.module.css';

type Nibras75ProblemCardProps = {
  problem: Nibras75Problem;
  user: boolean;
  toggling: boolean;
  workspace: Nibras75Workspace | null;
  onToggleSolved: (problem: Nibras75Problem) => void;
};

export default function Nibras75ProblemCard({
  problem,
  user,
  toggling,
  workspace,
  onToggleSolved,
}: Nibras75ProblemCardProps) {
  const cardClass = [
    styles.card,
    problem.solved ? styles.cardSolved : '',
    problem.attempted && !problem.solved ? styles.cardAttempted : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={cardClass}>
      {user ? (
        <button
          type="button"
          className={`${styles.solvedToggle} ${problem.solved ? styles.solvedToggleOn : ''}`}
          aria-pressed={problem.solved}
          aria-label={problem.solved ? 'Mark as not solved' : 'Mark as solved'}
          disabled={toggling}
          onClick={() => onToggleSolved(problem)}
        >
          {toggling ? '…' : problem.solved ? '✓' : ''}
        </button>
      ) : (
        <span className={styles.rank}>#{problem.rank}</span>
      )}
      <div className={styles.body}>
        <div className={styles.cardHeader}>
          <h2 className={styles.problemTitle}>
            <span className={styles.rankInline}>#{problem.rank}</span>{' '}
            <a href={problem.url} target="_blank" rel="noopener noreferrer">
              {problem.name}
            </a>
          </h2>
          <span className={`${styles.difficulty} ${difficultyClass(problem.difficulty, styles)}`}>
            {problem.difficulty}
          </span>
        </div>
        <div className={styles.metaBadges}>
          <span className={styles.freqBadge}>
            Asked in ~{problem.askedByCount} interviews
          </span>
          {problem.solved && (
            <span
              className={
                problem.userMarked ? styles.badgeManual : styles.badgeSynced
              }
            >
              {problem.userMarked ? 'Marked manually' : 'Synced from LeetCode'}
            </span>
          )}
          {problem.attempted && !problem.solved && (
            <span className={styles.badgeAttempted}>Attempted</span>
          )}
        </div>
        <CompanyIcons companies={problem.companies ?? []} />
        <p className={styles.description}>{problem.description}</p>
        <div className={styles.tags}>
          {problem.tags.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag.replace(/-/g, ' ')}
            </span>
          ))}
        </div>
        <div className={styles.cardActions}>
          <Link
            href={buildIdeProblemUrl({
              source: 'nibras75',
              problem: problem.problemId,
              title: problem.name,
              description: problem.description,
            })}
            className={styles.ideLink}
          >
            Open in IDE
          </Link>
          <Link
            href={buildTutorAskHref({
              problem: problem.problemId,
              problemSource: 'nibras75',
              prompt: `I'm stuck on "${problem.name}". Can you give me a hint without spoiling the solution?`,
            })}
            className={styles.ideLink}
          >
            Ask Hassona
          </Link>
          {workspace ? (
            <a
              href={workspaceProblemUrl(workspace, problem.problemId)}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ideLink}
            >
              Workspace
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
