# Sea Focus

Sea Focus is an Android-targeted tomato planning app built with React, Vite, Tailwind CSS, and Capacitor.

## Local Development

Prerequisites:

- Node.js 22 or newer
- npm

Run the web app locally:

```bash
npm install
npm run dev
```

Validate the project:

```bash
npm run lint
npm run test:unit
npm run build
npm run test:ci-config
```

## Android APK

The Android wrapper is powered by Capacitor. After dependencies are installed, sync web assets into Android with:

```bash
npm run android:sync
```

GitHub Actions builds the release APK on every push, pull request, and manual workflow run. After a workflow finishes, open the run in GitHub Actions and download the `sea-focus-release-apk` artifact.

Release APK builds require a stable keystore stored in GitHub Secrets. The workflow intentionally fails when release signing secrets are missing, because a freshly generated signing key would make Android overlay installs fail on the next APK.
