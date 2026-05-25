'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import EmptyState from '../../_components/widgets/EmptyState';
import Skeleton from '../../_components/widgets/Skeleton';
import {
  createTag,
  deleteTag,
  listTagsAdmin,
  updateTag,
  type AdminCommunityTag,
} from '../../../lib/services/community';
import { friendlyMessage } from '../../../lib/api-clients/errors';
import { useSession } from '../../_components/session-context';

export default function TagsAdminPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const isAdmin = user?.systemRole === 'admin';
  const [tags, setTags] = useState<AdminCommunityTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addName, setAddName] = useState('');
  const [addDesc, setAddDesc] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listTagsAdmin();
      setTags(result);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!isAdmin) {
      router.replace('/community');
      return;
    }
    void load();
  }, [sessionLoading, isAdmin, load, router]);

  if (sessionLoading || !isAdmin) {
    return null;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = addName.trim();
    if (!name) return;
    setAdding(true);
    setAddError(null);
    try {
      const created = await createTag({ name, description: addDesc.trim() || undefined });
      setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setAddName('');
      setAddDesc('');
    } catch (err) {
      setAddError(friendlyMessage(err));
    } finally {
      setAdding(false);
    }
  }

  function startEdit(tag: AdminCommunityTag) {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditDesc(tag.description ?? '');
    setEditError(null);
  }

  async function handleSave() {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    setSaving(true);
    setEditError(null);
    try {
      const updated = await updateTag(editingId, {
        name,
        description: editDesc.trim() || undefined,
      });
      setTags((prev) => prev.map((t) => (t.id === editingId ? updated : t)));
      setEditingId(null);
    } catch (err) {
      setEditError(friendlyMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteTag(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Manage Tags</h1>
        <p className={styles.subtitle}>Create, edit, or remove community tags.</p>
      </header>

      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          className={styles.input}
          placeholder="Tag name"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          required
        />
        <input
          className={styles.input}
          placeholder="Description (optional)"
          value={addDesc}
          onChange={(e) => setAddDesc(e.target.value)}
        />
        <button type="submit" className={styles.addBtn} disabled={adding || !addName.trim()}>
          {adding ? 'Adding…' : 'Add tag'}
        </button>
        {addError && <p className={styles.error}>{addError}</p>}
      </form>

      {loading ? (
        <Skeleton variant="card" height={48} count={5} />
      ) : error ? (
        <EmptyState
          title="Could not load tags"
          description={error}
          tone="error"
          action={{ label: 'Retry', onClick: () => void load() }}
        />
      ) : tags.length === 0 ? (
        <EmptyState title="No tags yet" description="Create the first tag above." />
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Name</span>
            <span>Description</span>
            <span>Usage</span>
            <span>Actions</span>
          </div>
          {tags.map((tag) => (
            <div key={tag.id} className={styles.tableRow}>
              {editingId === tag.id ? (
                <>
                  <input
                    className={styles.input}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <input
                    className={styles.input}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Description"
                  />
                  <span className={styles.usage}>{tag.usageCount}</span>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={() => void handleSave()}
                      disabled={saving || !editName.trim()}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => setEditingId(null)}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    {editError && <p className={styles.error}>{editError}</p>}
                  </div>
                </>
              ) : (
                <>
                  <span className={styles.tagName}>{tag.name}</span>
                  <span className={styles.tagDesc}>{tag.description || '—'}</span>
                  <span className={styles.usage}>{tag.usageCount}</span>
                  <div className={styles.actions}>
                    <button type="button" className={styles.editBtn} onClick={() => startEdit(tag)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={() => void handleDelete(tag.id)}
                      disabled={deletingId === tag.id}
                    >
                      {deletingId === tag.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
