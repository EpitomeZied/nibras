'use client';

import Editor, { type OnMount } from '@monaco-editor/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureMonacoReady } from './monaco-bootstrap';
import { useEditorTheme } from '../_hooks/use-editor-theme';
import styles from '../page.module.css';

type CodeEditorProps = {
  language: string;
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
  fontSize?: number;
  wordWrap?: boolean;
};

export default function CodeEditor({
  language,
  value,
  onChange,
  onRun,
  readOnly = false,
  fontSize = 14,
  wordWrap = false,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [height, setHeight] = useState(480);
  const monacoTheme = useEditorTheme();

  useEffect(() => {
    let cancelled = false;

    ensureMonacoReady()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setInitError(error instanceof Error ? error.message : 'Failed to load code editor');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateHeight = () => {
      setHeight(Math.max(element.clientHeight, 320));
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ready]);

  const handleMount: OnMount = useCallback(
    (editor, editorMonaco) => {
      editor.addCommand(editorMonaco.KeyMod.CtrlCmd | editorMonaco.KeyCode.Enter, () => {
        onRun?.();
      });
      editor.focus();
    },
    [onRun]
  );

  if (initError) {
    return (
      <div className={styles.editorPane}>
        <div className={styles.editorLoading}>{initError}</div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className={styles.editorPane}>
        <div className={styles.editorLoading}>Loading editor…</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={styles.editorPane}>
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(next) => onChange(next ?? '')}
        onMount={handleMount}
        theme={monacoTheme}
        loading={<div className={styles.editorLoading}>Loading editor…</div>}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: wordWrap ? 'on' : 'off',
          padding: { top: 12 },
        }}
      />
    </div>
  );
}
