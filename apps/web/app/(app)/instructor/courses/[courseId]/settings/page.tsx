'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import type { TrackingCourseDetail } from '@nibras/contracts';
import { getCourseDetail, updateCourseProfile } from '../../../../../lib/services/course-profile';
import { friendlyMessage } from '../../../../../lib/api-clients/errors';
import styles from '../../../instructor.module.css';

export default function CourseSettingsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const [course, setCourse] = useState<TrackingCourseDetail | null>(null);
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [schedule, setSchedule] = useState('');
  const [topics, setTopics] = useState('');
  const [sequentialVideos, setSequentialVideos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await getCourseDetail(courseId);
      setCourse(detail);
      setDescription(detail.description ?? '');
      setThumbnailUrl(detail.thumbnailUrl ?? '');
      const s = detail.syllabusJson as Record<string, unknown> | null | undefined;
      setSchedule(typeof s?.schedule === 'string' ? s.schedule : '');
      setTopics(Array.isArray(s?.topics) ? (s.topics as string[]).join(', ') : '');
      setSequentialVideos(detail.sequentialVideos ?? false);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateCourseProfile(courseId, {
        description,
        thumbnailUrl: thumbnailUrl.trim() || null,
        sequentialVideos,
        syllabusJson: {
          schedule: schedule || undefined,
          topics: topics
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        },
      });
      setCourse(updated);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/instructor">Instructor</Link> /{' '}
            <Link href={`/instructor/courses/${courseId}`}>Course</Link> / Settings
          </p>
          <h1>Course settings</h1>
          {course && <p className={styles.subtitle}>{course.title}</p>}
        </div>
      </div>

      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && (
        <div className={styles.panel} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </label>
          <label>
            Thumbnail URL
            <input
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </label>
          <label>
            Schedule (syllabus)
            <input
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </label>
          <label>
            Topics (comma-separated)
            <input
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={sequentialVideos}
              onChange={(e) => setSequentialVideos(e.target.checked)}
            />
            Require watching prior lecture before next (when prerequisite set per video)
          </label>
          <button
            type="button"
            className={styles.btnPrimary}
            disabled={saving}
            onClick={() => void handleSave()}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
