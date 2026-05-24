'use client';

import { type RefObject } from 'react';
import styles from './MarkdownToolbar.module.css';

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
}

type Action = { label: string; icon: React.ReactNode; wrap: [string, string] };

const ACTIONS: Action[] = [
  {
    label: 'Bold',
    icon: <strong>B</strong>,
    wrap: ['**', '**'],
  },
  {
    label: 'Italic',
    icon: <em>I</em>,
    wrap: ['_', '_'],
  },
  {
    label: 'Inline code',
    icon: <code>&lt;/&gt;</code>,
    wrap: ['`', '`'],
  },
  {
    label: 'Code block',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <rect x="1" y="2" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <path d="M4 6l2 1.5L4 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 9h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    wrap: ['\n```\n', '\n```\n'],
  },
  {
    label: 'Link',
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M6 8l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M8.5 5.5l1-1a2 2 0 012.83 2.83l-1 1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M5.5 8.5l-1 1a2 2 0 01-2.83-2.83l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
    wrap: ['[', '](url)'],
  },
];

export default function MarkdownToolbar({ textareaRef, onChange }: Props) {
  function apply(action: Action) {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.slice(start, end);
    const [before, after] = action.wrap;
    const replacement = `${before}${selected || 'text'}${after}`;
    const next = text.slice(0, start) + replacement + text.slice(end);

    onChange(next);

    requestAnimationFrame(() => {
      ta.focus();
      const cursorPos = start + before.length + (selected || 'text').length;
      ta.setSelectionRange(
        selected ? start + before.length : start + before.length,
        selected ? start + before.length + selected.length : cursorPos
      );
    });
  }

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Markdown formatting">
      {ACTIONS.map((action) => (
        <button
          key={action.label}
          type="button"
          className={styles.btn}
          title={action.label}
          aria-label={action.label}
          onClick={() => apply(action)}
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
