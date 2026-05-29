'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';
import CommunityAuthorLink from './_components/community-author-link';
import EmptyState from '../_components/widgets/EmptyState';
import Skeleton from '../_components/widgets/Skeleton';
import VoteButton from '../_components/widgets/VoteButton';
import MarkdownToolbar from '../_components/widgets/MarkdownToolbar';
import {
  createQuestion,
  listQuestions,
  listTags,
  voteQuestion,
  type CommunityQuestion,
  type CommunityTag,
  type QuestionFilters,
} from '../../lib/services/community';
import { friendlyMessage } from '../../lib/api-clients/errors';
import { useSession } from '../_components/session-context';
import { useDebounce } from '../../lib/hooks/use-debounce';
import { useBookmarks } from '../../lib/hooks/use-bookmarks';
import { stripMarkdown } from '../../lib/strip-markdown';

const SORTS: Array<{ value: NonNullable<QuestionFilters['sort']>; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'top', label: 'Top' },
  { value: 'active', label: 'Active' },
  { value: 'unanswered', label: 'Unanswered' },
];

function formatRelative(iso: string): string {
  try {
    const date = new Date(iso);
    const diffMs = date.getTime() - Date.now();
    const diffMin = Math.round(diffMs / 60000);
    const diffHr = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHr / 24);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHr) < 48) return rtf.format(diffHr, 'hour');
    return rtf.format(diffDay, 'day');
  } catch {
    return iso;
  }
}

export default function CommunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSession();
  const { isBookmarked } = useBookmarks();
  const [questions, setQuestions] = useState<CommunityQuestion[]>([]);
  const [tags, setTags] = useState<CommunityTag[]>([]);
  const [sort, setSort] = useState<NonNullable<QuestionFilters['sort']>>('newest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [mine, setMine] = useState(false);
  const [saved, setSaved] = useState(false);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debouncedQ = useDebounce(q, 300);

  const [askOpen, setAskOpen] = useState(false);
  const [askTitle, setAskTitle] = useState('');
  const [askBody, setAskBody] = useState('');
  const [askTags, setAskTags] = useState('');
  const [askSubmitting, setAskSubmitting] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const debouncedAskTitle = useDebounce(askTitle, 400);
  const [suggestions, setSuggestions] = useState<CommunityQuestion[]>([]);
  const askBodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!askOpen || debouncedAskTitle.trim().length < 5) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    void listQuestions({ q: debouncedAskTitle.trim(), limit: 5 }).then((res) => {
      if (!cancelled) setSuggestions(res.items);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedAskTitle, askOpen]);

  async function handleAskSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = askTitle.trim();
    const body = askBody.trim();
    if (!title || !body) return;
    setAskSubmitting(true);
    setAskError(null);
    try {
      const parsedTags = askTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const created = await createQuestion({
        title,
        body,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });
      setAskOpen(false);
      setAskTitle('');
      setAskBody('');
      setAskTags('');
      router.push(`/community/q/${created.id}`);
    } catch (err) {
      setAskError(friendlyMessage(err));
    } finally {
      setAskSubmitting(false);
    }
  }

  const filters = useMemo<QuestionFilters>(
    () => ({
      sort,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      q: debouncedQ,
      page,
      limit: 30,
      authorId: mine && user ? user.id : undefined,
    }),
    [sort, selectedTags, debouncedQ, page, mine, user]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [qResult, tagResult] = await Promise.allSettled([listQuestions(filters), listTags()]);
      if (qResult.status === 'fulfilled') {
        setQuestions(qResult.value.items ?? []);
        const total = qResult.value.total ?? 0;
        const limit = qResult.value.limit ?? 30;
        setTotalPages(Math.max(1, Math.ceil(total / limit)));
      } else {
        setQuestions([]);
        setError(friendlyMessage(qResult.reason));
      }
      setTags(tagResult.status === 'fulfilled' ? tagResult.value : []);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const fromUrl = searchParams.get('tags');
    if (fromUrl) {
      setSelectedTags(
        fromUrl
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      );
    }
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [sort, selectedTags, debouncedQ, mine]);

  useEffect(() => {
    if (!askOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAskOpen(false);
        setAskError(null);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [askOpen]);

  function toggleTag(name: string) {
    setSelectedTags((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]
    );
  }

  const displayedQuestions = saved
    ? questions.filter((qItem) => isBookmarked(qItem.id))
    : questions;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Community</h1>
          <p className={styles.subtitle}>Ask, answer, and learn from your classmates.</p>
        </div>
        {user ? (
          <button type="button" className={styles.askBtn} onClick={() => setAskOpen(true)}>
            Ask a question
          </button>
        ) : (
          <Link href="/connect" className={styles.askBtn}>
            Sign in to ask
          </Link>
        )}
      </header>

      {askOpen && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Ask a question"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setAskOpen(false);
              setAskError(null);
            }
          }}
        >
          <form className={styles.modal} onSubmit={handleAskSubmit}>
            <h2 className={styles.modalTitle}>Ask a question</h2>
            <p className={styles.modalHint}>
              Keep the title focused and the body specific. Add up to 5 comma-separated tags.
            </p>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="ask-title">
                Title
              </label>
              <input
                id="ask-title"
                className={styles.formInput}
                value={askTitle}
                onChange={(e) => setAskTitle(e.target.value)}
                placeholder="What's the gist of your question?"
                maxLength={160}
                autoFocus
                required
              />
              {suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  <span className={styles.suggestionsLabel}>Similar questions already asked:</span>
                  {suggestions.map((s) => (
                    <a
                      key={s.id}
                      href={`/community/q/${s.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.suggestionItem}
                    >
                      {s.title}
                      <span className={styles.suggestionMeta}>
                        {s.answerCount} answers · {s.score} votes
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="ask-body">
                Details
              </label>
              <MarkdownToolbar textareaRef={askBodyRef} onChange={setAskBody} />
              <textarea
                ref={askBodyRef}
                id="ask-body"
                className={styles.formTextarea}
                value={askBody}
                onChange={(e) => setAskBody(e.target.value)}
                placeholder="Provide context, what you've tried, and what you expected."
                rows={8}
                required
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel} htmlFor="ask-tags">
                Tags (optional)
              </label>
              <input
                id="ask-tags"
                className={styles.formInput}
                value={askTags}
                onChange={(e) => setAskTags(e.target.value)}
                placeholder="e.g. data-structures, algorithms, dp"
              />
            </div>
            {askError && (
              <p style={{ color: 'var(--danger, #ef4444)', fontSize: 12, margin: 0 }}>{askError}</p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setAskOpen(false);
                  setAskError(null);
                }}
                disabled={askSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={askSubmitting || !askTitle.trim() || !askBody.trim()}
              >
                {askSubmitting ? 'Posting…' : 'Post question'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Search questions"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </div>
        <div className={styles.toolbarRight}>
          <div role="tablist" aria-label="Sort" className={styles.tabs}>
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                role="tab"
                aria-selected={sort === s.value}
                className={`${styles.tab} ${sort === s.value ? styles.tabActive : ''}`}
                onClick={() => setSort(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          {user && (
            <button
              type="button"
              className={`${styles.filterToggle} ${mine ? styles.filterToggleActive : ''}`}
              onClick={() => setMine(!mine)}
            >
              Mine
            </button>
          )}
          <button
            type="button"
            className={`${styles.filterToggle} ${saved ? styles.filterToggleActive : ''}`}
            onClick={() => setSaved(!saved)}
          >
            Saved
          </button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className={styles.tagFilter}>
          <button
            type="button"
            className={`${styles.tagChip} ${selectedTags.length === 0 ? styles.tagChipActive : ''}`}
            onClick={() => setSelectedTags([])}
          >
            All
          </button>
          {tags.slice(0, 18).map((t) => (
            <button
              key={t.name}
              type="button"
              className={`${styles.tagChip} ${selectedTags.includes(t.name) ? styles.tagChipActive : ''}`}
              onClick={() => toggleTag(t.name)}
            >
              {t.name} <span style={{ opacity: 0.6 }}>· {t.count}</span>
            </button>
          ))}
        </div>
      )}

      {(selectedTags.length > 0 || q.trim() || mine) && (
        <div className={styles.activeFilters}>
          {selectedTags.map((tagName) => (
            <span key={tagName} className={styles.activeFilterPill}>
              tag: <strong>{tagName}</strong>
              <button
                type="button"
                aria-label={`Clear tag ${tagName}`}
                onClick={() => toggleTag(tagName)}
              >
                ×
              </button>
            </span>
          ))}
          {mine && (
            <span className={styles.activeFilterPill}>
              <strong>My questions</strong>
              <button type="button" aria-label="Clear mine filter" onClick={() => setMine(false)}>
                ×
              </button>
            </span>
          )}
          {q.trim() && (
            <span className={styles.activeFilterPill}>
              search: <strong>{q.trim()}</strong>
              <button type="button" aria-label="Clear search" onClick={() => setQ('')}>
                ×
              </button>
            </span>
          )}
          <button
            type="button"
            className={styles.clearAllBtn}
            onClick={() => {
              setSelectedTags([]);
              setQ('');
              setMine(false);
            }}
          >
            Clear all
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.list}>
          <Skeleton variant="card" height={72} count={5} />
        </div>
      ) : error && questions.length === 0 ? (
        <EmptyState
          title="Community feed unavailable"
          description={error}
          tone="error"
          action={{ label: 'Retry', onClick: () => void load() }}
        />
      ) : displayedQuestions.length === 0 ? (
        <EmptyState
          title={saved ? 'No saved questions' : 'No questions match'}
          description={
            saved
              ? 'Bookmark questions to see them here.'
              : 'Try a different tag or clear your search.'
          }
        />
      ) : (
        <div className={styles.list}>
          {displayedQuestions.map((question) => (
            <div key={question.id} className={styles.row}>
              <VoteButton
                score={question.score}
                myVote={question.myVote}
                size="sm"
                requireAuth={!user}
                onAuthRequired={() => router.push('/connect')}
                onVote={async (direction) => {
                  const result = await voteQuestion(question.id, direction);
                  setQuestions((prev) =>
                    prev.map((qItem) =>
                      qItem.id === question.id
                        ? { ...qItem, score: result.score, myVote: result.myVote }
                        : qItem
                    )
                  );
                  return result;
                }}
                ariaLabel="Vote on question"
              />
              <Link href={`/community/q/${question.id}`} className={styles.rowLink}>
                <div className={styles.body}>
                  <h2 className={styles.questionTitle}>{question.title}</h2>
                  <p className={styles.snippet}>{stripMarkdown(question.body)}</p>
                  <div className={styles.metaRow}>
                    <span
                      className={`${styles.stat} ${question.acceptedAnswerId ? styles.statAccepted : ''}`}
                    >
                      <strong>{question.answerCount}</strong> answers
                    </span>
                    {typeof question.views === 'number' && (
                      <span className={styles.stat}>
                        <strong>{question.views}</strong> views
                      </span>
                    )}
                    {question.tags.slice(0, 4).map((tagName) => (
                      <Link
                        key={tagName}
                        href={`/community?tags=${encodeURIComponent(tagName)}`}
                        className={styles.tag}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {tagName}
                      </Link>
                    ))}
                  </div>
                </div>
              </Link>
              <div className={styles.right}>
                <CommunityAuthorLink
                  author={question.author}
                  showAvatar
                  avatarSize={24}
                  className={styles.author}
                />
                <span className={styles.timestamp}>{formatRelative(question.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && !saved && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.cancelBtn}
            disabled={page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            &larr; Previous
          </button>
          <span className={styles.paginationLabel}>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.cancelBtn}
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
