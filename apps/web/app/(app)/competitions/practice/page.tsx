'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback } from 'react';
import styles from './page.module.css';
import AllPlatformsPractice from './_components/AllPlatformsPractice';
import CodeforcesPractice from './_components/CodeforcesPractice';
import LeetcodePractice from './_components/LeetcodePractice';

type PracticeTab = 'all' | 'codeforces' | 'leetcode';

function tabFromParam(value: string | null): PracticeTab {
  if (value === 'codeforces' || value === 'leetcode') return value;
  return 'all';
}

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = tabFromParam(searchParams.get('tab'));

  const setTab = useCallback(
    (next: PracticeTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'all') {
        params.delete('tab');
      } else {
        params.set('tab', next);
      }
      const qs = params.toString();
      router.replace(qs ? `/competitions/practice?${qs}` : '/competitions/practice');
    },
    [router, searchParams]
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Practice</h1>
          <p className={styles.subtitle}>
            Browse problems across platforms, or open Codeforces / LeetCode for the full problemset,
            solved highlighting, and analytics.
          </p>
        </div>
      </header>

      <div className={styles.tabPicker} role="tablist" aria-label="Practice mode">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'all'}
          className={`${styles.tabChip} ${tab === 'all' ? styles.tabChipActive : ''}`}
          onClick={() => setTab('all')}
        >
          All platforms
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'codeforces'}
          className={`${styles.tabChip} ${tab === 'codeforces' ? styles.tabChipActive : ''}`}
          onClick={() => setTab('codeforces')}
        >
          Codeforces
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'leetcode'}
          className={`${styles.tabChip} ${tab === 'leetcode' ? styles.tabChipActive : ''}`}
          onClick={() => setTab('leetcode')}
        >
          LeetCode
        </button>
      </div>

      {tab === 'all' ? (
        <AllPlatformsPractice />
      ) : tab === 'codeforces' ? (
        <CodeforcesPractice />
      ) : (
        <LeetcodePractice />
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div style={{ height: 320, borderRadius: 14, background: 'var(--surface)' }} />
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
