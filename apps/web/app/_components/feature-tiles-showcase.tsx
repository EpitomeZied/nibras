'use client';

import { useCallback, useEffect, useState } from 'react';
import { featureGroups, type LandingFeatureGroup } from '../_content/landing';
import { LandingIcon, type LandingIconId } from '../_content/landing-icons';
import styles from './feature-tiles-showcase.module.css';

type FeatureTile = {
  id: string;
  slug: string;
  name: string;
  label: string;
  desc: string;
  accent: string;
  icon: LandingIconId;
  index: number;
  group: LandingFeatureGroup;
};

const TILE_META: Omit<FeatureTile, 'group' | 'index'>[] = [
  {
    id: 'features-academic',
    slug: 'academic',
    name: 'academic',
    label: 'Academic operations',
    desc: 'Templates, teams, planner, courses, and instructor workflows.',
    accent: '#f97316',
    icon: 'templates',
  },
  {
    id: 'features-delivery',
    slug: 'delivery',
    name: 'delivery',
    label: 'Delivery & insight',
    desc: 'Dashboard, GitHub CLI, IDE, notifications, and analytics.',
    accent: '#22c55e',
    icon: 'github-cli',
  },
  {
    id: 'features-engagement',
    slug: 'engagement',
    name: 'engagement',
    label: 'Engagement & motivation',
    desc: 'Hassona, Q&A, competitions, badges, and level progression.',
    accent: '#a855f7',
    icon: 'hassona',
  },
];

function buildTiles(): FeatureTile[] {
  return TILE_META.map((meta, index) => {
    const group = featureGroups.find((g) => g.id === meta.id);
    if (!group) throw new Error(`Missing feature group: ${meta.id}`);
    return { ...meta, index: index + 1, group };
  });
}

const TILES = buildTiles();

export default function FeatureTilesShowcase() {
  const [activeId, setActiveId] = useState(TILES[0].id);

  const selectTile = useCallback((id: string) => {
    setActiveId(id);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
    }
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && TILES.some((t) => t.id === hash)) {
      setActiveId(hash);
    }
  }, []);

  const active = TILES.find((t) => t.id === activeId) ?? TILES[0];

  return (
    <section id="features" className={styles.section} aria-labelledby="features-heading">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Features</p>
        <h2 id="features-heading" className={styles.title}>
          Three terminals.
          <span className={styles.titleDim}> One platform.</span>
        </h2>
        <p className={styles.sub}>
          Pick a surface on the left — each opens as its own live terminal with the modules
          inside.
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.tileList} role="tablist" aria-label="Feature terminals">
          {TILES.map((tile) => {
            const isActive = tile.id === activeId;
            return (
              <button
                key={tile.id}
                type="button"
                role="tab"
                id={`tab-${tile.slug}`}
                aria-selected={isActive}
                aria-controls={`panel-${tile.slug}`}
                className={`${styles.tile} ${isActive ? styles.tileActive : ''}`}
                style={
                  {
                    '--tile-accent': tile.accent,
                  } as React.CSSProperties
                }
                onClick={() => selectTile(tile.id)}
              >
                <span className={styles.tileIndex}>{tile.index}</span>
                <span className={styles.tileIcon} aria-hidden="true">
                  <LandingIcon id={tile.icon} />
                </span>
                <span className={styles.tileName}>{tile.name}</span>
                <span className={styles.tileDesc}>{tile.desc}</span>
              </button>
            );
          })}
        </div>

        <div
          className={styles.previewWrap}
          role="tabpanel"
          id={`panel-${active.slug}`}
          aria-labelledby={`tab-${active.slug}`}
        >
          <div className={styles.previewTerminal}>
            <div className={styles.previewTitleBar}>
              <span className={styles.dot} style={{ background: '#ff5f57' }} />
              <span className={styles.dot} style={{ background: '#febc2e' }} />
              <span className={styles.dot} style={{ background: '#28c840' }} />
              <span className={styles.previewTitle}>
                {active.name} — live preview
              </span>
            </div>

            <div className={styles.previewBody}>
              <div className={styles.previewLine}>
                <span className={styles.previewLabel}>YOU</span>
              </div>
              <div className={styles.previewLine}>
                <span className={styles.previewPrompt}>{'>'}</span>
                <span className={styles.previewCmd}>
                  {' '}
                  nibras features --group {active.slug}
                </span>
              </div>

              <div className={styles.previewAgent}>
                <span
                  className={styles.agentDot}
                  style={{ background: active.accent }}
                  aria-hidden="true"
                />
                <span className={styles.agentName}>nibras</span>
                <span className={styles.agentModel}>{active.label}</span>
                <span className={styles.agentStatus} style={{ color: active.accent }}>
                  listing
                </span>
              </div>

              <ul className={styles.previewModules}>
                {active.group.features.map((feature) => (
                  <li key={feature.title} className={styles.previewModule}>
                    <span className={styles.moduleBullet} style={{ color: active.accent }}>
                      •
                    </span>
                    <span className={styles.moduleTitle}>{feature.title}</span>
                    <span className={styles.moduleDesc}>{feature.desc}</span>
                  </li>
                ))}
              </ul>

              <div className={styles.previewLine}>
                <span className={styles.previewMuted}>
                  {active.group.features.length} modules loaded ·{' '}
                </span>
                <span className={styles.previewOk} style={{ color: active.accent }}>
                  ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className={styles.footer}>
        <span className={styles.footerIndex}>
          {String(active.index).padStart(2, '0')}
        </span>
        <span className={styles.footerDot}>·</span>
        <span className={styles.footerName}>{active.name.toUpperCase()}</span>
        <span className={styles.footerDesc}>{active.group.label} — {active.desc}</span>
      </p>
    </section>
  );
}
