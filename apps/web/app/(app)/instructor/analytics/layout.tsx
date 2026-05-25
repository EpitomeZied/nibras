'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import SectionNav from '../../_components/section-nav';
import { analyticsSections } from '../../_components/workspace-sections';
import { getPageTitle } from '../../_components/nav-config';
import { AnalyticsRangeProvider } from '../../../lib/hooks/use-analytics-range';
import AnalyticsRangeBar from './_components/analytics-range-bar';
import styles from './layout.module.css';

function AnalyticsLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageMeta = getPageTitle(pathname);

  return (
    <div className={styles.wrap}>
      <SectionNav
        eyebrow="Teach"
        title={pageMeta?.title ?? 'Analytics'}
        description={
          pageMeta?.subtitle ??
          'Aggregate signal across courses — submissions, pass rate, and engagement.'
        }
        items={analyticsSections}
      />
      <AnalyticsRangeBar />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <AnalyticsRangeProvider>
        <AnalyticsLayoutInner>{children}</AnalyticsLayoutInner>
      </AnalyticsRangeProvider>
    </Suspense>
  );
}
