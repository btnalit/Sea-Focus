# Mobile Polish And Chart Redesign Spec

Date: 2026-04-24

## Goal

Fix the latest mobile layout issues and replace the primitive stats chart with a more app-specific garden-style chart.

## Scope

- Keep the existing nature/garden visual direction.
- Keep the app frontend-only.
- Keep all persisted data behind `src/api/seaFocusStorage.ts`.
- Use existing React, Motion, Tailwind, and chart/rendering dependencies.
- Use plugin-assisted visual review where available; Figma MCP was consulted for design-system integration guidance.
- Do not start a local preview server for browser verification after the user requested code-only validation.

## Data Chain

No backend or database exists in this repository.

- Plan UI -> `App` task state/actions -> `seaFocusStorage` -> `localStorage`.
- Journal UI -> `CalendarPage` modal actions -> `App` journal actions -> `seaFocusStorage` -> `localStorage`.
- Focus UI -> `App` focus record action -> `seaFocusStorage` -> `localStorage`.
- Stats UI -> task and focus record props -> stats aggregation utilities -> garden chart view model -> rendered chart.

## Requirements

### Focus Reset

- Reset is a secondary action placed above the timer digits inside the timer area.
- Reset must not overlap the timer ring edge or compete visually with the primary play/pause action.

### Journal Modal

- Day modal must appear within the visible phone viewport.
- Modal must not be hidden behind bottom navigation.
- Modal content must be scrollable inside its own container when content is long.

### Plan Date Strip

- First visible render should still align today near the center.
- Opening the plan tab should not visibly animate the date strip into position.
- User-triggered date selection can still smoothly center the selected date.

### Stats Chart

- Replace the primitive donut feel with a polished garden-style chart panel.
- Chart should support both `收获` and `预估` modes with the existing data sources.
- Empty states should remain clear and not show fake data.
- Add tests for chart presentation calculations.

## Acceptance Criteria

- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm run test:ci-config` passes.
- `npx cap sync android` passes.
- Static layout review confirms the journal modal uses body-level portal layering and the focus reset is inside the timer center stack.
