import { JournalEntry } from '../../types';

export interface ReminderDateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface JournalReminderNotification {
  id: number;
  title: string;
  body: string;
  schedule: {
    at: Date;
  };
  extra: {
    journalEntryId: string;
    journalDate: string;
  };
}

export interface ReminderSelectOptions {
  years: number[];
  months: number[];
  days: number[];
  hours: number[];
  minutes: number[];
}

/**
 * Builds a local reminder datetime string without timezone conversion.
 *
 * @param parts local date and time selector values
 * @returns local reminder value in YYYY-MM-DDTHH:mm:00 format
 */
export function buildLocalReminderIso(parts: ReminderDateParts): string {
  const year = String(parts.year).padStart(4, '0');
  const month = String(parts.month).padStart(2, '0');
  const day = String(parts.day).padStart(2, '0');
  const hour = String(parts.hour).padStart(2, '0');
  const minute = String(parts.minute).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

/**
 * Parses a local reminder datetime string into selector values.
 *
 * @param reminderAt local reminder value
 * @returns selector parts
 */
export function parseLocalReminderIso(reminderAt: string): ReminderDateParts {
  const [datePart, timePart] = reminderAt.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  return { year, month, day, hour, minute };
}

/**
 * Builds a deterministic positive Android notification id for a journal entry.
 *
 * @param journalEntryId journal entry id
 * @returns positive integer notification id
 */
export function buildReminderNotificationId(journalEntryId: string): number {
  let hash = 17;
  for (let index = 0; index < journalEntryId.length; index += 1) {
    hash = (hash * 31 + journalEntryId.charCodeAt(index)) >>> 0;
  }
  return (hash % 2_000_000_000) + 1;
}

/**
 * Builds the local notification payload for a journal reminder.
 *
 * @param entry journal entry with reminder metadata
 * @returns notification payload for the frontend notification API
 */
export function buildJournalReminderNotification(entry: JournalEntry): JournalReminderNotification {
  if (!entry.reminderAt || !entry.reminderNotificationId) {
    throw new Error('Journal reminder notification requires reminderAt and reminderNotificationId.');
  }

  return {
    id: entry.reminderNotificationId,
    title: '随笔提醒',
    body: entry.title.trim() ? `该看看「${entry.title.trim()}」了` : '有一条随笔提醒到了',
    schedule: {
      at: parseLocalReminderDate(entry.reminderAt),
    },
    extra: {
      journalEntryId: entry.id,
      journalDate: entry.date,
    },
  };
}

/**
 * Checks whether a reminder time is still in the future.
 *
 * @param reminderAt local reminder value
 * @param now comparison date
 * @returns whether the reminder can still be scheduled
 */
export function isFutureReminderAt(reminderAt: string, now = new Date()): boolean {
  return parseLocalReminderDate(reminderAt).getTime() > now.getTime();
}

/**
 * Builds dropdown option values for reminder selectors.
 *
 * @param now local date used for the first year
 * @returns selector options
 */
export function buildReminderSelectOptions(now = new Date()): ReminderSelectOptions {
  const startYear = now.getFullYear();
  return {
    years: [startYear, startYear + 1, startYear + 2],
    months: range(1, 12),
    days: range(1, 31),
    hours: range(0, 23),
    minutes: range(0, 59),
  };
}

/**
 * Creates default reminder selector values for a selected journal date.
 *
 * @param selectedDateKey local YYYY-MM-DD date
 * @param now current local time
 * @returns selector parts defaulted to the next whole hour
 */
export function buildDefaultReminderParts(selectedDateKey: string, now = new Date()): ReminderDateParts {
  const [year, month, day] = selectedDateKey.split('-').map(Number);
  const defaultDate = new Date(year, month - 1, day, now.getHours(), 0, 0, 0);
  defaultDate.setHours(defaultDate.getHours() + 1);
  return {
    year: defaultDate.getFullYear(),
    month: defaultDate.getMonth() + 1,
    day: defaultDate.getDate(),
    hour: defaultDate.getHours(),
    minute: 0,
  };
}

function parseLocalReminderDate(reminderAt: string): Date {
  const { year, month, day, hour, minute } = parseLocalReminderIso(reminderAt);
  return new Date(year, month - 1, day, hour, minute, 0);
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}
