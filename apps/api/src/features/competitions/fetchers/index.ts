import type { PlatformFetcher } from './types';
import { codeforcesFetcher } from './codeforces';
import { leetcodeFetcher } from './leetcode';
import { atcoderFetcher } from './atcoder';
import { codechefFetcher } from './codechef';
import { vjudgeFetcher } from './vjudge';
import { ctftimeFetcher } from './ctftime';
export type { RawContest, RawProblem, RawUserStats, PlatformFetcher } from './types';

export const fetchers: Record<string, PlatformFetcher> = {
  codeforces: codeforcesFetcher,
  leetcode: leetcodeFetcher,
  atcoder: atcoderFetcher,
  codechef: codechefFetcher,
  vjudge: vjudgeFetcher,
  ctftime: ctftimeFetcher,
};
