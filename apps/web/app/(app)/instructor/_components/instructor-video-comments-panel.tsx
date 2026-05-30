'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CourseVideoComment } from '@nibras/contracts';
import CommunityAuthorLink from '../../community/_components/community-author-link';
import { deleteVideoComment, listVideoComments } from '../../../lib/services/course-content';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import type { CommunityAuthor } from '../../../lib/services/community';
import styles from '../instructor.module.css';

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

export default function InstructorVideoCommentsPanel({ videoId }: { videoId: string }) {
  const [comments, setComments] = useState<CourseVideoComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this comment?')) return;
    setDeletingId(commentId);
    try {
      await deleteVideoComment(videoId, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.lectureCommentPanel}>
      <div className={styles.panelHeader}>
        <h3 style={{ margin: 0 }}>Video comments</h3>
        <span className={styles.muted}>{comments.length} total</span>
      </div>
      {loading && <p className={styles.muted}>Loading comments…</p>}
      {error && <p className={styles.errorText}>{error}</p>}
      {!loading && comments.length === 0 && (
        <p className={styles.muted}>No comments on this lecture yet.</p>
      )}
      {!loading && comments.length > 0 && (
        <div className={styles.listStack}>
          {comments.map((comment) => (
            <article
              key={comment.id}
              className={styles.projectRow}
              style={{ alignItems: 'flex-start' }}
            >
              <div style={{ flex: 1 }}>
                <CommunityAuthorLink author={toCommunityAuthor(comment.author)} />
                <p style={{ margin: '6px 0 0', lineHeight: 1.5 }}>{comment.body}</p>
                <span className={styles.muted}>{formatRelative(comment.createdAt)}</span>
              </div>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={deletingId === comment.id}
                onClick={() => void handleDelete(comment.id)}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
