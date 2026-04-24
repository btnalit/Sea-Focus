# Focus And Stats Optimization Spec

Date: 2026-04-24

## Goal

Improve Sea Focus function and layout while keeping the current nature/garden visual direction.

## Scope

- Add focus duration presets: 25 minutes, 50 minutes, and custom minutes.
- Keep focus categories available when starting a session so statistics can describe real user intent.
- Calculate statistics from actual focus records instead of fixed demo percentages.
- Move browser persistence behind a frontend API/storage module.
- Add focused unit tests for the new metrics and storage behavior.
- Keep the app frontend-only. No backend or database exists in this repository.

## Data Flow

Current flow to replace:

`App.tsx` -> direct `localStorage` -> child components.

Target frontend flow:

`App.tsx` -> `src/api/seaFocusStorage.ts` -> `localStorage`.

Statistics flow:

`FocusPage` completion -> `App.tsx` record state -> `StatsPage` -> `src/features/stats/focusStats.ts` aggregation -> chart/cards.

## Functional Requirements

- The timer must expose 25-minute, 50-minute, and custom-minute presets.
- Switching presets while the timer is stopped updates the displayed timer immediately.
- Custom minutes must be clamped to a practical range from 1 to 240 minutes.
- Completing a countdown-style session records the selected category and actual configured duration.
- Statistics must compute:
  - today's pomodoro count,
  - total focus duration,
  - longest focus session,
  - category distribution from real records,
  - today distribution for the daily chart.
- Empty statistics must render without fake percentages.

## Layout Requirements

- Timer controls must remain usable on narrow Android screens.
- The timer display must not overflow its circular visual frame.
- Stats cards must avoid showing hardcoded values when there are no records.

## Test Mapping

- Unit tests for stats aggregation.
- Unit tests for custom duration clamping.
- Unit tests for local storage read/write fallback behavior.
- Existing `npm run lint`, `npm run build`, `npm run test:ci-config`, and `npx cap sync android` remain required verification.
- GitHub Actions must run `npm run test:unit` before building the APK.

## Acceptance Criteria

- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run test:ci-config` passes.
- `npx cap sync android` passes after the web build.
- Stats page uses record-derived values and does not show demo category percentages.
