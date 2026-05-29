import styles from './feature-tiles-showcase.module.css';

/** Static assets for CLI showcase tiles — drop SVGs into `public/landing/cli-tiles/`. */
export const CLI_TILE_ICONS_BASE = '/landing/cli-tiles';

export function cliTileIconSrc(iconFile: string): string {
  const file = iconFile.endsWith('.svg') ? iconFile : `${iconFile}.svg`;
  return `${CLI_TILE_ICONS_BASE}/${file}`;
}

export default function CliTileIcon({ iconFile }: { iconFile: string }) {
  const src = cliTileIconSrc(iconFile);

  return (
    <span
      className={styles.tileIconMark}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
      }}
      aria-hidden="true"
    />
  );
}
