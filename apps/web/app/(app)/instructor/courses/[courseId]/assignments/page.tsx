'use client';

import Link from 'next/link';
import { use, useCallback, useEffect, useState } from 'react';
import {
  McqAssignmentConfigInputSchema,
  type AssignmentSubmissionQueueItem,
  type CourseAssignment,
  type CourseAssignmentType,
} from '@nibras/contracts';
import {
  createCourseAssignment,
  deleteCourseAssignment,
  gradeCourseAssignment,
  listAssignmentSubmissions,
  listCourseAssignments,
  updateCourseAssignment,
} from '../../../../../lib/services/course-assignments';
import { friendlyMessage } from '../../../../../lib/api-clients/errors';
import styles from '../../../instructor.module.css';

export default function InstructorAssignmentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const [assignments, setAssignments] = useState<CourseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [points, setPoints] = useState('100');
  const [assignmentType, setAssignmentType] = useState<CourseAssignmentType>('text');
  const [mcqJson, setMcqJson] = useState(
    JSON.stringify(
      {
        questions: [
          {
            id: 'q1',
            prompt: 'Sample question?',
            options: [
              { id: 'a', text: 'Option A' },
              { id: 'b', text: 'Option B' },
            ],
            correctOptionId: 'a',
          },
        ],
      },
      null,
      2
    )
  );
  const [saving, setSaving] = useState(false);
  const [gradeAssignmentId, setGradeAssignmentId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmissionQueueItem[]>([]);
  const [gradeUserId, setGradeUserId] = useState('');
  const [gradeScore, setGradeScore] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAssignments(await listCourseAssignments(courseId));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function openGradeQueue(assignmentId: string) {
    setGradeAssignmentId(assignmentId);
    setGradeUserId('');
    setGradeScore('');
    setGradeFeedback('');
    try {
      const res = await listAssignmentSubmissions(assignmentId);
      setSubmissions(res.items);
    } catch (err) {
      setError(friendlyMessage(err));
      setSubmissions([]);
    }
  }

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      let config: ReturnType<typeof McqAssignmentConfigInputSchema.parse> | undefined;
      if (assignmentType === 'mcq' || assignmentType === 'quiz') {
        const parsed = McqAssignmentConfigInputSchema.safeParse(JSON.parse(mcqJson));
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Invalid MCQ configuration JSON.');
          return;
        }
        config = parsed.data;
      }
      await createCourseAssignment(courseId, {
        title: title.trim(),
        assignmentType,
        description: description.trim() || undefined,
        content: content.trim() || undefined,
        config,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        pointsPossible: points ? parseInt(points, 10) : undefined,
        published: true,
      });
      setTitle('');
      setDescription('');
      setContent('');
      setDueAt('');
      await load();
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleGrade() {
    if (!gradeAssignmentId || !gradeUserId || gradeScore === '') return;
    setSaving(true);
    try {
      await gradeCourseAssignment(gradeAssignmentId, {
        userId: gradeUserId,
        score: parseFloat(gradeScore),
        feedback: gradeFeedback.trim() || undefined,
      });
      await openGradeQueue(gradeAssignmentId);
      setGradeScore('');
      setGradeFeedback('');
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
            <Link href={`/instructor/courses/${courseId}`}>Course</Link> / Assignments
          </p>
          <h1>Assignments</h1>
        </div>
      </div>

      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.panel} style={{ marginBottom: 16 }}>
        <h2>New assignment</h2>
        <div style={{ display: 'grid', gap: 8, marginTop: 8, maxWidth: 560 }}>
          <select
            value={assignmentType}
            onChange={(e) => setAssignmentType(e.target.value as CourseAssignmentType)}
            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
          >
            <option value="text">Text submission</option>
            <option value="mcq">Multiple choice (MCQ)</option>
            <option value="quiz">Quiz (MCQ + copy protection)</option>
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            rows={2}
            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Instructions (markdown, optional)"
            rows={4}
            style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
          />
          {(assignmentType === 'mcq' || assignmentType === 'quiz') && (
            <textarea
              value={mcqJson}
              onChange={(e) => setMcqJson(e.target.value)}
              placeholder="MCQ config JSON"
              rows={12}
              style={{
                padding: 8,
                borderRadius: 8,
                border: '1px solid var(--border)',
                fontFamily: 'monospace',
                fontSize: 12,
              }}
            />
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
            />
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="Points"
              style={{ width: 100, padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
            />
            <button
              type="button"
              className={styles.btnPrimary}
              disabled={saving}
              onClick={() => void handleCreate()}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className={styles.panel}>
        {assignments.map((a) => (
          <div
            key={a.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              padding: '12px 0',
              borderBottom: '1px solid var(--border)',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong>{a.title}</strong>
              <span className={styles.muted} style={{ marginLeft: 8 }}>
                {a.assignmentType ?? 'text'} · {a.pointsPossible} pts ·{' '}
                {a.published ? 'published' : 'draft'}
              </span>
              {a.dueAt && (
                <p className={styles.muted} style={{ margin: '4px 0 0', fontSize: 12 }}>
                  Due {new Date(a.dueAt).toLocaleString()}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Link
                href={`/catalog/${courseId}/assignments/${a.id}`}
                className={styles.btnSecondary}
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Student preview
              </Link>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => void openGradeQueue(a.id)}
              >
                Grade submissions
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={saving}
                onClick={() => {
                  void updateCourseAssignment(courseId, a.id, { published: !a.published }).then(
                    () => load()
                  );
                }}
              >
                {a.published ? 'Unpublish' : 'Publish'}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                disabled={saving}
                onClick={() => {
                  if (confirm('Delete assignment?')) {
                    void deleteCourseAssignment(courseId, a.id).then(() => load());
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {gradeAssignmentId && (
        <div className={styles.panel} style={{ marginTop: 16 }}>
          <div className={styles.panelHeader}>
            <h2>Submissions</h2>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => setGradeAssignmentId(null)}
            >
              Close
            </button>
          </div>
          {submissions.length === 0 ? (
            <p className={styles.muted}>No submissions yet.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0' }}>
              {submissions.map((sub) => (
                <li
                  key={sub.id}
                  style={{
                    padding: '8px 0',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setGradeUserId(sub.userId)}
                >
                  <strong>{sub.username ?? sub.userId}</strong>
                  <span className={styles.muted} style={{ marginLeft: 8 }}>
                    {sub.status}
                    {sub.score != null ? ` · ${sub.score} pts` : ''}
                  </span>
                  {sub.contentPreview && (
                    <p className={styles.muted} style={{ fontSize: 12, margin: '4px 0 0' }}>
                      {sub.contentPreview}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {gradeUserId && (
            <div style={{ display: 'grid', gap: 8, maxWidth: 400, marginTop: 12 }}>
              <p className={styles.muted}>Grading user: {gradeUserId}</p>
              <input
                type="number"
                min={0}
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                placeholder="Score"
                style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <textarea
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Feedback (optional)"
                rows={3}
                style={{ padding: 8, borderRadius: 8, border: '1px solid var(--border)' }}
              />
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={saving || gradeScore === ''}
                onClick={() => void handleGrade()}
              >
                Save grade
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
