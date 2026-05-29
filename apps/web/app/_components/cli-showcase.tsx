'use client';

import { useCallback, useState, type CSSProperties } from 'react';
import { cliShowcaseCopy, cliShowcaseTiles, type CliShowcaseTile } from '../_content/landing';
import CliTileIcon from './cli-tile-icon';
import styles from './feature-tiles-showcase.module.css';

function lineClass(kind: CliShowcaseTile['lines'][number]['kind']): string {
  switch (kind) {
    case 'ok':
      return styles.previewOk;
    case 'warn':
      return styles.previewWarn;
    case 'highlight':
      return styles.previewHighlight;
    case 'progress':
      return styles.previewProgress;
    case 'text':
      return styles.previewText;
    default:
      return styles.previewMuted;
  }
}

export default function CliShowcase() {
  const [activeSlug, setActiveSlug] = useState(cliShowcaseTiles[0].slug);

  const selectTile = useCallback((slug: string) => {
    setActiveSlug(slug);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#cli`);
    }
  }, []);

  const active = cliShowcaseTiles.find((t) => t.slug === activeSlug) ?? cliShowcaseTiles[0];
  const activeIndex = cliShowcaseTiles.findIndex((t) => t.slug === active.slug) + 1;

  return (
    <section
      id="cli"
      className={`${styles.section} ${styles.sectionCli}`}
      aria-labelledby="cli-heading"
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>{cliShowcaseCopy.eyebrow}</p>
        <h2 id="cli-heading" className={styles.title}>
          {cliShowcaseCopy.titleBright}
          <span className={styles.titleDim}>{cliShowcaseCopy.titleDim}</span>
        </h2>
        <p className={styles.sub}>{cliShowcaseCopy.sub}</p>
      </header>

      <div className={styles.layout}>
        <div className={styles.tileList} role="tablist" aria-label="CLI workflows">
          {cliShowcaseTiles.map((tile, index) => {
            const isActive = tile.slug === activeSlug;
            return (
              <button
                key={tile.slug}
                type="button"
                role="tab"
                id={`tab-cli-${tile.slug}`}
                aria-selected={isActive}
                aria-controls={`panel-cli-${tile.slug}`}
                className={`${styles.tile} ${isActive ? styles.tileActive : ''}`}
                style={{ '--tile-accent': tile.accent } as CSSProperties}
                onClick={() => selectTile(tile.slug)}
              >
                <span className={styles.tileIndex}>{index + 1}</span>
                <span className={styles.tileIcon} aria-hidden="true">
                  <CliTileIcon iconFile={tile.iconFile ?? tile.slug} />
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
          id={`panel-cli-${active.slug}`}
          aria-labelledby={`tab-cli-${active.slug}`}
        >
          <div className={styles.previewTerminal}>
            <div className={styles.previewTitleBar}>
              <span className={styles.dot} style={{ background: '#ff5f57' }} />
              <span className={styles.dot} style={{ background: '#febc2e' }} />
              <span className={styles.dot} style={{ background: '#28c840' }} />
              <span className={styles.previewTitle}>{active.name} — live preview</span>
            </div>

            <div className={styles.previewBody}>
              <div className={styles.previewLine}>
                <span className={styles.previewLabel}>YOU</span>
              </div>
              <div className={styles.previewLine}>
                <span className={styles.previewPrompt}>{'>'}</span>
                <span className={styles.previewCmd}> {active.command}</span>
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
                  running
                </span>
              </div>

              <div className={styles.cliOutput}>
                {active.lines.map((line, lineIdx) => (
                  <div key={`${active.slug}-${lineIdx}`} className={styles.previewLine}>
                    <span
                      className={lineClass(line.kind)}
                      style={
                        line.kind === 'ok' || line.kind === 'highlight'
                          ? { color: active.accent }
                          : undefined
                      }
                    >
                      {line.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.previewLine}>
                <span className={styles.previewMuted}>{active.lines.length} events · </span>
                <span className={styles.previewOk} style={{ color: active.accent }}>
                  ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className={styles.footer}>
        <span className={styles.footerIndex}>{String(activeIndex).padStart(2, '0')}</span>
        <span className={styles.footerDot}>·</span>
        <span className={styles.footerName}>{active.name.toUpperCase()}</span>
        <span className={styles.footerDesc}>
          {active.label} — {active.desc}
        </span>
      </p>
    </section>
  );
}
