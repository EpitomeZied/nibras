'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../../_components/widgets/EmptyState';
import {
  getPlatformIntegrations,
  type PlatformIntegration,
  type PlatformIntegrationCategory,
} from '../../../lib/services/competitions';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import styles from './platforms.module.css';

const STATUS_LABEL: Record<PlatformIntegration['status'], string> = {
  live: 'Live',
  beta: 'Beta',
  coming_soon: 'Coming soon',
};

export default function PlatformsPage() {
  const [integrations, setIntegrations] = useState<PlatformIntegration[]>([]);
  const [categories, setCategories] = useState<
    Record<PlatformIntegrationCategory, { label: string; description: string }>
  >({} as Record<PlatformIntegrationCategory, { label: string; description: string }>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPlatformIntegrations();
        setIntegrations(data.integrations);
        setCategories(data.categories);
      } catch (err) {
        setError(friendlyMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<PlatformIntegrationCategory, PlatformIntegration[]>();
    for (const item of integrations) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [integrations]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link href="/competitions" className={styles.backLink}>
          ← Competitions
        </Link>
        <h1 className={styles.title}>Platform integrations</h1>
        <p className={styles.subtitle}>
          Competitive programming, AI/ML, bug bounty, open source, math olympiad, and CTF — in one
          competitions hub.
        </p>
      </header>

      {loading ? (
        <div className={styles.skeleton} />
      ) : error ? (
        <EmptyState title="Could not load integrations" description={error} tone="error" />
      ) : (
        <div className={styles.sections}>
          {Array.from(grouped.entries()).map(([category, items]) => {
            const meta = categories[category];
            return (
              <section key={category} id={category} className={styles.section}>
                <h2 className={styles.sectionTitle}>{meta?.label ?? category}</h2>
                <p className={styles.sectionSub}>{meta?.description}</p>
                <div className={styles.grid}>
                  {items.map((item) => (
                    <article key={item.id} id={item.id} className={styles.card}>
                      <div className={styles.cardHead}>
                        <h3 className={styles.cardTitle}>{item.name}</h3>
                        <span className={`${styles.status} ${styles[`status_${item.status}`]}`}>
                          {STATUS_LABEL[item.status]}
                        </span>
                      </div>
                      <p className={styles.cardDesc}>{item.description}</p>
                      <div className={styles.cardActions}>
                        {item.href ? (
                          <Link href={item.href} className={styles.primaryBtn}>
                            Open in Nibras
                          </Link>
                        ) : null}
                        <a
                          href={item.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.secondaryBtn}
                        >
                          Visit site
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
