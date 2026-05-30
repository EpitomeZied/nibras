'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/session';
import styles from './search.module.css';

interface SearchItem {
  id: string;
  title: string;
  type: 'project' | 'milestone' | 'course';
  href: string;
  subtitle?: string;
}

export function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Load search data lazily on first open
  useEffect(() => {
    if (!isOpen || loaded) return;
    void (async () => {
      try {
        const res = await apiFetch('/v1/tracking/dashboard/student', { auth: true });
        if (!res.ok) return;
        const data = (await res.json()) as {
          course?: { id: string } | null;
          projects?: Array<{ id: string; title: string; courseId?: string }>;
          milestonesByProject?: Record<
            string,
            Array<{ id: string; title: string; status: string }>
          >;
        };
        const courseId = data.course?.id ?? '';
        const searchItems: SearchItem[] = [];
        for (const project of data.projects ?? []) {
          const projectCourseId = project.courseId || courseId;
          const params = new URLSearchParams();
          if (projectCourseId) params.set('courseId', projectCourseId);
          params.set('projectId', project.id);
          const baseHref = `/projects?${params.toString()}`;
          searchItems.push({
            id: `project-${project.id}`,
            title: project.title,
            type: 'project',
            href: baseHref,
          });
          for (const milestone of data.milestonesByProject?.[project.id] ?? []) {
            searchItems.push({
              id: `milestone-${milestone.id}`,
              title: milestone.title,
              type: 'milestone',
              href: `${baseHref}#milestone-${milestone.id}`,
              subtitle: project.title,
            });
          }
        }
        setItems(searchItems);
        setLoaded(true);
      } catch {
        // silent
      }
    })();
  }, [isOpen, loaded]);

  // Open/close dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      dialog.showModal();
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      dialog.close();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Close on backdrop click
  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  const filtered = query.trim()
    ? items.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase())
      )
    : items.slice(0, 8);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === 'Enter' && filtered[selectedIndex]) {
      router.push(filtered[selectedIndex].href);
      onClose();
    }
    if (e.key === 'Escape') onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleDialogClick}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.modal}>
        <div className={styles.inputRow}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder="Search projects and milestones..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            autoComplete="off"
          />
          <kbd className={styles.escKey}>esc</kbd>
        </div>
        <ul className={styles.results} role="listbox">
          {filtered.length === 0 && query && (
            <li className={styles.empty}>No results for &quot;{query}&quot;</li>
          )}
          {filtered.map((item, i) => (
            <li
              key={item.id}
              role="option"
              aria-selected={i === selectedIndex}
              className={`${styles.result} ${i === selectedIndex ? styles.selected : ''}`}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => {
                router.push(item.href);
                onClose();
              }}
            >
              <span className={styles.resultIcon}>{item.type === 'project' ? '📁' : '✓'}</span>
              <span className={styles.resultText}>
                <span className={styles.resultTitle}>{item.title}</span>
                {item.subtitle && <span className={styles.resultSub}>{item.subtitle}</span>}
              </span>
              <span className={styles.resultType}>{item.type}</span>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}

export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-label="Open search (⌘K)"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className={styles.triggerText}>Search...</span>
        <kbd className={styles.kbd}>⌘K</kbd>
      </button>
      {open && <SearchModal isOpen={open} onClose={() => setOpen(false)} />}
    </>
  );
}
