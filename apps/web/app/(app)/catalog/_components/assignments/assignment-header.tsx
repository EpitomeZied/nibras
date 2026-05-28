'use client';

import type { CourseAssignmentDetail } from '@nibras/contracts';
import AssignmentTypeBadge from './assignment-type-badge';
import styles from './assignment-header.module.css';

function statusBadgeClass(status: CourseAssignmentDetail['status']) {
  switch (status) {
    case 'in_progress':
      return styles.statusInProgress;
    case 'submitted':
      return styles.statusSubmitted;
    case 'graded':
      return styles.statusGraded;
    case 'late':
      return styles.statusLate;
    default:
      return styles.statusNotStarted;
  }
}

function formatDue(iso?: string | null): string {
  if (!iso) return 'No due date';
  try {
    return `Due ${new Date(iso).toLocaleString()}`;
  } catch {
    return iso;
  }
}

type Props = {
  assignment: CourseAssignmentDetail;
};

export default function AssignmentHeader({ assignment }: Props) {
  return (
    <div className={styles.header}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{assignment.title}</h1>
        <AssignmentTypeBadge type={assignment.assignmentType} />
        <span
          className={`${styles.statusBadge} ${statusBadgeClass(assignment.status ?? 'not_started')}`}
        >
          {(assignment.status ?? 'not_started').replace('_', ' ')}
        </span>
      </div>
      <span className={styles.subtitle}>
        {formatDue(assignment.dueAt)} · {assignment.pointsPossible} pts
        {typeof assignment.score === 'number' &&
          ` · scored ${assignment.score}/${assignment.pointsPossible}`}
      </span>
      {assignment.feedback && assignment.status === 'graded' && (
        <p className={styles.feedback}>
          <strong>Feedback:</strong> {assignment.feedback}
        </p>
      )}
    </div>
  );
}
