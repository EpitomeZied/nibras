'use client';

import { useEffect, useState } from 'react';

export function useEditorTheme(): 'vs' | 'vs-dark' {
  const [theme, setTheme] = useState<'vs' | 'vs-dark'>('vs-dark');

  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const dataTheme = root.getAttribute('data-theme');
      setTheme(dataTheme === 'light' ? 'vs' : 'vs-dark');
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
