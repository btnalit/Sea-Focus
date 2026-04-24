# Calendar Plan Entry Completion Spec

Date: 2026-04-24

## Goal

Make every visible panel entry in Sea Focus either real and usable or remove it. Keep the existing nature/garden visual style.

## Scope

- Plan date strip must be dynamic, with today centered by default.
- Plan tasks must be associated with the selected date.
- Plan `归档` must show completed tasks instead of being decorative text.
- Calendar/journal page must support day selection and journal CRUD.
- Remove upgrade/membership UI and the `我的` tab.
- Remove or replace non-functional page controls.
- Stats period tabs must be clickable and compute real day/week/month distributions.
- Keep all persistence behind the frontend API layer.

## Data Chain

There is no backend or database in this repository. The complete current call chain is:

`UI components` -> `App.tsx state/actions` -> `src/api/seaFocusStorage.ts` -> browser `localStorage`.

New journal data must use the same chain:

`CalendarPage` -> `App.tsx journal actions` -> `seaFocusStorage.saveJournalEntries`.

## Functional Requirements

- Date keys use local `YYYY-MM-DD` strings for task and journal filtering.
- Plan date strip shows seven days: selected center date minus three days through plus three days.
- Initial selected plan date is today, so today is centered.
- Adding a plan saves the selected date key.
- Calendar month view shows actual month dates and real journal entry summaries.
- Clicking a calendar day selects it and shows that day's entries.
- Users can add, edit, delete, and view journal entries for the selected day.
- Calendar upgrade card is removed.
- Bottom navigation contains only `计划`, `随笔`, `专注`, and `收获`.
- Stats `日 / 周 / 月` controls switch real aggregation periods.
- Non-functional icon-only buttons must be removed unless they perform an action.

## Test Mapping

- Date utility tests cover centered date strip and month grid.
- Storage API tests cover journal persistence and invalid JSON fallback.
- Stats tests cover week and month period filtering.
- Existing unit, lint, build, CI config validation, and Capacitor sync remain required.

## Acceptance Criteria

- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run test:ci-config` passes.
- `npx cap sync android` passes.
- No visible upgrade/membership/user tab remains.
