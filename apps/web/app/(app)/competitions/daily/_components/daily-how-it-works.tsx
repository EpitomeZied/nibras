'use client';

import { useState } from 'react';
import styles from '../page.module.css';

export default function DailyHowItWorks() {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.howItWorks}>
      <button
        type="button"
        className={styles.howItWorksToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        How it works {open ? '▾' : '▸'}
      </button>
      {open ? (
        <ul className={styles.howItWorksList}>
          <li>One curated problem per day — resets at midnight in your timezone.</li>
          <li>Solving increments your streak and earns +10 reputation.</li>
          <li>
            Skip uses one streak freeze and preserves your streak. Auto-save on miss also consumes a
            freeze when you forget.
          </li>
          <li>Miss without freezes resets your streak and costs 3 reputation.</li>
          <li>Vacation mode pauses new assignments until you resume.</li>
          <li>Milestone bonuses at 7 (+25), 30 (+50), and 100 (+100) day streaks.</li>
        </ul>
      ) : null}
    </div>
  );
}
