'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import type { InstructorCourseGradesResponse } from '@nibras/contracts';
import { getInstructorCourseGrades } from '../../../../../lib/services/course-profile';
import { friendlyMessage } from '../../../../../lib/api-clients/errors';
import styles from '../../../instructor.module.css';

function studentLabel(row: InstructorCourseGradesResponse['students'][number]): string {
  return row.displayName?.trim() || row.githubLogin || row.username;
}

function escapeCsv(value: string | number | null | undefined): string {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export default function InstructorGradesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const [data, setData] = useState<InstructorCourseGradesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getInstructorCourseGrades(courseId));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const projectHeaders = useMemo(() => {
    const first = data?.students[0];
    return first?.projects ?? [];
  }, [data]);

  const assignmentHeaders = useMemo(() => {
    const first = data?.students[0];
    return first?.assignments ?? [];
  }, [data]);

  const filteredStudents = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.students;
    return data.students.filter((row) => {
      const label = studentLabel(row).toLowerCase();
      return label.includes(q) || row.username.toLowerCase().includes(q);
    });
  }, [data, search]);

  function handleExportCsv() {
    if (!data) return;
    const headers = [
      'Student',
      'Username',
      ...projectHeaders.map((p) => `Project: ${p.title}`),
      ...assignmentHeaders.map((a) => `Assignment: ${a.title}`),
    ];
    const rows = filteredStudents.map((row) => [
      studentLabel(row),
      row.username,
      ...projectHeaders.map((p) => {
        const match = row.projects.find((entry) => entry.projectId === p.projectId);
        return match?.score ?? '';
      }),
      ...assignmentHeaders.map((a) => {
        const match = row.assignments.find((entry) => entry.assignmentId === a.assignmentId);
        return match?.score ?? '';
      }),
    ]);
    const csv = [headers, ...rows].map((line) => line.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `course-${courseId}-gradebook.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className={styles.detailHeader}>
        <div>
          <h2 style={{ margin: 0 }}>Gradebook</h2>
          <p className={styles.muted} style={{ margin: '6px 0 0' }}>
            Project review scores and assignment grades for enrolled students.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            aria-label="Search students"
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}
          />
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={handleExportCsv}
            disabled={!data || filteredStudents.length === 0}
          >
            ↓ Export CSV
          </button>
        </div>
      </div>

      {loading && <p className={styles.muted}>Loading gradebook…</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {!loading && !error && data && (
        <div className={styles.panel} style={{ overflowX: 'auto' }}>
          {filteredStudents.length === 0 ? (
            <p className={styles.muted}>No students match this filter.</p>
          ) : (
            <table className={styles.submissionTable}>
              <thead>
                <tr>
                  <th>Student</th>
                  {projectHeaders.map((project) => (
                    <th key={project.projectId}>{project.title}</th>
                  ))}
                  {assignmentHeaders.map((assignment) => (
                    <th key={assignment.assignmentId}>{assignment.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((row) => (
                  <tr key={row.userId}>
                    <td>
                      <strong>{studentLabel(row)}</strong>
                      <div className={styles.muted}>{row.username}</div>
                    </td>
                    {projectHeaders.map((project) => {
                      const match = row.projects.find(
                        (entry) => entry.projectId === project.projectId
                      );
                      return (
                        <td key={project.projectId} className={styles.mono}>
                          {match?.score != null ? match.score : '—'}
                        </td>
                      );
                    })}
                    {assignmentHeaders.map((assignment) => {
                      const match = row.assignments.find(
                        (entry) => entry.assignmentId === assignment.assignmentId
                      );
                      return (
                        <td key={assignment.assignmentId} className={styles.mono}>
                          {match?.score != null
                            ? `${match.score}/${match.pointsPossible ?? assignment.pointsPossible}`
                            : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
