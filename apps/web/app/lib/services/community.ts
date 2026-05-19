import { serviceFetch } from '../api-clients/service-fetch';

export type CommunityAuthor = {
  userId: string;
  username: string;
  avatarUrl?: string;
  reputation?: number;
  badges?: number;
};

export type CommunityQuestion = {
  id: string;
  title: string;
  body: string;
  author: CommunityAuthor;
  tags: string[];
  score: number;
  myVote?: 1 | 0 | -1;
  answerCount: number;
  acceptedAnswerId?: string | null;
  views?: number;
  createdAt: string;
  updatedAt?: string;
};

export type CommunityAnswer = {
  id: string;
  questionId: string;
  body: string;
  author: CommunityAuthor;
  score: number;
  myVote?: 1 | 0 | -1;
  accepted: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type CommunityThread = {
  id: string;
  courseId?: string;
  title: string;
  body?: string;
  author: CommunityAuthor;
  tags: string[];
  replyCount: number;
  pinned: boolean;
  closed: boolean;
  createdAt: string;
  lastActivityAt?: string;
};

export type CommunityPost = {
  id: string;
  threadId: string;
  body: string;
  author: CommunityAuthor;
  score: number;
  myVote?: 1 | 0 | -1;
  createdAt: string;
};

export type CommunityTag = {
  name: string;
  count: number;
  description?: string;
};

export type QuestionFilters = {
  q?: string;
  tag?: string;
  sort?: 'newest' | 'top' | 'unanswered' | 'active';
  page?: number;
  limit?: number;
};

export type ThreadFilters = {
  q?: string;
  tag?: string;
  pinned?: boolean;
  closed?: boolean;
  page?: number;
  limit?: number;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

type VoteValue = 1 | -1;

type LegacyVoteResponse = {
  message?: string;
  action?: string;
  voteValue?: number;
  votesCount?: number;
};

function toQuery(filters: Record<string, unknown>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
    }
  }
  return out;
}

function normalizeVoteResponse(
  body: LegacyVoteResponse
): { score: number; myVote: 1 | 0 | -1 } {
  const score = typeof body.votesCount === 'number' ? body.votesCount : 0;
  const raw = typeof body.voteValue === 'number' ? body.voteValue : 0;
  const myVote = raw === 1 ? 1 : raw === -1 ? -1 : 0;
  return { score, myVote };
}

// ── Wire shapes returned by the Railway backend ─────────────────────────────

type WireAuthor = {
  _id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  reputationScore?: number;
  reputation?: { total?: number };
};

type WireQuestion = {
  _id: string;
  title: string;
  body: string;
  author: WireAuthor;
  tags?: string[];
  votesCount?: number;
  myVote?: 1 | 0 | -1;
  answersCount?: number;
  acceptedAnswerId?: string | null;
  views?: number;
  createdAt: string;
  updatedAt?: string;
};

type WireAnswer = {
  _id: string;
  questionId: string;
  body: string;
  author: WireAuthor;
  votesCount?: number;
  myVote?: 1 | 0 | -1;
  accepted?: boolean;
  createdAt: string;
  updatedAt?: string;
};

type WireTag = { _id?: string; name: string; description?: string; usageCount?: number };

function normalizeAuthor(author: WireAuthor | null | undefined): CommunityAuthor {
  return {
    userId: author?._id ?? '',
    username: author?.name ?? 'Unknown',
    avatarUrl: author?.avatarUrl,
    reputation: author?.reputation?.total ?? author?.reputationScore,
  };
}

function normalizeQuestion(q: WireQuestion): CommunityQuestion {
  return {
    id: q._id,
    title: q.title,
    body: q.body,
    author: normalizeAuthor(q.author),
    tags: q.tags ?? [],
    score: q.votesCount ?? 0,
    myVote: q.myVote,
    answerCount: q.answersCount ?? 0,
    acceptedAnswerId: q.acceptedAnswerId ?? null,
    views: q.views,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

function normalizeAnswer(a: WireAnswer): CommunityAnswer {
  return {
    id: a._id,
    questionId: a.questionId,
    body: a.body,
    author: normalizeAuthor(a.author),
    score: a.votesCount ?? 0,
    myVote: a.myVote,
    accepted: a.accepted ?? false,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function normalizeTag(t: WireTag): CommunityTag {
  return { name: t.name, count: t.usageCount ?? 0, description: t.description };
}

// ── Questions ───────────────────────────────────────────────────────────────
// Reads are anonymous — matches the legacy dashboard's `auth: false` so that
// `/community` and `/community/q/[id]` render before sign-in.
export async function listQuestions(filters: QuestionFilters = {}) {
  const raw = await serviceFetch<unknown>('community', '/v1/community/questions', {
    auth: false,
    query: toQuery(filters),
  });
  const wire = raw as {
    questions?: WireQuestion[];
    pagination?: { page?: number; limit?: number; total?: number };
  } | WireQuestion[];
  const items = (Array.isArray(wire) ? wire : (wire.questions ?? [])).map(normalizeQuestion);
  const pag = Array.isArray(wire) ? null : (wire.pagination ?? null);
  return {
    items,
    total: pag?.total ?? items.length,
    page: pag?.page ?? filters.page ?? 1,
    limit: pag?.limit ?? filters.limit ?? items.length,
  } satisfies Paginated<CommunityQuestion>;
}

export async function getQuestion(questionId: string) {
  const raw = await serviceFetch<unknown>(
    'community',
    `/community/questions/${questionId}`,
    { auth: false }
  );
  const wire = raw as { question?: WireQuestion } | WireQuestion;
  const q = (wire as { question?: WireQuestion }).question ?? (wire as WireQuestion);
  return normalizeQuestion(q);
}

export async function createQuestion(payload: {
  title: string;
  body: string;
  tags?: string[];
}) {
  const raw = await serviceFetch<unknown>('community', '/v1/community/questions', {
    method: 'POST',
    auth: true,
    body: payload as Record<string, unknown>,
  });
  const wire = raw as { question?: WireQuestion } | WireQuestion;
  const q = (wire as { question?: WireQuestion }).question ?? (wire as WireQuestion);
  return normalizeQuestion(q);
}

export async function voteQuestion(questionId: string, direction: VoteValue) {
  const body = await serviceFetch<LegacyVoteResponse>('community', '/v1/community/votes', {
    method: 'POST',
    auth: true,
    body: { targetType: 'question', targetId: questionId, value: direction },
  });
  return normalizeVoteResponse(body);
}

// ── Answers ─────────────────────────────────────────────────────────────────
export async function listAnswers(questionId: string) {
  const raw = await serviceFetch<unknown>(
    'community',
    `/community/answers/question/${questionId}`,
    { auth: false }
  );
  const wire = raw as { answers?: WireAnswer[] } | WireAnswer[];
  const list = Array.isArray(wire) ? wire : (wire.answers ?? []);
  return list.map(normalizeAnswer);
}

export async function createAnswer(questionId: string, body: string) {
  const raw = await serviceFetch<unknown>(
    'community',
    `/community/answers/${questionId}`,
    {
      method: 'POST',
      auth: true,
      body: { body },
    }
  );
  const wire = raw as { answer?: WireAnswer } | WireAnswer;
  const a = (wire as { answer?: WireAnswer }).answer ?? (wire as WireAnswer);
  return normalizeAnswer(a);
}

export async function voteAnswer(answerId: string, direction: VoteValue) {
  const body = await serviceFetch<LegacyVoteResponse>('community', '/v1/community/votes', {
    method: 'POST',
    auth: true,
    body: { targetType: 'answer', targetId: answerId, value: direction },
  });
  return normalizeVoteResponse(body);
}

export async function acceptAnswer(answerId: string) {
  return serviceFetch<{ accepted: true }>(
    'community',
    `/community/answers/${answerId}/accept`,
    {
      method: 'PATCH',
      auth: true,
      body: {},
    }
  );
}

// ── Discussions / Threads ───────────────────────────────────────────────────
//
// The legacy backend exposes threads only PER COURSE. There is no global
// "all courses" list endpoint — the page must pick a course first.
export async function listThreads(courseId: string, filters: ThreadFilters = {}) {
  return serviceFetch<Paginated<CommunityThread>>(
    'community',
    `/community/threads/course/${courseId}`,
    {
      auth: true,
      query: toQuery(filters),
    }
  );
}

export async function getThread(threadId: string) {
  return serviceFetch<CommunityThread>(
    'community',
    `/community/threads/${threadId}`,
    { auth: true }
  );
}

export async function createThread(
  courseId: string,
  payload: {
    title: string;
    body?: string;
    tags?: string[];
  }
) {
  return serviceFetch<CommunityThread>(
    'community',
    `/community/threads/${courseId}`,
    {
      method: 'POST',
      auth: true,
      body: payload as Record<string, unknown>,
    }
  );
}

export async function setThreadPinned(threadId: string, pinned: boolean) {
  return serviceFetch<CommunityThread>(
    'community',
    `/community/threads/${threadId}/${pinned ? 'pin' : 'unpin'}`,
    {
      method: 'PATCH',
      auth: true,
      body: {},
    }
  );
}

export async function setThreadClosed(threadId: string, closed: boolean) {
  return serviceFetch<CommunityThread>(
    'community',
    `/community/threads/${threadId}/${closed ? 'close' : 'open'}`,
    {
      method: 'PATCH',
      auth: true,
      body: {},
    }
  );
}

// ── Posts ───────────────────────────────────────────────────────────────────
export async function listPosts(threadId: string) {
  return serviceFetch<CommunityPost[]>(
    'community',
    `/community/posts/thread/${threadId}`,
    { auth: true }
  );
}

export async function createPost(threadId: string, body: string) {
  return serviceFetch<CommunityPost>(
    'community',
    `/community/posts/${threadId}`,
    {
      method: 'POST',
      auth: true,
      body: { body },
    }
  );
}

export async function votePost(postId: string, direction: VoteValue) {
  const body = await serviceFetch<LegacyVoteResponse>('community', '/v1/community/votes', {
    method: 'POST',
    auth: true,
    body: { targetType: 'post', targetId: postId, value: direction },
  });
  return normalizeVoteResponse(body);
}

// ── Tags ────────────────────────────────────────────────────────────────────
export async function listTags(): Promise<CommunityTag[]> {
  const raw = await serviceFetch<unknown>(
    'community',
    '/community/tags',
    { auth: false }
  );
  const wire = raw as { tags?: WireTag[] } | WireTag[];
  const list = Array.isArray(wire) ? wire : (wire.tags ?? []);
  return list.map(normalizeTag);
}
