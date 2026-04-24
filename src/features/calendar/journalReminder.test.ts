import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildJournalReminderNotification,
  buildDefaultReminderParts,
  buildLocalReminderIso,
  buildReminderNotificationId,
  buildReminderSelectOptions,
  isFutureReminderAt,
  parseLocalReminderIso,
} from './journalReminder';
import { JournalEntry } from '../../types';

test('formats and parses local reminder datetime values', () => {
  const reminderAt = buildLocalReminderIso({
    year: 2026,
    month: 4,
    day: 24,
    hour: 9,
    minute: 5,
  });

  assert.equal(reminderAt, '2026-04-24T09:05:00');
  assert.deepEqual(parseLocalReminderIso(reminderAt), {
    year: 2026,
    month: 4,
    day: 24,
    hour: 9,
    minute: 5,
  });
});

test('builds deterministic positive notification ids from journal ids', () => {
  const first = buildReminderNotificationId('entry-1');
  const second = buildReminderNotificationId('entry-1');
  const other = buildReminderNotificationId('entry-2');

  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.equal(Number.isInteger(first), true);
  assert.equal(first > 0, true);
});

test('builds local notification payload from a journal reminder', () => {
  const entry: JournalEntry = {
    id: 'entry-1',
    date: '2026-04-24',
    title: '整理灵感',
    content: '晚上复盘。',
    createdAt: '2026-04-24T08:00:00',
    updatedAt: '2026-04-24T08:30:00',
    reminderEnabled: true,
    reminderAt: '2026-04-24T21:30:00',
    reminderNotificationId: 12345,
  };
  const notification = buildJournalReminderNotification(entry);

  assert.equal(notification.id, 12345);
  assert.equal(notification.title, '随笔提醒');
  assert.equal(notification.body, '该看看「整理灵感」了');
  assert.equal(notification.schedule.at.getTime(), new Date(2026, 3, 24, 21, 30).getTime());
  assert.deepEqual(notification.extra, {
    journalEntryId: 'entry-1',
    journalDate: '2026-04-24',
  });
});

test('falls back to generic notification body for untitled entries', () => {
  const entry: JournalEntry = {
    id: 'entry-1',
    date: '2026-04-24',
    title: '   ',
    content: '一条无题随笔。',
    createdAt: '2026-04-24T08:00:00',
    updatedAt: '2026-04-24T08:30:00',
    reminderEnabled: true,
    reminderAt: '2026-04-24T21:30:00',
    reminderNotificationId: 12345,
  };

  assert.equal(buildJournalReminderNotification(entry).body, '有一条随笔提醒到了');
});

test('validates reminder times against the current local time', () => {
  const now = new Date(2026, 3, 24, 12, 0);

  assert.equal(isFutureReminderAt('2026-04-24T12:01:00', now), true);
  assert.equal(isFutureReminderAt('2026-04-24T12:00:00', now), false);
  assert.equal(isFutureReminderAt('2026-04-24T11:59:00', now), false);
});

test('builds compact dropdown options for reminder selectors', () => {
  const options = buildReminderSelectOptions(new Date(2026, 3, 24, 12, 10));

  assert.deepEqual(options.years, [2026, 2027, 2028]);
  assert.deepEqual(options.months.slice(0, 3), [1, 2, 3]);
  assert.deepEqual(options.days.slice(0, 3), [1, 2, 3]);
  assert.deepEqual(options.hours.slice(0, 3), [0, 1, 2]);
  assert.deepEqual(options.minutes.slice(0, 3), [0, 1, 2]);
});

test('defaults reminder selector to the next whole hour with day rollover', () => {
  assert.deepEqual(
    buildDefaultReminderParts('2026-04-24', new Date(2026, 3, 24, 23, 30)),
    {
      year: 2026,
      month: 4,
      day: 25,
      hour: 0,
      minute: 0,
    },
  );
});
