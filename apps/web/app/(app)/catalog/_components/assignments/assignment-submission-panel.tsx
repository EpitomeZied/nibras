'use client';

import { useState } from 'react';
import type { CourseAssignmentDetail } from '@nibras/contracts';
import { submitAssignment } from '../../../../lib/services/backend-courses';
import styles from './assignment-submission-panel.module.css';

type Props = {
  assignment: CourseAssignmentDetail;
  assignmentId: string;
  onSubmitted: () => void;
  mcqAnswers?: Record<string, string>;
  isMcqLike?: boolean;
  mcqComplete?: boolean;
};

export default function AssignmentSubmissionPanel({
  assignment,
  assignmentId,
  onSubmitted,
  mcqAnswers = {},
  isMcqLike = false,
  mcqComplete = true,
}: Props) {
  const [submitContent, setSubmitContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = (assignment.status ?? 'not_started') !== 'graded';

  if (!canSubmit) return null;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (isMcqLike) {
        await submitAssignment(assignmentId, { answers: mcqAnswers });
      } else {
        await submitAssignment(assignmentId, { content: submitContent.trim() });
      }
      onSubmitted();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{isMcqLike ? 'Submit answers' : 'Your submission'}</h2>
      {!isMcqLike && (
        <textarea
          className={styles.textarea}
          value={submitContent}
          onChange={(e) => setSubmitContent(e.target.value)}
          rows={6}
          placeholder="Write your answer…"
        />
      )}
      {isMcqLike && !mcqComplete && (
        <p className={styles.hint}>Answer every question before submitting.</p>
      )}
      {submitError && <p className={styles.error}>{submitError}</p>}
      <button
        type="button"
        className={styles.submitBtn}
        disabled={submitting || (isMcqLike ? !mcqComplete : !submitContent.trim())}
        onClick={() => void handleSubmit()}
      >
        {submitting ? 'Submitting…' : 'Submit'}
      </button>
    </section>
  );
}
