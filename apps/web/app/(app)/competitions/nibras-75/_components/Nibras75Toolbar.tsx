'use client';

import type { Nibras75Filters } from './nibras75-utils';
import { NIBRAS75_COMPANIES, TOP_NIBRAS75_TAGS } from './nibras75-utils';
import styles from '../page.module.css';

type Nibras75ToolbarProps = {
  filters: Nibras75Filters;
  total: number;
  onChange: (patch: Partial<Nibras75Filters>) => void;
};

export default function Nibras75Toolbar({ filters, total, onChange }: Nibras75ToolbarProps) {
  return (
    <div className={styles.toolbarBlock}>
      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          placeholder="Search Nibras 75 (e.g. Two Sum, LRU Cache)"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
        <div className={styles.filterPicker} role="tablist" aria-label="Difficulty">
          {(['all', 'easy', 'medium', 'hard'] as const).map((d) => (
            <button
              key={d}
              type="button"
              role="tab"
              aria-selected={filters.difficulty === d}
              className={`${styles.filterChip} ${filters.difficulty === d ? styles.filterChipActive : ''}`}
              onClick={() => onChange({ difficulty: d })}
            >
              {d === 'all' ? 'All' : d[0].toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.filterPicker} role="tablist" aria-label="Progress">
          {(['all', 'solved', 'unsolved'] as const).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={filters.solved === s}
              className={`${styles.filterChip} ${filters.solved === s ? styles.filterChipActive : ''}`}
              onClick={() => onChange({ solved: s })}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <select
          className={styles.sortSelect}
          value={filters.sort}
          onChange={(e) =>
            onChange({
              sort: e.target.value as Nibras75Filters['sort'],
            })
          }
          aria-label="Sort problems"
        >
          <option value="rank">Sort: Rank</option>
          <option value="difficulty">Sort: Difficulty</option>
          <option value="askedByCount">Sort: Interview frequency</option>
        </select>
        <span className={styles.mutedText}>
          Showing {total} question{total === 1 ? '' : 's'}
        </span>
      </div>

      <div className={styles.tagRow} role="group" aria-label="Filter by tag">
        <button
          type="button"
          className={`${styles.tagChip} ${!filters.tag ? styles.tagChipActive : ''}`}
          onClick={() => onChange({ tag: '' })}
        >
          All tags
        </button>
        {TOP_NIBRAS75_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`${styles.tagChip} ${filters.tag === tag ? styles.tagChipActive : ''}`}
            onClick={() => onChange({ tag: filters.tag === tag ? '' : tag })}
          >
            {tag.replace(/-/g, ' ')}
          </button>
        ))}
      </div>

      <div className={styles.tagRow} role="group" aria-label="Filter by company">
        <button
          type="button"
          className={`${styles.tagChip} ${!filters.company ? styles.tagChipActive : ''}`}
          onClick={() => onChange({ company: '' })}
        >
          All companies
        </button>
        {NIBRAS75_COMPANIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`${styles.tagChip} ${filters.company === c.id ? styles.tagChipActive : ''}`}
            onClick={() => onChange({ company: filters.company === c.id ? '' : c.id })}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  );
}
