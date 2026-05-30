'use client';

import dynamic from 'next/dynamic';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { DailyProblemContext, IdeLanguage, IdeRunResponse } from '@nibras/contracts';
import { friendlyMessage } from '../../lib/api-clients/errors';
import { serviceFetchOptional } from '../../lib/api-clients/service-fetch';
import { getIdeStatus, listIdeLanguages, runIdeCode } from '../../lib/services/ide';
import IdePanels, { type IdeRunHistoryEntry } from './_components/IdePanels';
import ProblemBanner from './_components/ProblemBanner';
import {
  pickDefaultLanguageId,
  readPersistedState,
  templateForLanguage,
  writePersistedState,
} from './_content/templates';
import { readEditorPrefs, writeEditorPrefs } from './_content/editor-prefs';
import {
  resolveProblemContext,
  starterForProblem,
  type IdeProblemContext,
} from './_content/problem-context';
import SelectField from '../_components/ui/select-field';
import styles from './page.module.css';

const CodeEditor = dynamic(() => import('./_components/CodeEditor'), {
  ssr: false,
  loading: () => <div className={styles.editorPane}>Loading editor…</div>,
});

const MAX_RUN_HISTORY = 8;
const STATUS_RETRY_MS = 15_000;

type IdeAvailability = {
  configured: boolean;
  reachable: boolean;
  cpuTimeLimitSeconds?: number;
  memoryLimitKb?: number;
};

function limitsLabel(availability: IdeAvailability | null): string | null {
  if (!availability?.reachable) return null;
  const cpu = availability.cpuTimeLimitSeconds ?? 5;
  const memKb = availability.memoryLimitKb ?? 128000;
  const memMb = Math.round(memKb / 1024);
  return `Sandbox limits: ${cpu}s CPU, ${memMb} MB memory`;
}

function IdePageContent() {
  const searchParams = useSearchParams();
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
  const [runHistory, setRunHistory] = useState<IdeRunHistoryEntry[]>([]);
  const [editorPrefs, setEditorPrefs] = useState(() => readEditorPrefs());
  const [panelsCollapsed, setPanelsCollapsed] = useState(false);
  const [problemContext, setProblemContext] = useState<IdeProblemContext | null>(null);
  const [dismissedProblem, setDismissedProblem] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastTemplateSource, setLastTemplateSource] = useState('');
  const runAbortRef = useRef<AbortController | null>(null);
  const bootstrapAttempted = useRef(false);

  const urlProblemContext = useMemo(
    () => resolveProblemContext(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const activeProblem = useMemo(() => {
    if (dismissedProblem) return null;
    return problemContext ?? urlProblemContext;
  }, [dismissedProblem, problemContext, urlProblemContext]);

  const selectedLanguage = useMemo(
    () => languages.find((language) => language.id === languageId) ?? null,
    [languages, languageId]
  );

  const applyLanguage = useCallback(
    (
      language: IdeLanguage,
      options?: { preserveSource?: boolean; problem?: IdeProblemContext | null }
    ) => {
      const template = options?.problem
        ? starterForProblem(language.name, options.problem)
        : templateForLanguage(language.name);
      setLanguageId(language.id);
      setMonacoLanguage(template.monacoLanguage);
      if (!options?.preserveSource) {
        setSourceCode(template.source);
        setLastTemplateSource(template.source);
        setDirty(false);
      }
    },
    []
  );

  const refreshStatus = useCallback(async (): Promise<IdeAvailability> => {
    const status = await getIdeStatus();
    const next: IdeAvailability = {
      configured: status.configured,
      reachable: status.reachable,
      cpuTimeLimitSeconds: status.cpuTimeLimitSeconds,
      memoryLimitKb: status.memoryLimitKb,
    };
    setAvailability(next);
    return next;
  }, []);

  useEffect(() => {
    if (urlProblemContext) {
      setProblemContext(urlProblemContext);
      setDismissedProblem(false);
      if (urlProblemContext.sampleStdin) {
        setStdin(urlProblemContext.sampleStdin);
      }
    }
  }, [urlProblemContext]);

  useEffect(() => {
    if (urlProblemContext?.source !== 'daily') return;
    let cancelled = false;

    void serviceFetchOptional<DailyProblemContext>(
      'competitions',
      '/v1/daily-problem/today/context'
    )
      .then((ctx) => {
        if (cancelled || !ctx) return;
        setProblemContext({
          source: 'daily',
          slug: ctx.id,
          title: ctx.title,
          description: ctx.description,
          externalUrl: ctx.url,
        });
        setDismissedProblem(false);
      })
      .catch(() => {
        /* fall back to query params */
      });

    return () => {
      cancelled = true;
    };
  }, [urlProblemContext?.source, urlProblemContext?.slug]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const status = await refreshStatus();
        if (cancelled) return;

        if (!status.configured || !status.reachable) {
          setLoading(false);
          return;
        }

        const nextLanguages = await listIdeLanguages();
        if (cancelled) return;
        setLanguages(nextLanguages);

        const persisted = readPersistedState();
        const problem = urlProblemContext;
        const defaultLanguageId = persisted?.languageId ?? pickDefaultLanguageId(nextLanguages);
        const initialLanguage =
          nextLanguages.find((language) => language.id === defaultLanguageId) ?? nextLanguages[0];

        if (initialLanguage) {
          const preserveSource = Boolean(persisted?.sourceCode) && !problem;
          applyLanguage(initialLanguage, { preserveSource, problem });
          if (preserveSource && persisted?.sourceCode) {
            setSourceCode(persisted.sourceCode);
            setLastTemplateSource(
              problem
                ? starterForProblem(initialLanguage.name, problem).source
                : templateForLanguage(initialLanguage.name).source
            );
          }
          if (persisted?.stdin && !problem?.sampleStdin) {
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
          bootstrapAttempted.current = true;
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applyLanguage, refreshStatus, urlProblemContext]);

  useEffect(() => {
    if (!bootstrapAttempted.current) return;
    if (availability?.configured && availability.reachable) return;

    const timer = window.setInterval(() => {
      void refreshStatus().then((status) => {
        if (status.configured && status.reachable) {
          window.location.reload();
        }
      });
    }, STATUS_RETRY_MS);

    return () => window.clearInterval(timer);
  }, [availability?.configured, availability?.reachable, refreshStatus]);

  useEffect(() => {
    if (languageId == null) return;
    writePersistedState({ languageId, sourceCode, stdin });
  }, [languageId, sourceCode, stdin]);

  useEffect(() => {
    writeEditorPrefs(editorPrefs);
  }, [editorPrefs]);

  const handleSourceChange = useCallback((value: string) => {
    setSourceCode(value);
    setDirty(true);
  }, []);

  const handleLanguageChange = useCallback(
    (nextLanguageId: number) => {
      const language = languages.find((item) => item.id === nextLanguageId);
      if (!language) return;

      if (dirty && sourceCode.trim() !== lastTemplateSource.trim()) {
        const confirmed = window.confirm(
          'Switch language and replace your code with the starter template?'
        );
        if (!confirmed) return;
      }

      setError(null);
      setResult(null);
      applyLanguage(language, { problem: activeProblem ?? null });
    },
    [activeProblem, applyLanguage, dirty, languages, lastTemplateSource, sourceCode]
  );

  const handleResetTemplate = useCallback(() => {
    if (!selectedLanguage) return;
    if (dirty && sourceCode.trim() !== lastTemplateSource.trim()) {
      const confirmed = window.confirm('Reset code to the starter template?');
      if (!confirmed) return;
    }
    const template = activeProblem
      ? starterForProblem(selectedLanguage.name, activeProblem)
      : templateForLanguage(selectedLanguage.name);
    setSourceCode(template.source);
    setLastTemplateSource(template.source);
    setDirty(false);
    setResult(null);
    setError(null);
  }, [activeProblem, dirty, lastTemplateSource, selectedLanguage, sourceCode]);

  const handleRun = useCallback(async () => {
    if (languageId == null || running) return;

    runAbortRef.current?.abort();
    const controller = new AbortController();
    runAbortRef.current = controller;

    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const response = await runIdeCode(
        {
          sourceCode,
          languageId,
          stdin: stdin || undefined,
        },
        { signal: controller.signal }
      );
      setResult(response);
      setRunHistory((prev) =>
        [
          {
            id: `${Date.now()}`,
            at: new Date().toISOString(),
            status: response.status.description,
            time: response.time,
            memory: response.memory,
          },
          ...prev,
        ].slice(0, MAX_RUN_HISTORY)
      );
    } catch (runError) {
      if (controller.signal.aborted) {
        setError('Run cancelled.');
      } else {
        setError(friendlyMessage(runError));
      }
    } finally {
      if (runAbortRef.current === controller) {
        runAbortRef.current = null;
      }
      setRunning(false);
    }
  }, [languageId, running, sourceCode, stdin]);

  const handleCancelRun = useCallback(() => {
    runAbortRef.current?.abort();
  }, []);

  const handleDismissProblem = useCallback(() => {
    setDismissedProblem(true);
    setProblemContext(null);
  }, []);

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
            Local: <code>docker compose -f docker-compose.judge0.yml up -d</code>, set{' '}
            <code>JUDGE0_*</code> in <code>.env</code>, restart the API. Azure: run{' '}
            <code>./scripts/provision-azure-judge0.sh</code> (see <code>docs/azure-judge0.md</code>
            ). This page will retry automatically every 15 seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {activeProblem ? (
        <ProblemBanner context={activeProblem} onDismiss={handleDismissProblem} />
      ) : null}

      <div className={styles.toolbar}>
        <SelectField
          id="ide-language"
          label="Language"
          selectClassName={styles.languageSelect}
          value={languageId === null ? '' : String(languageId)}
          onChange={(value) => handleLanguageChange(Number.parseInt(value, 10))}
          options={languages.map((language) => ({
            value: String(language.id),
            label: language.name,
          }))}
        />

        <button
          type="button"
          className={styles.runButton}
          onClick={() => void handleRun()}
          disabled={running || languageId == null}
        >
          {running ? 'Running…' : 'Run'}
        </button>

        {running ? (
          <button type="button" className={styles.secondaryButton} onClick={handleCancelRun}>
            Cancel
          </button>
        ) : null}

        <button
          type="button"
          className={styles.secondaryButton}
          onClick={handleResetTemplate}
          disabled={!selectedLanguage}
        >
          Reset template
        </button>

        <label className={styles.prefControl}>
          <span>Font</span>
          <select
            className={styles.prefSelect}
            value={editorPrefs.fontSize}
            onChange={(event) =>
              setEditorPrefs((prev) => ({
                ...prev,
                fontSize: Number.parseInt(event.target.value, 10),
              }))
            }
          >
            {[12, 13, 14, 15, 16, 18].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </label>

        <label className={styles.prefToggle}>
          <input
            type="checkbox"
            checked={editorPrefs.wordWrap}
            onChange={(event) =>
              setEditorPrefs((prev) => ({ ...prev, wordWrap: event.target.checked }))
            }
          />
          Word wrap
        </label>

        <span className={styles.shortcutHint}>⌘/Ctrl+Enter to run</span>
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
          onChange={handleSourceChange}
          onRun={() => void handleRun()}
          readOnly={running}
          fontSize={editorPrefs.fontSize}
          wordWrap={editorPrefs.wordWrap}
        />
        <IdePanels
          stdin={stdin}
          onStdinChange={setStdin}
          result={result}
          running={running}
          runHistory={runHistory}
          limitsLabel={limitsLabel(availability)}
          collapsed={panelsCollapsed}
          onToggleCollapse={() => setPanelsCollapsed((value) => !value)}
        />
      </div>
    </div>
  );
}

export default function IdePage() {
  return (
    <Suspense
      fallback={
        <div className={styles.page}>
          <div className={styles.banner}>Loading playground…</div>
        </div>
      }
    >
      <IdePageContent />
    </Suspense>
  );
}
