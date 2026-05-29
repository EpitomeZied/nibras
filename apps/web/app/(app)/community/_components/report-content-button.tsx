'use client';

import { useState } from 'react';
import { createReport, type CommunityReportTarget } from '../../../lib/services/community';
import { friendlyMessage } from '../../../lib/api-clients/errors';

type Props = {
  targetType: CommunityReportTarget;
  targetId: string;
  className?: string;
};

export default function ReportContentButton({ targetType, targetId, className }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await createReport({
        targetType,
        targetId,
        reason: trimmed,
        details: details.trim() || undefined,
      });
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          setOpen(true);
          setDone(false);
          setError(null);
        }}
      >
        Report
      </button>
      {done && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Report submitted</span>}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Report content"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'var(--surface)',
              borderRadius: 12,
              padding: 20,
              width: '100%',
              maxWidth: 420,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16 }}>Report content</h2>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              Reason
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                maxLength={500}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              Details (optional)
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={2000}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)' }}
              />
            </label>
            {error && <p style={{ color: 'var(--danger)', fontSize: 12, margin: 0 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" disabled={submitting || !reason.trim()}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
