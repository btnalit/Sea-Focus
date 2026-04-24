# Harvest Task Completion Linkage Spec

Date: 2026-04-24

## Goal

Fix the harvest page so completing plans updates harvest counters and the harvest chart, while forecast continues to reflect unfinished plans.

## Scope

- Keep the app frontend-only.
- Keep task data flowing through `App` state and `seaFocusStorage`.
- Add a task-completion harvest aggregation utility instead of embedding aggregation in `StatsPage`.
- Preserve focus-session metrics for focus duration and longest flow.

## Harvest Rules

- A completed plan is a harvest item.
- `completedAt` determines which day/week/month a completed plan belongs to.
- The harvest summary counts completed plans for today and all time.
- The harvest chart groups completed plans by quadrant for the selected period.
- Focus records still drive focus duration metrics (`巅峰心流`, `总计专注`).
- Forecast remains based on unfinished plans and carryover tracking.

## Data Contract

- `PlanPage` completion action -> `App.toggleTask` -> `toggleTaskCompletion` writes `completedAt`.
- `StatsPage` receives tasks through props.
- `StatsPage` calls the harvest aggregation helper to derive completed-plan counters and chart segments.
- No backend or database layer exists in this repository.

## Acceptance Criteria

- Completing a plan changes harvest counts.
- Completing a plan changes harvest chart distribution.
- Existing focus duration metrics remain intact.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
