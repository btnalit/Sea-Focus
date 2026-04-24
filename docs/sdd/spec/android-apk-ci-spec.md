# Android APK CI Spec

Date: 2026-04-24

## Goal

Sea Focus is a Vite React Android-targeted tomato planning app with a hand-drawn ocean/nature style. The immediate delivery goal is to make the project capable of producing an Android debug APK automatically from GitHub Actions.

## Scope

- Add Capacitor as the native Android container for the existing Vite app.
- Generate and keep the Android Gradle project in the repository.
- Add a GitHub Actions workflow that builds the web app, syncs Capacitor, assembles a debug APK, and uploads the APK as a workflow artifact.
- Add an automated CI configuration check so workflow and Android packaging assumptions are verified in source control.
- Remove AI Studio template leftovers that are unrelated to an offline Android tomato planner.
- Rename package metadata and documentation to Sea Focus.

## Out Of Scope

- Play Store release signing and AAB publishing.
- Native Android feature plugins such as notifications, alarms, or background timers.
- Full tomato timer product implementation.
- Backend or database integration. The current repository has no backend or database layer.
- Visual redesign implementation beyond small project hygiene fixes.

## Architecture

The runtime chain is:

React/Vite/Tailwind app -> static `dist` output -> Capacitor web view -> Android Gradle project -> debug APK.

Current data persistence is local only:

`App.tsx` state -> browser `localStorage` -> page components.

No backend or database path exists in this repository. When product data is added later, frontend calls must go through a unified frontend API layer. If a backend is added later, requests must flow API -> Service -> DAO/DB.

## Contracts

- Capacitor app id: `com.seafocus.app`
- Capacitor web output directory: `dist`
- Android platform directory: `android`
- Debug APK artifact source: `android/app/build/outputs/apk/debug/*.apk`
- GitHub artifact name: `sea-focus-debug-apk`
- npm package name: `sea-focus`

## CI Requirements

The workflow must:

- Run on `push`, `pull_request`, and manual `workflow_dispatch`.
- Use the `ubuntu-24.04` GitHub-hosted runner.
- Install Node dependencies with `npm ci`.
- Run `npm run lint`.
- Run the automated CI config check.
- Build the Vite app with `npm run build`.
- Sync Android assets with `npx cap sync android`.
- Set up JDK 21 for the Android Gradle build.
- Ensure Android SDK platform 36 and build-tools 36.0.0 are available.
- Build with the Android Gradle wrapper: `./gradlew assembleDebug`.
- Upload the generated APK as an artifact.

## Test Mapping

- `npm run test:ci-config` validates Capacitor config, Android platform presence, and the GitHub Actions workflow contract.
- `npm run lint` validates TypeScript/React lint rules.
- `npm run build` validates TypeScript compilation and Vite production output.
- Android Gradle `assembleDebug` validates native APK generation.
- TypeScript checks remain the frontend quality gate through `npm run lint`.

## Acceptance Criteria

- Running `npm run test:ci-config` succeeds after implementation.
- Running `npm run lint` succeeds.
- Running `npm run build` succeeds.
- Running `npx cap sync android` succeeds.
- Running Android Gradle `assembleDebug` succeeds or reports only a local environment blocker that is documented in the audit.
- GitHub Actions will publish a debug APK artifact after the files are pushed to GitHub.
- README explains local web development and GitHub APK artifact download.
- `.env.example` no longer asks for unused Gemini credentials.
