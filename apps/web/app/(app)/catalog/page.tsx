'use client';

import { useSearchParams } from 'next/navigation';
import CatalogTabs, { type CatalogTab } from './_components/catalog-tabs';
import CatalogVerseFooter from './_components/catalog-verse-footer';
import CourseCatalogTab from './_components/course-catalog-tab';
import ProjectCatalogTab from './_components/project-catalog-tab';
import s from './page.module.css';

function resolveTab(raw: string | null): CatalogTab {
  return raw === 'projects' ? 'projects' : 'courses';
}

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const tab = resolveTab(searchParams.get('tab'));
  const courseFilter = searchParams.get('course')?.trim() ?? '';

  return (
    <main className={s.page}>
      <header className={s.hero}>
        <div className={s.heroGlow} aria-hidden />
        <span className={s.heroEyebrow}>Catalog</span>
        <h1 className={s.heroTitle}>Browse courses &amp; projects</h1>
        <p className={s.heroSub}>
          Join courses, request access to private sections, and discover project templates across
          your enrolled and public courses.
        </p>
      </header>

      <CatalogTabs active={tab} preserveCourseFilter={courseFilter || undefined} />

      {tab === 'courses' ? <CourseCatalogTab /> : <ProjectCatalogTab />}

      <CatalogVerseFooter />
    </main>
  );
}
