import { FocusRecord } from '../../types';

const CATEGORY_COLORS = ['#7c8363', '#c68a73', '#e9e8e0', '#4a4a35', '#7a8e9e', '#d0a460'];

export interface FocusCategoryDistribution {
  name: string;
  seconds: number;
  percentage: number;
  color: string;
}

export interface FocusStats {
  todayPomodoros: number;
  totalPomodoros: number;
  todaySeconds: number;
  totalSeconds: number;
  longestSeconds: number;
  todayDistribution: FocusCategoryDistribution[];
  totalDistribution: FocusCategoryDistribution[];
}

export type FocusStatsPeriod = 'day' | 'week' | 'month';

/**
 * Builds all focus statistics shown by the stats page from persisted records.
 *
 * @param records persisted focus records
 * @param now date used to decide which records belong to today
 * @returns aggregate totals and category distributions
 */
export function buildFocusStats(records: FocusRecord[], now = new Date()): FocusStats {
  const todayKey = toDateKey(now);
  const todayRecords = records.filter((record) => toDateKey(new Date(record.timestamp)) === todayKey);

  return {
    todayPomodoros: todayRecords.filter((record) => record.type === 'pomodoro').length,
    totalPomodoros: records.filter((record) => record.type === 'pomodoro').length,
    todaySeconds: sumDurations(todayRecords),
    totalSeconds: sumDurations(records),
    longestSeconds: records.reduce((longest, record) => Math.max(longest, record.duration), 0),
    todayDistribution: buildCategoryDistribution(todayRecords),
    totalDistribution: buildCategoryDistribution(records),
  };
}

/**
 * Filters focus records for a visible stats period.
 *
 * @param records persisted focus records
 * @param period selected stats period
 * @param now date used as the period anchor
 * @returns records inside the selected local period
 */
export function getFocusRecordsForPeriod(records: FocusRecord[], period: FocusStatsPeriod, now = new Date()): FocusRecord[] {
  const start = getPeriodStart(period, now);
  const end = getPeriodEnd(period, now);

  return records.filter((record) => {
    const timestamp = new Date(record.timestamp);
    return timestamp >= start && timestamp < end;
  });
}

/**
 * Formats seconds into compact hour/minute text for dashboard metrics.
 *
 * @param seconds duration in seconds
 * @returns compact display text such as `2h 30m` or `45m`
 */
export function formatDuration(seconds: number): string {
  const normalizedSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(normalizedSeconds / 3600);
  const minutes = Math.floor((normalizedSeconds % 3600) / 60);

  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function buildCategoryDistribution(records: FocusRecord[]): FocusCategoryDistribution[] {
  const totalSeconds = sumDurations(records);
  if (totalSeconds === 0) return [];

  const secondsByCategory = records.reduce<Map<string, number>>((acc, record) => {
    const category = record.category.trim() || '未分类';
    acc.set(category, (acc.get(category) ?? 0) + record.duration);
    return acc;
  }, new Map());

  return [...secondsByCategory.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], 'zh-Hans-CN'))
    .map(([name, seconds], index) => ({
      name,
      seconds,
      percentage: roundPercentage((seconds / totalSeconds) * 100),
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
}

function sumDurations(records: FocusRecord[]): number {
  return records.reduce((total, record) => total + Math.max(0, record.duration), 0);
}

function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPeriodStart(period: FocusStatsPeriod, now: Date): Date {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === 'week') {
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
  }

  if (period === 'month') {
    start.setDate(1);
  }

  return start;
}

function getPeriodEnd(period: FocusStatsPeriod, now: Date): Date {
  const end = getPeriodStart(period, now);

  if (period === 'day') {
    end.setDate(end.getDate() + 1);
  } else if (period === 'week') {
    end.setDate(end.getDate() + 7);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  return end;
}
