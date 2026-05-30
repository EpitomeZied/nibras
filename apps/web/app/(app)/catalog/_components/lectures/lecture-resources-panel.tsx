'use client';

import type { CourseResourceLink } from '@nibras/contracts';
import styles from './lecture-resources-panel.module.css';

type Props = {
  resources: CourseResourceLink[];
};

export default function LectureResourcesPanel({ resources }: Props) {
  if (resources.length === 0) return null;

  return (
    <section className={styles.panel} aria-label="Lecture resources">
      <h3 className={styles.title}>Resources</h3>
      <ul className={styles.list}>
        {resources.map((r) => (
          <li key={r.url}>
            <a className={styles.link} href={r.url} target="_blank" rel="noopener noreferrer">
              {r.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
