'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';
import EmptyState from '../../../_components/widgets/EmptyState';
import { getCourseSummaries, type CourseSummary } from '../../../../lib/services/analytics';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import { useAnalyticsRange } from '../../../../lib/hooks/use-analytics-range';

export default function CoursesAnalyticsPage() {
  const { filters, rangeReady } = useAnalyticsRange();
  const [rows, setRows] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!rangeReady) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRows(await getCourseSummaries(filters));
    } catch (err) {
      setError(friendlyMessage(err));
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
        description="Use the range picker above to load course analytics."
      />
    );
  }

  if (loading) {
    return (
      <div
        style={{
          height: 300,
          borderRadius: 14,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      />
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Could not load courses"
        description={error}
        tone="error"
        action={{ label: 'Retry', onClick: () => void load() }}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No courses"
        description="No courses are available for analytics on your account."
      />
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Title</th>
            <th className={styles.numeric}>Enrolled</th>
            <th className={styles.numeric}>Active / wk</th>
            <th>Completion</th>
            <th className={styles.numeric}>Avg grade</th>
            <th className={styles.numeric}>Pass rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const passPct = Math.round(row.passRate * 100);
            const completionPct = Math.round(row.completionRate * 100);
            return (
              <tr key={row.courseId} className={styles.row}>
                <td className={styles.code}>
                  <Link
                    href={`/instructor/courses/${row.courseId}/analytics`}
                    className={styles.courseLink}
                  >
                    {row.code}
                  </Link>
                </td>
                <td>
                  <Link
                    href={`/instructor/courses/${row.courseId}/analytics`}
                    className={styles.courseLink}
                  >
                    {row.title}
                  </Link>
                </td>
                <td className={styles.numeric}>{row.enrolled}</td>
                <td className={styles.numeric}>{row.activeWeekly}</td>
                <td>
                  <span className={styles.progressTrack}>
                    <span className={styles.progressFill} style={{ width: `${completionPct}%` }} />
                  </span>
                  {completionPct}%
                </td>
                <td className={styles.numeric}>{row.averageGrade.toFixed(1)}</td>
                <td
                  className={`${styles.numeric} ${
                    passPct >= 70 ? styles.passHigh : styles.passLow
                  }`}
                >
                  {passPct}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
