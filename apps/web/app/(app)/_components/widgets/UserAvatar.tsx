'use client';

import Image from 'next/image';
import { githubAvatarUrl, getInitials } from '../../../lib/utils';
import styles from './Avatar.module.css';

export type UserAvatarProps = {
  name: string;
  size?: number;
  url?: string;
  githubLogin?: string | null;
  loading?: boolean;
  alt?: string;
  className?: string;
  /** Use next/image (for header/settings); default false uses img */
  useNextImage?: boolean;
  style?: React.CSSProperties;
};

export default function UserAvatar({
  name,
  size = 28,
  url,
  githubLogin,
  loading = false,
  alt,
  className,
  useNextImage = false,
  style,
}: UserAvatarProps) {
  const imageUrl = url ?? githubAvatarUrl(githubLogin, size);
  const label = alt ?? name;

  if (imageUrl) {
    if (useNextImage) {
      return (
        <Image
          src={imageUrl}
          alt={label}
          width={size}
          height={size}
          className={className ?? styles.avatarImg}
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            ...style,
          }}
        />
      );
    }
    return (
      <span
        className={[styles.avatar, className].filter(Boolean).join(' ')}
        style={{ width: size, height: size, ...style }}
        title={name}
      >
        <img src={imageUrl} alt={label} className={styles.img} width={size} height={size} />
      </span>
    );
  }

  return (
    <span
      className={[styles.avatar, className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), ...style }}
      title={name}
    >
      {loading ? '…' : getInitials(name)}
    </span>
  );
}
