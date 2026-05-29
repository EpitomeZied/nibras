'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { UserProfileGamification, UserProfileResponse } from '@nibras/contracts';
import { useSession } from '../../_components/session-context';
import StatTile from '../../_components/widgets/StatTile';
import EmptyState from '../../_components/widgets/EmptyState';
import { getUserProfile } from '../../../lib/services/user-profile';
import ProfileHeader from './_components/profile-header';
import CourseProgressSection from './_components/course-progress-section';
import SubmissionsSection from './_components/submissions-section';
import GamificationSection from './_components/gamification-section';
import ProfileSkeleton from './_components/profile-skeleton';
import ProfileStreakSection from './_components/profile-streak-section';
import ProfileCompetitionAccounts from './_components/profile-competition-accounts';
import ProfileReputationTimeline from './_components/profile-reputation-timeline';
import ProfileSectionNav, { type ProfileSectionId } from './_components/profile-section-nav';
import ProfileBadgeModal from './_components/profile-badge-modal';
import ProfileSelfBanner from './_components/profile-self-banner';
import styles from './page.module.css';

function isLimitedViewer(role: UserProfileResponse['viewerRole']): boolean {
  return role === 'authenticated';
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);
  const { user: sessionUser } = useSession();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [selectedBadge, setSelectedBadge] = useState<UserProfileGamification['badges'][number] | null>(
    null
  );

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

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('Copied!');
      window.setTimeout(() => setCopyStatus(''), 2000);
    } catch {
      setCopyStatus('Copy failed');
    }
  }, []);

  const navSections = useMemo((): ProfileSectionId[] => {
    if (!profile) return [];
    const limited = isLimitedViewer(profile.viewerRole);
    const sections: ProfileSectionId[] = ['profile-overview'];
    if (profile.dailyStreak) sections.push('profile-streak');
    if (profile.competitionAccounts && profile.competitionAccounts.length > 0) {
      sections.push('profile-platforms');
    }
    if (!limited) {
      if (profile.courseProgress && profile.courseProgress.length > 0) {
        sections.push('profile-courses');
      }
      if (profile.submissions && profile.submissions.length > 0) {
        sections.push('profile-submissions');
      }
    }
    if (profile.gamification) sections.push('profile-badges');
    if (!limited && profile.activity && profile.activity.length > 0) {
      sections.push('profile-activity');
    }
    if (
      profile.viewerRole === 'self' &&
      profile.gamification?.history &&
      profile.gamification.history.length > 0
    ) {
      sections.push('profile-reputation');
    }
    return sections;
  }, [profile]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    const isForbidden = error.status === 403;
    const isNotFound = error.status === 404;
    return (
      <div className={styles.errorPanel}>
        <h1>{isNotFound ? 'User not found' : isForbidden ? 'Profile not available' : 'Error'}</h1>
        <p>
          {isForbidden
            ? 'Sign in to view profiles on Nibras.'
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

  const limited = isLimitedViewer(profile.viewerRole);
  const isDetailedViewer = profile.viewerRole === 'instructor' || profile.viewerRole === 'admin';
  const isSelf = profile.viewerRole === 'self' || sessionUser?.id === userId;
  const showScores = isDetailedViewer;

  return (
    <div className={styles.page}>
      <ProfileSectionNav sections={navSections} />

      {isSelf && sessionUser ? (
        <ProfileSelfBanner githubAppInstalled={sessionUser.githubAppInstalled} />
      ) : null}

      <div id="profile-overview">
        <ProfileHeader
          profile={profile.profile}
          isSelf={isSelf}
          onCopyLink={isSelf ? handleCopyLink : undefined}
          copyStatus={copyStatus}
        />
      </div>

      {profile.stats && (
        <div className={styles.summary}>
          <StatTile label="Passed" value={profile.stats.passedCount} />
          {isSelf && profile.stats.pendingCount != null ? (
            <StatTile label="Pending" value={profile.stats.pendingCount} />
          ) : null}
          {isSelf && profile.stats.needsReviewCount != null ? (
            <StatTile label="Needs review" value={profile.stats.needsReviewCount} />
          ) : null}
          {!limited ? (
            <StatTile label="Courses" value={profile.stats.coursesEnrolled} />
          ) : (
            <StatTile label="Courses" value={profile.stats.coursesEnrolled} />
          )}
          {!limited && !isDetailedViewer && !isSelf ? (
            <StatTile label="Submissions" value={profile.stats.totalSubmissions} />
          ) : null}
          {isDetailedViewer && profile.stats.failedCount != null ? (
            <StatTile label="Failed" value={profile.stats.failedCount} />
          ) : null}
          {isDetailedViewer && profile.stats.avgScore != null ? (
            <StatTile label="Avg score" value={profile.stats.avgScore} />
          ) : null}
          {limited && profile.gamification ? (
            <StatTile
              label="Reputation"
              value={profile.gamification.reputationTotal}
              caption={profile.gamification.levelLabel}
            />
          ) : null}
        </div>
      )}

      {profile.dailyStreak ? <ProfileStreakSection streak={profile.dailyStreak} /> : null}

      {profile.competitionAccounts && profile.competitionAccounts.length > 0 ? (
        <ProfileCompetitionAccounts accounts={profile.competitionAccounts} />
      ) : null}

      {!limited && profile.courseProgress && profile.courseProgress.length > 0 && (
        <section className={styles.section} id="profile-courses">
          <h2 className={styles.sectionTitle}>Course progress</h2>
          <CourseProgressSection courses={profile.courseProgress} />
        </section>
      )}

      {!limited && profile.courseProgress?.length === 0 && isSelf ? (
        <section className={styles.section} id="profile-courses">
          <h2 className={styles.sectionTitle}>Course progress</h2>
          <EmptyState
            title="No courses yet"
            description="Browse the catalog to enroll in your first course."
            action={{
              label: 'Browse catalog',
              onClick: () => {
                window.location.href = '/catalog';
              },
            }}
          />
        </section>
      ) : null}

      {!limited && profile.submissions && profile.submissions.length > 0 && (
        <section className={styles.section} id="profile-submissions">
          <h2 className={styles.sectionTitle}>
            {isSelf && !isDetailedViewer ? 'Recent submissions' : 'Submission history'}
          </h2>
          <SubmissionsSection
            submissions={profile.submissions}
            showScores={showScores}
            showFilters={isDetailedViewer}
          />
        </section>
      )}

      {profile.gamification && (
        <section className={styles.section} id="profile-badges">
          <h2 className={styles.sectionTitle}>Badges & reputation</h2>
          {profile.gamification.earnedBadgeCount === 0 && limited ? (
            <EmptyState
              title="No badges yet"
              description="Complete projects and contribute to unlock badges."
            />
          ) : (
            <GamificationSection
              gamification={profile.gamification}
              showDetailed={isDetailedViewer}
              onBadgeClick={setSelectedBadge}
            />
          )}
        </section>
      )}

      {!limited && profile.activity && profile.activity.length > 0 && (
        <section className={styles.section} id="profile-activity">
          <h2 className={styles.sectionTitle}>Recent activity</h2>
          <div className={styles.panel}>
            <ul className={styles.activityList}>
              {profile.activity.map((item) => (
                <li key={item.id} className={styles.progressRow}>
                  <div>
                    {item.href ? (
                      <Link href={item.href} className={styles.activityLink}>
                        <strong>{item.title}</strong>
                      </Link>
                    ) : (
                      <strong>{item.title}</strong>
                    )}
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

      {isSelf && profile.gamification ? (
        <ProfileReputationTimeline gamification={profile.gamification} />
      ) : null}

      <ProfileBadgeModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </div>
  );
}
