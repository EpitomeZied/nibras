'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import cfStyles from '../codeforces.module.css';
import EmptyState from '../../../_components/widgets/EmptyState';
import dynamic from 'next/dynamic';

const CfAnalyticsDashboard = dynamic(() => import('./CfAnalyticsDashboard'), { ssr: false });
import {
  getLinkedAccounts,
  getPracticeCfAnalytics,
  getPracticeCfProblems,
  linkAccount,
  type CfAnalyticsPayload,
  type PracticeCfProblem,
} from '../../../../lib/services/competitions';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import { useSession } from '../../../_components/session-context';

const PAGE_SIZE = 100;

export default function CodeforcesPractice() {
  const { user } = useSession();
  const [items, setItems] = useState<PracticeCfProblem[]>([]);
  const [total, setTotal] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [tag, setTag] = useState('');
  const [solvedFilter, setSolvedFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkHandle, setLinkHandle] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CfAnalyticsPayload | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, tag, solvedFilter]);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const solved =
        solvedFilter === 'all' ? undefined : solvedFilter === 'solved' ? ('true' as const) : ('false' as const);
      const data = await getPracticeCfProblems({
        page,
        limit: PAGE_SIZE,
        q: debouncedQ || undefined,
        tag: tag.trim() || undefined,
        solved,
      });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setSolvedCount(data.solvedCount ?? 0);
      setActiveHandle(data.handle ?? null);
    } catch (err) {
      setError(friendlyMessage(err));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, tag, solvedFilter]);

  const loadAnalytics = useCallback(async () => {
    if (!activeHandle && !user) {
      setAnalytics(null);
      return;
    }
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const data = await getPracticeCfAnalytics(activeHandle ?? undefined);
      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(friendlyMessage(err));
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [activeHandle, user]);

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const linkedCf = user ? activeHandle : null;
  const needsLink = Boolean(user && !activeHandle);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleLink() {
    const handle = linkHandle.trim();
    if (!handle) return;
    setLinking(true);
    setLinkError(null);
    try {
      await linkAccount({ host: 'codeforces', handle });
      setLinkHandle('');
      await loadProblems();
    } catch (err) {
      setLinkError(friendlyMessage(err));
    } finally {
      setLinking(false);
    }
  }

  function rowClass(problem: PracticeCfProblem, index: number): string {
    if (problem.solved) {
      return index % 2 === 0 ? cfStyles.rowAccepted : cfStyles.rowAcceptedAlt;
    }
    if (problem.attempted) {
      return cfStyles.rowAttempted;
    }
    return '';
  }

  return (
    <div className={cfStyles.section}>
      {user && (
        <div className={cfStyles.accounts}>
          <span className={cfStyles.accountChip}>
            Codeforces: {linkedCf ?? 'not linked'}
          </span>
          <Link href="/competitions" className={cfStyles.linkBtn}>
            Manage on Competitions
          </Link>
        </div>
      )}

      {user && needsLink && (
        <div className={cfStyles.linkForm}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Link your Codeforces handle for solved highlighting and analytics:
          </span>
          <input
            className={cfStyles.linkInput}
            placeholder="Codeforces handle"
            value={linkHandle}
            onChange={(e) => setLinkHandle(e.target.value)}
          />
          <button
            type="button"
            className={cfStyles.linkBtn}
            disabled={linking || !linkHandle.trim()}
            onClick={() => void handleLink()}
          >
            {linking ? 'Linking…' : 'Link'}
          </button>
          {linkError && (
            <span style={{ fontSize: 12, color: 'var(--status-error-text, #dc2626)' }}>{linkError}</span>
          )}
        </div>
      )}

      {!user && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          <Link href="/connect">Sign in</Link> to highlight solved problems and view analytics.
        </p>
      )}

      <section className={cfStyles.analyticsSection} aria-label="Codeforces analytics">
        <h2 className={cfStyles.analyticsTitle}>Analytics</h2>
        {!user || needsLink ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Link a Codeforces account to load submission analytics.
          </p>
        ) : analyticsLoading ? (
          <div
            style={{
              height: 200,
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          />
        ) : analyticsError ? (
          <EmptyState
            title="Could not load analytics"
            description={analyticsError}
            tone="error"
            action={{ label: 'Retry', onClick: () => void loadAnalytics() }}
          />
        ) : analytics ? (
          <CfAnalyticsDashboard data={analytics} handle={activeHandle} />
        ) : null}
      </section>

      <div className={cfStyles.toolbar}>
        <input
          className={cfStyles.searchInput}
          placeholder="Search problems"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          className={cfStyles.searchInput}
          style={{ maxWidth: 140 }}
          placeholder="Tag filter"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        />
        <div className={cfStyles.filterPicker} role="tablist" aria-label="Solved filter">
          {(['all', 'solved', 'unsolved'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={solvedFilter === s}
              className={`${cfStyles.filterChip} ${solvedFilter === s ? cfStyles.filterChipActive : ''}`}
              onClick={() => setSolvedFilter(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        {total > 0 && (
          <span className={cfStyles.stats}>
            {total.toLocaleString()} matching · {solvedCount.toLocaleString()} solved overall
            {activeHandle ? ` · ${activeHandle}` : ''}
          </span>
        )}
      </div>

      {loading ? (
        <div
          style={{
            minHeight: 320,
            borderRadius: 12,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        />
      ) : error ? (
        <EmptyState
          title="Could not load problems"
          description={error}
          tone="error"
          action={{ label: 'Retry', onClick: () => void loadProblems() }}
        />
      ) : items.length === 0 ? (
        <EmptyState title="No problems" description="Try different filters." />
      ) : (
        <>
          <div className={cfStyles.tableWrap}>
            <table className={cfStyles.table}>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Problem</th>
                  <th>Rating</th>
                  <th>Tags</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((problem, index) => (
                  <tr key={problem.problemId} className={rowClass(problem, index)}>
                    <td className={cfStyles.mono}>
                      {problem.contestId ? `${problem.contestId}${problem.index}` : problem.index}
                    </td>
                    <td>
                      <a
                        className={cfStyles.problemLink}
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {problem.name}
                      </a>
                    </td>
                    <td className={cfStyles.mono}>{problem.rating ?? '—'}</td>
                    <td>
                      <div className={cfStyles.tagList}>
                        {(problem.tags ?? []).slice(0, 3).map((t) => (
                          <span key={t} className={cfStyles.tag}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>{problem.solved ? 'Solved' : problem.attempted ? 'Attempted' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={cfStyles.pagination}>
            <button
              type="button"
              className={cfStyles.linkBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className={cfStyles.linkBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
