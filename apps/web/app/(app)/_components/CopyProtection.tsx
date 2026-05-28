'use client';

import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
};

/** Discourage copying quiz content (selection, context menu, common shortcuts). */
export default function CopyProtection({ children, className }: Props) {
  return (
    <div
      className={className}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.ctrlKey || e.metaKey) {
          const key = e.key.toLowerCase();
          if (key === 'c' || key === 'x' || key === 'a' || key === 'p') {
            e.preventDefault();
          }
        }
      }}
    >
      {children}
    </div>
  );
}
