'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';
import Avatar from '../../../_components/widgets/Avatar';
import EmptyState from '../../../_components/widgets/EmptyState';
import Skeleton from '../../../_components/widgets/Skeleton';
import MarkdownToolbar from '../../../_components/widgets/MarkdownToolbar';
import VoteButton from '../../../_components/widgets/VoteButton';
import {
  acceptAnswer,
  createAnswer,
  getQuestion,
  voteAnswer,
  voteQuestion,
  type CommunityAnswer,
  type CommunityQuestion,
} from '../../../../lib/services/community';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import { useSession } from '../../../_components/session-context';
import { renderMarkdown } from '../../../../lib/markdown';

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function QuestionPage() {
  const params = useParams<{ questionId: string }>();
  const questionId = params?.questionId ?? '';
  const router = useRouter();
  const { user } = useSession();
  const [question, setQuestion] = useState<CommunityQuestion | null>(null);
  const [answers, setAnswers] = useState<CommunityAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    if (!questionId) return;
    setLoading(true);
    setError(null);
    try {
      const { question: q, answers: a } = await getQuestion(questionId);
      setQuestion(q);
      setAnswers(a);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  const sortedAnswers = useMemo(() => {
    return [...answers].sort((a, b) => {
      const aAccepted = a.accepted || question?.acceptedAnswerId === a.id;
      const bAccepted = b.accepted || question?.acceptedAnswerId === b.id;
      if (aAccepted !== bAccepted) return aAccepted ? -1 : 1;
      return b.score - a.score;
    });
  }, [answers, question?.acceptedAnswerId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAccept(answerId: string) {
    setAcceptError(null);
    try {
      await acceptAnswer(answerId);
      setAnswers((prev) => prev.map((a) => ({ ...a, accepted: a.id === answerId })));
      setQuestion((q) => (q ? { ...q, acceptedAnswerId: answerId } : q));
    } catch (err) {
      setAcceptError(friendlyMessage(err));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !questionId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await createAnswer(questionId, trimmed);
      if (created.author.username === 'Unknown' && user) {
        created.author = { ...created.author, username: user.username, userId: user.id };
      }
      setAnswers((prev) => [...prev, created]);
      setDraft('');
    } catch (err) {
      setSubmitError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Skeleton variant="card" height={180} />
        <Skeleton variant="card" height={100} count={2} />
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className={styles.page}>
        <header className={styles.breadcrumb}>
          <Link href="/community">← Back to community</Link>
        </header>
        <div className={styles.placeholder}>
          <EmptyState
            title="Could not load question"
            description={error ?? 'This question may have been removed.'}
            tone={error ? 'error' : 'default'}
            action={{ label: 'Retry', onClick: () => void load() }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.breadcrumb}>
        <Link href="/community">← Back to community</Link>
      </header>

      <article className={styles.questionCard}>
        <VoteButton
          score={question.score}
          myVote={question.myVote}
          requireAuth={!user}
          onAuthRequired={() => router.push('/connect')}
          onVote={async (direction) => {
            const result = await voteQuestion(question.id, direction);
            setQuestion((q) => (q ? { ...q, score: result.score, myVote: result.myVote } : q));
            return result;
          }}
          ariaLabel="Vote on question"
        />
        <div className={styles.questionBody}>
          <h1 className={styles.questionTitle}>{question.title}</h1>
          <div className={styles.tagsRow}>
            {question.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
          <div
            className={styles.markdown}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(question.body) }}
          />
        </div>
        <div className={styles.authorCard}>
          <Avatar url={question.author.avatarUrl} name={question.author.username} size={28} />
          <span className={styles.authorName}>{question.author.username}</span>
          <span>{formatTimestamp(question.createdAt)}</span>
          {question.author.reputation !== undefined && (
            <span>{question.author.reputation} rep</span>
          )}
          <div className={styles.questionActions}>
            <button
              type="button"
              className={styles.copyBtn}
              onClick={() => {
                void navigator.clipboard.writeText(window.location.href).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M8.5 3.5V2a1.5 1.5 0 00-1.5-1.5H2A1.5 1.5 0 00.5 2v5A1.5 1.5 0 002 8.5h1.5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>
      </article>

      <div className={styles.answersHeader}>
        <h2 className={styles.answersTitle}>{answers.length} answers</h2>
        <span className={styles.answersMeta}>
          {question.acceptedAnswerId ? 'Solution accepted' : 'No accepted answer yet'}
        </span>
      </div>

      {answers.length === 0 ? (
        <EmptyState
          title="Be the first to answer"
          description="Share what you know and help a peer move forward."
        />
      ) : (
        sortedAnswers.map((answer) => {
          const accepted = answer.accepted || question.acceptedAnswerId === answer.id;
          return (
            <article
              key={answer.id}
              className={`${styles.answerCard} ${accepted ? styles.answerAccepted : ''}`}
            >
              <VoteButton
                score={answer.score}
                myVote={answer.myVote}
                requireAuth={!user}
                onAuthRequired={() => router.push('/connect')}
                onVote={async (direction) => {
                  const result = await voteAnswer(answer.id, direction);
                  setAnswers((prev) =>
                    prev.map((a) =>
                      a.id === answer.id ? { ...a, score: result.score, myVote: result.myVote } : a
                    )
                  );
                  return result;
                }}
                ariaLabel="Vote on answer"
              />
              <div className={styles.questionBody}>
                {accepted && (
                  <span className={styles.acceptedBadge}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
                      <path
                        d="M2 5.5L4.5 8l4.5-5"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Accepted
                  </span>
                )}
                <div
                  className={styles.markdown}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(answer.body) }}
                />
                {!accepted && !question.acceptedAnswerId && user?.id === question.author.userId && (
                  <>
                    <button
                      type="button"
                      className={styles.acceptBtn}
                      onClick={() => void handleAccept(answer.id)}
                    >
                      Mark as accepted
                    </button>
                    {acceptError && (
                      <p style={{ color: 'var(--danger, #ef4444)', fontSize: 12, margin: 0 }}>
                        {acceptError}
                      </p>
                    )}
                  </>
                )}
              </div>
              <div className={styles.authorCard}>
                <Avatar url={answer.author.avatarUrl} name={answer.author.username} size={24} />
                <span className={styles.authorName}>{answer.author.username}</span>
                <span>{formatTimestamp(answer.createdAt)}</span>
              </div>
            </article>
          );
        })
      )}

      {user ? (
        <form className={styles.composer} onSubmit={handleSubmit}>
          <span className={styles.composerLabel}>Your answer</span>
          <MarkdownToolbar textareaRef={textareaRef} onChange={setDraft} />
          <textarea
            ref={textareaRef}
            className={styles.composerInput}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Explain the approach, share code, and link references…"
          />
          {submitError && (
            <p style={{ color: 'var(--danger, #ef4444)', fontSize: 12, margin: 0 }}>
              {submitError}
            </p>
          )}
          <div className={styles.composerActions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || !draft.trim()}
            >
              {submitting ? 'Posting…' : 'Post answer'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.composer}>
          <Link href="/connect" className={styles.submitBtn}>
            Sign in to answer
          </Link>
        </div>
      )}
    </div>
  );
}
