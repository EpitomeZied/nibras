'use client';

import { use } from 'react';
import InstructorCourseShell from '../../_components/instructor-course-shell';

export default function InstructorCourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  return <InstructorCourseShell courseId={courseId}>{children}</InstructorCourseShell>;
}
