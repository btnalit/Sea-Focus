# Panel Interaction Completion Spec

Date: 2026-04-24

## Goal

Fix the remaining visible interaction gaps in Sea Focus:

- Plan date strip should open with today centered and then support smooth horizontal swiping.
- Journal calendar day clicks should open a day-management modal.
- Stats should complete the `预估` module and keep `收获` linked to real focus records.
- Focus page primary action should be visually centered.

## Scope

- Keep current nature/garden visual style.
- Keep the app frontend-only.
- Keep all persistence behind `src/api/seaFocusStorage.ts`.
- Add unit tests for date range generation and task forecast aggregation.

## Data Chain

No backend or database exists in this repository.

- Plan UI -> `App` task state/actions -> `seaFocusStorage` -> `localStorage`.
- Journal UI -> `App` journal state/actions -> `seaFocusStorage` -> `localStorage`.
- Stats UI -> task and focus record props -> stats aggregation utilities -> rendered forecast/harvest panels.

## Requirements

### Plan

- Initial date strip centers today.
- Date strip is horizontally scrollable with snap-style behavior.
- Clicking a date should not rebuild the strip around the clicked day.
- Selected date should smoothly center in the strip.

### Journal

- Clicking a calendar day opens a modal.
- Modal first shows existing entries for the selected day and an add action.
- Tapping an existing entry opens edit mode.
- Entries can be added, edited, deleted, and viewed inside the modal.

### Stats

- The top `预估 / 收获` headings are real tab controls.
- `预估` uses task data from plan:
  - period filter: day/week/month,
  - incomplete task count,
  - completed task count,
  - estimated pomodoro count,
  - estimated focus duration,
  - quadrant distribution.
- `收获` uses focus records:
  - period filter: day/week/month,
  - real duration distribution,
  - real totals.

### Focus

- Primary start/pause button is centered under the timer.
- Reset action is secondary and placed where it does not compete with the primary action.

## Acceptance Criteria

- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run test:ci-config` passes.
- `npx cap sync android` passes.
- Changes are committed and pushed to `main`.
