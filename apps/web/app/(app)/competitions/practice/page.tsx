'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import styles from './page.module.css';
import CodeforcesPractice from './_components/CodeforcesPractice';

const CODEFORCES_PRACTICE_URL = '/competitions/practice?tab=codeforces';

function PracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('tab') === 'leetcode') {
      router.replace('/competitions/nibras-75');
      return;
    }
    if (searchParams.get('tab') !== 'codeforces') {
      router.replace(CODEFORCES_PRACTICE_URL);
    }
  }, [searchParams, router]);

  if (searchParams.get('tab') !== 'codeforces') {
    return (
      <div className={styles.page}>
        <div style={{ height: 320, borderRadius: 14, background: 'var(--surface)' }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Codeforces practice</h1>
          <p className={styles.subtitle}>
            Browse the Codeforces problemset, filter by tags, and track rating analytics. For
            interview prep, see{' '}
            <a href="/competitions/nibras-75" style={{ color: 'var(--primary, #22c55e)' }}>
              Nibras 75
            </a>
            .
          </p>
        </div>
      </header>

      <CodeforcesPractice />
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
