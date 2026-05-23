'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import EmptyState from '../../_components/widgets/EmptyState';
import {
  getNibras75Problems,
  linkAccount,
  setNibras75ProblemSolved,
  type Nibras75Problem,
} from '../../../lib/services/competitions';
import CompanyIcons from './_components/CompanyIcons';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { useSession } from '../../_components/session-context';

function difficultyClass(d: string): string {
  if (d === 'Easy') return styles.difficultyEasy;
  if (d === 'Hard') return styles.difficultyHard;
  return styles.difficultyMedium;
}

export default function Nibras75Page() {
  const { user } = useSession();
  const [items, setItems] = useState<Nibras75Problem[]>([]);
  const [total, setTotal] = useState(75);
  const [completedInSet, setCompletedInSet] = useState(0);
  const [curriculumTotal, setCurriculumTotal] = useState(75);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [solvedFilter, setSolvedFilter] = useState<'all' | 'solved' | 'unsolved'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkHandle, setLinkHandle] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const solved =
        solvedFilter === 'all' ? undefined : solvedFilter === 'solved' ? ('true' as const) : ('false' as const);
      const data = await getNibras75Problems({
        q: debouncedQ || undefined,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        solved,
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
  }, [debouncedQ, difficulty, solvedFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const progressPct = useMemo(() => {
    if (curriculumTotal <= 0) return 0;
    return Math.round((completedInSet / curriculumTotal) * 100);
  }, [completedInSet, curriculumTotal]);

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
      await load();
    } catch (err) {
      setLinkError(friendlyMessage(err));
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className={styles.page}>
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
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
            <span style={{ color: 'var(--text-muted)' }}>Questions completed</span>
            <strong>
              {completedInSet} / {curriculumTotal}
            </strong>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </section>

      {user && !activeHandle && (
        <div className={styles.linkRow}>
          <span style={{ color: 'var(--text-muted)' }}>
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
          {linkError && <span style={{ color: 'var(--status-error-text, #dc2626)' }}>{linkError}</span>}
        </div>
      )}

      {user && activeHandle && (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
          Tracking as <strong>{activeHandle}</strong> ·{' '}
          <Link href="/competitions">Manage accounts</Link>
        </p>
      )}

      {!user && (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
          <Link href="/connect">Sign in</Link> to mark problems solved and track your progress.
        </p>
      )}

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search Nibras 75 (e.g. Two Sum, LRU Cache)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className={styles.filterPicker} role="tablist" aria-label="Difficulty">
          {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={difficulty === d}
              className={`${styles.filterChip} ${difficulty === d ? styles.filterChipActive : ''}`}
              onClick={() => setDifficulty(d)}
            >
              {d === 'all' ? 'All' : d[0].toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.filterPicker} role="tablist" aria-label="Progress">
          {(['all', 'solved', 'unsolved'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={solvedFilter === s}
              className={`${styles.filterChip} ${solvedFilter === s ? styles.filterChipActive : ''}`}
              onClick={() => setSolvedFilter(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Showing {total} question{total === 1 ? '' : 's'}
        </span>
      </div>

      {loading ? (
        <div style={{ height: 320, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--border)' }} />
      ) : error ? (
        <EmptyState
          title="Could not load Nibras 75"
          description={error}
          tone="error"
          action={{ label: 'Retry', onClick: () => void load() }}
        />
      ) : items.length === 0 ? (
        <EmptyState title="No matches" description="Try another search or filter." />
      ) : (
        <div className={styles.list}>
          {items.map((problem) => (
            <article
              key={problem.problemId}
              className={`${styles.card} ${problem.solved ? styles.cardSolved : ''}`}
            >
              {user ? (
                <button
                  type="button"
                  className={`${styles.solvedToggle} ${problem.solved ? styles.solvedToggleOn : ''}`}
                  aria-pressed={problem.solved}
                  aria-label={problem.solved ? 'Mark as not solved' : 'Mark as solved'}
                  disabled={togglingSlug === problem.problemId}
                  onClick={() => void toggleSolved(problem)}
                >
                  {togglingSlug === problem.problemId ? '…' : problem.solved ? '✓' : ''}
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
                  <span className={`${styles.difficulty} ${difficultyClass(problem.difficulty)}`}>
                    {problem.difficulty}
                  </span>
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
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
