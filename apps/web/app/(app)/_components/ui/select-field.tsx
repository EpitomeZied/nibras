'use client';

import type { ReactNode } from 'react';
import styles from './select-field.module.css';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type RichSelectPreview = {
  badge: string;
  title: string;
  meta: string;
};

export type SelectFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  hint?: string;
  'aria-label'?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  variant?: 'default' | 'filter' | 'rich';
  className?: string;
  selectClassName?: string;
  /** Required for variant="rich" — preview shown behind the native select */
  richPreview?: RichSelectPreview | null;
  children?: ReactNode;
};

export default function SelectField({
  id,
  name,
  label,
  hint,
  'aria-label': ariaLabel,
  value,
  onChange,
  options,
  disabled = false,
  variant = 'default',
  className,
  selectClassName,
  richPreview,
  children,
}: SelectFieldProps) {
  const resolvedAriaLabel = ariaLabel ?? label;

  if (variant === 'rich') {
    return (
      <label className={`${styles.field} ${className ?? ''}`} htmlFor={id}>
        {(label || hint) && (
          <div className={styles.header}>
            {label ? <span className={styles.label}>{label}</span> : null}
            {hint ? <span className={styles.hint}>{hint}</span> : null}
          </div>
        )}
        <div className={`${styles.richShell} ${disabled ? styles.richShellDisabled : ''}`}>
          <div className={styles.richPreview} aria-hidden="true">
            <span className={styles.richBadge}>{richPreview?.badge ?? '—'}</span>
            <span className={styles.richText}>
              <strong className={styles.richTitle}>
                {richPreview?.title ?? 'Select an option'}
              </strong>
              <span className={styles.richMeta}>{richPreview?.meta ?? ''}</span>
            </span>
          </div>
          <select
            id={id}
            name={name}
            className={`${styles.richNative} ${selectClassName ?? ''}`}
            aria-label={resolvedAriaLabel}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
          >
            {children ??
              options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))}
          </select>
          <span className={styles.richChevron} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 6.5 8 10l4-3.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </label>
    );
  }

  const selectClass = variant === 'filter' ? styles.selectFilter : styles.selectDefault;

  const select = (
    <select
      id={id}
      name={name}
      className={`${selectClass} ${selectClassName ?? ''}`}
      aria-label={label ? undefined : resolvedAriaLabel}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {children ??
        options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
    </select>
  );

  if (!label && !hint) {
    return <div className={className}>{select}</div>;
  }

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {(label || hint) && (
        <div className={styles.header}>
          {label ? (
            <label className={styles.label} htmlFor={id}>
              {label}
            </label>
          ) : null}
          {hint ? <span className={styles.hint}>{hint}</span> : null}
        </div>
      )}
      {select}
    </div>
  );
}
