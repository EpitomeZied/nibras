'use client';

import { useCallback, useState } from 'react';
import type { IdeRunResponse } from '@nibras/contracts';
import styles from '../page.module.css';

export type IdeRunHistoryEntry = {
  id: string;
  at: string;
  status: string;
  time: string | null;
  memory: number | null;
};

type IdePanelsProps = {
  stdin: string;
  onStdinChange: (value: string) => void;
  result: IdeRunResponse | null;
  running: boolean;
  runHistory: IdeRunHistoryEntry[];
  limitsLabel?: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

function verdictClass(description: string): string {
  const normalized = description.toLowerCase();
  if (normalized.includes('accepted')) return styles.verdictAccepted;
  if (normalized.includes('compilation error')) return styles.verdictCompile;
  return styles.verdictError;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  }, [text]);

  return (
    <button type="button" className={styles.copyButton} onClick={() => void handleCopy()}>
      {copied ? 'Copied' : label}
    </button>
  );
}

export default function IdePanels({
  stdin,
  onStdinChange,
  result,
  running,
  runHistory,
  limitsLabel,
  collapsed = false,
  onToggleCollapse,
}: IdePanelsProps) {
  const compileOutput = result?.compileOutput?.trim() ?? '';
  const stderr = result?.stderr?.trim() ?? '';
  const stdout = result?.stdout ?? '';
  const message = result?.message?.trim() ?? '';
  const outputText = running
    ? 'Executing in sandbox…'
    : result
      ? stdout.trimEnd() || '(no stdout)'
      : 'Run your code to see output here.';

  if (collapsed) {
    return (
      <div className={styles.sidePanelsCollapsed}>
        <button type="button" className={styles.expandPanelsButton} onClick={onToggleCollapse}>
          Show input &amp; output
        </button>
      </div>
    );
  }

  return (
    <div className={styles.sidePanels}>
      {onToggleCollapse ? (
        <button type="button" className={styles.collapsePanelsButton} onClick={onToggleCollapse}>
          Hide panels
        </button>
      ) : null}

      {limitsLabel ? <p className={styles.limitsHint}>{limitsLabel}</p> : null}

      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <h2>Input</h2>
          <span className={styles.panelHint}>stdin</span>
        </header>
        <textarea
          className={styles.panelTextarea}
          value={stdin}
          onChange={(event) => onStdinChange(event.target.value)}
          placeholder="Optional standard input for your program"
          spellCheck={false}
        />
      </section>

      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <h2>Output</h2>
          <div className={styles.panelHeaderActions}>
            {result && stdout ? <CopyButton text={stdout} label="Copy" /> : null}
            {result ? (
              <span className={`${styles.verdictBadge} ${verdictClass(result.status.description)}`}>
                {result.status.description}
              </span>
            ) : running ? (
              <span className={styles.panelHint}>Running…</span>
            ) : null}
          </div>
        </header>
        <pre className={styles.panelOutput}>{outputText}</pre>
      </section>

      {message ? (
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>Message</h2>
            <CopyButton text={message} label="Copy" />
          </header>
          <pre className={styles.panelOutput}>{message}</pre>
        </section>
      ) : null}

      {(stderr || compileOutput) && (
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>{compileOutput ? 'Compile Output' : 'Stderr'}</h2>
            <CopyButton text={compileOutput || stderr} label="Copy" />
          </header>
          <pre className={`${styles.panelOutput} ${styles.panelOutputError}`}>
            {compileOutput || stderr}
          </pre>
        </section>
      )}

      {result && (result.time || result.memory != null) && (
        <div className={styles.metaRow}>
          {result.time ? <span>Time: {result.time}s</span> : null}
          {result.memory != null ? <span>Memory: {result.memory} KB</span> : null}
        </div>
      )}

      {runHistory.length > 0 && (
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>Run history</h2>
          </header>
          <ul className={styles.runHistoryList}>
            {runHistory.map((entry) => (
              <li key={entry.id} className={styles.runHistoryItem}>
                <span className={`${styles.verdictBadge} ${verdictClass(entry.status)}`}>
                  {entry.status}
                </span>
                <span className={styles.runHistoryMeta}>
                  {new Date(entry.at).toLocaleTimeString()}
                  {entry.time ? ` · ${entry.time}s` : ''}
                  {entry.memory != null ? ` · ${entry.memory} KB` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
