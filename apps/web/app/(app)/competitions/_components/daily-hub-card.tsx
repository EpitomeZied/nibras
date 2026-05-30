'use client';

import Link from 'next/link';
import { useFetch } from '../../../lib/use-fetch';
import { difficultyLabel } from '../../../lib/services/daily-problem';
import hubStyles from './daily-hub-card.module.css';

type DailyTodayResponse = {
  paused: boolean;
  pausedUntil?: string;
  assignment?: {
    solved: boolean;
    problem: { title: string; difficulty: number };
  };
  streak: { current: number };
};

export default function DailyHubCard() {
  const { data } = useFetch<DailyTodayResponse>('/v1/daily-problem/today');

  if (!data) return null;

  return (
    <Link href="/competitions/daily" className={hubStyles.card}>
      <div className={hubStyles.header}>
        <span className={hubStyles.eyebrow}>Daily Problem</span>
        <span className={hubStyles.streak}>
          &#128293; {data.streak.current} day{data.streak.current === 1 ? '' : 's'}
        </span>
      </div>
      {data.paused ? (
        <p className={hubStyles.body}>
          Paused until {new Date(data.pausedUntil!).toLocaleDateString()}
        </p>
      ) : data.assignment ? (
        <p className={hubStyles.body}>
          <strong>{data.assignment.problem.title}</strong>
          <span className={hubStyles.meta}>
            {difficultyLabel(data.assignment.problem.difficulty)}
            {data.assignment.solved ? ' · Solved' : ' · Pending'}
          </span>
        </p>
      ) : (
        <p className={hubStyles.body}>No problem assigned today — open to configure.</p>
      )}
      <span className={hubStyles.cta}>Open daily challenge →</span>
    </Link>
  );
}
