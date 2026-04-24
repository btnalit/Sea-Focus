# App Logo And Code Audit Spec

Date: 2026-04-24

## Goal

Create a Sea Focus app logo that matches the current nature/garden product direction, wire it into app assets, and self-review the project for remaining code defects.

## Scope

- Keep the app frontend-only.
- Keep current Android package and Capacitor configuration.
- Update web favicon/icon assets and Android launcher icon resources.
- Avoid adding runtime dependencies for logo rendering.
- Run automated validation after asset and code changes.

## Logo Direction

- Visual concept: calm garden focus mark using a tomato-like focus seed, leaf, and subtle sea wave.
- Colors: current Sea Focus palette, primarily `#7c8363`, `#c68a73`, `#fdfcf8`, and `#e9e8e0`.
- Must remain readable at small launcher-icon sizes.
- Must avoid text inside the icon.

## Review Scope

- Frontend app flow: `App` state/actions -> pages -> feature utilities -> `seaFocusStorage`.
- Android build flow: Vite build -> Capacitor sync -> Android resources.
- Data logic: task dates, journal entries, focus records, stats aggregation.
- Asset references: favicon, web icons, Android launcher icons.

## Acceptance Criteria

- Web favicon and app icon assets are project-specific.
- Android launcher adaptive icon foreground/background are project-specific.
- Legacy Android launcher PNGs are regenerated for pre-adaptive icon devices.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run test:ci-config` passes.
- `npm run build` passes.
- `npx cap sync android` passes.
- Audit notes document any remaining known risks.
