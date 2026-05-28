'use client';

import type { CourseAssignmentDetail } from '@nibras/contracts';
import { renderMarkdown } from '../../../../lib/markdown';
import CopyProtection from '../../../_components/CopyProtection';
import styles from './assignment-brief.module.css';

type Props = {
  assignment: CourseAssignmentDetail;
};

export default function AssignmentBrief({ assignment }: Props) {
  const html = assignment.content || assignment.description;
  const isQuiz = assignment.assignmentType === 'quiz';

  const body = html ? (
    <div
      className={styles.description}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(html) }}
    />
  ) : (
    <p className={styles.description}>No brief provided.</p>
  );

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Brief</h2>
      {isQuiz ? <CopyProtection className={styles.protected}>{body}</CopyProtection> : body}
    </section>
  );
}
