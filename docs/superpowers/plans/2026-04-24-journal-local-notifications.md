# Journal Local Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional ordinary Android local notifications for journal entries.

**Architecture:** Keep reminder domain logic in focused helper functions and isolate Capacitor calls behind a frontend API wrapper. `App` remains the state owner and the only bridge between UI, persistence, and notification scheduling.

**Tech Stack:** React, TypeScript, Capacitor, `@capacitor/local-notifications`, Node test runner.

---

### Task 1: Reminder Domain

**Files:**
- Create: `src/features/calendar/journalReminder.ts`
- Test: `src/features/calendar/journalReminder.test.ts`

- [ ] Write failing tests for building local reminder datetimes, notification ids, payloads, and future-time validation.
- [ ] Run `npm run test:unit -- src/features/calendar/journalReminder.test.ts` and confirm the new tests fail because the helper does not exist.
- [ ] Implement `buildLocalReminderIso`, `buildReminderNotificationId`, `buildJournalReminderNotification`, `isFutureReminderAt`, and selector option builders.
- [ ] Re-run `npm run test:unit -- src/features/calendar/journalReminder.test.ts` and confirm the tests pass.

### Task 2: Notification API Wrapper

**Files:**
- Create: `src/api/journalReminderNotifications.ts`
- Test: `src/api/journalReminderNotifications.test.ts`

- [ ] Write failing tests with a fake notification client for granted and denied permission flows.
- [ ] Implement a wrapper that calls `checkPermissions`, `requestPermissions`, `schedule`, and `cancel`.
- [ ] Keep denied permission behavior non-blocking by returning `scheduled: false`.
- [ ] Re-run focused notification API tests.

### Task 3: App State Wiring

**Files:**
- Modify: `src/types.ts`
- Modify: `src/App.tsx`
- Modify: `src/api/seaFocusStorage.test.ts`

- [ ] Extend `JournalEntry` with optional reminder fields.
- [ ] Update create, update, and delete journal handlers so they schedule, reschedule, disable, or cancel reminders through the wrapper.
- [ ] Update storage tests to round-trip reminder metadata.

### Task 4: Journal UI

**Files:**
- Modify: `src/components/CalendarPage.tsx`

- [ ] Add reminder form state.
- [ ] Add a `提醒我` switch and year/month/day/hour/minute selectors.
- [ ] Initialize reminder controls from selected date or the existing entry.
- [ ] Validate past reminder times before save.
- [ ] Show schedule failure text when notification permission is denied.

### Task 5: Android Integration

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `capacitor.config.ts`
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] Install `@capacitor/local-notifications` compatible with current Capacitor.
- [ ] Configure notification icon color and default behavior.
- [ ] Declare `android.permission.POST_NOTIFICATIONS`.
- [ ] Do not declare `SCHEDULE_EXACT_ALARM`.

### Task 6: Verification

**Commands:**
- `npm run test:unit`
- `npm run lint`
- `npm run test:ci-config`
- `npm run build`
- `npx cap sync android`
- Android XML parse scan
- `git diff --check`

- [ ] Run all commands and record evidence in the SDD audit.
- [ ] Commit and push using Conventional Commits.
