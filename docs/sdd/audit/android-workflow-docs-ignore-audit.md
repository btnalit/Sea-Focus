# Android Workflow Docs Ignore Audit

Date: 2026-04-24

## Planned Review

- Workflow trigger chain: GitHub push/pull request event -> path filters -> Android APK job.
- CI contract chain: `npm run test:ci-config` -> workflow YAML parse -> docs ignore assertions.
- Governance check: scan for global process guard scripts before final verification.

## Findings

- Before this change, `push` and `pull_request` had no path filters, so every commit to `main`, including documentation-only SDD status commits, triggered the Android APK workflow.
- The Android APK workflow now ignores `docs/**` for both `push` and `pull_request`.
- GitHub Actions `paths-ignore` skips a workflow only when all changed files match the ignored patterns, so mixed docs + source commits still trigger APK builds.
- `workflow_dispatch` remains available for manual APK builds.
- `scripts/validate-android-ci.mjs` now enforces both docs ignore rules as part of the CI contract.
- No global Python process runner scripts were found in the repository.

## Verification

- `npm run test:ci-config`: passed, 45 Android CI checks.
- `npm run lint`: passed.
- `npm run test:unit`: passed, 43/43 tests.
- `npm run build`: passed.
- `git diff --check`: passed.
