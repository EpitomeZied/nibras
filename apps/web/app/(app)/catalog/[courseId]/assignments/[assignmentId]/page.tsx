'use client';

import { useParams } from 'next/navigation';
import AssignmentDetailView from '../../../_components/assignments/assignment-detail-view';

export default function AssignmentDetailPage() {
  const params = useParams<{ courseId: string; assignmentId: string }>();
  const courseId = params?.courseId ?? '';
  const assignmentId = params?.assignmentId ?? '';
  return <AssignmentDetailView courseId={courseId} assignmentId={assignmentId} />;
}
