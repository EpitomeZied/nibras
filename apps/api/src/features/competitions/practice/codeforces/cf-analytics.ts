import type { CfAnalyticsPayload, CfAnalyticsStats } from './types';
import type { CfSubmission } from './cf-api';

function calculateMaxStreakFromTimeline(timelineData: Record<string, number>): number {
  const months = Object.keys(timelineData).sort();
  if (months.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < months.length; i++) {
    const prevMonth = new Date(`${months[i - 1]}-01`);
    const currMonth = new Date(`${months[i]}-01`);
    const diffMonths =
      (currMonth.getFullYear() - prevMonth.getFullYear()) * 12 +
      (currMonth.getMonth() - prevMonth.getMonth());

    if (diffMonths === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export function processCfSubmissions(submissions: CfSubmission[]): CfAnalyticsPayload {
  const sorted = [...submissions].sort((a, b) => a.creationTimeSeconds - b.creationTimeSeconds);

  const res: CfAnalyticsPayload = {
    rating: {},
    tags: {},
    lang: {},
    verdicts: {},
    participantType: {},
    attempts: {},
    timeline: {},
    performance: [],
    memoryPerformance: [],
    speedAnalysis: {},
    stats: {
      totalSubmissions: 0,
      solvedProblems: 0,
      maxStreak: 0,
      totalPoints: 0,
      acRate: 0,
      highestRating: 0,
    },
  };

  const problemState = new Map<string, { ac: boolean; tries: number }>();
  const solvedProblems = new Map<string, CfSubmission>();
  let totalAC = 0;
  const totalSubmissions = submissions.length;

  for (const sub of sorted) {
    const problem = sub.problem;
    if (!problem?.contestId) continue;
    const problemId = `${problem.contestId}${problem.index}`;

    res.stats.totalSubmissions++;

    let v = sub.verdict;
    if (v) {
      if (v === 'WRONG_ANSWER') v = 'WA';
      else if (v === 'TIME_LIMIT_EXCEEDED') v = 'TLE';
      else if (v === 'MEMORY_LIMIT_EXCEEDED') v = 'MLE';
      else if (v === 'COMPILATION_ERROR') v = 'CE';
      else if (v === 'RUNTIME_ERROR') v = 'RE';
      else if (v === 'OK') {
        v = 'AC';
        totalAC++;
      } else if (v === 'PASSED_PRETESTS') v = 'Pretest OK';
      res.verdicts[v] = (res.verdicts[v] || 0) + 1;
    }

    if (sub.author?.participantType) {
      res.participantType[sub.author.participantType] =
        (res.participantType[sub.author.participantType] || 0) + 1;
    }

    const date = new Date(sub.creationTimeSeconds * 1000);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    res.timeline[monthStr] = (res.timeline[monthStr] || 0) + 1;

    if (sub.relativeTimeSeconds && sub.relativeTimeSeconds < 2147483647) {
      const minutes = sub.relativeTimeSeconds / 60;
      let speedCategory: string;
      if (minutes <= 10) speedCategory = '0-10min';
      else if (minutes <= 30) speedCategory = '10-30min';
      else if (minutes <= 60) speedCategory = '30-60min';
      else if (minutes <= 120) speedCategory = '1-2h';
      else if (minutes <= 240) speedCategory = '2-4h';
      else speedCategory = '>4h';
      res.speedAnalysis[speedCategory] = (res.speedAnalysis[speedCategory] || 0) + 1;
    }

    if (!problemState.has(problemId)) problemState.set(problemId, { ac: false, tries: 0 });
    const pState = problemState.get(problemId)!;

    if (!pState.ac) {
      pState.tries++;
      if (sub.verdict === 'OK') {
        pState.ac = true;
        const tryKey =
          pState.tries === 1
            ? 'try1'
            : pState.tries === 2
              ? 'try2'
              : pState.tries <= 5
                ? 'try3_5'
                : 'tryMore';
        res.attempts[tryKey] = (res.attempts[tryKey] || 0) + 1;

        if (problem.rating && sub.timeConsumedMillis !== undefined) {
          res.performance.push([sub.timeConsumedMillis, problem.rating, problem.name]);
        }
        if (problem.rating && sub.memoryConsumedBytes !== undefined) {
          const memoryKB = Math.round(sub.memoryConsumedBytes / 1024);
          res.memoryPerformance.push([memoryKB, problem.rating, problem.name]);
        }
        if (problem.points) {
          res.stats.totalPoints += problem.points;
        }
        if (problem.rating && problem.rating > res.stats.highestRating) {
          res.stats.highestRating = problem.rating;
        }

        solvedProblems.set(problemId, sub);
      }
    }
  }

  solvedProblems.forEach((sub) => {
    const { rating, tags } = sub.problem;
    const lang = sub.programmingLanguage;
    if (rating) res.rating[String(rating)] = (res.rating[String(rating)] || 0) + 1;
    if (lang) res.lang[lang] = (res.lang[lang] || 0) + 1;
    if (tags?.length) {
      tags.forEach((tag) => {
        res.tags[tag] = (res.tags[tag] || 0) + 1;
      });
    }
  });

  res.stats.solvedProblems = solvedProblems.size;
  res.stats.acRate = totalSubmissions > 0 ? (totalAC / totalSubmissions) * 100 : 0;
  res.stats.maxStreak = calculateMaxStreakFromTimeline(res.timeline);

  return res;
}
