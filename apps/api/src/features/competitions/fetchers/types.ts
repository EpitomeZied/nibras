export type RawContest = {
  platformContestId: string;
  name: string;
  url: string;
  startsAt: Date;
  endsAt: Date;
  durationMinutes: number;
  phase: string;
  tags: string[];
};

export type RawProblem = {
  platformProblemId: string;
  title: string;
  url: string;
  difficulty: number;
  tags: string[];
};

export type RawUserStats = {
  rating: number;
  maxRating: number;
  contestHistory: Array<{
    platformContestId: string;
    rank: number;
    participants: number;
    ratingBefore: number;
    ratingAfter: number;
    delta: number;
  }>;
  solvedProblemIds: string[];
};

export type PlatformFetcher = {
  fetchContests(): Promise<RawContest[]>;
  fetchProblems(): Promise<RawProblem[]>;
  verifyHandle(handle: string): Promise<{ valid: boolean; rating?: number; maxRating?: number }>;
  fetchUserStats(handle: string): Promise<RawUserStats>;
};
