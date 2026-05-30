export type IdeProblemSource = 'nibras75' | 'daily';

export type IdeProblemLinkParams = {
  source: IdeProblemSource;
  problem: string;
  title: string;
  description?: string;
  externalUrl?: string;
};

export function buildIdeProblemUrl(params: IdeProblemLinkParams): string {
  const search = new URLSearchParams({
    source: params.source,
    problem: params.problem,
    title: params.title,
  });
  if (params.description) {
    search.set('desc', params.description);
  }
  if (params.externalUrl) {
    search.set('url', params.externalUrl);
  }
  return `/ide?${search.toString()}`;
}
