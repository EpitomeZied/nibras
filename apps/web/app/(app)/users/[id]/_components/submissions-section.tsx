import type { UserProfileSubmission } from '@nibras/contracts';
import styles from '../page.module.css';

const STATUS_LABELS: Record<string, string> = {
  queued: 'Queued',
  running: 'Running',
  passed: 'Passed',
  failed: 'Failed',
  needs_review: 'Needs review',
};

function statusClass(status: string): string {
  if (status === 'passed') return styles.statusPassed;
  if (status === 'failed') return styles.statusFailed;
  if (status === 'needs_review') return styles.statusReview;
  return styles.statusQueued;
}

export default function SubmissionsSection({
  submissions,
  showScores,
}: {
  submissions: UserProfileSubmission[];
  showScores: boolean;
}) {
  if (submissions.length === 0) {
    return <p className={styles.muted}>No submissions yet.</p>;
  }

  return (
    <div className={styles.panel}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Project</th>
            <th>Status</th>
            {showScores && <th>Score</th>}
            <th>Submitted</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.id}>
              <td>
                {submission.projectTitle || submission.projectKey}
                {submission.attemptNumber != null && submission.attemptNumber > 1
                  ? ` · attempt ${submission.attemptNumber}`
                  : ''}
              </td>
              <td className={statusClass(submission.status)}>
                {STATUS_LABELS[submission.status] ?? submission.status}
              </td>
              {showScores && <td>{submission.score != null ? submission.score : '—'}</td>}
              <td className={styles.muted}>
                {submission.submittedAt
                  ? new Date(submission.submittedAt).toLocaleDateString()
                  : new Date(submission.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
