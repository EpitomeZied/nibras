import styles from '../page.module.css';

export type ProfileSectionId =
  | 'profile-overview'
  | 'profile-streak'
  | 'profile-platforms'
  | 'profile-courses'
  | 'profile-submissions'
  | 'profile-badges'
  | 'profile-activity'
  | 'profile-reputation';

export default function ProfileSectionNav({ sections }: { sections: ProfileSectionId[] }) {
  const labels: Record<ProfileSectionId, string> = {
    'profile-overview': 'Overview',
    'profile-streak': 'Streak',
    'profile-platforms': 'Platforms',
    'profile-courses': 'Courses',
    'profile-submissions': 'Submissions',
    'profile-badges': 'Badges',
    'profile-activity': 'Activity',
    'profile-reputation': 'Reputation',
  };

  if (sections.length < 2) return null;

  return (
    <nav className={styles.sectionNav} aria-label="Profile sections">
      {sections.map((id) => (
        <a key={id} href={`#${id}`} className={styles.sectionNavLink}>
          {labels[id]}
        </a>
      ))}
    </nav>
  );
}
