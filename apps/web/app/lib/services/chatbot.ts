import { serviceFetch } from '../api-clients/service-fetch';

// ── Types ──────────────────────────────────────────────────────────────────

export type XaiData = {
  reasoning: string;
  concepts_used: string[];
  might_be_unclear: string[];
};

export type ChatAskRequest = {
  question: string;
  context?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  conversationId?: string;
};

export type ChatAskResponse = {
  answer: string;
  hints: string[];
  tags: string[];
  communityQuestion: string | null;
  matchScore: number | null;
  xai: XaiData | null;
  refused?: boolean;
};

export type ChatPublishRequest = {
  conversationId?: string;
  title?: string;
  question: string;
  answer: string;
  tags?: string[];
};

export type ChatPublishResponse = {
  questionId: string;
  url?: string;
};

export type ConversationSummary = {
  id: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type ConversationDetail = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    tags: string[];
    xai: XaiData | null;
    responseType: string | null;
    createdAt: string;
  }>;
};

export type InsightsResponse = {
  hardMetrics: {
    totalQuestions: number;
    totalConversations: number;
    streakDays: number;
    weeklyQuestions: number;
    topTags: Array<{ tag: string; count: number }>;
  };
  aiSummary: {
    strengths: Array<{ topic: string; score: number }>;
    weaknesses: Array<{ topic: string; score: number }>;
    nextActions: string[];
    overallAssessment: string;
  };
};

export type RoutingResponse = {
  goal: string;
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    estimatedMinutes?: number;
    ready: boolean;
    topics?: string[];
    resourceUrl?: string;
  }>;
  summary?: string;
};

// ── Chat ───────────────────────────────────────────────────────────────────

export async function ask(payload: ChatAskRequest): Promise<ChatAskResponse> {
  return serviceFetch<ChatAskResponse>('community', '/v1/community/chatbot/ask', {
    method: 'POST',
    auth: true,
    body: payload as unknown as Record<string, unknown>,
  });
}

export async function publish(payload: ChatPublishRequest): Promise<ChatPublishResponse> {
  return serviceFetch<ChatPublishResponse>('community', '/v1/community/chatbot/publish', {
    method: 'POST',
    auth: true,
    body: payload as unknown as Record<string, unknown>,
  });
}

// ── Conversations ──────────────────────────────────────────────────────────

export async function listConversations(page = 1, limit = 30): Promise<ConversationSummary[]> {
  return serviceFetch<ConversationSummary[]>('community', '/v1/tutor/conversations', {
    auth: true,
    query: { page, limit },
  });
}

export async function createConversation(
  title?: string
): Promise<{ id: string; title: string; createdAt: string }> {
  return serviceFetch('community', '/v1/tutor/conversations', {
    method: 'POST',
    auth: true,
    body: title ? { title } : {},
  });
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  return serviceFetch<ConversationDetail>('community', `/v1/tutor/conversations/${id}`, {
    auth: true,
  });
}

export async function deleteConversation(id: string): Promise<void> {
  await serviceFetch('community', `/v1/tutor/conversations/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function renameConversation(
  id: string,
  title: string
): Promise<{ id: string; title: string }> {
  return serviceFetch('community', `/v1/tutor/conversations/${id}`, {
    method: 'PATCH',
    auth: true,
    body: { title },
  });
}

// ── Insights + Routing ─────────────────────────────────────────────────────

export async function fetchInsights(): Promise<InsightsResponse> {
  return serviceFetch<InsightsResponse>('community', '/v1/community/chatbot/insights', {
    auth: true,
  });
}

export async function computeRoute(goal: string): Promise<RoutingResponse> {
  return serviceFetch<RoutingResponse>('community', '/v1/community/chatbot/routing', {
    method: 'POST',
    auth: true,
    body: { goal },
  });
}
