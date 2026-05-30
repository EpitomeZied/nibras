'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from '../page.module.css';
import ChatPanel, { type ChatMessage } from '../../_components/widgets/ChatPanel';
import CommunityMatchBanner from './community-match-banner';
import {
  ask,
  explainTerm,
  listConversations,
  createConversation,
  getConversation,
  deleteConversation,
  renameConversation,
  publish,
  type ConversationSummary,
} from '../../../lib/services/chatbot';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { renderMarkdown } from '../../../lib/markdown';
import { apiFetch } from '../../../lib/session';
import {
  loadEnrolledCourseTitles,
  resolveTutorContext,
  type TutorContextState,
} from '../_content/tutor-context';

const CONVERSATIONS_PAGE_SIZE = 30;
const MATCH_SCORE_THRESHOLD = 0.55;

type LocalConversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
  persisted: boolean;
};

type TutorChatPageProps = {
  initialConversationId?: string;
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

export default function TutorChatPage({ initialConversationId }: TutorChatPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverConvs, setServerConvs] = useState<ConversationSummary[]>([]);
  const [activeConv, setActiveConv] = useState<LocalConversation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [localOnlyMode, setLocalOnlyMode] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const [convPage, setConvPage] = useState(1);
  const [hasMoreConvs, setHasMoreConvs] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [aiReady, setAiReady] = useState<boolean | null>(null);
  const [tutorContext, setTutorContext] = useState<TutorContextState>({
    label: 'General CS help',
    contextText: '',
    suggestedPrompts: [],
  });
  const [dismissedMatches, setDismissedMatches] = useState<Set<string>>(new Set());
  const initialLoadDone = useRef(false);

  const contextParams = useMemo(
    () => ({
      courseId: searchParams.get('courseId'),
      lectureId: searchParams.get('lectureId'),
      problem: searchParams.get('problem'),
      problemSource: searchParams.get('problemSource'),
      prompt: searchParams.get('prompt'),
    }),
    [searchParams]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setSidebarOpen(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiFetch('/v1/me/ai-credentials', { auth: true });
        if (!res.ok) {
          if (!cancelled) setAiReady(false);
          return;
        }
        const data = (await res.json()) as { tutorAvailable?: boolean; configured?: boolean };
        if (!cancelled) {
          setAiReady(Boolean(data.tutorAvailable ?? data.configured));
        }
      } catch {
        if (!cancelled) setAiReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const enrolled = await loadEnrolledCourseTitles();
      const resolved = await resolveTutorContext(contextParams, enrolled);
      if (!cancelled) setTutorContext(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [contextParams]);

  const loadConversationList = useCallback(async (page: number, append: boolean) => {
    try {
      const convs = await listConversations(page, CONVERSATIONS_PAGE_SIZE);
      setLocalOnlyMode(false);
      setHasMoreConvs(convs.length >= CONVERSATIONS_PAGE_SIZE);
      setServerConvs((prev) => {
        if (!append) return convs;
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...convs.filter((c) => !seen.has(c.id))];
      });
    } catch {
      setLocalOnlyMode(true);
      if (!append) setServerConvs([]);
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    void loadConversationList(1, false);
  }, [loadConversationList]);

  const loadConversation = useCallback(
    async (id: string) => {
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
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
          setSidebarOpen(false);
        }
        router.replace(`/tutor/${id}`);
      } catch (err) {
        setError(friendlyMessage(err));
      }
    },
    [router]
  );

  useEffect(() => {
    const targetId = initialConversationId;
    if (!targetId || initialLoadDone.current) return;
    initialLoadDone.current = true;
    void loadConversation(targetId);
  }, [initialConversationId, loadConversation]);

  const handleNew = useCallback(() => {
    setActiveConv(null);
    setError(null);
    setDismissedMatches(new Set());
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches) {
      setSidebarOpen(false);
    }
    router.replace('/tutor');
  }, [router]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);
        setServerConvs((prev) => prev.filter((c) => c.id !== id));
        if (activeConv?.id === id) {
          setActiveConv(null);
          router.replace('/tutor');
        }
      } catch (err) {
        setError(friendlyMessage(err));
      }
    },
    [activeConv?.id, router]
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
      let convPersisted = activeConv?.persisted ?? false;
      let isNew = false;
      let historyBase = activeConv?.messages ?? [];

      if (!activeConv) {
        try {
          const created = await createConversation(text.slice(0, 48));
          convId = created.id;
          convPersisted = true;
          isNew = true;
          historyBase = [];
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
          router.replace(`/tutor/${created.id}`);
        } catch {
          convId = makeId();
          convPersisted = false;
          historyBase = [];
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
      } else {
        historyBase = activeConv.messages;
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
        const history = historyBase.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
        const response = await ask({
          question: text,
          history,
          context: tutorContext.contextText || undefined,
          conversationId: convPersisted && convId ? convId : undefined,
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
                    followUps: response.followUps,
                    xai: response.xai,
                    communityQuestionId: response.communityQuestionId,
                    communityQuestion: response.communityQuestion,
                    matchScore: response.matchScore,
                  }
                : m
            ),
          };
        });
        if (isNew && convId && convPersisted) {
          const autoTitle = text.slice(0, 48);
          try {
            await renameConversation(convId, autoTitle);
            setServerConvs((prev) =>
              prev.map((c) => (c.id === convId ? { ...c, title: autoTitle, messageCount: 2 } : c))
            );
          } catch {
            // non-critical
          }
        } else if (convId) {
          setServerConvs((prev) =>
            prev.map((c) =>
              c.id === convId
                ? { ...c, updatedAt: new Date().toISOString(), messageCount: c.messageCount + 2 }
                : c
            )
          );
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
    [activeConv, router, tutorContext.contextText]
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

  const handleRegenerate = useCallback(
    (messageId: string) => {
      if (!activeConv || busy) return;
      const idx = activeConv.messages.findIndex((m) => m.id === messageId);
      if (idx < 1) return;
      const userMsg = activeConv.messages[idx - 1];
      if (userMsg.role !== 'user') return;
      setActiveConv((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.slice(0, idx - 1),
        };
      });
      void handleSend(userMsg.content);
    },
    [activeConv, busy, handleSend]
  );

  const handleExplainTerm = useCallback(async (term: string, context: string) => {
    setBusy(true);
    setError(null);
    try {
      const result = await explainTerm({ term, context });
      const explanation = [
        `**${result.term}**`,
        result.explanation,
        result.example ? `\nExample: ${result.example}` : '',
        result.related?.length ? `\nRelated: ${result.related.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: explanation,
      };
      setActiveConv((prev) =>
        prev ? { ...prev, messages: [...prev.messages, assistantMsg] } : prev
      );
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const handlePublish = useCallback(
    async (question: string, answer: string, tags?: string[]) => {
      try {
        const result = await publish({
          question,
          answer,
          title: question.slice(0, 120),
          tags,
          conversationId: activeConv?.persisted ? activeConv.id : undefined,
        });
        router.push(result.url ?? `/community/q/${result.questionId}`);
      } catch (err) {
        setError(friendlyMessage(err));
      }
    },
    [activeConv, router]
  );

  const filteredConvs = useMemo(() => {
    const q = convSearch.trim().toLowerCase();
    if (!q) return serverConvs;
    return serverConvs.filter((c) => c.title.toLowerCase().includes(q));
  }, [convSearch, serverConvs]);

  const grouped = groupByDate(filteredConvs);
  const groupOrder = ['Today', 'Yesterday', 'Previous 7 days', 'Older'];
  const suggestedPrompts =
    tutorContext.suggestedPrompts.length > 0 ? tutorContext.suggestedPrompts : undefined;

  return (
    <div className={styles.page}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} role="presentation" />
      )}

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''} ${styles.sidebarDesktop}`}
      >
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
        <input
          type="search"
          className={styles.convSearch}
          placeholder="Search conversations…"
          value={convSearch}
          onChange={(e) => setConvSearch(e.target.value)}
          aria-label="Search conversations"
        />
        {loadingConvs ? (
          <span className={styles.sidebarMeta}>Loading&hellip;</span>
        ) : filteredConvs.length === 0 ? (
          <span className={styles.sidebarMeta}>
            {convSearch ? 'No matches.' : 'No conversations yet.'}
          </span>
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
                            if (e.key === 'Enter') {
                              void handleRename(conv.id, (e.target as HTMLInputElement).value);
                            }
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
        {hasMoreConvs && !convSearch && (
          <button
            type="button"
            className={styles.loadMoreBtn}
            onClick={() => {
              const next = convPage + 1;
              setConvPage(next);
              void loadConversationList(next, true);
            }}
          >
            Load more
          </button>
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

        {localOnlyMode && (
          <div className={styles.warningBanner}>
            Conversations won&apos;t be saved right now. Your chat still works locally.
          </div>
        )}

        {tutorContext.contextText && (
          <div className={styles.contextBanner}>
            <span className={styles.contextLabel}>Context</span>
            <span className={styles.contextText}>{tutorContext.label}</span>
          </div>
        )}

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
          {aiReady === false ? (
            <div className={styles.setupGate}>
              <h2 className={styles.setupTitle}>Connect an AI provider</h2>
              <p className={styles.setupDesc}>
                Hassona uses your own API key (OpenAI, Groq free tier, or OpenRouter), or a
                platform-provided key when available. Add a key in Settings → AI Integration, then
                return here to chat.
              </p>
              <Link href="/settings?tab=ai" className={styles.setupBtn}>
                Open AI Integration
              </Link>
            </div>
          ) : aiReady === null ? (
            <div className={styles.setupGate}>
              <p className={styles.setupDesc}>Checking AI availability&hellip;</p>
            </div>
          ) : (
            <ChatPanel
              messages={activeConv?.messages ?? []}
              onSend={handleSend}
              onFollowUp={(text) => void handleSend(text)}
              onExplainTerm={(term, context) => void handleExplainTerm(term, context)}
              onRetry={handleRetry}
              onRegenerate={handleRegenerate}
              busy={busy}
              emptyTitle="Hassona"
              emptyDescription="Ask any question about your courses, projects, or concepts you're stuck on."
              suggestedPrompts={!activeConv ? suggestedPrompts : undefined}
              renderContent={(message) => {
                if (message.role === 'assistant' && !message.pending) {
                  const idx = activeConv?.messages.findIndex((m) => m.id === message.id) ?? -1;
                  const userMsg = idx > 0 ? activeConv?.messages[idx - 1] : null;
                  const showMatch =
                    message.communityQuestionId &&
                    message.communityQuestion &&
                    message.matchScore != null &&
                    message.matchScore >= MATCH_SCORE_THRESHOLD &&
                    !dismissedMatches.has(message.id);

                  return (
                    <div>
                      <div
                        dangerouslySetInnerHTML={{
                          __html: renderMarkdown(message.content),
                        }}
                      />
                      {showMatch && (
                        <CommunityMatchBanner
                          questionId={message.communityQuestionId!}
                          question={message.communityQuestion!}
                          matchScore={message.matchScore!}
                          onDismiss={() =>
                            setDismissedMatches((prev) => new Set(prev).add(message.id))
                          }
                        />
                      )}
                      {userMsg?.role === 'user' && (
                        <button
                          type="button"
                          className={styles.publishBtn}
                          onClick={() =>
                            void handlePublish(userMsg.content, message.content, message.tags)
                          }
                        >
                          Publish to Community
                        </button>
                      )}
                    </div>
                  );
                }
                return <p>{message.content}</p>;
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
