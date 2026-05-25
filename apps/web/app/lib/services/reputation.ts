import { serviceFetch } from '../api-clients/service-fetch';

export type ReputationEvent = {
  id: string;
  delta: number;
  reason: string;
  source?: string;
  createdAt: string;
};

export type MyReputation = {
  total: number;
  weeklyDelta: number;
  monthlyDelta: number;
  rank?: number;
  percentile?: number;
  history?: ReputationEvent[];
};

export async function getMyReputation(opts?: { sync?: boolean }): Promise<MyReputation> {
  const query: Record<string, string> = {};
  if (opts?.sync) query.sync = 'true';
  return serviceFetch<MyReputation>('admin', '/v1/reputation/me', {
    auth: true,
    query: Object.keys(query).length > 0 ? query : undefined,
  });
}
