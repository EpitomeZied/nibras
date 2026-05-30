'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CourseGradesRollup } from '@nibras/contracts';
import CourseShell from '../../_components/course-shell';
import { getMyCourseGrades } from '../../../../lib/services/course-profile';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import styles from './page.module.css';

function GradesContent() {
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

  const summary = useMemo(() => {
    if (!grades) return null;
    const gradedAssignments = grades.assignments.filter((a) => a.status === 'graded').length;
    const gradedProjects = grades.projects.filter((p) => p.score != null).length;
    return {
      gradedAssignments,
      totalAssignments: grades.assignments.length,
      gradedProjects,
      totalProjects: grades.projects.length,
    };
  }, [grades]);

  return (
    <>
      <h2 className={styles.pageTitle}>Grades</h2>

      {loading && <p className={styles.muted}>Loading…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {summary && (
        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Assignments graded</span>
            <span className={styles.summaryValue}>
              {summary.gradedAssignments}/{summary.totalAssignments}
            </span>
          </div>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>Projects scored</span>
            <span className={styles.summaryValue}>
              {summary.gradedProjects}/{summary.totalProjects}
            </span>
          </div>
        </div>
      )}

      {grades && (
        <>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Projects</h3>
            {grades.projects.length === 0 ? (
              <p className={styles.muted}>No project submissions yet.</p>
            ) : (
              <ul className={styles.list}>
                {grades.projects.map((p) => (
                  <li key={p.projectId} className={styles.card}>
                    <span className={styles.cardTitle}>{p.title}</span>
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
            <h3 className={styles.sectionTitle}>Assignments</h3>
            {grades.assignments.length === 0 ? (
              <p className={styles.muted}>No assignments.</p>
            ) : (
              <ul className={styles.list}>
                {grades.assignments.map((a) => (
                  <li key={a.assignmentId} className={styles.card}>
                    <Link
                      href={`/catalog/${courseId}/assignments/${a.assignmentId}`}
                      className={styles.cardTitle}
                    >
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
    </>
  );
}

export default function CourseGradesPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId ?? '';

  return (
    <CourseShell courseId={courseId}>
      <GradesContent />
    </CourseShell>
  );
}
