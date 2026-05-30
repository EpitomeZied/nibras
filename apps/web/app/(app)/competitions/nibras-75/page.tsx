'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import EmptyState from '../../_components/widgets/EmptyState';
import Nibras75Hero from './_components/Nibras75Hero';
import Nibras75Toolbar from './_components/Nibras75Toolbar';
import Nibras75ProblemCard from './_components/Nibras75ProblemCard';
import Nibras75Analytics from './_components/Nibras75Analytics';
import Nibras75ProgressHeatmap from './_components/Nibras75ProgressHeatmap';
import Nibras75StudyPlan from './_components/Nibras75StudyPlan';
import {
  filtersToSearchParams,
  parseFiltersFromSearch,
  type Nibras75Filters,
} from './_components/nibras75-utils';
import {
  forkNibras75Workspace,
  getNibras75Analytics,
  getNibras75Config,
  getNibras75Problems,
  getNibras75Stats,
  getNibras75Workspace,
  linkAccount,
  patchNibras75Config,
  setNibras75ProblemSolved,
  type Nibras75AnalyticsResponse,
  type Nibras75Config,
  type Nibras75Problem,
  type Nibras75StatsResponse,
  type Nibras75Workspace,
} from '../../../lib/services/competitions';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { discoverApiBaseUrl } from '../../../lib/session';
import { useSession } from '../../_components/session-context';

const DEFAULT_CONFIG: Nibras75Config = {
  weeklyPace: 5,
  targetDate: null,
  useForDailyProblem: false,
};

export default function Nibras75Page() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const githubLinked = Boolean(user?.githubLinked);

  const [filters, setFilters] = useState<Nibras75Filters>(() =>
    parseFiltersFromSearch(new URLSearchParams(searchParams.toString()))
  );
  const [debouncedQ, setDebouncedQ] = useState(filters.q.trim());

  const [items, setItems] = useState<Nibras75Problem[]>([]);
  const [total, setTotal] = useState(75);
  const [completedInSet, setCompletedInSet] = useState(0);
  const [curriculumTotal, setCurriculumTotal] = useState(75);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkHandle, setLinkHandle] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Nibras75Workspace | null>(null);
  const [forking, setForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);
  const [stats, setStats] = useState<Nibras75StatsResponse | null>(null);
  const [analytics, setAnalytics] = useState<Nibras75AnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [config, setConfig] = useState<Nibras75Config>(DEFAULT_CONFIG);
  const [configSaving, setConfigSaving] = useState(false);

  useEffect(() => {
    setFilters(parseFiltersFromSearch(new URLSearchParams(searchParams.toString())));
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q.trim()), 300);
    return () => clearTimeout(t);
  }, [filters.q]);

  useEffect(() => {
    const params = filtersToSearchParams({ ...filters, q: debouncedQ });
    const qs = params.toString();
    const target = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== target) {
      window.history.replaceState(null, '', target);
    }
  }, [filters, debouncedQ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const st = params.get('st');
    if (!st) return;
    try {
      window.localStorage.setItem('nibras.webSession', st);
    } catch {
      /* ignore */
    }
    params.delete('st');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}`;
    window.history.replaceState(null, '', next);
    window.location.reload();
  }, []);

  const updateFilters = useCallback((patch: Partial<Nibras75Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const solved =
        filters.solved === 'all'
          ? undefined
          : filters.solved === 'solved'
            ? ('true' as const)
            : ('false' as const);
      const data = await getNibras75Problems({
        q: debouncedQ || undefined,
        difficulty: filters.difficulty === 'all' ? undefined : filters.difficulty,
        solved,
        tag: filters.tag || undefined,
        company: filters.company || undefined,
        sort: filters.sort,
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setCompletedInSet(data.completedInSet ?? 0);
      setCurriculumTotal(data.totalCurriculum ?? 75);
      setActiveHandle(data.handle ?? null);
    } catch (err) {
      setError(friendlyMessage(err));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, filters]);

  const loadStats = useCallback(async () => {
    try {
      const data = await getNibras75Stats(activeHandle ?? undefined);
      setStats(data);
    } catch {
      setStats(null);
    }
  }, [activeHandle]);

  const loadAnalytics = useCallback(async () => {
    if (!user || !activeHandle) {
      setAnalytics(null);
      return;
    }
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await getNibras75Analytics(activeHandle);
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(friendlyMessage(err));
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [activeHandle, user]);

  const loadConfig = useCallback(async () => {
    if (!user) {
      setConfig(DEFAULT_CONFIG);
      return;
    }
    try {
      const data = await getNibras75Config();
      setConfig(data.config);
    } catch {
      setConfig(DEFAULT_CONFIG);
    }
  }, [user]);

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  useEffect(() => {
    void loadStats();
  }, [loadStats, completedInSet]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (!user) {
      setWorkspace(null);
      return;
    }
    void getNibras75Workspace()
      .then((data) => setWorkspace(data.workspace))
      .catch(() => setWorkspace(null));
  }, [user]);

  async function handleConnectGitHub() {
    setForkError(null);
    try {
      const apiBaseUrl = await discoverApiBaseUrl();
      const returnTo = `${window.location.origin}/competitions/nibras-75`;
      window.location.href = `${apiBaseUrl}/v1/github/oauth/start?return_to=${encodeURIComponent(returnTo)}`;
    } catch (err) {
      setForkError(friendlyMessage(err));
    }
  }

  async function handleFork() {
    if (!githubLinked) {
      await handleConnectGitHub();
      return;
    }
    setForking(true);
    setForkError(null);
    try {
      const data = await forkNibras75Workspace();
      setWorkspace(data.workspace);
    } catch (err) {
      setForkError(friendlyMessage(err));
    } finally {
      setForking(false);
    }
  }

  async function toggleSolved(problem: Nibras75Problem) {
    if (!user) return;
    const next = !problem.solved;
    setTogglingSlug(problem.problemId);
    try {
      await setNibras75ProblemSolved(problem.problemId, next);
      setItems((prev) =>
        prev.map((p) =>
          p.problemId === problem.problemId
            ? { ...p, solved: next, attempted: true, userMarked: true }
            : p
        )
      );
      setCompletedInSet((prev) => prev + (next ? 1 : -1));
      void loadStats();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setTogglingSlug(null);
    }
  }

  async function handleLink() {
    const handle = linkHandle.trim();
    if (!handle) return;
    setLinking(true);
    setLinkError(null);
    try {
      await linkAccount({ host: 'leetcode', handle });
      setLinkHandle('');
      await loadProblems();
    } catch (err) {
      setLinkError(friendlyMessage(err));
    } finally {
      setLinking(false);
    }
  }

  async function handleConfigChange(patch: Partial<Nibras75Config>) {
    if (!user) return;
    const next = { ...config, ...patch };
    setConfig(next);
    setConfigSaving(true);
    try {
      const data = await patchNibras75Config(patch);
      setConfig(data.config);
    } catch (err) {
      setError(friendlyMessage(err));
      void loadConfig();
    } finally {
      setConfigSaving(false);
    }
  }

  const remaining = useMemo(
    () => Math.max(0, curriculumTotal - completedInSet),
    [curriculumTotal, completedInSet]
  );

  const needsLink = Boolean(user && !activeHandle);

  return (
    <div className={styles.page}>
      <Nibras75Hero
        completedInSet={completedInSet}
        curriculumTotal={curriculumTotal}
        stats={stats}
        activeHandle={activeHandle}
        user={Boolean(user)}
        githubLinked={githubLinked}
        workspace={workspace}
        forking={forking}
        forkError={forkError}
        weeklyPace={config.weeklyPace}
        targetDate={config.targetDate}
        onConnectGitHub={() => void handleConnectGitHub()}
        onFork={() => void handleFork()}
      />

      <Nibras75StudyPlan
        config={config}
        remaining={remaining}
        saving={configSaving}
        user={Boolean(user)}
        onChange={(patch) => void handleConfigChange(patch)}
      />

      {user && !activeHandle && (
        <div className={styles.linkRow}>
          <span className={styles.mutedText}>
            Link LeetCode to track solved problems in this list:
          </span>
          <input
            className={styles.linkInput}
            placeholder="LeetCode username"
            value={linkHandle}
            onChange={(e) => setLinkHandle(e.target.value)}
          />
          <button
            type="button"
            className={styles.linkBtn}
            disabled={linking || !linkHandle.trim()}
            onClick={() => void handleLink()}
          >
            {linking ? 'Linking…' : 'Link'}
          </button>
          {linkError && <span className={styles.errorText}>{linkError}</span>}
        </div>
      )}

      {user && activeHandle && (
        <p className={styles.mutedText}>
          Tracking as <strong>{activeHandle}</strong> ·{' '}
          <Link href="/competitions">Manage accounts</Link>
        </p>
      )}

      {!user && (
        <p className={styles.mutedText}>
          <Link href="/connect">Sign in</Link> to mark problems solved and track your progress.
        </p>
      )}

      <Nibras75ProgressHeatmap stats={stats} />

      <Nibras75Analytics
        user={Boolean(user)}
        needsLink={needsLink}
        loading={analyticsLoading}
        error={analyticsError}
        analytics={analytics}
        activeHandle={activeHandle}
        onRetry={() => void loadAnalytics()}
      />

      <Nibras75Toolbar filters={filters} total={total} onChange={updateFilters} />

      {loading ? (
        <div className={styles.listSkeleton} />
      ) : error ? (
        <EmptyState
          title="Could not load Nibras 75"
          description={error}
          tone="error"
          action={{ label: 'Retry', onClick: () => void loadProblems() }}
        />
      ) : items.length === 0 ? (
        <EmptyState title="No matches" description="Try another search or filter." />
      ) : (
        <div className={styles.list}>
          {items.map((problem) => (
            <Nibras75ProblemCard
              key={problem.problemId}
              problem={problem}
              user={Boolean(user)}
              toggling={togglingSlug === problem.problemId}
              workspace={workspace}
              onToggleSolved={toggleSolved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
