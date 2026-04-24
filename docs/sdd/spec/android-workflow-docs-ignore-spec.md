# Android Workflow Docs Ignore Spec

Date: 2026-04-24

## Goal

Prevent documentation-only changes from triggering the Android APK workflow while preserving APK builds for source, Android, dependency, and workflow changes.

## Scope

- Update `.github/workflows/android-apk.yml`.
- Update `scripts/validate-android-ci.mjs` so the CI contract enforces this trigger rule.
- Do not change APK build steps, signing, artifact upload, or release/debug behavior.

## Trigger Rules

- `push` must ignore documentation-only changes under `docs/**`.
- `pull_request` must ignore documentation-only changes under `docs/**`.
- `workflow_dispatch` must remain available for manual builds.
- Mixed commits that include both docs and non-doc files should still trigger the APK workflow.

## Acceptance Criteria

- Android APK workflow includes `paths-ignore: ['docs/**']` for `push`.
- Android APK workflow includes `paths-ignore: ['docs/**']` for `pull_request`.
- CI validation fails if either docs ignore rule is removed.
- `npm run test:ci-config` passes.
- Governance/build guard commands are run when available.
