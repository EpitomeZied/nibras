import { fetchUhuntCodehuntProblems, verifyUhuntHandle } from '../codehunt/uhunt-client';
import type { PlatformFetcher } from './types';

export const uhuntFetcher: PlatformFetcher = {
  async fetchContests() {
    return [];
  },

  async fetchProblems() {
    const { items } = await fetchUhuntCodehuntProblems();
    return items.map((p) => ({
      platformProblemId: p.problemId,
      title: p.name,
      url: p.url,
      difficulty: p.percentageAccepted ?? 0,
      tags: [],
    }));
  },

  async verifyHandle(handle: string) {
    const valid = await verifyUhuntHandle(handle);
    return { valid };
  },

  async fetchUserStats(handle: string) {
    const { items } = await fetchUhuntCodehuntProblems(handle);
    return {
      rating: 0,
      maxRating: 0,
      contestHistory: [],
      solvedProblemIds: items.filter((p) => p.solved).map((p) => p.problemId),
    };
  },
};
