'use client';

import { useCallback, useEffect, useState } from 'react';
import { listBookmarkIds, toggleQuestionBookmark } from '../services/community';
import { useSession } from '../../(app)/_components/session-context';

const STORAGE_KEY = 'nibras.community.bookmarks';

function readLocalBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useBookmarks() {
  const { user } = useSession();
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setBookmarks([]);
      setReady(true);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const serverIds = await listBookmarkIds();
        const localIds = readLocalBookmarks();
        const merged = [...new Set([...serverIds, ...localIds])];
        if (!alive) return;
        setBookmarks(merged);
        for (const id of localIds) {
          if (!serverIds.includes(id)) {
            void toggleQuestionBookmark(id, true).catch(() => undefined);
          }
        }
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        if (alive) setBookmarks(readLocalBookmarks());
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const toggle = useCallback(
    async (id: string) => {
      const nextOn = !bookmarks.includes(id);
      setBookmarks((prev) => (nextOn ? [...prev, id] : prev.filter((b) => b !== id)));
      if (user) {
        try {
          await toggleQuestionBookmark(id, nextOn);
        } catch {
          setBookmarks((prev) => (nextOn ? prev.filter((b) => b !== id) : [...prev, id]));
        }
      } else {
        const next = nextOn ? [...bookmarks, id] : bookmarks.filter((b) => b !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    },
    [bookmarks, user]
  );

  const isBookmarked = useCallback((id: string) => bookmarks.includes(id), [bookmarks]);

  return { bookmarks, toggle, isBookmarked, ready };
}
