import { apiRequest } from '@nibras/core';
import picocolors from 'picocolors';
import { emitJson, unwrapList } from '../util/output';

type SubmissionSummary = {
  id: string;
  projectKey: string;
  status: string;
  summary: string;
  createdAt: string;
  submittedAt: string | null;
  milestoneId?: string | null;
};

type SubmissionDetail = {
  submissionId: string;
  projectKey: string;
  status: string;
  summary: string;
  commitSha: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_COLORS: Record<string, (s: string) => string> = {
  passed: picocolors.green,
  failed: picocolors.red,
  needs_review: picocolors.yellow,
  queued: picocolors.dim,
  running: picocolors.cyan,
  cancelled: picocolors.dim,
};

const STATUS_LABELS: Record<string, string> = {
  passed: 'passed',
  failed: 'failed',
  needs_review: 'under review',
  queued: 'queued',
  running: 'running',
  cancelled: 'cancelled',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncateSummary(summary: string, max = 36): string {
  const trimmed = summary.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

async function listSubmissions(json: boolean, plain: boolean): Promise<void> {
  const submissions = unwrapList<SubmissionSummary>(
    await apiRequest('/v1/me/submissions?limit=20'),
    'submissions'
  );

  if (json) {
    emitJson({ submissions });
    return;
  }

  if (submissions.length === 0) {
    console.log(plain ? 'No submissions found.' : '\n  ' + picocolors.dim('No submissions yet.') + '\n');
    return;
  }

  if (!plain) {
    console.log();
    console.log(
      '  ' +
        picocolors.dim('Project'.padEnd(28)) +
        picocolors.dim('Status'.padEnd(14)) +
        picocolors.dim('Summary'.padEnd(20)) +
        picocolors.dim('Date')
    );
    console.log('  ' + picocolors.dim('─'.repeat(72)));
  }

  for (const sub of submissions) {
    const statusLabel = STATUS_LABELS[sub.status] ?? sub.status;
    const colorFn = STATUS_COLORS[sub.status] ?? ((value: string) => value);
    const date = formatDate(sub.submittedAt ?? sub.createdAt);
    const summary = truncateSummary(sub.summary || '—');

    if (plain) {
      console.log(
        `${sub.projectKey.padEnd(30)} ${statusLabel.padEnd(14)} ${summary.padEnd(22)} ${date}`
      );
      continue;
    }

    const projectCol = picocolors.white(sub.projectKey.padEnd(28));
    const statusCol = colorFn(statusLabel.padEnd(14));
    const summaryCol = picocolors.dim(summary.padEnd(20));
    const dateCol = picocolors.dim(date);
    console.log(`  ${projectCol}${statusCol}${summaryCol}${dateCol}`);
  }

  if (!plain) {
    console.log('\n  ' + picocolors.dim('Tip: nibras status show <submissionId> for details.') + '\n');
  }
}

async function showSubmission(submissionId: string, json: boolean, plain: boolean): Promise<void> {
  const detail = (await apiRequest(
    `/v1/submissions/${encodeURIComponent(submissionId)}`
  )) as SubmissionDetail;

  if (json) {
    emitJson(detail);
    return;
  }

  const statusLabel = STATUS_LABELS[detail.status] ?? detail.status;
  const lines = [
    `Submission: ${detail.submissionId}`,
    `Project:    ${detail.projectKey}`,
    `Status:     ${statusLabel}`,
    `Commit:     ${detail.commitSha}`,
    `Summary:    ${detail.summary}`,
    `Created:    ${detail.createdAt}`,
    `Updated:    ${detail.updatedAt}`,
  ];

  if (plain) {
    console.log(lines.join('\n'));
    return;
  }

  console.log();
  for (const line of lines) {
    const [label, value] = line.split(':').map((part) => part.trim());
    console.log(`  ${picocolors.dim(label + ':')} ${value}`);
  }
  console.log();
}

function printStatusHelp(): void {
  console.log(`Usage:
  nibras status
  nibras status show <submissionId>

Flags:
  --json    Machine-readable output`);
}

export async function commandStatus(
  args: string[],
  plain: boolean,
  json: boolean
): Promise<void> {
  if (args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
    printStatusHelp();
    return;
  }

  if (args[0] === 'show') {
    const submissionId = args[1];
    if (!submissionId || submissionId.startsWith('-')) {
      throw new Error('Usage: nibras status show <submissionId>');
    }
    await showSubmission(submissionId, json, plain);
    return;
  }

  if (args.length > 0 && !args.every((arg) => arg === '--json' || arg === '--plain')) {
    throw new Error(`Unknown status arguments. Run \`nibras status --help\`.`);
  }

  await listSubmissions(json, plain);
}
