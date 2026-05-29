import type { UserProfilePublic } from '@nibras/contracts';
import UserAvatar from '../../../_components/widgets/UserAvatar';
import styles from '../page.module.css';

export default function ProfileHeader({ profile }: { profile: UserProfilePublic }) {
  const name = profile.displayName?.trim() || profile.username;

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
        <h1 className={styles.displayName}>{name}</h1>
        <p className={styles.username}>@{profile.username}</p>
        <span className={styles.roleChip}>{profile.primaryRole}</span>
        {profile.bio ? (
          <p className={styles.bio}>{profile.bio}</p>
        ) : (
          <p className={styles.bioMuted}>No bio yet.</p>
        )}
      </div>
    </div>
  );
}
