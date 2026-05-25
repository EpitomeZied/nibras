'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { DateRangeFilters } from '../services/analytics';

export type AnalyticsRangeValue = '7d' | '30d' | '90d' | 'term' | 'custom';

const STORAGE_KEY = 'nibras.analytics.range';

type AnalyticsRangeContextValue = {
  range: AnalyticsRangeValue;
  setRange: (value: AnalyticsRangeValue) => void;
  fromDate: string;
  toDate: string;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
  filters: DateRangeFilters;
  rangeReady: boolean;
  chartPointCount: number;
};

const AnalyticsRangeContext = createContext<AnalyticsRangeContextValue | null>(null);

function parseStoredRange(value: string | null): AnalyticsRangeValue | null {
  if (value === '7d' || value === '30d' || value === '90d' || value === 'term') {
    return value;
  }
  return null;
}

function chartPointsForRange(range: AnalyticsRangeValue, fromDate: string, toDate: string): number {
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  if (range === '90d' || range === 'term') return 90;
  if (!fromDate || !toDate) return 30;
  const start = new Date(fromDate);
  const end = new Date(toDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 30;
  const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  return Math.min(90, Math.max(1, days));
}

export function AnalyticsRangeProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [range, setRangeState] = useState<AnalyticsRangeValue>('30d');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  useEffect(() => {
    const urlRange = searchParams.get('range');
    const parsed =
      parseStoredRange(urlRange) ?? parseStoredRange(localStorage.getItem(STORAGE_KEY));
    if (parsed) setRangeState(parsed);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (urlRange === 'custom' && from && to) {
      setRangeState('custom');
      setFromDate(from);
      setToDate(to);
    }
  }, [searchParams]);

  const setRange = useCallback(
    (value: AnalyticsRangeValue) => {
      setRangeState(value);
      if (typeof window !== 'undefined' && value !== 'custom') {
        localStorage.setItem(STORAGE_KEY, value);
      }
      if (!pathname) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('range', value);
      if (value !== 'custom') {
        params.delete('from');
        params.delete('to');
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const syncCustomToUrl = useCallback(
    (from: string, to: string) => {
      if (!pathname || !from || !to) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set('range', 'custom');
      params.set('from', from);
      params.set('to', to);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setFromDateWrapped = useCallback(
    (value: string) => {
      setFromDate(value);
      if (range === 'custom' && value && toDate) syncCustomToUrl(value, toDate);
    },
    [range, toDate, syncCustomToUrl]
  );

  const setToDateWrapped = useCallback(
    (value: string) => {
      setToDate(value);
      if (range === 'custom' && fromDate && value) syncCustomToUrl(fromDate, value);
    },
    [fromDate, range, syncCustomToUrl]
  );

  const rangeReady = range !== 'custom' || Boolean(fromDate && toDate);

  const filters = useMemo((): DateRangeFilters => {
    if (!rangeReady) return {};
    if (range === 'custom') {
      return { from: fromDate, to: toDate };
    }
    if (range === 'term') {
      return { range: 'term' };
    }
    return { range };
  }, [range, fromDate, toDate, rangeReady]);

  const chartPointCount = chartPointsForRange(range, fromDate, toDate);

  const value = useMemo(
    () => ({
      range,
      setRange,
      fromDate,
      toDate,
      setFromDate: setFromDateWrapped,
      setToDate: setToDateWrapped,
      filters,
      rangeReady,
      chartPointCount,
    }),
    [
      range,
      setRange,
      fromDate,
      toDate,
      setFromDateWrapped,
      setToDateWrapped,
      filters,
      rangeReady,
      chartPointCount,
    ]
  );

  return <AnalyticsRangeContext.Provider value={value}>{children}</AnalyticsRangeContext.Provider>;
}

export function useAnalyticsRange(): AnalyticsRangeContextValue {
  const ctx = useContext(AnalyticsRangeContext);
  if (!ctx) {
    throw new Error('useAnalyticsRange must be used within AnalyticsRangeProvider');
  }
  return ctx;
}
