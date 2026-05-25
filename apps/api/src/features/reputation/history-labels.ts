import type { PrismaClient, ReputationCategory } from '@prisma/client';
import type { ReputationEventDto } from './service';
import {
  AURA_RATING_MULTIPLIER,
  computeAuraDelta,
  platformLabel,
} from './linked-account-aura';

const CATEGORY_LABELS: Record<ReputationCategory, string> = {
  course: 'Projects',
  community: 'Community',
  problem: 'Practice',
  contest: 'Competitions',
  badge: 'Badges',
};

type RawEvent = {
  id: string;
  delta: number;
  reason: string;
  source: string;
  category: ReputationCategory;
  createdAt: Date;
};

function parseSource(source: string): { kind: string; id: string } {
  const idx = source.indexOf(':');
  if (idx === -1) return { kind: source, id: '' };
  return { kind: source.slice(0, idx), id: source.slice(idx + 1) };
}

function fallbackReason(kind: string, stored: string): string {
  if (!stored.includes(':') && stored.trim().length > 0) return stored;
  switch (kind) {
    case 'submission':
      return 'Passed all automated tests on a project';
    case 'answer-accepted':
      return 'Your answer was accepted in the community';
    case 'question-upvotes':
      return 'Your question received upvotes';
    case 'problem':
      return 'Solved a practice problem';
    case 'contest':
      return 'Participated in a contest';
    case 'badge':
      return 'Earned an achievement badge';
    case 'linked-account':
      return 'Connected a competitive programming account';
    default:
      return stored.includes(':') ? 'Reputation activity' : stored;
  }
}

function fallbackPresentation(event: RawEvent): ReputationEventDto {
  const { kind } = parseSource(event.source);
  return {
    id: event.id,
    delta: event.delta,
    reason: fallbackReason(kind, event.reason),
    detail: undefined,
    category: event.category,
    categoryLabel: CATEGORY_LABELS[event.category] ?? 'Activity',
    createdAt: event.createdAt.toISOString(),
  };
}

export async function presentReputationHistory(
  prisma: PrismaClient,
  events: RawEvent[]
): Promise<ReputationEventDto[]> {
  if (events.length === 0) return [];

  const byKind = new Map<string, string[]>();
  for (const event of events) {
    const { kind, id } = parseSource(event.source);
    if (!id) continue;
    const list = byKind.get(kind) ?? [];
    list.push(id);
    byKind.set(kind, list);
  }

  const submissionIds = byKind.get('submission') ?? [];
  const answerIds = byKind.get('answer-accepted') ?? [];
  const questionIds = byKind.get('question-upvotes') ?? [];
  const problemIds = byKind.get('problem') ?? [];
  const contestIds = byKind.get('contest') ?? [];
  const badgeCodes = byKind.get('badge') ?? [];

  const [
    submissions,
    answers,
    questions,
    problems,
    contests,
    badges,
  ] = await Promise.all([
    submissionIds.length > 0
      ? prisma.submissionAttempt.findMany({
          where: { id: { in: submissionIds } },
          select: { id: true, project: { select: { name: true } } },
        })
      : Promise.resolve([]),
    answerIds.length > 0
      ? prisma.communityAnswer.findMany({
          where: { id: { in: answerIds } },
          select: {
            id: true,
            question: { select: { title: true } },
          },
        })
      : Promise.resolve([]),
    questionIds.length > 0
      ? prisma.communityQuestion.findMany({
          where: { id: { in: questionIds } },
          select: { id: true, title: true, votesCount: true },
        })
      : Promise.resolve([]),
    problemIds.length > 0
      ? prisma.problem.findMany({
          where: { id: { in: problemIds } },
          select: { id: true, title: true },
        })
      : Promise.resolve([]),
    contestIds.length > 0
      ? prisma.contest.findMany({
          where: { id: { in: contestIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    badgeCodes.length > 0
      ? prisma.badgeDefinition.findMany({
          where: { code: { in: badgeCodes } },
          select: { code: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const projectBySubmission = new Map(
    submissions.map((s) => [s.id, s.project.name] as const)
  );
  const questionByAnswer = new Map(
    answers.map((a) => [a.id, a.question.title] as const)
  );
  const questionMeta = new Map(
    questions.map((q) => [q.id, { title: q.title, votes: q.votesCount }] as const)
  );
  const problemTitle = new Map(problems.map((p) => [p.id, p.title] as const));
  const contestName = new Map(contests.map((c) => [c.id, c.name] as const));
  const badgeName = new Map(badges.map((b) => [b.code, b.name] as const));

  return events.map((event) => {
    const { kind, id } = parseSource(event.source);
    const categoryLabel = CATEGORY_LABELS[event.category] ?? 'Activity';

    switch (kind) {
      case 'submission': {
        const project = projectBySubmission.get(id);
        if (project) {
          return {
            id: event.id,
            delta: event.delta,
            reason: `Passed all automated tests`,
            detail: `Project: ${project}`,
            category: event.category,
            categoryLabel,
            createdAt: event.createdAt.toISOString(),
          };
        }
        break;
      }
      case 'answer-accepted': {
        const question = questionByAnswer.get(id);
        if (question) {
          return {
            id: event.id,
            delta: event.delta,
            reason: `Your answer was accepted`,
            detail: `Question: ${question}`,
            category: event.category,
            categoryLabel,
            createdAt: event.createdAt.toISOString(),
          };
        }
        break;
      }
      case 'question-upvotes': {
        const meta = questionMeta.get(id);
        if (meta) {
          const votes =
            meta.votes === 1 ? '1 upvote' : `${meta.votes} upvotes`;
          return {
            id: event.id,
            delta: event.delta,
            reason: `Your question received ${votes}`,
            detail: meta.title,
            category: event.category,
            categoryLabel,
            createdAt: event.createdAt.toISOString(),
          };
        }
        break;
      }
      case 'problem': {
        const title = problemTitle.get(id);
        if (title) {
          return {
            id: event.id,
            delta: event.delta,
            reason: `Solved a practice problem`,
            detail: title,
            category: event.category,
            categoryLabel,
            createdAt: event.createdAt.toISOString(),
          };
        }
        break;
      }
      case 'contest': {
        const name = contestName.get(id);
        if (name) {
          return {
            id: event.id,
            delta: event.delta,
            reason: `Joined a contest`,
            detail: name,
            category: event.category,
            categoryLabel,
            createdAt: event.createdAt.toISOString(),
          };
        }
        break;
      }
      case 'badge': {
        const name = badgeName.get(id);
        if (name) {
          return {
            id: event.id,
            delta: event.delta,
            reason: `Earned the “${name}” badge`,
            detail: 'Achievement unlocked',
            category: event.category,
            categoryLabel,
            createdAt: event.createdAt.toISOString(),
          };
        }
        break;
      }
      case 'linked-account': {
        const label = platformLabel(id);
        const rating =
          event.delta > 0 ? Math.round(event.delta / AURA_RATING_MULTIPLIER) : 0;
        const detail =
          rating > 0
            ? `${event.delta} Aura (${AURA_RATING_MULTIPLIER}× ${rating} rating)`
            : `${event.delta} Aura`;
        return {
          id: event.id,
          delta: event.delta,
          reason: `Connected ${label} account`,
          detail,
          category: event.category,
          categoryLabel,
          createdAt: event.createdAt.toISOString(),
        };
      }
      default:
        break;
    }

    return fallbackPresentation(event);
  });
}

/** Clearer default text stored for newly synced reputation rows. */
export function buildSyncReason(
  kind: string,
  context: {
    projectName?: string;
    questionTitle?: string;
    votesCount?: number;
    problemTitle?: string;
    contestName?: string;
    badgeName?: string;
    platform?: string;
    rating?: number;
  }
): string {
  switch (kind) {
    case 'submission':
      return context.projectName
        ? `Passed all automated tests on “${context.projectName}”`
        : 'Passed a project submission';
    case 'answer-accepted':
      return context.questionTitle
        ? `Answer accepted on “${context.questionTitle}”`
        : 'Community answer accepted';
    case 'question-upvotes': {
      const n = context.votesCount ?? 0;
      const votes = n === 1 ? '1 upvote' : `${n} upvotes`;
      return context.questionTitle
        ? `Question “${context.questionTitle}” received ${votes}`
        : `Question received ${votes}`;
    }
    case 'problem':
      return context.problemTitle
        ? `Solved practice problem “${context.problemTitle}”`
        : 'Solved a practice problem';
    case 'contest':
      return context.contestName
        ? `Participated in contest “${context.contestName}”`
        : 'Participated in a contest';
    case 'badge':
      return context.badgeName
        ? `Earned badge “${context.badgeName}”`
        : 'Earned an achievement badge';
    case 'linked-account': {
      const label = context.platform ? platformLabel(context.platform) : 'Platform';
      const aura = computeAuraDelta(context.rating);
      const r = context.rating ?? 0;
      if (r > 0) {
        return `Linked ${label} account (${r} rating → ${aura} Aura)`;
      }
      return `Linked ${label} account`;
    }
    default:
      return 'Reputation activity';
  }
}
