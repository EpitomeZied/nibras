'use client';

import styles from './CalendarViewToggle.module.css';

export type CalendarView = 'month' | 'week' | 'day';

type Props = {
  view: CalendarView;
  onChange: (view: CalendarView) => void;
};

const VIEWS: { key: CalendarView; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
];

export default function CalendarViewToggle({ view, onChange }: Props) {
  return (
    <div className={styles.row} role="tablist" aria-label="Calendar view">
      {VIEWS.map((v) => (
        <button
          key={v.key}
          type="button"
          role="tab"
          aria-selected={view === v.key}
          className={`${styles.btn} ${view === v.key ? styles.btnActive : ''}`}
          onClick={() => onChange(v.key)}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
