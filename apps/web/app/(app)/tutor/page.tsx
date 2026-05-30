'use client';

import { Suspense } from 'react';
import TutorChatPage from './_components/tutor-chat-page';

function TutorPageFallback() {
  return null;
}

export default function TutorPage() {
  return (
    <Suspense fallback={<TutorPageFallback />}>
      <TutorChatPage />
    </Suspense>
  );
}
