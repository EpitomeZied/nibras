'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import type { CourseGradesRollup } from '@nibras/contracts';
import { getMyCourseGrades } from '../../../../lib/services/course-profile';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import styles from './page.module.css';

export default function CourseGradesPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';
  const [grades, setGrades] = useState<CourseGradesRollup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      setGrades(await getMyCourseGrades(courseId));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={styles.page}>
      <Link href={`/catalog/${courseId}`} className={styles.back}>
        ← Back to course
      </Link>
      <h1 className={styles.title}>Grades</h1>

      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {grades && (
        <>
          <section className={styles.section}>
            <h2>Projects</h2>
            {grades.projects.length === 0 ? (
              <p className={styles.muted}>No project submissions yet.</p>
            ) : (
              <ul className={styles.list}>
                {grades.projects.map((p) => (
                  <li key={p.projectId} className={styles.row}>
                    <span>{p.title}</span>
                    <span className={styles.meta}>
                      {p.status}
                      {p.score != null ? ` · ${p.score}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className={styles.section}>
            <h2>Assignments</h2>
            {grades.assignments.length === 0 ? (
              <p className={styles.muted}>No assignments.</p>
            ) : (
              <ul className={styles.list}>
                {grades.assignments.map((a) => (
                  <li key={a.assignmentId} className={styles.row}>
                    <Link href={`/catalog/${courseId}/assignments/${a.assignmentId}`}>
                      {a.title}
                    </Link>
                    <span className={styles.meta}>
                      {a.status}
                      {a.score != null ? ` · ${a.score}/${a.pointsPossible}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
