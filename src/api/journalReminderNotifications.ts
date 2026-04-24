import {
  LocalNotifications,
  type LocalNotificationSchema,
  type LocalNotificationsPlugin,
} from '@capacitor/local-notifications';
import { JournalReminderNotification } from '../features/calendar/journalReminder';

type NotificationPermissionState = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale';

interface NotificationPermissionStatus {
  display: NotificationPermissionState;
}

export type ReminderNotificationClient = Pick<
  LocalNotificationsPlugin,
  'checkPermissions' | 'requestPermissions' | 'schedule' | 'cancel'
>;

interface TestableReminderNotificationClient {
  checkPermissions: () => Promise<NotificationPermissionStatus>;
  requestPermissions: () => Promise<NotificationPermissionStatus>;
  schedule: (payload: { notifications: LocalNotificationSchema[] }) => Promise<unknown>;
  cancel: (payload: { notifications: Array<{ id: number }> }) => Promise<unknown>;
}

export interface ScheduleJournalReminderResult {
  scheduled: boolean;
  permission: 'granted' | 'denied';
}

/**
 * Schedules a journal reminder notification after checking runtime permission.
 *
 * @param client notification client implementation
 * @param notification journal reminder notification payload
 * @returns scheduling result with permission state
 */
export async function scheduleJournalReminderNotification(
  client: TestableReminderNotificationClient,
  notification: JournalReminderNotification,
): Promise<ScheduleJournalReminderResult> {
  const permission = await ensureNotificationPermission(client);
  if (!permission) return { scheduled: false, permission: 'denied' };

  try {
    await client.schedule({ notifications: [notification] });
    return { scheduled: true, permission: 'granted' };
  } catch {
    return { scheduled: false, permission: 'denied' };
  }
}

/**
 * Cancels a scheduled journal reminder notification when an id exists.
 *
 * @param client notification client implementation
 * @param notificationId scheduled notification id
 */
export async function cancelJournalReminderNotification(
  client: TestableReminderNotificationClient,
  notificationId: number | undefined,
): Promise<void> {
  if (!notificationId) return;
  try {
    await client.cancel({ notifications: [{ id: notificationId }] });
  } catch {
    // Reminder cancellation is best-effort; failed cancellation should not block saving or deleting notes.
  }
}

export const journalReminderNotifications = {
  schedule: (notification: JournalReminderNotification) => (
    scheduleJournalReminderNotification(LocalNotifications, notification)
  ),
  cancel: (notificationId: number | undefined) => (
    cancelJournalReminderNotification(LocalNotifications, notificationId)
  ),
};

async function ensureNotificationPermission(client: TestableReminderNotificationClient): Promise<boolean> {
  let current: NotificationPermissionStatus;
  try {
    current = await client.checkPermissions();
    if (current.display === 'granted') return true;
  } catch {
    return false;
  }

  try {
    const requested = await client.requestPermissions();
    return requested.display === 'granted';
  } catch {
    return false;
  }
}
