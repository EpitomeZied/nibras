'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EmptyState from '../../../_components/widgets/EmptyState';
import { getAssignmentById, type AssignmentDetail } from '../../../../lib/services/backend-courses';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import AssignmentHeader from './assignment-header';
import AssignmentBrief from './assignment-brief';
import AssignmentSubmissionPanel from './assignment-submission-panel';
import McqAssignmentForm from './mcq-assignment-form';
import styles from './assignment-detail-view.module.css';

type Props = {
  courseId: string;
  assignmentId: string;
};

export default function AssignmentDetailView({ courseId, assignmentId }: Props) {
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      setAssignment(await getAssignmentById(assignmentId));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div
          style={{
            height: 320,
            borderRadius: 14,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className={styles.page}>
        <header className={styles.breadcrumb}>
          <Link href={`/catalog/${courseId}`}>← Course home</Link>
          <Link href={`/catalog/${courseId}/assignments`}>Assignments</Link>
        </header>
        <EmptyState
          title="Could not load assignment"
          description={error ?? "The assignment couldn't be loaded."}
          tone={error ? 'error' : 'default'}
          action={{ label: 'Retry', onClick: () => void load() }}
        />
      </div>
    );
  }

  const assignmentType = assignment.assignmentType ?? 'text';
  const isMcqLike = assignmentType === 'mcq' || assignmentType === 'quiz';
  const mcqComplete =
    !isMcqLike ||
    !assignment.config?.questions?.length ||
    assignment.config.questions.every((q) => Boolean(mcqAnswers[q.id]));
  const canSubmit = (assignment.status ?? 'not_started') !== 'graded';

  return (
    <div className={styles.page}>
      <header className={styles.breadcrumb}>
        <Link href={`/catalog/${courseId}`}>← Course home</Link>
        <Link href={`/catalog/${courseId}/assignments`}>Assignments</Link>
      </header>

      <AssignmentHeader assignment={assignment} />

      <div className={styles.layout}>
        <div className={styles.main}>
          <AssignmentBrief assignment={assignment} />

          {isMcqLike && assignment.config && canSubmit && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Questions</h2>
              <McqAssignmentForm
                config={assignment.config}
                answers={mcqAnswers}
                onChange={setMcqAnswers}
              />
            </section>
          )}

          {assignment.rubric && assignment.rubric.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Rubric</h2>
              <ul className={styles.rubricList}>
                {assignment.rubric.map((r, idx) => (
                  <li key={idx} className={styles.rubricRow}>
                    <span className={styles.rubricCriterion}>{r.criterion}</span>
                    <span className={styles.rubricWeight}>{r.weight}%</span>
                    {r.description && <p className={styles.rubricDescription}>{r.description}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className={styles.aside}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Details</h2>
            <div className={styles.metaRow}>
              <span>Points</span>
              <span>{assignment.pointsPossible}</span>
            </div>
            <div className={styles.metaRow}>
              <span>Status</span>
              <span>{(assignment.status ?? 'not_started').replace('_', ' ')}</span>
            </div>
            {assignment.dueAt && (
              <div className={styles.metaRow}>
                <span>Due</span>
                <span>{new Date(assignment.dueAt).toLocaleString()}</span>
              </div>
            )}
          </section>

          {assignment.resources && assignment.resources.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Resources</h2>
              <ul className={styles.resourceList}>
                {assignment.resources.map((r) => (
                  <li key={r.url}>
                    <a
                      className={styles.resourceLink}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {r.title}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <AssignmentSubmissionPanel
            assignment={assignment}
            assignmentId={assignmentId}
            onSubmitted={() => void load()}
            isMcqLike={isMcqLike}
            mcqAnswers={mcqAnswers}
            mcqComplete={mcqComplete}
          />
        </aside>
      </div>
    </div>
  );
}
