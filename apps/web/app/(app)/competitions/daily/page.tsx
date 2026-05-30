'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { buildIdeProblemUrl } from '../../ide/_content/ide-links';
import { useFetch } from '../../../lib/use-fetch';
import { apiFetch } from '../../../lib/session';
import StatTile from '../../_components/widgets/StatTile';
import EmptyState from '../../_components/widgets/EmptyState';
import styles from './page.module.css';

type DailyProblem = {
  id: string;
  title: string;
  url: string;
  platform: string;
  difficulty: number;
  tags: string[];
};

type DailyTodayResponse = {
  paused: boolean;
  pausedUntil?: string;
  assignment?: {
    id: string;
    assignedDate: string;
    solved: boolean;
    solvedAt?: string;
    skipped: boolean;
    problem: DailyProblem;
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
  calendar: { date: string; status: 'solved' | 'missed' | 'skipped' | 'pending' }[];
};

type DailyHistoryResponse = {
  items: {
    id: string;
    assignedDate: string;
    solved: boolean;
    solvedAt?: string;
    skipped: boolean;
    missedAt?: string;
    problem: DailyProblem;
  }[];
  total: number;
  page: number;
  limit: number;
};

type DailyConfigResponse = {
  enabled: boolean;
  difficultyPref: number[];
  tagPrefs: string[];
  timezone: string;
  pausedUntil: string | null;
  streakFreezes: number;
};

function difficultyLabel(d: number): string {
  if (d <= 1000) return 'Easy';
  if (d <= 1800) return 'Medium';
  return 'Hard';
}

function difficultyClass(d: number): string {
  if (d <= 1000) return styles.badgeEasy;
  if (d <= 1800) return styles.badgeMedium;
  return styles.badgeHard;
}

export default function DailyProblemPage() {
  const {
    data: today,
    loading,
    error,
    reload,
  } = useFetch<DailyTodayResponse>('/v1/daily-problem/today');
  const { data: stats, reload: reloadStats } =
    useFetch<DailyStatsResponse>('/v1/daily-problem/stats');
  const { data: history, reload: reloadHistory } = useFetch<DailyHistoryResponse>(
    '/v1/daily-problem/history?limit=20'
  );
  const { data: config, reload: reloadConfig } = useFetch<DailyConfigResponse>(
    '/v1/daily-problem/config'
  );

  const [acting, setActing] = useState(false);
  const [pauseDays, setPauseDays] = useState(7);

  const reloadAll = useCallback(() => {
    reload();
    reloadStats();
    reloadHistory();
    reloadConfig();
  }, [reload, reloadStats, reloadHistory, reloadConfig]);

  const handleSolve = async () => {
    setActing(true);
    try {
      const res = await apiFetch('/v1/daily-problem/today/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solved: true }),
      });
      if (res.ok) reloadAll();
    } finally {
      setActing(false);
    }
  };

  const handleSkip = async () => {
    setActing(true);
    try {
      const res = await apiFetch('/v1/daily-problem/today/skip', { method: 'POST' });
      if (res.ok) reloadAll();
    } finally {
      setActing(false);
    }
  };

  const handlePause = async () => {
    setActing(true);
    try {
      const res = await apiFetch('/v1/daily-problem/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: pauseDays }),
      });
      if (res.ok) reloadAll();
    } finally {
      setActing(false);
    }
  };

  const handleResume = async () => {
    setActing(true);
    try {
      const res = await apiFetch('/v1/daily-problem/resume', { method: 'POST' });
      if (res.ok) reloadAll();
    } finally {
      setActing(false);
    }
  };

  const handleToggleEnabled = async (enabled: boolean) => {
    await apiFetch('/v1/daily-problem/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    reloadAll();
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.statsRow}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={styles.panel} style={{ height: 80 }} />
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

  return (
    <div className={styles.page}>
      {/* Stats row */}
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

      {/* Main grid */}
      <div className={styles.mainGrid}>
        {/* Today's problem */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Today&apos;s Problem</div>

          {today?.paused && (
            <div className={styles.pausedBanner}>
              Paused until {new Date(today.pausedUntil!).toLocaleDateString()}
              <button className={styles.btnSmall} onClick={handleResume} disabled={acting}>
                Resume
              </button>
            </div>
          )}

          {!today?.paused && today?.assignment && (
            <div className={styles.problemCard}>
              <div className={styles.problemTitle}>
                <a href={today.assignment.problem.url} target="_blank" rel="noopener noreferrer">
                  {today.assignment.problem.title}
                </a>
              </div>
              <div className={styles.problemMeta}>
                <span
                  className={`${styles.badge} ${difficultyClass(today.assignment.problem.difficulty)}`}
                >
                  {difficultyLabel(today.assignment.problem.difficulty)}
                </span>
                <span className={styles.tag}>{today.assignment.problem.platform}</span>
                {today.assignment.problem.tags.slice(0, 4).map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>

              {today.assignment.solved ? (
                <div className={styles.solvedBanner}>&#10003; Solved today!</div>
              ) : today.assignment.skipped ? (
                <div className={styles.pausedBanner}>Skipped (freeze used)</div>
              ) : (
                <div className={styles.actions}>
                  <Link
                    href={buildIdeProblemUrl({
                      source: 'daily',
                      problem: today.assignment.problem.id,
                      title: today.assignment.problem.title,
                    })}
                    className={styles.ideLink}
                  >
                    Open in IDE
                  </Link>
                  <button className={styles.btnSolve} onClick={handleSolve} disabled={acting}>
                    Mark as Solved
                  </button>
                  <button
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

          {!today?.paused && !today?.assignment && (
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

        {/* Calendar heatmap */}
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
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className={styles.mainGrid}>
        {/* History */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>History</div>
          {history && history.items.length > 0 ? (
            <div className={styles.historyList}>
              {history.items.map((item) => {
                let status: string;
                let chipClass: string;
                if (item.solved) {
                  status = 'Solved';
                  chipClass = styles.chipSolved;
                } else if (item.skipped) {
                  status = 'Skipped';
                  chipClass = styles.chipSkipped;
                } else if (item.missedAt) {
                  status = 'Missed';
                  chipClass = styles.chipMissed;
                } else {
                  status = 'Pending';
                  chipClass = styles.chipPending;
                }
                return (
                  <div key={item.id} className={styles.historyItem}>
                    <div>
                      <span className={styles.historyTitle}>{item.problem.title}</span>
                      <br />
                      <span className={styles.historyDate}>{item.assignedDate}</span>
                    </div>
                    <span className={`${styles.statusChip} ${chipClass}`}>{status}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No history yet"
              description="Start solving daily problems to build your history."
            />
          )}
        </div>

        {/* Settings */}
        <div className={styles.panel}>
          <div className={styles.panelTitle}>Settings</div>
          <div className={styles.settingsForm}>
            <div className={styles.toggleRow}>
              <span className={styles.fieldLabel}>Daily Problems</span>
              <button
                className={styles.btnSmall}
                onClick={() => handleToggleEnabled(!config?.enabled)}
              >
                {config?.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Timezone</span>
              <span style={{ fontSize: '0.8125rem' }}>{config?.timezone ?? 'UTC'}</span>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Difficulty Preference</span>
              <span style={{ fontSize: '0.8125rem' }}>
                {config?.difficultyPref?.length
                  ? config.difficultyPref.map((d) => difficultyLabel(d)).join(', ')
                  : 'All difficulties'}
              </span>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Vacation Mode</span>
              {today?.paused ? (
                <div>
                  <span style={{ fontSize: '0.8125rem' }}>
                    Paused until {new Date(today.pausedUntil!).toLocaleDateString()}
                  </span>
                  <button
                    className={styles.btnSmall}
                    onClick={handleResume}
                    disabled={acting}
                    style={{ marginLeft: 8 }}
                  >
                    Resume
                  </button>
                </div>
              ) : (
                <div className={styles.pauseActions}>
                  <select
                    className={styles.fieldInput}
                    value={pauseDays}
                    onChange={(e) => setPauseDays(Number(e.target.value))}
                  >
                    {[1, 3, 7, 14, 30].map((d) => (
                      <option key={d} value={d}>
                        {d} day{d > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                  <button className={styles.btnSmall} onClick={handlePause} disabled={acting}>
                    Pause
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
