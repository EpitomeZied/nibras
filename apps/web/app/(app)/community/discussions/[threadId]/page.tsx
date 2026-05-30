'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './page.module.css';
import CommunityAuthorLink from '../../_components/community-author-link';
import ReportContentButton from '../../_components/report-content-button';
import EmptyState from '../../../_components/widgets/EmptyState';
import Skeleton from '../../../_components/widgets/Skeleton';
import MarkdownToolbar from '../../../_components/widgets/MarkdownToolbar';
import VoteButton from '../../../_components/widgets/VoteButton';
import {
  canEditDiscussionContent,
  canModerateDiscussion,
  createPost,
  deletePost,
  getThread,
  listPosts,
  setThreadClosed,
  setThreadModeration,
  setThreadPinned,
  updatePost,
  updateThread,
  votePost,
  type CommunityPost,
  type CommunityThread,
  type ThreadModerationStatus,
} from '../../../../lib/services/community';
import { useSession } from '../../../_components/session-context';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import { renderMarkdown } from '../../../../lib/markdown';

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ThreadPage() {
  const params = useParams<{ threadId: string }>();
  const threadId = params?.threadId ?? '';
  const router = useRouter();
  const { user } = useSession();
  const [thread, setThread] = useState<CommunityThread | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const [editThreadOpen, setEditThreadOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editTags, setEditTags] = useState('');

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostBody, setEditPostBody] = useState('');

  const canModerate = canModerateDiscussion(user, thread?.courseId);
  const isAdmin = user?.systemRole === 'admin';
  const canEditThread =
    thread && canEditDiscussionContent(user, thread.author.userId, thread.courseId);

  const load = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);
    try {
      const [t, p] = await Promise.all([getThread(threadId), listPosts(threadId)]);
      setThread(t);
      setPosts(p);
      setError(null);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePinToggle() {
    if (!thread) return;
    const previous = thread.pinned;
    setThread({ ...thread, pinned: !previous });
    try {
      const updated = await setThreadPinned(thread.id, !previous);
      setThread(updated);
    } catch (err) {
      setThread((current) => (current ? { ...current, pinned: previous } : current));
      setError(friendlyMessage(err));
    }
  }

  async function handleCloseToggle() {
    if (!thread) return;
    const previous = thread.closed;
    setThread({ ...thread, closed: !previous });
    try {
      const updated = await setThreadClosed(thread.id, !previous);
      setThread(updated);
    } catch (err) {
      setThread((current) => (current ? { ...current, closed: previous } : current));
      setError(friendlyMessage(err));
    }
  }

  async function handleModeration(status: ThreadModerationStatus) {
    if (!thread) return;
    try {
      const updated = await setThreadModeration(thread.id, status);
      setThread(updated);
    } catch (err) {
      setError(friendlyMessage(err));
    }
  }

  async function handleEditThreadSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!thread) return;
    const title = editTitle.trim();
    if (!title) return;
    try {
      const updated = await updateThread(thread.id, {
        title,
        body: editBody.trim(),
        tags: editTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      setThread(updated);
      setEditThreadOpen(false);
    } catch (err) {
      setError(friendlyMessage(err));
    }
  }

  async function handleDeletePost(postId: string) {
    if (!window.confirm('Remove this reply?')) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(friendlyMessage(err));
    }
  }

  async function handleEditPostSubmit(postId: string) {
    const body = editPostBody.trim();
    if (!body) return;
    try {
      const { post } = await updatePost(postId, body);
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, body: post.body } : p)));
      setEditingPostId(null);
    } catch (err) {
      setError(friendlyMessage(err));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !thread) return;
    setSubmitting(true);
    try {
      const created = await createPost(thread.id, trimmed);
      setPosts((prev) => [...prev, created]);
      setDraft('');
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <Skeleton variant="card" height={160} />
        <Skeleton variant="card" height={80} count={3} />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className={styles.page}>
        <header className={styles.breadcrumb}>
          <Link href="/community/discussions">← Back to discussions</Link>
        </header>
        <EmptyState
          title="Could not load thread"
          description={error ?? 'This thread may have been removed.'}
          tone={error ? 'error' : 'default'}
          action={{ label: 'Retry', onClick: () => void load() }}
        />
      </div>
    );
  }

  const moderationStatus = thread.moderationStatus ?? 'visible';

  return (
    <div className={styles.page}>
      <header className={styles.breadcrumb}>
        <Link href="/community/discussions">← Back to discussions</Link>
      </header>

      {isAdmin && moderationStatus !== 'visible' && (
        <div className={styles.moderationBanner}>
          This thread is <strong>{moderationStatus}</strong> (visible to admins only).
        </div>
      )}

      {error && (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      )}

      <article className={styles.threadHeader}>
        <div className={styles.threadTitleRow}>
          <h1 className={styles.threadTitle}>{thread.title}</h1>
          {thread.pinned && (
            <span className={`${styles.statusTag} ${styles.tagPinned}`}>Pinned</span>
          )}
          {thread.closed && (
            <span className={`${styles.statusTag} ${styles.tagClosed}`}>Closed</span>
          )}
        </div>
        <div className={styles.metaRow}>
          <CommunityAuthorLink author={thread.author} showAvatar avatarSize={20} />
          <span>·</span>
          <span>{formatTimestamp(thread.createdAt)}</span>
          {thread.tags.map((tag) => (
            <span key={tag} className={styles.tagPill}>
              {tag}
            </span>
          ))}
          {user && (
            <ReportContentButton
              targetType="thread"
              targetId={thread.id}
              className={styles.actionBtn}
            />
          )}
        </div>
        {thread.body && (
          <div
            className={styles.threadBody}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(thread.body) }}
          />
        )}
        <div className={styles.actions}>
          {canEditThread && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => {
                setEditTitle(thread.title);
                setEditBody(thread.body ?? '');
                setEditTags(thread.tags.join(', '));
                setEditThreadOpen(true);
              }}
            >
              Edit
            </button>
          )}
          {canModerate && (
            <>
              <button
                type="button"
                className={`${styles.actionBtn} ${thread.pinned ? styles.actionBtnActive : ''}`}
                onClick={() => void handlePinToggle()}
              >
                {thread.pinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                type="button"
                className={`${styles.actionBtn} ${thread.closed ? styles.actionBtnActive : ''}`}
                onClick={() => void handleCloseToggle()}
              >
                {thread.closed ? 'Reopen' : 'Close'}
              </button>
            </>
          )}
          {isAdmin && (
            <>
              {moderationStatus !== 'hidden' && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => void handleModeration('hidden')}
                >
                  Hide
                </button>
              )}
              {moderationStatus !== 'removed' && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => void handleModeration('removed')}
                >
                  Remove
                </button>
              )}
              {moderationStatus !== 'visible' && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => void handleModeration('visible')}
                >
                  Restore
                </button>
              )}
            </>
          )}
        </div>
      </article>

      <div className={styles.postsList}>
        {posts.length === 0 ? (
          <EmptyState title="No replies yet" description="Be the first to chime in." />
        ) : (
          posts.map((post) => {
            const canEditPost = canEditDiscussionContent(user, post.author.userId, thread.courseId);
            const isEditing = editingPostId === post.id;
            return (
              <article key={post.id} className={styles.post}>
                <VoteButton
                  size="sm"
                  score={post.score}
                  myVote={post.myVote}
                  requireAuth={!user}
                  onAuthRequired={() => router.push('/connect')}
                  onVote={async (direction) => {
                    const result = await votePost(post.id, direction);
                    setPosts((prev) =>
                      prev.map((p) =>
                        p.id === post.id ? { ...p, score: result.score, myVote: result.myVote } : p
                      )
                    );
                    return result;
                  }}
                  ariaLabel="Vote on post"
                />
                <div className={styles.postBody}>
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleEditPostSubmit(post.id);
                      }}
                      className={styles.editPostForm}
                    >
                      <textarea
                        value={editPostBody}
                        onChange={(e) => setEditPostBody(e.target.value)}
                        className={styles.composerInput}
                        rows={4}
                        required
                      />
                      <div className={styles.postActions}>
                        <button type="submit" className={styles.actionBtn}>
                          Save
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setEditingPostId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
                  )}
                </div>
                <div className={styles.postAuthor}>
                  <CommunityAuthorLink author={post.author} showAvatar avatarSize={20} strong />
                  <span>{formatTimestamp(post.createdAt)}</span>
                  <div className={styles.postActions}>
                    {user && (
                      <ReportContentButton
                        targetType="post"
                        targetId={post.id}
                        className={styles.actionBtn}
                      />
                    )}
                    {canEditPost && !isEditing && (
                      <>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditPostBody(post.body);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => void handleDeletePost(post.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {thread.closed ? (
        <div className={styles.closedNotice}>
          This thread is closed. No new replies can be added.
        </div>
      ) : user ? (
        <form className={styles.composer} onSubmit={handleSubmit}>
          <span className={styles.composerLabel}>Reply</span>
          <MarkdownToolbar textareaRef={replyRef} onChange={setDraft} />
          <textarea
            ref={replyRef}
            className={styles.composerInput}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Share an update, a question, or a useful resource…"
          />
          <div className={styles.composerActions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || !draft.trim()}
            >
              {submitting ? 'Posting…' : 'Post reply'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.composer}>
          <Link href="/connect" className={styles.submitBtn}>
            Sign in to reply
          </Link>
        </div>
      )}

      {editThreadOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit thread"
          className={styles.dialogOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditThreadOpen(false);
          }}
        >
          <form className={styles.dialogForm} onSubmit={handleEditThreadSubmit}>
            <h2 className={styles.dialogTitle}>Edit thread</h2>
            <label className={styles.dialogLabel}>
              Title
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className={styles.dialogInput}
              />
            </label>
            <label className={styles.dialogLabel}>
              Body
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={5}
                className={styles.dialogInput}
              />
            </label>
            <label className={styles.dialogLabel}>
              Tags (comma-separated)
              <input
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                className={styles.dialogInput}
              />
            </label>
            <div className={styles.dialogActions}>
              <button type="button" onClick={() => setEditThreadOpen(false)}>
                Cancel
              </button>
              <button type="submit" className={styles.submitBtn} disabled={!editTitle.trim()}>
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
