'use client';

import Link from 'next/link';
import s from '../page.module.css';

export type CatalogTab = 'courses' | 'projects';

export default function CatalogTabs({
  active,
  preserveCourseFilter,
}: {
  active: CatalogTab;
  preserveCourseFilter?: string;
}) {
  const projectsHref =
    active === 'projects' && preserveCourseFilter
      ? `/catalog?tab=projects&course=${encodeURIComponent(preserveCourseFilter)}`
      : '/catalog?tab=projects';

  return (
    <nav className={s.tabBar} aria-label="Catalog sections">
      <Link
        href="/catalog?tab=courses"
        className={active === 'courses' ? `${s.tab} ${s.tabActive}` : s.tab}
        aria-current={active === 'courses' ? 'page' : undefined}
      >
        Courses
      </Link>
      <Link
        href={projectsHref}
        className={active === 'projects' ? `${s.tab} ${s.tabActive}` : s.tab}
        aria-current={active === 'projects' ? 'page' : undefined}
      >
        Projects
      </Link>
    </nav>
  );
}
