'use client';

import { useParams } from 'next/navigation';
import LecturePlayerView from '../../_components/lectures/lecture-player-view';

export default function CourseVideosPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  return <LecturePlayerView courseId={courseId} />;
}
