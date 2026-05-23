'use client';

import { useCallback, useEffect, useState } from 'react';
import styles from './page.module.css';
import EmptyState from '../../_components/widgets/EmptyState';
import StatTile from '../../_components/widgets/StatTile';
import { fetchInsights, type InsightsResponse } from '../../../lib/services/chatbot';
import { friendlyMessage } from '../../../lib/api-clients/errors';

export default function LearningInsightsPage() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const insights = await fetchInsights();
      setData(insights);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Learning Insights</h1>
        </header>
        <div
          style={{
            height: 280,
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Learning Insights</h1>
        </header>
        <EmptyState
          title="No insights yet"
          description={
            error ??
            'Spend some time on the platform and Hassona will summarize your activity here.'
          }
          tone={error ? 'error' : 'default'}
          action={error ? { label: 'Retry', onClick: () => void load() } : undefined}
        />
      </div>
    );
  }

  const { hardMetrics, aiSummary } = data;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Learning Insights</h1>
        <p className={styles.subtitle}>
          Personalized summaries of where you&apos;re strong, where you&apos;re struggling, and what
          to study next.
        </p>
      </header>

      <div className={styles.kpis}>
        <StatTile
          label="This Week"
          value={`${hardMetrics.weeklyQuestions} Q`}
          caption="questions"
        />
        <StatTile
          label="All Time"
          value={`${hardMetrics.totalQuestions}`}
          caption="total questions"
        />
        <StatTile
          label="Streak"
          value={`${hardMetrics.streakDays} days`}
          trend={hardMetrics.streakDays > 0 ? 'up' : 'flat'}
        />
        <StatTile label="Conversations" value={hardMetrics.totalConversations} />
      </div>

      {hardMetrics.topTags.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Top Topics</h2>
          <div className={styles.barChart}>
            {hardMetrics.topTags.slice(0, 10).map((t) => {
              const maxCount = hardMetrics.topTags[0].count;
              const pct = maxCount > 0 ? (t.count / maxCount) * 100 : 0;
              return (
                <div key={t.tag} className={styles.barRow}>
                  <span className={styles.barLabel}>{t.tag}</span>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.barValue}>{t.count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {aiSummary.overallAssessment && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Assessment</h2>
          <p className={styles.assessmentText}>{aiSummary.overallAssessment}</p>
        </section>
      )}

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Top strengths</h2>
          {aiSummary.strengths.length === 0 ? (
            <span className={styles.rowMeta}>No data yet.</span>
          ) : (
            <ul className={styles.list}>
              {aiSummary.strengths.map((s) => (
                <li key={s.topic} className={styles.row}>
                  <div className={styles.rowLabel}>
                    <strong>{s.topic}</strong>
                  </div>
                  <span className={styles.rowStrong}>{Math.round(s.score * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Focus areas</h2>
          {aiSummary.weaknesses.length === 0 ? (
            <span className={styles.rowMeta}>Nothing flagged.</span>
          ) : (
            <ul className={styles.list}>
              {aiSummary.weaknesses.map((s) => (
                <li key={s.topic} className={styles.row}>
                  <div className={styles.rowLabel}>
                    <strong>{s.topic}</strong>
                  </div>
                  <span className={styles.rowWeak}>{Math.round(s.score * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {aiSummary.nextActions.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Suggested next steps</h2>
          <ul className={styles.actionList}>
            {aiSummary.nextActions.map((action, idx) => (
              <li key={idx} className={styles.actionItem}>
                {action}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
