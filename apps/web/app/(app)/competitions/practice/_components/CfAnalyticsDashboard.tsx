'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { CfAnalyticsPayload } from '../../../../lib/services/competitions';
import analyticsStyles from './CfAnalyticsDashboard.module.css';

function getRatingColor(rating: number): string {
  if (rating >= 3000) return '#aa0100';
  if (rating >= 2600) return '#ff3333';
  if (rating >= 2400) return '#ff7777';
  if (rating >= 2300) return '#ffbb55';
  if (rating >= 2100) return '#ffcc87';
  if (rating >= 1900) return '#ff88ff';
  if (rating >= 1600) return '#aaaaff';
  if (rating >= 1400) return '#76ddbb';
  if (rating >= 1200) return '#76ff77';
  return '#cccccc';
}

const ATTEMPT_LABELS: Record<string, string> = {
  try1: '1 try',
  try2: '2 tries',
  try3_5: '3–5 tries',
  tryMore: '> 5 tries',
};

function pieOption(title: string, dataObj: Record<string, number>) {
  const dataArr = Object.entries(dataObj)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (dataArr.length === 0) return null;

  return {
    title: { text: title, left: 'center', top: 8, textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: '2%',
      top: 48,
      bottom: 16,
      width: '42%',
      textStyle: { fontSize: 11 },
    },
    series: [
      {
        type: 'pie',
        radius: ['35%', '55%'],
        center: ['33%', '55%'],
        data: dataArr,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
      },
    ],
  };
}

type CfAnalyticsDashboardProps = {
  data: CfAnalyticsPayload;
  handle?: string | null;
};

export default function CfAnalyticsDashboard({ data, handle }: CfAnalyticsDashboardProps) {
  const timelineOption = useMemo(() => {
    const keys = Object.keys(data.timeline).sort();
    if (keys.length === 0) return null;
    return {
      title: { text: 'Activity timeline (monthly)', left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
      dataZoom: [{ type: 'inside' }, { start: 0, end: 100 }],
      xAxis: { type: 'category', boundaryGap: false, data: keys },
      yAxis: { type: 'value', name: 'Submissions' },
      series: [
        {
          name: 'Submissions',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.3, color: '#0073e6' },
          lineStyle: { color: '#0073e6' },
          itemStyle: { color: '#0073e6' },
          data: keys.map((k) => data.timeline[k]),
        },
      ],
    };
  }, [data.timeline]);

  const ratingOption = useMemo(() => {
    const keys = Object.keys(data.rating).sort((a, b) => Number(a) - Number(b));
    if (keys.length === 0) return null;
    return {
      title: { text: 'Problem ratings solved', left: 'center' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: keys },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          barWidth: '60%',
          data: keys.map((k) => ({
            value: data.rating[k],
            itemStyle: { color: getRatingColor(Number(k)) },
          })),
        },
      ],
    };
  }, [data.rating]);

  const attemptsData = useMemo(() => {
    const localized: Record<string, number> = {};
    for (const [key, value] of Object.entries(data.attempts)) {
      localized[ATTEMPT_LABELS[key] ?? key] = value;
    }
    return localized;
  }, [data.attempts]);

  const performanceOption = useMemo(() => {
    if (data.performance.length === 0) return null;
    return {
      title: { text: 'Execution time vs rating', left: 'center', textStyle: { fontSize: 14 } },
      grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
      tooltip: {
        formatter: (param: { data: [number, number, string] }) => {
          const d = param.data;
          return `<b>${d[2]}</b><br/>Time: ${d[0]} ms<br/>Rating: ${d[1]}`;
        },
      },
      xAxis: { type: 'value', name: 'Time (ms)' },
      yAxis: { type: 'value', name: 'Rating' },
      series: [
        {
          type: 'scatter',
          symbolSize: 6,
          data: data.performance,
          itemStyle: { color: 'rgba(0, 115, 230, 0.6)' },
        },
      ],
    };
  }, [data.performance]);

  const memoryOption = useMemo(() => {
    if (data.memoryPerformance.length === 0) return null;
    return {
      title: { text: 'Memory vs rating', left: 'center', textStyle: { fontSize: 14 } },
      grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
      tooltip: {
        formatter: (param: { data: [number, number, string] }) => {
          const d = param.data;
          return `<b>${d[2]}</b><br/>Memory: ${d[0]} KB<br/>Rating: ${d[1]}`;
        },
      },
      xAxis: { type: 'value', name: 'Memory (KB)' },
      yAxis: { type: 'value', name: 'Rating' },
      series: [
        {
          type: 'scatter',
          symbolSize: 6,
          data: data.memoryPerformance,
          itemStyle: { color: 'rgba(40, 167, 69, 0.6)' },
        },
      ],
    };
  }, [data.memoryPerformance]);

  const speedOption = useMemo(() => {
    const categories = ['0-10min', '10-30min', '30-60min', '1-2h', '2-4h', '>4h'];
    const values = categories.map((c) => data.speedAnalysis[c] || 0);
    if (values.every((v) => v === 0)) return null;
    return {
      title: { text: 'Contest speed', left: 'center', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: categories },
      yAxis: { type: 'value', name: 'Submissions' },
      series: [{ type: 'bar', data: values, itemStyle: { color: '#188df0' } }],
    };
  }, [data.speedAnalysis]);

  const pies = [
    { id: 'tags', option: pieOption('Tags solved', data.tags) },
    { id: 'lang', option: pieOption('Languages', data.lang) },
    { id: 'verdict', option: pieOption('Verdicts', data.verdicts) },
    { id: 'attempts', option: pieOption('Attempts to AC', attemptsData) },
    { id: 'participant', option: pieOption('Participant type', data.participantType) },
  ].filter((p) => p.option);

  const stats = data.stats;

  return (
    <div className={analyticsStyles.dashboard}>
      {handle && (
        <p className={analyticsStyles.handleLine}>
          Analytics for <strong>@{handle}</strong>
        </p>
      )}

      <div className={analyticsStyles.statsGrid}>
        <div className={analyticsStyles.statCard}>
          <span className={analyticsStyles.statLabel}>Total submissions</span>
          <span className={analyticsStyles.statValue}>{stats.totalSubmissions}</span>
        </div>
        <div className={analyticsStyles.statCard}>
          <span className={analyticsStyles.statLabel}>Solved problems</span>
          <span className={analyticsStyles.statValue}>{stats.solvedProblems}</span>
        </div>
        <div className={analyticsStyles.statCard}>
          <span className={analyticsStyles.statLabel}>Max streak (months)</span>
          <span className={analyticsStyles.statValue}>{stats.maxStreak}</span>
        </div>
        <div className={analyticsStyles.statCard}>
          <span className={analyticsStyles.statLabel}>Contest points</span>
          <span className={analyticsStyles.statValue}>{stats.totalPoints}</span>
        </div>
        <div className={analyticsStyles.statCard}>
          <span className={analyticsStyles.statLabel}>AC rate</span>
          <span className={analyticsStyles.statValue}>{stats.acRate.toFixed(1)}%</span>
        </div>
        <div className={analyticsStyles.statCard}>
          <span className={analyticsStyles.statLabel}>Highest rating solved</span>
          <span className={analyticsStyles.statValue}>{stats.highestRating || '—'}</span>
        </div>
      </div>

      {timelineOption && (
        <div className={`${analyticsStyles.chartBox} ${analyticsStyles.chartFull}`}>
          <ReactECharts option={timelineOption} style={{ height: 360 }} notMerge lazyUpdate />
        </div>
      )}

      {ratingOption && (
        <div className={`${analyticsStyles.chartBox} ${analyticsStyles.chartFull}`}>
          <ReactECharts option={ratingOption} style={{ height: 360 }} notMerge lazyUpdate />
        </div>
      )}

      <div className={analyticsStyles.chartRow}>
        {pies.map((p) => (
          <div key={p.id} className={analyticsStyles.chartBox}>
            <ReactECharts option={p.option!} style={{ height: 360 }} notMerge lazyUpdate />
          </div>
        ))}
      </div>

      <div className={analyticsStyles.chartRow}>
        {performanceOption && (
          <div className={analyticsStyles.chartBox}>
            <ReactECharts option={performanceOption} style={{ height: 360 }} notMerge lazyUpdate />
          </div>
        )}
        {memoryOption && (
          <div className={analyticsStyles.chartBox}>
            <ReactECharts option={memoryOption} style={{ height: 360 }} notMerge lazyUpdate />
          </div>
        )}
      </div>

      {speedOption && (
        <div className={`${analyticsStyles.chartBox} ${analyticsStyles.chartHalf}`}>
          <ReactECharts option={speedOption} style={{ height: 360 }} notMerge lazyUpdate />
        </div>
      )}
    </div>
  );
}
