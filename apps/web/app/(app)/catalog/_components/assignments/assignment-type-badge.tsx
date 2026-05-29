'use client';

import type { CourseAssignmentType } from '@nibras/contracts';
import styles from './assignment-type-badge.module.css';

const LABELS: Record<CourseAssignmentType, string> = {
  text: 'Text',
  mcq: 'MCQ',
  quiz: 'Quiz',
};

type Props = {
  type?: CourseAssignmentType;
};

export default function AssignmentTypeBadge({ type = 'text' }: Props) {
  return <span className={`${styles.badge} ${styles[type]}`}>{LABELS[type]}</span>;
}
