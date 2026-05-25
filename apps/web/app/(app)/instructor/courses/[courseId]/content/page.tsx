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
  updateCourseSection,
  updateCourseVideo,
} from '../../../../../lib/services/course-content';
import { useFetch } from '../../../../../lib/use-fetch';
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
  const [videoLinkedProjectId, setVideoLinkedProjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(false);
  const [sectionTitleEdit, setSectionTitleEdit] = useState('');
  const [sectionDescEdit, setSectionDescEdit] = useState('');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editVideoTitle, setEditVideoTitle] = useState('');
  const [editVideoDesc, setEditVideoDesc] = useState('');
  const [editVideoLinkedProject, setEditVideoLinkedProject] = useState('');
  const [editVideoMoveSection, setEditVideoMoveSection] = useState('');

  const { data: projects } = useFetch<Array<{ id: string; title: string; status: string }>>(
    `/v1/tracking/courses/${courseId}/projects`
  );
  const publishedProjects = useMemo(
    () => (projects ?? []).filter((p) => p.status === 'published'),
    [projects]
  );

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
        linkedProjectId: videoLinkedProjectId.trim() || undefined,
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

  async function moveVideo(video: CourseVideo, delta: number) {
    if (!activeSection) return;
    const idx = activeSection.videos.findIndex((v) => v.id === video.id);
    const target = activeSection.videos[idx + delta];
    if (!target) return;
    setSaving(true);
    try {
      await updateCourseVideo(courseId, video.id, { sortOrder: target.sortOrder });
      await updateCourseVideo(courseId, target.id, { sortOrder: video.sortOrder });
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function moveSection(section: CourseSection, delta: number) {
    const idx = sections.findIndex((s) => s.id === section.id);
    const target = sections[idx + delta];
    if (!target) return;
    setSaving(true);
    try {
      await updateCourseSection(courseId, section.id, { sortOrder: target.sortOrder });
      await updateCourseSection(courseId, target.id, { sortOrder: section.sortOrder });
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveSectionEdit() {
    if (!activeSection) return;
    setSaving(true);
    try {
      await updateCourseSection(courseId, activeSection.id, {
        title: sectionTitleEdit.trim() || activeSection.title,
        description: sectionDescEdit.trim() || null,
      });
      setEditingSection(false);
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function startEditSection() {
    if (!activeSection) return;
    setSectionTitleEdit(activeSection.title);
    setSectionDescEdit(activeSection.description ?? '');
    setEditingSection(true);
  }

  function startEditVideo(video: CourseVideo) {
    setEditingVideoId(video.id);
    setEditVideoTitle(video.title);
    setEditVideoDesc(video.description ?? '');
    setEditVideoLinkedProject(video.linkedProjectId ?? '');
    setEditVideoMoveSection(video.sectionId);
  }

  async function saveVideoEdit(videoId: string) {
    setSaving(true);
    try {
      await updateCourseVideo(courseId, videoId, {
        title: editVideoTitle.trim() || undefined,
        description: editVideoDesc.trim() || null,
        linkedProjectId: editVideoLinkedProject.trim() || null,
        sectionId:
          editVideoMoveSection && editVideoMoveSection !== activeSectionId
            ? editVideoMoveSection
            : undefined,
      });
      setEditingVideoId(null);
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
            {sections.map((section, sIdx) => (
              <div key={section.id} className={localStyles.sectionRow}>
                <button
                  type="button"
                  className={`${localStyles.sectionBtn} ${
                    section.id === activeSectionId ? localStyles.sectionBtnActive : ''
                  }`}
                  onClick={() => {
                    setActiveSectionId(section.id);
                    setPreviewVideoId(null);
                    setEditingSection(false);
                    setEditingVideoId(null);
                  }}
                >
                  <span>{section.title}</span>
                  <span className={styles.muted}>{section.videos.length}</span>
                </button>
                <div className={localStyles.sectionReorder}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled={saving || sIdx === 0}
                    onClick={() => void moveSection(section, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    disabled={saving || sIdx === sections.length - 1}
                    onClick={() => void moveSection(section, 1)}
                  >
                    ↓
                  </button>
                </div>
              </div>
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
                  {editingSection ? (
                    <div className={localStyles.form} style={{ flex: 1 }}>
                      <label>
                        Section title
                        <input
                          value={sectionTitleEdit}
                          onChange={(e) => setSectionTitleEdit(e.target.value)}
                        />
                      </label>
                      <label>
                        Description
                        <input
                          value={sectionDescEdit}
                          onChange={(e) => setSectionDescEdit(e.target.value)}
                        />
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className={styles.btnPrimary}
                          disabled={saving}
                          onClick={() => void saveSectionEdit()}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => setEditingSection(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <h2>{activeSection.title}</h2>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!editingSection && (
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={startEditSection}
                      >
                        Edit section
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      disabled={saving}
                      onClick={() => void handleDeleteSection(activeSection.id)}
                    >
                      Delete section
                    </button>
                  </div>
                </div>

                <div className={localStyles.videoList}>
                  {activeSection.videos.length === 0 ? (
                    <p className={styles.muted}>No videos in this section yet.</p>
                  ) : (
                    activeSection.videos.map((video) => (
                      <div key={video.id} className={localStyles.videoRow}>
                        {editingVideoId === video.id ? (
                          <div className={localStyles.form} style={{ flex: 1 }}>
                            <label>
                              Title
                              <input
                                value={editVideoTitle}
                                onChange={(e) => setEditVideoTitle(e.target.value)}
                              />
                            </label>
                            <label>
                              Description
                              <input
                                value={editVideoDesc}
                                onChange={(e) => setEditVideoDesc(e.target.value)}
                              />
                            </label>
                            <label>
                              Linked project
                              <select
                                value={editVideoLinkedProject}
                                onChange={(e) => setEditVideoLinkedProject(e.target.value)}
                              >
                                <option value="">None</option>
                                {publishedProjects.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label>
                              Move to section
                              <select
                                value={editVideoMoveSection}
                                onChange={(e) => setEditVideoMoveSection(e.target.value)}
                              >
                                {sections.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                type="button"
                                className={styles.btnPrimary}
                                disabled={saving}
                                onClick={() => void saveVideoEdit(video.id)}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => setEditingVideoId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span>
                              {video.title} <span className={styles.muted}>({video.provider})</span>
                              {video.linkedProjectTitle && (
                                <span className={styles.muted}>
                                  {' '}
                                  · → {video.linkedProjectTitle}
                                </span>
                              )}
                            </span>
                            <div className={localStyles.rowActions}>
                              <button
                                type="button"
                                className={styles.btnSecondary}
                                disabled={saving}
                                onClick={() => void moveVideo(video, -1)}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className={styles.btnSecondary}
                                disabled={saving}
                                onClick={() => void moveVideo(video, 1)}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => startEditVideo(video)}
                              >
                                Edit
                              </button>
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
                          </>
                        )}
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
                  <label>
                    Linked project (optional)
                    <select
                      value={videoLinkedProjectId}
                      onChange={(e) => setVideoLinkedProjectId(e.target.value)}
                    >
                      <option value="">None</option>
                      {publishedProjects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
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
