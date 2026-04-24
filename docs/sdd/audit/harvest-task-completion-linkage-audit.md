# Harvest Task Completion Linkage Audit

Date: 2026-04-24

## Planned Review

- Completion chain: `PlanPage` -> `App.toggleTask` -> `toggleTaskCompletion` -> persisted `Task.completedAt`.
- Harvest chain: `StatsPage` -> completed task aggregation -> counters/chart.
- Forecast chain: unfinished task forecast remains separate from completed task harvest.

## Findings

- Root cause confirmed: harvest counters and chart were derived only from `FocusRecord`; completing a plan mutates `Task`, so harvest did not react while forecast did.
- Added `taskHarvest` aggregation for completed plans. `completedAt` determines day/week/month harvest ownership; legacy completed tasks without `completedAt` fall back to their original `date`.
- `StatsPage` harvest mode now uses completed tasks for `今日收获`, `累计归档`, and chart distribution.
- `StatsPage` still uses focus records for duration-specific metrics: `巅峰心流` and `总计专注`.
- Forecast remains separate and continues to use unfinished task/carryover logic.
- Data access still follows the frontend chain: persisted tasks are loaded through `seaFocusStorage`, passed through `App` state, and aggregated in feature helpers.

## Verification

- `npm run test:unit`: passed, 26/26 tests.
- `npm run lint`: passed.
- `npm run test:ci-config`: passed, 43 Android CI checks.
- `npm run build`: passed.
- `npx cap sync android`: passed.
- Android resource XML parse scan: passed, no invalid XML files.
- Frontend data chain scan: storage access remains isolated to `seaFocusStorage`; harvest uses `buildTaskHarvestStats` and forecast uses `buildTaskForecast`.
- `git diff --check`: passed.
