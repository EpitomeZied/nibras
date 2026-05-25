'use client';

import UserAvatar from './UserAvatar';

export type AvatarProps = {
  url?: string;
  name: string;
  size?: number;
  githubLogin?: string;
};

export default function Avatar({ url, name, size = 28, githubLogin }: AvatarProps) {
  return <UserAvatar name={name} size={size} url={url} githubLogin={githubLogin} />;
}
