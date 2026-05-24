'use client';

import type { IdeRunResponse } from '@nibras/contracts';
import styles from '../page.module.css';

type IdePanelsProps = {
  stdin: string;
  onStdinChange: (value: string) => void;
  result: IdeRunResponse | null;
  running: boolean;
};

function verdictClass(description: string): string {
  const normalized = description.toLowerCase();
  if (normalized.includes('accepted')) return styles.verdictAccepted;
  if (normalized.includes('compilation error')) return styles.verdictCompile;
  return styles.verdictError;
}

export default function IdePanels({ stdin, onStdinChange, result, running }: IdePanelsProps) {
  const compileOutput = result?.compileOutput?.trim() ?? '';
  const stderr = result?.stderr?.trim() ?? '';
  const stdout = result?.stdout ?? '';

  return (
    <div className={styles.sidePanels}>
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
          {result ? (
            <span className={`${styles.verdictBadge} ${verdictClass(result.status.description)}`}>
              {result.status.description}
            </span>
          ) : running ? (
            <span className={styles.panelHint}>Running…</span>
          ) : null}
        </header>
        <pre className={styles.panelOutput}>
          {running
            ? 'Executing in sandbox…'
            : stdout || (result ? '(no stdout)' : 'Run your code to see output here.')}
        </pre>
      </section>

      {(stderr || compileOutput) && (
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2>{compileOutput ? 'Compile Output' : 'Stderr'}</h2>
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
    </div>
  );
}
