# Journal Local Notifications Spec

Date: 2026-04-24

## Goal

Add optional Android local message notifications to journal entries so users can set a reminder time when creating or editing a note.

## Scope

- Keep the app frontend-only.
- Use Capacitor local notifications for Android APK behavior.
- Use ordinary scheduled local notifications only; do not request exact alarm permission.
- Request notification permission only when the user saves a journal entry with reminders enabled.
- Do not request notification permission during install or first launch.
- Preserve existing journal create, edit, delete, and calendar behavior.

## Data Rules

- `JournalEntry` gains optional reminder fields:
  - `reminderEnabled?: boolean`
  - `reminderAt?: string`
  - `reminderNotificationId?: number`
- Reminder time is stored as a local ISO-like datetime string.
- When reminder is disabled, reminder fields are cleared.
- New reminders receive a deterministic numeric notification id derived from the journal id.
- Updating reminder time cancels the previous notification id before scheduling the new notification.
- Deleting a journal entry cancels its scheduled notification when a notification id exists.

## Permission Rules

- Android 13+ requires runtime notification permission.
- The app asks for permission only from the reminder save flow.
- Android 12 and below should be treated as granted by the Capacitor plugin.
- If permission is denied, the journal entry can still be saved, but the reminder is disabled so the UI does not imply a scheduled notification.

## Notification Rules

- Notification title: `随笔提醒`.
- Notification body:
  - If the entry has a non-empty title: `该看看「标题」了`.
  - Otherwise: `有一条随笔提醒到了`.
- Notification extra payload includes the journal entry id and date.
- Foreground in-app reminder popup is out of scope for this first implementation.

## UI Rules

- Journal edit form shows a `提醒我` switch.
- When enabled, the form shows dropdown selectors for year, month, day, hour, and minute.
- The date portion defaults to the selected calendar date.
- Time defaults to the next whole hour from current local time.
- Past reminder times are rejected in the form with a short validation message.

## Acceptance Criteria

- Users can create a journal entry without a reminder as before.
- Users can enable a reminder and choose year, month, day, hour, and minute.
- Saving an enabled reminder requests notification permission when needed.
- Granted permission schedules a local notification and stores reminder metadata.
- Denied permission saves the journal entry without active reminder metadata.
- Editing an entry can reschedule or disable its reminder.
- Deleting an entry cancels its scheduled reminder.
- Unit tests cover reminder time formatting, payload building, permission denial behavior, and update/cancel decisions.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npx cap sync android` passes.
