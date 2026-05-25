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

type ProviderId = 'openai' | 'gemini' | 'anthropic' | 'poe' | 'openrouter';

type AiProvider = {
  id: ProviderId;
  name: string;
  description: string;
  available: boolean;
  docsUrl?: string;
};

const AI_PROVIDERS: AiProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT models — used by Hassona for tutoring answers.',
    available: true,
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Gemini Pro and Flash models for multimodal tutoring.',
    available: false,
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude models for long-context explanations and code help.',
    available: false,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Route Hassona through hundreds of models with one API key.',
    available: false,
  },
  {
    id: 'poe',
    name: 'Poe',
    description: 'Access multiple chat models through Poe’s API.',
    available: false,
  },
];

type AiCredentialState = {
  configured: boolean;
  provider: string;
  model: string;
  maskedKey: string | null;
  encryptionReady?: boolean;
};

function ProviderIcon({ id }: { id: ProviderId }) {
  switch (id) {
    case 'openai':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2c2.2 0 4 1.8 4 4v1.2c2.2.4 4 2.2 4 4.5 0 2.5-2 4.5-4.5 4.5H14v2.8c0 2.2-1.8 4-4 4s-4-1.8-4-4V14.2C3.8 13.8 2 12 2 9.7 2 7.2 4 5.2 6.5 5.2H8V4c0-2.2 1.8-4 4-4z"
            fill="#10a37f"
          />
        </svg>
      );
    case 'gemini':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.4 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z"
            fill="url(#geminiGrad)"
          />
          <defs>
            <linearGradient id="geminiGrad" x1="3" y1="3" x2="21" y2="21">
              <stop stopColor="#4285F4" />
              <stop offset="0.5" stopColor="#9B72CB" />
              <stop offset="1" stopColor="#D96570" />
            </linearGradient>
          </defs>
        </svg>
      );
    case 'anthropic':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" fill="#D4A574" />
          <path
            d="M8 17l4-10 4 10M9.5 13h5"
            stroke="#1a1a1a"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'openrouter':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="6" cy="12" r="3" fill="#6366f1" />
          <circle cx="18" cy="6" r="3" fill="#818cf8" />
          <circle cx="18" cy="18" r="3" fill="#a5b4fc" />
          <path
            d="M9 12h3M15 8.5l-2 1.5M15 15.5l-2-1.5"
            stroke="#c7d2fe"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'poe':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="#5b5ef7" />
          <path
            d="M8 9.5c0-1.5 1.2-2.5 4-2.5s4 1 4 2.5-1.5 3.5-4 5.5c-2.5-2-4-3.5-4-5.5z"
            fill="#fff"
            opacity="0.95"
          />
        </svg>
      );
    default:
      return null;
  }
}

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
          Server encryption is not configured yet. Personal API keys cannot be saved until operators
          set NIBRAS_ENCRYPTION_KEY in production.
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

      <div className={styles.aiProviderList}>
        {AI_PROVIDERS.map((provider) => {
          const isOpenAi = provider.id === 'openai';
          const showConnected = isOpenAi && configured;
          return (
            <div
              key={provider.id}
              className={`${styles.aiProviderRow} ${!provider.available ? styles.aiProviderRowMuted : ''}`}
            >
              <span className={styles.aiProviderIcon}>
                <ProviderIcon id={provider.id} />
              </span>
              <div className={styles.aiProviderInfo}>
                <span className={styles.aiProviderName}>{provider.name}</span>
                <span className={styles.aiProviderDesc}>{provider.description}</span>
              </div>
              <div className={styles.aiProviderMeta}>
                {showConnected ? (
                  <span className={styles.connectedBadgeGreen}>Connected</span>
                ) : provider.available ? (
                  <span className={styles.aiProviderAvailableBadge}>Available</span>
                ) : (
                  <span className={styles.comingSoonBadge}>Coming soon</span>
                )}
                {provider.docsUrl ? (
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.externalLink}
                    aria-label={`Open ${provider.name} API keys page`}
                  >
                    ↗
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <article className={styles.providerCard}>
        <div className={styles.providerCardHeader}>
          <div className={styles.providerCardTitleRow}>
            <span className={styles.aiProviderIcon}>
              <ProviderIcon id="openai" />
            </span>
            <div>
              <strong>OpenAI</strong>
              <p className={styles.providerCardDesc}>
                Fast and capable — used by Hassona for tutoring answers.
              </p>
            </div>
          </div>
          <div className={styles.providerCardMeta}>
            {configured ? <span className={styles.connectedBadgeGreen}>Connected</span> : null}
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
