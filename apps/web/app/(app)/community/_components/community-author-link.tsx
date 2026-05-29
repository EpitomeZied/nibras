'use client';

import Link from 'next/link';
import Avatar from '../../_components/widgets/Avatar';
import type { CommunityAuthor } from '../../../lib/services/community';
import styles from './community-author-link.module.css';

type CommunityAuthorLinkProps = {
  author: CommunityAuthor;
  showAvatar?: boolean;
  avatarSize?: number;
  className?: string;
  strong?: boolean;
  stacked?: boolean;
};

export default function CommunityAuthorLink({
  author,
  showAvatar = false,
  avatarSize = 24,
  className,
  strong = false,
  stacked = false,
}: CommunityAuthorLinkProps) {
  const NameTag = strong ? 'strong' : 'span';
  const nameClass = [styles.name, className].filter(Boolean).join(' ');

  const inner = (
    <>
      {showAvatar ? (
        <Avatar
          url={author.avatarUrl}
          githubLogin={author.githubLogin}
          name={author.username}
          size={avatarSize}
        />
      ) : null}
      <NameTag className={nameClass}>{author.username}</NameTag>
    </>
  );

  const wrapClass = stacked ? `${styles.wrap} ${styles.wrapStacked}` : styles.wrap;

  if (!author.userId) {
    return <span className={wrapClass}>{inner}</span>;
  }

  return (
    <Link href={`/users/${author.userId}`} className={wrapClass}>
      {inner}
    </Link>
  );
}
