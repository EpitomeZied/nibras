'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { useFetch } from '../../../../../lib/use-fetch';
import { getVideoAnalytics } from '../../../../../lib/services/course-profile';
import styles from '../../../instructor.module.css';

type MilestonePassRate = {
  milestoneId: string;
  milestoneTitle: string;
  totalStudents: number;
  submittedCount: number;
  passedCount: number;
  passRate: number;
};

type StudentProgress = {
  userId: string;
  username: string;
  passedMilestones: number;
  totalMilestones: number;
};

type InstructorAnalytics = {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  submissionCount: number;
  passRate: number;
  milestones: MilestonePassRate[];
  students: StudentProgress[];
};

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default function CourseAnalyticsPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { data, loading, error } = useFetch<InstructorAnalytics>(
    `/v1/tracking/analytics/instructor?courseId=${courseId}`
  );
  const [videoStats, setVideoStats] = useState<
    Array<{
      videoId: string;
      title: string;
      sectionTitle: string;
      watchedCount: number;
      enrolledCount: number;
      avgWatchedProgress: number;
    }>
  >([]);

  useEffect(() => {
    void getVideoAnalytics(courseId)
      .then((r) => setVideoStats(r.videos ?? []))
      .catch(() => setVideoStats([]));
  }, [courseId]);

  return (
    <div className={styles.page}>
      <div className={styles.detailHeader}>
        <div>
          <p className={styles.breadcrumb}>
            <Link href="/instructor">Instructor</Link> /{' '}
            <Link href={`/instructor/courses/${courseId}`}>Course</Link> / Analytics
          </p>
          <h1>Course Analytics</h1>
        </div>
        <Link href={`/instructor/courses/${courseId}`} className={styles.btnSecondary}>
          ← Back to Course
        </Link>
      </div>

      {loading && <p className={styles.muted}>Loading analytics…</p>}
      {error && <p className={styles.errorText}>{error}</p>}

      {data && (
        <>
          {/* ── Summary cards ─────────────────────────────────────────── */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Students</p>
              <strong style={{ fontSize: '2rem' }}>{data.totalStudents}</strong>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Submissions</p>
              <strong style={{ fontSize: '2rem' }}>{data.submissionCount}</strong>
            </div>
            <div className={styles.summaryCard}>
              <p className={styles.summaryLabel}>Overall Pass Rate</p>
              <strong style={{ fontSize: '2rem' }}>{pct(data.passRate)}</strong>
            </div>
          </div>

          {/* ── Milestone breakdown ───────────────────────────────────── */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Milestone Breakdown</h2>
              <span className={styles.muted}>{data.milestones.length} milestones</span>
            </div>
            {data.milestones.length === 0 ? (
              <p className={styles.muted}>No milestones found.</p>
            ) : (
              <table className={styles.submissionTable}>
                <thead>
                  <tr>
                    <th>Milestone</th>
                    <th>Students</th>
                    <th>Submitted</th>
                    <th>Passed</th>
                    <th>Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.milestones.map((m) => (
                    <tr key={m.milestoneId}>
                      <td>{m.milestoneTitle}</td>
                      <td>{m.totalStudents}</td>
                      <td>{m.submittedCount}</td>
                      <td>{m.passedCount}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              m.passRate >= 0.8
                                ? 'var(--success, #22c55e)'
                                : m.passRate >= 0.5
                                  ? 'var(--warning, #f59e0b)'
                                  : 'var(--danger, #ef4444)',
                          }}
                        >
                          {pct(m.passRate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Per-student progress ──────────────────────────────────── */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2>Student Progress</h2>
              <span className={styles.muted}>{data.students.length} students</span>
            </div>
            {data.students.length === 0 ? (
              <p className={styles.muted}>No students enrolled.</p>
            ) : (
              <table className={styles.submissionTable}>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Milestones Passed</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((s) => (
                    <tr key={s.userId}>
                      <td>{s.username}</td>
                      <td>
                        {s.passedMilestones} / {s.totalMilestones}
                      </td>
                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              background: 'var(--border)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: s.totalMilestones
                                  ? `${(s.passedMilestones / s.totalMilestones) * 100}%`
                                  : '0%',
                                background: 'var(--primary, #3b82f6)',
                                borderRadius: 3,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36 }}>
                            {s.totalMilestones ? pct(s.passedMilestones / s.totalMilestones) : '—'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {videoStats.length > 0 && (
            <div className={styles.panel} style={{ marginTop: 20 }}>
              <h2>Lecture completion</h2>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Video</th>
                    <th>Watched</th>
                    <th>Avg progress</th>
                  </tr>
                </thead>
                <tbody>
                  {videoStats.map((v) => (
                    <tr key={v.videoId}>
                      <td>
                        {v.title}
                        <span className={styles.muted} style={{ display: 'block', fontSize: 12 }}>
                          {v.sectionTitle}
                        </span>
                      </td>
                      <td>
                        {v.watchedCount} / {v.enrolledCount}
                      </td>
                      <td>{Math.round(v.avgWatchedProgress * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
