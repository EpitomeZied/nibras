import type { LcAnalyticsPayload } from './types';
import type { LcUserProfile } from './lc-api';
import { DIFFICULTY_SCORE } from './lc-api';

function parseRuntimeMs(runtime?: string): number | undefined {
  if (!runtime || runtime === 'N/A') return undefined;
  const m = runtime.match(/^(\d+)\s*ms$/);
  if (m) return parseInt(m[1], 10);
  return undefined;
}

function parseMemoryKb(memory?: string): number | undefined {
  if (!memory || memory === 'N/A') return undefined;
  const m = memory.match(/^([\d.]+)\s*MB$/i);
  if (m) return Math.round(parseFloat(m[1]) * 1024);
  return undefined;
}

export function processLcProfile(
  profile: LcUserProfile,
  slugDifficulty: Map<string, number>
): LcAnalyticsPayload {
  const res: LcAnalyticsPayload = {
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

  const acAll = profile.submitStatsGlobal.acSubmissionNum.find((x) => x.difficulty === 'All');
  const totalAll = profile.submitStatsGlobal.totalSubmissionNum.find((x) => x.difficulty === 'All');
  res.stats.solvedProblems = acAll?.count ?? 0;
  res.stats.totalSubmissions = totalAll?.submissions ?? totalAll?.count ?? 0;
  const acSubs = acAll?.submissions ?? acAll?.count ?? 0;
  const totalSubs = totalAll?.submissions ?? totalAll?.count ?? 0;
  res.stats.acRate = totalSubs > 0 ? (acSubs / totalSubs) * 100 : 0;

  for (const row of profile.submitStatsGlobal.acSubmissionNum) {
    if (row.difficulty === 'All') continue;
    const score = DIFFICULTY_SCORE[row.difficulty] ?? 0;
    if (row.count > 0) res.rating[String(score)] = row.count;
    if (score > res.stats.highestRating && row.count > 0) {
      res.stats.highestRating = score;
    }
  }

  for (const row of profile.languageProblemCount) {
    if (row.problemsSolved > 0) res.lang[row.languageName] = row.problemsSolved;
  }

  for (const group of ['advanced', 'intermediate', 'fundamental'] as const) {
    for (const tag of profile.tagProblemCounts[group] ?? []) {
      if (tag.problemsSolved > 0) {
        res.tags[tag.tagName] = (res.tags[tag.tagName] || 0) + tag.problemsSolved;
      }
    }
  }

  const problemTries = new Map<string, { tries: number; ac: boolean }>();
  const sortedSubs = [...profile.recentSubmissions].sort(
    (a, b) => parseInt(a.timestamp, 10) - parseInt(b.timestamp, 10)
  );

  for (const sub of sortedSubs) {
    const date = new Date(parseInt(sub.timestamp, 10) * 1000);
    const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    res.timeline[monthStr] = (res.timeline[monthStr] || 0) + 1;

    const verdict = sub.statusDisplay === 'Accepted' ? 'AC' : sub.statusDisplay;
    res.verdicts[verdict] = (res.verdicts[verdict] || 0) + 1;

    if (!problemTries.has(sub.titleSlug)) problemTries.set(sub.titleSlug, { tries: 0, ac: false });
    const st = problemTries.get(sub.titleSlug)!;
    if (!st.ac) {
      st.tries++;
      if (sub.statusDisplay === 'Accepted') {
        st.ac = true;
        const tryKey =
          st.tries === 1 ? 'try1' : st.tries === 2 ? 'try2' : st.tries <= 5 ? 'try3_5' : 'tryMore';
        res.attempts[tryKey] = (res.attempts[tryKey] || 0) + 1;

        const rating = slugDifficulty.get(sub.titleSlug) ?? 0;
        const runtimeMs = parseRuntimeMs(sub.runtime);
        const memoryKb = parseMemoryKb(sub.memory);
        if (runtimeMs !== undefined && rating) {
          res.performance.push([runtimeMs, rating, sub.title]);
        }
        if (memoryKb !== undefined && rating) {
          res.memoryPerformance.push([memoryKb, rating, sub.title]);
        }
      }
    }
  }

  const months = Object.keys(res.timeline).sort();
  let maxStreak = months.length > 0 ? 1 : 0;
  let streak = 1;
  for (let i = 1; i < months.length; i++) {
    const prev = new Date(`${months[i - 1]}-01`);
    const curr = new Date(`${months[i]}-01`);
    const diff =
      (curr.getFullYear() - prev.getFullYear()) * 12 + (curr.getMonth() - prev.getMonth());
    if (diff === 1) {
      streak++;
      maxStreak = Math.max(maxStreak, streak);
    } else {
      streak = 1;
    }
  }
  res.stats.maxStreak = maxStreak;

  return res;
}
