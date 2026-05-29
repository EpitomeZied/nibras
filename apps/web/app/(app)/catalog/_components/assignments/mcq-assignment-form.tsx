'use client';

import type { McqAssignmentConfig } from '@nibras/contracts';
import styles from './mcq-assignment-form.module.css';

type Props = {
  config: McqAssignmentConfig;
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
  disabled?: boolean;
};

export default function McqAssignmentForm({ config, answers, onChange, disabled }: Props) {
  return (
    <div className={styles.form}>
      {config.questions.map((q, qi) => (
        <fieldset key={q.id} disabled={disabled} className={styles.question}>
          <legend className={styles.legend}>
            {qi + 1}. {q.prompt}
          </legend>
          <div className={styles.options}>
            {q.options.map((opt) => (
              <label key={opt.id} className={styles.option}>
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
