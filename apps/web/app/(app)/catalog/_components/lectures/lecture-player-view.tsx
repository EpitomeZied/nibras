'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CourseSection } from '@nibras/contracts';
import VideoEmbed from '../../../_components/VideoEmbed';
import EmptyState from '../../../_components/widgets/EmptyState';
import {
  listCourseSections,
  setVideoProgress,
  type FlatCourseVideo,
} from '../../../../lib/services/course-content';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import LectureSidebar from './lecture-sidebar';
import LectureResourcesPanel from './lecture-resources-panel';
import LectureCommentsPanel from './lecture-comments-panel';
import { buildTutorAskHref } from '../../../tutor/_content/tutor-context';
import styles from './lecture-player-view.module.css';

type Props = {
  courseId: string;
};

function flattenSectionVideos(sections: CourseSection[]): FlatCourseVideo[] {
  const flat: FlatCourseVideo[] = [];
  for (const section of sections) {
    for (const video of section.videos) {
      flat.push({
        ...video,
        order: section.sortOrder * 1000 + video.sortOrder,
        url: video.playbackUrl,
      });
    }
  }
  return flat.sort((a, b) => a.order - b.order);
}

export default function LecturePlayerView({ courseId }: Props) {
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videos = useMemo(() => flattenSectionVideos(sections), [sections]);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listCourseSections(courseId);
      setSections(list);
      const flat = flattenSectionVideos(list);
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
  const activePlayable = active?.playable !== false && Boolean(active?.playbackUrl);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Lectures</h1>

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
          <LectureSidebar
            sections={sections}
            videos={videos}
            activeId={activeId}
            onSelect={setActiveId}
          />
          <div className={styles.player}>
            {active && (
              <>
                <div className={styles.videoFrame}>
                  {activePlayable ? (
                    <VideoEmbed
                      video={active}
                      onEnded={() => {
                        void markWatched(active);
                        advanceToNext(active);
                      }}
                    />
                  ) : (
                    <div className={styles.unavailable}>This video is unavailable.</div>
                  )}
                </div>
                <div className={styles.videoHeader}>
                  <h2 className={styles.videoTitle}>{active.title}</h2>
                  {active.sectionTitle && (
                    <p className={styles.videoDescription}>{active.sectionTitle}</p>
                  )}
                  {active.description && (
                    <p className={styles.videoDescription}>{active.description}</p>
                  )}
                  {active.linkedProjectId && (
                    <p className={styles.projectLink}>
                      <Link href={`/projects?course=${courseId}`}>
                        Go to linked project
                        {active.linkedProjectTitle ? `: ${active.linkedProjectTitle}` : ''}
                      </Link>
                    </p>
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
                  <div className={styles.videoActions}>
                    <button
                      type="button"
                      className={styles.markWatchedBtn}
                      onClick={() => void markWatched(active)}
                    >
                      Mark watched
                    </button>
                    <Link
                      href={buildTutorAskHref({
                        courseId,
                        lectureId: active.id,
                        prompt: `Help me understand "${active.title}"`,
                      })}
                      className={styles.askHassonaBtn}
                    >
                      Ask Hassona
                    </Link>
                  </div>
                </div>
                <LectureResourcesPanel resources={active.resources ?? []} />
                <LectureCommentsPanel videoId={active.id} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
