'use client';

import type { CourseSection } from '@nibras/contracts';
import type { FlatCourseVideo } from '../../../../lib/services/course-content';
import styles from './lecture-sidebar.module.css';

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

type Props = {
  sections: CourseSection[];
  videos: FlatCourseVideo[];
  activeId: string | null;
  onSelect: (id: string) => void;
};

export default function LectureSidebar({ sections, videos, activeId, onSelect }: Props) {
  return (
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
                className={`${styles.listItem} ${video.id === activeId ? styles.listItemActive : ''} ${video.locked ? styles.listItemLocked : ''}`}
                onClick={() => {
                  if (!video.locked) onSelect(video.id);
                }}
                disabled={video.locked}
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
                    {video.playable === false ? ' · unavailable' : ''}
                  </span>
                </div>
                {video.watched && <span className={styles.watchedDot} aria-label="Watched" />}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
