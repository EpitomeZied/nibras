'use client';

import Editor, { type OnMount } from '@monaco-editor/react';
import { useCallback } from 'react';
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
  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun?.();
      });
      editor.focus();
    },
    [onRun]
  );

  return (
    <div className={styles.editorPane}>
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={(next) => onChange(next ?? '')}
        onMount={handleMount}
        theme="vs-dark"
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
