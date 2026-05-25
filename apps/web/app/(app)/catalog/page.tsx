'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '../../lib/session';
import InterestModal from './_components/interest-modal';
import ApplyModal from './_components/apply-modal';
import s from './page.module.css';

type TemplateRole = {
  id: string;
  key: string;
  label: string;
  count: number;
  sortOrder: number;
};

type CatalogTemplate = {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  description: string;
  deliveryMode: 'team' | 'individual';
  teamSize: number | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  tags: string[];
  estimatedDuration: string | null;
  roles: TemplateRole[];
  milestones: Array<{ id: string; title: string }>;
  status: string;
  courseName: string;
  courseCode: string;
  /** ID of the published project instance linked to this template, or null if none exists yet. */
  projectId: string | null;
};

type ApplyTarget = {
  projectId: string;
  templateTitle: string;
  roles: TemplateRole[];
};

export default function CatalogPage() {
  const searchParams = useSearchParams();
  const courseFilterId = searchParams.get('course')?.trim() ?? '';
  const [templates, setTemplates] = useState<CatalogTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Filters
  const [filterDelivery, setFilterDelivery] = useState<'all' | 'team' | 'individual'>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<Set<string>>(new Set());
  const [filterTag, setFilterTag] = useState('');

  // Modal state
  const [interestTarget, setInterestTarget] = useState<{
    projectId: string;
    templateTitle: string;
  } | null>(null);
  const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch('/v1/tracking/catalog', { auth: true });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Failed to load catalog (${res.status})`);
        }
        const data = (await res.json()) as CatalogTemplate[];
        setTemplates(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    templates.forEach((t) => t.tags?.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [templates]);

  const filtered = useMemo(() => {
    const tagFilter = filterTag.trim().toLowerCase();
    return templates.filter((t) => {
      if (courseFilterId && t.courseId !== courseFilterId) return false;
      if (filterDelivery !== 'all' && t.deliveryMode !== filterDelivery) return false;
      if (filterDifficulty.size > 0 && (!t.difficulty || !filterDifficulty.has(t.difficulty)))
        return false;
      if (tagFilter && !(t.tags ?? []).some((tag) => tag.toLowerCase().includes(tagFilter)))
        return false;
      return true;
    });
  }, [templates, filterDelivery, filterDifficulty, filterTag, courseFilterId]);

  function toggleDifficulty(d: string) {
    setFilterDifficulty((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  function handleInterestSuccess() {
    setInterestTarget(null);
    setToast('✅ Interest sent! The instructor has been notified.');
    setTimeout(() => setToast(''), 4000);
  }

  function handleApplySuccess() {
    setApplyTarget(null);
    setToast("🎉 Application submitted! You'll be notified when teams are formed.");
    setTimeout(() => setToast(''), 5000);
  }

  return (
    <main className={s.page}>
      {toast && <div className={s.toast}>{toast}</div>}

      {/* Hero header */}
      <header className={s.hero}>
        <div className={s.heroGlow} aria-hidden />
        <span className={s.heroEyebrow}>Project Catalog</span>
        <h1 className={s.heroTitle}>Browse Projects</h1>
        <p className={s.heroSub}>
          {courseFilterId
            ? 'Project templates for this course. Express interest or apply for team roles.'
            : 'Discover project templates across enrolled and public courses. Express interest or apply for team roles.'}
        </p>
      </header>

      {error && (
        <div className={s.errorBar} role="alert">
          {error}
        </div>
      )}

      <div className={s.layout}>
        {/* Filter sidebar */}
        <aside className={s.sidebar}>
          <h3 className={s.sidebarTitle}>Filters</h3>

          {/* Delivery mode */}
          <div className={s.filterGroup}>
            <p className={s.filterGroupLabel}>Delivery</p>
            {(['all', 'team', 'individual'] as const).map((mode) => (
              <label key={mode} className={s.filterLabel}>
                <input
                  type="radio"
                  name="delivery"
                  checked={filterDelivery === mode}
                  onChange={() => setFilterDelivery(mode)}
                />
                {mode === 'all' ? 'All' : mode === 'team' ? 'Team' : 'Individual'}
              </label>
            ))}
          </div>

          {/* Difficulty */}
          <div className={s.filterGroup}>
            <p className={s.filterGroupLabel}>Difficulty</p>
            {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
              <label key={d} className={s.filterLabel}>
                <input
                  type="checkbox"
                  checked={filterDifficulty.has(d)}
                  onChange={() => toggleDifficulty(d)}
                />
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </label>
            ))}
          </div>

          {/* Tag search */}
          <div className={s.filterGroup}>
            <p className={s.filterGroupLabel}>Search Tags</p>
            <input
              type="text"
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              placeholder="e.g. React"
              className={s.filterInput}
            />
            {allTags.length > 0 && (
              <div className={s.tagChips}>
                {allTags.slice(0, 12).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                    className={filterTag === tag ? `${s.tagChip} ${s.tagChipActive}` : s.tagChip}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Template grid */}
        <div>
          {loading ? (
            <div className={s.cardGrid}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className={s.skeletonCard}>
                  <span
                    className={s.skeletonLine}
                    style={{ width: '60%', height: 18 }}
                    aria-hidden
                  />
                  <span
                    className={s.skeletonLine}
                    style={{ width: '40%', height: 12 }}
                    aria-hidden
                  />
                  <span
                    className={s.skeletonLine}
                    style={{ width: '100%', height: 12 }}
                    aria-hidden
                  />
                  <span
                    className={s.skeletonLine}
                    style={{ width: '80%', height: 12 }}
                    aria-hidden
                  />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className={s.emptyState}>
              <span className={s.emptyEmoji} aria-hidden>
                📋
              </span>
              <h2 className={s.emptyTitle}>
                {templates.length === 0 ? 'No Templates Yet' : 'No Matches'}
              </h2>
              <p className={s.emptyBody}>
                {templates.length === 0
                  ? 'No project templates are available yet.'
                  : 'No templates match your current filters.'}
              </p>
            </div>
          ) : (
            <>
              <p className={s.resultsCount}>
                {filtered.length} template{filtered.length !== 1 ? 's' : ''} found
              </p>
              <div className={s.cardGrid}>
                {filtered.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onExpressInterest={(projectId) =>
                      setInterestTarget({ projectId, templateTitle: template.title })
                    }
                    onApplyForRoles={(projectId) =>
                      setApplyTarget({
                        projectId,
                        templateTitle: template.title,
                        roles: template.roles
                          .slice()
                          .sort(
                            (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)
                          ),
                      })
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {interestTarget && (
        <InterestModal
          projectId={interestTarget.projectId}
          templateTitle={interestTarget.templateTitle}
          onClose={() => setInterestTarget(null)}
          onSuccess={handleInterestSuccess}
        />
      )}

      {applyTarget && (
        <ApplyModal
          projectId={applyTarget.projectId}
          templateTitle={applyTarget.templateTitle}
          roles={applyTarget.roles}
          onClose={() => setApplyTarget(null)}
          onSuccess={handleApplySuccess}
        />
      )}
    </main>
  );
}

function TemplateCard({
  template,
  onExpressInterest,
  onApplyForRoles,
}: {
  template: CatalogTemplate;
  onExpressInterest: (projectId: string) => void;
  onApplyForRoles: (projectId: string) => void;
}) {
  const hasPublishedProject = Boolean(template.projectId);

  const difficultyClass =
    template.difficulty === 'beginner'
      ? s.badgeBeginner
      : template.difficulty === 'intermediate'
        ? s.badgeIntermediate
        : s.badgeAdvanced;

  const sortedRoles = template.roles
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

  return (
    <article className={s.card}>
      {/* Course badge + delivery mode + difficulty */}
      <div className={s.badgeRow}>
        <span className={`${s.badge} ${s.badgeCourse}`}>{template.courseCode}</span>
        <span
          className={`${s.badge} ${template.deliveryMode === 'team' ? s.badgeTeam : s.badgeIndividual}`}
        >
          {template.deliveryMode === 'team' ? '👥 Team' : '👤 Individual'}
        </span>
        {template.difficulty && (
          <span className={`${s.badge} ${difficultyClass}`}>{template.difficulty}</span>
        )}
      </div>

      {/* Title + description + course name */}
      <div>
        <h3 className={s.cardTitle}>{template.title}</h3>
        {template.description && <p className={s.cardDesc}>{template.description}</p>}
        <p className={s.cardCourseName}>{template.courseName}</p>
      </div>

      {/* Meta chips */}
      <div className={s.metaRow}>
        {template.estimatedDuration && (
          <span className={s.metaItem}>⏱ {template.estimatedDuration}</span>
        )}
        {template.deliveryMode === 'team' && template.teamSize && (
          <span className={s.metaItem}>👥 {template.teamSize} members</span>
        )}
        {template.milestones.length > 0 && (
          <span className={s.metaItem}>
            🏁 {template.milestones.length} milestone
            {template.milestones.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Roles (team projects only) */}
      {template.deliveryMode === 'team' && sortedRoles.length > 0 && (
        <div className={s.rolesSection}>
          <span className={s.rolesSectionLabel}>Open roles</span>
          <div className={s.rolesRow}>
            {sortedRoles.map((role) => (
              <span key={role.id} className={s.roleChip}>
                {role.label}
                <span className={s.roleCount}>{role.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inline tags */}
      {(template.tags ?? []).length > 0 && (
        <div className={s.tagRow}>
          {template.tags.map((tag) => (
            <span key={tag} className={s.inlineTag}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className={s.cardCta}>
        {template.deliveryMode === 'team' ? (
          hasPublishedProject ? (
            <button
              type="button"
              onClick={() => onApplyForRoles(template.projectId!)}
              className={s.ctaPrimary}
            >
              Apply for Roles →
            </button>
          ) : (
            <button type="button" disabled className={s.ctaDisabled}>
              Roles Not Open Yet
            </button>
          )
        ) : hasPublishedProject ? (
          <button
            type="button"
            onClick={() => onExpressInterest(template.projectId!)}
            className={s.ctaPrimary}
          >
            Express Interest
          </button>
        ) : (
          <button type="button" disabled className={s.ctaDisabled}>
            Project Not Open Yet
          </button>
        )}
      </div>
    </article>
  );
}
