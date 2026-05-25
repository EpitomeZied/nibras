'use client';

import { useState } from 'react';
import { apiFetch } from '../../../lib/session';
import SelectField from '../../_components/ui/select-field';
import s from './apply-modal.module.css';

type Role = {
  id: string;
  key: string;
  label: string;
  count: number;
};

type Props = {
  projectId: string;
  templateTitle: string;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
};

type Preference = {
  rank: number;
  templateRoleId: string;
};

const STEPS = [
  { number: 1, label: 'Role Preferences' },
  { number: 2, label: 'About You' },
  { number: 3, label: 'Review & Submit' },
];

export default function ApplyModal({ projectId, templateTitle, roles, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1);
  const [statement, setStatement] = useState('');
  const [availabilityNote, setAvailabilityNote] = useState('');
  const [preferences, setPreferences] = useState<Preference[]>(
    roles.map((role, index) => ({ rank: index + 1, templateRoleId: role.id }))
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updatePreference(rank: number, templateRoleId: string) {
    setPreferences((prev) => {
      const next = prev.filter((p) => p.rank !== rank);
      next.push({ rank, templateRoleId });
      return next.sort((a, b) => a.rank - b.rank);
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch(`/v1/tracking/projects/${projectId}/applications`, {
        auth: true,
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          statement: statement.trim(),
          availabilityNote: availabilityNote.trim(),
          preferences: preferences.filter((p) => p.templateRoleId).sort((a, b) => a.rank - b.rank),
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Failed to submit application (${res.status})`);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const sortedPrefs = preferences.filter((p) => p.templateRoleId).sort((a, b) => a.rank - b.rank);

  return (
    <div
      className={s.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={s.modal} role="dialog" aria-modal="true" aria-labelledby="apply-modal-title">
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerText}>
            <h2 id="apply-modal-title" className={s.title}>
              Apply for Roles
            </h2>
            <p className={s.subtitle}>{templateTitle}</p>
          </div>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div className={s.stepper}>
          {STEPS.map((st, i) => (
            <div key={st.number} className={s.stepItem}>
              <div
                className={[
                  s.stepCircle,
                  step === st.number
                    ? s.stepCircleActive
                    : step > st.number
                      ? s.stepCircleDone
                      : s.stepCircleIdle,
                ].join(' ')}
              >
                {step > st.number ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  st.number
                )}
              </div>
              <span
                className={[
                  s.stepLabel,
                  step === st.number ? s.stepLabelActive : s.stepLabelIdle,
                ].join(' ')}
              >
                {st.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={[s.stepLine, step > st.number ? s.stepLineDone : ''].join(' ')} />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Role Preferences ── */}
        {step === 1 && (
          <div className={s.stepBody}>
            <p className={s.stepHint}>
              Rank the roles you want most. Choice 1 is your top pick — instructors use this to
              build balanced teams.
            </p>
            <div className={s.prefList}>
              {roles.map((_, index) => (
                <div key={index} className={s.prefRow}>
                  <span className={s.prefRank}>Choice {index + 1}</span>
                  <SelectField
                    selectClassName={s.prefSelect}
                    value={preferences.find((p) => p.rank === index + 1)?.templateRoleId ?? ''}
                    onChange={(value) => updatePreference(index + 1, value)}
                    options={[
                      { value: '', label: 'Select a role', disabled: true },
                      ...roles.map((role) => ({
                        value: role.id,
                        label: `${role.label} (${role.count} spot${role.count !== 1 ? 's' : ''})`,
                      })),
                    ]}
                    aria-label={`Role preference ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            <p className={s.prefHint}>
              Preferences guide team generation — required role slots are filled first.
            </p>
          </div>
        )}

        {/* ── Step 2: Statement + Availability ── */}
        {step === 2 && (
          <div className={s.stepBody}>
            <div className={s.field}>
              <label htmlFor="apply-statement" className={s.label}>
                Motivation / skills <span className={s.optional}>(optional)</span>
              </label>
              <textarea
                id="apply-statement"
                className={s.textarea}
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                maxLength={1000}
                placeholder="Briefly describe what you can contribute to the team."
              />
              <p className={s.charCount}>{statement.length} / 1000</p>
            </div>
            <div className={s.field}>
              <label htmlFor="apply-availability" className={s.label}>
                Availability note <span className={s.optional}>(optional)</span>
              </label>
              <textarea
                id="apply-availability"
                className={s.textarea}
                value={availabilityNote}
                onChange={(e) => setAvailabilityNote(e.target.value)}
                maxLength={500}
                placeholder="Any scheduling constraints or collaboration preferences."
                style={{ minHeight: 72 }}
              />
              <p className={s.charCount}>{availabilityNote.length} / 500</p>
            </div>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 3 && (
          <div className={s.stepBody}>
            <div className={s.reviewSection}>
              <p className={s.reviewSectionLabel}>Your role preferences</p>
              {sortedPrefs.length === 0 ? (
                <p className={s.reviewEmpty}>No preferences selected.</p>
              ) : (
                <div className={s.reviewPrefList}>
                  {sortedPrefs.map((pref) => {
                    const role = roles.find((r) => r.id === pref.templateRoleId);
                    return (
                      <div key={pref.rank} className={s.reviewPrefRow}>
                        <span className={s.reviewPrefRank}>#{pref.rank}</span>
                        <span className={s.reviewPrefRole}>
                          {role?.label ?? pref.templateRoleId}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {statement.trim() && (
              <div className={s.reviewSection}>
                <p className={s.reviewSectionLabel}>Motivation / skills</p>
                <p className={s.reviewText}>{statement.trim()}</p>
              </div>
            )}

            {availabilityNote.trim() && (
              <div className={s.reviewSection}>
                <p className={s.reviewSectionLabel}>Availability note</p>
                <p className={s.reviewText}>{availabilityNote.trim()}</p>
              </div>
            )}

            <div className={s.reviewNote}>
              Once submitted you cannot edit your application. Instructors will review all
              applications before forming teams.
            </div>

            {error && <p className={s.errorMsg}>{error}</p>}
          </div>
        )}

        {/* Actions */}
        <div className={s.actions}>
          {step > 1 ? (
            <button
              type="button"
              className={s.backBtn}
              onClick={() => {
                setError('');
                setStep((s) => s - 1);
              }}
              disabled={submitting}
            >
              ← Back
            </button>
          ) : (
            <button type="button" className={s.cancelBtn} onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          )}

          {step < 3 ? (
            <button type="button" className={s.nextBtn} onClick={() => setStep((s) => s + 1)}>
              Next →
            </button>
          ) : (
            <button
              type="button"
              className={s.submitBtn}
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
