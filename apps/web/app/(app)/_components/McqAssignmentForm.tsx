'use client';

import type { McqAssignmentConfig } from '@nibras/contracts';

type Props = {
  config: McqAssignmentConfig;
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
  disabled?: boolean;
};

export default function McqAssignmentForm({ config, answers, onChange, disabled }: Props) {
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {config.questions.map((q, qi) => (
        <fieldset
          key={q.id}
          disabled={disabled}
          style={{
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 14,
            margin: 0,
          }}
        >
          <legend style={{ fontWeight: 600, padding: '0 6px' }}>
            {qi + 1}. {q.prompt}
          </legend>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {q.options.map((opt) => (
              <label
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  cursor: disabled ? 'default' : 'pointer',
                }}
              >
                <input
                  type="radio"
                  name={`mcq-${q.id}`}
                  checked={answers[q.id] === opt.id}
                  onChange={() => onChange({ ...answers, [q.id]: opt.id })}
                />
                <span>{opt.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
