'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../_components/session-context';
import ProfileSkeleton from './[id]/_components/profile-skeleton';

export default function UsersIndexPage() {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user?.id) {
      router.replace(`/users/${user.id}`);
      return;
    }
    router.replace('/sign-in');
  }, [user, loading, router]);

  return <ProfileSkeleton />;
}
