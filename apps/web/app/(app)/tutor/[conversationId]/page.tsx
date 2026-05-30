'use client';

import { Suspense, use } from 'react';
import TutorChatPage from '../_components/tutor-chat-page';

function TutorConversationInner({ conversationId }: { conversationId: string }) {
  return <TutorChatPage initialConversationId={conversationId} />;
}

export default function TutorConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  return (
    <Suspense fallback={null}>
      <TutorConversationInner conversationId={conversationId} />
    </Suspense>
  );
}
