'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ChatPanel.module.css';
import type { XaiData } from '../../../lib/services/chatbot';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  pending?: boolean;
  error?: string;
  citations?: Array<{ title: string; url?: string }>;
  followUps?: string[];
  hints?: string[];
  tags?: string[];
  xai?: XaiData | null;
};

export type ChatPanelProps = {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void> | void;
  onFollowUp?: (text: string) => void;
  onExplainTerm?: (term: string, context: string) => void;
  onRetry?: (messageId: string) => void;
  placeholder?: string;
  composerHint?: string;
  busy?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  renderContent?: (message: ChatMessage) => React.ReactNode;
  suggestedPrompts?: string[];
};

function XaiAccordion({
  xai,
  onExplainTerm,
  questionContext,
}: {
  xai: XaiData;
  onExplainTerm?: (term: string, context: string) => void;
  questionContext?: string;
}) {
  const [open, setOpen] = useState(false);

  const hasContent =
    xai.reasoning || xai.concepts_used.length > 0 || xai.might_be_unclear.length > 0;
  if (!hasContent) return null;

  return (
    <div className={styles.xaiSection}>
      <button
        type="button"
        className={styles.xaiToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>How I arrived at this answer</span>
        <span className={`${styles.xaiChevron} ${open ? styles.xaiChevronOpen : ''}`}>&#9660;</span>
      </button>
      <div className={`${styles.xaiContent} ${open ? styles.xaiContentOpen : ''}`}>
        <div className={styles.xaiInner}>
          {xai.reasoning && (
            <div className={styles.xaiBlock}>
              <h4 className={styles.xaiLabel}>Reasoning</h4>
              <p className={styles.xaiText}>{xai.reasoning}</p>
            </div>
          )}
          {xai.concepts_used.length > 0 && (
            <div className={styles.xaiBlock}>
              <h4 className={styles.xaiLabel}>Concepts used</h4>
              <div className={styles.chipRow}>
                {xai.concepts_used.map((concept) => (
                  <span key={concept} className={styles.conceptChip}>
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
          {xai.might_be_unclear.length > 0 && (
            <div className={styles.xaiBlock}>
              <h4 className={styles.xaiLabel}>Might be unclear</h4>
              <div className={styles.chipRow}>
                {xai.might_be_unclear.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className={styles.unclearChip}
                    onClick={() => onExplainTerm?.(term, questionContext ?? '')}
                    title={`Explain "${term}"`}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPanel({
  messages,
  onSend,
  onFollowUp,
  onExplainTerm,
  onRetry,
  placeholder = 'Ask the tutor a question…',
  composerHint,
  busy,
  emptyTitle = 'Start a conversation',
  emptyDescription = 'Ask about any concept, exercise, or piece of code and the tutor will help.',
  renderContent,
  suggestedPrompts,
}: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!scrollerRef.current) return;
    scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
  }, [messages.length]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = draft.trim();
    if (!value || busy) return;
    setDraft('');
    await onSend(value);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit(event as unknown as React.FormEvent);
    }
  }

  const lastUserContent = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';

  return (
    <div className={styles.panel}>
      <div className={styles.scroller} ref={scrollerRef}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <strong>{emptyTitle}</strong>
            <p>{emptyDescription}</p>
            {suggestedPrompts && suggestedPrompts.length > 0 && (
              <div className={styles.suggestedGrid}>
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className={styles.suggestedChip}
                    onClick={() => void onSend(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <article
              key={message.id}
              className={`${styles.message} ${
                message.role === 'user' ? styles.userMessage : styles.assistantMessage
              } ${message.pending ? styles.pendingMessage : ''}`}
            >
              <header className={styles.messageHeader}>
                <span className={styles.role}>{message.role === 'user' ? 'You' : 'Hassona'}</span>
                {message.pending && <span className={styles.pendingPill}>thinking&hellip;</span>}
                {message.error && (
                  <>
                    <span className={styles.errorPill}>error</span>
                    {onRetry && (
                      <button
                        type="button"
                        className={styles.retryBtn}
                        onClick={() => onRetry(message.id)}
                      >
                        Retry
                      </button>
                    )}
                  </>
                )}
              </header>
              <div className={styles.body}>
                {renderContent ? renderContent(message) : <p>{message.content}</p>}
              </div>
              {message.role === 'assistant' && !message.pending && message.xai && (
                <XaiAccordion
                  xai={message.xai}
                  onExplainTerm={onExplainTerm}
                  questionContext={lastUserContent}
                />
              )}
              {message.citations && message.citations.length > 0 && (
                <ul className={styles.citations}>
                  {message.citations.map((c, idx) => (
                    <li key={`${message.id}-cite-${idx}`}>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer">
                          {c.title}
                        </a>
                      ) : (
                        c.title
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {message.followUps && message.followUps.length > 0 && (
                <div className={styles.followUps}>
                  {message.followUps.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={styles.followUpChip}
                      onClick={() => onFollowUp?.(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          aria-label="Message"
          disabled={busy}
        />
        <div className={styles.composerFooter}>
          <span className={styles.hint}>
            {composerHint ?? 'Enter to send · Shift+Enter for newline'}
          </span>
          <button type="submit" className={styles.sendBtn} disabled={!draft.trim() || busy}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
