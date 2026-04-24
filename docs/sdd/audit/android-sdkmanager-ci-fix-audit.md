# Android Sdkmanager CI Fix Audit

Date: 2026-04-24

## Reported Failure

GitHub Actions failed in the `Ensure Android SDK components` step:

`sdkmanager: command not found`

The shell exited with code 127.

## Root Cause

The workflow called `sdkmanager` directly. GitHub's Ubuntu 24.04 runner image documents Android SDK packages and `ANDROID_HOME=/usr/local/lib/android/sdk`, but the failing run shows `sdkmanager` was not available on PATH.

## Fix

- Resolve `sdkmanager` from `$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager`.
- Fall back to searching `$ANDROID_HOME/cmdline-tools/*/bin/sdkmanager`.
- Print diagnostic paths and exit 127 if it still cannot be found.
- Update `npm run test:ci-config` to require the resolved-sdkmanager workflow pattern.

## Verification

- `npm run test:ci-config` failed before the workflow fix.
- `npm run test:ci-config` passed after the workflow fix with 37 checks.
- `npm run test:unit` passed.
- `npm run lint` passed.
- `npm run build` passed with the existing non-blocking Vite chunk-size warning.
- `npx cap sync android` passed.
