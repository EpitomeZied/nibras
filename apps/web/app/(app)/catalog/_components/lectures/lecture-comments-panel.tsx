'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CourseVideoComment } from '@nibras/contracts';
import CommunityAuthorLink from '../../../community/_components/community-author-link';
import { useSession } from '../../../_components/session-context';
import {
  createVideoComment,
  listVideoComments,
} from '../../../../lib/services/course-content';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import type { CommunityAuthor } from '../../../../lib/services/community';
import styles from './lecture-comments-panel.module.css';

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

function toCommunityAuthor(author: CourseVideoComment['author']): CommunityAuthor {
  return {
    userId: author.userId,
    username: author.username,
    githubLogin: author.githubLogin,
    avatarUrl: author.avatarUrl,
    reputation: author.reputation,
  };
}

type Props = {
  videoId: string;
};

export default function LectureCommentsPanel({ videoId }: Props) {
  const { user, loading: sessionLoading } = useSession();
  const [comments, setComments] = useState<CourseVideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      setComments(await listVideoComments(videoId));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !user) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createVideoComment(videoId, { body: trimmed });
      setComments((prev) => [created, ...prev]);
      setBody('');
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.panel} aria-label="Lecture comments">
      <h3 className={styles.title}>Comments</h3>

      {sessionLoading ? (
        <p className={styles.muted}>Loading session…</p>
      ) : user ? (
        <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
          <textarea
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ask a question or share a note about this lecture…"
            rows={3}
            maxLength={2000}
            disabled={submitting}
          />
          <div className={styles.formActions}>
            <button type="submit" className={styles.submitBtn} disabled={submitting || !body.trim()}>
              {submitting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <p className={styles.muted}>Sign in to post a comment on this lecture.</p>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {loading && <p className={styles.muted}>Loading comments…</p>}

      {!loading && comments.length === 0 && (
        <p className={styles.muted}>No comments yet. Be the first to start the discussion.</p>
      )}

      <ul className={styles.list}>
        {comments.map((comment) => (
          <li key={comment.id} className={styles.comment}>
            <div className={styles.commentHeader}>
              <CommunityAuthorLink
                author={toCommunityAuthor(comment.author)}
                showAvatar
                avatarSize={28}
                strong
              />
              <time className={styles.time} dateTime={comment.createdAt}>
                {formatRelative(comment.createdAt)}
              </time>
            </div>
            <p className={styles.body}>{comment.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
