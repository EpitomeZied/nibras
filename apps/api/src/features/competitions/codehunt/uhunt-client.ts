import { rateLimited } from '../fetchers/rate-limiter';
import type { CodehuntProblemRow } from './types';

const UHUNT_BASE = 'https://uhunt.onlinejudge.org/api';
const DELAY_MS = 500;
const LAST_N = 1000;

type UhuntProblemTuple = [
  number,
  number,
  string,
  number,
  ...number[],
];

type UhuntSub = {
  pid: number;
  verdict: string;
};

type UhuntSubsPayload = {
  subs: UhuntSub[];
};

async function uhuntGet<T>(path: string): Promise<T> {
  return rateLimited('uhunt', DELAY_MS, async () => {
    const res = await fetch(`${UHUNT_BASE}${path}`);
    if (!res.ok) {
      throw new Error(`uHunt API ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  });
}

export async function resolveUhuntUserId(handle: string): Promise<number | null> {
  const uid = await uhuntGet<number>(`/uname2uid/${encodeURIComponent(handle.trim())}`);
  return uid === 0 ? null : uid;
}

export async function verifyUhuntHandle(handle: string): Promise<boolean> {
  const uid = await resolveUhuntUserId(handle);
  return uid !== null;
}

function uvaProblemUrl(problemId: number): string {
  return `http://uva.onlinejudge.org/index.php?option=com_onlinejudge&Itemid=8&category=24&page=show_problem&problem=${problemId}`;
}

function mapUhuntRow(row: UhuntProblemTuple): Omit<CodehuntProblemRow, 'solved' | 'attempted'> {
  const problemId = String(row[0]);
  const index = String(row[1]);
  const name = row[2];
  const solvedCount = row[3];
  let totalSubmissions = 0;
  for (let i = 7; i <= 17; i++) {
    totalSubmissions += Number(row[i] ?? 0);
  }
  const accepted = Number(row[18] ?? 0);
  totalSubmissions += accepted;
  const percentageAccepted =
    totalSubmissions > 0 ? Math.round((100 * accepted) / totalSubmissions) : 0;

  return {
    problemId,
    index,
    name,
    url: uvaProblemUrl(row[0]),
    solvedCount,
    percentageAccepted,
    contestId: index,
  };
}

async function loadUserUhuntStatus(
  handle: string | undefined
): Promise<Map<string, { solved: boolean; attempted: boolean }>> {
  const status = new Map<string, { solved: boolean; attempted: boolean }>();
  if (!handle?.trim()) return status;

  const uid = await resolveUhuntUserId(handle);
  if (uid === null) return status;

  const payload = await uhuntGet<UhuntSubsPayload>(`/subs-user/${uid}`);
  for (const sub of payload.subs ?? []) {
    const pid = String(sub.pid);
    const entry = status.get(pid) ?? { solved: false, attempted: false };
    if (sub.verdict === 'Accepted' || sub.verdict === 'accepted') {
      entry.solved = true;
    }
    entry.attempted = true;
    status.set(pid, entry);
  }
  return status;
}

export async function fetchUhuntCodehuntProblems(
  handle?: string
): Promise<{ items: CodehuntProblemRow[]; solvedCount: number }> {
  const catalog = await uhuntGet<UhuntProblemTuple[]>('/p');
  const sorted = [...catalog].sort((a, b) => b[0] - a[0]).slice(0, LAST_N);
  const userStatus = await loadUserUhuntStatus(handle);

  let solvedCount = 0;
  const items: CodehuntProblemRow[] = sorted.map((row) => {
    const base = mapUhuntRow(row);
    const st = userStatus.get(base.problemId);
    const solved = st?.solved ?? false;
    const attempted = st?.attempted ?? false;
    if (solved) solvedCount++;
    return { ...base, solved, attempted };
  });

  return { items, solvedCount };
}
