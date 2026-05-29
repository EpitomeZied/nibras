'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { UserProfileResponse } from '@nibras/contracts';
import { useSession } from '../../_components/session-context';
import StatTile from '../../_components/widgets/StatTile';
import EmptyState from '../../_components/widgets/EmptyState';
import { getUserProfile } from '../../../lib/services/user-profile';
import ProfileHeader from './_components/profile-header';
import CourseProgressSection from './_components/course-progress-section';
import SubmissionsSection from './_components/submissions-section';
import GamificationSection from './_components/gamification-section';
import styles from './page.module.css';

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);
  const { user: sessionUser } = useSession();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserProfile(userId);
      setProfile(data);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      setProfile(null);
      setError({
        status,
        message: err instanceof Error ? err.message : 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className={styles.muted}>Loading profile…</p>;
  }

  if (error) {
    const isForbidden = error.status === 403;
    const isNotFound = error.status === 404;
    return (
      <div className={styles.errorPanel}>
        <h1>{isNotFound ? 'User not found' : isForbidden ? 'Profile not available' : 'Error'}</h1>
        <p>
          {isForbidden
            ? 'You do not have permission to view this profile.'
            : isNotFound
              ? 'This user does not exist or was removed.'
              : error.message}
        </p>
        <p style={{ marginTop: 16 }}>
          <Link href="/dashboard">Back to dashboard</Link>
        </p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isDetailedViewer = profile.viewerRole === 'instructor' || profile.viewerRole === 'admin';
  const isSelf = profile.viewerRole === 'self' || sessionUser?.id === userId;
  const showScores = isDetailedViewer;

  return (
    <div className={styles.page}>
      <ProfileHeader profile={profile.profile} />

      {profile.stats && (
        <div className={styles.summary}>
          <StatTile label="Passed" value={profile.stats.passedCount} />
          <StatTile label="Courses" value={profile.stats.coursesEnrolled} />
          {isDetailedViewer ? (
            <>
              {profile.stats.failedCount != null && (
                <StatTile label="Failed" value={profile.stats.failedCount} />
              )}
              {profile.stats.avgScore != null && (
                <StatTile label="Avg score" value={profile.stats.avgScore} />
              )}
            </>
          ) : (
            <StatTile label="Submissions" value={profile.stats.totalSubmissions} />
          )}
        </div>
      )}

      {profile.courseProgress && profile.courseProgress.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Course progress</h2>
          <CourseProgressSection courses={profile.courseProgress} />
        </section>
      )}

      {profile.submissions && profile.submissions.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {isSelf && !isDetailedViewer ? 'Recent submissions' : 'Submission history'}
          </h2>
          <SubmissionsSection submissions={profile.submissions} showScores={showScores} />
        </section>
      )}

      {profile.gamification && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Badges & reputation</h2>
          {profile.gamification.earnedBadgeCount === 0 && !isDetailedViewer ? (
            <EmptyState
              title="No badges yet"
              description="Complete projects and contribute to unlock badges."
            />
          ) : (
            <GamificationSection
              gamification={profile.gamification}
              showDetailed={isDetailedViewer}
            />
          )}
        </section>
      )}

      {profile.activity && profile.activity.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Recent activity</h2>
          <div className={styles.panel}>
            <ul
              className={styles.progressList}
              style={{ listStyle: 'none', margin: 0, padding: 0 }}
            >
              {profile.activity.map((item) => (
                <li key={item.id} className={styles.progressRow}>
                  <div>
                    <strong>{item.title}</strong>
                    {item.subtitle && <div className={styles.progressMeta}>{item.subtitle}</div>}
                  </div>
                  <span className={styles.muted}>
                    {new Date(item.occurredAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
