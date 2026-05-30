'use client';

import { useParams } from 'next/navigation';
import CourseShell from '../../_components/course-shell';
import LecturePlayerView from '../../_components/lectures/lecture-player-view';

export default function CourseVideosPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  return (
    <CourseShell courseId={courseId}>
      <LecturePlayerView courseId={courseId} />
    </CourseShell>
  );
}
