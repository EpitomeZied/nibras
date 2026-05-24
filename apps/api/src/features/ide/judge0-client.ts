export type Judge0Language = {
  id: number;
  name: string;
};

export type Judge0SubmissionResult = {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  status: { id: number; description: string };
};

function judge0BaseUrl(): string {
  return (process.env.JUDGE0_API_URL || '').replace(/\/+$/, '');
}

export function isJudge0Configured(): boolean {
  return Boolean(judge0BaseUrl());
}

function judge0Headers(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = process.env.JUDGE0_AUTH_TOKEN;
  if (token) {
    headers['X-Auth-Token'] = token;
  }
  return headers;
}

async function judge0Fetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${judge0BaseUrl()}${path}`;
  const timeoutMs = Number.parseInt(process.env.JUDGE0_REQUEST_TIMEOUT_MS || '60000', 10);
  const headers = {
    ...judge0Headers(),
    ...(init?.headers as Record<string, string> | undefined),
  };
  return fetch(url, {
    ...init,
    headers,
    signal: init?.signal ?? AbortSignal.timeout(timeoutMs),
  });
}

export async function checkJudge0Reachable(): Promise<boolean> {
  if (!isJudge0Configured()) return false;
  try {
    const res = await judge0Fetch('/about', { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function listJudge0Languages(): Promise<Judge0Language[]> {
  const res = await judge0Fetch('/languages');
  if (!res.ok) {
    throw new Error(`Judge0 languages request failed with status ${res.status}`);
  }
  return (await res.json()) as Judge0Language[];
}

export async function runJudge0Submission(input: {
  sourceCode: string;
  languageId: number;
  stdin?: string;
}): Promise<Judge0SubmissionResult> {
  const cpuLimit = Number.parseFloat(process.env.JUDGE0_CPU_TIME_LIMIT || '5');
  const memoryLimit = Number.parseInt(process.env.JUDGE0_MEMORY_LIMIT || '128000', 10);

  const res = await judge0Fetch('/submissions?base64_encoded=false&wait=true', {
    method: 'POST',
    body: JSON.stringify({
      source_code: input.sourceCode,
      language_id: input.languageId,
      stdin: input.stdin,
      cpu_time_limit: cpuLimit,
      memory_limit: memoryLimit,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Judge0 run failed with status ${res.status}${detail ? `: ${detail}` : ''}`);
  }

  return (await res.json()) as Judge0SubmissionResult;
}

export function normalizeJudge0Result(result: Judge0SubmissionResult) {
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    compileOutput: result.compile_output,
    time: result.time,
    memory: result.memory,
    message: result.message,
  };
}
