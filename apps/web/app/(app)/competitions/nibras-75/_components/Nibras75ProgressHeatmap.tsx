'use client';

import type { Nibras75StatsResponse } from '../../../../lib/services/competitions';
import styles from '../page.module.css';

type Nibras75ProgressHeatmapProps = {
  stats: Nibras75StatsResponse | null;
};

function heatLevel(count: number): string {
  if (count >= 3) return 'high';
  if (count === 2) return 'mid';
  if (count === 1) return 'low';
  return 'none';
}

export default function Nibras75ProgressHeatmap({ stats }: Nibras75ProgressHeatmapProps) {
  if (!stats?.calendar?.length) return null;

  const topTags = stats.tagMastery.slice(0, 8);

  return (
    <section className={styles.panel} aria-label="Progress heatmap">
      <h2 className={styles.panelTitle}>Activity & topic mastery</h2>
      <div className={styles.calendar}>
        <div className={styles.calendarGrid}>
          {stats.calendar.map((day) => (
            <div
              key={day.date}
              className={styles.calendarCell}
              data-level={heatLevel(day.count)}
              title={`${day.date}: ${day.count} solved`}
            />
          ))}
        </div>
        <div className={styles.calendarLegend}>
          <span>Less</span>
          <span className={styles.legendSwatch} data-level="none" />
          <span className={styles.legendSwatch} data-level="low" />
          <span className={styles.legendSwatch} data-level="mid" />
          <span className={styles.legendSwatch} data-level="high" />
          <span>More</span>
        </div>
      </div>

      {topTags.length > 0 && (
        <div className={styles.masteryList}>
          {topTags.map((row) => {
            const pct = row.total > 0 ? Math.round((row.solved / row.total) * 100) : 0;
            return (
              <div key={row.tag} className={styles.masteryRow}>
                <span className={styles.masteryLabel}>{row.tag.replace(/-/g, ' ')}</span>
                <div className={styles.masteryBar}>
                  <div className={styles.masteryFill} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.masteryPct}>
                  {row.solved}/{row.total}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
