'use client';

import Link from 'next/link';
import StatTile from '../../../_components/widgets/StatTile';
import type { Nibras75StatsResponse, Nibras75Workspace } from '../../../../lib/services/competitions';
import { buildIdeProblemUrl } from '../../../ide/_content/ide-links';
import { estimateDailyPace, estimateWeeksRemaining } from './nibras75-utils';
import styles from '../page.module.css';

type Nibras75HeroProps = {
  completedInSet: number;
  curriculumTotal: number;
  stats: Nibras75StatsResponse | null;
  activeHandle: string | null;
  user: boolean;
  githubLinked: boolean;
  workspace: Nibras75Workspace | null;
  forking: boolean;
  forkError: string | null;
  weeklyPace: number;
  targetDate: string | null;
  onConnectGitHub: () => void;
  onFork: () => void;
};

export default function Nibras75Hero({
  completedInSet,
  curriculumTotal,
  stats,
  activeHandle,
  user,
  githubLinked,
  workspace,
  forking,
  forkError,
  weeklyPace,
  targetDate,
  onConnectGitHub,
  onFork,
}: Nibras75HeroProps) {
  const progressPct =
    curriculumTotal <= 0 ? 0 : Math.round((completedInSet / curriculumTotal) * 100);
  const remaining = Math.max(0, curriculumTotal - completedInSet);
  const weeksLeft = estimateWeeksRemaining(remaining, weeklyPace);
  const dailyPace = estimateDailyPace(targetDate, remaining);
  const next = stats?.nextUnsolved;
  const byDiff = stats?.byDifficulty;

  return (
    <section className={styles.hero}>
      <span className={styles.badge}>Interview prep</span>
      <h1 className={styles.title}>Nibras 75</h1>
      <p className={styles.subtitle}>
        The essential data structures and algorithms list for software engineering interviews.
        Master these 75 LeetCode problems — weighted toward what top companies ask most often.
      </p>
      <div className={styles.metaRow}>
        <span className={styles.metaPill}>75 curated questions</span>
        <span className={styles.metaPill}>LeetCode practice</span>
        <span className={styles.metaPill}>FAANG-style DSA</span>
      </div>

      {stats && (
        <div className={styles.statsRow}>
          <StatTile
            label="Easy"
            value={`${byDiff?.easy.solved ?? 0}/${byDiff?.easy.total ?? 0}`}
            caption="solved"
          />
          <StatTile
            label="Medium"
            value={`${byDiff?.medium.solved ?? 0}/${byDiff?.medium.total ?? 0}`}
            caption="solved"
          />
          <StatTile
            label="Hard"
            value={`${byDiff?.hard.solved ?? 0}/${byDiff?.hard.total ?? 0}`}
            caption="solved"
          />
          <StatTile
            label="Est. finish"
            value={weeksLeft > 0 ? `${weeksLeft}w` : 'Done'}
            caption={
              dailyPace
                ? `${dailyPace}/day to target`
                : `${weeklyPace}/week pace`
            }
          />
        </div>
      )}

      <div>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Questions completed</span>
          <strong>
            {completedInSet} / {curriculumTotal}
          </strong>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {next && (
        <div className={styles.continueRow}>
          <Link
            href={next.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.continueBtn}
          >
            Continue → #{next.rank} {next.name}
          </Link>
          <Link
            href={buildIdeProblemUrl({
              source: 'nibras75',
              problem: next.problemId,
              title: next.name,
              description: next.description,
            })}
            className={styles.continueSecondary}
          >
            Open in IDE
          </Link>
        </div>
      )}

      {activeHandle && (
        <p className={styles.syncLine}>
          Synced with LeetCode as <strong>{activeHandle}</strong>
        </p>
      )}

      {user && (
        <div className={styles.forkRow}>
          {workspace ? (
            <>
              <span className={styles.mutedText}>
                Solutions repo:{' '}
                <a href={workspace.htmlUrl} target="_blank" rel="noopener noreferrer">
                  {workspace.fullName}
                </a>
              </span>
              {workspace.cloneUrl ? (
                <code className={styles.cloneHint}>git clone {workspace.cloneUrl}</code>
              ) : null}
            </>
          ) : !githubLinked ? (
            <>
              <button type="button" className={styles.linkBtn} onClick={onConnectGitHub}>
                Connect GitHub
              </button>
              <span className={styles.mutedText}>
                Sign in with GitHub to fork your private solutions workspace.
              </span>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.linkBtn}
                disabled={forking}
                onClick={onFork}
              >
                {forking ? 'Creating repo…' : 'Fork on GitHub'}
              </button>
              <span className={styles.mutedText}>
                Creates a private repo from the Nibras 75 template for your solutions.
              </span>
            </>
          )}
          {forkError ? <span className={styles.errorText}>{forkError}</span> : null}
        </div>
      )}
    </section>
  );
}
