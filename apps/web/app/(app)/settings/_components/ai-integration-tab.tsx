'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../lib/session';
import SelectField from '../../_components/ui/select-field';
import styles from '../page.module.css';

const MODEL_OPTIONS = [
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
  { value: 'gpt-4o', label: 'gpt-4o' },
  { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
  { value: 'gpt-4.1', label: 'gpt-4.1' },
];

type AiCredentialState = {
  configured: boolean;
  provider: string;
  model: string;
  maskedKey: string | null;
  encryptionReady?: boolean;
};

export default function AiIntegrationTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [configured, setConfigured] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gpt-4o-mini');
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [encryptionReady, setEncryptionReady] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await apiFetch('/v1/me/ai-credentials', { auth: true });
        if (!res.ok) return;
        const data = (await res.json()) as AiCredentialState;
        if (!alive) return;
        setConfigured(data.configured);
        setModel(data.model || 'gpt-4o-mini');
        setMaskedKey(data.maskedKey);
        setEncryptionReady(data.encryptionReady !== false);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setStatus('');
    try {
      const keyToSend = apiKey.trim();
      if (!keyToSend && !configured) {
        setStatus('Enter your OpenAI API key.');
        return;
      }
      const res = await apiFetch('/v1/me/ai-credentials', {
        method: 'PUT',
        auth: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(keyToSend ? { apiKey: keyToSend } : {}),
          model,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        setStatus(err.error?.message ?? `Save failed (${res.status}).`);
        return;
      }
      const data = (await res.json()) as AiCredentialState;
      setConfigured(data.configured);
      setMaskedKey(data.maskedKey);
      setModel(data.model);
      setApiKey('');
      setStatus('Configuration saved. Hassona will use your OpenAI key.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    setSaving(true);
    setStatus('');
    try {
      const res = await apiFetch('/v1/me/ai-credentials', { method: 'DELETE', auth: true });
      if (!res.ok) {
        setStatus(`Remove failed (${res.status}).`);
        return;
      }
      setConfigured(false);
      setMaskedKey(null);
      setApiKey('');
      setStatus('Personal API key removed. Hassona will use the platform key when available.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.contentSection}>
      {!encryptionReady ? (
        <p className={styles.encryptionWarning} role="alert">
          Server encryption is not configured yet. Personal API keys cannot be saved until
          operators set NIBRAS_ENCRYPTION_KEY in production.
        </p>
      ) : null}

      <div className={styles.aiHeaderRow}>
        <div>
          <h2 className={styles.sectionHeading}>AI Integration</h2>
          <p className={styles.sectionSub}>
            Connect an AI provider to enable Hassona tutoring with your own API key.
          </p>
        </div>
        <button
          type="button"
          className={styles.saveConfigBtn}
          onClick={() => void handleSave()}
          disabled={saving || loading || !encryptionReady}
        >
          {saving ? 'Saving…' : 'Save configuration'}
        </button>
      </div>

      <article className={styles.providerCard}>
        <div className={styles.providerCardHeader}>
          <div>
            <strong>OpenAI</strong>
            <p className={styles.providerCardDesc}>
              Fast and capable — used by Hassona for tutoring answers.
            </p>
          </div>
          <div className={styles.providerCardMeta}>
            {configured ? <span className={styles.connectedBadgeGreen}>Connected</span> : null}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.externalLink}
              aria-label="Open OpenAI API keys page"
            >
              ↗
            </a>
          </div>
        </div>

        <div className={styles.formField}>
          <label htmlFor="openai-api-key" className={styles.formLabel}>
            API Key
          </label>
          <div className={styles.apiKeyRow}>
            <input
              id="openai-api-key"
              className={styles.formInput}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={configured && maskedKey ? maskedKey : 'Enter API key'}
              autoComplete="off"
            />
            <button
              type="button"
              className={styles.visibilityBtn}
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className={styles.formField}>
          <label htmlFor="openai-model" className={styles.formLabel}>
            Model
          </label>
          <SelectField
            id="openai-model"
            value={model}
            onChange={setModel}
            options={MODEL_OPTIONS}
          />
        </div>

        {configured ? (
          <button
            type="button"
            className={styles.removeKeyBtn}
            onClick={() => void handleRemove()}
            disabled={saving}
          >
            Remove personal key
          </button>
        ) : null}
      </article>

      {status ? <p className={styles.statusLine}>{status}</p> : null}
    </section>
  );
}
