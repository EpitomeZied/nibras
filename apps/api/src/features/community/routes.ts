import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

type CommunityVoteTargetType = 'question' | 'answer' | 'post';
import { requireUser } from '../../lib/auth';
import { Errors } from '../../lib/errors';
import { requestBaseUrl } from '../../lib/request-base-url';
import { AppStore } from '../../store';

const authorSelect = { id: true, username: true } as const;

function presentAuthor(author: { id: string; username: string }) {
  return {
    _id: author.id,
    userId: author.id,
    name: author.username,
    username: author.username,
  };
}

export function registerCommunityRoutes(
  app: FastifyInstance,
  store: AppStore,
  prisma: PrismaClient
): void {
  // ── Questions ───────────────────────────────────────────────────────────

  app.get(
    '/v1/community/questions',
    { schema: { tags: ['community'], summary: 'List community questions' } },
    async (request) => {
      const query = request.query as {
        q?: string;
        tag?: string;
        sort?: string;
        page?: string;
        limit?: string;
      };
      const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '30', 10) || 30));
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};
      if (query.q) {
        where.OR = [
          { title: { contains: query.q, mode: 'insensitive' } },
          { body: { contains: query.q, mode: 'insensitive' } },
        ];
      }
      if (query.tag) {
        where.tags = { has: query.tag };
      }

      const orderBy =
        query.sort === 'top'
          ? { votesCount: 'desc' as const }
          : query.sort === 'unanswered'
            ? { answersCount: 'asc' as const }
            : { createdAt: 'desc' as const };

      const [questions, total] = await Promise.all([
        prisma.communityQuestion.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: { author: { select: authorSelect } },
        }),
        prisma.communityQuestion.count({ where }),
      ]);

      return {
        questions: questions.map((q) => ({
          ...q,
          _id: q.id,
          author: presentAuthor(q.author),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }
  );

  app.get(
    '/v1/community/questions/:questionId',
    { schema: { tags: ['community'], summary: 'Get a community question' } },
    async (request, reply) => {
      const { questionId } = request.params as { questionId: string };
      const question = await prisma.communityQuestion.findUnique({
        where: { id: questionId },
        include: {
          author: { select: authorSelect },
          answers: { include: { author: { select: authorSelect } }, orderBy: { createdAt: 'asc' } },
        },
      });
      if (!question) {
        reply.code(404).send(Errors.notFound('Question'));
        return;
      }
      return {
        question: {
          ...question,
          _id: question.id,
          author: presentAuthor(question.author),
        },
        answers: question.answers.map((a) => ({
          ...a,
          _id: a.id,
          author: presentAuthor(a.author),
        })),
      };
    }
  );

  app.post(
    '/v1/community/questions',
    { schema: { tags: ['community'], summary: 'Create a community question' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as { title?: string; body?: string; tags?: string[] };
      if (!body.title?.trim() || !body.body?.trim()) {
        reply.code(400).send(Errors.validation('Title and body are required.'));
        return;
      }
      const tags = body.tags ?? [];
      const [question] = await prisma.$transaction([
        prisma.communityQuestion.create({
          data: {
            authorId: auth.user.id,
            title: body.title.trim(),
            body: body.body.trim(),
            tags,
          },
          include: { author: { select: authorSelect } },
        }),
        ...tags.map((tag) =>
          prisma.communityTag.upsert({
            where: { name: tag },
            create: { name: tag, usageCount: 1 },
            update: { usageCount: { increment: 1 } },
          })
        ),
      ]);
      reply.code(201);
      return {
        question: { ...question, _id: question.id, author: presentAuthor(question.author) },
      };
    }
  );

  // ── Answers ─────────────────────────────────────────────────────────────

  app.get(
    '/v1/community/answers/question/:questionId',
    { schema: { tags: ['community'], summary: 'List answers for a question' } },
    async (request, reply) => {
      const { questionId } = request.params as { questionId: string };
      const question = await prisma.communityQuestion.findUnique({ where: { id: questionId } });
      if (!question) {
        reply.code(404).send(Errors.notFound('Question'));
        return;
      }
      const answers = await prisma.communityAnswer.findMany({
        where: { questionId },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: authorSelect } },
      });
      return {
        answers: answers.map((a) => ({
          ...a,
          _id: a.id,
          author: presentAuthor(a.author),
        })),
      };
    }
  );

  app.post(
    '/v1/community/answers/:questionId',
    { schema: { tags: ['community'], summary: 'Create an answer' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { questionId } = request.params as { questionId: string };
      const body = request.body as { body?: string };
      if (!body.body?.trim()) {
        reply.code(400).send(Errors.validation('Answer body is required.'));
        return;
      }
      const question = await prisma.communityQuestion.findUnique({ where: { id: questionId } });
      if (!question) {
        reply.code(404).send(Errors.notFound('Question'));
        return;
      }
      const answer = await prisma.communityAnswer.create({
        data: {
          questionId,
          authorId: auth.user.id,
          body: body.body.trim(),
        },
        include: { author: { select: authorSelect } },
      });
      const answerCount = await prisma.communityAnswer.count({ where: { questionId } });
      await prisma.communityQuestion.update({
        where: { id: questionId },
        data: { answersCount: answerCount },
      });
      if (question.authorId !== auth.user.id) {
        void store.createNotification(requestBaseUrl(request), question.authorId, {
          type: 'community_answer',
          title: 'New answer',
          body: `${auth.user.username} answered your question "${question.title.slice(0, 80)}".`,
          link: `/community/q/${questionId}`,
        });
      }
      reply.code(201);
      return { answer: { ...answer, _id: answer.id, author: presentAuthor(answer.author) } };
    }
  );

  app.patch(
    '/v1/community/answers/:answerId/accept',
    { schema: { tags: ['community'], summary: 'Accept an answer' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { answerId } = request.params as { answerId: string };
      const answer = await prisma.communityAnswer.findUnique({
        where: { id: answerId },
        include: { question: true },
      });
      if (!answer) {
        reply.code(404).send(Errors.notFound('Answer'));
        return;
      }
      if (answer.question.authorId !== auth.user.id && auth.user.systemRole !== 'admin') {
        reply.code(403).send(Errors.forbidden());
        return;
      }
      await prisma.$transaction([
        prisma.communityAnswer.updateMany({
          where: { questionId: answer.questionId, accepted: true },
          data: { accepted: false },
        }),
        prisma.communityAnswer.update({
          where: { id: answerId },
          data: { accepted: true },
        }),
        prisma.communityQuestion.update({
          where: { id: answer.questionId },
          data: { acceptedAnswerId: answerId },
        }),
      ]);
      if (answer.authorId !== auth.user.id) {
        void store.createNotification(requestBaseUrl(request), answer.authorId, {
          type: 'community_answer_accepted',
          title: 'Answer accepted',
          body: `Your answer was accepted on "${answer.question.title.slice(0, 80)}".`,
          link: `/community/q/${answer.questionId}`,
        });
      }
      return { accepted: true };
    }
  );

  // ── Votes ───────────────────────────────────────────────────────────────

  app.post(
    '/v1/community/votes',
    { schema: { tags: ['community'], summary: 'Cast a vote' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as { targetType?: string; targetId?: string; value?: number };
      if (!body.targetType || !body.targetId || body.value === undefined) {
        reply.code(400).send(Errors.validation('targetType, targetId, and value are required.'));
        return;
      }
      const validTypes: CommunityVoteTargetType[] = ['question', 'answer', 'post'];
      if (!validTypes.includes(body.targetType as CommunityVoteTargetType)) {
        reply.code(400).send(Errors.validation('targetType must be question, answer, or post.'));
        return;
      }
      const targetType = body.targetType as CommunityVoteTargetType;
      const value = body.value === 1 ? 1 : body.value === -1 ? -1 : 0;

      const existing = await prisma.communityVote.findUnique({
        where: {
          userId_targetType_targetId: { userId: auth.user.id, targetType, targetId: body.targetId },
        },
      });

      let action: string;
      let delta: number;

      if (value === 0 && existing) {
        await prisma.communityVote.delete({ where: { id: existing.id } });
        delta = -existing.value;
        action = 'removed';
      } else if (value === 0) {
        return { action: 'none', voteValue: 0, votesCount: 0 };
      } else if (existing) {
        if (existing.value === value) {
          await prisma.communityVote.delete({ where: { id: existing.id } });
          delta = -value;
          action = 'toggled';
        } else {
          await prisma.communityVote.update({ where: { id: existing.id }, data: { value } });
          delta = value - existing.value;
          action = 'changed';
        }
      } else {
        await prisma.communityVote.create({
          data: { userId: auth.user.id, targetType, targetId: body.targetId, value },
        });
        delta = value;
        action = 'voted';
      }

      let votesCount = 0;
      if (targetType === 'question') {
        const updated = await prisma.communityQuestion.update({
          where: { id: body.targetId },
          data: { votesCount: { increment: delta } },
        });
        votesCount = updated.votesCount;
      } else if (targetType === 'answer') {
        const updated = await prisma.communityAnswer.update({
          where: { id: body.targetId },
          data: { votesCount: { increment: delta } },
        });
        votesCount = updated.votesCount;
      } else if (targetType === 'post') {
        const updated = await prisma.communityPost.update({
          where: { id: body.targetId },
          data: { votesCount: { increment: delta } },
        });
        votesCount = updated.votesCount;
      }

      if (action === 'voted' && value === 1) {
        let contentAuthorId: string | null = null;
        let contentTitle = '';
        let contentLink = '';
        if (targetType === 'question') {
          const q = await prisma.communityQuestion.findUnique({
            where: { id: body.targetId },
            select: { authorId: true, title: true },
          });
          if (q) {
            contentAuthorId = q.authorId;
            contentTitle = q.title;
            contentLink = `/community/q/${body.targetId}`;
          }
        } else if (targetType === 'answer') {
          const a = await prisma.communityAnswer.findUnique({
            where: { id: body.targetId },
            select: { authorId: true, questionId: true },
          });
          if (a) {
            contentAuthorId = a.authorId;
            contentLink = `/community/q/${a.questionId}`;
            contentTitle = 'your answer';
          }
        } else if (targetType === 'post') {
          const p = await prisma.communityPost.findUnique({
            where: { id: body.targetId },
            select: { authorId: true, threadId: true },
          });
          if (p) {
            contentAuthorId = p.authorId;
            contentLink = `/community/discussions/${p.threadId}`;
            contentTitle = 'your post';
          }
        }
        if (contentAuthorId && contentAuthorId !== auth.user.id) {
          void store.createNotification(requestBaseUrl(request), contentAuthorId, {
            type: 'community_vote',
            title: 'Upvote',
            body: `${auth.user.username} upvoted ${contentTitle.startsWith('your') ? contentTitle : `"${contentTitle.slice(0, 80)}"`}.`,
            link: contentLink,
          });
        }
      }

      const currentVote = await prisma.communityVote.findUnique({
        where: {
          userId_targetType_targetId: { userId: auth.user.id, targetType, targetId: body.targetId },
        },
      });

      return { action, voteValue: currentVote?.value ?? 0, votesCount };
    }
  );

  // ── Tags ────────────────────────────────────────────────────────────────

  app.get(
    '/v1/community/tags',
    { schema: { tags: ['community'], summary: 'List community tags' } },
    async () => {
      const tags = await prisma.communityTag.findMany({ orderBy: { usageCount: 'desc' } });
      return { tags: tags.map((t) => ({ ...t, _id: t.id })) };
    }
  );

  // ── Threads ─────────────────────────────────────────────────────────────

  app.get(
    '/v1/community/threads/course/:courseId',
    { schema: { tags: ['community'], summary: 'List threads for a course' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { courseId } = request.params as { courseId: string };
      const query = request.query as { q?: string; page?: string; limit?: string };
      const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(query.limit || '30', 10) || 30));
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = { courseId };
      if (query.q) {
        where.OR = [
          { title: { contains: query.q, mode: 'insensitive' } },
          { body: { contains: query.q, mode: 'insensitive' } },
        ];
      }

      const [threads, total] = await Promise.all([
        prisma.communityThread.findMany({
          where,
          orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
          skip,
          take: limit,
          include: { author: { select: authorSelect } },
        }),
        prisma.communityThread.count({ where }),
      ]);

      return {
        items: threads.map((t) => ({
          ...t,
          _id: t.id,
          author: presentAuthor(t.author),
          replyCount: t.postsCount,
        })),
        total,
        page,
        limit,
      };
    }
  );

  app.get(
    '/v1/community/threads/:threadId',
    { schema: { tags: ['community'], summary: 'Get a thread' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { threadId } = request.params as { threadId: string };
      const thread = await prisma.communityThread.findUnique({
        where: { id: threadId },
        include: { author: { select: authorSelect } },
      });
      if (!thread) {
        reply.code(404).send(Errors.notFound('Thread'));
        return;
      }
      return {
        ...thread,
        _id: thread.id,
        author: presentAuthor(thread.author),
        replyCount: thread.postsCount,
      };
    }
  );

  app.post(
    '/v1/community/threads/:courseId',
    { schema: { tags: ['community'], summary: 'Create a thread' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { courseId } = request.params as { courseId: string };
      const body = request.body as { title?: string; body?: string; tags?: string[] };
      if (!body.title?.trim()) {
        reply.code(400).send(Errors.validation('Title is required.'));
        return;
      }
      const thread = await prisma.communityThread.create({
        data: {
          courseId,
          authorId: auth.user.id,
          title: body.title.trim(),
          body: body.body?.trim() ?? '',
          tags: body.tags ?? [],
        },
        include: { author: { select: authorSelect } },
      });
      reply.code(201);
      return { ...thread, _id: thread.id, author: presentAuthor(thread.author), replyCount: 0 };
    }
  );

  app.patch(
    '/v1/community/threads/:threadId/pin',
    { schema: { tags: ['community'], summary: 'Pin a thread' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { threadId } = request.params as { threadId: string };
      const thread = await prisma.communityThread.update({
        where: { id: threadId },
        data: { pinned: true },
        include: { author: { select: authorSelect } },
      });
      return {
        ...thread,
        _id: thread.id,
        author: presentAuthor(thread.author),
        replyCount: thread.postsCount,
      };
    }
  );

  app.patch(
    '/v1/community/threads/:threadId/unpin',
    { schema: { tags: ['community'], summary: 'Unpin a thread' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { threadId } = request.params as { threadId: string };
      const thread = await prisma.communityThread.update({
        where: { id: threadId },
        data: { pinned: false },
        include: { author: { select: authorSelect } },
      });
      return {
        ...thread,
        _id: thread.id,
        author: presentAuthor(thread.author),
        replyCount: thread.postsCount,
      };
    }
  );

  app.patch(
    '/v1/community/threads/:threadId/close',
    { schema: { tags: ['community'], summary: 'Close a thread' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { threadId } = request.params as { threadId: string };
      const thread = await prisma.communityThread.update({
        where: { id: threadId },
        data: { closed: true },
        include: { author: { select: authorSelect } },
      });
      return {
        ...thread,
        _id: thread.id,
        author: presentAuthor(thread.author),
        replyCount: thread.postsCount,
      };
    }
  );

  app.patch(
    '/v1/community/threads/:threadId/open',
    { schema: { tags: ['community'], summary: 'Open a thread' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { threadId } = request.params as { threadId: string };
      const thread = await prisma.communityThread.update({
        where: { id: threadId },
        data: { closed: false },
        include: { author: { select: authorSelect } },
      });
      return {
        ...thread,
        _id: thread.id,
        author: presentAuthor(thread.author),
        replyCount: thread.postsCount,
      };
    }
  );

  // ── Posts ────────────────────────────────────────────────────────────────

  app.get(
    '/v1/community/posts/thread/:threadId',
    { schema: { tags: ['community'], summary: 'List posts in a thread' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { threadId } = request.params as { threadId: string };
      const posts = await prisma.communityPost.findMany({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: authorSelect } },
      });
      return posts.map((p) => ({ ...p, _id: p.id, author: presentAuthor(p.author) }));
    }
  );

  app.post(
    '/v1/community/posts/:threadId',
    { schema: { tags: ['community'], summary: 'Create a post in a thread' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { threadId } = request.params as { threadId: string };
      const body = request.body as { body?: string };
      if (!body.body?.trim()) {
        reply.code(400).send(Errors.validation('Post body is required.'));
        return;
      }
      const thread = await prisma.communityThread.findUnique({ where: { id: threadId } });
      if (!thread) {
        reply.code(404).send(Errors.notFound('Thread'));
        return;
      }
      if (thread.closed) {
        reply.code(400).send(Errors.validation('Thread is closed.'));
        return;
      }
      const post = await prisma.communityPost.create({
        data: {
          threadId,
          authorId: auth.user.id,
          body: body.body.trim(),
        },
        include: { author: { select: authorSelect } },
      });
      await prisma.communityThread.update({
        where: { id: threadId },
        data: { postsCount: { increment: 1 } },
      });
      if (thread.authorId !== auth.user.id) {
        void store.createNotification(requestBaseUrl(request), thread.authorId, {
          type: 'community_reply',
          title: 'New reply',
          body: `${auth.user.username} replied in "${thread.title.slice(0, 80)}".`,
          link: `/community/discussions/${threadId}`,
        });
      }
      reply.code(201);
      return { ...post, _id: post.id, author: presentAuthor(post.author) };
    }
  );

  // ── Chatbot ─────────────────────────────────────────────────────────────

  const CHATBOT_V1_URL = process.env.CHATBOT_V1_URL || '';

  app.post(
    '/v1/community/chatbot/ask',
    { schema: { tags: ['community'], summary: 'Ask the AI tutor' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as {
        question?: string;
        context?: string;
        history?: Array<{ role: string; content: string }>;
        conversationId?: string;
      };
      if (!body.question?.trim()) {
        reply.code(400).send(Errors.validation('Question is required.'));
        return;
      }
      if (!CHATBOT_V1_URL) {
        reply.code(503).send(Errors.unavailable('AI Tutor service is not configured.'));
        return;
      }
      try {
        const resp = await fetch(`${CHATBOT_V1_URL}/api/ask`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: body.question,
            history: body.history ?? [],
          }),
          signal: AbortSignal.timeout(30000),
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          reply
            .code(502)
            .send(
              Errors.unavailable(`AI Tutor service returned ${resp.status}: ${text.slice(0, 200)}`)
            );
          return;
        }
        const chatBotResponse = (await resp.json()) as {
          type?: string;
          data?: {
            answer?: string;
            hints?: string[];
            tags?: string[];
            question_id?: string;
            question?: string;
            match_score?: number;
            xai?: {
              reasoning?: string;
              concepts_used?: string[];
              might_be_unclear?: string[];
            };
          };
          message?: string;
        };
        if (chatBotResponse.type === 'refused') {
          return {
            answer:
              chatBotResponse.message || 'This question is outside the scope of this platform.',
            refused: true,
            hints: [],
            tags: [],
            xai: null,
          };
        }
        const data = chatBotResponse.data;
        const result = {
          answer: data?.answer || '',
          hints: data?.hints || [],
          tags: data?.tags || [],
          communityQuestion: data?.question_id || null,
          matchScore: data?.match_score || null,
          xai: data?.xai || null,
        };

        if (body.conversationId) {
          try {
            const conv = await prisma.tutorConversation.findFirst({
              where: { id: body.conversationId, userId: auth.user.id },
            });
            if (conv) {
              await prisma.tutorMessage.createMany({
                data: [
                  {
                    conversationId: conv.id,
                    role: 'user',
                    content: body.question!,
                    tags: [],
                    xaiConcepts: [],
                    xaiUnclear: [],
                  },
                  {
                    conversationId: conv.id,
                    role: 'assistant',
                    content: result.answer,
                    tags: result.tags,
                    xaiReasoning: result.xai?.reasoning ?? null,
                    xaiConcepts: result.xai?.concepts_used ?? [],
                    xaiUnclear: result.xai?.might_be_unclear ?? [],
                    responseType: chatBotResponse.type ?? null,
                    communityQuestionId: result.communityQuestion,
                    matchScore: result.matchScore,
                  },
                ],
              });
              await prisma.tutorConversation.update({
                where: { id: conv.id },
                data: { updatedAt: new Date() },
              });
            }
          } catch {
            // persistence failure is non-critical
          }
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        reply.code(502).send(Errors.unavailable(`AI Tutor request failed: ${message}`));
      }
    }
  );

  app.post(
    '/v1/community/chatbot/publish',
    { schema: { tags: ['community'], summary: 'Publish a chatbot exchange as a Q&A' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as {
        question?: string;
        answer?: string;
        title?: string;
        tags?: string[];
      };
      if (!body.question || !body.answer) {
        reply.code(400).send(Errors.validation('question and answer are required.'));
        return;
      }
      const question = await prisma.communityQuestion.create({
        data: {
          authorId: auth.user.id,
          title: body.title || body.question.slice(0, 120),
          body: body.question,
          tags: body.tags ?? [],
        },
      });
      await prisma.communityAnswer.create({
        data: {
          questionId: question.id,
          authorId: auth.user.id,
          body: body.answer,
        },
      });
      const publishedCount = await prisma.communityAnswer.count({
        where: { questionId: question.id },
      });
      await prisma.communityQuestion.update({
        where: { id: question.id },
        data: { answersCount: publishedCount },
      });
      return { questionId: question.id, url: `/community/q/${question.id}` };
    }
  );

  // ── Chatbot insights ─────────────────────────────────────────────────────

  app.get(
    '/v1/community/chatbot/insights',
    { schema: { tags: ['community'], summary: 'Get learning insights' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [totalQuestions, totalConversations, weeklyQuestions, tagRows] = await Promise.all([
        prisma.tutorMessage.count({
          where: { conversation: { userId: auth.user.id }, role: 'user' },
        }),
        prisma.tutorConversation.count({ where: { userId: auth.user.id } }),
        prisma.tutorMessage.count({
          where: {
            conversation: { userId: auth.user.id },
            role: 'user',
            createdAt: { gte: weekAgo },
          },
        }),
        prisma.tutorMessage.findMany({
          where: { conversation: { userId: auth.user.id }, role: 'assistant' },
          select: { tags: true, createdAt: true },
        }),
      ]);

      const tagCounts: Record<string, number> = {};
      let streakDays = 0;
      const activeDays = new Set<string>();
      for (const row of tagRows) {
        for (const t of row.tags) {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        }
        activeDays.add(row.createdAt.toISOString().slice(0, 10));
      }

      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (activeDays.has(d.toISOString().slice(0, 10))) {
          streakDays++;
        } else {
          break;
        }
      }

      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([tag, count]) => ({ tag, count }));

      const stats = { totalQuestions, totalConversations, streakDays, weeklyQuestions, topTags };

      if (!CHATBOT_V1_URL || totalQuestions === 0) {
        return {
          hardMetrics: stats,
          aiSummary: {
            strengths: [],
            weaknesses: [],
            nextActions: [
              'Ask the AI Tutor some questions to start building your learning profile.',
            ],
            overallAssessment: 'Not enough data yet. Keep asking questions!',
          },
        };
      }

      try {
        const resp = await fetch(`${CHATBOT_V1_URL}/api/insights`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stats }),
          signal: AbortSignal.timeout(20000),
        });
        if (resp.ok) {
          return await resp.json();
        }
      } catch {
        // fall through to local-only response
      }

      return {
        hardMetrics: stats,
        aiSummary: {
          strengths: [],
          weaknesses: [],
          nextActions: ['AI summary is temporarily unavailable.'],
          overallAssessment: 'Could not generate summary.',
        },
      };
    }
  );

  // ── Chatbot routing ──────────────────────────────────────────────────────

  app.post(
    '/v1/community/chatbot/routing',
    { schema: { tags: ['community'], summary: 'Compute a learning path' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as { goal?: string };
      if (!body.goal?.trim()) {
        reply.code(400).send(Errors.validation('goal is required.'));
        return;
      }
      if (!CHATBOT_V1_URL) {
        reply.code(503).send(Errors.unavailable('AI Tutor service is not configured.'));
        return;
      }
      try {
        const resp = await fetch(`${CHATBOT_V1_URL}/api/routing`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: body.goal }),
          signal: AbortSignal.timeout(30000),
        });
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          reply
            .code(502)
            .send(
              Errors.unavailable(`Routing service returned ${resp.status}: ${text.slice(0, 200)}`)
            );
          return;
        }
        return await resp.json();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        reply.code(502).send(Errors.unavailable(`Routing request failed: ${message}`));
      }
    }
  );

  // ── Tutor conversation CRUD ──────────────────────────────────────────────

  app.get(
    '/v1/tutor/conversations',
    { schema: { tags: ['community'], summary: 'List tutor conversations' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const query = request.query as { page?: string; limit?: string };
      const page = Math.max(1, parseInt(query.page ?? '1', 10));
      const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '30', 10)));

      const [conversations, total] = await Promise.all([
        prisma.tutorConversation.findMany({
          where: { userId: auth.user.id },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            title: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { messages: true } },
          },
        }),
        prisma.tutorConversation.count({ where: { userId: auth.user.id } }),
      ]);

      void reply.header('x-total-count', String(total));
      return conversations.map((c) => ({
        id: c.id,
        title: c.title,
        messageCount: c._count.messages,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      }));
    }
  );

  app.post(
    '/v1/tutor/conversations',
    { schema: { tags: ['community'], summary: 'Create tutor conversation' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const body = request.body as { title?: string };
      const conv = await prisma.tutorConversation.create({
        data: {
          userId: auth.user.id,
          title: body?.title || 'New conversation',
        },
      });
      return { id: conv.id, title: conv.title, createdAt: conv.createdAt.toISOString() };
    }
  );

  app.get(
    '/v1/tutor/conversations/:id',
    { schema: { tags: ['community'], summary: 'Get tutor conversation with messages' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { id } = request.params as { id: string };
      const conv = await prisma.tutorConversation.findFirst({
        where: { id, userId: auth.user.id },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (!conv) {
        return reply.code(404).send({ error: 'Conversation not found' });
      }
      return {
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        messages: conv.messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          tags: m.tags,
          xai: m.xaiReasoning
            ? {
                reasoning: m.xaiReasoning,
                concepts_used: m.xaiConcepts,
                might_be_unclear: m.xaiUnclear,
              }
            : null,
          responseType: m.responseType,
          createdAt: m.createdAt.toISOString(),
        })),
      };
    }
  );

  app.delete(
    '/v1/tutor/conversations/:id',
    { schema: { tags: ['community'], summary: 'Delete tutor conversation' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { id } = request.params as { id: string };
      const conv = await prisma.tutorConversation.findFirst({
        where: { id, userId: auth.user.id },
      });
      if (!conv) {
        return reply.code(404).send({ error: 'Conversation not found' });
      }
      await prisma.tutorConversation.delete({ where: { id } });
      return { deleted: true };
    }
  );

  app.patch(
    '/v1/tutor/conversations/:id',
    { schema: { tags: ['community'], summary: 'Rename tutor conversation' } },
    async (request, reply) => {
      const auth = await requireUser(request, reply, store);
      if (!auth) return;
      const { id } = request.params as { id: string };
      const body = request.body as { title?: string };
      if (!body.title?.trim()) {
        reply.code(400).send(Errors.validation('title is required.'));
        return;
      }
      const conv = await prisma.tutorConversation.findFirst({
        where: { id, userId: auth.user.id },
      });
      if (!conv) {
        return reply.code(404).send({ error: 'Conversation not found' });
      }
      const updated = await prisma.tutorConversation.update({
        where: { id },
        data: { title: body.title.trim() },
      });
      return { id: updated.id, title: updated.title };
    }
  );
}
