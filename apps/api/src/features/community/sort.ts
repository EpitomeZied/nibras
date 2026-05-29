export function questionOrderBy(sort?: string): Record<string, 'asc' | 'desc'> {
  if (sort === 'top') return { votesCount: 'desc' };
  if (sort === 'unanswered') return { answersCount: 'asc' };
  if (sort === 'active') return { updatedAt: 'desc' };
  return { createdAt: 'desc' };
}
