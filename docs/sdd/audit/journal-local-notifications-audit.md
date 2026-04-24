# Journal Local Notifications Audit

Date: 2026-04-24

## Planned Review

- Data chain: `CalendarPage` form -> `App` journal handlers -> `seaFocusStorage`.
- Notification chain: journal save/delete handlers -> notification API wrapper -> Capacitor local notifications.
- Permission chain: reminder save action -> notification permission check/request -> schedule or disable reminder.
- Android chain: dependency + manifest permission -> Capacitor sync -> generated Android project.

## Findings

- `CalendarPage` now keeps reminder UI state local to the journal modal and passes reminder intent through the existing `App` journal handlers.
- `App` remains the state owner for journal entries and calls the notification API wrapper during add, update, and delete flows.
- New entries with reminders receive deterministic notification ids after `App` generates the journal id.
- Updating an entry cancels the previous reminder id before scheduling the replacement.
- Deleting an entry cancels the scheduled reminder id before removing the entry from state.
- If notification permission is denied or unavailable, the journal entry is saved and reminder metadata is cleared.
- Default reminder time rolls to the next whole hour, including day rollover after 23:00.
- The Android manifest declares `POST_NOTIFICATIONS`.
- `SCHEDULE_EXACT_ALARM` is not declared; this implementation uses ordinary scheduled local notifications only.
- Capacitor sync registered `@capacitor/local-notifications@8.0.2` in Android Gradle integration.

## Verification

- TDD RED: `npm run test:unit -- src/features/calendar/journalReminder.test.ts src/api/journalReminderNotifications.test.ts` failed because reminder modules did not exist.
- TDD RED: `npm run test:unit -- src/api/journalReminderNotifications.test.ts` failed when notification-unavailable behavior threw.
- `npm run test:unit`: passed, 43/43 tests.
- `npm run lint`: passed.
- `npm run test:ci-config`: passed, 43 Android CI checks.
- `npm run build`: passed.
- `npx cap sync android`: passed and found `@capacitor/local-notifications@8.0.2`.
- Android resource XML parse scan: passed, 12 XML files.
- `git diff --check`: passed.
- Permission scan confirms `POST_NOTIFICATIONS` is declared and `SCHEDULE_EXACT_ALARM` is not present in the app manifest.
