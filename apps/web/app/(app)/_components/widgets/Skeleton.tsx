'use client';

import styles from './Skeleton.module.css';

export type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  variant?: 'line' | 'circle' | 'card';
  count?: number;
};

export default function Skeleton({
  width,
  height,
  variant = 'line',
  count = 1,
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <>
      {items.map((i) => (
        <div
          key={i}
          className={`${styles.skeleton} ${styles[variant]}`}
          style={{
            width: width ?? (variant === 'circle' ? height : '100%'),
            height: height ?? (variant === 'line' ? 14 : variant === 'circle' ? 28 : 72),
          }}
        />
      ))}
    </>
  );
}
