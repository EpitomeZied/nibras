'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';
import EmptyState from '../../../_components/widgets/EmptyState';
import StatTile from '../../../_components/widgets/StatTile';
import BarChart from '../../../_components/widgets/BarChart';
import { getEngagement, type EngagementResponse } from '../../../../lib/services/analytics';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import { useAnalyticsRange } from '../../../../lib/hooks/use-analytics-range';

function isEngagementEmpty(data: EngagementResponse): boolean {
  return (
    data.totalHours === 0 &&
    data.averageSession === 0 &&
    data.retentionWeekly === 0 &&
    data.byDay.every((d) => d.hours === 0) &&
    data.byCourse.length === 0
  );
}

export default function EngagementPage() {
  const { filters, rangeReady } = useAnalyticsRange();
  const [data, setData] = useState<EngagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!rangeReady) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await getEngagement(filters));
    } catch (err) {
      setError(friendlyMessage(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters, rangeReady]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!rangeReady) {
    return (
      <EmptyState
        title="Choose a date range"
        description="Use the range picker above to load engagement analytics."
      />
    );
  }

  if (loading) {
    return (
      <div
        style={{
          height: 320,
          borderRadius: 14,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      />
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        title="No engagement data"
        description={error ?? 'The signal will appear once students log activity.'}
        tone={error ? 'error' : 'default'}
        action={error ? { label: 'Retry', onClick: () => void load() } : undefined}
      />
    );
  }

  if (isEngagementEmpty(data)) {
    return (
      <EmptyState
        title="No engagement in this period"
        description="Video watch time and session data will appear when students engage with course content."
      />
    );
  }

  return (
    <>
      <div className={styles.kpis}>
        <StatTile label="Total hours" value={data.totalHours.toLocaleString()} />
        <StatTile label="Avg session" value={`${data.averageSession.toFixed(1)} min`} />
        <StatTile label="Weekly retention" value={`${Math.round(data.retentionWeekly * 100)}%`} />
      </div>

      <div className={styles.chartGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Hours by day of week</h2>
          <BarChart
            data={data.byDay.map((d) => ({ label: d.bucket, value: d.hours }))}
            height={240}
          />
        </section>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>By course</h2>
          {data.byCourse.length === 0 ? (
            <span className={styles.subtitle}>No data.</span>
          ) : (
            <ul className={styles.courseList}>
              {data.byCourse.map((c) => {
                const max = Math.max(...data.byCourse.map((cc) => cc.hours), 1);
                const pct = (c.hours / max) * 100;
                return (
                  <li key={c.courseId} className={styles.courseRow}>
                    <span className={styles.courseCode}>{c.code}</span>
                    <div className={styles.courseBar}>
                      <div className={styles.courseBarFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.courseHours}>{c.hours}h</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
