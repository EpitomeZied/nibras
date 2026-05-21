export const COMPETITIONS_QUEUE_NAME = 'nibras:competitions';

export type ContestSyncPayload = { type: 'contest-sync' };
export type ProblemSyncPayload = { type: 'problem-sync' };
export type AccountVerifyPayload = {
  type: 'account-verify';
  userId: string;
  platform: string;
  handle: string;
};
export type AccountStatsSyncPayload = { type: 'account-stats-sync' };
export type RankingCalcPayload = { type: 'ranking-calc' };
export type ContestReminderPayload = { type: 'contest-reminder' };

export type CompetitionsJobPayload =
  | ContestSyncPayload
  | ProblemSyncPayload
  | AccountVerifyPayload
  | AccountStatsSyncPayload
  | RankingCalcPayload
  | ContestReminderPayload;
