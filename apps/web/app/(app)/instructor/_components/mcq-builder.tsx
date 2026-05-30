'use client';

import { useCallback, useMemo } from 'react';
import type { McqAssignmentConfigInput } from '@nibras/contracts';
import styles from '../instructor.module.css';

type McqConfigInput = McqAssignmentConfigInput;

type McqQuestion = McqConfigInput['questions'][number];
type McqOption = McqQuestion['options'][number];

function nextId(prefix: string, existing: string[]): string {
  let index = existing.length + 1;
  let candidate = `${prefix}${index}`;
  while (existing.includes(candidate)) {
    index += 1;
    candidate = `${prefix}${index}`;
  }
  return candidate;
}

const DEFAULT_CONFIG: McqConfigInput = {
  questions: [
    {
      id: 'q1',
      prompt: 'Sample question?',
      options: [
        { id: 'a', text: 'Option A' },
        { id: 'b', text: 'Option B' },
      ],
      correctOptionId: 'a',
    },
  ],
};

type Props = {
  value: McqConfigInput;
  onChange: (value: McqConfigInput) => void;
};

export function createDefaultMcqConfig(): McqConfigInput {
  return structuredClone(DEFAULT_CONFIG);
}

export default function McqBuilder({ value, onChange }: Props) {
  const questions = value.questions;

  const updateQuestion = useCallback(
    (index: number, patch: Partial<McqQuestion>) => {
      const next = questions.map((question, i) =>
        i === index ? { ...question, ...patch } : question
      );
      onChange({ questions: next });
    },
    [onChange, questions]
  );

  const updateOption = useCallback(
    (questionIndex: number, optionIndex: number, patch: Partial<McqOption>) => {
      const question = questions[questionIndex];
      if (!question) return;
      const options = question.options.map((option, i) =>
        i === optionIndex ? { ...option, ...patch } : option
      );
      updateQuestion(questionIndex, { options });
    },
    [questions, updateQuestion]
  );

  const addQuestion = useCallback(() => {
    const ids = questions.map((q) => q.id);
    const id = nextId('q', ids);
    onChange({
      questions: [
        ...questions,
        {
          id,
          prompt: '',
          options: [
            { id: 'a', text: 'Option A' },
            { id: 'b', text: 'Option B' },
          ],
          correctOptionId: 'a',
        },
      ],
    });
  }, [onChange, questions]);

  const removeQuestion = useCallback(
    (index: number) => {
      if (questions.length <= 1) return;
      onChange({ questions: questions.filter((_, i) => i !== index) });
    },
    [onChange, questions]
  );

  const addOption = useCallback(
    (questionIndex: number) => {
      const question = questions[questionIndex];
      if (!question) return;
      const optionIds = question.options.map((option) => option.id);
      const id = nextId(String.fromCharCode(97 + question.options.length), optionIds);
      updateQuestion(questionIndex, {
        options: [...question.options, { id, text: `Option ${question.options.length + 1}` }],
      });
    },
    [questions, updateQuestion]
  );

  const removeOption = useCallback(
    (questionIndex: number, optionIndex: number) => {
      const question = questions[questionIndex];
      if (!question || question.options.length <= 2) return;
      const removed = question.options[optionIndex];
      const options = question.options.filter((_, i) => i !== optionIndex);
      const correctOptionId =
        question.correctOptionId === removed?.id
          ? (options[0]?.id ?? '')
          : question.correctOptionId;
      updateQuestion(questionIndex, { options, correctOptionId });
    },
    [questions, updateQuestion]
  );

  const validationMessage = useMemo(() => {
    for (const question of questions) {
      if (!question.prompt.trim()) return 'Each question needs a prompt.';
      if (!question.options.every((option) => option.text.trim())) {
        return 'Each option needs text.';
      }
      if (!question.options.some((option) => option.id === question.correctOptionId)) {
        return 'Select a correct answer for each question.';
      }
    }
    return null;
  }, [questions]);

  return (
    <div className={styles.mcqBuilder}>
      {questions.map((question, questionIndex) => (
        <div key={question.id} className={styles.mcqQuestionCard}>
          <div className={styles.mcqQuestionHeader}>
            <strong>Question {questionIndex + 1}</strong>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => removeQuestion(questionIndex)}
              disabled={questions.length <= 1}
            >
              Remove
            </button>
          </div>
          <input
            value={question.prompt}
            onChange={(e) => updateQuestion(questionIndex, { prompt: e.target.value })}
            placeholder="Question prompt"
            style={{
              padding: 8,
              borderRadius: 8,
              border: '1px solid var(--border)',
              width: '100%',
            }}
          />
          <div className={styles.mcqOptions}>
            {question.options.map((option, optionIndex) => (
              <label key={option.id} className={styles.mcqOptionRow}>
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correctOptionId === option.id}
                  onChange={() => updateQuestion(questionIndex, { correctOptionId: option.id })}
                />
                <input
                  value={option.text}
                  onChange={(e) =>
                    updateOption(questionIndex, optionIndex, { text: e.target.value })
                  }
                  placeholder={`Option ${optionIndex + 1}`}
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                  }}
                />
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => removeOption(questionIndex, optionIndex)}
                  disabled={question.options.length <= 2}
                  aria-label="Remove option"
                >
                  ×
                </button>
              </label>
            ))}
          </div>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={() => addOption(questionIndex)}
          >
            + Add option
          </button>
        </div>
      ))}

      <button type="button" className={styles.btnSecondary} onClick={addQuestion}>
        + Add question
      </button>

      {validationMessage && <p className={styles.muted}>{validationMessage}</p>}
    </div>
  );
}
