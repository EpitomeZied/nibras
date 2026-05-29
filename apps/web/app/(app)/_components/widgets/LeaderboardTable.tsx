'use client';

import Link from 'next/link';
import styles from './LeaderboardTable.module.css';
import UserAvatar from './UserAvatar';

export type LeaderboardRow = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  delta?: number;
  badges?: number;
  level?: number;
  meta?: string;
};

export type LeaderboardTableProps = {
  rows: LeaderboardRow[];
  highlightUserId?: string | null;
  scoreLabel?: string;
  showBadges?: boolean;
  showLevel?: boolean;
  showDelta?: boolean;
};

function formatDelta(delta?: number): string {
  if (delta === undefined || delta === null || delta === 0) return '–';
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function rankBadgeClass(rank: number): string {
  if (rank === 1) return styles.rankGold;
  if (rank === 2) return styles.rankSilver;
  if (rank === 3) return styles.rankBronze;
  return styles.rankPlain;
}

export default function LeaderboardTable({
  rows,
  highlightUserId = null,
  scoreLabel = 'Score',
  showBadges = false,
  showLevel = false,
  showDelta = true,
}: LeaderboardTableProps) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.rankCol}>#</th>
            <th>Member</th>
            {showLevel && <th className={styles.numericCol}>Level</th>}
            {showBadges && <th className={styles.numericCol}>Badges</th>}
            {showDelta && <th className={styles.numericCol}>Δ Week</th>}
            <th className={styles.numericCol}>{scoreLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isMe = row.userId === highlightUserId;
            return (
              <tr key={row.userId} className={isMe ? styles.me : undefined}>
                <td className={styles.rankCol}>
                  <span className={`${styles.rankBadge} ${rankBadgeClass(row.rank)}`}>
                    {row.rank}
                  </span>
                </td>
                <td>
                  <div className={styles.member}>
                    <UserAvatar name={row.username} size={28} url={row.avatarUrl} />
                    <div className={styles.memberText}>
                      <strong>
                        <Link href={`/users/${row.userId}`} className={styles.memberLink}>
                          {row.username}
                        </Link>
                      </strong>
                      {row.meta && <span className={styles.meta}>{row.meta}</span>}
                    </div>
                  </div>
                </td>
                {showLevel && <td className={styles.numericCol}>{row.level ?? '—'}</td>}
                {showBadges && <td className={styles.numericCol}>{row.badges ?? 0}</td>}
                {showDelta && (
                  <td className={styles.numericCol}>
                    <span
                      className={
                        (row.delta ?? 0) > 0
                          ? styles.deltaUp
                          : (row.delta ?? 0) < 0
                            ? styles.deltaDown
                            : styles.deltaFlat
                      }
                    >
                      {formatDelta(row.delta)}
                    </span>
                  </td>
                )}
                <td className={`${styles.numericCol} ${styles.score}`}>
                  {row.score.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
