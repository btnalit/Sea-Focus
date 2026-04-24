import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cancelJournalReminderNotification,
  scheduleJournalReminderNotification,
} from './journalReminderNotifications';

type PermissionState = 'granted' | 'denied' | 'prompt';

function createFakeClient(checkState: PermissionState, requestState: PermissionState) {
  const calls = {
    requestPermissions: 0,
    scheduled: [] as unknown[],
    cancelled: [] as number[],
  };

  return {
    calls,
    client: {
      checkPermissions: async () => ({ display: checkState }),
      requestPermissions: async () => {
        calls.requestPermissions += 1;
        return { display: requestState };
      },
      schedule: async (payload: unknown) => {
        calls.scheduled.push(payload);
      },
      cancel: async (payload: { notifications: Array<{ id: number }> }) => {
        calls.cancelled.push(...payload.notifications.map((notification) => notification.id));
      },
    },
  };
}

test('schedules a reminder notification when permission is already granted', async () => {
  const fake = createFakeClient('granted', 'denied');
  const result = await scheduleJournalReminderNotification(fake.client, {
    id: 123,
    title: '随笔提醒',
    body: '该看看「整理灵感」了',
    schedule: { at: new Date(2026, 3, 24, 21, 30) },
    extra: { journalEntryId: 'entry-1', journalDate: '2026-04-24' },
  });

  assert.deepEqual(result, { scheduled: true, permission: 'granted' });
  assert.equal(fake.calls.requestPermissions, 0);
  assert.equal(fake.calls.scheduled.length, 1);
});

test('requests permission before scheduling a reminder notification', async () => {
  const fake = createFakeClient('prompt', 'granted');
  const result = await scheduleJournalReminderNotification(fake.client, {
    id: 123,
    title: '随笔提醒',
    body: '该看看「整理灵感」了',
    schedule: { at: new Date(2026, 3, 24, 21, 30) },
    extra: { journalEntryId: 'entry-1', journalDate: '2026-04-24' },
  });

  assert.deepEqual(result, { scheduled: true, permission: 'granted' });
  assert.equal(fake.calls.requestPermissions, 1);
  assert.equal(fake.calls.scheduled.length, 1);
});

test('does not schedule a reminder notification when permission is denied', async () => {
  const fake = createFakeClient('prompt', 'denied');
  const result = await scheduleJournalReminderNotification(fake.client, {
    id: 123,
    title: '随笔提醒',
    body: '该看看「整理灵感」了',
    schedule: { at: new Date(2026, 3, 24, 21, 30) },
    extra: { journalEntryId: 'entry-1', journalDate: '2026-04-24' },
  });

  assert.deepEqual(result, { scheduled: false, permission: 'denied' });
  assert.equal(fake.calls.scheduled.length, 0);
});

test('does not throw when the platform cannot provide notifications', async () => {
  const result = await scheduleJournalReminderNotification({
    checkPermissions: async () => {
      throw new Error('Notifications unavailable');
    },
    requestPermissions: async () => ({ display: 'denied' }),
    schedule: async () => undefined,
    cancel: async () => undefined,
  }, {
    id: 123,
    title: '随笔提醒',
    body: '该看看「整理灵感」了',
    schedule: { at: new Date(2026, 3, 24, 21, 30) },
    extra: { journalEntryId: 'entry-1', journalDate: '2026-04-24' },
  });

  assert.deepEqual(result, { scheduled: false, permission: 'denied' });
});

test('cancels a scheduled reminder notification by id', async () => {
  const fake = createFakeClient('granted', 'granted');

  await cancelJournalReminderNotification(fake.client, 456);
  await cancelJournalReminderNotification(fake.client, undefined);

  assert.deepEqual(fake.calls.cancelled, [456]);
});
