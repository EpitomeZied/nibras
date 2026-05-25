'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CourseSection } from '@nibras/contracts';
import VideoEmbed from '../../../_components/VideoEmbed';
import styles from './page.module.css';
import EmptyState from '../../../_components/widgets/EmptyState';
import {
  listCourseSections,
  setVideoProgress,
  type FlatCourseVideo,
} from '../../../../lib/services/course-content';
import { friendlyMessage } from '../../../../lib/api-clients/errors';

function formatDuration(seconds: number | undefined): string {
  const s = seconds ?? 0;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function CourseVideosPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videos = useMemo(() => {
    const flat: FlatCourseVideo[] = [];
    for (const section of sections) {
      for (const video of section.videos) {
        flat.push({
          ...video,
          order: video.sortOrder,
          url: video.playbackUrl,
        });
      }
    }
    return flat.sort((a, b) => a.order - b.order);
  }, [sections]);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listCourseSections(courseId);
      setSections(list);
      const flat: FlatCourseVideo[] = [];
      for (const section of list) {
        for (const video of section.videos) {
          flat.push({ ...video, order: video.sortOrder, url: video.playbackUrl });
        }
      }
      flat.sort((a, b) => a.order - b.order);
      if (flat.length > 0) setActiveId(flat[0].id);
      else setActiveId(null);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(() => videos.find((v) => v.id === activeId) ?? null, [videos, activeId]);

  async function markWatched(video: FlatCourseVideo) {
    try {
      const result = await setVideoProgress(video.id, { watched: true, watchedProgress: 1 });
      setSections((prev) =>
        prev.map((section) => ({
          ...section,
          videos: section.videos.map((v) =>
            v.id === video.id
              ? { ...v, watched: result.watched, watchedProgress: result.watchedProgress }
              : v
          ),
        }))
      );
    } catch {
      /* optimistic UI */
    }
  }

  function advanceToNext(current: FlatCourseVideo) {
    const idx = videos.findIndex((v) => v.id === current.id);
    const next = videos[idx + 1];
    if (next) setActiveId(next.id);
  }

  useEffect(() => {
    if (!active) return;
    const current = active;
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key === 'j' || event.key === 'J' || event.key === 'ArrowDown') {
        event.preventDefault();
        const idx = videos.findIndex((v) => v.id === current.id);
        const next = videos[idx + 1] ?? videos[idx];
        if (next) setActiveId(next.id);
      } else if (event.key === 'k' || event.key === 'K' || event.key === 'ArrowUp') {
        event.preventDefault();
        const idx = videos.findIndex((v) => v.id === current.id);
        const prev = videos[idx - 1] ?? videos[idx];
        if (prev) setActiveId(prev.id);
      } else if (event.key === 'm' || event.key === 'M') {
        event.preventDefault();
        void markWatched(current);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [active, videos]);

  const hasVideos = videos.length > 0;

  return (
    <div className={styles.page}>
      <header className={styles.breadcrumb}>
        <Link href={`/catalog/${courseId}`}>← Back to course</Link>
      </header>
      <h1 className={styles.title}>Videos</h1>

      {loading ? (
        <div
          style={{
            height: 320,
            borderRadius: 14,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        />
      ) : error || !hasVideos ? (
        <EmptyState
          title={error ? 'Could not load videos' : 'No videos'}
          description={
            error ??
            'Lecture videos will appear here once your instructor adds content to this course.'
          }
          tone={error ? 'error' : 'default'}
          action={error ? { label: 'Retry', onClick: () => void load() } : undefined}
        />
      ) : (
        <div className={styles.layout}>
          <div className={styles.list}>
            {sections.map((section) => (
              <div key={section.id}>
                <div className={styles.sectionLabel}>{section.title}</div>
                {section.videos.map((video) => {
                  const flat = videos.find((v) => v.id === video.id);
                  if (!flat) return null;
                  return (
                    <button
                      key={video.id}
                      type="button"
                      className={`${styles.listItem} ${video.id === activeId ? styles.listItemActive : ''}`}
                      onClick={() => setActiveId(video.id)}
                    >
                      {flat.thumbnailUrl ? (
                        <img src={flat.thumbnailUrl} alt="" className={styles.thumb} />
                      ) : (
                        <div className={styles.thumb} />
                      )}
                      <div className={styles.itemBody}>
                        <span className={styles.itemTitle}>{video.title}</span>
                        <span className={styles.itemMeta}>
                          {formatDuration(video.durationSeconds)}
                        </span>
                      </div>
                      {video.watched && <span className={styles.watchedDot} aria-label="Watched" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className={styles.player}>
            {active && (
              <>
                <div className={styles.videoFrame}>
                  <VideoEmbed
                    video={active}
                    onEnded={() => {
                      void markWatched(active);
                      advanceToNext(active);
                    }}
                  />
                </div>
                <div className={styles.videoHeader}>
                  <h2 className={styles.videoTitle}>{active.title}</h2>
                  {active.sectionTitle && (
                    <p className={styles.videoDescription}>{active.sectionTitle}</p>
                  )}
                  {active.description && (
                    <p className={styles.videoDescription}>{active.description}</p>
                  )}
                  <div className={styles.shortcuts}>
                    <span>
                      <kbd>J</kbd> / <kbd>↓</kbd> next
                    </span>
                    <span>
                      <kbd>K</kbd> / <kbd>↑</kbd> previous
                    </span>
                    <span>
                      <kbd>M</kbd> mark watched
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.markWatchedBtn}
                    onClick={() => void markWatched(active)}
                  >
                    Mark watched
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
