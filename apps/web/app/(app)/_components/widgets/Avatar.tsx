'use client';

import styles from './Avatar.module.css';

export type AvatarProps = {
  url?: string;
  name: string;
  size?: number;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name[0] ?? '?').toUpperCase();
}

export default function Avatar({ url, name, size = 28 }: AvatarProps) {
  return (
    <span
      className={styles.avatar}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      title={name}
    >
      {url ? (
        <img src={url} alt={name} className={styles.img} width={size} height={size} />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
