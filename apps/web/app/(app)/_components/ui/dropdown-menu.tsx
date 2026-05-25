'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import styles from './dropdown-menu.module.css';

/* ── Single-open coordination across header dropdowns ───────────────────── */

type DropdownGroupContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const DropdownGroupContext = createContext<DropdownGroupContextValue | null>(null);

const DropdownCloseContext = createContext<(() => void) | null>(null);

/** Call from menu item handlers to close the parent dropdown. */
export function useDropdownClose(): () => void {
  const close = useContext(DropdownCloseContext);
  return close ?? (() => {});
}

export function DropdownGroup({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <DropdownGroupContext.Provider value={{ openId, setOpenId }}>
      {children}
    </DropdownGroupContext.Provider>
  );
}

/* ── Chevron (shared by nav + user triggers) ─────────────────────────────── */

export function DropdownChevron({ open }: { open: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
    >
      <path
        d="M2 4l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── DropdownMenu ────────────────────────────────────────────────────────── */

export type DropdownMenuProps = {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    close: () => void;
    triggerRef: (node: HTMLElement | null) => void;
    triggerProps: {
      'aria-expanded': boolean;
      'aria-haspopup': true;
      'aria-controls': string;
      onClick: () => void;
    };
  }) => ReactElement;
  children: ReactNode;
  align?: 'start' | 'end';
  width?: 'sm' | 'md' | 'lg' | 'auto';
  panelClassName?: string;
  onOpenChange?: (open: boolean) => void;
  /** When true, arrow keys move focus between [role="menuitem"] elements */
  menuKeyboard?: boolean;
};

export default function DropdownMenu({
  trigger,
  children,
  align = 'end',
  width = 'auto',
  panelClassName,
  onOpenChange,
  menuKeyboard = false,
}: DropdownMenuProps) {
  const instanceId = useId();
  const panelId = `${instanceId}-panel`;
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const group = useContext(DropdownGroupContext);

  const openFromGroup = group?.openId === instanceId;
  const [localOpen, setLocalOpen] = useState(false);
  const open = group ? openFromGroup : localOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (group) {
        group.setOpenId(next ? instanceId : null);
      } else {
        setLocalOpen(next);
      }
      onOpenChange?.(next);
    },
    [group, instanceId, onOpenChange]
  );

  const close = useCallback(() => {
    if (!open) return;
    setOpen(false);
    triggerRef.current?.focus();
  }, [open, setOpen]);

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        close();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  /* arrow-key roving focus between menuitems */
  useEffect(() => {
    if (!open || !menuKeyboard) return;
    function handler(e: KeyboardEvent) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') {
        return;
      }
      const menuRoot = wrapRef.current?.querySelector(
        `#${CSS.escape(panelId)}`
      ) as HTMLElement | null;
      if (!menuRoot) return;
      const items = Array.from(menuRoot.querySelectorAll<HTMLElement>('[role="menuitem"]')).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
      );
      if (items.length === 0) return;

      e.preventDefault();
      const current = document.activeElement as HTMLElement | null;
      const idx = items.indexOf(current as HTMLElement);

      if (e.key === 'Home') {
        items[0]?.focus();
        return;
      }
      if (e.key === 'End') {
        items[items.length - 1]?.focus();
        return;
      }
      const next =
        e.key === 'ArrowDown'
          ? items[(idx + 1 + items.length) % items.length]
          : items[(idx - 1 + items.length) % items.length];
      (next ?? items[0])?.focus();
    }

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, menuKeyboard, panelId]);

  const widthClass =
    width === 'sm'
      ? styles.panelWidthSm
      : width === 'md'
        ? styles.panelWidthMd
        : width === 'lg'
          ? styles.panelWidthLg
          : styles.panelWidthAuto;

  const alignClass = align === 'start' ? styles.panelAlignStart : styles.panelAlignEnd;

  const setTriggerRef = useCallback((node: HTMLElement | null) => {
    triggerRef.current = node;
  }, []);

  const triggerElement = trigger({
    open,
    toggle,
    close,
    triggerRef: setTriggerRef,
    triggerProps: {
      'aria-expanded': open,
      'aria-haspopup': true,
      'aria-controls': panelId,
      onClick: toggle,
    },
  });

  return (
    <div ref={wrapRef} className={styles.root}>
      {triggerElement}

      {open && (
        <DropdownCloseContext.Provider value={close}>
          <div
            id={panelId}
            role="menu"
            className={`${styles.panel} ${alignClass} ${widthClass} ${panelClassName ?? ''}`}
          >
            {children}
          </div>
        </DropdownCloseContext.Provider>
      )}
    </div>
  );
}
