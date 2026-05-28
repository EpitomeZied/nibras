'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '../_components/session-context';

const tabs = [
  { href: '/community', label: 'Q&A', exact: true },
  { href: '/community/discussions', label: 'Discussions' },
  { href: '/community/tags', label: 'Tags', adminOnly: true },
];

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useSession();
  const isAdmin = user?.systemRole === 'admin';

  return (
    <div>
      <nav
        aria-label="Community sections"
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {tabs
          .filter((tab) => !tab.adminOnly || isAdmin)
          .map((tab) => {
            const active = tab.exact
              ? pathname === tab.href
              : pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  textDecoration: 'none',
                  color: active ? 'var(--primary)' : 'var(--text-muted)',
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                  background: active ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
                }}
              >
                {tab.label}
              </Link>
            );
          })}
      </nav>
      {children}
    </div>
  );
}
