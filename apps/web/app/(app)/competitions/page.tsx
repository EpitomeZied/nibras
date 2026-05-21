'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  verifyAccount,
  type Contest,
  type LinkedAccount,
  type VerificationProblem,
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

const CE_CODE = 'I just want to submit a compilation error';
const VERIFY_TIMEOUT_SEC = 120;

const PLATFORM_LABELS: Record<string, string> = {
  codeforces: 'Codeforces',
  leetcode: 'LeetCode',
  atcoder: 'AtCoder',
  codechef: 'CodeChef',
  vjudge: 'VJudge',
};

type LinkStep = 'select' | 'cf-verify' | 'simple-verify' | 'success' | 'failed';
type DisplayMode = 'calendar' | 'list';

function useTimer(initialSeconds: number, active: boolean) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!active) {
      setRemaining(initialSeconds);
      return;
    }
    setRemaining(initialSeconds);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, initialSeconds]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const display = `${mins}:${String(secs).padStart(2, '0')}`;

  return { remaining, display };
}

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
  const [linkStep, setLinkStep] = useState<LinkStep>('select');
  const [linkHost, setLinkHost] = useState<string>('codeforces');
  const [linkHandle, setLinkHandle] = useState('');
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{
    rating?: number;
    maxRating?: number;
  } | null>(null);
  const [verifyProblem, setVerifyProblem] = useState<VerificationProblem | null>(null);
  const [copied, setCopied] = useState(false);

  const timerActive = linkStep === 'cf-verify';
  const { remaining: timerRemaining, display: timerDisplay } = useTimer(
    VERIFY_TIMEOUT_SEC,
    timerActive
  );

  function openLinkModal() {
    setLinkStep('select');
    setLinkHost('codeforces');
    setLinkHandle('');
    setLinkError(null);
    setLinkSubmitting(false);
    setVerifyResult(null);
    setVerifyProblem(null);
    setCopied(false);
    setLinkModal(true);
  }

  function closeLinkModal() {
    setLinkModal(false);
  }

  async function handleStartLink() {
    if (!linkHandle.trim()) return;
    setLinkSubmitting(true);
    setLinkError(null);
    try {
      const created = await linkAccount({ host: linkHost, handle: linkHandle.trim() });
      setAccounts((prev) => [...prev.filter((a) => a.host !== created.host), created]);

      if (linkHost === 'codeforces') {
        if (created.verificationProblem) setVerifyProblem(created.verificationProblem);
        setLinkStep('cf-verify');
      } else {
        setLinkStep('simple-verify');
        const result = await verifyAccount(linkHost);
        if (result.verified) {
          setVerifyResult({ rating: result.rating, maxRating: result.maxRating });
          setAccounts((prev) =>
            prev.map((a) =>
              a.host === linkHost
                ? {
                    ...a,
                    verified: true,
                    verificationStatus: 'verified',
                    rating: result.rating,
                    maxRating: result.maxRating,
                  }
                : a
            )
          );
          setLinkStep('success');
        } else {
          setLinkStep('failed');
        }
      }
    } catch (err) {
      setLinkError(friendlyMessage(err));
    } finally {
      setLinkSubmitting(false);
    }
  }

  async function handleVerifyNow() {
    setLinkSubmitting(true);
    setLinkError(null);
    try {
      const result = await verifyAccount(linkHost);
      if (result.verified) {
        setVerifyResult({ rating: result.rating, maxRating: result.maxRating });
        setAccounts((prev) =>
          prev.map((a) =>
            a.host === linkHost
              ? {
                  ...a,
                  verified: true,
                  verificationStatus: 'verified',
                  rating: result.rating,
                  maxRating: result.maxRating,
                }
              : a
          )
        );
        setLinkStep('success');
      } else {
        const pLabel = verifyProblem
          ? `Problem ${verifyProblem.contestId}${verifyProblem.index}`
          : 'the assigned problem';
        setLinkError(
          `No recent compilation error found on ${pLabel}. Make sure you submitted and try again.`
        );
      }
    } catch (err) {
      setLinkError(friendlyMessage(err));
    } finally {
      setLinkSubmitting(false);
    }
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(CE_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard API may fail in non-secure contexts */
    }
  }

  const loadCalendar = useCallback(async () => {
    try {
      const data = await getCalendarContests(calMonth, calYear);
      const localDays: Record<string, Contest[]> = {};
      for (const dayContests of Object.values(data.days)) {
        for (const c of dayContests) {
          const d = new Date(c.startsAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!localDays[key]) localDays[key] = [];
          localDays[key].push(c);
        }
      }
      setCalContests(localDays);
    } catch {
      /* non-critical */
    }
  }, [calMonth, calYear]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, a] = await Promise.allSettled([
        listContests({
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
          <button type="button" className={styles.linkBtn} onClick={openLinkModal}>
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

      {/* ── Link Account Modal ──────────────────────────────────────────── */}
      {linkModal && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Link account"
        >
          <div className={styles.modal}>
            {/* ── Step: Platform Select ── */}
            {linkStep === 'select' && (
              <>
                <div className={styles.modalHeader}>
                  <span className={styles.modalIcon}>&#128279;</span>
                  <h2 className={styles.modalTitle}>Connect {PLATFORM_LABELS[linkHost]}</h2>
                  <p className={styles.modalHint}>Link your account to unlock features</p>
                </div>

                <div className={styles.featureList}>
                  <div className={styles.featureItem}>
                    <span className={styles.featureCheck}>&#10003;</span>
                    <span>Auto-sync your {PLATFORM_LABELS[linkHost]} submissions</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureCheck}>&#10003;</span>
                    <span>Verified badge + real-time progress tracking</span>
                  </div>
                  <div className={styles.featureItem}>
                    <span className={styles.featureCheck}>&#10003;</span>
                    <span>
                      Get 2x Aura per rating{' '}
                      <span className={styles.featureHighlight}>
                        (e.g. 1800 rating = 3600 Aura!)
                      </span>
                    </span>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.formRow}>
                  <label className={styles.formLabel} htmlFor="link-host">
                    Platform
                  </label>
                  <select
                    id="link-host"
                    className={styles.formSelect}
                    value={linkHost}
                    onChange={(e) => setLinkHost(e.target.value)}
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
                    {PLATFORM_LABELS[linkHost]} Handle
                  </label>
                  <input
                    id="link-handle"
                    className={styles.formInput}
                    value={linkHandle}
                    onChange={(e) => setLinkHandle(e.target.value)}
                    placeholder="e.g. tourist"
                    autoFocus
                  />
                </div>

                {linkError && <p className={styles.errorText}>{linkError}</p>}

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={closeLinkModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.submitBtn}
                    disabled={linkSubmitting || !linkHandle.trim()}
                    onClick={() => void handleStartLink()}
                  >
                    {linkSubmitting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </>
            )}

            {/* ── Step: Codeforces Verification ── */}
            {linkStep === 'cf-verify' && (
              <>
                <div className={styles.modalHeader}>
                  <span className={styles.modalIcon}>&#128279;</span>
                  <h2 className={styles.modalTitle}>Verify {linkHandle}</h2>
                </div>

                <div className={styles.timerRow}>
                  <span className={styles.timerLabel}>Time remaining:</span>
                  <span
                    className={`${styles.timerValue} ${timerRemaining <= 30 ? styles.timerLow : ''}`}
                  >
                    {timerDisplay}
                  </span>
                </div>

                <div className={styles.verifySteps}>
                  <div className={styles.verifyStep}>
                    <span className={styles.stepNumber}>1</span>
                    <div className={styles.stepContent}>
                      <h3 className={styles.stepTitle}>Submit a compilation error</h3>
                      <p className={styles.stepDesc}>
                        Copy the code below or any other code that gives a compilation error and
                        submit it to{' '}
                        <a
                          href={
                            verifyProblem?.url ?? 'https://codeforces.com/problemset/problem/4/A'
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.stepLink}
                        >
                          Problem{' '}
                          {verifyProblem
                            ? `${verifyProblem.contestId}${verifyProblem.index}`
                            : '4A'}{' '}
                          — {verifyProblem?.name ?? 'Watermelon'}
                        </a>{' '}
                        on Codeforces. Make sure you&apos;re logged in as{' '}
                        <strong>{linkHandle}</strong>. Click the problem link, go to Submit tab,
                        paste the provided code into the editor, and click the Submit button.
                      </p>
                      <div className={styles.codeBlock}>
                        <code className={styles.codeText}>{CE_CODE}</code>
                        <button
                          type="button"
                          className={styles.copyBtn}
                          onClick={() => void handleCopyCode()}
                        >
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.verifyStep}>
                    <span className={styles.stepNumber}>2</span>
                    <div className={styles.stepContent}>
                      <h3 className={styles.stepTitle}>Complete the verification</h3>
                      <p className={styles.stepDesc}>
                        After submitting, Codeforces will show the submission status. Wait for the
                        verdict to show <strong>Compilation Error</strong> (this is expected!). Once
                        you see it, come back here and click the <strong>Verify Now</strong> button
                        below.
                      </p>
                    </div>
                  </div>
                </div>

                {linkError && <p className={styles.errorText}>{linkError}</p>}

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={closeLinkModal}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.verifyBtn}
                    disabled={linkSubmitting || timerRemaining === 0}
                    onClick={() => void handleVerifyNow()}
                  >
                    {linkSubmitting ? 'Verifying...' : 'Verify Now'}
                  </button>
                </div>

                {timerRemaining === 0 && (
                  <p className={styles.timerExpired}>
                    Time expired.{' '}
                    <button
                      type="button"
                      className={styles.retryLink}
                      onClick={() => {
                        setLinkError(null);
                        setLinkStep('select');
                      }}
                    >
                      Start over
                    </button>
                  </p>
                )}
              </>
            )}

            {/* ── Step: Simple (non-CF) Verification ── */}
            {linkStep === 'simple-verify' && (
              <div className={styles.verifyingState}>
                <div className={styles.spinner} />
                <p className={styles.verifyingText}>
                  Verifying {linkHandle} on {PLATFORM_LABELS[linkHost]}...
                </p>
              </div>
            )}

            {/* ── Step: Success ── */}
            {linkStep === 'success' && (
              <>
                <div className={styles.resultState}>
                  <span className={styles.resultIconSuccess}>&#10003;</span>
                  <h2 className={styles.modalTitle}>Account Verified!</h2>
                  <p className={styles.modalHint}>
                    <strong>{linkHandle}</strong> on {PLATFORM_LABELS[linkHost]} is now linked.
                  </p>
                  {verifyResult?.rating ? (
                    <div className={styles.ratingDisplay}>
                      <span className={styles.ratingLabel}>Rating</span>
                      <span className={styles.ratingValue}>{verifyResult.rating}</span>
                      {verifyResult.maxRating ? (
                        <span className={styles.ratingMax}>(max {verifyResult.maxRating})</span>
                      ) : null}
                    </div>
                  ) : null}
                  <p className={styles.featureHighlight}>
                    +{((verifyResult?.rating ?? 0) * 2).toLocaleString()} Aura earned!
                  </p>
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.submitBtn} onClick={closeLinkModal}>
                    Done
                  </button>
                </div>
              </>
            )}

            {/* ── Step: Failed ── */}
            {linkStep === 'failed' && (
              <>
                <div className={styles.resultState}>
                  <span className={styles.resultIconFail}>&#10007;</span>
                  <h2 className={styles.modalTitle}>Verification Failed</h2>
                  <p className={styles.modalHint}>
                    Could not verify <strong>{linkHandle}</strong> on {PLATFORM_LABELS[linkHost]}.
                    The handle may not exist or the platform API is temporarily unavailable.
                  </p>
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={closeLinkModal}>
                    Close
                  </button>
                  <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={() => {
                      setLinkError(null);
                      setLinkStep('select');
                    }}
                  >
                    Try Again
                  </button>
                </div>
              </>
            )}
          </div>
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
          title={error ? 'Could not load contests' : 'No contests found'}
          description={error ?? 'Contests will appear here once the sync worker runs.'}
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
