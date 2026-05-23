export type PracticeCfProblemRow = {
  problemId: string;
  index: string;
  name: string;
  url: string;
  solved: boolean;
  attempted: boolean;
  solvedCount?: number;
  rating?: number;
  tags?: string[];
  contestId?: string;
};

export type PracticeCfProblemsResponse = {
  items: PracticeCfProblemRow[];
  total: number;
  solvedCount: number;
  handle: string | null;
  page: number;
  limit: number;
};

export type CfAnalyticsStats = {
  totalSubmissions: number;
  solvedProblems: number;
  maxStreak: number;
  totalPoints: number;
  acRate: number;
  highestRating: number;
};

export type CfAnalyticsPayload = {
  rating: Record<string, number>;
  tags: Record<string, number>;
  lang: Record<string, number>;
  verdicts: Record<string, number>;
  participantType: Record<string, number>;
  attempts: Record<string, number>;
  timeline: Record<string, number>;
  performance: Array<[number, number, string]>;
  memoryPerformance: Array<[number, number, string]>;
  speedAnalysis: Record<string, number>;
  stats: CfAnalyticsStats;
};

export type PracticeCfProblemsQuery = {
  handle?: string;
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
  ratingMin?: number;
  ratingMax?: number;
  solved?: 'true' | 'false';
};
