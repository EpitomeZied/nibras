'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import EmptyState from '../../_components/widgets/EmptyState';
import {
  getPlatformIntegrations,
  getLinkedAccounts,
  type PlatformIntegration,
  type PlatformIntegrationCategory,
  type LinkedAccount,
} from '../../../lib/services/competitions';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import styles from './platforms.module.css';

const STATUS_LABEL: Record<PlatformIntegration['status'], string> = {
  live: 'Live',
  beta: 'Beta',
  coming_soon: 'Coming soon',
};

/* ── Platform icons (public/platforms/*.svg) + badge fallback ─────────────── */
const PLATFORM_ICON_SLUG: Record<string, string> = {
  project_euler: 'projecteuler',
};

function platformIconSrc(id: string): string {
  const slug = PLATFORM_ICON_SLUG[id] ?? id;
  return `/platforms/${slug}.svg`;
}

const PLATFORM_META: Record<string, { abbr: string; bg: string; fg: string }> = {
  codeforces: { abbr: 'CF', bg: '#1a90d9', fg: '#fff' },
  leetcode: { abbr: 'LC', bg: '#ffa116', fg: '#fff' },
  atcoder: { abbr: 'AC', bg: '#222', fg: '#fff' },
  kaggle: { abbr: 'Kg', bg: '#20beff', fg: '#fff' },
  hackerone: { abbr: 'H1', bg: '#25262b', fg: '#fff' },
  bugcrowd: { abbr: 'BC', bg: '#f26722', fg: '#fff' },
  github_achievements: { abbr: 'GH', bg: '#24292e', fg: '#fff' },
  project_euler: { abbr: 'PE', bg: '#5b5ea6', fg: '#fff' },
  aops: { abbr: 'AoPS', bg: '#204888', fg: '#fff' },
  brilliant: { abbr: 'Br', bg: '#ff6b35', fg: '#fff' },
  ctftime: { abbr: 'CTF', bg: '#3498db', fg: '#fff' },
  hackthebox: { abbr: 'HTB', bg: '#1a2332', fg: '#9fef00' },
  tryhackme: { abbr: 'THM', bg: '#212c42', fg: '#e34c3d' },
  picoctf: { abbr: 'pico', bg: '#005a8e', fg: '#fff' },
  defcon: { abbr: 'DC', bg: '#9b0000', fg: '#fff' },
};

/* ── Category meta ────────────────────────────────────────────────────────── */
const CATEGORY_META: Record<PlatformIntegrationCategory, { icon: string; accent: string }> = {
  competitive_programming: { icon: '⚡', accent: '#818cf8' },
  ai_ml: { icon: '🤖', accent: '#f472b6' },
  bug_bounty: { icon: '🐛', accent: '#fb923c' },
  open_source: { icon: '🌿', accent: '#34d399' },
  math_olympiad: { icon: '∑', accent: '#38bdf8' },
  ctf: { icon: '🚩', accent: '#f87171' },
};

function PlatformAvatar({ id, name }: { id: string; name: string }) {
  const [iconFailed, setIconFailed] = useState(false);
  const meta = PLATFORM_META[id];
  const abbr = meta?.abbr ?? name.slice(0, 2).toUpperCase();
  const bg = meta?.bg ?? 'var(--border)';
  const fg = meta?.fg ?? 'var(--text)';

  if (!iconFailed) {
    return (
      <span className={styles.avatarIconWrap} aria-hidden="true">
        <img
          src={platformIconSrc(id)}
          alt=""
          className={styles.avatarImg}
          width={40}
          height={40}
          onError={() => setIconFailed(true)}
        />
      </span>
    );
  }

  return (
    <span className={styles.avatar} style={{ background: bg, color: fg }} aria-hidden="true">
      {abbr}
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className={styles.skeletonWrap}>
      {[...Array(3)].map((_, si) => (
        <div key={si} className={styles.skeletonSection}>
          <div className={styles.skeletonSectionHead} />
          <div className={styles.grid}>
            {[...Array(3)].map((__, ci) => (
              <div key={ci} className={styles.skeletonCard}>
                <div className={styles.skeletonAvatar} />
                <div className={styles.skeletonLines}>
                  <div className={styles.skeletonLine} style={{ width: '60%' }} />
                  <div className={styles.skeletonLine} style={{ width: '90%' }} />
                  <div className={styles.skeletonLine} style={{ width: '75%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PlatformsPage() {
  const [integrations, setIntegrations] = useState<PlatformIntegration[]>([]);
  const [categories, setCategories] = useState<
    Record<PlatformIntegrationCategory, { label: string; description: string }>
  >({} as Record<PlatformIntegrationCategory, { label: string; description: string }>);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, accs] = await Promise.allSettled([
          getPlatformIntegrations(),
          getLinkedAccounts(),
        ]);
        if (data.status === 'fulfilled') {
          setIntegrations(data.value.integrations);
          setCategories(data.value.categories);
        } else {
          setError(friendlyMessage(data.reason));
        }
        if (accs.status === 'fulfilled') setAccounts(accs.value);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── Linked-account lookup ─────────────────────────────────────────────── */
  const linkedHosts = useMemo(
    () => new Set(accounts.filter((a) => a.verified).map((a) => a.host)),
    [accounts]
  );

  /* ── Search + group ────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!query.trim()) return integrations;
    const q = query.trim().toLowerCase();
    return integrations.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    );
  }, [integrations, query]);

  const grouped = useMemo(() => {
    const map = new Map<PlatformIntegrationCategory, PlatformIntegration[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  const noResults = !loading && !error && filtered.length === 0;

  return (
    <div className={styles.page}>
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div>
          <Link href="/competitions" className={styles.backLink}>
            ← Competitions
          </Link>
          <h1 className={styles.title}>Platform integrations</h1>
          <p className={styles.subtitle}>
            Competitive programming, AI/ML, bug bounty, open source, math olympiad, and CTF — in one
            competitions hub.
          </p>
        </div>

        {/* Connected chips */}
        {accounts.length > 0 && (
          <div className={styles.connectedRow}>
            {accounts
              .filter((a) => a.verified)
              .map((a) => (
                <span key={a.host} className={styles.connectedChip}>
                  <span
                    className={styles.connectedDot}
                    style={{ background: PLATFORM_META[a.host]?.bg ?? 'var(--primary)' }}
                  />
                  {a.host}
                  {a.handle ? <span className={styles.connectedHandle}>{a.handle}</span> : null}
                  {a.rating ? <span className={styles.connectedRating}>{a.rating}</span> : null}
                </span>
              ))}
          </div>
        )}
      </header>

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon} aria-hidden="true">
          ⌕
        </span>
        <input
          ref={searchRef}
          id="platform-search"
          type="search"
          className={styles.searchInput}
          placeholder="Search platforms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className={styles.searchClear}
            onClick={() => {
              setQuery('');
              searchRef.current?.focus();
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonGrid />
      ) : error ? (
        <EmptyState title="Could not load integrations" description={error} tone="error" />
      ) : noResults ? (
        <EmptyState
          title="No platforms found"
          description={`No results for "${query}". Try a different search term.`}
          tone="default"
        />
      ) : (
        <div className={styles.sections}>
          {Array.from(grouped.entries()).map(([category, items]) => {
            const meta = categories[category];
            const catMeta = CATEGORY_META[category];
            return (
              <section key={category} id={category} className={styles.section}>
                <div className={styles.sectionHeading}>
                  {catMeta && (
                    <span className={styles.categoryIcon} style={{ color: catMeta.accent }}>
                      {catMeta.icon}
                    </span>
                  )}
                  <div>
                    <h2 className={styles.sectionTitle}>{meta?.label ?? category}</h2>
                    {meta?.description && <p className={styles.sectionSub}>{meta.description}</p>}
                  </div>
                </div>

                <div className={styles.grid}>
                  {items.map((item) => {
                    const isConnected = item.linkHost ? linkedHosts.has(item.linkHost) : false;
                    const acc = item.linkHost
                      ? accounts.find((a) => a.host === item.linkHost)
                      : undefined;

                    return (
                      <article key={item.id} id={item.id} className={styles.card}>
                        <div className={styles.cardHead}>
                          <div className={styles.cardHeadLeft}>
                            <PlatformAvatar id={item.id} name={item.name} />
                            <div>
                              <h3 className={styles.cardTitle}>{item.name}</h3>
                              {isConnected && acc?.handle && (
                                <span className={styles.handleTag}>{acc.handle}</span>
                              )}
                            </div>
                          </div>
                          <div className={styles.badgeGroup}>
                            {isConnected && (
                              <span className={styles.connectedBadge}>Connected</span>
                            )}
                            <span className={`${styles.status} ${styles[`status_${item.status}`]}`}>
                              {STATUS_LABEL[item.status]}
                            </span>
                          </div>
                        </div>

                        <p className={styles.cardDesc}>{item.description}</p>

                        {/* Rating bar for connected accounts with rating */}
                        {isConnected && acc?.rating ? (
                          <div className={styles.ratingRow}>
                            <span className={styles.ratingLabel}>Rating</span>
                            <span
                              className={styles.ratingValue}
                              style={{ color: PLATFORM_META[item.id]?.bg ?? 'var(--primary)' }}
                            >
                              {acc.rating}
                            </span>
                            {acc.maxRating ? (
                              <span className={styles.ratingMax}>/ {acc.maxRating} peak</span>
                            ) : null}
                          </div>
                        ) : null}

                        <div className={styles.cardActions}>
                          {item.href ? (
                            <Link href={item.href} className={styles.primaryBtn}>
                              Open in Nibras
                            </Link>
                          ) : null}
                          {item.linkHost && !isConnected && item.status === 'live' ? (
                            <Link href="/competitions" className={styles.connectBtn}>
                              Connect
                            </Link>
                          ) : null}
                          <a
                            href={item.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.secondaryBtn}
                          >
                            Visit site ↗
                          </a>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
