'use client';

import styles from './PlatformFilter.module.css';

const PLATFORMS = [
  'all',
  'codeforces',
  'leetcode',
  'atcoder',
  'codechef',
  'vjudge',
  'ctftime',
] as const;

const LABELS: Record<string, string> = {
  all: 'All',
  codeforces: 'Codeforces',
  leetcode: 'LeetCode',
  atcoder: 'AtCoder',
  codechef: 'CodeChef',
  vjudge: 'VJudge',
  ctftime: 'CTFtime',
};

type Props = {
  selected: string;
  onChange: (platform: string) => void;
};

export default function PlatformFilter({ selected, onChange }: Props) {
  return (
    <div className={styles.row} role="tablist" aria-label="Platform filter">
      {PLATFORMS.map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={selected === p}
          className={`${styles.chip} ${selected === p ? styles.chipActive : ''}`}
          onClick={() => onChange(p)}
        >
          {p === 'all' ? 'All' : (LABELS[p] ?? p)}
        </button>
      ))}
    </div>
  );
}
