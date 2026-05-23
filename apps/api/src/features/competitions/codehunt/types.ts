export type CodehuntProblemRow = {
  problemId: string;
  index: string;
  name: string;
  url: string;
  solved: boolean;
  attempted: boolean;
  solvedCount?: number;
  percentageAccepted?: number;
  rating?: number;
  tags?: string[];
  contestId?: string;
};

export type CodehuntProblemsResponse = {
  items: CodehuntProblemRow[];
  total: number;
  solvedCount: number;
  handle: string | null;
};
