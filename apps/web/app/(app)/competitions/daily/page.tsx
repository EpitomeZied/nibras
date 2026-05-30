'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { DailyHistoryResponse, DailySolveResponse, DailyVerifyResponse } from '@nibras/contracts';
import { buildIdeProblemUrl } from '../../ide/_content/ide-links';
import { buildTutorAskHref } from '../../tutor/_content/tutor-context';
import { useFetch } from '../../../lib/use-fetch';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import {
  buildDailyDiscussHref,
  difficultyClassName,
  difficultyLabel,
  formatResetCountdown,
  msUntilMidnight,
  getDailyHistory,
  getDailyLeaderboard,
  historyStatus,
  pauseDailyProblems,
  patchDailyConfig,
  resumeDailyProblems,
  skipDailyToday,
  solveDailyToday,
  verifyDailyToday,
} from '../../../lib/services/daily-problem';
import StatTile from '../../_components/widgets/StatTile';
import EmptyState from '../../_components/widgets/EmptyState';
import LeaderboardTable from '../../_components/widgets/LeaderboardTable';
import { useSession } from '../../_components/session-context';
import DailyHowItWorks from './_components/daily-how-it-works';
import DailySettingsPanel from './_components/daily-settings-panel';
import styles from './page.module.css';

type DailyTodayResponse = {
  paused: boolean;
  pausedUntil?: string;
  assignment?: {
    id: string;
    assignedDate: string;
    solved: boolean;
    solvedAt?: string;
    skipped: boolean;
    problem: {
      id: string;
      title: string;
      url: string;
      platform: string;
      difficulty: number;
      tags: string[];
    };
  };
  streak: {
    current: number;
    longest: number;
    totalCompleted: number;
    freezesLeft: number;
  };
};

type DailyStatsResponse = {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  freezesLeft: number;
  calendar: { date: string; status: 'solved' | 'missed' | 'skipped' | 'pending' | 'none' }[];
  nextMilestone?: {
    kind: 'streak' | 'completed';
    target: number;
    current: number;
    remaining: number;
    label: string;
    reputationBonus?: number;
  } | null;
};

type DailyConfigResponse = {
  enabled: boolean;
  difficultyPref: number[];
  tagPrefs: string[];
  timezone: string;
  pausedUntil: string | null;
  streakFreezes: number;
};

function chipClassForStatus(status: ReturnType<typeof historyStatus>): string {
  switch (status) {
    case 'Solved':
      return styles.chipSolved;
    case 'Skipped':
      return styles.chipSkipped;
    case 'Missed':
      return styles.chipMissed;
    default:
      return styles.chipPending;
  }
}

export default function DailyProblemPage() {
  const { user } = useSession();
  const {
    data: today,
    loading,
    error,
    reload,
  } = useFetch<DailyTodayResponse>('/v1/daily-problem/today');
  const { data: stats, reload: reloadStats } =
    useFetch<DailyStatsResponse>('/v1/daily-problem/stats');
  const { data: config, reload: reloadConfig } = useFetch<DailyConfigResponse>(
    '/v1/daily-problem/config'
  );

  const [historyItems, setHistoryItems] = useState<DailyHistoryResponse['items']>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [leaderboardRows, setLeaderboardRows] = useState<
    Array<{
      rank: number;
      userId: string;
      username: string;
      score: number;
      meta?: string;
    }>
  >([]);
  const [acting, setActing] = useState(false);
  const [pauseDays, setPauseDays] = useState(7);
  const [actionError, setActionError] = useState<string | null>(null);
  const [solveCelebration, setSolveCelebration] = useState<
    DailySolveResponse | DailyVerifyResponse | null
  >(null);
  const [resetCountdown, setResetCountdown] = useState('');
  const [openedIde, setOpenedIde] = useState(false);

  const reloadAll = useCallback(() => {
    reload();
    reloadStats();
    reloadConfig();
    setHistoryPage(1);
  }, [reload, reloadStats, reloadConfig]);

  const loadHistory = useCallback(async (page: number, append: boolean) => {
    setHistoryLoading(true);
    try {
      const data = await getDailyHistory(page, 20);
      setHistoryTotal(data.total);
      setHistoryPage(data.page);
      setHistoryItems((prev) => (append ? [...prev, ...data.items] : data.items));
    } catch (err) {
      setActionError(friendlyMessage(err));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory(1, false);
  }, [loadHistory]);

  useEffect(() => {
    getDailyLeaderboard(20)
      .then((res) =>
        setLeaderboardRows(
          res.entries.map((e) => ({
            rank: e.rank,
            userId: e.userId,
            username: e.username,
            score: e.currentStreak,
            meta: `${e.longestStreak} best · ${e.totalCompleted} solved`,
          }))
        )
      )
      .catch(() => {
        /* optional */
      });
  }, []);

  useEffect(() => {
    const tz = config?.timezone ?? 'UTC';
    const tick = () => setResetCountdown(formatResetCountdown(msUntilMidnight(tz)));
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [config?.timezone]);

  const runAction = async (fn: () => Promise<void>) => {
    setActing(true);
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(friendlyMessage(err));
    } finally {
      setActing(false);
    }
  };

  const handleSolve = () => {
    if (
      !openedIde &&
      !window.confirm(
        'Mark this problem as solved? Open the IDE first if you want to practice here.'
      )
    ) {
      return;
    }
    void runAction(async () => {
      const result = await solveDailyToday();
      setSolveCelebration(result);
      reloadAll();
      void loadHistory(1, false);
    });
  };

  const handleSkip = () => {
    const freezes = today?.streak.freezesLeft ?? 0;
    if (
      !window.confirm(
        `Skip today's problem? This uses 1 of ${freezes} streak freeze${freezes === 1 ? '' : 's'} remaining.`
      )
    ) {
      return;
    }
    void runAction(async () => {
      await skipDailyToday();
      reloadAll();
      void loadHistory(1, false);
    });
  };

  const handleVerify = () => {
    void runAction(async () => {
      const result = await verifyDailyToday();
      if (result.verified) {
        setSolveCelebration(result);
        reloadAll();
        void loadHistory(1, false);
      }
    });
  };

  const handlePause = () => {
    void runAction(async () => {
      await pauseDailyProblems(pauseDays);
      reloadAll();
    });
  };

  const handleResume = () => {
    void runAction(async () => {
      await resumeDailyProblems();
      reloadAll();
    });
  };

  const handleToggleEnabled = (enabled: boolean) => {
    void runAction(async () => {
      await patchDailyConfig({ enabled });
      reloadAll();
    });
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.statsRow}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${styles.panel} ${styles.skeleton}`} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <EmptyState title="Could not load daily problem" description={error} tone="error" />
      </div>
    );
  }

  const streak = today?.streak ?? { current: 0, longest: 0, totalCompleted: 0, freezesLeft: 0 };
  const assignment = today?.assignment;
  const milestone = stats?.nextMilestone;

  return (
    <div className={styles.page}>
      <DailyHowItWorks />

      {actionError ? (
        <div className={styles.errorBanner} role="alert">
          {actionError}
          <button type="button" className={styles.dismissBtn} onClick={() => setActionError(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className={styles.statsRow}>
        <StatTile
          label="Current Streak"
          value={streak.current}
          icon={<span className={styles.streakFire}>&#128293;</span>}
          trend={streak.current > 0 ? 'up' : 'flat'}
        />
        <StatTile label="Longest Streak" value={streak.longest} />
        <StatTile label="Total Solved" value={streak.totalCompleted} />
        <StatTile label="Freezes Left" value={streak.freezesLeft} caption="Auto-save on miss" />
      </div>

      {[7, 30, 100].includes(streak.current) ? (
        <button
          type="button"
          className={styles.btnShareStreak}
          onClick={() => {
            const text = `I'm on a ${streak.current}-day daily problem streak on Nibras! 🔥`;
            void navigator.clipboard?.writeText(text);
          }}
        >
          Share {streak.current}-day streak
        </button>
      ) : null}

      {milestone ? (
        <div className={styles.milestoneBar}>
          <div className={styles.milestoneText}>
            <strong>{milestone.remaining}</strong> to {milestone.label}
            {milestone.reputationBonus ? ` (+${milestone.reputationBonus} rep)` : ''}
          </div>
          <div className={styles.milestoneTrack}>
            <div
              className={styles.milestoneFill}
              style={{ width: `${Math.min(100, (milestone.current / milestone.target) * 100)}%` }}
            />
          </div>
        </div>
      ) : null}

      <div className={styles.mainGrid}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>Today&apos;s Problem</div>
            {config?.timezone && resetCountdown ? (
              <span className={styles.resetHint}>Resets in {resetCountdown}</span>
            ) : null}
          </div>

          {today?.paused && (
            <div className={styles.pausedBanner}>
              Paused until {new Date(today.pausedUntil!).toLocaleDateString()}
              <button
                type="button"
                className={styles.btnSmall}
                onClick={handleResume}
                disabled={acting}
              >
                Resume
              </button>
            </div>
          )}

          {!today?.paused && assignment && (
            <div className={styles.problemCard}>
              <div className={styles.problemTitle}>
                <a href={assignment.problem.url} target="_blank" rel="noopener noreferrer">
                  {assignment.problem.title}
                </a>
              </div>
              <div className={styles.problemMeta}>
                <span
                  className={`${styles.badge} ${difficultyClassName(assignment.problem.difficulty, styles as { badgeEasy: string; badgeMedium: string; badgeHard: string })}`}
                >
                  {difficultyLabel(assignment.problem.difficulty)}
                </span>
                <span className={styles.tag}>{assignment.problem.platform}</span>
                {assignment.problem.tags.slice(0, 4).map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>

              {assignment.solved || solveCelebration ? (
                <div className={styles.solvedBanner}>
                  <div>&#10003; Solved today!</div>
                  {solveCelebration?.reputationEarned ? (
                    <div className={styles.celebrationMeta}>
                      +{solveCelebration.reputationEarned} reputation
                      {solveCelebration.milestoneBonus
                        ? ` (includes +${solveCelebration.milestoneBonus} milestone bonus)`
                        : ''}
                      {solveCelebration.newBadges?.length
                        ? ` · New badge${solveCelebration.newBadges.length > 1 ? 's' : ''}: ${solveCelebration.newBadges.join(', ')}`
                        : ''}
                    </div>
                  ) : null}
                </div>
              ) : assignment.skipped ? (
                <div className={styles.pausedBanner}>Skipped (freeze used)</div>
              ) : (
                <div className={styles.actions}>
                  <Link
                    href={buildIdeProblemUrl({
                      source: 'daily',
                      problem: assignment.problem.id,
                      title: assignment.problem.title,
                      description: `Practice "${assignment.problem.title}" — open the platform link for the full statement.`,
                      externalUrl: assignment.problem.url,
                    })}
                    className={styles.ideLink}
                    onClick={() => setOpenedIde(true)}
                  >
                    Open in IDE
                  </Link>
                  <Link
                    href={buildTutorAskHref({
                      problem: assignment.problem.id,
                      problemSource: 'daily',
                      prompt: `I'm working on today's daily problem "${assignment.problem.title}". Can you give me a hint without spoiling the solution?`,
                    })}
                    className={styles.secondaryLink}
                  >
                    Ask Hassona
                  </Link>
                  <Link
                    href={buildDailyDiscussHref(assignment.assignedDate, assignment.problem.title)}
                    className={styles.secondaryLink}
                  >
                    Discuss
                  </Link>
                  {assignment.problem.platform === 'codeforces' ? (
                    <button
                      type="button"
                      className={styles.btnVerify}
                      onClick={handleVerify}
                      disabled={acting}
                    >
                      Verify on Codeforces
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.btnSolve}
                    onClick={handleSolve}
                    disabled={acting}
                  >
                    Mark as Solved
                  </button>
                  <button
                    type="button"
                    className={styles.btnSkip}
                    onClick={handleSkip}
                    disabled={acting || streak.freezesLeft <= 0}
                    title={
                      streak.freezesLeft <= 0 ? 'No freezes remaining' : 'Uses 1 streak freeze'
                    }
                  >
                    Skip
                  </button>
                </div>
              )}
            </div>
          )}

          {!today?.paused && !assignment && (
            <EmptyState
              title="No problem available"
              description={
                config?.enabled === false
                  ? 'Daily problems are disabled. Enable them to start your streak.'
                  : 'No problems found matching your preferences.'
              }
              action={
                config?.enabled === false
                  ? { label: 'Enable Daily Problems', onClick: () => handleToggleEnabled(true) }
                  : undefined
              }
            />
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Last 90 Days</div>
          <div className={styles.calendar}>
            <div className={styles.calendarGrid}>
              {(stats?.calendar ?? []).map((day) => (
                <div
                  key={day.date}
                  className={styles.calendarCell}
                  data-status={day.status}
                  title={`${day.date}: ${day.status}`}
                />
              ))}
            </div>
            <div className={styles.calendarLegend}>
              <span>
                <span className={styles.legendDot} style={{ background: '#22c55e' }} /> Solved
              </span>
              <span>
                <span className={styles.legendDot} style={{ background: '#ef4444' }} /> Missed
              </span>
              <span>
                <span className={styles.legendDot} style={{ background: '#eab308' }} /> Skipped
              </span>
              <span>
                <span className={styles.legendDot} style={{ background: '#93c5fd' }} /> Pending
              </span>
              <span>
                <span className={styles.legendDot} style={{ background: '#e5e5e5' }} /> No
                assignment
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>History</div>
          {historyItems.length > 0 ? (
            <>
              <div className={styles.historyList}>
                {historyItems.map((item) => {
                  const status = historyStatus(item);
                  return (
                    <div key={item.id} className={styles.historyItem}>
                      <div>
                        <a
                          href={item.problem.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.historyTitle}
                        >
                          {item.problem.title}
                        </a>
                        <br />
                        <span className={styles.historyDate}>{item.assignedDate}</span>
                        <Link
                          href={buildIdeProblemUrl({
                            source: 'daily',
                            problem: item.problem.id,
                            title: item.problem.title,
                          })}
                          className={styles.historyIdeLink}
                        >
                          Open in IDE
                        </Link>
                      </div>
                      <span className={`${styles.statusChip} ${chipClassForStatus(status)}`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
              {historyItems.length < historyTotal ? (
                <button
                  type="button"
                  className={styles.btnLoadMore}
                  onClick={() => void loadHistory(historyPage + 1, true)}
                  disabled={historyLoading}
                >
                  {historyLoading ? 'Loading…' : 'Load more'}
                </button>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No history yet"
              description="Start solving daily problems to build your history."
            />
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Settings</div>
          <DailySettingsPanel
            config={config ?? null}
            paused={Boolean(today?.paused)}
            pausedUntil={today?.pausedUntil}
            pauseDays={pauseDays}
            acting={acting}
            onPauseDaysChange={setPauseDays}
            onPause={handlePause}
            onResume={handleResume}
            onToggleEnabled={handleToggleEnabled}
            onConfigSaved={reloadAll}
            onError={setActionError}
          />
        </div>
      </div>

      {leaderboardRows.length > 0 ? (
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Streak Leaderboard</div>
          <LeaderboardTable
            rows={leaderboardRows}
            highlightUserId={user?.id}
            scoreLabel="Streak"
            showDelta={false}
          />
        </div>
      ) : null}
    </div>
  );
}
