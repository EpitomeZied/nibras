'use client';

import Link from 'next/link';
import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import SelectField from '../../../../../../_components/ui/select-field';
import styles from '../../../../../instructor.module.css';

const DIFFICULTY_OPTIONS = [
  { value: '', label: '— Not specified —' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
import { apiFetch } from '../../../../../../../lib/session';

type RoleRow = { key: string; label: string; count: number };
type MilestoneRow = {
  title: string;
  description: string;
  order: number;
  dueAt: string;
  isFinal: boolean;
};

type TemplateData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  deliveryMode: 'team' | 'individual';
  teamSize: number | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  tags: string[];
  estimatedDuration: string | null;
  roles: Array<{ id: string; key: string; label: string; count: number; sortOrder: number }>;
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    dueAt: string | null;
    isFinal: boolean;
  }>;
  status: string;
};

export default function EditTemplatePage({
  params,
}: {
  params: Promise<{ courseId: string; templateId: string }>;
}) {
  const { courseId, templateId } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'team' | 'individual'>('team');
  const [teamSize, setTeamSize] = useState(3);
  const [difficulty, setDifficulty] = useState<string>('');
  const [tags, setTags] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const res = await apiFetch(`/v1/tracking/templates/${templateId}`, { auth: true });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Failed to load template (${res.status})`);
        }
        const data = (await res.json()) as TemplateData;
        setTitle(data.title);
        setSlug(data.slug);
        setDescription(data.description);
        setDeliveryMode(data.deliveryMode);
        setTeamSize(data.teamSize ?? 3);
        setDifficulty(data.difficulty ?? '');
        setTags((data.tags ?? []).join(', '));
        setEstimatedDuration(data.estimatedDuration ?? '');
        setRoles(data.roles.map((r) => ({ key: r.key, label: r.label, count: r.count })));
        setMilestones(
          data.milestones.map((m) => ({
            title: m.title,
            description: m.description,
            order: m.order,
            dueAt: m.dueAt ? m.dueAt.slice(0, 16) : '',
            isFinal: m.isFinal,
          }))
        );
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [templateId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const tagList = tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
      const payload = {
        slug: slug.trim() || undefined,
        title: title.trim(),
        description: description.trim(),
        deliveryMode,
        teamSize: deliveryMode === 'team' ? teamSize : null,
        difficulty: (difficulty || null) as 'beginner' | 'intermediate' | 'advanced' | null,
        tags: tagList,
        estimatedDuration: estimatedDuration.trim() || null,
        status: 'active',
        roles:
          deliveryMode === 'team'
            ? roles
                .filter((r) => r.key.trim() && r.label.trim())
                .map((r, i) => ({
                  key: r.key.trim(),
                  label: r.label.trim(),
                  count: r.count,
                  sortOrder: i,
                }))
            : [],
        milestones: milestones
          .filter((m) => m.title.trim())
          .map((m, i) => ({
            title: m.title.trim(),
            description: m.description.trim(),
            order: m.order || i + 1,
            dueAt: m.dueAt ? new Date(m.dueAt).toISOString() : null,
            isFinal: m.isFinal,
          })),
      };
      const res = await apiFetch(`/v1/tracking/templates/${templateId}`, {
        auth: true,
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to update template (${res.status})`);
      }
      router.push(`/instructor/courses/${courseId}/templates`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: 32 }}>Loading…</div>;
  if (loadError) return <div style={{ padding: 32, color: 'var(--error)' }}>{loadError}</div>;

  return (
    <div className={styles.formPage}>
      <div>
        <p className={styles.breadcrumb}>
          <Link href="/instructor">Instructor</Link> /{' '}
          <Link href={`/instructor/courses/${courseId}`}>Course</Link> /{' '}
          <Link href={`/instructor/courses/${courseId}/templates`}>Templates</Link> / Edit
        </p>
        <h1>Edit Template</h1>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className={styles.formSection}>
        <div className={styles.formGroup}>
          <label htmlFor="title">Template Title</label>
          <input
            id="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="slug">Slug</label>
          <input id="slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <SelectField
            id="deliveryMode"
            label="Delivery Mode"
            value={deliveryMode}
            onChange={(value) => setDeliveryMode(value as 'team' | 'individual')}
            options={[
              { value: 'team', label: 'Team' },
              { value: 'individual', label: 'Individual' },
            ]}
          />
        </div>

        <div className={styles.formGroup}>
          <SelectField
            id="difficulty"
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={DIFFICULTY_OPTIONS}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tags">Skill Tags</label>
          <input
            id="tags"
            type="text"
            placeholder="React, Node.js, Python (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="estimatedDuration">Estimated Duration</label>
          <input
            id="estimatedDuration"
            type="text"
            placeholder="4 weeks"
            value={estimatedDuration}
            onChange={(e) => setEstimatedDuration(e.target.value)}
          />
        </div>

        {deliveryMode === 'team' && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="teamSize">Exact Team Size</label>
              <input
                id="teamSize"
                type="number"
                min={2}
                max={8}
                value={teamSize}
                onChange={(e) => setTeamSize(Number(e.target.value) || 2)}
              />
            </div>

            <div className={styles.dynamicSection}>
              <div className={styles.dynamicSectionHeader}>
                <span className={styles.dynamicSectionLabel}>Role Slots</span>
                <button
                  type="button"
                  className={styles.btnAddRow}
                  onClick={() => setRoles((prev) => [...prev, { key: '', label: '', count: 1 }])}
                >
                  + Add role
                </button>
              </div>
              {roles.map((role, index) => (
                <div key={index} className={styles.dynamicRow}>
                  <input
                    type="text"
                    placeholder="role-key"
                    value={role.key}
                    onChange={(e) =>
                      setRoles((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, key: e.target.value } : r))
                      )
                    }
                    className={styles.dynamicRowLabel}
                  />
                  <input
                    type="text"
                    placeholder="Role label"
                    value={role.label}
                    onChange={(e) =>
                      setRoles((prev) =>
                        prev.map((r, i) => (i === index ? { ...r, label: e.target.value } : r))
                      )
                    }
                    className={styles.dynamicRowMain}
                  />
                  <input
                    type="number"
                    min={1}
                    value={role.count}
                    onChange={(e) =>
                      setRoles((prev) =>
                        prev.map((r, i) =>
                          i === index ? { ...r, count: Number(e.target.value) || 1 } : r
                        )
                      )
                    }
                    className={styles.dynamicRowScore}
                  />
                  <button
                    type="button"
                    className={styles.btnRemoveRow}
                    onClick={() => setRoles((prev) => prev.filter((_, i) => i !== index))}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.dynamicSection}>
          <div className={styles.dynamicSectionHeader}>
            <span className={styles.dynamicSectionLabel}>Milestones</span>
            <button
              type="button"
              className={styles.btnAddRow}
              onClick={() =>
                setMilestones((prev) => [
                  ...prev,
                  { title: '', description: '', order: prev.length + 1, dueAt: '', isFinal: false },
                ])
              }
            >
              + Add milestone
            </button>
          </div>
          {milestones.map((m, index) => (
            <div key={index} className={styles.formSection}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  value={m.title}
                  onChange={(e) =>
                    setMilestones((prev) =>
                      prev.map((ms, i) => (i === index ? { ...ms, title: e.target.value } : ms))
                    )
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  rows={2}
                  value={m.description}
                  onChange={(e) =>
                    setMilestones((prev) =>
                      prev.map((ms, i) =>
                        i === index ? { ...ms, description: e.target.value } : ms
                      )
                    )
                  }
                />
              </div>
              <div className={styles.formGroup}>
                <label>Due date</label>
                <input
                  type="datetime-local"
                  value={m.dueAt}
                  onChange={(e) =>
                    setMilestones((prev) =>
                      prev.map((ms, i) => (i === index ? { ...ms, dueAt: e.target.value } : ms))
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>

        {submitError && <p className={styles.errorText}>{submitError}</p>}

        <div className={styles.formActions}>
          <button type="submit" className={styles.btnPrimary} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
          <Link href={`/instructor/courses/${courseId}/templates`} className={styles.backLink}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
