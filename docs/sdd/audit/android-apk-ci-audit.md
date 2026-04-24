# Android APK CI Audit

Date: 2026-04-24

## Current State

- Local path: `D:\sea-focus`
- Git state: the directory is not currently a Git repository.
- Remote check: `git ls-remote https://github.com/btnalit/Sea-Focus.git` returned no refs, so the GitHub repository appears empty or not synchronized with this local folder.
- App stack: Vite React TypeScript, Tailwind CSS v4, lucide-react, motion, recharts.
- Existing Android stack: none.
- Existing GitHub Actions: none.
- Backend/database: none present.
- Current UI: page components exist for plan, focus timer, calendar view, stats, bottom navigation, and profile placeholder.

## Chain Review

Current frontend chain:

`src/main.tsx` -> `src/App.tsx` -> `src/components/*` -> Vite build -> browser output.

Current local data chain:

`App.tsx` React state -> `localStorage` keys `sea-focus-tasks` and `sea-focus-records` -> task/stat page props.

Planned APK chain:

`src/*` -> `npm run build` -> `dist` -> `npx cap sync android` -> `android` Gradle project -> `assembleRelease` -> release APK artifact.

No backend or database call path exists to review for this change.

## Gaps

- No Android platform directory exists, so GitHub cannot build an APK yet.
- No workflow exists under `.github/workflows`.
- No automated check protects the workflow contract in the re-downloaded source package metadata.
- `package.json` is still named `react-example`.
- README and `.env.example` still reference AI Studio/Gemini, which is not part of the Android tomato planner scope.
- `@google/genai`, `dotenv`, `express`, and `@types/express` are unused for the current frontend-only app.
- The current visual direction is calmer nature/garden, while the reference images are brighter hand-drawn ocean. The app should converge on one style system before deeper UI work.

## Decision

Use Capacitor because the repository is already a web app and Capacitor is designed to wrap existing web apps into Android/iOS native shells. This keeps the current React/Vite stack and avoids rebuilding the app in a separate native framework before the product UI is ready.

## Risks

- Release APK is now the CI target instead of debug APK.
- Release signing supports a configured GitHub secret keystore and falls back to a generated CI signing key when secrets are absent.
- Android background timer accuracy may need native plugins later if the product requires reliable notifications while the app is backgrounded.
- Local machine Java/Android SDK versions can differ from GitHub-hosted runners; CI uses JDK 21 and the `ubuntu-24.04` runner to pin the expected build environment.
- Local verification cannot complete `assembleRelease` on this machine until Android SDK is installed and `ANDROID_HOME` or `ANDROID_SDK_ROOT` is configured.
- Large JavaScript chunk size may grow as UI assets and charts expand; code splitting can be added after the APK pipeline is stable.

## Verification Notes

- `npm run lint` passed on 2026-04-24.
- `npm run build` passed on 2026-04-24 with a non-blocking Vite chunk-size warning for the main JavaScript bundle.
- `npm run test:ci-config` passed on 2026-04-24 with 35 checks.
- `npx cap sync android` passed on 2026-04-24.
- Local `android/gradlew.bat assembleRelease --no-daemon --stacktrace` reaches Android Gradle configuration, but this Windows machine still has no Android SDK path configured. Evidence: `ANDROID_HOME` and `ANDROID_SDK_ROOT` are unset, `sdkmanager` and `adb` are not on PATH, and common local SDK paths do not exist.
- GitHub Actions is configured on `ubuntu-24.04`; the official runner image includes `ANDROID_HOME=/usr/local/lib/android/sdk`, Android SDK platform 36, and build-tools 36.0.0.

## Source References

- Capacitor official docs describe adding Capacitor to an existing web app, adding Android with `npx cap add android`, and syncing built web assets with `npx cap sync`.
- GitHub Actions and official action documentation describe Java setup, Gradle execution, and artifact upload.
- GitHub runner image documentation confirms the selected Ubuntu runner includes Android SDK and JDK 21 tooling.
