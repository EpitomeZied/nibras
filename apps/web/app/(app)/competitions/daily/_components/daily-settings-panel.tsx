'use client';

import { useCallback, useEffect, useState } from 'react';
import type { DailyConfigResponse } from '@nibras/contracts';
import { friendlyMessage } from '../../../../lib/api-clients/errors';
import {
  DIFFICULTY_TIERS,
  getDailyTags,
  patchDailyConfig,
  prefFromTiers,
  tiersFromPref,
} from '../../../../lib/services/daily-problem';
import styles from '../page.module.css';

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
];

type DailySettingsPanelProps = {
  config: DailyConfigResponse | null;
  paused: boolean;
  pausedUntil?: string;
  pauseDays: number;
  acting: boolean;
  onPauseDaysChange: (days: number) => void;
  onPause: () => void;
  onResume: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onConfigSaved: () => void;
  onError: (message: string) => void;
};

export default function DailySettingsPanel({
  config,
  paused,
  pausedUntil,
  pauseDays,
  acting,
  onPauseDaysChange,
  onPause,
  onResume,
  onToggleEnabled,
  onConfigSaved,
  onError,
}: DailySettingsPanelProps) {
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<Array<'easy' | 'medium' | 'hard'>>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [timezone, setTimezone] = useState('UTC');
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!config) return;
    setSelectedTiers(tiersFromPref(config.difficultyPref));
    setSelectedTags(config.tagPrefs);
    setTimezone(config.timezone);
  }, [config]);

  useEffect(() => {
    getDailyTags()
      .then((res) => setAvailableTags(res.tags))
      .catch(() => {
        /* optional */
      });
  }, []);

  const detectedTz =
    typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  const savePreferences = useCallback(async () => {
    setSavingPrefs(true);
    try {
      await patchDailyConfig({
        difficultyPref: prefFromTiers(selectedTiers),
        tagPrefs: selectedTags,
        timezone,
      });
      onConfigSaved();
    } catch (err) {
      onError(friendlyMessage(err));
    } finally {
      setSavingPrefs(false);
    }
  }, [onConfigSaved, onError, selectedTags, selectedTiers, timezone]);

  const toggleTier = (tier: 'easy' | 'medium' | 'hard') => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className={styles.settingsForm}>
      <div className={styles.toggleRow}>
        <span className={styles.fieldLabel}>Daily Problems</span>
        <button
          type="button"
          className={styles.btnSmall}
          onClick={() => onToggleEnabled(!config?.enabled)}
          disabled={acting}
        >
          {config?.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Timezone</span>
        <div className={styles.timezoneRow}>
          <select
            className={styles.fieldInput}
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {[...new Set([detectedTz, ...COMMON_TIMEZONES, timezone])].map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <button type="button" className={styles.btnSmall} onClick={() => setTimezone(detectedTz)}>
            Use device
          </button>
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Difficulty</span>
        <div className={styles.chipRow}>
          {DIFFICULTY_TIERS.map((tier) => (
            <button
              key={tier.id}
              type="button"
              className={`${styles.chipBtn} ${selectedTiers.includes(tier.id) ? styles.chipBtnActive : ''}`}
              onClick={() => toggleTier(tier.id)}
            >
              {tier.label}
            </button>
          ))}
          {selectedTiers.length === 0 ? (
            <span className={styles.fieldHint}>All difficulties</span>
          ) : null}
        </div>
      </div>

      {availableTags.length > 0 ? (
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Preferred tags</span>
          <div className={styles.chipRow}>
            {availableTags.slice(0, 24).map((tag) => (
              <button
                key={tag}
                type="button"
                className={`${styles.chipBtn} ${selectedTags.includes(tag) ? styles.chipBtnActive : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className={styles.btnSavePrefs}
        onClick={() => void savePreferences()}
        disabled={savingPrefs || acting}
      >
        {savingPrefs ? 'Saving…' : 'Save preferences'}
      </button>

      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Vacation Mode</span>
        {paused ? (
          <div>
            <span className={styles.fieldHint}>
              Paused until {pausedUntil ? new Date(pausedUntil).toLocaleDateString() : '—'}
            </span>
            <button
              type="button"
              className={styles.btnSmall}
              onClick={onResume}
              disabled={acting}
              style={{ marginLeft: 8 }}
            >
              Resume
            </button>
          </div>
        ) : (
          <div className={styles.pauseActions}>
            <select
              className={styles.fieldInput}
              value={pauseDays}
              onChange={(e) => onPauseDaysChange(Number(e.target.value))}
            >
              {[1, 3, 7, 14, 30].map((d) => (
                <option key={d} value={d}>
                  {d} day{d > 1 ? 's' : ''}
                </option>
              ))}
            </select>
            <button type="button" className={styles.btnSmall} onClick={onPause} disabled={acting}>
              Pause
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
