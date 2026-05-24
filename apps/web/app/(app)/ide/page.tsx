'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IdeLanguage, IdeRunResponse } from '@nibras/contracts';
import { friendlyMessage } from '../../lib/api-clients/errors';
import { getIdeStatus, listIdeLanguages, runIdeCode } from '../../lib/services/ide';
import IdePanels from './_components/IdePanels';
import {
  pickDefaultLanguageId,
  readPersistedState,
  templateForLanguage,
  writePersistedState,
} from './_content/templates';
import styles from './page.module.css';

const CodeEditor = dynamic(() => import('./_components/CodeEditor'), {
  ssr: false,
  loading: () => <div className={styles.editorPane}>Loading editor…</div>,
});

type IdeAvailability = {
  configured: boolean;
  reachable: boolean;
};

export default function IdePage() {
  const [availability, setAvailability] = useState<IdeAvailability | null>(null);
  const [languages, setLanguages] = useState<IdeLanguage[]>([]);
  const [languageId, setLanguageId] = useState<number | null>(null);
  const [sourceCode, setSourceCode] = useState('');
  const [stdin, setStdin] = useState('');
  const [monacoLanguage, setMonacoLanguage] = useState('cpp');
  const [result, setResult] = useState<IdeRunResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedLanguage = useMemo(
    () => languages.find((language) => language.id === languageId) ?? null,
    [languages, languageId]
  );

  const applyLanguage = useCallback((language: IdeLanguage, preserveSource = false) => {
    const template = templateForLanguage(language.name);
    setLanguageId(language.id);
    setMonacoLanguage(template.monacoLanguage);
    if (!preserveSource) {
      setSourceCode(template.source);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const status = await getIdeStatus();
        if (cancelled) return;
        setAvailability(status);

        if (!status.configured || !status.reachable) {
          setLoading(false);
          return;
        }

        const nextLanguages = await listIdeLanguages();
        if (cancelled) return;
        setLanguages(nextLanguages);

        const persisted = readPersistedState();
        const defaultLanguageId = persisted?.languageId ?? pickDefaultLanguageId(nextLanguages);
        const initialLanguage =
          nextLanguages.find((language) => language.id === defaultLanguageId) ?? nextLanguages[0];

        if (initialLanguage) {
          applyLanguage(initialLanguage, Boolean(persisted?.sourceCode));
          if (persisted?.sourceCode) {
            setSourceCode(persisted.sourceCode);
          }
          if (persisted?.stdin) {
            setStdin(persisted.stdin);
          }
        }
      } catch (bootstrapError) {
        if (!cancelled) {
          setError(friendlyMessage(bootstrapError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applyLanguage]);

  useEffect(() => {
    if (languageId == null) return;
    writePersistedState({ languageId, sourceCode, stdin });
  }, [languageId, sourceCode, stdin]);

  const handleLanguageChange = useCallback(
    (nextLanguageId: number) => {
      const language = languages.find((item) => item.id === nextLanguageId);
      setError(null);
      setResult(null);
      if (language) {
        applyLanguage(language);
      }
    },
    [applyLanguage, languages]
  );

  const handleRun = useCallback(async () => {
    if (languageId == null || running) return;

    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await runIdeCode({
        sourceCode,
        languageId,
        stdin: stdin || undefined,
      });
      setResult(response);
    } catch (runError) {
      setError(friendlyMessage(runError));
    } finally {
      setRunning(false);
    }
  }, [languageId, running, sourceCode, stdin]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.banner}>Loading playground…</div>
      </div>
    );
  }

  if (!availability?.configured || !availability.reachable) {
    return (
      <div className={styles.page}>
        <div className={styles.banner} role="alert">
          <strong>Code sandbox is not available.</strong>
          <p style={{ margin: '8px 0 0' }}>
            Start Judge0 locally with <code>docker compose -f docker-compose.judge0.yml up -d</code>
            , then set <code>JUDGE0_API_URL</code> and <code>JUDGE0_AUTH_TOKEN</code> in your API{' '}
            <code>.env</code> and restart the API.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <label className={styles.panelHint} htmlFor="ide-language">
          Language
        </label>
        <select
          id="ide-language"
          className={styles.languageSelect}
          value={languageId ?? ''}
          onChange={(event) => handleLanguageChange(Number.parseInt(event.target.value, 10))}
        >
          {languages.map((language) => (
            <option key={language.id} value={language.id}>
              {language.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={styles.runButton}
          onClick={() => void handleRun()}
          disabled={running || languageId == null}
        >
          {running ? 'Running…' : 'Run'}
        </button>

        <span className={styles.shortcutHint}>Ctrl+Enter to run</span>
        {selectedLanguage ? (
          <span className={styles.shortcutHint}>{selectedLanguage.name}</span>
        ) : null}
      </div>

      {error ? (
        <p className={styles.errorText} role="alert">
          {error}
        </p>
      ) : null}

      <div className={styles.workspace}>
        <CodeEditor
          language={monacoLanguage}
          value={sourceCode}
          onChange={setSourceCode}
          onRun={() => void handleRun()}
          readOnly={running}
        />
        <IdePanels stdin={stdin} onStdinChange={setStdin} result={result} running={running} />
      </div>
    </div>
  );
}
