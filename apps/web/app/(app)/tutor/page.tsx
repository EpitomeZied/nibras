'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './page.module.css';
import ChatPanel, { type ChatMessage } from '../_components/widgets/ChatPanel';
import {
  ask,
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  renameConversation,
  type ConversationSummary,
} from '../../lib/services/chatbot';
import { friendlyMessage } from '../../lib/api-clients/errors';
import { renderMarkdown } from '../../lib/markdown';

const SUGGESTED_PROMPTS = [
  'Explain Big-O notation with examples',
  'What is a binary search tree?',
  'How does TCP/IP work?',
  'Explain recursion vs iteration',
  'What are design patterns in OOP?',
  'How does garbage collection work?',
];

type LocalConversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
  persisted: boolean;
};

function makeId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function groupByDate(conversations: ConversationSummary[]): Record<string, ConversationSummary[]> {
  const groups: Record<string, ConversationSummary[]> = {};
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

  for (const conv of conversations) {
    const date = conv.updatedAt.slice(0, 10);
    let label: string;
    if (date === today) label = 'Today';
    else if (date === yesterday) label = 'Yesterday';
    else if (date >= weekAgo) label = 'Previous 7 days';
    else label = 'Older';
    (groups[label] ??= []).push(conv);
  }
  return groups;
}

export default function TutorPage() {
  const [serverConvs, setServerConvs] = useState<ConversationSummary[]>([]);
  const [activeConv, setActiveConv] = useState<LocalConversation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const convs = await listConversations();
        if (!cancelled) setServerConvs(convs);
      } catch {
        // local-only mode
      } finally {
        if (!cancelled) setLoadingConvs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setBusy(false);
    setError(null);
    try {
      const detail = await getConversation(id);
      const messages: ChatMessage[] = detail.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        tags: m.tags,
        xai: m.xai,
      }));
      setActiveConv({
        id: detail.id,
        title: detail.title,
        updatedAt: detail.updatedAt,
        messages,
        persisted: true,
      });
      setSidebarOpen(false);
    } catch (err) {
      setError(friendlyMessage(err));
    }
  }, []);

  const handleNew = useCallback(() => {
    setActiveConv(null);
    setError(null);
    setSidebarOpen(false);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);
        setServerConvs((prev) => prev.filter((c) => c.id !== id));
        if (activeConv?.id === id) setActiveConv(null);
      } catch (err) {
        setError(friendlyMessage(err));
      }
    },
    [activeConv?.id]
  );

  const handleRename = useCallback(
    async (id: string, title: string) => {
      try {
        await renameConversation(id, title);
        setServerConvs((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
        if (activeConv?.id === id) {
          setActiveConv((prev) => (prev ? { ...prev, title } : prev));
        }
      } catch (err) {
        setError(friendlyMessage(err));
      }
      setEditingTitle(null);
    },
    [activeConv?.id]
  );

  const handleSend = useCallback(
    async (text: string) => {
      const userMsg: ChatMessage = { id: makeId(), role: 'user', content: text };
      const placeholderId = makeId();
      const pendingMsg: ChatMessage = {
        id: placeholderId,
        role: 'assistant',
        content: '',
        pending: true,
      };

      let convId = activeConv?.id;
      let isNew = false;

      if (!activeConv) {
        try {
          const created = await createConversation(text.slice(0, 48));
          convId = created.id;
          isNew = true;
          const newConv: LocalConversation = {
            id: created.id,
            title: created.title,
            updatedAt: new Date().toISOString(),
            messages: [userMsg, pendingMsg],
            persisted: true,
          };
          setActiveConv(newConv);
          setServerConvs((prev) => [
            {
              id: created.id,
              title: created.title,
              messageCount: 0,
              createdAt: created.createdAt,
              updatedAt: new Date().toISOString(),
            },
            ...prev,
          ]);
        } catch {
          convId = makeId();
          const localConv: LocalConversation = {
            id: convId,
            title: text.slice(0, 48),
            updatedAt: new Date().toISOString(),
            messages: [userMsg, pendingMsg],
            persisted: false,
          };
          setActiveConv(localConv);
          isNew = true;
        }
      }

      if (!isNew) {
        setActiveConv((prev) =>
          prev
            ? {
                ...prev,
                title: prev.messages.length === 0 ? text.slice(0, 48) : prev.title,
                messages: [...prev.messages, userMsg, pendingMsg],
                updatedAt: new Date().toISOString(),
              }
            : prev
        );
      }

      setBusy(true);
      setError(null);
      try {
        const currentMessages = activeConv?.messages ?? [];
        const history = currentMessages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        const response = await ask({
          question: text,
          history,
          conversationId: activeConv?.persisted ? convId : undefined,
        });
        if (response.refused) {
          const message =
            response.answer || 'This question is outside the scope of this CS platform.';
          setError(message);
          setActiveConv((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.filter((m) => m.id !== placeholderId),
            };
          });
          return;
        }
        setActiveConv((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === placeholderId
                ? {
                    ...m,
                    content: response.answer,
                    pending: false,
                    hints: response.hints,
                    tags: response.tags,
                    xai: response.xai,
                  }
                : m
            ),
          };
        });
        if (isNew && convId) {
          const autoTitle = text.slice(0, 48);
          try {
            await renameConversation(convId, autoTitle);
            setServerConvs((prev) =>
              prev.map((c) => (c.id === convId ? { ...c, title: autoTitle } : c))
            );
          } catch {
            // non-critical
          }
        }
      } catch (err) {
        const message = friendlyMessage(err);
        setError(message);
        setActiveConv((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === placeholderId
                ? { ...m, content: message, pending: false, error: message }
                : m
            ),
          };
        });
      } finally {
        setBusy(false);
      }
    },
    [activeConv]
  );

  const handleRetry = useCallback(
    (messageId: string) => {
      if (!activeConv) return;
      const errIdx = activeConv.messages.findIndex((m) => m.id === messageId);
      if (errIdx < 1) return;
      const userMsg = activeConv.messages[errIdx - 1];
      if (userMsg.role !== 'user') return;
      setActiveConv((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.slice(0, errIdx - 1),
        };
      });
      void handleSend(userMsg.content);
    },
    [activeConv, handleSend]
  );

  const grouped = groupByDate(serverConvs);
  const groupOrder = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];

  return (
    <div className={styles.page}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} role="presentation" />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Conversations</h2>
          <button
            type="button"
            className={styles.closeSidebarBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>
        <button type="button" className={styles.newChatBtn} onClick={handleNew}>
          + New conversation
        </button>
        {loadingConvs ? (
          <span className={styles.sidebarMeta}>Loading&hellip;</span>
        ) : serverConvs.length === 0 ? (
          <span className={styles.sidebarMeta}>No conversations yet.</span>
        ) : (
          <div className={styles.conversationsList}>
            {groupOrder.map((label) => {
              const items = grouped[label];
              if (!items || items.length === 0) return null;
              return (
                <div key={label} className={styles.convGroup}>
                  <span className={styles.convGroupLabel}>{label}</span>
                  {items.map((conv) => (
                    <div
                      key={conv.id}
                      className={`${styles.conversationItem} ${
                        activeConv?.id === conv.id ? styles.conversationActive : ''
                      }`}
                    >
                      {editingTitle === conv.id ? (
                        <input
                          ref={titleInputRef}
                          className={styles.titleInput}
                          defaultValue={conv.title}
                          onBlur={(e) => void handleRename(conv.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter')
                              void handleRename(conv.id, (e.target as HTMLInputElement).value);
                            if (e.key === 'Escape') setEditingTitle(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <button
                          type="button"
                          className={styles.convBtn}
                          onClick={() => void loadConversation(conv.id)}
                        >
                          <span className={styles.conversationTitle}>{conv.title}</span>
                          <span className={styles.conversationMeta}>
                            {conv.messageCount} messages
                          </span>
                        </button>
                      )}
                      <div className={styles.convActions}>
                        <button
                          type="button"
                          className={styles.convActionBtn}
                          onClick={() => {
                            setEditingTitle(conv.id);
                            requestAnimationFrame(() => titleInputRef.current?.focus());
                          }}
                          title="Rename"
                        >
                          &#9998;
                        </button>
                        <button
                          type="button"
                          className={`${styles.convActionBtn} ${styles.convDeleteBtn}`}
                          onClick={() => void handleDelete(conv.id)}
                          title="Delete"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </aside>

      <div className={styles.chatArea}>
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            &#9776;
          </button>
          <h1 className={styles.topTitle}>{activeConv ? activeConv.title : 'Hassona'}</h1>
        </header>

        {error && (
          <div className={styles.errorBanner}>
            <span>
              {error}
              {error.includes('AI Integration') && (
                <>
                  {' '}
                  <Link href="/settings" className={styles.errorBannerLink}>
                    Open Settings
                  </Link>
                </>
              )}
            </span>
            <button type="button" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        <div className={styles.chatContainer}>
          <ChatPanel
            messages={activeConv?.messages ?? []}
            onSend={handleSend}
            onFollowUp={(text) => void handleSend(text)}
            onRetry={handleRetry}
            busy={busy}
            emptyTitle="Hassona"
            emptyDescription="Ask any question about your courses, projects, or concepts you're stuck on."
            suggestedPrompts={!activeConv ? SUGGESTED_PROMPTS : undefined}
            renderContent={(message) =>
              message.role === 'assistant' && !message.pending ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(message.content),
                  }}
                />
              ) : (
                <p>{message.content}</p>
              )
            }
          />
        </div>
      </div>
    </div>
  );
}
