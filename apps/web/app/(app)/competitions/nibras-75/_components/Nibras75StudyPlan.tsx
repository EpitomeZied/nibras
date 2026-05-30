'use client';

import type { Nibras75Config } from '../../../../lib/services/competitions';
import styles from '../page.module.css';

type Nibras75StudyPlanProps = {
  config: Nibras75Config;
  remaining: number;
  saving: boolean;
  user: boolean;
  onChange: (patch: Partial<Nibras75Config>) => void;
};

export default function Nibras75StudyPlan({
  config,
  remaining,
  saving,
  user,
  onChange,
}: Nibras75StudyPlanProps) {
  if (!user) return null;

  const weeksLeft =
    remaining > 0 && config.weeklyPace > 0
      ? Math.ceil(remaining / config.weeklyPace)
      : 0;

  return (
    <section className={styles.panel} aria-label="Study plan">
      <h2 className={styles.panelTitle}>Study plan</h2>
      <div className={styles.studyGrid}>
        <label className={styles.studyField}>
          <span>Problems per week</span>
          <input
            type="number"
            min={1}
            max={75}
            value={config.weeklyPace}
            disabled={saving}
            onChange={(e) =>
              onChange({ weeklyPace: Math.min(75, Math.max(1, Number(e.target.value) || 5)) })
            }
          />
        </label>
        <label className={styles.studyField}>
          <span>Interview target date</span>
          <input
            type="date"
            value={config.targetDate ? config.targetDate.slice(0, 10) : ''}
            disabled={saving}
            onChange={(e) =>
              onChange({ targetDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : null })
            }
          />
        </label>
        <label className={styles.studyToggle}>
          <input
            type="checkbox"
            checked={config.useForDailyProblem}
            disabled={saving}
            onChange={(e) => onChange({ useForDailyProblem: e.target.checked })}
          />
          <span>Use Nibras 75 pool for Daily Problem</span>
        </label>
      </div>
      <p className={styles.mutedText}>
        {remaining > 0
          ? `At ${config.weeklyPace}/week, finish in ~${weeksLeft} week${weeksLeft === 1 ? '' : 's'}.`
          : 'You have completed the full Nibras 75 list.'}
      </p>
    </section>
  );
}
