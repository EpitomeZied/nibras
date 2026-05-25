'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useMemo, useState } from 'react';
import type { CourseSection, CourseVideo, VideoProvider } from '@nibras/contracts';
import VideoEmbed from '../../../../_components/VideoEmbed';
import { friendlyMessage } from '../../../../../lib/api-clients/errors';
import {
  createCourseSection,
  createCourseVideo,
  deleteCourseSection,
  deleteCourseVideo,
  listCourseSections,
} from '../../../../../lib/services/course-content';
import styles from '../../../../instructor/instructor.module.css';
import localStyles from './page.module.css';

const PROVIDERS: { value: VideoProvider; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'bilibili', label: 'Bilibili' },
  { value: 'mp4', label: 'MP4 URL' },
  { value: 'url', label: 'Embed URL' },
];

export default function CourseContentPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoProvider, setVideoProvider] = useState<VideoProvider>('youtube');
  const [videoExternalId, setVideoExternalId] = useState('');
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listCourseSections(courseId);
      setSections(list);
      setActiveSectionId((prev) => {
        if (prev && list.some((s) => s.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeSection = useMemo(
    () => sections.find((s) => s.id === activeSectionId) ?? null,
    [sections, activeSectionId]
  );

  const previewVideo = useMemo(() => {
    if (!activeSection || !previewVideoId) return null;
    return activeSection.videos.find((v) => v.id === previewVideoId) ?? null;
  }, [activeSection, previewVideoId]);

  async function handleAddSection() {
    const title = newSectionTitle.trim();
    if (!title) return;
    setSaving(true);
    try {
      await createCourseSection(courseId, { title });
      setNewSectionTitle('');
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('Delete this section and all its videos?')) return;
    setSaving(true);
    try {
      await deleteCourseSection(courseId, sectionId);
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddVideo() {
    if (!activeSectionId) return;
    const title = videoTitle.trim();
    if (!title) return;
    setSaving(true);
    try {
      await createCourseVideo(courseId, activeSectionId, {
        title,
        provider: videoProvider,
        externalId:
          videoProvider === 'youtube' || videoProvider === 'bilibili'
            ? videoExternalId.trim()
            : undefined,
        embedUrl:
          videoProvider === 'mp4' || videoProvider === 'url' ? videoEmbedUrl.trim() : undefined,
        durationSeconds: videoDuration ? parseInt(videoDuration, 10) : undefined,
      });
      setVideoTitle('');
      setVideoExternalId('');
      setVideoEmbedUrl('');
      setVideoDuration('');
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteVideo(video: CourseVideo) {
    if (!confirm(`Delete "${video.title}"?`)) return;
    setSaving(true);
    try {
      await deleteCourseVideo(courseId, video.id);
      if (previewVideoId === video.id) setPreviewVideoId(null);
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const needsExternalId = videoProvider === 'youtube' || videoProvider === 'bilibili';
  const needsEmbedUrl = videoProvider === 'mp4' || videoProvider === 'url';

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/instructor">Instructor</Link> /{' '}
            <Link href={`/instructor/courses/${courseId}`}>Course</Link> / Lectures
          </p>
          <h1>Course content</h1>
          <p className={styles.subtitle}>
            Add sections and embed lecture videos (YouTube, Bilibili, or direct URLs). Students view
            them at{' '}
            <Link href={`/catalog/${courseId}/videos`} className={styles.btnSecondary}>
              /catalog/{courseId}/videos
            </Link>
            .
          </p>
        </div>
      </div>

      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && (
        <div className={localStyles.layout}>
          <aside className={localStyles.sidebar}>
            <strong style={{ fontSize: 13, padding: '4px 8px' }}>Sections</strong>
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`${localStyles.sectionBtn} ${
                  section.id === activeSectionId ? localStyles.sectionBtnActive : ''
                }`}
                onClick={() => {
                  setActiveSectionId(section.id);
                  setPreviewVideoId(null);
                }}
              >
                <span>{section.title}</span>
                <span className={styles.muted}>{section.videos.length}</span>
              </button>
            ))}
            <div className={localStyles.form}>
              <label>
                New section
                <input
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Week 1"
                />
              </label>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={saving || !newSectionTitle.trim()}
                onClick={() => void handleAddSection()}
              >
                Add section
              </button>
            </div>
          </aside>

          <div className={localStyles.main}>
            {!activeSection ? (
              <p className={styles.muted}>Create a section to add videos.</p>
            ) : (
              <>
                <div className={styles.panelHeader}>
                  <h2>{activeSection.title}</h2>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled={saving}
                    onClick={() => void handleDeleteSection(activeSection.id)}
                  >
                    Delete section
                  </button>
                </div>

                <div className={localStyles.videoList}>
                  {activeSection.videos.length === 0 ? (
                    <p className={styles.muted}>No videos in this section yet.</p>
                  ) : (
                    activeSection.videos.map((video) => (
                      <div key={video.id} className={localStyles.videoRow}>
                        <span>
                          {video.title} <span className={styles.muted}>({video.provider})</span>
                        </span>
                        <div className={localStyles.rowActions}>
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={() => setPreviewVideoId(video.id)}
                          >
                            Preview
                          </button>
                          <button
                            type="button"
                            className={styles.btnSecondary}
                            disabled={saving}
                            onClick={() => void handleDeleteVideo(video)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {previewVideo && (
                  <div className={localStyles.preview}>
                    <VideoEmbed video={previewVideo} />
                  </div>
                )}

                <div className={localStyles.form}>
                  <strong style={{ fontSize: 13 }}>Add video</strong>
                  <label>
                    Title
                    <input
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                      placeholder="Lecture title"
                    />
                  </label>
                  <label>
                    Provider
                    <select
                      value={videoProvider}
                      onChange={(e) => setVideoProvider(e.target.value as VideoProvider)}
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {needsExternalId && (
                    <label>
                      {videoProvider === 'youtube' ? 'YouTube video ID' : 'Bilibili BV id'}
                      <input
                        value={videoExternalId}
                        onChange={(e) => setVideoExternalId(e.target.value)}
                        placeholder={videoProvider === 'youtube' ? 'dQw4w9WgXcQ' : 'BV1xx411c7mD'}
                      />
                    </label>
                  )}
                  {needsEmbedUrl && (
                    <label>
                      Video URL
                      <input
                        value={videoEmbedUrl}
                        onChange={(e) => setVideoEmbedUrl(e.target.value)}
                        placeholder="https://…/lecture.mp4"
                      />
                    </label>
                  )}
                  <label>
                    Duration (seconds, optional)
                    <input
                      type="number"
                      min={0}
                      value={videoDuration}
                      onChange={(e) => setVideoDuration(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={saving || !videoTitle.trim()}
                    onClick={() => void handleAddVideo()}
                  >
                    Add video
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
