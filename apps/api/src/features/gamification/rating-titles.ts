export type RatingTitleDef = {
  threshold: number;
  title: string;
  codeSuffix: string;
};

/** Official Codeforces max-rating divisions. */
export const CF_RATING_TITLES: RatingTitleDef[] = [
  { threshold: 1200, title: 'Pupil', codeSuffix: 'pupil' },
  { threshold: 1400, title: 'Specialist', codeSuffix: 'specialist' },
  { threshold: 1600, title: 'Expert', codeSuffix: 'expert' },
  { threshold: 1900, title: 'Candidate Master', codeSuffix: 'candidate-master' },
  { threshold: 2100, title: 'Master', codeSuffix: 'master' },
  { threshold: 2300, title: 'International Master', codeSuffix: 'international-master' },
  { threshold: 2400, title: 'Grandmaster', codeSuffix: 'grandmaster' },
  { threshold: 2600, title: 'International Grandmaster', codeSuffix: 'igmaster' },
  { threshold: 3000, title: 'Legendary Grandmaster', codeSuffix: 'lgm' },
  { threshold: 3500, title: 'Immortal', codeSuffix: 'immortal' },
];

/** LeetCode contest rating peaks (parallel thresholds, LC-themed names). */
export const LC_RATING_TITLES: RatingTitleDef[] = [
  { threshold: 1200, title: 'Knight', codeSuffix: 'knight' },
  { threshold: 1400, title: 'Guardian', codeSuffix: 'guardian' },
  { threshold: 1600, title: 'Sentinel', codeSuffix: 'sentinel' },
  { threshold: 1900, title: 'Crusader', codeSuffix: 'crusader' },
  { threshold: 2100, title: 'Ace', codeSuffix: 'ace' },
  { threshold: 2300, title: 'Elite', codeSuffix: 'elite' },
  { threshold: 2400, title: 'Champion', codeSuffix: 'champion' },
  { threshold: 2600, title: 'Guardian Prime', codeSuffix: 'guardian-prime' },
  { threshold: 3000, title: 'Legend', codeSuffix: 'legend' },
  { threshold: 3500, title: 'Mythic', codeSuffix: 'mythic' },
];

export type RatingPlatformConfig = {
  platformLabel: string;
  codePrefix: string;
  metric: 'codeforcesMaxRating' | 'leetcodeMaxRating';
  titles: RatingTitleDef[];
};

export const RATING_PLATFORMS: RatingPlatformConfig[] = [
  {
    platformLabel: 'Codeforces',
    codePrefix: 'cf-max',
    metric: 'codeforcesMaxRating',
    titles: CF_RATING_TITLES,
  },
  {
    platformLabel: 'LeetCode',
    codePrefix: 'lc-max',
    metric: 'leetcodeMaxRating',
    titles: LC_RATING_TITLES,
  },
];
