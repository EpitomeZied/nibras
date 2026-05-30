'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../../lib/session';
import SelectField from '../../_components/ui/select-field';
import styles from '../page.module.css';

type ProviderId = 'openai' | 'groq' | 'openrouter';

type AiProvider = {
  id: ProviderId;
  name: string;
  description: string;
  available: boolean;
  docsUrl?: string;
  defaultModel: string;
  models: { value: string; label: string }[];
};

const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models — reliable JSON tutoring responses.',
    available: true,
    docsUrl: 'https://platform.openai.com/api-keys',
    defaultModel: 'gpt-4o-mini',
    models: [
      { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
      { value: 'gpt-4o', label: 'gpt-4o' },
      { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini' },
      { value: 'gpt-4.1', label: 'gpt-4.1' },
    ],
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Free tier — fast Llama models (one account per person).',
    available: true,
    docsUrl: 'https://console.groq.com/keys',
    defaultModel: 'llama-3.1-8b-instant',
    models: [
      { value: 'llama-3.1-8b-instant', label: 'llama-3.1-8b-instant (recommended)' },
      { value: 'llama-3.3-70b-versatile', label: 'llama-3.3-70b-versatile' },
      {
        value: 'meta-llama/llama-4-scout-17b-16e-instruct',
        label: 'meta-llama/llama-4-scout-17b-16e-instruct',
      },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Many models, including free routes — one API key.',
    available: true,
    docsUrl: 'https://openrouter.ai/keys',
    defaultModel: 'meta-llama/llama-3.2-3b-instruct:free',
    models: [
      { value: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B (free)' },
      { value: 'google/gemma-2-9b-it:free', label: 'Gemma 2 9B (free)' },
      { value: 'qwen/qwen-2.5-7b-instruct:free', label: 'Qwen 2.5 7B (free)' },
    ],
  },
];

type AiCredentialState = {
  configured: boolean;
  provider: string;
  model: string;
  maskedKey: string | null;
  encryptionReady?: boolean;
};

function ProviderIcon({ id }: { id: ProviderId | 'gemini' | 'anthropic' | 'poe' }) {
  return (
    <img
      src={`/ai-providers/${id}.svg`}
      alt=""
      width={22}
      height={22}
      className={styles.aiProviderIconImg}
      aria-hidden="true"
    />
  );
}

export default function AiIntegrationTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [configured, setConfigured] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<ProviderId>('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [encryptionReady, setEncryptionReady] = useState(true);

  const activeProvider = useMemo(
    () => AI_PROVIDERS.find((p) => p.id === provider) ?? AI_PROVIDERS[0],
    [provider]
  );

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await apiFetch('/v1/me/ai-credentials', { auth: true });
        if (!res.ok) return;
        const data = (await res.json()) as AiCredentialState;
        if (!alive) return;
        const savedProvider = (data.provider as ProviderId) || 'openai';
        const preset = AI_PROVIDERS.find((p) => p.id === savedProvider) ?? AI_PROVIDERS[0];
        setConfigured(data.configured);
        setProvider(savedProvider);
        setModel(data.model || preset.defaultModel);
        setMaskedKey(data.maskedKey);
        setEncryptionReady(data.encryptionReady !== false);
      } finally {
        if (!alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  function handleProviderChange(next: ProviderId) {
    setProvider(next);
    const preset = AI_PROVIDERS.find((p) => p.id === next);
    if (preset) setModel(preset.defaultModel);
  }

  async function handleSave() {
    setSaving(true);
    setStatus('');
    try {
      const keyToSend = apiKey.trim();
      if (!keyToSend && !configured) {
        setStatus(`Enter your ${activeProvider.name} API key.`);
        return;
      }
      const res = await apiFetch('/v1/me/ai-credentials', {
        method: 'PUT',
        auth: true,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...(keyToSend ? { apiKey: keyToSend } : {}),
          provider,
          model,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        setStatus(err.error ?? err.message ?? `Save failed (${res.status}).`);
        return;
      }
      const data = (await res.json()) as AiCredentialState;
      setConfigured(data.configured);
      setMaskedKey(data.maskedKey);
      setProvider((data.provider as ProviderId) || provider);
      setModel(data.model);
      setApiKey('');
      setStatus(`Saved. Hassona will use your ${activeProvider.name} key.`);
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
      setStatus('API key removed. Connect a key to use Hassona again.');
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
          Server encryption is not configured yet. Personal API keys cannot be saved until operators
          set NIBRAS_ENCRYPTION_KEY in production.
        </p>
      ) : null}

      <div className={styles.aiHeaderRow}>
        <div>
          <h2 className={styles.sectionHeading}>AI Integration</h2>
          <p className={styles.sectionSub}>
            Connect OpenAI, Groq (free tier), or OpenRouter so Hassona can answer your questions
            using your own API key.
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

      <div className={styles.aiProviderList}>
        {AI_PROVIDERS.map((item) => {
          const isActive = item.id === provider;
          const showConnected = configured && isActive;
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.aiProviderRow} ${isActive ? styles.aiProviderRowActive : ''} ${!item.available ? styles.aiProviderRowMuted : ''}`}
              onClick={() => handleProviderChange(item.id)}
              disabled={!item.available}
            >
              <span className={styles.aiProviderIcon}>
                <ProviderIcon id={item.id} />
              </span>
              <div className={styles.aiProviderInfo}>
                <span className={styles.aiProviderName}>{item.name}</span>
                <span className={styles.aiProviderDesc}>{item.description}</span>
              </div>
              <div className={styles.aiProviderMeta}>
                {showConnected ? (
                  <span className={styles.connectedBadgeGreen}>Connected</span>
                ) : isActive ? (
                  <span className={styles.aiProviderAvailableBadge}>Selected</span>
                ) : (
                  <span className={styles.aiProviderAvailableBadge}>Available</span>
                )}
                {item.docsUrl ? (
                  <a
                    href={item.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.externalLink}
                    aria-label={`Open ${item.name} API keys page`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ↗
                  </a>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <article className={styles.providerCard}>
        <div className={styles.providerCardHeader}>
          <div className={styles.providerCardTitleRow}>
            <span className={styles.aiProviderIcon}>
              <ProviderIcon id={provider} />
            </span>
            <div>
              <strong>{activeProvider.name}</strong>
              <p className={styles.providerCardDesc}>{activeProvider.description}</p>
            </div>
          </div>
          <div className={styles.providerCardMeta}>
            {configured ? <span className={styles.connectedBadgeGreen}>Connected</span> : null}
          </div>
        </div>

        <div className={styles.formField}>
          <label htmlFor="ai-api-key" className={styles.formLabel}>
            API Key
          </label>
          <div className={styles.apiKeyRow}>
            <input
              id="ai-api-key"
              className={styles.formInput}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={configured && maskedKey ? maskedKey : `Enter ${activeProvider.name} API key`}
              autoComplete="off"
              disabled={!encryptionReady}
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
          <label htmlFor="ai-model" className={styles.formLabel}>
            Model
          </label>
          <SelectField
            id="ai-model"
            value={model}
            onChange={setModel}
            options={activeProvider.models}
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
