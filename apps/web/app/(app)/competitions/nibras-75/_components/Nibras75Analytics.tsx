'use client';

import dynamic from 'next/dynamic';
import EmptyState from '../../../_components/widgets/EmptyState';
import type { Nibras75AnalyticsResponse } from '../../../../lib/services/competitions';
import styles from '../page.module.css';

const CfAnalyticsDashboard = dynamic(
  () => import('../../practice/_components/CfAnalyticsDashboard'),
  { ssr: false }
);

type Nibras75AnalyticsProps = {
  user: boolean;
  needsLink: boolean;
  loading: boolean;
  error: string | null;
  analytics: Nibras75AnalyticsResponse | null;
  activeHandle: string | null;
  onRetry: () => void;
};

export default function Nibras75Analytics({
  user,
  needsLink,
  loading,
  error,
  analytics,
  activeHandle,
  onRetry,
}: Nibras75AnalyticsProps) {
  return (
    <section className={styles.analyticsSection} aria-label="LeetCode analytics">
      <h2 className={styles.analyticsTitle}>Analytics</h2>
      {!user || needsLink ? (
        <p className={styles.mutedText}>
          Link a LeetCode account to load profile analytics scoped to Nibras 75.
        </p>
      ) : loading ? (
        <div className={styles.analyticsSkeleton} />
      ) : error ? (
        <EmptyState
          title="Could not load analytics"
          description={error}
          tone="error"
          action={{ label: 'Retry', onClick: onRetry }}
        />
      ) : analytics ? (
        <>
          <div className={styles.scopedStats}>
            <strong>
              {analytics.nibras75.solvedInSet} / {analytics.nibras75.totalInSet}
            </strong>
            <span className={styles.mutedText}> Nibras 75 problems solved</span>
          </div>
          <CfAnalyticsDashboard data={analytics} handle={activeHandle} />
        </>
      ) : null}
    </section>
  );
}
