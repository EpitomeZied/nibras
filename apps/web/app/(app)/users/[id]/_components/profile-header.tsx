'use client';

import Link from 'next/link';
import type { UserProfilePublic } from '@nibras/contracts';
import UserAvatar from '../../../_components/widgets/UserAvatar';
import styles from '../page.module.css';

function formatMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

const SOCIAL_LABELS: Record<string, string> = {
  website: 'Website',
  linkedin: 'LinkedIn',
  x: 'X',
  instagram: 'Instagram',
  youtube: 'YouTube',
  discord: 'Discord',
};

export default function ProfileHeader({
  profile,
  isSelf,
  onCopyLink,
  copyStatus,
}: {
  profile: UserProfilePublic;
  isSelf: boolean;
  onCopyLink?: () => void;
  copyStatus?: string;
}) {
  const name = profile.displayName?.trim() || profile.username;
  const githubUrl = `https://github.com/${encodeURIComponent(profile.githubLogin)}`;

  return (
    <div className={styles.headerCard}>
      <UserAvatar
        name={name}
        size={80}
        url={profile.avatarUrl}
        githubLogin={profile.githubLogin}
        useNextImage
      />
      <div className={styles.headerText}>
        <div className={styles.headerTopRow}>
          <div>
            <h1 className={styles.displayName}>{name}</h1>
            <p className={styles.username}>@{profile.username}</p>
          </div>
          {isSelf ? (
            <div className={styles.headerActions}>
              <Link href="/settings?tab=profile" className={styles.headerBtn}>
                Edit profile
              </Link>
              {onCopyLink ? (
                <button type="button" className={styles.headerBtnSecondary} onClick={onCopyLink}>
                  {copyStatus || 'Copy link'}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className={styles.metaRow}>
          <span className={styles.roleChip}>{profile.primaryRole}</span>
          <span className={styles.metaItem}>Year {profile.yearLevel}</span>
          <span className={styles.metaItem}>Joined {formatMemberSince(profile.memberSince)}</span>
        </div>
        <div className={styles.linkRow}>
          <a
            href={githubUrl}
            className={styles.externalLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub · {profile.githubLogin}
          </a>
          {(profile.socialLinks ?? []).map((link) => (
            <a
              key={link.platform}
              href={link.url}
              className={styles.externalLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {SOCIAL_LABELS[link.platform] ?? link.platform}
            </a>
          ))}
        </div>
        {profile.bio ? (
          <p className={styles.bio}>{profile.bio}</p>
        ) : isSelf ? (
          <p className={styles.bioMuted}>
            No bio yet.{' '}
            <Link href="/settings?tab=profile" className={styles.inlineLink}>
              Add one
            </Link>
          </p>
        ) : (
          <p className={styles.bioMuted}>No bio yet.</p>
        )}
      </div>
    </div>
  );
}
