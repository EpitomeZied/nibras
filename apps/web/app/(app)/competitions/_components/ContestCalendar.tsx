'use client';

import { Fragment, useMemo } from 'react';
import styles from './ContestCalendar.module.css';
import type { CalendarView } from './CalendarViewToggle';
import type { Contest } from '../../../lib/services/competitions';
import { googleCalendarUrl } from '../../../lib/google-calendar';
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

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

    // Previous month overflow
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, -i);
      result.push({ date: d, key: dateKey(d), outside: true });
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      result.push({ date: d, key: dateKey(d), outside: false });
    }

    // Next month overflow to fill grid
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
                    title={`${c.name} — ${formatTime(c.startsAt)}`}
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

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={styles.weekGrid}>
      <div className={styles.weekCorner} />
      {weekDays.map((wd) => (
        <div key={wd.key} className={styles.weekHeaderCell}>
          {WEEKDAYS[wd.date.getDay()]} <strong>{wd.date.getDate()}</strong>
        </div>
      ))}
      {hours.map((h) => (
        <Fragment key={h}>
          <div className={styles.weekTimeLabel}>
            {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
          </div>
          {weekDays.map((wd) => {
            const dayContests = (contests[wd.key] ?? []).filter((c) => {
              const hour = new Date(c.startsAt).getHours();
              return hour === h;
            });
            return (
              <div key={`${wd.key}-${h}`} className={styles.weekSlot}>
                {dayContests.map((c) => (
                  <a
                    key={c.id}
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.contestChip} ${chipClass(c.host)}`}
                    title={c.name}
                  >
                    {c.name}
                  </a>
                ))}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function DayView({
  focusDate,
  contests,
}: {
  focusDate: Date;
  contests: Record<string, Contest[]>;
}) {
  const current = focusDate;
  const key = dateKey(current);
  const dayContests = contests[key] ?? [];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className={styles.dayGrid}>
      {hours.map((h) => {
        const hourContests = dayContests.filter((c) => new Date(c.startsAt).getHours() === h);
        return (
          <Fragment key={h}>
            <div className={styles.dayTimeLabel}>
              {h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}
            </div>
            <div className={styles.daySlot}>
              {hourContests.map((c) => (
                <a
                  key={c.id}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.contestChip} ${chipClass(c.host)}`}
                  title={`${c.name} — ${c.durationMinutes} min`}
                >
                  {formatTime(c.startsAt)} {c.name}
                </a>
              ))}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
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
