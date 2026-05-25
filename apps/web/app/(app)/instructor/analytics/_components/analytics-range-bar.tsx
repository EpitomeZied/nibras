'use client';

import {
  useAnalyticsRange,
  type AnalyticsRangeValue,
} from '../../../../lib/hooks/use-analytics-range';
import styles from '../layout.module.css';

const RANGE_OPTIONS: AnalyticsRangeValue[] = ['7d', '30d', '90d', 'term', 'custom'];

function rangeLabel(r: AnalyticsRangeValue): string {
  if (r === 'term') return 'Term';
  if (r === 'custom') return 'Custom';
  return r.replace('d', ' days');
}

export default function AnalyticsRangeBar() {
  const { range, setRange, fromDate, toDate, setFromDate, setToDate, rangeReady } =
    useAnalyticsRange();

  return (
    <div className={styles.rangeSection}>
      <div className={styles.rangePicker} role="tablist" aria-label="Date range">
        {RANGE_OPTIONS.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={range === r}
            className={`${styles.rangeChip} ${range === r ? styles.rangeChipActive : ''}`}
            onClick={() => setRange(r)}
          >
            {rangeLabel(r)}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className={styles.customRange}>
          <label className={styles.customLabel}>
            From
            <input
              type="date"
              className={styles.customInput}
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
            />
          </label>
          <label className={styles.customLabel}>
            To
            <input
              type="date"
              className={styles.customInput}
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
            />
          </label>
          {!rangeReady && <p className={styles.customHint}>Select both dates to load analytics.</p>}
        </div>
      )}
    </div>
  );
}
