import { Queue } from 'bullmq';

const COMPETITIONS_QUEUE_NAME = 'nibras:competitions';

type RedisConnection = { host: string; port: number; password?: string };

function parseRedisUrl(url: string): RedisConnection {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port) || 6379,
    password: parsed.password || undefined,
  };
}

let _queue: Queue | null = null;

function getQueue(): Queue | null {
  if (!process.env.REDIS_URL) return null;
  if (!_queue) {
    _queue = new Queue(COMPETITIONS_QUEUE_NAME, {
      connection: parseRedisUrl(process.env.REDIS_URL),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    });
    _queue.on('error', (err) => {
      console.error(
        JSON.stringify({ level: 'error', msg: 'Competitions queue error', error: err.message })
      );
    });
  }
  return _queue;
}

export type CompetitionsJobPayload =
  | { type: 'contest-sync' }
  | { type: 'problem-sync' }
  | { type: 'account-verify'; userId: string; platform: string; handle: string }
  | { type: 'account-stats-sync' }
  | { type: 'ranking-calc' }
  | { type: 'contest-reminder' };

export async function enqueueCompetitionsJob(data: CompetitionsJobPayload): Promise<void> {
  const queue = getQueue();
  if (!queue) return;
  try {
    await queue.add(data.type, data);
  } catch {
    // Redis unavailable — job will run on next scheduled tick
  }
}

export async function closeCompetitionsQueue(): Promise<void> {
  if (_queue) {
    await _queue.close();
    _queue = null;
  }
}
