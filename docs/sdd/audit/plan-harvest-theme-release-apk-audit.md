# Plan Harvest Theme And Release APK Audit

Date: 2026-04-24

## Planned Review

- Data chain: `FocusPage` completion -> `App.records` -> `buildFocusStats` -> `PlanPage.todayPomodoros` and `StatsPage` harvest metrics.
- UI chain: `PlanPage` header harvest circle -> daily theme helper -> inline illustration.
- CI chain: `.github/workflows/android-apk.yml` -> `scripts/validate-android-ci.mjs` -> Android Gradle release APK output.

## Findings

- `今日收获` is already linked to the harvest/stats module logic. `App` derives `todayPomodoros` through `buildFocusStats(records).todayPomodoros`, and `StatsPage` uses the same `buildFocusStats(records)` API for harvest metrics.
- `PlanPage` does not duplicate focus-stat calculation; it receives `todayPomodoros` as a prop and renders it in the header.
- The previous harvest circle only rendered a blank muted fill. Added a deterministic daily theme helper and an inline nature-themed illustration so the circle rotates by local date.
- GitHub Actions was still a debug APK pipeline. Switched the job, Gradle task, artifact name, and artifact path to release APK output.
- Release signing now supports real GitHub Secrets when configured and falls back to a generated CI key so the release workflow remains runnable without committing private keys.

## Verification

- `npm run test:unit`: passed, 19/19 tests.
- `npm run lint`: passed.
- `npm run test:ci-config`: passed, 43 Android CI checks.
- `npm run build`: passed.
- `npx cap sync android`: passed.
- Android resource XML parse scan: passed, no invalid XML files.
- Debug APK residue scan for workflow/docs: passed, no stale debug output contract outside negative guard checks.
- `git diff --check`: passed.
- Local Android Gradle `assembleRelease` was not run because this Windows checkout still has no local Android SDK configuration; GitHub Actions is the release APK build gate.
