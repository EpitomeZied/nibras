'use client';

import { useParams } from 'next/navigation';
import AssignmentListView from '../../_components/assignments/assignment-list-view';

export default function CourseAssignmentsPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  return <AssignmentListView courseId={courseId} />;
}
