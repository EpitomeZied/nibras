'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';
import EmptyState from '../_components/widgets/EmptyState';
import ContestCalendar from './_components/ContestCalendar';
import CalendarViewToggle, { type CalendarView } from './_components/CalendarViewToggle';
import PlatformFilter from './_components/PlatformFilter';
import {
  getCalendarContests,
  getLinkedAccounts,
  linkAccount,
  listContests,
  setContestBookmark,
  setContestReminder,
  unlinkAccount,
  type Contest,
  type LinkedAccount,
} from '../../lib/services/competitions';
import { friendlyMessage } from '../../lib/api-clients/errors';

function formatRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const sameDay = s.toDateString() === e.toDateString();
    const dateFmt: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const timeFmt: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
    if (sameDay) {
      return `${s.toLocaleDateString(undefined, dateFmt)} · ${s.toLocaleTimeString(undefined, timeFmt)} – ${e.toLocaleTimeString(undefined, timeFmt)}`;
    }
    return `${s.toLocaleDateString(undefined, dateFmt)} → ${e.toLocaleDateString(undefined, dateFmt)}`;
  } catch {
    return start;
  }
}

type DisplayMode = 'calendar' | 'list';

export default function CompetitionsPage() {
  const now = new Date();
  const [displayMode, setDisplayMode] = useState<DisplayMode>('calendar');
  const [calView, setCalView] = useState<CalendarView>('month');
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1);
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calContests, setCalContests] = useState<Record<string, Contest[]>>({});
  const [platformFilter, setPlatformFilter] = useState('all');

  const [contests, setContests] = useState<Contest[]>([]);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkModal, setLinkModal] = useState(false);
  const [linkHost, setLinkHost] = useState<string>('codeforces');
  const [linkHandle, setLinkHandle] = useState('');
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const loadCalendar = useCallback(async () => {
    try {
      const data = await getCalendarContests(calMonth, calYear);
      setCalContests(data.days);
    } catch {
      // Calendar data load is non-critical
    }
  }, [calMonth, calYear]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, a] = await Promise.allSettled([
        listContests({
          upcoming: true,
          host: platformFilter === 'all' ? undefined : platformFilter,
        }),
        getLinkedAccounts(),
      ]);
      setContests(c.status === 'fulfilled' ? c.value : []);
      setAccounts(a.status === 'fulfilled' ? a.value : []);
      if (c.status === 'rejected') setError(friendlyMessage(c.reason));
    } finally {
      setLoading(false);
    }
  }, [platformFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  const filteredCalContests =
    platformFilter === 'all'
      ? calContests
      : Object.fromEntries(
          Object.entries(calContests).map(([key, cs]) => [
            key,
            cs.filter((c) => c.host === platformFilter),
          ])
        );

  function handlePrev() {
    if (calMonth === 1) {
      setCalMonth(12);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
  }

  function handleNext() {
    if (calMonth === 12) {
      setCalMonth(1);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
  }

  function handleToday() {
    const t = new Date();
    setCalMonth(t.getMonth() + 1);
    setCalYear(t.getFullYear());
  }

  async function toggleReminder(contest: Contest) {
    const next = !contest.reminderSet;
    setContests((prev) => prev.map((c) => (c.id === contest.id ? { ...c, reminderSet: next } : c)));
    try {
      const result = await setContestReminder(contest.id, next);
      setContests((prev) =>
        prev.map((c) => (c.id === contest.id ? { ...c, reminderSet: result.reminderSet } : c))
      );
    } catch {
      setContests((prev) =>
        prev.map((c) => (c.id === contest.id ? { ...c, reminderSet: !next } : c))
      );
    }
  }

  async function toggleBookmark(contest: Contest) {
    const next = !contest.bookmarked;
    setContests((prev) => prev.map((c) => (c.id === contest.id ? { ...c, bookmarked: next } : c)));
    try {
      const result = await setContestBookmark(contest.id, next);
      setContests((prev) =>
        prev.map((c) => (c.id === contest.id ? { ...c, bookmarked: result.bookmarked } : c))
      );
    } catch {
      setContests((prev) =>
        prev.map((c) => (c.id === contest.id ? { ...c, bookmarked: !next } : c))
      );
    }
  }

  async function handleUnlink(host: string) {
    await unlinkAccount(host);
    setAccounts((prev) => prev.filter((a) => a.host !== host));
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Competitions</h1>
          <p className={styles.subtitle}>
            Upcoming contests, calendar view, and quick access to your competitive history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 3,
            }}
          >
            <button
              type="button"
              className={`${styles.iconBtn} ${displayMode === 'calendar' ? styles.iconBtnActive : ''}`}
              onClick={() => setDisplayMode('calendar')}
            >
              Calendar
            </button>
            <button
              type="button"
              className={`${styles.iconBtn} ${displayMode === 'list' ? styles.iconBtnActive : ''}`}
              onClick={() => setDisplayMode('list')}
            >
              List
            </button>
          </div>
          <button type="button" className={styles.linkBtn} onClick={() => setLinkModal(true)}>
            Link account
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <PlatformFilter selected={platformFilter} onChange={setPlatformFilter} />
        {displayMode === 'calendar' && <CalendarViewToggle view={calView} onChange={setCalView} />}
      </div>

      {accounts.length > 0 && (
        <div className={styles.linkedAccountsRow}>
          {accounts.map((acc) => (
            <span key={`${acc.host}-${acc.handle}`} className={styles.linkedChip}>
              {acc.host}: <span className={styles.linkedChipHandle}>{acc.handle}</span>
              {acc.verified && acc.rating ? (
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{acc.rating}</span>
              ) : null}
              {!acc.verified && (
                <span style={{ fontSize: 10, color: 'var(--warning, #f59e0b)' }}>
                  {acc.verificationStatus === 'failed' ? 'failed' : 'verifying...'}
                </span>
              )}
              <button
                type="button"
                className={styles.unlinkBtn}
                onClick={() => void handleUnlink(acc.host)}
                aria-label={`Unlink ${acc.host}`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {linkModal && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Link account"
        >
          <form
            className={styles.modal}
            onSubmit={async (event) => {
              event.preventDefault();
              if (!linkHandle.trim()) return;
              setLinkSubmitting(true);
              setLinkError(null);
              try {
                const created = await linkAccount({ host: linkHost, handle: linkHandle.trim() });
                setAccounts((prev) => [...prev.filter((a) => a.host !== created.host), created]);
                setLinkHandle('');
                setLinkModal(false);
              } catch (err) {
                setLinkError(friendlyMessage(err));
              } finally {
                setLinkSubmitting(false);
              }
            }}
          >
            <h2 className={styles.modalTitle}>Link a competitive account</h2>
            <p className={styles.modalHint}>
              We&apos;ll fetch contest history, problems, and ratings for the linked account.
              Verification may take a moment.
            </p>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="link-host">
                Platform
              </label>
              <select
                id="link-host"
                className={styles.formSelect}
                value={linkHost}
                onChange={(event) => setLinkHost(event.target.value)}
              >
                <option value="codeforces">Codeforces</option>
                <option value="leetcode">LeetCode</option>
                <option value="atcoder">AtCoder</option>
                <option value="codechef">CodeChef</option>
                <option value="vjudge">VJudge</option>
              </select>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="link-handle">
                Handle
              </label>
              <input
                id="link-handle"
                className={styles.formInput}
                value={linkHandle}
                onChange={(event) => setLinkHandle(event.target.value)}
                placeholder="e.g. tourist"
                autoFocus
              />
            </div>
            {linkError && (
              <p style={{ color: 'var(--danger, #ef4444)', fontSize: 12, margin: 0 }}>
                {linkError}
              </p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setLinkModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={linkSubmitting || !linkHandle.trim()}
              >
                {linkSubmitting ? 'Linking...' : 'Link'}
              </button>
            </div>
          </form>
        </div>
      )}

      {displayMode === 'calendar' ? (
        <ContestCalendar
          view={calView}
          year={calYear}
          month={calMonth}
          contests={filteredCalContests}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />
      ) : loading ? (
        <div
          style={{
            height: 280,
            borderRadius: 14,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        />
      ) : error || contests.length === 0 ? (
        <EmptyState
          title={error ? 'Could not load contests' : 'No upcoming contests'}
          description={error ?? 'Linked accounts will surface upcoming rounds here.'}
          tone={error ? 'error' : 'default'}
          action={error ? { label: 'Retry', onClick: () => void load() } : undefined}
        />
      ) : (
        <div className={styles.list}>
          {contests.map((contest) => (
            <article key={contest.id} className={styles.contestRow}>
              <div>
                <div className={styles.contestHead}>
                  <span className={styles.hostTag}>{contest.host}</span>
                  <h2 className={styles.contestTitle}>{contest.name}</h2>
                </div>
                <p className={styles.contestMeta}>
                  {formatRange(contest.startsAt, contest.endsAt)} · {contest.durationMinutes} min
                </p>
              </div>
              <div className={styles.contestActions}>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${contest.reminderSet ? styles.iconBtnActive : ''}`}
                  onClick={() => void toggleReminder(contest)}
                  aria-pressed={contest.reminderSet}
                >
                  {contest.reminderSet ? 'Reminder on' : 'Remind me'}
                </button>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${contest.bookmarked ? styles.iconBtnActive : ''}`}
                  onClick={() => void toggleBookmark(contest)}
                  aria-pressed={contest.bookmarked}
                >
                  {contest.bookmarked ? 'Saved' : 'Save'}
                </button>
                {contest.url && (
                  <a
                    className={styles.iconBtn}
                    href={contest.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
