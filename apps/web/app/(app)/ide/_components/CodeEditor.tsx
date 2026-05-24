'use client';

import Editor, { type OnMount } from '@monaco-editor/react';
import { useCallback, useEffect, useState } from 'react';
import { configureMonacoLoader } from './monaco-bootstrap';
import styles from '../page.module.css';

type CodeEditorProps = {
  language: string;
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  readOnly?: boolean;
};

export default function CodeEditor({
  language,
  value,
  onChange,
  onRun,
  readOnly = false,
}: CodeEditorProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    configureMonacoLoader();
    setReady(true);
  }, []);

  const handleMount: OnMount = useCallback(
    (editor, editorMonaco) => {
      editor.addCommand(editorMonaco.KeyMod.CtrlCmd | editorMonaco.KeyCode.Enter, () => {
        onRun?.();
      });
      editor.focus();
    },
    [onRun]
  );

  if (!ready) {
    return (
      <div className={styles.editorPane}>
        <div className={styles.editorLoading}>Loading editor…</div>
      </div>
    );
  }

  return (
    <div className={styles.editorPane}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(next) => onChange(next ?? '')}
        onMount={handleMount}
        theme="vs-dark"
        loading={<div className={styles.editorLoading}>Loading editor…</div>}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'off',
          padding: { top: 12 },
        }}
      />
    </div>
  );
}
