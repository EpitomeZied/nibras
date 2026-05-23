export type PracticeLcProblemRow = {
  problemId: string;
  index: string;
  name: string;
  url: string;
  solved: boolean;
  attempted: boolean;
  rating?: number;
  difficultyLabel?: string;
  tags?: string[];
  acRate?: number;
};

export type PracticeLcProblemsResponse = {
  items: PracticeLcProblemRow[];
  total: number;
  solvedCount: number;
  handle: string | null;
  page: number;
  limit: number;
};

export type PracticeLcProblemsQuery = {
  handle?: string;
  page?: number;
  limit?: number;
  q?: string;
  tag?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  solved?: 'true' | 'false';
};

export type LcAnalyticsPayload = {
  rating: Record<string, number>;
  tags: Record<string, number>;
  lang: Record<string, number>;
  verdicts: Record<string, number>;
  attempts: Record<string, number>;
  timeline: Record<string, number>;
  performance: Array<[number, number, string]>;
  memoryPerformance: Array<[number, number, string]>;
  speedAnalysis: Record<string, number>;
  stats: {
    totalSubmissions: number;
    solvedProblems: number;
    maxStreak: number;
    totalPoints: number;
    acRate: number;
    highestRating: number;
  };
};
