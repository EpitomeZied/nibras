import type { Nibras75Problem, Nibras75Workspace } from '../../../lib/services/competitions';

export type Nibras75Filters = {
  q: string;
  difficulty: 'all' | 'easy' | 'medium' | 'hard';
  solved: 'all' | 'solved' | 'unsolved';
  tag: string;
  company: string;
  sort: 'rank' | 'difficulty' | 'askedByCount';
};

export const TOP_NIBRAS75_TAGS = [
  'array',
  'hash-table',
  'string',
  'dynamic-programming',
  'two-pointers',
  'binary-search',
  'breadth-first-search',
  'depth-first-search',
  'linked-list',
  'stack',
  'sliding-window',
  'greedy',
] as const;

export const NIBRAS75_COMPANIES = [
  { id: 'google', name: 'Google' },
  { id: 'meta', name: 'Meta' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'microsoft', name: 'Microsoft' },
  { id: 'apple', name: 'Apple' },
  { id: 'netflix', name: 'Netflix' },
] as const;

export function parseFiltersFromSearch(params: URLSearchParams): Nibras75Filters {
  const difficulty = params.get('difficulty');
  const solved = params.get('solved');
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    difficulty:
      difficulty === 'easy' || difficulty === 'medium' || difficulty === 'hard'
        ? difficulty
        : 'all',
    solved: solved === 'solved' || solved === 'unsolved' ? solved : 'all',
    tag: params.get('tag') ?? '',
    company: params.get('company') ?? '',
    sort:
      sort === 'difficulty' || sort === 'askedByCount' ? sort : ('rank' as const),
  };
}

export function filtersToSearchParams(filters: Nibras75Filters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  if (filters.difficulty !== 'all') params.set('difficulty', filters.difficulty);
  if (filters.solved !== 'all') params.set('solved', filters.solved);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.company) params.set('company', filters.company);
  if (filters.sort !== 'rank') params.set('sort', filters.sort);
  return params;
}

export function workspaceProblemUrl(workspace: Nibras75Workspace, slug: string): string {
  return `${workspace.htmlUrl}/tree/main/${slug}`;
}

export function difficultyClass(
  d: string,
  styles: Record<string, string>
): string {
  if (d === 'Easy') return styles.difficultyEasy;
  if (d === 'Hard') return styles.difficultyHard;
  return styles.difficultyMedium;
}

export function estimateWeeksRemaining(
  remaining: number,
  weeklyPace: number
): number {
  if (remaining <= 0 || weeklyPace <= 0) return 0;
  return Math.ceil(remaining / weeklyPace);
}

export function estimateDailyPace(targetDate: string | null, remaining: number): number | null {
  if (!targetDate || remaining <= 0) return null;
  const end = new Date(targetDate);
  const now = new Date();
  const days = Math.max(1, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  return Math.ceil(remaining / days);
}

export function findNextUnsolved(items: Nibras75Problem[]): Nibras75Problem | null {
  const sorted = [...items].sort((a, b) => a.rank - b.rank);
  return sorted.find((p) => !p.solved) ?? null;
}
