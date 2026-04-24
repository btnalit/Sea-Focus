# Android Sdkmanager CI Fix Taskboard

Date: 2026-04-24

## Tasks

- [x] Capture reported GitHub Actions failure.
- [x] Identify root cause across workflow -> runner environment -> Android SDK path.
- [x] Update CI contract validation to reject bare `sdkmanager`.
- [x] Confirm validation fails on the current workflow.
- [x] Update workflow to resolve `sdkmanager` from `ANDROID_HOME`.
- [x] Run local validation, tests, lint, and build.
- [ ] Commit and push the fix.
