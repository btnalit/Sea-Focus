# Daily Plan Archive And Carryover Spec

Date: 2026-04-24

## Goal

Complete the daily plan lifecycle so finished plans are archived and unfinished past plans remain trackable on later days.

## Scope

- Keep the app frontend-only.
- Keep all plan data flowing through `App` state and `seaFocusStorage`.
- Add typed task lifecycle helpers instead of duplicating date/status logic inside page rendering.
- Preserve existing visual direction and bottom navigation.

## Lifecycle Rules

- A plan belongs to its original `date`.
- Completing a plan sets `completed = true` and stores `completedAt`.
- A completed plan is shown in the archive view for its original `date`.
- Reopening an archived plan sets `completed = false` and clears `completedAt`.
- An unfinished plan from a previous date is carried forward into later active plan views until it is completed.
- Carried-forward plans keep their original date and are visually marked as tracked from that date.
- Forecast statistics must count unfinished carryover plans for the selected period.

## Data Contract

- Frontend: `PlanPage` receives tasks through props from `App`.
- State mutation: `App.toggleTask` applies task lifecycle changes.
- Persistence: `seaFocusStorage.saveTasks` persists the updated task list.
- Backend/database: none exists in this repository.

## Acceptance Criteria

- Lifecycle helpers have automated tests.
- Completing a task archives it under the task's original plan date.
- Incomplete past tasks appear on later active days.
- Reopened archived tasks return to active tracking.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
