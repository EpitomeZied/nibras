'use client';

import { useParams } from 'next/navigation';
import CourseShell from '../../_components/course-shell';
import AssignmentListView from '../../_components/assignments/assignment-list-view';

export default function CourseAssignmentsPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  return (
    <CourseShell courseId={courseId}>
      <AssignmentListView courseId={courseId} />
    </CourseShell>
  );
}
