'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';
import EmptyState from '../../_components/widgets/EmptyState';
import {
  getCodehuntProblems,
  getLinkedAccounts,
  linkAccount,
  type CodehuntProblem,
  type LinkedAccount,
} from '../../../lib/services/competitions';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { useSession } from '../../_components/session-context';

type Site = 'uhunt' | 'codeforces';

const SITE_LABELS: Record<Site, string> = {
  uhunt: 'uHunt (UVa)',
  codeforces: 'Codeforces',
};

export default function CodehuntPage() {
  const { user } = useSession();
  const [site, setSite] = useState<Site>('uhunt');
  const [items, setItems] = useState<CodehuntProblem[]>([]);
  const [total, setTotal] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkHandle, setLinkHandle] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      return;
    }
    try {
      setAccounts(await getLinkedAccounts());
    } catch {
      setAccounts([]);
    }
  }, [user]);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCodehuntProblems(site);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setSolvedCount(data.solvedCount ?? 0);
      setActiveHandle(data.handle ?? null);
    } catch (err) {
      setError(friendlyMessage(err));
      setItems([]);
      setTotal(0);
      setSolvedCount(0);
    } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    void loadProblems();
  }, [loadProblems]);

  const linkedUhunt = accounts.find((a) => a.host === 'uhunt');
  const linkedCf = accounts.find((a) => a.host === 'codeforces');
  const needsLink = user && !activeHandle;

  async function handleLink(platform: Site) {
    const handle = linkHandle.trim();
    if (!handle) return;
    setLinking(true);
    setLinkError(null);
    try {
      await linkAccount({ host: platform, handle });
      setLinkHandle('');
      await loadAccounts();
      await loadProblems();
    } catch (err) {
      setLinkError(friendlyMessage(err));
    } finally {
      setLinking(false);
    }
  }

  function rowClass(problem: CodehuntProblem, index: number): string {
    if (problem.solved) {
      return index % 2 === 0 ? styles.rowAccepted : styles.rowAcceptedAlt;
    }
    if (problem.attempted) {
      return index % 2 === 0 ? styles.rowAttempted : styles.rowAttemptedAlt;
    }
    return '';
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Codehunt</h1>
        <p className={styles.subtitle}>
          Track the last 1000 problems on uHunt (UVa) and recent Codeforces contests. Solved rows
          are highlighted in green, like{' '}
          <a href="https://codehunt.cc/" target="_blank" rel="noopener noreferrer">
            codehunt.cc
          </a>
          .
        </p>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.sitePicker} role="tablist" aria-label="Codehunt site">
          {(['uhunt', 'codeforces'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={site === s}
              className={`${styles.siteChip} ${site === s ? styles.siteChipActive : ''}`}
              onClick={() => setSite(s)}
            >
              {SITE_LABELS[s]}
            </button>
          ))}
        </div>
        {total > 0 && (
          <span className={styles.stats}>
            {total.toLocaleString()} problems · {solvedCount.toLocaleString()} solved
            {activeHandle ? ` · ${activeHandle}` : ''}
          </span>
        )}
      </div>

      {user && (
        <div className={styles.accounts}>
          <span className={styles.accountChip}>
            uHunt: {linkedUhunt?.handle ?? 'not linked'}
            {linkedUhunt?.verified ? ' ✓' : ''}
          </span>
          <span className={styles.accountChip}>
            Codeforces: {linkedCf?.handle ?? 'not linked'}
            {linkedCf?.verified ? ' ✓' : ''}
          </span>
          <Link href="/competitions" className={styles.linkBtn}>
            Manage on Competitions
          </Link>
        </div>
      )}

      {user && needsLink && (
        <div className={styles.linkForm}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Link your {SITE_LABELS[site]} handle to see solved problems in green:
          </span>
          <input
            className={styles.linkInput}
            placeholder={site === 'uhunt' ? 'UVa username' : 'Codeforces handle'}
            value={linkHandle}
            onChange={(e) => setLinkHandle(e.target.value)}
          />
          <button
            type="button"
            className={styles.linkBtn}
            disabled={linking || !linkHandle.trim()}
            onClick={() => void handleLink(site)}
          >
            {linking ? 'Linking…' : 'Link'}
          </button>
          {linkError && (
            <span style={{ fontSize: 12, color: 'var(--status-error-text, #dc2626)' }}>
              {linkError}
            </span>
          )}
        </div>
      )}

      {!user && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          <Link href="/connect">Sign in</Link> to highlight your solved problems.
        </p>
      )}

      {loading ? (
        <div
          style={{
            flex: 1,
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
        <EmptyState title="No problems" description="Try again in a moment." />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>No.</th>
                <th>Problem</th>
                {site === 'uhunt' ? (
                  <>
                    <th>Accept %</th>
                    <th>Solved by</th>
                  </>
                ) : (
                  <>
                    <th>Rating</th>
                    <th>Tags</th>
                  </>
                )}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((problem, index) => (
                <tr key={problem.problemId} className={rowClass(problem, index)}>
                  <td className={styles.mono}>
                    {site === 'codeforces' && problem.contestId
                      ? `${problem.contestId}${problem.index}`
                      : problem.index}
                  </td>
                  <td>
                    <a
                      className={styles.problemLink}
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {problem.name}
                    </a>
                  </td>
                  {site === 'uhunt' ? (
                    <>
                      <td className={styles.mono}>{problem.percentageAccepted ?? '—'}%</td>
                      <td className={styles.mono}>{problem.solvedCount ?? '—'}</td>
                    </>
                  ) : (
                    <>
                      <td className={styles.mono}>{problem.rating ?? '—'}</td>
                      <td>
                        <div className={styles.tagList}>
                          {(problem.tags ?? []).slice(0, 3).map((tag) => (
                            <span key={tag} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </>
                  )}
                  <td>{problem.solved ? 'Solved' : problem.attempted ? 'Attempted' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
