'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect } from 'react';
import styles from './page.module.css';
import AllPlatformsPractice from './_components/AllPlatformsPractice';
import CodeforcesPractice from './_components/CodeforcesPractice';

type PracticeTab = 'all' | 'codeforces';

function tabFromParam(value: string | null): PracticeTab {
  if (value === 'codeforces') return 'codeforces';
  return 'all';
}

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = tabFromParam(searchParams.get('tab'));

  useEffect(() => {
    if (searchParams.get('tab') === 'leetcode') {
      router.replace('/competitions/nibras-75');
    }
  }, [searchParams, router]);

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
            Browse problems across platforms, or use Codeforces for the full problemset and
            analytics. For interview prep, see{' '}
            <a href="/competitions/nibras-75" style={{ color: 'var(--primary, #22c55e)' }}>
              Nibras 75
            </a>
            .
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
      </div>

      {tab === 'all' ? <AllPlatformsPractice /> : <CodeforcesPractice />}
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
