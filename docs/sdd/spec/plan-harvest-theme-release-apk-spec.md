# Plan Harvest Theme And Release APK Spec

Date: 2026-04-24

## Goal

Clarify the plan page "今日收获" data linkage, add a daily rotating nature-themed visual inside the harvest circle, and change GitHub Actions from debug APK output to release APK output.

## Scope

- Keep the app frontend-only.
- Reuse the same focus statistics logic used by the harvest/stats module.
- Add deterministic daily theme selection without network calls or runtime asset downloads.
- Keep the plan page layout compact on mobile.
- Update Android CI validation to guard release APK workflow semantics.

## Data Contract

- `App` computes `todayPomodoros` with `buildFocusStats(records).todayPomodoros`.
- `StatsPage` computes harvest metrics with the same `buildFocusStats` API.
- The plan page only receives the already-derived count through props and must not duplicate statistics logic.

## Daily Theme Contract

- A pure helper returns a theme item from a local theme list.
- The selected item must be stable for the same local date.
- Adjacent days should rotate to different theme items.
- The UI renders an inline, theme-matched illustration inside the existing harvest circle.

## GitHub Release APK Contract

- The workflow job must be release-oriented rather than debug-oriented.
- The Gradle task must run `assembleRelease`.
- The uploaded artifact must be named for release output.
- The workflow must not upload debug APK paths.
- CI config validation must fail if the workflow regresses to debug APK output.
- If release keystore GitHub Secrets are configured, the workflow should use them; otherwise it may generate a temporary CI signing key so the release build still completes.

## Acceptance Criteria

- Daily theme helper has automated coverage.
- Plan page circle contains a visible dynamic themed illustration.
- The "今日收获" count remains linked to `buildFocusStats`.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run test:ci-config` passes.
- `npm run build` passes.
- `npx cap sync android` passes.
