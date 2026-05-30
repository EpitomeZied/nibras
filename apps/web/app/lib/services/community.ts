import { serviceFetch } from '../api-clients/service-fetch';

export type CommunityAuthor = {
  userId: string;
  username: string;
  githubLogin?: string;
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

export type ThreadModerationStatus = 'visible' | 'hidden' | 'removed';

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
  moderationStatus?: ThreadModerationStatus;
  courseTitle?: string;
  courseCode?: string;
};

export type AdminDiscussionThread = CommunityThread & {
  moderationStatus: ThreadModerationStatus;
  courseId: string;
  courseTitle?: string;
  courseCode?: string;
};

export type AdminThreadFilters = {
  courseId?: string;
  q?: string;
  pinned?: boolean;
  closed?: boolean;
  status?: ThreadModerationStatus | 'all';
  page?: number;
  limit?: number;
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
  tags?: string[];
  authorId?: string;
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

function normalizeVoteResponse(body: LegacyVoteResponse): { score: number; myVote: 1 | 0 | -1 } {
  const score = typeof body.votesCount === 'number' ? body.votesCount : 0;
  const raw = typeof body.voteValue === 'number' ? body.voteValue : 0;
  const myVote = raw === 1 ? 1 : raw === -1 ? -1 : 0;
  return { score, myVote };
}

// ── Wire shapes returned by the Railway backend ─────────────────────────────

type WireAuthor = {
  _id?: string;
  userId?: string;
  name?: string;
  username?: string;
  email?: string;
  githubLogin?: string;
  avatarUrl?: string;
  reputationScore?: number;
  reputation?: { total?: number };
};

type WireQuestion = {
  _id?: string;
  id?: string;
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
  _id?: string;
  id?: string;
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
  const githubLogin = author?.githubLogin;
  return {
    userId: author?._id ?? author?.userId ?? '',
    username: author?.name ?? author?.username ?? 'Unknown',
    githubLogin,
    avatarUrl: author?.avatarUrl,
    reputation: author?.reputation?.total ?? author?.reputationScore,
  };
}

function normalizeQuestion(q: WireQuestion & { viewCount?: number }): CommunityQuestion {
  return {
    id: q._id ?? q.id ?? '',
    title: q.title,
    body: q.body,
    author: normalizeAuthor(q.author),
    tags: q.tags ?? [],
    score: q.votesCount ?? 0,
    myVote: q.myVote,
    answerCount: q.answersCount ?? 0,
    acceptedAnswerId: q.acceptedAnswerId ?? null,
    views: q.views ?? q.viewCount,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

function normalizeAnswer(a: WireAnswer): CommunityAnswer {
  return {
    id: a._id ?? a.id ?? '',
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
  const { tags, ...rest } = filters;
  const query = toQuery(rest);
  if (tags && tags.length > 0) {
    (query as Record<string, string | number | boolean>).tags = tags.join(',');
  }
  const raw = await serviceFetch<unknown>('community', '/v1/community/questions', {
    auth: false,
    query,
  });
  const wire = raw as
    | {
        questions?: WireQuestion[];
        pagination?: { page?: number; limit?: number; total?: number };
      }
    | WireQuestion[];
  const items = (Array.isArray(wire) ? wire : (wire.questions ?? [])).map(normalizeQuestion);
  const pag = Array.isArray(wire) ? null : (wire.pagination ?? null);
  return {
    items,
    total: pag?.total ?? items.length,
    page: pag?.page ?? filters.page ?? 1,
    limit: pag?.limit ?? filters.limit ?? items.length,
  } satisfies Paginated<CommunityQuestion>;
}

export async function getQuestion(
  questionId: string
): Promise<{ question: CommunityQuestion; answers: CommunityAnswer[] }> {
  const raw = await serviceFetch<unknown>('community', `/v1/community/questions/${questionId}`, {
    auth: false,
  });
  const wire = raw as
    | { question?: WireQuestion & { answers?: WireAnswer[] }; answers?: WireAnswer[] }
    | (WireQuestion & { answers?: WireAnswer[] });
  const q =
    (wire as { question?: WireQuestion & { answers?: WireAnswer[] } }).question ??
    (wire as WireQuestion & { answers?: WireAnswer[] });
  // Prefer the top-level answers array — it includes legacy `_id` aliases. Nested
  // `question.answers` only has Prisma `id` fields and breaks accept/vote actions.
  const inlineAnswers = (wire as { answers?: WireAnswer[] }).answers ?? q.answers ?? [];
  return { question: normalizeQuestion(q), answers: inlineAnswers.map(normalizeAnswer) };
}

export async function createQuestion(payload: { title: string; body: string; tags?: string[] }) {
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
    `/v1/community/answers/question/${questionId}`,
    { auth: false }
  );
  const wire = raw as { answers?: WireAnswer[] } | WireAnswer[];
  const list = Array.isArray(wire) ? wire : (wire.answers ?? []);
  return list.map(normalizeAnswer);
}

export async function createAnswer(questionId: string, body: string) {
  const raw = await serviceFetch<unknown>('community', `/v1/community/answers/${questionId}`, {
    method: 'POST',
    auth: true,
    body: { body },
  });
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
  return serviceFetch<{ accepted: true }>('community', `/v1/community/answers/${answerId}/accept`, {
    method: 'PATCH',
    auth: true,
    body: {},
  });
}

// ── Discussions / Threads ───────────────────────────────────────────────────
//
// The legacy backend exposes threads only PER COURSE. There is no global
// "all courses" list endpoint — the page must pick a course first.
export async function listDiscussionCourses(): Promise<
  Array<{ id: string; title: string; courseCode: string }>
> {
  const raw = await serviceFetch<unknown>('community', '/v1/community/discussion-courses', {
    auth: false,
  });
  const wire = raw as { courses?: Array<{ id: string; title: string; courseCode: string }> };
  return wire.courses ?? [];
}

export async function listThreads(courseId: string, filters: ThreadFilters = {}) {
  return serviceFetch<Paginated<CommunityThread>>(
    'community',
    `/v1/community/threads/course/${courseId}`,
    {
      auth: false,
      query: toQuery(filters),
    }
  );
}

export async function getThread(threadId: string) {
  return serviceFetch<CommunityThread>('community', `/v1/community/threads/${threadId}`, {
    auth: false,
  });
}

export async function createThread(
  courseId: string,
  payload: {
    title: string;
    body?: string;
    tags?: string[];
  }
) {
  return serviceFetch<CommunityThread>('community', `/v1/community/threads/${courseId}`, {
    method: 'POST',
    auth: true,
    body: payload as Record<string, unknown>,
  });
}

export async function setThreadPinned(threadId: string, pinned: boolean) {
  return serviceFetch<CommunityThread>(
    'community',
    `/v1/community/threads/${threadId}/${pinned ? 'pin' : 'unpin'}`,
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
    `/v1/community/threads/${threadId}/${closed ? 'close' : 'open'}`,
    {
      method: 'PATCH',
      auth: true,
      body: {},
    }
  );
}

// ── Posts ───────────────────────────────────────────────────────────────────
export async function listPosts(threadId: string) {
  return serviceFetch<CommunityPost[]>('community', `/v1/community/posts/thread/${threadId}`, {
    auth: false,
  });
}

export async function createPost(threadId: string, body: string) {
  return serviceFetch<CommunityPost>('community', `/v1/community/posts/${threadId}`, {
    method: 'POST',
    auth: true,
    body: { body },
  });
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
  const raw = await serviceFetch<unknown>('community', '/v1/community/tags', { auth: false });
  const wire = raw as { tags?: WireTag[] } | WireTag[];
  const list = Array.isArray(wire) ? wire : (wire.tags ?? []);
  return list.map(normalizeTag);
}

export type AdminCommunityTag = {
  id: string;
  name: string;
  description: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

type WireAdminTag = {
  _id?: string;
  id?: string;
  name: string;
  description?: string | null;
  usageCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

function normalizeAdminTag(t: WireAdminTag): AdminCommunityTag {
  return {
    id: t._id ?? t.id ?? '',
    name: t.name,
    description: t.description ?? null,
    usageCount: t.usageCount ?? 0,
    createdAt: t.createdAt ?? '',
    updatedAt: t.updatedAt ?? '',
  };
}

export async function listTagsAdmin(): Promise<AdminCommunityTag[]> {
  const raw = await serviceFetch<unknown>('community', '/v1/community/tags/admin', { auth: true });
  const wire = raw as { tags?: WireAdminTag[] } | WireAdminTag[];
  const list = Array.isArray(wire) ? wire : (wire.tags ?? []);
  return list.map(normalizeAdminTag);
}

export async function createTag(payload: { name: string; description?: string }) {
  const raw = await serviceFetch<unknown>('community', '/v1/community/tags', {
    method: 'POST',
    auth: true,
    body: payload as Record<string, unknown>,
  });
  const wire = raw as { tag?: WireAdminTag } | WireAdminTag;
  const t = (wire as { tag?: WireAdminTag }).tag ?? (wire as WireAdminTag);
  return normalizeAdminTag(t);
}

export async function updateTag(tagId: string, payload: { name?: string; description?: string }) {
  const raw = await serviceFetch<unknown>('community', `/v1/community/tags/${tagId}`, {
    method: 'PUT',
    auth: true,
    body: payload as Record<string, unknown>,
  });
  const wire = raw as { tag?: WireAdminTag } | WireAdminTag;
  const t = (wire as { tag?: WireAdminTag }).tag ?? (wire as WireAdminTag);
  return normalizeAdminTag(t);
}

export async function deleteTag(tagId: string) {
  return serviceFetch<{ deleted: true }>('community', `/v1/community/tags/${tagId}`, {
    method: 'DELETE',
    auth: true,
    body: {},
  });
}

// ── Bookmarks (server) ──────────────────────────────────────────────────────
export async function listBookmarkIds(): Promise<string[]> {
  const raw = await serviceFetch<{ questionIds?: string[] }>(
    'community',
    '/v1/community/bookmarks',
    {
      auth: true,
    }
  );
  return raw.questionIds ?? [];
}

export async function toggleQuestionBookmark(
  questionId: string,
  on: boolean
): Promise<{ bookmarked: boolean }> {
  return serviceFetch<{ bookmarked: boolean }>(
    'community',
    `/v1/community/questions/${questionId}/bookmark`,
    { method: on ? 'POST' : 'DELETE', auth: true, body: {} }
  );
}

// ── Reports ─────────────────────────────────────────────────────────────────
export type CommunityReportTarget = 'question' | 'answer' | 'post' | 'thread';

export async function createReport(payload: {
  targetType: CommunityReportTarget;
  targetId: string;
  reason: string;
  details?: string;
}) {
  return serviceFetch<{ report: { id: string } }>('community', '/v1/community/reports', {
    method: 'POST',
    auth: true,
    body: payload as Record<string, unknown>,
  });
}

export type AdminReport = {
  id: string;
  targetType: CommunityReportTarget;
  targetId: string;
  reason: string;
  details?: string | null;
  status: string;
  resolution?: string | null;
  createdAt: string;
  reporter: CommunityAuthor;
  threadId?: string;
  contentUrl?: string;
};

export async function listReportsAdmin(status = 'pending') {
  const raw = await serviceFetch<{
    reports?: Array<AdminReport & { _id?: string }>;
  }>('community', '/v1/community/reports', { auth: true, query: { status } });
  return (raw.reports ?? []).map((r) => ({ ...r, id: r._id ?? r.id }));
}

export async function reviewReport(reportId: string, action: 'dismiss' | 'hide' | 'remove') {
  return serviceFetch<{ reviewed: boolean }>('community', `/v1/community/reports/${reportId}`, {
    method: 'PATCH',
    auth: true,
    body: { action },
  });
}

// ── Edit / delete ───────────────────────────────────────────────────────────
export async function updateQuestion(
  questionId: string,
  payload: { title?: string; body?: string; tags?: string[] }
) {
  return serviceFetch<{ question: CommunityQuestion }>(
    'community',
    `/v1/community/questions/${questionId}`,
    { method: 'PATCH', auth: true, body: payload as Record<string, unknown> }
  );
}

export async function deleteQuestion(questionId: string) {
  return serviceFetch<{ deleted: true }>('community', `/v1/community/questions/${questionId}`, {
    method: 'DELETE',
    auth: true,
    body: {},
  });
}

export async function updateAnswer(answerId: string, body: string) {
  return serviceFetch<{ answer: CommunityAnswer }>(
    'community',
    `/v1/community/answers/${answerId}`,
    {
      method: 'PATCH',
      auth: true,
      body: { body },
    }
  );
}

export async function deleteAnswer(answerId: string) {
  return serviceFetch<{ deleted: true }>('community', `/v1/community/answers/${answerId}`, {
    method: 'DELETE',
    auth: true,
    body: {},
  });
}

export async function updatePost(postId: string, body: string) {
  return serviceFetch<{ post: CommunityPost }>('community', `/v1/community/posts/${postId}`, {
    method: 'PATCH',
    auth: true,
    body: { body },
  });
}

export async function deletePost(postId: string) {
  return serviceFetch<{ deleted: true }>('community', `/v1/community/posts/${postId}`, {
    method: 'DELETE',
    auth: true,
    body: {},
  });
}

export async function listThreadsAcrossCourses(filters: ThreadFilters = {}) {
  return serviceFetch<Paginated<CommunityThread>>('community', '/v1/community/threads/me', {
    auth: true,
    query: toQuery(filters),
  });
}

type DiscussionUser = {
  id?: string;
  systemRole?: string | null;
  memberships?: Array<{ courseId: string; role: string }>;
};

export function canModerateDiscussion(
  user: DiscussionUser | null | undefined,
  courseId?: string
): boolean {
  if (!user) return false;
  if (user.systemRole === 'admin') return true;
  if (!courseId) return false;
  return (user.memberships ?? []).some(
    (m) => m.courseId === courseId && ['instructor', 'ta'].includes(m.role.toLowerCase())
  );
}

export function canEditDiscussionContent(
  user: DiscussionUser | null | undefined,
  authorId: string,
  courseId?: string
): boolean {
  if (!user) return false;
  if (user.id === authorId) return true;
  return canModerateDiscussion(user, courseId);
}

export async function listThreadsAdmin(filters: AdminThreadFilters = {}) {
  const { status, ...rest } = filters;
  const query = toQuery({
    ...rest,
    ...(status && status !== 'all' ? { status } : status === 'all' ? { status: 'all' } : {}),
  });
  return serviceFetch<Paginated<AdminDiscussionThread>>(
    'community',
    '/v1/community/threads/admin',
    {
      auth: true,
      query,
    }
  );
}

export async function setThreadModeration(threadId: string, status: ThreadModerationStatus) {
  return serviceFetch<AdminDiscussionThread>(
    'community',
    `/v1/community/threads/${threadId}/moderation`,
    { method: 'PATCH', auth: true, body: { status } }
  );
}

export async function updateThread(
  threadId: string,
  payload: { title?: string; body?: string; tags?: string[] }
) {
  return serviceFetch<CommunityThread>('community', `/v1/community/threads/${threadId}/content`, {
    method: 'PATCH',
    auth: true,
    body: payload as Record<string, unknown>,
  });
}
