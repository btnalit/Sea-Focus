const WEEKDAY_OFFSET_MONDAY_FIRST = 6;

/**
 * Formats a date as a local YYYY-MM-DD key.
 *
 * @param date date to format
 * @returns local date key
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a local YYYY-MM-DD key into a local Date at midnight.
 *
 * @param dateKey local date key
 * @returns parsed local date
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Adds calendar days using local time.
 *
 * @param date start date
 * @param days number of days to add
 * @returns shifted date
 */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Builds a seven-day strip with the given date in the center.
 *
 * @param centerDate center date
 * @returns seven local dates from -3 through +3 days
 */
export function buildCenteredDateStrip(centerDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(centerDate, index - 3));
}

/**
 * Builds a reusable date range around a center date for horizontal date strips.
 *
 * @param centerDate center date
 * @param daysBefore number of days before center
 * @param daysAfter number of days after center
 * @returns local dates in ascending order
 */
export function buildDateRangeAround(centerDate: Date, daysBefore = 30, daysAfter = 30): Date[] {
  return Array.from({ length: daysBefore + daysAfter + 1 }, (_, index) => addDays(centerDate, index - daysBefore));
}

/**
 * Builds a six-week, Monday-first month grid.
 *
 * @param year full year
 * @param month zero-based month
 * @returns 42 local dates covering the calendar grid
 */
export function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + WEEKDAY_OFFSET_MONDAY_FIRST) % 7;
  const gridStart = addDays(firstOfMonth, -startOffset);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

/**
 * Returns true when two dates share the same local date key.
 *
 * @param left first date
 * @param right second date
 * @returns whether both dates are the same local day
 */
export function isSameLocalDay(left: Date, right: Date): boolean {
  return formatDateKey(left) === formatDateKey(right);
}

/**
 * Returns a compact Chinese weekday label.
 *
 * @param date date to label
 * @returns weekday label
 */
export function getChineseWeekday(date: Date): string {
  return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
}
