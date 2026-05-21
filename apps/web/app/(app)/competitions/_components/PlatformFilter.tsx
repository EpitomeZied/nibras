'use client';

import styles from './PlatformFilter.module.css';

const PLATFORMS = ['all', 'codeforces', 'leetcode', 'atcoder', 'codechef', 'vjudge'] as const;

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
          {p === 'all' ? 'All' : p[0].toUpperCase() + p.slice(1)}
        </button>
      ))}
    </div>
  );
}
