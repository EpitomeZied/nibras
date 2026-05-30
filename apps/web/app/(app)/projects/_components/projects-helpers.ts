import styles from './projects.module.css';
import { formatHoursMinutes, minutesUntil } from '../../../lib/utils';

export function statusColor(status: string): string {
  if (status === 'approved' || status === 'graded') return styles.statusApproved;
  if (status === 'submitted' || status === 'under_review') return styles.statusReview;
  if (status === 'changes_requested') return styles.statusChanges;
  return styles.statusOpen;
}

export function dueDateColor(dueAt: string | null | undefined, status: string): string {
  if (status === 'approved' || status === 'graded') return styles.dueDateDone;
  const minutes = minutesUntil(dueAt);
  if (minutes === null) return '';
  if (minutes < 0) return styles.dueDateOverdue;
  if (minutes <= 48 * 60) return styles.dueDateUrgent;
  return '';
}

export function dueDateText(dueAt: string | null | undefined): string {
  if (!dueAt) return 'No due date';
  const minutes = minutesUntil(dueAt);
  if (minutes === null) return 'No due date';
  if (minutes < 0) return `Overdue by ${formatHoursMinutes(minutes)}`;
  if (minutes === 0) return 'Due now';
  return `Due in ${formatHoursMinutes(minutes)}`;
}

export function statusIcon(status: string): string {
  if (status === 'approved' || status === 'graded') return '✓';
  if (status === 'submitted' || status === 'under_review') return '●';
  if (status === 'changes_requested') return '↩';
  return '○';
}

export function verificationLabel(status: string | null | undefined): string | null {
  if (!status) return null;
  return status.replace(/_/g, ' ');
}

export function formatActivityTime(value: string): string {
  const minutes = minutesUntil(value);
  if (minutes === null) return '';
  const elapsed = -minutes;
  if (elapsed < 60) return 'Just now';
  if (elapsed < 24 * 60) return `${Math.floor(elapsed / 60)}h ago`;
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
