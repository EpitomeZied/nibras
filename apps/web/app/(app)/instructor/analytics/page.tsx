'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';
import EmptyState from '../../_components/widgets/EmptyState';
import StatTile from '../../_components/widgets/StatTile';
import BarChart from '../../_components/widgets/BarChart';
import { getOverview, type OverviewResponse } from '../../../lib/services/analytics';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { useAnalyticsRange } from '../../../lib/hooks/use-analytics-range';

function formatDelta(value: number): string {
  if (value === 0) return '0';
  return value > 0 ? `+${value}` : `${value}`;
}

function deltaTrend(value: number): 'up' | 'down' | 'flat' {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

function sliceSeries<T extends { date: string }>(series: T[], count: number): T[] {
  return series.slice(-count);
}

export default function AnalyticsOverviewPage() {
  const { filters, rangeReady, chartPointCount } = useAnalyticsRange();
  const [data, setData] = useState<OverviewResponse | null>(null);
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
      setData(await getOverview(filters));
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
        description="Select start and end dates for custom range to load analytics."
      />
    );
  }

  if (loading) {
    return (
      <div
        className={styles.skeleton}
        style={{
          height: 360,
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
        title="Analytics not loaded"
        description={error ?? "The analytics service hasn't returned data yet."}
        tone={error ? 'error' : 'default'}
        action={error ? { label: 'Retry', onClick: () => void load() } : undefined}
      />
    );
  }

  const submissionChart = sliceSeries(data.series.submissions, chartPointCount).map((p) => ({
    label: p.date.slice(5),
    value: p.value,
  }));
  const passRateChart = sliceSeries(data.series.passRate, chartPointCount).map((p) => ({
    label: p.date.slice(5),
    value: Math.round(p.value * 100),
    color: 'var(--primary, #22c55e)',
  }));

  const showQuietState = data.meta?.hasActivity === false;

  return (
    <>
      {showQuietState && (
        <p className={styles.subtitle}>
          No activity recorded in this period yet. Metrics will populate as students submit work and
          watch course videos.
        </p>
      )}

      <div className={styles.kpis}>
        <StatTile
          label="Active Students"
          value={data.kpis.activeStudents.toLocaleString()}
          delta={formatDelta(data.kpis.activeStudentsDelta)}
          trend={deltaTrend(data.kpis.activeStudentsDelta)}
        />
        <StatTile
          label="Submissions"
          value={data.kpis.submissionsThisWeek.toLocaleString()}
          delta={formatDelta(data.kpis.submissionsDelta)}
          trend={deltaTrend(data.kpis.submissionsDelta)}
          caption="this week"
        />
        <StatTile
          label="Pass Rate"
          value={`${Math.round(data.kpis.passRate * 100)}%`}
          delta={`${formatDelta(Math.round(data.kpis.passRateDelta * 100))}%`}
          trend={deltaTrend(data.kpis.passRateDelta)}
        />
        <StatTile label="Median Grade" value={data.kpis.medianGrade.toFixed(1)} />
      </div>

      <div className={styles.chartGrid}>
        <section className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Submissions per day</h2>
          <BarChart data={submissionChart} height={220} />
        </section>
        <section className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Pass rate per day</h2>
          <BarChart data={passRateChart} height={220} yLabel="%" />
        </section>
      </div>

      <div className={styles.callouts}>
        <section className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Rising topics</h2>
          {data.topRisingTopics.length === 0 ? (
            <span className={styles.subtitle}>No standout topics yet.</span>
          ) : (
            <ul className={styles.list}>
              {data.topRisingTopics.map((t) => (
                <li key={t.topic} className={styles.listRow}>
                  <span>{t.topic}</span>
                  <span className={t.delta >= 0 ? styles.deltaPositive : styles.deltaNegative}>
                    {formatDelta(t.delta)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={styles.chartCard}>
          <h2 className={styles.chartTitle}>Flagged cohorts</h2>
          {data.flaggedCohorts.length === 0 ? (
            <span className={styles.subtitle}>Nothing flagged.</span>
          ) : (
            <ul className={styles.list}>
              {data.flaggedCohorts.map((c, idx) => {
                const termMatch = c.cohort.match(/\(([^)]+)\)$/);
                const cohortParam = encodeURIComponent(termMatch?.[1] ?? c.cohort);
                return (
                  <li key={`${c.cohort}-${idx}`} className={styles.listRow}>
                    <div>
                      <strong>{c.cohort}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{c.reason}</div>
                    </div>
                    <Link
                      href={`/instructor/analytics/students?risk=high&cohort=${cohortParam}`}
                      className={styles.flagBadge}
                    >
                      Review
                    </Link>
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
