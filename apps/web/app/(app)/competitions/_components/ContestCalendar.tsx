'use client';

import { useMemo } from 'react';
import styles from './ContestCalendar.module.css';
import type { CalendarView } from './CalendarViewToggle';
import type { Contest } from '../../../lib/services/competitions';
import { formatContestDuration } from '../../../lib/contest-duration';
import { googleCalendarUrl } from '../../../lib/google-calendar';
import {
  contestBlockStyle,
  HOURS_IN_DAY,
  PX_PER_HOUR,
  TIME_GRID_HEIGHT_PX,
} from './contest-calendar-layout';
import { isoWeekNumber, startOfWeek } from './calendar-date-utils';

type Props = {
  view: CalendarView;
  year: number;
  month: number;
  focusDate: Date;
  contests: Record<string, Contest[]>;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function chipClass(host: string): string {
  switch (host) {
    case 'codeforces':
      return styles.chipCf;
    case 'leetcode':
      return styles.chipLc;
    case 'atcoder':
      return styles.chipAc;
    case 'codechef':
      return styles.chipCc;
    case 'ctftime':
      return styles.chipCtf;
    default:
      return styles.chipDefault;
  }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatHourLabel(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ContestBlock({ contest }: { contest: Contest }) {
  const layout = contestBlockStyle(contest);
  return (
    <a
      href={contest.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.contestBlock} ${chipClass(contest.host)}`}
      style={{ top: layout.top, height: layout.height }}
      title={`${contest.name} — ${formatContestDuration(contest)}`}
    >
      <span className={styles.contestBlockTime}>{formatTime(contest.startsAt)}</span>
      <span className={styles.contestBlockName}>{contest.name}</span>
    </a>
  );
}

function TimeGridBody({
  days,
  contests,
  showHeader,
}: {
  days: Array<{ date: Date; key: string }>;
  contests: Record<string, Contest[]>;
  showHeader: boolean;
}) {
  const hours = useMemo(() => Array.from({ length: HOURS_IN_DAY }, (_, i) => i), []);
  const columnTemplate = `56px repeat(${days.length}, minmax(0, 1fr))`;

  return (
    <div className={styles.timeGridScroll}>
      {showHeader && (
        <div className={styles.timeGridHeader} style={{ gridTemplateColumns: columnTemplate }}>
          <div className={styles.weekCorner} />
          {days.map((wd) => (
            <div key={wd.key} className={styles.weekHeaderCell}>
              {WEEKDAYS[wd.date.getDay()]} <strong>{wd.date.getDate()}</strong>
            </div>
          ))}
        </div>
      )}
      <div className={styles.timeGridWrapper} style={{ gridTemplateColumns: columnTemplate }}>
        <div className={styles.timeLabelsColumn}>
          {hours.map((h) => (
            <div key={h} className={styles.timeLabelRow} style={{ height: PX_PER_HOUR }}>
              {formatHourLabel(h)}
            </div>
          ))}
        </div>
        {days.map((day) => (
          <div key={day.key} className={styles.dayColumn} style={{ height: TIME_GRID_HEIGHT_PX }}>
            {hours.map((h) => (
              <div
                key={h}
                className={styles.hourRow}
                style={{ top: h * PX_PER_HOUR, height: PX_PER_HOUR }}
                aria-hidden="true"
              />
            ))}
            {(contests[day.key] ?? []).map((c) => (
              <ContestBlock key={c.id} contest={c} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MonthView({
  year,
  month,
  contests,
}: {
  year: number;
  month: number;
  contests: Record<string, Contest[]>;
}) {
  const today = new Date();
  const todayKey = dateKey(today);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const result: Array<{ date: Date; key: string; outside: boolean }> = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, -i);
      result.push({ date: d, key: dateKey(d), outside: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      result.push({ date: d, key: dateKey(d), outside: false });
    }

    const remaining = 7 - (result.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month, i);
        result.push({ date: d, key: dateKey(d), outside: true });
      }
    }

    return result;
  }, [year, month]);

  return (
    <>
      <div className={styles.weekdayHeader}>
        {WEEKDAYS.map((wd) => (
          <div key={wd} className={styles.weekdayCell}>
            {wd}
          </div>
        ))}
      </div>
      <div className={styles.monthGrid}>
        {cells.map((cell) => {
          const dayContests = contests[cell.key] ?? [];
          const isToday = cell.key === todayKey;
          const cellClass = [
            styles.dayCell,
            cell.outside ? styles.dayCellOutside : '',
            isToday ? styles.dayCellToday : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={cell.key} className={cellClass}>
              <span className={isToday ? styles.dayNumberToday : styles.dayNumber}>
                {cell.date.getDate()}
              </span>
              {dayContests.slice(0, 3).map((c) => (
                <div key={c.id} className={styles.chipRow}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.contestChip} ${chipClass(c.host)}`}
                    title={`${c.name} — ${formatContestDuration(c)}`}
                  >
                    {c.name}
                  </a>
                  <a
                    href={googleCalendarUrl({
                      name: c.name,
                      startsAt: c.startsAt,
                      endsAt: c.endsAt,
                      url: c.url,
                      host: c.host,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.calLink}
                    title="Add to Google Calendar"
                    aria-label={`Add ${c.name} to Google Calendar`}
                  >
                    +
                  </a>
                </div>
              ))}
              {dayContests.length > 3 && (
                <span className={styles.moreLink}>+{dayContests.length - 3} more</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function WeekView({
  focusDate,
  contests,
}: {
  focusDate: Date;
  contests: Record<string, Contest[]>;
}) {
  const weekStart = useMemo(() => startOfWeek(focusDate), [focusDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return { date: d, key: dateKey(d) };
    });
  }, [weekStart]);

  return <TimeGridBody days={weekDays} contests={contests} showHeader />;
}

function DayView({
  focusDate,
  contests,
}: {
  focusDate: Date;
  contests: Record<string, Contest[]>;
}) {
  const key = dateKey(focusDate);
  return <TimeGridBody days={[{ date: focusDate, key }]} contests={contests} showHeader={false} />;
}

export default function ContestCalendar({
  view,
  year,
  month,
  focusDate,
  contests,
  onPrev,
  onNext,
  onToday,
}: Props) {
  const weekNum = isoWeekNumber(focusDate);
  const dayNum = focusDate.getDate();
  const title =
    view === 'month'
      ? `${MONTH_NAMES[month - 1]} ${year}`
      : view === 'week'
        ? `${MONTH_NAMES[focusDate.getMonth()]} ${focusDate.getFullYear()} — Week ${weekNum}`
        : `${MONTH_NAMES[focusDate.getMonth()]} ${dayNum}, ${focusDate.getFullYear()} — Day ${dayNum}`;

  return (
    <div className={styles.calendar}>
      <div className={styles.nav}>
        <div className={styles.navBtns}>
          <button type="button" className={styles.navBtn} onClick={onPrev} aria-label="Previous">
            &larr;
          </button>
          <button type="button" className={styles.todayBtn} onClick={onToday}>
            Today
          </button>
          <button type="button" className={styles.navBtn} onClick={onNext} aria-label="Next">
            &rarr;
          </button>
        </div>
        <h2 className={styles.navTitle}>{title}</h2>
      </div>
      {view === 'month' && <MonthView year={year} month={month} contests={contests} />}
      {view === 'week' && <WeekView focusDate={focusDate} contests={contests} />}
      {view === 'day' && <DayView focusDate={focusDate} contests={contests} />}
    </div>
  );
}
