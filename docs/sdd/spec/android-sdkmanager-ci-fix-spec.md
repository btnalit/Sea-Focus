# Android Sdkmanager CI Fix Spec

Date: 2026-04-24

## Goal

Fix the GitHub Actions APK build failure where the workflow calls `sdkmanager` directly and the runner reports `sdkmanager: command not found`.

## Scope

- Keep the existing Capacitor Android build chain.
- Keep the `ubuntu-24.04` runner.
- Resolve `sdkmanager` from `ANDROID_HOME` instead of assuming it is on PATH.
- Keep CI contract validation aligned with the workflow.

## Root Cause

GitHub's Ubuntu 24.04 runner image provides Android SDK packages and sets `ANDROID_HOME`, but the workflow assumed the `sdkmanager` binary was globally available as `sdkmanager`. The failing log shows the binary was not on PATH.

## Acceptance Criteria

- Workflow locates `sdkmanager` from `$ANDROID_HOME/cmdline-tools`.
- `npm run test:ci-config` fails before the workflow fix and passes after it.
- `npm run test:unit`, `npm run lint`, and `npm run build` still pass.
- Change is committed and pushed to `main`.
